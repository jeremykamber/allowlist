# Whitelist Site Blocker V2 - Improvements & Bug Fixes

## 🐛 Bugs Fixed

1. **Duplicate Entry Detection Feedback** - Previously, adding duplicate entries would silently fail without user feedback. Now displays a clear toast message indicating the entry already exists.

2. **Missing Removal Feedback** - Removed entries now show a confirmation toast.

3. **Missing Edit Feedback** - Updated entries now show a confirmation toast.

4. **Error Handling** - Enhanced error messages for all async operations.

## ⚡ Performance Improvements

1. **State Caching** - Implemented 500ms cache for storage reads in `AllowlistRepository` to reduce redundant Chrome storage API calls during rapid UI updates.
   - Cache invalidates automatically after 500ms
   - Cache is invalidated on any write operation
   - Reduces API latency for synchronized operations

2. **Smart Rebuild Queue** - Already in place but now properly leveraged with caching for multi-step operations.

## ✨ New Features Implemented

### 1. **Copy to Clipboard** 📋
   - New copy button on each entry
   - Click the clipboard icon to copy entry value to clipboard
   - Toast confirmation appears when copied

### 2. **Export Allowlist** 📥
   - Export current allowlist as JSON file
   - Located in dropdown menu (⋮ button)
   - Includes metadata: name, entries, export date
   - Filename: `allowlist-{name}-{timestamp}.json`

### 3. **Import Allowlist** 📤
   - Import previously exported allowlists
   - Supports duplicate name handling with rename prompt
   - Located in dropdown menu (⋮ button)
   - Validates JSON format before import

### 4. **List Statistics** 📊
   - View breakdown of entries by type (domain, subdomain, URL, etc.)
   - Shows total count and per-type counts
   - Modal dialog with clean presentation
   - Located in dropdown menu (⋮ button)

### 5. **Entry Count Badge** 
   - Extension icon now displays the number of entries in the active allowlist
   - Shows "OFF" badge when extension is disabled (existing feature, now paired with entry count)
   - Automatically updates when entries are added/removed/changed

### 6. **Enhanced Feedback**
   - All quick-add actions now show:
     - ✓ Success message with entry details
     - "Already allowed" message for duplicates (not errors)
   - Toast messages now include confirmation icons

### 7. **Dropdown Menu** ⋮
   - Centralized menu for advanced features:
     - Export allowlist
     - Import allowlist
     - View statistics
   - Clean click-to-close interaction
   - Auto-closes on document click

## 🎨 UI Improvements

1. **Wider Popup** - Increased from 420px to 480px to accommodate new buttons and features
2. **New Modal Dialog** - Clean modal for statistics display with overlay
3. **Dropdown Menu** - Professional dropdown styling with hover effects
4. **Better Button Layout** - New menu button next to "Save as…"

## 📋 CSS Additions

- `.dropdown` - Dropdown menu container
- `.dropdown-item` - Individual dropdown menu items with hover effects
- `.modal` - Modal container with overlay
- `.modal-overlay` - Semi-transparent overlay behind modal
- `.modal-content` - Modal content box with max dimensions
- `.modal-header` - Header section with title and close button
- `.modal-body` - Body content area with padding

## 🔧 Message Handler Additions (background.js)

- `export_allowlist` - Export allowlist as JSON data
- `import_allowlist` - Import allowlist from JSON data
- `get_stats` - Get statistics for current allowlist

## 💾 Storage & Caching

- AllowlistRepository now includes:
  - `_cache` - In-memory cache of state
  - `_cacheTime` - Timestamp of last cache update
  - `_CACHE_TTL` - 500ms cache validity period
  - Cache invalidation on write operations

## 🚀 What's NOT Changed (Stable Features)

- Core blocking logic remains unchanged
- Keyboard shortcuts remain functional
- Declarative net request rules unchanged
- Storage structure unchanged (backward compatible)
- All existing permissions retained
- Default "Scratchpad" list still non-deletable and non-renamable

## 📝 User-Facing Summary

The extension now provides:
- ✅ Better feedback on all actions
- ✅ Ability to backup/restore allowlists
- ✅ Quick stats about your allowlist
- ✅ Easy entry copying
- ✅ Prevention of duplicate entries with clear messages
- ✅ Entry count badge on extension icon
- ✅ Improved performance with state caching
- ✅ All existing functionality preserved
