# Seven

A static, dependency-free Grid experience with three procedural modes:

- **Legacy** — a Tron: Legacy-inspired light-grid with bright lanes and bridge points.
- **Zion-07** — a calmer beacon field built from balanced signal rows.
- **The Matrix** — an emerald-black codefield with stream columns, relay rows, and glyph clusters.

## Experiences

- `/index.html` renders the interactive infinite-grid viewport with keyboard traversal,
  reset/replay controls, telemetry, and mode switching.
- `/defense.html` preserves the Mecha AI Grid-defense prototype.

## Controls

- **Arrow keys** — move the current selection inside the viewport.
- **Enter / Space** — traverse to the selected adjacent active platform.
- **R** — reset the current run to the origin.
- **P** — replay the recent path for the current run.
- **Mouse / touch** — select any visible tile or traverse to adjacent active tiles.

## Run locally

```bash
npm start
```

Then open `http://localhost:8000`.
