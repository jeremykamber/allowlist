// background.js (MV3 service worker, module)

const STORAGE_KEYS = {
	ALLOWLISTS: 'allowlists',
	CURRENT: 'currentAllowlist',
	ENABLED: 'enabled',
	ANALYTICS: 'analytics',
	PRESETS_IMPORTED: 'presetsImported',
};

const DEFAULT_ALLOWLIST_NAME = 'Scratchpad';

const PRESET_ALLOWLISTS = {
	'🎓 Learning': {
		entries: [
			{ type: 'domain', value: 'github.com' },
			{ type: 'domain', value: 'stackoverflow.com' },
			{ type: 'domain', value: 'mdn.mozilla.org' },
			{ type: 'domain', value: 'wikipedia.org' },
			{ type: 'domain', value: 'coursera.org' },
			{ type: 'domain', value: 'udemy.com' },
			{ type: 'domain', value: 'khanacademy.org' },
			{ type: 'domain', value: 'google.com' },
			{ type: 'domain', value: 'docs.google.com' },
		],
		description: 'Educational and reference resources'
	},
	'💼 Work': {
		entries: [
			{ type: 'domain', value: 'gmail.com' },
			{ type: 'domain', value: 'google.com' },
			{ type: 'domain', value: 'docs.google.com' },
			{ type: 'domain', value: 'sheets.google.com' },
			{ type: 'domain', value: 'notion.so' },
			{ type: 'domain', value: 'slack.com' },
			{ type: 'domain', value: 'teams.microsoft.com' },
			{ type: 'domain', value: 'zoom.us' },
			{ type: 'domain', value: 'github.com' },
			{ type: 'domain', value: 'gitlab.com' },
		],
		description: 'Work and collaboration tools'
	},
	'🔬 Deep Work': {
		entries: [
			{ type: 'domain', value: 'github.com' },
			{ type: 'domain', value: 'gitlab.com' },
			{ type: 'domain', value: 'stackoverflow.com' },
			{ type: 'domain', value: 'mdn.mozilla.org' },
			{ type: 'domain', value: 'docs.google.com' },
		],
		description: 'Focused coding and development'
	},
	'🎨 Creative': {
		entries: [
			{ type: 'domain', value: 'figma.com' },
			{ type: 'domain', value: 'dribbble.com' },
			{ type: 'domain', value: 'behance.net' },
			{ type: 'domain', value: 'adobe.com' },
			{ type: 'domain', value: 'github.com' },
			{ type: 'domain', value: 'fonts.google.com' },
		],
		description: 'Design and creative tools'
	},
	'📚 Research': {
		entries: [
			{ type: 'domain', value: 'scholar.google.com' },
			{ type: 'domain', value: 'researchgate.net' },
			{ type: 'domain', value: 'arxiv.org' },
			{ type: 'domain', value: 'jstor.org' },
			{ type: 'domain', value: 'pubmed.ncbi.nlm.nih.gov' },
			{ type: 'domain', value: 'wikipedia.org' },
		],
		description: 'Academic and research resources'
	},
};

/**
 * @typedef {Object} AllowEntry
 * @property {'tld'|'domain'|'subdomain'|'origin'|'url'|'host'} type // 'host' supported for backwards compatibility
 * @property {string} value
 */

class AllowlistRepository {
	constructor() {
		this._cache = null;
		this._cacheTime = 0;
		this._CACHE_TTL = 500; // 500ms cache to avoid rapid re-reads
		this._pendingWrite = null; // Debounce rapid writes
	}

	async init() {
		const data = await chrome.storage.sync.get([STORAGE_KEYS.ALLOWLISTS, STORAGE_KEYS.CURRENT, STORAGE_KEYS.ENABLED, STORAGE_KEYS.PRESETS_IMPORTED]);
		let allowlists = data[STORAGE_KEYS.ALLOWLISTS];
		let current = data[STORAGE_KEYS.CURRENT] || DEFAULT_ALLOWLIST_NAME;
		let enabled = typeof data[STORAGE_KEYS.ENABLED] === 'boolean' ? data[STORAGE_KEYS.ENABLED] : true;
		let presetsImported = !!data[STORAGE_KEYS.PRESETS_IMPORTED];

		if (!allowlists) {
			allowlists = { [DEFAULT_ALLOWLIST_NAME]: [] };
			current = DEFAULT_ALLOWLIST_NAME;
		} else if (!allowlists[DEFAULT_ALLOWLIST_NAME]) {
			// Ensure the non-renamable default always exists.
			allowlists[DEFAULT_ALLOWLIST_NAME] = [];
		}

		// Import presets on first run
		if (!presetsImported) {
			Object.entries(PRESET_ALLOWLISTS).forEach(([name, preset]) => {
				if (!allowlists[name]) {
					allowlists[name] = preset.entries;
				}
			});
			presetsImported = true;
		}

		await chrome.storage.sync.set({
			[STORAGE_KEYS.ALLOWLISTS]: allowlists,
			[STORAGE_KEYS.CURRENT]: current,
			[STORAGE_KEYS.ENABLED]: enabled,
			[STORAGE_KEYS.PRESETS_IMPORTED]: presetsImported,
		});
		this._cache = { allowlists, current, enabled };
		this._cacheTime = Date.now();
		return this._cache;
	}

	async getState() {
		// Use cache if fresh
		if (this._cache && (Date.now() - this._cacheTime) < this._CACHE_TTL) {
			return this._cache;
		}
		const data = await chrome.storage.sync.get([STORAGE_KEYS.ALLOWLISTS, STORAGE_KEYS.CURRENT, STORAGE_KEYS.ENABLED]);
		const allowlists = data[STORAGE_KEYS.ALLOWLISTS] || { [DEFAULT_ALLOWLIST_NAME]: [] };
		if (!allowlists[DEFAULT_ALLOWLIST_NAME]) allowlists[DEFAULT_ALLOWLIST_NAME] = [];
		const current = data[STORAGE_KEYS.CURRENT] || DEFAULT_ALLOWLIST_NAME;
		const enabled = typeof data[STORAGE_KEYS.ENABLED] === 'boolean' ? data[STORAGE_KEYS.ENABLED] : true;
		// Persist any fix-ups (e.g., missing Scratchpad)
		await chrome.storage.sync.set({
			[STORAGE_KEYS.ALLOWLISTS]: allowlists,
			[STORAGE_KEYS.CURRENT]: current,
			[STORAGE_KEYS.ENABLED]: enabled,
		});
		this._cache = { allowlists, current, enabled };
		this._cacheTime = Date.now();
		return this._cache;
	}

	async setState(state) {
		this._cache = state;
		this._cacheTime = Date.now();

		// Debounce writes to avoid quota errors on rapid changes
		if (this._pendingWrite) clearTimeout(this._pendingWrite);

		this._pendingWrite = setTimeout(async () => {
			try {
				await chrome.storage.sync.set({
					[STORAGE_KEYS.ALLOWLISTS]: state.allowlists,
					[STORAGE_KEYS.CURRENT]: state.current,
					[STORAGE_KEYS.ENABLED]: typeof state.enabled === 'boolean' ? state.enabled : true,
				});
			} catch (e) {
				// Quota error - log but don't crash
				console.error('Storage write failed:', e.message);
			}
			this._pendingWrite = null;
		}, 100);
	}

	async setCurrent(name) {
		const state = await this.getState();
		if (!state.allowlists[name]) {
			throw new Error(`Allowlist "${name}" does not exist`);
		}
		state.current = name;
		await this.setState(state);
	}

	async saveAllowlist(name, entries) {
		const state = await this.getState();
		state.allowlists[name] = entries;
		await this.setState(state);
	}

	async deleteAllowlist(name) {
		const state = await this.getState();
		if (name === DEFAULT_ALLOWLIST_NAME) throw new Error('Cannot delete the Scratchpad allowlist');
		if (name === state.current) throw new Error('Cannot delete active allowlist');
		delete state.allowlists[name];
		await this.setState(state);
	}

	async renameAllowlist(oldName, newName) {
		const state = await this.getState();
		if (!state.allowlists[oldName]) throw new Error('Old name missing');
		if (oldName === DEFAULT_ALLOWLIST_NAME) throw new Error('Cannot rename the Scratchpad allowlist');
		if (state.allowlists[newName]) throw new Error('New name already exists');
		state.allowlists[newName] = state.allowlists[oldName];
		delete state.allowlists[oldName];
		if (state.current === oldName) state.current = newName;
		await this.setState(state);
	}

	async setEnabled(flag) {
		const state = await this.getState();
		state.enabled = !!flag;
		await this.setState(state);
		return state.enabled;
	}

	async addEntryToCurrent(entry) {
		const state = await this.getState();
		const list = state.allowlists[state.current] || [];
		const isDuplicate = list.some(e => e.type === entry.type && e.value === entry.value);
		if (!isDuplicate) {
			list.push(entry);
			state.allowlists[state.current] = list;
			await this.setState(state);
		}
		return { state, isDuplicate };
	}

	async removeEntryFromCurrent(entry) {
		const state = await this.getState();
		const list = state.allowlists[state.current] || [];
		state.allowlists[state.current] = list.filter(e => !(e.type === entry.type && e.value === entry.value));
		await this.setState(state);
		return state;
	}

	async updateEntryInCurrent(oldEntry, newEntry) {
		const state = await this.getState();
		const list = state.allowlists[state.current] || [];
		const withoutOld = list.filter(e => !(e.type === oldEntry.type && e.value === oldEntry.value));
		if (!withoutOld.some(e => e.type === newEntry.type && e.value === newEntry.value)) {
			withoutOld.push(newEntry);
		}
		state.allowlists[state.current] = withoutOld;
		await this.setState(state);
		return state;
	}
}

class RulesEngine {
	constructor() {
		this.BLOCK_ALL_RULE_ID = 1;      // Reserved global block rule ID.
		this.ALLOW_BASE_ID = 1000;       // Allow rules start here.
		this._queue = Promise.resolve(); // Serialize updates to avoid races.
	}

	// Public entry that serializes rebuilds to ensure unique IDs and no overlap.
	rebuildFor(entries) {
		this._queue = this._queue.then(() => this._rebuildInternal(entries)).catch(() => { });
		return this._queue;
	}

	async _rebuildInternal(entries) {
		// Phase 1: remove all existing dynamic rules (defensive against stale IDs).
		const existing = await chrome.declarativeNetRequest.getDynamicRules();
		const toRemove = existing.map(r => r.id);
		if (toRemove.length) {
			await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: toRemove });
		}

		// If disabled, leave no rules installed (no blocking)
		if (!Array.isArray(entries) || entries.__disabled__ === true) {
			return; // all rules removed above
		}

		// Build fresh rules.
		const rules = [];

		// Global block: block all http/https main-frame navigations by default.
		// Use regexFilter to match both http and https explicitly.
		rules.push({
			id: this.BLOCK_ALL_RULE_ID,
			priority: 1,
			action: { type: 'block' },
			condition: {
				regexFilter: '^https?://',
				resourceTypes: ['main_frame'],
			},
		});

		// High-priority allowAllRequests per allowlist entry so allowed pages work.
		let nextId = this.ALLOW_BASE_ID;
		for (const entry of entries) {
			const allowRule = this.buildAllowRule(nextId, entry);
			if (allowRule) {
				rules.push(allowRule);
				nextId += 1;
			}
		}

		// Phase 2: add rules (separate call avoids duplicate-ID errors and races).
		await chrome.declarativeNetRequest.updateDynamicRules({ addRules: rules });
	}

	buildAllowRule(id, entry) {
		const base = {
			id,
			priority: 1000,
			action: { type: 'allowAllRequests' },
			condition: { resourceTypes: ['main_frame'] },
		};

		switch (entry.type) {
			case 'tld': {
				const tld = entry.value.replace(/^\./, '').toLowerCase().replace(/[^\w.-]/g, '');
				const re = `^https?:\\/\\/([^.\\/:]+\\.)+${this.escapeRe(tld)}([:/]|$)`;
				return { ...base, condition: { ...base.condition, regexFilter: re } };
			}
			case 'domain': {
				const dom = entry.value.toLowerCase();
				const re = `^https?:\\/\\/([^.\\/:]+\\.)*${this.escapeRe(dom)}([:/]|$)`;
				return { ...base, condition: { ...base.condition, regexFilter: re } };
			}
			case 'subdomain':
			case 'host': {
				const host = entry.value.toLowerCase();
				const re = `^https?:\\/\\/${this.escapeRe(host)}([:/]|$)`;
				return { ...base, condition: { ...base.condition, regexFilter: re } };
			}
			case 'origin': {
				const origin = entry.value.replace(/\/+$/, '');
				const re = `^${this.escapeRe(origin)}([:/]|$)`;
				return { ...base, condition: { ...base.condition, regexFilter: re } };
			}
			case 'url': {
				const u = entry.value;
				const re = `^${this.escapeRe(u)}$`;
				return { ...base, condition: { ...base.condition, regexFilter: re } };
			}
			default:
				return null;
		}
	}

	escapeRe(s) {
		return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}
}

class InputClassifier {
	classify(raw) {
		const s = raw.trim();
		if (!s) return null;

		if (s.startsWith('.')) {
			const tld = s.replace(/^\.+/, '');
			if (!tld) return null;
			return { type: 'tld', value: `.${tld}` };
		}

		if (s.includes('://')) {
			try {
				const u = new URL(s);
				if (!u.hostname) return null;
				if ((u.pathname && u.pathname !== '/') || u.search || u.hash) {
					// Full path/query/hash given -> specific URL (Website)
					u.hash = '';
					return { type: 'url', value: `${u.protocol}//${u.host}${u.pathname}${u.search}` };
				}
				// Bare origin -> classify as domain or subdomain based on registrable domain
				const reg = getRegistrableDomainFromHost(u.hostname);
				if (u.hostname.toLowerCase() === reg) return { type: 'domain', value: reg };
				return { type: 'subdomain', value: u.hostname.toLowerCase() };
			} catch {
				return null;
			}
		}

		if (s.includes('/')) {
			// Try to interpret as hostname + path without scheme
			try {
				const u = new URL(`https://${s}`);
				if (!u.hostname) return null;
				u.hash = '';
				return { type: 'url', value: `${u.protocol}//${u.host}${u.pathname}${u.search}` };
			} catch {
				return null;
			}
		}
		const labels = s.split('.').filter(Boolean);
		if (labels.length < 2) return null;
		if (labels.length === 2) return { type: 'domain', value: s.toLowerCase() };
		return { type: 'subdomain', value: s.toLowerCase() };
	}
}

const repo = new AllowlistRepository();
const rules = new RulesEngine();
const classifier = new InputClassifier();

class Analytics {
	constructor() {
		this._cache = null;
	}

	async getAnalytics() {
		if (this._cache) return this._cache;
		const data = await chrome.storage.local.get(STORAGE_KEYS.ANALYTICS);
		const analytics = data[STORAGE_KEYS.ANALYTICS] || {
			blockedAttempts: [],
			visitedAllowedSites: [],
		};
		this._cache = analytics;
		return analytics;
	}

	async trackBlockedSite(hostname) {
		const analytics = await this.getAnalytics();
		const now = Date.now();
		const today = new Date(now).toDateString();

		if (!analytics.blockedAttempts) analytics.blockedAttempts = [];
		const existing = analytics.blockedAttempts.find(a => a.hostname === hostname && a.date === today);
		if (existing) {
			existing.count++;
			existing.lastAttempt = now;
		} else {
			analytics.blockedAttempts.push({ hostname, date: today, count: 1, lastAttempt: now });
		}

		// Keep only 90 days of data
		const cutoff = new Date(now - 90 * 24 * 60 * 60 * 1000).toDateString();
		analytics.blockedAttempts = analytics.blockedAttempts.filter(a => a.date >= cutoff);

		await chrome.storage.local.set({ [STORAGE_KEYS.ANALYTICS]: analytics });
		this._cache = analytics;
	}

	async trackAllowedSiteVisit(hostname, duration = 0) {
		const analytics = await this.getAnalytics();
		const now = Date.now();
		const today = new Date(now).toDateString();

		if (!analytics.visitedAllowedSites) analytics.visitedAllowedSites = [];
		const existing = analytics.visitedAllowedSites.find(a => a.hostname === hostname && a.date === today);
		if (existing) {
			existing.visits++;
			existing.totalTime += duration;
			existing.lastVisit = now;
		} else {
			analytics.visitedAllowedSites.push({
				hostname,
				date: today,
				visits: 1,
				totalTime: duration,
				lastVisit: now,
			});
		}

		// Keep only 90 days of data
		const cutoff = new Date(now - 90 * 24 * 60 * 60 * 1000).toDateString();
		analytics.visitedAllowedSites = analytics.visitedAllowedSites.filter(a => a.date >= cutoff);

		await chrome.storage.local.set({ [STORAGE_KEYS.ANALYTICS]: analytics });
		this._cache = analytics;
	}

	async getAnalyticsSummary(days = 7) {
		const analytics = await this.getAnalytics();
		const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toDateString();

		const recentBlocked = (analytics.blockedAttempts || []).filter(a => a.date >= cutoff);
		const recentVisited = (analytics.visitedAllowedSites || []).filter(a => a.date >= cutoff);

		// Top blocked sites
		const topBlocked = recentBlocked
			.sort((a, b) => b.count - a.count)
			.slice(0, 10);

		// Top visited allowed sites
		const topVisited = recentVisited
			.sort((a, b) => b.totalTime - a.totalTime)
			.slice(0, 10);

		// Total metrics
		const totalBlockedAttempts = recentBlocked.reduce((sum, a) => sum + a.count, 0);
		const totalVisits = recentVisited.reduce((sum, a) => sum + a.visits, 0);
		const totalTimeSpent = recentVisited.reduce((sum, a) => sum + a.totalTime, 0);

		// Daily breakdown
		const dailyBreakdown = {};
		recentBlocked.forEach(a => {
			if (!dailyBreakdown[a.date]) dailyBreakdown[a.date] = { blocked: 0, visited: 0, timeSpent: 0 };
			dailyBreakdown[a.date].blocked += a.count;
		});
		recentVisited.forEach(a => {
			if (!dailyBreakdown[a.date]) dailyBreakdown[a.date] = { blocked: 0, visited: 0, timeSpent: 0 };
			dailyBreakdown[a.date].visited += a.visits;
			dailyBreakdown[a.date].timeSpent += a.totalTime;
		});

		return {
			period: `Last ${days} days`,
			totalBlockedAttempts,
			totalVisits,
			totalTimeSpent,
			topBlocked,
			topVisited,
			dailyBreakdown: Object.entries(dailyBreakdown).sort(([a], [b]) => a.localeCompare(b)),
		};
	}

	async getTrends() {
		const analytics = await this.getAnalytics();
		const now = Date.now();
		const thisPeriod = this.getPeriodStats(analytics, 7, 0);
		const lastPeriod = this.getPeriodStats(analytics, 14, 7);

		const blockedDiff = thisPeriod.totalBlockedAttempts - lastPeriod.totalBlockedAttempts;
		const visitsDiff = thisPeriod.totalVisits - lastPeriod.totalVisits;
		const timeDiff = thisPeriod.totalTimeSpent - lastPeriod.totalTimeSpent;

		const blockedTrend = blockedDiff > 0 ? 'up' : blockedDiff < 0 ? 'down' : 'stable';
		const visitsTrend = visitsDiff > 0 ? 'up' : visitsDiff < 0 ? 'down' : 'stable';
		const timeTrend = timeDiff > 0 ? 'up' : timeDiff < 0 ? 'down' : 'stable';

		// Calculate streak
		const dailyData = Object.entries(thisPeriod.dailyBreakdown || {}).sort(([a], [b]) => b.localeCompare(a));
		let streak = 0;
		const avgBlockedLastWeek = lastPeriod.totalBlockedAttempts / 7;
		for (const [, data] of dailyData) {
			if (data.blocked <= avgBlockedLastWeek * 1.2) {
				streak++;
			} else {
				break;
			}
		}

		// Achievements
		const achievements = [];
		if (streak >= 3) achievements.push(`🔥 ${streak}-day focus streak`);
		if (thisPeriod.totalTimeSpent > lastPeriod.totalTimeSpent * 1.1) achievements.push('📈 Time focused up 10%+');
		if (thisPeriod.totalBlockedAttempts < lastPeriod.totalBlockedAttempts * 0.9) achievements.push('📉 Fewer distractions');
		if (thisPeriod.totalTimeSpent > 7 * 3600000) achievements.push('⏰ Over 7 hours focused');

		return {
			blockedTrend,
			blockedChange: Math.abs(blockedDiff),
			blockedChangePercent: lastPeriod.totalBlockedAttempts > 0 ? Math.round((blockedDiff / lastPeriod.totalBlockedAttempts) * 100) : 0,
			visitsTrend,
			visitsChange: Math.abs(visitsDiff),
			timeTrend,
			timeChange: Math.abs(timeDiff),
			timeChangePercent: lastPeriod.totalTimeSpent > 0 ? Math.round((timeDiff / lastPeriod.totalTimeSpent) * 100) : 0,
			streak,
			achievements,
		};
	}

	getPeriodStats(analytics, days, offset) {
		const now = Date.now();
		const start = new Date(now - (offset + days) * 24 * 60 * 60 * 1000).toDateString();
		const end = new Date(now - offset * 24 * 60 * 60 * 1000).toDateString();

		const blocked = (analytics.blockedAttempts || []).filter(a => a.date >= start && a.date <= end);
		const visited = (analytics.visitedAllowedSites || []).filter(a => a.date >= start && a.date <= end);

		const dailyBreakdown = {};
		blocked.forEach(a => {
			if (!dailyBreakdown[a.date]) dailyBreakdown[a.date] = { blocked: 0, visited: 0, timeSpent: 0 };
			dailyBreakdown[a.date].blocked += a.count;
		});
		visited.forEach(a => {
			if (!dailyBreakdown[a.date]) dailyBreakdown[a.date] = { blocked: 0, visited: 0, timeSpent: 0 };
			dailyBreakdown[a.date].visited += a.visits;
			dailyBreakdown[a.date].timeSpent += a.totalTime;
		});

		return {
			totalBlockedAttempts: blocked.reduce((sum, a) => sum + a.count, 0),
			totalVisits: visited.reduce((sum, a) => sum + a.visits, 0),
			totalTimeSpent: visited.reduce((sum, a) => sum + a.totalTime, 0),
			dailyBreakdown,
		};
	}
}

const analytics = new Analytics();

class SessionScheduler {
	constructor() {
		this._checkInterval = null;
	}

	async init() {
		// No-op: sessions removed
	}
}

const scheduler = new SessionScheduler();

// ============================================================================
// BLOCKING DETECTION STRATEGIES
// Two approaches: Chrome-specific (declarativeNetRequest error) and 
// browser-agnostic (webNavigation check). Can be swapped by changing activeBlockingStrategy.
// ============================================================================

/**
 * Check if a URL is allowed by the current allowlist entries.
 * This is the core matching logic used by the browser-agnostic approach.
 */
function isUrlAllowed(urlString, entries) {
	if (!entries || entries.length === 0) return false;

	let parsed;
	try {
		parsed = new URL(urlString);
	} catch {
		return false;
	}

	const hostname = parsed.hostname.toLowerCase();
	const fullUrl = parsed.href;
	const origin = parsed.origin;

	for (const entry of entries) {
		const val = entry.value.toLowerCase();
		switch (entry.type) {
			case 'domain': {
				// Match domain and all subdomains
				if (hostname === val || hostname.endsWith('.' + val)) return true;
				break;
			}
			case 'subdomain':
			case 'host': {
				// Exact hostname match
				if (hostname === val) return true;
				break;
			}
			case 'tld': {
				// Match TLD (e.g., .com, .org)
				const tld = val.replace(/^\./, '');
				if (hostname.endsWith('.' + tld) || hostname === tld) return true;
				break;
			}
			case 'origin': {
				// Match origin exactly
				const entryOrigin = val.replace(/\/+$/, '');
				if (origin === entryOrigin) return true;
				break;
			}
			case 'url': {
				// Match full URL exactly
				if (fullUrl === val || fullUrl === val + '/' || fullUrl.replace(/\/$/, '') === val.replace(/\/$/, '')) return true;
				break;
			}
		}
	}
	return false;
}

/**
 * Strategy 1: Chrome-specific blocking detection using webNavigation.onErrorOccurred
 * Works when declarativeNetRequest blocks the request (Chrome-only error codes)
 */
function setupChromeBlockingDetection() {
	chrome.webNavigation.onErrorOccurred.addListener(async (details) => {
		if (details.frameId !== 0) return;

		// Declarative Net Request blocks result in this error
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

/**
 * Strategy 2: Browser-agnostic blocking detection using webNavigation.onBeforeNavigate
 * Checks the allowlist before navigation and redirects to blocked page if not allowed.
 * Works across Chrome, Firefox, Safari (WebKit), Edge, etc.
 */
function setupBrowserAgnosticBlockingDetection() {
	// Use onBeforeNavigate - fires before navigation, allows redirects
	chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
		// Only check main frame navigations
		if (details.frameId !== 0) return;

		// Skip extension pages and browser internal pages
		const url = details.url;
		if (!url.startsWith('http://') && !url.startsWith('https://')) return;

		// Skip our own blocked page to avoid redirect loops
		if (url.includes(chrome.runtime.id) || url.includes('blocked.html')) return;

		try {
			const state = await repo.getState();

			// If blocking is disabled, allow everything
			if (!state.enabled) return;

			const entries = state.allowlists[state.current] || [];

			// Check if URL is allowed
			if (isUrlAllowed(url, entries)) return;

			// URL is blocked - redirect to our custom blocked page
			const hostname = new URL(url).hostname;

			// Track the blocked attempt
			await analytics.trackBlockedSite(hostname);

			// Redirect to blocked page with site info
			const blockedPageUrl = chrome.runtime.getURL(`blocked.html?site=${encodeURIComponent(hostname)}`);

			console.log('Blocking:', hostname, '-> redirecting to:', blockedPageUrl);

			// Use tabs.update to navigate to blocked page
			if (details.tabId && details.tabId > 0) {
				await chrome.tabs.update(details.tabId, { url: blockedPageUrl });
			}
		} catch (e) {
			console.error('Blocking check failed:', e);
		}
	}, { urls: ['<all_urls>'] });
}

// Configuration: Choose which blocking strategy to use
// 'chrome' = Chrome-only declarativeNetRequest error detection (uses DNR for actual blocking)
// 'agnostic' = Browser-agnostic webNavigation interception (works on all browsers including WebKit)
const BLOCKING_STRATEGY = 'agnostic';

let blockingDetectionInitialized = false;

function initBlockingDetection() {
	if (blockingDetectionInitialized) return;
	blockingDetectionInitialized = true;

	if (BLOCKING_STRATEGY === 'chrome') {
		// Chrome-specific: relies on declarativeNetRequest for blocking,
		// just detects the error for analytics
		setupChromeBlockingDetection();
	} else {
		// Browser-agnostic: handles blocking via webNavigation redirect
		// This works even if declarativeNetRequest isn't available
		setupBrowserAgnosticBlockingDetection();
	}
}

// ============================================================================
// END BLOCKING DETECTION STRATEGIES
// ============================================================================

async function rebuildFromCurrent() {
	const state = await repo.getState();
	const entries = state.allowlists[state.current] || [];
	if (state.enabled) {
		await rules.rebuildFor(entries);
		// Set badge to show entry count
		const count = entries.length;
		await chrome.action.setBadgeText({ text: count > 0 ? String(count) : '' });
		await chrome.action.setBadgeBackgroundColor({ color: '#4f8cff' });
	} else {
		// Pass a special marker to indicate disabled; _rebuildInternal removes rules and returns
		const disabledMarker = Object.assign([], { __disabled__: true });
		await rules.rebuildFor(disabledMarker);
		await chrome.action.setBadgeText({ text: 'OFF' });
		await chrome.action.setBadgeBackgroundColor({ color: '#6b7280' });
	}
}

chrome.runtime.onInstalled.addListener(async () => {
	await repo.init();
	await scheduler.init();
	await rebuildFromCurrent();
	initBlockingDetection();
});

// Also initialize on service worker startup (not just install)
(async () => {
	try {
		await repo.getState(); // Ensure cache is warm
		initBlockingDetection();
	} catch (e) {
		console.error('Startup init failed:', e);
	}
})();

chrome.storage.onChanged.addListener(async (changes, area) => {
	if (area === 'sync' && (changes[STORAGE_KEYS.ALLOWLISTS] || changes[STORAGE_KEYS.CURRENT] || changes[STORAGE_KEYS.ENABLED])) {
		await rebuildFromCurrent();
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

function inferEntryFromUrl(urlString) {
	try {
		const u = new URL(urlString);
		return { type: 'domain', value: getRegistrableDomainFromHost(u.hostname) };
	} catch {
		return null;
	}
}

// Minimal registrable domain derivation. Not exhaustive but handles common 2-level ccTLD suffixes.
function getRegistrableDomainFromHost(hostname) {
	const host = String(hostname || '').toLowerCase();
	const parts = host.split('.').filter(Boolean);
	if (parts.length <= 2) return host;
	const twoLevelSuffixes = new Set([
		'co.uk', 'com.au', 'co.jp', 'co.in', 'com.br', 'co.kr', 'com.sg', 'com.cn', 'com.tw', 'com.mx', 'co.za'
	]);
	const last2 = parts.slice(-2).join('.');
	const last3 = parts.slice(-3).join('.');
	if (twoLevelSuffixes.has(last2)) {
		return last3;
	}
	return last2;
}
