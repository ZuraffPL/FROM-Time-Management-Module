import { TimeManagementDialog } from "./scripts/time-management-dialog.js";
import { AgentTrackerDialog } from "./scripts/agent-tracker-dialog.js";
import { ActionQueueDialog } from "./scripts/action-queue-dialog.js";

console.log("[FROM-TM] main.mjs start");

// Rejestracja własnej grupy narzędzi w stylu Simple Fog
Hooks.on("getSceneControlButtons", controls => {
  console.log("[FROM-TM] getSceneControlButtons hook fired");
  // Show the group to all users
  controls.fromtimemanagement = {
    name: "fromtimemanagement",
    title: "FROM: Time Management",
    icon: "fas fa-clock",
    tools: {
      timemanagement: {
        name: "timemanagement",
        title: "Zarządzanie Czasem",
        icon: "fas fa-clock",
        visible: !!game.user.isGM, // Only visible to GM
        onChange: () => { if (game.user.isGM) TimeManagementDialog.show(); },
        button: true
      },
      agenttracker: {
        name: "agenttracker",
        title: "Śledzenie Agentów",
        icon: "fas fa-users-cog",
        visible: true,
        onChange: () => AgentTrackerDialog.show(),
        button: true
      },
      actionqueue: {
        name: "actionqueue",
        title: "Kolejka Akcji",
        icon: "fas fa-clipboard-list",
        visible: true,
        onChange: () => ActionQueueDialog.show(),
        button: true
      }
    }
  };
  console.log("[FROM-TM] Custom controls group 'fromtimemanagement' added");
});

// Rejestracja wymaganych settings dla AgentTrackerDialog i systemu
Hooks.once("init", () => {
  // trackingMode: "day" lub "night"
  game.settings.register("from-time-management", "trackingMode", {
    name: "Tracking Mode",
    scope: "world",
    config: false,
    type: String,
    default: "day"
  });
  // agentTimeTracking: { [agentId]: number }
  game.settings.register("from-time-management", "agentTimeTracking", {
    name: "Agent Time Tracking",
    scope: "world",
    config: false,
    type: Object,
    default: {}
  });
  // agentDayTimeTracking: { [agentId]: number }
  game.settings.register("from-time-management", "agentDayTimeTracking", {
    name: "Agent Day Time Tracking",
    scope: "world",
    config: false,
    type: Object,
    default: {}
  });
  // agentNightTimeTracking: { [agentId]: number }
  game.settings.register("from-time-management", "agentNightTimeTracking", {
    name: "Agent Night Time Tracking",
    scope: "world",
    config: false,
    type: Object,
    default: {}
  });
  // currentGameTime: { hours, minutes, day, year }
  game.settings.register("from-time-management", "currentGameTime", {
    name: "Current Game Time",
    scope: "world",
    config: false,
    type: Object,
    default: { hours: 12, minutes: 0, day: 1, year: new Date().getFullYear() }
  });
  // actionQueue: []
  game.settings.register("from-time-management", "actionQueue", {
    name: "Action Queue",
    scope: "world",
    config: false,
    type: Object,
    default: []
  });
  // actionArchive: {}
  game.settings.register("from-time-management", "actionArchive", {
    name: "Action Archive",
    scope: "world",
    config: false,
    type: Object,
    default: {}
  });
});
