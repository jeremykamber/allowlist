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

export class InputClassifier {
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
					u.hash = '';
					return { type: 'url', value: `${u.protocol}//${u.host}${u.pathname}${u.search}` };
				}
				const reg = getRegistrableDomainFromHost(u.hostname);
				if (u.hostname.toLowerCase() === reg) return { type: 'domain', value: reg };
				return { type: 'subdomain', value: u.hostname.toLowerCase() };
			} catch {
				return null;
			}
		}

		if (s.includes('/')) {
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

export function isUrlAllowed(urlString, entries) {
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
				if (hostname === val || hostname.endsWith('.' + val)) return true;
				break;
			}
			case 'subdomain':
			case 'host': {
				if (hostname === val) return true;
				break;
			}
			case 'tld': {
				const tld = val.replace(/^\./, '');
				if (hostname.endsWith('.' + tld) || hostname === tld) return true;
				break;
			}
			case 'origin': {
				const entryOrigin = val.replace(/\/+$/, '');
				if (origin === entryOrigin) return true;
				break;
			}
			case 'url': {
				if (fullUrl === val || fullUrl === val + '/' || fullUrl.replace(/\/$/, '') === val.replace(/\/$/, '')) return true;
				break;
			}
		}
	}
	return false;
}

export { getRegistrableDomainFromHost };
