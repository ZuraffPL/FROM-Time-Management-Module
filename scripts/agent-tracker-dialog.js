import { ActionSelectionDialog } from "./action-selection-dialog.js";
import { ActionQueueDialog } from "./action-queue-dialog.js";

// Dodawanie akcji do kolejki (GM/player)
export async function addActionToQueue(agentId, agentName, actionName, actionCost) {
  const trackingMode = game.settings.get("from-time-management", "trackingMode") || "day";
  if (game.user.isGM) {
    // Pobierz kolejkę
    let queue = game.settings.get("from-time-management", "actionQueue") || [];
    // Pobierz aktora
    const agent = game.actors.get(agentId);
    if (!agent) {
      ui.notifications.error("Agent not found!");
      return;
    }
    // Oblicz czas startu i końca
    const dayTimes = foundry.utils.duplicate(game.settings.get("from-time-management", "agentDayTimeTracking") || {});
    const nightTimes = foundry.utils.duplicate(game.settings.get("from-time-management", "agentNightTimeTracking") || {});
    const timeSpent = trackingMode === 'day' ? (dayTimes[agentId] || 0) : (nightTimes[agentId] || 0);
    const baseHour = trackingMode === 'day' ? 6 : 18;
    const startTotalHours = baseHour + timeSpent;
    const startHour = Math.floor(startTotalHours) % 24;
    const startMinute = Math.floor((startTotalHours % 1) * 60);
    const endTotalHours = startTotalHours + actionCost;
    const endHour = Math.floor(endTotalHours) % 24;
    const endMinute = Math.floor((endTotalHours % 1) * 60);
    let crossesPeriods = false;
    if (trackingMode === 'day') {
      crossesPeriods = (startTotalHours + actionCost) > 18;
    } else {
      crossesPeriods = (startTotalHours + actionCost) > 30;
    }
    const action = {
      id: Date.now(),
      name: actionName,
      cost: actionCost,
      agentId: agentId,
      agentName: agent.name,
      timestamp: Date.now(),
      completed: false,
      actionMode: trackingMode,
      startTime: { hour: startHour, minute: startMinute },
      endTime: { hour: endHour, minute: endMinute },
      crossesPeriods: crossesPeriods,
      townDay: (game.settings.get("from-time-management", "currentGameTime")?.day) || 1
    };
    queue.push(action);
    await game.settings.set("from-time-management", "actionQueue", queue);
    
    // WAŻNE: Zaktualizuj czas spędzony przez agenta (dodaj koszt akcji)
    // Jeśli akcja przekracza porę, rozdziel godziny między dwie pory
    if (crossesPeriods) {
      if (trackingMode === 'day') {
        // Dzień: 6:00-18:00 (12 godzin)
        const remainingDayTime = 12 - timeSpent; // Ile zostało do końca dnia
        const overflowToNight = actionCost - remainingDayTime; // Ile przechodzi na noc
        
        dayTimes[agentId] = 12; // Dzień wypełniony do maksimum
        nightTimes[agentId] = (nightTimes[agentId] || 0) + overflowToNight; // Dodaj overflow do nocy
        
        await game.settings.set("from-time-management", "agentDayTimeTracking", dayTimes);
        await game.settings.set("from-time-management", "agentNightTimeTracking", nightTimes);
      } else {
        // Noc: 18:00-6:00 (12 godzin, ale liczone jako 18-30)
        const remainingNightTime = 12 - timeSpent; // Ile zostało do końca nocy
        const overflowToDay = actionCost - remainingNightTime; // Ile przechodzi na dzień
        
        nightTimes[agentId] = 12; // Noc wypełniona do maksimum
        dayTimes[agentId] = (dayTimes[agentId] || 0) + overflowToDay; // Dodaj overflow do dnia
        
        await game.settings.set("from-time-management", "agentDayTimeTracking", dayTimes);
        await game.settings.set("from-time-management", "agentNightTimeTracking", nightTimes);
      }
    } else {
      // Akcja mieści się w bieżącej porze - standardowe dodawanie
      const newTimeSpent = timeSpent + actionCost;
      if (trackingMode === 'day') {
        dayTimes[agentId] = newTimeSpent;
        await game.settings.set("from-time-management", "agentDayTimeTracking", dayTimes);
      } else {
        nightTimes[agentId] = newTimeSpent;
        await game.settings.set("from-time-management", "agentNightTimeTracking", nightTimes);
      }
    }
    
    ui.notifications.info(`Dodano akcję "${actionName}" (${actionCost}h) dla ${agent.name}`);
    
    // Odśwież lokalnie u GM przez refreshContent (bez migotania)
    const trackerInstance = AgentTrackerDialog.getInstance();
    if (trackerInstance) {
      trackerInstance.refreshContent();
    }
    
    const queueInstance = ActionQueueDialog.getInstance();
    if (queueInstance) {
      queueInstance.close();
      setTimeout(() => ActionQueueDialog.show(), 100);
    }
    
    // Wyślij socket do wszystkich graczy o odświeżenie OBIE dialogi
    game.socket.emit("module.from-time-management", { operation: "forceRefreshAgentTracker" });
    game.socket.emit("module.from-time-management", { operation: "forceRefreshActionQueue" });
  } else {
    // Player: wyślij do GM przez socket
    game.socket.emit("module.from-time-management", {
      operation: "addActionToQueue",
      agentId,
      actionName,
      actionCost,
      trackingMode,
      requestingUserId: game.user.id
    });
    ui.notifications.info(game.i18n.localize("from-time-management.action-request-sent") || "Action request sent to GM.");
  }
}
// Action Archive DialogV2 - modern, modular, legacy-compliant
export class ActionArchiveDialog extends foundry.applications.api.DialogV2 {
  static show(agentId, agentName) {
    new ActionArchiveDialog(agentId, agentName).render(true);
  }

  constructor(agentId, agentName) {
    const content = ActionArchiveDialog.generateArchiveContent(agentId, agentName);
    const t = ActionArchiveDialog.t;
    super({
      title: `${t("action-archive")} - ${agentName}`,
      content,
      buttons: [{
        label: t("close"),
        icon: '<i class="fas fa-times"></i>',
        close: true
      }],
      default: 0
    }, {
      width: 600,
      height: 500,
      resizable: true,
      popOut: true,
      minimizable: true,
      classes: ["time-management-archive-dialog"]
    });
    this.agentId = agentId;
    this.agentName = agentName;
  }

  static t(key) {
    return game.i18n.localize(`from-time-management.${key}`);
  }

  static getArchive(agentId) {
    const archive = game.settings.get("from-time-management", "actionArchive") || {};
    return archive[agentId] || [];
  }

  static groupByDay(actions) {
    // Group actions by day (legacy: action.day or action.addedOn)
    const days = {};
    for (const action of actions) {
      const day = action.day || (action.addedOn ? action.addedOn.day : 0) || 0;
      if (!days[day]) days[day] = [];
      days[day].push(action);
    }
    return days;
  }

  static generateArchiveContent(agentId, agentName) {
    const t = ActionArchiveDialog.t;
    const actions = ActionArchiveDialog.getArchive(agentId);
    if (!actions.length) {
      return `<div class="archive-window"><div class="archive-header"><h3>${t("action-archive")}</h3></div><div class="archive-content"><div class="no-actions-message">${t("no-archived-actions")}</div></div></div>`;
    }
    // Group by day
    const days = ActionArchiveDialog.groupByDay(actions);
    const sortedDays = Object.keys(days).sort((a, b) => Number(a) - Number(b));
    let archiveHTML = `<div class="archive-window">
      <div class="archive-header">
        <h3>${t("action-archive")} - ${agentName}</h3>
        <div class="archive-stats">${t("total-actions")}: <strong>${actions.length}</strong></div>
      </div>
      <div class="archive-content">`;
    for (const day of sortedDays) {
      const dayActions = days[day];
      archiveHTML += `<div class="day-section">
        <div class="day-header" data-day="${day}">
          <span class="day-toggle">&#9654;</span>
          <span class="day-title">${t("day")}: ${day}</span>
          <span class="day-count">${dayActions.length} ${t("actions")}</span>
        </div>
        <div class="day-actions collapsed">`;
      for (const action of dayActions) {
        archiveHTML += ActionArchiveDialog.generateActionHTML(action);
      }
      archiveHTML += `</div></div>`;
    }
    archiveHTML += `</div></div>`;
    return archiveHTML;
  }

  static generateActionHTML(action) {
    const t = ActionArchiveDialog.t;
    const completed = action.completed;
    const cost = action.cost;
    const name = action.name;
    const mode = action.actionMode || 'day';
    const modeLabel = action.crossesPeriods ? `☀️🌙 ${t("day-night-action")}` : (mode === 'day' ? `☀️ ${t("day-action")}` : `🌙 ${t("night-action")}`);
    const fromLabel = t("from-time");
    const toLabel = t("to-time");
    let startTime = '--:--', endTime = '--:--';
    if (action.startTime && action.endTime) {
      startTime = ActionArchiveDialog.formatTime(action.startTime);
      endTime = ActionArchiveDialog.formatTime(action.endTime);
    }
    const addedOn = action.addedOn ? `${t("added-on")}: ${action.addedOn.date || ''}` : '';
    return `<div class="archive-action-item${completed ? ' completed' : ''}">
      <div class="archive-action-info">
        <div class="archive-action-name">${name}</div>
        <div class="archive-action-details">
          ${fromLabel}: ${startTime} ${toLabel} ${endTime} | ${modeLabel}${completed ? ' | ✅' : ''}<br>${addedOn}
        </div>
      </div>
      <div class="archive-action-cost">${cost}h</div>
    </div>`;
  }

  static formatTime(time) {
    if (!time) return '--:--';
    const h = String(time.hour).padStart(2, '0');
    const m = String(time.minute).padStart(2, '0');
    return `${h}:${m}`;
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    const root = this.element;

    // Expand/collapse day sections
    root.querySelectorAll('.day-header').forEach(header => {
      header.addEventListener('click', function() {
        const actions = header.nextElementSibling;
        const toggle = header.querySelector('.day-toggle');
        const collapsed = actions.classList.contains('collapsed');
        actions.classList.toggle('collapsed', !collapsed);
        if (toggle) toggle.style.transform = collapsed ? 'rotate(90deg)' : 'rotate(0deg)';
      });
    });

    // Tracking mode toggle
    const dayModeBtn = root.querySelector('#day-mode-btn');
    if (dayModeBtn && game.user.isGM) {
      dayModeBtn.addEventListener('click', async () => {
        await game.settings.set("from-time-management", "trackingMode", "day");
        AgentTrackerDialog.refreshAll();
        game.socket.emit("module.from-time-management", { operation: "forceRefreshAgentTracker" });
      });
    }
    const nightModeBtn = root.querySelector('#night-mode-btn');
    if (nightModeBtn && game.user.isGM) {
      nightModeBtn.addEventListener('click', async () => {
        await game.settings.set("from-time-management", "trackingMode", "night");
        AgentTrackerDialog.refreshAll();
        game.socket.emit("module.from-time-management", { operation: "forceRefreshAgentTracker" });
      });
    }

    // Action queue
    const actionQueueBtn = root.querySelector('#open-action-queue-btn');
    if (actionQueueBtn) {
      actionQueueBtn.addEventListener('click', () => {
        // Otwórz kolejkę akcji bezpośrednio
        if (typeof ActionQueueDialog !== "undefined" && ActionQueueDialog.show) {
          ActionQueueDialog.show();
        } else {
          ui.notifications?.warn("Action queue dialog is not available.");
        }
      });
    }

    // Add action
    root.querySelectorAll('.add-action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const agentId = btn.dataset.agentId;
        const agentName = btn.dataset.agentName;
        if (!AgentTrackerDialog.canPlayerManageAgent(agentId)) {
          ui.notifications.warn(game.i18n.localize("from-time-management.only-own-characters") || "You can only add actions to your own characters!");
          return;
        }
        ActionSelectionDialog.show(agentId, agentName, async (agentId, agentName, actionName, actionCost) => {
          await addActionToQueue(agentId, agentName, actionName, actionCost);
        });
      });
    });

    // Archive
    root.querySelectorAll('.action-archive-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const agentId = btn.dataset.agentId;
        const agentName = btn.dataset.agentName;
        if (!AgentTrackerDialog.canPlayerManageAgent(agentId)) {
          ui.notifications.warn(game.i18n.localize("from-time-management.only-own-characters") || "You can only view your own character's archive!");
          return;
        }
        ActionArchiveDialog.show(agentId, agentName);
      });
    });

    // Reset day
    root.querySelectorAll('.reset-day-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const agentId = btn.dataset.agentId;
        const agentName = btn.dataset.agentName;
        if (window.TimeManagement && typeof window.TimeManagement.showResetDayDialog === "function") {
          window.TimeManagement.showResetDayDialog(agentId, agentName);
        }
      });
    });

    // Time adjust (+1/-1h)
    root.querySelectorAll('.time-adjust-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        if (!game.user.isGM) return;
        const agentId = btn.dataset.agentId;
        const adjustment = parseFloat(btn.dataset.adjustment);
        const trackingMode = game.settings.get("from-time-management", "trackingMode") || "day";
        const dayTimes = foundry.utils.duplicate(game.settings.get("from-time-management", "agentDayTimeTracking") || {});
        const nightTimes = foundry.utils.duplicate(game.settings.get("from-time-management", "agentNightTimeTracking") || {});
        let value = trackingMode === 'day' ? (dayTimes[agentId] || 0) : (nightTimes[agentId] || 0);
        value = Math.max(0, Math.min(12, value + adjustment));
        if (trackingMode === 'day') dayTimes[agentId] = value;
        else nightTimes[agentId] = value;
        await game.settings.set("from-time-management", "agentDayTimeTracking", dayTimes);
        await game.settings.set("from-time-management", "agentNightTimeTracking", nightTimes);
        AgentTrackerDialog.refreshAll();
        game.socket.emit("module.from-time-management", { operation: "forceRefreshAgentTracker" });
        ui.notifications.info(game.i18n.localize("from-time-management.time-adjusted") || "Time adjusted");
      });
    });
  }
}
// Agent Tracker DialogV2 - migrated from legacy logic, using CSS and localization
export class AgentTrackerDialog extends foundry.applications.api.DialogV2 {
  static _instance = null; // Singleton instance

  static show() {
    // Jeśli dialog już istnieje, zamknij go i otwórz na nowo
    if (AgentTrackerDialog._instance) {
      AgentTrackerDialog._instance.close();
    }
    AgentTrackerDialog._instance = new AgentTrackerDialog();
    AgentTrackerDialog._instance.render(true);
  }

  static getInstance() {
    return AgentTrackerDialog._instance;
  }

  /**
   * Odświeża tylko zawartość okna bez zamykania/otwierania.
   * Zachowuje pozycję, rozmiar, stan okna i otwarty inline panel wyboru akcji.
   */
  refreshContent() {
    const contentEl = this.element?.querySelector('.window-content');
    if (!contentEl) {
      this.render(true);
      return;
    }

    // Zapisz stan otwartego inline panelu (lokalny dla tego gracza)
    const openPanel = contentEl.querySelector('.inline-action-panel[style*="display: block"], .inline-action-panel[style*="display:block"]');
    let openPanelAgentId = null;
    let openPanelAgentName = null;
    let openPanelCustomName = '';
    let openPanelCustomCost = '';
    if (openPanel && openPanel.style.display === 'block') {
      openPanelAgentId = openPanel.dataset.agentId;
      openPanelAgentName = openPanel.dataset.agentName;
      // Zachowaj wartości custom inputów
      const nameInput = openPanel.querySelector('.inline-custom-name');
      const costInput = openPanel.querySelector('.inline-custom-cost');
      if (nameInput) openPanelCustomName = nameInput.value;
      if (costInput) openPanelCustomCost = costInput.value;
    }

    const newHTML = AgentTrackerDialog.generateAgentTrackerContent();
    // Zapisz scroll przed nadpisaniem
    const agentList = contentEl.querySelector('.agent-list');
    const scrollTop = agentList ? agentList.scrollTop : 0;
    // Nadpisz tylko zawartość .agent-tracker-window wewnątrz window-content
    const innerContent = contentEl.querySelector('.agent-tracker-window');
    if (innerContent) {
      const temp = document.createElement('div');
      temp.innerHTML = newHTML;
      const newNode = temp.firstElementChild;
      if (newNode) innerContent.replaceWith(newNode);
    } else {
      contentEl.innerHTML = newHTML;
    }
    // Przywróć scroll
    const newAgentList = contentEl.querySelector('.agent-list');
    if (newAgentList) newAgentList.scrollTop = scrollTop;

    // Przywróć otwarty inline panel (jeśli był)
    if (openPanelAgentId) {
      const restoredPanel = contentEl.querySelector(`.inline-action-panel[data-agent-id="${openPanelAgentId}"]`);
      if (restoredPanel) {
        restoredPanel.innerHTML = AgentTrackerDialog.generateInlineActionPanel(openPanelAgentId, openPanelAgentName);
        restoredPanel.style.display = 'block';
        // Przywróć wartości custom inputów
        if (openPanelCustomName) {
          const nameInput = restoredPanel.querySelector('.inline-custom-name');
          if (nameInput) nameInput.value = openPanelCustomName;
        }
        if (openPanelCustomCost) {
          const costInput = restoredPanel.querySelector('.inline-custom-cost');
          if (costInput) costInput.value = openPanelCustomCost;
        }
      }
    }
  }

  /**
   * Statyczna metoda odświeżająca wszystkie otwarte instancje u bieżącego gracza.
   */
  static refreshAll() {
    const instance = AgentTrackerDialog._instance;
    if (instance) {
      instance.refreshContent();
    }
  }

  constructor() {
    const content = AgentTrackerDialog.generateAgentTrackerContent();
    // Przyciski budujemy bez this, callbacki szukają instancji dialogu przez ui.windows
    const buttons = AgentTrackerDialog.buildButtons();
    const safeButtons = (buttons && Object.keys(buttons).length > 0) ? buttons : {
      close: {
        icon: '<i class="fas fa-times"></i>',
        label: game.i18n.localize("from-time-management.close") || "Close",
        callback: () => {}
      }
    };
    const buttonsArray = Object.entries(safeButtons).map(([k, v]) => ({ ...v, id: k }));
    super({
      title: game.i18n.localize("from-time-management.agent-tracker") || "Agent Activity Tracker",
      content,
      buttons: buttonsArray,
      default: "close"
    }, {
      width: 600,
      height: 500,
      resizable: true,
      popOut: true,
      minimizable: true,
      classes: ["agent-tracker-dialog"]
    });
    this.trackingMode = game.settings.get("from-time-management", "trackingMode") || "day";
    this._binded = false;
    this._isAgentTrackerDialog = true; // Flaga do identyfikacji
  }

  async close(options = {}) {
    if (AgentTrackerDialog._instance === this) {
      AgentTrackerDialog._instance = null;
    }
    return super.close(options);
  }

  static buildButtons() {
    const buttons = {
      refresh: {
        icon: '<i class="fas fa-sync-alt"></i>',
        label: game.i18n.localize("from-time-management.refresh") || "Refresh",
        callback: () => {
          const dlg = AgentTrackerDialog.getInstance();
          if (dlg) dlg.refreshContent();
        }
      },
      close: {
        icon: '<i class="fas fa-times"></i>',
        label: game.i18n.localize("from-time-management.close") || "Close",
        callback: () => {
          // Only close on explicit close
        }
      }
    };
    if (game.user.isGM) {
      buttons.reset = {
        icon: '<i class="fas fa-undo"></i>',
        label: game.i18n.localize("from-time-management.reset-all") || "Reset All",
        callback: async () => {
          const confirmed = await foundry.applications.api.DialogV2.confirm({
            window: { title: game.i18n.localize("from-time-management.reset-agent-time") || "Reset Agent Time" },
            content: `<p>${game.i18n.localize("from-time-management.reset-confirm") || "Are you sure you want to reset time spent by all agents?"}</p>`,
            rejectClose: false,
            modal: true
          });
          if (confirmed) {
            AgentTrackerDialog.resetAgentTimeTracking();
            ui.notifications.info("Agent time tracking has been reset.");
            const instance = AgentTrackerDialog.getInstance();
            if (instance) {
              instance.refreshContent();
            }
          }
        }
      };
    }
    return buttons;
  }

  static getTrackingData() {
    // Get tracking data from settings
    return {
      agentTimeTracking: game.settings.get("from-time-management", "agentTimeTracking") || {},
      agentDayTimeTracking: game.settings.get("from-time-management", "agentDayTimeTracking") || {},
      agentNightTimeTracking: game.settings.get("from-time-management", "agentNightTimeTracking") || {},
      trackingMode: game.settings.get("from-time-management", "trackingMode") || "day"
    };
  }

  static getActiveAgents() {
    // Returns [{ user, agent, ... }]
    const agentDayTimeTracking = game.settings.get("from-time-management", "agentDayTimeTracking") || {};
    const agentNightTimeTracking = game.settings.get("from-time-management", "agentNightTimeTracking") || {};
    const agentTimeTracking = game.settings.get("from-time-management", "agentTimeTracking") || {};
    const agents = [];
    game.users.forEach(user => {
      if (user.active && !user.isGM) {
        const userAgents = game.actors.filter(actor =>
          actor.type === 'agent' &&
          actor.ownership?.[user.id] >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
        );
        userAgents.forEach(agent => {
          agents.push({
            user,
            agent,
            dayTimeSpent: agentDayTimeTracking[agent.id] || 0,
            nightTimeSpent: agentNightTimeTracking[agent.id] || 0,
            totalTimeSpent: agentTimeTracking[agent.id] || 0
          });
        });
      }
    });
    return agents;
  }

  static generateAgentTrackerContent() {
    const trackingMode = game.settings.get("from-time-management", "trackingMode") || "day";
    const currentTime = game.settings.get("from-time-management", "currentGameTime") || { hours: 12, minutes: 0, day: 1, year: new Date().getFullYear() };
    let activeAgents = AgentTrackerDialog.getActiveAgents();
    const hiddenAgents = game.settings.get("from-time-management", "hiddenAgents") || [];
    const isGM = game.user.isGM;
    // Gracze nie widzą ukrytych agentów, GM widzi wszystkich
    if (!isGM) {
      activeAgents = activeAgents.filter(a => !hiddenAgents.includes(a.agent.id));
    }
    const currentHour = currentTime.hours;
    const isCurrentlyDay = currentHour >= 6 && currentHour < 18;
    let agentsHTML = '';
    if (activeAgents.length === 0) {
      agentsHTML = `
        <div class="no-agents-message">
          <i class="fas fa-user-slash" style="font-size: 24px; margin-bottom: 10px; display: block;"></i>
          ${game.i18n.localize("from-time-management.no-active-agents") || "No active players with agents"}
        </div>
      `;
    } else {
      agentsHTML = activeAgents.map(agent => AgentTrackerDialog.generateAgentHTML(agent, trackingMode)).join('');
    }
    const timeString = String(currentTime.hours).padStart(2, '0') + ':' + String(currentTime.minutes).padStart(2, '0') + `, ${currentTime.day}`;
    // Przyciski trybu dnia/nocy: tylko GM może klikać, gracz widzi disabled
    return `
      <div class="agent-tracker-window ${trackingMode === 'night' ? 'night-mode' : ''}">
        <div class="agent-tracker-header">
          <h2>${game.i18n.localize("from-time-management.agent-activity") || "Agent Activity"}</h2>
          <div style="font-size: 12px; margin-top: 5px; color: inherit; opacity: 0.8;">
            ${game.i18n.localize("from-time-management.current-time") || "Current time"}: <strong>${timeString}</strong>
            <br>
            <span style="font-size: 11px;">
              ${isCurrentlyDay ? `☀️ ${game.i18n.localize("from-time-management.day-period") || "Day (6:00-18:00)"}` : `🌙 ${game.i18n.localize("from-time-management.night-period") || "Night (18:00-6:00)"}`}
            </span>
          </div>
        </div>
        <div class="tracking-mode-toggle">
          <button type="button" class="mode-button${trackingMode === 'day' ? ' active day-mode' : ''}" id="day-mode-btn" ${isGM ? '' : 'disabled title="Only GM can change mode"'}>
            <i class="fas fa-sun"></i>
            ${game.i18n.localize("from-time-management.day-time") || "Day Time"}
          </button>
          <button type="button" class="mode-button${trackingMode === 'night' ? ' active night-mode' : ''}" id="night-mode-btn" ${isGM ? '' : 'disabled title="Only GM can change mode"'}>
            <i class="fas fa-moon"></i>
            ${game.i18n.localize("from-time-management.night-time") || "Night Time"}
          </button>
        </div>
        <div style="text-align: center; margin-bottom: 15px;">
          <button type="button" class="time-button" id="open-action-queue-btn" style="background: linear-gradient(135deg, #4CAF50, #2E7D32); border-color: #2E7D32;">
            <i class="fas fa-list-ul" style="margin-right: 5px;"></i>
            ${game.i18n.localize("from-time-management.action-queue") || "Action Queue"}
          </button>
        </div>
        <div class="agent-list">
          ${agentsHTML}
        </div>
      </div>
    `;
  }

  static generateAgentHTML(agentData, trackingMode) {
    const { user, agent } = agentData;
    const avatar = agent.img || 'icons/svg/mystery-man.svg';
    const agentName = agent.name || game.i18n.localize("from-time-management.unknown-agent") || 'Unknown Agent';
    const playerName = user.name;
    const hiddenAgents = game.settings.get("from-time-management", "hiddenAgents") || [];
    const isHidden = hiddenAgents.includes(agent.id);
    const agentDayTimeTracking = game.settings.get("from-time-management", "agentDayTimeTracking") || {};
    const agentNightTimeTracking = game.settings.get("from-time-management", "agentNightTimeTracking") || {};
    const timeSpent = trackingMode === 'day' ? (agentDayTimeTracking[agent.id] || 0) : (agentNightTimeTracking[agent.id] || 0);
    const maxHours = 12;
    const progressSegments = Math.min(Math.floor(timeSpent), maxHours);
    let segmentsHTML = '';
    for (let i = 0; i < maxHours; i++) {
      let segmentClass = 'time-segment';
      if (i < progressSegments) {
        if (i < 8) segmentClass += ' active';
        else if (i < 10) segmentClass += ' warning';
        else segmentClass += ' danger';
        if (trackingMode === 'night') segmentClass += ' night-mode';
      }
      segmentsHTML += `<div class="${segmentClass}"></div>`;
    }
    const modeLabel = trackingMode === 'day' ? 'day' : 'night';
    const modeIcon = trackingMode === 'day' ? '☀️' : '🌙';
    const canManage = AgentTrackerDialog.canPlayerManageAgent(agent.id);
    let buttonsHTML = '';
    if (canManage || game.user.isGM) {
      buttonsHTML += `
        <button type="button" class="add-action-btn" data-agent-id="${agent.id}" data-agent-name="${agentName}">
          <i class="fas fa-plus"></i> ${game.i18n.localize("from-time-management.add-action") || "Add Action"}
        </button>
        <button type="button" class="action-archive-btn" data-agent-id="${agent.id}" data-agent-name="${agentName}">
          <i class="fas fa-archive"></i> ${game.i18n.localize("from-time-management.action-archive") || "Action Archive"}
        </button>
      `;
    }
    if (game.user.isGM) {
      buttonsHTML += `
        <button type="button" class="reset-day-btn" data-agent-id="${agent.id}" data-agent-name="${agentName}">
          <i class="fas fa-sun"></i> ${game.i18n.localize("from-time-management.reset-day") || "New Day"}
        </button>
      `;
    }
    let timeControlsHTML = '';
    if (game.user.isGM) {
      timeControlsHTML = `
        <div class="time-adjustment-controls">
          <button type="button" class="time-adjust-btn minus" data-agent-id="${agent.id}" data-adjustment="-1" title="${game.i18n.localize("from-time-management.subtract-hour") || "Subtract 1h"}">
            <i class="fas fa-minus"></i> 1h
          </button>
          <button type="button" class="time-adjust-btn plus" data-agent-id="${agent.id}" data-adjustment="1" title="${game.i18n.localize("from-time-management.add-hour") || "Add 1h"}">
            <i class="fas fa-plus"></i> 1h
          </button>
        </div>
      `;
    }
    return `
      <div class="agent-entry${isHidden ? ' agent-hidden' : ''}" data-agent-id="${agent.id}">
        <div class="agent-header-row">
          ${game.user.isGM ? `<button type="button" class="agent-visibility-btn" data-agent-id="${agent.id}" title="${isHidden ? (game.i18n.localize('from-time-management.show-agent') || 'Show agent') : (game.i18n.localize('from-time-management.hide-agent') || 'Hide agent')}">
            <i class="fas ${isHidden ? 'fa-eye-slash' : 'fa-eye'}"></i>
          </button>` : ''}
          <img src="${avatar}" alt="${agentName}" class="agent-avatar" />
          <div class="agent-info">
            <div class="agent-name">${agentName}</div>
            <div class="agent-player">${game.i18n.localize("from-time-management.player") || "Player"}: ${playerName}</div>
          </div>
          <div class="time-progress-container">
            <div class="time-progress-bar">
              ${segmentsHTML}
            </div>
            <div class="time-progress-label">
              ${modeIcon} ${timeSpent.toFixed(1)}h / ${maxHours}h (${modeLabel})
            </div>
          </div>
          ${timeControlsHTML}
        </div>
        <div class="agent-controls-row">
          <div class="agent-buttons">
            ${buttonsHTML}
          </div>
        </div>
        <div class="inline-action-panel" data-agent-id="${agent.id}" data-agent-name="${agentName}" style="display:none;"></div>
      </div>
    `;
  }

  static canPlayerManageAgent(agentId) {
    if (game.user.isGM) return true;
    const agent = game.actors.get(agentId);
    if (!agent) return false;
    return agent.ownership?.[game.user.id] >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;
  }

  /**
   * Generuje HTML inline panelu wyboru akcji dla agenta.
   */
  static generateInlineActionPanel(agentId, agentName) {
    const t = (key) => game.i18n.localize(`from-time-management.${key}`) || key;
    const actionTemplates = [
      { name: t("short-rest"), cost: 1 },
      { name: t("npc-conversation"), cost: 1 },
      { name: t("explore-near-town"), cost: 3 },
      { name: t("investigate-location"), cost: 1 },
      { name: t("meal-at-diner"), cost: 1 },
      { name: t("medical-care-light"), cost: 2 },
      { name: t("travel-town-colony"), cost: 1 },
      { name: t("forest-exploration"), cost: 6 }
    ];
    const templatesHTML = actionTemplates.map(tpl => `
      <div class="inline-action-template" data-name="${tpl.name}" data-cost="${tpl.cost}">
        <span class="inline-template-name">${tpl.name}</span>
        <span class="inline-template-cost">${tpl.cost}h</span>
      </div>
    `).join('');
    return `
      <div class="inline-action-content" data-agent-id="${agentId}" data-agent-name="${agentName}">
        <div class="inline-action-header">
          <strong>${t("add-action")} ${t("for")}: ${agentName}</strong>
          <button type="button" class="inline-action-close" title="${t("close")}">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="inline-action-templates">
          ${templatesHTML}
        </div>
        <div class="inline-action-custom">
          <div class="inline-action-custom-label">${t("or-create-custom")}:</div>
          <div class="inline-action-custom-row">
            <input type="text" class="inline-custom-name" placeholder="${t("action-name-placeholder")}" />
            <input type="number" class="inline-custom-cost" placeholder="h" min="1" max="12" style="width:50px;" />
            <button type="button" class="inline-action-add-custom">
              <i class="fas fa-plus"></i> ${t("add-action")}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  static resetAgentTimeTracking() {
    if (game.user.isGM) {
      game.settings.set("from-time-management", "agentTimeTracking", {});
      game.settings.set("from-time-management", "agentDayTimeTracking", {});
      game.settings.set("from-time-management", "agentNightTimeTracking", {});
    }
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    const root = this.element;

    // Użyj event delegation - dodaj listenery tylko raz
    if (this._eventsBound) return;
    this._eventsBound = true;

    // Event delegation dla wszystkich kliknięć
    root.addEventListener('click', async (e) => {
      const target = e.target.closest('button, .day-header, .inline-action-template, .inline-action-close');
      if (!target) return;

      // Agent visibility toggle (GM only)
      if (target.classList.contains('agent-visibility-btn') && game.user.isGM) {
        const agentId = target.dataset.agentId;
        const hiddenAgents = foundry.utils.duplicate(game.settings.get("from-time-management", "hiddenAgents") || []);
        const idx = hiddenAgents.indexOf(agentId);
        if (idx >= 0) {
          hiddenAgents.splice(idx, 1);
        } else {
          hiddenAgents.push(agentId);
        }
        await game.settings.set("from-time-management", "hiddenAgents", hiddenAgents);
        this.refreshContent();
        game.socket.emit("module.from-time-management", { operation: "forceRefreshAgentTracker" });
        return;
      }

      // Day header expand/collapse
      if (target.classList.contains('day-header')) {
        const actions = target.nextElementSibling;
        const toggle = target.querySelector('.day-toggle');
        const collapsed = actions.classList.contains('collapsed');
        actions.classList.toggle('collapsed', !collapsed);
        if (toggle) toggle.style.transform = collapsed ? 'rotate(90deg)' : 'rotate(0deg)';
        return;
      }

      // Day mode button
      if (target.id === 'day-mode-btn' && game.user.isGM) {
        await game.settings.set("from-time-management", "trackingMode", "day");
        this.refreshContent();
        game.socket.emit("module.from-time-management", { operation: "forceRefreshAgentTracker" });
        return;
      }

      // Night mode button
      if (target.id === 'night-mode-btn' && game.user.isGM) {
        await game.settings.set("from-time-management", "trackingMode", "night");
        this.refreshContent();
        game.socket.emit("module.from-time-management", { operation: "forceRefreshAgentTracker" });
        return;
      }

      // Action queue button
      if (target.id === 'open-action-queue-btn') {
        if (typeof ActionQueueDialog !== "undefined" && ActionQueueDialog.show) {
          ActionQueueDialog.show();
        } else {
          ui.notifications?.warn("Action queue dialog is not available.");
        }
        return;
      }

      // Add action button — toggle inline panel
      if (target.classList.contains('add-action-btn')) {
        const agentId = target.dataset.agentId;
        const agentName = target.dataset.agentName;
        if (!AgentTrackerDialog.canPlayerManageAgent(agentId)) {
          ui.notifications.warn(game.i18n.localize("from-time-management.only-own-characters") || "You can only add actions to your own characters!");
          return;
        }
        // Znajdź inline panel w bieżącym agent-entry
        const agentEntry = target.closest('.agent-entry');
        const panel = agentEntry?.querySelector('.inline-action-panel');
        if (panel) {
          if (panel.style.display === 'none' || !panel.style.display) {
            panel.innerHTML = AgentTrackerDialog.generateInlineActionPanel(agentId, agentName);
            panel.style.display = 'block';
          } else {
            panel.style.display = 'none';
            panel.innerHTML = '';
          }
        }
        return;
      }

      // Inline action panel — select template
      if (target.classList.contains('inline-action-template') || target.closest('.inline-action-template')) {
        const tpl = target.closest('.inline-action-template');
        if (!tpl) return;
        const actionName = tpl.dataset.name;
        const actionCost = parseInt(tpl.dataset.cost);
        const content = tpl.closest('.inline-action-content');
        const agentId = content?.dataset.agentId;
        const agentName = content?.dataset.agentName;
        if (agentId && actionName && actionCost > 0) {
          await addActionToQueue(agentId, agentName, actionName, actionCost);
          // Zamknij panel po dodaniu
          const panel = tpl.closest('.inline-action-panel');
          if (panel) { panel.style.display = 'none'; panel.innerHTML = ''; }
        }
        return;
      }

      // Inline action panel — custom action add
      if (target.classList.contains('inline-action-add-custom') || target.closest('.inline-action-add-custom')) {
        const btn = target.closest('.inline-action-add-custom');
        const content = btn?.closest('.inline-action-content');
        if (!content) return;
        const agentId = content.dataset.agentId;
        const agentName = content.dataset.agentName;
        const nameInput = content.querySelector('.inline-custom-name');
        const costInput = content.querySelector('.inline-custom-cost');
        const actionName = nameInput?.value?.trim();
        const actionCost = parseInt(costInput?.value);
        if (actionName && actionCost > 0) {
          await addActionToQueue(agentId, agentName, actionName, actionCost);
          const panel = content.closest('.inline-action-panel');
          if (panel) { panel.style.display = 'none'; panel.innerHTML = ''; }
        } else {
          ui.notifications.warn(game.i18n.localize("from-time-management.select-action-or-enter-data") || "Enter action name and cost.");
        }
        return;
      }

      // Inline action panel — close button
      if (target.classList.contains('inline-action-close') || target.closest('.inline-action-close')) {
        const panel = target.closest('.inline-action-panel');
        if (panel) { panel.style.display = 'none'; panel.innerHTML = ''; }
        return;
      }

      // Archive button
      if (target.classList.contains('action-archive-btn')) {
        const agentId = target.dataset.agentId;
        const agentName = target.dataset.agentName;
        if (!AgentTrackerDialog.canPlayerManageAgent(agentId)) {
          ui.notifications.warn(game.i18n.localize("from-time-management.only-own-characters") || "You can only view your own character's archive!");
          return;
        }
        ActionArchiveDialog.show(agentId, agentName);
        return;
      }

      // Reset day button
      if (target.classList.contains('reset-day-btn')) {
        const agentId = target.dataset.agentId;
        const agentName = target.dataset.agentName;
        if (window.TimeManagement && typeof window.TimeManagement.showResetDayDialog === "function") {
          window.TimeManagement.showResetDayDialog(agentId, agentName);
        }
        return;
      }

      // Time adjust buttons
      if (target.classList.contains('time-adjust-btn') && game.user.isGM) {
        const agentId = target.dataset.agentId;
        const adjustment = parseFloat(target.dataset.adjustment);
        const trackingMode = game.settings.get("from-time-management", "trackingMode") || "day";
        const dayTimes = foundry.utils.duplicate(game.settings.get("from-time-management", "agentDayTimeTracking") || {});
        const nightTimes = foundry.utils.duplicate(game.settings.get("from-time-management", "agentNightTimeTracking") || {});
        let value = trackingMode === 'day' ? (dayTimes[agentId] || 0) : (nightTimes[agentId] || 0);
        value = Math.max(0, Math.min(12, value + adjustment));
        if (trackingMode === 'day') dayTimes[agentId] = value;
        else nightTimes[agentId] = value;
        await game.settings.set("from-time-management", "agentDayTimeTracking", dayTimes);
        await game.settings.set("from-time-management", "agentNightTimeTracking", nightTimes);
        this.refreshContent();
        game.socket.emit("module.from-time-management", { operation: "forceRefreshAgentTracker" });
        ui.notifications.info(game.i18n.localize("from-time-management.time-adjusted") || "Time adjusted");
        return;
      }
    });
  }
}

// --- Synchronizacja AgentTrackerDialog przez socket ---
Hooks.on("ready", () => {
  game.socket.on("module.from-time-management", async (data) => {
    if (data?.operation === "addActionToQueue" && game.user.isGM) {
      await addActionToQueue(data.agentId, null, data.actionName, data.actionCost);
      return;
    }
    if (data?.operation === "forceRefreshAgentTracker") {
      const instance = AgentTrackerDialog.getInstance();
      if (instance) instance.refreshContent();
    }
  });
});

