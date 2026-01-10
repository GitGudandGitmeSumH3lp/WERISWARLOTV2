# BUILD PLAN: PROP SYSTEM V2.0.0
**Feature:** Container Props, Red Herrings, Biome Constraints  
**Target Contracts:** inventory, world, combat, ui, 00_CORE  
**Estimated Effort:** 4 implementation steps

---

## STEP 1: IMPLEMENT DATA LAYER
**File:** `src/systems/inventory/PropPool.ts`  
**Matches Contract:** `contracts/inventory.md` → PropPool, Prop dataclass  

**Tasks:**
- Define `Prop` type with all fields (id, type, appearance, description, evidenceValue, contents, inspected, addedToEvidence)
- Implement `PropPool.generateForLevel(difficulty, biome)` using distribution rules:
  - Crime: 5 + difficulty
  - Herring: 10 + (difficulty × 2)
  - Ambiance: fill remaining to reach ~50 total
  - Container: fixed 7
- Create `PropPool.getRedHerring(biome)` matching BiomeRules appearance constraints
- Implement `ContainerManager.generateContents()` with 40% Crime / 40% Herring / 20% Ambiance split
- Add `Evidence.add(prop)` and `Evidence.getTotalValue()` methods

**Validation:**
- Unit test: `generateForLevel(3, 'park')` returns correct prop counts
- Unit test: Red herrings have evidenceValue 10-30
- Unit test: Container contents always return 1-3 props

---

## STEP 2: IMPLEMENT WORLD PLACEMENT
**File:** `src/systems/world/PropSpawner.ts`  
**Matches Contract:** `contracts/world.md` → BiomeRules, VignetteManager, PropSpawner  

**Tasks:**
- Define `BIOME_CONFIGS` object with allowedAppearances and containerTypes per biome
- Implement `BiomeRules.validateProp()` checking appearance against biome constraints
- Create `VignetteManager.placeVignette()` using pre-authored Crime prop clusters (stub with 3 vignettes: 'stabbing_01', 'shooting_02', 'poisoning_03')
- Implement `PropSpawner.distributeProps()` using Poisson disk sampling (min 32px radius)
  - Place Crime props ONLY via Vignettes
  - Place Containers at biome-specific landmarks (manually authored positions)
  - Distribute Ambiance/Herring using sampling algorithm
- Add `WorldBuilder.buildLevel()` orchestration calling all placement systems

**Validation:**
- Integration test: `buildLevel(1, 'park', killerData)` spawns no tool-type props
- Integration test: Crime props cluster within 128px of vignette origin
- Visual test: Props maintain 32px minimum spacing

---

## STEP 3: IMPLEMENT INTERACTION & HEAT
**File:** `src/systems/combat/HeatManager.ts` + `src/systems/core/InteractionManager.ts`  
**Matches Contract:** `contracts/combat.md` → HeatManager, KillerBehavior; `contracts/00_CORE.md` → InteractionManager  

**Tasks:**
- Implement `HeatManager.adjustHeat(delta, reason)` with clamping [0, 100] and logging
- Add `HeatManager.getHeatLevel()` returning 'cold' / 'warm' / 'hot' / 'critical'
- Create `HeatManager.triggerHeatEvent('container_search')` → +2 heat
- Implement `KillerBehavior.onContainerSearched()` with 20% vignette spawn chance at heat > 50
- Update `InteractionManager.registerProp()` to:
  - Set `sprite.eventMode = 'static'`
  - Set `sprite.hitArea = Rectangle` from manifest hitbox
  - Set `sprite.cursor = 'pointer'`
  - Attach click handler calling `ui.InspectionUI.show(prop)`
- Add `InteractionManager.disableInputDuringSearch()` → `stage.eventMode = 'none'` for 5 seconds
- Implement `ZSorter.sortByY()` updating `sprite.zIndex = sprite.y` every frame

**Validation:**
- Unit test: `adjustHeat(5, 'test')` logs reason and clamps at 100
- Integration test: Container search adds +2 heat and blocks input
- Visual test: Props render in correct depth order (y-sorting)

---

## STEP 4: IMPLEMENT UI LAYER
**File:** `src/components/InspectionOverlay.tsx` + `src/stores/propStore.ts`  
**Matches Contract:** `contracts/ui.md` → InspectionOverlay, PropStoreSlice  

**Tasks:**
- Create `InspectionOverlay` React component displaying:
  - Prop description (3+ sentences from prop.description)
  - Evidence value bar (color: green > 70, yellow 40-70, red < 40)
  - "Add to Evidence" button (disabled if prop.addedToEvidence)
  - "Search Container" button (only if prop.type === 'container' AND not inspected)
  - Sub-prop list (if container opened, render nested prop cards)
- Implement `propStore` Zustand slice with:
  - `inspectedProp: Prop | null`
  - `searchInProgress: boolean`
  - `setInspectedProp(prop)` action
  - `startSearch(prop)` action calling HeatManager and TimerManager
  - `completeSearch(subProps)` action updating UI
- Add `SearchProgressBar` component with 5-second countdown animation
- Implement `EvidencePanel.addProp()` animation (slide in from right)
- Create `UIBridge.registerPropClick()` connecting Pixi events to React state via `useStore.subscribe()`

**Validation:**
- UI test: Click prop → overlay shows description
- UI test: "Add to Evidence" → prop appears in EvidencePanel
- UI test: "Search Container" → 5-second bar, then sub-props revealed
- Integration test: Overlay blocks Pixi input (click-through prevented)

---

## DEPENDENCIES
- STEP 1 → STEP 2 (PropPool must exist before placement)
- STEP 2 → STEP 3 (Props must spawn before interaction)
- STEP 3 → STEP 4 (Heat system must work before UI triggers it)

## ROLLBACK STRATEGY
If any step fails validation:
1. Revert file changes for that step
2. Add error logging at failure point
3. Create minimal reproduction case
4. Request missing context or clarify contract ambiguity

## SUCCESS CRITERIA (ALL MUST PASS)
- [ ] Player can inspect any prop and see 3+ sentence description
- [ ] Container props reveal 1-3 sub-props after 5-second search
- [ ] Heat increases by +2 when searching containers
- [ ] Red herrings appear in ~30% of prop pool with low evidenceValue
- [ ] Props obey biome constraints (no tool props in park)
- [ ] Z-sorting maintains depth ordering (no visual glitches)
- [ ] Evidence panel shows total value sum
- [ ] NO localStorage usage (state in memory only)