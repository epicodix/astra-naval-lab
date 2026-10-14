// Independent design motion. Coordinates are metres and time is seconds.
// +X is the nose, +Y is up, and +Z is starboard. No combat state is imported.
export const DURATION = 120;
const G = 9.80665;
const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));
const number = (value, fallback, lo, hi) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? clamp(parsed, lo, hi) : fallback;
};

export function clampFlightOptions(options = {}) {
  if (!options || typeof options !== 'object') options = {};
  return {
    path: ['level', 'turn', 'approach'].includes(options.path) ? options.path : 'level',
    speedMps: number(options.speedMps, 90, 60, 140),
    altitudeM: number(options.altitudeM, 120, 30, 600),
    bankDeg: number(options.bankDeg, 25, 0, 45),
    formation: options.formation === 'vee' ? 'vee' : 'solo',
  };
}

function positionAt(time, options, index) {
  const wing = options.formation === 'vee' && index > 0;
  const lag = wing ? 50 / options.speedMps : 0;
  const lateral = wing ? (index === 1 ? 32 : -32) : 0;
  const t = time - lag, v = options.speedMps;
  if (options.path === 'turn' && options.bankDeg > .05) {
    // The lead aircraft's coordinated level-turn radius. Formation positions
    // lie on adjacent circles; their velocity is derived from their own path.
    const radius = v * v / (G * Math.tan(options.bankDeg * Math.PI / 180));
    const angle = v / radius * t, ownRadius = radius - lateral;
    return [ownRadius * Math.sin(angle), options.altitudeM,
      radius - ownRadius * Math.cos(angle)];
  }
  let altitude = options.altitudeM;
  if (options.path === 'approach') {
    const u = clamp((t - 8) / 40, 0, 1);
    const easing = u * u * u * (10 + u * (-15 + 6 * u));
    altitude -= (options.altitudeM - 30) * easing;
  }
  return [v * t, altitude, lateral];
}

export function sampleFlight(time, input = {}, aircraftIndex = 0) {
  const options = clampFlightOptions(input);
  const parsedTime = Number(time), t = Number.isFinite(parsedTime) ? clamp(parsedTime, 0, DURATION) : 0;
  const index = options.formation === 'vee' ? Math.round(number(aircraftIndex, 0, 0, 2)) : 0;
  const position = positionAt(t, options, index), dt = .01;
  const before = positionAt(t - dt, options, index), after = positionAt(t + dt, options, index);
  const velocity = after.map((value, axis) => (value - before[axis]) / (2 * dt));
  const horizontalSpeed = Math.hypot(velocity[0], velocity[2]);
  const yawRad = -Math.atan2(velocity[2], velocity[0]);
  const pitchRad = Math.atan2(velocity[1], horizontalSpeed);
  const turnRate = options.path === 'turn' && options.bankDeg > .05
    ? G * Math.tan(options.bankDeg * Math.PI / 180) / options.speedMps : 0;
  const rollRad = turnRate ? Math.atan(horizontalSpeed * turnRate / G) : 0;
  return {
    time: t, index, position, velocity, yawRad, pitchRad, rollRad,
    speedMps: Math.hypot(...velocity), altitudeM: position[1],
    turnRateRad: turnRate, yawRateRad: -turnRate,
  };
}
