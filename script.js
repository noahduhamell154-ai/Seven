const body = document.body;
const grid = document.getElementById("platform-grid");
const eyebrow = document.getElementById("mode-eyebrow");
const title = document.getElementById("mode-title");
const subtitle = document.getElementById("mode-subtitle");
const accessCopy = document.getElementById("mode-access-copy");
const panelDescription = document.getElementById("panel-description");
const legendPlayer = document.getElementById("legend-player");
const legendReachable = document.getElementById("legend-reachable");
const legendSelected = document.getElementById("legend-selected");
const legendTrail = document.getElementById("legend-trail");
const statusBroadcast = document.getElementById("status-broadcast");
const liveRegion = document.getElementById("live-region");
const telemetryCoordinates = document.getElementById("telemetry-coordinates");
const telemetrySteps = document.getElementById("telemetry-steps");
const telemetryReachable = document.getElementById("telemetry-reachable");
const telemetrySignal = document.getElementById("telemetry-signal");
const resetButton = document.getElementById("reset-run");
const replayButton = document.getElementById("replay-run");
const modeButtons = document.querySelectorAll("[data-mode-trigger]");

const VIEW_RADIUS = 4;
const TRAIL_LIMIT = 12;
const HISTORY_LIMIT = 24;
const REPLAY_DELAY_MS = 180;
const ORIGIN = Object.freeze({ x: 0, y: 0 });
const DIRECTIONS = {
  ArrowUp: { x: 0, y: -1, label: "north" },
  ArrowRight: { x: 1, y: 0, label: "east" },
  ArrowDown: { x: 0, y: 1, label: "south" },
  ArrowLeft: { x: -1, y: 0, label: "west" },
};

const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

const mod = (value, divisor) => ((value % divisor) + divisor) % divisor;
const clamp = (value, minimum, maximum) =>
  Math.min(Math.max(value, minimum), maximum);
const sameCoordinate = (a, b) => a.x === b.x && a.y === b.y;
const manhattanDistance = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const formatSigned = (value) => `${value >= 0 ? "+" : "-"}${String(Math.abs(value)).padStart(2, "0")}`;
const formatCoordinate = ({ x, y }) => `X ${formatSigned(x)} · Y ${formatSigned(y)}`;
const hashPoint = (x, y, seed) => {
  const primeA = Math.imul(x + seed, 374761393);
  const primeB = Math.imul(y - seed, 668265263);
  const mixed = primeA ^ primeB ^ Math.imul(seed, 1274126177);
  return (mixed ^ (mixed >>> 13)) >>> 0;
};

const tileShortCode = (prefix, x, y) => {
  const xCode = `${x >= 0 ? "P" : "N"}${String(Math.abs(x)).padStart(2, "0")}`;
  const yCode = `${y >= 0 ? "P" : "N"}${String(Math.abs(y)).padStart(2, "0")}`;
  return `${prefix}-${xCode}-${yCode}`;
};

const modes = {
  legacy: {
    eyebrow: "legacy uplink // luminous lanes",
    title: "Tron: Legacy Grid",
    subtitle:
      "Traverse a procedural light arena with luminous avenues, bridge points, and endless horizon lines.",
    accessCopy: "Legacy routes are aligned and ready for a fresh run.",
    panelDescription:
      "A bounded viewport over an infinite light-grid with bright lanes and diagonal bridges.",
    legend: {
      player: "Current position",
      reachable: "Reachable platform",
      selected: "Selected platform",
      trail: "Recent trail",
    },
    launchMessage:
      "Legacy routes synchronized. Select an adjacent platform to begin.",
    blockedMessage:
      "Selection is outside the illuminated route.",
    signalMessages: [
      "Legacy horizon stable",
      "Bridge points charged",
      "Light lanes synchronized",
      "Route cache refreshed",
    ],
    currentNoun: "light platform",
    reachableNoun: "bridge point",
    voidNoun: "dark void",
    codePrefix: "LG",
    tileLabel: (x, y) => `Legacy lane ${formatCoordinate({ x, y })}`,
    isPlatform: (x, y) => {
      if (x === 0 && y === 0) return true;
      const lane = mod(y, 3) === 0;
      const rail = mod(x, 4) === 0;
      const bridge = mod(x + y, 6) === 0 && mod(x - y, 2) === 0;
      return lane || rail || bridge;
    },
  },
  peace7: {
    eyebrow: "zion-07 relay // beacon alignment",
    title: "Zion-07 Grid",
    subtitle:
      "Navigate a calmer procedural beacon field with harmonic crossings and resilient signal rows.",
    accessCopy: "Zion-07 beacons are broadcasting a stable peace signal.",
    panelDescription:
      "A bounded viewport over an infinite beacon grid with balanced lanes and harmonic pulses.",
    legend: {
      player: "Active beacon",
      reachable: "Open signal",
      selected: "Focused tile",
      trail: "Recent pulse",
    },
    launchMessage:
      "Zion-07 beacon online. Follow the signal across the procedural field.",
    blockedMessage: "That node is outside the active peace signal.",
    signalMessages: [
      "Beacon cadence balanced",
      "Peace field stabilized",
      "Relay harmonics resonant",
      "Signal bloom in range",
    ],
    currentNoun: "beacon tile",
    reachableNoun: "signal node",
    voidNoun: "quiet void",
    codePrefix: "Z7",
    tileLabel: (x, y) => `Zion signal ${formatCoordinate({ x, y })}`,
    isPlatform: (x, y) => {
      if (x === 0 && y === 0) return true;
      const beaconColumn = mod(x, 4) === 0;
      const signalRow = mod(y, 4) === 0;
      const harmonic = mod(Math.abs(x) + Math.abs(y), 6) === 0 && mod(x + y, 2) === 0;
      return beaconColumn || signalRow || harmonic;
    },
  },
  matrix: {
    eyebrow: "machine world // emerald codefall",
    title: "The Matrix Grid",
    subtitle:
      "Enter an emerald-black code stream filled with terminal relays, glyph corridors, and procedural machine routes.",
    accessCopy: "Machine-world traffic is active. Follow the code streams and keep the relay loop clean.",
    panelDescription:
      "A bounded viewport over an infinite codefield with stream columns, relay rows, and unstable glyph clusters.",
    legend: {
      player: "Operator position",
      reachable: "Open stream",
      selected: "Target glyph",
      trail: "Residual code",
    },
    launchMessage:
      "Code streams compiling. Traverse the machine lattice from the current relay.",
    blockedMessage: "That glyph falls outside the active machine corridor.",
    signalMessages: [
      "Cipher lanes compiling",
      "Relay columns synchronized",
      "Terminal glyphs resolving",
      "Machine corridor stable",
    ],
    currentNoun: "relay platform",
    reachableNoun: "open code stream",
    voidNoun: "black code void",
    codePrefix: "MX",
    tileLabel: (x, y) => `Matrix relay ${formatCoordinate({ x, y })}`,
    isPlatform: (x, y) => {
      if (x === 0 && y === 0) return true;
      const streamColumn = mod(x, 3) === 0;
      const relayRow = mod(y, 6) === 0;
      const glyphCluster = mod(hashPoint(x, y, 17), 7) <= 1 && mod(y, 2) === 0;
      return streamColumn || relayRow || glyphCluster;
    },
  },
};

const state = {
  modeKey: "legacy",
  player: { ...ORIGIN },
  selected: { ...ORIGIN },
  trail: [{ ...ORIGIN }],
  moveHistory: [],
  stepCount: 0,
  isReplaying: false,
  replayTimer: null,
};

const tileButtons = [];

function createTileButtons() {
  if (!grid || tileButtons.length > 0) {
    return;
  }

  const fragment = document.createDocumentFragment();

  for (let relativeY = -VIEW_RADIUS; relativeY <= VIEW_RADIUS; relativeY += 1) {
    for (let relativeX = -VIEW_RADIUS; relativeX <= VIEW_RADIUS; relativeX += 1) {
      const tile = document.createElement("li");
      const button = document.createElement("button");
      const eyebrowText = document.createElement("span");
      const code = document.createElement("strong");

      tile.className = "platform-slot";
      button.className = "platform-tile";
      button.type = "button";
      button.dataset.relativeX = String(relativeX);
      button.dataset.relativeY = String(relativeY);

      eyebrowText.className = "tile-label";
      code.className = "tile-name";
      button.append(eyebrowText, code);
      button.addEventListener("click", () => handleTileInteraction(button));
      tile.appendChild(button);
      fragment.appendChild(tile);
      tileButtons.push(button);
    }
  }

  grid.appendChild(fragment);
}

function stopReplay() {
  if (state.replayTimer !== null) {
    window.clearTimeout(state.replayTimer);
    state.replayTimer = null;
  }

  state.isReplaying = false;
}

function getMode() {
  return modes[state.modeKey] ?? modes.legacy;
}

function resetRun({ announce = true } = {}) {
  stopReplay();
  state.player = { ...ORIGIN };
  state.selected = { ...ORIGIN };
  state.trail = [{ ...ORIGIN }];
  state.moveHistory = [];
  state.stepCount = 0;
  render();

  if (announce) {
    announceStatus(`${getMode().launchMessage} Run reset to origin.`);
  }
}

function setMode(modeKey) {
  if (!Object.hasOwn(modes, modeKey)) {
    return;
  }

  stopReplay();
  state.modeKey = modeKey;
  resetRun({ announce: false });
  render();
  announceStatus(`${getMode().title} engaged. ${getMode().launchMessage}`);
}

function announceStatus(message) {
  statusBroadcast.textContent = message;
  liveRegion.textContent = message;
}

function getReachablePlatforms(origin = state.player) {
  const mode = getMode();

  return Object.values(DIRECTIONS)
    .map(({ x, y }) => ({ x: origin.x + x, y: origin.y + y }))
    .filter((coordinate) => mode.isPlatform(coordinate.x, coordinate.y));
}

function updateTrail(nextCoordinate) {
  state.trail.unshift({ ...nextCoordinate });

  if (state.trail.length > TRAIL_LIMIT) {
    state.trail.length = TRAIL_LIMIT;
  }
}

function recordMove(directionKey) {
  state.moveHistory.push(directionKey);

  if (state.moveHistory.length > HISTORY_LIMIT) {
    state.moveHistory.splice(0, state.moveHistory.length - HISTORY_LIMIT);
  }
}

function signalMessage(reachableCount) {
  const mode = getMode();

  if (reachableCount === 0) {
    return `${mode.currentNoun} isolated`;
  }

  return mode.signalMessages[state.stepCount % mode.signalMessages.length];
}

function describeTile(coordinate, options) {
  const mode = getMode();
  const details = [];

  details.push(mode.tileLabel(coordinate.x, coordinate.y));
  details.push(options.active ? mode.currentNoun : mode.voidNoun);

  if (options.isCurrent) {
    details.push("current position");
  }

  if (options.isSelected) {
    details.push("selected tile");
  }

  if (options.isReachable) {
    details.push("reachable in one move");
  }

  if (options.isTrail) {
    details.push("recent trail");
  }

  return details.join(", ");
}

function focusSelectedTile() {
  const selectedRelativeX = state.selected.x - state.player.x;
  const selectedRelativeY = state.selected.y - state.player.y;
  const selectedButton = tileButtons.find(
    (button) =>
      Number(button.dataset.relativeX) === selectedRelativeX &&
      Number(button.dataset.relativeY) === selectedRelativeY,
  );

  selectedButton?.focus({ preventScroll: true });
}

function render({ focusSelection = false } = {}) {
  if (!body || !grid) {
    return;
  }

  const mode = getMode();
  const reachablePlatforms = getReachablePlatforms();
  const reachableKeys = new Set(
    reachablePlatforms.map((coordinate) => `${coordinate.x}:${coordinate.y}`),
  );
  const trailKeys = new Set(
    state.trail.slice(1).map((coordinate) => `${coordinate.x}:${coordinate.y}`),
  );

  body.dataset.mode = state.modeKey;
  eyebrow.textContent = mode.eyebrow;
  title.textContent = mode.title;
  subtitle.textContent = mode.subtitle;
  accessCopy.textContent = mode.accessCopy;
  panelDescription.textContent = mode.panelDescription;
  legendPlayer.textContent = mode.legend.player;
  legendReachable.textContent = mode.legend.reachable;
  legendSelected.textContent = mode.legend.selected;
  legendTrail.textContent = mode.legend.trail;
  telemetryCoordinates.textContent = formatCoordinate(state.player);
  telemetrySteps.textContent = String(state.stepCount);
  telemetryReachable.textContent = String(reachablePlatforms.length);
  telemetrySignal.textContent = signalMessage(reachablePlatforms.length);
  replayButton.disabled = state.moveHistory.length === 0 || state.isReplaying;
  resetButton.disabled = state.isReplaying;

  modeButtons.forEach((button) => {
    const isSelected = button.dataset.modeTrigger === state.modeKey;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
    button.disabled = state.isReplaying && !isSelected;
  });

  tileButtons.forEach((button) => {
    const relativeX = Number(button.dataset.relativeX);
    const relativeY = Number(button.dataset.relativeY);
    const worldCoordinate = {
      x: state.player.x + relativeX,
      y: state.player.y + relativeY,
    };
    const isActive = mode.isPlatform(worldCoordinate.x, worldCoordinate.y);
    const isCurrent = sameCoordinate(worldCoordinate, state.player);
    const isSelected = sameCoordinate(worldCoordinate, state.selected);
    const isReachable = reachableKeys.has(`${worldCoordinate.x}:${worldCoordinate.y}`);
    const isTrail = trailKeys.has(`${worldCoordinate.x}:${worldCoordinate.y}`);
    const tileLabel = isActive ? mode.tileLabel(worldCoordinate.x, worldCoordinate.y) : mode.voidNoun;

    button.dataset.worldX = String(worldCoordinate.x);
    button.dataset.worldY = String(worldCoordinate.y);
    button.querySelector(".tile-label").textContent = tileLabel;
    button.querySelector(".tile-name").textContent = tileShortCode(
      mode.codePrefix,
      worldCoordinate.x,
      worldCoordinate.y,
    );
    button.classList.toggle("is-active", isActive);
    button.classList.toggle("is-current", isCurrent);
    button.classList.toggle("is-selected", isSelected);
    button.classList.toggle("is-reachable", isReachable);
    button.classList.toggle("is-trail", isTrail);
    button.classList.toggle("is-void", !isActive);
    button.tabIndex = isSelected ? 0 : -1;
    button.setAttribute(
      "aria-label",
      describeTile(worldCoordinate, {
        active: isActive,
        isCurrent,
        isSelected,
        isReachable,
        isTrail,
      }),
    );
    if (isCurrent) {
      button.setAttribute("aria-current", "location");
    } else {
      button.removeAttribute("aria-current");
    }
  });

  if (focusSelection) {
    focusSelectedTile();
  }
}

function moveSelection(deltaX, deltaY) {
  const nextSelection = {
    x: clamp(state.selected.x + deltaX, state.player.x - VIEW_RADIUS, state.player.x + VIEW_RADIUS),
    y: clamp(state.selected.y + deltaY, state.player.y - VIEW_RADIUS, state.player.y + VIEW_RADIUS),
  };

  if (sameCoordinate(nextSelection, state.selected)) {
    return;
  }

  state.selected = nextSelection;
  render({ focusSelection: true });
  announceStatus(`Selection moved to ${getMode().tileLabel(state.selected.x, state.selected.y)}.`);
}

function traverseTo(
  target,
  { recordHistory = true, announce = true, focusSelection = true, renderAfter = true } = {},
) {
  const mode = getMode();

  if (manhattanDistance(state.player, target) !== 1) {
    announceStatus("Select an adjacent platform before traversing.");
    render({ focusSelection: true });
    return false;
  }

  if (!mode.isPlatform(target.x, target.y)) {
    announceStatus(mode.blockedMessage);
    render({ focusSelection: true });
    return false;
  }

  const directionKey = Object.entries(DIRECTIONS).find(([, direction]) =>
    sameCoordinate({ x: state.player.x + direction.x, y: state.player.y + direction.y }, target),
  )?.[0];

  state.player = { ...target };
  state.selected = { ...target };
  state.stepCount += 1;
  updateTrail(target);

  if (recordHistory && directionKey) {
    recordMove(directionKey);
  }

  if (renderAfter) {
    render({ focusSelection });
  }

  if (announce) {
    announceStatus(
      `Traversed to ${mode.tileLabel(target.x, target.y)}. ${signalMessage(getReachablePlatforms().length)}.`,
    );
  }
  return true;
}

function handleTileInteraction(button) {
  const target = {
    x: Number(button.dataset.worldX),
    y: Number(button.dataset.worldY),
  };

  state.selected = target;

  if (sameCoordinate(target, state.player)) {
    render({ focusSelection: true });
    announceStatus(`Current position confirmed at ${getMode().tileLabel(target.x, target.y)}.`);
    return;
  }

  if (manhattanDistance(target, state.player) === 1 && getMode().isPlatform(target.x, target.y)) {
    traverseTo(target);
    return;
  }

  render({ focusSelection: true });
  announceStatus(`Selected ${getMode().tileLabel(target.x, target.y)}.`);
}

function replayRun() {
  if (state.moveHistory.length === 0 || state.isReplaying) {
    announceStatus("No recent path is available for replay yet.");
    return;
  }

  const replayPath = [...state.moveHistory];
  resetRun({ announce: false });
  state.isReplaying = true;
  render({ focusSelection: true });
  announceStatus(`Replaying ${replayPath.length} recent moves.`);

  if (motionQuery.matches) {
    replayPath.forEach((directionKey) => {
      const direction = DIRECTIONS[directionKey];
      const target = {
        x: state.player.x + direction.x,
        y: state.player.y + direction.y,
      };

      traverseTo(target, {
        recordHistory: false,
        announce: false,
        focusSelection: false,
        renderAfter: false,
      });
    });

    state.moveHistory = replayPath;
    state.isReplaying = false;
    render({ focusSelection: true });
    announceStatus(`Replay complete at ${getMode().tileLabel(state.player.x, state.player.y)}.`);
    return;
  }

  const advanceReplay = (index) => {
    if (index >= replayPath.length) {
      state.moveHistory = replayPath;
      state.isReplaying = false;
      render({ focusSelection: true });
      announceStatus(`Replay complete at ${getMode().tileLabel(state.player.x, state.player.y)}.`);
      return;
    }

    const direction = DIRECTIONS[replayPath[index]];
    const target = {
      x: state.player.x + direction.x,
      y: state.player.y + direction.y,
    };

    traverseTo(target, { recordHistory: false });

    state.replayTimer = window.setTimeout(() => advanceReplay(index + 1), REPLAY_DELAY_MS);
  };

  advanceReplay(0);
}

function handleKeydown(event) {
  if (event.altKey || event.ctrlKey || event.metaKey) {
    return;
  }

  if (Object.hasOwn(DIRECTIONS, event.key)) {
    event.preventDefault();
    const direction = DIRECTIONS[event.key];
    moveSelection(direction.x, direction.y);
    return;
  }

  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    traverseTo(state.selected);
    return;
  }

  if (event.key.toLowerCase() === "r") {
    event.preventDefault();
    resetRun();
    return;
  }

  if (event.key.toLowerCase() === "p") {
    event.preventDefault();
    replayRun();
  }
}

createTileButtons();
render();
announceStatus(getMode().launchMessage);

document.addEventListener("keydown", handleKeydown);
resetButton.addEventListener("click", () => resetRun());
replayButton.addEventListener("click", replayRun);
modeButtons.forEach((button) => {
  button.addEventListener("click", () => setMode(button.dataset.modeTrigger));
});
