# FEATURE SPEC: Procedural Asset Generator

## 1. EXPERIENCE GOAL (The "Vibe")
"Artists shouldn't bottleneck development - assets spawn from code like magic."

## 2. USER STORIES
* As a **Developer**, I want to run a Python script that generates pixel-art spritesheets, so that I can prototype levels without waiting for art assets.
* As a **Level Designer**, I want to define asset parameters in JSON (e.g., "park_bench: brown, 32x16px"), so that the generator creates consistent themed sprites.
* As a **Performance Engineer**, I want all assets pre-generated at build time, so that runtime performance stays locked at 60fps.

## 3. TECHNICAL REQUIREMENTS

### Data Structures
```python
# asset_config.json (input)
{
  "sceneries": {
    "park_ground": {
      "type": "tile",
      "size": [64, 64],
      "palette": ["#5a8f4a", "#4a7f3a"],
      "noise_seed": 12345
    }
  },
  "props": {
    "bench": {
      "type": "furniture",
      "size": [32, 16],
      "palette": ["#8b4513", "#654321"],
      "anchor": [0.5, 0.9]  # For Y-sorting
    }
  },
  "characters": {
    "civilian_male_01": {
      "type": "npc",
      "size": [16, 24],
      "palette": ["#ff6b6b", "#4ecdc4"],
      "variants": 8  # Generate 8 color variations
    }
  }
}

# sprite_manifest.json (output)
{
  "spritesheet": "assets/generated/sprites.png",
  "frames": {
    "park_ground": {"x": 0, "y": 0, "w": 64, "h": 64},
    "bench": {"x": 64, "y": 0, "w": 32, "h": 16},
    "civilian_male_01_variant_0": {"x": 0, "y": 64, "w": 16, "h": 24}
  }
}
```

### Algorithms
1. **Pixel Grid Builder**
   - Input: Size (w, h), Palette (color array)
   - Output: 2D numpy array of RGBA values
   - Methods: Noise generation (simplex), edge detection, palette swapping

2. **Spritesheet Packer**
   - Input: List of generated pixel arrays
   - Output: Single PNG + JSON atlas (compatible with PixiJS TexturePacker format)
   - Algorithm: Shelf-packing (row-based, sorted by height)

3. **Asset Validator**
   - Check: All sprites are divisible by 4 (for `scale=4` rendering)
   - Check: No sprites exceed 128x128px (mobile GPU limits)
   - Check: Palette colors follow accessibility contrast ratios

### Constraint Alignment
- ✅ **Python 3.11:** Generation script runs offline (pre-build step)
- ✅ **No localStorage:** Output goes to `/public/assets/generated/` directory
- ✅ **PixiJS v8:** JSON manifest follows PIXI.Assets.load() format

## 4. INTEGRATION POINTS

### Modifies Existing Systems
- **`Feature Asset Pipeline`** (Phase 1, Backlog) 
  - ➕ ADD: `scripts/generate_assets.py` (new Python tool)
  - ➕ ADD: `asset_config.json` (defines what to generate)
  - ➕ ADD: `public/assets/generated/` (output directory)

### New Dependencies Created
- **`Feature Level Schema`** (Phase 1, Backlog)
  - MUST reference `sprite_manifest.json` frame names in level JSON
  - Example: `"ground_tile": "park_ground"` → maps to generated sprite

## 5. DEFINITION OF DONE
- [ ] `generate_assets.py` runs without errors and outputs valid PNG + JSON
- [ ] Script generates 3 test assets: 1 ground tile, 1 prop, 1 NPC (8 color variants)
- [ ] `sprite_manifest.json` validates against PixiJS TexturePacker schema
- [ ] All generated sprites are exactly divisible by 4 (for pixel-scale rendering)
- [ ] README includes command: `python scripts/generate_assets.py --config asset_config.json`