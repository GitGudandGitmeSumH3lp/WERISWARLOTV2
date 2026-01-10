# Logic Map: Asset Pipeline Integration

**Module:** `src/core/AssetRegistry.ts`  
**Purpose:** Pre-load and cache all game sprites with unified configuration.

---

## State Machine

```
[UNINITIALIZED] 
    ↓ call load(manifestPath)
    ↓
[LOADING]
    ↓ fetch manifest.json
    ↓ load spritesheet PNG
    ↓ parse frame coordinates
    ↓ build texture cache
    ↓
[READY] ← Steady State
    ↓ createSprite(name)
    ↓ get(name)
    ↓
[SPRITE INSTANCES CREATED]
```

**Critical Rule:** All `createSprite()` and `get()` calls MUST occur after `load()` completes. Calling before initialization = immediate error throw.

---

## Data Flow

### 1. Initialization Phase (Startup)
```
INPUT: manifest.json path (e.g., "/public/sprite_manifest.json")
    ↓
FETCH: JSON file from disk
    ↓
VALIDATE: 
    - Check for "spritesheet" field (PNG path)
    - Check for "frames" object (sprite definitions)
    - Check for optional "metadata" object (anchors, types)
    ↓
LOAD SPRITESHEET:
    - Use PIXI.Assets.load(spritesheet_path)
    - Get baseTexture handle
    ↓
BUILD CACHE:
    FOR EACH frame in manifest.frames:
        1. Extract {x, y, w, h} coordinates
        2. Create PIXI.Rectangle(x, y, w, h)
        3. Create PIXI.Texture(baseTexture, rectangle)
        4. Store in Map<string, AssetMetadata>
        5. Apply defaults:
            - anchor: {x: 0.5, y: 0.5} (center-bottom for NPCs)
            - scale: 4 (global pixel-art scale)
            - type: "prop" (default category)
    ↓
OUTPUT: cache Map populated, ready for queries
```

### 2. Runtime Queries (Spawning)
```
INPUT: Asset name (e.g., "bench", "civilian_male_01")
    ↓
LOOKUP: cache.get(name)
    ↓
IF NOT FOUND:
    → THROW ERROR: "Asset 'X' not found in registry"
    ↓
IF FOUND:
    → RETURN: AssetMetadata {texture, anchor, scale, type}
```

### 3. Sprite Factory (Usage Pattern)
```
INPUT: Asset name (e.g., "bloodstain_small")
    ↓
GET METADATA: AssetRegistry.get(name)
    ↓
CREATE SPRITE: new PIXI.Sprite(metadata.texture)
    ↓
CONFIGURE:
    1. sprite.anchor.set(metadata.anchor.x, metadata.anchor.y)
    2. sprite.scale.set(metadata.scale)
    3. sprite.zIndex = sprite.y  ← Auto-applies Y-sorting rule
    ↓
OUTPUT: Configured PIXI.Sprite ready for container.addChild()
```

---

## Algorithms

### Algorithm 1: Manifest Parser
**Purpose:** Convert JSON to internal cache structure.

```pseudocode
FUNCTION parseManifest(jsonData):
    IF NOT jsonData.spritesheet OR NOT jsonData.frames:
        THROW "Invalid manifest: missing required fields"
    
    spritesheetPath = jsonData.spritesheet
    baseTexture = await PIXI.Assets.load(spritesheetPath)
    
    cache = new Map()
    
    FOR EACH [name, frameData] IN jsonData.frames:
        // Create sub-texture from spritesheet
        rectangle = new PIXI.Rectangle(
            frameData.x, 
            frameData.y, 
            frameData.w, 
            frameData.h
        )
        texture = new PIXI.Texture(baseTexture, rectangle)
        
        // Apply metadata or defaults
        anchor = jsonData.metadata?.[name]?.anchor ?? {x: 0.5, y: 0.5}
        type = jsonData.metadata?.[name]?.type ?? "prop"
        
        cache.set(name, {
            texture: texture,
            anchor: anchor,
            scale: 4,  // Hard-coded from system.md
            type: type
        })
    
    RETURN cache
```

**Time Complexity:** O(n) where n = number of sprites in manifest  
**Space Complexity:** O(n) - stores one texture reference per sprite

### Algorithm 2: Sprite Cloning
**Purpose:** Create new sprite instances without reloading textures.

```pseudocode
FUNCTION createSprite(assetName):
    IF NOT cache.has(assetName):
        THROW "Asset '" + assetName + "' not found"
    
    metadata = cache.get(assetName)
    sprite = new PIXI.Sprite(metadata.texture)  // Shares texture reference
    
    // Apply configuration
    sprite.anchor.set(metadata.anchor.x, metadata.anchor.y)
    sprite.scale.set(metadata.scale)
    sprite.zIndex = sprite.y  // Y-sorting rule
    
    RETURN sprite
```

**Time Complexity:** O(1) - direct Map lookup  
**Space Complexity:** O(1) - textures are shared, only sprite transform data is duplicated

---

## Edge Cases & Error Handling

### Case 1: Asset Not Found
```
SCENARIO: Spawner requests "killer_hoodie_variant_99" (doesn't exist)
BEHAVIOR: Throw synchronous error with descriptive message
RATIONALE: Fail-fast prevents rendering bugs in production
```

### Case 2: Manifest Load Failure
```
SCENARIO: sprite_manifest.json is malformed JSON
BEHAVIOR: Promise rejection during load(), crashes app at startup
RATIONALE: Assets are non-negotiable - game cannot run without them
```

### Case 3: Spritesheet 404
```
SCENARIO: manifest.json references missing "sprites.png"
BEHAVIOR: PIXI.Assets.load() rejects, propagates error to caller
RATIONALE: Caller (Camera initialization) handles loading errors
```

### Case 4: Duplicate Asset Names
```
SCENARIO: Two frames in manifest have same name "tree_01"
BEHAVIOR: Last definition wins (Map.set() overwrites)
RATIONALE: Python generator should prevent this; runtime doesn't validate
```

---

## Performance Considerations

### Memory Profile
```
60 sprites × 4KB per texture = 240KB texture memory (negligible)
Cache overhead = 60 entries × ~100 bytes = 6KB
Total footprint: ~250KB (acceptable for mobile)
```

### Loading Time Budget
```
Target: <500ms for 50-sprite manifest (from spec DoD)
Breakdown:
  - Fetch JSON: ~50ms (local file)
  - Load PNG: ~200ms (1024×1024 spritesheet)
  - Parse/Cache: ~50ms (CPU-bound)
  - Buffer: 200ms safety margin
```

### Optimization Strategies
1. **Single Spritesheet:** All sprites in one PNG (1 HTTP request)
2. **Texture Sharing:** Cloning sprites reuses texture memory
3. **Pre-computation:** Anchors/scales baked into manifest (no runtime math)

---

## Integration Contracts

### With Camera System
```
Camera initialization MUST call:
  await AssetRegistry.load('/public/sprite_manifest.json')
  
BEFORE any rendering begins.
```

### With Prop System
```
Prop constructor CHANGES FROM:
  this.sprite = new PIXI.Sprite(PIXI.Texture.from('/sprites/bench.png'))
  
TO:
  this.sprite = AssetRegistry.createSprite('bench')
```

### With NPC Spawner
```
Spawner loops MUST use:
  const npc = AssetRegistry.createSprite(randomCivilianName)
  
NOT direct PIXI.Sprite construction.
```

---

## Testing Strategy

### Unit Tests (Asset Registry)
1. Load valid manifest → verify cache size matches frame count
2. Get existing asset → verify texture/anchor/scale correctness
3. Get non-existent asset → verify error throw
4. Create sprite → verify scale=4 and zIndex=y applied

### Integration Tests (With PixiJS)
1. Load manifest → create 10 sprites → verify unique instances share texture
2. Add sprites to container → verify Y-sorting works without manual zIndex
3. Benchmark load time → verify <500ms for 50-sprite manifest

### Error Tests
1. Load invalid JSON → verify Promise rejection
2. Load manifest with missing spritesheet → verify PIXI.Assets error propagates
3. Call createSprite() before load() → verify synchronous error throw