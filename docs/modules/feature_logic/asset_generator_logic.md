# Asset Generator: Internal Logic Flow

## System Overview
```
[asset_config.json] 
    â†"
[Validator] → [Pixel Generator] → [Sprite Packer] → [PNG Writer]
                                        â†"
                                [sprite_manifest.json]
```

## Core Algorithms

### 1. Pixel Grid Generator
**Input:** `SceneryConfig` / `PropConfig` / `CharacterConfig`  
**Output:** `numpy.ndarray` (RGBA, uint8)
```python
def generate_pixel_grid(config: AssetConfig) -> np.ndarray:
    # Step 1: Create base grid
    grid = np.zeros((config.size[1], config.size[0], 4), dtype=np.uint8)
    
    # Step 2: Apply noise pattern
    if config.type == "tile":
        noise = simplex_noise_2d(config.size, seed=config.noise_seed)
        # Map noise [-1, 1] to palette indices
        palette_idx = ((noise + 1) / 2 * len(config.palette)).astype(int)
    
    # Step 3: Fill pixels with palette colors
    for y in range(config.size[1]):
        for x in range(config.size[0]):
            grid[y, x] = hex_to_rgba(config.palette[palette_idx[y, x]])
    
    # Step 4: Add edge detection for props
    if config.type in ["furniture", "clutter"]:
        edges = detect_edges(grid)
        grid = apply_outline(grid, edges, color="#000000")
    
    return grid
```

### 2. Spritesheet Packer
**Algorithm:** Shelf-packing (row-based, height-sorted)
```python
def pack_sprites(sprites: Dict[str, np.ndarray]) -> Tuple[Image, Dict]:
    # Sort by height (descending) for optimal packing
    sorted_sprites = sorted(sprites.items(), key=lambda x: x[1].shape[0], reverse=True)
    
    # Calculate total atlas size (power of 2)
    total_area = sum(s[1].shape[0] * s[1].shape[1] for s in sorted_sprites)
    atlas_size = next_power_of_2(math.sqrt(total_area) * 1.2)  # 20% padding
    
    # Pack sprites row-by-row
    atlas = Image.new("RGBA", (atlas_size, atlas_size), (0, 0, 0, 0))
    frames = {}
    
    current_x, current_y, row_height = 0, 0, 0
    
    for name, grid in sorted_sprites:
        w, h = grid.shape[1], grid.shape[0]
        
        # New row if sprite doesn't fit
        if current_x + w > atlas_size:
            current_x = 0
            current_y += row_height
            row_height = 0
        
        # Paste sprite
        atlas.paste(Image.fromarray(grid), (current_x, current_y))
        
        # Record frame data
        frames[name] = {
            "frame": {"x": current_x, "y": current_y, "w": w, "h": h},
            "anchor": get_anchor(name)  # From config
        }
        
        current_x += w
        row_height = max(row_height, h)
    
    return atlas, frames
```

### 3. Validation Pipeline
**Pre-Generation Checks:**
```python
def validate_config(config: Dict) -> List[str]:
    errors = []
    
    for asset_name, asset_data in flatten_config(config):
        # Check 1: Size divisible by 4
        if asset_data.size[0] % 4 != 0 or asset_data.size[1] % 4 != 0:
            errors.append(f"{asset_name}: Size must be divisible by 4")
        
        # Check 2: Mobile GPU limit
        if max(asset_data.size) > 128:
            errors.append(f"{asset_name}: Max dimension is 128px")
        
        # Check 3: Palette contrast
        if not check_contrast_ratio(asset_data.palette, min_ratio=3.0):
            errors.append(f"{asset_name}: Palette fails WCAG AA (3:1)")
    
    return errors
```

## State Transitions
```
[IDLE] 
  â†" (script invoked)
[VALIDATING] 
  â†" (errors found) → [ERROR] → Exit(1)
  â†" (valid)
[GENERATING] 
  â†" (foreach asset)
  â"œâ"€â"€ [NOISE_GEN] → [PIXEL_FILL] → [EDGE_DETECT]
  â""â"€â"€ (all done)
[PACKING] 
  â†" (shelf algorithm)
[WRITING] 
  â†" (PNG + JSON)
[SUCCESS] → Exit(0)
```

## Error Handling
- **Invalid Config:** Exit immediately with schema validation errors
- **Missing Dependencies:** Check for Pillow/numpy on startup
- **Write Failure:** Catch IOError, print path, exit(1)
- **Validation Failure:** Print all errors, suggest fixes, exit(1)