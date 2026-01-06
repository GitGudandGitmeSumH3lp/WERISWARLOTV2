## Module: Prop System
The physical object layer. Handles data management and visual rendering of interactive world items.

### Data Types (The Contract)
```python
class PropType(Enum):
    CRIME = "crime"         # Red outline, high importance
    HERRING = "herring"     # Visual duplicate of CRIME, low importance
    AMBIANCE = "ambiance"   # No interaction, depth-sorting only
    CONTAINER = "container" # Interactable, contains hiddenItems

class PropData:
    """
    Pure data representation of an object. Stored in Zustand.
    """
    id: str
    type: PropType
    x: number
    y: number
    textureKey: str         # Reference to loaded resource
    isInspectable: bool     # True triggers Inspection Modal
    isCollectable: bool     # True allows adding to EvidenceBag
    hasBeenInspected: bool  # Visually dims after inspection
    metadata: Dict[str, Any] # Flexible payload (e.g. { "bloodied": true })

class PropStoreState:
    """
    Zustand Store Slice.
    """
    props: Dict[str, PropData]
    
    def spawn_prop(self, prop_data: PropData) -> void:
        """Adds a prop to the global registry."""
        pass

    def remove_prop(self, prop_id: str) -> void:
        """Permanently removes prop from world (e.g. collected evidence)."""
        pass

    def get_nearby_props(self, x: number, y: number, radius: number) -> List[PropData]:
        """Spatial query helper."""
        pass
		
View Components (PixiJS)

class PropSprite(Pixi.Container):
    """
    The visual representation. Subscribes to PropData changes.
    """
    def __init__(self, data: PropData):
        """
        1. Create Sprite from data.textureKey.
        2. Set anchor to (0.5, 1.0) for correct foot-pivoting.
        3. Enable eventMode='static' if isInspectable.
        """
        pass

    def update_depth(self) -> void:
        """
        Sets zIndex = self.y to handle 2.5D depth sorting.
        Called on spawn and if prop moves (rare).
        """
        pass

    def on_pointer_over(self) -> void:
        """
        Highlights sprite (Shader or Tint 0xDDDDDD).
        """
        pass

    def on_click(self) -> void:
        """
        Dispatches 'OPEN_INSPECTION' event with self.id.
        """
        pass