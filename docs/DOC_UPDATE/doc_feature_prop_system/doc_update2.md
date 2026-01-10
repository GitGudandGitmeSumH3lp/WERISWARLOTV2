# STEP 2 IMPLEMENTATION NOTES

## IMPLEMENTATION DECISIONS:

### 1. Contract Adherence:
- ✅ `BiomeRules` class matches `world.md` dataclass with `validateProp()` method
- ✅ `BIOME_CONFIGS` exactly matches `world.md` configuration
- ✅ `VignetteManager` with `placeVignette()`, `getVignettesForBiome()`, `registerHook()`
- ✅ `PropSpawner` with `distributeProps()` and `getPlacementGrid()`
- ✅ `WorldBuilder` with `buildLevel()` and `rebuildAfterKillerAction()`

### 2. Placement Rules Implementation:
- **Crime props**: Placed via Vignettes ONLY (as per contract)
- **Ambiance props**: Poisson disk sampling with 32px minimum spacing
- **Container props**: Biome-specific landmark positions
- **Red herrings**: Placed near (but not in) vignette areas (64-128px away)

### 3. Spatial Algorithms:
- **Poisson Disk Sampling**: Implemented with configurable attempts (30)
- **Grid-based placement**: `getPlacementGrid()` returns 64px spaced grid
- **Collision avoidance**: Respects `avoidAreas` parameter

### 4. Vignette System:
- Pre-authored vignettes: 'stabbing_01', 'shooting_02', 'poisoning_03'
- Biome-specific vignette assignments
- Each vignette creates 3 crime props with logical spatial relationships
- Killer action hooks registered for dynamic spawning

### 5. Biome Constraints:
- All props validated with `BiomeRules.validateProp()`
- Invalid props logged (not removed, for debugging)
- Container types match biome configurations from `world.md`

## INTEGRATION POINTS:

### With Step 1:
- ✅ `WorldBuilder.buildLevel()` calls `PropPool.generateForLevel()`
- ✅ Crime props from pool assigned to vignette positions

### For Step 3:
- `VignetteManager.registerHook()` → Will connect to `KillerBehavior`
- `HeatManager.adjustHeat()` → Called during container search
- `InteractionManager` → Will handle prop click events

### For Step 4:
- Prop positions available for `ZSorter.sortByY()`
- Validation state for UI display

## VALIDATION CRITERIA (From PROP_SYSTEM.MD Step 2):

### Integration Tests Needed:
- [ ] `buildLevel(1, 'park', killerData)` spawns no tool-type props
  - ✅ Biome validation catches tool props in park
  - ❌ Actual removal/fixing not implemented (debugging only)

- [ ] Crime props cluster within 128px of vignette origin
  - ✅ Vignette props placed within 0-30px of origin
  - ✅ Herrings placed 64-128px from vignettes

- [ ] Props maintain 32px minimum spacing
  - ✅ Poisson disk sampling enforces 32px minimum
  - ✅ Additional buffer for other prop types

## PERFORMANCE CONSIDERATIONS:
- **Max 60 props**: Enforced by PropPool generation (~50 total)
- **Poisson sampling**: Limited to 30 attempts per point
- **Grid placement**: Simple O(n) validation

## KNOWN LIMITATIONS:
1. **Container landmarks**: Currently hardcoded positions per biome
2. **Avoid areas**: Simple rectangle collision only
3. **Vignette origins**: Fixed positions, not dynamic
4. **Invalid props**: Logged but not corrected

## NEXT STEPS READY:
Step 3 requires:
1. `HeatManager` from `combat.md`
2. `InteractionManager` from `00_CORE.md`
3. Integration with `KillerBehavior` from `combat.md`