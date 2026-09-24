# Seven

A main-based grid inspired by Tron: Legacy.

## Experiences

- `/index.html` renders the Seven platform grid with `legacy`, `Zion-07`
  (`peace7`), and `The Matrix` (`matrix`) modes.
- `/defense.html` preserves the Mecha AI Grid-defense prototype.

## Collapse / restore controls

The Grid experience now includes a reversible cinematic system shutdown:

- **Collapse the Grid** asks for confirmation before activating the collapse
  sequence (Legacy, Zion-07, The Matrix, and Chrono Relay-linked state power
  down together).
- **Rebuild Grid / Restore all systems** restores the prior active mode and full
  interaction state without a page reload.
- Motion-aware behavior respects `prefers-reduced-motion` with an equivalent
  non-animated transition.

## Run locally

```bash
npm start
```

Then open `http://localhost:8000`.
