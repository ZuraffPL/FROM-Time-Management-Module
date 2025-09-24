# FROM Time Management System - Version History

## Version 1.3.0 (2025-09-24) - CURRENT RELEASE
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
