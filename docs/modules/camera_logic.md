# Camera System Logic Map
**Feature:** Camera Waldo View  
**Module:** `CameraController`  
**Phase:** Phase 1 (Foundation)

---

## System Overview
The Camera System provides a fixed orthographic top-down view that shows the entire level at once. It manages the PixiJS world container, handles coordinate transformations, and prevents accidental camera movement on mobile devices.

---

## State Machine

```
┌─────────────┐
│ UNINITIALIZED│
└──────┬───────┘
       │ initialize(config)
       ↓
┌─────────────┐
│  FIXED VIEW  │ ← Primary state (Phase 1)
└──────┬───────┘
       │ (Phase 2 only)
       ↓
┌─────────────┐
│   ZOOMING   │ ← Optional future state
└─────────────┘
```

**State Transitions:**
- `UNINITIALIZED → FIXED VIEW`: `initialize()` called with level bounds
- `FIXED VIEW → ZOOMING`: (Phase 2) User triggers zoom via dev flag

**State Properties:**
- **UNINITIALIZED**: No PixiJS app exists
- **FIXED VIEW**: Camera locked, world container accessible, coordinate conversion active
- **ZOOMING**: (Phase 2) User can zoom 0.8x - 1.5x

---

## Data Flow

### Initialization Flow
```
Level JSON (bounds: 2560x1440)
    ↓
CameraConfig { bounds, viewport }
    ↓
Calculate Center Offset
    offset.x = (viewport.width - bounds.width) / 2
    offset.y = (viewport.height - bounds.height) / 2
    ↓
Position World Container
    worldContainer.x = offset.x
    worldContainer.y = offset.y
    ↓
Enable Y-Sorting
    worldContainer.sortableChildren = true
    ↓
Disable Touch Panning (CSS)
    canvas.style.touchAction = "none"
    ↓
READY (FIXED VIEW state)
```

### Coordinate Transformation
```
Screen Click (clientX, clientY)
    ↓
Apply Canvas Scale (CSS → Internal)
    scaled.x = clientX * (1280 / canvas.offsetWidth)
    scaled.y = clientY * (720 / canvas.offsetHeight)
    ↓
Subtract Camera Offset
    world.x = scaled.x - worldContainer.x
    world.y = scaled.y - worldContainer.y
    ↓
Apply Zoom (Phase 2 only)
    world.x /= currentZoom
    world.y /= currentZoom
    ↓
World Coordinates (for NPC hit detection)
```

---

## Core Algorithms

### 1. Center Level in Viewport
**Purpose:** Position camera so level is perfectly centered (no dead space).

**Pseudocode:**
```
function calculateCameraPosition(levelBounds, viewport):
    offsetX = (viewport.width - levelBounds.width) / 2
    offsetY = (viewport.height - levelBounds.height) / 2
    
    # If level is larger than viewport, clamp to 0
    offsetX = max(0, offsetX)
    offsetY = max(0, offsetY)
    
    return { x: offsetX, y: offsetY }
```

**Edge Case:** If level is larger than viewport (e.g., 3000x2000), offset = 0 and level will overflow (intentional for zoom feature in Phase 2).

---

### 2. Screen-to-World Conversion
**Purpose:** Convert mouse/touch coordinates to world space for NPC click detection.

**Pseudocode:**
```
function screenToWorld(screenX, screenY):
    # Step 1: Get canvas dimensions
    canvas = app.view
    scaleX = VIEWPORT_WIDTH / canvas.offsetWidth
    scaleY = VIEWPORT_HEIGHT / canvas.offsetHeight
    
    # Step 2: Convert screen to internal resolution
    internalX = screenX * scaleX
    internalY = screenY * scaleY
    
    # Step 3: Subtract camera offset
    worldX = internalX - worldContainer.x
    worldY = internalY - worldContainer.y
    
    # Step 4: Apply zoom (Phase 2)
    if (zoomEnabled):
        worldX /= currentZoom
        worldY /= currentZoom
    
    return { x: worldX, y: worldY }
```

**Example:**
- User taps at screen coordinates `(640, 360)` (center of screen)
- Canvas is `1280x720` internally
- Camera offset is `(-640, -360)` (level is 2560x1440, centered)
- Result: World coordinates `(1280, 720)` (center of level)

---

### 3. Prevent Camera Movement (Mobile)
**Purpose:** Disable browser touch gestures that would pan/zoom canvas.

**Implementation:**
```typescript
// In initialize()
app.view.style.touchAction = "none";  // Disable touch scrolling
app.view.style.userSelect = "none";   // Disable text selection
app.view.style.webkitUserSelect = "none";  // Safari
```

**CSS Equivalent:**
```css
canvas {
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none; /* Disable iOS context menu */
}
```

---

## Performance Considerations

### Y-Sorting (Auto-Sorting)
- `worldContainer.sortableChildren = true` enables automatic depth sorting
- Sprites auto-sort by `zIndex` every frame (60fps)
- Cost: O(n log n) per frame where n = visible sprites
- Safe for 60 NPCs + 200 props (tested in PixiJS benchmarks)

### Coordinate Conversion Overhead
- `screenToWorld()` is called on every click/touch
- 4 arithmetic operations (scale, subtract, divide)
- Negligible cost (<0.1ms on mobile)

### Canvas Scaling
- CSS scales internal 1280x720 to device resolution
- WebGL handles this natively (no CPU cost)
- No manual rescaling needed

---

## Integration Points

### With Asset System
```typescript
// AssetRegistry creates sprites with zIndex=y
const sprite = AssetRegistry.createSprite("civilian");
sprite.x = 500;
sprite.y = 300;
sprite.zIndex = sprite.y;  // Already set by AssetRegistry

// Add to world (auto-sorts by zIndex)
CameraController.worldContainer.addChild(sprite);
```

### With Click Interaction (Phase 1)
```typescript
// In Click Interaction system
canvas.addEventListener("click", (event) => {
    const worldPos = CameraController.screenToWorld(event.clientX, event.clientY);
    
    // Check if NPC was clicked (in Click Interaction logic)
    const clickedNPC = findNPCAtPosition(worldPos.x, worldPos.y);
});
```

### With Level Loader (Phase 2)
```typescript
// When loading new level
const levelData = await fetch("/levels/park_01.json").then(r => r.json());
CameraController.setBounds(levelData.bounds.width, levelData.bounds.height);
```

---

## Testing Strategy

### Unit Tests
1. **Camera Centering:**
   - Input: Level 2560x1440, Viewport 1280x720
   - Expected: Offset (-640, -360)

2. **Coordinate Conversion:**
   - Screen (640, 360) → World (1280, 720) (for centered level)
   - Screen (0, 0) → World (640, 360)

3. **Bounds Clamping:**
   - Level smaller than viewport → Centered
   - Level larger than viewport → Top-left aligned (offset = 0)

### Integration Tests
1. **Sprite Sorting:**
   - Spawn 10 NPCs at random Y positions
   - Verify render order matches zIndex order

2. **Mobile Touch:**
   - Test on iPhone SE
   - Verify no accidental panning/zooming
   - All NPCs tappable (44px+ hit target)

3. **Canvas Scaling:**
   - Test on 3 resolutions (375x667, 1280x720, 1920x1080)
   - Verify world coordinates match expected positions

---

## Phase 2 Extensions (Future)

### Zoom Feature (Optional)
```typescript
// Enable zoom via dev flag
CameraController.initialize({
    // ... existing config
    enableZoom: true
});

// Set zoom level
CameraController.setZoom(1.2);  // 120% (zoom in)
```

**Requirements:**
- Update `screenToWorld()` to divide by `currentZoom`
- Clamp zoom: 0.8 (zoom out) to 1.5 (zoom in)
- Add mouse wheel handler (desktop only)
- Add pinch gesture handler (mobile, optional)

### Panning Feature (Not in Scope)
- Currently disabled to prevent accidental movement
- Could add in Phase 4 for accessibility (large levels)

---

## Known Limitations

1. **Fixed Zoom:** Camera zoom is locked at 1.0 in Phase 1
2. **No Panning:** Camera position is fixed after initialization
3. **Single Level:** `setBounds()` requires manual recalculation if level changes
4. **No Rotation:** Camera is always axis-aligned (top-down view)

---

## Dependencies
- PixiJS v8 (`PIXI.Application`, `PIXI.Container`)
- Browser Canvas API
- CSS `touch-action` property
- Level JSON schema (for bounds)