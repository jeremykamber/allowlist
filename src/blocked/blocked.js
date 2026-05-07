// ═══════════════════════════════════════════════════════════════════════════════
//  AllowList — Blocked Page Controller
//  Shows motivational quotes, focus stats, and a "Temporarily Allow" button.
// ═══════════════════════════════════════════════════════════════════════════════

const $ = (s) => document.querySelector(s);

const send = (type, payload) =>
  new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage({ type, payload }, (res) => {
        if (chrome.runtime?.lastError) resolve(null);
        else resolve(res);
      });
    } catch {
      resolve(null);
    }
  });

const QUOTES = [
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { text: 'Focus on being productive instead of busy.', author: 'Tim Ferriss' },
  { text: 'You don\'t have to be great to start, but you have to start to be great.', author: 'Zig Ziglar' },
  { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
  { text: 'It\'s not that I\'m so smart, it\'s just that I stay with problems longer.', author: 'Albert Einstein' },
  { text: 'Concentrate all your thoughts upon the work at hand.', author: 'Alexander Graham Bell' },
  { text: 'Success is the sum of small efforts repeated day in and day out.', author: 'Robert Collier' },
  { text: 'Where focus goes, energy flows.', author: 'Tony Robbins' },
  { text: 'The successful warrior is the average man, with laser-like focus.', author: 'Bruce Lee' },
  { text: 'Do the hard jobs first. The easy jobs will take care of themselves.', author: 'Dale Carnegie' },
  { text: 'The beautiful thing about learning is nobody can take it away from you.', author: 'B.B. King' },
  { text: 'Great minds discuss ideas; average minds discuss events; small minds discuss people.', author: 'Eleanor Roosevelt' },
  { text: 'Discipline is choosing between what you want now and what you want most.', author: 'Abraham Lincoln' },
  { text: 'The best time to plant a tree was 20 years ago. The second best time is now.', author: 'Chinese Proverb' },
  { text: 'Whether you think you can or you think you can\'t, you\'re right.', author: 'Henry Ford' },
  { text: 'The impediment to action advances action. What stands in the way becomes the way.', author: 'Marcus Aurelius' },
  { text: 'We suffer more in imagination than in reality.', author: 'Seneca' },
  { text: 'He who has a why to live for can bear almost any how.', author: 'Friedrich Nietzsche' },
];

// ── Dark mode ──────────────────────────────────────────────────────────────

function initDarkMode() {
  const saved = localStorage.getItem('darkMode');
  if (saved !== null) {
    document.documentElement.setAttribute('data-theme', saved === 'true' ? 'dark' : 'light');
  }
}

// ── Init ───────────────────────────────────────────────────────────────────

async function init() {
  try {
    initDarkMode();

    const url = new URL(window.location.href);
    const site = url.searchParams.get('site') || 'this site';

    // Blocked site name
    const siteEl = $('#blocked-site-text');
    if (siteEl) siteEl.textContent = site;

    // Random quote
    const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    const quoteEl = $('#quote');
    const authorEl = $('#quote-author');
    if (quoteEl) quoteEl.textContent = quote.text;
    if (authorEl) authorEl.textContent = `— ${quote.author}`;

    // Analytics
    const analytics = await send('get_analytics', 7);
    if (analytics && analytics.totalBlockedAttempts !== undefined) {
      const hours = Math.floor(analytics.totalTimeSpent / 3600000);
      const mins = Math.floor((analytics.totalTimeSpent % 3600000) / 60000);
      const timeEl = $('#focus-time');
      const countEl = $('#blocked-count');
      if (timeEl) timeEl.textContent = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
      if (countEl) countEl.textContent = analytics.totalBlockedAttempts;
    }

    // Current list name
    const settings = await send('get_block_page_settings');
    if (settings?.currentList) {
      const badge = $('#current-list-name');
      if (badge) badge.textContent = settings.currentList;
    }

    // Random breathing exercise (35% chance)
    const breathEl = $('#breathing');
    if (breathEl && Math.random() > 0.65) {
      breathEl.style.display = 'flex';
    }

    // Temporarily allow button
    const allowBtn = $('#temp-allow-btn');
    if (allowBtn) {
      allowBtn.addEventListener('click', async () => {
        allowBtn.disabled = true;
        allowBtn.textContent = '⏳ Allowing…';
        try {
          const entry = { type: 'domain', value: site };
          await send('add_entry_current', entry);
          const msgEl = $('#temp-allow-msg');
          if (msgEl) {
            msgEl.style.display = 'block';
            msgEl.textContent = `✓ ${site} is now allowed`;
          }
          setTimeout(() => {
            window.location.href = `https://${site}`;
          }, 800);
        } catch {
          allowBtn.disabled = false;
          allowBtn.textContent = '🔓 Temporarily Allow';
        }
      });
    }
  } catch {
    // Fallback — page still looks good with static content
    const quote = QUOTES[0];
    const q = $('#quote');
    const a = $('#quote-author');
    if (q) q.textContent = quote.text;
    if (a) a.textContent = `— ${quote.author}`;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
