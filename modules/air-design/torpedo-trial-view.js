// Independent metre-scale trial scenery and effects. Events come from the
// trajectory module; this view never decides whether a torpedo hit a target.
export function createTorpedoTrialView(T) {
  const group = new T.Group(); group.name = 'Independent torpedo test scenery';
  const targetGroup = new T.Group(); targetGroup.name = 'Fixed broadside trial barge'; group.add(targetGroup);
  const targetBounds = { center: [850, -1.5, 0], size: [14, 9, 100] };
  targetGroup.position.set(850, 0, 0);
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const smooth = v => { v = clamp(v); return v * v * (3 - 2 * v); };
  const finite3 = p => Array.isArray(p) && p.length === 3 && p.every(Number.isFinite);
  const noise = n => { const v = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const matrix = new T.Matrix4(), quaternion = new T.Quaternion(), position = new T.Vector3(), scale = new T.Vector3();
  const up = new T.Vector3(0, 1, 0);
  function material(color, roughness = .68, metalness = .25) { return new T.MeshStandardMaterial({ color, roughness, metalness }); }
  const hullMat = material(0x344950, .75), deckMat = material(0x6a6c60, .81), fittingMat = material(0x839094, .53, .52), darkMat = material(0x26383d, .79), whiteMat = material(0xc3c8bc, .81), testMat = material(0xc39a5b, .7);
  function mesh(parent, name, geometry, mat, p) {
    const m = new T.Mesh(geometry, mat); m.name = name; if (p) m.position.set(...p); m.castShadow = m.receiveShadow = true; parent.add(m); return m;
  }
  function box(name, size, p, mat = fittingMat) { return mesh(targetGroup, name, new T.BoxGeometry(...size), mat, p); }
  // The complete visible hull occupies exactly the slab-test collision box:
  // X 843..857, Y -6..3, Z -50..50. Scenery above it is not a damage solver.
  box('Trial pontoon hull · 14 × 9 × 100 m', targetBounds.size, [0, -1.5, 0], hullMat);
  box('Non-slip working deck', [13.8, .08, 99.5], [0, 3.045, 0], deckMat);
  for (const z of [-47, 47]) box('Raised end coaming ' + z, [12.4, .24, 1.0], [0, 3.18, z], darkMat);
  box('Small trial instrumentation house', [5.5, 3.8, 8.5], [0, 4.96, 32], whiteMat);
  box('Instrumentation roof', [5.9, .17, 9.0], [0, 6.97, 32], darkMat);
  for (const side of [-1, 1]) {
    box('Instrument-house observation glazing ' + side, [.025, .8, 5.8], [side * 2.765, 5.6, 31.3], darkMat);
    box('Deck edge rubbing strip ' + side, [.10, .20, 98], [side * 6.96, 1.83, 0], darkMat);
    // High-contrast trial panels are geometry, with no texture asset dependency.
    for (let i = 0; i < 12; i++) box('Alternating hull trial panel ' + side + '/' + i, [.025, 1.35, 2.6], [side * 7.016, 1.0, -15.6 + i * 2.6], i % 2 ? darkMat : whiteMat);
    for (const z of [-40, -16, 8, 42]) box('Deck mooring plinth ' + side + '/' + z, [.55, .32, .8], [side * 5.5, 3.27, z], darkMat);
  }
  for (const z of [-31, -8, 13]) {
    box('Trial instrument mounting pad ' + z, [3.4, .28, 5.5], [0, 3.22, z], darkMat);
    box('Flush deck inspection hatch ' + z, [2.7, .055, 4.8], [0, 3.385, z], fittingMat);
  }
  // Rails, posts and crane booms share one low-cost instanced fitting draw.
  const rods = [], rod = (a, b, radius = .045) => rods.push({ a, b, radius });
  for (const side of [-1, 1]) {
    for (const y of [3.63, 4.12]) rod([side * 6.45, y, -46], [side * 6.45, y, 46], .028);
    for (let z = -46; z <= 46; z += 5.75) rod([side * 6.45, 3.10, z], [side * 6.45, 4.14, z], .034);
  }
  for (const z of [-25, 20]) {
    rod([2.4, 3.15, z], [2.4, 11.6, z], .14);
    rod([2.4, 11.3, z], [-3.6, 9.65, z], .095);
    rod([2.4, 5.0, z], [-3.6, 9.65, z], .055);
    rod([-3.6, 9.65, z], [-3.6, 4.2, z], .017);
    box('Trial crane winch ' + z, [.75, .58, .8], [2.4, 4.0, z], testMat);
    box('Trial crane hook ' + z, [.15, .4, .14], [-3.6, 4.02, z], darkMat);
  }
  rod([0, 7.0, 32], [0, 15.0, 32], .077);
  rod([-1.3, 12.4, 32], [1.3, 12.4, 32], .035);
  rod([0, 14.0, 31.35], [0, 14.0, 32.65], .03);
  const fitting = new T.InstancedMesh(new T.CylinderGeometry(1, 1, 1, 8), fittingMat, rods.length); fitting.name = 'Pooled barge rails and trial crane fittings';
  rods.forEach((r, i) => { const a = new T.Vector3(...r.a), b = new T.Vector3(...r.b), d = b.clone().sub(a); quaternion.setFromUnitVectors(up, d.clone().normalize()); matrix.compose(a.add(b).multiplyScalar(.5), quaternion, new T.Vector3(r.radius, d.length(), r.radius)); fitting.setMatrixAt(i, matrix); });
  fitting.instanceMatrix.needsUpdate = true; fitting.castShadow = true; targetGroup.add(fitting);
  // Batch the immutable box scenery by material, retaining the hull's exact
  // geometry. The target remains a single group for purely visual recoil.
  targetGroup.updateMatrixWorld(true);
  const buckets = new Map();
  for (const child of [...targetGroup.children]) if (child.isMesh && !child.isInstancedMesh) {
    if (!buckets.has(child.material)) buckets.set(child.material, []); buckets.get(child.material).push(child);
  }
  for (const [mat, children] of buckets) {
    if (children.length < 2) continue;
    const vertices = [], normals = [], indices = []; let offset = 0;
    for (const child of children) {
      child.updateMatrix(); const g = child.geometry, p = g.attributes.position, n = g.attributes.normal, nm = new T.Matrix3().getNormalMatrix(child.matrix);
      for (let i = 0; i < p.count; i++) { const v = new T.Vector3().fromBufferAttribute(p, i).applyMatrix4(child.matrix), normal = new T.Vector3().fromBufferAttribute(n, i).applyMatrix3(nm).normalize(); vertices.push(v.x, v.y, v.z); normals.push(normal.x, normal.y, normal.z); }
      for (let i = 0; i < g.index.count; i++) indices.push(g.index.getX(i) + offset); offset += p.count; targetGroup.remove(child);
    }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(vertices, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(normals, 3)); g.setIndex(indices); g.computeBoundingSphere();
    mesh(targetGroup, 'Batched trial barge fittings · ' + children.length + ' pieces', g, mat);
  }
  // A formation still strikes one physical barge. Keep one contact mark per
  // member so seeking backwards removes only marks whose events have not run.
  const scarGeometry = new T.CircleGeometry(1.55, 18), scarPositions = scarGeometry.attributes.position;
  for (let i = 1; i < scarPositions.count; i++) { const rough = .77 + noise(i + 811) * .23; scarPositions.setXY(i, scarPositions.getX(i) * rough, scarPositions.getY(i) * rough); }
  scarPositions.needsUpdate = true;
  const scarMaterial = material(0x17262b, .94);
  const scars = Array.from({ length: 3 }, (_, member) => {
    const scar = new T.Group(); scar.name = 'Contact-only visual hull scuff ' + (member + 1); scar.visible = false; targetGroup.add(scar);
    mesh(scar, 'Ragged dark underwater contact mark', scarGeometry, scarMaterial);
    for (let i = 0; i < 3; i++) {
      const plate = mesh(scar, 'Small visually buckled hull lip ' + i, new T.BoxGeometry(.16, 1.05 + i * .17, .06), darkMat, [-.63 + i * .57, .08 - i * .12, .045]); plate.rotation.z = -.27 + i * .21; plate.rotation.y = -.12 + i * .09;
    }
    // The scar and its three tiny buckled lips share one draw per contact.
    const vertices = [], normals = [], indices = []; let offset = 0;
    for (const child of [...scar.children]) {
      child.updateMatrix(); const g = child.geometry, p = g.attributes.position, n = g.attributes.normal, nm = new T.Matrix3().getNormalMatrix(child.matrix);
      for (let i = 0; i < p.count; i++) { const v = new T.Vector3().fromBufferAttribute(p, i).applyMatrix4(child.matrix), normal = new T.Vector3().fromBufferAttribute(n, i).applyMatrix3(nm).normalize(); vertices.push(v.x, v.y, v.z); normals.push(normal.x, normal.y, normal.z); }
      for (let i = 0; i < g.index.count; i++) indices.push(g.index.getX(i) + offset); offset += p.count; scar.remove(child);
    }
    const geometry = new T.BufferGeometry(); geometry.setAttribute('position', new T.Float32BufferAttribute(vertices, 3)); geometry.setAttribute('normal', new T.Float32BufferAttribute(normals, 3)); geometry.setIndex(indices); geometry.computeBoundingSphere();
    mesh(scar, 'Batched ragged hull contact scar and lips', geometry, scarMaterial);
    return scar;
  });
  const effects = new T.Group(); effects.name = 'Causal torpedo-entry and target-contact effects'; group.add(effects);
  const spriteCapacity = 360, spriteGeometry = new T.InstancedBufferGeometry();
  const quad = new T.PlaneGeometry(1, 1); spriteGeometry.index = quad.index; spriteGeometry.attributes.position = quad.attributes.position; spriteGeometry.attributes.uv = quad.attributes.uv;
  const centres = new T.InstancedBufferAttribute(new Float32Array(spriteCapacity * 3), 3), dimensions = new T.InstancedBufferAttribute(new Float32Array(spriteCapacity * 2), 2), tint = new T.InstancedBufferAttribute(new Float32Array(spriteCapacity * 3), 3), styles = new T.InstancedBufferAttribute(new Float32Array(spriteCapacity * 2), 2);
  spriteGeometry.setAttribute('aCentre', centres); spriteGeometry.setAttribute('aSize', dimensions); spriteGeometry.setAttribute('aTint', tint); spriteGeometry.setAttribute('aStyle', styles); spriteGeometry.instanceCount = 0;
  const spriteMaterial = new T.ShaderMaterial({ transparent: true, depthWrite: false, side: T.DoubleSide,
    vertexShader: `attribute vec3 aCentre,aTint;attribute vec2 aSize,aStyle;varying vec2 vUv,vStyle;varying vec3 vTint;
      void main(){vUv=uv;vStyle=aStyle;vTint=aTint;vec4 p=modelViewMatrix*vec4(aCentre,1.);p.xy+=position.xy*aSize;gl_Position=projectionMatrix*p;}`,
    fragmentShader: `varying vec2 vUv,vStyle;varying vec3 vTint;float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}
      void main(){vec2 p=vUv*2.-1.;float cloud=n(p*3.7+vStyle.y)+.45*n(p*8.4-vStyle.y);float r=length(p)*(1.+(cloud-.7)*.22);float edge=1.-smoothstep(.44,1.,r);float shade=.72+.28*sqrt(max(0.,1.-dot(p,p)));gl_FragColor=vec4(vTint*shade,vStyle.x*edge*(.68+.32*cloud));
        #include <tonemapping_fragment>
        #include <encodings_fragment>
      }` });
  const sprites = new T.Mesh(spriteGeometry, spriteMaterial); sprites.name = 'Pooled low spray, bubbles, blast mist and smoke'; sprites.frustumCulled = false; sprites.renderOrder = 4; effects.add(sprites);
  const foamCapacity = 160, foamGeometry = new T.PlaneGeometry(2, 2), foamInfo = new T.InstancedBufferAttribute(new Float32Array(foamCapacity * 3), 3); foamGeometry.setAttribute('aInfo', foamInfo);
  const foamMaterial = new T.ShaderMaterial({ transparent: true, depthWrite: false, side: T.DoubleSide,
    vertexShader: `attribute vec3 aInfo;varying vec2 vUv;varying vec3 vInfo;void main(){vUv=uv;vInfo=aInfo;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}`,
    fragmentShader: `varying vec2 vUv;varying vec3 vInfo;float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}void main(){vec2 p=vUv*2.-1.;float angle=atan(p.y,p.x),r=length(p);float rag=sin(angle*13.+vInfo.y)*.05+sin(angle*23.-vInfo.y)*.025;float patchy=hash(floor(p*17.+vInfo.y));float mask=vInfo.z>.5?exp(-pow((r-.78-rag)/.105,2.))*(.24+.76*step(.31,patchy)):(1.-smoothstep(.48,.97,r+rag))*(.3+.7*patchy);gl_FragColor=vec4(vec3(.62,.73,.74),vInfo.x*mask);
      #include <tonemapping_fragment>
      #include <encodings_fragment>
    }` });
  const foam = new T.InstancedMesh(foamGeometry, foamMaterial, foamCapacity); foam.name = 'Pooled irregular surface wake and blast foam'; foam.count = 0; foam.frustumCulled = false; foam.renderOrder = 3; effects.add(foam);
  const debris = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), darkMat, 32); debris.name = 'Pooled small trial-target fragments'; debris.count = 0; debris.frustumCulled = false; debris.castShadow = true; effects.add(debris);
  const bounds = new T.Box3(); let spriteCount = 0, foamCount = 0, debrisCount = 0;
  const colour = { spray: [.57, .70, .73], column: [.84, .94, .97], bubbles: [.57, .78, .79], smoke: [.10, .12, .12], flash: [1.0, .52, .12] };
  function puff(p, width, height, alpha, kind, seed) {
    if (spriteCount >= spriteCapacity || alpha <= .002 || !finite3(p)) return;
    centres.setXYZ(spriteCount, ...p); dimensions.setXY(spriteCount, width, height); tint.setXYZ(spriteCount, ...colour[kind]); styles.setXY(spriteCount, clamp(alpha), seed); spriteCount++;
    bounds.expandByPoint(new T.Vector3(p[0] - width * .5, p[1] - height * .5, p[2] - width * .5)); bounds.expandByPoint(new T.Vector3(p[0] + width * .5, p[1] + height * .5, p[2] + width * .5));
  }
  function patch(x, z, width, length, heading, alpha, seed, ring = false) {
    if (foamCount >= foamCapacity || alpha <= .002) return;
    quaternion.setFromEuler(new T.Euler(-Math.PI / 2, 0, heading, 'XYZ')); position.set(x, .045, z); scale.set(width, length, 1); matrix.compose(position, quaternion, scale); foam.setMatrixAt(foamCount, matrix); foamInfo.setXYZ(foamCount, clamp(alpha), seed, ring ? 1 : 0); foamCount++;
    bounds.expandByPoint(new T.Vector3(x - Math.max(width, length), 0, z - Math.max(width, length))); bounds.expandByPoint(new T.Vector3(x + Math.max(width, length), .1, z + Math.max(width, length)));
  }
  const eventOf = (run, name) => { const e = run?.[name]; return e && Number.isFinite(e.time) && finite3(e.position) ? e : null; };
  function update(time, sample, run) {
    const t = Number.isFinite(Number(time)) ? Number(time) : 0;
    const samples = Array.isArray(sample) ? sample : [sample], runs = Array.isArray(run) ? run : [run];
    // Reset the shared pools once, then append each member's causal effects.
    // A bounded formation never creates duplicate scenery or effect draws.
    const memberCount = Math.min(3, Math.max(samples.length, runs.length));
    spriteCount = foamCount = debrisCount = 0; bounds.makeEmpty(); targetGroup.position.set(850, 0, 0); targetGroup.rotation.set(0, 0, 0);
    scars.forEach(scar => { scar.visible = false; });
    let recoilRoll = 0, recoilHeave = 0;
    const perMember = [];
    for (let member = 0; member < memberCount; member++) {
      const sample = samples[member], run = runs[member], scar = scars[member];
      const entry = eventOf(run, 'entry'), contact = eventOf(run, 'contact');
      const before = { sprites: spriteCount, foam: foamCount, debris: debrisCount };
    const contactAge = contact && t >= contact.time ? t - contact.time : -1;
    if (contactAge >= 0) {
      const normal = new T.Vector3(...(finite3(contact.normal) ? contact.normal : [-1, 0, 0])); if (normal.lengthSq() < .001) normal.set(-1, 0, 0); normal.normalize();
      scar.visible = true; scar.position.set(contact.position[0] - 850, contact.position[1], contact.position[2]).addScaledVector(normal, .037); scar.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), normal); scar.scale.setScalar(.72 + .28 * smooth(contactAge / .18));
    }
    if (entry && t >= entry.time) {
      const age = t - entry.time, p = entry.position;
      if (age < 3.4) {
        const alpha = (1 - smooth((age - .25) / 3.1)) * .46;
        patch(p[0], p[2], .7 + age * 3.4, .7 + age * 3.4, 0, alpha, 14.5, true);
        patch(p[0], p[2], .6 + age * 2.1, .6 + age * 2.1, 0, alpha * .5, 33.2, true);
        for (let i = 0; i < 18; i++) {
          const phase = age - i * .016; if (phase < 0) continue;
          const a = i * 2.399963, velocity = 5.5 + noise(i + 2) * 6.5, radius = phase * (1.5 + noise(i + 9) * 2.5);
          const y = .15 + velocity * phase - 4.903325 * phase * phase;
          if (y > .03 && phase < 2.1) puff([p[0] + Math.cos(a) * radius, y, p[2] + Math.sin(a) * radius], .32 + phase * 1.2, .65 + phase * 1.7, (1 - smooth(phase / 2.1)) * .46, 'spray', i * 17.2);
        }
      }
      // Every wake sample lies between the actual entry and current body.
      // For this straight-heading trial that is the traversed path; only the
      // last 60 metres are displayed, and post-contact foam fades in place.
      if (finite3(sample?.position) && contactAge < 2.8) {
        const start = finite3(entry.center) ? entry.center : p, endpoint = contactAge >= 0 ? finite3(contact.center) ? contact.center : sample.position : sample.position, dx = endpoint[0] - start[0], dz = endpoint[2] - start[2], travelled = Math.hypot(dx, dz), ux = travelled > .01 ? dx / travelled : 1, uz = travelled > .01 ? dz / travelled : 0, heading = Math.atan2(uz, ux), tailLength = Math.min(60, travelled), fade = contactAge < 0 ? 1 : 1 - smooth(contactAge / 2.8);
        for (let i = 0; i < 22; i++) {
          const back = (i + .5) / 22 * tailLength; if (back > travelled || tailLength < .1) continue;
          const x = endpoint[0] - ux * back, z = endpoint[2] - uz * back, spread = .14 + back * .026, a = (1 - i / 24) * .34 * fade, wobble = Math.sin(back * 1.8 + t * .7) * .10;
          patch(x - uz * (spread + wobble), z + ux * (spread + wobble), .17 + spread * .18, .55 + tailLength / 25, heading - Math.PI / 2, a, i * 12.47);
          patch(x + uz * (spread - wobble), z - ux * (spread - wobble), .15 + spread * .15, .5 + tailLength / 26, heading - Math.PI / 2, a * .85, i * 9.17);
        }
        if (contactAge < 0) {
          for (let i = 0; i < 22; i++) {
            if (travelled < .1) continue;
            const cycle = ((t - entry.time) * .75 + i * .137) % 1, back = Math.min(travelled, .8 + cycle * Math.min(9, Math.max(0, travelled - .8))), side = (noise(i + 81) - .5) * .6, bodyY = sample.position[1];
            puff([sample.position[0] - ux * back - uz * side, Math.min(-.055, bodyY + cycle * Math.max(.1, -bodyY - .12)), sample.position[2] - uz * back + ux * side], .035 + cycle * .13, .045 + cycle * .16, (1 - cycle) * .31, 'bubbles', i * 13.13);
          }
        }
      }
    }
    if (contactAge >= 0 && contactAge < 6.4) {
      const a = contactAge, p = contact.position, side = Math.sign(p[0] - 850) || -1;
      recoilRoll += -side * .026 * Math.exp(-a / 1.1) * Math.sin(a * 3.8);
      recoilHeave += -.11 * Math.exp(-a / 1.2) * Math.sin(a * 4.1);
      const foamAlpha = (1 - smooth((a - .65) / 5.6)) * .48;
      patch(p[0], p[2], 1.1 + a * 3.0, 1.1 + a * 3.0, 0, foamAlpha, 75.2, true);
      patch(p[0], p[2], 1.6 + a * 2.1, 1.1 + a * 1.6, .2, foamAlpha * .43, 18.7);
      if (a < .32) puff([p[0], Math.max(-.8, p[1]), p[2]], 1.8 + a * 6, 1.5 + a * 5, (1 - a / .32) * .53, 'flash', 4.2);
      // Small gas/mist lobes at the actual underwater contact precede the
      // white water column. There is no above-deck orange fireball.
      if (a < 1.7) for (let i = 0; i < 12; i++) {
        const angle = i * 2.399963, reach = (.5 + noise(i + 1) * 2.0) * a, size = .5 + a * (2.0 + noise(i + 5));
        puff([p[0] + Math.cos(angle) * reach, p[1] + .3 + a * 1.8, p[2] + Math.sin(angle) * reach], size, size * .72, (1 - smooth(a / 1.7)) * .54, 'spray', 111 + i * 8.7);
      }
      // An overlapping white sheet gives the water impulse a readable core.
      // Its support is displaced only a few metres along the actual outward
      // contact normal so the opaque hull cannot hide the entire eruption.
      if (a > 0 && a < 3.5) {
        const normal = new T.Vector3(...(finite3(contact.normal) ? contact.normal : [-1, 0, 0])); normal.y = 0; if (normal.lengthSq() < .001) normal.set(side, 0, 0); normal.normalize();
        const tangent = new T.Vector3(normal.z, 0, -normal.x), growth = smooth(a / .85), fall = Math.max(0, a - 1.05), top = Math.max(1.2, 2 + growth * 18.3 - fall * fall * 3.0), opacity = smooth(a / .12) * (1 - smooth((a - 1.3) / 2.2)) * .77;
        for (let i = 0; i < 7; i++) {
          const f = (i + .30) / 7, sideways = (noise(i + 701) - .5) * 1.55, outward = 1.9 + f * .7 + growth * .32;
          const width = (3.0 + (1 - f) * 3.3) * (.54 + growth * .46), height = 4.1 + (1 - f) * 3.3;
          puff([p[0] + normal.x * outward + tangent.x * sideways, .12 + f * top, p[2] + normal.z * outward + tangent.z * sideways], width, height, opacity * (.90 + noise(i + 711) * .10), 'column', 1401 + i * 13.7);
        }
        // The lower skirt separates into short, ragged curtains rather than
        // a round cloud. It joins the rings and the older ballistic droplets.
        for (let i = 0; i < 4; i++) {
          const sideways = (i - 1.5) * (1.1 + growth * .40), outward = 2.4 + noise(i + 723) * .45;
          puff([p[0] + normal.x * outward + tangent.x * sideways, .4 + growth * (2.5 + noise(i + 733)), p[2] + normal.z * outward + tangent.z * sideways], 2.2 + growth * 2.0, 3.8 + growth * 3.4, opacity * .64, 'column', 1511 + i * 17.1);
        }
      }
      for (let i = 0; i < 34; i++) {
        const age = a - noise(i + 120) * .17; if (age < 0 || age > 3.65) continue;
        const angle = i * 2.399963, speed = 11 + noise(i + 31) * 9, radius = age * (1.0 + noise(i + 88) * 3.1), y = .12 + speed * age - 4.903325 * age * age;
        if (y < .05) continue;
        puff([p[0] + Math.cos(angle) * radius, y, p[2] + Math.sin(angle) * radius], .45 + age * 2.0, .8 + age * 2.35, (1 - smooth(age / 3.65)) * .51, 'spray', 330 + i * 4.7);
      }
      if (a > .2) for (let i = 0; i < 16; i++) {
        const age = a - .2 - i * .027; if (age < 0 || age > 5.8) continue;
        const angle = i * 2.399963, width = .8 + age * (1.05 + noise(i + 301) * .5), alpha = smooth(age / .5) * (1 - smooth((age - 1.6) / 4.2)) * .15;
        puff([p[0] + Math.cos(angle) * (1 + age * .38) + age * .45, 1.7 + age * (1.4 + noise(i + 303) * .9), p[2] + Math.sin(angle) * (1 + age * .4)], width, width * 1.15, alpha, 'smoke', 711 + i * 5.3);
      }
      if (a < 3.8) for (let i = 0; i < 10 && debrisCount < 32; i++) {
        const angle = i * 2.399963, speed = 2.3 + noise(i + 451) * 4.8, y = .2 + (6.8 + noise(i + 466) * 7) * a - 4.903325 * a * a;
        if (y < .025) continue;
        position.set(p[0] + Math.cos(angle) * speed * a, y, p[2] + Math.sin(angle) * speed * a); quaternion.setFromEuler(new T.Euler(a * (2 + i * .13), a * (1.3 + i * .17), i + a * 2.7)); scale.set(.09 + noise(i + 401) * .24, .08 + noise(i + 412) * .18, .12 + noise(i + 435) * .3); matrix.compose(position, quaternion, scale); debris.setMatrixAt(debrisCount++, matrix); bounds.expandByPoint(position);
      }
    }
      perMember.push({
        index: member, sprayAndSmoke: spriteCount - before.sprites, surfaceFoam: foamCount - before.foam, debris: debrisCount - before.debris,
        contactMark: scar.visible ? 1 : 0, entryAge: entry && t >= entry.time ? t - entry.time : null, contactAge: contactAge >= 0 ? contactAge : null
      });
    }
    // Several near-simultaneous impulses add, with a visual-only bound that
    // settles back to the unchanged slab-test geometry as each impulse fades.
    targetGroup.rotation.z = clamp(recoilRoll, -.052, .052);
    targetGroup.position.y = clamp(recoilHeave, -.22, .22);
    spriteGeometry.instanceCount = spriteCount; sprites.visible = spriteCount > 0; foam.count = foamCount; foam.visible = foamCount > 0; debris.count = debrisCount; debris.visible = debrisCount > 0;
    for (const attr of [centres, dimensions, tint, styles, foamInfo]) attr.needsUpdate = true; foam.instanceMatrix.needsUpdate = debris.instanceMatrix.needsUpdate = true;
    targetGroup.updateMatrixWorld(true);
    const firstAge = key => { const ages = perMember.map(member => member[key]).filter(Number.isFinite); return ages.length ? Math.max(...ages) : null; };
    return {
      sprayAndSmoke: spriteCount, surfaceFoam: foamCount, debris: debrisCount, contactMark: perMember.reduce((sum, member) => sum + member.contactMark, 0),
      // Preserve the single-run fields; formation summary ages refer to the
      // earliest event already reached, while perMember retains every age.
      entryAge: firstAge('entryAge'), contactAge: firstAge('contactAge'),
      members: memberCount, entries: perMember.filter(member => member.entryAge !== null).length, contacts: perMember.filter(member => member.contactAge !== null).length, perMember
    };
  }
  update(0, null, null);
  return { group, targetGroup, targetBounds, update, getEffectBounds: () => bounds.isEmpty() ? null : bounds.clone() };
}
