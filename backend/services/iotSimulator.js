const BUILDINGS = [
  { id: 'admin', name: 'Administration Block', capacity: 240, baseOccupancy: 118, powerBase: 82 },
  { id: 'academic-a', name: 'Academic Block A', capacity: 620, baseOccupancy: 410, powerBase: 168 },
  { id: 'academic-b', name: 'Academic Block B', capacity: 540, baseOccupancy: 365, powerBase: 151 },
  { id: 'labs', name: 'Engineering Labs', capacity: 380, baseOccupancy: 242, powerBase: 236 },
  { id: 'library', name: 'Central Library', capacity: 460, baseOccupancy: 205, powerBase: 104 },
  { id: 'auditorium', name: 'Main Auditorium', capacity: 900, baseOccupancy: 95, powerBase: 72 },
  { id: 'hostel', name: 'Student Hostel', capacity: 720, baseOccupancy: 558, powerBase: 192 },
  { id: 'canteen', name: 'Campus Canteen', capacity: 320, baseOccupancy: 126, powerBase: 118 },
];

const state = new Map();
const activeScenarios = new Map();
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const drift = (value, amount, min, max) => clamp(value + (Math.random() - 0.5) * amount, min, max);
const round = (value, digits = 1) => Number(value.toFixed(digits));

function createInitial(building, index) {
  return {
    ...building,
    temperature: 27 + index * 0.35,
    humidity: 54 + index,
    smoke: 2 + index * 0.2,
    noise: 42 + index * 2,
    occupancy: building.baseOccupancy,
    power: building.powerBase,
    waterLeakage: false,
    airQuality: 48 + index * 4,
    maintenanceOpen: index === 3 ? 2 : index === 6 ? 1 : 0,
    updatedAt: new Date().toISOString(),
  };
}

BUILDINGS.forEach((building, index) => state.set(building.id, createInitial(building, index)));

function statusFor(building) {
  const critical = building.smoke >= 35 || building.waterLeakage || building.temperature >= 40 || building.airQuality >= 180 || building.power <= 1;
  const high = building.temperature >= 35 || building.airQuality >= 130 || building.power >= building.powerBase * 1.45;
  const warning = building.temperature >= 31 || building.airQuality >= 90 || building.occupancy / building.capacity >= 0.88 || building.maintenanceOpen > 1;
  if (critical) return 'red';
  if (high) return 'orange';
  if (warning) return 'yellow';
  if (building.occupancy / building.capacity < 0.15) return 'blue';
  return 'green';
}

function tick() {
  const buildings = BUILDINGS.map((definition) => {
    const current = state.get(definition.id);
    const anomaly = Math.random();
    const scenario = activeScenarios.get(definition.id);
    const next = {
      ...current,
      temperature: round(drift(current.temperature, 0.8, 23, anomaly > 0.992 ? 42 : 37)),
      humidity: round(drift(current.humidity, 3, 32, 82)),
      smoke: round(anomaly > 0.996 ? drift(current.smoke, 30, 0, 55) : drift(current.smoke, 1.2, 0, 14)),
      noise: round(drift(current.noise, 8, 28, 96), 0),
      occupancy: Math.round(drift(current.occupancy, 24, 0, definition.capacity)),
      power: round(drift(current.power, 14, definition.powerBase * 0.45, definition.powerBase * 1.7)),
      waterLeakage: anomaly > 0.997 ? true : anomaly < 0.08 ? false : current.waterLeakage,
      airQuality: round(drift(current.airQuality, 12, 20, anomaly > 0.993 ? 210 : 155), 0),
      updatedAt: new Date().toISOString(),
    };
    if (scenario && scenario.until > Date.now()) Object.assign(next, scenario.patch);
    else {
      if (scenario) activeScenarios.delete(definition.id);
      delete next.forcedStatus;
    }
    next.status = next.forcedStatus || statusFor(next);
    next.health = next.status === 'green' ? 94 : next.status === 'blue' ? 88 : next.status === 'yellow' ? 72 : next.status === 'orange' ? 51 : 28;
    next.alerts = [
      next.temperature >= 35 && `High temperature: ${next.temperature}°C`,
      next.smoke >= 20 && `Smoke threshold exceeded: ${next.smoke} ppm`,
      next.waterLeakage && 'Water leakage detected',
      next.airQuality >= 130 && `Poor air quality: AQI ${next.airQuality}`,
      next.occupancy / next.capacity >= 0.95 && 'Occupancy at critical capacity',
    ].filter(Boolean);
    state.set(definition.id, next);
    return next;
  });
  return { generatedAt: new Date().toISOString(), buildings };
}

const SCENARIOS = {
  fire: { buildingId: 'labs', patch: { smoke: 48, temperature: 42, airQuality: 205 } },
  'power-failure': { buildingId: 'academic-b', patch: { power: 0 } },
  flood: { buildingId: 'hostel', patch: { waterLeakage: true, humidity: 88 } },
  'bus-delay': { buildingId: 'academic-a', patch: { occupancy: 615, noise: 84 } },
  'internet-outage': { buildingId: 'admin', patch: { power: 34, forcedStatus: 'orange' } },
  'hvac-failure': { buildingId: 'academic-a', patch: { temperature: 41, humidity: 78 } },
  overcrowding: { buildingId: 'auditorium', patch: { occupancy: 900, temperature: 34, noise: 91 } },
  'medical-emergency': { buildingId: 'canteen', patch: { occupancy: 315, noise: 88, forcedStatus: 'red' } },
};

function triggerSimulation(type) {
  const scenario = SCENARIOS[type];
  if (scenario) activeScenarios.set(scenario.buildingId, { patch: scenario.patch, until: Date.now() + 90_000 });
  return tick();
}

function startIoTSimulator(io) {
  let snapshot = tick();
  io.on('connection', (socket) => {
    socket.emit('campus:snapshot', snapshot);
    socket.on('module:changed', (event) => socket.broadcast.emit('module:changed', event));
    socket.on('simulation:trigger', ({ type }) => {
      snapshot = triggerSimulation(type);
      io.emit('simulation:event', { id: `sim-${Date.now()}`, type, at: new Date().toISOString() });
      io.emit('iot:update', snapshot);
      io.emit('module:changed', { module: type === 'bus-delay' ? 'transport' : 'orchestrator', action: type, at: new Date().toISOString() });
    });
  });
  const timer = setInterval(() => {
    snapshot = tick();
    io.emit('iot:update', snapshot);
    const alerts = snapshot.buildings.flatMap((building) =>
      building.alerts.map((message) => ({ id: `${building.id}-${message}`, buildingId: building.id, buildingName: building.name, message, at: building.updatedAt }))
    );
    if (alerts.length) io.emit('campus:alerts', alerts);
  }, 4000);
  return () => clearInterval(timer);
}

module.exports = { startIoTSimulator };
