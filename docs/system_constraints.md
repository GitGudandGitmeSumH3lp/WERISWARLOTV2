# SYSTEM CONSTRAINTS
**Tech Stack:** Next.js 15 (React 19), PixiJS v8, Zustand, Python 3.11 (Scripts).
**Environment:** Windows 11 Dev.

## CRITICAL LIMITS
1. **Resolution:** 1280x720 internal logic (CSS scaled).
2. **Performance:** Max 60 active civilians. Tick Rate 30TPS / Render 60FPS.
3. **Persistence:** NO `localStorage`. State must be manually saved to `_STATE.md` or JSON export.
4. **Z-Sorting:** strict `sprite.zIndex = sprite.y`. Use `sortableChildren = true`.

## ARCHITECTURE BOUNDARIES
- **World:** Handled by PixiJS Canvas (WebGL/WebGPU).
- **UI:** Handled by React (Absolute overlays).
- **Bridge:** Use `useStore.subscribe` to link React UI <-> Pixi events.