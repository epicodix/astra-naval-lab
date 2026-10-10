    // Public-player controls. This snippet runs inside the existing simulator closure.
    const publicSettingKeys=['encounterMode','rangeKm','rangePolicy','visibility','accuracyScale','maneuverMode','repairPolicy','magazineRisk','magazinePropagation','yamatoAmmo','iowaAmmo'];
    const publicConditionInputs=[encounterInput,rangeInput,rangePolicyInput,visibilityInput,accuracyInput,maneuverInput,repairInput,magazineRiskInput,propagationInput,yamatoAmmoInput,iowaAmmoInput];
    const publicConditionLabels={
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
    publicApplyButton.textContent='설정 적용하고 다시 시작';
    publicSettingsActions.append(publicSettingsNotice,publicApplyButton);
    publicSettingsPanel.append(publicAppliedSummary,publicScaleNote,publicSettingsActions);
    root.querySelector('.viz-controls').after(publicSettingsPanel);
    const publicRawDisplayText=new WeakMap();
    function publicControlText(element,value){
      if(publicRawDisplayText.get(element)!==value){publicRawDisplayText.set(element,value);element.textContent=value;}
    }
    function validatePublicSettings(candidate){
      if(!candidate||typeof candidate!=='object'||Array.isArray(candidate))return null;
      const settings={};
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
      if(settings.encounterMode==='maximum')settings.rangeKm=42;
      else if([6,12,18,24].includes(candidate.rangeKm))settings.rangeKm=candidate.rangeKm;
      else return null;
      return settings;
    }
    function readPublicSettings(){
      const candidate={encounterMode:encounterInput.value,rangeKm:Number(rangeInput.value),rangePolicy:rangePolicyInput.value,visibility:visibilityInput.value,accuracyScale:Number(accuracyInput.value),maneuverMode:maneuverInput.value,repairPolicy:repairInput.value,magazineRisk:magazineRiskInput.value,magazinePropagation:propagationInput.value,yamatoAmmo:yamatoAmmoInput.value,iowaAmmo:iowaAmmoInput.value};
      return validatePublicSettings(candidate)||validatePublicSettings(config)||{encounterMode:'maximum',rangeKm:42,rangePolicy:'hold',visibility:'clear',accuracyScale:1,maneuverMode:'evasive',repairPolicy:'balanced',magazineRisk:'normal',magazinePropagation:'isolated',yamatoAmmo:'ap',iowaAmmo:'ap'};
    }
    function publicSettingsChanged(){
      const pending=readPublicSettings(),applied=validatePublicSettings(config);
      return !applied||publicSettingKeys.some(key=>key==='accuracyScale'?Math.abs(pending[key]-applied[key])>1e-8:pending[key]!==applied[key]);
    }
    function refreshPublicControls(){
      const pending=publicSettingsChanged(),applied=validatePublicSettings(config)||readPublicSettings();
      publicControlText(publicKinematics,config.kinematicsModel==='si-drag'?'탄도 · 초속·감속·중력':'탄도 · 이전 교전 재현');
      publicControlText(publicDamageModel,config.combatModel==='fragile-maneuver'?'피해 모델 · 취약 구획 강화':config.damageModel==='energetic-crew'?'피해 모델 · 탄종·연료·인력':config.damageModel==='crew-vital'?'피해 모델 · 인력·손상통제':'피해 모델 · 이전 교전 재현');
      const commandsBusy=doctrineBusy||battleBusy,conditionsDisabled=!!blastPreview||commandsBusy;
      publicSettingsPanel.inert=commandsBusy;
      for(const input of publicConditionInputs)input.disabled=conditionsDisabled;
      publicControlText(publicSummaryFields.rangeKm,applied.encounterMode==='maximum'?'최대 사거리 조우 · 42 km':'시작 거리 · '+applied.rangeKm+' km');
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
      publicControlText(publicSettingsNotice,blastPreview?'유폭 연출 중에는 교전 조건을 바꿀 수 없습니다. 교전으로 돌아가서 변경하세요.':battleBusy?'새 교전을 계산 중입니다. 준비되면 재생을 시작합니다.':doctrineBusy?'운용 명령을 적용 중입니다. 완료되면 교전 조건을 변경할 수 있습니다.':battleError?'새 교전을 준비하지 못했습니다. 설정을 다시 적용해 주세요.':pending?'변경한 조건은 아직 적용되지 않았습니다. 설정 적용하고 다시 시작을 누르면 새 교전을 시작합니다.':config.combatModel!=='fragile-maneuver'||config.maneuverRevision!=='range-control-v18'?'저장한 교전의 기존 계산을 재현 중입니다. 새 교전을 누르면 현재 피해 모델과 거리 유지·접근 항로가 적용됩니다.':'위 조건으로 교전 중입니다. 조건을 바꾼 뒤 설정 적용하고 다시 시작을 누르세요.');
      publicApplyButton.disabled=!pending||conditionsDisabled;
      publicApplyButton.hidden=!pending||!!blastPreview;
      publicSettingsPanel.dataset.pending=String(pending);
      Object.assign(stage.dataset,{publicSettingsPending:String(pending),publicConditionControlsDisabled:String(conditionsDisabled),publicAppliedSettings:JSON.stringify(applied),publicDraftSettings:JSON.stringify(readPublicSettings())});
    }
    function restorePublicDraft(draft){
      const settings=validatePublicSettings(draft);
      if(!settings){refreshPublicControls();return false;}
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
