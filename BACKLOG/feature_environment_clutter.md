# Feature: Environment & Clutter Generation (v1.0)

## Experience Goal (The Vibe)
**"Organized Chaos."**
The world should feel lived-in and messy, like a busy market or a festival. It captures the *Where's Waldo* spirit—hundreds of small details competing for your attention. The Stardew Valley-inspired 2.5D perspective creates a sense of depth, forcing the player to look *behind* things, adding a layer of tactile frustration when lines of sight are blocked.

## User Stories
- As a player, I want to navigate a "Top-Down 2.5D" world (front-facing sprites, 3/4 view).
- As a player, I want the environment to be filled with props (crates, stalls, fences) so the killer has places to hide.
- As a player, I want the world to feel "open" (park, plaza) yet "cluttered" (dense assets).

## Technical Requirements
- **PixiJS Rendering:**
  - **Z-Sorting:** Strictly implement `sprite.zIndex = sprite.y` for all props and characters to handle the 2.5D depth correctly.
  - **Scale:** Maintain Global Pixel Scale = 4.
- **Map Generation:**
  - A grid-based placement system (or Poisson Disk Sampling) to scatter props.
  - **Collision:** Simple bounding boxes for props to prevent NPCs from walking *through* tables, but allowing them to walk *behind* them.

## Dependencies
- `system.md` (Rendering Constraints).
- `feature_prop_system.md` (Base classes for the items).

## Definition of Done
- [ ] The "Y-Sort" algorithm works: A character walking "down" passes in front of a prop; walking "up" goes behind it.
- [ ] A "Plaza" map background is rendered.
- [ ] At least 50 static props are generated in the scene without overlapping spawn points.
- [ ] The scene looks "busy" but paths are still navigable.