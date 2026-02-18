
// Action Queue DialogV2 - migrated from legacy logic, using CSS and localization
export class ActionQueueDialog extends foundry.applications.api.DialogV2 {
  static _instance = null; // Singleton instance

  static show() {
    // Jeśli dialog już istnieje, zamknij go i otwórz na nowo
    if (ActionQueueDialog._instance) {
      ActionQueueDialog._instance.close();
    }
    ActionQueueDialog._instance = new ActionQueueDialog();
    ActionQueueDialog._instance.render(true);
  }

  static getInstance() {
    return ActionQueueDialog._instance;
  }

  /**
   * Odświeża tylko zawartość okna bez zamykania/otwierania.
   * Zachowuje pozycję, rozmiar i stan okna.
   */
  refreshContent() {
    const contentEl = this.element?.querySelector('.window-content');
    if (!contentEl) {
      this.render(true);
      return;
    }
    const newHTML = ActionQueueDialog.generateActionQueueContent();
    // Zapisz scroll przed nadpisaniem
    const actionList = contentEl.querySelector('.action-list');
    const scrollTop = actionList ? actionList.scrollTop : 0;
    // Podmień tylko .action-queue-window
    const innerContent = contentEl.querySelector('.action-queue-window');
    if (innerContent) {
      const temp = document.createElement('div');
      temp.innerHTML = newHTML;
      const newNode = temp.firstElementChild;
      if (newNode) innerContent.replaceWith(newNode);
    } else {
      contentEl.innerHTML = newHTML;
    }
    // Zaktualizuj tytuł okna (zawiera liczbę akcji)
    const titleEl = this.element?.querySelector('.window-title');
    if (titleEl) {
      titleEl.textContent = `${game.i18n.localize('from-time-management.action-queue') || 'Action Queue'} (${ActionQueueDialog.getActionQueue().length})`;
    }
    // Przywróć scroll
    const newActionList = contentEl.querySelector('.action-list');
    if (newActionList) newActionList.scrollTop = scrollTop;
  }

  /**
   * Statyczna metoda odświeżająca aktywną instancję.
   */
  static refreshAll() {
    const instance = ActionQueueDialog._instance;
    if (instance) instance.refreshContent();
  }

  constructor() {
    const content = ActionQueueDialog.generateActionQueueContent();
    const buttons = ActionQueueDialog.buildButtons();
    // Ensure at least one button (Close)
    const safeButtons = (buttons && Object.keys(buttons).length > 0) ? buttons : {
      close: {
        icon: '<i class="fas fa-times"></i>',
        label: game.i18n.localize("from-time-management.close") || "Close",
        callback: () => {}
      }
    };
    // Convert buttons object to array for DialogV2
    const buttonsArray = Object.entries(safeButtons).map(([k, v]) => ({ ...v, id: k }));
    super({
      title: `${game.i18n.localize("from-time-management.action-queue") || "Action Queue"} (${ActionQueueDialog.getActionQueue().length})`,
      content,
      buttons: buttonsArray,
      default: "close"
    }, {
      width: 600,
      height: 500,
      resizable: true,
      popOut: true,
      minimizable: true,
      classes: ["action-queue-dialog"]
    });
    this._binded = false;
    this._eventsBound = false;
    this._isActionQueueDialog = true; // Flaga do identyfikacji
  }

  async close(options = {}) {
    if (ActionQueueDialog._instance === this) {
      ActionQueueDialog._instance = null;
    }
    return super.close(options);
  }

  static buildButtons() {
    const buttons = {
      refresh: {
        icon: '<i class="fas fa-sync-alt"></i>',
        label: game.i18n.localize("from-time-management.refresh") || "Refresh",
        callback: (html) => {
          ActionQueueDialog.refresh(html);
        }
      },
      close: {
        icon: '<i class="fas fa-times"></i>',
        label: game.i18n.localize("from-time-management.close") || "Close",
        callback: () => {}
      }
    };
    if (game.user.isGM) {
      buttons.clearCompleted = {
        icon: '<i class="fas fa-check-double"></i>',
        label: game.i18n.localize("from-time-management.clear-completed") || "Clear Completed",
        callback: async (html) => {
          await ActionQueueDialog.clearCompletedActions();
          // Odświeź dialog
          ActionQueueDialog.refreshAll();
          // Wyślij socket do graczy
          game.socket.emit("module.from-time-management", { operation: "forceRefreshActionQueue" });
        }
      };
    }
    return buttons;
  }

  static getActionQueue() {
    return game.settings.get("from-time-management", "actionQueue") || [];
  }

  static generateActionQueueContent() {
    const queue = ActionQueueDialog.getActionQueue();
    let actionsHTML = '';
    if (queue.length === 0) {
      actionsHTML = `
        <div class="no-actions-message">
          <i class="fas fa-clipboard-list" style="font-size: 24px; margin-bottom: 10px; display: block;"></i>
          ${game.i18n.localize("from-time-management.action-queue-empty") || "Action queue is empty"}
        </div>
      `;
    } else {
      // Sort actions: active first, then completed
      const sortedActions = [...queue].sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return a.timestamp - b.timestamp;
      });
      const activeActions = sortedActions.filter(a => !a.completed);
      const completedActions = sortedActions.filter(a => a.completed);
      if (activeActions.length > 0) {
        actionsHTML += activeActions.map(a => ActionQueueDialog.generateActionHTML(a)).join('');
      }
      if (activeActions.length > 0 && completedActions.length > 0) {
        actionsHTML += `
          <div class="action-separator">
            <hr style="margin: 15px 0; border: none; border-top: 2px solid rgba(255,255,255,0.2);">
            <div style="text-align: center; font-size: 12px; color: rgba(255,255,255,0.6); margin: 10px 0;">
              <i class="fas fa-check-double" style="margin-right: 5px;"></i>
              ${game.i18n.localize("from-time-management.completed-actions") || "Completed Actions"}
            </div>
          </div>
        `;
      }
      if (completedActions.length > 0) {
        actionsHTML += completedActions.map(a => ActionQueueDialog.generateActionHTML(a)).join('');
      }
    }
    return `
      <div class="action-queue-window">
        <div class="queue-header">
          <h2>${game.i18n.localize("from-time-management.action-queue") || "Action Queue"}</h2>
          <div style="font-size: 12px; margin-top: 5px; color: inherit; opacity: 0.8;">
            ${game.i18n.localize("from-time-management.total-actions") || "Total actions"}: <strong>${queue.length}</strong>
            <br>
            ${game.i18n.localize("from-time-management.completed-actions") || "Completed"}: <strong>${queue.filter(a => a.completed).length}</strong>
          </div>
        </div>
        <div class="action-list">
          ${actionsHTML}
        </div>
      </div>
    `;
  }

  static getAgentTheme(agentId) {
    if (!agentId) return 0;
    let hash = 0;
    const str = agentId.toString();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash) % 10;
  }

  static generateActionHTML(action) {
    const actionMode = action.actionMode || 'day';
    const agentTheme = ActionQueueDialog.getAgentTheme(action.agentId);
    let timeInfo;
    if (action.startTime && action.endTime) {
      timeInfo = {
        startTime: ActionQueueDialog.formatTimeHour(action.startTime),
        endTime: ActionQueueDialog.formatTimeHour(action.endTime),
        crossesPeriods: action.crossesPeriods || false
      };
    } else {
      timeInfo = { startTime: '--:--', endTime: '--:--', crossesPeriods: false };
    }
    let actionModeLabel = '';
    if (timeInfo.crossesPeriods) {
      actionModeLabel = `☀️🌙 ${game.i18n.localize("from-time-management.day-night-action") || "Day/Night"}`;
    } else {
      actionModeLabel = actionMode === 'day'
        ? `☀️ ${game.i18n.localize("from-time-management.day-action") || "Day"}`
        : `🌙 ${game.i18n.localize("from-time-management.night-action") || "Night"}`;
    }
    const fromLabel = game.i18n.localize("from-time-management.from-time") || "From";
    const toLabel = game.i18n.localize("from-time-management.to-time") || "to";
    const completedLabel = game.i18n.localize("from-time-management.completed") || "completed";
    return `
      <div class="action-item agent-theme-${agentTheme} ${action.completed ? 'completed' : ''}" data-action-id="${action.id}">
        ${game.user.isGM ? `<input type="checkbox" class="action-checkbox" ${action.completed ? 'checked' : ''} />` : ''}
        <div class="action-info">
          <div class="action-name" title="${action.name}"><strong>${action.name}</strong></div>
          <div class="action-details" title="Agent: ${action.agentName} | ${fromLabel}: ${timeInfo.startTime} ${toLabel} ${timeInfo.endTime} | ${actionModeLabel}${action.completed ? ` | ${completedLabel}` : ''}">
            Agent: <strong>${action.agentName}</strong> | ${fromLabel}: ${timeInfo.startTime} ${toLabel} ${timeInfo.endTime} | ${actionModeLabel}${action.completed ? ` | ✅ ${completedLabel}` : ''}
          </div>
        </div>
        <div class="action-cost">${action.cost}h</div>
        ${game.user.isGM ? `<button class="action-delete-btn" data-action-id="${action.id}" title="Delete action">
          <i class="fas fa-trash"></i>
        </button>` : ''}
      </div>
    `;
  }

  static formatTimeHour(time) {
    if (!time) return '--:--';
    const hours = String(time.hour).padStart(2, '0');
    const minutes = String(time.minute).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  static async clearCompletedActions() {
    if (!game.user.isGM) return;
    
    let queue = ActionQueueDialog.getActionQueue();
    const completedActions = queue.filter(a => a.completed);
    
    if (completedActions.length === 0) {
      ui.notifications.info(game.i18n.localize("from-time-management.no-completed-actions") || "No completed actions to clear.");
      return;
    }
    
    // Archiwizuj wszystkie ukończone akcje
    for (const action of completedActions) {
      await ActionQueueDialog.archiveAction(action);
    }
    
    // Usuń ukończone akcje z kolejki
    queue = queue.filter(a => !a.completed);
    await game.settings.set('from-time-management', 'actionQueue', queue);
    
    const message = game.i18n.localize("from-time-management.completed-actions-cleared")
      .replace("{count}", completedActions.length) || `Cleared ${completedActions.length} completed actions.`;
    ui.notifications.info(message);
  }

  static async archiveAction(action) {
    // Dodaj akcję do archiwum agenta
    const archive = foundry.utils.duplicate(game.settings.get("from-time-management", "actionArchive") || {});
    if (!archive[action.agentId]) archive[action.agentId] = [];
    
    // Dodaj flagę completed i timestamp
    const archivedAction = {
      ...action,
      completed: true,
      archivedAt: Date.now(),
      day: action.townDay || 1,
      addedOn: {
        day: action.townDay || 1,
        date: new Date().toLocaleDateString()
      }
    };
    
    archive[action.agentId].push(archivedAction);
    await game.settings.set("from-time-management", "actionArchive", archive);
    ui.notifications.info(`Action "${action.name}" archived for ${action.agentName}`);
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    const root = this.element;

    if (this._eventsBound) return;
    this._eventsBound = true;

    if (!game.user.isGM) return;

    // Event delegation dla checkboxu
    root.addEventListener('change', async (e) => {
      if (!e.target.classList.contains('action-checkbox')) return;
      
      const actionItem = e.target.closest('.action-item');
      const actionId = parseInt(actionItem.dataset.actionId);
      const isCompleted = e.target.checked;
      
      let queue = ActionQueueDialog.getActionQueue();
      const action = queue.find(a => a.id === actionId);
      if (action) {
        action.completed = isCompleted;
        await game.settings.set('from-time-management', 'actionQueue', queue);
        
        // Odśwież dialog lokalnie
        ActionQueueDialog.refreshAll();
        
        // Wyślij socket do graczy
        game.socket.emit("module.from-time-management", { operation: "forceRefreshActionQueue" });
        
        const statusText = isCompleted ?
          (game.i18n.localize("from-time-management.action-completed") || "completed") :
          (game.i18n.localize("from-time-management.action-reactivated") || "reactivated");
        ui.notifications.info(`Action "${action.name}" ${statusText}.`);
      }
    });

    // Event delegation dla przycisku delete
    root.addEventListener('click', async (e) => {
      const deleteBtn = e.target.closest('.action-delete-btn');
      if (!deleteBtn) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      const actionId = parseInt(deleteBtn.dataset.actionId);
      let queue = ActionQueueDialog.getActionQueue();
      const action = queue.find(a => a.id === actionId);
      
      if (action) {
        // Dodaj do archiwum
        await ActionQueueDialog.archiveAction(action);
        
        // Usuń z kolejki
        queue = queue.filter(a => a.id !== actionId);
        await game.settings.set('from-time-management', 'actionQueue', queue);
        
        // Odśwież dialog lokalnie
        ActionQueueDialog.refreshAll();
        
        // Wyślij socket do graczy
        game.socket.emit("module.from-time-management", { operation: "forceRefreshActionQueue" });
      }
    });
  }
}

// --- Synchronizacja ActionQueueDialog przez socket ---
Hooks.on("ready", () => {
  game.socket.on("module.from-time-management", async (data) => {
    // Handle forceRefreshActionQueue
    if (data?.operation === "forceRefreshActionQueue") {
      const instance = ActionQueueDialog.getInstance();
      if (instance) instance.refreshContent();
    }
  });
});
