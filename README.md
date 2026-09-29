# Sink Before Dawn

A complete local browser game for one hunter versus a computer captain, or two people sharing a device. The captain hides a three-section convoy on an 8 × 8 chart. The hunter has twelve searches to land three hits, using shots and four sonar scans. After each search the captain can shift the convoy one square or hold. Sonar reports intact sections inside a 3 × 3 area. Repeated shots are allowed because the convoy moves.

## Play

Open `index.html` in a browser, or upload the ZIP as an HTML5 game to itch.io with `index.html` at the archive root. If the browser restricts local storage under `file://`, serve the folder locally, for example `python3 -m http.server`.

For local two-player, create two profiles first. One places the convoy and the other hunts. An opaque handoff screen hides the current board when the device changes hands. Do not pass the device until that screen appears.

## Saves and scope

Profiles and the last 30 completed matches per profile are kept in browser local storage. Profiles can be exported as JSON and imported on another device; importing replaces this game's current profiles. A match in progress is not saved across refreshes. There is no remote matchmaking, account, or server.

The existing `convoy-hunt` save key is retained so profiles and records from the earlier build remain available when the game is updated at the same web address.

All rules, visuals, and code in this package are original to this release. This game does not use Battleship names, art, ships, or rule text.
