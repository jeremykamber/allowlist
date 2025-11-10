# AllowList - Productivity-Focused Site Blocker

**Block everything by default. Only allow the websites that deserve your focus.**

AllowList is a Chrome extension for serious productivity enthusiasts. It flips the traditional blocker model on its head: instead of blacklisting distracting sites, you whitelist only the sites you need. Perfect for students, professionals, developers, writers, and anyone who wants maximum control over their browsing.

---

## 🚀 Quick Start

### Installation

#### Option 1: Chrome Web Store (Recommended)
Coming soon to the Chrome Web Store.

#### Option 2: Load Unpacked (Developer Mode)
1. Download or clone this repository
2. Open `chrome://extensions` in your browser
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked"
5. Select this folder
6. The AllowList icon will appear in your extension toolbar

---

## 🎯 Core Features

### Allowlist-Based Blocking
- **Block-by-default model**: All websites are blocked by default
- **Whitelist only what you need**: Add specific domains, URLs, or subdomains you want to access
- **Smart entry detection**: Automatically classifies input as domain, URL, subdomain, or TLD

### Quick Access
- **One-click add**: Add the current site to your allowlist instantly
  - Keyboard shortcut: `Cmd+Shift+L` (Mac) / `Ctrl+Shift+L` (Windows/Linux)
- **One-click domain add**: Add just the domain without the full URL
- **Manual entry**: Type any domain, URL, or pattern directly into the input box

### Multiple Allowlists
- **Context-specific lists**: Create separate allowlists for different work modes
  - Work: Email, Slack, GitHub, Google Docs, etc.
  - Learning: Stack Overflow, MDN, Wikipedia, GitHub, etc.
  - Deep Focus: Minimal set of truly essential tools
  - Creative: Design and asset tools
  - Research: Academic databases and journals
  - Custom: Build your own
- **Quick switching**: Use keyboard shortcut or dropdown selector
  - Keyboard shortcut: `Cmd+Shift+K` (Mac) / `Ctrl+Shift+K` (Windows/Linux)
- **Persistent storage**: Lists sync across devices via your Google Account

### Smart Organization
- **Scratchpad default**: Every installation includes a "Scratchpad" list that cannot be deleted or renamed (your blank canvas)
- **Pre-built templates**: Start with curated allowlists for common use cases
- **List management**: Create, rename, and delete lists easily
- **Entry management**: Edit or remove entries on the fly

### Entry Types

AllowList supports multiple entry types for fine-grained control:

- **Domain**: `example.com` - Blocks/allows all subdomains and paths
- **Subdomain**: `news.example.com` - Allows only that specific subdomain
- **URL**: `https://example.com/path` - Allows only that specific URL
- **Origin**: `https://example.com:8080` - Allows specific origin with port
- **TLD**: `.com` - Allow all sites with that top-level domain (advanced)

---

## 🎨 User Interface

### Popup Interface
- **Header**: AllowList branding with enable/disable toggle
- **List selector**: Dropdown to switch between your allowlists
- **Quick-add buttons**: One-click add current site or domain
- **Manual entry**: Type any domain/URL with smart type detection
- **Entry list**: View, edit, copy, or delete all entries in current list
- **Toast notifications**: Instant feedback on all actions

### Design Highlights
- Minimal, distraction-free design
- Responsive layout works on any screen size
- Clean typography and spacing
- Color-coded status indicators
- Keyboard-accessible throughout

---

## ⌨️ Keyboard Shortcuts

| Action | Windows/Linux | Mac |
|--------|---------------|-----|
| Add current site to allowlist | `Ctrl+Shift+L` | `Cmd+Shift+L` |
| Switch to next allowlist | `Ctrl+Shift+K` | `Cmd+Shift+K` |

All shortcuts are configurable via `chrome://extensions/shortcuts`

---

## 📊 Analytics & Insights

- **Dashboard**: Track your browsing patterns
- **Blocked attempts**: See which sites you tried to visit but were blocked
- **Focus time**: Monitor time spent on allowed sites
- **Trends**: Weekly/monthly comparisons and achievement badges
- **Daily breakdown**: Detailed analytics for the past 90 days
- **Top sites**: Identify your most-visited and most-blocked sites

---

## 🔧 How It Works

### Technical Architecture

**AllowList uses Chrome's declarativeNetRequest API** for maximum efficiency and privacy:

1. **Default block rule**: Blocks all HTTP/HTTPS main-frame navigations
2. **Allow rules**: For each entry in your allowlist, a corresponding allow rule is created
3. **Smart prioritization**: Allow rules have higher priority than the block rule
4. **Dynamic updates**: Rules are rebuilt instantly when you modify your allowlist
5. **Zero external calls**: All processing happens locally on your device

### Privacy & Security

- ✅ **No external servers**: Everything runs locally on your device
- ✅ **No analytics collection**: Your browsing data stays private
- ✅ **No account required**: Works with your Google Account for sync only
- ✅ **No ads or tracking**: Completely ad-free
- ✅ **Open source**: Full transparency into how it works

### Performance

- **Minimal overhead**: Uses native Chrome APIs for efficiency
- **Instant switching**: Lists update in milliseconds
- **Low memory footprint**: Efficient rule engine design
- **Cross-device sync**: Changes sync automatically via Chrome sync

---

## 📝 Usage Guide

### Basic Workflow

1. **Open the popup**: Click the AllowList icon in your toolbar
2. **Add your first site**: 
   - Click "Allow current site" on the page you want to allow, OR
   - Type a domain (e.g., `github.com`) and click Add
3. **Enable blocking**: Make sure the toggle is ON
4. **Test it**: Try navigating to a non-allowlisted site (you'll see a block page)
5. **Add more sites**: Repeat as needed

### Creating a Focused Work Session

1. Click "New list" and name it (e.g., "Client X Project")
2. Add only the essential tools you need:
   - Email: `gmail.com`
   - Project management: `asana.com`, `monday.com`
   - Code repositories: `github.com`
   - Documentation: `docs.google.com`
3. Switch to this list when starting focused work
4. Use `Cmd/Ctrl+Shift+K` to quickly toggle between lists

### Advanced: Entry Types

**Add a specific subdomain only:**
```
Type: news.bbc.co.uk (classifies as subdomain)
Result: Only news.bbc.co.uk is allowed, not www.bbc.co.uk
```

**Add a specific URL path:**
```
Type: https://github.com/user/project/issues
Result: Only that specific page is allowed
```

**Add all domains with a TLD (advanced):**
```
Type: .gov
Result: Allows all .gov domains
```

---

## 🔌 Installation from Source

### Requirements
- Chrome 88+ or Edge 88+
- Basic knowledge of Chrome extensions (for dev mode)

### Steps

```bash
# 1. Clone or download the repository
git clone https://github.com/yourusername/allowlist-extension.git
cd allowlist-extension

# 2. Open Chrome Extensions page
# chrome://extensions (or edge://extensions)

# 3. Enable Developer Mode
# Toggle "Developer mode" in top-right corner

# 4. Click "Load unpacked"
# Select the project folder

# Done! The extension is now installed
```

---

## 🎯 Use Cases

### 👨‍💼 For Professionals
- **Focus mode**: Block all distractions during deep work
- **Client work**: Switch to client-specific allowlist with only necessary tools
- **Meeting prep**: Quickly switch to a list with just communication tools

### 👨‍🎓 For Students
- **Study sessions**: Pre-built "Learning" list with educational resources
- **Exam prep**: Ultra-minimal list with only essential reference sites
- **Research**: "Research" preset with academic databases

### 💻 For Developers
- **Coding focus**: "Deep Work" preset with GitHub, StackOverflow, MDN
- **Code review**: Switch to focused list during PR reviews
- **DevOps**: Separate list for infrastructure and deployment tools

### ✍️ For Writers
- **Writing mode**: Allows only writing tools and research sites
- **Research mode**: Academic resources and reference materials
- **Publishing**: Minimal list with just publishing platforms

---

## 📋 Preset Allowlists

AllowList includes five pre-built allowlists to get you started:

### 🎓 Learning
```
github.com, stackoverflow.com, mdn.mozilla.org, wikipedia.org,
coursera.org, udemy.com, khanacademy.org, google.com, docs.google.com
```

### 💼 Work
```
gmail.com, google.com, docs.google.com, sheets.google.com, notion.so,
slack.com, teams.microsoft.com, zoom.us, github.com, gitlab.com
```

### 🔬 Deep Work
```
github.com, gitlab.com, stackoverflow.com, mdn.mozilla.org, docs.google.com
```

### 🎨 Creative
```
figma.com, dribbble.com, behance.net, adobe.com, github.com, fonts.google.com
```

### 📚 Research
```
scholar.google.com, researchgate.net, arxiv.org, jstor.org,
pubmed.ncbi.nlm.nih.gov, wikipedia.org
```

---

## 🛠️ Advanced Configuration

### Custom Keyboard Shortcuts

To change keyboard shortcuts:
1. Go to `chrome://extensions/shortcuts`
2. Find "AllowList" in the list
3. Click the keyboard icon for each command
4. Enter your preferred shortcut

### Import/Export Allowlists

(Feature coming in v2.0)

### Chrome Sync

AllowList automatically syncs your allowlists across all devices where you're signed into Chrome:
- Changes on one device appear on others within seconds
- Requires Chrome sync to be enabled in your account settings

---

## ⚙️ Technical Details

### Permissions

AllowList requests only these permissions:

- `declarativeNetRequest`: Block/allow websites
- `storage`: Save your allowlists
- `tabs`: Read current tab URL when you click "Add current site"
- `webNavigation`: Track blocked navigation attempts for analytics

### APIs Used

- **Chrome Storage Sync API**: Cross-device synchronization
- **Chrome Declarative Net Request API**: Efficient blocking
- **Chrome Tabs API**: Get active tab information
- **Chrome Web Navigation API**: Track blocked requests

### Why These Permissions?

- **No content script injection**: Doesn't inject code into web pages
- **No request logging**: Doesn't capture or log your requests
- **Minimal scope**: Only the permissions needed for core functionality

---

## 🐛 Troubleshooting

### "I'm not seeing the block page"
- Ensure the toggle is ON (not OFF)
- Check if you're visiting a site in your allowlist
- Try adding a test site and visiting it

### "My allowlists aren't syncing across devices"
- Make sure Chrome Sync is enabled in your account settings
- Wait a few seconds; sync is not instant
- Try signing out and back into Chrome

### "The keyboard shortcut isn't working"
- Verify the shortcut isn't already taken by another extension or Chrome
- Configure custom shortcuts at `chrome://extensions/shortcuts`
- Try a different key combination

### "I accidentally enabled the toggle and can't access anything"
- Open Developer Tools (F12) and run: `chrome.storage.sync.set({enabled: false})`
- Or, disable the extension temporarily, then re-enable it
- Open a new tab while the extension is disabled to quickly reset

---

## 📞 Support & Feedback

- **Report bugs**: [GitHub Issues](https://github.com/yourusername/allowlist-extension/issues)
- **Feature requests**: [GitHub Discussions](https://github.com/yourusername/allowlist-extension/discussions)
- **Email**: support@allowlistextension.com (coming soon)

---

## 📄 License

AllowList is free and open-source software. Licensed under [MIT License](LICENSE).

---

## 🙏 Acknowledgments

Built with:
- Chrome Web APIs (declarativeNetRequest, Storage, Tabs, WebNavigation)
- Pure JavaScript (no external dependencies)
- Thoughtful UX design for maximum productivity

---

## 🚀 Roadmap

### v1.1 (Next)
- ✨ Import/Export allowlists
- 📱 Mobile-friendly dashboard
<!-- - 🎨 Custom color themes -->
<!-- - 🔐 Password-protected allowlists -->

### v2.0 (Future)
<!-- - 👥 Team/family allowlists with sharing -->
- 📅 Scheduled blocking (e.g., 9-5 work mode)
- 🤖 Smart recommendations based on time of day
- 📧 Email digest of focus metrics

---

## 💡 Tips for Best Results

1. **Start minimal**: Begin with just essential sites, add more as needed
2. **Use multiple lists**: Create context-specific lists for different modes
3. **Keyboard shortcuts**: Learn the shortcuts—they save time
4. **Weekly review**: Check analytics to see what actually helped your focus
5. **Adjust regularly**: Your needs change; so should your allowlists
6. **Go dark**: Use the ultra-minimal list for deepest focus sessions

---

**Block distractions. Reclaim your focus. AllowList.**
