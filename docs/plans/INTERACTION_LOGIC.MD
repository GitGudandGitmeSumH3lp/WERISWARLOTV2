# Execution Plan: InteractionManager

**Feature:** Click-to-Interact (Mobile-First Input)  
**Target Module:** `src/core/InteractionManager.ts`  
**Phase:** Phase 1 (Foundation)

---

## Step 1: Scaffold File & Types
**Deliverable:** TypeScript interfaces and class skeleton.  
**File:** `src/core/InteractionManager.ts`

**Tasks:**
```typescript
// 1.1 Define public interfaces (copy from master-index.md)
interface InteractionConfig { ... }
interface InteractionTarget { ... }

// 1.2 Create singleton class structure
class InteractionManager {
  private static instance: InteractionManager | null = null;
  private targets = new Map<string, InteractionTarget>();
  private spatialHash: SpatialHash;
  private config: InteractionConfig;
  
  // Public API stubs (throw "Not implemented" initially)
  static initialize(config: InteractionConfig): void { ... }
  static registerTarget(target: InteractionTarget): void { ... }
  static findTarget(worldX: worldY): InteractionTarget | null { ... }
}

// 1.3 Create internal helper class
class SpatialHash {
  private cellSize = 100;
  private grid = new Map<string, InteractionTarget[]>();
  
  insert(target: InteractionTarget): void { ... }
  query(x: number, y: number, radius: number): InteractionTarget[] { ... }
}
```

**Validation:**
- File compiles without errors
- All public methods have correct TypeScript signatures
- No implementation logic yet (stubs only)

**Dependencies:** None (pure TypeScript scaffolding)

---

## Step 2: Core Logic Implementation
**Deliverable:** Spatial hashing, hit detection, and event system.  
**File:** `src/core/InteractionManager.ts` (continued)

**Tasks:**
```typescript
// 2.1 Implement SpatialHash
class SpatialHash {
  insert(target: InteractionTarget): void {
    const cellKey = this.getCellKey(target.hitbox.x, target.hitbox.y);
    if (!this.grid.has(cellKey)) {
      this.grid.set(cellKey, []);
    }
    this.grid.get(cellKey)!.push(target);
  }
  
  query(x: number, y: number, radius: number): InteractionTarget[] {
    const candidates: InteractionTarget[] = [];
    // Check 3x3 grid around query point
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const cellKey = this.getCellKey(x + dx * this.cellSize, y + dy * this.cellSize);
        candidates.push(...(this.grid.get(cellKey) || []));
      }
    }
    return candidates;
  }
  
  private getCellKey(x: number, y: number): string {
    return `${Math.floor(x / this.cellSize)},${Math.floor(y / this.cellSize)}`;
  }
}

// 2.2 Implement target registration
static registerTarget(target: InteractionTarget): void {
  const inst = this.getInstance();
  
  // Validation
  if (!target.id || !target.sprite) {
    throw new Error("Invalid target: missing id or sprite");
  }
  
  // Store and index
  inst.targets.set(target.id, target);
  inst.spatialHash.insert(target);
}

// 2.3 Implement hit detection
static findTarget(worldX: number, worldY: number): InteractionTarget | null {
  const inst = this.getInstance();
  const candidates = inst.spatialHash.query(worldX, worldY, 50);
  
  // Distance sort
  candidates.sort((a, b) => {
    const distA = Math.hypot(a.hitbox.x - worldX, a.hitbox.y - worldY);
    const distB = Math.hypot(b.hitbox.x - worldX, b.hitbox.y - worldY);
    return distA - distB;
  });
  
  // Return closest within hitbox radius
  for (const target of candidates) {
    const dist = Math.hypot(target.hitbox.x - worldX, target.hitbox.y - worldY);
    if (dist <= target.hitbox.radius) {
      return target;
    }
  }
  
  return null;
}

// 2.4 Implement event system
private interactCallbacks = new Set<(target: InteractionTarget) => void>();

static onInteract(callback: (target: InteractionTarget) => void): () => void {
  const inst = this.getInstance();
  inst.interactCallbacks.add(callback);
  return () => inst.interactCallbacks.delete(callback);
}

private emitInteract(target: InteractionTarget): void {
  this.interactCallbacks.forEach(cb => cb(target));
}
```

**Validation:**
- Unit test: Register 10 targets → `findTarget()` returns correct one
- Unit test: Tap empty space → returns `null`
- Unit test: Subscribe → tap → callback fires with correct target

**Dependencies:** None (self-contained logic)

---

## Step 3: PixiJS Event Integration
**Deliverable:** Canvas event listeners + coordinate conversion.  
**File:** `src/core/InteractionManager.ts` (continued)  
**Reference Existing:** `src/core/CameraController.ts` (for `screenToWorld()`)

**Tasks:**
```typescript
// 3.1 Setup canvas listeners in initialize()
static initialize(config: InteractionConfig): void {
  const inst = this.getInstance();
  inst.config = config;
  
  const canvas = CameraController.app.view as HTMLCanvasElement;
  
  // Unified pointer event (handles touch + mouse)
  canvas.addEventListener("pointerdown", (e: PointerEvent) => {
    e.preventDefault(); // Prevent 300ms tap delay
    this.handlePointerDown(e.clientX, e.clientY);
  });
  
  // Disable touch scrolling/panning
  canvas.style.touchAction = "none";
}

// 3.2 Implement pointer handler
private static handlePointerDown(screenX: number, screenY: number): void {
  const inst = this.getInstance();
  
  // Convert screen → world coordinates
  const worldPos = CameraController.screenToWorld(screenX, screenY);
  
  // Find target
  const target = this.findTarget(worldPos.x, worldPos.y);
  
  if (target) {
    // Check debounce
    if (inst.isDebounced(target.id)) {
      return;
    }
    
    // Apply visual feedback
    inst.applyHighlight(target.sprite);
    
    // Emit event
    inst.emitInteract(target);
    inst.updateDebounce(target.id);
  }
}

// 3.3 Implement debounce tracking
private lastInteraction = new Map<string, number>();

private isDebounced(targetId: string): boolean {
  const now = performance.now();
  const lastTime = this.lastInteraction.get(targetId) || 0;
  return (now - lastTime) < this.config.tapDebounceMs;
}

private updateDebounce(targetId: string): void {
  this.lastInteraction.set(targetId, performance.now());
}
```

**Validation:**
- Test: Tap canvas → `CameraController.screenToWorld()` called with correct coords
- Test: Tap NPC → `onInteract` callback fires
- Test: Rapid double-tap → only 1 event emitted (debounce works)

**Dependencies:** `CameraController.screenToWorld()` (already implemented)

---

## Step 4: Visual Feedback & Polish
**Deliverable:** Glow filter application and cleanup utilities.  
**File:** `src/core/InteractionManager.ts` (final)

**Tasks:**
```typescript
// 4.1 Implement highlight effect
private applyHighlight(sprite: PIXI.Sprite): void {
  if (!this.config.enableVisualFeedback) return;
  
  const glow = new PIXI.GlowFilter({
    color: this.config.highlightColor,
    distance: 10,
    outerStrength: 2,
    quality: 0.5 // Mobile-optimized
  });
  
  sprite.filters = [glow];
  
  // Auto-remove after 200ms
  setTimeout(() => {
    sprite.filters = [];
  }, 200);
}

// 4.2 Implement cleanup methods
static unregisterTarget(id: string): void {
  const inst = this.getInstance();
  const target = inst.targets.get(id);
  
  if (target) {
    inst.targets.delete(id);
    // Remove from spatial hash
    inst.spatialHash.remove(target);
  }
}

static clearTargets(): void {
  const inst = this.getInstance();
  inst.targets.clear();
  inst.spatialHash.clear();
  inst.lastInteraction.clear();
}

// 4.3 Add getTarget() for debugging
static getTarget(id: string): InteractionTarget | null {
  return this.getInstance().targets.get(id) || null;
}
```

**Validation:**
- Test: Tap NPC → yellow glow appears for 200ms
- Test: Unregister target → no longer clickable
- Test: Clear all targets → empty map confirmed

**Dependencies:** PixiJS `GlowFilter` (built-in)

---

## Integration Test Plan

### Test Component: `InteractionTest.tsx`
**Location:** `src/components/InteractionTest.tsx`  
**Purpose:** Verify end-to-end flow with dummy NPCs.

```typescript
export default function InteractionTest() {
  const [clickedTarget, setClickedTarget] = useState<string | null>(null);
  
  useEffect(() => {
    // Initialize systems
    const app = CameraController.initialize({ ... });
    InteractionManager.initialize({
      minHitboxRadius: 22,
      highlightColor: 0xFFFF00,
      tapDebounceMs: 150,
      enableVisualFeedback: true
    });
    
    // Spawn 10 dummy NPCs
    for (let i = 0; i < 10; i++) {
      const sprite = AssetRegistry.createSprite("civilian");
      sprite.x = Math.random() * 1000 + 100;
      sprite.y = Math.random() * 600 + 100;
      CameraController.worldContainer.addChild(sprite);
      
      InteractionManager.registerTarget({
        id: `test_npc_${i}`,
        type: "npc",
        sprite,
        hitbox: { x: sprite.x, y: sprite.y, radius: 22 },
        metadata: { name: `NPC ${i}` }
      });
    }
    
    // Subscribe to interactions
    const unsub = InteractionManager.onInteract((target) => {
      setClickedTarget(target.id);
      console.log("Clicked:", target);
    });
    
    return () => {
      unsub();
      InteractionManager.clearTargets();
    };
  }, []);
  
  return (
    <div>
      <div id="pixi-container" />
      {clickedTarget && (
        <div style={{ position: "absolute", top: 10, left: 10 }}>
          Last clicked: {clickedTarget}
        </div>
      )}
    </div>
  );
}
```

**Test Cases:**
1. ✅ Tap any NPC → ID appears in top-left corner
2. ✅ Tap between NPCs → no interaction fired
3. ✅ Tap same NPC 5x rapidly → ID updates only once (debounce)
4. ✅ Tap NPC → yellow glow visible for 200ms

---

## Acceptance Criteria

- [ ] All 4 steps implemented and passing validation tests
- [ ] `InteractionTest.tsx` renders 10 clickable NPCs
- [ ] Mobile test on iPhone 13: all taps register correctly
- [ ] Performance test: 60 targets, 10 rapid taps → no frame drops
- [ ] Code review: Matches public API in `master-index.md`

---

## Dependencies Summary
- **External:** PixiJS v8 (GlowFilter), CameraController (coordinate conversion)
- **Internal:** AssetRegistry (for test sprites)
- **Future:** NPC Spawner (will call `registerTarget()`), Dialogue System (will subscribe to `onInteract()`)

---

## Estimated Effort
- **Step 1:** 30 minutes (scaffolding)
- **Step 2:** 2 hours (core logic + spatial hash)
- **Step 3:** 1 hour (event integration)
- **Step 4:** 1 hour (visual feedback + cleanup)
- **Testing:** 1 hour (InteractionTest component)

**Total:** ~5.5 hours

---

## Rollback Plan
If implementation fails or blocks other features:
1. Keep event system (Steps 1-2) as foundation
2. Replace spatial hash with naive O(n) search temporarily
3. Disable visual feedback to unblock React integration
4. Optimize later in Phase 2