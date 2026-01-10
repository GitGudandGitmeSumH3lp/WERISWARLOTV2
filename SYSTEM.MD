---
# System Architecture & Technical Constraints (CTO Approved)

# MASTER SYSTEM CONSTITUTION
**NOTE:** This is the Master Record.
For AI Packets, use the split versions:
- `docs/system_constraints.md` (Planning)
- `docs/system_style.md` (Coding)



## 1. Stack & Environment
- **Framework:** Next.js 15 (React 19)
- **Engine:** PixiJS v8 (High-performance 2D WebGL/WebGPU)
- **State:** Zustand (Primitive-based, no-overhead store)
- **OS:** Windows 11 Dev Environment
- **Backend/Scripts:** Python 3.11 (For offline level generation/balancing)

## 2. Rendering Constraints (PixiJS)
- **Resolution:** 1280x720 (Internal logic), CSS scaled to window.
- **Layering:** `container.sortableChildren = true`. 
- **Depth:** `sprite.zIndex = sprite.y`.
- **Scaling:** Global pixel-art scale = 4.

## 3. Simulation Constraints
- **NPC Cap:** Max 60 active civilians before performance throttle.
- **Tick Rate:** Logic runs at 30TPS; Rendering at 60FPS.
- **Data:** No `localStorage`. All persistence via `_STATE.md` manual saves or JSON exports during development.

## 4. UI Architecture
- **World:** Handled by PixiJS Canvas.
- **Overlays:** (Dialogue, Menus, Evidence Bag) Handled by React (Absolute positioning).
- **Communication:** `useStore.subscribe` to bridge React UI with Pixi world events.



## 1. Stack & Environment
- **Framework:** Next.js 15 (React 19)
- **Engine:** PixiJS v8
- ... (See split files for details)