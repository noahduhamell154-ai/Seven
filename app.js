const canvas = document.getElementById("grid");
const context = canvas.getContext("2d");
const statusNode = document.getElementById("status");
const scoreNode = document.getElementById("score");
const integrityNode = document.getElementById("integrity");
const vehicleNode = document.getElementById("vehicle");
const weaponNode = document.getElementById("weapon");
const toolNode = document.getElementById("tool");
const resetButton = document.getElementById("reset");

const GRID_SIZE = 20;
const CELL_SIZE = canvas.width / GRID_SIZE;
const MAX_TRAIL = 14;
const THREAT_LIMIT = 6;

const COLORS = {
  ai: "#66f3ff",
  trail: "#2d8cff",
  threat: "#ff8e3c",
  shield: "rgba(102, 243, 255, 0.16)",
  glow: "rgba(102, 243, 255, 0.32)",
  danger: "#ff5478",
};

const PROGRAM_ID = "34";
const VEHICLE_NAME = "VX-34 Sentinel";
const WEAPONS = ["Pulse Cannon", "Rail Spear", "EMP Burst"];
const TOOLS = ["Repair Beam", "Target Link", "Nano Shield"];

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
    ai: { x: Math.floor(GRID_SIZE / 2), y: Math.floor(GRID_SIZE / 2) },
    trail: [],
    threats: Array.from({ length: 3 }, spawnThreat),
    score: 0,
    integrity: 100,
    running: true,
    pulse: 0,
    weaponIndex: 0,
    toolIndex: 0,
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
  let interceptedCount = 0;
  state.threats = state.threats.filter((threat) => {
    const intercepted =
      sameCell(threat, state.ai) || state.trail.some((segment) => sameCell(segment, threat));

    if (intercepted) {
      interceptedCount += 1;
      state.score += 1;
    }

    return !intercepted;
  });

  const breach = state.threats.some((threat) => sameCell(threat, state.ai));
  if (breach) {
    state.integrity = Math.max(0, state.integrity - 20);
    state.toolIndex = (state.toolIndex + 1) % TOOLS.length;
  }

  if (interceptedCount > 0) {
    state.weaponIndex = (state.weaponIndex + interceptedCount) % WEAPONS.length;
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
  if (vehicleNode) {
    vehicleNode.textContent = VEHICLE_NAME;
  }
  if (weaponNode) {
    weaponNode.textContent = WEAPONS[state.weaponIndex];
  }
  if (toolNode) {
    toolNode.textContent = TOOLS[state.toolIndex];
  }
  statusNode.textContent = state.running
    ? state.threats.length > 0
      ? `Program ${PROGRAM_ID} Patrolling`
      : "Sector Clear"
    : `Program ${PROGRAM_ID} Core Breached`;
}

function tick() {
  if (state.running) {
    moveAi();
    moveThreats();
    resolveCollisions();
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
