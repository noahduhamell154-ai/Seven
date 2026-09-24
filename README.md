# Seven

A dependency-free Tron-inspired Grid experience with an infinite-feeling relay
engine for both Legacy and Zion-07.

## Run locally

```bash
npm start
```

Then open `http://localhost:8000`.

## Grid controls

- **Move** with the arrow keys or `W`, `A`, `S`, `D`
- **Select adjacent route platforms** with a mouse or touch tap
- **Reset Run** restarts the current Grid mode at the relay origin
- **Replay Route** auto-runs the current mode to preview the cinematic pathing
- **Mode Switch** swaps between the Legacy blue relay and the Zion-07 green/gold
  signal lattice

## Experiences

- `/index.html` runs the interactive infinite Grid engine with:
  - **Legacy** mode: a blue/orange Tron-style relay that keeps extending
    forward
  - **Zion-07** mode: a green/gold signal route with its own status messaging
    and layout rhythm inside the same engine
- `/defense.html` preserves the Mecha AI Grid-defense prototype
