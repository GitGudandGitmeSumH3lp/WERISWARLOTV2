# Level Loader: Internal Logic Map

##责任 (Responsibility)
Parse JSON level files → Validate against system constraints → Provide typed level data to spawning systems.

---

## State Machine
```
[UNLOADED] 
    ↓ load(path)
[FETCHING] → fetch JSON from public/levels/
    ↓
[PARSING] → JSON.parse() + type coercion
    ↓
[VALIDATING] → Run 4-stage validation pipeline
    ↓
[LOADED] → Store in singleton, return LevelData
    ↓
[READY] → Queries available (getZonesByType, etc.)
```

---

## Validation Pipeline (4 Stages)

### Stage 1: Schema Validation
**Input:** Raw JSON object  
**Output:** Typed `LevelData` or throw error
```pseudocode
function validateSchema(data: unknown): LevelData {
  if (!data.meta || !data.world || !data.population || !data.zones) {
    throw "Missing required top-level keys"
  }
  
  if (typeof data.world.width !== 'number') {
    throw "world.width must be number"
  }
  
  // ... check all required fields exist with correct types
  
  return data as LevelData
}
```

**Errors Thrown:**
- `SCHEMA_INVALID`: Missing required fields or wrong types

---

### Stage 2: Bounds Validation
**Input:** Validated `LevelData`  
**Output:** Same data or validation errors
```pseudocode
function validateBounds(level: LevelData): ValidationResult {
  errors = []
  
  for each zone in level.zones:
    if zone.x + zone.w > level.world.width:
      errors.push({
        code: 'BOUNDS_OVERFLOW',
        message: `Zone extends beyond world boundary`,
        path: `zones[${index}]`
      })
    
    if zone.y + zone.h > level.world.height:
      errors.push({ ... })
  
  return { valid: errors.length === 0, errors }
}
```

**Rules:**
- All zones must fit within `world.width × world.height`
- Negative coordinates allowed (for off-screen spawns)

---

### Stage 3: Asset Validation
**Input:** Validated `LevelData`  
**Output:** Validation errors if assets missing
```pseudocode
function validateAssets(level: LevelData): ValidationResult {
  errors = []
  
  // Check background
  if (!AssetRegistry.has(level.world.background_asset_id)) {
    errors.push({
      code: 'MISSING_ASSET',
      message: `Background asset not found: ${level.world.background_asset_id}`,
      path: 'world.background_asset_id'
    })
  }
  
  // Check density map (optional)
  if (level.population.density_map && !AssetRegistry.has(level.population.density_map)) {
    errors.push({ ... })
  }
  
  return { valid: errors.length === 0, errors }
}
```

**Rules:**
- All `*_asset_id` fields must exist in `AssetRegistry`
- Optional fields only validated if present

---

### Stage 4: Constraint Validation
**Input:** Validated `LevelData`  
**Output:** Validation errors if constraints violated
```pseudocode
function validateConstraints(level: LevelData): ValidationResult {
  errors = []
  
  // Check NPC cap (system.md)
  if (level.population.civilian_count > 60) {
    errors.push({
      code: 'POPULATION_EXCEEDED',
      message: `civilian_count (${level.population.civilian_count}) exceeds system limit (60)`,
      path: 'population.civilian_count'
    })
  }
  
  // Check capacity weights
  for each zone in level.zones:
    if (zone.capacity_weight < 0 || zone.capacity_weight > 1) {
      errors.push({
        code: 'INVALID_WEIGHT',
        message: `capacity_weight must be between 0.0 and 1.0`,
        path: `zones[${index}].capacity_weight`
      })
    }
  
  return { valid: errors.length === 0, errors }
}
```

**Rules:**
- `civilian_count` <= 60 (hard limit from system.md)
- `capacity_weight` in range [0.0, 1.0]
- `killer_count` typically 1 (warning if != 1, not error)

---

## Data Flow Diagram
```
User Code
   ↓
LevelLoader.load("/levels/test.json")
   ↓
fetch() → JSON text
   ↓
JSON.parse() → raw object
   ↓
validateSchema() → typed LevelData
   ↓
validateBounds() → errors[]
   ↓
validateAssets() → errors[] (checks AssetRegistry)
   ↓
validateConstraints() → errors[]
   ↓
[If any errors] → throw ValidationError
[If valid] → Store in _currentLevel singleton
   ↓
Return LevelData
   ↓
CameraController.setBounds(level.world.width, level.world.height)
```

---

## Singleton Pattern (Current Level State)
```typescript
// Internal module state
let _currentLevel: LevelData | null = null;

class LevelLoader {
  static async load(path: string): Promise<LevelData> {
    // ... validation pipeline ...
    _currentLevel = validatedData;
    return _currentLevel;
  }
  
  static getCurrentLevel(): LevelData | null {
    return _currentLevel;
  }
}
```

**Why Singleton?**
- Only 1 level active at a time
- Other systems (spawners) need global access to current level data
- Avoid prop-drilling level data through React components

---

## Integration Points

### With AssetRegistry
```typescript
// During Stage 3 validation
const assetExists = AssetRegistry.has(level.world.background_asset_id);
```

### With CameraController
```typescript
// After successful load
CameraController.setBounds(level.world.width, level.world.height);
```

### With Future Spawners (Phase 2)
```typescript
// NPC Spawner will query:
const walkableZones = LevelLoader.getZonesByType('walkable');

// Vignette Spawner will query:
const crimeSceneRules = LevelLoader.getVignetteById('crime_scene_alley');
```

---

## Error Handling Strategy
```typescript
try {
  const level = await LevelLoader.load('/levels/broken.json');
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Level validation failed:');
    error.errors.forEach(e => {
      console.error(`  [${e.code}] ${e.path}: ${e.message}`);
    });
  } else if (error instanceof NetworkError) {
    console.error('Failed to fetch level file');
  }
}
```

**Error Types:**
1. **NetworkError**: Fetch failed (404, network timeout)
2. **ParseError**: Invalid JSON syntax
3. **ValidationError**: Schema/bounds/asset/constraint violations

All errors are **synchronous** (fail-fast) - never return invalid data.