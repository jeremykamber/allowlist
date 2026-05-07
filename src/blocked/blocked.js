const runtime = (typeof chrome !== 'undefined' && chrome.runtime) ? chrome.runtime :
	(typeof browser !== 'undefined' && browser.runtime) ? browser.runtime : null;

const send = (type, payload) => new Promise((resolve) => {
	if (!runtime || !runtime.sendMessage) return resolve(null);
	try {
		runtime.sendMessage({ type, payload }, (response) => {
			if (chrome.runtime && chrome.runtime.lastError) return resolve(null);
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
	{ text: "The beautiful thing about learning is nobody can take it away from you.", author: "B.B. King" },
	{ text: "Great minds discuss ideas; average minds discuss events; small minds discuss people.", author: "Eleanor Roosevelt" },
	{ text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
	{ text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
	{ text: "Whether you think you can or you think you can't, you're right.", author: "Henry Ford" },
];

async function init() {
	try {
		// Parse URL parameters
		const url = new URL(window.location.href);
		const site = url.searchParams.get('site') || 'this site';

		// Set the blocked site name
		document.getElementById('blocked-site-text').textContent = site;

		// Set a random quote
		const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
		document.getElementById('quote').textContent = quote.text;
		document.getElementById('quote-author').textContent = `— ${quote.author}`;

		// Get analytics for stats display
		const analytics = await send('get_analytics', 7);
		if (analytics && analytics.totalBlockedAttempts !== undefined) {
			const focusHours = Math.floor(analytics.totalTimeSpent / 3600000);
			const focusMins = Math.floor((analytics.totalTimeSpent % 3600000) / 60000);
			document.getElementById('focus-time').textContent =
				focusHours > 0 ? `${focusHours}h ${focusMins}m` : `${focusMins}m`;
			document.getElementById('blocked-count').textContent = analytics.totalBlockedAttempts;
		}

		// Get current list name
		const state = await send('get_block_page_settings');
		if (state) {
			document.getElementById('current-list-name').textContent = state.currentList || 'AllowList';
		}

		// Random breathing exercise (40% chance)
		if (Math.random() > 0.6) {
			document.getElementById('breathing').style.display = 'flex';
		}

		// Temporarily allow button
		document.getElementById('temp-allow-5m').addEventListener('click', async () => {
			const entry = { type: 'domain', value: site };
			await send('add_entry_current', entry);
			document.getElementById('temp-allow-msg').style.display = 'block';
			document.getElementById('temp-allow-msg').textContent = `✓ ${site} allowed for this session`;
			setTimeout(() => {
				window.location.href = `https://${site}`;
			}, 800);
		});

	} catch (e) {
		// Fallback on error
		const quote = QUOTES[0];
		document.getElementById('quote').textContent = quote.text;
		document.getElementById('quote-author').textContent = `— ${quote.author}`;
	}
}

// Check if document is already loaded
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', init);
} else {
	init();
}
