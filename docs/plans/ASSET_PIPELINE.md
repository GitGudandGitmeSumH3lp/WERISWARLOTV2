# Execution Plan: Asset Pipeline Integration

**Feature:** Asset Pipeline  
**Module:** `src/core/AssetRegistry.ts`  
**Estimated Effort:** 2-3 hours  
**Risk Level:** LOW (no existing code modifications, pure addition)

---

## Step 1: Scaffold Module & Types

**Objective:** Create the file structure and TypeScript interfaces.

**Tasks:**
1. Create `src/core/AssetRegistry.ts` (new file)
2. Define TypeScript types:
   ```typescript
   type AssetType = "tile" | "prop" | "npc"
   
   interface AssetMetadata {
     texture: PIXI.Texture
     anchor: { x: number; y: number }
     scale: number
     type: AssetType
   }
   
   interface ManifestFrame {
     x: number
     y: number
     w: number
     h: number
   }
   
   interface ManifestMetadata {
     anchor?: { x: number; y: number }
     type?: AssetType
   }
   
   interface SpriteManifest {
     spritesheet: string
     frames: Record<string, ManifestFrame>
     metadata?: Record<string, ManifestMetadata>
   }
   ```

3. Stub class skeleton:
   ```typescript
   export class AssetRegistry {
     private static cache: Map<string, AssetMetadata> = new Map()
     private static initialized: boolean = false
     
     static async load(manifestPath: string): Promise<void> {
       // TODO: Step 2
     }
     
     static get(name: string): AssetMetadata {
       // TODO: Step 2
     }
     
     static createSprite(name: string): PIXI.Sprite {
       // TODO: Step 2
     }
     
     static has(name: string): boolean {
       // TODO: Step 3
     }
     
     static listAssets(filter?: { type?: AssetType }): string[] {
       // TODO: Step 3
     }
   }
   ```

**Validation:**
- [ ] File compiles without TypeScript errors
- [ ] Imports resolve: `import * as PIXI from 'pixi.js'`

**Time Estimate:** 30 minutes

---

## Step 2: Implement Core Logic (Load + Get + Create)

**Objective:** Build the manifest parser and sprite factory.

**Tasks:**

### 2A: Implement `load()` Method
```typescript
static async load(manifestPath: string): Promise<void> {
  if (this.initialized) {
    console.warn('AssetRegistry already initialized. Skipping reload.')
    return
  }
  
  try {
    // Fetch manifest
    const response = await fetch(manifestPath)
    if (!response.ok) {
      throw new Error(`Failed to load manifest: ${response.statusText}`)
    }
    const manifest: SpriteManifest = await response.json()
    
    // Validate structure
    if (!manifest.spritesheet || !manifest.frames) {
      throw new Error('Invalid manifest: missing "spritesheet" or "frames"')
    }
    
    // Load spritesheet
    const baseTexture = await PIXI.Assets.load(manifest.spritesheet)
    
    // Build cache
    for (const [name, frame] of Object.entries(manifest.frames)) {
      const rectangle = new PIXI.Rectangle(frame.x, frame.y, frame.w, frame.h)
      const texture = new PIXI.Texture(baseTexture, rectangle)
      
      const metadata = manifest.metadata?.[name]
      this.cache.set(name, {
        texture,
        anchor: metadata?.anchor || { x: 0.5, y: 0.5 },
        scale: 4, // From system.md
        type: metadata?.type || 'prop'
      })
    }
    
    this.initialized = true
    console.log(`AssetRegistry loaded ${this.cache.size} assets`)
  } catch (error) {
    console.error('AssetRegistry initialization failed:', error)
    throw error // Propagate to caller
  }
}
```

### 2B: Implement `get()` Method
```typescript
static get(name: string): AssetMetadata {
  if (!this.initialized) {
    throw new Error('AssetRegistry not initialized. Call load() first.')
  }
  
  const metadata = this.cache.get(name)
  if (!metadata) {
    throw new Error(`Asset "${name}" not found in registry`)
  }
  
  return metadata
}
```

### 2C: Implement `createSprite()` Method
```typescript
static createSprite(name: string): PIXI.Sprite {
  const meta = this.get(name) // Throws if not found
  
  const sprite = new PIXI.Sprite(meta.texture)
  sprite.anchor.set(meta.anchor.x, meta.anchor.y)
  sprite.scale.set(meta.scale)
  sprite.zIndex = sprite.y // Y-sorting from system.md
  
  return sprite
}
```

**Validation:**
- [ ] Mock manifest loads without errors
- [ ] `get()` throws on invalid name
- [ ] `createSprite()` returns configured PIXI.Sprite with scale=4

**Time Estimate:** 1 hour

---

## Step 3: Add Utility Methods & Error Handling

**Objective:** Implement helper methods for asset queries.

**Tasks:**

### 3A: Implement `has()` Method
```typescript
static has(name: string): boolean {
  return this.cache.has(name)
}
```

### 3B: Implement `listAssets()` Method
```typescript
static listAssets(filter?: { type?: AssetType }): string[] {
  const names = Array.from(this.cache.keys())
  
  if (!filter?.type) {
    return names
  }
  
  return names.filter(name => {
    const meta = this.cache.get(name)!
    return meta.type === filter.type
  })
}
```

### 3C: Add Debug Logging
```typescript
// Add to end of load() method:
if (process.env.NODE_ENV === 'development') {
  console.table([
    { Type: 'tile', Count: this.listAssets({ type: 'tile' }).length },
    { Type: 'prop', Count: this.listAssets({ type: 'prop' }).length },
    { Type: 'npc', Count: this.listAssets({ type: 'npc' }).length }
  ])
}
```

**Validation:**
- [ ] `has()` returns true for loaded assets, false for unknown
- [ ] `listAssets()` filters by type correctly
- [ ] Console logs asset breakdown in dev mode

**Time Estimate:** 30 minutes

---

## Step 4: Create Test Manifest & Integration Test

**Objective:** Validate with real PixiJS context.

**Tasks:**

### 4A: Create Test Manifest
Create `public/test_manifest.json`:
```json
{
  "spritesheet": "/test_spritesheet.png",
  "frames": {
    "test_prop": { "x": 0, "y": 0, "w": 16, "h": 16 },
    "test_npc": { "x": 16, "y": 0, "w": 16, "h": 24 },
    "test_tile": { "x": 32, "y": 0, "w": 32, "h": 32 }
  },
  "metadata": {
    "test_npc": { "anchor": { "x": 0.5, "y": 1.0 }, "type": "npc" },
    "test_tile": { "type": "tile" }
  }
}
```

### 4B: Create Test Component
Create `src/components/AssetRegistryTest.tsx`:
```typescript
'use client'
import { useEffect, useRef } from 'react'
import * as PIXI from 'pixi.js'
import { AssetRegistry } from '@/core/AssetRegistry'

export default function AssetRegistryTest() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  useEffect(() => {
    const app = new PIXI.Application({
      canvas: canvasRef.current!,
      width: 800,
      height: 600
    })
    
    const test = async () => {
      // Test load
      await AssetRegistry.load('/test_manifest.json')
      
      // Test createSprite
      const sprite1 = AssetRegistry.createSprite('test_prop')
      sprite1.position.set(100, 100)
      
      const sprite2 = AssetRegistry.createSprite('test_npc')
      sprite2.position.set(200, 100)
      
      // Verify scale and zIndex
      console.assert(sprite1.scale.x === 4, 'Scale not applied')
      console.assert(sprite1.zIndex === sprite1.y, 'zIndex not set')
      
      app.stage.addChild(sprite1, sprite2)
      
      // Test error handling
      try {
        AssetRegistry.createSprite('does_not_exist')
      } catch (e) {
        console.log('✓ Error handling works:', e.message)
      }
      
      // Test listing
      console.log('NPCs:', AssetRegistry.listAssets({ type: 'npc' }))
    }
    
    test()
    
    return () => app.destroy()
  }, [])
  
  return <canvas ref={canvasRef} />
}
```

### 4C: Manual Test Checklist
- [ ] Load manifest completes in <500ms (check DevTools Network tab)
- [ ] Sprites render at correct scale (4x pixel size)
- [ ] Console shows asset breakdown table
- [ ] Error throw test prints error message
- [ ] `listAssets()` filters return correct counts

**Validation:**
- [ ] All test assertions pass
- [ ] No console errors
- [ ] Sprites visible on canvas

**Time Estimate:** 1 hour

---

## Risk Mitigation

### Risk 1: PIXI.Assets API Version Mismatch
**Likelihood:** Low  
**Impact:** High (blocking)  
**Mitigation:** Verify PixiJS v8 installed in `package.json` before starting. If v7, upgrade or use `PIXI.Loader` API instead.

### Risk 2: Manifest Format Changes
**Likelihood:** Medium (Python generator might evolve)  
**Impact:** Medium (requires refactor)  
**Mitigation:** Document manifest schema in `docs/sprite_manifest_schema.md`. Generator must validate against schema.

### Risk 3: Memory Leaks (Texture Duplication)
**Likelihood:** Low  
**Impact:** Medium (performance degradation)  
**Mitigation:** Verify in Step 4 that multiple `createSprite()` calls share same texture reference (check `texture.baseTexture.uid`).

---

## Definition of Done (From Spec)

- [x] Step 1: File scaffolding complete
- [x] Step 2: Core methods implemented
- [x] Step 3: Utility methods added
- [x] Step 4: Integration test passes

**Final Checklist:**
- [ ] `AssetRegistry.load()` successfully parses test `sprite_manifest.json`
- [ ] `createSprite("bench")` returns a PIXI.Sprite with `scale=4` and correct anchor
- [ ] Loading a non-existent asset name throws a descriptive error
- [ ] All sprites auto-sort by Y-depth without manual `zIndex` assignment
- [ ] Asset loading completes in <500ms for 50-sprite manifest (performance test)

---

## Next Steps (Post-Implementation)

1. **Update `_STATE.md`:**
   - Mark `Feature Asset Pipeline` as ✅ COMPLETED
   - Unblock Phase 2 features (Prop System, NPC Spawner)

2. **Reference in Camera Setup:**
   - Modify Camera initialization to call `await AssetRegistry.load('/sprite_manifest.json')`

3. **Generate Production Manifest:**
   - Run Python sprite generator to create real `sprite_manifest.json`
   - Replace test manifest with production data

4. **Document Usage Pattern:**
   - Add example to `docs/asset_usage_guide.md` for other developers