# CONTRACT: INVENTORY SYSTEM
**Responsibility:** Prop Data, Evidence Management, Container Logic.

## 1. DATA STRUCTURES

### Prop (V2.0.0)
```python
from typing import Literal, Optional
from dataclasses import dataclass

@dataclass
class Prop:
    """Base prop entity with inspection and evidence tracking."""
    id: str
    type: Literal['crime', 'herring', 'ambiance', 'container']
    appearance: Literal['weapon', 'clothing', 'tool', 'organic', 'container']
    description: str  # Min 3 sentences
    evidenceValue: int  # 0-100 scale
    inspected: bool
    addedToEvidence: bool
    biome: Literal['park', 'docks', 'subway']  # Placement constraint
    x: float
    y: float
    contents: Optional[list['Prop']] = None  # For containers only
    searchDuration: float = 5.0  # Seconds (containers only)
```

### Evidence
```python
@dataclass
class Evidence:
    """Player's collected evidence inventory."""
    props: list[Prop]
    totalValue: int
    
    def add(self, prop: Prop) -> bool:
        """Add prop to evidence if not duplicate."""
        ...
    
    def getTotalValue(self) -> int:
        """Sum all evidenceValue of collected props."""
        ...
```

## 2. CONTAINER INTERFACE

### ContainerManager
```python
class ContainerManager:
    """Handles container searching and sub-prop spawning."""
    
    def searchContainer(self, prop: Prop) -> list[Prop]:
        """
        Opens container, returns 1-3 sub-props.
        Triggers killerHeat increase (+2).
        """
        ...
    
    def generateContents(self, containerType: str, biome: str) -> list[Prop]:
        """
        Procedurally fills container with appropriate sub-props.
        Distribution: 40% Crime, 40% Herring, 20% Ambiance.
        """
        ...
    
    def isSearchable(self, prop: Prop) -> bool:
        """Check if prop.type == 'container' and not inspected."""
        ...
```

## 3. PROP DISTRIBUTION

### PropPool
```python
class PropPool:
    """Manages prop spawning quotas per level."""
    
    crime: list[Prop]
    herring: list[Prop]
    ambiance: list[Prop]
    container: list[Prop]
    
    def generateForLevel(self, difficulty: int, biome: str) -> list[Prop]:
        """
        Returns props matching quota:
        - Crime: 5-10 (scales +1 per difficulty)
        - Herring: 10-20 (scales +2 per difficulty)
        - Ambiance: 30-50 (fills gaps)
        - Container: 5-10 (fixed)
        """
        ...
    
    def getRedHerring(self, biome: str) -> Prop:
        """
        Returns herring matching Crime appearance but low evidenceValue (10-30).
        Description must be vague ("Looks suspicious...").
        """
        ...
```

## 4. INTERACTION PROTOCOL (Pixi v8)

### PropSprite
```python
from typing import Protocol

class PropSprite(Protocol):
    """PixiJS sprite requirements for clickable props."""
    eventMode: Literal["static"]  # Required for v8
    hitArea: tuple[int, int, int, int]  # (x, y, width, height)
    zIndex: float  # Must equal sprite.y
    cursor: Literal["pointer"]
    
    def on_click(self, event: any) -> None:
        """Trigger InspectionSystem.inspect(prop)."""
        ...
```

## 5. CONSTRAINTS
- Props MUST have 3+ sentence descriptions
- Container search = 5 seconds (blocks other actions)
- Red herrings appear in 30% of inspections
- NO random placement (use Vignette hooks)
- Z-index sorting: `sprite.zIndex = sprite.y`