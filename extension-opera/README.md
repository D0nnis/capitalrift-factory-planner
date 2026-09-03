# Capital Rift Factory Planner — Opera extension

Reads the machines in your own Capital Rift buildings and hands them to the
Factory Planner at https://d0nnis.github.io/capitalrift-factory-planner/

This is the same extension as the Firefox one, packaged for Chromium-based
browsers. It also works unmodified in Chrome, Edge, Brave and Vivaldi.

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

1. Download the zip and unpack it somewhere you will keep it — Opera loads the
   folder from disk, so deleting it later removes the extension.
2. Open `opera://extensions` (paste that into the address bar).
3. Turn on **Developer mode** with the toggle in the top-right corner.
4. Click **Load unpacked** and choose the unpacked folder (the one containing
   `manifest.json`).
5. Open Capital Rift and sign in — that is enough for the extension to notice
   who you are.
6. Click the toolbar icon, press **Read my factory**.
7. Open the planner, go to **Game data → From the game**, press
   **Apply to productions**.

No clicking through buildings: the game state lists your land holdings, each
holding names its buildings, and that is all `building-furniture` needs.

An unpacked extension stays installed across restarts (unlike Firefox's
temporary add-ons), but Opera may occasionally warn that it's not from the
add-ons store — that's expected for a self-distributed extension like this one.

## Files

| File | Purpose |
|---|---|
| `manifest.json` | permissions and where the scripts run (Chromium/MV3 form) |
| `hook.js` | runs in the page, wraps fetch and XHR, catches the building responses |
| `game.js` | notes the player id, collects anything the game loads anyway |
| `background.js` | reads the game state, walks the land holdings, fetches every building |
| `dashboard.js` | hands the stored machines to the planner page |
| `popup.html` / `popup.js` | toolbar popup: counts, open planner, clear |

## Changing the planner address

`PLANNER` in `popup.js` and the `matches` entry for the dashboard in
`manifest.json` both point at the planner. Change both if you move it.
