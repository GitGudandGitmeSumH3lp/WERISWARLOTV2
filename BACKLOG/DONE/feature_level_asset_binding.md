# FEATURE SPEC: Level-Asset Binding

## 1. EXPERIENCE GOAL (The "Vibe")
"Level designers paint with asset names, not pixel coordinates."

## 2. USER STORIES
* As a **Level Designer**, I want to write `"ground": "park_grass"` in my level JSON, so that the correct tile auto-spawns without hardcoding paths.
* As a **Vignette Spawner**, I want to define `"crime_scene_props": ["blood_puddle", "knife"]`, so that evidence spawns with correct visual assets.
* As a **NPC Spawner**, I want to assign `"killer_sprite": "civilian_male_suspicious"`, so that the killer visually blends into the crowd.

## 3. TECHNICAL REQUIREMENTS

### Data Structures
```typescript
// Extended Level Schema (updates Feature Level Schema from Phase 1)
interface LevelAssetBindings {
  scenery: {
    ground_tile: string;      // Asset name from sprite_manifest.json
    background_props: string[]; // e.g., ["tree_01", "bush_02"]
  };
  
  spawn_zones: Array<{
    type: "civilian" | "killer" | "vignette";
    x: number;
    y: number;
    radius: number;
    
    // NEW: Asset overrides
    asset_pool?: string[];  // e.g., ["civilian_male_01", "civilian_female_01"]
    required_asset?: string; // Force specific sprite (for killer)
  }>;
  
  vignettes: Array<{
    id: string;
    props: Array<{
      asset: string;  // e.g., "blood_puddle"
      offset: { x: number; y: number };
      layer: number;  // For stacking evidence
    }>;
  }>;
}

// Example level JSON
{
  "level_id": "park_murder_01",
  "scenery": {
    "ground_tile": "park_grass",
    "background_props": ["bench", "tree_oak", "trash_can"]
  },
  "spawn_zones": [
    {
      "type": "civilian",
      "x": 640, "y": 360, "radius": 200,
      "asset_pool": ["civilian_male_01", "civilian_female_02"] // Random selection
    },
    {
      "type": "killer",
      "x": 100, "y": 100, "radius": 50,
      "required_asset": "civilian_male_03_variant_5" // Specific sprite
    }
  ],
  "vignettes": [
    {
      "id": "crime_scene_alpha",
      "props": [
        { "asset": "blood_puddle", "offset": { "x": 0, "y": 0 }, "layer": 0 },
        { "asset": "knife", "offset": { "x": 10, "y": -5 }, "layer": 1 }
      ]
    }
  ]
}
```

### Algorithms
1. **Asset Name Validator**
   - On level load, cross-check all asset names against `AssetRegistry.cache`
   - Throw error if level references non-existent asset (fail-fast)

2. **Asset Pool Selector**
   - For NPCs with `asset_pool`, randomly pick from list (weighted shuffle)
   - Ensure no duplicate sprites within visible radius (avoid clone detection)

3. **Layered Prop Spawner**
   - For vignettes, sort props by `layer` field
   - Apply `zIndex = baseY + layer * 0.01` for sub-pixel sorting

### Constraint Alignment
- ✅ **Level Schema:** Extends existing JSON structure (non-breaking)
- ✅ **Zustand:** Level data stored in `useStore` as plain object (no serialization issues)
- ✅ **NPC Cap:** Asset pool selection respects 60-NPC limit from system.md

## 4. INTEGRATION POINTS

### Modifies Existing Systems
- **`Feature Level Schema`** (Phase 1, Backlog)
  - ➕ ADD: `scenery` field (ground tile + background props)
  - ➕ ADD: `asset_pool` and `required_asset` fields to spawn zones
  - ➕ ADD: `vignettes.props.asset` field for evidence binding

- **`Feature NPC Spawner`** (Phase 2, Backlog)
  - ➕ MODIFY: Read `asset_pool` from spawn zone config
  - ➕ MODIFY: Call `AssetRegistry.createSprite()` with selected asset name

- **`Feature Vignette Spawner`** (Phase 2, Backlog)
  - ➕ MODIFY: Loop through `vignettes.props` array
  - ➕ MODIFY: Spawn each prop using `AssetRegistry.createSprite()`

- **`Feature Prop Spawner`** (Phase 2, Backlog)
  - ➕ MODIFY: Read `scenery.background_props` for scatter algorithm

### New Validation Layer
- `src/level/validateLevelAssets.ts` (NEW - Runtime validator)

## 5. DEFINITION OF DONE
- [ ] Test level JSON loads with `"ground": "park_grass"` and spawns correct tile
- [ ] Spawn zone with `asset_pool: ["male_01", "female_01"]` creates mixed crowd
- [ ] Vignette with 3 layered props (`layer: 0, 1, 2`) renders in correct depth order
- [ ] Loading level with invalid asset name (e.g., `"unknown_sprite"`) throws readable error
- [ ] Level schema documentation updated with asset binding examples