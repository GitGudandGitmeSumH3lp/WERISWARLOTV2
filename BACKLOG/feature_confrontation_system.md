# Feature: Confrontation System
**Version:** 1.0.0 | **Phase:** 2 → 3 | **Priority:** CRITICAL

## Experience Goal
**The Vibe:** *Damned If You Do, Damned If You Don't*
This is the moral crescendo. The player has found the killer, but now they face the game's central dilemma: **Apprehend the killer (and face the victim count) OR defuse the Crisis (and let the killer escape).** There is no "good" ending. The UI should feel heavy—like choosing which lives to prioritize. The post-choice screen should make the player sit with their decision.

## User Stories
- **As a player**, I want to choose between arresting the killer or saving lives, so the game respects my agency.
- **As a player**, I want the victim count to be revealed only AFTER I choose arrest, so there's no "optimal" path.
- **As a player**, I want the Crisis to feel urgent but vague, so I don't know if it's a bluff.

## Technical Requirements

### Data Structures
```typescript
confrontationState: {
  killerFound: boolean,
  choiceMade: 'arrest' | 'crisis' | null,
  victimCount: number, // Hidden until arrest
  crisisType: 'bomb' | 'poison' | 'hostage' | 'bluff',
  crisisActive: boolean
}
```

### Logic Rules
1. **Trigger Condition:**
   - Player clicks killer + Evidence Bag has 3+ Crime props
   - Opens Confrontation UI (full-screen modal, dark vignette)

2. **Choice Mechanics:**
   - **Option A: Apprehend**
     - Roll victimCount = `killerState.crimeCount + random(0-2)` (uncertainty!)
     - Reveal victim count in post-game screen
     - `convictionScore` calculated based on evidence quality
   - **Option B: Crisis**
     - Spawn Crisis UI (timer, clue hunt)
     - Killer escapes (sets `killerFound = false`)
     - If Crisis is defused, save lives BUT killer is still loose

3. **Victim Count Logic:**
   - Based on:
     - Crime vignettes spawned (each = 1 victim)
     - Props tagged as "victim-adjacent" (bloodstains, personal items)
     - Killer archetype (psychopath = higher count)
   - Formula: `victimCount = vignetteCount + (archetype === 'psychopath' ? 2 : 0)`

4. **Crisis Types:**
   - **Bomb (40%):** 60-second timer, must find 3 wires in city
   - **Poison (30%):** Must identify contaminated water source
   - **Hostage (20%):** Must reach specific location before timer
   - **Bluff (10%):** No actual crisis, wastes player's time (reinforces theme)

### Constraints
- Must tie into `gameStore.convictionScore`
- Cannot show victimCount before choice is made (no metagaming)
- Crisis must use existing prop spawn system (no new art assets)

## Dependencies
- [ ] `KillerActionSystem` (victimCount calculation)
- [ ] `CrisisSystem` (scenario logic)
- [ ] `EvidenceSystem` (convictionScore calculation)

## Definition of Done
- [ ] Confrontation UI appears after finding killer with 3+ evidence
- [ ] Choosing "Arrest" reveals victim count post-game
- [ ] Choosing "Crisis" spawns scenario and lets killer escape
- [ ] Bluff Crisis appears 10% of the time (player learns distrust)
- [ ] Post-game screen displays moral weight of choice (somber UI)