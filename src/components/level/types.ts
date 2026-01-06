// src/level/types.ts

/**
 * Core level data structure with asset bindings.
 * Extends the base Level Schema (to be defined later).
 */
export interface LevelAssetBindings {
  level_id: string;
  
  scenery: {
    ground_tile: string;        // Asset name from sprite_manifest.json
    background_props: string[]; // Array of prop asset names
  };
  
  spawn_zones: SpawnZone[];
  vignettes: Vignette[];
}

export interface SpawnZone {
  type: "civilian" | "killer" | "vignette";
  x: number;
  y: number;
  radius: number;
  
  // Asset overrides
  asset_pool?: string[];   // Random selection pool
  required_asset?: string; // Force specific sprite (e.g., killer)
}

export interface Vignette {
  id: string;
  props: VignetteProp[];
}

export interface VignetteProp {
  asset: string;                // Asset name
  offset: { x: number; y: number };
  layer: number;                // Stacking order (0-10)
}

// Validation result types
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  type: "missing_asset" | "invalid_layer" | "empty_pool";
  message: string;
  path: string;  // JSON path to error (e.g., "spawn_zones[0].required_asset")
}

// Asset Registry type (minimal interface for dependency injection)
export interface AssetRegistry {
  has(name: string): boolean;
}