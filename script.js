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
const status = document.getElementById("grid-status");
const resetButton = document.getElementById("grid-reset");
const replayButton = document.getElementById("grid-replay");
const modeButtons = document.querySelectorAll("[data-mode-trigger]");

const rows = 7;
const columns = 7;

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
  },
};

let currentMode = "legacy";
let expectedStep = 0;
let replayTimer = null;
const activatedTiles = new Set();

const toCode = (key) => {
  if (!key || typeof key !== "string") {
    return "--";
  }
  const [row, column] = key.split("-").map(Number);
  return `${String.fromCharCode(65 + row)}${column + 1}`;
};

const setText = (element, value) => {
  if (element) {
    element.textContent = value;
  }
};

const setStatus = (message) => {
  if (status) {
    status.textContent = "";
    window.requestAnimationFrame(() => {
      status.textContent = message;
    });
  }
};

const clearReplay = () => {
  if (replayTimer) {
    window.clearInterval(replayTimer);
    replayTimer = null;
  }
  if (replayButton) {
    replayButton.disabled = false;
  }
};

const updateTileActivation = () => {
  if (!grid) {
    return;
  }

  const tiles = grid.querySelectorAll(".platform-tile");
  tiles.forEach((tile) => {
    const button = tile.querySelector(".tile-button");
    if (!button) {
      return;
    }

    const isActivated = activatedTiles.has(button.dataset.key);
    tile.classList.toggle("is-activated", isActivated);
    const stateLabel = button.dataset.stateLabel || "available platform";
    const stateSuffix = isActivated ? ", activated" : "";
    const misstepSuffix = tile.classList.contains("is-misstep") ? ", signal mismatch" : "";
    button.setAttribute("aria-label", `${button.dataset.labelPrefix}, ${stateLabel}${stateSuffix}${misstepSuffix}`);
  });
};

const resetRun = (announce = true) => {
  clearReplay();
  expectedStep = 0;
  activatedTiles.clear();
  updateTileActivation();

  const mode = modes[currentMode];
  if (announce && mode) {
    setStatus(`Run reset. Activate ${toCode(mode.start)} to begin.`);
  }
};

const activateTile = (key, fromReplay = false) => {
  if (!grid) {
    return;
  }

  const mode = modes[currentMode];
  const expectedKey = mode.activeTiles[expectedStep];
  if (!expectedKey) {
    setStatus(`${mode.title} run complete. Grid synchronized.`);
    return;
  }

  if (key !== expectedKey) {
    const missedButton = grid.querySelector(`.tile-button[data-key="${key}"]`);
    if (missedButton) {
      const missedTile = missedButton.closest(".platform-tile");
      if (missedTile) {
        missedTile.classList.add("is-misstep");
        updateTileActivation();
        window.setTimeout(() => {
          missedTile.classList.remove("is-misstep");
          updateTileActivation();
        }, 250);
      }
    }
    setStatus(`Signal mismatch. Next platform is ${toCode(expectedKey)}.`);
    return;
  }

  activatedTiles.add(key);
  expectedStep += 1;
  updateTileActivation();
  if (replayButton) {
    replayButton.disabled = expectedStep > 0 && expectedStep < mode.activeTiles.length;
  }

  if (expectedStep === mode.activeTiles.length) {
    clearReplay();
    setStatus(
      fromReplay
        ? `${mode.title} signal replay complete.`
        : `${mode.title} run complete. Grid synchronized.`
    );
    return;
  }

  const nextCode = toCode(mode.activeTiles[expectedStep]);
  setStatus(fromReplay ? `Replaying signal... next ${nextCode}.` : `Platform locked. Next ${nextCode}.`);
};

const replayRun = () => {
  const mode = modes[currentMode];
  if (!mode || !replayButton) {
    return;
  }

  if (replayTimer) {
    setStatus("Replay already in progress.");
    return;
  }

  if (expectedStep > 0) {
    setStatus("Reset run before replaying the full signal.");
    return;
  }

  resetRun(false);
  replayButton.disabled = true;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) {
    mode.activeTiles.forEach((key) => activatedTiles.add(key));
    expectedStep = mode.activeTiles.length;
    updateTileActivation();
    clearReplay();
    setStatus(`${mode.title} signal replay complete.`);
    return;
  }

  setStatus("Replaying signal...");
  replayTimer = window.setInterval(() => {
    const key = mode.activeTiles[expectedStep];
    if (!key) {
      clearReplay();
      setStatus(`${mode.title} signal replay complete.`);
      return;
    }

    activateTile(key, true);
  }, 200);
};

const renderGrid = (modeKey) => {
  if (!grid || !body) {
    return;
  }

  const normalizedModeKey = Object.hasOwn(modes, modeKey) ? modeKey : "legacy";
  const mode = modes[normalizedModeKey];
  const activeTiles = new Set(mode.activeTiles);

  body.dataset.mode = normalizedModeKey;
  currentMode = normalizedModeKey;
  setText(eyebrow, mode.eyebrow);
  setText(title, mode.title);
  setText(subtitle, mode.subtitle);
  setText(accessCopy, mode.accessCopy);
  setText(panelDescription, mode.panelDescription);
  setText(legendStart, mode.legend.start);
  setText(legendActive, mode.legend.active);
  setText(legendEnd, mode.legend.end);
  grid.replaceChildren();

  modeButtons.forEach((button) => {
    const isSelected = button.dataset.modeTrigger === normalizedModeKey;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const tile = document.createElement("li");
      const button = document.createElement("button");
      const key = `${row}-${column}`;
      const label = document.createElement("span");
      const name = document.createElement("strong");
      const tileCode = `${String.fromCharCode(65 + row)}${column + 1}`;
      const tileNumber = `Platform ${row + 1}.${column + 1}`;
      let state = "available platform";

      tile.className = "platform-tile";
      button.className = "tile-button";
      button.type = "button";
      button.dataset.key = key;

      label.className = "tile-label";
      label.textContent = tileNumber;

      name.className = "tile-name";
      name.textContent = tileCode;

      button.append(label, name);
      tile.append(button);

      if (activeTiles.has(key)) {
        tile.classList.add("route");
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

      const baseLabel = `${tileNumber}, ${tileCode}`;
      button.dataset.labelPrefix = baseLabel;
      button.dataset.stateLabel = state;
      button.setAttribute("aria-label", `${baseLabel}, ${state}`);
      button.addEventListener("click", () => activateTile(key));

      grid.appendChild(tile);
    }
  }

  resetRun();
};

const handleGridKeydown = (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement) || !target.classList.contains("tile-button")) {
    return;
  }

  const [row, column] = (target.dataset.key || "").split("-").map(Number);
  if (Number.isNaN(row) || Number.isNaN(column)) {
    return;
  }

  let nextRow = row;
  let nextColumn = column;

  if (event.key === "ArrowUp") {
    nextRow = Math.max(0, row - 1);
  } else if (event.key === "ArrowDown") {
    nextRow = Math.min(rows - 1, row + 1);
  } else if (event.key === "ArrowLeft") {
    nextColumn = Math.max(0, column - 1);
  } else if (event.key === "ArrowRight") {
    nextColumn = Math.min(columns - 1, column + 1);
  } else {
    return;
  }

  event.preventDefault();
  const next = grid.querySelector(`.tile-button[data-key="${nextRow}-${nextColumn}"]`);
  if (next instanceof HTMLButtonElement) {
    next.focus();
  }
};

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    renderGrid(button.dataset.modeTrigger);
  });
});

if (resetButton) {
  resetButton.addEventListener("click", () => resetRun());
}

if (replayButton) {
  replayButton.addEventListener("click", replayRun);
}

if (grid) {
  grid.addEventListener("keydown", handleGridKeydown);
}

renderGrid("legacy");
