# Level Asset Binding - Internal Logic

## System Overview
**Purpose:** Transform level designer intent ("park_grass") into runtime PixiJS sprites without hardcoded paths.

**Architecture Pattern:** Declarative Configuration + Validation Gateway

---

## Data Flow
```
Level JSON (Designer)
    â†"
validateLevelAssets() ← AssetRegistry.cache
    â†" (throw if invalid)
NPC/Prop/Vignette Spawners
    â†"
AssetRegistry.createSprite(name)
    â†"
PixiJS Stage (Rendered)
```

---

## Algorithm 1: Asset Name Validator

**Trigger:** Level load (before any spawning)

**Input:**
- `levelData: LevelAssetBindings` - Raw JSON
- `AssetRegistry.cache` - Map of valid asset names

**Process:**
```pseudocode
FUNCTION validateLevelAssets(levelData, registry):
  errors = []
  
  // Check ground tile
  IF NOT registry.has(levelData.scenery.ground_tile):
    errors.push("Missing asset: " + ground_tile)
  
  // Check background props
  FOR EACH prop IN levelData.scenery.background_props:
    IF NOT registry.has(prop):
      errors.push("Missing asset: " + prop + " at scenery.background_props[" + index + "]")
  
  // Check spawn zones
  FOR EACH zone IN levelData.spawn_zones:
    IF zone.asset_pool:
      IF zone.asset_pool.length == 0:
        errors.push("Empty asset_pool at spawn_zones[" + index + "]")
      FOR EACH asset IN zone.asset_pool:
        IF NOT registry.has(asset):
          errors.push("Missing asset: " + asset)
    
    IF zone.required_asset:
      IF NOT registry.has(zone.required_asset):
        errors.push("Missing asset: " + zone.required_asset)
  
  // Check vignettes
  FOR EACH vignette IN levelData.vignettes:
    FOR EACH prop IN vignette.props:
      IF NOT registry.has(prop.asset):
        errors.push("Missing asset: " + prop.asset)
      IF prop.layer < 0 OR prop.layer > 10:
        errors.push("Invalid layer value: " + prop.layer + " (must be 0-10)")
  
  RETURN { valid: errors.length == 0, errors: errors }
```

**Output:**
- `ValidationResult` with detailed error paths
- Throws exception if validation fails (fail-fast contract)

**Edge Cases:**
- Empty `background_props` array → Valid (no props to spawn)
- Missing optional `asset_pool` → Valid (will use default civilian sprite)
- `layer: 0` → Valid (ground layer)

---

## Algorithm 2: Asset Pool Selector

**Trigger:** NPC spawner creating civilian sprites

**Input:**
- `asset_pool: string[]` - Designer-defined sprite list
- `usedAssets: Set<string>` - Already spawned sprites in visible range
- `avoidRadius: number` - Min distance for duplicate prevention (default: 100px)

**Process:**
```pseudocode
FUNCTION selectFromAssetPool(pool, usedAssets, avoidRadius):
  availableAssets = pool.filter(asset => NOT usedAssets.has(asset))
  
  IF availableAssets.length == 0:
    // All assets used, allow duplicates but log warning
    WARN("Asset pool exhausted, reusing sprites")
    availableAssets = pool
  
  // Weighted random selection (uniform for now)
  selectedIndex = Math.floor(Math.random() * availableAssets.length)
  selectedAsset = availableAssets[selectedIndex]
  
  // Track usage for next spawn
  usedAssets.add(selectedAsset)
  
  RETURN selectedAsset
```

**Output:**
- Single asset name string
- Mutates `usedAssets` set (intentional side effect for tracking)

**Collision Avoidance:**
- Spawner resets `usedAssets` set when moving to new spawn zone
- Prevents "clone army" visual artifact (3+ identical NPCs clustered)

---

## Algorithm 3: Layered Prop Spawner

**Trigger:** Vignette system creating crime scene evidence

**Input:**
- `props: VignetteProp[]` - Array of evidence items
- `baseY: number` - Crime scene center Y coordinate

**Process:**
```pseudocode
FUNCTION spawnVignetteProps(props, baseY):
  // Sort by layer to ensure render order
  sortedProps = props.sort((a, b) => a.layer - b.layer)
  
  FOR EACH prop IN sortedProps:
    sprite = AssetRegistry.createSprite(prop.asset)
    
    // Apply offset from vignette center
    sprite.x = vignetteX + prop.offset.x
    sprite.y = vignetteY + prop.offset.y
    
    // Calculate sub-pixel zIndex
    sprite.zIndex = calculatePropZIndex(sprite.y, prop.layer)
    
    stage.addChild(sprite)
  
  RETURN sprites[]

FUNCTION calculatePropZIndex(baseY, layer):
  // Formula: baseY + (layer * 0.01)
  // Example: Y=500, layer=2 → zIndex=500.02
  RETURN baseY + (layer * 0.01)
```

**Output:**
- Array of positioned PixiJS sprites with correct depth ordering
- zIndex formula ensures evidence renders in designer-specified stack order

**Layer System:**
- `layer: 0` → Ground items (blood puddles)
- `layer: 1-5` → Mid-height items (weapons, documents)
- `layer: 6-10` → Overhead items (hanging evidence, wall splatter)

**Why Sub-Pixel Offsets?**
- PixiJS Y-sorting uses sprite.y for depth
- Multiple props at same Y coordinate need deterministic ordering
- `0.01` offset is invisible but forces correct render order

---

## Integration Points

### With `AssetRegistry` (Phase 1):
- Validation calls `AssetRegistry.has(name)` repeatedly
- Spawners call `AssetRegistry.createSprite(name)`
- No direct file path handling (registry abstracts this)

### With `Level Schema` (Phase 1, Backlog):
- `LevelAssetBindings` extends base schema with asset fields
- Existing `spawn_zones` array gains `asset_pool` and `required_asset`
- Backward compatible: Old levels without asset fields use defaults

### With Spawners (Phase 2, Backlog):
- **NPC Spawner:** Reads `spawn_zones[i].asset_pool`, calls `selectFromAssetPool()`
- **Prop Spawner:** Reads `scenery.background_props`, spawns each via `createSprite()`
- **Vignette Spawner:** Reads `vignettes[i].props`, calls `spawnVignetteProps()`

---

## State Management (Zustand)

**No persistent state required.** This feature is stateless validation logic.

**Ephemeral state** (during level load):
```typescript
// In spawner logic only
const usedAssets = new Set<string>(); // Cleared per spawn zone
```

---

## Error Handling

**Design Philosophy:** Fail-fast on invalid data, graceful degradation on runtime issues.

**Validation Errors (Hard Fail):**
```typescript
// Example error output
{
  valid: false,
  errors: [
    {
      type: "missing_asset",
      message: "Asset 'park_grass_TYPO' not found in registry",
      path: "scenery.ground_tile"
    },
    {
      type: "invalid_layer",
      message: "Layer value 15 exceeds max (10)",
      path: "vignettes[0].props[2].layer"
    }
  ]
}
```

**Runtime Warnings (Soft Fail):**
- Asset pool exhausted → Log warning, allow duplicate sprites
- Missing optional fields → Use system defaults

---

## Performance Considerations

**Validation Cost:**
- O(n) where n = total asset references in level
- Runs once at level load (not per frame)
- Acceptable cost: ~50 asset checks = <1ms

**Selection Cost:**
- O(1) random selection from filtered pool
- Set lookups are O(1) average case
- Negligible per-spawn overhead

**Memory:**
- `usedAssets` set contains max 60 strings (NPC cap)
- ~2KB per level (asset binding data)
- No texture duplication (AssetRegistry handles caching)

---

## Testing Strategy

**Unit Tests:**
1. Validate level with all valid assets → `valid: true`
2. Validate level with missing ground tile → Error at `scenery.ground_tile`
3. Validate level with invalid layer (11) → Error at `vignettes[X].props[Y].layer`
4. Select from pool with 3 assets, 0 used → Returns random asset
5. Select from pool with 2 assets, 2 used → Logs warning, returns any asset
6. Calculate zIndex for Y=500, layer=2 → Returns 500.02

**Integration Tests:**
1. Load level JSON → Validate → Spawn NPCs → Verify correct sprites rendered
2. Load level with 3-layer vignette → Verify props render in correct stack order
3. Spawn 60 NPCs with 5-asset pool → Verify no more than 12 duplicates of same sprite

---

## Future Extensions (Not in Scope)

**Phase 4 Candidates:**
- Weighted asset pool selection (prefer certain sprites)
- Dynamic asset swapping based on killer heat level
- Asset palette variations for time-of-day effects