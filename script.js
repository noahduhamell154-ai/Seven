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
const relayTarget = document.getElementById("relay-target");
const relayStatus = document.getElementById("relay-status");
const modeButtons = document.querySelectorAll("[data-mode-trigger]");
const lampButton = document.getElementById("relay-lamp");
const doorsButton = document.getElementById("relay-doors");
const jumpButton = document.getElementById("relay-jump");
const resetButton = document.getElementById("relay-reset");

const rows = 7;
const columns = 7;
const modeOrder = ["legacy", "peace7", "matrix"];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const modes = {
  legacy: {
    buttonLabel: "Legacy",
    relayTarget: "Legacy corridor",
    eyebrow: "chrono relay aligned",
    title: "Legacy Arc Grid",
    subtitle:
      "A luminous corridor map with a fan-inspired neon arena, responsive platform routing, and a temporal relay anchored beside the Grid.",
    accessCopy: "Chrono Relay is synced to the Legacy corridor.",
    panelDescription: "7 x 7 light platforms with a highlighted run across the grid.",
    legend: {
      start: "Start",
      active: "Route",
      end: "End",
    },
    start: "0-0",
    end: "6-6",
    activeTiles: [
      "0-0",
      "0-1",
      "1-1",
      "2-1",
      "2-2",
      "2-3",
      "3-3",
      "4-3",
      "4-4",
      "5-4",
      "6-4",
      "6-5",
      "6-6",
    ],
    activeState: "route platform",
    startState: "start platform",
    endState: "end platform",
  },
  peace7: {
    buttonLabel: "Zion-07",
    relayTarget: "Zion-07 beacon",
    eyebrow: "peace across the grid",
    title: "Zion-07 Beacon Grid",
    subtitle:
      "A calmer signal for Seven that reshapes the arena into a glowing beacon lattice for the relay to lock onto.",
    accessCopy: "Chrono Relay is tuned to the Zion-07 beacon.",
    panelDescription: "7 x 7 light platforms tuned into the Peace7 beacon.",
    legend: {
      start: "Beacon",
      active: "Signal",
      end: "Bloom",
    },
    start: "0-3",
    end: "6-3",
    activeTiles: [
      "0-3",
      "1-1",
      "1-2",
      "1-3",
      "1-4",
      "1-5",
      "2-1",
      "2-3",
      "2-5",
      "3-1",
      "3-3",
      "3-5",
      "4-1",
      "4-2",
      "4-3",
      "4-4",
      "4-5",
      "5-1",
      "5-2",
      "5-3",
      "5-4",
      "5-5",
      "6-3",
    ],
    activeState: "peace signal platform",
    startState: "beacon platform",
    endState: "bloom platform",
  },
  matrix: {
    buttonLabel: "Cipher Rain",
    relayTarget: "Cipher Rain corridor",
    eyebrow: "signal rain across the grid",
    title: "Cipher Rain Grid",
    subtitle:
      "A code-soaked corridor where the relay pivots into black-green telemetry, bright glyph paths, and terminal-like grid routes.",
    accessCopy: "Chrono Relay is linked to the Cipher Rain corridor.",
    panelDescription: "7 x 7 light platforms arranged into a cascading code path.",
    legend: {
      start: "Entry",
      active: "Cascade",
      end: "Exit",
    },
    start: "0-1",
    end: "6-5",
    activeTiles: [
      "0-1",
      "0-2",
      "1-2",
      "1-3",
      "2-3",
      "2-4",
      "3-4",
      "3-3",
      "4-3",
      "4-2",
      "5-2",
      "5-4",
      "6-4",
      "6-5",
    ],
    activeState: "code cascade platform",
    startState: "entry platform",
    endState: "exit platform",
  },
};

const relayState = {
  mode: "legacy",
  lampActive: false,
  doorsOpen: false,
  jumping: false,
};

let jumpTimer;

const getStatusMessage = (prefix) => {
  const mode = modes[relayState.mode];
  const lampState = relayState.lampActive ? "Lamp active." : "Lamp dormant.";
  const doorState = relayState.doorsOpen ? "Doors open." : "Doors sealed.";
  const targetState = `${mode.relayTarget} selected.`;

  return prefix ? `${prefix} ${lampState} ${doorState} ${targetState}` : `${lampState} ${doorState} ${targetState}`;
};

const announceStatus = (prefix = "") => {
  if (!relayStatus) {
    return;
  }

  relayStatus.textContent = getStatusMessage(prefix);
};

const applyRelayState = () => {
  body.dataset.mode = relayState.mode;
  body.dataset.lampActive = String(relayState.lampActive);
  body.dataset.doorsOpen = String(relayState.doorsOpen);
  body.dataset.jumping = String(relayState.jumping);

  if (relayTarget) {
    relayTarget.textContent = `${modes[relayState.mode].relayTarget} selected`;
  }

  if (lampButton) {
    lampButton.textContent = relayState.lampActive ? "Lamp on" : "Lamp off";
    lampButton.setAttribute("aria-pressed", String(relayState.lampActive));
    lampButton.disabled = relayState.jumping;
  }

  if (doorsButton) {
    doorsButton.textContent = relayState.doorsOpen ? "Doors open" : "Doors closed";
    doorsButton.setAttribute("aria-pressed", String(relayState.doorsOpen));
    doorsButton.disabled = relayState.jumping;
  }

  if (jumpButton) {
    jumpButton.textContent = relayState.jumping ? "Jumping..." : "Time jump";
    jumpButton.disabled = relayState.jumping;
  }

  modeButtons.forEach((button) => {
    const isSelected = button.dataset.modeTrigger === relayState.mode;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
    button.disabled = relayState.jumping;
  });
};

const renderGrid = () => {
  if (!grid || !body) {
    return;
  }

  const mode = modes[relayState.mode];
  const activeTiles = new Set(mode.activeTiles);

  eyebrow.textContent = mode.eyebrow;
  title.textContent = mode.title;
  subtitle.textContent = mode.subtitle;
  accessCopy.textContent = mode.accessCopy;
  panelDescription.textContent = mode.panelDescription;
  legendStart.textContent = mode.legend.start;
  legendActive.textContent = mode.legend.active;
  legendEnd.textContent = mode.legend.end;
  grid.replaceChildren();

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const tile = document.createElement("li");
      const key = `${row}-${column}`;
      const label = document.createElement("span");
      const name = document.createElement("strong");
      const tileCode = `${String.fromCharCode(65 + row)}${column + 1}`;
      const tileNumber = `Platform ${row + 1}.${column + 1}`;
      let state = "standard platform";

      tile.className = "platform-tile";

      label.className = "tile-label";
      label.textContent = tileNumber;

      name.className = "tile-name";
      name.textContent = tileCode;

      tile.append(label, name);

      if (activeTiles.has(key)) {
        tile.classList.add("active");
        state = mode.activeState;
      }

      if (key === mode.start) {
        tile.classList.add("start");
        state = mode.startState;
      }

      if (key === mode.end) {
        tile.classList.add("end");
        state = mode.endState;
      }

      tile.setAttribute("aria-label", `${tileNumber}, ${tileCode}, ${state}`);

      grid.appendChild(tile);
    }
  }
};

const setMode = (modeKey, prefix = "") => {
  const normalizedModeKey = Object.hasOwn(modes, modeKey) ? modeKey : "legacy";
  relayState.mode = normalizedModeKey;
  renderGrid();
  applyRelayState();
  announceStatus(prefix);
};

const toggleLamp = () => {
  if (relayState.jumping) {
    return;
  }

  relayState.lampActive = !relayState.lampActive;
  applyRelayState();
  announceStatus(relayState.lampActive ? "Roof lamp engaged." : "Roof lamp powered down.");
};

const toggleDoors = () => {
  if (relayState.jumping) {
    return;
  }

  relayState.doorsOpen = !relayState.doorsOpen;
  applyRelayState();
  announceStatus(relayState.doorsOpen ? "Temporal doors opened." : "Temporal doors sealed.");
};

const resetRelay = () => {
  window.clearTimeout(jumpTimer);
  relayState.mode = "legacy";
  relayState.lampActive = false;
  relayState.doorsOpen = false;
  relayState.jumping = false;
  renderGrid();
  applyRelayState();
  announceStatus("Chrono Relay reset.");
};

const startJump = () => {
  if (relayState.jumping) {
    return;
  }

  const currentIndex = modeOrder.indexOf(relayState.mode);
  const nextMode = modeOrder[(currentIndex + 1) % modeOrder.length];
  const duration = reducedMotion.matches ? 160 : 1400;

  relayState.jumping = true;
  relayState.lampActive = true;
  relayState.doorsOpen = true;
  applyRelayState();
  announceStatus(`Time jump charging for ${modes[nextMode].relayTarget}.`);

  jumpTimer = window.setTimeout(() => {
    relayState.mode = nextMode;
    relayState.jumping = false;
    relayState.doorsOpen = false;
    renderGrid();
    applyRelayState();
    announceStatus(`Time jump complete. ${modes[nextMode].relayTarget} engaged.`);
  }, duration);
};

const triggerShortcut = (key) => {
  if (relayState.jumping && key !== "r") {
    return;
  }

  if (key === "l") {
    toggleLamp();
  } else if (key === "o") {
    toggleDoors();
  } else if (key === "t") {
    startJump();
  } else if (key === "r") {
    resetRelay();
  } else if (key === "1") {
    setMode("legacy", "Legacy corridor selected manually.");
  } else if (key === "2") {
    setMode("peace7", "Zion-07 beacon selected manually.");
  } else if (key === "3") {
    setMode("matrix", "Cipher Rain corridor selected manually.");
  }
};

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (relayState.jumping) {
      return;
    }

    const modeKey = button.dataset.modeTrigger;
    const mode = modes[modeKey];
    setMode(modeKey, `${mode.buttonLabel} corridor selected manually.`);
  });
});

lampButton?.addEventListener("click", toggleLamp);
doorsButton?.addEventListener("click", toggleDoors);
jumpButton?.addEventListener("click", startJump);
resetButton?.addEventListener("click", resetRelay);

window.addEventListener("keydown", (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey) {
    return;
  }

  const target = event.target;
  if (target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(target.tagName))) {
    return;
  }

  const key = event.key.toLowerCase();
  if (["l", "o", "t", "r", "1", "2", "3"].includes(key)) {
    event.preventDefault();
    triggerShortcut(key);
  }
});

renderGrid();
applyRelayState();
announceStatus();
