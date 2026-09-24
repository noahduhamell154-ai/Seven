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

const renderGrid = (modeKey) => {
  if (!grid || !body) {
    return;
  }

  const normalizedModeKey = Object.hasOwn(modes, modeKey) ? modeKey : "legacy";
  const mode = modes[normalizedModeKey];
  const activeTiles = new Set(mode.activeTiles);

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

  modeButtons.forEach((button) => {
    const isSelected = button.dataset.modeTrigger === modeKey;
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
    renderGrid(button.dataset.modeTrigger);
  });
});

renderGrid("legacy");
