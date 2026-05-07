# AllowList - Product Specification Document

## Executive Summary

**AllowList** is a Chrome extension that implements a reverse-blocking model: block everything by default, allow only what users explicitly whitelist. This document provides a comprehensive overview of the product, its market positioning, features, technical architecture, and business model.

---

## 1. Product Overview

### 1.1 Problem Statement

**The Problem:**
Traditional site blockers (Freedom, Cold Turkey, LeechBlock) work by creating blocklists of distracting sites. This approach has critical flaws:

- **Decision fatigue**: Users must identify and blocklist every distraction
- **New distractions**: New tempting sites aren't blocked by default
- **Incomplete control**: Users still need to research which sites to block
- **Reactive vs proactive**: Blocking happens after the temptation is identified

**The AllowList Solution:**
Flip the model. Block everything by default. Users explicitly whitelist only the sites they truly need. This is:
- **Proactive**: Distractions are blocked by default
- **Decisive**: Users make intentional choices about what they need
- **Minimal**: Forces users to think about necessity, not temptation
- **Powerful**: Much harder to "just browse" if nothing is pre-approved

### 1.2 Target Market

**Ideal Customer Profile (ICP):**
- **Age**: 18-45
- **Occupation**: Knowledge workers, students, professionals, creators
- **Pain Point**: Chronic distraction, low focus quality, procrastination
- **Mindset**: Values productivity, willing to make trade-offs for better focus
- **Tech Comfort**: Comfortable using browser extensions, command line optional

**Primary Segments:**

1. **Students** (40% of target)
   - Need exam/project focus modes
   - Value preset templates (Learning, Research)
   - Want quick switching between study modes
   - Use analytics to track study sessions

2. **Professionals/Remote Workers** (35% of target)
   - Need distinct Work/Deep Focus lists
   - Value keyboard shortcuts for quick switching
   - Benefit from cross-device sync
   - Use analytics to track productivity

3. **Developers/Programmers** (15% of target)
   - Need "Deep Work" preset optimized for coding
   - Value granular control (subdomains, specific URLs)
   - Appreciate technical transparency (open source, privacy)
   - Want to understand the implementation

4. **Writers/Content Creators** (10% of target)
   - Need distraction-free writing environments
   - Value minimal, clean UI
   - Benefit from "Writing mode" presets
   - Use analytics to track focus sessions

### 1.3 Market Positioning

**Positioning Statement:**
"For serious professionals, students, and creators who are tired of distractions, AllowList is a productivity extension that blocks everything by default and lets you whitelist only what you need. Unlike traditional blockers that require managing endless blacklists, AllowList's reverse model puts you back in control with minimal friction."

**Competitive Advantages:**
- ✅ Reverse-blocking model (unique selling point)
- ✅ Free and open-source (vs. Freedom $40/year, Cold Turkey $39)
- ✅ Chrome-native (vs. app-based solutions)
- ✅ No external servers (pure privacy)
- ✅ Preset templates for common use cases
- ✅ Multi-context list management
- ✅ Cross-device sync
- ✅ Smart entry detection (domain/URL/subdomain)

**Competitive Disadvantages:**
- Smaller team (built by one person)
- Not available for other browsers (yet)
- Newer product (no established user base)
- Basic analytics (compared to Toggl, RescueTime)

---

## 2. Core Features

### 2.1 Feature List

#### Tier 1: Essential (MVP)
- ✅ Block-by-default model with Declarative Net Request
- ✅ Add/remove/edit allowlist entries
- ✅ Multiple allowlists with quick switching
- ✅ One-click add current site
- ✅ Manual entry with smart type detection
- ✅ Keyboard shortcuts
- ✅ Scratchpad default list
- ✅ Cross-device sync

#### Tier 2: Enhanced (Current)
- ✅ Preset templates (Learning, Work, Deep Work, Creative, Research)
- ✅ Analytics dashboard with blocked/visited tracking
- ✅ Entry types: domain, subdomain, URL, origin, TLD
- ✅ List management: create, rename, delete
- ✅ Copy to clipboard functionality
- ✅ Toast notifications
- ✅ Badge showing list count or "OFF" status
- ✅ Professional UI with responsive design

#### Tier 3: Future (Roadmap)
- ⏳ Import/export allowlists (JSON)
- ⏳ Scheduled blocking (9-5 work mode)
- ⏳ Team/family sharing
- ⏳ Custom color themes
- ⏳ Password protection
- ⏳ AI-powered site recommendations
- ⏳ Slack/Discord integration
- ⏳ Email digest of focus metrics

### 2.2 Core User Flows

**Flow 1: Quick Add Current Site**
```
User → Click extension icon → Click "Allow current site"
→ Site automatically detected → Added to active list
→ Toast: "Added github.com" → User can now access github.com
```
**Time to completion**: <2 seconds
**Keyboard shortcut**: Cmd/Ctrl+Shift+L

**Flow 2: Create New Allowlist**
```
User → Click "New list" → Enter name → Empty list created
→ User adds entries manually or by current site
→ Switch to list anytime via dropdown
→ List persists in Chrome sync
```
**Time to completion**: ~5 seconds (first entry)

**Flow 3: Switch Allowlists**
```
User → Use keyboard shortcut (Cmd/Ctrl+Shift+K) → Cycles to next list
→ Rules rebuild instantly → User on new list
```
**Time to completion**: <1 second

**Flow 4: View Analytics**
```
User → Click popup → Navigate to Analytics tab
→ See blocked attempts, focus time, trends
→ Understand browsing patterns
```
**Time to completion**: ~30 seconds to review

### 2.3 Entry Types (Classification System)

AllowList intelligently classifies user input:

| Input | Classification | Allows |
|-------|-----------------|--------|
| `github.com` | Domain | github.com, www.github.com, api.github.com, any subdomain |
| `api.github.com` | Subdomain | Only api.github.com (exact match) |
| `https://github.com/user/repo` | URL | Only that specific page path |
| `https://github.com:8080` | Origin | github.com with port 8080 |
| `.edu` | TLD | All .edu domains (advanced) |

This design balances flexibility with simplicity.

---

## 3. Technical Architecture

### 3.1 Technology Stack

**Core Technologies:**
- **Framework**: Vanilla JavaScript (ES6+)
- **Blocking**: Chrome declarativeNetRequest API (MV3)
- **Storage**: chrome.storage.sync (cross-device)
- **UI**: HTML5, CSS3 (no external frameworks)
- **APIs**: Chrome Tabs, WebNavigation, Commands

**Why This Stack:**
- No external dependencies → Smaller bundle, faster load
- Native Chrome APIs → Best performance and privacy
- Manifest V3 → Future-proof, required by Chrome
- Pure JavaScript → Easy to audit, maintain, contribute

### 3.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   ALLOWLIST EXTENSION                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐         ┌──────────────┐            │
│  │   Popup UI   │         │  Background  │            │
│  │  (popup.js)  │◄───────►│  (bg.js)     │            │
│  └──────────────┘         └──────────────┘            │
│        │                         │                     │
│        │                         ├─► AllowlistRepo    │
│        │                         ├─► RulesEngine      │
│        │                         ├─► Classifier       │
│        │                         └─► Analytics        │
│        │                                              │
│        └──────────────────────────────────────────┐   │
│                                                   │   │
│  ┌─────────────────────────────────────────┐    │   │
│  │        Chrome Storage (sync)            │◄───┘   │
│  │  - Allowlists                           │        │
│  │  - Current list                         │        │
│  │  - Enabled state                        │        │
│  │  - Presets (imported once)              │        │
│  └─────────────────────────────────────────┘        │
│                                                      │
│  ┌─────────────────────────────────────────┐        │
│  │  Declarative Net Request Engine         │        │
│  │  - Rule ID: 1 → Block all               │        │
│  │  - Rules 1000+ → Allow per entry        │        │
│  │  - Priority: Allows override blocks     │        │
│  └─────────────────────────────────────────┘        │
│                                                      │
└─────────────────────────────────────────────────────────┘
```

### 3.3 Key Design Decisions

**Decision 1: Declarative Net Request vs Content Scripts**
- ✅ Chosen: Declarative Net Request
- Reasons: More efficient, doesn't inject into pages, better privacy, MV3 native
- Alternative: Content script injection (slower, riskier, deprecated)

**Decision 2: Sync Storage vs Local Storage**
- ✅ Chosen: Sync Storage
- Reasons: Cross-device sync, meets user expectations, auto-backup
- Alternative: Local storage only (user data trapped on one device)

**Decision 3: Debounced Writes vs Real-time Writes**
- ✅ Chosen: Debounced (100ms)
- Reasons: Prevents Chrome Storage quota errors on rapid changes, more efficient
- Alternative: Real-time writes (hit quota limits with fast switching)

**Decision 4: Single Background Worker vs Multiple Workers**
- ✅ Chosen: Single service worker
- Reasons: Simpler state management, lower memory overhead, MV3 best practice
- Alternative: Multiple workers (increased complexity, harder debugging)

### 3.4 State Management

**Global State Structure:**
```javascript
{
  allowlists: {
    "Scratchpad": [
      { type: "domain", value: "github.com" },
      { type: "url", value: "https://example.com/page" }
    ],
    "Work": [...],
    "Learning": [...]
  },
  current: "Work",           // Active allowlist
  enabled: true,             // Global on/off toggle
  analytics: {
    blockedAttempts: [],
    visitedAllowedSites: []
  }
}
```

**State Persistence:**
- Saved to chrome.storage.sync
- Debounced writes to avoid quota errors
- Cached in-memory with 500ms TTL for performance

### 3.5 Rules Engine

**How Blocking Works:**

1. **On Startup**: Load state from storage
2. **On List Change**: 
   - Remove all previous rules
   - Create new rules for current list
   - Update DNS/Net Request engine
3. **User Navigation**:
   - Check if URL matches any allow rule
   - If yes: Navigate allowed (allowAllRequests)
   - If no: Block (block action)
4. **Block Page**: Show friendly block message

**Rule Structure:**
```javascript
{
  id: 1,                    // Reserved for global block
  priority: 1,              // Lowest priority
  action: { type: "block" },
  condition: {
    regexFilter: "^https?://", // Match all http(s)
    resourceTypes: ["main_frame"]
  }
}

// For each allowlist entry:
{
  id: 1000+,                // Unique ID per entry
  priority: 1000,           // Higher than global block
  action: { type: "allowAllRequests" },
  condition: {
    regexFilter: "^https?://([^./:]+\\.)*github\\.com([:/]|$)",
    resourceTypes: ["main_frame"]
  }
}
```

---

## 4. User Experience Design

### 4.1 UI Components

**Popup (Main Interface)**
- **Header**: Logo + title + toggle switch
- **List Selector**: Dropdown with active indicator
- **Quick Actions**: "Add Site" and "Add Domain" buttons
- **Manual Entry**: Input field + smart type detection + Add button
- **Entries List**: Scrollable list with edit/copy/delete actions
- **Empty State**: Friendly icon + message + guidance

**Dimensions**:
- Width: 360px
- Height: Flexible (500px typical with entries)
- Max height: 600px (scrollable)

**Design System**:
- Color scheme: Blue primary (#3b82f6), gray secondary
- Spacing: 8px base unit
- Typography: System fonts (-apple-system, BlinkMacSystemFont, Segoe UI)
- Radius: 12px
- Shadow: Subtle elevation shadows

### 4.2 User Flows & Interactions

**Rapid Task Switching Scenario**:
```
9:00 AM: Switch to "Work" list
         Rule engine rebuilds in <100ms
         
9:15 AM: Deep focus needed
         Use Cmd+Shift+K → Switch to "Deep Work"
         Minimal rule set instantly active
         
2:00 PM: Back to normal work
         Use Cmd+Shift+K → Back to "Work"
```

**Study Session Scenario**:
```
Create "Exam Prep" list with only:
- google.com (for searching)
- wikipedia.org (reference)
- notes.google.com (note taking)

Enable toggle → All other sites blocked
Analytics tracks focused time
Remove distracting sites from list if tempted
```

### 4.3 Accessibility

**Keyboard Navigation:**
- Tab through all interactive elements
- Enter to activate buttons/select
- Escape to close modals
- Cmd/Ctrl+Shift+L and Cmd/Ctrl+Shift+K for main actions

**Screen Reader Support:**
- Semantic HTML (labels, headings, lists)
- ARIA labels on buttons
- Meaningful error messages
- Focus indicators visible

**Color Contrast:**
- All text ≥ WCAG AA standards (4.5:1 ratio)
- No information conveyed by color alone

---

## 5. Feature Details

### 5.1 Preset Allowlists

**Purpose**: Reduce barrier to entry for new users by providing sensible starting points.

**Presets Included:**

1. **🎓 Learning**
   - Purpose: Academic and educational research
   - Entries: GitHub, StackOverflow, MDN, Wikipedia, Coursera, Udemy, Khan Academy, Google, Google Docs
   - Use case: Students, researchers, lifelong learners

2. **💼 Work**
   - Purpose: Professional communication and productivity
   - Entries: Gmail, Google Suite, Notion, Slack, Teams, Zoom, GitHub, GitLab
   - Use case: Remote workers, office professionals, consultants

3. **🔬 Deep Work**
   - Purpose: Maximum focus for technical work
   - Entries: GitHub, GitLab, StackOverflow, MDN, Google Docs
   - Use case: Programmers, designers, knowledge workers

4. **🎨 Creative**
   - Purpose: Design and creative tool access
   - Entries: Figma, Dribbble, Behance, Adobe, GitHub, Google Fonts
   - Use case: Designers, illustrators, creative directors

5. **📚 Research**
   - Purpose: Academic research and journals
   - Entries: Google Scholar, ResearchGate, arXiv, JSTOR, PubMed, Wikipedia
   - Use case: Academic researchers, PhD students, scientists

**Implementation:**
- Imported on first install
- Not overrideable (user can duplicate if needed)
- Can be edited after import
- Cannot be deleted

### 5.2 Analytics Dashboard

**Purpose**: Provide insights into browsing patterns and productivity metrics.

**Metrics Tracked:**

1. **Blocked Attempts**
   - Hostname of blocked site
   - Date and time
   - Count per day
   - Trend over time

2. **Visited Allowed Sites**
   - Hostname of allowed site
   - Date and time
   - Visit count
   - Total time spent
   - Last visit timestamp

3. **Focus Metrics**
   - Daily blocked/allowed ratio
   - Total focus time per day
   - Streak calculations (consecutive productive days)
   - Weekly/monthly trends

4. **Achievements**
   - 🔥 X-day focus streak
   - 📈 Focus time up 10%+
   - 📉 Fewer distractions detected
   - ⏰ Over 7 hours focused

**Data Retention**: 90 days (rolling window)

**Privacy**: All data stored locally; never sent to servers

### 5.3 Keyboard Shortcuts

| Command | Default | Mac | Purpose |
|---------|---------|-----|---------|
| add-current-site | Ctrl+Shift+L | Cmd+Shift+L | Add current site to allowlist |
| cycle-allowlist | Ctrl+Shift+K | Cmd+Shift+K | Switch to next allowlist |

**Customization:**
- User can override at `chrome://extensions/shortcuts`
- No conflicts with other extensions
- Works in any tab (can override website shortcuts)

---

## 6. Business Model

### 6.1 Monetization Strategy

**Current**: Free
**Future options**:
1. **Freemium Model** (Most likely)
   - Core blocking: Free
   - Premium features: Team sharing, advanced analytics, custom themes
   - Price: $5-10/user/month for premium

2. **B2B/Enterprise** (Higher value)
   - Team allowlist templates
   - Centralized policy management
   - API for IT integration
   - Price: $5-10/user/month (minimum 10 users)

3. **Sponsorship/Ads** (Unlikely)
   - Partner with productivity tools
   - Recommend complementary products
   - Only to premium tier

**Rationale for staying free (v1)**:
- Build large user base first
- Prove product-market fit
- Data on usage informs pricing
- No infrastructure costs (no servers)

### 6.2 Distribution

**Channels:**
1. **Chrome Web Store** (Primary)
   - Category: Productivity
   - Target: 100K users by end of year 2
   - Keywords: blocker, focus, allowlist, productivity, website blocker

2. **Product Hunt** (Launch)
   - Timing: When v1.1 ships
   - Goal: 500+ upvotes, media mentions

3. **Indie Hacker Communities**
   - Show HN, Indie Hackers, Twitter
   - Focus on personal story + open source

4. **Content Marketing** (Ongoing)
   - Blog: "How to Use AllowList for Deep Work"
   - Guide: "Best Allowlists for Different Professions"
   - Tutorial videos on YouTube

5. **Organic Word-of-Mouth**
   - Build passionate small user base first
   - Users will share with peers
   - No paid marketing initially

### 6.3 Success Metrics

**V1 (Current)**:
- ✅ Product-market fit validation
- ✅ Feature completeness
- ✅ Bug-free user experience
- ✅ 100+ GitHub stars

**V1.1 (Q2 2025)**:
- 🎯 1,000+ Chrome Web Store users
- 🎯 <5% one-star reviews
- 🎯  50+ GitHub stars
- 🎯 Product Hunt featuring

**V2.0 (Q4 2025)**:
- 🎯 10,000+ Chrome Web Store users
- 🎯 Team sharing feature active
- 🎯 <3% one-star reviews
- 🎯 Launched B2B pilot

---

## 7. Competitive Analysis

### 7.1 Direct Competitors

| Product | Model | Price | Key Difference |
|---------|-------|-------|-----------------|
| **Freedom** | Blacklist | $40/year | App-based, cross-device |
| **Cold Turkey** | Blacklist | $39 | Aggressive blocking, nuke button |
| **LeechBlock NG** | Blacklist | Free | Browser extension, lightweight |
| **StayFocusd** | Blacklist | Free | Chrome extension, customizable |
| **Forest** | Gamification | Free/Paid | Gamifies focus time |
| **RescueTime** | Analytics | Free/Paid | Auto-tracking, detailed reports |

### 7.2 AllowList's Unique Value

**Whitelist Model Advantages:**
- ✅ Fundamentally different approach (reverse psychology)
- ✅ Forces intentional browsing (lower resistance)
- ✅ New distractions blocked by default (not reactive)
- ✅ Works on day 1 (no setup needed)

**Free + Open Source Advantages:**
- ✅ No subscription fatigue
- ✅ Community contributions possible
- ✅ Privacy-first (no telemetry business model)
- ✅ Appealing to developers/tech-savvy users

### 7.3 Weaknesses vs Competitors

- ❌ Chrome-only (Freedom is cross-device/OS)
- ❌ Newer product (no user base yet)
- ❌ No mobile app (most competitors have iOS/Android)
- ❌ Basic analytics (vs RescueTime's advanced tracking)

---

## 8. Roadmap

### Phase 1: MVP Polish (Current - Dec 2024)
- ✅ Core blocking functionality
- ✅ Multiple allowlists
- ✅ Keyboard shortcuts
- ✅ Basic analytics

### Phase 2: V1.1 (Jan-Mar 2025)
- Import/export functionality
- Custom color themes
- Advanced analytics
- Performance optimizations

### Phase 3: V2.0 (Apr-Jun 2025)
- Team sharing & collaboration
- Scheduled blocking (time-based modes)
- Team analytics dashboard
- Safari extension (if demand exists)

### Phase 4: V3.0 (Jul-Dec 2025)
- Mobile apps (iOS/Android)
- API for developers
- Zapier/IFTTT integration
- Paid team tier launch

---

## 9. Risk Analysis

### 9.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Chrome API changes break extension | Medium | High | Monitor Chrome updates, maintain compatibility |
| Storage quota exceeded on rapid changes | Low | Medium | Debouncing already implemented |
| Performance issues at scale | Low | High | Regular performance testing, rule optimization |
| Cross-browser incompatibility (Safari) | Low | Medium | Plan Safari port, test early |

### 9.2 Market Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Users prefer blacklist model | Low | High | Education on whitelist benefits |
| Slow adoption | Medium | High | Strong product positioning, community engagement |
| Competitor improves | High | Medium | Continuous innovation, open source advantage |
| Chrome policy changes | Low | High | Monitor policy updates, stay compliant |

### 9.3 Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Can't monetize effectively | Medium | High | Build large free user base first, validate B2B interest |
| User churn | Medium | High | Regular feature updates, strong support |
| Copyright/trademark issues | Low | High | Trademark search done, no conflicts found |

---

## 10. Success Criteria

### 10.1 Product Success
- ✅ Feature completeness for MVP
- ✅ <1% crash rate
- ✅ Average 4.5+ star rating
- ✅ <5 min first-use time

### 10.2 User Success
- ✅ Users create 2+ allowlists on average
- ✅ 70%+ activation rate (toggle on)
- ✅ 50%+ daily active usage
- ✅ Net Promoter Score >50

### 10.3 Market Success
- ✅ 10,000+ users by end of 2025
- ✅ $0 customer acquisition cost (organic)
- ✅ >50% of users recommend to friends
- ✅ Featured in major productivity communities

---

## 11. Conclusion

AllowList represents a fresh approach to a solved problem: digital distraction. By inverting the traditional blocking model and combining it with thoughtful UX design, the extension solves a real productivity problem for knowledge workers, students, and creators.

**Key Differentiators:**
1. **Whitelist-first** → Novel approach to focus
2. **Free + Open Source** → Trust and community
3. **Chrome-native** → Efficiency and privacy
4. **Pre-built templates** → Low barrier to entry
5. **Multi-list support** → Flexibility for context switching

With a clear product-market fit, solid technical foundation, and realistic growth expectations, AllowList is positioned to become the productivity blocker for serious professionals who value privacy, control, and intention over convenience.

**Next Steps:**
1. Launch on Chrome Web Store
2. Gather user feedback and metrics
3. Iterate on v1.1 features
4. Build community (GitHub, social)
5. Validate B2B interest
6. Plan for team features in v2.0
