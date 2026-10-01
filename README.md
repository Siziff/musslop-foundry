# musslop-foundry

**Adaptive music loops for Foundry VTT, prepared in [musslop](https://github.com/Siziff/musslop).**

Export a track from musslop, import the zip here, and run the soundtrack at the virtual table the way musslop runs it at a physical one: a section loops for as long as the scene needs, a cue lands the next section **on the loop or phrase boundary**, scenes have hotkeys — and **every connected player hears the same thing**.

- Sample-accurate loops (each pass is its own `AudioBufferSourceNode` on Foundry's music context).
- Transitions: **at loop end · at phrase · right away** — the GM's decisions are broadcast over the module socket; each client renders them on its own audio clock, late joiners get a state snapshot.
- Scenes from musslop (`Shift+Alt+1…9`), post-exit tails, one-shot build-ups.
- A **desk** window: tracks, now / next with ETA, scene and part pads, Next / Cancel / Fade out, per-client volume.
- Macro API: `game.modules.get("musslop-foundry").api` → `load(slug)`, `play(i)`, `cue(i, mode)`, `scene(name)`, `next()`, `cancel()`, `stop()`, `fade(sec)`.

Works with Foundry **v12 and v13**.

## Install

Foundry → *Add-on Modules* → *Install Module* → paste the manifest URL:

```
https://github.com/Siziff/musslop-foundry/releases/latest/download/module.json
```

Enable it in your world. The GM gets a music-note button in the **Sounds** scene controls (`Alt+M` toggles the desk).

## Workflow

1. In **musslop**: prepare the track (sections, loop flags, scenes, crossfade) → **Files → Foundry VTT (zip)**.
2. In **Foundry** (GM): open the desk → **Import ZIP** → pick `*_foundry.zip`. Files land in `Data/musslop/<track>/`.
   *Hosted Foundry (Forge etc.)*: upload the unpacked folder to `musslop/<track>/` with the file browser instead.
3. Select the track, press **Play**, cue parts or scenes. Players need no setup — audio starts on their first interaction with the page (browser autoplay rule), after that it follows the GM.

### Without the module

The zip also contains `foundry-playlist.json`: unpack the folder into `Data/musslop/<track>/`, then *Playlists → right-click → Import Data*. You get a normal Foundry playlist with every section as a repeating sound (no boundary-aware transitions, but it works everywhere).

## Keybindings (GM, configurable in *Configure Controls*)

| Key | Action |
|---|---|
| `Alt+M` | open / close the desk (everyone) |
| `Alt+→` | Next |
| `Alt+Backspace` | cancel the queued transition |
| `Alt+F` | fade out |
| `Shift+Alt+1…9` | scene with that hotkey |

## How sync works

The GM's client is the conductor. It sends *decisions* (`play part 3`, `cue part 5 at file position 7.27 s`, `cancel`, `fade`) — never audio. Each player's client holds the same decoded loops and schedules them on its own `AudioContext`; a periodic snapshot (`part, position, pending target`) corrects drift larger than 400 ms and brings late joiners in mid-loop. Volume is per client.

## Development

No build step: plain ES modules. Clone into `Data/modules/musslop-foundry/`, reload Foundry. `scripts/loop-player.js` has no Foundry dependencies and can be tested in a bare page (see the musslop repo's export format: `manifest.json` with `loops[]`, `scenes[]`).

MIT — same as musslop.
