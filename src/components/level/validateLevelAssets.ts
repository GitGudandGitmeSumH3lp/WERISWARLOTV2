// src/level/validateLevelAssets.ts

import { LevelAssetBindings, ValidationResult, ValidationError, AssetRegistry } from './types';

/**
 * Runtime validation of level JSON against loaded asset registry.
 * Follows fail-fast contract: throws on first invalid state.
 * 
 * @param levelData Level JSON with asset bindings
 * @param registry AssetRegistry instance (or mock for testing)
 * @returns ValidationResult with detailed errors
 */
export function validateLevelAssets(
  levelData: LevelAssetBindings,
  registry: AssetRegistry
): ValidationResult {
  const errors: ValidationError[] = [];

  // 1. Check ground tile
  if (!registry.has(levelData.scenery.ground_tile)) {
    errors.push({
      type: "missing_asset",
      message: `Asset '${levelData.scenery.ground_tile}' not found in registry`,
      path: "scenery.ground_tile"
    });
  }

  // 2. Check background props
  levelData.scenery.background_props.forEach((prop, index) => {
    if (!registry.has(prop)) {
      errors.push({
        type: "missing_asset",
        message: `Asset '${prop}' not found in registry`,
        path: `scenery.background_props[${index}]`
      });
    }
  });

  // 3. Check spawn zones
  levelData.spawn_zones.forEach((zone, zoneIndex) => {
    // Check asset pool
    if (zone.asset_pool) {
      if (zone.asset_pool.length === 0) {
        errors.push({
          type: "empty_pool",
          message: "Asset pool cannot be empty",
          path: `spawn_zones[${zoneIndex}].asset_pool`
        });
      } else {
        zone.asset_pool.forEach((asset, assetIndex) => {
          if (!registry.has(asset)) {
            errors.push({
              type: "missing_asset",
              message: `Asset '${asset}' not found in registry`,
              path: `spawn_zones[${zoneIndex}].asset_pool[${assetIndex}]`
            });
          }
        });
      }
    }

    // Check required asset
    if (zone.required_asset && !registry.has(zone.required_asset)) {
      errors.push({
        type: "missing_asset",
        message: `Required asset '${zone.required_asset}' not found in registry`,
        path: `spawn_zones[${zoneIndex}].required_asset`
      });
    }
  });

  // 4. Check vignettes
  levelData.vignettes.forEach((vignette, vignetteIndex) => {
    vignette.props.forEach((prop, propIndex) => {
      // Check asset exists
      if (!registry.has(prop.asset)) {
        errors.push({
          type: "missing_asset",
          message: `Asset '${prop.asset}' not found in registry`,
          path: `vignettes[${vignetteIndex}].props[${propIndex}].asset`
        });
      }

      // Check layer range
      if (prop.layer < 0 || prop.layer > 10) {
        errors.push({
          type: "invalid_layer",
          message: `Layer value ${prop.layer} out of range (must be 0-10)`,
          path: `vignettes[${vignetteIndex}].props[${propIndex}].layer`
        });
      }
    });
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

// Basic smoke test
if (typeof window !== 'undefined' && (window as any).RUN_SMOKE_TEST) {
  console.log('🧪 Running validateLevelAssets smoke test...');
  
  const mockRegistry: AssetRegistry = {
    has(name: string) {
      return name.startsWith('valid_');
    }
  };

  const testLevel: LevelAssetBindings = {
    level_id: 'test',
    scenery: {
      ground_tile: 'valid_ground',
      background_props: ['valid_prop1', 'valid_prop2']
    },
    spawn_zones: [
      {
        type: 'civilian',
        x: 100,
        y: 100,
        radius: 50,
        asset_pool: ['valid_npc1', 'valid_npc2']
      }
    ],
    vignettes: [
      {
        id: 'v1',
        props: [
          { asset: 'valid_blood', offset: { x: 0, y: 0 }, layer: 0 },
          { asset: 'valid_weapon', offset: { x: 10, y: 10 }, layer: 2 }
        ]
      }
    ]
  };

  const result = validateLevelAssets(testLevel, mockRegistry);
  console.log('✅ Smoke test passed:', result.valid, 'errors:', result.errors.length);
}