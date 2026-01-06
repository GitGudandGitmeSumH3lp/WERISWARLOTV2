# Feature: Inspection System
**Version:** 1.0.0 | **Phase:** 0 → 1 | **Priority:** HIGH

## Experience Goal
**The Vibe:** *Obsessive Detective*
The world is a crime scene, and every object is a potential clue. The player should feel rewarded for slowing down and examining details. But there's a catch: not every "clue" is real. Red herrings are intentionally designed to waste time, mirroring the theme: "You can't save everyone, and searching for the truth has a cost."

## User Stories
- **As a player**, I want to click on props to reveal hidden details, so I can piece together the crime.
- **As a player**, I want some props to be red herrings, so the game isn't just "click everything."
- **As a player**, I want container props (bags, trash cans) to hide items, so exploration feels layered.

## Technical Requirements

### Data Structures
```typescript
prop: {
  id: string,
  type: 'crime' | 'herring' | 'ambiance' | 'container',
  description: string,
  hiddenItems?: Prop[], // For containers
  evidenceValue: number, // 0-100, how useful this is
  inspected: boolean
}
```

### Logic Rules
1. **Prop Types:**
   - **Crime (20%):** Directly tied to killer (weapon, victim clothing)
   - **Herring (30%):** Looks suspicious but irrelevant (rusty knife in garden)
   - **Ambiance (40%):** World-building (discarded coffee cup, graffiti)
   - **Container (10%):** Contains 1-3 sub-props (bags, lockers, dumpsters)

2. **Inspection UI:**
   - Click prop → Show close-up modal (prop name, description, "Add to Evidence" button)
   - Container props → Require second click to "Search Inside"
   - Must respect Pixi v8 hitArea rules (`system.md` interaction constraints)

3. **Evidence Value Scoring:**
   - Crime props: evidenceValue = 80-100
   - Herrings: evidenceValue = 10-30 (look useful, aren't)
   - Ambiance: evidenceValue = 0
   - Killer-specific props have hidden modifiers (e.g., professional's poison has +20)

4. **Container Logic:**
   - Containers can hold 1 Crime + 2 Ambiance props (mixed signals)
   - Searching a container takes 5 seconds (killerHeat increases)

### Constraints (from `system.md`)
- Props must use `eventMode="static"` for clicks
- Must define explicit `hitArea` (Rectangle) for decals
- Z-index must be `y` value for proper layering

## Dependencies
- [ ] `PropSystem` (static/dynamic prop spawn logic)
- [ ] `VignetteSystem` (crime props are tied to vignettes)
- [ ] `EvidenceSystem` (stores inspected items)

## Definition of Done
- [ ] Clicking any prop shows Inspection UI
- [ ] Container props reveal hidden items on second click
- [ ] Crime props have higher evidenceValue than herrings
- [ ] Inspecting 5+ props increases convictionScore accuracy
- [ ] Red herrings deliberately mislead player (e.g., bloody knife in butcher shop)