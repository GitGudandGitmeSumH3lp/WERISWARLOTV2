# Implementation Plan: Level Asset Binding

**Target Files:**
- `src/level/types.ts` (NEW)
- `src/level/validateLevelAssets.ts` (NEW)
- `src/level/assetSelectors.ts` (NEW)
- `specs/feature_level_schema.md` (UPDATE - when implemented)

**Dependencies:**
- âœ… `AssetRegistry` (Phase 1 - Completed)
- âš ï¸ `Feature Level Schema` (Phase 1 - Backlog, will extend when implemented)

---

## Step 1: Scaffold Types and Validation Skeleton

**Files to Create:**
- `src/level/types.ts`
- `src/level/validateLevelAssets.ts`

**Actions:**
1. Define `LevelAssetBindings`, `SpawnZone`, `Vignette`, `VignetteProp` interfaces in `types.ts`
2. Define `ValidationResult` and error types
3. Create empty `validateLevelAssets()` function with TypeScript signature
4. Export all public types from `src/level/index.ts`

**Acceptance:**
- TypeScript compiles without errors
- Can import types: `import { LevelAssetBindings } from '@/level/types'`

**Estimated Time:** 30 minutes

---

## Step 2: Implement Core Validation Logic

**File:** `src/level/validateLevelAssets.ts`

**Actions:**
1. Implement asset existence checks for:
   - `scenery.ground_tile`
   - `scenery.background_props[]`
   - `spawn_zones[].asset_pool[]`
   - `spawn_zones[].required_asset`
   - `vignettes[].props[].asset`
2. Implement layer range validation (0-10)
3. Implement empty pool detection
4. Build detailed error messages with JSON paths

**Reference:**
- Use `AssetRegistry.has(name)` for existence checks
- Follow pseudocode from `level_asset_binding_logic.md`

**Acceptance:**
```typescript
// Test case 1: Valid level
const validLevel = { /* all assets exist */ };
const result = validateLevelAssets(validLevel, AssetRegistry);
assert(result.valid === true);
assert(result.errors.length === 0);

// Test case 2: Missing asset
const invalidLevel = { scenery: { ground_tile: "NONEXISTENT" } };
const result2 = validateLevelAssets(invalidLevel, AssetRegistry);
assert(result2.valid === false);
assert(result2.errors[0].type === "missing_asset");
assert(result2.errors[0].path === "scenery.ground_tile");
```

**Estimated Time:** 1 hour

---

## Step 3: Implement Asset Selection Helpers

**File:** `src/level/assetSelectors.ts`

**Actions:**
1. Implement `selectFromAssetPool()`:
   - Filter available assets (not in `usedAssets` set)
   - Handle exhausted pool case (log warning)
   - Random selection via `Math.random()`
   - Update `usedAssets` set

2. Implement `calculatePropZIndex()`:
   - Formula: `baseY + (layer * 0.01)`
   - Clamp layer to 0-10 range (defensive)

**Acceptance:**
```typescript
// Test case 1: Pool selection
const pool = ["a", "b", "c"];
const used = new Set(["a"]);
const selected = selectFromAssetPool(pool, used);
assert(selected === "b" || selected === "c");
assert(used.has(selected));

// Test case 2: Exhausted pool
const used2 = new Set(["a", "b", "c"]);
const selected2 = selectFromAssetPool(pool, used2); // Logs warning
assert(pool.includes(selected2));

// Test case 3: zIndex calculation
const zIndex = calculatePropZIndex(500, 2);
assert(zIndex === 500.02);
```

**Estimated Time:** 45 minutes

---

## Step 4: Integration Tests + Documentation

**Files:**
- `src/level/__tests__/levelAssetBinding.test.ts` (NEW)
- Update `master-index.md` with examples

**Actions:**
1. Create test level JSON with:
   - 2 scenery props
   - 1 spawn zone with 3-asset pool
   - 1 vignette with 3 layered props

2. Write integration test:
```typescript
   test('Level with asset bindings loads successfully', async () => {
     await AssetRegistry.load('/test_manifest.json');
     const levelData = require('./fixtures/test_level.json');
     
     const result = validateLevelAssets(levelData, AssetRegistry);
     expect(result.valid).toBe(true);
     
     // Simulate spawner usage
     const used = new Set<string>();
     const sprite1 = selectFromAssetPool(
       levelData.spawn_zones[0].asset_pool,
       used
     );
     expect(AssetRegistry.has(sprite1)).toBe(true);
   });
```

3. Add example level JSON to `master-index.md` documentation

**Acceptance:**
- All unit tests pass
- Integration test demonstrates full validation → selection → sprite creation flow
- Documentation includes copy-paste ready example

**Estimated Time:** 1 hour

---

## Total Estimated Time: ~3 hours 15 minutes

---

## Post-Implementation Checklist

- [ ] All TypeScript interfaces exported from `src/level/index.ts`
- [ ] `validateLevelAssets()` throws errors with JSON path context
- [ ] `selectFromAssetPool()` logs warning when pool exhausted (not error)
- [ ] `calculatePropZIndex()` returns values in range [y, y+0.10]
- [ ] Unit tests cover edge cases (empty pools, invalid layers, missing assets)
- [ ] Integration test proves level JSON → validated → spawned → rendered pipeline
- [ ] `master-index.md` updated with public API docs + example level JSON
- [ ] No breaking changes to existing `AssetRegistry` contract

---

## Rollback Plan

**If validation causes issues:**
1. Add `strict: false` option to `validateLevelAssets()` for permissive mode
2. Change hard errors to console warnings temporarily
3. Allow levels to load with fallback assets

**If asset selection breaks NPC spawner:**
1. Make `asset_pool` optional in `SpawnZone` interface
2. Fallback to single default asset if pool undefined
3. Log warning about using defaults

**Critical Path Protection:**
- This feature is additive (extends existing schemas)
- Existing levels without asset bindings still work (backward compatible)
- Can be disabled by removing validation call from level loader