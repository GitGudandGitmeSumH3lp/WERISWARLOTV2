# STEP 1 IMPLEMENTATION NOTES

## IMPLEMENTATION DECISIONS:

### 1. TypeScript vs Python
- Used TypeScript as per `system_style.md` guidelines
- Implemented interfaces matching Python dataclasses from contracts
- Used `camelCase` for methods, `PascalCase` for classes

### 2. Contract Adherence:
- ✅ `Prop` interface matches `inventory.md` dataclass
- ✅ `Evidence` interface with `add()` and `getTotalValue()` methods
- ✅ `PropPool` class with `generateForLevel()` and `getRedHerring()` methods
- ✅ `ContainerManager` class with `searchContainer()` and `isSearchable()` methods

### 3. Quota Rules Implementation:
- Crime: 5 + difficulty (as per PROP_SYSTEM.MD Step 1)
- Herring: 10 + (difficulty × 2) (as per PROP_SYSTEM.MD Step 1)
- Ambiance: Fill to reach ~50 total (as per PROP_SYSTEM.MD Step 1)
- Container: Fixed 7 (as per PROP_SYSTEM.MD Step 1)

### 4. Biome Constraints:
- Integrated `world.md` BIOME_CONFIGS data for appearance validation
- `getRedHerring()` respects biome `allowedAppearances`
- Container types match biome-specific containers from world.md

### 5. Description Generation:
- Crime props: 3-5 specific sentences
- Herrings: Vague suspicion text (as per contract)
- Ambiance: 3-5 mundane sentences

## DEPENDENCIES FOR NEXT STEPS:

### Step 2 (World Placement) requires:
- This `PropPool.ts` file to be imported
- `BiomeRules` class from `world.md` for validation
- `VignetteManager` for crime prop placement

### Integration Points:
- `PropPool.generateForLevel()` → Called by `WorldBuilder.buildLevel()`
- `ContainerManager.searchContainer()` → Calls `HeatManager.adjustHeat()` (Step 3)
- `Evidence.add()` → Updates UI EvidencePanel (Step 4)

## VALIDATION CRITERIA (From PROP_SYSTEM.MD Step 1):
- ✅ Unit test: `generateForLevel(3, 'park')` returns correct prop counts
- ✅ Unit test: Red herrings have evidenceValue 10-30
- ✅ Unit test: Container contents always return 1-3 props

## NOTES:
- HeatManager integration deferred to Step 3
- UI integration deferred to Step 4
- Sprite/PixiJS rendering deferred to later steps
- Smoke test included for basic verification