const MODULE_ID = "from-time-management";

/**
 * Dialog wyboru akcji dla agenta. Zwraca Promise<{ actionName, actionCost }|null>.
 * Użycie:
 *   const result = await ActionSelectionDialog.show(agentId, agentName);
 *   if (result) await addActionToQueue(agentId, agentName, result.actionName, result.actionCost);
 */
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class ActionSelectionDialog extends HandlebarsApplicationMixin(ApplicationV2) {
  #agentId;
  #agentName;
  #resolve = null;
  #selectedTemplate = null;

  static DEFAULT_OPTIONS = {
    id: `${MODULE_ID}-action-select`,
    classes: ["from-time-management", "action-selection-dialog"],
    window: { resizable: false },
    position: { width: 480, height: "auto" },
    actions: {
      confirmAction: ActionSelectionDialog.#onConfirm,
      cancelAction: ActionSelectionDialog.#onCancel,
    },
  };

  static PARTS = {
    main: { template: `modules/${MODULE_ID}/templates/action-selection.hbs` },
  };

  constructor({ agentId, agentName } = {}) {
    super({});
    this.#agentId = agentId;
    this.#agentName = agentName;
  }

  get title() {
    return `${game.i18n.localize(`${MODULE_ID}.add-action`)} — ${this.#agentName}`;
  }

  /**
   * Otwiera dialog wyboru akcji i zwraca wybrane dane lub null przy anulowaniu.
   * Jeśli dialog jest już otwarty, zamyka go i otwiera nowy dla nowego agenta.
   */
  static async show(agentId, agentName) {
    // Jeśli otwarto dla innego agenta — zamknij poprzedni
    const existing = foundry.applications.instances.get(`${MODULE_ID}-action-select`);
    if (existing) existing.close({ force: true });

    return new Promise((resolve) => {
      const dlg = new ActionSelectionDialog({ agentId, agentName });
      dlg.#resolve = resolve;
      dlg.render(true);
    });
  }

  async _prepareContext(options) {
    // Szablony akcji dostępne do wyboru
    const actionTemplates = [
      { name: game.i18n.localize(`${MODULE_ID}.short-rest`), cost: 1 },
      { name: game.i18n.localize(`${MODULE_ID}.npc-conversation`), cost: 1 },
      { name: game.i18n.localize(`${MODULE_ID}.investigate-location`), cost: 1 },
      { name: game.i18n.localize(`${MODULE_ID}.meal-at-diner`), cost: 1 },
      { name: game.i18n.localize(`${MODULE_ID}.travel-town-colony`), cost: 1 },
      { name: game.i18n.localize(`${MODULE_ID}.medical-care-light`), cost: 2 },
      { name: game.i18n.localize(`${MODULE_ID}.explore-near-town`), cost: 3 },
      { name: game.i18n.localize(`${MODULE_ID}.forest-exploration`), cost: 6 },
    ];
    return { agentName: this.#agentName, actionTemplates };
  }

  _onRender(context, options) {
    // Obsługa zaznaczania szablonu akcji
    this.element.querySelectorAll(".action-template").forEach(template => {
      template.addEventListener("click", () => {
        this.element.querySelectorAll(".action-template").forEach(t => t.classList.remove("selected"));
        template.classList.add("selected");
        this.#selectedTemplate = {
          actionName: template.dataset.name,
          actionCost: Number(template.dataset.cost),
        };
        // Wyczyść pola własnej akcji gdy wybrany szablon
        const nameInput = this.element.querySelector("#custom-action-name");
        const costInput = this.element.querySelector("#custom-action-cost");
        if (nameInput) nameInput.value = "";
        if (costInput) costInput.value = "";
      });
    });

    // Odznacz szablon gdy użytkownik zaczyna pisać własną nazwę
    this.element.querySelector("#custom-action-name")?.addEventListener("input", () => {
      this.#selectedTemplate = null;
      this.element.querySelectorAll(".action-template").forEach(t => t.classList.remove("selected"));
    });
  }

  _onClose(options) {
    // Resolve z null jeśli zamknięto bez potwierdzenia (np. przez X)
    this.#resolve?.(null);
    this.#resolve = null;
  }

  // --- Handlery akcji ---

  static #onConfirm(event, target) {
    const result = this.#getSelectedAction();
    if (!result) {
      ui.notifications.warn(game.i18n.localize(`${MODULE_ID}.select-action-or-enter-data`));
      return;
    }
    this.#resolve?.(result);
    this.#resolve = null; // zapobiegaj podwójnemu resolve przez _onClose
    this.close();
  }

  static #onCancel(event, target) {
    this.#resolve?.(null);
    this.#resolve = null;
    this.close();
  }

  // --- Metody prywatne ---

  #getSelectedAction() {
    // Szablon wybrany przez kliknięcie
    if (this.#selectedTemplate) return this.#selectedTemplate;

    // Własna akcja wpisana ręcznie
    const nameInput = this.element?.querySelector("#custom-action-name");
    const costInput = this.element?.querySelector("#custom-action-cost");
    const actionName = nameInput?.value?.trim();
    const actionCost = Number(costInput?.value);

    if (!actionName || !actionCost || actionCost < 1) return null;
    return { actionName, actionCost };
  }
}

