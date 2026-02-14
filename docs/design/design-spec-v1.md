# Command Central — Design Specification v1.0

## Part 1: Design System Foundation

### Color Tokens

All values map to Tailwind classes. Custom tokens defined where Tailwind defaults don't provide the right value.

**Surface hierarchy (neutrals):**

| Token | Value | Tailwind | Usage |
|---|---|---|---|
| `surface-root` | `#0a0a0f` | Custom (near slate-950 with slight blue) | App background, "just one thing" mode |
| `surface-base` | `#0f172a` | slate-900 | Main content area background |
| `surface-raised` | `#1e293b` | slate-800 | Cards, modals, pulse rail background |
| `surface-overlay` | `#334155` | slate-700 | Hover states, active backgrounds |
| `surface-glass` | `rgba(30, 41, 59, 0.7)` | Custom | Glassmorphism panels (capture modal, dropdowns) |
| `border-subtle` | `#1e293b` | slate-800 | Default borders, dividers |
| `border-visible` | `#334155` | slate-700 | Borders that need to stand out |

**Text hierarchy:**

| Token | Value | Tailwind | Usage |
|---|---|---|---|
| `text-primary` | `#f8fafc` | slate-50 | Headlines, primary content |
| `text-secondary` | `#94a3b8` | slate-400 | Supporting text, labels, metadata |
| `text-tertiary` | `#64748b` | slate-500 | Timestamps, disabled, placeholders |
| `text-inverse` | `#0f172a` | slate-900 | Text on bright color backgrounds |

**Semantic colors (meaning-carrying):**

| Token | Value | Tailwind | Meaning |
|---|---|---|---|
| `accent-brand` | `#8b5cf6` | violet-500 | Brand identity, active states, primary actions |
| `accent-brand-hover` | `#7c3aed` | violet-600 | Brand hover state |
| `accent-brand-muted` | `rgba(139, 92, 246, 0.15)` | Custom | Brand tint backgrounds (selected list items, active nav) |
| `status-urgency-low` | `#f59e0b` | amber-500 | Approaching deadline, first escalation |
| `status-urgency-high` | `#ef4444` | red-500 | Overdue, critical escalation |
| `status-positive` | `#10b981` | emerald-500 | Complete, on track, positive trend |
| `status-positive-muted` | `rgba(16, 185, 129, 0.15)` | Custom | Positive tint backgrounds |
| `status-info` | `#38bdf8` | sky-400 | Neutral data, informational |
| `status-warning` | `#fbbf24` | amber-400 | Needs decision, not yet urgent |

**Module accents (used only within focused module views):**

| Token | Value | Tailwind | Module |
|---|---|---|---|
| `module-fitness` | `#14b8a6` | teal-500 | Fitness charts, progress rings |
| `module-projects` | `#818cf8` | indigo-400 | Project views, milestone indicators |

**Escalation gradient (applied to overdue items based on age):**

| Days overdue | Color | Token |
|---|---|---|
| 1 day | `amber-400` | `escalation-1` |
| 2-3 days | `amber-500` | `escalation-2` |
| 4-6 days | `orange-500` (`#f97316`) | `escalation-3` |
| 7+ days | `red-500` | `escalation-4` |

### Typography Scale

Font: Inter. Falls back to `system-ui, sans-serif`.

| Level | Size | Weight | Line Height | Letter Spacing | Usage |
|---|---|---|---|---|---|
| `display` | 32px / 2rem | 700 | 1.2 | -0.02em | "Just one thing" task name, empty states |
| `h1` | 24px / 1.5rem | 600 | 1.3 | -0.015em | Screen titles, section headers |
| `h2` | 20px / 1.25rem | 600 | 1.35 | -0.01em | Card titles, module headings |
| `h3` | 16px / 1rem | 600 | 1.4 | 0 | Subsection headers, pulse rail section titles |
| `body` | 14px / 0.875rem | 400 | 1.5 | 0 | Default body text, task names in lists |
| `body-medium` | 14px / 0.875rem | 500 | 1.5 | 0 | Emphasized body (task names in briefing) |
| `caption` | 12px / 0.75rem | 400 | 1.5 | 0.01em | Metadata, timestamps, secondary info |
| `overline` | 11px / 0.6875rem | 600 | 1.5 | 0.05em | Section labels, all-caps labels |

### Spacing System

Base unit: 4px. All spacing uses multiples of 4.

| Token | Value | Usage |
|---|---|---|
| `space-1` | 4px | Tight gaps (icon to label) |
| `space-2` | 8px | Default inline spacing, compact padding |
| `space-3` | 12px | Card internal padding (compact items) |
| `space-4` | 16px | Standard card padding, section gaps |
| `space-5` | 20px | Comfortable padding |
| `space-6` | 24px | Section spacing, card padding (generous) |
| `space-8` | 32px | Major section breaks |
| `space-10` | 40px | Screen-level padding |
| `space-12` | 48px | Large section dividers |
| `space-16` | 64px | Top-level layout spacing |

### Border Radius

| Token | Value | Usage |
|---|---|---|
| `radius-sm` | 6px | Chips, badges, small buttons |
| `radius-md` | 8px | Cards, inputs, standard buttons |
| `radius-lg` | 12px | Modals, larger cards, pulse rail items |
| `radius-xl` | 16px | Capture modal, "just one thing" card |
| `radius-full` | 9999px | Avatars, circular indicators, pills |

### Shadow and Glass Effects

**Shadows:**

| Token | Value | Usage |
|---|---|---|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.3)` | Subtle card lift |
| `shadow-md` | `0 4px 12px rgba(0,0,0,0.4)` | Floating elements, dropdowns |
| `shadow-lg` | `0 8px 24px rgba(0,0,0,0.5)` | Modals, capture overlay |
| `shadow-glow` | `0 0 20px rgba(139,92,246,0.15)` | Brand glow on focused/active states |

**Glass effect:**
```css
background: rgba(30, 41, 59, 0.75);
backdrop-filter: blur(16px);
border: 1px solid rgba(51, 65, 85, 0.5);
```

---

## Part 2: Component Inventory

### 2.1 Navigation Components

**Sidebar**
- Width: 240px expanded, 56px collapsed
- Background: `surface-root`
- Top: App logo/wordmark + collapse toggle
- Middle: Module nav items (icon + label expanded, icon-only collapsed)
- Bottom: Settings, profile
- Active item: `accent-brand-muted` bg, `accent-brand` left border (3px), `text-primary` label
- Inactive: `text-secondary`, hover → `text-primary` with `surface-overlay` bg

**Breadcrumb Bar**
- Top of content area, height 36px
- Segments separated by `/` in `text-tertiary`
- Current: `text-primary`, previous: `text-secondary` (clickable)

### 2.2 Briefing Components

**Briefing Item**
- Full-width card, padding `space-4` vertical / `space-5` horizontal
- Background: `surface-raised`, border 1px `border-subtle`
- Left border: 3px colored by escalation status
- Gap between items: `space-2`
- Layout: drag handle (16px) → checkbox (20px circular) → content → escalation indicator + actions
- Starred: violet left border + star icon in `accent-brand`
- Completed: checkbox `status-positive`, name `text-tertiary` + strikethrough, slides out after 1.5s

**Day Summary Bar**
- Compact, full width, `surface-raised`, height 48px
- Stat text: `caption`, `text-secondary` — "7 of 11 tasks completed"

**Escalation Bar**
- 3px height, width proportional to days overdue
- Color from escalation gradient tokens

### 2.3 Pulse Rail Components

**Container:** 300px expanded / 40px collapsed, right side, full height, `surface-root` bg
**Section headers:** `overline`, `text-tertiary`
**Items:** `surface-raised`, `space-3` padding, `radius-md`, 3px left border by urgency
**Collapsed:** vertical colored dots (8px), count badge at top
**Count badge color:** 0-2 neutral, 3-5 `status-warning` muted, 6+ `status-urgency-low` muted
**Empty state:** rail is simply empty — that's a good state

### 2.4 Capture Components

**Modal:** 600px wide, 25% from top, glass effect, `radius-xl`, `shadow-lg`
**Input:** full width, 48px height, `h2` size, transparent bg, no border
**Smart chips:** `radius-sm`, `surface-overlay` bg, `caption` text, fade+slide in 150ms
**Expanded form (Tab):** project dropdown, date picker, priority toggle, notes textarea
**Toast after capture:** bottom-center, "Captured" + "Undo" link, fades after 1.5s

### 2.5 "Just One Thing" Components

**Focus Card:** 520px wide, centered, `surface-raised`, `radius-xl`, `shadow-lg` + `shadow-glow`
**Task name:** `display` (32px bold), context line `body`/`text-secondary`
**Actions:** "Done" (`status-positive`) and "Skip" (`surface-overlay`), 48px height
**Progress:** 2px bar at viewport top + "3 of 9" text top-right
**Completion:** "Nothing left for today" in `display`, `text-secondary`

### 2.6 Shared Components

**Circular Checkbox:** 20px, 2px border, checked = `status-positive` fill + scale bounce
**Primary Button:** 40px/48px height, `accent-brand`, `radius-md`, `body-medium`
**Snooze Selector:** glass popover, 3 options (Later today / Tomorrow / Next week), shows snooze count
**Empty State:** centered icon (48px `text-tertiary`) + message (`h2` `text-secondary`), no illustrations

---

## Part 3: Screen-by-Screen Specifications

### 3.1 Evening Planning Screen

Auto-triggers after 6pm (configurable). Single scrollable screen, not a wizard.

**Section: TODAY (rearview mirror)**
- Completed items: checked, `text-tertiary` + strikethrough, completion time
- Incomplete items: standard Briefing Items with "→ Tomorrow" and "Reschedule" actions
- NOT draggable — today is read-only except reschedule
- Day Summary Bar at bottom

**Section: INBOX (only if unprocessed items exist)**
- Header shows count: "INBOX (4 items)"
- Per item: capture text, time, three actions (→ Tomorrow / Organize / Archive)
- Goal: empty in under 2 minutes

**Section: TOMORROW**
- Pre-populated by system (due dates, carryover, recurring, milestones)
- Draggable to reorder
- Star up to 3 must-do items (violet accent)
- "+ Add task for tomorrow" at bottom
- "Lock in tomorrow" button: full-width, `accent-brand`, 48px
- System tracks whether evening review was completed

**Estimated time: 3-5 minutes. If longer, design failed.**

### 3.2 Morning Briefing Screen

Auto-triggers before 12pm (configurable).

- Header: "Good morning" + date, "Just one thing" button top-right
- "Something changed" banner: only renders if overnight changes occurred, dismissible
- Main list: starred must-dos at top (violet), then everything else
- Drag-to-reorder enabled
- If no evening review: notice "this order is system-generated" in `status-warning`

### 3.3 "Just One Thing" Mode

**Entry (400ms):** sidebar + pulse rail collapse, background darkens, list fades, card scales in
**Card:** centered, large type, context line, subtasks/notes if they exist
**Actions:** Done (emerald, slides left) → 400ms breath → next card enters from right. Skip slides right.
**Completion:** "Nothing left for today" — calm, no celebration
**Exit:** reverse of entry, 400ms

### 3.4 Capture Modal (Cmd+K)

**Entry:** overlay fade 150ms, modal scale 0.95→1.0 in 200ms, input auto-focused
**Flow:** type → optional smart chips appear → Enter to save (inbox) → modal closes → toast "Captured"
**Expanded (Tab):** project, due date, priority, notes — never the default
**Mobile:** FAB bottom-right → bottom sheet (85% height)

### 3.5 Tasks Module — Focused View

**Toolbar:** search, filter, sort, + New
**Groups:** Must Do → Overdue → Today → Tomorrow → This Week → Later → No Date → Completed (collapsed)
**Task row:** checkbox, name (`body-medium`), metadata line (`caption`), priority dot
**Task detail:** full form — title, status, project, due, priority, description, subtasks, activity log

---

## Part 4: Animation Specifications

- Default easing: `cubic-bezier(0.25, 0.1, 0.25, 1.0)`
- No animation longer than 400ms
- Respect `prefers-reduced-motion`

| Interaction | Duration | Notes |
|---|---|---|
| Hover bg change | 150ms | ease-out |
| Sidebar/rail expand | 250ms | ease-in-out |
| Capture modal open | 200ms | scale 0.95→1.0 |
| Capture modal close | 150ms | scale 1.0→0.97 |
| Smart chip appear | 150ms | fade + translateY 4px |
| Task complete slide-out | 250ms | after 1.5s delay |
| Focus card done/skip | 250ms | slide left/right |
| Focus card next enter | 250ms | after 400ms breath |
| Checkbox check | 200ms | scale 1→1.15→1 bounce |
| Route change content | 200ms | fade + translateY 8px |
| Toast appear | 200ms | fade + translateY 8px |
| Toast dismiss | 150ms | after 1.5s |

---

## Part 5: Responsive Behavior

### Breakpoints

| Name | Width | Layout |
|---|---|---|
| Desktop large | ≥1440px | Sidebar 240px + content + pulse rail 300px |
| Desktop | 1024–1439px | Sidebar collapsed 56px + content + rail collapsed 40px |
| Tablet | 768–1023px | Sidebar hidden (hamburger), pulse merged into briefing |
| Mobile | <768px | Bottom tab bar, FAB capture, swipe gestures |

### Mobile Specifics
- Bottom tab bar: 56px + safe area, max 5 tabs
- Capture: FAB (56px circle, `accent-brand`, bottom-right) → bottom sheet
- Briefing items: swipe right = complete, swipe left = snooze/reschedule
- Focus mode: full-width card, stacked action buttons, swipe down to exit
- Task detail: full-screen slide-in from right
- "Lock in tomorrow": sticky at bottom of viewport
