# 🎯 Version 1.4.0: Resizable Dialogs with Dynamic Scaling

## Overview
This release transforms all major dialog windows into fully resizable, dynamically scaling interfaces optimized for high-resolution displays (1440p, 4K, ultrawide monitors).

## 🆕 What's New

### Resizable Dialog Windows
- **Agent Tracker** and **Action Queue** windows now support free resizing
- Drag the bottom-right corner to resize windows to your preference
- Initial size: 600×500px
- Minimum size: 450×300px (maintains usability)
- Perfect for multitasking and multi-monitor setups

### Intelligent Content Scaling
All UI elements now scale proportionally with window size:

#### Agent Tracker Scaling:
- **Avatars**: 40px - 60px (responsive)
- **Agent Names**: 0.75rem - 1rem
- **Progress Bars**: 10px - 16px height with dynamic segments
- **Buttons**: Fully scalable padding and fonts
- **Time Controls**: Responsive sizing

#### Action Queue Scaling:
- **Action Names**: 0.9rem - 1.3rem (enhanced visibility)
- **Action Details**: 0.75rem - 1rem (better readability)
- **Cost Badges**: Dynamic sizing with responsive padding
- **All Buttons**: Proportional scaling

### High-Resolution Display Support
- No more tiny text on 4K monitors!
- Content remains crisp and readable at any size
- Optimized for 1440p, 4K, and ultrawide displays
- Responsive font sizes using CSS clamp() with viewport units
- Dynamic spacing and padding calculations

## 🎨 Technical Improvements

- Implemented CSS `clamp()` for intelligent min/max constraints
- Viewport-relative units (vw/vh) for dynamic sizing
- Enhanced flexbox layouts with proper overflow handling
- Smooth content reflow during resize operations
- Optimized scroll behavior for nested elements

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
1. Download `from-time-management-v1.4.0.zip`
2. Extract to `Data/modules/` in your Foundry directory
3. Restart Foundry VTT
4. Enable module in your world

## 🔄 Upgrading from Previous Versions

Simply update through Foundry's module manager or replace files manually. All settings and data are preserved.

## 🐛 Bug Fixes

- Removed fixed height constraints causing unnecessary scrollbars
- Agent tracker window no longer limited by max-height
- Action queue window expands naturally with content
- Both windows resize smoothly with their content

## 💡 Usage Tips

1. **For High-Res Displays**: Resize windows larger for better visibility
2. **For Small Screens**: Resize smaller to maximize screen space
3. **Multi-Monitor Setup**: Pop out windows and resize independently
4. **Preferred Size**: Your preferred window size persists across sessions

## 🙏 Credits

Developed by **Zuraff** with **GitHub Copilot Assistant**

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for complete version history.

## 📄 License

MIT License - see [LICENSE](LICENSE) file

---

**Compatibility**: Foundry VTT v12.331+ (Verified: v13.348)  
**System**: Delta Green  
**Language Support**: English, Polish
