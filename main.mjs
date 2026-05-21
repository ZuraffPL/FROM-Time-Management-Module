import { TimeManagementDialog } from "./scripts/time-management-dialog.js";
import { AgentTrackerDialog, addActionToQueue } from "./scripts/agent-tracker-dialog.js";
import { ActionQueueDialog } from "./scripts/action-queue-dialog.js";

const MODULE_ID = "from-time-management";

// --------------------------------------------------------------------------
// init — rejestracja wszystkich ustawień modułu
// --------------------------------------------------------------------------

Hooks.once("init", () => {
  // Pomocnicze funkcje odświeżania — wywołane przez onChange na każdym kliencie
  const refreshTime    = () => foundry.applications.instances.get(`${MODULE_ID}-main`)?.render();
  const refreshTracker = () => foundry.applications.instances.get(`${MODULE_ID}-agent-tracker`)?.render();
  const refreshQueue   = () => foundry.applications.instances.get(`${MODULE_ID}-action-queue`)?.render();

  // Czas gry: { day, hour, minute, year }
  game.settings.register(MODULE_ID, "gameTime", {
    name: `${MODULE_ID}.settings.game-time.name`,
    scope: "world",
    config: false,
    type: Object,
    default: { day: 1, hour: 8, minute: 0, year: 2025 },
    onChange: () => { refreshTime(); refreshTracker(); },
  });

  // Aktualny tryb śledzenia: "day" | "night"
  game.settings.register(MODULE_ID, "trackingMode", {
    name: `${MODULE_ID}.settings.tracking-mode.name`,
    scope: "world",
    config: false,
    type: String,
    default: "day",
    onChange: refreshTracker,
  });

  // Śledzenie czasu agentów — łączny czas (niezależnie od trybu)
  game.settings.register(MODULE_ID, "agentTimeTracking", {
    scope: "world",
    config: false,
    type: Object,
    default: {},
    onChange: refreshTracker,
  });

  // Śledzenie czasu agentów w trybie dziennym: { [agentId]: hours }
  game.settings.register(MODULE_ID, "agentDayTimeTracking", {
    scope: "world",
    config: false,
    type: Object,
    default: {},
    onChange: refreshTracker,
  });

  // Śledzenie czasu agentów w trybie nocnym: { [agentId]: hours }
  game.settings.register(MODULE_ID, "agentNightTimeTracking", {
    scope: "world",
    config: false,
    type: Object,
    default: {},
    onChange: refreshTracker,
  });

  // Kolejka akcji: Action[]
  game.settings.register(MODULE_ID, "actionQueue", {
    scope: "world",
    config: false,
    type: Object,
    default: [],
    onChange: () => { refreshQueue(); refreshTracker(); },
  });

  // Archiwum akcji: { [agentId]: Action[] }
  game.settings.register(MODULE_ID, "actionArchive", {
    scope: "world",
    config: false,
    type: Object,
    default: {},
  });

  // Lista ukrytych agentów (ID aktorów): string[]
  game.settings.register(MODULE_ID, "hiddenAgents", {
    scope: "world",
    config: false,
    type: Object,
    default: [],
    onChange: refreshTracker,
  });
});

// --------------------------------------------------------------------------
// getSceneControlButtons — przyciski kontrolek sceny (v13 API)
// --------------------------------------------------------------------------

Hooks.on("getSceneControlButtons", (controls) => {
  controls[MODULE_ID] = {
    name: MODULE_ID,
    title: game.i18n.localize(`${MODULE_ID}.title`),
    icon: "fas fa-clock",
    tools: {
      timeManagement: {
        name: "timeManagement",
        title: game.i18n.localize(`${MODULE_ID}.time-management`),
        icon: "fas fa-clock",
        visible: game.user.isGM,
        onChange: () => TimeManagementDialog.show(),
        button: true,
      },
      agentTracker: {
        name: "agentTracker",
        title: game.i18n.localize(`${MODULE_ID}.agent-tracker`),
        icon: "fas fa-users-cog",
        visible: true,
        onChange: () => AgentTrackerDialog.show(),
        button: true,
      },
      actionQueue: {
        name: "actionQueue",
        title: game.i18n.localize(`${MODULE_ID}.action-queue`),
        icon: "fas fa-clipboard-list",
        visible: true,
        onChange: () => ActionQueueDialog.show(),
        button: true,
      },
    },
  };
});

// --------------------------------------------------------------------------
// ready — skonsolidowany socket listener (jedyny w całym module)
// --------------------------------------------------------------------------

Hooks.once("ready", () => {
  if (!game.socket) return;

  game.socket.on(`module.${MODULE_ID}`, async (data) => {
    // Walidacja wiadomości
    if (!data || typeof data !== "object" || typeof data.type !== "string") return;

    switch (data.type) {
      // Gracz prosi GM o dodanie akcji do kolejki
      case "requestAddAction": {
        if (!game.user.isGM) break;

        // Walidacja danych od gracza
        const { agentId, actionName, actionCost } = data;
        if (typeof agentId !== "string" || !agentId) break;
        if (typeof actionName !== "string" || !actionName) break;
        if (typeof actionCost !== "number" || actionCost < 1 || actionCost > 12) break;

        await addActionToQueue(agentId, "", actionName, actionCost);
        break;
      }
    }
  });
});

