# Quick Start Guide - AllowList Extension

## Installation & Testing

### 1. Load the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the `whitelist_site_blocker_v2` directory
5. The extension should now appear in your extensions list

### 2. Verify the Extension Loads

- You should see the AllowList icon in your extension toolbar
- Click it to open the popup window
- You should see "No sites yet" with an add button

### 3. Test Basic Functionality

#### Adding a Site
1. Click "+ Current Site" button
2. Should show "Added" toast notification with the current domain
3. Refresh the page and verify the site appears in the list

#### Adding a Custom Domain
1. Type "example.com" in the text input
2. The type chip should show "Domain" in blue
3. Click "Add"
4. Should see "Added" notification

#### Error Handling Test
1. Type an invalid entry like "!@#$%" 
2. Click "Add"
3. Should see "Invalid entry format" error toast

#### Managing Lists
1. Click the "+" button to create a new list
2. Enter a name and click "Save"
3. Should see "Created..." notification
4. Click "⋯" to manage the list (rename, delete, etc.)

### 4. Test Error States

The extension now handles errors gracefully:

- **Failed Storage Operations**: Error toast appears for 4 seconds
- **Invalid Input**: User-friendly error message provided
- **Network Issues**: Extension continues functioning with cached data
- **Tab Queries**: Shows "No active tab found" if unable to query tabs

### 5. Dark Mode Testing

1. Click the moon/sun icon in the header
2. Extension should switch between light and dark themes
3. This preference is saved to localStorage
4. Reload the extension - theme preference should persist

### 6. Test on Blocked Pages

1. Add a site to your allowlist (e.g., "github.com")
2. Try to visit a blocked site (e.g., "facebook.com")
3. You should see the "Stay in the Zone" focus page
4. The blocked site name should appear with an icon
5. The page should show a motivational quote

## What's New in This Version

✅ **Production-Ready Structure**
- Code organized into clear modules and folders
- No console logs or debug statements
- Proper error handling throughout

✅ **Error UI Feedback**
- Toast notifications for all operations
- Error animations and visual feedback
- Graceful error recovery

✅ **Module-Based Architecture**
- ES6 modules for better code organization
- Separated concerns (utils, UI, business logic)
- Easier to test and maintain

✅ **Removed Legacy**
- Old root-level files archived in `_deprecated/`
- Clean file structure
- Updated manifest.json with correct paths

## File Structure Reference

```
whitelist_site_blocker_v2/
├── src/
│   ├── background/background.js    # Service worker
│   ├── popup/                       # Popup UI
│   │   ├── popup.html
│   │   └── popup.js
│   ├── blocked/                     # Blocked page
│   │   ├── blocked.html
│   │   └── blocked.js
│   ├── utils/                       # Utilities
│   │   ├── classifier.js
│   │   ├── allowlist-repository.js
│   │   ├── analytics.js
│   │   └── rules-engine.js
│   └── shared/                      # Shared code
│       └── constants.js
├── manifest.json                    # Updated with new paths
├── popup.css                        # Shared styles
└── PRODUCTION_STRUCTURE.md         # Full documentation
```

## Troubleshooting

### Extension Won't Load

1. Check the manifest.json for syntax errors:
   ```bash
   node -e "console.log(require('./manifest.json'))"
   ```

2. Verify all file paths in manifest point to correct locations:
   - `src/background/background.js`
   - `src/popup/popup.html`
   - `src/blocked/blocked.html`

3. Check Chrome console for errors:
   - Right-click extension icon → "Manage extension"
   - Check "Errors" section

### Extension Loads but Popup is Blank

1. Open DevTools on the popup (right-click popup, "Inspect")
2. Check console for JavaScript errors
3. Verify `src/shared/constants.js` is properly imported
4. Check that `popup.css` path is correct (`../../popup.css`)

### Sites Not Being Blocked

1. Verify the allowlist isn't empty
2. Check that the extension is enabled (toggle switch)
3. Try adding a simple domain like "example.com"
4. Navigate to a site and check the icon badge (should show site count)

### Error Messages in Toast

- **"Failed to load settings"**: Check storage permissions and quota
- **"Failed to update setting"**: Storage quota exceeded or corrupted
- **"Error adding entry"**: Invalid entry format or duplicate
- **"No active tab found"**: Can't access current tab (permission issue)

## Performance Notes

- State caching: 500ms TTL reduces storage reads
- Storage writes: 100ms debounce prevents quota errors
- Rule updates: Serialized to prevent race conditions
- Analytics: Aggregated and retained for 90 days

## Next Steps

1. **Test thoroughly** in various scenarios
2. **Check DevTools** for any errors or warnings
3. **Verify blocking** works on multiple sites
4. **Test dark mode** on different pages
5. **Test error handling** by disabling features

## Support

For issues or questions:
1. Check the PRODUCTION_STRUCTURE.md for detailed info
2. Review error messages in toast notifications
3. Inspect DevTools console for technical errors
4. Check manifest.json for path configuration
