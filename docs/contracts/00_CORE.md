# CONTRACT: CORE SYSTEMS (Updated for Prop System V2.0)
**Responsibility:** Asset Pipeline, Rendering Foundation, Input Handling.

## 1. PIPELINE TOOLS (Python)

### AssetGenerator
**Location:** `scripts/generate_assets.py`
**Purpose:** Procedural spritesheet generation.
```python
# asset_config.json Schema
class SceneryConfig:
    type: Literal["tile"]
    size: Tuple[int, int]
    palette: List[str]

class PropConfig:
    type: Literal["furniture", "clutter", "evidence", "container"]  # Added types
    anchor: Tuple[float, float]
    hitbox: Tuple[int, int]  # Width, height for hitArea
    appearance: str  # Maps to inventory.Prop.appearance

# Output: sprite_manifest.json
{
  "frames": { 
    "prop_knife_01": { "frame": {...}, "hitbox": [24, 8] },
    "container_trash_can": { "frame": {...}, "hitbox": [32, 48] }
  },
  "meta": { "scale": "1" } // Runtime applies scale=4
}
```

### PropDescriptionGenerator
**Location:** `scripts/generate_prop_descriptions.py`
```python
def generateDescription(
    propType: str, 
    appearance: str, 
    biome: str,
    isHerring: bool
) -> str:
    """
    Returns 3-5 sentence description.
    Rules:
    - Crime props: Specific details ("Blade shows rust near the hilt...")
    - Herrings: Vague suspicion ("Something about this feels off...")
    - Ambiance: Mundane ("A typical city bench, weathered by rain.")
    """
    ...
```

## 2. RENDERING FOUNDATION (PixiJS v8)

### InteractionManager (Updated)
```python
class InteractionManager:
    """Handles mouse/touch input for prop interactions."""
    
    def registerProp(self, sprite: 'PixiSprite', prop: 'Prop') -> None:
        """
        Sets up click handler:
        - sprite.eventMode = 'static' (required for v8)
        - sprite.hitArea = Rectangle(0, 0, hitbox.width, hitbox.height)
        - sprite.cursor = 'pointer'
        - sprite.on('pointerdown', () => ui.InspectionUI.show(prop))
        """
        ...
    
    def enableRecursiveHitTest(self, containerSprite: 'PixiContainer') -> None:
        """
        Allows sub-props inside containers to receive clicks.
        Sets containerSprite.interactiveChildren = True.
        """
        ...
    
    def disableInputDuringSearch(self) -> None:
        """
        Blocks all Pixi events during container search (5 sec).
        Sets app.stage.eventMode = 'none'.
        """
        ...
```

### ZSorter
```python
class ZSorter:
    """Ensures proper depth layering for props."""
    
    def sortByY(self, container: 'PixiContainer') -> None:
        """
        Sets container.sortableChildren = True.
        Updates sprite.zIndex = sprite.y for all children.
        Called every frame for dynamic props.
        """
        ...
    
    def forceUpdate(self, sprite: 'PixiSprite') -> None:
        """Manually triggers z-index recalculation after prop movement."""
        ...
```

## 3. ASSET LOADING

### PropAtlas
```python
class PropAtlas:
    """Manages prop texture atlas and metadata."""
    
    def load(self, manifestPath: str) -> dict[str, 'Texture']:
        """
        Loads sprite_manifest.json.
        Returns {propId: Texture} mapping.
        Applies scale=4 at runtime (system_constraints.md).
        """
        ...
    
    def getHitbox(self, propId: str) -> tuple[int, int]:
        """
        Retrieves hitbox from manifest metadata.
        Returns (width, height) for InteractionManager.registerProp().
        """
        ...
    
    def preloadBiomeProps(self, biome: str) -> None:
        """
        Loads textures for biome-specific props.
        Reduces lag during world.PropSpawner.distributeProps().
        """
        ...
```

## 4. COORDINATE SYSTEM

### WorldSpace
```python
class WorldSpace:
    """Converts between internal logic (1280x720) and screen coordinates."""
    
    INTERNAL_WIDTH: int = 1280
    INTERNAL_HEIGHT: int = 720
    
    def toScreen(self, x: float, y: float) -> tuple[float, float]:
        """Scales internal coords to CSS viewport (maintains aspect ratio)."""
        ...
    
    def toWorld(self, screenX: float, screenY: float) -> tuple[float, float]:
        """Inverse transform for mouse clicks."""
        ...
    
    def getViewportBounds(self) -> tuple[int, int, int, int]:
        """Returns (x, y, width, height) of visible area."""
        ...
```

## 5. PERFORMANCE CONSTRAINTS

### PropCulling
```python
class PropCulling:
    """Optimizes rendering for 60 prop limit."""
    
    def updateVisibility(self, camera: 'Camera', props: list['Prop']) -> None:
        """
        Sets sprite.visible = False for off-screen props.
        Checks distance from camera center.
        Runs at 30 TPS (not every frame).
        """
        ...
    
    def prioritizeInteractive(self, props: list['Prop']) -> list['Prop']:
        """
        Keeps Crime and Container props always loaded.
        Culls Ambiance props first when nearing 60-prop limit.
        """
        ...
```

## 6. CONSTRAINTS
- **Resolution:** 1280x720 internal, CSS scaled to viewport
- **Performance:** Max 60 props active, 30 TPS / 60 FPS
- **Z-Sorting:** `sprite.zIndex = sprite.y`, `sortableChildren = true`
- **Hit Testing:** Explicit `hitArea` rectangles from manifest
- **Event Mode:** PixiJS v8 requires `eventMode="static"` for interactions
- **NO localStorage:** State saved manually to `_STATE.md` or JSON