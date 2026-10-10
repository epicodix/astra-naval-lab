# ASTRA NAVAL LAB

**A browser-based 3D Yamato vs Iowa battleship simulator built in collaboration with GPT Astra.**

[Play in English](https://epicodix.github.io/astra-naval-lab/en.html) · [Watch a magazine explosion](https://epicodix.github.io/astra-naval-lab/simulator.html?preset=blast&lang=en) · [한국어 README](README.md)

Set the engagement range and sea conditions, then watch the ships maneuver and exchange fire. Follow shell trajectories, penetration paths, internal damage and magazine explosions. The human creator proposed features and details, and worked with GPT Astra on the ship models and simulation code.

## Features

- Yamato and Iowa ship models with animated main turrets, firing and reloading
- Aiming predictions, shell dispersion and flight paths, with impact checks connected to the actual contact position
- Damage to machinery, electrical power and ammunition feeds along a shell's internal path
- Fire, flooding, damage control and magazine explosions
- Operator and repair-party losses, shared response capacity and accumulated damage to local structure
- Independent AP / HE selection for each ship, with distinct impact blasts, fragments and ignition
- Fuel leaks and fires caused by actual internal damage, with finite fuel and shared firefighting capacity
- Playback, pause, timeline seeking and slow motion

This is a **game model inspired by historical ships and equipment**. Ballistics, armor, damage and explosion probabilities use approximations; this project is not a calibrated military simulation. A small number of vital penetrations can be lethal, but the simulation does not trigger an explosion simply because a hit counter reaches a threshold.

In v12, operator and repair-party percentages represent **remaining capacity**, not actual casualty counts. Internal shell paths expose specific compartments to blast and fragments; damage weakens their structure and increases the effect of later impacts in the same area. Lost personnel capacity does not return during the battle. A finite pool of repair parties is shared across firefighting, pumping, cooling and equipment repairs. **Disable magazine-system repairs** stops only repairs to magazine equipment; automatic damage response still operates within the remaining capacity. Loss of operating capability is recorded as **combat ineffective**, separately from sinking.

In v13, AP favors penetration into protected systems; HE produces a larger local blast, fragments and surface fire, with less penetration and a shorter internal path. HE stopped at the outer hull cannot damage deep machinery or stored charges just because the impact is labeled as their region. Actual internal paths can rupture the modeled fuel systems in machinery spaces. Leaks need an ignition source and loss of containment before they burn, and the fire consumes finite fuel while competing for the same repair parties. Fuel fires and magazine explosions remain separate events: a full tank or magazine does not automatically explode. This is not a historical shell damage table.

v14 connects muzzle speed, air drag and gravity in one flight equation. It solves the lower firing angle and flight time together using current range and target motion. Free flight starts at the articulated muzzle along its bore; collision detection, visible shells and observed trails use that same path. Dashed lines show the launch-time prediction without dispersion; solid lines show the path already traveled. Ships are enlarged relative to separation to show detail, so the whole scene is not to scale. Ship knots and shell m/s use simulation time: 1× plays one simulation second per real second. Drag is a game approximation fitted to the range envelope, rather than an exact reconstruction of every historical firing-table entry.

v15 adds per-ship **Repair focus / Balanced doctrine / Attack focus** orders during battle as a game experiment. The same available crew capacity is divided between gunnery and damage response. Attack focus accelerates loading and aiming corrections while weakening damage response. Its **×1.8 incoming critical risk** and **×1.5 outgoing central-penetration critical risk** are conditional relative multipliers for actual internal vital paths, not hit or instant-sinking probabilities. A salvo has a shared aiming error plus per-barrel range and lateral dispersion. Stable target tracking modestly improves first-shot confidence; only observed arrivals inform corrections. Maneuvering, smoke and fire-control damage reduce confidence. Orders affect the current and future battle; airborne shells retain their launch conditions. Orders persist and replay. Seeking backward and issuing a new order replaces the orders after that point with the new choice.

v16 gives all **nine main guns independent loading and release times**. Each gun predicts the moving target from its currently observed velocity and smoothed turn rate, then iterates the aim point with that muzzle’s flight time. It never reads the target’s actual future route. It reduces the excessive shared salvo error and uses observed individual arrivals for gradual corrections. Feed, barrel and turret-crew damage restrict the affected guns; doctrine changes also rescale loading already in progress. The display shows each gun’s remaining loading time and readiness.

Reference muzzle speeds: Yamato AP **780 m/s**, common shell (HE approximation) **805 m/s**; Iowa AP **762 m/s**, HC (HE) **819.9 m/s**. Sources: contemporary US Navy [Yamato report O-45(N), pp. 16–17](https://www.fischer-tropsch.org/primary_documents/gvt_reports/USNAVY/USNTMJ%20Reports/USNTMJ-200F-0384-0445%20Report%20O-45%20N.pdf) and [OP1188 firing tables, pp. 61–62](https://www.eugeneleeslover.com/ENGINEERING/OP1188/OP1188_Abridged_Range_Tables_1944.pdf).

## Run locally

From this directory, run:

```sh
python3 -m http.server 8080
```

Then open [the English landing page](http://localhost:8080/en.html). `index.html` is the Korean landing page, `en.html` is the English landing page, and `simulator.html` is the playable simulation. Choose 한국어 or English from the page navigation. Simulator URLs accept `lang=ko` or `lang=en`.

A recent desktop browser with WebGL support is recommended. No npm install or build is required to play. The simulation runs in the browser and does not call GPT during gameplay. It needs no API key, account, game server or database. The deployed version loads Three.js r128 and OrbitControls from a CDN, so it needs an internet connection for the first load.

### Presets

| URL | Initial scene |
| --- | --- |
| `simulator.html?preset=battle&lang=en` | A 6 km engagement, with playback speed set to 4× |
| `simulator.html?preset=blast&lang=en` | Just before a magazine explosion in a simulated battle, at 0.25× speed |
| `simulator.html?preset=maximum&lang=en` | A 42 km encounter, with playback speed set to 4× |
| `simulator.html?preset=he&lang=en` | A 6 km encounter with both ships using HE, at 1× speed |
| `simulator.html?preset=preview&lang=en` | The Yamato exterior preview used on the landing page |

The landing page's main start button opens a **42 km encounter**. Close-range battles and explosion scenes have separate links. Fresh-start links use `fresh=1` to skip saved state; that flag is removed after loading, so later refreshes restore the current battle. Resume saved battle opens the saved long-range preset session. Without a preset, the simulator starts with a maximum-range encounter.

Battles open paused. Play resumes the current battle. Editing battle conditions displays a pending-changes notice; **Apply settings and restart** or **New battle** uses those selections and a new random seed. **Replay this battle** retains the currently applied conditions and seed. Sea state, playback speed, camera, cutaway and trajectory controls apply immediately. Pending settings survive refreshes and language switching.

Saved v11–v15 battles restore and replay with their original damage and ballistics. **New battle** or **Apply settings and restart** starts a new run with v16 individual guns and motion prediction, operating choices, ballistics and damage models.

## Edit and rebuild

Edit `source/simulation.html` for ship models and simulation logic, or `source/player-template.html` for the standalone player and browser state storage. From this directory, run:

```sh
python3 tools/build.py
```

The build uses the Python standard library and regenerates `simulator.html`. Direct edits to that generated file are overwritten by the next build. Commit the regenerated player whenever its sources change. Edit landing page text directly in `index.html` and `en.html`; their shared styles live in `assets/site.css`.

English display strings live in `assets/simulation-en.json`; `source/simulation-i18n.js` translates the interface without changing simulation state. Language switching preserves the current battle, playback and camera. Both languages share saved state for the same preset.

`source/public-controls.js` manages applied settings, pending changes and draft restoration. The build inserts it into the original simulator's execution scope.

## GitHub Pages deployment

The repository keeps editable sources on `main` and serves public files from the root of `gh-pages`. Publish `index.html`, `en.html`, `simulator.html`, `.nojekyll`, `assets/`, `sitemap.xml` and `robots.txt` to that branch. In **Settings → Pages**, select **Deploy from a branch**, **gh-pages**, **/(root)**. No custom Actions workflow is needed. See [GitHub's publishing-source documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

The Korean and English landing pages have separate URLs, reciprocal `hreflang` links and a canonical URL for each language. `sitemap.xml` lists both pages. These make the language versions easier for search engines to interpret; indexing or ranking is not guaranteed. A project-level `robots.txt` is included for portability, but on GitHub project Pages the effective crawler rules belong to the host's root `/robots.txt`.

**Built with GPT Astra.**
