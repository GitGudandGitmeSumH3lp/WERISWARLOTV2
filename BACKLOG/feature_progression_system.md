# Feature: Progression & Level Scaling
**Version:** 1.0.0 | **Phase:** 3 → 4 | **Priority:** LOW (Post-MVP)

## Experience Goal
**The Vibe:** *Escalating Complexity, Diminishing Returns*
Each level should feel harder, but not because of artificial difficulty spikes. The world gets more crowded (more NPCs = more suspects), more props appear (more noise to sift through), and the killer gets smarter (better alibis, more bluffs). The player should feel like they're getting better at the game, but the game is also getting better at fooling them.

## User Stories
- **As a player**, I want each level to introduce new challenges, so the game doesn't feel repetitive.
- **As a player**, I want levels to have distinct environments (park, docks, subway), so each feels unique.
- **As a player**, I want the difficulty to scale organically (not just "more enemies"), so it feels fair.

## Technical Requirements

### Data Structures
```typescript
levelConfig: {
  levelNumber: number,
  environment: 'park' | 'docks' | 'subway' | 'mall' | 'hospital',
  population: number, // NPC count
  propDensity: number, // Props per 100px²
  herringRatio: number, // % of props that are red herrings
  crisisTypes: string[], // Available Crisis scenarios
  killerArchetypes: string[] // Unlocked personalities
}
```

### Logic Rules
1. **Level Scaling:**

   **Level 1 (Tutorial):**
   - Environment: Small park
   - Population: 15 NPCs
   - Props: 30 (10% herrings)
   - Crisis: Bomb only
   - Killer: Professional (easy, methodical)

   **Level 2:**
   - Environment: Docks
   - Population: 25 NPCs
   - Props: 50 (20% herrings)
   - Crisis: Bomb + Poison
   - Killer: Professional OR Opportunist

   **Level 3:**
   - Environment: Subway station
   - Population: 40 NPCs
   - Props: 80 (30% herrings)
   - Crisis: All types (including Hostage)
   - Killer: Any archetype (including Psychopath)

   **Level 4+:**
   - Environment: Mall, Hospital (large, complex layouts)
   - Population: 60+ NPCs
   - Props: 120+ (40% herrings)
   - Crisis: All types + Bluffs
   - Killer: Spree mode unlocked

2. **Environment-Specific Mechanics:**
   - Park: Open sight lines (easier to spot vignettes)
   - Docks: Containers everywhere (more search time)
   - Subway: Crowds + chokepoints (NPCs cluster)
   - Mall: Multi-floor (requires navigation)

3. **Post-Game Unlocks:**
   - Completing Level 1 unlocks Opportunist killer
   - Completing Level 2 unlocks Psychopath killer
   - Completing Level 3 unlocks Spree mode
   - Perfect run (convictionScore > 80) unlocks Hard Mode

### Constraints
- Cannot use localStorage (Zustand only, from `system.md`)
- Levels must reuse existing prop types (no new assets per level)
- Population scales with performance (cap at 60 NPCs)

## Dependencies
- [ ] All core systems (Killer, Civilian, Evidence, Crisis)
- [ ] `VignetteSystem` (environment-specific vignettes)
- [ ] `PropSystem` (herring ratio scaling)

## Definition of Done
- [ ] 3 distinct levels with unique environments
- [ ] Population scales 15 → 25 → 40 NPCs
- [ ] Herring ratio scales 10% → 20% → 30%
- [ ] Crisis types unlock progressively
- [ ] Post-game screen shows level completion stats