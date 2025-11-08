# Allowlist-Only Site Access

Block everything by default. Only allow Websites (domains) or specific URLs that are in the active allowlist.

## Highlights
- One-click "Allow current site" from the popup (adds the Website/domain)
- Beautiful, compact UI with clear empty states and toasts
- Scratchpad default list that always exists and cannot be renamed or deleted
- Multiple lists: save current as a new allowlist and switch between them quickly
- Keyboard shortcuts (configurable):
  - Add current site: Command+Shift+L (mac) / Ctrl+Shift+L (win/linux)
  - Cycle allowlist: Command+Shift+K (mac) / Ctrl+Shift+K (win/linux)

## Load in Chrome/Edge
1. Open chrome://extensions (or edge://extensions)
2. Enable "Developer mode"
3. Click "Load unpacked" and select this folder

## Usage
- Click the extension icon to open the popup
- Use "Allow current site" for one-click allow
- Type a domain (Website) like example.com or a full URL (https://example.com/path) and click Add
- Use "Save as…" to create a new allowlist from the current one
- The "Scratchpad" list is your default blank canvas; it cannot be renamed or deleted

## Notes
- This extension uses declarativeNetRequest to block all main-frame http/https navigations by default, then re-allows the ones in your active list (allowAllRequests so pages function correctly)
- The popup uses the Tabs permission only to read the active tab hostname when you click "Allow current site"
 - Website entries use the registrable domain (e.g., news.bbc.co.uk -> bbc.co.uk). If you need to allow only a specific path, add it as a URL.
