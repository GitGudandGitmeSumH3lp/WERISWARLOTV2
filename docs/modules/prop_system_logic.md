# Module Logic: Prop System

## 1. The Separation of Concerns
We use a **Data-Driven** approach. The `Prop` is not a Game Object; it is a JSON entry in the `PropStore`. The `PropSprite` is just a dumb renderer that reacts to that JSON.

- **Source of Truth:** `usePropStore` (Zustand).
- **Renderer:** `PropRenderer` (Pixi Component).

## 2. Rendering Pipeline
To maintain the "2.5D" look defined in `Art Direction`:
1. **Spawn:** `KillerActionSystem` or `LevelLoader` pushes a `PropData` object to the Store.
2. **Reactivity:** The React component `<WorldProps />` maps over `store.props`.
3. **Pixi Instantiation:** For each prop, a `<PropSprite />` is created.
4. **Depth Sorting:**
   - Pixi v8 `layer.sortableChildren = true`.
   - **CRITICAL:** In the `useTick` loop (or on position change), we run `sprite.zIndex = sprite.y`.
   - This ensures props "behind" the player render behind them, and props "in front" render atop.

## 3. Interaction Logic
- **Hit Area:** To prevent "pixel hunting" (squinting), the `hitArea` of the sprite is padded by **10px** on all sides.
- **Visual Feedback:**
    - `hover`: Apply a generic `OutlineFilter` (white, 1px).
    - `click`:
        - If `type == CONTAINER`: Check `metadata.isOpen`. If false, play open animation. If true, trigger Inspection.
        - If `type == CRIME/HERRING`: Trigger Inspection System immediately.

## 4. State Management
When a player interacts with a prop:
1. **Input:** Click detected on `PropSprite`.
2. **Action:** Call `useGameStore.setState({ activeInspectionId: prop.id })`.
3. **Reaction:** The React UI layer (outside Pixi) observes `activeInspectionId` and mounts the `<InspectionModal />`.
4. **Persistence:** `prop.hasBeenInspected` is set to `true`. The Sprite updates (tint darkens) to show visited state.