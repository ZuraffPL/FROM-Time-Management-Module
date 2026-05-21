# AGENTS.md — FROM Time Management Module | Foundry VTT v13+

## Rola i kontekst projektu

Jesteś agentem kodującym **moduł** dla Foundry VTT v13+.
Projekt: **FROM Time Management System** — moduł do zarządzania czasem i śledzenia aktywności agentów podczas sesji Delta Green RPG.

> **WAŻNE:** To jest **moduł** (`"type": "module"` w `module.json`), nie system RPG.
> Moduł działa na dowolnym systemie i nie definiuje własnych Document types (Actor, Item).
> Dostęp do danych — wyłącznie przez `game.settings` i flagi dokumentów (`document.setFlag`).

Identyfikator modułu: `"from-time-management"` — używaj go konsekwentnie wszędzie.

---

## OBOWIĄZKOWE zasady API Foundry v13+

### 1. ApplicationV2 — jedyna dopuszczalna klasa okien

- ZAWSZE dziedzicz po `foundry.applications.api.ApplicationV2`.
- NIGDY nie używaj przestarzałego `Application` (V1).
- Jeśli okno używa szablonów HBS (`static PARTS`), **OBOWIĄZKOWO** użyj miksinu `HandlebarsApplicationMixin`:
  ```js
  const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
  export class MyModuleApp extends HandlebarsApplicationMixin(ApplicationV2) { ... }
  ```
  Bez tego miksinu `ApplicationV2` jest klasą abstrakcyjną i nie można jej renderować — Foundry rzuci błąd `_renderHTML and _replaceHTML not implemented`.
- Konfigurację okna definiuj przez `static DEFAULT_OPTIONS`:

```js
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class MyModuleApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "from-time-management-my-app",
    classes: ["from-time-management", "my-app"],
    window: {
      title: "FROM.MyApp.Title",
      resizable: true,
    },
    position: { width: 600, height: "auto" },
    actions: {
      myAction: MyModuleApp.#onMyAction,
    },
  };

  static PARTS = {
    main: { template: "modules/from-time-management/templates/my-app.hbs" },
  };

  async _prepareContext(options) {
    return {
      // dane do szablonu
    };
  }

  static #onMyAction(event, target) {
    // obsługa akcji — metoda statyczna, this = instancja
  }
}
```

- Lifecycle hooks do nadpisywania: `_prepareContext()`, `_onRender()`, `_onClose()`, `_onFirstRender()`.
- Zdarzenia UI obsługuj przez `actions` w `DEFAULT_OPTIONS` (preferowane) lub `_onRender()`.

### 2. DialogV2 — jedyna dopuszczalna klasa dialogów

- ZAWSZE używaj `foundry.applications.api.DialogV2`.
- NIGDY nie używaj przestarzałego `Dialog` (V1).

```js
// Potwierdzenie
const confirmed = await foundry.applications.api.DialogV2.confirm({
  window: { title: game.i18n.localize("FROM.Dialog.ConfirmTitle") },
  content: `<p>${game.i18n.localize("FROM.Dialog.ConfirmBody")}</p>`,
  yes: { callback: () => true },
  no: { callback: () => false },
});

// Własny dialog
const result = await foundry.applications.api.DialogV2.wait({
  window: { title: "..." },
  content: "<form>...</form>",
  buttons: [
    { label: "OK", action: "ok", callback: (event, btn, dialog) => new FormDataExtended(dialog.querySelector("form")).object },
    { label: "Anuluj", action: "cancel", callback: () => null },
  ],
});
```

### 3. Natywne DOM API — bez jQuery

- ZAWSZE używaj natywnego DOM: `querySelector`, `querySelectorAll`, `addEventListener`, `closest()`, `classList`, `dataset`.
- NIGDY nie używaj `$()`, `.find()`, `.on()` ani żadnych metod jQuery.

```js
// ✅ Poprawnie
_onRender(context, options) {
  this.element.querySelector(".my-button").addEventListener("click", this.#onButtonClick.bind(this));
  this.element.querySelectorAll(".row").forEach(row => row.classList.toggle("active", row.dataset.id === context.activeId));
}

// ❌ Nigdy
$(this.element).find(".my-button").on("click", handler);
```

---

## Zarządzanie stanem modułu — game.settings

Moduł nie ma własnych Document types. Stan przechowuj wyłącznie w `game.settings`.

### Rejestracja ustawień

- Rejestruj WYŁĄCZNIE w hooku `Hooks.once("init", ...)`.
- Scope: `"world"` dla danych synchronizowanych między graczami, `"client"` dla preferencji lokalnych.
- `config: false` dla danych wewnętrznych (niewidocznych w konfiguracji dla użytkownika).
- `config: true` dla ustawień widocznych użytkownikowi.

```js
Hooks.once("init", () => {
  game.settings.register("from-time-management", "gameTime", {
    name: "FROM.Settings.GameTime.Name",
    hint: "FROM.Settings.GameTime.Hint",
    scope: "world",
    config: false,
    type: Object,
    default: { day: 1, hour: 8, minute: 0, year: 2025 },
    onChange: (value) => Hooks.callAll("from-time-management.timeChanged", value),
  });
});
```

- Używaj `onChange` callback do reaktywnego odświeżania UI po zmianie ustawień.
- Nigdy nie parsuj ręcznie JSON z ustawień — używaj `type: Object` i pozwól Foundry zarządzać serializacją.

### Odczyt i zapis

```js
// Odczyt
const time = game.settings.get("from-time-management", "gameTime");

// Zapis (tylko GM może zapisywać scope: "world")
await game.settings.set("from-time-management", "gameTime", { day: 2, hour: 10, minute: 30, year: 2025 });
```

### Flagi dokumentów

Do danych przywiązanych do konkretnego dokumentu (aktora, sceny, użytkownika) używaj flag:

```js
// Zapis
await actor.setFlag("from-time-management", "activityLog", []);

// Odczyt
const log = actor.getFlag("from-time-management", "activityLog") ?? [];

// Usunięcie
await actor.unsetFlag("from-time-management", "activityLog");
```

---

## Synchronizacja multiplayer — Socket

Moduł korzysta z `"socket": true` w `module.json`. Zasady:

- Socket służy WYŁĄCZNIE do powiadamiania klientów o zmianach — nie do przesyłania danych.
- Dane pobieraj zawsze z `game.settings` po otrzymaniu sygnału.
- GM jest właścicielem zapisu — klienci proszą GM o zapis przez socket.

```js
// Inicjalizacja nasłuchiwania
Hooks.once("ready", () => {
  game.socket.on("module.from-time-management", (data) => {
    switch (data.type) {
      case "timeChanged":
        // odśwież UI — dane już są w game.settings
        MyApp.instance?.render();
        break;
      case "requestUpdate":
        // tylko GM może zapisywać
        if (game.user.isGM) {
          game.settings.set("from-time-management", data.key, data.value);
        }
        break;
    }
  });
});

// Emisja (tylko GM)
if (game.user.isGM && game.socket) {
  game.socket.emit("module.from-time-management", { type: "timeChanged" });
}
```

- NIGDY nie emituj wrażliwych danych przez socket — tylko klucze i typy zdarzeń.
- Obsługuj przypadek, gdy `game.socket` jest `null` (np. w trybie bez serwera).

---

## Lokalizacja — game.i18n

- ZAWSZE używaj `game.i18n.localize("FROM.klucz")` lub `game.i18n.format("FROM.klucz", { zmienna })`.
- NIGDY nie hardcoduj polskich ani angielskich tekstów bezpośrednio w kodzie lub szablonach.
- Klucze tłumaczeń umieszczaj w `lang/en.json` (bazowy) i `lang/pl.json`.
- Pliki JSON muszą być płaskie lub maksymalnie jednopiętrowe — Foundry nie obsługuje głębokiego zagnieżdżenia:

```json
{
  "FROM.Dialog.Title": "Time Management",
  "FROM.Dialog.ConfirmReset": "Are you sure you want to reset the time?",
  "FROM.Agent.Name": "Agent Name",
  "FROM.Settings.GameTime.Name": "Current Game Time"
}
```

- Konwencja kluczy: `FROM.KategoriaPodkategoria.Etykieta` (PascalCase po pierwszej kropce).

---

## Struktura plików i konwencje modułu

```
from-time-management/
├── main.mjs              # Punkt wejścia — tylko import + Hooks init/ready
├── module.json           # Manifest modułu
├── scripts/              # Logika aplikacji
│   ├── time-management-dialog.js   # Główne okno zarządzania czasem
│   ├── agent-tracker-dialog.js     # Tracker agentów
│   ├── action-queue-dialog.js      # Kolejka akcji
│   └── action-selection-dialog.js  # Dialog wyboru akcji
├── templates/            # Szablony Handlebars (*.hbs)
├── styles/               # Style CSS
│   └── time-management.css
└── lang/                 # Lokalizacje
    ├── en.json
    └── pl.json
```

### Zasady organizacji kodu

- `main.mjs` zawiera TYLKO: importy klas, `Hooks.once("init")` z rejestracją ustawień, `Hooks.on("getSceneControlButtons")`, `Hooks.once("ready")`.
- Logika biznesowa i UI — wyłącznie w plikach `scripts/`.
- Każda klasa okna w osobnym pliku.
- Nie twórz pliku `utils.js` na siłę — helpery umieszczaj w pliku klasy, która ich używa, chyba że są współdzielone przez ≥2 klasy.

---

## Konwencje kodu — JavaScript

- Standard: **ES2022+**, natywne klasy, `async/await`, bez transpilacji, bez bundlera.
- Importy: ścieżki relatywne (`./scripts/my-dialog.js`), bez rozszerzenia `.mjs` w importach z `.js`.
- Nazewnictwo:
  - Klasy: `PascalCase` (np. `TimeManagementDialog`)
  - Zmienne i metody publiczne: `camelCase`
  - Metody prywatne klasy: prefix `#` (private class fields) lub `_` (convention)
  - Stałe modułowe: `SCREAMING_SNAKE_CASE`
  - ID elementów HTML: `kebab-case` z prefiksem `from-` (np. `from-agent-list`)
- Komentarze: po polsku lub angielsku, zwięźle — tylko gdzie kod nie jest oczywisty.

---

## Foundry Utils — obowiązkowe użycie

ZAWSZE używaj `foundry.utils.*` zamiast pisać własne implementacje:

| Potrzeba | Użyj |
|---|---|
| Klonowanie obiektu | `foundry.utils.deepClone(obj)` |
| Łączenie obiektów | `foundry.utils.mergeObject(target, source)` |
| Diff obiektów | `foundry.utils.diffObject(original, other)` |
| Rozwinięcie flat object | `foundry.utils.expandObject(flat)` |
| Spłaszczenie obiektu | `foundry.utils.flattenObject(nested)` |
| Bezpieczny getter | `foundry.utils.getProperty(obj, "a.b.c")` |
| Bezpieczny setter | `foundry.utils.setProperty(obj, "a.b.c", val)` |
| Sprawdzenie właściwości | `foundry.utils.hasProperty(obj, "a.b.c")` |
| Unikalny ID | `foundry.utils.randomID()` |
| Debounce | `foundry.utils.debounce(fn, delay)` |
| Sprawdzenie dziedziczenia | `foundry.utils.isSubclass(cls, parent)` |
| Fetch JSON | `foundry.utils.fetchJsonWithTimeout(url)` |

- ❌ Nie twórz własnych funkcji `clone`, `merge`, `deepEqual`, `generateId` itp.
- ❌ Nie twórz własnego systemu eventów — używaj `Hooks` API Foundry.
- ❌ Nie definiuj stałych pokrywających się z `CONST.*` Foundry.

---

## Handlebars — szablony i helpery

### Szablony (*.hbs)

- Umieszczaj w `templates/` z opisową nazwą: `time-management-main.hbs`, `agent-tracker.hbs`.
- Ścieżka w `PARTS`: `"modules/from-time-management/templates/nazwa.hbs"`.
- Używaj natywnych helperów Foundry: `{{localize}}`, `{{eq}}`, `{{ne}}`, `{{gt}}`, `{{concat}}`, itp.
- Nie buduj dynamicznych inputów ręcznie gdy można użyć `{{formInput}}` (dotyczy danych z DataModel).

### Własne helpery Handlebars

- Rejestruj TYLKO jeśli nie istnieje natywny odpowiednik w Foundry.
- ZAWSZE używaj prefiksu `from-` aby uniknąć konfliktów:

```js
Handlebars.registerHelper("from-formatTime", (hour, minute) => {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
});
```

- NIGDY nie nadpisuj helperów Foundry: `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `and`, `or`, `not`, `concat`, `localize`.
- Rejestruj helpery w `Hooks.once("init")` w `main.mjs`.

---

## Buttons kontrolek sceny — getSceneControlButtons

Moduł dodaje własną grupę kontrolek. Zasady dla Foundry v13+:

```js
Hooks.on("getSceneControlButtons", (controls) => {
  // v13: controls to obiekt, nie tablica
  controls["from-time-management"] = {
    name: "from-time-management",
    title: game.i18n.localize("FROM.Controls.GroupTitle"),
    icon: "fas fa-clock",
    tools: {
      timeManagement: {
        name: "timeManagement",
        title: game.i18n.localize("FROM.Controls.TimeManagement"),
        icon: "fas fa-clock",
        visible: game.user.isGM,    // widoczność kontroli uprawnień
        onChange: () => TimeManagementDialog.show(),
        button: true,
      },
    },
  };
});
```

- Kontrolki widoczne tylko dla GM oznaczaj `visible: game.user.isGM`.
- Nigdy nie polegaj na hooku `renderSceneControls` do dodawania przycisków — używaj `getSceneControlButtons`.

---

## Bezpieczeństwo i uprawnienia

- Sprawdzaj `game.user.isGM` przed każdą operacją zapisu `game.settings` z `scope: "world"`.
- Sprawdzaj własność aktora przed modyfikacją jego flag: `actor.isOwner`.
- Nigdy nie przyjmuj danych z socketu bez walidacji — weryfikuj typ i strukturę wiadomości:

```js
game.socket.on("module.from-time-management", (data) => {
  if (!data || typeof data !== "object" || !data.type) return;
  if (data.type === "requestUpdate" && !game.user.isGM) return; // blokuj nieuprawnionych
  // ...
});
```

- Nie wyświetlaj wrażliwych danych w logach konsoli (poza trybem debug).

---

## Wzorzec Singleton dla okien modułu

Większość okien modułu powinna być singletonami (jedno okno na raz):

```js
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class TimeManagementDialog extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "from-time-management-main",   // stałe id = naturalny singleton w Foundry
    // ...
  };

  // Statyczna metoda fabryczna — otwiera lub skupia istniejące okno
  static show() {
    const existing = foundry.applications.instances.get("from-time-management-main");
    if (existing) {
      existing.bringToTop();
      return existing;
    }
    return new TimeManagementDialog().render(true);
  }
}
```

- Stałe `id` w `DEFAULT_OPTIONS` gwarantuje singleton — Foundry zapobiega duplikatom.
- Używaj `foundry.applications.instances.get(id)` do sprawdzenia, czy okno jest otwarte.

---

## Lista zakazów (❌ NIGDY)

| Zakaz | Zamiast tego użyj |
|---|---|
| `Application` (V1) | `foundry.applications.api.ApplicationV2` |
| `ApplicationV2` bez `HandlebarsApplicationMixin` gdy używasz `PARTS` | `HandlebarsApplicationMixin(ApplicationV2)` — bez tego błąd `_renderHTML not implemented` |
| `Dialog` (V1) | `foundry.applications.api.DialogV2` |
| jQuery `$()`, `.find()`, `.on()` | Natywne DOM API |
| `actor.data.data.*` | `actor.system.*` (nie dotyczy modułu bezpośrednio) |
| `mergeObject(...)` (global) | `foundry.utils.mergeObject(...)` |
| `duplicate(obj)` | `foundry.utils.deepClone(obj)` |
| `JSON.stringify/parse` dla settings | `type: Object` w `game.settings.register` |
| Własne event systemy | `Hooks.on()` / `Hooks.callAll()` |
| Hardkodowane teksty w kodzie/HBS | `game.i18n.localize("FROM.klucz")` |
| Helpery HBS bez prefiksu `from-` | `Handlebars.registerHelper("from-nazwaHelpera", ...)` |
| Nadpisywanie helperów Foundry | Używaj istniejących helperów |
| Rejestracja settings poza `init` | `Hooks.once("init", ...)` |
| Emisja danych przez socket | Emituj tylko typy zdarzeń, dane trzymaj w settings |

---

## Niepewny co do API v13?

Jeśli jakiś fragment API Foundry v13 jest Ci nieznany lub niepewny:
1. Powiedz to wprost.
2. Zaproponuj rozwiązanie z adnotacją `// TODO: verify against Foundry v13 API`.
3. Nie generuj kodu opartego na V1 API jako fallbacku — lepiej zostawić TODO.
