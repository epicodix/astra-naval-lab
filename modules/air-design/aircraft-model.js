// A fictional 1940s naval aircraft study. All geometry is in metres;
// +X points through the nose, +Y is up, and +Z is the starboard wing.
// No naval simulation, flight solver, asset loader or renderer is imported.
import { createTorpedo } from './torpedo-model.js';

export function createAircraft(T, options = {}) {
  const TAU = Math.PI * 2;
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const group = new T.Group();
  group.name = 'Pelagic T-40 · fictional naval torpedo aircraft';
  group.userData = { units: 'metres', forwardAxis: '+X', upAxis: '+Y', starboardAxis: '+Z', fictional: true };
  const parts = {};
  function part(id, title) {
    const p = new T.Group(); p.name = title; p.userData.partId = id;
    group.add(p); parts[id] = p; return p;
  }
  const fuselage = part('body', 'Fuselage · tapered semi-monocoque shell');
  Object.defineProperty(parts, 'fuselage', { value: fuselage, enumerable: false });
  const wings = part('wings', 'Wings · cambered airfoils, flaps and ailerons');
  const cockpit = part('cockpit', 'Cockpit · tandem seats and framed canopy');
  const engine = part('engine', 'Engine · twin-row radial and three-blade propeller');
  const tail = part('tail', 'Tail · stabilisers, elevators and rudder');
  const gear = part('gear', 'Landing gear · retractable main legs and tailwheel');
  const torpedo = part('torpedo', 'Torpedo · external belly store and suspension rack');
  const trim = part('details', 'Details · aerials, vents and maintenance fittings');
  function material(name, color, metalness = .25, roughness = .58, extra = {}) {
    const m = new T.MeshStandardMaterial({ color, metalness, roughness, ...extra }); m.name = name; return m;
  }
  const paint = material('Faded naval blue upper paint', options.color || 0x3c535f, .25, .65, { vertexColors: true });
  const plainPaint = material('Naval blue frames and panels', options.color || 0x405863, .22, .63);
  const underside = material('Warm grey underside paint', 0x9aabae, .23, .63);
  const metal = material('Dull aluminium and edge wear', 0xadb5b5, .78, .38);
  const darkMetal = material('Oxidised steel', 0x434b4d, .72, .49);
  const exhaustMetal = material('Heat-stained exhaust steel', 0x756052, .75, .59);
  const black = material('Rubber and dark recesses', 0x172126, .05, .84);
  const propPaint = material('Black propeller blades with faded tips', 0x3a4549, .55, .43, { vertexColors: true });
  const seatMaterial = material('Worn dark leather seat cushions', 0x584c3d, .02, .89);
  const glass = material('Slightly blue canopy glazing', 0xb5d0d8, .02, .14, { transparent: true, opacity: .31, depthWrite: false, side: T.DoubleSide });
  const tipColor = new T.Color(0xc5b781);
  const upperColor = new T.Color(options.color || 0x3c535f), lowerColor = new T.Color(0x9aabae);
  function mesh(parent, name, geometry, mat, position) {
    geometry.name = name + ' geometry';
    const m = new T.Mesh(geometry, mat); m.name = name;
    if (position) m.position.set(...position);
    m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  }
  const vec = a => new T.Vector3(...a);
  function rod(parent, name, a, b, radius, mat = metal, segments = 12) {
    const aa = vec(a), bb = vec(b), d = bb.clone().sub(aa);
    const m = mesh(parent, name, new T.CylinderGeometry(radius, radius, d.length(), segments), mat);
    m.position.copy(aa.add(bb).multiplyScalar(.5));
    m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); return m;
  }
  function tube(parent, name, points, radius, mat = metal, closed = false) {
    const curve = new T.CatmullRomCurve3(points.map(vec), closed, 'centripetal');
    return mesh(parent, name, new T.TubeGeometry(curve, Math.max(12, points.length * 3), radius, 6, closed), mat);
  }
  function line(parent, name, points, color = 0x819196, opacity = .6) {
    const g = new T.BufferGeometry().setFromPoints(points.map(vec)); g.name = name + ' geometry';
    const l = new T.Line(g, new T.LineBasicMaterial({ color, transparent: opacity < 1, opacity })); l.name = name; parent.add(l); return l;
  }
  function ring(parent, name, radius, thickness, position, mat = metal) {
    const r = mesh(parent, name, new T.TorusGeometry(radius, thickness, 6, 48), mat, position); r.rotation.y = Math.PI / 2; return r;
  }
  // Interpolate elliptical station radii with a cubic profile, retaining a
  // continuous shell instead of stacking spheres or square body sections.
  function stationAt(profile, x) {
    let i = 0; while (i < profile.length - 2 && x > profile[i + 1][0]) i++;
    const a = profile[Math.max(0, i - 1)], b = profile[i], c = profile[i + 1], d = profile[Math.min(profile.length - 1, i + 2)];
    const t = clamp((x - b[0]) / (c[0] - b[0]), 0, 1), t2 = t * t, t3 = t2 * t;
    const p = [x];
    for (let k = 1; k < 4; k++) p[k] = .5 * (2 * b[k] + (c[k] - a[k]) * t + (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * t2 + (-a[k] + 3 * b[k] - 3 * c[k] + d[k]) * t3);
    p[1] = Math.max(.008, p[1]); p[2] = Math.max(.008, p[2]); return p;
  }
  function skinGeometry(profile, lengthSteps = 64, radialSteps = 48, colorize = true, startAngle = 0, angleSpan = TAU) {
    const positions = [], colors = [], indices = [], lo = profile[0][0], hi = profile[profile.length - 1][0];
    for (let i = 0; i <= lengthSteps; i++) {
      const x = lo + (hi - lo) * i / lengthSteps, s = stationAt(profile, x);
      for (let j = 0; j <= radialSteps; j++) {
        const angle = startAngle + angleSpan * j / radialSteps, y = s[3] + s[1] * Math.cos(angle), z = s[2] * Math.sin(angle);
        positions.push(x, y, z);
        if (colorize) {
          const mix = clamp((-.12 - (y - s[3])) / .22 + .5, 0, 1);
          const c = upperColor.clone().lerp(lowerColor, mix);
          const wear = .96 + .04 * Math.sin(x * 8 + angle * 7) * Math.sin(angle * 15 - x * 3) + .014 * Math.sin(x * 31 + angle * 23);
          c.multiplyScalar(wear); colors.push(c.r, c.g, c.b);
        }
      }
    }
    for (let i = 0; i < lengthSteps; i++) for (let j = 0; j < radialSteps; j++) {
      const a = i * (radialSteps + 1) + j, b = a + radialSteps + 1; indices.push(a, a + 1, b, a + 1, b + 1, b);
    }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    if (colorize) g.setAttribute('color', new T.Float32BufferAttribute(colors, 3)); g.setIndex(indices); g.computeVertexNormals(); return g;
  }
  const fuselageProfile = [
    [-5.88, .03, .025, .23], [-5.4, .16, .13, .20], [-4.7, .32, .25, .16],
    [-3.5, .48, .37, .10], [-2.4, .61, .48, .05], [-1.1, .75, .61, .015],
    [.3, .78, .65, 0], [1.7, .75, .63, 0], [3.0, .69, .61, .005], [4.45, .70, .62, .01]
  ];
  mesh(fuselage, 'Continuous elliptical fuselage skin', skinGeometry(fuselageProfile), paint);
  // Thin station seams and pooled flush rivets make the skin readable up
  // close without introducing hundreds of independent draw calls.
  const rivetTransforms = [], matrix = new T.Matrix4();
  for (const x of [-5.05, -4.35, -3.55, -2.65, -1.75, -.82, .2, 1.25, 2.35, 3.45, 4.2]) {
    const s = stationAt(fuselageProfile, x), outline = [];
    for (let j = 0; j <= 64; j++) { const a = TAU * j / 64; outline.push([x, s[3] + s[1] * Math.cos(a), s[2] * Math.sin(a)]); }
    line(fuselage, 'Skin station seam at ' + x.toFixed(2) + ' m', outline, 0x263e48, .34);
    for (let j = 0; j < 28; j++) { const a = TAU * (j + .25) / 28; rivetTransforms.push([x + .028, s[3] + (s[1] + .009) * Math.cos(a), (s[2] + .009) * Math.sin(a)]); }
  }
  const rivets = new T.InstancedMesh(new T.SphereGeometry(.011, 5, 4), metal, rivetTransforms.length); rivets.name = '308 flush fuselage rivets'; rivets.geometry.name = 'Pooled rivet geometry';
  rivetTransforms.forEach((p, i) => { matrix.makeTranslation(...p); rivets.setMatrixAt(i, matrix); }); rivets.instanceMatrix.needsUpdate = true; fuselage.add(rivets);
  for (const side of [-1, 1]) {
    const points = []; for (let i = 0; i < 48; i++) { const x = -5.3 + i * 9.5 / 47, s = stationAt(fuselageProfile, x); points.push([x, s[3] + .04, side * (s[2] + .005)]); }
    line(fuselage, (side < 0 ? 'Port' : 'Starboard') + ' longitudinal skin seam', points, 0x263e48, .38);
    mesh(trim, (side < 0 ? 'Port' : 'Starboard') + ' access hatch', new T.CircleGeometry(.18, 32), plainPaint, [-3.15, .02, side * .423]).rotation.y = side < 0 ? Math.PI : 0;
    rod(trim, 'Access hatch latch ' + side, [-3.25, .02, side * .43], [-3.05, .02, side * .43], .012, metal);
  }
  // Airfoil sections use cosine-spaced chord samples and a closed NACA-like
  // thickness distribution. The moving surfaces have their own geometry.
  function airfoilPoint(span, u, face, cfg) {
    const lead = cfg.leading(span), chord = cfg.chord(span), thickness = cfg.thickness || .105;
    const thick = Math.max(0, 5 * thickness * chord * (.2969 * Math.sqrt(Math.max(0, u)) - .126 * u - .3516 * u * u + .2843 * u ** 3 - .1036 * u ** 4));
    return [lead - chord * u, (cfg.baseY || 0) + (cfg.dihedral || 0) * span + (cfg.camber || .024) * chord * Math.sin(Math.PI * u) + face * thick, cfg.side * span];
  }
  function airfoilGeometry(cfg, minSpan, maxSpan, u0 = 0, u1 = 1, spanSteps = 24, chordSteps = 28) {
    const pos = [], color = [], index = [], surfaceCount = (spanSteps + 1) * (chordSteps + 1);
    for (let faceIndex = 0; faceIndex < 2; faceIndex++) for (let i = 0; i <= spanSteps; i++) for (let j = 0; j <= chordSteps; j++) {
      const face = faceIndex ? -1 : 1, span = minSpan + (maxSpan - minSpan) * i / spanSteps, u = u0 + (u1 - u0) * (1 - Math.cos(Math.PI * j / chordSteps)) / 2, p = airfoilPoint(span, u, face, cfg); pos.push(...p);
      const c = (face > 0 ? upperColor : lowerColor).clone().multiplyScalar(.975 + .025 * Math.sin(span * 9 + u * 11) + .012 * Math.cos(u * 80 - span * 13)); color.push(c.r, c.g, c.b);
    }
    function quad(a, b, c, d, reverse) { if (reverse) index.push(a, c, b, b, c, d); else index.push(a, b, c, b, d, c); }
    for (let f = 0; f < 2; f++) for (let i = 0; i < spanSteps; i++) for (let j = 0; j < chordSteps; j++) { const a = f * surfaceCount + i * (chordSteps + 1) + j; quad(a, a + 1, a + chordSteps + 1, a + chordSteps + 2, (cfg.side < 0) !== !!f); }
    for (let i = 0; i < spanSteps; i++) for (const j of [0, chordSteps]) { const a = i * (chordSteps + 1) + j, b = a + chordSteps + 1; quad(a, b, a + surfaceCount, b + surfaceCount, (j === 0) !== (cfg.side > 0)); }
    for (const i of [0, spanSteps]) for (let j = 0; j < chordSteps; j++) { const a = i * (chordSteps + 1) + j; quad(a, a + surfaceCount, a + 1, a + 1 + surfaceCount, (i === 0) !== (cfg.side > 0)); }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new T.Float32BufferAttribute(color, 3)); g.setIndex(index); g.computeVertexNormals(); return g;
  }
  function foil(parent, name, cfg, a, b, u0, u1, spanSteps = 24, chordSteps = 28) { return mesh(parent, name, airfoilGeometry(cfg, a, b, u0, u1, spanSteps, chordSteps), paint); }
  for (const side of [-1, 1]) {
    const prefix = side < 0 ? 'Port' : 'Starboard', cfg = { side, baseY: -.13, dihedral: .040, thickness: .115, camber: .026, leading: s => 2.0 - .155 * s - .32 * (Math.max(0, s - 6.8) / .7) ** 2, chord: s => 3.3 - .20 * s - .94 * (Math.max(0, s - 6.8) / .7) ** 2 };
    foil(wings, prefix + ' main wing airfoil', cfg, .48, 7.5, 0, .725, 34, 28);
    foil(wings, prefix + ' root trailing fairing', cfg, .48, .82, .728, 1, 4, 14);
    foil(wings, prefix + ' split flap', cfg, .845, 3.31, .742, 1, 18, 14);
    foil(wings, prefix + ' outboard aileron', cfg, 3.345, 7.17, .742, 1, 24, 14);
    foil(wings, prefix + ' rounded tip trailing cap', cfg, 7.19, 7.5, .728, 1, 8, 14);
    for (const u of [.23, .57, .735]) {
      const points = []; for (let i = 0; i < 60; i++) { const p = airfoilPoint(.6 + i * 6.7 / 59, u, 1, cfg); p[1] += .004; points.push(p); } line(wings, prefix + ' spar or hinge seam ' + u, points, 0x233b43, .42);
    }
    for (const s of [1.2, 2.35, 3.325, 4.5, 5.7, 6.7]) {
      const points = []; for (let i = 0; i <= 32; i++) { const p = airfoilPoint(s, .03 + .94 * i / 32, 1, cfg); p[1] += .005; points.push(p); } line(wings, prefix + ' wing rib panel ' + s, points, 0x70828a, .34);
    }
    // The folding joint is a surface seam and hardware, not a second wing
    // displaced from its aerodynamic profile.
    for (const u of [.24, .52]) {
      const p = airfoilPoint(3.325, u, 1, cfg); const hinge = mesh(wings, prefix + ' folding hinge ' + u, new T.CylinderGeometry(.065, .065, .19, 12), metal, p); hinge.rotation.x = Math.PI / 2;
    }
    const light = mesh(wings, prefix + ' navigation light lens', new T.SphereGeometry(.045, 12, 8), material(prefix + ' unlit navigation glass', side < 0 ? 0x7a3934 : 0x3f7463, .18, .21), [.76, .19, side * 7.45]); light.scale.set(1.5, .65, 1);
    const well = mesh(gear, prefix + ' closed main gear bay door', new T.BoxGeometry(1.23, .035, .72), underside, [.40, -.315, side * 1.56]); well.userData.gearDoor = true;
    mesh(wings, prefix + ' flap actuator fairing', new T.SphereGeometry(.15, 16, 12), underside, [-.25, -.22, side * 2.37]).scale.set(2.1, .58, .8);
  }
  // Elliptical wing-root fillets soften the transition into the fuselage.
  for (const side of [-1, 1]) { const f = mesh(wings, 'Wing root fillet ' + side, new T.SphereGeometry(1, 32, 16), plainPaint, [.40, -.22, side * .58]); f.scale.set(1.72, .26, .33); }
  for (const side of [-1, 1]) {
    const name = side < 0 ? 'Port' : 'Starboard', cfg = { side, baseY: .35, dihedral: .018, thickness: .075, camber: .006, leading: s => -3.88 - .23 * s - .15 * (s / 2.18) ** 4, chord: s => 1.71 - .39 * s };
    foil(tail, name + ' horizontal stabiliser', cfg, .12, 2.18, 0, .71, 20, 20);
    foil(tail, name + ' elevator', cfg, .16, 2.15, .728, 1, 18, 12);
    foil(tail, name + ' elevator trim tab', cfg, .85, 1.55, .94, 1, 8, 6).position.y = .004;
    const points = []; for (let i = 0; i < 30; i++) points.push(airfoilPoint(.2 + i * 1.9 / 29, .72, 1, cfg)); line(tail, name + ' elevator hinge', points, 0x223640, .72);
  }
  const fin = new T.Group(); fin.name = 'Vertical fin and separate rudder'; fin.position.y = .31; fin.rotation.x = -Math.PI / 2; tail.add(fin);
  const finCfg = { side: 1, thickness: .08, camber: .0001, leading: s => -3.70 - .51 * s - .13 * (s / 2.02) ** 3, chord: s => 1.83 - .48 * s };
  foil(fin, 'Vertical fin airfoil', finCfg, 0, 2.02, 0, .715, 24, 24);
  foil(fin, 'Separate rudder', finCfg, .015, 2.00, .735, 1, 24, 14);
  foil(fin, 'Rudder trim tab', finCfg, .52, 1.27, .94, 1, 9, 6).position.y = .004;
  const finHinge = []; for (let i = 0; i < 32; i++) finHinge.push(airfoilPoint(i * 2.0 / 31, .725, 1, finCfg)); line(fin, 'Rudder hinge and gap', finHinge, 0x263943, .78);
  // Each glazed canopy bay is independent of the aluminium arch and sill.
  const canopyStations = [[-2.25, .63, .12, .27], [-1.66, .73, .61, .43], [-.74, .77, .78, .475], [.31, .77, .83, .49], [1.18, .73, .73, .45], [1.92, .68, .16, .27]];
  const canopyPoint = (s, angle) => [s[0], s[1] + s[2] * Math.cos(angle), s[3] * Math.sin(angle)];
  for (let i = 0; i < canopyStations.length - 1; i++) for (let half = 0; half < 2; half++) {
    const positions = [], indices = [], a0 = half ? 0 : -Math.PI / 2, a1 = half ? Math.PI / 2 : 0;
    for (let longitudinal = 0; longitudinal <= 6; longitudinal++) for (let arc = 0; arc <= 12; arc++) { const f = longitudinal / 6, a = a0 + (a1 - a0) * arc / 12, s = canopyStations[i].map((v, k) => v + (canopyStations[i + 1][k] - v) * f); positions.push(...canopyPoint(s, a)); }
    for (let l = 0; l < 6; l++) for (let a = 0; a < 12; a++) { const v = l * 13 + a; indices.push(v, v + 1, v + 13, v + 1, v + 14, v + 13); }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(positions, 3)); g.setIndex(indices); g.computeVertexNormals();
    const pane = mesh(cockpit, 'Canopy glazed bay ' + (i + 1) + (half ? ' starboard' : ' port'), g, glass); pane.castShadow = false; pane.renderOrder = 2;
  }
  canopyStations.forEach((s, i) => { const p = []; for (let j = 0; j <= 24; j++) p.push(canopyPoint(s, -Math.PI / 2 + Math.PI * j / 24)); tube(cockpit, 'Canopy transverse arch ' + (i + 1), p, .023, plainPaint); });
  for (const a of [-Math.PI / 2, -.78, 0, .78, Math.PI / 2]) tube(cockpit, 'Canopy longitudinal rail ' + a.toFixed(2), canopyStations.map(s => canopyPoint(s, a)), a === 0 ? .015 : .023, plainPaint);
  for (const x of [.50, -1.07]) {
    const seat = new T.Group(); seat.name = x > 0 ? 'Pilot seat and harness' : 'Observer seat and harness'; seat.position.set(x, .86, 0); cockpit.add(seat);
    mesh(seat, 'Seat cushion ' + x, new T.BoxGeometry(.34, .08, .36), seatMaterial);
    mesh(seat, 'Seat back ' + x, new T.BoxGeometry(.065, .38, .36), seatMaterial, [-.16, .16, 0]).rotation.z = -.12;
    for (const z of [-.105, .105]) rod(seat, 'Seat shoulder belt ' + x + ' ' + z, [-.112, .32, z], [.07, .06, z * .8], .015, material('Faded canvas harness', 0xaba491, .01, .92));
    rod(cockpit, 'Seat support rail ' + x, [x - .22, .73, -.15], [x + .15, .73, -.15], .023, darkMetal);
  }
  const dashboard = mesh(cockpit, 'Pilot instrument panel', new T.BoxGeometry(.065, .26, .52), black, [1.03, 1.03, 0]); dashboard.rotation.z = -.16;
  for (let i = 0; i < 6; i++) {
    const z = -.18 + (i % 3) * .18, y = .98 + Math.floor(i / 3) * .12;
    const rim = mesh(cockpit, 'Instrument bezel ' + (i + 1), new T.CylinderGeometry(.043, .043, .011, 18), metal, [.990, y, z]); rim.rotation.z = Math.PI / 2;
    const face = mesh(cockpit, 'Instrument dial ' + (i + 1), new T.CircleGeometry(.035, 18), black, [.980, y, z]); face.rotation.y = -Math.PI / 2;
    line(cockpit, 'Instrument needle ' + (i + 1), [[.979, y, z], [.979, y + .022 * Math.cos(i), z + .022 * Math.sin(i)]], 0xbcc7bd, 1);
  }
  rod(cockpit, 'Pilot control column', [.73, .80, 0], [.79, 1.10, 0], .022, darkMetal);
  const wheel = mesh(cockpit, 'Pilot control grip', new T.TorusGeometry(.095, .014, 6, 20), black, [.79, 1.11, 0]); wheel.rotation.y = Math.PI / 2;
  rod(trim, 'Radio mast', [-1.92, 1.28, 0], [-2.06, 1.84, 0], .027, plainPaint);
  line(trim, 'Tensioned aerial wire', [[-2.06, 1.84, 0], [-3.5, 2.02, 0], [-4.86, 2.20, 0]], 0x8e9d9e, .75);
  rod(trim, 'Pitot tube', [1.18, .18, -6.19], [1.69, .18, -6.19], .017, metal);
  // Open-front cowling: the visible cylinders and crankcase sit inside the
  // shell instead of being painted on a closed nose.
  const cowlProfile = [[4.36, .73, .70, .01], [4.72, .84, .81, .01], [5.24, .83, .80, .01], [5.47, .755, .735, .01]];
  mesh(engine, 'Smooth open radial-engine cowling', skinGeometry(cowlProfile, 22, 56), paint);
  ring(engine, 'Rolled cowling lip', .745, .035, [5.47, .01, 0], metal).scale.set(1, 1.025, 1);
  const crank = mesh(engine, 'Radial engine reduction-gear case', new T.SphereGeometry(.34, 24, 16), darkMetal, [5.22, .01, 0]); crank.scale.x = .72;
  for (let row = 0; row < 2; row++) for (let i = 0; i < 7; i++) {
    const a = TAU * (i + row * .5) / 7, radial = new T.Vector3(0, Math.cos(a), Math.sin(a)), base = new T.Vector3(5.10 - row * .25, .01, 0);
    const centre = base.clone().addScaledVector(radial, .48), axis = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), radial);
    const cylinder = mesh(engine, 'Radial cylinder row ' + (row + 1) + ' unit ' + (i + 1), new T.CylinderGeometry(.116, .105, .31, 12), darkMetal); cylinder.position.copy(centre); cylinder.quaternion.copy(axis);
    for (let f = 0; f < 7; f++) { const fin = mesh(engine, 'Cylinder cooling fin ' + row + '-' + i + '-' + f, new T.CylinderGeometry(.13, .13, .011, 12), metal); fin.position.copy(base).addScaledVector(radial, .355 + f * .039); fin.quaternion.copy(axis); }
    rod(engine, 'Radial pushrod ' + row + '-' + i, [base.x + .13, .01 + radial.y * .21, radial.z * .21], [base.x + .13, .01 + radial.y * .625, radial.z * .625], .013, metal, 6);
  }
  for (let i = 0; i < 12; i++) {
    const a = TAU * i / 12, r = .745, flap = mesh(engine, 'Cooling exit flap ' + (i + 1), skinGeometry([[4.25, r + .045, r + .04, .01], [4.44, r, r - .005, .01]], 4, 5, false, a + .018, TAU / 12 - .036), plainPaint);
    flap.userData.function = 'cowling cooling outlet';
  }
  for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
    const y = -.27 - i * .14, z = side * (.69 - i * .055), points = [[4.47, y, z], [4.34, y - .06, z + side * .1], [4.04, y - .085, z + side * .125]];
    tube(engine, 'Exhaust stub ' + side + '-' + i, points, .057, exhaustMetal);
    const opening = mesh(engine, 'Soot-black exhaust opening ' + side + '-' + i, new T.CircleGeometry(.044, 16), black, points[2]); opening.rotation.y = -Math.PI / 2;
  }
  rod(engine, 'Propeller shaft', [5.27, .01, 0], [5.82, .01, 0], .09, metal, 18);
  const propeller = new T.Group(); propeller.name = 'Rotating three-blade propeller'; propeller.position.set(5.72, .01, 0); engine.add(propeller);
  mesh(propeller, 'Streamlined propeller spinner', skinGeometry([[0, .23, .23, 0], [.20, .20, .20, 0], [.38, .13, .13, 0], [.48, .008, .008, 0]], 18, 32, false), metal);
  function bladeGeometry() {
    const stations = [[.18, .095, .97], [.36, .19, .78], [.68, .205, .53], [1.06, .17, .35], [1.38, .115, .25], [1.56, .025, .20]], pos = [], colors = [], ind = [], n = 10, count = stations.length * (n + 1);
    for (let f = 0; f < 2; f++) for (let i = 0; i < stations.length; i++) for (let j = 0; j <= n; j++) {
      const [r, chord, twist] = stations[i], u = j / n, q = (u - .5) * chord, thickness = Math.sin(Math.PI * u) * chord * .065 * (f ? -1 : 1), x = q * Math.sin(twist) + thickness * Math.cos(twist), z = q * Math.cos(twist) - thickness * Math.sin(twist) + .042 * r; pos.push(x, r, z);
      const c = (r > 1.32 ? tipColor : new T.Color(0x323d42)).clone(); c.multiplyScalar(.94 + .06 * Math.sin(u * Math.PI)); colors.push(c.r, c.g, c.b);
    }
    for (let f = 0; f < 2; f++) for (let i = 0; i < stations.length - 1; i++) for (let j = 0; j < n; j++) { const a = f * count + i * (n + 1) + j, b = a + n + 1; if (f) ind.push(a, a + 1, b, a + 1, b + 1, b); else ind.push(a, b, a + 1, a + 1, b, b + 1); }
    for (let i = 0; i < stations.length - 1; i++) for (const j of [0, n]) { const a = i * (n + 1) + j, b = a + n + 1; if (j === 0) ind.push(a, a + count, b, a + count, b + count, b); else ind.push(a, b, a + count, a + count, b, b + count); }
    for (const i of [0, stations.length - 1]) for (let j = 0; j < n; j++) { const a = i * (n + 1) + j; if (i === 0) ind.push(a, a + 1, a + count, a + 1, a + 1 + count, a + count); else ind.push(a, a + count, a + 1, a + 1, a + count, a + 1 + count); }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new T.Float32BufferAttribute(colors, 3)); g.setIndex(ind); g.computeVertexNormals(); return g;
  }
  const bladeShape = bladeGeometry();
  for (let i = 0; i < 3; i++) mesh(propeller, 'Twisted propeller blade ' + (i + 1), bladeShape.clone(), propPaint).rotation.x = TAU * i / 3;
  const blur = mesh(propeller, 'Subtle propeller swept disc', new T.CircleGeometry(1.56, 64), material('Propeller motion haze', 0x88979d, .15, .6, { transparent: true, opacity: .035, depthWrite: false, side: T.DoubleSide })); blur.rotation.y = Math.PI / 2; blur.castShadow = false;
  // Flight/deployed is a static asset configuration. It never modifies the
  // aircraft root transform or any flight state supplied by a caller.
  const deployedGear = new T.Group(); deployedGear.name = 'Deployed landing gear assembly'; gear.add(deployedGear);
  const doors = []; gear.traverse(o => { if (o.userData.gearDoor) doors.push({ object: o, position: o.position.clone(), rotation: o.rotation.clone() }); });
  function wheelAssembly(parent, name, at, radius, width) {
    const g = new T.Group(); g.name = name; g.position.set(...at); parent.add(g);
    mesh(g, name + ' tyre', new T.TorusGeometry(radius * .77, radius * .23, 12, 40), black).scale.z = width / (radius * .46);
    const hub = mesh(g, name + ' aluminium hub', new T.CylinderGeometry(radius * .52, radius * .52, width * 1.02, 20), metal); hub.rotation.x = Math.PI / 2;
    const axle = mesh(g, name + ' axle cap', new T.CylinderGeometry(radius * .16, radius * .16, width * 1.11, 12), darkMetal); axle.rotation.x = Math.PI / 2;
    for (const side of [-1, 1]) for (let i = 0; i < 8; i++) { const a = TAU * i / 8; const hole = mesh(g, name + ' hub recess ' + side + '-' + i, new T.CircleGeometry(radius * .055, 8), black, [Math.sin(a) * radius * .32, Math.cos(a) * radius * .32, side * width * .515]); if (side < 0) hole.rotation.y = Math.PI; }
    return g;
  }
  for (const side of [-1, 1]) {
    const prefix = side < 0 ? 'Port' : 'Starboard';
    rod(deployedGear, prefix + ' main oleo strut', [.43, -.28, side * 1.44], [.61, -1.58, side * 1.64], .071, metal);
    rod(deployedGear, prefix + ' oleo sliding piston', [.58, -1.19, side * 1.58], [.64, -1.79, side * 1.66], .044, darkMetal);
    rod(deployedGear, prefix + ' rear drag brace', [-.33, -.29, side * 1.10], [.60, -1.44, side * 1.59], .039, darkMetal);
    rod(deployedGear, prefix + ' axle', [.64, -1.76, side * 1.59], [.64, -1.76, side * 1.89], .045, metal);
    tube(deployedGear, prefix + ' brake hose', [[.49, -.41, side * 1.47], [.57, -1.2, side * 1.62], [.74, -1.54, side * 1.71], [.65, -1.76, side * 1.72]], .009, black);
    wheelAssembly(deployedGear, prefix + ' main wheel', [.64, -1.76, side * 1.83], .365, .19);
  }
  rod(deployedGear, 'Tailwheel fork', [-5.14, -.03, 0], [-5.33, -.72, 0], .029, metal);
  wheelAssembly(deployedGear, 'Tailwheel', [-5.34, -.87, 0], .17, .095);
  // The hideable store uses the same independent asset as a released torpedo.
  // Its local origin is the release hardpoint; straps and rack stay aboard.
  const hardpointLocal = Object.freeze([0, -1.27, 0]);
  torpedo.position.fromArray(hardpointLocal);
  const torpedoModel = createTorpedo(T, { batch: options.batch !== false });
  const mountedTorpedo = torpedoModel.group; mountedTorpedo.name = 'Mounted bare torpedo'; torpedo.add(mountedTorpedo);
  for (const x of [-.88, 1.05]) {
    ring(torpedo, 'Store suspension strap ' + x, .235, .023, [x, 0, 0], darkMetal);
    for (const z of [-.15, .15]) rod(torpedo, 'Belly rack support ' + x + ' ' + z, [x, .205, z], [x, .48, z], .026, darkMetal);
    mesh(torpedo, 'Belly rack saddle ' + x, new T.BoxGeometry(.18, .075, .42), darkMetal, [x, .48, 0]);
  }
  // A few useful inspection details are physical fittings, with no lamps,
  // shader animation, particle system or canvas-generated texture required.
  for (const side of [-1, 1]) for (let i = 0; i < 5; i++) {
    const louvre = mesh(trim, 'Aft engine ventilation louvre ' + side + '-' + i, new T.BoxGeometry(.09, .045, .013), darkMetal, [3.17 + i * .125, .19, side * .597]); louvre.rotation.z = -.14;
  }
  mesh(trim, 'Tailcone maintenance cap', new T.SphereGeometry(.035, 10, 8), metal, [-5.88, .23, 0]).scale.set(1.5, .8, .8);
  let gearDeployed = false;
  function setGear(deployed) {
    gearDeployed = !!deployed; deployedGear.visible = gearDeployed;
    for (const d of doors) { d.object.position.copy(d.position); d.object.rotation.copy(d.rotation); if (gearDeployed) { d.object.rotation.x = Math.sign(d.position.z) * .93; d.object.position.y -= .22; } }
    group.userData.gear = gearDeployed ? 'deployed' : 'retracted'; return gearDeployed;
  }
  setGear(options.gear === 'deployed' || options.gear === true || options.gearDeployed === true);
  function setTorpedoPresent(present) {
    mountedTorpedo.visible = !!present;
    group.userData.torpedoPresent = mountedTorpedo.visible;
    return mountedTorpedo.visible;
  }
  setTorpedoPresent(options.torpedo !== false);
  const rpmOption = Number(options.propellerRPM), propellerRPM = Number.isFinite(rpmOption) ? clamp(rpmOption, 0, 2400) : 960;
  function animate(time) {
    const t = Number.isFinite(Number(time)) ? Number(time) : 0;
    propeller.rotation.x = ((t * propellerRPM * TAU / 60) % TAU + TAU) % TAU;
    return propeller.rotation.x;
  }
  // Batch opaque static pieces within their inspectable subsystem, retaining
  // the original piece names in geometry metadata. Glass keeps its sorting,
  // while propeller and gear transforms remain independently controllable.
  function batchStatic(parent, skip = new Set()) {
    group.updateMatrixWorld(true);
    const inverse = new T.Matrix4().copy(parent.matrixWorld).invert(), buckets = new Map(), lineBuckets = new Map();
    function visit(node) {
      if (skip.has(node)) return;
      if (node.isMesh && !node.isInstancedMesh && !Array.isArray(node.material) && !node.material.transparent) {
        const m = node.material, key = [m.color?.getHex(), m.metalness, m.roughness, !!m.vertexColors, m.side].join('/');
        if (!buckets.has(key)) buckets.set(key, { material: m, objects: [] }); buckets.get(key).objects.push(node);
      } else if (node.isLine && !Array.isArray(node.material)) {
        const m = node.material, key = [m.color.getHex(), m.opacity, m.transparent].join('/');
        if (!lineBuckets.has(key)) lineBuckets.set(key, { material: m, objects: [] }); lineBuckets.get(key).objects.push(node);
      }
      for (const child of node.children) visit(child);
    }
    for (const child of parent.children) visit(child);
    for (const bucket of buckets.values()) {
      if (bucket.objects.length < 2) continue;
      const positions = [], normals = [], colors = [], indices = [], names = []; let offset = 0;
      for (const o of bucket.objects) {
        const g = o.geometry, transform = new T.Matrix4().multiplyMatrices(inverse, o.matrixWorld), normalTransform = new T.Matrix3().getNormalMatrix(transform), p = g.attributes.position, n = g.attributes.normal, c = g.attributes.color;
        for (let i = 0; i < p.count; i++) {
          const v = new T.Vector3().fromBufferAttribute(p, i).applyMatrix4(transform), nn = new T.Vector3().fromBufferAttribute(n, i).applyMatrix3(normalTransform).normalize(); positions.push(v.x, v.y, v.z); normals.push(nn.x, nn.y, nn.z);
          if (bucket.material.vertexColors) colors.push(c ? c.getX(i) : 1, c ? c.getY(i) : 1, c ? c.getZ(i) : 1);
        }
        if (g.index) for (let i = 0; i < g.index.count; i++) indices.push(offset + g.index.getX(i)); else for (let i = 0; i < p.count; i++) indices.push(offset + i);
        offset += p.count; names.push(o.name); o.parent.remove(o);
      }
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(positions, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(normals, 3));
      if (colors.length) g.setAttribute('color', new T.Float32BufferAttribute(colors, 3)); g.setIndex(indices); g.userData.sourcePieces = names;
      const combined = mesh(parent, parent.userData.partId + ' · ' + bucket.material.name + ' · ' + names.length + ' static pieces', g, bucket.material); combined.userData.sourcePieces = names;
    }
    for (const bucket of lineBuckets.values()) {
      if (bucket.objects.length < 2) continue;
      const positions = [], names = [];
      for (const o of bucket.objects) {
        const p = o.geometry.attributes.position, transform = new T.Matrix4().multiplyMatrices(inverse, o.matrixWorld);
        for (let i = 0; i < p.count - 1; i++) { const a = new T.Vector3().fromBufferAttribute(p, i).applyMatrix4(transform), b = new T.Vector3().fromBufferAttribute(p, i + 1).applyMatrix4(transform); positions.push(a.x, a.y, a.z, b.x, b.y, b.z); }
        names.push(o.name); o.parent.remove(o);
      }
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(positions, 3)); g.name = parent.name + ' panel and fitting lines'; g.userData.sourcePieces = names;
      const lines = new T.LineSegments(g, bucket.material); lines.name = parent.name + ' · ' + names.length + ' panel or fitting lines'; lines.userData.sourcePieces = names; parent.add(lines);
    }
  }
  if (options.batch !== false) {
    const skip = new Set([propeller, deployedGear, mountedTorpedo, ...doors.map(d => d.object)]);
    for (const p of Object.values(parts)) batchStatic(p, skip);
    batchStatic(deployedGear);
  }
  animate(0); group.updateMatrixWorld(true);
  const box = new T.Box3().setFromObject(group), size = box.getSize(new T.Vector3()), centre = box.getCenter(new T.Vector3());
  let meshCount = 0, triangleCount = 0, vertexCount = 0, drawCallEstimate = 0;
  group.traverse(o => { if (o.isMesh || o.isLine) drawCallEstimate++; if (o.isMesh) { meshCount++; const g = o.geometry; vertexCount += g.attributes.position.count * (o.isInstancedMesh ? o.count : 1); triangleCount += (g.index ? g.index.count : g.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : 1); } });
  const bounds = { min: box.min.toArray(), max: box.max.toArray(), size: size.toArray(), center: centre.toArray() };
  const spec = Object.freeze({ name: 'Pelagic T-40', category: 'Fictional 1940s naval torpedo aircraft', historicalReplica: false, units: 'metres', coordinates: { nose: '+X', up: '+Y', starboard: '+Z' }, lengthMeters: Number(size.x.toFixed(3)), wingspanMeters: 15, canopyTopMeters: 1.60, propellerDiameterMeters: 3.12, torpedoLengthMeters: 5, torpedoDiameterMeters: .448, radialCylinderCount: 14, propellerBladeCount: 3, propellerRPM, meshCount, triangleCount, vertexCount, drawCallEstimate, partIds: Object.keys(parts) });
  return { group, parts, animate, setGear, setTorpedoPresent, hardpointLocal, mountedTorpedo, bounds, spec };
}
