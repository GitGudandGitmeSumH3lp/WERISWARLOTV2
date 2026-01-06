# Execution Plan: Feature Level Schema

**Target:** Implement `LevelLoader` as defined in `feature_level_schema.md`  
**Prerequisites:** AssetRegistry ✅, CameraController ✅ (both completed in Phase 1)

---

## Step 1: Scaffold Types and Interfaces
**File:** `src/types/LevelSchema.ts` (NEW)

**Actions:**
1. Create new file `src/types/LevelSchema.ts`
2. Define all interfaces from spec:
   - `LevelData`
   - `SpawnZone`
   - `VignetteRule`
   - `ValidationResult`
   - `ZoneType` (type alias)
3. Export all types for use in other modules

**Validation:**
- File compiles without errors
- All types match spec exactly (no additional fields)

**Estimated Time:** 10 minutes

---

## Step 2: Implement Validation Logic
**File:** `src/core/LevelLoader.ts` (NEW)

**Actions:**
1. Create `LevelLoader` class skeleton with static methods
2. Implement 4-stage validation pipeline:
   - `_validateSchema()` - Type checking
   - `_validateBounds()` - Zone boundary checks
   - `_validateAssets()` - AssetRegistry integration
   - `_validateConstraints()` - System limits (60 NPC cap)
3. Create `ValidationError` custom error class
4. Implement `validate()` public method that orchestrates all stages

**Dependencies:**
- Import `AssetRegistry` from `src/core/AssetRegistry.ts`
- Import types from `src/types/LevelSchema.ts`

**Validation:**
- Unit test with invalid JSON → catches all error types
- Unit test with valid JSON → returns typed data
- Unit test with missing assets → throws MISSING_ASSET error

**Estimated Time:** 45 minutes

---

## Step 3: Implement Loader with Asset Integration
**File:** `src/core/LevelLoader.ts` (CONTINUE)

**Actions:**
1. Implement `load()` method:
   - Fetch JSON from `public/levels/` directory
   - Parse JSON
   - Run validation pipeline
   - Store in singleton `_currentLevel`
   - Integrate with `CameraController.setBounds()`
2. Implement `getCurrentLevel()` getter
3. Implement query methods:
   - `getZonesByType(type: ZoneType)` - Filter zones
   - `getVignetteById(id: string)` - Find vignette rule

**Dependencies:**
- Reference existing `CameraController.setBounds()` method

**Validation:**
- Integration test: Load `test_level.json` → CameraController bounds updated
- Integration test: Query methods return correct filtered data

**Estimated Time:** 30 minutes

---

## Step 4: Create Test Fixture and Integration Tests
**Files:** 
- `public/levels/test_level.json` (NEW)
- `src/components/LevelLoaderTest.tsx` (NEW)

**Actions:**
1. Create `public/levels/` directory
2. Create `test_level.json` matching example from spec:
```json
   {
     "meta": { "id": "lvl_subway_01", "name": "Subway Panic", "version": "1.0" },
     "world": { "width": 2048, "height": 1024, "background_asset_id": "bg_subway_tile_01" },
     "population": { "civilian_count": 45, "killer_count": 1 },
     "zones": [ /* ... */ ],
     "vignettes": [ /* ... */ ]
   }
```
3. Create React test component:
   - Button: "Load Test Level"
   - Display: Level meta info (id, name, NPC count)
   - Display: Zone count by type
   - Display: Validation errors (if any)

**Dependencies:**
- Uses test assets from `test_manifest.json` (already exists from Asset Pipeline feature)

**Validation:**
- Test fixture loads without errors
- UI displays correct level data
- Validation catches constraint violations (test with `civilian_count: 70`)

**Estimated Time:** 25 minutes

---

## Definition of Done Checklist

- [ ] `src/types/LevelSchema.ts` created with all interfaces
- [ ] `src/core/LevelLoader.ts` implements full validation pipeline
- [ ] `public/levels/test_level.json` valid fixture created
- [ ] Unit tests pass for all validation stages
- [ ] Integration test: Load level → Camera bounds updated
- [ ] Integration test: Query methods return correct data
- [ ] UI component can load and display test level
- [ ] Validation correctly catches:
  - [ ] Civilian count > 60
  - [ ] Zone bounds exceeding world size
  - [ ] Missing background asset
  - [ ] Invalid capacity_weight (<0 or >1)

---

## Implementation Notes

### Critical Path Dependencies
```
AssetRegistry ✅ (already implemented)
    ↓
LevelLoader Types (Step 1)
    ↓
LevelLoader Validation (Step 2)
    ↓
LevelLoader Load/Query (Step 3)
    ↓
Test Fixture + Integration (Step 4)
```

### Reference Points
- **AssetRegistry.has()**: Located in `src/core/AssetRegistry.ts` (existing)
- **CameraController.setBounds()**: Located in `src/core/CameraController.ts` (existing)
- **Test Manifest**: `public/test_manifest.json` contains `bg_subway_tile_01` asset

### Error Handling Pattern
Follow existing pattern from AssetRegistry:
```typescript
// Synchronous errors for invalid state
if (!isValid) {
  throw new ValidationError(errors);
}

// Async errors for network issues
try {
  const response = await fetch(levelPath);
  if (!response.ok) throw new Error('Network error');
} catch (error) {
  throw new NetworkError(`Failed to load level: ${levelPath}`);
}
```

### Testing Strategy
1. **Unit Tests**: Each validation stage independently
2. **Integration Tests**: Full load pipeline with real fixtures
3. **UI Tests**: Manual verification via test component

---

**Total Estimated Time:** ~2 hours  
**Complexity:** Low-Medium (mostly validation logic, no complex algorithms)  
**Risk Areas:** Asset validation requires AssetRegistry to be loaded first