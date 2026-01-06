# Execution Plan: Camera Waldo View
**Feature ID:** `feature_camera_waldo_view`  
**Module:** `CameraController`  
**Estimated Time:** 2-4 hours

---

## Pre-Build Checklist
- [x] **Asset Pipeline** complete (dependency met)
- [x] `system.md` constraints reviewed
- [x] No naming conflicts in `master-index.md`
- [ ] Level JSON schema defined (can use placeholder bounds for now)

---

## Step 1: Scaffold File & Types
**File:** `src/core/CameraController.ts`  
**Time:** 30 minutes

### Tasks
1. Create TypeScript file with singleton pattern
2. Define `CameraConfig` interface (matches spec)
3. Define private state variables:
   ```typescript
   private static _app: PIXI.Application | null = null;
   private static _worldContainer: PIXI.Container | null = null;
   private static _bounds: { width: number; height: number } = { width: 0, height: 0 };
   private static _zoom: number = 1.0;
   private static _initialized: boolean = false;
   ```
4. Add public getters (stub implementations):
   ```typescript
   static get app(): PIXI.Application
   static get worldContainer(): PIXI.Container
   ```

### Validation
- TypeScript compiles without errors
- No runtime code yet (getters throw "Not initialized" errors)

---

## Step 2: Core Logic (Initialization & Centering)
**Files:** `src/core/CameraController.ts`  
**Time:** 1.5 hours

### Tasks

#### 2.1: Implement `initialize()`
```typescript
static initialize(config: CameraConfig): PIXI.Application {
    if (this._initialized) {
        throw new Error("CameraController already initialized");
    }
    
    // Create PixiJS Application
    this._app = new PIXI.Application();
    await this._app.init({
        width: config.viewport.width,
        height: config.viewport.height,
        backgroundColor: 0x1a1a1a,  // Dark background
        antialias: false,  // Pixel art
        resolution: window.devicePixelRatio || 1,
        autoDensity: true
    });
    
    // Create world container with Y-sorting
    this._worldContainer = new PIXI.Container();
    this._worldContainer.sortableChildren = true;
    this._app.stage.addChild(this._worldContainer);
    
    // Store config
    this._bounds = config.bounds;
    this._zoom = config.zoom.initial;
    
    // Calculate and apply camera centering
    this._centerCamera();
    
    // Disable touch panning
    this._app.view.style.touchAction = "none";
    this._app.view.style.userSelect = "none";
    this._app.view.style.webkitUserSelect = "none";
    
    this._initialized = true;
    return this._app;
}
```

#### 2.2: Implement `_centerCamera()` (Private Helper)
```typescript
private static _centerCamera(): void {
    const offsetX = (1280 - this._bounds.width) / 2;
    const offsetY = (720 - this._bounds.height) / 2;
    
    // Clamp to 0 if level is larger than viewport
    this._worldContainer.x = Math.max(0, offsetX);
    this._worldContainer.y = Math.max(0, offsetY);
}
```

#### 2.3: Implement `setBounds()`
```typescript
static setBounds(width: number, height: number): void {
    if (!this._initialized) {
        throw new Error("CameraController not initialized");
    }
    
    this._bounds = { width, height };
    this._centerCamera();
}
```

### Validation
- Create test React component:
  ```typescript
  useEffect(() => {
      const app = CameraController.initialize({
          type: "fixed-orthographic",
          bounds: { width: 2560, height: 1440 },
          viewport: { width: 1280, height: 720 },
          zoom: { initial: 1.0, min: 0.8, max: 1.5 }
      });
      
      document.getElementById("game-canvas").appendChild(app.view);
  }, []);
  ```
- Verify black canvas renders
- Verify canvas size is 1280x720
- Add test sprite via `AssetRegistry.createSprite()` (from Phase 1)
- Verify sprite appears centered

---

## Step 3: Coordinate Conversion Utilities
**Files:** `src/core/CameraController.ts`  
**Time:** 1 hour

### Tasks

#### 3.1: Implement `screenToWorld()`
```typescript
static screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    if (!this._initialized || !this._app) {
        throw new Error("CameraController not initialized");
    }
    
    const canvas = this._app.view as HTMLCanvasElement;
    
    // Convert screen to internal resolution
    const scaleX = 1280 / canvas.offsetWidth;
    const scaleY = 720 / canvas.offsetHeight;
    
    const internalX = screenX * scaleX;
    const internalY = screenY * scaleY;
    
    // Subtract camera offset
    const worldX = (internalX - this._worldContainer.x) / this._zoom;
    const worldY = (internalY - this._worldContainer.y) / this._zoom;
    
    return { x: worldX, y: worldY };
}
```

#### 3.2: Implement `worldToScreen()` (Inverse)
```typescript
static worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    if (!this._initialized || !this._app) {
        throw new Error("CameraController not initialized");
    }
    
    const canvas = this._app.view as HTMLCanvasElement;
    
    // Apply zoom and camera offset
    const internalX = (worldX * this._zoom) + this._worldContainer.x;
    const internalY = (worldY * this._zoom) + this._worldContainer.y;
    
    // Convert internal to screen resolution
    const scaleX = canvas.offsetWidth / 1280;
    const scaleY = canvas.offsetHeight / 720;
    
    return {
        x: internalX * scaleX,
        y: internalY * scaleY
    };
}
```

### Validation
- Unit test: Known screen → world conversions
  ```typescript
  // Center of screen should map to center of level
  const result = CameraController.screenToWorld(640, 360);
  expect(result.x).toBeCloseTo(1280, 1);  // Center X of 2560px level
  expect(result.y).toBeCloseTo(720, 1);   // Center Y of 1440px level
  ```
- Add click handler to test component:
  ```typescript
  canvas.addEventListener("click", (e) => {
      const worldPos = CameraController.screenToWorld(e.clientX, e.clientY);
      console.log("Clicked world position:", worldPos);
      
      // Visual debug: Place marker sprite at click position
      const marker = AssetRegistry.createSprite("debug_marker");
      marker.x = worldPos.x;
      marker.y = worldPos.y;
      CameraController.worldContainer.addChild(marker);
  });
  ```
- Verify marker appears at exact click location

---

## Step 4: Mobile Testing & Integration
**Files:** Test component, README documentation  
**Time:** 1 hour

### Tasks

#### 4.1: Mobile Touch Testing
1. Deploy to test device (iPhone SE target)
2. Test touch events:
   - Verify no accidental panning/zooming
   - Test multi-touch (should be ignored)
   - Test long press (should not trigger context menu)
3. Measure hit target accuracy:
   - Place 10 test sprites in grid
   - Verify all are tappable (coordinate conversion accurate)

#### 4.2: Create Integration Example
**File:** `src/components/CameraTest.tsx`
```typescript
export function CameraTest() {
    const canvasRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        // Initialize camera
        const app = CameraController.initialize({
            type: "fixed-orthographic",
            bounds: { width: 2560, height: 1440 },
            viewport: { width: 1280, height: 720 },
            zoom: { initial: 1.0, min: 0.8, max: 1.5 }
        });
        
        canvasRef.current?.appendChild(app.view);
        
        // Load test assets
        await AssetRegistry.load("/test_manifest.json");
        
        // Spawn test grid
        for (let x = 0; x < 10; x++) {
            for (let y = 0; y < 10; y++) {
                const sprite = AssetRegistry.createSprite("civilian");
                sprite.x = 200 + (x * 200);
                sprite.y = 200 + (y * 100);
                sprite.zIndex = sprite.y;  // Y-sorting
                CameraController.worldContainer.addChild(sprite);
            }
        }
        
        // Add click handler
        app.view.addEventListener("click", handleClick);
        
        return () => {
            app.view.removeEventListener("click", handleClick);
            app.destroy(true);
        };
    }, []);
    
    const handleClick = (e: MouseEvent) => {
        const worldPos = CameraController.screenToWorld(e.clientX, e.clientY);
        console.log("Click:", worldPos);
    };
    
    return <div ref={canvasRef} id="game-canvas" />;
}
```

#### 4.3: Update Documentation
1. Add usage example to `master-index.md` (already done in Phase 2)
2. Update `_STATE.md`:
   - Mark `Feature Camera Waldo View` as complete âœ…
   - Update Phase 1 progress tracker
3. Document known limitations (see Logic Map)

### Validation Checklist
- [ ] Camera shows entire level without scrolling
- [ ] Touch input does NOT pan camera (test on iPhone SE)
- [ ] All NPCs tappable (44px minimum hit target)
- [ ] Coordinate conversion accurate (±1px tolerance)
- [ ] Y-sorting works (sprites render in correct depth order)
- [ ] Performance: 60fps with 60 sprites + 200 props

---

## Definition of Done

### Phase 1 Requirements (Must Have)
- [x] `CameraController.initialize()` creates PixiJS app with fixed view
- [x] `CameraController.worldContainer` accessible for adding sprites
- [x] `CameraController.screenToWorld()` converts coordinates accurately
- [x] Camera centers level in viewport (no dead space)
- [x] Touch-action: none prevents accidental panning
- [x] Y-sorting enabled (`sortableChildren = true`)
- [x] Test component demonstrates integration
- [x] Passes mobile touch test (iPhone SE)

### Phase 2 Extensions (Optional)
- [ ] `CameraController.setZoom()` toggleable via dev flag
- [ ] Mouse wheel zoom (desktop only)
- [ ] Pinch gesture zoom (mobile, optional)
- [ ] Dynamic bounds calculation from level JSON

---

## Unblocked Features
Once this step is complete, the following Phase 1 features can proceed:
- **Feature Click Interaction** (depends on `screenToWorld()`)
- **Feature Level Schema** (can now render test levels)

And these Phase 2 features become unblocked:
- **Feature NPC Spawner** (can add to `worldContainer`)
- **Feature Prop Spawner** (can add to `worldContainer`)
- **Feature Environment Clutter** (Y-sorting now functional)

---

## Risk Mitigation

### Known Risks
1. **Mobile Scaling:** Canvas scaling may not work on all iOS devices
   - **Mitigation:** Test on 3 devices (SE, 13, 15)
   - **Fallback:** Hard-code resolution for specific devices

2. **Coordinate Accuracy:** Touch events may not match sprite positions
   - **Mitigation:** Add debug mode with visual markers
   - **Fallback:** Increase hit-box tolerance (from 44px to 60px)

3. **Performance:** Y-sorting 200+ sprites may drop below 60fps
   - **Mitigation:** Profile with PixiJS DevTools
   - **Fallback:** Disable auto-sort, manually update `zIndex` only when sprites move

---

## Dependencies
- `AssetRegistry` âœ… (Phase 1 complete)
- Level JSON schema (can use placeholder for now)
- PixiJS v8 (already in `package.json`)

---

## Estimated Complexity
**Difficulty:** Medium  
**Lines of Code:** ~200  
**Testing Time:** 1 hour (mobile critical)  
**Total Time:** 2-4 hours