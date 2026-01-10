# Logic Map: InteractionManager

## Overview
The InteractionManager bridges PixiJS canvas events (pointer down) to React UI actions (open dialogue). It solves the "fat finger problem" on mobile by using circular hit-boxes and distance-sorted collision detection.

---

## State Machine

```
[IDLE] ───tap/click──â†' [DETECTING] ───found target──â†' [HIGHLIGHTING] ───debounce──â†' [EXECUTING]
  â†'                                      â†"                                             â†"
  â""â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€ no target â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"˜              â"‚
  â""â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"˜
                                    (emit event, return to IDLE)
```

**States:**
1. **IDLE** - Listening for pointer events on canvas
2. **DETECTING** - Converting screen → world coords, querying spatial hash
3. **HIGHLIGHTING** - Applying glow filter, checking debounce timer
4. **EXECUTING** - Emitting `onInteract` event to subscribers

---

## Data Flow

```
User Tap (clientX, clientY)
        â†"
CameraController.screenToWorld(x, y) 
        â†" (worldX, worldY)
SpatialHash.query(worldX, worldY, maxRadius=50)
        â†" [candidate targets]
distanceSort(candidates)
        â†" closest target
applyGlowFilter(target.sprite)
        â†"
checkDebounce(target.id, 150ms)
        â†"
emit("interact", target) ────â†' React Subscribers
                                      â†"
                              [Dialogue Modal Opens]
                              [Evidence Bag Updates]
                              [Accusation UI Triggers]
```

---

## Core Algorithms

### 1. Spatial Hashing (O(1) Lookup)
**Problem:** With 60 NPCs, naive distance checks = 60 calculations per tap.  
**Solution:** Divide world into 100x100px grid cells. NPCs register to cells.

```
Grid Layout (2560x1440 world):
â"Œâ"€â"€â"€â"€â"€â"€â"€â"¬â"€â"€â"€â"€â"€â"€â"€â"¬â"€â"€â"€â"€â"€â"€â"€â"¬ ... (25 columns)
â"‚ Cell  â"‚ Cell  â"‚ Cell  â"‚
â"‚ 0,0   â"‚ 1,0   â"‚ 2,0   â"‚
â"œâ"€â"€â"€â"€â"€â"€â"€â"¼â"€â"€â"€â"€â"€â"€â"€â"¼â"€â"€â"€â"€â"€â"€â"€â"¤
â"‚ Cell  â"‚ Cell  â"‚ Cell  â"‚
â"‚ 0,1   â"‚ 1,1   â"‚ 2,1   â"‚ (14 rows)
â"" ... 
```

**Pseudocode:**
```python
# On Target Registration
def register_target(target):
    cellX = floor(target.x / CELL_SIZE)
    cellY = floor(target.y / CELL_SIZE)
    grid[cellX][cellY].append(target)

# On Tap
def find_target(worldX, worldY):
    cellX = floor(worldX / CELL_SIZE)
    cellY = floor(worldY / CELL_SIZE)
    
    # Check 3x3 grid around tap (handles edge cases)
    candidates = []
    for dx in [-1, 0, 1]:
        for dy in [-1, 0, 1]:
            candidates += grid[cellX + dx][cellY + dy]
    
    # Distance sort
    candidates.sort(key=lambda t: distance(t, worldX, worldY))
    
    # Return closest within hitbox
    for target in candidates:
        if distance(target, worldX, worldY) <= target.hitbox.radius:
            return target
    
    return null
```

**Complexity:** O(9) cell checks + O(k log k) sort where k ≈ 5 targets per cell.

---

### 2. Debounce Logic (Prevent Double-Taps)
**Problem:** User taps killer twice in panic → triggers 2 dialogues.  
**Solution:** Track last interaction time per target ID.

```typescript
const lastInteraction = new Map<string, number>(); // targetId → timestamp

function handleTap(target: InteractionTarget) {
  const now = performance.now();
  const lastTime = lastInteraction.get(target.id) || 0;
  
  if (now - lastTime < DEBOUNCE_MS) {
    return; // Ignore rapid tap
  }
  
  lastInteraction.set(target.id, now);
  emitInteractEvent(target);
}
```

**Edge Case:** User taps different NPCs rapidly → both should register (no global debounce).

---

### 3. Visual Feedback (Glow Effect)
**Implementation:** PixiJS `GlowFilter` applied on tap, removed after 200ms.

```typescript
function applyHighlight(sprite: PIXI.Sprite) {
  const glow = new PIXI.GlowFilter({
    color: 0xFFFF00,      // Yellow glow
    distance: 10,         // Blur radius
    outerStrength: 2,     // Intensity
    quality: 0.5          // Mobile-optimized
  });
  
  sprite.filters = [glow];
  
  setTimeout(() => {
    sprite.filters = [];  // Remove after 200ms
  }, 200);
}
```

**Performance:** Filters are GPU-accelerated; 60fps with 5 simultaneous highlights tested.

---

## Event System Architecture

### Publisher-Subscriber Pattern
```typescript
// Internal event emitter (private)
const interactCallbacks = new Set<(target: InteractionTarget) => void>();
const highlightCallbacks = new Set<(target: InteractionTarget | null) => void>();

// Public subscription API
static onInteract(callback: Function): UnsubscribeFn {
  interactCallbacks.add(callback);
  return () => interactCallbacks.delete(callback); // Auto-cleanup
}

// Emit on tap
function handlePointerDown(worldX: number, worldY: number) {
  const target = findTarget(worldX, worldY);
  
  if (target) {
    // Notify all subscribers
    interactCallbacks.forEach(cb => cb(target));
    highlightCallbacks.forEach(cb => cb(target));
  }
}
```

**React Integration:**
```typescript
// In DialogueModal.tsx
useEffect(() => {
  const unsub = InteractionManager.onInteract((target) => {
    if (target.type === "npc") {
      setActiveNPC(target.id);
      setModalOpen(true);
    }
  });
  return unsub; // Cleanup on unmount
}, []);
```

---

## Mobile Optimization

### Touch Event Handling
**Issue:** Mobile Safari fires both `touchstart` AND `click` (300ms delay).  
**Solution:** Use `pointerdown` (unified API) + `preventDefault()`.

```typescript
canvas.addEventListener("pointerdown", (e) => {
  e.preventDefault(); // Block mouse emulation
  const { clientX, clientY } = e;
  handlePointerDown(clientX, clientY);
});
```

### Hit-box Sizing
- **iOS Guideline:** 44x44px minimum touch target
- **Implementation:** Default `hitbox.radius = 22px` (44px diameter)
- **Override:** NPCs in crowds can use `radius: 30px` for easier tapping

---

## Error Handling

### Invalid Target Registration
```typescript
static registerTarget(target: InteractionTarget) {
  // Validation
  if (!target.id) throw new Error("Target must have id");
  if (!target.sprite) throw new Error("Target must have sprite");
  if (target.hitbox.radius < 10) {
    console.warn(`Hitbox too small: ${target.id}. Minimum 10px recommended.`);
  }
  
  // Duplicate ID check
  if (targetRegistry.has(target.id)) {
    console.error(`Duplicate target ID: ${target.id}. Overwriting.`);
  }
  
  targetRegistry.set(target.id, target);
  spatialHash.insert(target);
}
```

### Camera Not Initialized
```typescript
static initialize(config: InteractionConfig) {
  if (!CameraController.app) {
    throw new Error("CameraController must be initialized before InteractionManager");
  }
  
  setupEventListeners();
}
```

---

## Testing Considerations

### Unit Tests
1. **Spatial Hash:** Register 100 targets, query center → should return only nearby targets
2. **Debounce:** Tap same NPC 10x in 50ms → only 1 event emitted
3. **Distance Sort:** 5 overlapping NPCs → closest selected
4. **Coordinate Conversion:** Tap at (640, 360) → correct world position calculated

### Integration Tests
1. **React Bridge:** Tap NPC → Zustand store updates → Modal opens
2. **Performance:** 60 NPCs + 40 props = 100 targets → query time < 5ms
3. **Mobile:** Test on iPhone SE (2022) → all taps register, no delays

---

## Future Enhancements (Phase 2+)
- **Multi-touch:** Two-finger zoom gesture (requires CameraController update)
- **Hover Preview:** Desktop-only tooltip on mouse hover
- **Haptic Feedback:** `navigator.vibrate(50)` on successful tap (mobile)
- **Gesture Recognition:** Swipe-to-pan for larger levels