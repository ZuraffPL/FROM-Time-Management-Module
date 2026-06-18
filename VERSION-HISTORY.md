# FROM Time Management System - Version History

## Version 3.0.2 (2026-06-18) - CURRENT RELEASE
**🪟 AGENT TRACKER — UX & AUTO-SIZING**

### New Features
- ✅ **Double-click opens actor sheet**: Double-clicking an agent entry (outside buttons) opens their character sheet for both players and GM; `bringToTop()` used if sheet is already open
- ✅ **Auto-refresh on roster changes**: Tracker now reacts automatically to actor creation, deletion, ownership/type changes, and player connect/disconnect — no more manual window reopen required

### Bug Fixes
- ✅ **Auto-height window**: `AgentTrackerDialog` opens with `height: "auto"` and re-adapts on each re-render via `setPosition({ height: "auto" })` in `_onRender`
- ✅ **Wider window**: Width increased 600 → 680 px; ±1h buttons no longer overlap the time progress bar in GM view
- ✅ **No internal agent list scrollbar**: Removed `scrollY: [".agent-list"]`; window expands to show all agents

### Internal Changes
- ✅ `refreshTime` / `refreshTracker` / `refreshQueue` moved to module scope in `main.mjs`

---

## Version 3.0.0 (2026-05-21)
**🔧 FULL FOUNDRY V13+ API COMPLIANCE REFACTORING**

### Critical Bug Fixes
- ✅ **Agent Tracker Buttons Non-functional**: Missing `_onRender()` in `AgentTrackerDialog` — Add Action, Day/Night Mode, Reset and Adjust Time buttons now work
- ✅ **Dialog "not renderable" Error**: Added mandatory `HandlebarsApplicationMixin` to all `ApplicationV2` subclasses
- ✅ **Wrong Actor Type**: `#getActiveAgents()` used `"character"` but Delta Green uses `"agent"` — tracker now shows agents
- ✅ **Old Actions Stuck in Queue**: Legacy numeric IDs (`Date.now()`) couldn't be deleted; fixed with `String(id)` comparison
- ✅ **Players Couldn't Add Actions**: Socket `requestAddAction` had no GM handler — now handled in `main.mjs`
- ✅ **`window.TimeManagement` Reference**: Replaced dead reference with inline `DialogV2.confirm()`

### Architecture Changes
- ✅ **All Dialogs**: `HandlebarsApplicationMixin(ApplicationV2)` — correct Foundry v13+ pattern
- ✅ **5 HBS Templates**: All dialog content moved to `templates/` folder
- ✅ **Singleton Pattern**: `foundry.applications.instances.get(id)` replaces `static _instance`
- ✅ **Promise-based `ActionSelectionDialog`**: `static async show()` returns `Promise<result|null>`
- ✅ **`gameTime` type**: `type: Object` replaces `type: String` + manual JSON parse
- ✅ **`randomID()` for action IDs**: Replaces `Date.now()`
- ✅ **`deepClone()`**: Replaces deprecated `duplicate()`

### Multiplayer Sync
- ✅ **`onChange` Reactive Sync**: All world settings trigger window re-renders on every client automatically — including the GM
- ✅ **Removed socket `refresh` broadcasts**: Superseded by `onChange`; no more double-renders on remote clients
- ✅ **Single socket listener**: Consolidated from multiple per-file listeners to one validated handler in `main.mjs`

### UI Additions
- ✅ **"Archive Completed" Button**: GM footer button in Action Queue archives all completed actions at once
- ✅ **Active Players Only**: Agent Tracker filters `user.active` — only shows connected players

### Cleanup
- ✅ Removed unused `import { TimeManagementDialog }` from `agent-tracker-dialog.js`
- ✅ `scripts/time-management.old.js` added to `.gitignore`
- ✅ Removed redundant `this.render()` calls from action handlers (`onChange` handles it)

---
## Version 2.1.0 (2026-02-18) - PREVIOUS RELEASE (2026-02-18) - CURRENT RELEASE
**✨ UI OVERHAUL: FLICKER-FREE DIALOGS, INLINE ACTIONS & GM CONTROLS**

### Critical Fixes
- ✅ **No More Flickering**: `refreshContent()` replaces dialog content in-place — no close/reopen cycle
- ✅ **No Duplicate Dialogs**: Socket events no longer spawn multiple dialog instances
- ✅ **Archive Dialog Theming**: Uses Foundry CSS variables — correct in both light and dark themes
- ✅ **Action Selection in PopOut!**: Replaced broken separate window with fully embedded inline panel

### New Features
- ✅ **Inline Action Panel**: "Add Action" expands a panel directly inside the tracker row
- ✅ **Multi-Player Simultaneous Panels**: Each player can have their own panel open at the same time
- ✅ **Panel State Preservation**: Typed text and open panels survive `refreshContent()` updates seamlessly
- ✅ **GM Agent Visibility Toggle**: Eye-icon button per agent hides/shows agents from players; state persisted in world settings

### Performance & Cleanup
- ✅ **23 Console Logs Removed**: No more debug noise in the browser console during sessions
- ✅ Files cleaned: `main.mjs`, `agent-tracker-dialog.js`, `action-queue-dialog.js`, `time-management-dialog.js`

### Technical Architecture
- `AgentTrackerDialog.refreshContent()` / `refreshAll()` — flicker-free in-place DOM update
- `ActionQueueDialog.refreshContent()` / `refreshAll()` — same pattern for action queue
- `generateInlineActionPanel(agentId)` — inline template selector + custom input per agent
- `hiddenAgents` world setting — GM visibility preferences persisted across sessions
- CSS variables throughout for proper light/dark theme support

---

## Version 2.0.4 (2025-12-08)
**🔧 BUG FIX: TIME SYNCHRONIZATION**

### Critical Fix
- ✅ **Agent Tracker Time Display**: Current time now syncs with Time Management Dialog
- ✅ **Real-time Updates**: Socket event broadcasting for instant synchronization
- ✅ **Auto-refresh**: Agent Tracker automatically updates when GM changes time
- ✅ **Multiplayer Sync**: All connected clients see accurate time instantly

### The Problem (v2.0.3)
- Agent Tracker showed "Aktualny Czas" from old `currentGameTime` setting
- Time Management Dialog used different `gameTime` setting
- Changes in Time Management Dialog didn't update Agent Tracker
- Players saw outdated time until manual refresh

### The Solution (v2.0.4)
- Unified time synchronization: `updateGameTime()` writes both formats
- Socket event `timeChanged` broadcasts to all clients
- Automatic UI refresh when time changes detected
- Works with all time change methods (input, Set Time button, New Day)

### Technical Details
- New `TimeManagementDialog.updateGameTime()` method
- Socket listener in `main.mjs` for `timeChanged` event
- Backward compatibility maintained with both time formats

### Impact
- ✅ No more outdated time displays
- ✅ Better player experience with instant updates
- ✅ Eliminates confusion in multiplayer sessions

---

## Version 2.0.3 (2025-12-08)
**📄 LICENSE CHANGE, BUG FIXES & ENHANCEMENTS**

### Critical Fixes
- ✅ **New Day Button Fixed**: Corrected DialogV2.confirm syntax, proper async/await handling
- ✅ **Agent Progress Reset**: Progress bars now reset correctly on new day
- ✅ **Confirmation Flow**: Single clean code path - no more duplicate logic
- ✅ **Sequential Execution**: Click → Confirm → Day increments, time resets, tracking resets

### Visual Enhancements
- ✅ **Styled Chat Messages**: Restored atmospheric New Day announcements
- ✅ **Orange Gradient Background**: Enhanced visibility with border and proper styling
- ✅ **Large Emoji Icon**: 🌅 emoji (24px) for visual impact
- ✅ **Formatted Text**: Proper colors, hierarchy, and atmospheric messaging
- ✅ **Inline CSS**: Ensures consistent display across all clients

### License Update
- ✅ **New License**: Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International
- ✅ **Attribution Required**: Users must credit original author
- ✅ **NonCommercial**: No commercial use without explicit permission
- ✅ **ShareAlike**: Derivative works must use same CC BY-NC-SA 4.0 license
- ✅ **License URL**: https://creativecommons.org/licenses/by-nc-sa/4.0/

### Repository Cleanup
- ✅ **Removed Release Artifacts**: Version-specific files no longer tracked in Git
- ✅ **Updated .gitignore**: Excludes *.zip, checksums, scripts, release notes
- ✅ **Cleaner Repository**: Focus on source code and primary documentation

### What This Means
- **For Users**: New Day works reliably + enhanced visual experience + free to use with attribution
- **For Developers**: Can build upon this work if sharing under same license
- **Commercial Use**: Requires permission from author

### Files Updated
- `scripts/time-management-dialog.js` - Fixed New Day button + enhanced chat styling
- `LICENSE` - Complete CC BY-NC-SA 4.0 license text
- `module.json` - License field updated to CC URL
- `README.md` - License section reflects new terms
- `.gitignore` - Excludes release artifacts

---

## Version 2.0.1 (2025-12-08)
**🐛 BUG FIX: TIME OVERFLOW DISTRIBUTION**

### Critical Fix
- ✅ **Proper Time Overflow Distribution**: Actions spanning multiple periods now correctly split hours
- ✅ **Accurate Progress Bars**: Day and night progress bars display correctly for overflow actions
- ✅ **Period Limit Enforcement**: Each period fills to maximum (12h) before overflow transfers

### The Problem (v2.0.0)
When an action exceeded a period's remaining time:
- All action hours added to current period only
- Progress bars showed incorrect values (>12h)
- Overflow to next period wasn't calculated

### The Solution (v2.0.1)
Smart overflow distribution:
- Current period fills to maximum (12h)
- Remaining hours transfer to opposite period
- Both progress bars update correctly
- Accurate time tracking across day/night cycles

### Example Fix
**Scenario**: Agent has 11/12h in day, adds 3h action

**Before (v2.0.0):**
- Day: 14/12h ❌ (incorrect)
- Night: 0/12h

**After (v2.0.1):**
- Day: 12/12h ✅ (filled to max)
- Night: 2/12h ✅ (overflow)

### User Impact
- Essential for campaigns using day/night mechanics
- Ensures accurate time tracking
- Fixes progress bar visualization
- No data migration needed - fix applies to new actions

**Recommendation**: Update immediately if using day/night tracking features.

---

## Version 2.0.0 (2025-12-08)
**🎯 DIALOGV2 MIGRATION & SMART ARCHIVING RELEASE**

### Major Features
- ✅ **Complete DialogV2 Migration**: All dialogs modernized for Foundry VTT v13+
- ✅ **Smart Completed Actions Archiving**: "Clear Completed" replaces "Clear All"
- ✅ **Zero Deprecation Warnings**: Future-proof architecture with modern APIs
- ✅ **Native DOM Event Handling**: jQuery completely removed from all dialogs
- ✅ **Singleton Pattern Implementation**: Prevents duplicate dialog instances

### Technical Implementation
- Migrated all Dialog instances to foundry.applications.api.DialogV2
- Replaced Dialog.confirm with DialogV2.confirm for confirmations
- Implemented _onRender lifecycle hooks instead of activateListeners
- Native querySelector and addEventListener throughout codebase
- Event delegation for dynamic content (action items, checkboxes, delete buttons)
- Improved socket synchronization with operation-based routing

### Dialog-Specific Changes
**Time Management Dialog:**
- Direct DOM queries replace FormData parsing
- Modern DialogV2.confirm for "New Day" confirmation
- Cleaner button callback implementation

**Agent Tracker Dialog:**
- Complete jQuery removal (no more .find(), .on(), etc.)
- Native event listeners with proper delegation
- Singleton pattern with getInstance() for socket handlers
- close+show pattern for reliable content refresh

**Action Queue Dialog:**
- _onRender replaces activateListeners
- Smart archiving: only completed actions removed and archived
- Real-time checkbox synchronization to all players
- Event delegation for all interactive elements

**Action Selection Dialog:**
- Full DialogV2 rewrite with proper structure
- Native DOM handling for template selection
- Improved callback parameter handling

### New Features
**Clear Completed Actions:**
- GM-only button replaces "Clear All"
- Filters and archives only completed actions
- Preserves active/pending actions in queue
- Shows notification: "Cleared {count} completed actions and moved to archive"
- Full multilingual support (PL/EN)
- Socket synchronization ensures all players see updates

### User Experience Improvements
- No more deprecation warnings in console
- More predictable dialog behavior
- Better multiplayer synchronization
- Cleaner action queue management workflow
- Professional notifications with action counts

**Impact**: Major architectural upgrade ensuring compatibility with current and future Foundry VTT versions!

---

## Version 1.4.0 (2025-10-23)
**🎯 RESIZABLE DIALOGS WITH DYNAMIC SCALING RELEASE**

### Major Features
- ✅ **Fully Resizable Windows**: Agent Tracker and Action Queue dialogs now support free resizing
- ✅ **Proportional Content Scaling**: All UI elements scale intelligently with window size
- ✅ **High-Resolution Display Support**: Optimized for 1440p, 4K, and ultrawide monitors
- ✅ **Dynamic Font Sizing**: Text scales using clamp() for optimal readability at any size

### Technical Implementation
- Implemented CSS clamp() with viewport-relative units (vw/vh)
- Responsive font sizes from 0.55rem to 1.5rem based on element importance
- Dynamic padding and spacing calculations
- Enhanced flexbox layouts with proper overflow handling
- Initial dialog size: 600x500px with 450x300px minimum constraints

### Scaling Features by Component
**Agent Tracker:**
- Agent avatars: 40px-60px responsive sizing
- Names and details: Fully scalable typography
- Progress bars: 10px-16px height with dynamic segments
- All buttons scale proportionally with window

**Action Queue:**
- Action names: 0.9rem-1.3rem for maximum visibility
- Details text: 0.75rem-1rem with excellent readability
- Cost badges: Dynamic sizing with responsive padding
- Control buttons: Proportional scaling

### User Experience Improvements
- Users can resize windows to their preference on any display
- No more tiny text on high-resolution monitors
- Perfect for multitasking with multiple windows
- Content automatically reflows and scales
- Smooth scrolling when content exceeds window bounds

**Impact**: Game-changing improvement for high-resolution display users! Windows now adapt perfectly to any screen size.

---

## Version 1.3.0 (2025-09-24)
**🎨 UI/UX ENHANCEMENTS & POPOUT SUPPORT RELEASE**

### Major UI/UX Improvements
- ✅ **Popout Window Support**: All dialogs can be popped out into separate windows for multitasking
- ✅ **Enhanced Dialog Management**: Better window handling, positioning, and lifecycle management
- ✅ **Action Queue Visual Fixes**: Fixed button stretching issues and improved text readability
- ✅ **Completed Action Styling**: Better contrast and visibility for finished actions

### Technical Enhancements
- Manual popout button implementation for all dialogs
- Enhanced CSS layout with fixed-width buttons (40px delete buttons)
- Improved flexbox layouts for action items
- Better text overflow handling for long action names
- Comprehensive logging for dialog creation and popout detection

### User Experience Improvements
- Popout functionality allows keeping multiple dialogs open simultaneously
- Fixed visual bugs that affected usability
- Enhanced readability of action names in queue
- Consistent button sizing across all interfaces

**Impact**: Major UI polish with modern popout support for better multitasking workflows!

---

## Version 1.2.0 (2025-09-22) - FOUNDRY VTT v13 COMPATIBILITY RELEASE

### Major Compatibility Update
- ✅ **Full Foundry VTT v13 Support**: Complete compatibility with latest Foundry version
- ✅ **Enhanced Scene Control Registration**: Multi-layer approach ensures controls always appear
- ✅ **Cross-Version Architecture**: Seamless operation on v12.331 through v13.348
- ✅ **Zero Configuration**: Automatic version detection and appropriate handling

### Technical Innovations
- Advanced scene control registration with intelligent fallbacks
- Hook execution monitoring and automatic recovery systems
- Object vs array structure detection for cross-version compatibility
- Comprehensive debugging infrastructure for troubleshooting

### v13 Specific Enhancements
- Support for Application v2 API and object-based controls structure
- Direct UI manipulation when standard hooks don't fire
- Enhanced error recovery with multiple registration strategies
- Future-proof design for upcoming Foundry releases

**Impact**: Ensures module works perfectly on any Foundry version from v12 to v13+!

---

## Version 1.1.0 (2025-08-29)
**�🎯 MULTIPLAYER SYNCHRONIZATION RELEASE**

### Critical Fix
- ✅ **Agent Time Adjustment Synchronization**: GM's +1h/-1h buttons now sync progress bars to all players instantly
- ✅ **Socket Communication Overhaul**: Bulletproof initialization with multiple retry mechanisms
- ✅ **Real-time Updates**: All GM actions now immediately visible to all connected players

### Key Improvements
- Enhanced socket reliability with multiple initialization points
- Comprehensive debugging and logging system
- Automatic connection recovery and health monitoring
- Late-join player support with full data synchronization

**Impact**: Completes the critical bug fix series - multiplayer experience now rock-solid!

---

## Version 1.0.6 (2025-08-29)
**🛠️ CRITICAL BUG FIXES RELEASE**

### Major Fixes
- ✅ **Player Archive Visibility**: Fixed empty archive windows for players
- ✅ **Time Settings Persistence**: Resolved complete loss of time settings after Foundry restart

### What Was Fixed
- Players can now see complete action history in archives
- All time data (hours, day, year) persists correctly across sessions
- Enhanced GM-to-Player data synchronization
- Improved debugging and error reporting

**Impact**: Restored basic functionality - archives visible to players, time settings preserved.

---

## Version 1.0.5 (2025-08-29)
**🔒 DATA PERSISTENCE REVOLUTION**

### Revolutionary Change
- ✅ **File-Based Archive Storage**: Individual JSON files per agent for bulletproof persistence
- ✅ **End of Data Loss**: Archives survive Foundry restarts and version updates
- ✅ **Dual Storage System**: Files + settings backup for maximum reliability

### Technical Innovation
- Asynchronous file operations with graceful fallbacks
- Automatic migration from old settings-based storage
- Enhanced error handling with multiple recovery layers
- Future-proofed against Foundry settings limitations

**Impact**: Solved the archive persistence problem permanently with revolutionary storage approach.

---

## Version 1.0.4 (2025-08-28)
**🎨 VISUAL & ARCHIVE ENHANCEMENTS**

### New Features
- ✅ **Action Archive System**: Complete historical tracking of all agent actions
- ✅ **Agent Visual Themes**: 10 unique horror-themed gradient backgrounds per agent
- ✅ **Improved Interface Layout**: Two-row layout with optimized button arrangement

### Improvements
- Perfect button alignment and responsive design
- Comprehensive action history with permanent storage
- Enhanced visual differentiation for multi-agent scenarios
- Better time control positioning for GM workflow

**Impact**: Major UX improvements with complete action history tracking.

---

## Version 1.0.3 (2025-08-28) 
**🔄 SYNCHRONIZATION FIXES**

### Bug Fixes
- ✅ **Synchronization Issues**: Resolved duplicate functions causing sync failures
- ✅ **Real-time Updates**: Progress bars properly refresh for all users
- ✅ **Polish Translations**: Restored missing translations in agent interface
- ✅ **Socket Communication**: Fixed conflicting handlers causing errors

### Changes
- Simplified time adjustment (full hour increments only)
- Enhanced error handling and data validation
- Improved UI consistency with proper localization

**Impact**: Reliable synchronization between GM and players restored.

---

## Version 1.0.2 (2025-08-28)
**🎛️ MANUAL TIME CONTROLS**

### New Features  
- ✅ **Manual Time Adjustment**: GM can adjust agent time with +/- buttons
- ✅ **Enhanced Visual Design**: Active actions with distinct green styling
- ✅ **Improved Readability**: Larger fonts and better contrast
- ✅ **Better UX**: Integrated time controls in agent tracker

### Improvements
- Visual hierarchy for active vs completed actions
- Accessibility improvements with larger fonts
- Quick time adjustment without creating/deleting actions
- Clear notifications for manual adjustments

**Impact**: Gave GMs direct control over agent time with visual improvements.

---

## Version 1.0.1 (2025-08-28)
**📋 ACTION QUEUE IMPROVEMENTS**

### Improvements
- ✅ **Action Queue Sorting**: Completed actions move to bottom automatically
- ✅ **Visual Separation**: Clear separator between active and completed actions
- ✅ **Enhanced Feedback**: Better notifications for action state changes
- ✅ **Workflow Optimization**: Active actions prioritized for GM workflow

**Impact**: Better organization and workflow for action management.

---

## Version 1.0.0 (2025-08-20)
**🎉 INITIAL RELEASE**

### Complete Feature Set
- ✅ **Time Management System**: Real-time clock with day/hour tracking
- ✅ **Agent Activity Tracking**: Individual progress bars with real-time sync
- ✅ **Action Queue System**: 8 pre-defined templates with time costs
- ✅ **Day/Night Cycles**: Visual mode switching and "New Day" functionality
- ✅ **Multiplayer Support**: Socket-based synchronization
- ✅ **Localization**: English and Polish translation system

### Technical Foundation
- Foundry VTT v12.331+ compatibility
- Delta Green system integration
- Socket protocol for real-time sync
- World-level settings storage
- Comprehensive error handling and logging

**Impact**: Initial release converted from macro to full module with multiplayer support.

---

## Compatibility Matrix

| Version | Foundry VTT | Key Feature | Status |
|---------|-------------|-------------|---------|
| 1.3.0 | v12.331 - v13.348 | UI/UX & Popout | ✅ Current |
| 1.2.0 | v12.331 - v13.348 | Foundry v13 Support | ✅ Stable |
| 1.1.0 | v12.331+ | Multiplayer Sync | ✅ Stable |
| 1.0.6 | v12.331+ | Bug Fixes | ✅ Stable |
| 1.0.5 | v12.331+ | File Storage | ✅ Stable |
| 1.0.4 | v12.331+ | Visual Themes | ✅ Stable |
| 1.0.0-1.0.3 | v12.331+ | Basic Features | ⚠️ Upgrade Recommended |

---

## Upgrade Path Summary

**From any version → 1.3.0**: 
- ✅ Seamless upgrade with no data loss
- ✅ All previous bugs automatically fixed
- ✅ Enhanced UI/UX with popout support
- ✅ Visual improvements and better usability
- ✅ Zero configuration required

**From 1.2.0 → 1.3.0**:
- ✅ UI polish and popout functionality added
- ✅ Visual bug fixes applied
- ✅ Enhanced dialog management

**Recommended Action**: Update to v1.3.0 immediately for the best user experience with popout support!
