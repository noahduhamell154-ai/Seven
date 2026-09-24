# Seven

A static neon Grid experience with a new Chrono Relay timebox portal.

## Experiences

- `/index.html` renders the main Seven Grid with:
  - three corridors: Legacy, Zion-07 (`peace7`), and Cipher Rain
  - the Chrono Relay timebox scene with lamp, doors, jump, and reset controls
  - keyboard shortcuts for relay controls and corridor switching
- `/defense.html` preserves the Mecha AI Grid-defense prototype.

## Chrono Relay controls

- **Lamp**: toggles the roof lamp glow
- **Doors**: opens or seals the front doors to reveal the temporal interior
- **Time jump**: runs a short warp transition and advances to the next corridor
- **Reset relay**: restores the default Legacy corridor and clears relay state

Keyboard shortcuts:

- `L` lamp
- `O` doors
- `T` time jump
- `R` reset relay
- `1` / `2` / `3` switch corridors

## Run locally

```bash
npm start
```

Then open `http://localhost:8000`.

## Smoke test notes

After starting the local server:

1. Open `http://localhost:8000`
2. Verify the Chrono Relay controls update the visible status text
3. Trigger a time jump and confirm the corridor advances without breaking the
   platform grid
4. Check that Legacy, Zion-07, and Cipher Rain each restyle the grid and keep
   the layout responsive without horizontal overflow
