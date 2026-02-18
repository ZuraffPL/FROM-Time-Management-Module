# Changelog

All notable changes to the FROM Time Management System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2026-02-18

### ✨ UI OVERHAUL: FLICKER-FREE DIALOGS, INLINE ACTIONS & GM CONTROLS

Major quality-of-life release focused on eliminating dialog flickering, improving PopOut! compatibility, enabling simultaneous multiplayer action selection and adding a GM-only agent visibility toggle.

### Fixed
- **Dialog Flickering**: Agent Tracker and Action Queue dialogs no longer close and reopen when state changes. All updates now use an in-place DOM replacement (`refreshContent()`) that preserves scroll position without any visible flicker.
- **Multiple Dialog Instances**: Eliminated the bug where socket events could spawn duplicate dialog instances with incrementing IDs.
- **Archive Dialog Readability**: Archive dialog previously used hardcoded dark-theme colors (`#1a1a1a`, white text). Now uses Foundry CSS variables (`--color-text-primary`, `--color-text-secondary`, `--color-border-light-primary`, `--color-bg-option`) for correct appearance in both light and dark themes.
- **Action Selection in PopOut! Context**: Separate `ActionSelectionDialog` window failed to render when the Agent Tracker was popped out to a separate browser window. Replaced with an inline panel embedded directly in the tracker DOM.

### Added
- **Inline Action Panel**: Clicking "Add Action" now expands an inline panel within the tracker row instead of opening a separate window. Works in any context including PopOut! windows.
- **Multi-Player Simultaneous Action Selection**: Multiple players can have their own inline panels open at the same time. Each panel is local to the client and does not affect other users' views.
- **Panel State Preservation**: `refreshContent()` saves and restores any open inline panel (including typed custom action text) before and after each DOM refresh, so updates are truly seamless.
- **GM Agent Visibility Toggle**: GM-only eye icon (👁) button on each agent row. Click to hide/show an agent for non-GM players. Hidden state persisted in world settings (`hiddenAgents`). Hidden agents are shown with a dimmed style for the GM and completely hidden for players.

### Improved
- **Performance**: Removed all 23 debug `console.log` statements from `main.mjs`, `agent-tracker-dialog.js`, `action-queue-dialog.js`, and `time-management-dialog.js`. Console is no longer flooded during normal play.

### Technical Details
- `AgentTrackerDialog.refreshContent()` — replaces `.agent-tracker-window` inner HTML only
- `AgentTrackerDialog.refreshAll()` — static helper called by socket and settings change handlers
- `ActionQueueDialog.refreshContent()` / `refreshAll()` — same pattern for action queue
- `generateInlineActionPanel(agentId)` — renders inline template selector + custom input
- `generateAgentTrackerContent()` — filters `hiddenAgents` setting for non-GM users
- `generateAgentHTML()` — adds eye-icon button (GM only) and `agent-hidden` CSS class
- New world setting `hiddenAgents` (type: `Object`) stores GM visibility preferences
- CSS: `.inline-action-*` classes for inline panel layout; `.agent-visibility-btn`, `.agent-entry.agent-hidden` for visibility toggle

---

## [2.0.4] - 2025-12-08

### 🔧 BUG FIX: TIME SYNCHRONIZATION

This patch release fixes the Agent Tracker time display to properly sync with Time Management Dialog changes.

### Fixed
- **Agent Tracker Time Display**: Current time section now properly displays and updates from Time Management Dialog
  - Synchronized `gameTime` with `currentGameTime` for compatibility between different system components
  - Added socket event broadcasting when GM changes time in Time Management Dialog
  - Agent Tracker Dialog automatically refreshes when time changes
  - Real-time updates across all connected clients
  - Fixes issue where current time section showed outdated time after GM made changes

### Technical Details
- New `updateGameTime()` function ensures both time formats stay synchronized
- Socket event `timeChanged` broadcasts to all clients when GM modifies time
- Socket listener in `main.mjs` handles automatic UI refresh
- Works with manual time changes, "Set Time" button, and "New Day" button

### Impact
- Players now see accurate current time in Agent Tracker without manual refresh
- Better multiplayer experience with instant synchronization
- Eliminates confusion from outdated time displays

---

## [2.0.3] - 2025-12-08

### 📄 LICENSE CHANGE & BUG FIXES

This release updates the project license to CC BY-NC-SA 4.0, fixes the New Day button functionality, and enhances chat message styling for better player experience.

### Fixed
- **New Day Button Functionality**: Fixed critical issue where New Day button didn't execute action
  - Corrected DialogV2.confirm syntax (removed incorrect yes/no callbacks)
  - Implemented proper async/await pattern with boolean return value
  - Single, clean code path for handling user confirmation
  - Agent progress bars now reset correctly on new day
  - All notifications and chat messages work as expected
  - Sequential execution: Click → Confirm → Day increments, time resets to 6:00, agent tracking resets

### Improved
- **New Day Chat Message Styling**: Restored atmospheric styled chat messages
  - Orange gradient background with border for visibility
  - Large 🌅 emoji icon (24px) for visual impact
  - Formatted text with proper colors and hierarchy
  - Shows day number and atmospheric message: "New day has dawned • Day X • Another in this cursed place"
  - Uses inline CSS to ensure consistent display across all clients
  - More immersive and visible for players

### Changed
- **License Update**: Changed from MIT License to CC BY-NC-SA 4.0
  - Attribution required: Users must credit the original author
  - NonCommercial: No commercial use without permission
  - ShareAlike: Derivative works must use the same license
  - Full license text: https://creativecommons.org/licenses/by-nc-sa/4.0/
- Updated `LICENSE` file with complete CC BY-NC-SA 4.0 text
- Updated `module.json` license field to CC BY-NC-SA 4.0 URL
- Updated `README.md` license section with new license information

### Chore
- **Repository Cleanup**: Removed auto-generated release artifacts from Git tracking
  - Removed version-specific files (RELEASE_NOTES, GITHUB-RELEASE-INSTRUCTIONS, etc.)
  - Updated `.gitignore` to exclude future release artifacts (*.zip, checksums, scripts)
  - Keeps repository clean and focused on source code

### Impact
- **For Users**: New Day button now works reliably, enhanced visual experience
- **License**: Continue using under new CC BY-NC-SA 4.0 terms
- **Commercial Use**: Requires explicit permission from author
- **Derivative Works**: Must be shared under same CC BY-NC-SA 4.0 license

---

## [2.0.1] - 2025-12-08

### 🐛 BUG FIX: Time Overflow Distribution

This patch release fixes a critical bug where actions spanning multiple periods (day→night or night→day) didn't properly distribute hours across both periods.

### Fixed
- **Proper Time Overflow Distribution**: Actions that exceed period limits now correctly split hours
  - Day period fills to maximum (12h) before overflow transfers to night
  - Night period fills to maximum (12h) before overflow transfers to day
  - Progress bars now accurately reflect time spent in each period
  - Fixes issue where all action hours were added to current period only

### Example Scenario
**Before v2.0.1:**
- Agent has 11/12h used in day period
- Adds 3h action
- Result: Day shows 14/12h (incorrect overflow), Night shows 0/12h

**After v2.0.1:**
- Agent has 11/12h used in day period
- Adds 3h action
- Result: Day shows 12/12h (filled to max), Night shows 2/12h (overflow)

### Impact
Essential fix for accurate time tracking in campaigns using day/night mechanics. Ensures progress bars display correctly when actions span multiple periods.

---

## [2.0.0] - 2025-12-08

### 🎯 DIALOGV2 MIGRATION & SMART ARCHIVING

This major release fully migrates all dialogs to Foundry VTT v13+ DialogV2 API, removes all deprecation warnings, and introduces intelligent completed actions archiving.

### Changed
- **DialogV2 Complete Migration**: All dialogs now use modern DialogV2 API
  - Time Management Dialog: Native FormData handling replaced with direct DOM queries
  - Agent Tracker Dialog: Complete jQuery removal, native DOM event handling
  - Action Queue Dialog: Modern _onRender lifecycle with event delegation
  - Action Selection Dialog: Full DialogV2 rewrite with proper callback handling
  - Zero deprecation warnings on Foundry VTT v13+

- **Smart Completed Actions Management**: "Clear All" button replaced with "Clear Completed"
  - Only removes completed actions from queue (preserves active actions)
  - Automatically archives completed actions to respective agents
  - Shows count of archived actions with confirmation message
  - Notifies when no completed actions exist
  - Full socket synchronization for multiplayer

- **Code Architecture Improvements**:
  - Singleton pattern for all dialogs prevents multiple instances
  - Event delegation for dynamic content handling
  - Native addEventListener replaces jQuery event handlers
  - Improved socket message routing with operation-based handling
  - Better lifecycle management with getInstance() methods

### Added
- **New Translation Keys**:
  - `no-completed-actions`: Notification when queue has no completed actions
  - `completed-actions-cleared`: Confirmation message with action count
  - Multilingual support (Polish/English) for all new features

### Fixed
- Removed unused ActionSelectionDialog import from main.mjs
- Fixed real-time synchronization for action completion checkboxes
- Improved dialog refresh mechanism using close+show pattern
- Better handling of concurrent socket messages

### Technical Details
- **Breaking Change**: Requires Foundry VTT v13+ for DialogV2 support
- **Backward Compatibility**: DialogV2 API ensures future-proofing
- **Performance**: Native DOM operations faster than jQuery equivalents
- **Maintainability**: Cleaner code structure with modern JavaScript patterns

**Impact**: Major architectural improvement ensuring long-term compatibility with Foundry VTT updates!

---

## [1.4.0] - 2025-10-23

### 🎯 RESIZABLE DIALOGS WITH DYNAMIC SCALING

This release adds full resizable support to all major dialog windows with intelligent content scaling, perfect for high-resolution displays.

### Added
- **Resizable Dialog Windows**: All major dialogs now support dynamic resizing
  - Agent Tracker window can be resized by dragging the bottom-right corner
  - Action Queue window can be resized by dragging the bottom-right corner
  - Minimum dimensions enforced (450x300px) to maintain usability
  - Initial size: 600x500px for optimal viewing

- **Proportional Content Scaling**: All UI elements scale intelligently with window size
  - Text sizes adjust using clamp() for optimal readability (0.55rem - 1.5rem range)
  - Buttons, avatars, and progress bars scale proportionally
  - Responsive font sizes using viewport-based units (vw/vh)
  - Dynamic padding and spacing based on window dimensions

- **High-Resolution Display Support**: Optimized for 1440p, 4K, and ultrawide monitors
  - Content remains readable at any window size
  - No more tiny text on high-resolution displays
  - Users can customize window size to their preference
  - Better multitasking support with flexible layouts

### Enhanced
- **Agent Tracker Scaling**: All elements resize proportionally
  - Agent avatars: 40px-60px based on window size
  - Agent names: 0.75rem-1rem responsive font size
  - Progress bars: 10px-16px height with dynamic segment width
  - Control buttons: Fully scalable padding and font sizes
  - Time adjustment controls scale with viewport

- **Action Queue Scaling**: Complete responsive redesign
  - Action names: 0.9rem-1.3rem for better visibility
  - Action details: 0.75rem-1rem with improved readability
  - Action cost badges: Dynamically sized with responsive padding
  - All buttons scale proportionally with window size

- **Dialog Management**: Improved window behavior
  - Content scrolls smoothly when exceeding window bounds
  - Maintains aspect ratio during resize operations
  - Better overflow handling for long content lists
  - Optimized for both portrait and landscape orientations

### Technical Improvements
- Implemented CSS clamp() for min/max value constraints
- Added viewport-relative units (vw/vh) for dynamic sizing
- Enhanced flexbox layouts for better content distribution
- Improved overflow and scroll behavior for nested elements

### Fixed
- Removed fixed height limits causing unnecessary scrollbars
  - Agent tracker window no longer has max-height constraint
  - Action queue window expands dynamically with content
  - Both windows now resize naturally with their content

## [1.3.0] - 2025-09-24

### 🎨 UI/UX ENHANCEMENTS & POPOUT SUPPORT

This release focuses on visual improvements and enhanced user experience with popout window support for better multitasking during gameplay.

### Added
- **Popout Window Support**: All dialog windows can now be popped out into separate browser windows
  - Manual popout button added to dialog headers when PopOut module is active
  - Enhanced compatibility with PopOut module for seamless window management
  - Independent window positioning, sizing, and focus management
  - Perfect for multitasking during extended gaming sessions

- **Enhanced Dialog Management**: Improved window handling and user experience
  - Automatic popout button detection and manual fallback implementation
  - Better dialog positioning and sizing for optimal workflow
  - Enhanced window state management and restoration

### Enhanced
- **Action Queue Visual Improvements**: Better visual hierarchy and readability
  - Fixed delete button sizing with consistent 40px width to prevent stretching
  - Improved action name visibility with proper text wrapping and overflow handling
  - Enhanced completed action styling with better contrast and readability
  - Optimized layout spacing and padding for cleaner appearance

- **Dialog Layout Optimization**: Responsive design improvements
  - Automatic dialog width adjustment based on content (max 900px)
  - Reduced margins and padding for more efficient space usage
  - Better button alignment and visual consistency across all dialogs
  - Improved mobile and tablet responsiveness

### Fixed
- **Action Queue Layout Issues**: Resolved visual and functional problems
  - Fixed delete button stretching by implementing fixed width constraints
  - Corrected action name visibility issues with improved CSS text properties
  - Fixed dialog overflow problems with enhanced max-width handling
  - Resolved layout cramping when all UI elements are present (GM view)

- **Completed Action Display**: Enhanced readability of finished actions
  - Changed completed action text color from barely visible gray to dark green
  - Maintained visual distinction while improving accessibility
  - Better contrast ratio for users with visual impairments
  - Consistent styling with active action appearance

### Technical Changes
- **CSS Layout Improvements**: Modern flexbox optimizations
  - Added `flex-shrink: 0` to all interactive elements to prevent unwanted stretching
  - Implemented `min-width` constraints for action info sections
  - Enhanced text overflow handling with `word-wrap` and `overflow: visible`
  - Optimized padding and margin values for better space utilization

- **Dialog System Enhancements**: Better window management
  - Added manual popout button functionality for PopOut module compatibility
  - Enhanced dialog creation with better option handling
  - Improved error handling for dialog operations
  - Better integration with Foundry's window management system

### Developer Notes
This release addresses the final UI/UX issues and adds modern window management capabilities. The popout functionality greatly improves the gaming experience by allowing GMs and players to keep multiple windows open simultaneously.

**Key Improvements**:
- Popout windows enable better multitasking during complex scenes
- Fixed visual issues that were causing layout problems
- Enhanced accessibility with better color contrast
- Modern CSS practices for better cross-browser compatibility

**Testing Focus**: Extensive testing of dialog layouts, popout functionality, and visual consistency across different screen sizes and Foundry versions.

## [1.2.0] - 2025-09-22

### 🎉 FOUNDRY VTT v13 COMPATIBILITY

This major release adds full compatibility with Foundry VTT v13 while maintaining backward compatibility with v12.

### Added
- **Foundry VTT v13 Support**: Complete compatibility with the latest Foundry version
  - Updated module.json compatibility range: minimum "12.331", verified "13.348", maximum "13"
  - Enhanced scene control registration system for v13's new Application v2 API
  - Automatic detection and handling of v13's object-based controls structure
  - Robust fallback mechanisms ensure controls appear regardless of Foundry version

- **Advanced Scene Control Registration**: Multi-layer approach to ensure controls always appear
  - Primary: Enhanced `getSceneControlButtons` hook with v13 object structure support
  - Secondary: Intelligent fallback system adds tools directly to tokens control
  - Tertiary: Own control category creation when primary methods fail
  - Automatic structure detection (array vs object) for cross-version compatibility

- **Comprehensive Debugging System**: Extensive logging for troubleshooting v13 compatibility
  - Hook execution tracking to identify when core hooks aren't called
  - Scene control structure analysis showing available controls and tools
  - Tool registration status monitoring with before/after comparisons
  - Real-time feedback on fallback mechanism activation

### Enhanced
- **Robust Control Registration**: Multiple registration strategies ensure 100% reliability
  - Hook-based registration for standard Foundry behavior
  - Direct UI manipulation for v13 compatibility issues
  - Automatic retry mechanisms with increasing delays (3s, 6s)
  - Persistent validation checks to ensure tools remain registered

- **Cross-Version Architecture**: Seamless operation across Foundry versions
  - Automatic detection of controls structure (v12 arrays vs v13 objects)
  - Dynamic tool handling supporting both `.tools[]` arrays and `.tools{}` objects
  - Backward-compatible code paths for all Foundry versions
  - Future-proof design for upcoming Foundry releases

- **Error Recovery Systems**: Comprehensive error handling and automatic recovery
  - Graceful degradation when primary registration methods fail
  - Multiple fallback strategies prevent complete registration failure
  - Enhanced error logging with specific failure point identification
  - Automatic UI refresh triggers to force control re-rendering

### Fixed
- **Scene Control Registration Failures**: Resolved v13 compatibility issues
  - Fixed `controls.find is not a function` errors in v13
  - Corrected `tools.some is not a function` errors with object tools
  - Resolved scene controls not appearing after Foundry updates
  - Fixed controls disappearing after UI refreshes

- **Hook System Changes**: Adapted to v13's modified hook behavior
  - Enhanced `getSceneControlButtons` hook to handle object parameters
  - Added alternative registration paths when core hooks don't fire
  - Improved timing of control registration to match v13 lifecycle
  - Fixed race conditions in control registration timing

### Technical Changes
- **Scene Control Architecture**: Completely rewritten for v13 compatibility
  - `addTimeManagementTools()` now supports both array and object tools
  - Enhanced structure detection with comprehensive type checking
  - Direct object property assignment for v13 tools objects
  - Preserved array handling for v12 backward compatibility

- **Registration Flow**: Multi-stage registration process
  - Stage 1: Standard hook-based registration (works in both v12/v13)
  - Stage 2: Direct manipulation fallback (v13 compatibility)
  - Stage 3: Own category creation (ultimate fallback)
  - Each stage includes comprehensive logging and validation

- **Debugging Infrastructure**: Production-ready debugging system
  - Hook execution monitoring with success/failure tracking
  - Scene control structure logging for troubleshooting
  - Tool registration state tracking with detailed before/after states
  - Performance monitoring of fallback mechanism activation

### Compatibility
- **Foundry VTT**: Verified compatible with v12.331 - v13.348
- **Backward Compatibility**: All v12 functionality preserved
- **Forward Compatibility**: Architecture designed for future Foundry releases
- **System Support**: Delta Green (primary), adaptable to other systems

### Developer Notes
The v13 compatibility update represents a significant architectural enhancement to handle Foundry's transition from the legacy UI system to the new Application v2 API. The scene controls registration system has been completely rewritten to be version-agnostic while providing multiple fallback mechanisms.

**Key Changes for v13**:
- Scene controls structure changed from array to object
- Tools structure changed from array to object  
- Hook timing and execution patterns modified
- Direct UI manipulation sometimes required for control registration

**Migration Impact**: 
- No breaking changes for existing users
- Automatic detection and handling of both v12 and v13 structures
- Zero configuration required - works out of the box

**Testing Status**: Extensively tested across multiple Foundry versions and scenarios including:
- Fresh installations on v13
- Upgrades from v12 to v13
- Module load/reload cycles
- UI refresh scenarios
- Multiple users and permission levels

## [1.1.0] - 2025-08-29

### Fixed
- **CRITICAL: Agent Time Adjustment Synchronization**: Fixed issue where GM's +1h/-1h buttons for individual agents didn't sync progress bars to players in real-time
  - Root cause: Socket communication was not properly initialized for players joining after GM
  - Players' progress bars remained static while GM could see updates immediately
  - Affected multiplayer experience where GM actions weren't visible to players

### Enhanced
- **Socket Communication Reliability**: Completely redesigned socket initialization system
  - Added `socketInitialized` flag to track registration status
  - Implemented multiple initialization attempts with retry logic
  - Socket now re-initializes when players open agent tracking windows
  - Added automatic fallback initialization 2 seconds after ready hook

- **Real-time Synchronization Robustness**: 
  - Enhanced socket message handling with comprehensive logging
  - Added user identification in all socket debug messages
  - Improved error handling for socket communication failures
  - Better detection of GM vs Player message routing

- **Debugging and Monitoring**: 
  - Added extensive logging throughout socket lifecycle
  - Enhanced agent time adjustment logging with before/after states
  - Improved visibility into data transmission between GM and players
  - Better error reporting for troubleshooting sync issues

### Technical Changes
- **Socket Management**: 
  - Modified `initializeSocket()` to prevent duplicate handler registration
  - Added socket cleanup before re-registration to avoid conflicts
  - Enhanced timing for socket initialization in game lifecycle
  - Implemented socket health checking and automatic recovery

- **Player Experience**: 
  - Socket initialization now happens both at startup AND when opening tracker
  - Added user-specific logging to identify connection issues
  - Improved data validation in `updateDataFromGM()` function
  - Enhanced window refresh mechanisms for real-time updates

- **GM Experience**:
  - Added detailed transmission logs for debugging multiplayer issues
  - Enhanced agent time adjustment feedback with mode and time tracking
  - Improved notification system for successful time adjustments
  - Better visibility into which players receive updates

### Developer Notes
This release resolves the final critical multiplayer synchronization issue where GM actions weren't immediately visible to players. The socket communication system has been completely reinforced with multiple fallback mechanisms and comprehensive debugging.

**Impact**: GM's individual agent time adjustments (+1h/-1h buttons) now properly synchronize progress bars to all connected players in real-time.

**Breaking Change**: None - fully backward compatible with enhanced reliability.

## [1.0.6] - 2025-08-29

### Fixed
- **CRITICAL: Player Archive Visibility**: Fixed issue where players saw empty archive windows
  - Root cause: GM wasn't sending archive data to players via socket communication
  - Solution: Added `actionArchive` to `sendCurrentDataToUser()` function
  - Players can now see complete action history for their agents

- **CRITICAL: Time Settings Persistence**: Resolved complete loss of time settings after Foundry restart
  - Root cause: Incorrect setting name reference (`"currentTime"` vs `"currentGameTime"`)
  - Functions affected: `loadCurrentTimeFromSettings()` and `saveCurrentTimeToSettings()`
  - All time data (hours, day, year) now persists correctly across sessions and version upgrades

### Enhanced  
- **Data Synchronization**: Improved GM-to-Player data transmission
  - Archive data now included in all current data requests from players
  - Enhanced logging shows number of agents when sending archive data
  - Better debugging information for data sync operations

- **Time Management Robustness**: 
  - Added proper `year` field handling in time loading functions
  - Enhanced error logging for time operations
  - More comprehensive time data validation

### Technical Changes
- **Socket Communication**: Modified `sendCurrentDataToUser()` to include complete archive data
- **Settings Consistency**: All time-related functions now use correct `"currentGameTime"` setting name
- **Deployment Workflow**: Added `deploy-to-modules.ps1` script for easier updates to Foundry modules folder

### Developer Notes
This release addresses the two most critical issues reported by users:
1. Empty player archive windows (now players see full action history)
2. Loss of time settings after restart (time data now persists correctly)

**Breaking Change**: None - this is a backward-compatible bug fix release.

## [1.0.5] - 2025-08-29

### Fixed
- **Critical Archive Persistence Bug**: Resolved issue where agent action archives were completely empty after Foundry VTT restart
  - Root cause: Foundry world settings were unreliable for persistent data storage
  - Archive data was being lost between game sessions despite appearing to save correctly

### Added
- **File-Based Archive Storage System**: Revolutionary new approach to data persistence
  - Individual JSON files for each agent stored in world directory (`from-time-management-agent-[ID].json`)
  - Files are saved in `Data/worlds/[world-name]/` alongside other world data
  - Automatic one-time migration from old settings-based storage to new file system
  - Dual storage approach: files for reliability + settings as backup

- **Enhanced Data Persistence Architecture**:
  - `saveActionArchiveToFiles()` - Creates individual agent archive files
  - `loadActionArchiveFromFiles()` - Reads from files with automatic fallback to settings
  - `migrateArchiveToFiles()` - One-time migration for existing installations
  - Asynchronous initialization for proper file system access

### Improved
- **Robust Error Handling**: Multiple fallback layers ensure data is never lost
  - If file system fails, automatically falls back to settings storage
  - Comprehensive error logging for troubleshooting
  - Graceful degradation when file access is restricted

- **Performance Optimizations**: 
  - Asynchronous file operations don't block UI
  - Efficient file browsing and loading mechanisms
  - Reduced dependency on Foundry's settings system

### Technical Changes
- **Breaking Change**: `initializeSettings()` is now async - automatically handled
- **New Functions**: Added comprehensive file-based storage system
- **Migration Path**: Seamless upgrade from 1.0.4 with automatic data migration
- **Backwards Compatibility**: Falls back to settings if file system unavailable

### Developer Notes
- Files are created with proper JSON formatting for manual inspection/editing
- Archive files can be backed up, shared, or manually edited if needed
- System is designed to work even in restricted file system environments
- Future-proofs the module against Foundry settings limitations

**Upgrade Impact**: This version should finally resolve all archive persistence issues. Existing users will automatically have their data migrated to the new file system on first launch of v1.0.5.

## [1.0.4] - 2025-08-28

### Added
- **Action Archive System**: Complete historical tracking of all agent actions
  - Permanent archive of all completed, removed, and deleted actions
  - Day-based grouping with collapsible sections for easy navigation
  - Individual archive window for each agent accessible via "Archive Actions" button
  - Never lose track of what agents have done throughout the campaign
  - Full action details preserved including time, mode, and timestamps

- **Agent Visual Themes**: Unique visual differentiation for each agent
  - 10 distinct horror-themed gradient backgrounds automatically assigned
  - Hash-based color assignment ensures consistent themes per agent
  - Enhanced readability while maintaining atmospheric Delta Green aesthetic
  - Easy agent identification at a glance in multi-agent scenarios

- **Improved Interface Layout**: Redesigned agent tracker interface
  - Two-row layout: header (avatar, name, progress) and controls (action buttons)
  - GM time calibration controls elegantly positioned next to progress bars
  - Optimal button sizing and spacing for better usability
  - Responsive design that adapts to window size constraints

### Enhanced
- **Button Layout Optimization**: Perfect horizontal alignment of action buttons
  - Compact button design (80px max width) fits within interface bounds
  - Intelligent flex layout prevents vertical stacking issues
  - Consistent spacing and sizing across all interface elements
  - No more horizontal scrolling or cramped interfaces

- **Archive Data Persistence**: Bulletproof data storage system
  - Fixed initialization order ensuring archive data loads correctly after restarts
  - Enhanced error handling and logging for troubleshooting
  - World-level settings integration for seamless data persistence
  - Comprehensive data validation and recovery mechanisms

- **Time Control Interface**: GM controls repositioned for better workflow
  - Manual time adjustment buttons (+1h/-1h) now positioned logically next to agent progress
  - Cleaner separation between action controls and time management
  - Intuitive layout that follows natural GM workflow patterns

### Fixed
- **Archive Loading Bug**: Resolved issue where action archive appeared empty after restart
  - Fixed hook initialization order in Foundry VTT lifecycle
  - Proper settings loading sequence ensures all data is available
  - Enhanced logging helps identify and prevent future data loss
- **Interface Scaling Issues**: Solved problems with button overflow and layout chaos
  - Optimal window sizing (400-480px) accommodates all elements
  - Flexible button containers prevent layout breaking
  - Responsive design works across different screen sizes

### Improved
- **User Experience**: More intuitive and visually appealing interface
  - Logical grouping of related controls and information
  - Clear visual hierarchy guides user attention
  - Consistent design language throughout all dialogs
- **Performance**: Optimized data handling and interface rendering
  - Efficient archive storage and retrieval mechanisms
  - Reduced unnecessary DOM updates
  - Better memory management for large action histories

### Technical
- Enhanced `initializeSettings()` ensures proper data loading sequence
- New `agent-header-row` and `agent-controls-row` CSS classes for layout control
- Improved socket synchronization for archive data
- Added comprehensive logging for debugging and monitoring
- Optimized CSS with modern flexbox layout techniques

## [1.0.3] - 2025-08-28

### Fixed
- **Synchronization Issues**: Resolved duplicate function definitions causing sync failures between GM and players
- **Real-time Updates**: Progress bars now properly refresh when GM adjusts time or adds actions for all users
- **Polish Translations**: Restored missing Polish translations in agent tracker interface
- **Socket Communication**: Fixed conflicting socket message handlers causing "undefined properties" errors

### Changed
- **Time Adjustment Simplified**: Removed 0.5h adjustment buttons, now using only full hour increments (±1h)
- **Better Error Handling**: Improved socket message processing with proper data structure validation
- **Enhanced Translations**: Added missing localization strings for agent activity interface

### Improved
- **Real-time Synchronization**: More reliable data syncing across all connected clients
- **UI Consistency**: All interface elements now properly use localized text
- **Performance**: Reduced duplicate function calls and improved refresh mechanisms

## [1.0.2] - 2025-08-28

### Added
- **Manual Time Adjustment**: GM can now manually adjust agent time using +/- buttons (0.5h and 1h increments)
- **Enhanced Visual Design**: Active actions now have distinct green styling with borders and shadows
- **Improved Readability**: Increased font sizes in action queue for better accessibility (16px action names, 14px details)
- **Better UX**: Time adjustment controls integrated directly into agent tracker interface

### Improved
- **Visual Hierarchy**: Active actions are more prominently displayed with green accent colors
- **Accessibility**: Larger fonts and better contrast for users with vision difficulties  
- **GM Controls**: Quick time adjustment without needing to create/delete actions
- **User Feedback**: Clear notifications when time is manually adjusted

### Technical
- Added `adjustAgentTime()` method for precise time control
- Enhanced CSS styling for better visual separation between active and completed actions
- Improved tooltip system for time adjustment buttons

## [1.0.1] - 2025-08-28

### Improved
- **Action Queue Sorting**: Completed actions now automatically move to the bottom of the action queue
- **Visual Separation**: Added visual separator between active and completed actions
- **Enhanced Feedback**: Improved notifications when actions are completed or reactivated
- **Better UX**: Active actions remain at the top for better workflow management

### Fixed
- Action queue sorting now properly prioritizes active actions over completed ones
- Visual styling improvements for completed action indicators

## [1.0.0] - 2025-08-20

### Added
- **Complete Time Management System**
  - Real-time game clock with day/hour tracking
  - "Day in Town" counter for extended stays
  - GM-controlled time settings with manual override
  - Automatic time progression and updates

- **Agent Activity Tracking**
  - Individual progress bars for each agent
  - Separate day/night time tracking (12 hours each)
  - Visual progress indicators with color-coded warnings (green/orange/red)
  - Real-time synchronization across all connected clients

- **Action Queue System**
  - 8 pre-defined action templates with appropriate time costs
  - Custom action creation for unique scenarios
  - Automatic time allocation to agent progress bars
  - Overflow handling between day/night periods with confirmation dialogs
  - Completion tracking and queue management

- **Real-time Multiplayer Support**
  - Socket-based synchronization using `module.from-time-management` events
  - Automatic UI updates across all connected clients
  - Permission system (players manage own characters, GM controls all)
  - Persistent data storage in world settings

- **Day/Night Cycle Management**
  - Visual mode switching between day and night tracking
  - Automatic overflow between periods when 12-hour limits exceeded
  - Confirmation dialogs for time limit violations
  - "New Day" functionality to reset all progress and advance day counter

- **User Interface**
  - Three integrated control buttons in token controls bar
  - Responsive dialogs with automatic sizing
  - Themed CSS matching Delta Green aesthetic
  - Smooth animations and visual feedback

- **Localization Support**
  - Complete English (en) translations
  - Complete Polish (pl) translations
  - Extensible localization system for additional languages

- **Action Templates**
  - Short Rest (1h) - Quick recuperation
  - NPC Conversation (1h) - Social interactions
  - Explore Near Town (3h) - Local area investigation
  - Investigate Location (1h) - Detailed examination
  - Meal at Diner (1h) - Food and social time
  - Medical Care (2h) - Treatment for light wounds
  - Travel Town ↔ Colony House (1h) - Transportation
  - Forest Exploration (6h) - Extended wilderness search

- **Advanced Features**
  - Overflow warnings when actions exceed time limits
  - Automatic time redistribution between day/night periods
  - Chat integration for time broadcasts and notifications
  - Force refresh mechanisms for UI synchronization
  - Complete error handling and logging

### Technical Details
- **Compatibility**: Foundry VTT v12.331+
- **System Requirements**: Delta Green system (adaptable to others)
- **Dependencies**: None (standalone module)
- **Socket Protocol**: Custom events for real-time sync
- **Data Persistence**: World-level settings storage
- **Performance**: Optimized for real-time updates without lag

### Documentation
- Comprehensive README with usage instructions
- Inline code documentation and comments
- Example usage scenarios and best practices
- Troubleshooting guide and support information

### Initial Release Notes
This is the initial release of the FROM Time Management System, converted from a macro-based system to a full Foundry VTT module. The system has been thoroughly tested for stability, performance, and multi-user synchronization.

The module is inspired by the time mechanics from the FROM TV series, where characters must carefully manage their daily activities within the confines of a mysterious town. Perfect for Delta Green campaigns involving extended investigations or survival scenarios.

---

## Future Planned Features (Roadmap)

### [1.1.0] - Future Release
- Additional action templates based on user feedback
- Calendar view with historical tracking
- Export/import functionality for campaign data
- Advanced reporting and statistics

### [1.2.0] - Future Release
- Integration with other time/calendar modules
- Automated weather and event triggers
- Resource consumption tracking
- NPC schedule management

### [1.3.0] - Future Release
- Additional language translations
- Custom theming options
- Mobile/tablet interface optimizations
- Advanced permission controls

---

*Note: Dates and version numbers for future releases are tentative and subject to change based on development priorities and community feedback.*
