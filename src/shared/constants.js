export const STORAGE_KEYS = {
	ALLOWLISTS: 'allowlists',
	CURRENT: 'currentAllowlist',
	ENABLED: 'enabled',
	ANALYTICS: 'analytics',
	PRESETS_IMPORTED: 'presetsImported',
};

export const DEFAULT_ALLOWLIST_NAME = 'Scratchpad';

// IPC file — bash scripts (e.g., Raycast focus-mode.sh) write JSON here
// to control the extension without needing Chrome extension messaging.
// The extension watches this file via an alarm every 2 seconds.
export const CONTROL_FILE = '.allowlist-control.json';
export const CONTROL_INTERVAL_MINUTES = 1 / 30; // 2 seconds

export const PRESET_ALLOWLISTS = {
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
