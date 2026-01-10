# CONTRACT: WORLD SYSTEMS
**Responsibility:** Map Management, Biome Rules, Prop Placement.

## 1. BIOME DEFINITIONS

### BiomeRules
```python
from typing import Literal
from dataclasses import dataclass

@dataclass
class BiomeRules:
    """Defines prop appearance constraints per location."""
    name: Literal['park', 'docks', 'subway']
    allowedAppearances: list[str]  # ['organic', 'container'] for park
    ambientProps: list[str]  # ['bench', 'flower', 'litter']
    containerTypes: list[str]  # ['trash_can', 'toolbox']
    
    def validateProp(self, prop: 'Prop') -> bool:
        """Check if prop.appearance allowed in this biome."""
        ...
```

### BIOME_CONFIGS
```python
BIOME_CONFIGS = {
    'park': BiomeRules(
        name='park',
        allowedAppearances=['organic', 'container', 'clothing'],
        ambientProps=['bench', 'flower_pot', 'newspaper', 'soda_can'],
        containerTypes=['trash_can', 'park_bag', 'picnic_basket']
    ),
    'docks': BiomeRules(
        name='docks',
        allowedAppearances=['tool', 'container', 'weapon'],
        ambientProps=['rope', 'oil_drum', 'crate', 'anchor'],
        containerTypes=['toolbox', 'shipping_container', 'duffel_bag']
    ),
    'subway': BiomeRules(
        name='subway',
        allowedAppearances=['clothing', 'container', 'organic'],
        ambientProps=['graffiti', 'newspaper', 'vending_machine', 'ticket'],
        containerTypes=['locker', 'backpack', 'trash_bin']
    )
}
```

## 2. VIGNETTE SYSTEM (Crime Prop Placement)

### VignetteManager
```python
class VignetteManager:
    """Places Crime props using authored scenarios (no randomness)."""
    
    def placeVignette(self, vignetteId: str, origin: tuple[float, float]) -> list['Prop']:
        """
        Spawns pre-designed Crime prop cluster at origin point.
        Example: 'stabbing_01' → knife + blood_pool + torn_fabric
        Returns list of Crime props with logical spatial relationships.
        """
        ...
    
    def getVignettesForBiome(self, biome: str) -> list[str]:
        """Returns available vignette IDs matching biome constraints."""
        ...
    
    def registerHook(self, killerAction: str, vignetteId: str) -> None:
        """Links killer behavior to vignette spawning (auto-placement)."""
        ...
```

## 3. PROP DISTRIBUTION LOGIC

### PropSpawner
```python
class PropSpawner:
    """Handles spatial distribution of props across map."""
    
    def distributeProps(
        self, 
        propPool: list['Prop'], 
        bounds: tuple[int, int, int, int],
        avoidAreas: list[tuple[int, int, int, int]]
    ) -> dict[str, tuple[float, float]]:
        """
        Returns {propId: (x, y)} mapping.
        Rules:
        - Crime props placed via Vignettes ONLY
        - Ambiance props use Poisson disk sampling (min 32px apart)
        - Container props placed at biome-specific landmarks
        - Red herrings placed near (but not in) vignettes
        """
        ...
    
    def getPlacementGrid(self, biome: str) -> list[tuple[float, float]]:
        """Returns valid spawn points (avoids walls, NPCs)."""
        ...
```

## 4. LEVEL GENERATION PIPELINE

### WorldBuilder
```python
class WorldBuilder:
    """Orchestrates full level assembly."""
    
    def buildLevel(
        self, 
        difficulty: int, 
        biome: Literal['park', 'docks', 'subway'],
        killerProfile: 'KillerData'
    ) -> 'LevelState':
        """
        Steps:
        1. Generate PropPool (inventory.PropPool.generateForLevel)
        2. Place Vignettes (VignetteManager.placeVignette)
        3. Distribute remaining props (PropSpawner.distributeProps)
        4. Validate biome constraints (BiomeRules.validateProp)
        """
        ...
    
    def rebuildAfterKillerAction(self, action: 'KillerAction') -> list['Prop']:
        """Spawns new Crime props when killer acts mid-level."""
        ...
```

## 5. CONSTRAINTS
- Max 60 props active (Performance limit)
- Props must respect biome `allowedAppearances`
- NO random Crime prop placement (use Vignettes)
- Z-index: `sprite.zIndex = sprite.y` (depth sorting)
- Coordinate space: 1280x720 internal logic