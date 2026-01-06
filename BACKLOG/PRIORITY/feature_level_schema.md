# FEATURE SPEC: Level Schema

## 1. EXPERIENCE GOAL (The "Vibe")
**"Structured Chaos."**
The level schema provides the rigid mathematical blueprint required to procedurally generate a crowded, overwhelming, yet performant "Where's Waldo" environment.

## 2. USER STORIES
*   **As a Level Designer (Script),** I want to define spawn zones and NPC density in a JSON file so that I can balance difficulty without touching game code.
*   **As the Game Engine,** I want to load a strictly typed JSON object so that I can instantiate the world boundaries, background, and initial population instantly.
*   **As a Developer,** I want the schema to validate `asset_ids` against the `AssetRegistry` so that the game doesn't crash trying to load missing sprites.

## 3. TECHNICAL REQUIREMENTS

### A. Data Structures (TypeScript Interfaces)
This schema serves as the contract between the Python Level Generator and the Next.js Client.

```typescript
// types/LevelSchema.ts

export type ZoneType = 'walkable' | 'obstacle' | 'vignette_hotspot' | 'exit';

export interface Rect {
    x: number;      // World coordinate X (pixels)
    y: number;      // World coordinate Y (pixels)
    w: number;      // Width
    h: number;      // Height
}

export interface SpawnZone extends Rect {
    type: ZoneType;
    capacity_weight: number; // 0.0 to 1.0 (How likely NPCs spawn here)
}

export interface VignetteRule {
    id: string;             // e.g., "crime_scene_alley"
    required_zone: string;  // Matches a zone type (e.g., 'vignette_hotspot')
    probability: number;    // 0.0 to 1.0
}

export interface LevelData {
    meta: {
        id: string;         // e.g., "level_01_docks"
        name: string;       // Display name
        version: string;    // Schema version
    };
    world: {
        width: number;      // Total world width in pixels
        height: number;     // Total world height in pixels
        background_asset_id: string; // Key from AssetRegistry
    };
    population: {
        civilian_count: number; // Target active NPC count (e.g., 60)
        killer_count: number;   // Usually 1
        density_map: string;    // Optional: asset_id for a density texture
    };
    zones: SpawnZone[];         // Areas where things can/cannot be
    vignettes: VignetteRule[];  // Rules for crime scene generation
}
```

### B. Validation Logic (Runtime)
*   **Bounds Check:** Ensure `zones` do not exceed `world` dimensions.
*   **Asset Check:** `background_asset_id` must exist in `AssetRegistry.getAsset()`.
*   **Constraint Check:** `civilian_count` must not exceed `system.md` constraint (Max 60).

### C. Example JSON Artifact
```json
{
  "meta": {
    "id": "lvl_subway_01",
    "name": "Subway Panic",
    "version": "1.0"
  },
  "world": {
    "width": 2048,
    "height": 1024,
    "background_asset_id": "bg_subway_tile_01"
  },
  "population": {
    "civilian_count": 45,
    "killer_count": 1
  },
  "zones": [
    { "x": 0, "y": 300, "w": 2048, "h": 400, "type": "walkable", "capacity_weight": 1.0 },
    { "x": 500, "y": 350, "w": 100, "h": 50, "type": "obstacle", "capacity_weight": 0.0 },
    { "x": 1800, "y": 400, "w": 200, "h": 200, "type": "vignette_hotspot", "capacity_weight": 0.1 }
  ],
  "vignettes": [
    { "id": "body_dump_01", "required_zone": "vignette_hotspot", "probability": 0.5 }
  ]
}
```

## 4. INTEGRATION POINTS
*   **`src/types/LevelSchema.ts`**: New file. Defines the interfaces above.
*   **`src/core/AssetRegistry.ts`**: Will be called to validate `background_asset_id` during level loading.
*   **`src/core/CameraController.ts`**: Will read `LevelData.world` to set camera bounds (clamping).
*   **New Module**: `src/core/LevelLoader.ts` (Future) will be responsible for fetching and parsing this JSON.

## 5. DEFINITION OF DONE
1.  [ ] `src/types/LevelSchema.ts` created with strict typing.
2.  [ ] `public/levels/test_level.json` created as a valid fixture.
3.  [ ] Unit test created that imports the JSON and asserts it matches the interface.
4.  [ ] Validation script checks `civilian_count <= 60` (per `system.md`).

---
