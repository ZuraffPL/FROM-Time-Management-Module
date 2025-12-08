// ActionSelectionDialog - modern dialog for selecting or creating an action for an agent
export class ActionSelectionDialog extends foundry.applications.api.DialogV2 {
  static show(agentId, agentName, onActionSelected) {
    new ActionSelectionDialog(agentId, agentName, onActionSelected).render(true);
  }

  constructor(agentId, agentName, onActionSelected) {
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
    let templatesHTML = actionTemplates.map(template => `
      <div class="action-template" data-name="${template.name}" data-cost="${template.cost}">
        <div class="action-template-name">${template.name}</div>
        <div class="action-template-cost">${template.cost}h</div>
      </div>
    `).join("");
    const content = `
      <div class="action-selection-dialog">
        <h3>${t("add-action")} ${t("for")}: <strong>${agentName}</strong></h3>
        <h4>${t("choose-action-template")}:</h4>
        <div class="action-templates">
          ${templatesHTML}
        </div>
        <h4>${t("or-create-custom")}:</h4>
        <input type="text" class="custom-action-input" id="custom-action-name" placeholder="${t("action-name-placeholder")}" />
        <input type="number" class="custom-action-input" id="custom-action-cost" placeholder="${t("cost-in-hours-placeholder")}" min="1" max="12" />
      </div>
    `;
    super({
      title: t("select-action"),
      content,
      buttons: [
        {
          action: "add",
          label: t("add-action"),
          icon: '<i class="fas fa-plus"></i>',
          callback: (event, button, dialog) => {
            const contentElement = dialog.element.querySelector('.window-content');
            let actionName, actionCost;
            const selectedTemplate = contentElement.querySelector('.action-template.selected');
            if (selectedTemplate) {
              actionName = selectedTemplate.dataset.name;
              actionCost = parseInt(selectedTemplate.dataset.cost);
            } else {
              actionName = contentElement.querySelector('#custom-action-name')?.value?.trim();
              actionCost = parseInt(contentElement.querySelector('#custom-action-cost')?.value);
            }
            if (actionName && actionCost && actionCost > 0) {
              onActionSelected?.(agentId, agentName, actionName, actionCost);
            } else {
              ui.notifications.warn(t("select-action-or-enter-data"));
              return false; // Zapobiega zamknięciu dialogu
            }
          }
        },
        {
          action: "cancel",
          label: t("cancel"),
          icon: '<i class="fas fa-times"></i>'
        }
      ]
    }, {
      width: 400,
      height: 'auto',
      resizable: false,
      popOut: true
    });
    this.agentId = agentId;
    this.agentName = agentName;
    this.onActionSelected = onActionSelected;
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    const contentElement = this.element.querySelector('.window-content');
    
    // Handle action template selection
    contentElement.querySelectorAll('.action-template').forEach(template => {
      template.addEventListener('click', () => {
        contentElement.querySelectorAll('.action-template').forEach(t => {
          t.classList.remove('selected');
          t.style.background = '';
        });
        template.classList.add('selected');
        template.style.background = 'rgba(76, 175, 80, 0.2)';
        contentElement.querySelector('#custom-action-name').value = '';
        contentElement.querySelector('#custom-action-cost').value = '';
      });
    });
    
    // Handle custom input changes
    const customInputs = contentElement.querySelectorAll('#custom-action-name, #custom-action-cost');
    customInputs.forEach(input => {
      input.addEventListener('input', () => {
        contentElement.querySelectorAll('.action-template').forEach(t => {
          t.classList.remove('selected');
          t.style.background = '';
        });
      });
    });
  }
}
