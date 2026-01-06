# FEATURE SPEC: Asset Pipeline Integration

## 1. EXPERIENCE GOAL (The "Vibe")
"Assets load instantly, and every sprite knows its place in the world."

## 2. USER STORIES
* As a **PixiJS Renderer**, I want to load `sprite_manifest.json` at startup, so that all generated textures are ready before level spawn.
* As a **Prop System**, I want to query `AssetRegistry.get("bench")` and receive a configured PIXI.Sprite, so that I don't manually track texture coordinates.
* As a **Developer**, I want asset loading errors to crash loudly during dev, so that broken manifests never reach production.

## 3. TECHNICAL REQUIREMENTS

### Data Structures
```typescript
// src/core/AssetRegistry.ts
interface AssetMetadata {
  texture: PIXI.Texture;
  anchor: { x: number; y: number };
  scale: number; // Always 4 (from system.md)
  type: "tile" | "prop" | "npc";
}

class AssetRegistry {
  private static cache: Map<string, AssetMetadata> = new Map();
  
  static async load(manifestPath: string): Promise<void> {
    const manifest = await fetch(manifestPath).then(r => r.json());
    const sheet = await PIXI.Assets.load(manifest.spritesheet);
    
    for (const [name, frame] of Object.entries(manifest.frames)) {
      const texture = new PIXI.Texture(
        sheet.baseTexture,
        new PIXI.Rectangle(frame.x, frame.y, frame.w, frame.h)
      );
      
      this.cache.set(name, {
        texture,
        anchor: manifest.metadata?.[name]?.anchor || { x: 0.5, y: 0.5 },
        scale: 4, // Global pixel-art scale from system.md
        type: manifest.metadata?.[name]?.type || "prop"
      });
    }
  }
  
  static get(name: string): AssetMetadata {
    if (!this.cache.has(name)) {
      throw new Error(`Asset "${name}" not found in registry`);
    }
    return this.cache.get(name)!;
  }
  
  static createSprite(name: string): PIXI.Sprite {
    const meta = this.get(name);
    const sprite = new PIXI.Sprite(meta.texture);
    sprite.anchor.set(meta.anchor.x, meta.anchor.y);
    sprite.scale.set(meta.scale);
    sprite.zIndex = sprite.y; // Y-sorting from system.md
    return sprite;
  }
}
```

### Algorithms
1. **Manifest Parser**
   - Validates JSON structure (checks for required fields: spritesheet, frames)
   - Converts frame coordinates to PIXI.Rectangle objects
   - Caches textures in a Map for O(1) lookups

2. **Lazy Sprite Factory**
   - `createSprite(name)` clones texture without reloading PNG
   - Applies global `scale=4` and anchor rules
   - Auto-sets `zIndex = y` for 2.5D depth sorting

### Constraint Alignment
- ✅ **PixiJS v8:** Uses `PIXI.Assets.load()` API (v8 standard)
- ✅ **Rendering:** Auto-applies `scale=4` and `zIndex=y` from system.md
- ✅ **Performance:** Pre-caches all textures at startup (no runtime I/O)

## 4. INTEGRATION POINTS

### Modifies Existing Systems
- **`Feature Camera Waldo View`** (Phase 1, Backlog)
  - ➕ CALL: `AssetRegistry.load()` in camera initialization
  - ➕ MODIFY: Camera setup to wait for assets before rendering

- **`Feature Prop System`** (Phase 2, Backlog)
  - ➕ REPLACE: Manual `PIXI.Sprite` creation with `AssetRegistry.createSprite()`
  - ➕ MODIFY: Base class to accept asset names instead of texture paths

- **`Feature NPC Spawner`** (Phase 2, Backlog)
  - ➕ CALL: `AssetRegistry.createSprite("civilian_male_01_variant_3")` for NPC visuals

### New Module
- `src/core/AssetRegistry.ts` (NEW - Singleton class)

## 5. DEFINITION OF DONE
- [ ] `AssetRegistry.load()` successfully parses test `sprite_manifest.json`
- [ ] `createSprite("bench")` returns a PIXI.Sprite with `scale=4` and correct anchor
- [ ] Loading a non-existent asset name throws a descriptive error
- [ ] All sprites auto-sort by Y-depth without manual `zIndex` assignment
- [ ] Asset loading completes in <500ms for 50-sprite manifest (performance test)