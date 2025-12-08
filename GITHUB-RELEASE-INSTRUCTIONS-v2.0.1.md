# GitHub Release Instructions for v2.0.1

## 📋 Pre-Release Checklist

### ✅ Code Changes Completed
- [x] Time overflow distribution bug fixed
- [x] Proper hour splitting between day/night periods
- [x] Progress bars now display accurately
- [x] All tests passed

### ✅ Documentation Updated
- [x] `module.json` - version 2.0.1
- [x] `README.md` - updated with v2.0.1 info
- [x] `CHANGELOG.md` - detailed v2.0.1 entry
- [x] `VERSION-HISTORY.md` - v2.0.1 summary
- [x] `RELEASE_NOTES_v2.0.1.md` - created

### 🔲 Release Preparation Steps

1. **Commit all changes**
```powershell
git add .
git commit -m "Release v2.0.1 - Fix time overflow distribution between periods"
```

2. **Create and push tag**
```powershell
git tag -a v2.0.1 -m "Version 2.0.1 - Time Overflow Distribution Fix"
git push origin main
git push origin v2.0.1
```

3. **Create release package**
```powershell
.\prepare-release-v2.0.1.ps1
```

---

## 🚀 GitHub Release Creation

### Release Title
```
FROM Time Management System v2.0.1 - Time Overflow Distribution Fix
```

### Release Tag
```
v2.0.1
```

### Release Type
☑️ **Latest release** (Set as the latest release)

---

## 📝 Release Description

Copy the following markdown to GitHub Release description:

```markdown
# 🐛 FROM Time Management System v2.0.1
## Time Overflow Distribution Fix

This **patch release** fixes a critical bug where actions spanning multiple periods (day→night or night→day) didn't properly distribute hours across both periods.

---

## 🐛 Bug Fixed

### Time Overflow Distribution

**The Problem:**
- Actions exceeding period limits added all hours to current period only
- Progress bars showed incorrect values (>12h in single period)
- No overflow calculation to next period
- Example: 11/12h + 3h action = 14/12h (day) + 0/12h (night) ❌

**The Solution:**
- ✅ Smart hour distribution across periods
- ✅ Current period fills to max (12h) first
- ✅ Remaining hours transfer to opposite period
- ✅ Accurate progress bar visualization

---

## 📊 Example Scenarios

### Day → Night Overflow

**Before v2.0.1:**
```
Agent: 11/12h in day
Action: 3h
Result: Day 14/12h ❌, Night 0/12h
```

**After v2.0.1:**
```
Agent: 11/12h in day
Action: 3h
Result: Day 12/12h ✅, Night 2/12h ✅
```

### Night → Day Overflow

**Before v2.0.1:**
```
Agent: 10/12h in night
Action: 4h
Result: Night 14/12h ❌, Day 0/12h
```

**After v2.0.1:**
```
Agent: 10/12h in night
Action: 4h
Result: Night 12/12h ✅, Day 2/12h ✅
```

---

## 🎯 Impact

### Essential Update For:
- Campaigns using day/night time tracking
- GMs tracking agent activities across periods
- Anyone experiencing incorrect progress bars

### What Gets Fixed:
- ✅ Accurate time tracking across day/night cycles
- ✅ Correct progress bar visualization
- ✅ Proper hour distribution for overflow actions
- ✅ Realistic time management enforcement

---

## 🔄 Upgrading

**Seamless upgrade** - all settings and data preserved!

- **New actions**: Correctly distribute hours
- **Existing actions**: Keep current values (no retroactive changes)
- **No configuration needed**: Fix works automatically

---

## 📊 Compatibility

| Foundry Version | Status |
|----------------|--------|
| v12.331 - v12.x | ✅ Supported |
| v13.0 - v13.350+ | ✅ Fully Supported |
| v14.0+ | ✅ Expected Compatible |

**System**: Delta Green  
**Dependencies**: None  
**Languages**: English, Polish

---

## 📥 Installation

### Automatic (Recommended)
1. Open Foundry VTT → Add-on Modules
2. Find "FROM Time Management"
3. Click "Update"
4. Restart Foundry

### Manifest URL
```
https://github.com/ZuraffPL/FROM-Time-Management-Module/releases/latest/download/module.json
```

### Manual
Download `from-time-management-v2.0.1.zip` below and extract to `Data/modules/`

---

## 📚 Documentation

- [Complete Changelog](https://github.com/ZuraffPL/FROM-Time-Management-Module/blob/main/CHANGELOG.md)
- [Version History](https://github.com/ZuraffPL/FROM-Time-Management-Module/blob/main/VERSION-HISTORY.md)
- [README](https://github.com/ZuraffPL/FROM-Time-Management-Module/blob/main/README.md)

---

**🔧 Bug Fix**: Essential update for accurate time tracking in day/night mechanics!

---

**Developed by**: Zuraff with GitHub Copilot Assistant  
**Release Type**: Patch (Bug Fix)  
**Urgency**: High (for users using day/night tracking)
```

---

## 📦 Assets to Upload

### Required Files:
1. **from-time-management-v2.0.1.zip** - Main module package
2. **module.json** - Standalone manifest file

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
- Select existing tag: `v2.0.1`
- Or create new tag: `v2.0.1` + "Create new tag on publish"

**Release title:**
```
FROM Time Management System v2.0.1 - Time Overflow Distribution Fix
```

**Description:**
- Paste the markdown from "Release Description" section above

**Attach files:**
- Upload `from-time-management-v2.0.1.zip`
- Upload `module.json` (standalone)

**Options:**
- ☑️ Set as the latest release
- ☐ Set as a pre-release (leave unchecked)

### 4. Publish Release
Click "Publish release" button

---

## ✅ Post-Release Verification

### 1. Verify Release on GitHub
- [ ] Release appears in releases list
- [ ] Tag `v2.0.1` is visible
- [ ] ZIP file downloads correctly
- [ ] `module.json` downloads correctly

### 2. Test Manifest URL
```
https://github.com/ZuraffPL/FROM-Time-Management-Module/releases/latest/download/module.json
```
Should return `module.json` for v2.0.1

### 3. Test ZIP Download
```
https://github.com/ZuraffPL/FROM-Time-Management-Module/releases/download/v2.0.1/from-time-management-v2.0.1.zip
```
Should download the ZIP package

### 4. Test Installation in Foundry
- [ ] Install via manifest URL in fresh world
- [ ] Verify version shows as 2.0.1 in module list
- [ ] Test overflow scenario (11/12h + 3h action)
- [ ] Verify day shows 12/12h and night shows 2/12h
- [ ] Check console for zero errors

---

## 📝 Notes

- This is a **patch version** release (2.0.1) - bug fix only
- Requires Foundry VTT v12.331+ (recommended v13.350+)
- No breaking changes
- Seamless upgrade for all users
- Critical fix for day/night tracking accuracy

---

**Release Manager**: Zuraff  
**Release Date**: 2025-12-08  
**Status**: Ready for release ✅
