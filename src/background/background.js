import { STORAGE_KEYS, DEFAULT_ALLOWLIST_NAME } from '../shared/constants.js';
import { AllowlistRepository } from '../utils/allowlist-repository.js';
import { InputClassifier, isUrlAllowed, getRegistrableDomainFromHost } from '../utils/classifier.js';
import { Analytics } from '../utils/analytics.js';

const repo = new AllowlistRepository();
const classifier = new InputClassifier();
const analytics = new Analytics();

// ── Blocking detection ───────────────────────────────────────────────────────
// We use webNavigation to intercept navigations and redirect to our blocked page.
// This gives a beautiful UX (quotes, stats, breathing exercise) instead of
// Chrome's ugly ERR_BLOCKED_BY_CLIENT page.

function setupBlocking() {
	// Track allowed site visits (time spent on allowed sites)
	let visitTimers = new Map();  // tabId -> { hostname, startTime }

	chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
		if (details.frameId !== 0) return;
		const url = details.url;
		if (!url.startsWith('http://') && !url.startsWith('https://')) return;

		// Don't intercept our own pages
		if (url.includes(chrome.runtime.id)) return;

		// ── Control URL handler (scriptable from bash via simple navigation) ──
		// Navigate to https://allowlist.ctrl/<command> to control the extension.
		// The extension intercepts before DNS resolution and processes the command.
		// Commands: toggle, enable, disable, set_list/<name>, add_site
		if (url.startsWith('https://allowlist.ctrl/')) {
			const path = url.replace('https://allowlist.ctrl/', '').split('?')[0].split('/');
			const cmd = path[0];
			const val = decodeURIComponent(path.slice(1).join('/') || '');

			try {
				if (cmd === 'toggle') {
					const s = await repo.getState();
					await repo.setEnabled(!s.enabled);
				} else if (cmd === 'enable') {
					await repo.setEnabled(true);
				} else if (cmd === 'disable') {
					await repo.setEnabled(false);
				} else if (cmd === 'set_list' && val) {
					await repo.setCurrent(val);
				}
			} catch (e) {
				// Command failed silently
			}

			// Redirect away immediately
			if (details.tabId && details.tabId > 0) {
				chrome.tabs.update(details.tabId, { url: 'about:blank' }).catch(() => {});
			}
			return;
		}

		try {
			const state = await repo.getState();
			if (!state.enabled) return;

			const entries = state.allowlists[state.current] || [];
			if (isUrlAllowed(url, entries)) return;

			const hostname = new URL(url).hostname;
			await analytics.trackBlockedSite(hostname);

			const blockedUrl = chrome.runtime.getURL(
				`src/blocked/blocked.html?site=${encodeURIComponent(hostname)}&r=${Date.now()}`
			);

			if (details.tabId && details.tabId > 0) {
				await chrome.tabs.update(details.tabId, { url: blockedUrl });
			}
		} catch (e) {
			// Silently continue — don't break navigation on error
		}
	}, { urls: ['<all_urls>'] });

	// Track navigation completion for allowed sites (analytics)
	chrome.webNavigation.onCompleted.addListener(async (details) => {
		if (details.frameId !== 0) return;
		const url = details.url;
		if (!url.startsWith('http://') && !url.startsWith('https://')) return;

		try {
			const state = await repo.getState();
			if (!state.enabled) return;

			const entries = state.allowlists[state.current] || [];
			if (isUrlAllowed(url, entries)) {
				const hostname = new URL(url).hostname;
				// Start a timer for this tab
				if (details.tabId && details.tabId > 0) {
					visitTimers.set(details.tabId, { hostname, startTime: Date.now() });
				}
			}
		} catch (e) {
			// Silently continue
		}
	}, { urls: ['<all_urls>'] });

	// Track tab removal to record visit duration
	chrome.tabs.onRemoved.addListener(async (tabId) => {
		const visit = visitTimers.get(tabId);
		if (visit) {
			const duration = Date.now() - visit.startTime;
			await analytics.trackAllowedSiteVisit(visit.hostname, duration);
			visitTimers.delete(tabId);
		}
	});
}

// ── Badge update ─────────────────────────────────────────────────────────────

async function rebuildFromCurrent() {
	const state = await repo.getState();
	const entries = state.allowlists[state.current] || [];

	if (state.enabled) {
		await chrome.action.setBadgeText({ text: entries.length > 0 ? String(entries.length) : '' });
		await chrome.action.setBadgeBackgroundColor({ color: '#3b82f6' });
	} else {
		await chrome.action.setBadgeText({ text: 'OFF' });
		await chrome.action.setBadgeBackgroundColor({ color: '#6b7280' });
	}
}

// ── Initialization ───────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async () => {
	try {
		await repo.init();
		await rebuildFromCurrent();
		setupBlocking();

		// IPC is URL-based — processed when popup.html is opened with ?cmd= parameter.
		// No background watcher needed.
	} catch (e) {
		console.error('AllowList init error:', e);
	}
});

// Also try to start on extension load (service worker may be woken after idle)
(async () => {
	try {
		await repo.getState();
		setupBlocking();
		// IPC is URL-based (popup.html?cmd=...)
		// No background watcher needed.
	} catch (e) {
		// Continue gracefully
	}
})();

// ── Storage changes ──────────────────────────────────────────────────────────

chrome.storage.onChanged.addListener(async (changes, area) => {
	try {
		if (area === 'sync') {
			if (changes[STORAGE_KEYS.ALLOWLISTS] || changes[STORAGE_KEYS.CURRENT] || changes[STORAGE_KEYS.ENABLED]) {
				await rebuildFromCurrent();
			}
		}
	} catch (e) {
		// Continue gracefully
	}
});

// ── Keyboard shortcuts ───────────────────────────────────────────────────────

chrome.commands.onCommand.addListener(async (command) => {
	try {
		if (command === 'add-current-site') {
			const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
			if (!tab || !tab.url) return;
			const entry = inferEntryFromUrl(tab.url);
			if (!entry) return;
			await repo.addEntryToCurrent(entry);
			await rebuildFromCurrent();
			if (tab.id != null) {
				// Flash badge to confirm
				await chrome.action.setBadgeText({ text: '+', tabId: tab.id });
				await chrome.action.setBadgeBackgroundColor({ color: '#10b981', tabId: tab.id });
				setTimeout(() => {
					rebuildFromCurrent().catch(() => {});
				}, 1200);
			}
		}

		if (command === 'cycle-allowlist') {
			const state = await repo.getState();
			const names = Object.keys(state.allowlists);
			if (names.length === 0) return;
			const idx = names.indexOf(state.current);
			const next = names[(idx + 1) % names.length];
			await repo.setCurrent(next);
			await rebuildFromCurrent();
		}

		if (command === 'toggle-allowlist') {
			const state = await repo.getState();
			await repo.setEnabled(!state.enabled);
			await rebuildFromCurrent();
		}
	} catch (e) {
		// Command handler error — continue
	}
});

// ── Message handling (popup ↔ background & external scripts) ─────────────────

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
				case 'toggle': {
					const state = await repo.getState();
					await repo.setEnabled(!state.enabled);
					sendResponse({ ok: true, enabled: !state.enabled });
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
					const stats = { total: list.length, byType: { domain: 0, subdomain: 0, url: 0, tld: 0, origin: 0, host: 0 } };
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
				case 'get_block_page_settings': {
					const state = await repo.getState();
					const blockedPageState = { enabled: state.enabled, currentList: state.current };
					sendResponse(blockedPageState);
					break;
				}
				case 'get_active_session': {
					// Sessions removed in v2 — return null
					sendResponse(null);
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

// ── Helpers ──────────────────────────────────────────────────────────────────

function inferEntryFromUrl(urlString) {
	try {
		const u = new URL(urlString);
		return { type: 'domain', value: getRegistrableDomainFromHost(u.hostname) };
	} catch {
		return null;
	}
}
