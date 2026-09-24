const body = document.body;
const grid = document.getElementById("platform-grid");
const eyebrow = document.getElementById("mode-eyebrow");
const title = document.getElementById("mode-title");
const subtitle = document.getElementById("mode-subtitle");
const accessCopy = document.getElementById("mode-access-copy");
const panelDescription = document.getElementById("panel-description");
const legendStart = document.getElementById("legend-start");
const legendActive = document.getElementById("legend-active");
const legendEnd = document.getElementById("legend-end");
const liveStatus = document.getElementById("live-status");
const controlCopy = document.getElementById("control-copy");
const telemetryMode = document.getElementById("telemetry-mode");
const telemetryPosition = document.getElementById("telemetry-position");
const telemetryProgress = document.getElementById("telemetry-progress");
const telemetryStatus = document.getElementById("telemetry-status");
const viewportMode = document.getElementById("viewport-mode");
const viewportStep = document.getElementById("viewport-step");
const resetButton = document.getElementById("reset-run");
const replayButton = document.getElementById("replay-run");
const modeButtons = Array.from(document.querySelectorAll("[data-mode-trigger]"));

const RELAY_LENGTH = 6;
const LOOKAHEAD_BUFFER = 14;
const REPLAY_STEPS = 18;
const REPLAY_INTERVAL = 420;
const RECENT_MEMORY = 18;
const DIRECTION_VECTORS = {
  north: { x: 0, y: -1 },
  south: { x: 0, y: 1 },
  east: { x: 1, y: 0 },
  west: { x: -1, y: 0 },
};
const OPPOSITE_DIRECTIONS = {
  north: "south",
  south: "north",
  east: "west",
  west: "east",
};
const MOVEMENT_KEYS = {
  ArrowUp: "north",
  ArrowDown: "south",
  ArrowLeft: "west",
  ArrowRight: "east",
  w: "north",
  W: "north",
  s: "south",
  S: "south",
  a: "west",
  A: "west",
  d: "east",
  D: "east",
};

const MODES = {
  legacy: {
    name: "Legacy",
    eyebrow: "wake-up Neo...",
    title: "Tron: Legacy Grid",
    subtitle:
      "A cinematic, infinite Tron: Legacy corridor with a living relay route that keeps extending across the arena.",
    accessCopy: "Legacy access remains open across the arena.",
    controlCopy:
      "Traverse with arrow keys or WASD, then click any adjacent route node to move through the relay.",
    panelDescription:
      "A bounded viewport into the infinite Legacy Grid with a playable relay route and continuously expanding horizon.",
    legend: {
      start: "Origin",
      active: "Relay",
      end: "Horizon",
    },
    statusReady: "Legacy route primed. Select the origin platform to enter the Grid.",
    statusAdvance: "Legacy relay locked. Push forward through the horizon.",
    statusExpand: "Legacy horizon extended. The Grid keeps opening ahead.",
    replayStatus: "Legacy replay engaged. Watching the relay auto-run.",
    initialDirection: "east",
    describeStatus(state) {
      return state.playerIndex === state.relayStartIndex
        ? "Origin online"
        : state.playerIndex >= state.objectiveIndex - 1
          ? "Horizon near"
          : "Route stable";
    },
    getWeights(stepIndex, point, lastDirection) {
      const weights = {
        east: 5.2,
        south: 2.7,
        north: 1.6,
        west: 0.35,
      };

      if (point.y > 3) {
        weights.north += point.y * 0.8;
      } else if (point.y < -2) {
        weights.south += Math.abs(point.y) * 0.7;
      }

      if (lastDirection) {
        weights[lastDirection] += 0.55;
      }

      if (stepIndex % 5 === 2 || stepIndex % 5 === 3) {
        weights.south += 0.7;
      }

      return weights;
    },
  },
  peace7: {
    name: "Zion-07",
    eyebrow: "peace across the grid",
    title: "Zion-07 Infinite Signal",
    subtitle:
      "Zion-07 now runs inside the same infinite Grid engine, projecting a green-and-gold signal route that ripples outward forever.",
    accessCopy: "Password: Peace7. Grid callsign: Zion-07.",
    controlCopy:
      "Use arrow keys or WASD to ride the signal wave, or tap an adjacent beacon to redirect the pulse.",
    panelDescription:
      "A bounded viewport into the infinite Zion-07 signal lattice with relay traversal, pulse routing, and live status telemetry.",
    legend: {
      start: "Beacon",
      active: "Signal",
      end: "Bloom",
    },
    statusReady: "Zion-07 signal aligned. Beacon platforms are awaiting traversal.",
    statusAdvance: "Zion-07 pulse advancing. Keep the signal wave coherent.",
    statusExpand: "Zion-07 bloom extended. The signal lattice regenerated ahead.",
    replayStatus: "Zion-07 replay engaged. The signal wave is auto-routing.",
    initialDirection: "east",
    describeStatus(state) {
      return state.playerIndex === state.relayStartIndex
        ? "Beacon ready"
        : state.playerIndex >= state.objectiveIndex - 1
          ? "Bloom near"
          : "Signal stable";
    },
    getWeights(stepIndex, point, lastDirection) {
      const lateralPulse = Math.floor(stepIndex / 2) % 2 === 0 ? "north" : "south";
      const opposingPulse = lateralPulse === "north" ? "south" : "north";
      const weights = {
        east: 4.4,
        north: 1.3,
        south: 1.3,
        west: 0.25,
      };

      weights[lateralPulse] += 2.8;
      weights[opposingPulse] += 0.9;

      if (point.y > 3) {
        weights.north += point.y;
      } else if (point.y < -3) {
        weights.south += Math.abs(point.y);
      }

      if (lastDirection === lateralPulse) {
        weights.east += 0.6;
      } else if (lastDirection) {
        weights[lastDirection] += 0.4;
      }

      return weights;
    },
  },
};

function hasMode(modeKey) {
  return Object.prototype.hasOwnProperty.call(MODES, modeKey);
}

function seededValue(stepIndex, salt, seed) {
  let value = Math.imul(stepIndex + 1, 2246822519) ^ Math.imul(salt + 1, 3266489917) ^ seed;
  value ^= value >>> 15;
  value = Math.imul(value, 2246822519);
  value ^= value >>> 13;
  return ((value >>> 0) % 10000) / 10000;
}

function getViewportSize() {
  if (window.matchMedia("(max-width: 560px)").matches) {
    return 5;
  }

  if (window.matchMedia("(max-width: 900px)").matches) {
    return 7;
  }

  return 9;
}

function coordinateKey(point) {
  return `${point.x},${point.y}`;
}

function samePoint(a, b) {
  return a.x === b.x && a.y === b.y;
}

function movePoint(point, direction) {
  const vector = DIRECTION_VECTORS[direction];
  return {
    x: point.x + vector.x,
    y: point.y + vector.y,
  };
}

function chooseWeightedDirection(weights, stepIndex, modeSeed) {
  const entries = Object.entries(weights).filter(([, weight]) => weight > 0);
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  const target = seededValue(stepIndex, entries.length, modeSeed) * total;
  let cursor = 0;

  for (const [direction, weight] of entries) {
    cursor += weight;
    if (target <= cursor) {
      return direction;
    }
  }

  return entries[0]?.[0] ?? "east";
}

function formatCoordinate(point) {
  return `${point.x >= 0 ? "+" : ""}${point.x}, ${point.y >= 0 ? "+" : ""}${point.y}`;
}

function formatSector(point) {
  const xPrefix = point.x >= 0 ? "E" : "W";
  const yPrefix = point.y >= 0 ? "S" : "N";
  return `${xPrefix}${String(Math.abs(point.x)).padStart(2, "0")}-${yPrefix}${String(Math.abs(point.y)).padStart(2, "0")}`;
}

function createInitialState(modeKey) {
  return {
    modeKey,
    modeSeed: modeKey === "peace7" ? 707 : 1982,
    route: [{ x: 0, y: 0 }],
    lastDirection: MODES[modeKey].initialDirection,
    playerIndex: 0,
    relayStartIndex: 0,
    objectiveIndex: RELAY_LENGTH,
    replayTimer: 0,
    replaySteps: 0,
    isReplaying: false,
    lastAnnouncement: "",
  };
}

let state = createInitialState("legacy");

function stopReplay() {
  if (state.replayTimer) {
    window.clearInterval(state.replayTimer);
  }

  state.replayTimer = 0;
  state.replaySteps = 0;
  state.isReplaying = false;

  if (replayButton) {
    replayButton.classList.remove("is-active");
    replayButton.textContent = "Replay Route";
  }
}

function setLiveStatus(message) {
  if (!liveStatus || message === state.lastAnnouncement) {
    return;
  }

  liveStatus.textContent = message;
  state.lastAnnouncement = message;
}

function ensureRouteLength(requiredIndex) {
  const mode = MODES[state.modeKey];

  while (state.route.length <= requiredIndex) {
    const current = state.route[state.route.length - 1];
    const stepIndex = state.route.length - 1;
    const weights = mode.getWeights(stepIndex, current, state.lastDirection);
    const recentKeys = new Set(
      state.route.slice(Math.max(0, state.route.length - RECENT_MEMORY)).map(coordinateKey),
    );

    if (state.lastDirection) {
      weights[OPPOSITE_DIRECTIONS[state.lastDirection]] *= 0.08;
    }

    const directions = Object.keys(DIRECTION_VECTORS);
    directions.forEach((direction, index) => {
      const candidate = movePoint(current, direction);
      const candidateKey = coordinateKey(candidate);

      if (recentKeys.has(candidateKey)) {
        weights[direction] *= 0.08;
      }

      weights[direction] += seededValue(stepIndex, index + 11, state.modeSeed) * 0.35;
    });

    let nextDirection = chooseWeightedDirection(weights, stepIndex, state.modeSeed);
    let nextPoint = movePoint(current, nextDirection);

    if (recentKeys.has(coordinateKey(nextPoint))) {
      const fallbackDirection = directions.find((direction) => {
        const candidate = movePoint(current, direction);
        return !recentKeys.has(coordinateKey(candidate));
      });

      if (fallbackDirection) {
        nextDirection = fallbackDirection;
        nextPoint = movePoint(current, nextDirection);
      }
    }

    state.route.push(nextPoint);
    state.lastDirection = nextDirection;
  }
}

function updateModeContent() {
  const mode = MODES[state.modeKey];

  if (body) {
    body.dataset.mode = state.modeKey;
  }

  if (eyebrow) eyebrow.textContent = mode.eyebrow;
  if (title) title.textContent = mode.title;
  if (subtitle) subtitle.textContent = mode.subtitle;
  if (accessCopy) accessCopy.textContent = mode.accessCopy;
  if (panelDescription) panelDescription.textContent = mode.panelDescription;
  if (legendStart) legendStart.textContent = mode.legend.start;
  if (legendActive) legendActive.textContent = mode.legend.active;
  if (legendEnd) legendEnd.textContent = mode.legend.end;
  if (controlCopy) controlCopy.textContent = mode.controlCopy;
  if (viewportMode) viewportMode.textContent = mode.name;
  if (telemetryMode) telemetryMode.textContent = mode.name;

  modeButtons.forEach((button) => {
    const isSelected = button.dataset.modeTrigger === state.modeKey;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });
}

function getCurrentPoint() {
  return state.route[state.playerIndex];
}

function getFutureFocusPoint() {
  const aheadIndex = Math.min(state.playerIndex + Math.floor(getViewportSize() / 2), state.route.length - 1);
  return state.route[aheadIndex];
}

function buildGridWindow() {
  const current = getCurrentPoint();
  const focus = getFutureFocusPoint();
  const viewportSize = getViewportSize();
  const radius = Math.floor(viewportSize / 2);
  const camera = {
    x: Math.round((current.x * 2 + focus.x) / 3),
    y: Math.round((current.y * 2 + focus.y) / 3),
  };
  const tiles = [];

  for (let y = camera.y - radius; y <= camera.y + radius; y += 1) {
    for (let x = camera.x - radius; x <= camera.x + radius; x += 1) {
      tiles.push({ x, y });
    }
  }

  return {
    viewportSize,
    camera,
    tiles,
  };
}

function getConnectedIndex(direction) {
  const current = getCurrentPoint();
  const target = movePoint(current, direction);
  const nextPoint = state.route[state.playerIndex + 1];
  const previousPoint = state.route[state.playerIndex - 1];

  if (nextPoint && samePoint(nextPoint, target)) {
    return state.playerIndex + 1;
  }

  if (previousPoint && samePoint(previousPoint, target)) {
    return state.playerIndex - 1;
  }

  return -1;
}

function syncTelemetry() {
  const mode = MODES[state.modeKey];
  const current = getCurrentPoint();
  const relayProgress = state.playerIndex - state.relayStartIndex;

  if (telemetryPosition) {
    telemetryPosition.textContent = formatCoordinate(current);
  }

  if (telemetryProgress) {
    telemetryProgress.textContent = `${relayProgress} / ${RELAY_LENGTH}`;
  }

  if (telemetryStatus) {
    telemetryStatus.textContent = mode.describeStatus(state);
  }

  if (viewportStep) {
    viewportStep.textContent = `Segment ${state.playerIndex}`;
  }
}

function moveToIndex(targetIndex, options = {}) {
  if (targetIndex < 0 || targetIndex >= state.route.length || targetIndex === state.playerIndex) {
    return false;
  }

  state.playerIndex = targetIndex;
  ensureRouteLength(state.playerIndex + LOOKAHEAD_BUFFER);

  if (state.playerIndex >= state.objectiveIndex) {
    state.relayStartIndex = state.objectiveIndex;
    state.objectiveIndex += RELAY_LENGTH;
    ensureRouteLength(state.objectiveIndex + LOOKAHEAD_BUFFER);
    setLiveStatus(MODES[state.modeKey].statusExpand);
  } else if (!options.silent) {
    setLiveStatus(MODES[state.modeKey].statusAdvance);
  }

  renderGrid();
  return true;
}

function handleDirectionalMove(direction) {
  if (!direction) {
    return;
  }

  const targetIndex = getConnectedIndex(direction);

  if (targetIndex >= 0) {
    stopReplay();
    moveToIndex(targetIndex);
  } else {
    setLiveStatus("That platform is offline from the current relay. Follow the illuminated path.");
  }
}

function resetRun(announce = true) {
  const modeKey = state.modeKey;
  stopReplay();
  state = createInitialState(modeKey);
  ensureRouteLength(state.objectiveIndex + LOOKAHEAD_BUFFER);
  updateModeContent();
  renderGrid();

  if (announce) {
    setLiveStatus(MODES[state.modeKey].statusReady);
  }
}

function switchMode(modeKey) {
  if (!hasMode(modeKey)) {
    return;
  }

  state = createInitialState(modeKey);
  ensureRouteLength(state.objectiveIndex + LOOKAHEAD_BUFFER);
  updateModeContent();
  renderGrid();
  setLiveStatus(MODES[state.modeKey].statusReady);
}

function replayRoute() {
  if (state.isReplaying) {
    stopReplay();
    setLiveStatus("Replay halted. Manual traversal restored.");
    return;
  }

  resetRun(false);
  state.isReplaying = true;
  state.replaySteps = 0;

  if (replayButton) {
    replayButton.classList.add("is-active");
    replayButton.textContent = "Stop Replay";
  }

  setLiveStatus(MODES[state.modeKey].replayStatus);

  state.replayTimer = window.setInterval(() => {
    const moved = moveToIndex(state.playerIndex + 1, { silent: true });
    state.replaySteps += 1;

    if (!moved || state.replaySteps >= REPLAY_STEPS) {
      stopReplay();
      setLiveStatus("Replay complete. Manual traversal restored.");
    }
  }, REPLAY_INTERVAL);
}

function renderGrid() {
  if (!grid || !body) {
    return;
  }

  const { viewportSize, tiles } = buildGridWindow();
  const current = getCurrentPoint();
  const routeIndices = new Map();
  const adjacentIndices = [state.playerIndex - 1, state.playerIndex + 1].filter((index) => index >= 0);

  grid.style.setProperty("--grid-columns", String(viewportSize));
  grid.replaceChildren();
  grid.setAttribute("aria-keyshortcuts", "ArrowUp ArrowDown ArrowLeft ArrowRight W A S D");

  state.route.forEach((point, index) => {
    routeIndices.set(coordinateKey(point), index);
  });

  tiles.forEach((point) => {
    const index = routeIndices.get(coordinateKey(point));
    const listItem = document.createElement("li");
    const button = document.createElement("button");
    const label = document.createElement("span");
    const name = document.createElement("strong");
    const coordinate = document.createElement("span");
    const isRoute = Number.isInteger(index);
    const isCurrent = index === state.playerIndex;
    const isRelayStart = index === state.relayStartIndex;
    const isObjective = index === state.objectiveIndex;
    const isVisited = isRoute && index < state.playerIndex;
    const isFuture = isRoute && index > state.playerIndex;
    const isAdjacent = adjacentIndices.includes(index);

    listItem.className = "platform-tile";
    listItem.setAttribute("role", "presentation");
    button.type = "button";
    button.setAttribute("role", "gridcell");
    button.className = "platform-button";
    button.dataset.x = String(point.x);
    button.dataset.y = String(point.y);
    button.tabIndex = isCurrent || isAdjacent ? 0 : -1;

    label.className = "tile-label";
    coordinate.className = "tile-coordinate";
    name.className = "tile-name";
    coordinate.textContent = formatCoordinate(point);

    if (isRoute) {
      button.classList.add("is-route");
      label.textContent = isObjective
        ? MODES[state.modeKey].legend.end
        : isRelayStart
          ? MODES[state.modeKey].legend.start
          : MODES[state.modeKey].legend.active;
      name.textContent = `Node ${index}`;
      button.setAttribute(
        "aria-label",
        `${label.textContent} ${index}. Sector ${formatSector(point)} at coordinates ${formatCoordinate(point)}.`,
      );
    } else {
      button.classList.add("is-blocked");
      label.textContent = "Platform";
      name.textContent = formatSector(point);
      button.setAttribute("aria-disabled", "true");
      button.setAttribute(
        "aria-label",
        `Inactive platform ${formatSector(point)} at coordinates ${formatCoordinate(point)}.`,
      );
    }

    if (isVisited) button.classList.add("is-visited");
    if (isCurrent) {
      button.classList.add("is-current");
      button.setAttribute("aria-current", "true");
    }
    if (isRelayStart) button.classList.add("is-start");
    if (isObjective) button.classList.add("is-end");
    if (isFuture) button.classList.add("is-future");
    if (isAdjacent) button.classList.add("is-adjacent");

    button.append(label, name, coordinate);
    listItem.appendChild(button);
    grid.appendChild(listItem);
  });

  syncTelemetry();
}

function handleGridClick(event) {
  const button = event.target.closest(".platform-button");

  if (!button) {
    return;
  }

  const x = Number(button.dataset.x);
  const y = Number(button.dataset.y);
  const nextPoint = state.route[state.playerIndex + 1];
  const previousPoint = state.route[state.playerIndex - 1];

  stopReplay();

  if (nextPoint && samePoint(nextPoint, { x, y })) {
    moveToIndex(state.playerIndex + 1);
    return;
  }

  if (previousPoint && samePoint(previousPoint, { x, y })) {
    moveToIndex(state.playerIndex - 1);
    return;
  }

  if (samePoint(getCurrentPoint(), { x, y })) {
    setLiveStatus("Current relay node selected. Move to an adjacent illuminated platform.");
    return;
  }

  setLiveStatus("That platform is out of reach. Advance through adjacent route nodes only.");
}

function handleKeydown(event) {
  if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
    return;
  }

  const direction = MOVEMENT_KEYS[event.key];

  if (!direction) {
    return;
  }

  event.preventDefault();
  handleDirectionalMove(direction);
}

function initializeGridExperience() {
  if (!body || !grid) {
    return;
  }

  ensureRouteLength(state.objectiveIndex + LOOKAHEAD_BUFFER);
  updateModeContent();
  renderGrid();
  setLiveStatus(MODES[state.modeKey].statusReady);

  grid.addEventListener("click", handleGridClick);
  window.addEventListener("keydown", handleKeydown);
  window.addEventListener("resize", renderGrid);

  modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      switchMode(button.dataset.modeTrigger || "legacy");
    });
  });

  if (resetButton) {
    resetButton.addEventListener("click", () => {
      resetRun();
    });
  }

  if (replayButton) {
    replayButton.addEventListener("click", replayRoute);
  }
}

initializeGridExperience();
