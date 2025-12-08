# 🐛 Version 2.0.1: Time Overflow Distribution Fix

## Overview
This **patch release** fixes a critical bug where actions spanning multiple periods (day→night or night→day) didn't properly distribute hours across both periods.

## 🐛 Bug Fixed

### Time Overflow Distribution
**The Problem:**
- When an action exceeded a period's remaining time, all hours were added to the current period only
- Progress bars showed incorrect values (>12h in a single period)
- Overflow to the next period wasn't calculated
- Example: Agent with 11/12h in day adds 3h action → Day showed 14/12h, Night showed 0/12h ❌

**The Solution:**
- Actions now properly split hours between periods
- Current period fills to maximum (12h) first
- Remaining hours transfer to the opposite period
- Both progress bars update accurately

### Example Scenarios

#### Day → Night Overflow
**Before v2.0.1:**
```
Agent: 11/12h in day
Action: 3h (e.g., 17:00-20:00)
Result:
  Day: 14/12h ❌ (incorrect overflow)
  Night: 0/12h
```

**After v2.0.1:**
```
Agent: 11/12h in day
Action: 3h (e.g., 17:00-20:00)
Result:
  Day: 12/12h ✅ (filled to max)
  Night: 2/12h ✅ (overflow)
```

#### Night → Day Overflow
**Before v2.0.1:**
```
Agent: 10/12h in night
Action: 4h (e.g., 02:00-06:00)
Result:
  Night: 14/12h ❌ (incorrect overflow)
  Day: 0/12h
```

**After v2.0.1:**
```
Agent: 10/12h in night
Action: 4h (e.g., 02:00-06:00)
Result:
  Night: 12/12h ✅ (filled to max)
  Day: 2/12h ✅ (overflow)
```

## 🎯 Impact

### Who Should Update?
**Essential for:**
- Campaigns actively using day/night time tracking
- GMs tracking agent activities across multiple periods
- Anyone experiencing incorrect progress bar values

### What Gets Fixed?
- ✅ Accurate time tracking across day/night cycles
- ✅ Correct progress bar visualization
- ✅ Proper hour distribution for overflow actions
- ✅ Realistic time management enforcement

### Migration Notes
- **No data migration needed** - fix applies to newly added actions
- **Existing actions**: Previously added actions retain their values (won't be retroactively corrected)
- **Seamless upgrade**: Simply update and continue playing

## 📦 Installation

### Method 1: Foundry VTT Module Browser (Recommended)
1. Open Foundry VTT
2. Go to "Add-on Modules" tab
3. Find "FROM Time Management" in your installed modules
4. Click "Update" if available
5. Restart Foundry VTT

### Method 2: Manifest URL
```
https://github.com/ZuraffPL/FROM-Time-Management-Module/releases/latest/download/module.json
```

### Method 3: Manual Installation
1. Download `from-time-management-v2.0.1.zip` below
2. Extract to `Data/modules/` in your Foundry directory
3. Replace existing files
4. Restart Foundry VTT

## 🔄 Upgrading from v2.0.0

### Automatic Update
Simply update through Foundry's module manager. All settings and data are preserved.

### What Changes?
- **New actions**: Will correctly distribute hours across periods
- **Existing actions**: Keep their current values (no retroactive changes)
- **Progress bars**: Display accurately for all new actions
- **No configuration needed**: Fix works automatically

## 🔧 Technical Details

### Code Changes
Modified `addActionToQueue()` function in `agent-tracker-dialog.js`:

**New Logic:**
```javascript
if (crossesPeriods) {
  if (trackingMode === 'day') {
    const remainingDayTime = 12 - timeSpent;
    const overflowToNight = actionCost - remainingDayTime;
    
    dayTimes[agentId] = 12; // Fill day to max
    nightTimes[agentId] = (nightTimes[agentId] || 0) + overflowToNight;
  } else {
    const remainingNightTime = 12 - timeSpent;
    const overflowToDay = actionCost - remainingNightTime;
    
    nightTimes[agentId] = 12; // Fill night to max
    dayTimes[agentId] = (dayTimes[agentId] || 0) + overflowToDay;
  }
}
```

### Testing Recommendations
After updating, test with:
1. Add action near end of day period (e.g., 11/12h used)
2. Make action cost exceed remaining time
3. Verify day fills to 12/12h
4. Verify night shows overflow hours
5. Repeat for night → day transition

## 📊 Compatibility

| Foundry Version | Status |
|----------------|--------|
| v12.331 - v12.x | ✅ Supported |
| v13.0 - v13.350+ | ✅ Fully Supported |
| v14.0+ | ✅ Expected Compatible |

**System**: Delta Green (adaptable to other systems)  
**Dependencies**: None  
**Languages**: English, Polish

## 🙏 Credits

**Developed by**: Zuraff with GitHub Copilot Assistant

**Bug Report**: Community feedback - thank you for reporting this issue!

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

---

**Release Type**: Patch (Bug Fix)  
**Urgency**: High (for users using day/night tracking)  
**Data Safety**: All existing data preserved  
**Update Recommendation**: Update immediately if using day/night mechanics
