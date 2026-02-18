

// Rejestracja ustawienia na hooku init (przechowywanie jako string JSON, scope: world)
Hooks.once("init", () => {
  game.settings.register("from-time-management", "gameTime", {
    name: "Game Time",
    scope: "world",
    config: false,
    type: String,
    default: JSON.stringify({ day: 1, hour: 8, minute: 0, year: 2025 })
  });
  // Tryb śledzenia (day/night) - automatyka
  game.settings.register("from-time-management", "trackingMode", {
    name: "Tracking Mode",
    scope: "world",
    config: false,
    type: String,
    default: "day"
  });
});

export class TimeManagementDialog extends foundry.applications.api.DialogV2 {
  static async getGameTime() {
    let value = game.settings.get("from-time-management", "gameTime");
    if (!value || typeof value !== "string") return { day: 1, hour: 8, minute: 0, year: 2025 };
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === "object" && parsed !== null && "day" in parsed && "hour" in parsed && "year" in parsed) {
        if (!('minute' in parsed)) parsed.minute = 0;
        return parsed;
      }
    } catch (e) {}
    return { day: 1, hour: 8, minute: 0, year: 2025 };
  }

  static async updateGameTime({ day, hour, minute, year }) {
    // Zapisz w obu formatach dla kompatybilności
    await game.settings.set("from-time-management", "gameTime", JSON.stringify({ day, hour, minute, year }));
    await game.settings.set("from-time-management", "currentGameTime", { 
      hours: hour, 
      minutes: minute, 
      day: day, 
      year: year 
    });
    
    // Wysyłamy socket event do wszystkich klientów o zmianie czasu
    if (game.socket && game.user.isGM) {
      game.socket.emit("module.from-time-management", {
        type: "timeChanged",
        time: { day, hour, minute, year }
      });
    }
  }

  static t(key) {
    const dict = game.i18n.translations["from-time-management"] || {};
    return dict[key] || game.i18n.localize(`from-time-management.${key}`) || key;
  }

  static async show() {
    // Tylko GM może otworzyć okno
    if (!game.user.isGM) {
      ui.notifications?.warn(TimeManagementDialog.t("only-gm-manage") || "Only GM can manage time!");
      return;
    }
    const gameTime = await TimeManagementDialog.getGameTime();
    const dlg = new TimeManagementDialog(gameTime);
    dlg.render(true);
  }

  constructor(gameTime = { day: 1, hour: 8, minute: 0, year: 2025 }) {
    const t = TimeManagementDialog.t;
    const { day, hour, minute, year } = gameTime;
    const content = `
      <div class="time-management-system">
        <div class="current-time">
          <div>${t("current-time")}</div>
          <div id="current-time-display">${TimeManagementDialog.formatCurrentTime(gameTime)}</div>
        </div>
        <form class="from-tm-time-form time-section">
          <h3>${t("time-settings")}</h3>
          <div class="time-controls">
            <label for="tm-day">${t("day-in-town")}</label>
            <input class="time-input" id="tm-day" type="number" name="day" min="1" value="${day}" />
            <label for="tm-hour">${t("hour")}</label>
            <input class="time-input" id="tm-hour" type="number" name="hour" min="0" max="23" value="${hour}" />
            <label for="tm-minute">${t("minute")}</label>
            <input class="time-input" id="tm-minute" type="number" name="minute" min="0" max="59" value="${minute || 0}" />
            <label for="tm-year">${t("year")}</label>
            <input class="time-input" id="tm-year" type="number" name="year" min="1900" max="2100" value="${year}" />
            <button type="button" class="time-button" id="set-time-btn"><i class="fas fa-check"></i> ${t("set-time")}</button>
          </div>
        </form>
        <div class="broadcast-section">
          <h3>${t("communication")}</h3>
          <button type="button" class="time-button" id="broadcast-time-btn">${t("broadcast-time")}</button>
          <button type="button" class="time-button" id="whisper-time-btn">${t("whisper-time")}</button>
        </div>
        <div class="broadcast-section">
          <button type="button" class="time-button new-day-btn" id="new-day-btn"><i class="fas fa-sunrise"></i> ${t("new-day")}</button>
        </div>
      </div>
    `;
    super({
      title: t("time-management"),
      content,
      buttons: [{ label: t("close"), icon: '<i class="fas fa-times"></i>', close: true }],
      default: 0
    }, { width: 420, height: "auto", resizable: true, popOut: true });
  }

  static formatCurrentTime({ day, hour, minute, year }) {
    const t = TimeManagementDialog.t;
    const h = String(hour).padStart(2, '0');
    const m = String(minute ?? 0).padStart(2, '0');
    return `${t("day-in-town")}: ${day}, ${t("hour")}: ${h}:${m}, ${t("year")}: ${year}`;
  }


  async _onRender(context, options) {
    await super._onRender(context, options);
    const t = TimeManagementDialog.t;
    const root = this.element;
    const contentElement = root.querySelector(".window-content") || root;

    // Debouncer for input changes
    let inputChangeTimeout = null;

    // Helper to update time from form fields
    const updateTimeFromForm = async (notify = false) => {
      const dayInput = contentElement.querySelector("#tm-day");
      const hourInput = contentElement.querySelector("#tm-hour");
      const minuteInput = contentElement.querySelector("#tm-minute");
      const yearInput = contentElement.querySelector("#tm-year");
      
      if (!dayInput || !hourInput || !minuteInput || !yearInput) return;
      
      const day = Number(dayInput.value);
      const hour = Number(hourInput.value);
      const minute = Number(minuteInput.value);
      const year = Number(yearInput.value);
      await TimeManagementDialog.updateGameTime({ day, hour, minute, year });
      // Automatyczna zmiana trybu dzień/noc
      const mode = (hour >= 6 && hour < 18) ? "day" : "night";
      await game.settings.set("from-time-management", "trackingMode", mode);
      this._refreshCurrentTimeDisplay(root, true);
      if (notify) {
        ui.notifications?.info(t("time-set"));
        const msg = `<b>${t("current-time")}</b>: ${t("day-in-town")}: ${day}, ${t("hour")}: ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}, ${t("year")}: ${year}`;
        ChatMessage.create({ content: msg });
      }
    };

    // Prevent Enter from submitting the form and closing the dialog
    const form = contentElement.querySelector("form.from-tm-time-form");
    if (form) {
      form.addEventListener("submit", ev => {
        ev.preventDefault();
        return false;
      });
    }

    // Ustaw czas przyciskiem
    const setTimeBtn = contentElement.querySelector("#set-time-btn");
    if (setTimeBtn) {
      setTimeBtn.addEventListener("click", async ev => {
        ev.preventDefault();
        ev.stopPropagation();
        await updateTimeFromForm(true);
      });
    }

    // Debounced input/change: update time (no notification)
    ["tm-day", "tm-hour", "tm-minute", "tm-year"].forEach(id => {
      const input = contentElement.querySelector(`#${id}`);
      if (input) {
        input.addEventListener("input", () => {
          if (inputChangeTimeout) clearTimeout(inputChangeTimeout);
          inputChangeTimeout = setTimeout(() => {
            updateTimeFromForm(false);
          }, 400);
        });
        input.addEventListener("change", () => {
          if (inputChangeTimeout) clearTimeout(inputChangeTimeout);
          inputChangeTimeout = setTimeout(() => {
            updateTimeFromForm(false);
          }, 400);
        });
        input.addEventListener("keydown", async ev => {
          if (ev.key === "Enter" || ev.which === 13) {
            ev.preventDefault();
            if (inputChangeTimeout) clearTimeout(inputChangeTimeout);
            await updateTimeFromForm(true);
          }
        });
      }
    });

    // New day button
    const newDayBtn = root.querySelector("#new-day-btn");
    if (newDayBtn) {
      newDayBtn.addEventListener("click", async ev => {
        ev.preventDefault();
        const current = await TimeManagementDialog.getGameTime();
        
        // Use DialogV2.confirm with proper syntax
        const confirmed = await foundry.applications.api.DialogV2.confirm({
          window: { title: t("new-day") },
          content: `<div class='new-day-confirm'><h3>🌅 ${t("new-day-confirm")}</h3><p>${t("irreversible-action")}</p></div>`,
          rejectClose: false,
          modal: true
        });
        
        if (confirmed) {
          const newDay = Number(current.day) + 1;
          const newHour = 6;
          const newMinute = 0;
          const year = current.year;
          
          // Reset agent time tracking
          await game.settings.set("from-time-management", "agentDayTimeTracking", {});
          await game.settings.set("from-time-management", "agentNightTimeTracking", {});
          
          // Update game time
          await TimeManagementDialog.updateGameTime({ day: newDay, hour: newHour, minute: newMinute, year });
          await game.settings.set("from-time-management", "trackingMode", "day");
          
          // Refresh display
          this._refreshCurrentTimeDisplay(this.element, true);
          
          // Notifications
          ui.notifications?.info(`${t("new-day-started")} (${t("day-label")} ${newDay})`);
          
          // Broadcast to chat with styled message
          const message = `
            <div style="
              background: linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%);
              border: 2px solid #FF6F00;
              border-radius: 8px;
              padding: 15px;
              text-align: center;
              box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
            ">
              <div style="font-size: 24px; margin-bottom: 8px;">🌅</div>
              <div style="font-size: 18px; font-weight: bold; color: #E65100; margin-bottom: 5px;">
                ${t("new-day-started")}
              </div>
              <div style="font-size: 14px; color: #BF360C;">
                ${t("day-label")} ${newDay} • ${t("another-day-cursed")}
              </div>
            </div>
          `;
          
          ChatMessage.create({
            content: message,
            style: CONST.CHAT_MESSAGE_STYLES.OTHER
          });
          
        }
      });
    }

    // Broadcast time button
    const broadcastBtn = root.querySelector("#broadcast-time-btn");
    if (broadcastBtn) {
      broadcastBtn.addEventListener("click", async ev => {
        ev.preventDefault();
        const current = await TimeManagementDialog.getGameTime();
        const hours = String(current.hour).padStart(2, '0');
        const minutes = String(current.minute ?? 0).padStart(2, '0');
        const day = current.day;
        const year = current.year;
        const msg = `<div class='broadcast-chat'><strong>🕐 ${t("current-game-time")}:</strong><br><span class='broadcast-time'>${hours}:${minutes}</span><br><span class='broadcast-desc'>${t("day-label")} ${day} ${t("in-town")} (${t("year-label")} ${year})</span></div>`;
        ChatMessage.create({ content: msg });
        ui.notifications?.info(t("time-broadcasted"));
      });
    }

    // Whisper time button
    const whisperBtn = root.querySelector("#whisper-time-btn");
    if (whisperBtn) {
      whisperBtn.addEventListener("click", async ev => {
        ev.preventDefault();
        const current = await TimeManagementDialog.getGameTime();
        const hours = String(current.hour).padStart(2, '0');
        const minutes = String(current.minute ?? 0).padStart(2, '0');
        const day = current.day;
        const year = current.year;
        const msg = `<div class='whisper-chat'><strong>🕐 ${t("current-game-time")} (${t("private-label")}):</strong><br><span class='broadcast-time'>${hours}:${minutes}</span><br><span class='broadcast-desc'>${t("day-label")} ${day} ${t("in-town")} (${t("year-label")} ${year})</span></div>`;
        ChatMessage.create({ content: msg, whisper: [game.user.id] });
        ui.notifications?.info(t("time-whispered"));
      });
    }
  }

  _refreshCurrentTimeDisplay(root, animate = false) {
    // Pobierz aktualny czas z settings i odśwież wyświetlanie + pola formularza
    TimeManagementDialog.getGameTime().then(({ day, hour, minute, year }) => {
      const display = root.querySelector("#current-time-display");
      if (display) display.textContent = TimeManagementDialog.formatCurrentTime({ day, hour, minute, year });
      
      // Zaktualizuj wartości w polach formularza
      const dayInput = root.querySelector("#tm-day");
      const hourInput = root.querySelector("#tm-hour");
      const minuteInput = root.querySelector("#tm-minute");
      const yearInput = root.querySelector("#tm-year");
      if (dayInput) dayInput.value = day;
      if (hourInput) hourInput.value = hour;
      if (minuteInput) minuteInput.value = minute ?? 0;
      if (yearInput) yearInput.value = year;
      
      if (animate) {
        const currentTimeDiv = root.querySelector(".current-time");
        if (currentTimeDiv) {
          currentTimeDiv.classList.add("updated");
          setTimeout(() => currentTimeDiv.classList.remove("updated"), 500);
        }
      }
    });
  }
}
