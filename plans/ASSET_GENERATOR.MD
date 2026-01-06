# Implementation Plan: Procedural Asset Generator

## Prerequisites
- Python 3.11 installed
- `pip install Pillow numpy jsonschema` completed

---

## Step 1: Scaffold Script Structure
**File:** `scripts/generate_assets.py`

**Tasks:**
1. Create CLI argument parser (`--config`, `--output`)
2. Define dataclasses for `SceneryConfig`, `PropConfig`, `CharacterConfig`
3. Create placeholder functions:
   - `validate_config(config: Dict) -> List[str]`
   - `generate_pixel_grid(config: AssetConfig) -> np.ndarray`
   - `pack_sprites(sprites: Dict[str, np.ndarray]) -> Tuple[Image, Dict]`
   - `write_output(atlas: Image, frames: Dict, output_dir: str) -> None`
4. Wire up main function with error handling

**Expected Output:**
```bash
$ python scripts/generate_assets.py --config test.json --output public/assets/
Error: Config validation not implemented
```

---

## Step 2: Implement Pixel Generation
**File:** `scripts/generate_assets.py` (modify)

**Tasks:**
1. Install `opensimplex` library for noise generation
2. Implement `generate_pixel_grid()`:
   - Simplex noise for tiles
   - Solid color fill for props
   - Edge detection using Sobel operator
3. Add color utility functions:
   - `hex_to_rgba(hex: str) -> Tuple[int, int, int, int]`
   - `check_contrast_ratio(colors: List[str], min_ratio: float) -> bool`
4. Test with single asset from `asset_config.json`

**Expected Output:**
```bash
$ python scripts/generate_assets.py --config test.json --output public/assets/
Generated: park_ground.png (64x64)
```

---

## Step 3: Implement Spritesheet Packing
**File:** `scripts/generate_assets.py` (modify)

**Tasks:**
1. Implement shelf-packing algorithm in `pack_sprites()`
2. Add `next_power_of_2(n: float) -> int` utility
3. Generate `sprite_manifest.json` with PixiJS TexturePacker format:
   - Include `anchor` field from config
   - Set `meta.scale = "1"` (AssetRegistry applies scale=4)
4. Write PNG using `Pillow.Image.save()`

**Expected Output:**
```bash
$ python scripts/generate_assets.py --config asset_config.json --output public/assets/generated/
✓ Generated sprites.png (256x256, 12 frames)
✓ Written sprite_manifest.json
```

---

## Step 4: Add Validation & Character Variants
**File:** `scripts/generate_assets.py` (modify)

**Tasks:**
1. Implement `validate_config()` checks:
   - Size divisibility by 4
   - Max dimension 128px
   - Palette contrast ratio (WCAG AA)
2. Add character variant generation:
   - Loop `config.variants` times
   - Swap palette colors using HSL rotation
   - Name as `{base_name}_variant_{i}`
3. Add comprehensive error messages with suggested fixes
4. Update README with usage examples

**Expected Output:**
```bash
$ python scripts/generate_assets.py --config bad_config.json --output public/assets/
❌ Validation failed:
  - bench: Size (31x16) must be divisible by 4. Try (32x16).
  - giant_prop: Max dimension is 128px (found 256px).

$ python scripts/generate_assets.py --config asset_config.json --output public/assets/generated/
✓ Validated 15 assets
✓ Generated 8 variants for civilian_male_01
✓ Packed into sprites.png (512x256)
✓ Written sprite_manifest.json
Done in 1.2s
```

---

## Integration with AssetRegistry
**File:** `src/core/AssetRegistry.ts` (modify existing)

**Tasks:**
1. Update `load()` to parse `anchor` field from manifest
2. Apply anchor during `createSprite()`:
```typescript
   const sprite = new PIXI.Sprite(metadata.texture);
   sprite.anchor.set(metadata.anchor.x, metadata.anchor.y);
```
3. Add test case in `AssetRegistryTest.tsx` for generated manifest

**No new files created** - uses existing AssetRegistry contract.

---

## Definition of Done Checklist
- [ ] Script runs: `python scripts/generate_assets.py --config asset_config.json`
- [ ] Outputs valid `sprites.png` + `sprite_manifest.json`
- [ ] Generates 3 test assets: 1 tile, 1 prop, 1 NPC (8 variants)
- [ ] All sprites divisible by 4 (validation passes)
- [ ] Manifest validates against PixiJS schema
- [ ] AssetRegistry loads generated manifest without errors
- [ ] README updated with CLI usage examples