// Independent fictional torpedo design asset. Native units are metres;
// +X points through the warhead, +Y is up, and +Z is starboard.
// The caller owns release, flight, water motion, effects and collision state.
export function createTorpedo(T, options = {}) {
  const TAU = Math.PI * 2, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const group = new T.Group(); group.name = 'Bare Pelagic torpedo · metre-scale store';
  group.userData = { units: 'metres', forwardAxis: '+X', upAxis: '+Y', starboardAxis: '+Z', fictional: true };
  function material(name, color, metalness, roughness) { const m = new T.MeshStandardMaterial({ color, metalness, roughness }); m.name = name; return m; }
  const metal = material('Dull aluminium and edge wear', 0xadb5b5, .78, .38);
  const darkMetal = material('Oxidised steel', 0x434b4d, .72, .49);
  const torpMetal = material('Brushed torpedo steel', 0x818f92, .72, .46);
  const warhead = material('Dark warhead shell', 0x56656b, .62, .57);
  const bronze = material('Torpedo bronze screws', 0x978a69, .76, .47);
  function mesh(parent, name, geometry, mat, position) {
    geometry.name = name + ' geometry'; const m = new T.Mesh(geometry, mat); m.name = name;
    if (position) m.position.set(...position); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  }
  function stationAt(profile, x) {
    let i = 0; while (i < profile.length - 2 && x > profile[i + 1][0]) i++;
    const a = profile[Math.max(0, i - 1)], b = profile[i], c = profile[i + 1], d = profile[Math.min(profile.length - 1, i + 2)], t = clamp((x - b[0]) / (c[0] - b[0]), 0, 1), t2 = t * t, t3 = t2 * t, p = [x];
    for (let k = 1; k < 4; k++) p[k] = .5 * (2 * b[k] + (c[k] - a[k]) * t + (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * t2 + (-a[k] + 3 * b[k] - 3 * c[k] + d[k]) * t3);
    p[1] = Math.max(.008, p[1]); p[2] = Math.max(.008, p[2]); return p;
  }
  function skin(profile, lengthSteps, radialSteps) {
    const pos = [], index = [], lo = profile[0][0], hi = profile[profile.length - 1][0];
    for (let i = 0; i <= lengthSteps; i++) {
      const x = lo + (hi - lo) * i / lengthSteps, s = stationAt(profile, x);
      for (let j = 0; j <= radialSteps; j++) { const a = TAU * j / radialSteps; pos.push(x, s[3] + s[1] * Math.cos(a), s[2] * Math.sin(a)); }
    }
    for (let i = 0; i < lengthSteps; i++) for (let j = 0; j < radialSteps; j++) { const a = i * (radialSteps + 1) + j, b = a + radialSteps + 1; index.push(a, a + 1, b, a + 1, b + 1, b); }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(index); g.computeVertexNormals(); return g;
  }
  function rod(parent, name, a, b, radius, mat) {
    const aa = new T.Vector3(...a), bb = new T.Vector3(...b), d = bb.clone().sub(aa), m = mesh(parent, name, new T.CylinderGeometry(radius, radius, d.length(), 6), mat);
    m.position.copy(aa.add(bb).multiplyScalar(.5)); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); return m;
  }
  const profile = [[-2.66, .035, .035, 0], [-2.48, .10, .10, 0], [-2.13, .175, .175, 0], [-1.55, .219, .219, 0], [.95, .224, .224, 0], [1.55, .22, .22, 0], [1.92, .16, .16, 0], [2.19, .045, .045, 0], [2.22, .008, .008, 0]];
  mesh(group, 'Rounded torpedo body', skin(profile, 64, 32), torpMetal);
  mesh(group, 'Torpedo warhead shell', skin([[.95, .226, .226, 0], [1.55, .222, .222, 0], [1.92, .162, .162, 0], [2.19, .046, .046, 0], [2.22, .009, .009, 0]], 24, 32), warhead);
  for (const x of [-1.53, -.40, .92, 1.54]) mesh(group, 'Torpedo casing join ' + x, new T.TorusGeometry(.225, .008, 6, 48), darkMetal, [x, 0, 0]).rotation.y = Math.PI / 2;
  for (let i = 0; i < 4; i++) {
    const shape = new T.Shape(); shape.moveTo(-2.38, .095); shape.lineTo(-2.78, .36); shape.lineTo(-1.98, .36); shape.lineTo(-1.73, .17); shape.closePath();
    const fin = mesh(group, 'Torpedo tail fin ' + (i + 1), new T.ExtrudeGeometry(shape, { depth: .022, bevelEnabled: false, curveSegments: 2 }), darkMetal); fin.position.z = -.011; fin.rotation.x = i * Math.PI / 2;
    rod(group, 'Tail cage brace ' + (i + 1), [-2.68, Math.cos(i * Math.PI / 2) * .35, Math.sin(i * Math.PI / 2) * .35], [-1.96, Math.cos(i * Math.PI / 2) * .35, Math.sin(i * Math.PI / 2) * .35], .009, metal);
  }
  const screws = [];
  for (let row = 0; row < 2; row++) {
    const screw = new T.Group(); screw.name = 'Contra-rotating torpedo screw row ' + (row + 1); screw.position.x = -2.52 - row * .10; group.add(screw); screws.push(screw);
    for (let i = 0; i < 4; i++) {
      const a = TAU * i / 4 + row * .35, blade = mesh(screw, 'Torpedo screw row ' + (row + 1) + ' blade ' + (i + 1), new T.SphereGeometry(.10, 10, 6), bronze, [0, Math.cos(a) * .105, Math.sin(a) * .105]); blade.scale.set(.22, 1, .36); blade.rotation.x = a;
    }
  }
  // Only opaque geometry with a shared material is combined. Screws remain
  // separate transforms, so the detached asset has six small draw calls.
  function batch(parent, skip = new Set()) {
    group.updateMatrixWorld(true); const inverse = new T.Matrix4().copy(parent.matrixWorld).invert(), buckets = new Map();
    function visit(node) { if (skip.has(node)) return; if (node.isMesh) { if (!buckets.has(node.material)) buckets.set(node.material, []); buckets.get(node.material).push(node); } for (const c of node.children) visit(c); }
    for (const c of parent.children) visit(c);
    for (const [mat, objects] of buckets) {
      if (objects.length < 2) continue;
      const pos = [], norm = [], index = [], names = []; let offset = 0;
      for (const o of objects) {
        const p = o.geometry.attributes.position, n = o.geometry.attributes.normal, transform = new T.Matrix4().multiplyMatrices(inverse, o.matrixWorld), normalTransform = new T.Matrix3().getNormalMatrix(transform);
        for (let i = 0; i < p.count; i++) { const v = new T.Vector3().fromBufferAttribute(p, i).applyMatrix4(transform), nn = new T.Vector3().fromBufferAttribute(n, i).applyMatrix3(normalTransform).normalize(); pos.push(v.x, v.y, v.z); norm.push(nn.x, nn.y, nn.z); }
        if (o.geometry.index) for (const i of o.geometry.index.array) index.push(offset + i); else for (let i = 0; i < p.count; i++) index.push(offset + i);
        offset += p.count; names.push(o.name); o.parent.remove(o);
      }
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(norm, 3)); g.setIndex(index); g.userData.sourcePieces = names;
      const m = mesh(parent, mat.name + ' · ' + names.length + ' torpedo pieces', g, mat); m.userData.sourcePieces = names;
    }
  }
  if (options.batch !== false) { batch(group, new Set(screws)); screws.forEach(s => batch(s)); }
  const rpmInput = Number(options.screwRPM), screwRPM = Number.isFinite(rpmInput) ? clamp(rpmInput, 0, 2400) : 640;
  function animate(seconds) {
    const t = Number.isFinite(Number(seconds)) ? Number(seconds) : 0;
    const phase = screwRPM > 0 ? (((t % (60 / screwRPM)) * screwRPM * TAU / 60) % TAU + TAU) % TAU : 0;
    screws[0].rotation.x = phase; screws[1].rotation.x = -phase; return phase;
  }
  animate(0); group.updateMatrixWorld(true);
  return { group, animate };
}
