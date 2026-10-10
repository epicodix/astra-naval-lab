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

replace_once(
    '<div id="naval-duel" data-experiment="energetic-damage">',
    '<div id="naval-duel" data-experiment="energetic-damage" data-public-mode="" data-public-lang="ko" data-public-ready="false">',
)
fragment = fragment.replace('class="viz-controls"', 'class="viz-controls" inert')
fragment = fragment.replace('aria-label="교전 거리"', 'aria-label="교전 거리" data-distance-summary', 1)
fragment = fragment.replace('[aria-label="교전 거리"]', '[data-distance-summary]')
replace_once(
    "const energeticDamageExperiment=root.dataset.experiment",
    "const publicMode=root.dataset.publicMode||'';\n    const energeticDamageExperiment=root.dataset.experiment",
)
marker = "    if(directFireExperiment){const near=document.createElement('option');"
public_startup = """    if(publicMode==='preview'){
      clock=0;focus='yamato';trajectoryMode=false;focusInput.value=focus;trajectoryInput.checked=false;
    }
    const publicSavedBattle=window.openai?.widgetState;
    const publicHasSavedBattle=['duel-1','duel-2','duel-3','duel-4','duel-5','duel-6','duel-7','duel-8','duel-9','duel-10','duel-11','duel-12','duel-13','duel-14','duel-15'].includes(publicSavedBattle?.privateContent?.version)&&Number.isFinite(publicSavedBattle?.modelContent?.battle?.seed);
    if((publicMode==='battle'||publicMode==='maximum'||publicMode==='he')&&!publicHasSavedBattle){
      config={...config,seed:19440426,encounterMode:publicMode==='maximum'?'maximum':'set-range',rangeKm:publicMode==='maximum'?42:6,yamatoAmmo:publicMode==='he'?'he':'ap',iowaAmmo:publicMode==='he'?'he':'ap'};
      duel=buildBattle(config);clock=0;hasRun=true;speed=publicMode==='he'?1:4;focus='whole';speedInput.value=String(speed);focusInput.value=focus;yamatoAmmoInput.value=config.yamatoAmmo;iowaAmmoInput.value=config.iowaAmmo;
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
replace_once("privateContent:{version:tacticsExperiment?", "privateContent:{publicDraft:publicSettingsChanged()?readPublicSettings():null,version:tacticsExperiment?")
replace_once("iowaEvasion:String(snapshot.ships.iowa.maneuver?.evasionEffect||0)});", "iowaEvasion:String(snapshot.ships.iowa.maneuver?.evasionEffect||0)});\n      refreshPublicControls();")
replace_once("if(v.blastPreview&&['yamato','iowa'].includes(v.blastPreview.ship)&&[0,1,2].includes(v.blastPreview.turretIndex))showBlastPreview({...v.blastPreview,autoplay:false,restoring:true});", "if(v.blastPreview&&['yamato','iowa'].includes(v.blastPreview.ship)&&[0,1,2].includes(v.blastPreview.turretIndex))showBlastPreview({...v.blastPreview,autoplay:false,restoring:true});\n      restorePublicDraft(v.publicDraft);")
replace_once("restore(window.openai?.widgetState);window.addEventListener('openai:set_globals'", "restore(window.openai?.widgetState);if(publicMode!=='preview')persist();window.addEventListener('openai:set_globals'")
replace_once("loading.hidden=true;", "loading.hidden=true;root.dataset.publicReady='true';root.querySelectorAll('.viz-controls').forEach(control=>control.inert=false);")
# The build adds the public controls and display layer to the simulation source.
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
