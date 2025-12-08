# GitHub Release Instructions for v2.0.0

## 📋 Pre-Release Checklist

### ✅ Code Changes Completed
- [x] All dialogs migrated to DialogV2 API
- [x] jQuery completely removed from codebase
- [x] "Clear Completed" functionality implemented
- [x] Translation keys added (PL/EN)
- [x] Unused imports removed
- [x] All tests passed

### ✅ Documentation Updated
- [x] `module.json` - version 2.0.0
- [x] `README.md` - updated with v2.0.0 highlights
- [x] `CHANGELOG.md` - detailed v2.0.0 entry
- [x] `VERSION-HISTORY.md` - v2.0.0 summary
- [x] `RELEASE_NOTES_v2.0.0.md` - created

### 🔲 Release Preparation Steps

1. **Commit all changes**
```powershell
git add .
git commit -m "Release v2.0.0 - DialogV2 Migration & Smart Archiving"
```

2. **Create and push tag**
```powershell
git tag -a v2.0.0 -m "Version 2.0.0 - DialogV2 Migration & Smart Archiving"
git push origin main
git push origin v2.0.0
```

3. **Create release package**
```powershell
# Create clean zip without git files
$compress = @{
    Path = "d:\Foundry\Data\modules\from-time-management\*"
    CompressionLevel = "Optimal"
    DestinationPath = "d:\Foundry\Data\modules\from-time-management-v2.0.0.zip"
    Force = $true
}
Compress-Archive @compress

# Verify zip contains correct files
Expand-Archive -Path "d:\Foundry\Data\modules\from-time-management-v2.0.0.zip" -DestinationPath "d:\temp\verify-release" -Force
```

---

## 🚀 GitHub Release Creation

### Release Title
```
FROM Time Management System v2.0.0 - DialogV2 Migration & Smart Archiving
```

### Release Tag
```
v2.0.0
```

### Release Type
☑️ **Latest release** (Set as the latest release)

---

## 📝 Release Description

Copy the following markdown to GitHub Release description:

```markdown
# 🔄 FROM Time Management System v2.0.0
## DialogV2 Migration & Smart Archiving Release

This **major release** fully migrates FROM Time Management System to Foundry VTT v13+ modern DialogV2 API, eliminates all deprecation warnings, and introduces intelligent completed actions archiving.

---

## 🎯 Major Features

### ✅ Complete DialogV2 Migration
- **All dialogs rewritten** using modern `foundry.applications.api.DialogV2`
- **Zero deprecation warnings** on Foundry VTT v13+
- **Future-proof architecture** for upcoming Foundry updates
- **Native DOM handling** - jQuery completely removed
- **Singleton pattern** prevents duplicate dialog instances

### ✅ Smart Completed Actions Archiving
Revolutionary "Clear Completed" functionality:
- ✨ **Selective removal** - only completed actions archived
- ✨ **Preserves active actions** - pending tasks remain in queue
- ✨ **Automatic archiving** to agent history
- ✨ **Smart notifications** with action count
- ✨ **Real-time sync** across all players
- ✨ **Multilingual support** (Polish/English)

### ✅ Native DOM Event Handling
- Pure JavaScript `addEventListener` throughout
- Native `querySelector`/`querySelectorAll` for DOM manipulation
- Event delegation for dynamic content
- Improved performance over jQuery
- Better maintainability with modern patterns

---

## 🎨 Dialog-Specific Improvements

### Time Management Dialog
- Direct DOM queries replace deprecated FormData
- Modern `DialogV2.confirm` for confirmations
- Cleaner button callbacks

### Agent Tracker Dialog
- Complete jQuery elimination
- Native event listeners with delegation
- Enhanced socket synchronization

### Action Queue Dialog
- `_onRender` replaces deprecated `activateListeners`
- Smart "Clear Completed" with archiving
- Real-time checkbox synchronization

### Action Selection Dialog
- Full DialogV2 rewrite
- Native DOM template handling
- Improved callback parameters

---

## 🔧 Technical Highlights

**Architecture:**
- DialogV2 API throughout
- Event delegation for efficiency
- Singleton pattern for instance management
- ES Modules structure

**Socket Communication:**
- `forceRefreshAgentTracker` - sync agent tracker
- `forceRefreshActionQueue` - sync action queue
- `addActionToQueue` - player action requests
- Operation-based routing

**New Translation Keys:**
- `no-completed-actions`
- `completed-actions-cleared`

---

## 🐛 Bug Fixes

- ✅ Removed unused `ActionSelectionDialog` import
- ✅ Fixed real-time checkbox synchronization
- ✅ Improved dialog refresh with `close() + show()` pattern
- ✅ Better concurrent socket message handling
- ✅ Eliminated all deprecation warnings

---

## 📊 Compatibility

| Foundry Version | Status | Notes |
|----------------|--------|-------|
| v12.331 - v12.x | ✅ Supported | Basic functionality |
| v13.0 - v13.350+ | ✅ Fully Supported | Full DialogV2 features |
| v14.0+ | ✅ Expected Compatible | Future-proof |

**System**: Delta Green (adaptable to other systems)  
**Dependencies**: None (standalone module)  
**Language Support**: English, Polish

---

## 💡 Workflow Improvements

### Before v2.0.0
1. GM marks actions completed
2. GM clicks "Clear All" → **ALL actions deleted** ❌
3. Lost pending actions
4. Had to recreate queue

### After v2.0.0
1. GM marks actions completed
2. GM clicks "Clear Completed" → **Only completed actions archived** ✅
3. Active actions remain
4. Complete history preserved
5. Real-time sync to all players

---

## 📥 Installation

### Automatic (Recommended)
1. Open Foundry VTT
2. Go to "Add-on Modules"
3. Click "Install Module"
4. Search for "FROM Time Management"
5. Click "Install"

### Manifest URL
```
https://github.com/ZuraffPL/FROM-Time-Management-Module/releases/latest/download/module.json
```

### Manual
1. Download `from-time-management-v2.0.0.zip` below
2. Extract to `Data/modules/` in Foundry directory
3. Restart Foundry VTT
4. Enable module in your world

---

## 🔄 Upgrading

**Seamless upgrade** - all settings and data preserved!

Simply update through Foundry's module manager or replace files manually.

---

## 📚 Documentation

- [Complete Changelog](https://github.com/ZuraffPL/FROM-Time-Management-Module/blob/main/CHANGELOG.md)
- [Version History](https://github.com/ZuraffPL/FROM-Time-Management-Module/blob/main/VERSION-HISTORY.md)
- [README](https://github.com/ZuraffPL/FROM-Time-Management-Module/blob/main/README.md)

---

## 🙏 Credits

Developed by **Zuraff** with **GitHub Copilot Assistant**

Special thanks to the Foundry VTT community for feedback and testing!

---

**⚡ Impact**: Major architectural upgrade ensuring compatibility with current and future Foundry VTT versions!
```

---

## 📦 Assets to Upload

### Required Files:
1. **from-time-management-v2.0.0.zip** - Main module package
2. **module.json** - Standalone manifest file

### File Preparation:

**Create ZIP package:**
```powershell
# Navigate to module directory
cd "d:\Foundry\Data\modules\from-time-management"

# Create release ZIP (exclude git files and old zips)
$files = Get-ChildItem -Exclude @('.git', '.gitignore', '*.zip', 'GITHUB*.md', 'RELEASE_NOTES*.md', 'deploy-to-modules.ps1')
Compress-Archive -Path $files -DestinationPath "from-time-management-v2.0.0.zip" -CompressionLevel Optimal -Force
```

**Copy module.json:**
```powershell
Copy-Item "module.json" -Destination "module-v2.0.0.json"
```

---

## 🎯 Step-by-Step GitHub Release Process

### 1. Navigate to GitHub Repository
```
https://github.com/ZuraffPL/FROM-Time-Management-Module
```

### 2. Create New Release
- Click "Releases" tab
- Click "Draft a new release" button

### 3. Fill Release Form

**Choose a tag:**
- Select existing tag: `v2.0.0`
- Or create new tag: `v2.0.0` + "Create new tag on publish"

**Release title:**
```
FROM Time Management System v2.0.0 - DialogV2 Migration & Smart Archiving
```

**Description:**
- Paste the markdown from "Release Description" section above

**Attach files:**
- Upload `from-time-management-v2.0.0.zip`
- Upload `module.json` (standalone)

**Options:**
- ☑️ Set as the latest release
- ☐ Set as a pre-release (leave unchecked)
- ☑️ Create a discussion for this release (optional)

### 4. Publish Release
Click "Publish release" button

---

## ✅ Post-Release Verification

### 1. Verify Release on GitHub
- [ ] Release appears in releases list
- [ ] Tag `v2.0.0` is visible
- [ ] ZIP file downloads correctly
- [ ] `module.json` downloads correctly

### 2. Test Manifest URL
```
https://github.com/ZuraffPL/FROM-Time-Management-Module/releases/latest/download/module.json
```
Should return `module.json` for v2.0.0

### 3. Test ZIP Download
```
https://github.com/ZuraffPL/FROM-Time-Management-Module/releases/download/v2.0.0/from-time-management-v2.0.0.zip
```
Should download the ZIP package

### 4. Test Installation in Foundry
- [ ] Install via manifest URL in fresh world
- [ ] Verify version shows as 2.0.0 in module list
- [ ] Test all dialogs open without errors
- [ ] Verify "Clear Completed" button appears in Action Queue
- [ ] Check console for zero deprecation warnings

---

## 🔔 Post-Release Announcements

### Foundry VTT Discord
```
🔄 FROM Time Management v2.0.0 Released!

Major DialogV2 migration + smart completed actions archiving!

✅ Full Foundry v13+ DialogV2 API
✅ Zero deprecation warnings
✅ "Clear Completed" preserves active actions
✅ Complete jQuery removal
✅ Real-time multiplayer sync

Download: https://github.com/ZuraffPL/FROM-Time-Management-Module/releases/tag/v2.0.0
```

### Reddit r/FoundryVTT
Title: `[Module Update] FROM Time Management v2.0.0 - DialogV2 Migration & Smart Archiving`

---

## 📝 Notes

- This is a **major version** release (2.0.0) due to DialogV2 API changes
- Requires Foundry VTT v12.331+ (recommended v13.350+)
- Breaking changes for developers using internal APIs
- Seamless upgrade for end users
- All data preserved during upgrade

---

## 🆘 Rollback Plan

If critical issues discovered:

1. **Mark release as pre-release**
2. **Create hotfix branch from v1.4.0**
3. **Fix critical issues**
4. **Release v2.0.1 patch**

Files needed for rollback:
- Previous release: `v1.4.0`
- Previous ZIP: `from-time-management-v1.4.0.zip`

---

**Release Manager**: Zuraff  
**Release Date**: 2025-12-08  
**Status**: Ready for release ✅
