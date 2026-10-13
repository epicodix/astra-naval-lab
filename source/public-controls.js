    // Public-player controls. This snippet runs inside the existing simulator closure.
    const publicSettingKeys=['shieldMode','encounterMode','rangeKm','rangePolicy','visibility','accuracyScale','maneuverMode','repairPolicy','magazineRisk','magazinePropagation','yamatoAmmo','iowaAmmo'];
    const publicConditionInputs=[shieldInput,encounterInput,rangeInput,rangePolicyInput,visibilityInput,accuracyInput,maneuverInput,repairInput,magazineRiskInput,propagationInput,yamatoAmmoInput,iowaAmmoInput];
    const publicConditionLabels={
      shieldMode:{none:'일반 함포전','energy-shell':'SF 방어 실드'},
      visibility:{clear:'맑음',haze:'박무',night:'야간'},
      maneuverMode:{evasive:'지그재그 기동',steady:'안정 항해'},
      rangePolicy:{hold:'거리 유지',close:'접근 교전'},
      repairPolicy:{balanced:'균형 대응','magazine-priority':'탄약고 설비 우선',none:'탄약고 설비 수리 중지'},
      magazineRisk:{normal:'기본',high:'높음 · 실험'},
      magazinePropagation:{isolated:'구획별',chain:'연쇄 전파 · 실험'},
      yamatoAmmo:{ap:'철갑탄 · AP',he:'고폭탄 · HE'},
      iowaAmmo:{ap:'철갑탄 · AP',he:'고폭탄 · HE'}
    };
    const publicSettingsPanel=document.createElement('div');
    publicSettingsPanel.className='card text-small';
    publicSettingsPanel.setAttribute('data-public-settings','');
    const publicAppliedSummary=document.createElement('div');
    publicAppliedSummary.className='viz-row';
    publicAppliedSummary.setAttribute('data-public-applied-summary','');
    publicAppliedSummary.setAttribute('aria-label','현재 교전 조건');
    const publicAppliedHeading=document.createElement('strong');
    publicAppliedHeading.textContent='현재 교전 조건';
    publicAppliedSummary.appendChild(publicAppliedHeading);
    const publicDamageModel=document.createElement('span');
    publicDamageModel.setAttribute('data-public-damage-model','');
    publicAppliedSummary.appendChild(publicDamageModel);
    const publicKinematics=document.createElement('span');publicKinematics.setAttribute('data-public-kinematics','');publicAppliedSummary.appendChild(publicKinematics);
    const publicScaleNote=document.createElement('div');publicScaleNote.className='text-small text-muted';publicScaleNote.setAttribute('data-public-scale-note','');publicScaleNote.textContent='함선은 디테일이 보이도록 거리 대비 확대 표시됩니다. 1×는 시뮬레이션 1초를 실제 1초에 재생합니다.';
    const publicSummaryFields={};
    for(const key of publicSettingKeys){
      if(key==='encounterMode')continue;
      const field=document.createElement('span');
      field.setAttribute('data-public-applied-'+key.replace(/[A-Z]/g,letter=>'-'+letter.toLowerCase()),'');
      publicSummaryFields[key]=field;publicAppliedSummary.appendChild(field);
    }
    const publicSettingsActions=document.createElement('div');
    publicSettingsActions.className='viz-row';
    const publicSettingsNotice=document.createElement('span');
    publicSettingsNotice.setAttribute('data-public-settings-notice','');
    publicSettingsNotice.setAttribute('role','status');
    publicSettingsNotice.setAttribute('aria-live','polite');
    const publicApplyButton=document.createElement('button');
    publicApplyButton.type='button';publicApplyButton.className='btn btn-primary';
    publicApplyButton.setAttribute('data-public-apply','');
    publicApplyButton.textContent='선택한 설정으로 새 교전';
    publicSettingsActions.append(publicSettingsNotice,publicApplyButton);
    publicSettingsPanel.append(publicAppliedSummary,publicScaleNote,publicSettingsActions);
    root.querySelector('.viz-controls').after(publicSettingsPanel);
    let refreshPublicResponsive=()=>{};
    const publicRawDisplayText=new WeakMap();
    function publicControlText(element,value){
      if(publicRawDisplayText.get(element)!==value){publicRawDisplayText.set(element,value);element.textContent=value;}
    }
    function validatePublicSettings(candidate){
      if(!candidate||typeof candidate!=='object'||Array.isArray(candidate))return null;
      const settings={};
      const shieldMode=candidate.shieldMode??'none';if(!['none','energy-shell'].includes(shieldMode))return null;settings.shieldMode=shieldMode;
      const choices={encounterMode:['maximum','set-range'],visibility:['clear','haze','night'],maneuverMode:['evasive','steady'],repairPolicy:['balanced','magazine-priority','none'],magazineRisk:['normal','high'],magazinePropagation:['isolated','chain']};
      for(const [key,values] of Object.entries(choices)){
        if(!values.includes(candidate[key]))return null;
        settings[key]=candidate[key];
      }
      for(const key of ['yamatoAmmo','iowaAmmo']){
        const value=candidate[key]??'ap';
        if(!['ap','he'].includes(value))return null;
        settings[key]=value;
      }
      const rangePolicy=candidate.rangePolicy??(['hold','close'].includes(config.rangePolicy)?config.rangePolicy:'hold');
      if(!['hold','close'].includes(rangePolicy))return null;
      settings.rangePolicy=rangePolicy;
      if(typeof candidate.accuracyScale!=='number'||!Number.isFinite(candidate.accuracyScale)||candidate.accuracyScale<.65||candidate.accuracyScale>1.5)return null;
      settings.accuracyScale=candidate.accuracyScale;
      if(settings.encounterMode==='maximum')settings.rangeKm=candidate.rangeKm===42?42:36;
      else if([6,12,18,24].includes(candidate.rangeKm))settings.rangeKm=candidate.rangeKm;
      else return null;
      return settings;
    }
    function readPublicSettings(){
      const candidate={shieldMode:shieldInput.value,encounterMode:encounterInput.value,rangeKm:encounterInput.value==='maximum'?36:Number(rangeInput.value),rangePolicy:rangePolicyInput.value,visibility:visibilityInput.value,accuracyScale:Number(accuracyInput.value),maneuverMode:maneuverInput.value,repairPolicy:repairInput.value,magazineRisk:magazineRiskInput.value,magazinePropagation:propagationInput.value,yamatoAmmo:yamatoAmmoInput.value,iowaAmmo:iowaAmmoInput.value};
      return validatePublicSettings(candidate)||validatePublicSettings(config)||{shieldMode:'none',encounterMode:'maximum',rangeKm:36,rangePolicy:'hold',visibility:'clear',accuracyScale:1,maneuverMode:'evasive',repairPolicy:'balanced',magazineRisk:'normal',magazinePropagation:'isolated',yamatoAmmo:'ap',iowaAmmo:'ap'};
    }
    function publicSettingsChanged(){
      const pending=readPublicSettings(),applied=validatePublicSettings(config);
      return !applied||publicSettingKeys.some(key=>key==='rangeKm'&&pending.encounterMode==='maximum'&&applied.encounterMode==='maximum'?false:key==='accuracyScale'?Math.abs(pending[key]-applied[key])>1e-8:pending[key]!==applied[key]);
    }
    function refreshPublicControls(){
      const pending=publicSettingsChanged(),applied=validatePublicSettings(config)||readPublicSettings();
      publicControlText(publicScaleNote,config.coordinateModel==='metric-scale'?'함선과 함간 거리는 같은 축척입니다. 야마토 전장 263 m를 기준으로 6 km는 선체 길이의 22.8배입니다. 디테일은 함선 확대에서 볼 수 있습니다.':config.coordinateModel==='fixed-scale'?'선택한 거리가 멀수록 함선 사이 간격도 벌어집니다. 함선은 디테일이 보이도록 확대 표시합니다. 1×는 시뮬레이션 1초를 실제 1초에 재생합니다.':'함선은 디테일이 보이도록 거리 대비 확대 표시됩니다. 1×는 시뮬레이션 1초를 실제 1초에 재생합니다.');
      publicControlText(publicKinematics,config.kinematicsModel==='si-drag'?'탄도 · 초속·감속·중력':'탄도 · 이전 교전 재현');
      publicControlText(publicDamageModel,config.combatModel==='fragile-maneuver'?'피해 모델 · 취약 구획 강화':config.damageModel==='energetic-crew'?'피해 모델 · 탄종·연료·인력':config.damageModel==='crew-vital'?'피해 모델 · 인력·손상통제':'피해 모델 · 이전 교전 재현');
      const commandsBusy=doctrineBusy||battleBusy,conditionsDisabled=!!blastPreview||commandsBusy;
      publicSettingsPanel.inert=commandsBusy;
      for(const input of publicConditionInputs)input.disabled=conditionsDisabled;
      publicControlText(publicSummaryFields.shieldMode,'전투 모드 · '+publicConditionLabels.shieldMode[applied.shieldMode]);
      publicControlText(publicSummaryFields.rangeKm,applied.encounterMode==='maximum'?(applied.rangeKm===36?'장거리 맞포격 · 36 km':'최대 사거리 조우 · 42 km'):'시작 거리 · '+applied.rangeKm+' km');
      const targetRange=Number(duel.initialConfig.targetRangeKm);
      publicControlText(publicSummaryFields.rangePolicy,config.maneuverRevision==='range-control-v18'?publicConditionLabels.rangePolicy[applied.rangePolicy]+(Number.isFinite(targetRange)&&targetRange>0?' 목표 · '+targetRange.toFixed(1)+' km':''):'항로 · 기존 항로');
      publicControlText(publicSummaryFields.visibility,'시정 · '+publicConditionLabels.visibility[applied.visibility]);
      publicControlText(publicSummaryFields.maneuverMode,'기동 · '+(applied.maneuverMode==='steady'&&config.maneuverRevision!=='range-control-v18'?'직선 항해':publicConditionLabels.maneuverMode[applied.maneuverMode]));
      publicControlText(publicSummaryFields.repairPolicy,'정비 대응 · '+publicConditionLabels.repairPolicy[applied.repairPolicy]);
      publicControlText(publicSummaryFields.magazineRisk,'유폭 위험 · '+publicConditionLabels.magazineRisk[applied.magazineRisk]);
      publicControlText(publicSummaryFields.magazinePropagation,'유폭 전파 · '+publicConditionLabels.magazinePropagation[applied.magazinePropagation]);
      publicControlText(publicSummaryFields.accuracyScale,'양측 명중률 보정 · '+applied.accuracyScale.toFixed(2)+'×');
      publicControlText(publicSummaryFields.yamatoAmmo,'야마토 탄종 · '+publicConditionLabels.yamatoAmmo[applied.yamatoAmmo]);
      publicControlText(publicSummaryFields.iowaAmmo,'아이오와 탄종 · '+publicConditionLabels.iowaAmmo[applied.iowaAmmo]);
      publicControlText(publicSettingsNotice,blastPreview?'유폭 연출 중에는 교전 조건을 바꿀 수 없습니다. 교전으로 돌아가서 변경하세요.':battleBusy?'새 교전을 계산 중입니다. 준비되면 재생을 시작합니다.':doctrineBusy?'운용 명령을 적용 중입니다. 완료되면 교전 조건을 변경할 수 있습니다.':battleError?'새 교전을 준비하지 못했습니다. 설정을 다시 적용해 주세요.':pending?'선택한 조건은 아직 적용되지 않았습니다. ‘선택한 설정으로 새 교전’을 누르세요. ‘현재 교전 계속’은 기존 교전을 이어갑니다.':config.coordinateModel!=='metric-scale'?'저장된 교전은 이전의 확대 축척으로 재생됩니다. 새 교전부터 실제 함선 길이를 기준으로 거리를 계산합니다.':'위 조건으로 교전 중입니다. 조건을 바꾼 뒤 선택한 설정으로 새 교전을 누르세요.');
      publicApplyButton.disabled=!pending||conditionsDisabled;
      publicApplyButton.hidden=!pending||!!blastPreview;
      publicSettingsPanel.dataset.pending=String(pending);
      Object.assign(stage.dataset,{publicSettingsPending:String(pending),publicConditionControlsDisabled:String(conditionsDisabled),publicAppliedSettings:JSON.stringify(applied),publicDraftSettings:JSON.stringify(readPublicSettings())});
      refreshPublicResponsive();
    }
    function restorePublicDraft(draft){
      const settings=validatePublicSettings(draft);
      if(!settings){refreshPublicControls();return false;}
      shieldInput.value=settings.shieldMode;
      encounterInput.value=settings.encounterMode;
      rangeInput.value=String(settings.encounterMode==='maximum'?18:settings.rangeKm);
      rangePolicyInput.value=settings.rangePolicy;
      visibilityInput.value=settings.visibility;accuracyInput.value=String(settings.accuracyScale);
      maneuverInput.value=settings.maneuverMode;repairInput.value=settings.repairPolicy;
      magazineRiskInput.value=settings.magazineRisk;propagationInput.value=settings.magazinePropagation;
      yamatoAmmoInput.value=settings.yamatoAmmo;iowaAmmoInput.value=settings.iowaAmmo;
      updateEncounterControls();
      root.querySelector('[data-accuracy-value]').textContent=settings.accuracyScale.toFixed(2)+'×';
      refreshPublicControls();return true;
    }
    for(const input of publicConditionInputs){
      input.addEventListener(input===accuracyInput?'input':'change',()=>{
        updateEncounterControls();refreshPublicControls();persist();
      });
    }
    publicApplyButton.addEventListener('click',()=>{
      if(blastPreview||doctrineBusy||battleBusy||!publicSettingsChanged())return;
      begin(true);refreshPublicControls();
    });
    refreshPublicControls();
