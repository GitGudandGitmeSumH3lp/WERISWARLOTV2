# Feature: Prop System (Expansion)
**Version:** 2.0.0 | **Phase:** 1 → 2 | **Priority:** MEDIUM

## Experience Goal
**The Vibe:** *Every Object Has a Story (Or Does It?)*
Props are the building blocks of the investigation. The player should feel rewarded for thoroughness but punished for paranoia. Checking every trash can is realistic detective work—but it also wastes time. Container props add a layer of risk/reward: "Do I search this bag and risk the killer acting again, or move on?"

## User Stories
- **As a player**, I want props to have detailed descriptions, so the world feels tangible.
- **As a player**, I want container props (bags, cans) to hide sub-props, so exploration has depth.
- **As a player**, I want red herrings to look suspicious, so I'm constantly second-guessing.

## Technical Requirements

### Data Structures
```typescript
prop: {
  id: string,
  type: 'crime' | 'herring' | 'ambiance' | 'container',
  appearance: 'weapon' | 'clothing' | 'tool' | 'organic' | 'container',
  description: string,
  evidenceValue: number,
  contents?: Prop[], // For containers
  inspected: boolean,
    addedToEvidence: boolean
}

### Logic Rules
1. **Prop Type Distribution (per level):**
   - Crime: 5-10 (scales with killer actions)
   - Herring: 10-20 (scales with level difficulty)
   - Ambiance: 30-50 (fills world)
   - Container: 5-10 (hides sub-props)

2. **Container Mechanics:**
   - Containers hold 1-3 sub-props (mixed Crime/Herring/Ambiance)
   - Searching takes 5 seconds (killerHeat increases)
   - Example containers: Trash cans, lockers, bags, toolboxes

3. **Red Herring Design:**
   - Must *look* like Crime props (bloody knife in butcher shop, "suspicious" briefcase)
   - Low evidenceValue (10-30) but high visual salience
   - Descriptions are intentionally vague ("Looks out of place...")

4. **Logical Prop Placement:**
   - Park: Organic props (flowers, benches, litter)
   - Docks: Industrial (ropes, crates, oil drums)
   - Subway: Urban (graffiti, newspapers, vending machines)
   - Crime props placed via Vignettes (not random)

### Constraints (from `system.md`)
- Props must use `eventMode="static"` for Pixi v8 clicks
- Must define explicit `hitArea` (Rectangle)
- Z-index must be `y` value for layering

## Dependencies
- [ ] `InspectionSystem` (click-to-inspect UI)
- [ ] `VignetteSystem` (crime prop placement)
- [ ] `EvidenceSystem` (prop storage)

## Definition of Done
- [ ] Props have 3-sentence descriptions minimum
- [ ] Container props reveal 1-3 sub-props on search
- [ ] Red herrings appear in 30% of inspections
- [ ] Props are location-appropriate (no park props in subway)
- [ ] Searching containers increases killerHeat by 2 points

## 3. INTEGRATION POINTS
*   **Modify:** `contracts/inventory.md` to define `Prop` data structure, `Container` interface, and `Evidence` types.
*   **Modify:** `contracts/world.md` to implement Prop distribution logic (Biome rules) and Vignette placement hooks.
*   **Modify:** `contracts/combat.md` to expose `adjustHeat()` for the container searching penalty.
*   **Modify:** `contracts/ui.md` to add `InspectionOverlay` for displaying descriptions and container contents.
*   **Modify:** `contracts/00_CORE.md` to ensure `InteractionManager` supports `eventMode="static"` and recursive hit testing for sub-props.

## 4. REQUIRED CONTEXT (V3.1 Manifest)
*   `docs/contracts/00_CORE.md`
*   `docs/contracts/inventory.md`
*   `docs/contracts/world.md`
*   `docs/contracts/combat.md`
*   `docs/contracts/ui.md`
*   `docs/system_style.md`