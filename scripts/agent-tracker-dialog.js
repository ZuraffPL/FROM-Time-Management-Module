import { ActionSelectionDialog } from "./action-selection-dialog.js";

const MODULE_ID = "from-time-management";

// Paleta motywów dla rozróżnienia agentów w kolejce akcji
const AGENT_THEMES = ["blue", "green", "red", "purple", "orange", "teal", "pink", "yellow"];

// --------------------------------------------------------------------------
// Funkcja współdzielona: dodawanie akcji do kolejki
// --------------------------------------------------------------------------

/**
 * Dodaje akcję do kolejki dla wskazanego agenta.
 * GM przetwarza bezpośrednio. Gracz wysyła żądanie przez socket.
 */
export async function addActionToQueue(agentId, agentName, actionName, actionCost) {
  if (!game.user.isGM) {
    if (!game.socket) return;
    game.socket.emit(`module.${MODULE_ID}`, {
      type: "requestAddAction",
      agentId,
      actionName,
      actionCost: Number(actionCost),
    });
    ui.notifications.info(game.i18n.localize(`${MODULE_ID}.action-request-sent`));
    return;
  }

  const trackingMode = game.settings.get(MODULE_ID, "trackingMode") || "day";
  const currentTime = game.settings.get(MODULE_ID, "gameTime") || { day: 1, hour: 8, minute: 0, year: 2025 };
  const cost = Number(actionCost);

  // Oblicz czas zakończenia akcji
  const startHour = currentTime.hour;
  const startMinute = currentTime.minute ?? 0;
  const totalStartMinutes = startHour * 60 + startMinute;
  const totalEndMinutes = totalStartMinutes + cost * 60;
  const endHour = Math.floor(totalEndMinutes / 60) % 24;
  const endMinute = totalEndMinutes % 60;

  // Czy akcja przekracza granicę dnia/nocy?
  const NIGHT_START = 18 * 60;
  const DAY_START = 6 * 60;
  const crossesPeriods =
    (trackingMode === "day" && totalEndMinutes > NIGHT_START) ||
    (trackingMode === "night" && totalEndMinutes > 24 * 60 + DAY_START);

  const action = {
    id: foundry.utils.randomID(),
    agentId,
    agentName: agentName || game.actors.get(agentId)?.name || game.i18n.localize(`${MODULE_ID}.unknown-agent`),
    name: actionName,
    cost,
    startTime: { hour: startHour, minute: startMinute },
    endTime: { hour: endHour, minute: endMinute },
    actionMode: trackingMode,
    crossesPeriods,
    completed: false,
    timestamp: Date.now(),
    townDay: currentTime.day,
  };

  // Dodaj do kolejki
  const queue = foundry.utils.deepClone(game.settings.get(MODULE_ID, "actionQueue") || []);
  queue.push(action);
  await game.settings.set(MODULE_ID, "actionQueue", queue);

  // Zaktualizuj tracking czasu agenta
  const trackingKey = trackingMode === "day" ? "agentDayTimeTracking" : "agentNightTimeTracking";
  const tracking = foundry.utils.deepClone(game.settings.get(MODULE_ID, trackingKey) || {});
  tracking[agentId] = (tracking[agentId] || 0) + cost;
  await game.settings.set(MODULE_ID, trackingKey, tracking);

  ui.notifications.info(`${game.i18n.localize(`${MODULE_ID}.action-added`)}: ${actionName} (${cost}h)`);
}

// --------------------------------------------------------------------------
// ActionArchiveDialog — archiwum akcji konkretnego agenta
// --------------------------------------------------------------------------

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class ActionArchiveDialog extends HandlebarsApplicationMixin(ApplicationV2) {
  #agentId;
  #agentName;

  static DEFAULT_OPTIONS = {
    classes: ["from-time-management", "action-archive-dialog"],
    window: { resizable: true },
    position: { width: 500, height: 600 },
  };

  static PARTS = {
    main: { template: `modules/${MODULE_ID}/templates/action-archive.hbs` },
  };

  constructor({ agentId, agentName } = {}) {
    super({ id: `${MODULE_ID}-archive-${agentId}` });
    this.#agentId = agentId;
    this.#agentName = agentName;
  }

  get title() {
    return `${game.i18n.localize(`${MODULE_ID}.action-archive`)} - ${this.#agentName}`;
  }

  static show(agentId, agentName) {
    const id = `${MODULE_ID}-archive-${agentId}`;
    const existing = foundry.applications.instances.get(id);
    if (existing) {
      existing.bringToTop();
      return existing;
    }
    return new ActionArchiveDialog({ agentId, agentName }).render(true);
  }

  async _prepareContext(options) {
    const archive = game.settings.get(MODULE_ID, "actionArchive") || {};
    const agentArchive = archive[this.#agentId] || [];
    const fromLabel = game.i18n.localize(`${MODULE_ID}.from-time`);
    const toLabel = game.i18n.localize(`${MODULE_ID}.to-time`);

    const grouped = {};
    for (const action of agentArchive) {
      const day = action.townDay || 1;
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(action);
    }

    const days = Object.keys(grouped)
      .map(Number)
      .sort((a, b) => b - a)
      .map(day => ({
        day,
        actions: grouped[day].map(action => {
          const sh = String(action.startTime?.hour ?? 0).padStart(2, "0");
          const sm = String(action.startTime?.minute ?? 0).padStart(2, "0");
          const eh = String(action.endTime?.hour ?? 0).padStart(2, "0");
          const em = String(action.endTime?.minute ?? 0).padStart(2, "0");
          let modeLabel;
          if (action.crossesPeriods) {
            modeLabel = `☀️🌙 ${game.i18n.localize(`${MODULE_ID}.day-night-action`)}`;
          } else {
            modeLabel = action.actionMode === "day"
              ? `☀️ ${game.i18n.localize(`${MODULE_ID}.day-action`)}`
              : `🌙 ${game.i18n.localize(`${MODULE_ID}.night-action`)}`;
          }
          const addedOn = action.timestamp
            ? new Date(action.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "";
          return {
            id: action.id,
            name: action.name,
            cost: action.cost,
            completed: action.completed,
            startTimeStr: `${sh}:${sm}`,
            endTimeStr: `${eh}:${em}`,
            modeLabel,
            addedOnStr: addedOn ? `${game.i18n.localize(`${MODULE_ID}.added-on`)}: ${addedOn}` : "",
            fromLabel,
            toLabel,
          };
        }),
      }));

    return {
      agentName: this.#agentName,
      totalCount: agentArchive.length,
      days,
    };
  }

  _onRender(context, options) {
    // Expand/collapse sekcji dni
    this.element.querySelectorAll(".day-header").forEach(header => {
      header.addEventListener("click", () => {
        const dayActions = header.nextElementSibling;
        const toggle = header.querySelector(".day-toggle");
        if (!dayActions) return;
        const isCollapsed = dayActions.classList.toggle("collapsed");
        if (toggle) toggle.textContent = isCollapsed ? "▶" : "▼";
      });
    });
  }
}

// --------------------------------------------------------------------------
// AgentTrackerDialog — główny tracker aktywności agentów
// --------------------------------------------------------------------------

export class AgentTrackerDialog extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: `${MODULE_ID}-agent-tracker`,
    classes: ["from-time-management", "agent-tracker-dialog"],
    window: { resizable: true },
    position: { width: 600, height: 700 },
    actions: {
      setDayMode: AgentTrackerDialog.#onSetDayMode,
      setNightMode: AgentTrackerDialog.#onSetNightMode,
      openActionQueue: AgentTrackerDialog.#onOpenActionQueue,
      addAction: AgentTrackerDialog.#onAddAction,
      openArchive: AgentTrackerDialog.#onOpenArchive,
      resetAgentDay: AgentTrackerDialog.#onResetAgentDay,
      adjustTime: AgentTrackerDialog.#onAdjustTime,
      toggleAgentVisibility: AgentTrackerDialog.#onToggleAgentVisibility,
    },
  };

  static PARTS = {
    main: {
      template: `modules/${MODULE_ID}/templates/agent-tracker.hbs`,
      scrollY: [".agent-list"],
    },
  };

  get title() {
    return game.i18n.localize(`${MODULE_ID}.agent-tracker`);
  }

  static show() {
    const existing = foundry.applications.instances.get(`${MODULE_ID}-agent-tracker`);
    if (existing) {
      existing.bringToTop();
      return existing;
    }
    return new AgentTrackerDialog().render(true);
  }

  async _prepareContext(options) {
    const trackingMode = game.settings.get(MODULE_ID, "trackingMode") || "day";
    const currentTime = game.settings.get(MODULE_ID, "gameTime") || { day: 1, hour: 8, minute: 0, year: 2025 };
    const isGM = game.user.isGM;
    const hiddenAgents = game.settings.get(MODULE_ID, "hiddenAgents") || [];
    const dayTracking = game.settings.get(MODULE_ID, "agentDayTimeTracking") || {};
    const nightTracking = game.settings.get(MODULE_ID, "agentNightTimeTracking") || {};
    const isDay = trackingMode === "day";
    const isNight = !isDay;

    const allAgents = AgentTrackerDialog.#getActiveAgents();
    const visibleAgents = isGM
      ? allAgents
      : allAgents.filter(({ agent }) => !hiddenAgents.includes(agent.id));

    const agents = visibleAgents.map(({ user, agent }) => {
      const timeSpent = isDay ? (dayTracking[agent.id] || 0) : (nightTracking[agent.id] || 0);
      const progressSegments = Math.min(Math.floor(timeSpent), 12);
      const segments = Array.from({ length: 12 }, (_, i) => {
        let cls = "time-segment";
        if (i < progressSegments) {
          cls += i < 8 ? " active" : i < 10 ? " warning" : " danger";
          if (isNight) cls += " night-mode";
        }
        return { cls };
      });
      return {
        id: agent.id,
        name: agent.name || game.i18n.localize(`${MODULE_ID}.unknown-agent`),
        avatar: agent.img || "icons/svg/mystery-man.svg",
        playerName: user?.name ?? game.i18n.localize(`${MODULE_ID}.unknown-player`),
        timeSpent,
        timeSpentStr: timeSpent.toFixed(1),
        modeIcon: isDay ? "☀️" : "🌙",
        modeLabel: isDay
          ? game.i18n.localize(`${MODULE_ID}.day-time`)
          : game.i18n.localize(`${MODULE_ID}.night-time`),
        segments,
        isHidden: hiddenAgents.includes(agent.id),
        canManage: AgentTrackerDialog.canPlayerManageAgent(agent.id),
      };
    });

    const h = String(currentTime.hour).padStart(2, "0");
    const m = String(currentTime.minute ?? 0).padStart(2, "0");

    return {
      agents,
      trackingMode,
      isDay,
      isNight,
      isGM,
      timeStr: `${h}:${m}, ${game.i18n.localize(`${MODULE_ID}.day-label`)} ${currentTime.day}`,
      isCurrentlyDay: currentTime.hour >= 6 && currentTime.hour < 18,
    };
  }

  // --- Handlery akcji ---

  static async #onSetDayMode(event, target) {
    if (!game.user.isGM) return;
    await game.settings.set(MODULE_ID, "trackingMode", "day");
  }

  static async #onSetNightMode(event, target) {
    if (!game.user.isGM) return;
    await game.settings.set(MODULE_ID, "trackingMode", "night");
  }

  static #onOpenActionQueue(event, target) {
    // Dynamiczny import unika circular dependency z action-queue-dialog.js
    import("./action-queue-dialog.js").then(({ ActionQueueDialog }) => {
      ActionQueueDialog.show();
    });
  }

  static async #onAddAction(event, target) {
    const agentId = target.dataset.agentId;
    const agentName = target.dataset.agentName;
    const result = await ActionSelectionDialog.show(agentId, agentName);
    if (result) {
      await addActionToQueue(agentId, agentName, result.actionName, result.actionCost);
    }
  }

  static #onOpenArchive(event, target) {
    const agentId = target.dataset.agentId;
    const agentName = target.dataset.agentName;
    ActionArchiveDialog.show(agentId, agentName);
  }

  static async #onResetAgentDay(event, target) {
    if (!game.user.isGM) return;
    const agentId = target.dataset.agentId;
    const agentName = target.dataset.agentName;
    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: { title: game.i18n.localize(`${MODULE_ID}.reset-day`) },
      content: `<p>${game.i18n.format(`${MODULE_ID}.reset-agent-day-confirm`, { name: agentName })}</p>`,
      rejectClose: false,
      modal: true,
    });
    if (!confirmed) return;

    const dayTimes = foundry.utils.deepClone(game.settings.get(MODULE_ID, "agentDayTimeTracking") || {});
    const nightTimes = foundry.utils.deepClone(game.settings.get(MODULE_ID, "agentNightTimeTracking") || {});
    delete dayTimes[agentId];
    delete nightTimes[agentId];
    await game.settings.set(MODULE_ID, "agentDayTimeTracking", dayTimes);
    await game.settings.set(MODULE_ID, "agentNightTimeTracking", nightTimes);
    ui.notifications.info(game.i18n.localize(`${MODULE_ID}.day-reset`));
  }

  static async #onAdjustTime(event, target) {
    if (!game.user.isGM) return;
    const agentId = target.dataset.agentId;
    const adjustment = Number(target.dataset.adjustment);
    const trackingMode = game.settings.get(MODULE_ID, "trackingMode") || "day";
    const trackingKey = trackingMode === "day" ? "agentDayTimeTracking" : "agentNightTimeTracking";
    const tracking = foundry.utils.deepClone(game.settings.get(MODULE_ID, trackingKey) || {});
    tracking[agentId] = Math.max(0, (tracking[agentId] || 0) + adjustment);
    await game.settings.set(MODULE_ID, trackingKey, tracking);
  }

  static async #onToggleAgentVisibility(event, target) {
    if (!game.user.isGM) return;
    const agentId = target.dataset.agentId;
    const hidden = foundry.utils.deepClone(game.settings.get(MODULE_ID, "hiddenAgents") || []);
    const idx = hidden.indexOf(agentId);
    if (idx === -1) {
      hidden.push(agentId);
    } else {
      hidden.splice(idx, 1);
    }
    await game.settings.set(MODULE_ID, "hiddenAgents", hidden);
  }

  // --- Metody pomocnicze (statyczne) ---

  /** Zwraca listę aktywnych postaci graczy z przypisanymi właścicielami. */
  static #getActiveAgents() {
    const result = [];
    for (const actor of game.actors.values()) {
      if (actor.type !== "agent") continue;
      const owner = game.users.find(u =>
        !u.isGM && u.active && actor.ownership?.[u.id] >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
      );
      if (owner) {
        result.push({ user: owner, agent: actor });
      }
    }
    return result;
  }

  /** Sprawdza, czy bieżący gracz może zarządzać akcjami danego agenta. */
  static canPlayerManageAgent(agentId) {
    if (game.user.isGM) return true;
    const actor = game.actors.get(agentId);
    if (!actor) return false;
    return actor.ownership?.[game.user.id] >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;
  }

  /** Zwraca nazwę motywu dla agenta (do CSS class). */
  static getAgentTheme(agentId) {
    const agents = AgentTrackerDialog.#getActiveAgents();
    const idx = agents.findIndex(({ agent }) => agent.id === agentId);
    return AGENT_THEMES[idx >= 0 ? idx % AGENT_THEMES.length : 0] ?? "blue";
  }
}

