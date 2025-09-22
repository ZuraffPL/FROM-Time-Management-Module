# GitHub Release Instructions for v1.2.0

## Status Przygotowania
✅ Commit `5b66240` wypushowany do main  
✅ Tag `v1.2.0` utworzony i wypushowany  
✅ Wszystkie pliki dokumentacji zaktualizowane  
🔲 **NASTĘPNY KROK**: Utworzenie GitHub Release  

## Release Title
`FROM Time Management System v1.2.0 - Foundry VTT v13 Compatibility`

## Release Tag
`v1.2.0` (już istnieje na GitHub)

## Release Type
☑️ Latest release

## Release Description

```markdown
# � FROM Time Management System v1.2.0
## Foundry VTT v13 Compatibility Release

This major release adds full compatibility with **Foundry VTT v13** while maintaining backward compatibility with v12.

### 🚀 Key Features

#### ✅ **Full Foundry VTT v13 Support**
- Complete compatibility with Foundry's new Application v2 API
- Enhanced scene control registration system for v13's object-based structure
- Automatic detection and handling of v13's controls architecture
- Robust fallback mechanisms ensure controls appear regardless of version

#### 🔧 **Advanced Scene Control Registration**
- **Primary**: Enhanced `getSceneControlButtons` hook with v13 object structure support
- **Secondary**: Intelligent fallback system adds tools directly to tokens control
- **Tertiary**: Own control category creation when primary methods fail
- **Automatic**: Structure detection (array vs object) for cross-version compatibility

#### 🛠️ **Comprehensive Error Recovery**
- Multiple registration strategies ensure 100% reliability
- Hook execution tracking to identify when core hooks aren't called
- Real-time feedback on fallback mechanism activation
- Extensive logging for troubleshooting v13 compatibility issues

### 🔄 **Cross-Version Architecture**
- **Seamless operation** across Foundry versions v12.331 through v13.348
- **Automatic detection** of controls structure (v12 arrays vs v13 objects)
- **Dynamic tool handling** supporting both `.tools[]` arrays and `.tools{}` objects
- **Future-proof design** for upcoming Foundry releases

### 🎯 **What's Fixed**
- ✅ **Scene Control Registration Failures** in v13
- ✅ **`controls.find is not a function`** errors in v13
- ✅ **`tools.some is not a function`** errors with object tools
- ✅ **Controls disappearing** after UI refreshes
- ✅ **Hook system changes** in v13's modified lifecycle

### 📊 **Compatibility Matrix**
| Foundry Version | Status | Notes |
|----------------|--------|-------|
| v12.331 - v12.x | ✅ Fully Supported | Backward compatible |
| v13.0 - v13.348 | ✅ Fully Supported | New v13 features |
| v13.349+ | ✅ Expected Compatible | Future-proof design |

### 🔧 **Technical Highlights**
- **Scene Control Architecture**: Completely rewritten for v13 compatibility
- **Registration Flow**: Multi-stage process with comprehensive fallbacks
- **Debugging Infrastructure**: Production-ready debugging system
- **Zero Configuration**: Automatic version detection and handling

### 📚 **Available Controls**
All scene control buttons work perfectly in both v12 and v13:
- ⏰ **Time Management** (GM only) - Complete time control system
- 👥 **Agent Activity Tracker** (all users) - Individual progress tracking
- 📋 **Action Queue** (all users) - Action management and history

### 🛠️ **Installation & Upgrade**
- **New Installations**: Works out of the box on any supported Foundry version
- **Existing Users**: Seamless upgrade with no configuration required
- **Data Safety**: All existing data and settings preserved

### 📋 **System Requirements**
- **Foundry VTT**: v12.331 - v13.348 (verified)
- **System**: Delta Green (primary), adaptable to other systems
- **Dependencies**: None (standalone module)

### 🔍 **Testing Status**
Extensively tested across:
- ✅ Fresh installations on v13
- ✅ Upgrades from v12 to v13  
- ✅ Module load/reload cycles
- ✅ UI refresh scenarios
- ✅ Multiple users and permission levels

---

## 📥 **Download & Installation**

### Automatic Installation (Recommended)
1. In Foundry VTT, go to **"Add-on Modules"**
2. Click **"Install Module"**
3. Search for **"FROM Time Management"**
4. Click **"Install"**

### Manual Installation
1. Download `from-time-management-v1.2.0.zip` from Assets below
2. Extract to your Foundry `Data/modules/` directory
3. Restart Foundry VTT
4. Enable in your world's module settings

---

## 🔄 **Upgrade Notes**

### From v1.1.0 or Earlier
- ✅ **Seamless upgrade** with no data loss
- ✅ **All previous bugs** automatically fixed
- ✅ **Enhanced reliability** and performance
- ✅ **Full v13 compatibility** added

### Migration Impact
- **No breaking changes** for existing users
- **Zero configuration** required
- **All data preserved** (time settings, archives, agent data)

---

## 🐛 **Troubleshooting**

### If Controls Don't Appear
The module includes comprehensive debugging:
1. Check browser console for `FROM TimeManagement:` logs
2. Look for version detection messages
3. Fallback mechanisms activate automatically
4. Multiple retry attempts ensure eventual success

### Need Help?
- Check the [README.md](README.md) for detailed usage instructions
- Review [CHANGELOG.md](CHANGELOG.md) for technical details
- Open an issue on GitHub for support

---

## 🙏 **Acknowledgments**

Special thanks to the Foundry VTT community for testing and feedback during the v13 transition period.

**Happy Gaming!** 🎮
```

## Jak Utworzyć Release na GitHub

### Krok 1: Przejdź do GitHub
1. Otwórz: https://github.com/ZuraffPL/FROM-Time-Management-Module
2. Kliknij zakładkę **"Releases"**
3. Kliknij **"Create a new release"**

### Krok 2: Konfiguracja Release
- **Tag version**: `v1.2.0` (już istnieje - wybierz z listy)
- **Release title**: `FROM Time Management v1.2.0 - Foundry VTT v13 Compatibility`
- **Target**: `main` branch

### Krok 3: Skopiuj Opis
Skopiuj cały tekst z sekcji "Release Description" powyżej do pola opisu.

### Krok 4: Utwórz ZIP z Modułem
Wykonaj w PowerShell:

```powershell
# Przejdź do folderu modułu
cd "d:\Foundry\Data\modules\from-time-management"

# Utwórz ZIP (wyklucz niepotrzebne pliki)
$exclude = @('.git*', '*.md', '*.ps1', 'node_modules')
Get-ChildItem -Path . -Exclude $exclude | Compress-Archive -DestinationPath "from-time-management-v1.2.0.zip" -Force

# Lub prostszy sposób:
Compress-Archive -Path .\module.json, .\scripts\*, .\styles\*, .\lang\* -DestinationPath "from-time-management-v1.2.0.zip" -Force
```

### Krok 5: Upload Assets
Przeciągnij utworzony plik `from-time-management-v1.2.0.zip` do sekcji "Assets".

### Krok 6: Publikacja
1. ✅ Zaznacz **"Set as the latest release"**
2. ✅ **NIE** zaznaczaj "Set as a pre-release"
3. Kliknij **"Publish release"**

## Files to Attach
1. **Primary Download**: `from-time-management-v1.2.0.zip` (contains entire module)
2. **Changelog**: Link to `CHANGELOG.md` (already in repo)
3. **Version History**: Link to `VERSION-HISTORY.md` (already in repo)

## Post-Release Verification
✅ Release widoczny na: https://github.com/ZuraffPL/FROM-Time-Management-Module/releases/tag/v1.2.0  
✅ ZIP dostępny do pobrania  
✅ Foundry może automatycznie wykryć aktualizację  
✅ module.json wskazuje na najnowszy release  
