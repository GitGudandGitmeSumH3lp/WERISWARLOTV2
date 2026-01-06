# Feature: Art Direction & Visual Standards
**Version:** 1.0.0 | **Phase:** 0 (Design) → 1 (Implementation) | **Priority:** LOW (But Critical for Polish)

## Experience Goal
**The Vibe:** *Stardew Meets Se7en*
The art should be approachable (Stardew Valley's warmth) but with subtle darkness (muted colors, textured shadows). It's a game about murder, but it shouldn't be grimdark. Think "cozy mystery with teeth." The player should feel comfortable spending hours in this world, even as they hunt a killer.

## User Stories
- **As a player**, I want the art to be readable (good for glasses-wearers), so I don't squint at tiny sprites.
- **As a player**, I want the art to have texture (not flat colors), so the world feels handcrafted.
- **As a player**, I want the UI to be minimal, so the game view isn't cluttered.

## Technical Requirements

### Visual Standards
1. **Character Sprites:**
   - Size: 32x48px (matches existing system)
   - Style: Stardew Valley-inspired (soft outlines, expressive faces)
   - Color Palette: Muted tones (avoid neon/oversaturated colors)
   - Texture: Add grain/noise overlay (5% opacity) to avoid flatness

2. **Prop Design:**
   - Size: 16x16px to 32x32px (depending on type)
   - Detail: Enough to be identifiable, not cluttered
   - Crime Props: Slightly desaturated (blood is dark red, not bright)
   - Herring Props: Visually similar to Crime props (intentional confusion)

3. **Environment Tiles:**
   - Grass: `0x2E7D32` (from `system.md`, add texture overlay)
   - Dirt: `0x795548` (add pebble details)
   - Water: `0x29B6F6` (animated ripples via shader if possible)
   - Walls: `0x424242` (add brick texture)

4. **UI Elements:**
   - Minimal overlays (no cluttered HUD)
   - Dialogue: Bottom-third banner (dark BG, white text)
   - Evidence Bag: Sidebar (slides in from right)
   - Inspection UI: Center modal (prop close-up, 200x200px)

### Constraints (from `system.md`)
- Mugshot rendering: `scale(4)`, `x(35)`, `y(5)` for 200x200 canvas
- Pixi v8 rendering with `zIndex: y` for layering
- No localStorage (all UI state in Zustand)

## Dependencies
- [ ] `PropSystem` (prop visual design)
- [ ] `InspectionSystem` (UI layout)
- [ ] `DialogueSystem` (dialogue UI design)

## Definition of Done
- [ ] All sprites have texture overlays (not flat)
- [ ] Color palette is muted (no oversaturation)
- [ ] UI elements are minimal (no visual clutter)
- [ ] Mugshot rendering uses correct scale/position
- [ ] Crime props are visually distinct but not obvious