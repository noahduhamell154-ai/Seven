const canvas = document.getElementById("grid");
const context = canvas.getContext("2d");
const statusNode = document.getElementById("status");
const scoreNode = document.getElementById("score");
const integrityNode = document.getElementById("integrity");
const vehicleNode = document.getElementById("vehicle");
const weaponsNode = document.getElementById("weapons");
const toolsNode = document.getElementById("tools");
const resetButton = document.getElementById("reset");

const GRID_SIZE = 20;
const CELL_SIZE = canvas.width / GRID_SIZE;
const MAX_TRAIL = 14;
const THREAT_LIMIT = 6;
const MAX_WEAPON_CHARGE = 100;
const MAX_TOOL_CHARGE = 100;
const WEAPON_RECHARGE_RATE = 3.2;
const TOOL_RECHARGE_RATE = 1.1;

const COLORS = {
  ai: "#66f3ff",
  trail: "#2d8cff",
  threat: "#ff8e3c",
  shield: "rgba(102, 243, 255, 0.16)",
  glow: "rgba(102, 243, 255, 0.32)",
  danger: "#ff5478",
};

let state;

function randomCell() {
  return {
    x: Math.floor(Math.random() * GRID_SIZE),
    y: Math.floor(Math.random() * GRID_SIZE),
  };
}

function sameCell(a, b) {
  return a.x === b.x && a.y === b.y;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function spawnThreat() {
  const edge = Math.floor(Math.random() * 4);

  if (edge === 0) return { x: Math.floor(Math.random() * GRID_SIZE), y: 0 };
  if (edge === 1) return { x: GRID_SIZE - 1, y: Math.floor(Math.random() * GRID_SIZE) };
  if (edge === 2) return { x: Math.floor(Math.random() * GRID_SIZE), y: GRID_SIZE - 1 };
  return { x: 0, y: Math.floor(Math.random() * GRID_SIZE) };
}

function createState() {
  return {
    program: "34",
    vehicle: "Aegis Rover",
    ai: { x: Math.floor(GRID_SIZE / 2), y: Math.floor(GRID_SIZE / 2) },
    trail: [],
    threats: Array.from({ length: 3 }, spawnThreat),
    score: 0,
    integrity: 100,
    weaponCharge: MAX_WEAPON_CHARGE,
    toolCharge: MAX_TOOL_CHARGE,
    running: true,
    pulse: 0,
  };
}

function findNearestThreat() {
  if (state.threats.length === 0) return null;

  return state.threats.reduce((nearest, threat) => {
    const distance = Math.abs(threat.x - state.ai.x) + Math.abs(threat.y - state.ai.y);
    if (!nearest || distance < nearest.distance) {
      return { threat, distance };
    }
    return nearest;
  }, null)?.threat;
}

function moveAi() {
  const target = findNearestThreat();
  if (!target) return;

  state.trail.unshift({ ...state.ai });
  if (state.trail.length > MAX_TRAIL) {
    state.trail.pop();
  }

  if (target.x !== state.ai.x) {
    state.ai.x += target.x > state.ai.x ? 1 : -1;
  } else if (target.y !== state.ai.y) {
    state.ai.y += target.y > state.ai.y ? 1 : -1;
  }
}

function moveThreats() {
  state.threats = state.threats.map((threat) => {
    const next = { ...threat };
    if (state.ai.x !== threat.x) {
      next.x += state.ai.x > threat.x ? 1 : -1;
    } else if (state.ai.y !== threat.y) {
      next.y += state.ai.y > threat.y ? 1 : -1;
    }
    next.x = clamp(next.x, 0, GRID_SIZE - 1);
    next.y = clamp(next.y, 0, GRID_SIZE - 1);
    return next;
  });
}

function resolveCollisions() {
  let availableWeaponCharge = state.weaponCharge;

  state.threats = state.threats.filter((threat) => {
    const aiContact = sameCell(threat, state.ai);
    const trailContact = state.trail.some((segment) => sameCell(segment, threat));
    const intercepted = (aiContact || trailContact) && availableWeaponCharge >= 8;

    if (intercepted) {
      state.score += 1;
      availableWeaponCharge -= 8;
    }

    return !intercepted;
  });

  state.weaponCharge = clamp(availableWeaponCharge, 0, MAX_WEAPON_CHARGE);

  const breaches = state.threats.filter((threat) => sameCell(threat, state.ai)).length;

  if (breaches > 0) {
    const repairCharges = Math.min(breaches, Math.floor(state.toolCharge / 20));
    const integrityChange = breaches * 20 - repairCharges * 20;
    state.toolCharge = Math.max(0, state.toolCharge - repairCharges * 20);
    state.integrity = clamp(state.integrity - integrityChange, 0, 100);
    state.threats = state.threats.filter((threat) => !sameCell(threat, state.ai));
  }

  while (state.threats.length < THREAT_LIMIT && Math.random() > 0.72) {
    state.threats.push(spawnThreat());
  }

  if (state.integrity <= 0) {
    state.running = false;
  }
}

function drawCell(cell, color, inset = 0.12) {
  const size = CELL_SIZE * (1 - inset * 2);
  context.fillStyle = color;
  context.fillRect(
    cell.x * CELL_SIZE + CELL_SIZE * inset,
    cell.y * CELL_SIZE + CELL_SIZE * inset,
    size,
    size,
  );
}

function render() {
  context.clearRect(0, 0, canvas.width, canvas.height);

  state.trail.forEach((segment, index) => {
    const alpha = 1 - index / (MAX_TRAIL + 2);
    drawCell(segment, `rgba(45, 140, 255, ${alpha.toFixed(2)})`, 0.2);
  });

  state.threats.forEach((threat) => drawCell(threat, COLORS.threat, 0.18));

  context.save();
  context.shadowBlur = 28;
  context.shadowColor = COLORS.glow;
  drawCell(state.ai, state.running ? COLORS.ai : COLORS.danger, 0.1);
  context.restore();

  context.strokeStyle = COLORS.shield;
  context.lineWidth = 4;
  context.strokeRect(
    state.ai.x * CELL_SIZE + 4,
    state.ai.y * CELL_SIZE + 4,
    CELL_SIZE - 8,
    CELL_SIZE - 8,
  );
}

function updateHud() {
  scoreNode.textContent = String(state.score);
  integrityNode.textContent = `${state.integrity}%`;
  vehicleNode.textContent = `Program ${state.program} · ${state.vehicle}`;
  weaponsNode.textContent = `${Math.round(state.weaponCharge)}% Pulse Cannon`;
  toolsNode.textContent = `${Math.round(state.toolCharge)}% Repair Tools`;
  statusNode.textContent = state.running
    ? state.threats.length > 0
      ? "Program 34 Patrolling"
      : "Program 34 Sector Clear"
    : "Program 34 Core Breached";
}

function tick() {
  if (state.running) {
    moveAi();
    moveThreats();
    resolveCollisions();
    state.weaponCharge = clamp(
      state.weaponCharge + WEAPON_RECHARGE_RATE,
      0,
      MAX_WEAPON_CHARGE,
    );
    state.toolCharge = clamp(state.toolCharge + TOOL_RECHARGE_RATE, 0, MAX_TOOL_CHARGE);
  }

  state.pulse += 1;
  render();
  updateHud();
}

function reset() {
  state = createState();
  render();
  updateHud();
}

resetButton.addEventListener("click", reset);

reset();
setInterval(tick, 220);
