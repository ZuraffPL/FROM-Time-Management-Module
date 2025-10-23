/**
 * FROM Time Management System for Foundry VTT
 * A comprehensive time management module for Delta Green RPG sessions
 * Features agent activity tracking, day/night cycles, action queues, and real-time multiplayer synchronization
 * Version: 1.0.0
 */

class TimeManagementSystem {
    constructor() {
        this.isOpen = false;
        this.dialog = null;
        this.agentTrackerDialog = null;
        this.agentTrackerOpen = false;
        this.socketInitialized = false; // Track socket initialization
        this.currentTime = {
            hours: 12,
            minutes: 0,
            day: 1,
            month: 1,
            year: new Date().getFullYear()
        };
        this.agentTimeTracking = {}; // Przechowuje czas spędzony przez agentów
        this.lastTimeUpdate = Date.now();
        this.trackingMode = "day"; // "day" lub "night"
        this.agentDayTimeTracking = {}; // Czas dnia dla każdego agenta
        this.agentNightTimeTracking = {}; // Czas nocy dla każdego agenta
        this.actionQueue = []; // Kolejka akcji wszystkich agentów
        this.actionCounter = 0; // Licznik dla unikalnych ID akcji
        this.actionQueueDialog = null;
        this.actionQueueOpen = false;
        this.actionArchive = {}; // Archiwum wszystkich akcji każdego agenta {agentId: [actions...]}
        this.agentArchiveDialogs = {}; // Otwarte okna archiwum dla agentów
    }

    /**
     * Inicjalizacja systemu zarządzania czasem
     */
    static initialize() {
        // Register world settings
        TimeManagementSystem.registerSettings();
        
        // Tworzymy globalną instancję wcześniej
        window.TimeManagement = new TimeManagementSystem();
        
        // Dodajemy kontrolkę do paska narzędzi - kompatybilność z Foundry v13
        Hooks.on("getSceneControlButtons", (controls) => {
            try {
                // W Foundry v13 struktura została zmieniona z tablicy na obiekt rekordów
                if (Array.isArray(controls)) {
                    // Foundry v12 i starsze - controls jest tablicą
                    let tokenControls = controls.find(c => c.name === "tokens") || controls.find(c => c.name === "token");
                    if (tokenControls && Array.isArray(tokenControls.tools)) {
                        addTimeManagementTools(tokenControls.tools);
                    } else {
                        console.warn("FROM TimeManagement: Token controls not found or invalid");
                    }
                } else if (controls && typeof controls === 'object') {
                    // Foundry v13+ - controls jest obiektem z rekordami
                    // W v13 główną kontrolką tokenów jest 'tokens'
                    let targetControl = null;
                    if (controls.tokens) {
                        targetControl = controls.tokens;
                    } else if (controls.token) {
                        targetControl = controls.token;
                    }
                    
                    if (targetControl) {
                        // W Foundry v13 tools może być obiektem zamiast tablicy
                        if (!targetControl.tools) {
                            targetControl.tools = [];
                        } else if (typeof targetControl.tools === 'object' && !Array.isArray(targetControl.tools)) {
                            // Przekaż obiekt bezpośrednio do funkcji
                            addTimeManagementTools(null, targetControl);
                        } else if (Array.isArray(targetControl.tools)) {
                            addTimeManagementTools(targetControl.tools);
                        } else {
                            console.warn("FROM TimeManagement: Target control tools is not an array or object:", typeof targetControl.tools);
                        }
                    } else {
                        console.warn("FROM TimeManagement: No suitable token control found");
                        // Jako fallback, spróbujmy dodać nową kategorię kontrolek
                        controls["from-time-management"] = {
                            name: "from-time-management",
                            title: "FROM Time Management",
                            icon: "fas fa-clock",
                            visible: true,
                            tools: []
                        };
                        addTimeManagementTools(controls["from-time-management"].tools);
                    }
                } else {
                    console.warn("FROM TimeManagement: Unable to determine controls structure");
                }
            } catch (error) {
                console.error("FROM TimeManagement: Error registering scene control buttons:", error);
            }
        });

        // Funkcja pomocnicza do dodawania narzędzi
        function addTimeManagementTools(toolsArray, targetControl = null) {
            // Handle object-based controls (Foundry v13)
            if (toolsArray === null && targetControl && targetControl.tools && typeof targetControl.tools === 'object') {
                const existingToolNames = Object.keys(targetControl.tools);

                // Kontrolka zarządzania czasem - tylko dla GM
                if (game.user.isGM && !existingToolNames.includes("time-management")) {
                    targetControl.tools["time-management"] = {
                        name: "time-management",
                        title: game.i18n.localize("from-time-management.time-management") || "Time Management",
                        icon: "fas fa-clock",
                        onClick: () => {
                            if (window.TimeManagement && typeof window.TimeManagement.openDialog === "function") {
                                window.TimeManagement.openDialog();
                            } else {
                                console.error("FROM TimeManagement: System zarządzania czasem nie jest dostępny");
                                ui.notifications.error("System zarządzania czasem nie jest jeszcze gotowy. Spróbuj ponownie za chwilę.");
                            }
                        },
                        button: true
                    };
                }

                // Kontrolka śledzenia agentów - dla wszystkich użytkowników
                if (!existingToolNames.includes("agent-tracker")) {
                    targetControl.tools["agent-tracker"] = {
                        name: "agent-tracker",
                        title: game.i18n.localize("from-time-management.agent-tracker") || "Agent Activity Tracker",
                        icon: "fas fa-users-cog",
                        visible: true,
                        onClick: () => {
                            if (window.TimeManagement && typeof window.TimeManagement.openAgentTracker === "function") {
                                window.TimeManagement.openAgentTracker();
                            } else {
                                console.error("FROM TimeManagement: System śledzenia agentów nie jest dostępny");
                                ui.notifications.error("System śledzenia agentów nie jest jeszcze gotowy. Spróbuj ponownie za chwilę.");
                            }
                        },
                        button: true
                    };
                }

                // Kontrolka kolejki akcji - dla wszystkich użytkowników
                if (!existingToolNames.includes("action-queue")) {
                    targetControl.tools["action-queue"] = {
                        name: "action-queue",
                        title: game.i18n.localize("from-time-management.action-queue") || "Action Queue",
                        icon: "fas fa-clipboard-list",
                        visible: true,
                        onClick: () => {
                            if (window.TimeManagement && typeof window.TimeManagement.openActionQueue === "function") {
                                window.TimeManagement.openActionQueue();
                            } else {
                                console.error("FROM TimeManagement: System kolejki akcji nie jest dostępny");
                                ui.notifications.error("System kolejki akcji nie jest jeszcze gotowy. Spróbuj ponownie za chwilę.");
                            }
                        },
                        button: true
                    };
                }

                return;
            }

            // Handle array-based controls (Foundry v12 and fallback)
            if (Array.isArray(toolsArray)) {
                // Sprawdź czy narzędzia już istnieją, żeby uniknąć duplikatów
                const existingTools = toolsArray.map(tool => tool.name);

                // Kontrolka zarządzania czasem - tylko dla GM
                if (game.user.isGM && !existingTools.includes("time-management")) {
                    toolsArray.push({
                        name: "time-management",
                        title: game.i18n.localize("from-time-management.time-management") || "Time Management",
                        icon: "fas fa-clock",
                        onClick: () => {
                            if (window.TimeManagement && typeof window.TimeManagement.openDialog === "function") {
                                window.TimeManagement.openDialog();
                            } else {
                                console.error("FROM TimeManagement: System zarządzania czasem nie jest dostępny");
                                ui.notifications.error("System zarządzania czasem nie jest jeszcze gotowy. Spróbuj ponownie za chwilę.");
                            }
                        },
                        button: true
                    });
                }

                // Kontrolka śledzenia agentów - dla wszystkich użytkowników
                if (!existingTools.includes("agent-tracker")) {
                    toolsArray.push({
                        name: "agent-tracker",
                        title: game.i18n.localize("from-time-management.agent-tracker") || "Agent Activity Tracker",
                        icon: "fas fa-users-cog",
                        visible: true,
                        onClick: () => {
                            if (window.TimeManagement && typeof window.TimeManagement.openAgentTracker === "function") {
                                window.TimeManagement.openAgentTracker();
                            } else {
                                console.error("FROM TimeManagement: System śledzenia agentów nie jest dostępny");
                                ui.notifications.error("System śledzenia agentów nie jest jeszcze gotowy. Spróbuj ponownie za chwilę.");
                            }
                        },
                        button: true
                    });
                }

                // Kontrolka kolejki akcji - dla wszystkich użytkowników
                if (!existingTools.includes("action-queue")) {
                    toolsArray.push({
                        name: "action-queue",
                        title: game.i18n.localize("from-time-management.action-queue") || "Action Queue",
                        icon: "fas fa-clipboard-list",
                        visible: true,
                        onClick: () => {
                            if (window.TimeManagement && typeof window.TimeManagement.openActionQueue === "function") {
                                window.TimeManagement.openActionQueue();
                            } else {
                                console.error("FROM TimeManagement: System kolejki akcji nie jest dostępny");
                                ui.notifications.error("System kolejki akcji nie jest jeszcze gotowy. Spróbuj ponownie za chwilę.");
                            }
                        },
                        button: true
                    });
                }

                return;
            }

            // Fallback: if neither object nor array, log warning but don't crash
            console.warn("FROM TimeManagement: toolsArray is not an array or object, type:", typeof toolsArray, "value:", toolsArray);
        }

        // Po pełnej inicjalizacji gry wczytaj zapisany czas
        Hooks.once("ready", async () => {
                console.log("FROM TimeManagement: Ready hook - initializing system");            // Dodatkowa rejestracja dla Foundry v13 - używaj nowego hooka activateSceneControls
            Hooks.on("activateSceneControls", (controls) => {
            });
            
            // Jeśli kontrolki nie zostały dodane przez getSceneControlButtons, 
            // spróbuj dodać je bezpośrednio do UI po inicjalizacji (Foundry v13)
            if (game.canvas && ui.controls) {
                // Spróbuj zarejestrować kontrolki po krótkim opóźnieniu, jeśli nie zostały już dodane
                setTimeout(() => {
                    if (ui.controls && ui.controls.controls) {
                        // Sprawdź czy nasze narzędzia istnieją w głównej kontrolce tokens
                        const tokensControl = ui.controls.controls.tokens;
                        
                        if (tokensControl && tokensControl.tools) {
                            // Sprawdź czy nasze narzędzia już istnieją
                            let hasTimeManagement, hasAgentTracker, hasActionQueue;
                            
                            // W v13 tools to obiekt, w v12 to tablica
                            if (Array.isArray(tokensControl.tools)) {
                                hasTimeManagement = tokensControl.tools.some(tool => tool.name === "time-management");
                                hasAgentTracker = tokensControl.tools.some(tool => tool.name === "agent-tracker");
                                hasActionQueue = tokensControl.tools.some(tool => tool.name === "action-queue");
                            } else if (typeof tokensControl.tools === 'object') {
                                // v13 - tools jest obiektem
                                hasTimeManagement = "time-management" in tokensControl.tools;
                                hasAgentTracker = "agent-tracker" in tokensControl.tools;
                                hasActionQueue = "action-queue" in tokensControl.tools;
                            }
                            
                            // Jeśli brakuje jakichś narzędzi, dodaj je
                            if (!hasAgentTracker || !hasActionQueue || (game.user.isGM && !hasTimeManagement)) {
                                // Spróbuj dodać narzędzia bezpośrednio
                                if (Array.isArray(tokensControl.tools)) {
                                    addTimeManagementTools(tokensControl.tools);
                                } else {
                                    addTimeManagementTools(null, tokensControl);
                                }
                                
                                // Wymusza ponowne renderowanie
                                ui.controls.render(true);
                            }
                        } else {
                            createOwnControlCategory();
                        }
                    } else {
                        createOwnControlCategory();
                    }
                }, 3000);
                
                // Dodatkowy fallback z większym opóźnieniem
                setTimeout(() => {
                    if (ui.controls && ui.controls.controls && ui.controls.controls.tokens) {
                        const tokensControl = ui.controls.controls.tokens;
                        const toolsExist = tokensControl.tools && 
                            (Array.isArray(tokensControl.tools) ? 
                                tokensControl.tools.some(t => t.name === "agent-tracker") :
                                "agent-tracker" in tokensControl.tools);
                        
                        if (!toolsExist) {
                            createOwnControlCategory();
                        }
                    }
                }, 6000);
            }
            
            if (window.TimeManagement && typeof window.TimeManagement.loadTimeFromSettings === "function") {
                await window.TimeManagement.initializeSettings(); // Inicjalizuje wszystkie ustawienia including archiwum
                window.TimeManagement.initializeSocket();
                
                // Dodatkowa rejestracja socket po krótkim opóźnieniu
                setTimeout(() => {
                    if (!window.TimeManagement.socketInitialized) {
                        window.TimeManagement.initializeSocket();
                    }
                }, 2000);
                
                console.log("FROM TimeManagement: Ready hook - initializing system");
            }
        });
    }

    /**
     * Register module settings
     */
    static registerSettings() {
        // Current Game Time setting
        game.settings.register("from-time-management", "currentGameTime", {
            name: "Current Game Time",
            hint: "Stores the current in-game time for the Time Management System.",
            scope: "world",
            config: false, // Hidden from config menu
            type: Object,
            default: {
                hours: 12,
                minutes: 0,
                day: 1,
                month: 1,
                year: new Date().getFullYear()
            }
        });

        // Agent Time Tracking setting
        game.settings.register("from-time-management", "agentTimeTracking", {
            name: "Agent Time Tracking",
            hint: "Stores the time spent by each agent for the Time Management System.",
            scope: "world",
            config: false, // Hidden from config menu
            type: Object,
            default: {}
        });

        // Agent Day Time Tracking setting
        game.settings.register("from-time-management", "agentDayTimeTracking", {
            name: "Agent Day Time Tracking",
            hint: "Stores the daytime spent by each agent for the Time Management System.",
            scope: "world",
            config: false, // Hidden from config menu
            type: Object,
            default: {}
        });

        // Agent Night Time Tracking setting
        game.settings.register("from-time-management", "agentNightTimeTracking", {
            name: "Agent Night Time Tracking",
            hint: "Stores the nighttime spent by each agent for the Time Management System.",
            scope: "world",
            config: false, // Hidden from config menu
            type: Object,
            default: {}
        });

        // Tracking Mode setting
        game.settings.register("from-time-management", "trackingMode", {
            name: "Time Tracking Mode",
            hint: "Current time tracking mode (day or night) for the Time Management System.",
            scope: "world",
            config: false, // Hidden from config menu
            type: String,
            default: "day"
        });

        // Action Queue setting
        game.settings.register("from-time-management", "actionQueue", {
            name: "Action Queue",
            hint: "Stores the queue of actions for agents in the Time Management System.",
            scope: "world",
            config: false, // Hidden from config menu
            type: Object,
            default: []
        });

        // Action Archive setting
        game.settings.register("from-time-management", "actionArchive", {
            name: "Action Archive",
            hint: "Stores the complete archive of all actions for all agents.",
            scope: "world",
            config: false, // Hidden from config menu
            type: Object,
            default: {}
        });
    }

    /**
     * Otwiera dialog zarządzania czasem
     */
    openDialog() {
        if (this.isOpen && this.dialog) {
            this.dialog.bringToTop();
            return;
        }

        if (!game.user.isGM) {
            ui.notifications.warn(game.i18n.localize("from-time-management.only-gm-manage") || "Only GM can manage time!");
            return;
        }

        this.createTimeManagementDialog();
    }

    /**
     * Alias for openDialog - opens the main time management dialog
     */
    open() {
        return this.openDialog();
    }

    /**
     * Tworzy dialog zarządzania czasem
     */
    createTimeManagementDialog() {
        const content = this.generateDialogContent();

        this.dialog = new Dialog({
            title: game.i18n.localize("from-time-management.title") || "FROM Time Management System",
            content: content,
            buttons: {
                close: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Close",
                    callback: () => {
                        this.isOpen = false;
                        this.dialog = null;
                    }
                }
            },
            default: "close",
            render: (html) => {
                this.attachEventListeners(html);
                // Automatyczne dopasowanie rozmiaru okna
                this.autoResizeDialog();
            },
            close: () => {
                this.isOpen = false;
                this.dialog = null;
            }
        }, {
            width: "auto",
            height: "auto",
            resizable: true,
            popOut: true, // Allow dialog to be popped out
            minimizable: true, // Allow minimizing
            classes: ["time-management-dialog"]
        });

        this.dialog.render(true);
        this.isOpen = true;
    }

    /**
     * Generuje HTML dla dialogu
     */
    generateDialogContent() {
        return `
            <div class="time-management-system">
                <div class="current-time">
                    <div>${game.i18n.localize("from-time-management.current-time") || "Current Time"}:</div>
                    <div id="current-time-display">
                        ${this.formatCurrentTime()}
                    </div>
                </div>

                <div class="time-section">
                    <h3>${game.i18n.localize("from-time-management.time-settings") || "Time Settings"}</h3>
                    <div class="time-controls">
                        <label>${game.i18n.localize("from-time-management.hour") || "Hour"}:</label>
                        <input type="number" class="time-input" id="hours-input" min="0" max="23" value="${this.currentTime.hours}">
                        <label>${game.i18n.localize("from-time-management.minute") || "Minutes"}:</label>
                        <input type="number" class="time-input" id="minutes-input" min="0" max="59" value="${this.currentTime.minutes}">
                    </div>
                    <div class="time-controls">
                        <label>${game.i18n.localize("from-time-management.day-in-town") || "Day in Town"}:</label>
                        <input type="number" class="time-input" id="day-input" min="1" max="365" value="${this.currentTime.day}">
                        <label>${game.i18n.localize("from-time-management.year") || "Year"}:</label>
                        <input type="number" class="time-input" id="year-input" min="1900" max="2100" value="${this.currentTime.year}">
                    </div>
                    <button class="time-button" id="set-time-btn" style="width: 100%; margin-top: 10px;">
                        ${game.i18n.localize("from-time-management.set-time") || "Set Time"}
                    </button>
                    <button class="time-button" id="new-day-btn" style="width: 100%; margin-top: 10px; background: linear-gradient(135deg, #FF9800, #F57C00); border-color: #F57C00;">
                        <i class="fas fa-sunrise" style="margin-right: 5px;"></i>
                        ${game.i18n.localize("from-time-management.new-day") || "New Day in Town"}
                    </button>
                </div>

                <div class="broadcast-section">
                    <h3>${game.i18n.localize("from-time-management.communication") || "Player Communication"}</h3>
                    <button class="time-button" id="broadcast-time-btn" style="width: 100%; margin: 5px 0;">
                        ${game.i18n.localize("from-time-management.broadcast-time") || "Broadcast Time to Players"}
                    </button>
                    <button class="time-button" id="whisper-time-btn" style="width: 100%; margin: 5px 0;">
                        ${game.i18n.localize("from-time-management.whisper-time") || "Whisper Time (Private)"}
                    </button>
                </div>

                <div class="broadcast-section" style="border-color: #2d5a3d; background: linear-gradient(135deg, rgba(45, 90, 61, 0.1), rgba(26, 71, 42, 0.1));">
                    <h3 style="color: #2d5a3d !important; border-bottom-color: #2d5a3d !important;">${game.i18n.localize("from-time-management.agent-tracking") || "Agent Tracking"}</h3>
                    <button class="time-button" id="open-agent-tracker-btn" style="width: 100%; margin: 5px 0; background: linear-gradient(135deg, #2d5a3d, #1a472a); border-color: #2d5a3d;">
                        <i class="fas fa-users-cog" style="margin-right: 5px;"></i>
                        ${game.i18n.localize("from-time-management.open-agent-tracker") || "Open Agent Tracker"}
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Dodaje event listenery do elementów dialogu
     */
    attachEventListeners(html) {
        // Przycisk ustawienia czasu
        html.find("#set-time-btn").click(() => {
            this.setTimeFromInputs(html);
        });

        // Event listenery na zmiany w polach czasu - natychmiastowa synchronizacja
        html.find("#hours-input, #minutes-input, #day-input, #year-input").on('input change', () => {
            // Opóźnij wykonanie o 500ms aby uniknąć zbyt częstych aktualizacji podczas wpisywania
            clearTimeout(this.inputChangeTimeout);
            this.inputChangeTimeout = setTimeout(() => {
                this.setTimeFromInputs(html);
            }, 500);
        });

        // Natychmiastowa reakcja na Enter w polach input
        html.find("#hours-input, #minutes-input, #day-input, #year-input").keypress((e) => {
            if (e.which === 13) { // Enter key
                clearTimeout(this.inputChangeTimeout);
                this.setTimeFromInputs(html);
            }
        });

        // Przycisk nowego dnia
        html.find("#new-day-btn").click(() => {
            this.startNewDay();
        });

        // Komunikacja
        html.find("#broadcast-time-btn").click(() => this.broadcastTime());
        html.find("#whisper-time-btn").click(() => this.whisperTime());
        
        // Agent Tracker
        html.find("#open-agent-tracker-btn").click(() => this.openAgentTracker());
    }

    /**
     * Ustawia czas na podstawie inputów
     */
    setTimeFromInputs(html) {
        this.currentTime.hours = parseInt(html.find("#hours-input").val()) || 0;
        this.currentTime.minutes = parseInt(html.find("#minutes-input").val()) || 0;
        this.currentTime.day = parseInt(html.find("#day-input").val()) || 1;
        this.currentTime.year = parseInt(html.find("#year-input").val()) || 2024;

        // Ustaw miesiąc na stałą wartość (nie używamy go)
        this.currentTime.month = 1;

        // Automatycznie ustaw tracking mode na podstawie godziny
        this.updateTrackingModeBasedOnTime();

        this.updateTimeDisplay(html);
        this.saveTimeToSettings();
        this.emitAgentTrackingUpdate();
        ui.notifications.info(game.i18n.localize("from-time-management.time-set") || "Time has been set!");
    }

    /**
     * Automatycznie aktualizuje tracking mode na podstawie aktualnej godziny
     */
    updateTrackingModeBasedOnTime() {
        const currentHour = this.currentTime.hours;
        const isDayTime = currentHour >= 6 && currentHour < 18;
        const newMode = isDayTime ? 'day' : 'night';
        
        if (this.trackingMode !== newMode) {
            this.trackingMode = newMode;
            console.log(`FROM TimeManagement: Tracking mode automatically changed to ${newMode} based on hour ${currentHour}`);
            
            // Save updated tracking mode to settings
            this.saveTrackingModeToSettings();
        }
    }

    /**
     * Dodaje czas
     */
    addTime(hours, minutes) {
        this.currentTime.minutes += minutes;
        this.currentTime.hours += hours;

        // Obsługa przepełnienia minut
        if (this.currentTime.minutes >= 60) {
            this.currentTime.hours += Math.floor(this.currentTime.minutes / 60);
            this.currentTime.minutes = this.currentTime.minutes % 60;
        }

        // Obsługa przepełnienia godzin
        if (this.currentTime.hours >= 24) {
            this.currentTime.day += Math.floor(this.currentTime.hours / 24);
            this.currentTime.hours = this.currentTime.hours % 24;
        }

        // Nie ma ograniczenia na dni w miasteczku - mogą być dowolnie duże

        // Automatycznie ustaw tracking mode na podstawie nowej godziny
        this.updateTrackingModeBasedOnTime();

        this.updateDialogIfOpen();
        this.saveTimeToSettings();
        
        // Aktualizuj czas spędzony przez agentów
        const totalHoursAdded = hours + (minutes / 60);
        this.updateAgentTimeTracking(totalHoursAdded);
        
        // Synchronizuj z innymi klientami
        this.emitAgentTrackingUpdate();
        
        ui.notifications.info(`Added ${hours}h ${minutes}min`);
    }

    /**
     * Rozpoczyna nowy dzień w miasteczku
     */
    startNewDay() {
        Dialog.confirm({
            title: game.i18n.localize("from-time-management.new-day-confirm") || "Start a new day in town?",
            content: `
                <div style="padding: 15px;">
                    <h3>🌅 ${game.i18n.localize("from-time-management.new-day-confirm") || "Start a new day in town?"}</h3>
                    <p style="margin-top: 15px; font-size: 14px;">
                        This action will:
                    </p>
                    <ul style="margin: 10px 0; padding-left: 20px; font-size: 13px;">
                        <li>Increase the day counter by 1</li>
                        <li>Set time to 6:00 AM (start of day)</li>
                        <li>Reset all agent progress bars (day and night)</li>
                        <li>Send a message to chat</li>
                    </ul>
                    <p style="margin-top: 15px; font-size: 12px; color: #999;">
                        <strong>Note:</strong> ${game.i18n.localize("from-time-management.irreversible-action") || "This action is irreversible."}
                    </p>
                </div>
            `,
            yes: () => {
                // Zwiększ dzień
                this.currentTime.day += 1;
                
                // Ustaw godzinę na 6:00 (początek dnia)
                this.currentTime.hours = 6;
                this.currentTime.minutes = 0;
                
                // Resetuj paski postępu wszystkich agentów
                this.resetAllAgentsProgress();
                
                // Automatycznie ustaw tracking mode na podstawie nowej godziny (będzie dzień)
                this.updateTrackingModeBasedOnTime();
                
                // Zapisz zmiany
                this.saveTimeToSettings();
                this.saveAgentTrackingToSettings();
                
                // Wyślij komunikat na czat
                this.broadcastNewDay();
                
                // Aktualizuj interfejs
                this.updateDialogIfOpen();
                this.emitAgentTrackingUpdate();
                this.refreshAgentTracker();
                
                ui.notifications.info(`${game.i18n.localize("from-time-management.new-day-started") || "A new day has dawned in the town!"} (Day ${this.currentTime.day})`);
            },
            no: () => {},
            defaultYes: false
        }, {
            width: 450
        });
    }

    /**
     * Resetuje paski postępu wszystkich agentów
     */
    resetAllAgentsProgress() {
        // Wyczyść wszystkie dane śledzenia
        this.agentTimeTracking = {};
        this.agentDayTimeTracking = {};
        this.agentNightTimeTracking = {};
    }

    /**
     * Wysyła komunikat o nowym dniu na czat
     */
    broadcastNewDay() {
        const message = `
            <div style="
                background: linear-gradient(135deg, #FFE082, #FFF8E1); 
                border: 2px solid #FF9800; 
                border-radius: 10px; 
                padding: 15px; 
                text-align: center;
                box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
            ">
                <div style="font-size: 24px; margin-bottom: 8px;">🌅</div>
                <div style="font-size: 18px; font-weight: bold; color: #E65100; margin-bottom: 5px;">
                    ${game.i18n.localize("from-time-management.new-day-started") || "A new day has dawned in the town!"}
                </div>
                <div style="font-size: 14px; color: #BF360C;">
                    Day ${this.currentTime.day} • ${game.i18n.localize("from-time-management.another-day-cursed") || "Another in this cursed place"}
                </div>
            </div>
        `;

        ChatMessage.create({
            content: message,
            style: CONST.CHAT_MESSAGE_STYLES.OTHER
        });

        console.log(`FROM TimeManagement: New day in town started (Day ${this.currentTime.day})`);
    }

    /**
     * Formatuje aktualny czas do wyświetlenia
     */
    formatCurrentTime() {
        const hours = this.currentTime.hours.toString().padStart(2, '0');
        const minutes = this.currentTime.minutes.toString().padStart(2, '0');
        
        return `${hours}:${minutes}, Day ${this.currentTime.day} in town (${this.currentTime.year})`;
    }

    /**
     * Aktualizuje wyświetlanie czasu w dialogu
     */
    updateTimeDisplay(html) {
        if (html) {
            const timeDisplay = html.find("#current-time-display");
            const currentTimeDiv = html.find(".current-time");
            
            timeDisplay.text(this.formatCurrentTime());
            
            // Dodaj animację aktualizacji
            currentTimeDiv.addClass("updated");
            setTimeout(() => {
                currentTimeDiv.removeClass("updated");
            }, 500);
            
            // Aktualizuj również inputy
            html.find("#hours-input").val(this.currentTime.hours);
            html.find("#minutes-input").val(this.currentTime.minutes);
            html.find("#day-input").val(this.currentTime.day);
            html.find("#year-input").val(this.currentTime.year);
        }
    }

    /**
     * Aktualizuje dialog jeśli jest otwarty
     */
    updateDialogIfOpen() {
        if (this.isOpen && this.dialog) {
            const html = $(this.dialog.element);
            this.updateTimeDisplay(html);
            // Automatycznie dopasuj rozmiar po aktualizacji
            setTimeout(() => this.autoResizeDialog(), 100);
        }
    }

    /**
     * Przekazuje czas wszystkim graczom
     */
    broadcastTime() {
        const hours = String(this.currentTime.hours).padStart(2, '0');
        const minutes = String(this.currentTime.minutes).padStart(2, '0');
        const timeString = `${hours}:${minutes}`;
        const day = this.currentTime.day || 1;
        const year = this.currentTime.year || 2024;
        
        const currentTimeLabel = game.i18n.localize("from-time-management.current-game-time") || "Current game time";
        const dayLabel = game.i18n.localize("from-time-management.day-label") || "Day";
        const townLabel = game.i18n.localize("from-time-management.in-town") || "in town";
        const yearLabel = game.i18n.localize("from-time-management.year-label") || "year";
        
        const message = `<div style="background-color: #e8f5e8; padding: 10px; border-radius: 5px; text-align: center;">
            <strong>🕐 ${currentTimeLabel}:</strong><br>
            <span style="font-size: 18px; font-weight: bold;">${timeString}</span><br>
            <span style="font-size: 14px;">${dayLabel} ${day} ${townLabel} (${yearLabel} ${year})</span>
        </div>`;

        ChatMessage.create({
            content: message,
            style: CONST.CHAT_MESSAGE_STYLES.OTHER
        });

        ui.notifications.info(game.i18n.localize("from-time-management.time-broadcasted") || "Time broadcasted to players!");
    }

    /**
     * Szepce czas tylko do GM
     */
    whisperTime() {
        const hours = String(this.currentTime.hours).padStart(2, '0');
        const minutes = String(this.currentTime.minutes).padStart(2, '0');
        const timeString = `${hours}:${minutes}`;
        const day = this.currentTime.day || 1;
        const year = this.currentTime.year || 2024;
        
        const currentTimeLabel = game.i18n.localize("from-time-management.current-game-time") || "Current game time";
        const dayLabel = game.i18n.localize("from-time-management.day-label") || "Day";
        const townLabel = game.i18n.localize("from-time-management.in-town") || "in town";
        const yearLabel = game.i18n.localize("from-time-management.year-label") || "year";
        const privateLabel = game.i18n.localize("from-time-management.private-label") || "private";
        
        const message = `<div style="background-color: #fff5f5; padding: 10px; border-radius: 5px; text-align: center;">
            <strong>🕐 ${currentTimeLabel} (${privateLabel}):</strong><br>
            <span style="font-size: 18px; font-weight: bold;">${timeString}</span><br>
            <span style="font-size: 14px;">${dayLabel} ${day} ${townLabel} (${yearLabel} ${year})</span>
        </div>`;

        ChatMessage.create({
            content: message,
            style: CONST.CHAT_MESSAGE_STYLES.WHISPER,
            whisper: [game.user.id]
        });

        ui.notifications.info(game.i18n.localize("from-time-management.time-whispered") || "Time saved privately!");
    }

    /**
     * Automatycznie dopasowuje rozmiar dialogu do zawartości
     */
    autoResizeDialog() {
        if (this.dialog && this.dialog.element) {
            const dialogElement = this.dialog.element[0];
            const content = dialogElement.querySelector('.window-content');
            const header = dialogElement.querySelector('.window-header');
            
            if (content && header) {
                // Resetuj wysokość żeby zmierzyć naturalny rozmiar
                dialogElement.style.height = 'auto';
                content.style.height = 'auto';
                
                // Poczekaj na następny frame żeby DOM się zaktualizował
                requestAnimationFrame(() => {
                    const contentHeight = content.scrollHeight;
                    const headerHeight = header.offsetHeight;
                    const totalHeight = contentHeight + headerHeight + 20; // 20px margines
                    
                    // Ustaw minimalną i maksymalną wysokość
                    const minHeight = 300;
                    const maxHeight = window.innerHeight * 0.8;
                    const finalHeight = Math.max(minHeight, Math.min(totalHeight, maxHeight));
                    
                    // Zastosuj nową wysokość
                    dialogElement.style.height = finalHeight + 'px';
                    
                    // Wycentruj okno
                    const rect = dialogElement.getBoundingClientRect();
                    const newTop = Math.max(50, (window.innerHeight - finalHeight) / 2);
                    const newLeft = Math.max(50, (window.innerWidth - rect.width) / 2);
                    
                    dialogElement.style.top = newTop + 'px';
                    dialogElement.style.left = newLeft + 'px';
                });
            }
        }
    }

    // [Additional methods would continue here - this is a truncated version for brevity]
    // The full implementation includes all agent tracking, action queue, and socket functionality

    /**
     * Otwiera okno śledzenia agentów
     */
    openAgentTracker() {
        // Ensure socket is initialized for players
        if (!game.user.isGM && !this.socketInitialized) {
            console.log("FROM TimeManagement: [SOCKET] Player socket not initialized, initializing now...");
            this.initializeSocket();
        }
        
        if (this.agentTrackerOpen && this.agentTrackerDialog) {
            this.agentTrackerDialog.bringToTop();
            return;
        }

        // Jeśli to gracz (nie GM), żądaj aktualnych danych przed otwarciem
        if (!game.user.isGM) {
            this.requestCurrentDataFromGM();
        }

        this.createAgentTrackerDialog();
    }

    /**
     * [Additional methods for agent tracking, action queues, etc. would continue here]
     * This is a simplified version showing the structure
     */

    // Settings methods
    saveTimeToSettings() {
        if (game.user.isGM) {
            game.settings.set("from-time-management", "currentGameTime", {
                hours: this.currentTime.hours,
                minutes: this.currentTime.minutes,
                day: this.currentTime.day,
                month: this.currentTime.month,
                year: this.currentTime.year
            });
        }
    }

    loadTimeFromSettings() {
        try {
            if (game.settings && game.ready) {
                const savedTime = game.settings.get("from-time-management", "currentGameTime");
                if (savedTime && typeof savedTime === 'object') {
                    this.currentTime = {
                        hours: savedTime.hours || 12,
                        minutes: savedTime.minutes || 0,
                        day: savedTime.day || 1,
                        month: savedTime.month || 1,
                        year: savedTime.year || new Date().getFullYear()
                    };
                    console.log("FROM TimeManagement: Loaded saved time:", this.currentTime);
                }
                
                // Load other tracking data...
                const savedAgentTracking = game.settings.get("from-time-management", "agentTimeTracking");
                if (savedAgentTracking && typeof savedAgentTracking === 'object') {
                    this.agentTimeTracking = savedAgentTracking;
                }
                
                const savedDayTracking = game.settings.get("from-time-management", "agentDayTimeTracking");
                if (savedDayTracking && typeof savedDayTracking === 'object') {
                    this.agentDayTimeTracking = savedDayTracking;
                }
                
                const savedNightTracking = game.settings.get("from-time-management", "agentNightTimeTracking");
                if (savedNightTracking && typeof savedNightTracking === 'object') {
                    this.agentNightTimeTracking = savedNightTracking;
                }
                
                const savedActionQueue = game.settings.get("from-time-management", "actionQueue");
                if (savedActionQueue && Array.isArray(savedActionQueue)) {
                    this.actionQueue = savedActionQueue;
                    console.log("FROM TimeManagement: Loaded action queue:", this.actionQueue.length);
                }
            }
        } catch (error) {
            console.log("FROM TimeManagement: Could not load saved data, using defaults", error);
        }
    }

    /**
     * Tworzy dialog śledzenia agentów
     */
    createAgentTrackerDialog() {
        const content = this.generateAgentTrackerContent();

        // Different buttons for GM and players
        const buttons = {
            refresh: {
                icon: '<i class="fas fa-sync-alt"></i>',
                label: game.i18n.localize("from-time-management.refresh") || "Refresh",
                callback: () => {
                    this.refreshAgentTracker();
                }
            },
            close: {
                icon: '<i class="fas fa-times"></i>',
                label: game.i18n.localize("from-time-management.close") || "Close",
                callback: () => {
                    this.agentTrackerOpen = false;
                    this.agentTrackerDialog = null;
                }
            }
        };

        // Add reset button only for GM
        if (game.user.isGM) {
            buttons.reset = {
                icon: '<i class="fas fa-undo"></i>',
                label: game.i18n.localize("from-time-management.reset-all") || "Reset All",
                callback: () => {
                    Dialog.confirm({
                        title: game.i18n.localize("from-time-management.reset-agent-time") || "Reset Agent Time",
                        content: `<p>${game.i18n.localize("from-time-management.reset-confirm") || "Are you sure you want to reset time spent by all agents?"}</p>`,
                        yes: () => {
                            this.resetAgentTimeTracking();
                            ui.notifications.info("Agent time tracking has been reset.");
                        }
                    });
                }
            };
        }

        this.agentTrackerDialog = new Dialog({
            title: game.i18n.localize("from-time-management.agent-tracker") || "Agent Activity Tracker",
            content: content,
            buttons: buttons,
            default: "close",
            render: (html) => {
                this.attachAgentTrackerListeners(html);
            },
            close: () => {
                this.agentTrackerOpen = false;
                this.agentTrackerDialog = null;
            }
        }, {
            width: 600,
            height: 500,
            resizable: true,
            popOut: true, // Allow dialog to be popped out
            minimizable: true, // Allow minimizing
            classes: ["agent-tracker-dialog"]
        });

        this.agentTrackerDialog.render(true);
        this.agentTrackerOpen = true;
        
        // Try to manually add popout button if PopOut module is active
        if (game.modules.get('popout')?.active && !this.agentTrackerDialog.element?.find('.popout').length) {
            console.log("FROM TimeManagement: Attempting to manually add popout button");
            this.addPopoutButton(this.agentTrackerDialog);
        }
    }

    /**
     * Generates HTML for agent tracker window
     */
    generateAgentTrackerContent() {
        const activeAgents = this.getActiveAgents();
        const currentHour = this.currentTime.hours;
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
            agentsHTML = activeAgents.map(agent => this.generateAgentHTML(agent)).join('');
        }

        return `
            <div class="agent-tracker-window ${this.trackingMode === 'night' ? 'night-mode' : ''}">
                <div class="agent-tracker-header">
                    <h2>${game.i18n.localize("from-time-management.agent-activity") || "Agent Activity"}</h2>
                    <div style="font-size: 12px; margin-top: 5px; color: inherit; opacity: 0.8;">
                        ${game.i18n.localize("from-time-management.current-time") || "Current time"}: <strong>${this.formatCurrentTime()}</strong>
                        <br>
                        <span style="font-size: 11px;">
                            ${isCurrentlyDay ? `☀️ ${game.i18n.localize("from-time-management.day-period") || "Day (6:00-18:00)"}` : `🌙 ${game.i18n.localize("from-time-management.night-period") || "Night (18:00-6:00)"}`}
                        </span>
                    </div>
                </div>

                <div class="tracking-mode-toggle">
                    <button class="mode-button ${this.trackingMode === 'day' ? 'active day-mode' : ''}" id="day-mode-btn">
                        <i class="fas fa-sun"></i>
                        ${game.i18n.localize("from-time-management.day-time") || "Day Time"}
                    </button>
                    <button class="mode-button ${this.trackingMode === 'night' ? 'active night-mode' : ''}" id="night-mode-btn">
                        <i class="fas fa-moon"></i>
                        ${game.i18n.localize("from-time-management.night-time") || "Night Time"}
                    </button>
                </div>

                <div style="text-align: center; margin-bottom: 15px;">
                    <button class="time-button" id="open-action-queue-btn" style="background: linear-gradient(135deg, #4CAF50, #2E7D32); border-color: #2E7D32;">
                        <i class="fas fa-list-ul" style="margin-right: 5px;"></i>
                        ${game.i18n.localize("from-time-management.action-queue") || "Action Queue"} (${this.actionQueue.length})
                    </button>
                </div>
                
                <div class="agent-list">
                    ${agentsHTML}
                </div>
            </div>
        `;
    }

    /**
     * Attaches event listeners for agent tracker window
     */
    attachAgentTrackerListeners(html) {
        // Day/night mode switches
        html.find("#day-mode-btn").click(() => {
            this.trackingMode = "day";
            this.refreshAgentTracker();
            this.saveTrackingModeToSettings();
            this.emitAgentTrackingUpdate();
        });
        
        html.find("#night-mode-btn").click(() => {
            this.trackingMode = "night";
            this.refreshAgentTracker();
            this.saveTrackingModeToSettings();
            this.emitAgentTrackingUpdate();
        });

        // Action queue button
        html.find("#open-action-queue-btn").click(() => {
            this.openActionQueue();
        });

        // Add action buttons for each agent
        html.find(".add-action-btn").click((event) => {
            const agentId = $(event.currentTarget).data("agent-id");
            const agentName = $(event.currentTarget).data("agent-name");
            
            if (!this.canPlayerManageAgent(agentId)) {
                ui.notifications.warn(game.i18n.localize("from-time-management.only-own-characters") || "You can only add actions to your own characters!");
                return;
            }
            
            this.showActionSelectionDialog(agentId, agentName);
        });

        // Action Archive buttons
        html.find(".action-archive-btn").click((event) => {
            const agentId = $(event.currentTarget).data("agent-id");
            const agentName = $(event.currentTarget).data("agent-name");
            
            if (!this.canPlayerManageAgent(agentId)) {
                ui.notifications.warn(game.i18n.localize("from-time-management.only-own-characters") || "You can only view your own character's archive!");
                return;
            }
            
            this.openAgentArchive(agentId, agentName);
        });

        // Reset day buttons for each agent (GM only)
        html.find(".reset-day-btn").click((event) => {
            const agentId = $(event.currentTarget).data("agent-id");
            const agentName = $(event.currentTarget).data("agent-name");
            this.showResetDayDialog(agentId, agentName);
        });

        // Time adjustment buttons (GM only)
        html.find(".time-adjust-btn").click((event) => {
            if (!game.user.isGM) return;
            
            const agentId = $(event.currentTarget).data("agent-id");
            const adjustment = parseFloat($(event.currentTarget).data("adjustment"));
            
            this.adjustAgentTime(agentId, adjustment);
        });
    }

    /**
     * Refreshes agent tracker content
     */
    refreshAgentTracker() {
        if (this.agentTrackerOpen && this.agentTrackerDialog) {
            const newContent = this.generateAgentTrackerContent();
            this.agentTrackerDialog.data.content = newContent;
            this.agentTrackerDialog.render();
        } else {
        }
    }

    /**
     * Refreshes action queue
     */
    refreshActionQueue() {
        if (this.actionQueueOpen && this.actionQueueDialog) {
            const newContent = this.generateActionQueueContent();
            this.actionQueueDialog.data.content = newContent;
            this.actionQueueDialog.data.title = `${game.i18n.localize("from-time-management.action-queue") || "Action Queue"} (${this.actionQueue.length})`;
            this.actionQueueDialog.render();
        }
    }

    /**
     * Forces refresh of all open windows
     */
    forceRefreshAllWindows() {
        // Refresh Agent Tracker
        if (this.agentTrackerOpen && this.agentTrackerDialog) {
            try {
                const newContent = this.generateAgentTrackerContent();
                this.agentTrackerDialog.data.content = newContent;
                this.agentTrackerDialog.render(true);
            } catch (error) {
                console.error("FROM TimeManagement: Error during force refresh Agent Tracker:", error);
            }
        }
        
        // Refresh Action Queue
        if (this.actionQueueOpen && this.actionQueueDialog) {
            try {
                const newContent = this.generateActionQueueContent();
                this.actionQueueDialog.data.content = newContent;
                this.actionQueueDialog.data.title = `${game.i18n.localize("from-time-management.action-queue") || "Action Queue"} (${this.actionQueue.length})`;
                this.actionQueueDialog.render(true);
            } catch (error) {
                console.error("FROM TimeManagement: Error during force refresh Action Queue:", error);
            }
        }
        
        // Refresh Main Dialog
        if (this.isOpen && this.dialog) {
            try {
                this.dialog.render(true);
            } catch (error) {
                console.error("FROM TimeManagement: Error during force refresh Main Dialog:", error);
            }
        }
    }

    /**
     * Opens action queue window
     */
    openActionQueue() {
        if (this.actionQueueOpen && this.actionQueueDialog) {
            this.actionQueueDialog.bringToTop();
            return;
        }

        if (!game.user.isGM) {
            this.requestCurrentDataFromGM();
        }

        this.createActionQueueDialog();
    }

    /**
     * Creates action queue dialog
     */
    createActionQueueDialog() {
        const content = this.generateActionQueueContent();

        const buttons = {
            refresh: {
                icon: '<i class="fas fa-sync-alt"></i>',
                label: game.i18n.localize("from-time-management.refresh") || "Refresh",
                callback: () => {
                    this.refreshActionQueue();
                }
            },
            close: {
                icon: '<i class="fas fa-times"></i>',
                label: game.i18n.localize("from-time-management.close") || "Close",
                callback: () => {
                    this.actionQueueOpen = false;
                    this.actionQueueDialog = null;
                }
            }
        };

        if (game.user.isGM) {
            buttons.clearCompleted = {
                icon: '<i class="fas fa-check-double"></i>',
                label: game.i18n.localize("from-time-management.clear-completed") || "Clear Completed",
                callback: () => {
                    this.removeCompletedActions();
                }
            };
            
            buttons.clearAll = {
                icon: '<i class="fas fa-trash"></i>',
                label: game.i18n.localize("from-time-management.clear-all") || "Clear All",
                callback: () => {
                    Dialog.confirm({
                        title: game.i18n.localize("from-time-management.clear-action-queue") || "Clear Action Queue",
                        content: `<p>${game.i18n.localize("from-time-management.clear-all-confirm") || "Are you sure you want to remove all actions from the queue?"}</p>`,
                        yes: () => {
                            this.clearActionQueue();
                        }
                    });
                }
            };
        }

        this.actionQueueDialog = new Dialog({
            title: `${game.i18n.localize("from-time-management.action-queue") || "Action Queue"} (${this.actionQueue.length})`,
            content: content,
            buttons: buttons,
            default: "close",
            render: (html) => {
                this.attachActionQueueListeners(html);
            },
            close: () => {
                this.actionQueueOpen = false;
                this.actionQueueDialog = null;
            }
        }, {
            width: 600,
            height: 500,
            resizable: true,
            popOut: true, // Allow dialog to be popped out
            minimizable: true, // Allow minimizing
            classes: ["action-queue-dialog"]
        });

        this.actionQueueDialog.render(true);
        this.actionQueueOpen = true;
    }

    /**
     * Generates action queue content
     */
    generateActionQueueContent() {
        let actionsHTML = '';
        
        if (this.actionQueue.length === 0) {
            actionsHTML = `
                <div class="no-actions-message">
                    <i class="fas fa-clipboard-list" style="font-size: 24px; margin-bottom: 10px; display: block;"></i>
                    ${game.i18n.localize("from-time-management.action-queue-empty") || "Action queue is empty"}
                </div>
            `;
        } else {
            // Sort actions: active first (by timestamp), then completed at bottom (by timestamp)
            const sortedActions = [...this.actionQueue].sort((a, b) => {
                // If completion status is different, sort by completed status (completed goes to bottom)
                if (a.completed !== b.completed) {
                    return a.completed ? 1 : -1;
                }
                // If same completion status, sort by timestamp (oldest first)
                return a.timestamp - b.timestamp;
            });

            // Separate active and completed actions for visual grouping
            const activeActions = sortedActions.filter(action => !action.completed);
            const completedActions = sortedActions.filter(action => action.completed);

            // Generate HTML for active actions
            if (activeActions.length > 0) {
                actionsHTML += activeActions.map(action => this.generateActionHTML(action)).join('');
            }

            // Add separator if both active and completed actions exist
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

            // Generate HTML for completed actions
            if (completedActions.length > 0) {
                actionsHTML += completedActions.map(action => this.generateActionHTML(action)).join('');
            }
        }

        return `
            <div class="action-queue-window">
                <div class="queue-header">
                    <h2>${game.i18n.localize("from-time-management.action-queue") || "Action Queue"}</h2>
                    <div style="font-size: 12px; margin-top: 5px; color: inherit; opacity: 0.8;">
                        Total actions: <strong>${this.actionQueue.length}</strong>
                        <br>
                        Completed: <strong>${this.actionQueue.filter(a => a.completed).length}</strong>
                    </div>
                </div>
                
                <div class="action-list">
                    ${actionsHTML}
                </div>
            </div>
        `;
    }

    /**
     * Generate a hash from agent ID to determine theme
     */
    getAgentTheme(agentId) {
        if (!agentId) return 0;
        
        // Simple hash function for consistent theme assignment
        let hash = 0;
        const str = agentId.toString();
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        // Return a number between 0-9 for 10 different themes
        return Math.abs(hash) % 10;
    }

    /**
     * Generates HTML for single action
     */
    generateActionHTML(action) {
        const actionMode = action.actionMode || 'day'; // Default to day for existing actions without mode
        
        // Get agent theme for styling
        const agentTheme = this.getAgentTheme(action.agentId);
        
        // Use saved time info if available, otherwise calculate for backward compatibility
        let timeInfo;
        if (action.startTime && action.endTime) {
            // Use pre-calculated and saved time info
            timeInfo = {
                startTime: this.formatTimeHour(action.startTime),
                endTime: this.formatTimeHour(action.endTime),
                crossesPeriods: action.crossesPeriods || false
            };
        } else {
            // Fallback: calculate time for old actions without saved time info
            timeInfo = this.calculateActionTimeRange(action.agentId, actionMode, action.cost);
        }
        
        // Determine action mode labels and handle cross-period actions
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

        return `
            <div class="action-item agent-theme-${agentTheme} ${action.completed ? 'completed' : ''}" data-action-id="${action.id}">
                ${game.user.isGM ? `<input type="checkbox" class="action-checkbox" ${action.completed ? 'checked' : ''} />` : ''}
                <div class="action-info">
                    <div class="action-name" title="${action.name}"><strong>${action.name}</strong></div>
                    <div class="action-details" title="Agent: ${action.agentName} | ${fromLabel}: ${timeInfo.startTime} ${toLabel} ${timeInfo.endTime} | ${actionModeLabel}${action.completed ? ' | Completed' : ''}">
                        Agent: <strong>${action.agentName}</strong> | ${fromLabel}: ${timeInfo.startTime} ${toLabel} ${timeInfo.endTime} | ${actionModeLabel}${action.completed ? ' | ✅ Completed' : ''}
                    </div>
                </div>
                <div class="action-cost">${action.cost}h</div>
                ${game.user.isGM ? `<button class="action-delete-btn" data-action-id="${action.id}" title="Delete action">
                    <i class="fas fa-trash"></i>
                </button>` : ''}
            </div>
        `;
    }

    /**
     * Calculate the complete time range for an action (start and end times)
     */
    calculateActionTimeRange(agentId, actionMode, actionCost) {
        const timeSpent = actionMode === 'day' 
            ? (this.agentDayTimeTracking[agentId] || 0)
            : (this.agentNightTimeTracking[agentId] || 0);
        
        // Base time: 6:00 for day, 18:00 for night
        const baseHour = actionMode === 'day' ? 6 : 18;
        
        // Calculate start time
        const startTotalHours = baseHour + timeSpent;
        const startHour = Math.floor(startTotalHours) % 24;
        const startMinute = Math.floor((startTotalHours % 1) * 60);
        
        // Calculate end time
        const endTotalHours = startTotalHours + actionCost;
        const endHour = Math.floor(endTotalHours) % 24;
        const endMinute = Math.floor((endTotalHours % 1) * 60);
        
        // Check if action crosses day/night periods
        let crossesPeriods = false;
        if (actionMode === 'day') {
            // Day action (6:00-18:00) that goes beyond 18:00
            crossesPeriods = (startTotalHours + actionCost) > 18;
        } else {
            // Night action (18:00-6:00+24) that goes beyond 6:00 next day (30:00 in 24h+ format)
            crossesPeriods = (startTotalHours + actionCost) > 30; // 30:00 = 6:00 next day
        }
        
        return {
            startTime: this.formatTimeHour({ hour: startHour, minute: startMinute }),
            endTime: this.formatTimeHour({ hour: endHour, minute: endMinute }),
            crossesPeriods: crossesPeriods
        };
    }

    /**
     * Manually add popout button to dialog if PopOut module doesn't do it automatically
     */
    addPopoutButton(dialog) {
        if (!dialog.element) return;
        
        const header = dialog.element.find('.window-header');
        if (!header.length) return;
        
        // Check if popout button already exists
        if (header.find('.popout-btn').length > 0) return;
        
        // Create popout button
        const popoutBtn = $('<a class="popout-btn header-button"><i class="fas fa-external-link-alt"></i></a>');
        popoutBtn.click(() => {
            console.log("FROM TimeManagement: Manual popout button clicked");
            // Try to pop out the dialog
            if (dialog.options.popOut && typeof dialog.popOut === 'function') {
                dialog.popOut();
            } else {
                console.log("FROM TimeManagement: Dialog does not support popOut");
            }
        });
        
        // Add button to header
        header.append(popoutBtn);
        console.log("FROM TimeManagement: Manual popout button added to dialog");
    }

    /**
     * Format time hour for display
     */
    formatTimeHour(time) {
        const hours = String(time.hour).padStart(2, '0');
        const minutes = String(time.minute).padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    /**
     * Attaches action queue event listeners
     */
    attachActionQueueListeners(html) {
        if (game.user.isGM) {
            html.find('.action-checkbox').change((event) => {
                const actionId = parseInt($(event.currentTarget).closest('.action-item').data('action-id'));
                const isCompleted = $(event.currentTarget).is(':checked');
                this.toggleActionCompletion(actionId, isCompleted);
            });

            html.find('.action-delete-btn').click((event) => {
                const actionId = parseInt($(event.currentTarget).data('action-id'));
                this.removeAction(actionId);
            });
        }
    }

    /**
     * Request current data from GM
     */
    requestCurrentDataFromGM() {
        if (!game.user.isGM) {
            game.socket.emit("module.from-time-management", {
                operation: "requestCurrentData",
                userId: game.user.id
            });
        }
    }

    /**
     * Get active agents
     */
    getActiveAgents() {
        const activeAgents = [];
        
        game.users.forEach(user => {
            if (user.active && !user.isGM) {
                const userAgents = game.actors.filter(actor => 
                    actor.type === 'agent' && 
                    actor.ownership?.[user.id] >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
                );
                
                userAgents.forEach(agent => {
                    activeAgents.push({
                        user: user,
                        agent: agent,
                        dayTimeSpent: this.agentDayTimeTracking[agent.id] || 0,
                        nightTimeSpent: this.agentNightTimeTracking[agent.id] || 0,
                        totalTimeSpent: this.agentTimeTracking[agent.id] || 0
                    });
                });
            }
        });
        
        return activeAgents;
    }

    /**
     * Generate HTML for single agent
     */
    generateAgentHTML(agentData) {
        const { user, agent } = agentData;
        const avatar = agent.img || 'icons/svg/mystery-man.svg';
        const agentName = agent.name || game.i18n.localize("from-time-management.unknown-agent") || 'Unknown Agent';
        const playerName = user.name;
        
        const timeSpent = this.trackingMode === 'day' 
            ? (this.agentDayTimeTracking[agent.id] || 0)
            : (this.agentNightTimeTracking[agent.id] || 0);
        
        const maxHours = 12;
        const progressSegments = Math.min(Math.floor(timeSpent), maxHours);
        
        let segmentsHTML = '';
        for (let i = 0; i < maxHours; i++) {
            let segmentClass = 'time-segment';
            if (i < progressSegments) {
                if (i < 8) {
                    segmentClass += ' active';
                } else if (i < 10) {
                    segmentClass += ' warning';
                } else {
                    segmentClass += ' danger';
                }
                
                if (this.trackingMode === 'night') {
                    segmentClass += ' night-mode';
                }
            }
            segmentsHTML += `<div class="${segmentClass}"></div>`;
        }
        
        const modeLabel = this.trackingMode === 'day' ? 'day' : 'night';
        const modeIcon = this.trackingMode === 'day' ? '☀️' : '🌙';
        
        const canManage = this.canPlayerManageAgent(agent.id);
        
        let buttonsHTML = '';
        if (canManage || game.user.isGM) {
            buttonsHTML += `
                <button class="add-action-btn" data-agent-id="${agent.id}" data-agent-name="${agentName}">
                    <i class="fas fa-plus"></i> ${game.i18n.localize("from-time-management.add-action") || "Add Action"}
                </button>
                <button class="action-archive-btn" data-agent-id="${agent.id}" data-agent-name="${agentName}">
                    <i class="fas fa-archive"></i> ${game.i18n.localize("from-time-management.action-archive") || "Action Archive"}
                </button>
            `;
        }
        
        if (game.user.isGM) {
            buttonsHTML += `
                <button class="reset-day-btn" data-agent-id="${agent.id}" data-agent-name="${agentName}">
                    <i class="fas fa-sun"></i> ${game.i18n.localize("from-time-management.reset-day") || "New Day"}
                </button>
            `;
        }

        // GM-only time adjustment controls
        let timeControlsHTML = '';
        if (game.user.isGM) {
            timeControlsHTML = `
                <div class="time-adjustment-controls">
                    <button class="time-adjust-btn minus" data-agent-id="${agent.id}" data-adjustment="-1" title="${game.i18n.localize("from-time-management.subtract-hour") || "Subtract 1h"}">
                        <i class="fas fa-minus"></i> 1h
                    </button>
                    <button class="time-adjust-btn plus" data-agent-id="${agent.id}" data-adjustment="1" title="${game.i18n.localize("from-time-management.add-hour") || "Add 1h"}">
                        <i class="fas fa-plus"></i> 1h
                    </button>
                </div>
            `;
        }
        
        return `
            <div class="agent-entry" data-agent-id="${agent.id}">
                <div class="agent-header-row">
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
            </div>
        `;
    }

    /**
     * Check if player can manage agent
     */
    canPlayerManageAgent(agentId) {
        if (game.user.isGM) {
            return true;
        }
        
        const agent = game.actors.get(agentId);
        if (!agent) {
            return false;
        }
        
        return agent.ownership?.[game.user.id] >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;
    }

    /**
     * Updates agent time tracking
     */
    updateAgentTimeTracking(hoursAdded) {
        const activeAgents = this.getActiveAgents();
        
        const currentHour = this.currentTime.hours;
        const isCurrentlyDay = currentHour >= 6 && currentHour < 18;
        
        activeAgents.forEach(agentData => {
            const agentId = agentData.agent.id;
            
            if (!this.agentDayTimeTracking[agentId]) {
                this.agentDayTimeTracking[agentId] = 0;
            }
            if (!this.agentNightTimeTracking[agentId]) {
                this.agentNightTimeTracking[agentId] = 0;
            }
            
            if (isCurrentlyDay) {
                this.agentDayTimeTracking[agentId] += hoursAdded;
            } else {
                this.agentNightTimeTracking[agentId] += hoursAdded;
            }
            
            if (!this.agentTimeTracking[agentId]) {
                this.agentTimeTracking[agentId] = 0;
            }
            this.agentTimeTracking[agentId] += hoursAdded;
        });
        
        this.saveAgentTrackingToSettings();
        this.emitAgentTrackingUpdate();
        this.refreshAgentTracker();
    }

    /**
     * Save agent tracking to settings
     */
    saveAgentTrackingToSettings() {
        if (game.user.isGM) {
            game.settings.set("from-time-management", "agentTimeTracking", this.agentTimeTracking);
            game.settings.set("from-time-management", "agentDayTimeTracking", this.agentDayTimeTracking);
            game.settings.set("from-time-management", "agentNightTimeTracking", this.agentNightTimeTracking);
        }
    }

    /**
     * Load agent tracking from settings
     */
    loadAgentTrackingFromSettings() {
        try {
            if (game.settings && game.ready) {
                const savedTracking = game.settings.get("from-time-management", "agentTimeTracking");
                if (savedTracking && typeof savedTracking === 'object') {
                    this.agentTimeTracking = savedTracking;
                }
                
                const savedDayTracking = game.settings.get("from-time-management", "agentDayTimeTracking");
                if (savedDayTracking && typeof savedDayTracking === 'object') {
                    this.agentDayTimeTracking = savedDayTracking;
                }
                
                const savedNightTracking = game.settings.get("from-time-management", "agentNightTimeTracking");
                if (savedNightTracking && typeof savedNightTracking === 'object') {
                    this.agentNightTimeTracking = savedNightTracking;
                }
                
                const savedMode = game.settings.get("from-time-management", "trackingMode");
                if (savedMode && (savedMode === 'day' || savedMode === 'night')) {
                    this.trackingMode = savedMode;
                }
                
                console.log("FROM TimeManagement: Loaded agent tracking data:", {
                    total: Object.keys(this.agentTimeTracking).length,
                    day: Object.keys(this.agentDayTimeTracking).length,
                    night: Object.keys(this.agentNightTimeTracking).length,
                    mode: this.trackingMode
                });
            }
        } catch (error) {
            console.log("FROM TimeManagement: Could not load agent tracking data, using empty objects", error);
            this.agentTimeTracking = {};
            this.agentDayTimeTracking = {};
            this.agentNightTimeTracking = {};
        }
    }

    /**
     * Reset agent time tracking
     */
    resetAgentTimeTracking() {
        this.agentTimeTracking = {};
        this.agentDayTimeTracking = {};
        this.agentNightTimeTracking = {};
        this.saveAgentTrackingToSettings();
        this.emitAgentTrackingUpdate();
        this.refreshAgentTracker();
    }

    /**
     * Additional helper methods for action management
     */
    showActionSelectionDialog(agentId, agentName) {
        const actionTemplates = [
            { name: game.i18n.localize("from-time-management.short-rest") || "Short Rest", cost: 1 },
            { name: game.i18n.localize("from-time-management.npc-conversation") || "NPC Conversation", cost: 1 },
            { name: game.i18n.localize("from-time-management.explore-near-town") || "Explore Near Town", cost: 3 },
            { name: game.i18n.localize("from-time-management.investigate-location") || "Investigate Location", cost: 1 },
            { name: game.i18n.localize("from-time-management.meal-at-diner") || "Meal at Diner", cost: 1 },
            { name: game.i18n.localize("from-time-management.medical-care-light") || "Medical Care (Light wounds)", cost: 2 },
            { name: game.i18n.localize("from-time-management.travel-town-colony") || "Travel Town ↔ Colony House", cost: 1 },
            { name: game.i18n.localize("from-time-management.forest-exploration") || "Forest Exploration", cost: 6 }
        ];

        let templatesHTML = actionTemplates.map(template => `
            <div class="action-template" data-name="${template.name}" data-cost="${template.cost}">
                <div class="action-template-name">${template.name}</div>
                <div class="action-template-cost">${template.cost}h</div>
            </div>
        `).join('');

        const content = `
            <div class="action-selection-dialog">
                <h3>${game.i18n.localize("from-time-management.add-action") || "Add action"} ${game.i18n.localize("from-time-management.for") || "for"}: <strong>${agentName}</strong></h3>
                
                <h4>${game.i18n.localize("from-time-management.choose-action-template") || "Choose action template"}:</h4>
                <div class="action-templates">
                    ${templatesHTML}
                </div>
                
                <h4>${game.i18n.localize("from-time-management.or-create-custom") || "Or create custom"}:</h4>
                <input type="text" class="custom-action-input" id="custom-action-name" placeholder="${game.i18n.localize("from-time-management.action-name-placeholder") || "Action name"}" />
                <input type="number" class="custom-action-input" id="custom-action-cost" placeholder="${game.i18n.localize("from-time-management.cost-in-hours-placeholder") || "Cost in hours"}" min="1" max="12" />
            </div>
        `;

        new Dialog({
            title: game.i18n.localize("from-time-management.select-action") || "Select Action",
            content: content,
            buttons: {
                add: {
                    icon: '<i class="fas fa-plus"></i>',
                    label: game.i18n.localize("from-time-management.add-action") || "Add",
                    callback: async (html) => {
                        let actionName, actionCost;
                        
                        const selectedTemplate = html.find('.action-template.selected');
                        if (selectedTemplate.length > 0) {
                            actionName = selectedTemplate.data('name');
                            actionCost = selectedTemplate.data('cost');
                        } else {
                            actionName = html.find('#custom-action-name').val().trim();
                            actionCost = parseInt(html.find('#custom-action-cost').val());
                        }

                        if (actionName && actionCost && actionCost > 0) {
                            if (game.user.isGM) {
                                await this.addActionToQueue(agentId, actionName, actionCost);
                            } else {
                                game.socket.emit("module.from-time-management", {
                                    operation: "addActionToQueue",
                                    agentId: agentId,
                                    actionName: actionName,
                                    actionCost: actionCost,
                                    trackingMode: this.trackingMode,
                                    requestingUserId: game.user.id
                                });
                            }
                        } else {
                            ui.notifications.warn("Please select an action or enter valid data.");
                        }
                    }
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Cancel"
                }
            },
            render: (html) => {
                // Handle action template selection
                html.find('.action-template').click(function() {
                    html.find('.action-template').removeClass('selected').css('background', '');
                    $(this).addClass('selected').css('background', 'rgba(76, 175, 80, 0.2)');
                    
                    html.find('#custom-action-name').val('');
                    html.find('#custom-action-cost').val('');
                });

                // Handle custom input changes
                html.find('#custom-action-name, #custom-action-cost').on('input', function() {
                    html.find('.action-template').removeClass('selected').css('background', '');
                });

                // Fix keyboard input issues - prevent Foundry from capturing keystrokes
                const customInputs = html.find('#custom-action-name, #custom-action-cost');
                
                customInputs.on('keydown keyup keypress', function(event) {
                    // Stop event propagation to prevent Foundry hotkeys from interfering
                    event.stopPropagation();
                });

                customInputs.on('focus', function() {
                    // Disable Foundry keyboard manager while input is focused
                    if (game.keyboard) {
                        game.keyboard._handled = new Set();
                    }
                });

                customInputs.on('blur', function() {
                    // Re-enable Foundry keyboard manager when input loses focus
                    if (game.keyboard) {
                        game.keyboard._handled = new Set();
                    }
                });

                // Ensure the input field can receive focus properly
                setTimeout(() => {
                    html.find('#custom-action-name')[0]?.focus();
                }, 100);
            }
        }, {
            popOut: true, // Allow dialog to be popped out
            minimizable: true // Allow minimizing
        }).render(true);
    }

    showResetDayDialog(agentId, agentName) {
        Dialog.confirm({
            title: "Reset Agent Day",
            content: `
                <div style="padding: 10px;">
                    <h3>Reset progress bars for agent <strong>${agentName}</strong>?</h3>
                    <p style="margin-top: 15px; font-size: 13px; color: #666;">
                        This action will reset all hours spent by the agent in day and night modes.
                        Progress bars will return to starting position.
                    </p>
                    <p style="margin-top: 10px; font-size: 12px; color: #999;">
                        <strong>Note:</strong> This action is irreversible.
                    </p>
                </div>
            `,
            yes: () => {
                this.resetAgentDay(agentId, agentName);
            },
            no: () => {},
            defaultYes: false
        }, {
            width: 400
        });
    }

    resetAgentDay(agentId, agentName) {
        this.agentTimeTracking[agentId] = 0;
        this.agentDayTimeTracking[agentId] = 0;
        this.agentNightTimeTracking[agentId] = 0;
        
        this.saveAgentTrackingToSettings();
        this.emitAgentTrackingUpdate();
        this.refreshAgentTracker();
        
        ui.notifications.info(`Reset day for agent: ${agentName}`);
        console.log(`FROM TimeManagement: Reset day for agent ${agentName} (${agentId})`);
    }

    /**
     * Manually adjust agent time (GM only)
     */
    adjustAgentTime(agentId, adjustment) {
        if (!game.user.isGM) return;

        const agent = game.actors.get(agentId);
        if (!agent) {
            ui.notifications.error("Agent not found!");
            return;
        }

        // Initialize if not exists
        if (!this.agentDayTimeTracking[agentId]) {
            this.agentDayTimeTracking[agentId] = 0;
        }
        if (!this.agentNightTimeTracking[agentId]) {
            this.agentNightTimeTracking[agentId] = 0;
        }
        if (!this.agentTimeTracking[agentId]) {
            this.agentTimeTracking[agentId] = 0;
        }

        // Apply adjustment to current tracking mode
        const isDayMode = this.trackingMode === 'day';
        
        if (isDayMode) {
            const newTime = Math.max(0, Math.min(12, this.agentDayTimeTracking[agentId] + adjustment));
            const actualAdjustment = newTime - this.agentDayTimeTracking[agentId];
            this.agentDayTimeTracking[agentId] = newTime;
            this.agentTimeTracking[agentId] += actualAdjustment;
        } else {
            const newTime = Math.max(0, Math.min(12, this.agentNightTimeTracking[agentId] + adjustment));
            const actualAdjustment = newTime - this.agentNightTimeTracking[agentId];
            this.agentNightTimeTracking[agentId] = newTime;
            this.agentTimeTracking[agentId] += actualAdjustment;
        }

        this.saveAgentTrackingToSettings();
        
        console.log(`FROM TimeManagement: [AGENT TIME ADJUSTMENT] Before sync - Agent: ${agent.name}, Adjustment: ${adjustment}h, Mode: ${isDayMode ? 'day' : 'night'}`);
        console.log(`FROM TimeManagement: [AGENT TIME ADJUSTMENT] Current tracking values:`, {
            agentTimeTracking: this.agentTimeTracking[agentId],
            dayTracking: this.agentDayTimeTracking[agentId],
            nightTracking: this.agentNightTimeTracking[agentId]
        });
        
        this.emitAgentTrackingUpdate();
        this.refreshAgentTracker();

        const modeText = isDayMode ? 'day' : 'night';
        const adjustmentText = adjustment > 0 ? `+${adjustment}h` : `${adjustment}h`;
        ui.notifications.info(`Time adjusted for ${agent.name}: ${adjustmentText} (${modeText} mode)`);
        
        console.log(`FROM TimeManagement: [AGENT TIME ADJUSTMENT] Completed for agent ${agent.name}: ${adjustmentText} in ${modeText} mode`);
    }

    async addActionToQueue(agentId, actionName, actionCost, overrideTrackingMode = null) {
        const agent = game.actors.get(agentId);
        if (!agent) {
            ui.notifications.error("Agent not found!");
            return;
        }

        const trackingModeToUse = overrideTrackingMode || this.trackingMode;

        const shouldContinue = await this.checkTimeOverflowAndConfirm(agentId, agent.name, actionName, actionCost, trackingModeToUse);
        
        if (!shouldContinue) {
            console.log("FROM TimeManagement: User cancelled action due to time overflow");
            return;
        }

        // Calculate start time BEFORE adding this action to the agent's time
        const timeSpent = trackingModeToUse === 'day' 
            ? (this.agentDayTimeTracking[agentId] || 0)
            : (this.agentNightTimeTracking[agentId] || 0);
        
        const baseHour = trackingModeToUse === 'day' ? 6 : 18;
        const startTotalHours = baseHour + timeSpent;
        const startHour = Math.floor(startTotalHours) % 24;
        const startMinute = Math.floor((startTotalHours % 1) * 60);
        
        const endTotalHours = startTotalHours + actionCost;
        const endHour = Math.floor(endTotalHours) % 24;
        const endMinute = Math.floor((endTotalHours % 1) * 60);
        
        // Check if action crosses day/night periods
        let crossesPeriods = false;
        if (trackingModeToUse === 'day') {
            crossesPeriods = (startTotalHours + actionCost) > 18;
        } else {
            crossesPeriods = (startTotalHours + actionCost) > 30; // 30:00 = 6:00 next day
        }

        const action = {
            id: Date.now(),
            name: actionName,
            cost: actionCost,
            agentId: agentId,
            agentName: agent.name,
            timestamp: Date.now(),
            completed: false,
            actionMode: trackingModeToUse,
            startTime: { hour: startHour, minute: startMinute },
            endTime: { hour: endHour, minute: endMinute },
            crossesPeriods: crossesPeriods,
            townDay: this.currentTime.day || 1 // Dodajemy dzień w miasteczku
        };

        this.actionQueue.push(action);
        this.saveActionQueueToSettings();
        
        // Dodaj akcję do archiwum
        this.addActionToArchive(action);
        
        this.addTimeToAgent(agentId, actionCost, trackingModeToUse);
        
        this.refreshAgentTracker();
        this.refreshActionQueue();
        this.emitAgentTrackingUpdate();

        ui.notifications.info(`Added action "${actionName}" (${actionCost}h) for ${agent.name}`);
    }

    /**
     * Add action to agent's archive
     */
    addActionToArchive(action) {
        if (!this.actionArchive[action.agentId]) {
            this.actionArchive[action.agentId] = [];
        }
        
        // Create a copy for archive to prevent reference issues
        const archiveAction = {
            ...action,
            archivedAt: Date.now()
        };
        
        this.actionArchive[action.agentId].push(archiveAction);
        // Save to both files and settings for backup
        this.saveActionArchiveToFiles();
        this.saveActionArchiveToSettings();
        
        console.log(`FROM TimeManagement: Added action "${action.name}" to archive for agent ${action.agentName}`);
    }

    /**
     * Save action archive to individual files for each agent
     */
    async saveActionArchiveToFiles() {
        try {
            if (!game.ready) return;

            for (const [agentId, agentArchive] of Object.entries(this.actionArchive)) {
                const fileName = `from-time-management-agent-${agentId}.json`;
                const fileData = JSON.stringify(agentArchive, null, 2);
                
                try {
                    // Save to world data directory
                    await FilePicker.upload("data", "worlds/" + game.world.id + "/", 
                        new File([fileData], fileName, { type: "application/json" }));
                    
                    console.log(`FROM TimeManagement: Saved archive for agent ${agentId} to file ${fileName}`);
                } catch (uploadError) {
                    console.error(`FROM TimeManagement: Could not save archive file for agent ${agentId}:`, uploadError);
                }
            }
            
            console.log(`FROM TimeManagement: Archive save operation completed for ${Object.keys(this.actionArchive).length} agents`);
        } catch (error) {
            console.error("FROM TimeManagement: Could not save action archive to files", error);
        }
    }

    /**
     * Save action archive to settings (legacy backup)
     */
    saveActionArchiveToSettings() {
        try {
            if (game.settings && game.ready) {
                game.settings.set('from-time-management', 'actionArchive', this.actionArchive);
                console.log(`FROM TimeManagement: Saved action archive with ${Object.keys(this.actionArchive).length} agents to settings (backup)`);
            }
        } catch (error) {
            console.error("FROM TimeManagement: Could not save action archive to settings", error);
        }
    }

    /**
     * Migrate existing archive from settings to files (one-time operation)
     */
    async migrateArchiveToFiles() {
        try {
            if (!game.ready) return;

            // First check if we already have files
            const worldPath = `worlds/${game.world.id}`;
            try {
                const browse = await FilePicker.browse("data", worldPath);
                const existingFiles = browse.files.filter(file => 
                    file.includes('from-time-management-agent-') && file.endsWith('.json')
                );
                
                if (existingFiles.length > 0) {
                    console.log("FROM TimeManagement: Archive files already exist, skipping migration");
                    return;
                }
            } catch (e) {
                console.log("FROM TimeManagement: Unable to check for existing files, proceeding with migration");
            }

            // Load from settings and save to files
            const savedArchive = game.settings.get('from-time-management', 'actionArchive');
            if (savedArchive && typeof savedArchive === 'object' && Object.keys(savedArchive).length > 0) {
                this.actionArchive = savedArchive;
                await this.saveActionArchiveToFiles();
                console.log(`FROM TimeManagement: Migrated archive from settings to files for ${Object.keys(this.actionArchive).length} agents`);
            } else {
                console.log("FROM TimeManagement: No archive data found in settings to migrate");
            }
        } catch (error) {
            console.error("FROM TimeManagement: Error during archive migration:", error);
        }
    }

    /**
     * Load action archive from individual files for each agent
     */
    async loadActionArchiveFromFiles() {
        try {
            if (!game.ready) return;

            this.actionArchive = {};
            const worldPath = `worlds/${game.world.id}`;
            
            // Get list of all files in world directory
            try {
                const browse = await FilePicker.browse("data", worldPath);
                const archiveFiles = browse.files.filter(file => 
                    file.includes('from-time-management-agent-') && file.endsWith('.json')
                );

                console.log(`FROM TimeManagement: Found ${archiveFiles.length} agent archive files`);

                for (const filePath of archiveFiles) {
                    try {
                        const response = await fetch(filePath);
                        if (response.ok) {
                            const agentArchive = await response.json();
                            // Extract agent ID from filename
                            const fileName = filePath.split('/').pop();
                            const agentId = fileName.replace('from-time-management-agent-', '').replace('.json', '');
                            
                            if (agentId && agentArchive) {
                                this.actionArchive[agentId] = agentArchive;
                                console.log(`FROM TimeManagement: Loaded archive for agent ${agentId} from file`);
                            }
                        }
                    } catch (fileError) {
                        console.error(`FROM TimeManagement: Could not load archive file ${filePath}:`, fileError);
                    }
                }
                
                console.log(`FROM TimeManagement: Archive load operation completed. Loaded ${Object.keys(this.actionArchive).length} agents`);
            } catch (browseError) {
                console.warn("FROM TimeManagement: Could not browse world directory for archive files:", browseError);
                // Fall back to settings if file system not accessible
                this.loadActionArchiveFromSettings();
            }
        } catch (error) {
            console.error("FROM TimeManagement: Could not load action archive from files", error);
            // Fall back to settings on error
            this.loadActionArchiveFromSettings();
        }
    }

    /**
     * Load action archive from settings (legacy backup)
     */
    loadActionArchiveFromSettings() {
        try {
            if (game.settings && game.ready) {
                const savedArchive = game.settings.get('from-time-management', 'actionArchive');
                if (savedArchive && typeof savedArchive === 'object') {
                    this.actionArchive = savedArchive;
                    console.log(`FROM TimeManagement: Archive contains ${Object.keys(this.actionArchive).length} agents`);
                } else {
                    console.log("FROM TimeManagement: No saved action archive found, initializing empty");
                    this.actionArchive = {};
                }
            }
        } catch (error) {
            console.error("FROM TimeManagement: Could not load action archive from settings", error);
            this.actionArchive = {};
        }
    }

    /**
     * Open agent archive window
     */
    openAgentArchive(agentId, agentName) {
        // If archive window already open for this agent, bring to top
        if (this.agentArchiveDialogs[agentId]) {
            this.agentArchiveDialogs[agentId].bringToTop();
            return;
        }

        // Request current data if not GM
        if (!game.user.isGM) {
            this.requestCurrentDataFromGM();
        }

        this.createAgentArchiveDialog(agentId, agentName);
    }

    /**
     * Create agent archive dialog
     */
    createAgentArchiveDialog(agentId, agentName) {
        const archiveActions = this.actionArchive[agentId] || [];
        const content = this.generateAgentArchiveContent(agentId, agentName, archiveActions);
        
        const dialog = new Dialog({
            title: `${game.i18n.localize("from-time-management.action-archive") || "Action Archive"}: ${agentName}`,
            content: content,
            buttons: {
                close: {
                    icon: '<i class="fas fa-times"></i>',
                    label: game.i18n.localize("from-time-management.close") || "Close"
                }
            },
            render: (html) => this.attachAgentArchiveEventListeners(html, agentId),
            close: () => {
                delete this.agentArchiveDialogs[agentId];
            }
        }, {
            classes: ["dialog", "time-management-archive-dialog"],
            width: 600,
            height: 500,
            resizable: true,
            popOut: true, // Allow dialog to be popped out
            minimizable: true // Allow minimizing
        });

        dialog.render(true);
        this.agentArchiveDialogs[agentId] = dialog;
    }

    /**
     * Generate agent archive content
     */
    generateAgentArchiveContent(agentId, agentName, archiveActions) {
        if (archiveActions.length === 0) {
            return `
                <div class="archive-window">
                    <div class="archive-header">
                        <h3>${game.i18n.localize("from-time-management.action-archive") || "Action Archive"}: ${agentName}</h3>
                    </div>
                    <div class="no-actions-message">
                        <i class="fas fa-archive" style="font-size: 24px; margin-bottom: 10px; display: block;"></i>
                        ${game.i18n.localize("from-time-management.no-archived-actions") || "No actions archived yet"}
                    </div>
                </div>
            `;
        }

        // Group actions by town day
        const actionsByDay = {};
        archiveActions.forEach(action => {
            const day = action.townDay || 1;
            if (!actionsByDay[day]) {
                actionsByDay[day] = [];
            }
            actionsByDay[day].push(action);
        });

        // Sort days in descending order (newest first)
        const sortedDays = Object.keys(actionsByDay)
            .map(d => parseInt(d))
            .sort((a, b) => b - a);

        let daysSectionsHTML = '';
        sortedDays.forEach(day => {
            const dayActions = actionsByDay[day]
                .sort((a, b) => b.timestamp - a.timestamp); // Newest first within day
            
            const dayActionsHTML = dayActions.map(action => this.generateArchiveActionHTML(action)).join('');
            
            daysSectionsHTML += `
                <div class="day-section">
                    <div class="day-header" data-day="${day}">
                        <i class="fas fa-chevron-right day-toggle"></i>
                        <span class="day-title">${game.i18n.localize("from-time-management.day") || "Day"} ${day}</span>
                        <span class="day-count">(${dayActions.length} ${game.i18n.localize("from-time-management.actions") || "actions"})</span>
                    </div>
                    <div class="day-actions collapsed" data-day="${day}">
                        ${dayActionsHTML}
                    </div>
                </div>
            `;
        });

        return `
            <div class="archive-window">
                <div class="archive-header">
                    <h3>${game.i18n.localize("from-time-management.action-archive") || "Action Archive"}: ${agentName}</h3>
                    <div class="archive-stats">
                        ${game.i18n.localize("from-time-management.total-actions") || "Total actions"}: <strong>${archiveActions.length}</strong>
                        <br>
                        ${game.i18n.localize("from-time-management.days-active") || "Days active"}: <strong>${sortedDays.length}</strong>
                    </div>
                </div>
                <div class="archive-content">
                    ${daysSectionsHTML}
                </div>
            </div>
        `;
    }

    /**
     * Generate HTML for single archived action
     */
    generateArchiveActionHTML(action) {
        const actionMode = action.actionMode || 'day';
        
        // Use saved time info
        const timeInfo = {
            startTime: this.formatTimeHour(action.startTime),
            endTime: this.formatTimeHour(action.endTime),
            crossesPeriods: action.crossesPeriods || false
        };
        
        // Determine action mode labels
        let actionModeLabel = '';
        if (timeInfo.crossesPeriods) {
            actionModeLabel = `☀️🌙 ${game.i18n.localize("from-time-management.day-night-action") || "Day/Night"}`;
        } else {
            actionModeLabel = actionMode === 'day' 
                ? `☀️ ${game.i18n.localize("from-time-management.day-action") || "Day"}` 
                : `🌙 ${game.i18n.localize("from-time-management.night-action") || "Night"}`;
        }

        // Format timestamp
        const date = new Date(action.timestamp);
        const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();

        const fromLabel = game.i18n.localize("from-time-management.from-time") || "From";
        const toLabel = game.i18n.localize("from-time-management.to-time") || "to";

        return `
            <div class="archive-action-item ${action.completed ? 'completed' : ''}" data-action-id="${action.id}">
                <div class="archive-action-info">
                    <div class="archive-action-name" title="${action.name}"><strong>${action.name}</strong></div>
                    <div class="archive-action-details" title="${fromLabel}: ${timeInfo.startTime} ${toLabel} ${timeInfo.endTime} | ${actionModeLabel} | Added: ${dateStr}">
                        ${fromLabel}: ${timeInfo.startTime} ${toLabel} ${timeInfo.endTime} | ${actionModeLabel}${action.completed ? ' | ✅ Completed' : ''}
                        <br>
                        <small style="opacity: 0.7;">${game.i18n.localize("from-time-management.added-on") || "Added on"}: ${dateStr}</small>
                    </div>
                </div>
                <div class="archive-action-cost">${action.cost}h</div>
            </div>
        `;
    }

    /**
     * Attach event listeners for agent archive
     */
    attachAgentArchiveEventListeners(html, agentId) {
        // Day section toggles
        html.find('.day-header').click((event) => {
            const day = $(event.currentTarget).data('day');
            const dayActions = html.find(`.day-actions[data-day="${day}"]`);
            const toggle = $(event.currentTarget).find('.day-toggle');
            
            if (dayActions.hasClass('collapsed')) {
                dayActions.removeClass('collapsed');
                toggle.removeClass('fa-chevron-right').addClass('fa-chevron-down');
            } else {
                dayActions.addClass('collapsed');
                toggle.removeClass('fa-chevron-down').addClass('fa-chevron-right');
            }
        });
    }

    async checkTimeOverflowAndConfirm(agentId, agentName, actionName, actionCost, overrideTrackingMode = null) {
        if (!this.agentDayTimeTracking[agentId]) {
            this.agentDayTimeTracking[agentId] = 0;
        }
        if (!this.agentNightTimeTracking[agentId]) {
            this.agentNightTimeTracking[agentId] = 0;
        }
        
        const trackingModeToUse = overrideTrackingMode || this.trackingMode;
        const isDayMode = trackingModeToUse === 'day';
        const maxHours = 12;
        
        let willOverflow = false;
        let overflowAmount = 0;
        let currentTime = 0;
        
        if (isDayMode) {
            currentTime = this.agentDayTimeTracking[agentId];
            const newTime = currentTime + actionCost;
            if (newTime > maxHours) {
                willOverflow = true;
                overflowAmount = newTime - maxHours;
            }
        } else {
            currentTime = this.agentNightTimeTracking[agentId];
            const newTime = currentTime + actionCost;
            if (newTime > maxHours) {
                willOverflow = true;
                overflowAmount = newTime - maxHours;
            }
        }
        
        if (willOverflow) {
            const modeText = isDayMode ? 'day' : 'night';
            const overflowModeText = isDayMode ? 'night' : 'day';
            
            return new Promise((resolve) => {
                Dialog.confirm({
                    title: game.i18n.localize("from-time-management.time-overflow") || "Time Limit Exceeded",
                    content: `
                        <div style="padding: 10px;">
                            <h3>Warning!</h3>
                            <p>Action "<strong>${actionName}</strong>" (${actionCost}h) for agent <strong>${agentName}</strong> 
                            will exceed the ${modeText} time limit by <strong>${overflowAmount.toFixed(1)}h</strong>.</p>
                            
                            <p style="margin-top: 15px; color: #e65100;">
                                The agent will be caught by ${overflowModeText}, and excess time (${overflowAmount.toFixed(1)}h) 
                                will be added to the ${overflowModeText} bar.
                            </p>
                            
                            <p style="margin-top: 15px; font-size: 13px; color: #666;">
                                Do you want to continue anyway?
                            </p>
                        </div>
                    `,
                    yes: () => resolve(true),
                    no: () => resolve(false),
                    defaultYes: false
                }, {
                    width: 450
                });
            });
        }
        
        return true;
    }

    addTimeToAgent(agentId, hours, overrideTrackingMode = null) {
        if (!this.agentDayTimeTracking[agentId]) {
            this.agentDayTimeTracking[agentId] = 0;
        }
        if (!this.agentNightTimeTracking[agentId]) {
            this.agentNightTimeTracking[agentId] = 0;
        }
        if (!this.agentTimeTracking[agentId]) {
            this.agentTimeTracking[agentId] = 0;
        }
        
        const trackingModeToUse = overrideTrackingMode || this.trackingMode;
        const isDayMode = trackingModeToUse === 'day';
        const maxHours = 12;
        
        if (isDayMode) {
            const currentDayTime = this.agentDayTimeTracking[agentId];
            const newDayTime = currentDayTime + hours;
            
            if (newDayTime > maxHours) {
                const overflow = newDayTime - maxHours;
                this.agentDayTimeTracking[agentId] = maxHours;
                this.agentNightTimeTracking[agentId] += overflow;
                
                console.log(`FROM TimeManagement: Agent ${agentId} exceeded day limit by ${overflow}h - moved to night`);
            } else {
                this.agentDayTimeTracking[agentId] = newDayTime;
            }
        } else {
            const currentNightTime = this.agentNightTimeTracking[agentId];
            const newNightTime = currentNightTime + hours;
            
            if (newNightTime > maxHours) {
                const overflow = newNightTime - maxHours;
                this.agentNightTimeTracking[agentId] = maxHours;
                this.agentDayTimeTracking[agentId] += overflow;
                
                console.log(`FROM TimeManagement: Agent ${agentId} exceeded night limit by ${overflow}h - moved to day`);
            } else {
                this.agentNightTimeTracking[agentId] = newNightTime;
            }
        }
        
        this.agentTimeTracking[agentId] += hours;
        this.saveAgentTrackingToSettings();
        
        console.log(`FROM TimeManagement: Updated time for agent ${agentId}: +${hours}h in ${trackingModeToUse} mode`);
    }

    saveActionQueueToSettings() {
        if (game.user.isGM) {
            game.settings.set('from-time-management', 'actionQueue', this.actionQueue);
        }
    }

    saveTrackingModeToSettings() {
        if (game.user.isGM) {
            game.settings.set("from-time-management", "trackingMode", this.trackingMode);
        }
    }

    toggleActionCompletion(actionId, isCompleted) {
        const action = this.actionQueue.find(a => a.id === actionId);
        if (action) {
            action.completed = isCompleted;
            this.saveActionQueueToSettings();
            this.emitAgentTrackingUpdate();
            
            // Refresh both windows to update sorting and display
            this.refreshActionQueue();
            this.refreshAgentTracker();
            
            // Show notification about action status change
            const statusText = isCompleted ? 
                (game.i18n.localize("from-time-management.action-completed") || "completed") : 
                (game.i18n.localize("from-time-management.action-reactivated") || "reactivated");
            ui.notifications.info(`Action "${action.name}" ${statusText}.`);
        }
    }

    removeAction(actionId) {
        // Find and mark action as removed in archive
        const action = this.actionQueue.find(a => a.id === actionId);
        if (action && this.actionArchive[action.agentId]) {
            const archiveAction = this.actionArchive[action.agentId].find(a => a.id === actionId);
            if (archiveAction) {
                archiveAction.completed = true;
                archiveAction.removedAt = Date.now();
                this.saveActionArchiveToFiles();
                this.saveActionArchiveToSettings();
            }
        }
        
        // Remove from queue but keep in archive
        this.actionQueue = this.actionQueue.filter(a => a.id !== actionId);
        this.saveActionQueueToSettings();
        this.emitAgentTrackingUpdate();
        this.refreshActionQueue();
        this.refreshAgentTracker();
    }

    removeCompletedActions() {
        const beforeCount = this.actionQueue.length;
        const completedActions = this.actionQueue.filter(a => a.completed);
        
        // Mark all completed actions as removed in archive but keep them there
        completedActions.forEach(action => {
            if (this.actionArchive[action.agentId]) {
                const archiveAction = this.actionArchive[action.agentId].find(a => a.id === action.id);
                if (archiveAction) {
                    archiveAction.removedAt = Date.now();
                }
            }
        });
        
        this.actionQueue = this.actionQueue.filter(a => !a.completed);
        const removedCount = beforeCount - this.actionQueue.length;
        
        this.saveActionQueueToSettings();
        this.saveActionArchiveToFiles();
        this.saveActionArchiveToSettings();
        this.emitAgentTrackingUpdate();
        this.refreshActionQueue();
        this.refreshAgentTracker();
        
        ui.notifications.info(`Removed ${removedCount} completed actions.`);
    }

    clearActionQueue() {
        this.actionQueue = [];
        this.saveActionQueueToSettings();
        this.emitAgentTrackingUpdate();
        this.refreshActionQueue();
        this.refreshAgentTracker();
        ui.notifications.info("Action queue has been cleared.");
    }

    /**
     * Emit agent tracking update to all users
     */
    emitAgentTrackingUpdate() {
        if (game.user.isGM) {
            const data = {
                agentTimeTracking: this.agentTimeTracking,
                agentDayTimeTracking: this.agentDayTimeTracking,
                agentNightTimeTracking: this.agentNightTimeTracking,
                actionQueue: this.actionQueue,
                trackingMode: this.trackingMode,
                currentTime: this.currentTime,
                actionArchive: this.actionArchive
            };

            game.socket.emit("module.from-time-management", {
                operation: "updateAgentTracking",
                data: data
            });

            // Also emit a specific force refresh for real-time updates
            game.socket.emit("module.from-time-management", {
                operation: "forceRefreshWindows"
            });
            
            console.log("FROM TimeManagement: Emitted agent tracking update to all users");
        }
    }

    /**
     * Initialize socket handling
     */
    initializeSocket() {
        if (!game.socket) {
            console.warn("FROM TimeManagement: Socket not available, retrying...");
            setTimeout(() => this.initializeSocket(), 1000);
            return;
        }

        console.log("FROM TimeManagement: [SOCKET] Initializing socket for user:", game.user.name, "| GM:", game.user.isGM);
        
        // Unregister existing handler to prevent duplicates
        if (this.socketInitialized) {
            game.socket.off("module.from-time-management");
            console.log("FROM TimeManagement: [SOCKET] Removed existing handler");
        }
        
        game.socket.on("module.from-time-management", (data) => {
            console.log("FROM TimeManagement: [SOCKET] Received message:", data.operation, "| User:", game.user.name);
            this.handleSocketMessage(data);
        });
        
        this.socketInitialized = true;
        console.log("FROM TimeManagement: [SOCKET] Socket initialized successfully for user:", game.user.name);
    }

    /**
     * Handle socket messages
     */
    handleSocketMessage(data) {
        try {
            switch (data.operation) {
                case "updateAgentTracking":
                    if (!game.user.isGM) {
                        this.updateDataFromGM(data.data);
                    }
                    break;
                    
                case "updateTime":
                    if (!game.user.isGM) {
                        this.receiveTimeUpdate(data);
                    }
                    break;
                    
                case "requestCurrentData":
                    if (game.user.isGM) {
                        this.sendCurrentDataToUser(data.userId);
                    }
                    break;
                    
                case "receiveCurrentData":
                    if (!game.user.isGM && data.userId === game.user.id) {
                        this.updateDataFromGM(data.data);
                    }
                    break;
                    
                case "addActionToQueue":
                    if (game.user.isGM) {
                        this.handleAddActionRequest(data);
                    }
                    break;
                    
                case "forceRefreshWindows":
                    this.forceRefreshAllWindows();
                    
                    // Also update UI notifications if available
                    if (ui.notifications) {
                        setTimeout(() => {
                            if (this.actionQueue && this.actionQueue.length > 0) {
                                const recentActions = this.actionQueue.filter(a => !a.completed && (Date.now() - a.timestamp) < 5000);
                                if (recentActions.length > 0) {
                                    // Just refresh, don't spam notifications
                                }
                            }
                        }, 100);
                    }
                    break;
                    
                default:
                    console.warn("FROM TimeManagement: Unknown socket operation:", data.operation);
            }
        } catch (error) {
            console.error("FROM TimeManagement: Error handling socket message:", error);
        }
    }

    /**
     * Send current data to specific user
     */
    sendCurrentDataToUser(userId) {
        if (game.user.isGM) {
            const data = {
                agentTimeTracking: this.agentTimeTracking,
                agentDayTimeTracking: this.agentDayTimeTracking,
                agentNightTimeTracking: this.agentNightTimeTracking,
                actionQueue: this.actionQueue,
                actionArchive: this.actionArchive, // Dodajemy dane archiwum
                trackingMode: this.trackingMode,
                currentTime: this.currentTime
            };

            game.socket.emit("module.from-time-management", {
                operation: "receiveCurrentData",
                data: data,
                userId: userId
            });
        }
    }

    /**
     * Handle add action request from player
     */
    async handleAddActionRequest(data) {
        if (game.user.isGM) {
            const { agentId, actionName, actionCost, trackingMode, requestingUserId } = data;
            
            const agent = game.actors.get(agentId);
            if (!agent) {
                console.error("FROM TimeManagement: Agent not found for action request:", agentId);
                return;
            }

            const requestingUser = game.users.get(requestingUserId);
            if (!requestingUser) {
                console.error("FROM TimeManagement: Requesting user not found:", requestingUserId);
                return;
            }

            const canManage = agent.ownership?.[requestingUserId] >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;
            if (!canManage) {
                console.warn("FROM TimeManagement: User", requestingUserId, "cannot manage agent", agentId);
                return;
            }

            console.log("FROM TimeManagement: Processing action request from", requestingUser.name, "for agent", agent.name);
            
            // Add the action and explicitly force update
            await this.addActionToQueue(agentId, actionName, actionCost, trackingMode);
            
            // Extra emit to ensure all clients get the update immediately
            this.emitAgentTrackingUpdate();
        }
    }

    /**
     * Update data from GM
     */
    updateDataFromGM(data) {
        if (game.user.isGM) {
            return;
        }
        
        this.agentTimeTracking = data.agentTimeTracking || {};
        this.agentDayTimeTracking = data.agentDayTimeTracking || {};
        this.agentNightTimeTracking = data.agentNightTimeTracking || {};
        this.actionQueue = data.actionQueue || [];
        this.trackingMode = data.trackingMode || 'day';
        this.currentTime = data.currentTime || this.currentTime;
        this.actionArchive = data.actionArchive || {};
        
        console.log("FROM TimeManagement: [PLAYER SYNC] Data updated, refreshing windows...");
        
        // Force refresh of all windows with explicit timeout
        this.forceRefreshAllWindows();
        
        // Additional explicit refresh with short delay to ensure DOM updates
        setTimeout(() => {
            this.refreshAgentTracker();
            this.refreshActionQueue();
            this.updateDialogIfOpen();
        }, 50);
        
        // Extra refresh for agent tracker to ensure progress bars update
        setTimeout(() => {
            if (this.agentTrackerOpen && this.agentTrackerDialog) {
                const newContent = this.generateAgentTrackerContent();
                this.agentTrackerDialog.data.content = newContent;
                this.agentTrackerDialog.render(true);
            }
        }, 100);
        
        console.log("FROM TimeManagement: Data updated from GM", {
            agentsTracked: Object.keys(this.agentTimeTracking).length,
            actionsInQueue: this.actionQueue.length,
            trackingMode: this.trackingMode
        });
    }

    /**
     * Get formatted current time
     */
    formatCurrentTime() {
        const timeString = String(this.currentTime.hours).padStart(2, '0') + ':' + 
                          String(this.currentTime.minutes).padStart(2, '0');
        
        let dayLabel = '';
        if (this.currentTime.day) {
            dayLabel = `, ${this.currentTime.day}`;
        }
        
        return `${timeString}${dayLabel}`;
    }

    /**
     * Add time to current time
     */
    addTime(hours) {
        const minutesToAdd = hours * 60;
        this.currentTime.minutes += minutesToAdd;
        
        while (this.currentTime.minutes >= 60) {
            this.currentTime.hours++;
            this.currentTime.minutes -= 60;
        }
        
        while (this.currentTime.hours >= 24) {
            this.currentTime.hours -= 24;
            this.currentTime.day++;
        }
        
        this.saveCurrentTimeToSettings();
        this.updateAgentTimeTracking(hours);
        
        this.emitTimeUpdate();
        this.refreshMainDialog();
    }

    /**
     * Set current time
     */
    setTime(hours, minutes, day = null) {
        this.currentTime.hours = Math.max(0, Math.min(23, parseInt(hours) || 0));
        this.currentTime.minutes = Math.max(0, Math.min(59, parseInt(minutes) || 0));
        
        if (day !== null) {
            this.currentTime.day = Math.max(1, parseInt(day) || 1);
        }
        
        this.saveCurrentTimeToSettings();
        this.emitTimeUpdate();
        this.refreshMainDialog();
    }

    /**
     * Emit time update to all users
     */
    emitTimeUpdate() {
        if (game.user.isGM) {
            game.socket.emit("module.from-time-management", {
                operation: "updateTime",
                currentTime: this.currentTime,
                agentTimeTracking: this.agentTimeTracking,
                agentDayTimeTracking: this.agentDayTimeTracking,
                agentNightTimeTracking: this.agentNightTimeTracking
            });
        }
    }

    /**
     * Receive time update from GM
     */
    receiveTimeUpdate(data) {
        if (!game.user.isGM) {
            this.currentTime = data.currentTime;
            this.agentTimeTracking = data.agentTimeTracking || {};
            this.agentDayTimeTracking = data.agentDayTimeTracking || {};
            this.agentNightTimeTracking = data.agentNightTimeTracking || {};
            
            this.refreshMainDialog();
            this.refreshAgentTracker();
            
            console.log(`FROM TimeManagement: Received time update: ${this.formatCurrentTime()}`);
        }
    }

    /**
     * Save current time to settings
     */
    saveCurrentTimeToSettings() {
        if (game.user.isGM) {
            game.settings.set("from-time-management", "currentGameTime", this.currentTime);
            console.log("FROM TimeManagement: Saved current time to settings:", this.formatCurrentTime());
        }
    }

    /**
     * Load current time from settings
     */
    loadCurrentTimeFromSettings() {
        try {
            if (game.settings && game.ready) {
                const savedTime = game.settings.get("from-time-management", "currentGameTime");
                if (savedTime && typeof savedTime === 'object') {
                    this.currentTime = {
                        hours: savedTime.hours || 12,
                        minutes: savedTime.minutes || 0,
                        day: savedTime.day || 1,
                        year: savedTime.year || new Date().getFullYear()
                    };
                    console.log("FROM TimeManagement: Loaded time from settings:", this.formatCurrentTime());
                } else {
                    console.log("FROM TimeManagement: No saved time found, using default");
                }
            }
        } catch (error) {
            console.log("FROM TimeManagement: Could not load time from settings, using default", error);
        }
    }

    /**
     * Load action queue from settings
     */
    loadActionQueueFromSettings() {
        try {
            if (game.settings && game.ready) {
                const savedQueue = game.settings.get('from-time-management', 'actionQueue');
                if (Array.isArray(savedQueue)) {
                    this.actionQueue = savedQueue;
                    console.log(`FROM TimeManagement: Loaded ${this.actionQueue.length} actions from settings`);
                } else {
                    console.log("FROM TimeManagement: No saved action queue found");
                }
            }
        } catch (error) {
            console.log("FROM TimeManagement: Could not load action queue from settings", error);
            this.actionQueue = [];
        }
    }

    /**
     * Initialize all settings
     */
    async initializeSettings() {
        try {
            this.loadCurrentTimeFromSettings();
            this.loadAgentTrackingFromSettings();
            this.loadActionQueueFromSettings();
            
            // Migrate old archive data if needed
            await this.migrateArchiveToFiles();
            
            // Load archive from files
            await this.loadActionArchiveFromFiles();
            
            console.log("FROM TimeManagement: All settings initialized successfully");
        } catch (error) {
            console.error("FROM TimeManagement: Error initializing settings:", error);
        }
    }

    /**
     * Refresh main dialog if open
     */
    refreshMainDialog() {
        if (this.isOpen && this.dialog) {
            // Update the time display in main dialog
            const timeDisplay = this.dialog.element.find('.current-time');
            if (timeDisplay.length > 0) {
                timeDisplay.text(`Current time: ${this.formatCurrentTime()}`);
            }
        }
    }

    /**
     * Module cleanup on disable
     */
    destroy() {
        console.log("FROM TimeManagement: Cleaning up module");
        
        if (this.dialog) {
            this.dialog.close();
            this.dialog = null;
        }
        
        if (this.agentTrackerDialog) {
            this.agentTrackerDialog.close();
            this.agentTrackerDialog = null;
        }
        
        if (this.actionQueueDialog) {
            this.actionQueueDialog.close();
            this.actionQueueDialog = null;
        }
        
        this.isOpen = false;
        this.agentTrackerOpen = false;
        this.actionQueueOpen = false;
        
        console.log("FROM TimeManagement: Module cleanup completed");
    }

    /**
     * Get module status for debugging
     */
    getStatus() {
        return {
            currentTime: this.currentTime,
            trackingMode: this.trackingMode,
            agentsTracked: Object.keys(this.agentTimeTracking).length,
            actionsInQueue: this.actionQueue.length,
            windowsOpen: {
                main: this.isOpen,
                agentTracker: this.agentTrackerOpen,
                actionQueue: this.actionQueueOpen
            }
        };
    }
}

// Funkcja do tworzenia własnej kategorii kontrolek jako fallback
function createOwnControlCategory() {
    console.log("FROM TimeManagement: Creating own control category");
    
    // Sprawdźmy czy ui.controls.controls jest tablicą czy obiektem
    if (Array.isArray(ui.controls.controls)) {
        // v12 - tablica
        console.log("FROM TimeManagement: Adding to controls array");
        const existingControl = ui.controls.controls.find(c => c.name === "from-time-management");
        if (!existingControl) {
            ui.controls.controls.push({
                name: "from-time-management",
                title: "FROM Time Management",
                icon: "fas fa-clock",
                visible: true,
                tools: []
            });
            
            // Dodaj narzędzia
            const newControl = ui.controls.controls.find(c => c.name === "from-time-management");
            if (newControl) {
                addTimeManagementTools(newControl.tools);
                console.log("FROM TimeManagement: Own control category created (array)");
                ui.controls.render(true);
            }
        }
    } else if (ui.controls.controls && typeof ui.controls.controls === 'object') {
        // v13 - obiekt
        console.log("FROM TimeManagement: Adding to controls object");
        if (!ui.controls.controls["from-time-management"]) {
            ui.controls.controls["from-time-management"] = {
                name: "from-time-management",
                title: "FROM Time Management",
                icon: "fas fa-clock",
                visible: true,
                tools: {}
            };
            
            // Dodaj narzędzia bezpośrednio do obiektu
            addTimeManagementTools(null, ui.controls.controls["from-time-management"]);
            console.log("FROM TimeManagement: Own control category created (object)");
            ui.controls.render(true);
        }
    }
}

// Initialize the module
Hooks.once('init', () => {
    console.log("FROM Time Management: Initializing module...");
    TimeManagementSystem.initialize();
});

// Export for other modules
window.TimeManagementSystem = TimeManagementSystem;
export default TimeManagementSystem;