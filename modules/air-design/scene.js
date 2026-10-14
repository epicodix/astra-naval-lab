const copy = {
  ko: {
    skip:'설계실로 이동', navigation:'설계실 메뉴', language:'언어 선택', home:'전함 실험실로', title:'항공 설계실', intro:'가상 기체의 디테일과 비행 자세를 살펴보세요.', fictional:'1940년대 풍 가상 뇌격기', viewer:'기체 보기', viewMode:'보기 선택', model:'기체 살펴보기', flight:'비행 관찰', fit:'전체 구도', camera:'카메라', orbit:'자유 관찰', track:'기체 추적', cameraAngles:'카메라 방향', angle:'사선', side:'측면', top:'상부', scene:'가상 뇌격기의 3D 모습', loading:'기체를 준비하는 중…', retry:'다시 열기', play:'재생', pause:'일시정지', restart:'처음으로', timeline:'관찰 시간', inspect:'부위 살펴보기', inspectHint:'선택하면 가까이 봅니다', parts:'기체 부위', whole:'기체 전체', fuselage:'동체', wings:'날개', engine:'엔진 · 프로펠러', cockpit:'조종석', tail:'꼬리날개', torpedo:'어뢰 · 장착대', gear:'착륙장치', flightDesign:'비행 설정', formation:'대형', solo:'단독 비행', vee:'3기 V자 편대', path:'항로', level:'수평 비행', turn:'선회 비행', approach:'낮게 접근', flightOptions:'속도 · 고도 · 기울기', referenceSpeed:'기준 속도', altitude:'고도', referenceBank:'리더 선회 기울기', gearDown:'착륙장치 펼치기', route:'항로 표시', study:'가상 설계', length:'전장', span:'날개 폭', modelParts:'모델 부품', selected:'관찰 부위', airspeed:'비행 속도', actualAltitude:'현재 고도', bank:'기울기', aircraftCount:'비행 기체', note:'실제 기종의 복제 모델이 아닌, 형태와 움직임을 살펴보는 가상 설계입니다.', modelView:'기체 외관', flightView:'비행 관찰', modelReadout:'기체 제원', flightReadout:'리더 비행 상태', orbitHint:'드래그로 회전 · 휠로 확대', trackHint:'기체 추적 · 휠로 확대 · 드래그로 자유 관찰', error:'3D 화면을 열지 못했습니다. 새로고침하거나 다른 브라우저에서 열어주세요.'
  },
  en: {
    skip:'Go to the studio', navigation:'Studio navigation', language:'Choose language', home:'Back to naval lab', title:'Aircraft Studio', intro:'Explore a fictional aircraft’s details and flight attitude.', fictional:'Fictional torpedo aircraft · 1940s inspired', viewer:'Aircraft viewer', viewMode:'Choose view', model:'Inspect aircraft', flight:'Observe flight', fit:'Frame all', camera:'Camera', orbit:'Free orbit', track:'Track aircraft', cameraAngles:'Camera direction', angle:'Angle', side:'Side', top:'Top', scene:'3D view of a fictional torpedo aircraft', loading:'Preparing the aircraft…', retry:'Reload', play:'Play', pause:'Pause', restart:'Restart', timeline:'Observation time', inspect:'Inspect a part', inspectHint:'Select for a closer look', parts:'Aircraft parts', whole:'Whole aircraft', fuselage:'Fuselage', wings:'Wings', engine:'Engine · Propeller', cockpit:'Cockpit', tail:'Tail', torpedo:'Torpedo · Rack', gear:'Landing gear', flightDesign:'Flight settings', formation:'Formation', solo:'Solo flight', vee:'Three-aircraft V', path:'Flight path', level:'Level flight', turn:'Coordinated turn', approach:'Low approach', flightOptions:'Speed · Altitude · Bank', referenceSpeed:'Reference speed', altitude:'Altitude', referenceBank:'Lead turn bank', gearDown:'Extend landing gear', route:'Show flight path', study:'Fictional design', length:'Length', span:'Wingspan', modelParts:'Model pieces', selected:'Selected part', airspeed:'Airspeed', actualAltitude:'Current altitude', bank:'Bank', aircraftCount:'Aircraft', note:'A fictional study of aircraft form and motion, rather than a replica of a historical type.', modelView:'Aircraft exterior', flightView:'Flight observation', modelReadout:'Aircraft dimensions', flightReadout:'Lead aircraft status', orbitHint:'Drag to rotate · Scroll to zoom', trackHint:'Tracking aircraft · Scroll to zoom · Drag for free orbit', error:'The 3D view could not open. Reload the page or try another browser.'
  }
};

const root = document.getElementById('air-design');
const stage = root.querySelector('[data-scene]');
const params = new URLSearchParams(location.search);
let language = ['ko','en'].includes(params.get('lang')) ? params.get('lang') : (navigator.language?.startsWith('ko') ? 'ko' : 'en');
let app = null;
const text = key => copy[language][key] || key;
const element = selector => root.querySelector(selector);
function applyLanguage() {
  document.documentElement.lang = language;
  document.title = text('title') + ' | ASTRA NAVAL LAB';
  document.querySelector('meta[name="description"]').content = text('intro');
  document.querySelectorAll('[data-i18n]').forEach(node => { node.textContent = text(node.dataset.i18n); });
  document.querySelectorAll('[data-i18n-aria]').forEach(node => { node.setAttribute('aria-label', text(node.dataset.i18nAria)); });
  document.querySelectorAll('[data-language]').forEach(node => { node.setAttribute('aria-pressed', String(node.dataset.language === language)); });
  document.querySelectorAll('[data-home]').forEach(node => { node.href = language === 'en' ? '../../en.html' : '../../'; });
  if (app) app.refreshLabels();
  else { element('[data-view-label]').textContent = text('modelView'); element('[data-scene-hint]').textContent = text('orbitHint'); }
  if(element('[data-loading]').dataset.error==='true')element('[data-loading-text]').textContent=text('error');
}
document.querySelectorAll('[data-language]').forEach(button => button.addEventListener('click', () => {
  language = button.dataset.language;
  const url = new URL(location.href); url.searchParams.set('lang', language); history.replaceState(null, '', url);
  applyLanguage();
}));
element('[data-retry]').addEventListener('click', () => location.reload());
applyLanguage();

async function boot() {
  try {
    const T = window.THREE;
    if (!T?.WebGLRenderer || !T.OrbitControls) throw new Error('Three.js or OrbitControls did not load');
    const [{createAircraft}, {sampleFlight, clampFlightOptions, DURATION}] = await Promise.all([
      import('./aircraft-model.js'), import('./flight-motion.js')
    ]);
    const renderer = new T.WebGLRenderer({antialias:true, alpha:false, powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.12;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.domElement.tabIndex = 0; renderer.domElement.setAttribute('aria-label', text('scene'));
    stage.appendChild(renderer.domElement);
    const scene = new T.Scene(), camera = new T.PerspectiveCamera(38, 1, .05, 100000);
    const controls = new T.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.dampingFactor = .08; controls.enablePan = false; controls.rotateSpeed = .6; controls.minDistance = 1.25; controls.maxDistance = 400;
    controls.maxPolarAngle = Math.PI / 2 + .12;
    const light = new T.DirectionalLight(0xfff0dc, 2.2); light.castShadow = true; light.shadow.mapSize.set(1024,1024);
    Object.assign(light.shadow.camera, {left:-24,right:24,top:24,bottom:-24,near:1,far:160}); light.shadow.normalBias = .025; light.shadow.bias = -.00008;
    scene.add(new T.HemisphereLight(0xdce7ef, 0x36414a, .9)); scene.add(light); scene.add(light.target);
    const rim = new T.DirectionalLight(0x91b6c9, .75); rim.position.set(-20, 18, -35); scene.add(rim);
    const aircraft = Array.from({length:3}, () => createAircraft(T, {gear:true}));
    aircraft.forEach(built => scene.add(built.group));
    const primary = aircraft[0], modelLift = Math.max(1, -(primary.bounds?.min?.[1] ?? -2) + .075);
    let pieces = 0; primary.group.traverse(node => { if (node.isMesh) pieces += node.userData.sourcePieces?.length || (node.isInstancedMesh ? node.count : 1); });
    root.dataset.components = String(pieces); root.dataset.triangles = String(primary.spec?.triangleCount || 0);
    element('[data-part-count]').textContent = pieces.toLocaleString(language);
    element('[data-length]').textContent = (primary.spec?.lengthMeters ?? 12).toFixed(2) + ' m';
    element('[data-span]').textContent = (primary.spec?.wingspanMeters ?? 15).toFixed(1) + ' m';
    const ground = new T.Group(); scene.add(ground);
    const groundPlane = new T.Mesh(new T.PlaneGeometry(180,180), new T.MeshStandardMaterial({color:0x172630,roughness:.95,metalness:.03}));
    groundPlane.rotation.x = -Math.PI/2; groundPlane.receiveShadow = true; ground.add(groundPlane);
    const grid = new T.GridHelper(60,60,0x405565,0x314654); grid.position.y = .004; grid.material.transparent = true; grid.material.opacity = .33; ground.add(grid);
    const oceanMaterial = new T.ShaderMaterial({fog:true, side:T.DoubleSide, uniforms:T.UniformsUtils.merge([T.UniformsLib.fog,{uTime:{value:0}}]),
      vertexShader:`varying vec3 vWorld;
        #include <fog_pars_vertex>
        void main(){vWorld=(modelMatrix*vec4(position,1.)).xyz;vec4 mvPosition=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader:`varying vec3 vWorld;uniform float uTime;
        #include <fog_pars_fragment>
        void main(){vec2 p=vWorld.xz;float a=dot(p,vec2(.086,.053))+uTime*.55,b=dot(p,vec2(-.13,.095))-uTime*.8;
          vec3 N=normalize(vec3(-.018*cos(a)-.014*cos(b),1.,-.014*cos(a)+.012*cos(b))),V=normalize(cameraPosition-vWorld),L=normalize(vec3(.45,.8,.25));
          float fresnel=pow(1.-max(0.,dot(N,V)),4.);vec3 water=mix(vec3(.023,.052,.070),vec3(.19,.27,.30),fresnel*.72);
          float glint=pow(max(0.,dot(N,normalize(V+L))),180.)*.20;water+=vec3(.8,.85,.86)*glint;
          gl_FragColor=vec4(water,1.);
          #include <tonemapping_fragment>
          #include <encodings_fragment>
          #include <fog_fragment>
        }`});
    const ocean = new T.Mesh(new T.PlaneGeometry(120000,120000), oceanMaterial); ocean.rotation.x = -Math.PI/2; ocean.visible = false; scene.add(ocean);
    const skyMaterial = new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{zenith:{value:new T.Color(0x253e4a)},horizon:{value:new T.Color(0x91a7ac)}},
      vertexShader:'varying vec3 vSky;void main(){vSky=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:`varying vec3 vSky;uniform vec3 zenith,horizon;void main(){float h=clamp(normalize(vSky).y,0.,1.);gl_FragColor=vec4(mix(horizon,zenith,pow(h,.45)),1.);
        #include <tonemapping_fragment>
        #include <encodings_fragment>
      }`});
    const sky = new T.Mesh(new T.SphereGeometry(50000,24,12), skyMaterial); sky.frustumCulled = false; sky.renderOrder = -100; sky.visible = false; scene.add(sky);
    const routeCount = 241, routeGeometry = new T.BufferGeometry();
    routeGeometry.setAttribute('position', new T.BufferAttribute(new Float32Array(routeCount*3),3).setUsage(T.DynamicDrawUsage));
    const route = new T.Line(routeGeometry, new T.LineBasicMaterial({color:0xddb98f,transparent:true,opacity:.42,depthWrite:false})); route.visible = false; scene.add(route);
    const initialMode = params.get('mode') === 'flight' ? 'flight' : 'model';
    const state = {mode:initialMode, time:0, playing:false, part:'whole', angle:'angle', cameraMode:initialMode==='flight'?'track':'orbit', cameraByMode:{model:'orbit',flight:'track'}, gearByMode:{model:true,flight:false}, zoom:1, showRoute:true,
      options:clampFlightOptions({path:params.get('path') || 'level',formation:params.get('formation') || 'solo',speedMps:90,altitudeM:120,bankDeg:25})};
    const up = new T.Vector3(0,1,0), worldBox = new T.Box3(), currentCentre = new T.Vector3(), previousCentre = new T.Vector3();
    let currentPoses = [], dirty = true, needFit = true, lastFrame = performance.now(), hasCentre = false;
    const partKeys = {whole:'whole',body:'fuselage',fuselage:'fuselage',wings:'wings',engine:'engine',cockpit:'cockpit',tail:'tail',torpedo:'torpedo',gear:'gear'};
    const partObject = id => id==='whole' ? primary.group : primary.parts[id] || (id==='body' ? primary.parts.fuselage : null);
    element('input[data-time]').max = String(DURATION);
    element('select[data-path]').value = state.options.path; element('select[data-formation]').value = state.options.formation;
    element('input[data-speed]').value = String(state.options.speedMps); element('input[data-altitude]').value = String(state.options.altitudeM); element('input[data-bank]').value = String(state.options.bankDeg);
    function refreshLabels() {
      const flight = state.mode === 'flight';
      element('[data-model-panel]').hidden = flight; element('[data-flight-panel]').hidden = !flight; element('[data-model-readout]').hidden = flight; element('[data-flight-readout]').hidden = !flight; element('[data-route-field]').hidden = !flight;
      element('input[data-gear]').checked = state.gearByMode[state.mode]; element('select[data-camera-mode]').value = state.cameraMode;
      root.querySelectorAll('button[data-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode===state.mode)));
      root.querySelectorAll('button[data-part]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.part===state.part)));
      root.querySelectorAll('button[data-angle]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.angle===state.angle)));
      element('[data-view-label]').textContent = flight ? text('flightView') : text(partKeys[state.part] || 'whole');
      element('[data-scene-hint]').textContent = text(state.cameraMode==='track'?'trackHint':'orbitHint');
      element('[data-readout-title]').textContent = text(flight?'flightReadout':'modelReadout'); element('[data-selected-part]').textContent = text(partKeys[state.part] || 'whole');
      element('[data-play]').textContent = text(state.playing?'pause':'play'); element('[data-play]').setAttribute('aria-pressed',String(state.playing));
      element('[data-part-count]').textContent = pieces.toLocaleString(language);
      renderer.domElement.setAttribute('aria-label',text('scene'));
      root.dataset.mode = state.mode; root.dataset.cameraMode = state.cameraMode; root.dataset.part = state.part;
    }
    function refreshReadouts() {
      element('[data-speed-output]').textContent = state.options.speedMps.toFixed(0) + ' m/s'; element('[data-altitude-output]').textContent = state.options.altitudeM.toFixed(0) + ' m'; element('[data-bank-output]').textContent = state.options.bankDeg.toFixed(0) + '°';
      const mins = Math.floor(state.time/60), seconds = state.time%60; element('[data-time-output]').textContent = String(mins).padStart(2,'0') + ':' + seconds.toFixed(1).padStart(4,'0'); element('input[data-time]').value = String(state.time);
      const pose = currentPoses[0]; if (pose) { element('[data-actual-speed]').textContent = pose.speedMps.toFixed(1) + ' m/s'; element('[data-actual-altitude]').textContent = pose.position[1].toFixed(1) + ' m'; element('[data-actual-bank]').textContent = (pose.rollRad*180/Math.PI).toFixed(1) + '°'; }
      element('dd[data-aircraft-count]').textContent = String(state.options.formation==='vee'?3:1);
      Object.assign(stage.dataset,{time:state.time.toFixed(4),playing:String(state.playing),mode:state.mode,path:state.options.path,formation:state.options.formation,gear:String(state.gearByMode[state.mode]),aircraftCount:String(state.mode==='flight'&&state.options.formation==='vee'?3:1),flightPoses:JSON.stringify(currentPoses),part:state.part,cameraMode:state.cameraMode});
    }
    function rebuildRoute() {
      const positions = routeGeometry.attributes.position;
      for(let i=0;i<routeCount;i++){const p=sampleFlight(DURATION*i/(routeCount-1),state.options,0).position;positions.setXYZ(i,p[0],p[1],p[2]);}
      positions.needsUpdate=true;routeGeometry.computeBoundingSphere();
    }
    function applyGear() { aircraft.forEach(built=>built.setGear(state.gearByMode[state.mode])); }
    function sampleScene() {
      const flight = state.mode==='flight', count = flight&&state.options.formation==='vee'?3:1; currentPoses=[];
      for(let i=0;i<aircraft.length;i++){
        const built=aircraft[i];built.group.visible=i<count;built.animate(state.time);
        if(flight&&i<count){const pose=sampleFlight(state.time,state.options,i);currentPoses.push(pose);built.group.position.fromArray(pose.position);built.group.rotation.set(pose.rollRad,pose.yawRad,pose.pitchRad,'YZX');}
        else{built.group.position.set(0,modelLift,0);built.group.rotation.set(0,0,0,'YZX');}
        built.group.updateMatrixWorld(true);
      }
      ground.visible=!flight;ocean.visible=flight;sky.visible=flight;route.visible=flight&&state.showRoute;oceanMaterial.uniforms.uTime.value=state.time;
      scene.background=new T.Color(flight?0x8fa5ab:0x111e28);scene.fog=flight?new T.Fog(0x8fa5ab,14000,60000):new T.Fog(0x111e28,48,150);
      refreshReadouts();
    }
    function boundsForView() {
      worldBox.makeEmpty();
      if(state.mode==='model')worldBox.setFromObject(partObject(state.part)||primary.group);
      else for(const built of aircraft)if(built.group.visible)worldBox.union(new T.Box3().setFromObject(built.group));
      if(worldBox.isEmpty())worldBox.setFromCenterAndSize(primary.group.position,new T.Vector3(12,4,15));
      return worldBox;
    }
    function cameraDirection() {
      let direction;
      if(state.angle==='top')direction=new T.Vector3(.025,1,.02);
      else if(state.angle==='side')direction=new T.Vector3(.05,.19,1);
      else if(state.mode==='flight')direction=new T.Vector3(-.85,.38,.75);
      else if(state.part==='engine')direction=new T.Vector3(1,.18,.55);
      else if(state.part==='torpedo'||state.part==='gear')direction=new T.Vector3(.45,.12,1);
      else if(state.part==='cockpit')direction=new T.Vector3(.35,.5,1);
      else if(state.part==='wings')direction=new T.Vector3(.45,.65,1);
      else direction=new T.Vector3(.95,.42,1);
      if(state.mode==='flight')direction.applyAxisAngle(up,currentPoses[0]?.yawRad||0);
      return direction.normalize();
    }
    function framingDistance(box,target,direction) {
      const right=new T.Vector3().crossVectors(up,direction).normalize(),screenUp=new T.Vector3().crossVectors(direction,right),vertical=Math.tan(camera.fov*Math.PI/360),horizontal=vertical*camera.aspect;
      let distance=2;
      for(const x of[box.min.x,box.max.x])for(const y of[box.min.y,box.max.y])for(const z of[box.min.z,box.max.z]){const q=new T.Vector3(x,y,z).sub(target),depth=q.dot(direction);distance=Math.max(distance,Math.abs(q.dot(right))/horizontal+depth,Math.abs(q.dot(screenUp))/vertical+depth);}
      return distance*1.15;
    }
    function updateCamera() {
      const box=boundsForView();box.getCenter(currentCentre);
      if(state.cameraMode==='track'||needFit){const direction=cameraDirection(),distance=framingDistance(box,currentCentre,direction)*state.zoom;camera.position.copy(currentCentre).addScaledVector(direction,distance);controls.target.copy(currentCentre);controls.enableDamping=state.cameraMode==='orbit';camera.lookAt(currentCentre);camera.updateMatrixWorld(true);needFit=false;}
      else if(state.mode==='flight'&&hasCentre){const delta=currentCentre.clone().sub(previousCentre);camera.position.add(delta);controls.target.add(delta);}
      previousCentre.copy(currentCentre);hasCentre=true;controls.maxDistance=state.mode==='flight'?1200:400;
      light.position.copy(primary.group.position).add(new T.Vector3(35,55,25));light.target.position.copy(primary.group.position);light.target.updateMatrixWorld(true);
    }
    function requestFrame(fit=false) { dirty=true;if(fit)needFit=true; }
    function setMode(mode) {
      if(mode===state.mode)return;state.cameraByMode[state.mode]=state.cameraMode;state.mode=mode;state.cameraMode=state.cameraByMode[mode];state.playing=false;state.zoom=1;hasCentre=false;
      applyGear();sampleScene();refreshLabels();requestFrame(true);
    }
    root.querySelectorAll('button[data-mode]').forEach(button=>button.addEventListener('click',()=>setMode(button.dataset.mode)));
    root.querySelectorAll('button[data-part]').forEach(button=>{
      button.disabled=button.dataset.part!=='whole'&&!partObject(button.dataset.part);
      button.addEventListener('click',()=>{state.part=button.dataset.part;state.zoom=1;if(state.part==='gear'){state.gearByMode.model=true;applyGear();}sampleScene();refreshLabels();requestFrame(true);});
    });
    root.querySelectorAll('button[data-angle]').forEach(button=>button.addEventListener('click',()=>{state.angle=button.dataset.angle;state.zoom=1;refreshLabels();requestFrame(true);}));
    element('[data-fit]').addEventListener('click',()=>{state.part='whole';state.zoom=1;refreshLabels();requestFrame(true);});
    element('select[data-camera-mode]').addEventListener('change',event=>{state.cameraMode=event.target.value;state.cameraByMode[state.mode]=state.cameraMode;state.zoom=1;refreshLabels();requestFrame(state.cameraMode==='track');});
    element('input[data-gear]').addEventListener('change',event=>{state.gearByMode[state.mode]=event.target.checked;applyGear();sampleScene();refreshLabels();requestFrame();});
    element('input[data-route]').addEventListener('change',event=>{state.showRoute=event.target.checked;route.visible=state.mode==='flight'&&state.showRoute;requestFrame();});
    function readOptions() {
      state.options=clampFlightOptions({path:element('select[data-path]').value,formation:element('select[data-formation]').value,speedMps:Number(element('input[data-speed]').value),altitudeM:Number(element('input[data-altitude]').value),bankDeg:Number(element('input[data-bank]').value)});
      rebuildRoute();sampleScene();requestFrame(true);
    }
    element('select[data-path]').addEventListener('change',readOptions);element('select[data-formation]').addEventListener('change',readOptions);
    for(const selector of['input[data-speed]','input[data-altitude]','input[data-bank]'])element(selector).addEventListener('input',readOptions);
    element('[data-play]').addEventListener('click',()=>{if(state.time>=DURATION)state.time=0;state.playing=!state.playing;lastFrame=performance.now();refreshLabels();refreshReadouts();requestFrame();});
    element('[data-reset]').addEventListener('click',()=>{state.time=0;state.playing=false;hasCentre=false;sampleScene();refreshLabels();requestFrame(true);});
    element('input[data-time]').addEventListener('input',event=>{state.time=Math.max(0,Math.min(DURATION,Number(event.target.value)||0));state.playing=false;sampleScene();refreshLabels();requestFrame(state.cameraMode==='track');});
    renderer.domElement.addEventListener('pointerdown',()=>{if(state.cameraMode==='track'){state.cameraMode='orbit';state.cameraByMode[state.mode]='orbit';controls.enableDamping=true;refreshLabels();requestFrame();}},true);
    renderer.domElement.addEventListener('wheel',event=>{if(state.cameraMode!=='track')return;event.preventDefault();event.stopImmediatePropagation();state.zoom=Math.max(.55,Math.min(3.5,state.zoom*Math.exp(Math.max(-150,Math.min(150,event.deltaY))*.002)));requestFrame();},{capture:true,passive:false});
    controls.addEventListener('change',()=>requestFrame());
    function resize() {const width=stage.clientWidth,height=stage.clientHeight;if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();requestFrame(true);}
    new ResizeObserver(resize).observe(stage);
    renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();state.playing=false;showError(new Error('WebGL context lost'));});
    app={refreshLabels};applyGear();rebuildRoute();sampleScene();refreshLabels();resize();
    root.querySelectorAll('[data-controls]').forEach(node=>{node.inert=false;});element('[data-loading]').hidden=true;root.dataset.ready='true';
    function tick(now) {
      requestAnimationFrame(tick);const dt=Math.min(.1,Math.max(0,(now-lastFrame)/1000));lastFrame=now;
      if(state.playing&&!document.hidden){state.time=Math.min(DURATION,state.time+dt);sampleScene();dirty=true;if(state.time>=DURATION){state.playing=false;refreshLabels();}}
      if(dirty)updateCamera();controls.update();
      if(dirty){sky.position.copy(camera.position);renderer.render(scene,camera);Object.assign(stage.dataset,{cameraDistance:String(camera.position.distanceTo(controls.target)),cameraPosition:camera.position.toArray().join(','),cameraTarget:controls.target.toArray().join(','),renderCalls:String(renderer.info.render.calls),renderTriangles:String(renderer.info.render.triangles)});dirty=false;}
    }
    tick(performance.now());
  } catch(error) { showError(error); }
}
function showError(error) {
  const loading=element('[data-loading]');loading.hidden=false;loading.dataset.error='true';loading.setAttribute('role','alert');element('[data-loading-text]').textContent=text('error');element('[data-retry]').hidden=false;root.dataset.ready='false';root.dataset.error=String(error?.message||error);console.error(error);
}
boot();
