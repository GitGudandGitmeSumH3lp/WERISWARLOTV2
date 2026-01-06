# Feature: Click-to-Interact (Mobile-First Input)
**Version:** 0.1.0  
**Phase:** Phase 1 (Foundation)

## Experience Goal (The Vibe)
**"One-Tap Accusations"**  
Every tap is a judgment. Click a civilian? You see their routine, their alibi, their innocence—and waste 3 precious seconds. Click the killer? You win, but only if you're *sure*. The game should feel like a high-stakes version of tapping bugs: fast, decisive, irreversible. No complex combos, no hold-and-drag—just "I think it's YOU" and the consequences.

## User Stories
- **As a mobile player**, I want NPCs to have large hit-boxes so I don't misclick on crowded screens.
- **As a player**, I want instant feedback when I tap (highlight, animation) so I know the tap registered.
- **As a developer**, I want a unified input system that works on touch and mouse without code duplication.

## Technical Requirements
### Input Abstraction Layer
typescriptinterface InteractionTarget {
type: "npc" | "prop" | "evidence";
id: string;
hitbox: { x: number; y: number; radius: number };
onInteract: () => void;
}// Unified handler for touch/mouse
function handlePointerDown(x: number, y: number) {
const target = findClosestTarget(x, y);
if (target) {
highlightTarget(target);      // Instant visual feedback
playTapSound();               // Audio feedback
target.onInteract();          // Trigger action (dialogue, accusation)
}
}

### Mobile Considerations
- **Hit-box Size:** Minimum 44x44px (Apple iOS guidelines)
- **Touch Delay:** No `:hover` states (mobile has no hover)
- **Accidental Taps:** Debounce rapid taps (prevent double-accusation)

### Interaction Types
1. **NPC Click** → Open dialogue/accusation UI (React modal)
2. **Prop Click** → Inspect item (evidence bag system)
3. **Evidence Click** → Add to evidence bag (collect clue)

### Constraints (from `system.md`)
- **UI Architecture:** Pixi handles world, React handles overlays
- **Communication:** `useStore.subscribe` bridges Pixi → React

## Dependencies
- `feature_camera_waldo_view.md` (camera determines tap-to-world coordinates)
- `feature_npc_spawner.md` (NPCs must register as interactable)
- `feature_dialogue.md` (NPC clicks trigger dialogue)

## Definition of Done
- [ ] Tap/click on NPC opens dialogue modal (React)
- [ ] Tap/click on prop triggers inspection UI
- [ ] Hit-boxes tested on iPhone 13 Mini (small screen, fat fingers)
- [ ] Test: 40 overlapping NPCs—closest one always selected
- [ ] Visual feedback (glow/outline) appears within 16ms of tap