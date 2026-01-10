# CONTRACT: COMBAT / THREAT SYSTEMS
**Responsibility:** Killer AI, Heat Mechanics, Action Resolution.

## 1. HEAT SYSTEM (Updated for Prop Interaction)

### HeatManager
```python
class HeatManager:
    """Tracks player detection risk and killer aggression."""
    
    currentHeat: float  # 0-100 scale
    heatDecayRate: float  # -0.5 per second (idle)
    
    def adjustHeat(self, delta: float, reason: str) -> None:
        """
        Modify heat value with attribution logging.
        Examples:
        - Container search: +2
        - Loud action: +5
        - Stealth movement: -1
        """
        ...
    
    def getHeatLevel(self) -> Literal['cold', 'warm', 'hot', 'critical']:
        """
        Returns threat tier:
        - cold: 0-25 (killer ignores player)
        - warm: 26-50 (killer investigates)
        - hot: 51-75 (killer stalks)
        - critical: 76-100 (killer attacks)
        """
        ...
    
    def triggerHeatEvent(self, actionType: str) -> None:
        """
        Called by external systems:
        - ContainerManager.searchContainer() → +2 heat
        - Player sprinting → +1 heat per second
        - Flashlight use → +3 heat
        """
        ...
```

## 2. KILLER ACTION HOOKS

### KillerBehavior
```python
class KillerBehavior:
    """Defines killer responses to player actions."""
    
    def onContainerSearched(self, prop: 'Prop', playerPos: tuple[float, float]) -> None:
        """
        Reaction to container interaction:
        - Increase heat (+2)
        - 20% chance to spawn new vignette nearby
        - If heat > 75: path to player location
        """
        ...
    
    def onPropInspected(self, prop: 'Prop') -> None:
        """
        Mild reaction to prop inspection:
        - If prop.type == 'crime': +1 heat
        - If prop.type == 'herring': no heat change
        """
        ...
    
    def executeAction(self) -> 'KillerAction':
        """
        Returns next killer move based on heat level.
        Triggers world.VignetteManager.registerHook() for prop spawning.
        """
        ...
```

## 3. ACTION COSTS

### ActionCostTable
```python
ACTION_COSTS = {
    'inspect_prop': {'duration': 2.0, 'heat': 0},
    'search_container': {'duration': 5.0, 'heat': 2},
    'add_to_evidence': {'duration': 1.0, 'heat': 0},
    'sprint': {'duration': None, 'heat': 1},  # Per second
    'use_flashlight': {'duration': None, 'heat': 3}  # One-time cost
}
```

## 4. TIME PRESSURE MECHANICS

### TimerManager
```python
class TimerManager:
    """Enforces action durations and killer turn timing."""
    
    def blockActions(self, duration: float) -> None:
        """
        Prevents player input during container search.
        Killer heat continues to accumulate during block.
        """
        ...
    
    def getElapsedTime(self) -> float:
        """Returns seconds since level start (for scoring)."""
        ...
```

## 5. CONSTRAINTS
- Heat decay MUST run at 30 TPS (tick rate)
- Action blocking MUST prevent all input (no camera pan)
- Killer pathfinding MUST avoid prop collision boxes
- Heat adjustments MUST log reason (for debugging UI)