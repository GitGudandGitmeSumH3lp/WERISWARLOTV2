# MASTER INDEX: Project Crowd Killer

**Last Updated:** Phase 1 (Architecture & Implementation)
**Owner:** Product Owner / Systems Analyst

---

## 1. Project Administration
*High-level tracking and technical constraints.*

| File | Description | Status |
| :--- | :--- | :--- |
| **[[_STATE.md]]** | **Current Context.** The Source of Truth for progress, tasks, and phase tracking. | 🟢 LIVE |
| **[[system.md]]** | **Technical Constitution.** Stack definition (Next.js/PixiJS), rendering rules, and hard constraints. | 🔒 LOCKED |

---

### Build Tools (Phase 1)
*Offline asset generation and validation.*

#### `AssetGenerator` (Python Script)
**Location:** `scripts/generate_assets.py`  
**Purpose:** Procedural spritesheet generation from JSON configuration.
```bash
# CLI Interface
python scripts/generate_assets.py --config asset_config.json --output public/assets/generated/
```

**Configuration Schema:**
```python
# asset_config.json
{
  "sceneries": Dict[str, SceneryConfig],
  "props": Dict[str, PropConfig],
  "characters": Dict[str, CharacterConfig]
}

class SceneryConfig:
    type: Literal["tile"]
    size: Tuple[int, int]  # Must be divisible by 4
    palette: List[str]     # Hex colors
    noise_seed: int

class PropConfig:
    type: Literal["furniture", "clutter"]
    size: Tuple[int, int]
    palette: List[str]
    anchor: Tuple[float, float]  # For Y-sorting

class CharacterConfig:
    type: Literal["npc"]
    size: Tuple[int, int]
    palette: List[str]
    variants: int  # Number of color variations
```

**Output Contract:**
```python
# sprite_manifest.json (PixiJS TexturePacker format)
{
  "frames": {
    "": {
      "frame": {"x": int, "y": int, "w": int, "h": int},
      "spriteSourceSize": {"x": 0, "y": 0, "w": int, "h": int},
      "sourceSize": {"w": int, "h": int},
      "anchor": {"x": float, "y": float}  # From config
    }
  },
  "meta": {
    "image": "sprites.png",
    "format": "RGBA8888",
    "size": {"w": int, "h": int},
    "scale": "1"  # AssetRegistry applies scale=4 at runtime
  }
}
```

**Guarantees:**
- All sprite dimensions divisible by 4 (validated pre-output)
- No sprite exceeds 128x128px (mobile GPU limit)
- Palette colors meet WCAG AA contrast (3:1 minimum)
- Output directory created if missing
- Script exits with code 1 on validation failure

**Dependencies:**
- Python 3.11+
- `Pillow` (PNG generation)
- `numpy` (Noise algorithms)
- `jsonschema` (Config validation)

---


## 2. Public API Interfaces

### Core Systems (Phase 1)
*Foundational modules that all features depend on.*


#### `AssetRegistry` (NEW)
**Location:** `src/core/AssetRegistry.ts`  
**Purpose:** Centralized asset loading and sprite factory for PixiJS textures.

```typescript
class AssetRegistry {
  // Initialization
  static async load(manifestPath: string): Promise<void>
  
  // Asset Queries
  static get(name: string): AssetMetadata
  static createSprite(name: string): PIXI.Sprite
  static has(name: string): boolean
  
  // Metadata
  static listAssets(filter?: { type?: AssetType }): string[]
}

interface AssetMetadata {
  texture: PIXI.Texture
  anchor: { x: number; y: number }
  scale: number
  type: "tile" | "prop" | "npc"
}

type AssetType = "tile" | "prop" | "npc"
```

**Guarantees:**
- All sprites created via `createSprite()` have `scale=4` and `zIndex=y` pre-applied
- Asset names must be loaded via `load()` before `get()` or `createSprite()` calls
- Invalid asset names throw synchronous errors (fail-fast contract)

**Dependencies:** PixiJS v8 `PIXI.Assets` API

**New Internal Logic:**
- Parse `anchor` field from manifest JSON
- Apply to `Sprite.anchor` during `createSprite()`
- Maintain backward compatibility with simple manifests


---

## 3. Feature Specifications (Backlog)
*Atomic requirements documents. All development must reference these specs.*

### Core Gameplay Loop
*The mechanics of the hunt.*

| Spec File | Feature Name | Vibe/Goal |
| :--- | :--- | :--- |
| **[[specs/feature_killer_action_system.md]]** | **Killer Logic** | *Predatory.* The AI loop for stalking and killing. |
| **[[specs/feature_killer_heat_system.md]]** | **Heat System** | *Anxiety.* The invisible director increasing tension/dread over time. |
| **[[specs/feature_inspection_system.md]]** | **Inspection UI** | *Obsessive.* Exploring props to distinguish clues from red herrings. |
| **[[specs/feature_evidence_system.md]]** | **Evidence Bag** | *Methodical.* Building a case and flagging contradictions. |

### World & Environment
*The stage where the crime occurs.*

| Spec File | Feature Name | Vibe/Goal |
| :--- | :--- | :--- |
| **[[specs/feature_asset_pipeline_integration.md]]** | **Asset Pipeline** | *Instant.* Pre-cached sprites with auto-configured anchors/scale. |
| **[[specs/feature_vignette_system.md]]** | **Environmental Storytelling** | *Context.* Micro-stories (crime vs. life) scattered via props. |
| **[[specs/feature_prop_system.md]]** | **Interactables** | *Tactile.* Base classes for physical objects and containers. |
| **[[specs/feature_art_direction.md]]** | **Visual Standards** | *Nostalgia/Grime.* Stardew meets Se7en. Pixel scale and color rules. |

### Narrative & AI
*The suspects and the deception.*

| Spec File | Feature Name | Vibe/Goal |
| :--- | :--- | :--- |
| **[[specs/feature_dialogue_system.md]]** | **Interaction** | *Paranoia.* Detecting micro-tells and inconsistencies in casual talk. |
| **[[specs/feature_interrogation_system.md]]** | **Interrogation** | *Pressure.* High-stakes questioning that risks spooking the killer. |

### Endgame & Meta
*The consequences of choice.*

| Spec File | Feature Name | Vibe/Goal |
| :--- | :--- | :--- |
| **[[specs/feature_confrontation_system.md]]** | **The Moral Choice** | *Weight.* Arrest the killer (reveal victims) or save lives (let killer go). |
| **[[specs/feature_crisis_system.md]]** | **Crisis Scenarios** | *Panic.* Ticking clock events (Bomb, Poison, Hostage) or Bluffs. |
| **[[specs/feature_progression_system.md]]** | **Level Scaling** | *Escalation.* Difficulty scaling, unlocks, and environment variety. |

---
### Level Systems (Phase 2)
*Asset binding and validation for data-driven level generation.*

#### `Level Asset Bindings` (NEW)
**Location:** `src/level/types.ts`  
**Purpose:** TypeScript definitions for asset-driven level configuration.
```typescript
// Core level data structure (extends Phase 1 Level Schema)
interface LevelAssetBindings {
  level_id: string;
  
  scenery: {
    ground_tile: string;        // Asset name from sprite_manifest.json
    background_props: string[]; // Array of prop asset names
  };
  
  spawn_zones: Array<SpawnZone>;
  vignettes: Array<Vignette>;
}

interface SpawnZone {
  type: "civilian" | "killer" | "vignette";
  x: number;
  y: number;
  radius: number;
  
  // Asset overrides
  asset_pool?: string[];   // Random selection pool
  required_asset?: string; // Force specific sprite (killer)
}

interface Vignette {
  id: string;
  props: Array<VignetteProp>;
}

interface VignetteProp {
  asset: string;                // Asset name
  offset: { x: number; y: number };
  layer: number;                // Stacking order (0-10)
}
```

**Guarantees:**
- All asset names validated against `AssetRegistry` at load time
- Invalid references throw synchronous errors (fail-fast)
- Layer values map to sub-pixel zIndex offsets

---

#### `validateLevelAssets` (NEW)
**Location:** `src/level/validateLevelAssets.ts`  
**Purpose:** Runtime validation of level JSON against loaded asset registry.
```typescript
function validateLevelAssets(
  levelData: LevelAssetBindings,
  registry: typeof AssetRegistry
): ValidationResult

interface ValidationResult {
  valid: boolean;
  errors: Array<{
    type: "missing_asset" | "invalid_layer" | "empty_pool";
    message: string;
    path: string;  // JSON path to error (e.g., "spawn_zones[0].required_asset")
  }>;
}
```

**Validation Rules:**
1. All `scenery.ground_tile` and `background_props` must exist in registry
2. All `spawn_zones.asset_pool` and `required_asset` must exist
3. All `vignettes.props.asset` must exist
4. Layer values must be 0-10 (enforced range)
5. Asset pools cannot be empty arrays

**Usage:**
```typescript
const result = validateLevelAssets(levelJSON, AssetRegistry);
if (!result.valid) {
  throw new Error(`Level validation failed:\n${result.errors.map(e => e.message).join('\n')}`);
}
```

---

#### `selectFromAssetPool` (NEW)
**Location:** `src/level/assetSelectors.ts`  
**Purpose:** Smart asset selection with collision avoidance.
```typescript
function selectFromAssetPool(
  pool: string[],
  usedAssets: Set<string>,
  avoidRadius?: number
): string

function calculatePropZIndex(
  baseY: number,
  layer: number
): number
```

**Guarantees:**
- `selectFromAssetPool()` never returns same asset twice within `avoidRadius`
- `calculatePropZIndex()` produces sub-pixel offsets: `zIndex = baseY + (layer * 0.01)`
- Both functions are pure (no side effects)

**Dependencies:** None (pure functions)
---

## 4. Directory Structure (Reference)

```text
/
├── _STATE.md                   # Project Status
├── system.md                   # Tech Stack & Constraints
├── MASTER-INDEX.md             # You are here
├── src/                        # Next.js Source
│   └── core/                   # Foundation Systems
│       └── AssetRegistry.ts    # NEW: Asset loading singleton
├── public/                     # Assets (Sprites)
│   └── sprite_manifest.json    # NEW: Generated spritesheet metadata
└── specs/                      # Markdown Feature Definitions
    ├── feature_art_direction.md
    ├── feature_asset_pipeline_integration.md  # NEW
    ├── feature_confrontation_system.md
    ├── feature_crisis_system.md
    ├── feature_dialogue_system.md
    ├── feature_evidence_system.md
    ├── feature_inspection_system.md
    ├── feature_interrogation_system.md
    ├── feature_killer_action_system.md
    ├── feature_killer_heat_system.md
    ├── feature_progression_system.md
    ├── feature_prop_system.md
    └── feature_vignette_system.md
```