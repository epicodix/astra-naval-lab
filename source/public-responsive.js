    // Move the original controls: their listeners, references and saved state stay intact.
    if(publicMode!=='preview'){
      const mobileMedia=window.matchMedia('(max-width: 720px)');
      const conditionRow=encounterInput.closest('.viz-controls');
      const playbackRow=pause.closest('.viz-controls');
      const cameraRow=focusInput.closest('.viz-controls');
      const heading=root.firstElementChild,legend=root.querySelector('[data-trajectory-legend]');
      const observerControls=root.querySelector('.duel-observer-controls');
      const distance=root.querySelector('[data-distance-summary]'),timeline=root.querySelector('.duel-timeline');
      const status=root.querySelector('.duel-status'),sections=root.querySelector('[data-sections]'),history=root.querySelector('.duel-log');
      const mobilePanels=[],mobileOpen=new Map();
      function makeMobilePanel(key,title,hint,nodes){
        const panel=document.createElement('details'),summary=document.createElement('summary');
        panel.className='public-mobile-panel';panel.dataset.mobilePanel=key;
        const name=document.createElement('strong'),description=document.createElement('span');
        name.textContent=title;description.textContent=hint;description.className='public-mobile-hint';
        summary.append(name,description);panel.appendChild(summary);
        nodes[0].before(panel);for(const node of nodes)panel.appendChild(node);
        mobilePanels.push(panel);mobileOpen.set(panel,false);
        panel.addEventListener('toggle',()=>{if(mobileMedia.matches)mobileOpen.set(panel,panel.open);});
        return{panel,summary,description};
      }
      const settings=makeMobilePanel('settings','교전 설정','거리 · 탄종 · 기동',[conditionRow,publicSettingsPanel]);
      const pendingBadge=document.createElement('span');pendingBadge.className='public-mobile-pending';pendingBadge.textContent='변경 대기';pendingBadge.hidden=true;settings.summary.appendChild(pendingBadge);
      const groups=[
        ['거리와 기동',[shieldInput,encounterInput,rangeInput,rangePolicyInput,maneuverInput]],
        ['탄종과 조준',[yamatoAmmoInput,iowaAmmoInput,visibilityInput,accuracyInput]],
        ['손상과 정비',[repairInput,magazineRiskInput,propagationInput]]
      ];
      for(const[title,inputs]of groups){
        const group=document.createElement('fieldset'),titleNode=document.createElement('legend');
        group.className='viz-controls public-option-group';titleNode.textContent=title;group.appendChild(titleNode);
        for(const input of inputs)group.appendChild(input===accuracyInput?input.closest('.duel-accuracy'):input.closest('.form-label'));
        conditionRow.appendChild(group);
      }
      const orders=makeMobilePanel('orders','함선 운용','수리 · 균형 · 공격',[tacticalPanel]);
      const camera=makeMobilePanel('camera','화면과 효과','시점 · 파도 · 피해 구획',[cameraRow]);
      const damage=makeMobilePanel('damage','함선 상태','피탄 · 기관 · 함포반',[status]);
      const quickActions=document.createElement('div');quickActions.className='viz-controls public-mobile-actions';quickActions.inert=root.dataset.publicReady!=='true';
      const applyHome=publicApplyButton.parentElement;
      quickActions.append(root.querySelector('[data-return]'),worldViewButton,shieldReplayButton,blastButton);cameraRow.appendChild(quickActions);
      playbackRow.classList.add('public-playback');conditionRow.classList.add('public-condition-row');
      let appliedMobile=null;
      function applyResponsiveLayout(){
        const mobile=mobileMedia.matches;
        if(appliedMobile===mobile)return;
        if(appliedMobile===true)for(const panel of mobilePanels)mobileOpen.set(panel,panel.open);
        for(const panel of mobilePanels)panel.open=mobile?mobileOpen.get(panel):true;
        const speedLabel=speedInput.closest('.form-label');
        for(const node of mobile?[pause,speedLabel,start,replay]:[start,replay,pause,speedLabel])playbackRow.appendChild(node);
        if(mobile){
          quickActions.insertBefore(publicApplyButton,blastButton);
          for(const node of [heading,playbackRow,observerControls,stage,distance,metricSummary,shieldSummary,timeline,quickActions,settings.panel,orders.panel,camera.panel,legend,damage.panel,sections,history])root.appendChild(node);
        }else{
          applyHome.appendChild(publicApplyButton);
          cameraRow.appendChild(quickActions);
          for(const node of [heading,settings.panel,orders.panel,playbackRow,camera.panel,legend,observerControls,stage,distance,metricSummary,shieldSummary,timeline,damage.panel,sections,history])root.appendChild(node);
        }
        appliedMobile=mobile;root.dataset.mobileLayout=String(mobile);
      }
      refreshPublicResponsive=()=>{
        const applied=validatePublicSettings(config)||readPublicSettings();
        const draft=readPublicSettings(),rangeChanged=draft.rangeKm!==applied.rangeKm||draft.encounterMode!==applied.encounterMode;
        publicControlText(settings.description,'현재 교전 · '+applied.rangeKm+' km'+(rangeChanged?' / 새 시작 · '+draft.rangeKm+' km':'')+' · '+(applied.yamatoAmmo==='he'?'HE':'AP')+' / '+(applied.iowaAmmo==='he'?'HE':'AP')+' · '+applied.accuracyScale.toFixed(2)+'×'+(applied.shieldMode==='energy-shell'?' · SF 실드':''));
        pendingBadge.hidden=!publicSettingsChanged();
        settings.panel.dataset.pending=String(!pendingBadge.hidden);
        orders.panel.hidden=tacticalPanel.hidden;damage.panel.hidden=status.hidden;
      };
      mobileMedia.addEventListener('change',applyResponsiveLayout);
      applyResponsiveLayout();refreshPublicResponsive();
    }
