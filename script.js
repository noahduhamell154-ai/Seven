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
const modeButtons = document.querySelectorAll("[data-mode-trigger]");
const relayStatus = document.getElementById("relay-status");
const gridSystemState = document.getElementById("grid-system-state");
const collapseButton = document.getElementById("collapse-grid");
const restoreButton = document.getElementById("restore-grid");
const collapseFeedback = document.getElementById("collapse-feedback");
const gridLiveStatus = document.getElementById("grid-live-status");

const rows = 7;
const columns = 7;
const collapseDuration = 1200;
const rebuildDuration = 350;
const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

const modes = {
  legacy: {
    eyebrow: "wake-up Neo...",
    title: "Tron: Legacy Grid",
    subtitle:
      "A light-grid inspired by Tron: Legacy with luminous platforms and a glowing path across the arena.",
    accessCopy: "Legacy access remains open across the arena.",
    panelDescription:
      "7 x 7 light platforms with a highlighted run across the grid.",
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
    relayStatus: "Chrono Relay link: synchronized.",
  },
  peace7: {
    eyebrow: "peace across the grid",
    title: "Peace7 Mode",
    subtitle:
      "A calmer signal for Seven that reshapes the arena into a glowing peace pattern.",
    accessCopy:
      "Password: Peace7. Grid callsign: Zion7 or Zion-07.",
    panelDescription:
      "7 x 7 light platforms tuned into the Peace7 beacon.",
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
    relayStatus: "Chrono Relay link: beacon synchronized.",
  },
  matrix: {
    eyebrow: "there is no spoon",
    title: "The Matrix Grid",
    subtitle:
      "Machine code streams through the arena as the route resolves through digital green sectors.",
    accessCopy: "Matrix shell active. Chrono Relay bridge remains lock-steady.",
    panelDescription: "7 x 7 machine sectors with the selected shell route highlighted.",
    legend: {
      start: "Ingress",
      active: "Code Path",
      end: "Exit",
    },
    start: "0-6",
    end: "6-0",
    activeTiles: [
      "0-6",
      "1-6",
      "1-5",
      "2-5",
      "2-4",
      "3-4",
      "3-3",
      "4-3",
      "4-2",
      "5-2",
      "5-1",
      "6-1",
      "6-0",
    ],
    activeState: "code path sector",
    startState: "ingress sector",
    endState: "exit sector",
    relayStatus: "Chrono Relay link: machine-time synchronized.",
  },
};

let activeModeKey = "legacy";
let modeBeforeCollapse = "legacy";
let isCollapsed = false;
let collapseTimer = null;
let rebuildTimer = null;

const clearTimers = () => {
  if (collapseTimer) {
    clearTimeout(collapseTimer);
    collapseTimer = null;
  }

  if (rebuildTimer) {
    clearTimeout(rebuildTimer);
    rebuildTimer = null;
  }
};

const setControlStates = () => {
  const collapsing = body?.dataset.gridState === "collapsing";
  collapseButton.disabled = isCollapsed || collapsing;
  restoreButton.disabled = !isCollapsed;

  modeButtons.forEach((button) => {
    button.disabled = isCollapsed || collapsing;
  });
};

const setStatusCopy = (statusText, liveText) => {
  gridSystemState.textContent = statusText;
  gridLiveStatus.textContent = liveText;
};

const renderGrid = (modeKey) => {
  if (!grid || !body) {
    return;
  }

  const normalizedModeKey = Object.hasOwn(modes, modeKey) ? modeKey : "legacy";
  const mode = modes[normalizedModeKey];
  const activeTiles = new Set(mode.activeTiles);
  activeModeKey = normalizedModeKey;

  body.dataset.mode = normalizedModeKey;
  eyebrow.textContent = mode.eyebrow;
  title.textContent = mode.title;
  subtitle.textContent = mode.subtitle;
  accessCopy.textContent = mode.accessCopy;
  panelDescription.textContent = mode.panelDescription;
  legendStart.textContent = mode.legend.start;
  legendActive.textContent = mode.legend.active;
  legendEnd.textContent = mode.legend.end;
  grid.replaceChildren();

  if (!isCollapsed) {
    relayStatus.textContent = mode.relayStatus;
  }

  modeButtons.forEach((button) => {
    const isSelected = button.dataset.modeTrigger === normalizedModeKey;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });

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
      tile.style.setProperty("--collapse-delay", `${(row * columns + column) * 18}ms`);

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

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (isCollapsed) {
      return;
    }

    renderGrid(button.dataset.modeTrigger);
    modeBeforeCollapse = activeModeKey;
    setStatusCopy("Grid systems: Active.", `Grid status: ${modes[activeModeKey].title} active.`);
  });
});

const beginCollapse = () => {
  clearTimers();
  isCollapsed = false;
  body.dataset.gridState = "collapsing";
  relayStatus.textContent = "Chrono Relay link: offline.";
  setStatusCopy("Grid systems: Collapsing.", "Grid status: Collapse sequence initiated.");
  collapseFeedback.textContent = "Collapse confirmed. Systems are powering down.";
  setControlStates();

  const finalizeCollapse = () => {
    body.dataset.gridState = "collapsed";
    isCollapsed = true;
    setStatusCopy("Grid systems: Collapsed.", "Grid status: All grid modes collapsed.");
    setControlStates();
  };

  if (reduceMotionQuery.matches) {
    finalizeCollapse();
    return;
  }

  collapseTimer = window.setTimeout(finalizeCollapse, collapseDuration);
};

const restoreGrid = () => {
  clearTimers();
  isCollapsed = false;
  body.dataset.gridState = reduceMotionQuery.matches ? "active" : "rebuilding";
  renderGrid(modeBeforeCollapse);
  relayStatus.textContent = modes[modeBeforeCollapse].relayStatus;
  setStatusCopy("Grid systems: Active.", `Grid status: ${modes[modeBeforeCollapse].title} restored.`);
  collapseFeedback.textContent = "All systems restored. Grid traversal is re-enabled.";
  setControlStates();

  if (reduceMotionQuery.matches) {
    return;
  }

  rebuildTimer = window.setTimeout(() => {
    body.dataset.gridState = "active";
  }, rebuildDuration);
};

collapseButton?.addEventListener("click", () => {
  if (isCollapsed || body.dataset.gridState === "collapsing") {
    return;
  }

  const confirmed = window.confirm(
    "Collapse Legacy, Zion-07, The Matrix, and Chrono Relay-linked state now? This is reversible.",
  );

  if (!confirmed) {
    collapseFeedback.textContent = "Collapse canceled. Grid remains active.";
    setStatusCopy("Grid systems: Active.", `Grid status: ${modes[activeModeKey].title} remains active.`);
    return;
  }

  modeBeforeCollapse = activeModeKey;
  beginCollapse();
});

restoreButton?.addEventListener("click", () => {
  if (!isCollapsed) {
    return;
  }

  restoreGrid();
});

body.dataset.gridState = "active";
renderGrid("legacy");
setStatusCopy("Grid systems: Active.", "Grid status: Legacy mode active.");
setControlStates();
