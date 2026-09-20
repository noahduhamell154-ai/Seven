const grid = document.getElementById("platform-grid");

const rows = 7;
const columns = 7;
const route = new Set([
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
]);

for (let row = 0; row < rows; row += 1) {
  for (let column = 0; column < columns; column += 1) {
    const tile = document.createElement("article");
    const key = `${row}-${column}`;
    const label = document.createElement("span");
    const name = document.createElement("strong");

    tile.className = "platform-tile";
    tile.setAttribute("role", "listitem");
    tile.setAttribute(
      "aria-label",
      `Platform ${row + 1}.${column + 1} at ${String.fromCharCode(65 + row)}${column + 1}`,
    );

    label.className = "tile-label";
    label.textContent = `Platform ${row + 1}.${column + 1}`;

    name.className = "tile-name";
    name.textContent = `${String.fromCharCode(65 + row)}${column + 1}`;

    tile.append(label, name);

    if (route.has(key)) {
      tile.classList.add("active");
    }

    if (key === "0-0") {
      tile.classList.add("start");
    }

    if (key === "6-6") {
      tile.classList.add("end");
    }

    grid.appendChild(tile);
  }
}
