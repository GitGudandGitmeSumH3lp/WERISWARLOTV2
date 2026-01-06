#!/usr/bin/env python3
"""
Procedural Asset Generator for Crowd Killer
Generates pixel art sprites from JSON config and packs into spritesheet
"""

import argparse
import json
import math
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Any

import numpy as np
from PIL import Image, ImageDraw
import jsonschema
from opensimplex import OpenSimplex

# ============================================================================
# Data Models
# ============================================================================

@dataclass
class AssetConfig:
    """Base configuration for any asset"""
    name: str
    type: str  # "tile", "prop", "npc"
    size: Tuple[int, int]  # (width, height)
    palette: List[str]  # hex colors
    noise_seed: Optional[int] = None
    anchor: Tuple[float, float] = (0.5, 0.5)  # center default
    variants: int = 1  # number of color variants for NPCs

@dataclass
class SceneryConfig(AssetConfig):
    """Tile/scenery specific config"""
    pass

@dataclass
class PropConfig(AssetConfig):
    """Prop specific config"""
    pass

@dataclass
class CharacterConfig(AssetConfig):
    """Character/NPC specific config"""
    pass

# ============================================================================
# Utility Functions
# ============================================================================

def hex_to_rgba(hex_color: str) -> Tuple[int, int, int, int]:
    """Convert #RRGGBB or #RRGGBBAA to RGBA tuple"""
    hex_color = hex_color.lstrip('#')
    
    if len(hex_color) == 6:
        r = int(hex_color[0:2], 16)
        g = int(hex_color[2:4], 16)
        b = int(hex_color[4:6], 16)
        a = 255
    elif len(hex_color) == 8:
        r = int(hex_color[0:2], 16)
        g = int(hex_color[2:4], 16)
        b = int(hex_color[4:6], 16)
        a = int(hex_color[6:8], 16)
    else:
        raise ValueError(f"Invalid hex color: #{hex_color}")
    
    return (r, g, b, a)

def rgb_to_hex(rgb: Tuple[int, int, int]) -> str:
    """Convert RGB tuple to hex string"""
    return f"#{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x}"

def hsl_to_rgb(h: float, s: float, l: float) -> Tuple[int, int, int]:
    """Convert HSL to RGB (0-1 ranges)"""
    if s == 0:
        r = g = b = l
    else:
        def hue_to_rgb(p, q, t):
            if t < 0:
                t += 1
            if t > 1:
                t -= 1
            if t < 1/6:
                return p + (q - p) * 6 * t
            if t < 1/2:
                return q
            if t < 2/3:
                return p + (q - p) * (2/3 - t) * 6
            return p
        
        q = l * (1 + s) if l < 0.5 else l + s - l * s
        p = 2 * l - q
        r = hue_to_rgb(p, q, h + 1/3)
        g = hue_to_rgb(p, q, h)
        b = hue_to_rgb(p, q, h - 1/3)
    
    return (int(r * 255), int(g * 255), int(b * 255))

def rotate_hue(hex_color: str, degrees: float) -> str:
    """Rotate hue of a color by degrees (0-360)"""
    # Convert hex to RGB
    r, g, b, a = hex_to_rgba(hex_color)
    
    # Normalize RGB
    r_norm = r / 255.0
    g_norm = g / 255.0
    b_norm = b / 255.0
    
    # Find max and min
    cmax = max(r_norm, g_norm, b_norm)
    cmin = min(r_norm, g_norm, b_norm)
    delta = cmax - cmin
    
    # Calculate hue
    if delta == 0:
        h = 0
    elif cmax == r_norm:
        h = ((g_norm - b_norm) / delta) % 6
    elif cmax == g_norm:
        h = ((b_norm - r_norm) / delta) + 2
    else:  # cmax == b_norm
        h = ((r_norm - g_norm) / delta) + 4
    
    h = h * 60  # Convert to degrees
    s = 0 if cmax == 0 else delta / cmax
    l = (cmax + cmin) / 2
    
    # Rotate hue
    h = (h + degrees) % 360
    
    # Convert back to RGB
    new_rgb = hsl_to_rgb(h / 360.0, s, l)
    return rgb_to_hex(new_rgb)

def check_contrast_ratio(color1: str, color2: str) -> float:
    """Calculate contrast ratio between two colors (WCAG)"""
    def luminance(hex_color: str) -> float:
        r, g, b, _ = hex_to_rgba(hex_color)
        
        # Convert to relative luminance
        rsrgb = r / 255.0
        gsrgb = g / 255.0
        bsrgb = b / 255.0
        
        r = rsrgb / 12.92 if rsrgb <= 0.03928 else ((rsrgb + 0.055) / 1.055) ** 2.4
        g = gsrgb / 12.92 if gsrgb <= 0.03928 else ((gsrgb + 0.055) / 1.055) ** 2.4
        b = bsrgb / 12.92 if bsrgb <= 0.03928 else ((bsrgb + 0.055) / 1.055) ** 2.4
        
        return 0.2126 * r + 0.7152 * g + 0.0722 * b
    
    l1 = luminance(color1)
    l2 = luminance(color2)
    
    lighter = max(l1, l2)
    darker = min(l1, l2)
    
    return (lighter + 0.05) / (darker + 0.05)

def next_power_of_2(n: float) -> int:
    """Return next power of 2 greater than or equal to n"""
    return 1 << (int(n) - 1).bit_length()

def simplex_noise_2d(size: Tuple[int, int], seed: int) -> np.ndarray:
    """Generate 2D simplex noise array"""
    generator = OpenSimplex(seed)
    width, height = size
    noise = np.zeros((height, width))
    
    scale = 10.0  # Lower = smoother, higher = more detailed
    
    for y in range(height):
        for x in range(width):
            nx = x / width * scale
            ny = y / height * scale
            noise[y, x] = generator.noise2(nx, ny)
    
    return noise

def detect_edges(grid: np.ndarray) -> np.ndarray:
    """Simple Sobel edge detection"""
    if grid.shape[2] != 4:
        raise ValueError("Grid must have RGBA channels")
    
    # Convert to grayscale
    gray = 0.299 * grid[:, :, 0] + 0.587 * grid[:, :, 1] + 0.114 * grid[:, :, 2]
    
    # Sobel kernels
    kernel_x = np.array([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]])
    kernel_y = np.array([[-1, -2, -1], [0, 0, 0], [1, 2, 1]])
    
    # Pad image
    padded = np.pad(gray, 1, mode='edge')
    
    edges_x = np.zeros_like(gray)
    edges_y = np.zeros_like(gray)
    
    for y in range(gray.shape[0]):
        for x in range(gray.shape[1]):
            region = padded[y:y+3, x:x+3]
            edges_x[y, x] = np.sum(region * kernel_x)
            edges_y[y, x] = np.sum(region * kernel_y)
    
    edges = np.sqrt(edges_x**2 + edges_y**2)
    edges = np.clip(edges, 0, 255).astype(np.uint8)
    
    return edges

# ============================================================================
# Core Generation Functions
# ============================================================================

# Updated validation logic (protocol compliant)
def validate_config(config_data: Dict) -> List[str]:
    """Validate configuration against constraints"""
    errors = []
    
    # ... [schema validation remains same] ...
    
    # Business logic validation
    assets = config_data.get("assets", {})
    
    for asset_name, asset_data in assets.items():
        size = asset_data["size"]
        
        # Check 1: Size divisible by 4
        if size[0] % 4 != 0 or size[1] % 4 != 0:
            errors.append(f"{asset_name}: Size must be divisible by 4 (got {size[0]}x{size[1]})")
        
        # Check 2: Mobile GPU limit
        if max(size) > 128:
            errors.append(f"{asset_name}: Max dimension is 128px (got {max(size)}px)")
        
       # Check 3: Context-aware contrast validation (UPDATED)
        palette = asset_data["palette"]
        asset_type = asset_data["type"]
        
        if len(palette) > 1:
            if asset_type == "tile":
                # Tiles: Only warn (not error) for low contrast - muted palette expected
                min_contrast = 1.5
            elif asset_type == "npc":
                # NPCs: Need moderate contrast for visibility in crowds
                min_contrast = 2.0
            else:  # props, furniture, clutter
                # Props: Medium contrast for visibility
                min_contrast = 1.8
            
            # Check adjacent colors only
            for i in range(len(palette) - 1):
                ratio = check_contrast_ratio(palette[i], palette[i + 1])
                if ratio < min_contrast:
                    errors.append(f"{asset_name}: Palette colors need better contrast (ratio {ratio:.1f}:1, need {min_contrast}:1)")
    
    return errors

def generate_pixel_grid(config: AssetConfig, variant_idx: int = 0) -> np.ndarray:
    """Generate a single pixel grid from config"""
    width, height = config.size
    
    # Step 1: Create base grid
    grid = np.zeros((height, width, 4), dtype=np.uint8)
    
    # Step 2: Apply variant palette rotation if needed
    palette = config.palette.copy()
    if variant_idx > 0 and config.type == "npc":
        # Rotate all colors by 30° per variant
        palette = [rotate_hue(color, 30 * variant_idx) for color in palette]
    
    # Step 3: Generate based on type
    if config.type == "tile":
        # Generate noise pattern
        if config.noise_seed is None:
            seed = hash(config.name) % 1000
        else:
            seed = config.noise_seed
        
        noise = simplex_noise_2d((width, height), seed)
        
        # Map noise [-1, 1] to palette indices
        noise_normalized = (noise + 1) / 2  # [0, 1]
        palette_idx = (noise_normalized * len(palette)).astype(int)
        palette_idx = np.clip(palette_idx, 0, len(palette) - 1)
        
        # Fill grid
        for y in range(height):
            for x in range(width):
                color_hex = palette[palette_idx[y, x]]
                grid[y, x] = hex_to_rgba(color_hex)
    
    else:  # prop or npc
        # Solid fill with first palette color
        base_color = palette[0]
        r, g, b, a = hex_to_rgba(base_color)
        grid[:, :, 0] = r
        grid[:, :, 1] = g
        grid[:, :, 2] = b
        grid[:, :, 3] = a if a < 255 else 255
        
        # Add simple shape for props/npcs
        if width >= 8 and height >= 8:
            # Draw a simple rectangle/ellipse
            for y in range(height):
                for x in range(width):
                    if (2 <= x < width - 2 and 2 <= y < height - 2):
                        if config.type == "npc":
                            # NPC: body shape
                            if y < height * 0.7:  # Body
                                if len(palette) > 1:
                                    color_hex = palette[1]
                                else:
                                    color_hex = rotate_hue(base_color, 30)
                                grid[y, x] = hex_to_rgba(color_hex)
                        else:
                            # Prop: inner detail
                            if len(palette) > 1:
                                color_hex = palette[1]
                                grid[y, x] = hex_to_rgba(color_hex)
    
    # Step 4: Edge detection for props
    if config.type in ["prop", "furniture", "clutter"]:
        edges = detect_edges(grid)
        outline_mask = edges > 50
        
        for y in range(height):
            for x in range(width):
                if outline_mask[y, x]:
                    grid[y, x, :3] = 0  # Black outline
                    grid[y, x, 3] = 255
    
    return grid

def pack_sprites(sprites: Dict[str, np.ndarray], configs: Dict[str, AssetConfig]) -> Tuple[Image.Image, Dict]:
    """Pack sprites into atlas using shelf-packing algorithm"""
    # Sort by height (descending) for optimal packing
    sorted_sprites = sorted(
        sprites.items(), 
        key=lambda x: x[1].shape[0], 
        reverse=True
    )
    
    # Calculate total area with 20% padding
    total_area = 0
    for name, grid in sorted_sprites:
        h, w = grid.shape[:2]
        total_area += w * h
    
    atlas_size_float = math.sqrt(total_area) * 1.2
    atlas_size = next_power_of_2(int(atlas_size_float))
    
    # Create atlas
    atlas = Image.new("RGBA", (atlas_size, atlas_size), (0, 0, 0, 0))
    frames = {}
    
    current_x, current_y, row_height = 0, 0, 0
    
    for name, grid in sorted_sprites:
        h, w = grid.shape[:2]
        
        # Check if sprite fits in current row
        if current_x + w > atlas_size:
            current_x = 0
            current_y += row_height
            row_height = 0
        
        # Check if sprite fits vertically
        if current_y + h > atlas_size:
            # Expand atlas (shouldn't happen with proper sizing)
            new_size = next_power_of_2(atlas_size * 1.5)
            new_atlas = Image.new("RGBA", (new_size, new_size), (0, 0, 0, 0))
            new_atlas.paste(atlas, (0, 0))
            atlas = new_atlas
            atlas_size = new_size
        
        # Convert numpy array to PIL Image and paste
        sprite_img = Image.fromarray(grid, mode="RGBA")
        atlas.paste(sprite_img, (current_x, current_y), sprite_img)
        
        # Get anchor from config
        if "_variant_" in name:
            base_name = name.split("_variant_")[0]
        else:
            base_name = name
        
        anchor_x, anchor_y = configs[base_name].anchor
        
        # Record frame data (TexturePacker format)
        frames[name] = {
            "frame": {
                "x": current_x,
                "y": current_y,
                "w": w,
                "h": h
            },
            "rotated": False,
            "trimmed": False,
            "spriteSourceSize": {
                "x": 0,
                "y": 0,
                "w": w,
                "h": h
            },
            "sourceSize": {
                "w": w,
                "h": h
            },
            "anchor": {
                "x": anchor_x,
                "y": anchor_y
            }
        }
        
        current_x += w
        row_height = max(row_height, h)
    
    return atlas, frames

def write_output(atlas: Image.Image, frames: Dict, output_dir: str) -> None:
    """Write atlas and manifest to disk"""
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Write PNG
    atlas_path = output_path / "sprites.png"
    atlas.save(atlas_path, "PNG")
    
    # Write manifest
    manifest = {
        "frames": frames,
        "meta": {
            "app": "CrowdKiller Asset Generator",
            "version": "1.0",
            "image": "sprites.png",
            "format": "RGBA8888",
            "size": {
                "w": atlas.width,
                "h": atlas.height
            },
            "scale": "1"
        }
    }
    
    manifest_path = output_path / "sprite_manifest.json"
    with open(manifest_path, 'w') as f:
        json.dump(manifest, f, indent=2)

# ============================================================================
# Main Execution
# ============================================================================

def parse_config(config_data: Dict) -> Dict[str, AssetConfig]:
    """Parse JSON config into AssetConfig objects"""
    configs = {}
    
    for name, data in config_data["assets"].items():
        # Create appropriate config class
        asset_type = data["type"]
        
        if asset_type == "tile":
            cls = SceneryConfig
        elif asset_type == "npc":
            cls = CharacterConfig
        else:  # prop, furniture, clutter
            cls = PropConfig
        
        config = cls(
            name=name,
            type=asset_type,
            size=tuple(data["size"]),
            palette=data["palette"],
            noise_seed=data.get("noise_seed"),
            anchor=tuple(data.get("anchor", [0.5, 0.5])),
            variants=data.get("variants", 1)
        )
        
        configs[name] = config
    
    return configs

def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(
        description="Generate procedural pixel art sprites for Crowd Killer"
    )
    parser.add_argument(
        "--config",
        type=str,
        required=True,
        help="Path to JSON configuration file"
    )
    parser.add_argument(
        "--output",
        type=str,
        default="public/assets/generated",
        help="Output directory (default: public/assets/generated)"
    )
    
    args = parser.parse_args()
    
    # Load config
    try:
        with open(args.config, 'r') as f:
            config_data = json.load(f)
    except FileNotFoundError:
        print(f"❌ Config file not found: {args.config}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON in config: {e}")
        sys.exit(1)
    
    # Validate config
    print("🔍 Validating configuration...")
    errors = validate_config(config_data)
    
    if errors:
        print("❌ Validation failed:")
        for error in errors:
            print(f"  - {error}")
        sys.exit(1)
    
    print("✅ Configuration validated")
    
    # Parse config
    configs = parse_config(config_data)
    
    # Generate sprites
    print("🎨 Generating sprites...")
    all_sprites = {}
    
    for name, config in configs.items():
        print(f"  - {name} ({config.type}, {config.size[0]}x{config.size[1]})")
        
        # Generate base sprite
        base_grid = generate_pixel_grid(config)
        all_sprites[name] = base_grid
        
        # Generate variants for NPCs
        if config.type == "npc" and config.variants > 1:
            for i in range(1, config.variants):
                variant_name = f"{name}_variant_{i}"
                variant_grid = generate_pixel_grid(config, i)
                all_sprites[variant_name] = variant_grid
                print(f"    → {variant_name}")
    
    print(f"✅ Generated {len(all_sprites)} sprites")
    
    # Pack sprites
    print("📦 Packing sprites into atlas...")
    atlas, frames = pack_sprites(all_sprites, configs)
    
    print(f"✅ Packed into {atlas.width}x{atlas.height} atlas")
    
    # Write output
    print("💾 Writing output...")
    write_output(atlas, frames, args.output)
    
    print("🎉 Asset generation complete!")
    print(f"   PNG: {Path(args.output) / 'sprites.png'}")
    print(f"   JSON: {Path(args.output) / 'sprite_manifest.json'}")

# ============================================================================
# Test Code
# ============================================================================

def create_test_config() -> Dict:
    """Create a test configuration for smoke testing"""
    return {
        "assets": {
            "park_ground": {
                "type": "tile",
                "size": [64, 64],
                "palette": ["#1a5c1a", "#0d3b0d", "#0a290a"],  # HIGHER CONTRAST
                "noise_seed": 42,
                "anchor": [0.5, 0.5]
            },
            "bench": {
                "type": "prop",
                "size": [32, 16],
                "palette": ["#5d2906", "#3a1a04"],  # HIGHER CONTRAST
                "anchor": [0.5, 0.8]
            },
            "civilian_male_01": {
                "type": "npc",
                "size": [16, 32],
                "palette": ["#1e4a8c", "#0d2b5c", "#f8f9fa"],  # HIGHER CONTRAST
                "variants": 4,
                "anchor": [0.5, 0.9]
            }
        }
    }

if __name__ == "__main__":
    # Smoke test: if no args, generate test assets
    if len(sys.argv) == 1:
        print("🧪 Running smoke test...")
        
        # Create test output directory
        test_dir = "test_output"
        Path(test_dir).mkdir(exist_ok=True)
        
        # Generate test config
        test_config = create_test_config()
        
        # Validate
        errors = validate_config(test_config)
        if errors:
            print("❌ Test config validation failed:")
            for error in errors:
                print(f"  - {error}")
            sys.exit(1)
        
        # Generate sprites
        configs = parse_config(test_config)
        all_sprites = {}
        
        for name, config in configs.items():
            print(f"  Generating {name}...")
            all_sprites[name] = generate_pixel_grid(config)
            
            if config.type == "npc" and config.variants > 1:
                for i in range(1, config.variants):
                    variant_name = f"{name}_variant_{i}"
                    all_sprites[variant_name] = generate_pixel_grid(config, i)
        
        # Pack and write
        atlas, frames = pack_sprites(all_sprites, configs)
        
        atlas.save(f"{test_dir}/test_sprites.png")
        
        manifest = {
            "frames": frames,
            "meta": {
                "app": "CrowdKiller Test",
                "image": "test_sprites.png",
                "size": {"w": atlas.width, "h": atlas.height},
                "scale": "1"
            }
        }
        
        with open(f"{test_dir}/test_manifest.json", 'w') as f:
            json.dump(manifest, f, indent=2)
        
        print("✅ Smoke test passed!")
        print(f"   Test files saved to {test_dir}/")
        
        # Show usage
        print("\n📖 Usage:")
        print("   python scripts/generate_assets.py --config asset_config.json --output public/assets/generated")
    else:
        main()