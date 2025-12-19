import { STORAGE_KEYS, DEFAULT_ALLOWLIST_NAME, PRESET_ALLOWLISTS } from '../shared/constants.js';

export class AllowlistRepository {
	constructor() {
		this._cache = null;
		this._cacheTime = 0;
		this._CACHE_TTL = 500;
		this._pendingWrite = null;
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
			allowlists[DEFAULT_ALLOWLIST_NAME] = [];
		}

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
		if (this._cache && (Date.now() - this._cacheTime) < this._CACHE_TTL) {
			return this._cache;
		}
		const data = await chrome.storage.sync.get([STORAGE_KEYS.ALLOWLISTS, STORAGE_KEYS.CURRENT, STORAGE_KEYS.ENABLED]);
		const allowlists = data[STORAGE_KEYS.ALLOWLISTS] || { [DEFAULT_ALLOWLIST_NAME]: [] };
		if (!allowlists[DEFAULT_ALLOWLIST_NAME]) allowlists[DEFAULT_ALLOWLIST_NAME] = [];
		const current = data[STORAGE_KEYS.CURRENT] || DEFAULT_ALLOWLIST_NAME;
		const enabled = typeof data[STORAGE_KEYS.ENABLED] === 'boolean' ? data[STORAGE_KEYS.ENABLED] : true;
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

		if (this._pendingWrite) clearTimeout(this._pendingWrite);

		this._pendingWrite = setTimeout(async () => {
			try {
				await chrome.storage.sync.set({
					[STORAGE_KEYS.ALLOWLISTS]: state.allowlists,
					[STORAGE_KEYS.CURRENT]: state.current,
					[STORAGE_KEYS.ENABLED]: typeof state.enabled === 'boolean' ? state.enabled : true,
				});
			} catch (e) {
				// Storage quota error - continue gracefully
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
