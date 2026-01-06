# Feature: Camera System (Waldo View)
**Version:** 0.1.0  
**Phase:** Phase 1 (Foundation)

## Experience Goal (The Vibe)
**"Frantic Visual Scanning"**  
The player should feel like they're staring at a Where's Waldo page that *fights back*. The top-down view shows the entire crime scene at once—a park full of 40+ tiny pixel people. No panning, no zooming (initially)—just raw visual overload. The killer is in there *somewhere*, and every second you spend squinting at the wrong person, he's getting closer to escaping. It's the childhood joy of "I found him!" twisted into "Please don't let me be too late."

## User Stories
- **As a player**, I want to see the entire level at once so I can scan for suspicious behavior.
- **As a mobile player**, I want the camera fixed (no accidental panning) so my touches only interact with NPCs/props.
- **As a developer**, I want the camera bounds to fit the level perfectly so there's no dead space.

## Technical Requirements
### Camera Configuration

typescriptinterface CameraConfig {
type: "fixed-orthographic";  // Top-down, no perspective
bounds: {
width: 2560;   // Level width from level JSON
height: 1440;  // Level height from level JSON
};
viewport: {
width: 1280;   // From system.md
height: 720;
};
zoom: {
initial: 1.0;
min: 0.8;      // Slight zoom-out (optional feature)
max: 1.5;      // Zoom-in on suspects (optional)
};
}

### PixiJS Implementation
- Use `PIXI.Container` as world root
- Set `container.position` to center level in viewport
- **Mobile:** Disable pinch-zoom (CSS `touch-action: none`)
- **Desktop:** Optional mouse wheel zoom (Phase 2 feature)

### Constraints (from `system.md`)
- **Resolution:** 1280x720 internal, CSS scaled to device
- **Rendering:** PixiJS v8 with WebGL/WebGPU
- **Performance:** Must render 60 NPCs + 200 props at 60fps

## Dependencies
- `feature_level_schema.md` (camera bounds from level JSON)
- `system.md` rendering constraints ✅

## Definition of Done
- [ ] Camera shows entire level without scrolling (initial state)
- [ ] Touch input does NOT accidentally pan camera
- [ ] Test on iPhone SE (smallest target) - all NPCs tappable
- [ ] Zoom feature toggleable via dev flag (for accessibility)
- [ ] Level bounds auto-calculated from JSON spawn zones