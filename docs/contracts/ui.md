# CONTRACT: UI SYSTEMS
**Responsibility:** React Overlays, Inspection Interface, Evidence Display.

## 1. INSPECTION OVERLAY (New Component)

### InspectionOverlay
```typescript
// React Component (TypeScript)
interface InspectionOverlayProps {
    prop: Prop | null
    onClose: () => void
    onAddEvidence: (prop: Prop) => void
    onSearchContainer: (prop: Prop) => void
}

function InspectionOverlay({
    prop,
    onClose,
    onAddEvidence,
    onSearchContainer
}: InspectionOverlayProps): JSX.Element {
    /**
     * Displays:
     * - Prop description (3+ sentences)
     * - Evidence value indicator (color-coded)
     * - [Add to Evidence] button (if not already added)
     * - [Search Container] button (if prop.type === 'container')
     * - Sub-prop list (if container searched)
     * 
     * Layout: Centered modal, 600x400px, semi-transparent backdrop.
     */
    ...
}
```

### Python Interface (for contract)
```python
from typing import Protocol, Callable

class InspectionUI(Protocol):
    """Bridge between Pixi click events and React overlay."""
    
    def show(self, prop: 'Prop') -> None:
        """
        Opens inspection overlay with prop data.
        Calls useStore.setState({ inspectedProp: prop }).
        """
        ...
    
    def hide(self) -> None:
        """Closes overlay, resumes game."""
        ...
    
    def handleAddEvidence(self, prop: 'Prop') -> None:
        """
        Calls inventory.Evidence.add(prop).
        Updates UI to show "Added" state.
        """
        ...
    
    def handleSearchContainer(self, prop: 'Prop') -> None:
        """
        Calls inventory.ContainerManager.searchContainer().
        Blocks input for 5 seconds.
        Calls combat.HeatManager.adjustHeat(+2, 'container_search').
        """
        ...
```

## 2. EVIDENCE PANEL (Updated)

### EvidencePanel
```python
class EvidencePanel(Protocol):
    """Displays collected props in side panel."""
    
    def addProp(self, prop: 'Prop') -> None:
        """Animates prop into evidence list."""
        ...
    
    def getTotalValue(self) -> int:
        """Renders sum of all evidenceValue as score."""
        ...
    
    def highlightRedHerring(self, propId: str) -> None:
        """
        Visual indicator when herring is added (amber border).
        Does NOT reveal it's a herring (player must deduce).
        """
        ...
```

## 3. CONTAINER SEARCH FEEDBACK

### SearchProgressBar
```python
class SearchProgressBar(Protocol):
    """Shows 5-second timer during container search."""
    
    def start(self, duration: float) -> None:
        """
        Displays progress bar overlay.
        Renders "Searching..." text.
        Calls onComplete callback after duration.
        """
        ...
    
    def cancel(self) -> None:
        """Aborts search if player moves (NOT IMPLEMENTED in V2.0)."""
        ...
```

## 4. PROP TOOLTIP (Hover Preview)

### PropTooltip
```python
class PropTooltip(Protocol):
    """Brief preview on mouse hover (before inspection)."""
    
    def show(self, prop: 'Prop', x: float, y: float) -> None:
        """
        Renders:
        - Prop name (e.g., "Bloody Knife")
        - Appearance icon
        - "Click to inspect" hint
        Position: Mouse cursor + 10px offset.
        """
        ...
    
    def hide(self) -> None:
        """Hides tooltip on mouse leave."""
        ...
```

## 5. ZUSTAND STORE INTEGRATION

### PropStoreSlice
```python
from typing import TypedDict

class PropStoreSlice(TypedDict):
    """Zustand state slice for prop interactions."""
    inspectedProp: 'Prop | None'
    searchInProgress: bool
    searchProgress: float  # 0-1
    
    # Actions
    setInspectedProp: Callable[['Prop | None'], None]
    startSearch: Callable[['Prop'], None]
    completeSearch: Callable[[list['Prop']], None]
```

## 6. BRIDGE PROTOCOL (React ↔ Pixi)

### UIBridge
```python
class UIBridge:
    """Connects Pixi click events to React state updates."""
    
    def registerPropClick(self, propId: str, callback: Callable) -> None:
        """
        Sets up useStore.subscribe(() => {
            if (store.inspectedProp?.id === propId) callback()
        })
        """
        ...
    
    def syncPropState(self, prop: 'Prop') -> None:
        """
        Updates React state when prop.inspected or prop.addedToEvidence changes.
        Triggers re-render of EvidencePanel and InspectionOverlay.
        """
        ...
```

## 7. CONSTRAINTS
- Overlays MUST use absolute positioning (no Pixi rendering)
- Modal backdrop MUST block Pixi raycasts (set `eventMode='none'` on canvas)
- Search bar MUST render at 30 FPS (match tick rate)
- NO `localStorage` (use manual JSON export for save state)
- Z-layer: React overlays above Pixi canvas (CSS `z-index: 100`)