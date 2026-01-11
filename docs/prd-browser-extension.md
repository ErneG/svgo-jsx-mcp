# Product Requirements Document: SVGO JSX Browser Extension

**Version:** 1.0
**Date:** 2026-01-11
**Status:** Draft

---

## 1. Overview

### 1.1 Product Summary

The SVGO JSX Browser Extension brings the power of SVG optimization and multi-framework code generation directly into the browser. Users can right-click any SVG on a webpage, optimize it instantly, and export it as optimized SVG or framework-ready components (React, Vue, Svelte, Web Components).

### 1.2 Problem Statement

Currently, users must:

1. Manually download SVGs from websites
2. Navigate to the SVGO JSX web application
3. Upload or paste the SVG content
4. Copy the optimized output

This workflow is friction-heavy for developers who frequently work with SVGs from design tools, icon libraries, and web assets.

### 1.3 Solution

A browser extension that provides:

- One-click SVG optimization from any webpage
- Context menu integration for seamless workflow
- Popup interface for quick conversions
- Direct code generation for multiple frameworks

### 1.4 Target Users

- **Frontend Developers** - Need framework-ready SVG components
- **UI/UX Designers** - Optimize SVGs before handoff
- **Web Developers** - Reduce SVG file sizes for performance
- **Icon Library Users** - Quickly grab optimized icons from sources like Heroicons, Lucide, etc.

---

## 2. Goals & Success Metrics

### 2.1 Goals

| Priority | Goal                                                                  |
| -------- | --------------------------------------------------------------------- |
| P0       | Enable one-click SVG optimization from any webpage                    |
| P0       | Generate framework-specific code (React, Vue, Svelte, Web Components) |
| P1       | Provide seamless authentication with existing SVGO JSX accounts       |
| P1       | Support offline optimization for basic operations                     |
| P2       | Sync preferences and history with web application                     |

### 2.2 Success Metrics

| Metric                  | Target                | Measurement         |
| ----------------------- | --------------------- | ------------------- |
| Weekly Active Users     | 1,000+ in 6 months    | Extension analytics |
| Optimization Rate       | 80%+ success rate     | API logs            |
| User Retention          | 40% monthly retention | User tracking       |
| Chrome Web Store Rating | 4.5+ stars            | Store reviews       |

---

## 3. Features & Requirements

### 3.1 Core Features (MVP - Phase 1)

#### 3.1.1 Context Menu Integration

**Description:** Right-click on any SVG element or SVG file link to access optimization options.

**Requirements:**

- [ ] Detect SVG elements on page (`<svg>`, `<img src="*.svg">`, `<object>`)
- [ ] Show "Optimize with SVGO JSX" context menu item
- [ ] Extract SVG content from various sources (inline, external URL, data URI)
- [ ] Handle CORS restrictions with user-friendly error messages

**Acceptance Criteria:**

- User right-clicks SVG → sees optimization option
- Works on inline SVGs, img tags with SVG src, and object embeds
- Gracefully handles cross-origin SVGs with clear messaging

#### 3.1.2 Popup Interface

**Description:** Click the extension icon to open a popup for manual SVG input and quick actions.

**Requirements:**

- [ ] Text area for pasting SVG code
- [ ] File drop zone for .svg files
- [ ] Format selector (SVG, React, Vue, Svelte, Web Component)
- [ ] One-click copy to clipboard
- [ ] Optimization statistics display (before/after size)
- [ ] Dark/light theme matching browser preference

**UI Components:**

```
┌─────────────────────────────────┐
│  SVGO JSX                   [×] │
├─────────────────────────────────┤
│  [Paste SVG or drop file here]  │
│  ┌─────────────────────────────┐│
│  │                             ││
│  │     Drop Zone / Input       ││
│  │                             ││
│  └─────────────────────────────┘│
├─────────────────────────────────┤
│  Output Format: [React ▼]       │
├─────────────────────────────────┤
│  ┌─────────────────────────────┐│
│  │     Optimized Output        ││
│  └─────────────────────────────┘│
│  📊 2.4KB → 1.1KB (54% smaller) │
├─────────────────────────────────┤
│  [Copy Code]  [Download]  [⚙️]  │
└─────────────────────────────────┘
```

#### 3.1.3 Page Scanner

**Description:** Scan the current page for all SVGs and batch optimize them.

**Requirements:**

- [ ] "Scan Page for SVGs" button in popup
- [ ] Display list of found SVGs with thumbnails
- [ ] Select individual or all SVGs for optimization
- [ ] Batch download as ZIP or individual files
- [ ] Show optimization potential (estimated savings)

#### 3.1.4 Quick Actions

**Description:** Keyboard shortcuts and quick actions for power users.

**Requirements:**

- [ ] `Alt+Shift+O` - Optimize selected/copied SVG
- [ ] `Alt+Shift+S` - Open page scanner
- [ ] Configurable shortcuts in settings
- [ ] Toast notifications for quick feedback

### 3.2 Authentication & API Integration (Phase 2)

#### 3.2.1 Account Connection (Optional)

**Requirements:**

- [ ] Optional "Sign in with SVGO JSX" for history sync
- [ ] Works fully without authentication
- [ ] No usage limits or restrictions

#### 3.2.2 API Communication

**Requirements:**

- [ ] Use existing `/api/v1/optimize` endpoint
- [ ] Fallback to offline SVGO when API unavailable
- [ ] Queue optimization requests during offline periods

### 3.3 Advanced Features (Phase 3)

#### 3.3.1 Offline Mode

**Requirements:**

- [ ] Bundle SVGO core for offline optimization
- [ ] Cache optimization presets locally
- [ ] Sync when back online

#### 3.3.2 History & Favorites

**Requirements:**

- [ ] Store last 50 optimized SVGs locally
- [ ] Star/favorite frequently used optimizations
- [ ] Sync history with web app (authenticated users)
- [ ] Export history as JSON

#### 3.3.3 Custom Presets

**Requirements:**

- [ ] Create named optimization presets
- [ ] Configure SVGO plugins per preset
- [ ] Share presets via URL
- [ ] Import presets from web app

#### 3.3.4 Developer Tools Integration

**Requirements:**

- [ ] DevTools panel for SVG inspection
- [ ] Highlight SVGs on page
- [ ] Show optimization suggestions per SVG
- [ ] Export optimized SVGs to local filesystem

---

## 4. Technical Architecture

### 4.1 Extension Structure

```
extension/
├── manifest.json          # Extension manifest (v3)
├── src/
│   ├── background/
│   │   └── service-worker.ts    # Background service worker
│   ├── content/
│   │   └── content-script.ts    # Page content script
│   ├── popup/
│   │   ├── Popup.tsx            # Main popup component
│   │   └── index.html           # Popup HTML
│   ├── options/
│   │   └── Options.tsx          # Settings page
│   ├── devtools/
│   │   └── panel.tsx            # DevTools panel
│   ├── shared/
│   │   ├── api.ts               # API client
│   │   ├── storage.ts           # Chrome storage wrapper
│   │   └── optimizer.ts         # Offline SVGO wrapper
│   └── types/
│       └── index.ts             # TypeScript types
├── public/
│   ├── icons/                   # Extension icons
│   └── _locales/               # i18n translations
└── vite.config.ts              # Build configuration
```

### 4.2 Technology Stack

| Component     | Technology             | Rationale                  |
| ------------- | ---------------------- | -------------------------- |
| Framework     | React 19               | Consistency with web app   |
| Build Tool    | Vite + CRXJS           | Fast builds, HMR support   |
| Styling       | Tailwind CSS v4        | Consistency with web app   |
| State         | Zustand                | Lightweight, simple API    |
| Storage       | Chrome Storage API     | Sync across devices        |
| API Client    | Fetch + TanStack Query | Caching, retries           |
| Offline SVG   | SVGO (bundled)         | Core optimization offline  |
| UI Components | Radix UI               | Accessibility, consistency |

### 4.3 Manifest V3 Configuration

```json
{
  "manifest_version": 3,
  "name": "SVGO JSX - SVG Optimizer",
  "version": "1.0.0",
  "description": "Optimize SVGs and generate React, Vue, Svelte components instantly",
  "permissions": ["activeTab", "contextMenus", "storage", "clipboardWrite"],
  "optional_permissions": ["downloads"],
  "host_permissions": ["https://svgo-jsx.example.com/*"],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon-16.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png"
    }
  },
  "background": {
    "service_worker": "service-worker.js",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content-script.js"],
      "run_at": "document_idle"
    }
  ],
  "icons": {
    "16": "icons/icon-16.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  }
}
```

### 4.4 API Integration

```typescript
// API endpoints used by extension
const API_ENDPOINTS = {
  optimize: "POST /api/v1/optimize",
  batch: "POST /api/v1/batch",
  convert: "POST /api/v1/convert",
};

// Extension uses bundled SVGO for offline/fallback optimization
// No rate limits or restrictions
```

---

## 5. User Experience

### 5.1 User Flows

#### Flow 1: Right-Click Optimization

```
1. User browses webpage with SVGs
2. Right-clicks on an SVG element
3. Selects "Optimize with SVGO JSX" → "React Component"
4. Extension extracts SVG, sends to API
5. Toast notification: "Copied React component to clipboard!"
6. User pastes into their code
```

#### Flow 2: Popup Quick Convert

```
1. User copies SVG code from Figma/design tool
2. Clicks extension icon
3. Pastes SVG into input area
4. Selects "Vue" from format dropdown
5. Clicks "Copy Code"
6. Pastes Vue SFC into project
```

#### Flow 3: Page Scan & Batch Export

```
1. User visits icon library (e.g., heroicons.com)
2. Opens extension popup
3. Clicks "Scan Page for SVGs"
4. Sees list of 24 icons found
5. Selects 10 icons needed
6. Clicks "Download as React Components"
7. Receives ZIP with 10 .tsx files
```

### 5.2 Error Handling

| Error         | User Message                                                                            | Action                   |
| ------------- | --------------------------------------------------------------------------------------- | ------------------------ |
| CORS blocked  | "Can't access this SVG due to security restrictions. Try copying the SVG code instead." | Show copy instructions   |
| Invalid SVG   | "This doesn't look like valid SVG. Check for syntax errors."                            | Highlight error location |
| Network error | "Can't connect to server. Using offline mode."                                          | Switch to offline SVGO   |
| API error     | "Something went wrong. Try again?"                                                      | Retry button             |

### 5.3 Notifications

- **Success:** Green toast, auto-dismiss 3s
- **Warning:** Yellow toast, manual dismiss
- **Error:** Red toast, manual dismiss with action button
- **Progress:** Blue toast with spinner for batch operations

---

## 6. Browser Support

### 6.1 Primary Targets

| Browser | Version | Priority |
| ------- | ------- | -------- |
| Chrome  | 120+    | P0       |
| Edge    | 120+    | P0       |
| Firefox | 115+    | P1       |
| Safari  | 17+     | P2       |

### 6.2 Platform Support

- Windows 10/11
- macOS 12+
- Linux (Chrome/Firefox)

---

## 7. Security & Privacy

### 7.1 Security Measures

- [ ] No inline script execution (CSP compliant)
- [ ] Sanitize all SVG content before display
- [ ] Store API keys in encrypted chrome.storage
- [ ] Use HTTPS-only for API communication
- [ ] Validate all user inputs

### 7.2 Privacy Policy

- **Data Collected:**
  - SVG content (sent to API for optimization, not stored)
  - Usage analytics (anonymous, opt-out available)
  - Account email (if signed in)

- **Data Not Collected:**
  - Browsing history
  - Personal information
  - Page content beyond SVGs

### 7.3 Permissions Justification

| Permission       | Reason                           |
| ---------------- | -------------------------------- |
| `activeTab`      | Access current page to find SVGs |
| `contextMenus`   | Add right-click menu options     |
| `storage`        | Save preferences and history     |
| `clipboardWrite` | Copy optimized code              |

---

## 9. Localization

### 9.1 Phase 1 Languages

| Language | Code | Priority |
| -------- | ---- | -------- |
| English  | en   | P0       |
| Latvian  | lv   | P0       |

### 9.2 Phase 2 Languages

| Language | Code | Priority |
| -------- | ---- | -------- |
| German   | de   | P1       |
| Spanish  | es   | P1       |
| French   | fr   | P1       |

---

## 10. Implementation Phases

### Phase 1: MVP (4-6 weeks)

**Goal:** Core optimization functionality

- [ ] Extension scaffold with Vite + React
- [ ] Popup UI with paste/drop input
- [ ] Context menu integration (basic)
- [ ] API integration (public endpoint)
- [ ] Format selection (SVG, React, Vue, Svelte, Web Component)
- [ ] Copy to clipboard
- [ ] Basic error handling
- [ ] Chrome Web Store submission

**Deliverable:** Working extension in Chrome Web Store

### Phase 2: Authentication & Polish (3-4 weeks)

**Goal:** User accounts and enhanced UX

- [ ] OAuth flow with SVGO JSX
- [ ] API key management
- [ ] Page scanner feature
- [ ] Keyboard shortcuts
- [ ] Improved SVG detection (img, object, use)
- [ ] Toast notification system
- [ ] Dark/light theme
- [ ] Firefox port

**Deliverable:** Authenticated extension with page scanning

### Phase 3: Advanced Features (4-5 weeks)

**Goal:** Power user features

- [ ] Offline mode with bundled SVGO
- [ ] History and favorites
- [ ] Custom presets
- [ ] DevTools panel
- [ ] Batch export to ZIP
- [ ] Settings sync
- [ ] Safari port

**Deliverable:** Full-featured extension on all major browsers

---

## 11. Success Criteria

### 11.1 Launch Criteria (MVP)

- [ ] All Phase 1 features complete
- [ ] 95%+ test coverage on core functions
- [ ] Chrome Web Store review approved
- [ ] No critical bugs in 48-hour internal testing
- [ ] Documentation complete

### 11.2 Post-Launch Goals (30 days)

- [ ] 500+ installs
- [ ] 4.0+ star rating
- [ ] <1% crash rate
- [ ] <2s average optimization time
- [ ] Community feedback addressed

---

## 12. Risks & Mitigations

| Risk                       | Impact | Probability | Mitigation                             |
| -------------------------- | ------ | ----------- | -------------------------------------- |
| Manifest V3 limitations    | High   | Medium      | Design with service worker constraints |
| CORS blocking SVGs         | Medium | High        | Clear user messaging, copy fallback    |
| Chrome Web Store rejection | High   | Low         | Follow all policies, thorough review   |
| Large SVG performance      | Medium | Medium      | Size limits, streaming optimization    |

---

## 13. Open Questions

1. **Branding:** Use "SVGO JSX" name or create extension-specific brand?
2. **Offline Priority:** How critical is offline mode for MVP?
3. **Analytics:** Which analytics provider (if any) for usage tracking?
4. **Store Presence:** Submit to all stores simultaneously or phase rollout?

---

## 14. Appendix

### A. Competitive Analysis

| Extension   | Strengths     | Weaknesses             |
| ----------- | ------------- | ---------------------- |
| SVG Export  | Simple, fast  | No framework output    |
| SVGOMG      | Feature-rich  | Web-only, no extension |
| SVG Grabber | Page scanning | No optimization        |

### B. Related Documents

- [AGENTS.md](/AGENTS.md) - Development guidelines
- [README.md](/README.md) - Project overview
- [progress.txt](/progress.txt) - Phase tracking

### C. Revision History

| Version | Date       | Author | Changes       |
| ------- | ---------- | ------ | ------------- |
| 1.0     | 2026-01-11 | -      | Initial draft |
