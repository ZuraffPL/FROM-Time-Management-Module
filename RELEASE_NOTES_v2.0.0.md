# 🔄 Version 2.0.0: DialogV2 Migration & Smart Archiving

## Overview
This **major release** fully migrates FROM Time Management System to Foundry VTT v13+ modern DialogV2 API, eliminates all deprecation warnings, and introduces intelligent completed actions archiving system.

## 🆕 What's New

### Complete DialogV2 Migration
All dialogs have been rewritten using Foundry VTT's modern `foundry.applications.api.DialogV2`:
- **Time Management Dialog**: Native FormData handling with direct DOM queries
- **Agent Tracker Dialog**: Complete jQuery removal, native DOM event handling
- **Action Queue Dialog**: Modern `_onRender` lifecycle with event delegation
- **Action Selection Dialog**: Full DialogV2 rewrite with proper callback handling
- **Zero Deprecation Warnings**: Future-proof architecture for Foundry VTT updates

### Smart Completed Actions Management
Revolutionary "Clear Completed" functionality replaces the old "Clear All" button:
- ✅ **Selective Removal**: Only removes actions marked as completed
- ✅ **Automatic Archiving**: Completed actions automatically saved to agent archives
- ✅ **Preserves Active Actions**: Pending/in-progress actions remain in queue
- ✅ **Smart Notifications**: Shows count of archived actions
- ✅ **Multilingual Support**: Full Polish/English translations
- ✅ **Real-time Sync**: All players receive updates instantly via sockets

### Native DOM Event Handling
Complete removal of jQuery dependencies:
- Pure JavaScript `addEventListener` throughout codebase
- Native `querySelector` and `querySelectorAll` for DOM manipulation
- Event delegation for dynamic content (action items, checkboxes, buttons)
- Improved performance with native DOM operations
- Better maintainability with modern JavaScript patterns

### Singleton Pattern Implementation
Prevents duplicate dialog instances and enables robust socket communication:
- Static `_instance` property tracks open dialogs
- `getInstance()` methods allow socket handlers to reference specific instances
- Prevents UI conflicts from multiple dialog instances
- Clean lifecycle management with proper cleanup

## 🎯 Dialog-Specific Improvements

### Time Management Dialog
- Direct DOM queries replace deprecated FormData parsing
- Modern `DialogV2.confirm` for "New Day" confirmations
- Cleaner button callback implementation
- Better error handling and validation

### Agent Tracker Dialog
- Complete jQuery elimination (no more `.find()`, `.on()`, etc.)
- Native event listeners with proper delegation
- `close() + show()` pattern for reliable content refresh
- Enhanced socket synchronization for multiplayer

### Action Queue Dialog
- `_onRender` replaces deprecated `activateListeners`
- Smart "Clear Completed" button with archiving
- Real-time checkbox synchronization to all players
- Event delegation for all interactive elements
- Individual action deletion with archiving

### Action Selection Dialog
- Full DialogV2 architecture rewrite
- Native DOM handling for template selection
- Improved callback parameter handling
- Better user experience with instant feedback

## 🔧 Technical Improvements

### Architecture Enhancements
- **DialogV2 API**: All dialogs use modern `foundry.applications.api.DialogV2`
- **Native DOM**: Pure JavaScript DOM manipulation (zero jQuery)
- **Event Delegation**: Efficient handling of dynamic content
- **Singleton Pattern**: Instance management for socket communication
- **ES Modules**: Clean import/export structure

### Socket Communication
Improved real-time synchronization:
- `forceRefreshAgentTracker`: Synchronizes agent tracker across all clients
- `forceRefreshActionQueue`: Updates action queue for all players
- `addActionToQueue`: Handles action addition from players to GM
- Operation-based routing for extensibility

### New Translation Keys
- `no-completed-actions`: "No completed actions to clear"
- `completed-actions-cleared`: "Cleared {count} completed actions and moved to archive"
- Full multilingual support (Polish/English)

## 📦 Installation

### Method 1: Foundry VTT Module Browser (Recommended)
1. Open Foundry VTT
2. Go to "Add-on Modules" tab
3. Click "Install Module"
4. Search for "FROM Time Management"
5. Click "Install"

### Method 2: Manifest URL
```
https://github.com/ZuraffPL/FROM-Time-Management-Module/releases/latest/download/module.json
```

### Method 3: Manual Installation
1. Download `from-time-management-v2.0.0.zip`
2. Extract to `Data/modules/` in your Foundry directory
3. Restart Foundry VTT
4. Enable module in your world

## 🔄 Upgrading from Previous Versions

### Seamless Upgrade
Simply update through Foundry's module manager or replace files manually. All settings and data are preserved.

### What Changes for Users?
- **"Clear All" → "Clear Completed"**: GM action queue button now only removes completed actions
- **Better Performance**: Native DOM operations are faster than jQuery
- **No Deprecation Warnings**: Clean console with modern APIs
- **Improved Stability**: Singleton pattern prevents dialog conflicts

## 🐛 Bug Fixes

- ✅ Removed unused `ActionSelectionDialog` import from `main.mjs`
- ✅ Fixed real-time synchronization for action completion checkboxes
- ✅ Improved dialog refresh mechanism using `close() + show()` pattern
- ✅ Better handling of concurrent socket messages
- ✅ Eliminated all deprecation warnings from legacy Dialog API

## 💡 Usage Tips

### For Game Masters
1. **Clear Completed Actions**: Click "Clear Completed" in Action Queue to archive finished actions
   - Only completed actions are removed and archived
   - Active actions remain in queue
   - View archived actions in individual agent archives

2. **Monitor Console**: No more yellow deprecation warnings!

3. **Dialog Management**: Dialogs now prevent duplicate instances automatically

### For Players
- **Improved Responsiveness**: Native DOM operations provide snappier UI
- **Real-time Updates**: See GM's action completions instantly
- **Better Stability**: No more dialog conflicts

## 🎨 Workflow Improvements

### Before v2.0.0
1. GM marks actions as completed
2. GM clicks "Clear All" → **ALL** actions deleted
3. Lost track of pending actions
4. Had to recreate active action queue

### After v2.0.0
1. GM marks actions as completed
2. GM clicks "Clear Completed" → **ONLY completed** actions archived
3. Active actions remain in queue
4. Complete action history preserved in archives
5. All players see updates in real-time

## 🔍 Breaking Changes

### Requires Foundry VTT v13+
While the module maintains compatibility with v12.331+, full DialogV2 features require Foundry VTT v13 or higher for optimal experience.

### API Changes (for developers)
- All dialogs now extend `foundry.applications.api.DialogV2`
- `activateListeners` replaced with `_onRender` lifecycle
- jQuery removed - use native DOM APIs
- Singleton pattern required for socket-aware dialogs

## 📊 Compatibility Matrix

| Foundry Version | Status | Notes |
|----------------|--------|-------|
| v12.331 - v12.x | ✅ Supported | Basic functionality |
| v13.0 - v13.350+ | ✅ Fully Supported | Full DialogV2 features |
| v14.0+ | ✅ Expected Compatible | Future-proof design |

## 🙏 Credits

Developed by **Zuraff** with **GitHub Copilot Assistant**

Special thanks to the Foundry VTT community for feedback and testing.

## 📝 Complete Changelog

See [CHANGELOG.md](CHANGELOG.md) for detailed version history.

## 📄 License

MIT License - see [LICENSE](LICENSE) file

---

**Compatibility**: Foundry VTT v12.331+ (Recommended: v13.350+)  
**System**: Delta Green (adaptable to other systems)  
**Language Support**: English, Polish  
**Dependencies**: None (standalone module)

## 🔗 Links

- [GitHub Repository](https://github.com/ZuraffPL/FROM-Time-Management-Module)
- [Issue Tracker](https://github.com/ZuraffPL/FROM-Time-Management-Module/issues)
- [Changelog](https://github.com/ZuraffPL/FROM-Time-Management-Module/blob/main/CHANGELOG.md)
- [Version History](https://github.com/ZuraffPL/FROM-Time-Management-Module/blob/main/VERSION-HISTORY.md)
