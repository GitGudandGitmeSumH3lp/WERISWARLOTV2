# Feature: Crisis System
**Version:** 1.0.0 | **Phase:** 2 → 3 | **Priority:** HIGH

## Experience Goal
**The Vibe:** *Ticking Clock of Helplessness*
The Crisis is the game's way of saying, "You can't have it all." It's a second detective game within the first—but this time, lives are actively at stake. The player should feel rushed but methodical, knowing that even if they succeed, the killer is still out there. The game ends in bittersweet victory at best.

## User Stories
- **As a player**, I want Crisis scenarios to feel distinct (bomb, poison, hostage), so replaying isn't predictable.
- **As a player**, I want Crises to have environmental clues (not just UI timers), so it feels integrated into the world.
- **As a player**, I want some Crises to be bluffs, so I learn to distrust the killer's final move.

## Technical Requirements

### Data Structures
```typescript
crisisScenario: {
  type: 'bomb' | 'poison' | 'hostage' | 'bluff',
  timeLimit: number, // Seconds
  cluesRequired: number,
  cluesFound: Prop[],
  resolved: boolean,
  livesSaved: number
}
```

### Logic Rules
1. **Spawn Trigger:**
   - Player chooses "Crisis" in Confrontation System
   - Spawns props/UI based on `crisisType`

2. **Crisis Mechanics:**

   **BOMB (Level 1-2):**
   - Spawns 3 wire props in random locations
   - Player must click wires in sequence (1 → 2 → 3)
   - Timer: 60 seconds
   - Success: Saves 5-10 lives | Failure: Game over

   **POISON (Level 2-3):**
   - Spawns contaminated water prop (fountain, well)
   - Player must inspect 5 NPCs to find symptoms (vomiting, pale skin)
   - Timer: 90 seconds
   - Success: Saves 10-20 lives | Failure: Partial save (50%)

   **HOSTAGE (Level 3+):**
   - Spawns locked door prop
   - Player must find key (hidden in container prop)
   - No timer, but killerHeat increases rapidly
   - Success: Saves 1 life (personal, emotional impact)

   **BLUFF (All Levels, 10% chance):**
   - No actual Crisis exists
   - Reveals after 30 seconds of searching
   - Player realizes they were deceived (reinforces killer's cunning)

3. **Integration with Victim Count:**
   - Crisis success reduces `victimCount` displayed in post-game
   - Bluff Crisis adds psychological weight (killer is mocking you)

4. **Level Scaling:**
   - Level 1: Only Bomb
   - Level 2: Bomb + Poison
   - Level 3+: All types (including Hostage)

### Constraints
- Must reuse existing prop types (no new assets)
- Timer must be visual (on-screen countdown, not just in gameStore)
- Crisis cannot be skipped (forces player to commit)

## Dependencies
- [ ] `ConfrontationSystem` (triggers Crisis)
- [ ] `PropSystem` (spawns Crisis-specific props)
- [ ] `VignetteSystem` (placement logic)

## Definition of Done
- [ ] 4 distinct Crisis types (Bomb, Poison, Hostage, Bluff)
- [ ] Timer is visible on-screen (UI overlay)
- [ ] Success/failure affects post-game victim count
- [ ] Bluff Crisis triggers 10% of the time
- [ ] Crisis props are distinct from crime props (visual clarity)