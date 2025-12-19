const runtime = (typeof chrome !== 'undefined' && chrome.runtime) ? chrome.runtime :
	(typeof browser !== 'undefined' && browser.runtime) ? browser.runtime : null;

const send = (type, payload) => new Promise((resolve) => {
	if (!runtime || !runtime.sendMessage) {
		return resolve(null);
	}
	try {
		runtime.sendMessage({ type, payload }, (response) => {
			if (chrome.runtime && chrome.runtime.lastError) {
				resolve(null);
				return;
			}
			resolve(response);
		});
	} catch (e) {
		resolve(null);
	}
});

const QUOTES = [
	{ text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
	{ text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
	{ text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
	{ text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
	{ text: "It's not that I'm so smart, it's just that I stay with problems longer.", author: "Albert Einstein" },
	{ text: "Concentrate all your thoughts upon the work at hand.", author: "Alexander Graham Bell" },
	{ text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
	{ text: "Where focus goes, energy flows.", author: "Tony Robbins" },
	{ text: "The successful warrior is the average man, with laser-like focus.", author: "Bruce Lee" },
	{ text: "Do the hard jobs first. The easy jobs will take care of themselves.", author: "Dale Carnegie" },
];

function getUrlForEntry(entry) {
	switch (entry.type) {
		case 'url': return entry.value;
		case 'origin': return entry.value;
		case 'domain':
		case 'subdomain':
		case 'host':
			return `https://${entry.value}`;
		default:
			return `https://${entry.value}`;
	}
}

function getDisplayName(entry) {
	try {
		const url = new URL(getUrlForEntry(entry));
		return url.hostname;
	} catch {
		return entry.value;
	}
}

async function init() {
	try {
		const savedPreference = localStorage.getItem('darkMode');
		if (savedPreference !== null) {
			document.documentElement.setAttribute('data-theme', savedPreference === 'true' ? 'dark' : 'light');
		}

		const url = new URL(window.location.href);
		const site = url.searchParams.get('site');

		if (site) {
			document.getElementById('blocked-site-text').textContent = site;
		} else {
			document.getElementById('blocked-site-text').textContent = 'this site';
		}

		const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
		document.getElementById('quote').textContent = quote.text;
		document.getElementById('quote-author').textContent = `— ${quote.author}`;

		if (Math.random() > 0.6) {
			document.getElementById('breathing').style.display = 'flex';
		}
	} catch (e) {
		const fallbackQuote = QUOTES[0];
		document.getElementById('quote').textContent = fallbackQuote.text;
		document.getElementById('quote-author').textContent = `— ${fallbackQuote.author}`;
	}
}

init();
