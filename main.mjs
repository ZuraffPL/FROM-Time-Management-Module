import { TimeManagementDialog } from "./scripts/time-management-dialog.js";
import { AgentTrackerDialog } from "./scripts/agent-tracker-dialog.js";
import { ActionQueueDialog } from "./scripts/action-queue-dialog.js";

console.log("[FROM-TM] main.mjs start");

// Rejestracja własnej grupy narzędzi
Hooks.on("getSceneControlButtons", controls => {
  console.log("[FROM-TM] getSceneControlButtons hook fired");
  console.log("[FROM-TM] controls type:", typeof controls, "isArray:", Array.isArray(controls));
  
  // Foundry v13+ uses object structure, not array
  // Add tools to existing controls object
  if (!controls.fromtimemanagement) {
    controls.fromtimemanagement = {
      name: "fromtimemanagement",
      title: "FROM: Time Management",
      icon: "fas fa-clock",
      layer: "fromtimemanagement",
      tools: {}
    };
  }
  
  // Add individual tools
  controls.fromtimemanagement.tools.timemanagement = {
    name: "timemanagement",
    title: "Zarządzanie Czasem",
    icon: "fas fa-clock",
    visible: game.user.isGM,
    onChange: () => TimeManagementDialog.show(),
    button: true
  };
  
  controls.fromtimemanagement.tools.agenttracker = {
    name: "agenttracker",
    title: "Śledzenie Agentów",
    icon: "fas fa-users-cog",
    visible: true,
    onChange: () => AgentTrackerDialog.show(),
    button: true
  };
  
  controls.fromtimemanagement.tools.actionqueue = {
    name: "actionqueue",
    title: "Kolejka Akcji",
    icon: "fas fa-clipboard-list",
    visible: true,
    onChange: () => ActionQueueDialog.show(),
    button: true
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

// Socket listener dla odbieżania zdarzeń z serwera
Hooks.once("ready", () => {
  if (game.socket) {
    game.socket.on("module.from-time-management", (data) => {
      console.log("[FROM-TM] Socket event received:", data);
      
      // Odśwież tracker dialog gdy zmieni się czas
      if (data.type === "timeChanged") {
        // Znajdź otwarte okna AgentTrackerDialog i odśwież je
        for (const win of Object.values(ui.windows)) {
          if (win.constructor.name === "AgentTrackerDialog") {
            console.log("[FROM-TM] Refreshing AgentTrackerDialog due to time change");
            win.render(true);
          }
        }
      }
      
      // Obsługa innych eventów (forceRefreshAgentTracker, etc)
      if (data.operation === "forceRefreshAgentTracker") {
        for (const win of Object.values(ui.windows)) {
          if (win.constructor.name === "AgentTrackerDialog") {
            win.render(true);
          }
        }
      }
    });
  }
});
