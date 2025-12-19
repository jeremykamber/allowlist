import { STORAGE_KEYS, DEFAULT_ALLOWLIST_NAME, BLOCKING_STRATEGY } from '../shared/constants.js';
import { AllowlistRepository } from '../utils/allowlist-repository.js';
import { RulesEngine } from '../utils/rules-engine.js';
import { InputClassifier, isUrlAllowed, getRegistrableDomainFromHost } from '../utils/classifier.js';
import { Analytics } from '../utils/analytics.js';

const repo = new AllowlistRepository();
const rules = new RulesEngine();
const classifier = new InputClassifier();
const analytics = new Analytics();

class SessionScheduler {
	async init() {
		// No-op: sessions removed
	}
}

const scheduler = new SessionScheduler();

function setupChromeBlockingDetection() {
	chrome.webNavigation.onErrorOccurred.addListener(async (details) => {
		if (details.frameId !== 0) return;
		if (details.error === 'net::ERR_BLOCKED_BY_CLIENT') {
			try {
				const url = new URL(details.url);
				const hostname = url.hostname;
				const state = await repo.getState();
				if (state.enabled) {
					await analytics.trackBlockedSite(hostname);
				}
			} catch (e) {
				// Silently fail
			}
		}
	}, { urls: ['<all_urls>'] });
}

function setupBrowserAgnosticBlockingDetection() {
	chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
		if (details.frameId !== 0) return;
		const url = details.url;
		if (!url.startsWith('http://') && !url.startsWith('https://')) return;
		if (url.includes(chrome.runtime.id) || url.includes('blocked.html')) return;

		try {
			const state = await repo.getState();
			if (!state.enabled) return;

			const entries = state.allowlists[state.current] || [];
			if (isUrlAllowed(url, entries)) return;

			const hostname = new URL(url).hostname;
			await analytics.trackBlockedSite(hostname);

			const blockedPageUrl = chrome.runtime.getURL(`src/blocked/blocked.html?site=${encodeURIComponent(hostname)}`);

			if (details.tabId && details.tabId > 0) {
				await chrome.tabs.update(details.tabId, { url: blockedPageUrl });
			}
		} catch (e) {
			// Continue gracefully on error
		}
	}, { urls: ['<all_urls>'] });
}

let blockingDetectionInitialized = false;

function initBlockingDetection() {
	if (blockingDetectionInitialized) return;
	blockingDetectionInitialized = true;

	if (BLOCKING_STRATEGY === 'chrome') {
		setupChromeBlockingDetection();
	} else {
		setupBrowserAgnosticBlockingDetection();
	}
}

async function rebuildFromCurrent() {
	const state = await repo.getState();
	const entries = state.allowlists[state.current] || [];
	if (state.enabled) {
		await rules.rebuildFor(entries);
		const count = entries.length;
		await chrome.action.setBadgeText({ text: count > 0 ? String(count) : '' });
		await chrome.action.setBadgeBackgroundColor({ color: '#4f8cff' });
	} else {
		const disabledMarker = Object.assign([], { __disabled__: true });
		await rules.rebuildFor(disabledMarker);
		await chrome.action.setBadgeText({ text: 'OFF' });
		await chrome.action.setBadgeBackgroundColor({ color: '#6b7280' });
	}
}

chrome.runtime.onInstalled.addListener(async () => {
	try {
		await repo.init();
		await scheduler.init();
		await rebuildFromCurrent();
		initBlockingDetection();
	} catch (e) {
		// Extension initialization completed with best effort
	}
});

(async () => {
	try {
		await repo.getState();
		initBlockingDetection();
	} catch (e) {
		// Continue gracefully
	}
})();

chrome.storage.onChanged.addListener(async (changes, area) => {
	try {
		if (area === 'sync' && (changes[STORAGE_KEYS.ALLOWLISTS] || changes[STORAGE_KEYS.CURRENT] || changes[STORAGE_KEYS.ENABLED])) {
			await rebuildFromCurrent();
		}
	} catch (e) {
		// Continue gracefully on storage change error
	}
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
	(async () => {
		try {
			switch (msg.type) {
				case 'get_state': {
					const state = await repo.getState();
					sendResponse(state);
					break;
				}
				case 'classify_input': {
					const entry = classifier.classify(msg.payload || '');
					sendResponse({ entry });
					break;
				}
				case 'set_current': {
					await repo.setCurrent(msg.payload);
					sendResponse({ ok: true });
					break;
				}
				case 'set_enabled': {
					await repo.setEnabled(!!msg.payload);
					sendResponse({ ok: true });
					break;
				}
				case 'save_allowlist': {
					const { name, entries } = msg.payload;
					await repo.saveAllowlist(name, entries);
					sendResponse({ ok: true });
					break;
				}
				case 'delete_allowlist': {
					await repo.deleteAllowlist(msg.payload);
					sendResponse({ ok: true });
					break;
				}
				case 'rename_allowlist': {
					const { from, to } = msg.payload;
					await repo.renameAllowlist(from, to);
					sendResponse({ ok: true });
					break;
				}
				case 'add_entry_current': {
					const result = await repo.addEntryToCurrent(msg.payload);
					sendResponse({ ok: true, isDuplicate: result.isDuplicate });
					break;
				}
				case 'remove_entry_current': {
					await repo.removeEntryFromCurrent(msg.payload);
					sendResponse({ ok: true });
					break;
				}
				case 'update_entry_current': {
					const { from, to } = msg.payload || {};
					if (!from || !to) throw new Error('Missing from/to');
					await repo.updateEntryInCurrent(from, to);
					sendResponse({ ok: true });
					break;
				}
				case 'export_allowlist': {
					const state = await repo.getState();
					const name = msg.payload || state.current;
					const entries = state.allowlists[name] || [];
					const data = { name, entries, exportDate: new Date().toISOString() };
					sendResponse({ ok: true, data });
					break;
				}
				case 'import_allowlist': {
					const { name, entries } = msg.payload;
					if (!Array.isArray(entries)) throw new Error('Invalid entries format');
					await repo.saveAllowlist(name, entries);
					sendResponse({ ok: true });
					break;
				}
				case 'get_stats': {
					const state = await repo.getState();
					const list = state.allowlists[state.current] || [];
					const stats = {
						total: list.length,
						byType: { domain: 0, subdomain: 0, url: 0, tld: 0, origin: 0, host: 0 }
					};
					list.forEach(e => { if (stats.byType.hasOwnProperty(e.type)) stats.byType[e.type]++; });
					sendResponse(stats);
					break;
				}
				case 'get_analytics': {
					const days = msg.payload || 7;
					const summary = await analytics.getAnalyticsSummary(days);
					sendResponse(summary);
					break;
				}
				case 'track_blocked_site': {
					await analytics.trackBlockedSite(msg.payload);
					sendResponse({ ok: true });
					break;
				}
				case 'get_trends': {
					const trends = await analytics.getTrends();
					sendResponse(trends);
					break;
				}
				case 'is_url_allowed': {
					const state = await repo.getState();
					const entries = state.allowlists[state.current] || [];
					const allowed = isUrlAllowed(msg.payload, entries);
					sendResponse({ allowed, enabled: state.enabled });
					break;
				}
				default:
					sendResponse({ ok: false, error: 'unknown message' });
			}
		} catch (e) {
			const message = e && typeof e === 'object' && 'message' in e ? e.message : String(e);
			sendResponse({ ok: false, error: message });
		}
	})();
	return true;
});
