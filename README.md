# FROM Time Management System for Delta Green

A comprehensive time management module for Delta Green RPG sessions in Foundry VTT, inspired by the mechanics of the FROM TV series.

## Features

### 🕐 Time Management
- Real-time game clock with day/hour tracking
- "Day in Town" counter for extended stays
- GM-controlled time settings and updates
- Automatic time progression with manual override

### 👥 Agent Activity Tracking
- Individual progress bars for each agent
- Separate day/night time tracking (12 hours each)
- Visual progress indicators with color-coded warnings
- Real-time synchronization across all clients

### 📋 Action Queue System
- Pre-defined action templates with time costs
- Custom action creation for unique scenarios
- Automatic time allocation to agents
- Overflow handling between day/night periods
- Completion tracking and queue management

### 📚 Action Archive System
- **Complete Action History**: Permanent storage of all agent actions throughout the campaign
- **Day-based Organization**: Actions grouped by day with collapsible sections for easy navigation
- **Individual Agent Archives**: Personal archive window for each agent accessible via "Archive Actions" button
- **Detailed Action Records**: Full preservation of action details, timestamps, and context
- **Never Lose Data**: Actions are archived, never truly deleted, ensuring complete campaign history

### 🎨 Agent Visual Themes
- **Unique Visual Identity**: 10 distinct horror-themed gradient backgrounds for each agent
- **Automatic Assignment**: Hash-based color themes ensure consistent appearance per agent
- **Enhanced Recognition**: Easy agent identification at a glance in multi-agent scenarios
- **Atmospheric Design**: Maintains Delta Green horror aesthetic while improving usability

### 🔄 Real-time Synchronization
- Socket-based multiplayer synchronization
- Automatic UI updates across all connected clients
- Permission system (players manage own characters, GM controls all)
- Persistent data storage in world settings

### 🌅 Day/Night Cycles
- Visual mode switching between day and night tracking
- Automatic overflow between periods when limits exceeded
- Confirmation dialogs for time limit violations
- "New Day" functionality to reset all progress

### 🎭 Action Templates
- **Short Rest** (1h) - Quick recuperation
- **NPC Conversation** (1h) - Social interactions
- **Explore Near Town** (3h) - Local area investigation  
- **Investigate Location** (1h) - Detailed examination
- **Meal at Diner** (1h) - Food and social time
- **Medical Care** (2h) - Treatment for light wounds
- **Travel Town ↔ Colony House** (1h) - Transportation
- **Forest Exploration** (6h) - Extended wilderness search

## Installation

### Manual Installation
1. Download the latest release from the [releases page](https://github.com/your-username/from-time-management/releases)
2. Extract the contents to your Foundry `Data/modules/` directory
3. Restart Foundry VTT
4. Enable the module in your world's module settings

### Foundry Module Browser
1. In Foundry VTT, go to "Add-on Modules"
2. Click "Install Module"
3. Search for "FROM Time Management"
4. Click "Install" and enable in your world

## Usage

### For Game Masters

#### Basic Setup
1. Click the clock icon (🕐) in the token controls to open the Time Management dialog
2. Set the initial time, day, and year as needed
3. Use "New Day in Town" to advance the calendar and reset agent progress

#### Managing Time
- **Set Time**: Manually adjust the current game time
- **Broadcast Time**: Send current time to all players via chat
- **Whisper Time**: Save time information privately for GM reference
- **New Day**: Reset all agent progress bars and advance the day counter

#### Agent Tracking
1. Click the users icon (👥) to open the Agent Activity Tracker
2. Switch between "Day Time" and "Night Time" modes
3. Add actions for agents using the "Add Action" button
4. **View Action Archives**: Click "Archive Actions" next to each agent to see complete action history
5. **Use Time Calibration**: GM can manually adjust agent time using +1h/-1h buttons next to progress bars
6. **Visual Agent Themes**: Each agent has a unique gradient background for easy identification
7. Monitor progress bars - colors indicate time usage:
   - **Green**: Normal time usage (0-8 hours)
   - **Orange**: Warning level (8-10 hours)
   - **Red**: Danger level (10-12 hours)

#### Action Archive Management
1. Click "Archive Actions" button next to any agent in the tracker
2. Browse complete action history organized by day
3. Expand/collapse day sections to focus on specific periods
4. View detailed information including action type, time, and mode
5. Archive persists across sessions - never lose track of agent activities

#### Action Queue Management
1. Click the clipboard icon (📋) to view the Action Queue
2. Mark actions as completed using checkboxes
3. Delete individual actions or clear completed/all actions
4. Monitor agent workloads and time allocation

### For Players

#### Viewing Progress
- Access the Agent Activity Tracker to see your character's progress
- View the Action Queue to see all pending and completed actions
- Receive time updates via chat when GM broadcasts

#### Adding Actions
1. Open the Agent Activity Tracker
2. Click "Add Action" for your character
3. Choose from pre-defined templates or create custom actions
4. Actions automatically apply to your character's time tracking
5. **Access Your Archive**: Click "Archive Actions" to review your complete action history
6. **Visual Identity**: Your character has a unique gradient background theme for easy recognition

#### Time Overflow
- When actions exceed time limits, you'll see confirmation dialogs
- Overflow time automatically moves to the opposite period (day↔night)
- Plan activities carefully to avoid exhaustion

## Configuration

The module uses world-level settings stored automatically:
- Current game time and date
- Agent time tracking data (day/night)
- Action queue contents
- Tracking mode preferences

No manual configuration required - everything is handled through the UI.

## Permissions

- **GM**: Full control over time management, all agent tracking, and system settings
- **Players**: Can add actions for owned characters, view all tracking information
- **Observers**: Read-only access to public information

## Compatibility

- **Foundry VTT**: v12.331+
- **System**: Designed for Delta Green, but adaptable to other modern horror RPGs
- **Modules**: No dependencies, works alongside other time/calendar modules

## Localization

Currently supported languages:
- English (en)
- Polish (pl)

Additional language support welcome via pull requests.

## Technical Details

### Socket Events
The module uses `module.from-time-management` socket events for real-time synchronization:
- `updateAgentTracking`: Synchronizes all tracking data across clients
- `addActionToQueue`: Handles action requests from players to GM
- `requestCurrentData`: Player requests for current data sync

### Data Storage
All data persists in Foundry's world settings:
- `currentGameTime`: Current in-game time and date
- `agentTimeTracking`: Legacy total time tracking
- `agentDayTimeTracking`: Day-specific time tracking per agent
- `agentNightTimeTracking`: Night-specific time tracking per agent
- `trackingMode`: Current tracking mode (day/night)
- `actionQueue`: All queued and completed actions
- `actionArchive`: Complete historical archive of all agent actions organized by agent and day

### Performance
- Optimized for real-time updates without lag
- Efficient DOM manipulation and re-rendering
- Minimal network traffic through targeted socket events

## Development

### Building from Source
```bash
git clone https://github.com/your-username/from-time-management.git
cd from-time-management
# No build process required - pure JavaScript/CSS
```

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly in Foundry VTT 12.331
5. Submit a pull request

### Reporting Issues
Please use the [GitHub issue tracker](https://github.com/your-username/from-time-management/issues) for:
- Bug reports
- Feature requests
- Compatibility issues
- Translation requests

## License

This module is licensed under the MIT License. See `LICENSE` file for details.

## Credits

- **Inspired by**: FROM TV series time mechanics
- **Designed for**: Delta Green RPG system
- **Built for**: Foundry Virtual Tabletop

## Support

For support, please:
1. Check this README for common questions
2. Search existing issues on GitHub
3. Create a new issue with detailed information
4. Include Foundry version, browser, and console errors

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and updates.

---

*"In FROM's twisted town, every hour matters. Track your agents' activities, manage their exhaustion, and survive another day in this nightmare."*
