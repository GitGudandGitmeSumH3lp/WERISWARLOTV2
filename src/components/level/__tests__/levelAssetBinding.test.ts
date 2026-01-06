// src/level/__tests__/levelAssetBinding.test.ts

import { validateLevelAssets, selectFromAssetPool, calculatePropZIndex } from '../index';
import { LevelAssetBindings } from '../types';

// Mock AssetRegistry for testing
const createMockRegistry = (validAssets: Set<string>) => ({
  has: (name: string) => validAssets.has(name)
});

describe('Level Asset Binding', () => {
  const validAssets = new Set([
    'ground_tile',
    'bench_prop',
    'trashcan_prop',
    'civilian_red',
    'civilian_blue',
    'civilian_green',
    'killer_main',
    'blood_puddle',
    'knife_evidence',
    'document_evidence'
  ]);

  const mockRegistry = createMockRegistry(validAssets);

  const validLevel: LevelAssetBindings = {
    level_id: 'test_park',
    scenery: {
      ground_tile: 'ground_tile',
      background_props: ['bench_prop', 'trashcan_prop']
    },
    spawn_zones: [
      {
        type: 'civilian',
        x: 200,
        y: 300,
        radius: 100,
        asset_pool: ['civilian_red', 'civilian_blue', 'civilian_green']
      },
      {
        type: 'killer',
        x: 500,
        y: 400,
        radius: 50,
        required_asset: 'killer_main'
      }
    ],
    vignettes: [
      {
        id: 'murder_scene',
        props: [
          { asset: 'blood_puddle', offset: { x: 0, y: 0 }, layer: 0 },
          { asset: 'knife_evidence', offset: { x: 15, y: 5 }, layer: 2 },
          { asset: 'document_evidence', offset: { x: -5, y: 10 }, layer: 1 }
        ]
      }
    ]
  };

  test('valid level passes validation', () => {
    const result = validateLevelAssets(validLevel, mockRegistry);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('missing ground tile fails validation', () => {
    const invalidLevel = {
      ...validLevel,
      scenery: { ...validLevel.scenery, ground_tile: 'NONEXISTENT' }
    };
    const result = validateLevelAssets(invalidLevel, mockRegistry);
    expect(result.valid).toBe(false);
    expect(result.errors[0].type).toBe('missing_asset');
    expect(result.errors[0].path).toBe('scenery.ground_tile');
  });

  test('invalid layer value fails validation', () => {
    const invalidLevel = {
      ...validLevel,
      vignettes: [
        {
          id: 'bad_scene',
          props: [{ asset: 'blood_puddle', offset: { x: 0, y: 0 }, layer: 15 }]
        }
      ]
    };
    const result = validateLevelAssets(invalidLevel, mockRegistry);
    expect(result.valid).toBe(false);
    expect(result.errors[0].type).toBe('invalid_layer');
    expect(result.errors[0].path).toContain('layer');
  });

  test('selectFromAssetPool chooses unused assets', () => {
    const pool = ['civilian_red', 'civilian_blue', 'civilian_green'];
    const used = new Set(['civilian_red']);
    
    const selected = selectFromAssetPool(pool, used);
    expect(['civilian_blue', 'civilian_green']).toContain(selected);
    expect(used.has(selected)).toBe(true);
  });

  test('selectFromAssetPool warns when pool exhausted', () => {
    const pool = ['civilian_red', 'civilian_blue'];
    const used = new Set(['civilian_red', 'civilian_blue']);
    
    console.warn = jest.fn(); // Mock console.warn
    const selected = selectFromAssetPool(pool, used);
    expect(pool).toContain(selected);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('exhausted'));
  });

  test('calculatePropZIndex returns correct values', () => {
    expect(calculatePropZIndex(500, 0)).toBe(500);
    expect(calculatePropZIndex(500, 2)).toBe(500.02);
    expect(calculatePropZIndex(300, 10)).toBe(300.10);
    expect(calculatePropZIndex(200, 15)).toBe(200.10); // Clamped
  });
});