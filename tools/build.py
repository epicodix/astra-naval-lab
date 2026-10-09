"""Build the portable player from its readable simulation source (stdlib only)."""
from html import escape
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
fragment = (ROOT / "source/simulation.html").read_text(encoding="utf-8")
template = (ROOT / "source/player-template.html").read_text(encoding="utf-8")

def replace_once(old, new):
    global fragment
    if fragment.count(old) != 1:
        raise ValueError(f"Public player insertion point changed: {old[:80]}")
    fragment = fragment.replace(old, new, 1)

fragment = fragment.replace(
    '<div id="naval-duel" data-experiment="vital-hits">',
    '<div id="naval-duel" data-experiment="vital-hits" data-public-mode="" data-public-lang="ko" data-public-ready="false">', 1,
)
fragment = fragment.replace('class="viz-controls"', 'class="viz-controls" inert')
fragment = fragment.replace('aria-label="교전 거리"', 'aria-label="교전 거리" data-distance-summary', 1)
fragment = fragment.replace('[aria-label="교전 거리"]', '[data-distance-summary]')
fragment = fragment.replace(
    "const vitalHitsExperiment=root.dataset.experiment",
    "const publicMode=root.dataset.publicMode||'';\n    const vitalHitsExperiment=root.dataset.experiment", 1,
)
marker = "    if(directFireExperiment){const near=document.createElement('option');"
public_startup = """    if(publicMode==='preview'){
      clock=0;focus='yamato';trajectoryMode=false;focusInput.value=focus;trajectoryInput.checked=false;
    }
    if(publicMode==='battle'||publicMode==='maximum'){
      config={...config,seed:19440426,encounterMode:publicMode==='maximum'?'maximum':'set-range',rangeKm:publicMode==='maximum'?42:6};
      duel=buildBattle(config);clock=0;hasRun=true;speed=4;focus='whole';speedInput.value='4';focusInput.value=focus;
    }
"""
if fragment.count(marker) != 1:
    raise ValueError("Public startup insertion point changed")
fragment = fragment.replace(marker, public_startup + marker, 1)
fragment = fragment.replace(
    "rangeInput.value=String(config.rangeKm);encounterInput.value=config.encounterMode;",
    "rangeInput.value=String(config.encounterMode==='maximum'?18:config.rangeKm);encounterInput.value=config.encounterMode;", 1,
)
controls = (ROOT / 'source/public-controls.js').read_text(encoding='utf-8')
replace_once("    start.addEventListener('click',()=>begin(true));", controls + "\n    start.addEventListener('click',()=>begin(true));")
replace_once("privateContent:{version:vitalHitsExperiment?", "privateContent:{publicDraft:publicSettingsChanged()?readPublicSettings():null,version:vitalHitsExperiment?")
replace_once("iowaEvasion:String(snapshot.ships.iowa.maneuver?.evasionEffect||0)});", "iowaEvasion:String(snapshot.ships.iowa.maneuver?.evasionEffect||0)});\n      refreshPublicControls();")
replace_once("if(v.blastPreview&&['yamato','iowa'].includes(v.blastPreview.ship)&&[0,1,2].includes(v.blastPreview.turretIndex))showBlastPreview({...v.blastPreview,autoplay:false,restoring:true});", "if(v.blastPreview&&['yamato','iowa'].includes(v.blastPreview.ship)&&[0,1,2].includes(v.blastPreview.turretIndex))showBlastPreview({...v.blastPreview,autoplay:false,restoring:true});\n      restorePublicDraft(v.publicDraft);")
replace_once("restore(window.openai?.widgetState);window.addEventListener('openai:set_globals'", "restore(window.openai?.widgetState);if(publicMode!=='preview')persist();window.addEventListener('openai:set_globals'")
replace_once("loading.hidden=true;", "loading.hidden=true;root.dataset.publicReady='true';root.querySelectorAll('.viz-controls').forEach(control=>control.inert=false);")
# Only the public cover changes presentation. The original physics source stays frozen.
fragment += """
<style>
#naval-duel[data-public-mode="preview"] > :not(.duel-stage){display:none!important}
#naval-duel[data-public-mode="preview"] .duel-stage{height:100vh}
#naval-duel[data-public-mode="preview"] .duel-scale{display:none}
#naval-duel [data-public-settings]{padding:12px 14px;margin-block:10px;border:1px solid var(--border);border-radius:8px}
#naval-duel [data-public-applied-summary]{gap:6px 14px}
#naval-duel [data-public-settings-notice]{flex:1;min-width:180px;line-height:1.6}
#naval-duel [data-public-settings] > .viz-row + .viz-row{margin-top:10px}
#naval-duel [data-public-settings][data-pending="true"]{border-color:var(--primary)}
#naval-duel [data-public-apply][hidden]{display:none}
#naval-duel .viz-controls[inert]{opacity:.45}
</style>
"""
catalog = json.loads((ROOT / 'assets/simulation-en.json').read_text(encoding='utf-8'))
catalog_json = json.dumps(catalog, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c')
fragment += '<script type="application/json" id="astra-english-catalog">' + catalog_json + '</script>\n'
fragment += '<script>' + (ROOT / 'source/simulation-i18n.js').read_text(encoding='utf-8').replace('</script', '<\\/script') + '</script>\n'
if template.count("__ASTRA_SIMULATION_FRAGMENT__") != 1:
    raise ValueError("Player template needs exactly one fragment placeholder")
document = template.replace("__ASTRA_SIMULATION_FRAGMENT__", escape(fragment))
(ROOT / "simulator.html").write_text(document, encoding="utf-8")
print(f"Built simulator.html ({len(document.encode('utf-8')):,} bytes)")
