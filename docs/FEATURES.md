# Quick Reference: New Features

## 📋 Copy Entry
**How to use:** Click the clipboard (📋) icon next to any entry
- Copies the entry value to your clipboard
- Shows confirmation toast

## 📥 Export Allowlist
**How to use:** Click the ⋮ menu → Export
- Downloads current allowlist as JSON file
- Filename: `allowlist-{name}-{timestamp}.json`
- Use for backup or sharing

## 📤 Import Allowlist
**How to use:** Click the ⋮ menu → Import
- Select a previously exported JSON file
- If name conflicts: you'll be prompted to rename
- Automatically switches to imported list

## 📊 View Statistics
**How to use:** Click the ⋮ menu → Stats
- Shows total entries in current list
- Breakdown by type: Domains, Subdomains, URLs, etc.
- Modal dialog with clean layout

## 🔔 Entry Count Badge
**What it shows:** The extension icon displays:
- Number of entries when active (e.g., "23")
- "OFF" when extension is disabled

## ✨ Enhanced Feedback
**What improved:**
- Adding duplicate entries now shows: "Already allowed: {entry}"
- Successful additions show: "✓ Allowed {type} {entry}"
- Removals show: "Entry removed"
- Edits show: "Entry updated"
- All changes trigger visual confirmation

## ⚡ Performance
- State reads are now cached for 500ms
- Reduces redundant storage API calls
- Faster UI responsiveness during multi-step operations
