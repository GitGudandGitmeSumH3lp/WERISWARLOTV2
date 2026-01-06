# Feature: Killer Heat System
**Version:** 1.0.0 | **Phase:** 0 → 1 | **Priority:** CRITICAL

## Experience Goal
**The Vibe:** *The World Is Watching You (And So Is the Killer)*
Heat should be the game's invisible director. As it rises, the city should feel "tighter"—civilians move faster, avoid eye contact, the killer becomes more aggressive. The player doesn't see a number; they feel the simulation reacting to their presence. This is how we create dread without jump scares.

## User Stories
- **As a player**, I want the world to feel more tense as time passes, so inaction has atmospheric consequences.
- **As a player**, I want civilians to react to high Heat (flee, gossip, avoid me), so the simulation feels reactive.
- **As a player**, I want the killer to act more boldly at high Heat, so the endgame feels desperate.

## Technical Requirements

### Data Structures
```typescript
killerHeat: {
  value: number, // 0-100
  sources: {
    timeElapsed: number,
    crimesCommitted: number,
    playerInterrogations: number,
    witnessedVignettes: number
  },
  thresholds: {
    nervous: 30, // Civilians start fidgeting
    flee: 70,    // Civilians avoid player
    cascade: 90  // Killer enters "spree mode"
  }
}
```

### Logic Rules
1. **Heat Calculation:**
```
   killerHeat = (timeElapsed * 0.1) + (crimesCommitted * 10) + (interrogations * 2) + (witnessedVignettes * 5)
```

2. **Civilian Behavior Integration:**
   - **Heat < 30:** Normal wander (from `useCivilianSystem`)
   - **Heat 30-70:** Nervous state (faster movement, avoid player clicks)
   - **Heat > 70:** Flee state (run from player, `waitTimer = 0` per `system.md`)

3. **Killer Behavior Integration:**
   - **Heat < 50:** Normal cooldown between crimes
   - **Heat 50-90:** Cooldown reduced by 50%
   - **Heat > 90:** Cascade mode (commit crime every 20 seconds)

4. **Visual Feedback (No UI):**
   - Heat 30+: Civilians glance at player more frequently
   - Heat 50+: Ambient sound gets louder (footsteps echo)
   - Heat 70+: Screen vignette darkens slightly (subtle, not heavy-handed)
   - Heat 90+: Killer's debug highlight (if enabled) pulses red

### Constraints (from `system.md`)
- Heat must trigger behavioral changes in `useCivilianSystem`
- Flee state MUST set `waitTimer = 0` (architecture requirement)
- Cannot display Heat as a number (atmospheric system, not gamified)

## Dependencies
- [ ] `CivilianSystem` (behavior state machine)
- [ ] `KillerActionSystem` (cooldown modifiers)
- [ ] `World.tsx` (global state management)

## Definition of Done
- [ ] Heat increases based on time, crimes, and player actions
- [ ] Civilians flee when Heat > 70 (testable via debug mode)
- [ ] Killer's crime cooldown shortens at Heat > 50
- [ ] Screen vignette darkens at Heat > 70 (visual feedback)
- [ ] Cascade mode (Heat > 90) triggers rapid crimes