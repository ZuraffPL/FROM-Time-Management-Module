const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class TimeManagementDialog extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "from-time-management-main",
    classes: ["from-time-management", "time-management-dialog"],
    window: {
      resizable: true,
    },
    position: { width: 420, height: "auto" },
    actions: {
      setTime: TimeManagementDialog.#onSetTime,
      newDay: TimeManagementDialog.#onNewDay,
      broadcastTime: TimeManagementDialog.#onBroadcastTime,
      whisperTime: TimeManagementDialog.#onWhisperTime,
    },
  };

  static PARTS = {
    main: { template: "modules/from-time-management/templates/time-management-main.hbs" },
  };

  get title() {
    return game.i18n.localize("from-time-management.time-management");
  }

  /** Otwiera okno lub przenosi je na wierzch jeśli już otwarte. */
  static show() {
    if (!game.user.isGM) {
      ui.notifications.warn(game.i18n.localize("from-time-management.only-gm-manage"));
      return null;
    }
    const existing = foundry.applications.instances.get("from-time-management-main");
    if (existing) {
      existing.bringToTop();
      return existing;
    }
    return new TimeManagementDialog().render(true);
  }

  async _prepareContext(options) {
    const time = game.settings.get("from-time-management", "gameTime");
    return {
      time,
      timeLabel: TimeManagementDialog.formatTimeLabel(time),
    };
  }

  _onRender(context, options) {
    const form = this.element.querySelector("#tm-time-form");
    if (!form) return;

    // Zapobiegaj domyślnemu submit formularza
    form.addEventListener("submit", ev => ev.preventDefault());

    // Debounced auto-zapis przy zmianie inputów
    const debouncedSave = foundry.utils.debounce(() => this.#saveTimeFromForm(false), 400);
    form.addEventListener("input", debouncedSave);

    // Enter w inputach = natychmiastowy zapis z powiadomieniem
    form.querySelectorAll(".time-input").forEach(input => {
      input.addEventListener("keydown", async ev => {
        if (ev.key !== "Enter") return;
        ev.preventDefault();
        await this.#saveTimeFromForm(true);
      });
    });
  }

  async #saveTimeFromForm(notify = false) {
    const form = this.element?.querySelector("#tm-time-form");
    if (!form) return;
    const day    = Number(form.querySelector("#tm-day")?.value);
    const hour   = Number(form.querySelector("#tm-hour")?.value);
    const minute = Number(form.querySelector("#tm-minute")?.value);
    const year   = Number(form.querySelector("#tm-year")?.value);
    await TimeManagementDialog.setGameTime({ day, hour, minute, year });
    if (notify) ui.notifications.info(game.i18n.localize("from-time-management.time-set"));
  }

  // --- Handlery akcji (static, this = instancja, wiązane przez ApplicationV2) ---

  static async #onSetTime(event, target) {
    await this.#saveTimeFromForm(true);
  }

  static async #onNewDay(event, target) {
    const current = game.settings.get("from-time-management", "gameTime");
    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: { title: game.i18n.localize("from-time-management.new-day") },
      content: `<div class="new-day-confirm">
        <h3>🌅 ${game.i18n.localize("from-time-management.new-day-confirm")}</h3>
        <p>${game.i18n.localize("from-time-management.irreversible-action")}</p>
      </div>`,
      rejectClose: false,
      modal: true,
    });
    if (!confirmed) return;

    const newDay = Number(current.day) + 1;
    await game.settings.set("from-time-management", "agentDayTimeTracking", {});
    await game.settings.set("from-time-management", "agentNightTimeTracking", {});
    await TimeManagementDialog.setGameTime({ day: newDay, hour: 6, minute: 0, year: current.year });

    ui.notifications.info(
      `${game.i18n.localize("from-time-management.new-day-started")} (${game.i18n.localize("from-time-management.day-label")} ${newDay})`
    );
    ChatMessage.create({
      content: `<div class="from-tm-new-day-message">
        <div class="from-tm-new-day-icon">🌅</div>
        <div class="from-tm-new-day-title">${game.i18n.localize("from-time-management.new-day-started")}</div>
        <div class="from-tm-new-day-sub">
          ${game.i18n.localize("from-time-management.day-label")} ${newDay}
          • ${game.i18n.localize("from-time-management.another-day-cursed")}
        </div>
      </div>`,
      style: CONST.CHAT_MESSAGE_STYLES.OTHER,
    });
  }

  static async #onBroadcastTime(event, target) {
    const time = game.settings.get("from-time-management", "gameTime");
    const h = String(time.hour).padStart(2, "0");
    const m = String(time.minute ?? 0).padStart(2, "0");
    ChatMessage.create({
      content: `<div class="broadcast-chat">
        <strong>🕐 ${game.i18n.localize("from-time-management.current-game-time")}:</strong><br>
        <span class="broadcast-time">${h}:${m}</span><br>
        <span class="broadcast-desc">
          ${game.i18n.localize("from-time-management.day-label")} ${time.day}
          ${game.i18n.localize("from-time-management.in-town")}
          (${game.i18n.localize("from-time-management.year-label")} ${time.year})
        </span>
      </div>`,
    });
    ui.notifications.info(game.i18n.localize("from-time-management.time-broadcasted"));
  }

  static async #onWhisperTime(event, target) {
    const time = game.settings.get("from-time-management", "gameTime");
    const h = String(time.hour).padStart(2, "0");
    const m = String(time.minute ?? 0).padStart(2, "0");
    ChatMessage.create({
      content: `<div class="whisper-chat">
        <strong>🕐 ${game.i18n.localize("from-time-management.current-game-time")}
        (${game.i18n.localize("from-time-management.private-label")}):</strong><br>
        <span class="broadcast-time">${h}:${m}</span>
      </div>`,
      whisper: [game.user.id],
    });
    ui.notifications.info(game.i18n.localize("from-time-management.time-whispered"));
  }

  // --- Metody publiczne współdzielone ---

  /**
   * Zapisuje czas gry i powiadamia klientów przez socket (tylko typ zdarzenia, dane w settings).
   * Automatycznie ustawia tryb dzień/noc. Tylko GM może wywoływać.
   */
  static async setGameTime({ day, hour, minute, year }) {
    if (!game.user.isGM) return;
    await game.settings.set("from-time-management", "gameTime", { day, hour, minute, year });
    const mode = hour >= 6 && hour < 18 ? "day" : "night";
    await game.settings.set("from-time-management", "trackingMode", mode);
  }

  static formatTimeLabel({ day, hour, minute, year }) {
    const h = String(hour).padStart(2, "0");
    const m = String(minute ?? 0).padStart(2, "0");
    return [
      `${game.i18n.localize("from-time-management.day-label")}: ${day}`,
      `${game.i18n.localize("from-time-management.hour")}: ${h}:${m}`,
      `${game.i18n.localize("from-time-management.year")}: ${year}`,
    ].join(", ");
  }
}

