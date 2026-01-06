# Feature: Killer Escape Sequence (Lose Condition)
**Version:** 0.1.0  
**Phase:** Phase 1 (Foundation)

## Experience Goal (The Vibe)
**"You Were So Close"**  
The timer hits zero. You see the killer—finally, *finally*—walking calmly toward the edge of the screen. He doesn't run. He doesn't panic. He just... leaves. And you can't do anything but watch. The game freezes the world, spotlights him, and lets you stew in the failure. It's the Waldo book closing before you find him, except Waldo just murdered someone. The vibe is: *"Next time, scan faster."*

## User Stories
- **As a player**, I want to SEE the killer escape (not just a "You Lose" screen) so the failure stings.
- **As a player**, I want a retry button immediately available so I can chase that dopamine hit.
- **As a developer**, I want the escape sequence to be reusable across all levels (not level-specific logic).

## Technical Requirements
### Escape Animation Sequence
```typescript
function triggerKillerEscape() {
  // 1. Freeze all NPCs except killer
  freezeAllNPCs();
  
  // 2. Zoom camera to killer
  tweenCameraToTarget(killerSprite, 1.5x zoom, 1.0s);
  
  // 3. Killer walks to exit (edge of screen)
  killerSprite.playAnimation("walk_to_exit");
  
  // 4. Fade to black after killer exits
  fadeToBlack(2.0s);
  
  // 5. Show defeat screen (React modal)
  showDefeatScreen({
    message: "The killer escaped.",
    stats: { timeElapsed, wrongAccusations }
  });
}
```

### Visual Effects
- **Spotlight:** Dim all other NPCs (alpha = 0.3)
- **Red Outline:** Killer highlighted with pulsing red glow
- **Audio:** Ominous music sting + police sirens fading away

### Post-Escape UI (React Modal)
- **Message:** "The killer escaped. You were 10 seconds too slow."
- **Stats:** Time elapsed, wrong accusations made, hint (killer's behavior)
- **Buttons:** [Retry Level] [Next Level] [Main Menu]

### Constraints (from `system.md`)
- **Rendering:** PixiJS handles animation, React handles defeat UI
- **Communication:** `useStore.setState({ gameOver: true })` triggers modal

## Dependencies
- `feature_killer_hunt_loop.md` (timer triggers escape)
- `feature_camera_waldo_view.md` (camera zoom for dramatic reveal)
- `feature_npc_spawner.md` (killer NPC must have escape animation)

## Definition of Done
- [ ] Escape sequence plays when timer hits zero
- [ ] Camera zooms to killer smoothly (no jank)
- [ ] Defeat screen shows stats (time, wrong accusations)
- [ ] Retry button reloads level instantly (<1s)
- [ ] Test: Escape sequence skippable via tap (for replay speedrun)