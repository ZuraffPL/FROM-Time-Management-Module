# Changelog

All notable changes to the FROM Time Management System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
