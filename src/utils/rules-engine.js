export class RulesEngine {
	constructor() {
		this.BLOCK_ALL_RULE_ID = 1;
		this.ALLOW_BASE_ID = 1000;
		this._queue = Promise.resolve();
	}

	rebuildFor(entries) {
		this._queue = this._queue.then(() => this._rebuildInternal(entries)).catch(() => { });
		return this._queue;
	}

	async _rebuildInternal(entries) {
		const existing = await chrome.declarativeNetRequest.getDynamicRules();
		const toRemove = existing.map(r => r.id);
		if (toRemove.length) {
			await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: toRemove });
		}

		if (!Array.isArray(entries) || entries.__disabled__ === true) {
			return;
		}

		const rules = [];

		rules.push({
			id: this.BLOCK_ALL_RULE_ID,
			priority: 1,
			action: { type: 'block' },
			condition: {
				regexFilter: '^https?://',
				resourceTypes: ['main_frame'],
			},
		});

		let nextId = this.ALLOW_BASE_ID;
		for (const entry of entries) {
			const allowRule = this.buildAllowRule(nextId, entry);
			if (allowRule) {
				rules.push(allowRule);
				nextId += 1;
			}
		}

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
