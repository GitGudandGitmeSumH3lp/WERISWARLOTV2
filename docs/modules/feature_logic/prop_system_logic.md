# PROP SYSTEM LOGIC (V2.0.0)
**Module:** Prop Expansion Feature  
**Dependencies:** inventory, world, combat, ui, 00_CORE

---

## 1. STATE MACHINES

### Prop Lifecycle
```
[SPAWNED] 
   ↓ (player clicks)
[INSPECTING] → description shown, 2-second pause
   ↓ (player adds to evidence OR closes)
[COLLECTED] → prop.addedToEvidence = true
   OR
[DISMISSED] → prop.inspected = true, remains in world
```

### Container Search Flow
```
[CLOSED]
   ↓ (player clicks "Search Container")
[SEARCHING] → 5-second timer, heat +2, input blocked
   ↓ (timer completes)
[OPENED] → reveals 1-3 sub-props, sub-props enter SPAWNED state
   ↓ 
[EXHAUSTED] → cannot search again
```

### Heat Response Cycle
```
[COLD: 0-25] → killer ignores prop searches
[WARM: 26-50] → killer investigates noise (20% vignette spawn)
[HOT: 51-75] → killer stalks player location
[CRITICAL: 76-100] → killer attacks (combat phase)

Heat Modifiers:
- Container search: +2 (instant)
- Prop inspection (crime): +1 (delayed 2 sec)
- Idle decay: -0.5/sec
```

---

## 2. DATA FLOW

### Level Generation Pipeline
```
WorldBuilder.buildLevel(difficulty, biome, killer)
   ↓
PropPool.generateForLevel(difficulty, biome)
   → Crime props: 5 + difficulty
   → Herring props: 10 + (difficulty × 2)
   → Ambiance props: 40 - (Crime + Herring)
   → Container props: 7 (fixed)
   ↓
VignetteManager.placeVignette(killerProfile.signature)
   → Places Crime props in authored clusters
   ↓
PropSpawner.distributeProps(remaining_props, bounds)
   → Poisson disk sampling (min 32px spacing)
   → BiomeRules.validateProp() per placement
   ↓
Return LevelState{ props[], vignettes[], killerHeat }
```

### Inspection Event Chain
```
[Player clicks prop sprite]
   ↓
InteractionManager.onPointerDown(event)
   ↓
ui.InspectionUI.show(prop) → useStore.setState({ inspectedProp })
   ↓
React renders InspectionOverlay with:
   - prop.description (3+ sentences)
   - evidenceValue (color bar: red=high, gray=low)
   - [Add Evidence] button (if not collected)
   - [Search] button (if type=container AND not opened)
   ↓
Player action:
   → [Add Evidence] → inventory.Evidence.add(prop)
                    → ui.EvidencePanel.addProp(prop)
                    → prop.addedToEvidence = true
   OR
   → [Search] → combat.HeatManager.adjustHeat(+2, 'search')
             → combat.TimerManager.blockActions(5.0)
             → inventory.ContainerManager.searchContainer(prop)
             → returns sub_props[]
             → ui.InspectionOverlay updates with sub-prop list
```

### Container Content Generation
```
ContainerManager.generateContents(containerType, biome)
   ↓
Determine sub-prop count: randint(1, 3)
   ↓
For each sub-prop:
   roll = random(0-100)
   if roll < 40: type = 'crime'
   elif roll < 80: type = 'herring'
   else: type = 'ambiance'
   ↓
   PropPool.getRedHerring(biome) if type='herring'
   OR
   Select from BiomeRules.ambientProps if type='ambiance'
   OR
   VignetteManager.getSingleCrimeProp() if type='crime'
   ↓
Return list[Prop] with descriptions generated
```

---

## 3. MATHEMATICAL MODELS

### Evidence Value Calculation
```
Crime Prop Value:
  baseValue = 80
  proximityBonus = distance_to_vignette_center < 64px ? +10 : 0
  timePenalty = -2 × minutes_elapsed (max -20)
  FINAL = clamp(baseValue + proximityBonus + timePenalty, 10, 100)

Herring Value:
  baseValue = randint(10, 30)
  susLevelMultiplier = 1.0 + (0.1 × appearance_matches_crime_props)
  FINAL = int(baseValue × susLevelMultiplier)

Ambiance Value:
  FIXED = 0 (cannot be added to evidence)
```

### Prop Distribution Density
```
Poisson Disk Sampling Parameters:
  radius = 32px (minimum separation)
  candidates_per_point = 30
  bounds = (0, 0, 1280, 720) - margin(64px)

Biome Density Modifiers:
  park: 0.8 (sparse, open areas)
  docks: 1.2 (cluttered, industrial)
  subway: 1.0 (standard urban density)

Effective prop count per 100,000px²:
  park: ~0.4 props
  docks: ~0.6 props
  subway: ~0.5 props
```

### Heat Accumulation Over Time
```
heatRate = baseRate + searchPenalty + movementPenalty

baseRate = -0.5/sec (idle decay)
searchPenalty = +2 (instant, on container search)
movementPenalty = isPlayerSprinting ? +1/sec : 0

Critical Threshold Check (every tick at 30 TPS):
  if currentHeat >= 76:
    killer.executeAction() → spawn vignette OR path to player
    nextActionDelay = 10 seconds (cooldown)
```

---

## 4. EDGE CASES & VALIDATION

### Biome Constraint Violations
```
ERROR: Prop with appearance='tool' spawned in park biome
FIX: BiomeRules.validateProp() returns False
     → PropSpawner.distributeProps() skips placement
     → WorldBuilder logs warning, substitutes ambiance prop
```

### Container with No Contents
```
ERROR: Container searched, returns empty list
PREVENTION: ContainerManager.generateContents() guarantees 1-3 props
            If PropPool exhausted, spawn generic ambiance props
```

### Sub-Prop Duplication
```
ERROR: Same Crime prop appears in container AND vignette
PREVENTION: VignetteManager.placeVignette() marks used props
            ContainerManager checks 'usedPropIds' list before spawning
```

### Heat Overflow
```
ERROR: Heat exceeds 100 (e.g., multiple rapid searches)
FIX: HeatManager.adjustHeat() clamps to range [0, 100]
     If heat == 100: trigger instant killer attack
```

### Z-Index Collision
```
ERROR: Prop with y=150 renders behind prop with y=200
CHECK: ZSorter.sortByY() runs every frame
       Verify sprite.zIndex === sprite.y
       Container must have sortableChildren = true
```

### Missing Hitbox in Manifest
```
ERROR: PropAtlas.getHitbox(propId) returns None
FALLBACK: Use sprite texture bounds (width, height)
          Log warning to console
```

---

## 5. PERFORMANCE CONSTRAINTS

### 60-Prop Active Limit
```
Strategy:
1. PropCulling.updateVisibility() runs at 30 TPS
2. Priority order:
   - Crime props: ALWAYS loaded
   - Container props: ALWAYS loaded
   - Herring props: Loaded if within 512px of player
   - Ambiance props: Culled first (load when within 256px)
3. Off-screen props have sprites destroyed (not just hidden)
4. Re-spawn culled props when player returns to area
```

### Container Search Blocking
```
During 5-second search:
- InteractionManager.disableInputDuringSearch()
  → app.stage.eventMode = 'none'
- Camera panning: DISABLED
- Killer heat: CONTINUES accumulating
- React UI: SearchProgressBar overlay active
- After 5 sec: re-enable with eventMode = 'static'
```

### Description String Memory
```
Problem: 60 props × 500 chars/description = 30KB strings
Solution: Lazy-load descriptions on inspection
- PropPool stores description templates (50 chars)
- PropDescriptionGenerator.generateDescription() called on-demand
- Cache last 10 inspected descriptions in memory
```

---

## 6. INTEGRATION CHECKLIST

- [ ] `inventory.PropPool` generates correct distribution ratios
- [ ] `world.VignetteManager` places Crime props only (no random)
- [ ] `combat.HeatManager.adjustHeat()` called on container search
- [ ] `ui.InspectionOverlay` blocks Pixi input when visible
- [ ] `00_CORE.InteractionManager` sets `eventMode="static"` on all props
- [ ] `BiomeRules.validateProp()` rejects mismatched appearances
- [ ] `ContainerManager.searchContainer()` triggers 5-sec timer
- [ ] `ZSorter.sortByY()` maintains depth ordering
- [ ] Red herrings appear in 30% of prop pool (not 30% of inspections)
- [ ] Sub-props in containers inherit parent biome constraints