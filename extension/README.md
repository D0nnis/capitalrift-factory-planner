# Capital Rift Factory Planner — Firefox extension

Reads the machines in your own Capital Rift buildings and hands them to the
Factory Planner at https://d0nnis.github.io/capitalrift-factory-planner/

## What it does

While you play, the game itself asks its server for the contents of a building.
This extension listens in on those answers and remembers which machines you own
and which recipe each one is set to. Nothing else is touched.

* **Read-only.** It never sends anything to the game and never changes anything
  in your account.
* **Your account only.** It sees exactly what your own browser already sees.
* **Local.** What it reads is stored in the browser and handed to the planner
  page. It is not uploaded anywhere.
* **No requests of its own.** It does not poll or crawl. If you never open a
  building, it reads nothing.

## Install for testing

1. Open `about:debugging#/runtime/this-firefox`
2. "Load Temporary Add-on…" and pick `manifest.json` from this folder
3. Open Capital Rift and sign in — that is enough for the extension to notice
   who you are
4. Click the toolbar icon, press **Read my factory**
5. Open the planner, go to **Game data → From the game**, press
   **Apply to productions**

No clicking through buildings: the game state lists your land holdings, each
holding names its buildings, and that is all `building-furniture` needs.

A temporary add-on is gone after you restart Firefox. For a permanent install
the file has to be signed by Mozilla — either published on addons.mozilla.org
or signed for self-distribution.

## Files

| File | Purpose |
|---|---|
| `manifest.json` | permissions and where the scripts run |
| `hook.js` | runs in the page, wraps fetch and XHR, catches the building responses |
| `game.js` | notes the player id, collects anything the game loads anyway |
| `background.js` | reads the game state, walks the land holdings, fetches every building |
| `dashboard.js` | hands the stored machines to the planner page |
| `popup.html` / `popup.js` | toolbar popup: counts, open planner, clear |

## Changing the planner address

`PLANNER` in `popup.js` and the `matches` entry for the dashboard in
`manifest.json` both point at the planner. Change both if you move it.
