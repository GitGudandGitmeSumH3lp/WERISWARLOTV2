# Feature: Vignette System
**Version:** 1.0.0 | **Phase:** 0 (Exists) → 1 (Expand) | **Priority:** MEDIUM

## Experience Goal
**The Vibe:** *Environmental Storytelling*
Vignettes are the game's "show, don't tell" mechanism. A bloodstain + discarded glove + kicked-over chair tells a story without dialogue. The player should feel like a crime scene investigator, piecing together narrative fragments. But not every vignette is a crime—some are just life happening (couple arguing, kids playing), which makes the real clues harder to spot.

## User Stories
- **As a player**, I want vignettes to tell micro-stories, so the world feels lived-in.
- **As a player**, I want crime vignettes to be distinct from normal ones, so I can identify patterns.
- **As a player**, I want vignettes to be tailored to the level's location (park, docks, subway), so environments feel unique.

## Technical Requirements

### Data Structures
```typescript
vignette: {
  id: string,
  type: 'crime' | 'normal',
  props: Prop[],
  location: { x: number, y: number },
  narrative: string, // Optional flavor text
  linkedKiller?: string // If crime vignette
}
```

### Logic Rules
1. **Spawn Logic:**
   - Crime vignettes: Spawned by `KillerActionSystem` (1 per crime)
   - Normal vignettes: Spawned during map generation (5-10 per level)

2. **Crime Vignette Design:**
   - Must include 2-3 Crime props (weapon, victim item, evidence)
   - Props are spatially clustered (within 50px)
   - Linked to `killerArchetype` (professional uses clean vignettes, psychopath uses chaotic ones)

3. **Normal Vignette Examples:**
   - Park: Picnic setup (blanket, basket, ball)
   - Docks: Fishing gear (rod, net, bait)
   - Subway: Lost-and-found items (umbrella, phone, bag)

4. **Location-Based Props:**
   - Park: Organic items (flowers, benches, trash)
   - Docks: Industrial (crates, ropes, barrels)
   - Subway: Urban (graffiti, turnstiles, advertisements)

5. **Integration with Witness System:**
   - NPCs within 100px of crime vignette become "Witnesses"
   - Their dialogue references the vignette ("I saw someone near the fountain")

### Constraints (from `system.md`)
- Vignettes must be registered in `KillerRegistry.ts` (crime type mapping)
- Witness checks occur in `World.tsx` before `pendingVignetteSpawn` clears

## Dependencies
- [ ] `KillerActionSystem` (crime vignette spawn trigger)
- [ ] `PropSystem` (vignette composition)
- [ ] `DialogueSystem` (Witness integration)

## Definition of Done
- [ ] Crime vignettes spawn after each killer action
- [ ] Normal vignettes populate map (5-10 per level)
- [ ] Vignettes are location-appropriate (docks ≠ park props)
- [ ] Witnesses reference nearby vignettes in dialogue
- [ ] Crime vignettes match killer archetype (clean vs. chaotic)