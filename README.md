# FROM Time Management System for Delta Green

A comprehensive time management module for Delta Green RPG sessions in Foundry VTT, inspired by the mechanics of the FROM TV series.

> **Current Version: 3.0.0** — 🔧 **FULL v13+ REFACTORING**: ApplicationV2 + HBS templates, reactive sync, critical bug fixes.
> [See full changelog](CHANGELOG.md) for complete history.

---

## ✨ What's New in v3.0.0

- **Critical fixes** — Agent Tracker buttons now work (missing `_onRender` fixed), dialog renders correctly (added `HandlebarsApplicationMixin`), agents visible again (fixed actor type `"agent"` vs `"character"`)
- **Full Foundry v13+ API compliance** — all dialogs use `HandlebarsApplicationMixin(ApplicationV2)` with separate HBS templates
- **Reactive real-time sync** — `onChange` callbacks on all world settings; every client auto-refreshes without socket broadcasts
- **Promise-based Action Selection** — `ActionSelectionDialog.show()` returns `Promise<result|null>`
- **Archive completed actions button** — GM can archive all completed queue entries in one click
- **Old actions unstuck** — legacy numeric IDs (from `Date.now()`) now work with string comparison

---

## Features

### 🕐 Time Management
- Real-time game clock with day/hour tracking
- "Day in Town" counter for extended stays
- GM-controlled time settings and real-time broadcast to all clients
- Automatic time progression with manual override

### 👥 Agent Activity Tracking
- Individual progress bars for each agent (day and night separately)
- Visual color-coded warnings: green → orange → red as time fills
- GM eye-icon (👁) to hide/show individual agents from players
- Real-time synchronization across all clients via socket events

### 📋 Action Queue System
- Pre-defined action templates with configurable time costs
- Custom action creation
- Automatic time allocation per agent with day/night overflow handling
- Completion tracking and per-action delete

### 📚 Action Archive
- Permanent history of all agent actions throughout the campaign
- Organized by day with collapsible sections
- Individual archive window per agent
- Persists across Foundry restarts

### 🎨 Agent Visual Themes
- 10 distinct horror-themed gradient backgrounds, hash-assigned per agent
- Consistent appearance for the same agent across all sessions

### 🔄 Real-time Multiplayer
- Socket-based synchronization (`module.from-time-management`)
- Flicker-free `refreshContent()` updates — no duplicate dialog instances
- Late-join support: players connecting mid-session get full sync
- Permission model: players manage own characters, GM controls all

### 🌅 Day/Night Cycles
- Toggle between Day and Night tracking modes
- Overflow automatically moves to the opposite period
- "New Day" resets all agent progress and advances the day counter

---

## 🎭 Default Action Templates

| Template | Time |
|---|---|
| Short Rest | 1h |
| NPC Conversation | 1h |
| Investigate Location | 1h |
| Meal at Diner | 1h |
| Travel Town ↔ Colony House | 1h |
| Medical Care | 2h |
| Explore Near Town | 3h |
| Forest Exploration | 6h |

---

## 🔧 Compatibility

| | |
|---|---|
| **Foundry VTT** | v12.331 – v13.351+ (verified) |
| **Recommended** | v13+ for full DialogV2 support |
| **System** | Delta Green (primary); adaptable to other systems |
| **Dependencies** | None — standalone module |
| **PopOut! module** | ✅ Fully compatible |

---

## Installation

### Via Foundry Module Browser
1. In Foundry VTT go to **Add-on Modules → Install Module**
2. Search for `FROM Time Management`
3. Click **Install** and enable in your world

### Manual Installation
1. Download `from-time-management-v2.1.0.zip` from the [releases page](https://github.com/ZuraffPL/FROM-Time-Management-Module/releases)
2. Extract to your `Data/modules/` directory
3. Restart Foundry VTT and enable the module in your world

### Manifest URL
```
https://github.com/ZuraffPL/FROM-Time-Management-Module/releases/latest/download/module.json
```

---

## Usage

### For Game Masters

#### Time Management Dialog (🕐)
- **Set Time** — manually set the current game time
- **Broadcast Time** — send current time to all players via chat
- **New Day** — resets all agent progress bars and advances the day counter

#### Agent Tracker (👥)
- Switch between **Day Time** and **Night Time** tracking modes
- Use **+1h / -1h** buttons to manually calibrate individual agent time
- Click **Add Action** to open an inline panel with templates or custom input
- Click the **👁 eye icon** (GM only) to hide/show an agent from players
- Click **Archive Actions** to browse an agent's full action history

#### Action Queue (📋)
- Mark actions as completed with checkboxes
- **Clear Completed** archives finished actions to respective agents
- Delete individual actions with the trash icon

### For Players

- Open the **Agent Tracker** to view your character's progress bars
- Click **Add Action** to add time to your character
- Click **Archive Actions** to review your full action history
- Receive time updates via chat when the GM broadcasts

---

## Configuration

All state is stored automatically in world-level Foundry settings — no manual configuration required.

| Setting | Description |
|---|---|
| `currentGameTime` | Current in-game time and date |
| `agentDayTimeTracking` | Per-agent day-period time usage |
| `agentNightTimeTracking` | Per-agent night-period time usage |
| `trackingMode` | Current mode (day / night) |
| `actionQueue` | All queued and completed actions |
| `actionArchive` | Complete historical archive |
| `hiddenAgents` | GM visibility preferences per agent |

---

## Permissions

| Role | Access |
|---|---|
| **GM** | Full control: time, all agents, settings, visibility toggles |
| **Players** | Add actions for owned characters; view all tracking info |
| **Observers** | Read-only access |

---

## Localization

| Language | Status |
|---|---|
| English | ✅ Full |
| Polish (pl) | ✅ Full |

Additional languages welcome via pull request.

---

## Technical Details

### Architecture
Built on modern Foundry VTT v13+ APIs:

- **DialogV2 API** — all dialogs use `foundry.applications.api.DialogV2`
- **Flicker-free updates** — `refreshContent()` replaces inner DOM only, preserving scroll position and open panels
- **Inline Action Panel** — embedded directly in tracker DOM, no separate window needed
- **Socket events** — `forceRefreshAgentTracker`, `forceRefreshActionQueue`, `addActionToQueue`, `timeChanged`
- **Event delegation** — single root listener with `e.target.closest()` for all buttons
- **No jQuery** — pure ES module JavaScript

### Project Structure
```
from-time-management/
├── main.mjs                         # Entry point: settings, controls, socket listener
├── module.json                      # Module manifest
├── scripts/
│   ├── agent-tracker-dialog.js     # Agent tracking, inline panels, visibility toggle
│   ├── action-queue-dialog.js      # Action queue with refreshContent pattern
│   ├── action-selection-dialog.js  # Standalone action selection (legacy fallback)
│   └── time-management-dialog.js   # GM time control dialog
├── styles/
│   └── time-management.css         # All styles, CSS variable-based theming
└── lang/
    ├── en.json
    └── pl.json
```

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes and test in Foundry VTT v13+
4. Submit a pull request

Report bugs and request features via the [GitHub issue tracker](https://github.com/ZuraffPL/FROM-Time-Management-Module/issues).

---

## License

[Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)](https://creativecommons.org/licenses/by-nc-sa/4.0/)

---

## Credits

- **Inspired by**: FROM TV series time mechanics
- **Designed for**: Delta Green RPG
- **Built for**: Foundry Virtual Tabletop

---

*"In FROM's twisted town, every hour matters. Track your agents' activities, manage their exhaustion, and survive another day in this nightmare."*
