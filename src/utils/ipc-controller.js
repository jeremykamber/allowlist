/**
 * IpcController — Scriptable control for AllowList extension.
 *
 * Allows external scripts (e.g., Raycast focus-mode.sh) to control the
 * extension via URL-based commands. The script opens a tab with a special
 * URL, the extension processes the command and auto-closes the tab.
 *
 * Usage from bash (via osascript):
 *
 *   # Toggle on/off
 *   osascript -e '
 *     tell application "Thorium" to open location
 *     "chrome-extension://[EXT_ID]/src/popup/popup.html?cmd=toggle"
 *   '
 *
 *   # Enable
 *   osascript -e '
 *     tell application "Thorium" to open location
 *     "chrome-extension://[EXT_ID]/src/popup/popup.html?cmd=enable"
 *   '
 *
 *   # Switch to Deep Work list
 *   osascript -e '
 *     tell application "Thorium" to open location
 *     "chrome-extension://[EXT_ID]/src/popup/popup.html?cmd=set_list&value=🔬%20Deep%20Work"
 *   '
 *
 *   # Add current site to allowlist
 *   osascript -e '
 *     tell application "Thorium" to open location
 *     "chrome-extension://[EXT_ID]/src/popup/popup.html?cmd=add_site"
 *   '
 *
 * The following URL command parameters are supported:
 *   cmd=toggle       — Toggle AllowList on/off
 *   cmd=enable       — Turn AllowList on
 *   cmd=disable      — Turn AllowList off
 *   cmd=set_list     — Switch to a specific allowlist (use &value=...)
 *   cmd=add_site     — Add the current browser URL to the active list
 *   cmd=cycle_list   — Cycle to the next allowlist
 */

import { getRegistrableDomainFromHost } from './classifier.js';

export class IpcController {
	constructor(repo) {
		this._repo = repo;
	}

	/**
	 * Process a command received via URL parameter.
	 * Called from the popup when ?cmd=... is in the URL.
	 */
	async processCommand(cmd, value) {
		switch (cmd) {
			case 'toggle': {
				const state = await this._repo.getState();
				const newState = !state.enabled;
				await this._repo.setEnabled(newState);
				return { ok: true, message: newState ? 'Enabled' : 'Disabled' };
			}
			case 'enable': {
				await this._repo.setEnabled(true);
				return { ok: true, message: 'Enabled' };
			}
			case 'disable': {
				await this._repo.setEnabled(false);
				return { ok: true, message: 'Disabled' };
			}
			case 'set_list': {
				const name = decodeURIComponent(value || '');
				if (!name) return { ok: false, error: 'Missing list name' };
				const state = await this._repo.getState();
				if (!state.allowlists[name]) {
					return { ok: false, error: `List "${name}" not found` };
				}
				await this._repo.setCurrent(name);
				return { ok: true, message: `Switched to "${name}"` };
			}
			case 'add_site': {
				try {
					const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
					if (!tab || !tab.url) return { ok: false, error: 'No active tab' };
					const u = new URL(tab.url);
					const entry = { type: 'domain', value: getRegistrableDomainFromHost(u.hostname) };
					await this._repo.addEntryToCurrent(entry);
					return { ok: true, message: `Added ${entry.value}` };
				} catch (e) {
					return { ok: false, error: String(e) };
				}
			}
			case 'cycle_list': {
				const state = await this._repo.getState();
				const names = Object.keys(state.allowlists);
				if (names.length === 0) return { ok: false, error: 'No lists' };
				const idx = names.indexOf(state.current);
				const next = names[(idx + 1) % names.length];
				await this._repo.setCurrent(next);
				return { ok: true, message: `Switched to "${next}"` };
			}
			default:
				return { ok: false, error: `Unknown command: ${cmd}` };
		}
	}
}
