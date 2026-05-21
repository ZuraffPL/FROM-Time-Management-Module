import { AgentTrackerDialog } from "./agent-tracker-dialog.js";

const MODULE_ID = "from-time-management";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class ActionQueueDialog extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: `${MODULE_ID}-action-queue`,
    classes: ["from-time-management", "action-queue-dialog"],
    window: { resizable: true },
    position: { width: 550, height: 600 },
    actions: {
      deleteAction: ActionQueueDialog.#onDeleteAction,
      archiveCompleted: ActionQueueDialog.#onArchiveCompleted,
    },
  };

  static PARTS = {
    main: {
      template: `modules/${MODULE_ID}/templates/action-queue.hbs`,
      scrollY: [".action-list"],
    },
  };

  get title() {
    return game.i18n.localize(`${MODULE_ID}.action-queue`);
  }

  static show() {
    const existing = foundry.applications.instances.get(`${MODULE_ID}-action-queue`);
    if (existing) {
      existing.bringToTop();
      return existing;
    }
    return new ActionQueueDialog().render(true);
  }

  async _prepareContext(options) {
    const queue = game.settings.get(MODULE_ID, "actionQueue") || [];
    const isGM = game.user.isGM;

    const processAction = (action) => {
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
      return {
        ...action,
        startTimeStr: `${sh}:${sm}`,
        endTimeStr: `${eh}:${em}`,
        modeLabel,
        agentTheme: AgentTrackerDialog.getAgentTheme(action.agentId),
      };
    };

    // Aktywne na górze (po timestamp), ukończone na dole
    const active = queue
      .filter(a => !a.completed)
      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
      .map(processAction);

    const completed = queue
      .filter(a => a.completed)
      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
      .map(processAction);

    return {
      activeActions: active,
      completedActions: completed,
      showSeparator: active.length > 0 && completed.length > 0,
      totalCount: queue.length,
      completedCount: completed.length,
      isGM,
    };
  }

  _onRender(context, options) {
    if (!game.user.isGM) return;

    // Checkboxy — oznaczanie akcji jako ukończone/aktywne
    this.element.querySelectorAll(".action-checkbox").forEach(checkbox => {
      checkbox.addEventListener("change", async (ev) => {
        const actionId = ev.target.closest("[data-action-id]")?.dataset.actionId;
        if (!actionId) return;
        await ActionQueueDialog.#toggleActionCompleted(actionId, ev.target.checked);
      });
    });
  }

  // --- Handlery akcji ---

  static async #onDeleteAction(event, target) {
    if (!game.user.isGM) return;
    const actionId = target.dataset.actionId;
    const queue = foundry.utils.deepClone(game.settings.get(MODULE_ID, "actionQueue") || []);
    // Porównuj jako string — stare akcje mogły mieć id jako liczbę (Date.now())
    const action = queue.find(a => String(a.id) === actionId);
    if (!action) return;

    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: { title: game.i18n.localize(`${MODULE_ID}.delete-action`) },
      content: `<p>${game.i18n.localize(`${MODULE_ID}.delete-action-confirm`)}: <strong>${action.name}</strong>?</p>`,
      rejectClose: false,
      modal: true,
    });
    if (!confirmed) return;

    // Przenieś do archiwum zamiast usuwać trwale
    await ActionQueueDialog.archiveAction(action);
    const updated = queue.filter(a => String(a.id) !== actionId);
    await game.settings.set(MODULE_ID, "actionQueue", updated);
  }

  // --- Metody statyczne ---

  static async #onArchiveCompleted(event, target) {
    await ActionQueueDialog.clearCompletedActions();
  }

  static async #toggleActionCompleted(actionId, completed) {
    const queue = foundry.utils.deepClone(game.settings.get(MODULE_ID, "actionQueue") || []);
    const action = queue.find(a => String(a.id) === actionId);
    if (!action) return;
    action.completed = completed;
    await game.settings.set(MODULE_ID, "actionQueue", queue);
  }

  /** Przenosi akcję do archiwum agenta. */
  static async archiveAction(action) {
    const archive = foundry.utils.deepClone(game.settings.get(MODULE_ID, "actionArchive") || {});
    if (!archive[action.agentId]) archive[action.agentId] = [];
    archive[action.agentId].push({ ...action, archivedAt: Date.now() });
    await game.settings.set(MODULE_ID, "actionArchive", archive);
  }

  /** Czyści wszystkie ukończone akcje z kolejki (przenosi do archiwum). */
  static async clearCompletedActions() {
    if (!game.user.isGM) return;
    const queue = foundry.utils.deepClone(game.settings.get(MODULE_ID, "actionQueue") || []);
    const completed = queue.filter(a => a.completed);
    const remaining = queue.filter(a => !a.completed);

    for (const action of completed) {
      await ActionQueueDialog.archiveAction(action);
    }
    await game.settings.set(MODULE_ID, "actionQueue", remaining);
  }

  /** Czyści całą kolejkę (bez archiwizacji). */
  static async resetQueue() {
    if (!game.user.isGM) return;
    await game.settings.set(MODULE_ID, "actionQueue", []);
  }
}

