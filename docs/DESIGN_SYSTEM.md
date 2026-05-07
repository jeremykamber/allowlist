# AllowList Design System v1.0

**A comprehensive design system for the AllowList Chrome extension.**

Complete documentation for designers, developers, and contributors to maintain visual consistency and build cohesive user interfaces.

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Grid](#spacing--grid)
5. [Components](#components)
6. [Motion & Animation](#motion--animation)
7. [Accessibility](#accessibility)
8. [Patterns & Best Practices](#patterns--best-practices)
9. [Asset Guidelines](#asset-guidelines)

---

## Design Philosophy

### Core Principles

1. **Minimalist & Intentional** - Every element serves a purpose; no decoration
2. **Efficient & Fast** - Actions complete in milliseconds; no artificial delays
3. **Clear & Scannable** - Information hierarchy makes scanning natural
4. **Accessible by Default** - WCAG AA compliance from the start
5. **Consistent & Predictable** - Users always know what will happen
6. **Beautiful & Professional** - Premium feel without being ostentatious

### Design Values

- **Clarity** over cleverness
- **Consistency** over variety
- **Performance** over richness
- **Accessibility** over aesthetics
- **Intent** over decoration

---

## Color System

### Palette Overview

```
Primary Colors:     Blue (#3b82f6)
Success:            Green (#10b981)
Warning:            Amber (#f59e0b)
Danger:             Red (#ef4444)

Neutrals (Light):   
  Foreground:       #1f2937 (Dark gray, text)
  Secondary:        #6b7280 (Medium gray, secondary text)
  Background:       #ffffff (Pure white)
  Secondary BG:     #f9fafb (Off-white)
  Border:           #e5e7eb (Light gray)
```

### Color Definitions

#### Semantic Color Palette

| Token | Hex Value | RGB | Usage |
|-------|-----------|-----|-------|
| `--accent` | `#3b82f6` | 59, 130, 246 | Primary buttons, active states, focus rings |
| `--accent-light` | `#eff6ff` | 239, 245, 255 | Hover backgrounds, light accents, empty states |
| `--success` | `#10b981` | 16, 185, 129 | Confirmations, successful actions, badges |
| `--warning` | `#f59e0b` | 245, 158, 11 | Cautionary messages, pending states |
| `--danger` | `#ef4444` | 239, 68, 68 | Destructive actions, errors, delete states |
| `--fg` | `#1f2937` | 31, 41, 55 | Primary text, headings, primary UI text |
| `--fg-secondary` | `#6b7280` | 107, 114, 128 | Secondary text, labels, disabled text |
| `--bg` | `#ffffff` | 255, 255, 255 | Main background, surfaces |
| `--bg-secondary` | `#f9fafb` | 249, 250, 251 | Input backgrounds, secondary containers |
| `--border` | `#e5e7eb` | 229, 231, 235 | Borders, dividers, lines |

### CSS Variables

```css
:root {
  /* Primary Colors */
  --accent: #3b82f6;
  --accent-light: #eff6ff;
  
  /* Semantic Colors */
  --success: #10b981;
  --warning: #f59e0b;
  --danger: #ef4444;
  
  /* Neutral Colors */
  --fg: #1f2937;
  --fg-secondary: #6b7280;
  --bg: #ffffff;
  --bg-secondary: #f9fafb;
  --border: #e5e7eb;
  
  /* Effects */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.1);
  --transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Color Usage Rules

**Background Colors:**
- `#ffffff` - Main surfaces (pop-ups, cards, modals)
- `#f9fafb` - Secondary containers (inputs, list items, sections)

**Text Colors:**
- `#1f2937` - Primary text (should be high contrast)
- `#6b7280` - Secondary/disabled text
- `#ffffff` - Text on colored backgrounds (buttons, badges)

**Interactive States:**
```
Rest:     border: --border,     background: --bg-secondary
Hover:    border: --accent,     background: --accent-light
Focus:    border: --accent,     background: --accent-light, box-shadow
Active:   border: --accent,     background: --accent
Disabled: border: --border,     background: --bg-secondary, opacity: 0.5
```

### Contrast Compliance

✅ All color combinations meet **WCAG AA** standards:
- Text on background: **4.5:1 minimum**
- UI components: **3:1 minimum**
- Large text: **3:1 minimum**

---

## Typography

### Font Stack

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
             Oxygen, Ubuntu, Cantarell, sans-serif;

/* Monospace for code/domains */
font-family: 'Monaco', 'Courier New', monospace;
```

**Why System Fonts?**
- Native performance (fonts already installed)
- Consistent with OS
- Zero loading delay
- Accessible to all users

### Font Weights

```css
400 /* Regular - Body text, descriptions */
500 /* Medium - Buttons, interface text */
600 /* Semibold - Labels, emphasis */
700 /* Bold - Headings, strong emphasis */
```

### Type Scale

| Element | Size | Weight | Line Height | Usage |
|---------|------|--------|-------------|-------|
| **H1 / Header Title** | 16px | 700 | 1.3 | Main popup title |
| **H2 / Section Title** | 14px | 700 | 1.3 | Section headings |
| **Body / Standard** | 13px | 400 | 1.5 | Main text, descriptions |
| **Body Small** | 12px | 400 | 1.5 | Secondary text, buttons |
| **Label** | 11px | 700 | 1.4 | Field labels, badges |
| **Caption** | 10px | 600 | 1.4 | Tiny text, hints |
| **Monospace** | 12px | 400 | 1.4 | Code, domains, technical |

### Text Styles

**Heading (H1)**
```css
font-size: 16px;
font-weight: 700;
line-height: 1.3;
color: var(--fg);
letter-spacing: 0;
```

**Body**
```css
font-size: 13px;
font-weight: 400;
line-height: 1.5;
color: var(--fg);
letter-spacing: 0;
```

**Secondary Text**
```css
font-size: 13px;
font-weight: 400;
line-height: 1.5;
color: var(--fg-secondary);
letter-spacing: 0;
```

**Label (All Caps)**
```css
font-size: 11px;
font-weight: 700;
line-height: 1.4;
color: var(--fg-secondary);
text-transform: uppercase;
letter-spacing: 0.5px;
```

**Monospace (Domains, Code)**
```css
font-family: 'Monaco', 'Courier New', monospace;
font-size: 12px;
font-weight: 400;
line-height: 1.4;
color: var(--fg);
```

---

## Spacing & Grid

### Base Unit: 8px

All spacing is built on 8px multiples for consistency and scalability.

| Scale | Size | Usage |
|-------|------|-------|
| **0** | 0px | Reset |
| **xs** | 4px | Micro-spacing (rare) |
| **sm** | 8px | Tight spacing |
| **md** | 12px | Standard spacing |
| **lg** | 16px | Generous spacing |
| **xl** | 20px | Large spacing |
| **2xl** | 24px | Extra large spacing |

### Padding Scale

```css
/* Buttons */
.btn {
  padding: 8px 12px;        /* 40px height total */
}
.btn.small {
  padding: 7px 10px;        /* Compact buttons */
}

/* Input fields */
input {
  padding: 8px 12px;        /* 40px height total */
}

/* Container padding */
.header {
  padding: 14px 16px;
}
.content {
  padding: 16px;
}
.modal-card {
  padding: 20px;
}
```

### Margin & Gaps

```css
/* Component sections */
.list-selector-section {
  margin-bottom: 16px;
}

/* Between buttons */
.quick-actions {
  gap: 8px;
  margin-bottom: 12px;
}

/* Between list items */
.entry-item {
  margin-bottom: 6px;
  gap: 20px;               /* Between elements inside entry */
}
```

### Layout Dimensions

```css
.wrap {
  width: 500px;
  max-height: 600px;
  display: flex;
  flex-direction: column;
}

.header {
  height: ~52px;           /* Fixed */
}

.content {
  flex: 1;
  overflow-y: auto;        /* Scrollable */
  max-height: 548px;
}
```

---

## Components

### Component Structure

Every component follows this pattern:

```
1. HTML MARKUP
2. CSS STYLES (Rest state)
3. STATES (Hover, Focus, Active, Disabled)
4. VARIANTS (Sizes, Types)
5. USAGE NOTES
```

---

### Buttons

#### Primary Button

**HTML:**
```html
<button class="btn primary">Add Site</button>
```

**CSS:**
```css
.btn {
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  font-size: 12px;
  cursor: pointer;
  transition: var(--transition);
  font-family: inherit;
}

.btn.primary {
  background: var(--accent);
  color: white;
}

.btn.primary:hover {
  background: #2563eb;        /* Darker blue */
}

.btn.primary:focus {
  outline: none;
  box-shadow: 0 0 0 3px var(--accent-light);
  border: 1px solid var(--accent);
}

.btn.primary:active {
  background: #1d4ed8;
}

.btn.primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

**Usage:** Main call-to-action buttons (Save, Add, Send)

---

#### Secondary Button

**CSS:**
```css
.btn.secondary {
  background: var(--bg-secondary);
  color: var(--fg);
  border: 1px solid var(--border);
}

.btn.secondary:hover {
  background: #f3f4f6;
  border-color: var(--accent);
  color: var(--fg);
}

.btn.secondary:focus {
  outline: none;
  box-shadow: 0 0 0 3px var(--accent-light);
  border-color: var(--accent);
}

.btn.secondary:active {
  background: var(--accent-light);
  border-color: var(--accent);
}
```

**Usage:** Secondary actions, less important operations

---

#### Ghost Button

**CSS:**
```css
.btn.ghost {
  background: transparent;
  color: var(--fg-secondary);
  border: 1px solid transparent;
}

.btn.ghost:hover {
  background: var(--bg-secondary);
  color: var(--fg);
}

.btn.ghost:focus {
  outline: none;
  box-shadow: 0 0 0 3px var(--accent-light);
}

.btn.ghost:active {
  background: var(--accent-light);
  color: var(--accent);
}
```

**Usage:** Cancel, dismiss, low-priority actions

---

#### Button Modifiers

```css
/* Size variant */
.btn.small {
  padding: 7px 10px;
  font-size: 11px;
}

/* Full width */
.btn.full {
  width: 100%;
}

/* Icon button */
.icon-btn {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 6px;
  color: var(--fg-secondary);
  transition: var(--transition);
}

.icon-btn:hover {
  background: var(--bg-secondary);
  color: var(--fg);
}
```

---

### Input Fields

**HTML:**
```html
<input type="text" class="add-input" placeholder="github.com" />
```

**CSS:**
```css
input[type="text"],
textarea {
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font: inherit;
  font-size: 12px;
  color: var(--fg);
  background: var(--bg);
  transition: var(--transition);
}

input:focus,
textarea:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-light);
}

input:hover:not(:focus) {
  border-color: var(--accent);
  background: var(--accent-light);
}

input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--bg-secondary);
}
```

**Height:** 40px (including border)

---

### Select Dropdown

**HTML:**
```html
<select class="list-select">
  <option>Scratchpad</option>
  <option>Work</option>
  <option>Learning</option>
</select>
```

**CSS:**
```css
.list-select {
  padding: 10px 12px;
  padding-right: 36px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font: inherit;
  font-weight: 500;
  font-size: 13px;
  color: var(--fg);
  background: var(--bg-secondary);
  cursor: pointer;
  appearance: none;
  
  /* Custom dropdown arrow */
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 12px;
  transition: var(--transition);
}

.list-select:hover {
  border-color: var(--accent);
  background-color: var(--accent-light);
}

.list-select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-light);
}
```

---

### Toggle Switch

**HTML:**
```html
<label class="switch">
  <input type="checkbox" id="enabled-toggle" />
  <span class="slider"></span>
</label>
```

**CSS:**
```css
.switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  border-radius: 12px;
  transition: var(--transition);
}

.slider:before {
  position: absolute;
  content: '';
  height: 20px;
  width: 20px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  border-radius: 50%;
  transition: var(--transition);
}

input:checked + .slider {
  background-color: var(--accent);
}

input:checked + .slider:before {
  transform: translateX(16px);
}
```

**States:**
- **Off:** Gray (#ccc) with knob on left
- **On:** Blue (--accent) with knob on right

---

### Badges

**HTML:**
```html
<span class="badge">Domain</span>
<span class="badge success">✓ Added</span>
<span class="badge danger">✕ Error</span>
```

**CSS:**
```css
.badge {
  display: inline-block;
  padding: 3px 6px;
  background: var(--accent);
  color: white;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  text-align: center;
  white-space: nowrap;
}

.badge.success {
  background: var(--success);
}

.badge.warning {
  background: var(--warning);
}

.badge.danger {
  background: var(--danger);
}

/* Entry type badge */
.entry-type {
  padding: 3px 6px;
  width: 80px;
  background: var(--accent);
  color: white;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  text-align: center;
  text-transform: capitalize;
  flex-shrink: 0;
}
```

---

### Cards / Entry Items

**HTML:**
```html
<ul class="entries-list">
  <li class="entry-item">
    <span class="entry-type">Domain</span>
    <span class="entry-value">github.com</span>
    <span class="entry-spacer"></span>
    <button class="entry-edit">✎</button>
    <button class="entry-copy">📋</button>
    <button class="entry-delete">✕</button>
  </li>
</ul>
```

**CSS:**
```css
.entries-list {
  list-style: none;
}

.entry-item {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 10px 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 6px;
  margin-bottom: 6px;
  transition: var(--transition);
}

.entry-item:hover {
  border-color: var(--accent);
  background: var(--accent-light);
}

.entry-value {
  flex: 1;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.entry-spacer {
  flex: 1;
}

.entry-edit,
.entry-copy,
.entry-delete {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  color: var(--fg-secondary);
  padding: 4px 6px;
  border-radius: 4px;
  transition: var(--transition);
  flex-shrink: 0;
}

.entry-edit:hover,
.entry-copy:hover {
  background: rgba(0, 0, 0, 0.1);
  color: var(--fg);
}

.entry-delete:hover {
  color: var(--danger);
}
```

---

### Modals

**HTML:**
```html
<div id="edit-entry-modal" class="modal hidden">
  <div class="modal-bg"></div>
  <div class="modal-card">
    <div class="modal-header">
      <div class="modal-title">Edit Entry</div>
      <button class="modal-close">✕</button>
    </div>
    <input type="text" placeholder="New value" />
    <div style="display: flex; gap: 8px; margin-top: 16px;">
      <button class="btn primary" style="flex: 1;">Save</button>
      <button class="btn ghost" style="flex: 1;">Cancel</button>
    </div>
  </div>
</div>
```

**CSS:**
```css
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal.hidden {
  display: none;
}

.modal-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  cursor: pointer;
}

.modal-card {
  position: relative;
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: var(--shadow-md);
  max-width: 400px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.modal-title {
  font-weight: 700;
  font-size: 14px;
}

.modal-close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: var(--fg-secondary);
  padding: 4px 8px;
  border-radius: 4px;
  transition: var(--transition);
}

.modal-close:hover {
  background: var(--bg-secondary);
  color: var(--fg);
}
```

---

### Toast Notifications

**HTML:**
```html
<div id="toast" class="toast hidden">Added github.com</div>
```

**CSS:**
```css
.toast {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--fg);
  color: white;
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 12px;
  z-index: 2000;
  animation: toast-in 0.2s ease-out;
}

.toast.hidden {
  display: none;
}

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
```

**Messages:**
- "Added github.com"
- "Removed github.com"
- "Updated"
- "Copied to clipboard"
- "Invalid entry"
- "List already exists"

---

### Empty States

**HTML:**
```html
<div id="empty-state" class="empty-state">
  <div class="empty-icon">✨</div>
  <div class="empty-text">No sites yet</div>
  <div class="empty-sub">Add your first allowed site</div>
</div>
```

**CSS:**
```css
.empty-state {
  text-align: center;
  padding: 24px 16px;
  color: var(--fg-secondary);
}

.empty-state.hidden {
  display: none;
}

.empty-icon {
  font-size: 32px;
  margin-bottom: 8px;
  display: block;
}

.empty-text {
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--fg);
  font-size: 13px;
}

.empty-sub {
  font-size: 11px;
  color: var(--fg-secondary);
}
```

---

## Motion & Animation

### Transition Timing

```css
--transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
```

**Properties:**
- Duration: `0.2s` (fast, responsive)
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)` (Material Design standard)

**Applied to:**
- `background-color`
- `border-color`
- `color`
- `box-shadow`
- `transform`

### Animation Examples

**Button Hover:**
```css
.btn {
  transition: var(--transition);
}

.btn:hover {
  background-color: /* new color */;
  box-shadow: /* elevation */;
}
```

**Toggle Switch:**
```css
.slider {
  transition: var(--transition);
}

.slider:before {
  transition: var(--transition);
}

input:checked + .slider:before {
  transform: translateX(16px);
}
```

**Toast Entry:**
```css
@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.toast {
  animation: toast-in 0.2s ease-out;
}
```

### Principles

✅ **DO:**
- Keep animations under 0.3s
- Use easing for natural motion
- Animate only necessary properties
- Provide visual feedback

❌ **DON'T:**
- Animate for decoration
- Use long durations (>0.5s)
- Overuse animations
- Animate without user interaction

---

## Accessibility

### WCAG AA Compliance

✅ **Color Contrast**
- Body text on background: **4.5:1 minimum**
- UI components: **3:1 minimum**
- Large text: **3:1 minimum**

✅ **Focus Indicators**
- All interactive elements visible when focused
- Minimum 2px outline or box-shadow
- Never remove focus indicator

✅ **Keyboard Navigation**
- Tab order is logical
- All buttons accessible via keyboard
- Modals trap focus appropriately

✅ **Screen Readers**
- Semantic HTML used throughout
- Labels associated with inputs
- ARIA labels on icon buttons

### Code Examples

**Icon Button with Label:**
```html
<button aria-label="Close dialog" class="modal-close">✕</button>
```

**Input with Label:**
```html
<label for="add-input">Add website:</label>
<input id="add-input" type="text" placeholder="domain.com" />
```

**Dropdown with Label:**
```html
<label for="list-select">Active List:</label>
<select id="list-select">
  <option>Scratchpad</option>
  <option>Work</option>
</select>
```

**Form Group:**
```html
<fieldset>
  <legend>Create New List</legend>
  <input type="text" placeholder="List name" />
</fieldset>
```

---

## Patterns & Best Practices

### Button States Matrix

```
PRIMARY BUTTON:
├─ Rest:     Blue bg, white text
├─ Hover:    Darker blue bg
├─ Focus:    Blue bg + light blue shadow
├─ Active:   Very dark blue
└─ Disabled: Gray bg, 50% opacity

SECONDARY BUTTON:
├─ Rest:     Light gray bg, border, dark text
├─ Hover:    Light gray bg, blue border
├─ Focus:    Blue border + light blue shadow
├─ Active:   Light blue bg
└─ Disabled: Gray bg, 50% opacity

GHOST BUTTON:
├─ Rest:     Transparent, gray text
├─ Hover:    Light gray bg, dark text
├─ Focus:    Light blue shadow
├─ Active:   Light blue bg, blue text
└─ Disabled: Transparent, 50% opacity
```

### Form Fields

```
INPUT FIELD:
├─ Rest:     Light gray bg, gray border, dark text
├─ Hover:    Light gray bg, blue border
├─ Focus:    Light blue bg, blue border, blue shadow
├─ Filled:   Light gray bg, gray border, dark text
├─ Error:    Light red bg, red border, red text
└─ Disabled: Light gray bg, gray text, 50% opacity
```

### Component Sizing

| Component | Width | Height | Padding |
|-----------|-------|--------|---------|
| Button | Variable | 40px | 8px 12px |
| Small Button | Variable | 32px | 7px 10px |
| Input | Variable | 40px | 8px 12px |
| Select | Variable | 40px | 10px 12px |
| Toggle | 40px | 24px | N/A |
| Entry Item | 100% | ~40px | 10px 12px |
| Modal | 400px max | Variable | 20px |

### Layout Constraints

```
Popup:
  Width:       500px (fixed)
  Min Height:  400px
  Max Height:  600px

Header:
  Height:      ~52px (fixed)
  Padding:     14px 16px

Content:
  Padding:     16px
  Flex:        1 (scrollable)

Modal Card:
  Width:       400px max (90% on small)
  Padding:     20px
  Border Radius: 12px
```

---

## Asset Guidelines

### Icons

**Size Standards:**
- Small: 12px (inline, badges)
- Medium: 16px (standard UI)
- Large: 18px (buttons, modals)
- XL: 24px (header)
- 2XL: 32px (empty states)

**Style:**
- Outline style (not filled)
- 1.5-2px stroke width
- Clear and simple
- No gradient or effects

**Color:**
- Inherit from context
- Usually `--fg` or `--fg-secondary`
- White on colored backgrounds

### Images

- Format: PNG with transparency
- Resolution: @2x (2x pixel density)
- Optimize for web (PNG compression)
- No JPEG for icons/UI elements

### Logos & Branding

- The AllowList logo is a blue checkmark
- Do not modify logo proportions
- Always provide clear space around logo
- Use logo icon only in specific contexts

---

## Quick Reference

### Colors
```css
Primary:    #3b82f6 (Blue)
Success:    #10b981 (Green)
Warning:    #f59e0b (Amber)
Danger:     #ef4444 (Red)
Text:       #1f2937 (Dark gray)
Border:     #e5e7eb (Light gray)
```

### Spacing
```
Base: 8px
Components: 12px
Sections: 16px
Modals: 20px
```

### Typography
```
Heading: 16px / 700
Body: 13px / 400 / 1.5
Small: 12px / 400
Label: 11px / 700 (uppercase)
```

### Timing
```
All transitions: 0.2s
Easing: cubic-bezier(0.4, 0, 0.2, 1)
```

### Border Radius
```
Buttons: 6px
Modals: 12px
Inputs: 6px
```

---

## Component Checklist

When creating or updating components, verify:

- [ ] Uses CSS variables (no hardcoded colors)
- [ ] Spacing follows 8px grid
- [ ] Border radius consistent with type
- [ ] Transition = 0.2s cubic-bezier(0.4, 0, 0.2, 1)
- [ ] Focus state visible (shadow or outline)
- [ ] Hover state differs from rest state
- [ ] Color contrast ≥ 4.5:1
- [ ] Semantic HTML used
- [ ] Touch targets ≥ 32px × 32px
- [ ] Tested on light background
- [ ] No accessibility violations
- [ ] Component responsive (or explicitly fixed)

---

## Design System Versioning

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Nov 2024 | Initial design system |

---

## Support & Questions

For questions about this design system, refer to:
- Project Repository: [GitHub Link]
- Design Files: [Figma/Design Tool Link]
- Maintainer: [Contact Info]

---

**Document Status:** ✅ Complete & Production Ready  
**Last Updated:** November 2024  
**Next Review:** Q1 2025
