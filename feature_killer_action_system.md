# Feature: Killer Action System
**Version:** 1.0.0 | **Phase:** 0 → 1 | **Priority:** CRITICAL

## Experience Goal
**The Vibe:** *Creeping Dread*
The player should feel the city getting "sicker" over time. Each moment they spend analyzing evidence or questioning the wrong person, the killer grows bolder. The atmosphere shifts from "detective game" to "race against time" without a single UI timer—just the world itself becoming more corrupted.

## User Stories
- **As a player**, I want the killer to act more frequently the longer I take, so my hesitation has mechanical consequences.
- **As a player**, I want different killers to feel distinct (cautious vs. reckless), so replaying the game isn't repetitive.
- **As a player**, I want to potentially spawn into a world where a crime has already occurred, so I feel immediate urgency.

## Technical Requirements

### Data Structures (Zustand Store)
```typescript
killerState: {
  personality: 'psychopath' | 'professional' | 'opportunist' | 'spree',
  actionCooldown: number, // Decreases over time
  crimeCount: number,
  nextCrimeChance: number, // Increases based on Heat + Time
  activeVignette: string | null
}
```

### Logic Rules
1. **Escalation Formula:**
```
   nextCrimeChance = baseChance + (timeSinceLastCrime * 0.05) + (killerHeat * 0.01)
```
   - `psychopath`: baseChance = 20%, short cooldown (30-60s)
   - `professional`: baseChance = 5%, long cooldown (90-180s), higher success rate
   - `opportunist`: baseChance scales with crowd density
   - `spree`: No cooldown after first crime (cascading chaos)

2. **Initial Crime Spawn:**
   - 40% chance the game starts with 1 completed vignette already placed
   - Must be a "cold" crime (bloodstain, discarded weapon) to avoid spawn-camping

3. **Vignette Assignment:**
   - Reference `KillerRegistry.ts` to match personality to crime types
   - `professional` → Poisoning, staged accidents
   - `psychopath` → Overt violence, trophies
   - `opportunist` → Theft-turned-violent, crimes of convenience

### Constraints (from `system.md`)
- Vignettes must be registered in `KillerRegistry.ts`
- Witness checks must occur in `World.tsx` before `pendingVignetteSpawn` clears
- Killer behavior must respect Safe Zones (spawn exclusions)

## Dependencies
- [ ] `VignetteSystem` (must exist to place crime scenes)
- [ ] `KillerHeatSystem` (provides Heat value for escalation)
- [ ] `SpawningSystem` (Safe Zone definitions)

## Definition of Done
- [ ] Killer commits crimes at personality-appropriate intervals
- [ ] `nextCrimeChance` visibly increases when player is idle (testable via debug)
- [ ] 40% of games start with 1 pre-existing crime vignette
- [ ] Each personality type triggers distinct vignette categories
- [ ] Spree killer cascades into chaos if first crime succeeds unnoticed