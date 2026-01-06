// src/level/assetSelectors.ts

/**
 * Smart asset selection with collision avoidance.
 * 
 * @param pool Array of asset names to choose from
 * @param usedAssets Set of already-used asset names within avoidance radius
 * @param avoidRadius Minimum pixel distance before allowing duplicates (default 100)
 * @returns Selected asset name
 */
export function selectFromAssetPool(
  pool: string[],
  usedAssets: Set<string>,
  avoidRadius = 100
): string {
  if (pool.length === 0) {
    throw new Error('Asset pool cannot be empty');
  }

  // Filter out assets already used within avoidance radius
  const availableAssets = pool.filter(asset => !usedAssets.has(asset));

  let selectedAsset: string;

  if (availableAssets.length === 0) {
    // All assets used, allow duplicates but log warning
    console.warn(`⚠️ Asset pool exhausted (${pool.length} assets), reusing sprites`);
    selectedAsset = pool[Math.floor(Math.random() * pool.length)];
  } else {
    // Random selection from available assets
    const selectedIndex = Math.floor(Math.random() * availableAssets.length);
    selectedAsset = availableAssets[selectedIndex];
  }

  // Track usage for next spawn
  usedAssets.add(selectedAsset);

  return selectedAsset;
}

/**
 * Calculate sub-pixel zIndex for layered props.
 * Ensures deterministic render order within the same Y coordinate.
 * 
 * @param baseY The base Y coordinate of the sprite
 * @param layer The layer value (0-10)
 * @returns zIndex value: baseY + (layer * 0.01)
 */
export function calculatePropZIndex(baseY: number, layer: number): number {
  // Clamp layer to valid range (defensive programming)
  const clampedLayer = Math.max(0, Math.min(10, layer));
  return baseY + (clampedLayer * 0.01);
}

// Basic smoke test
if (typeof window !== 'undefined' && (window as any).RUN_SMOKE_TEST) {
  console.log('🧪 Running assetSelectors smoke test...');
  
  // Test selectFromAssetPool
  const pool = ['asset_a', 'asset_b', 'asset_c'];
  const used = new Set(['asset_a']);
  const selected = selectFromAssetPool(pool, used);
  console.log('✅ Selected asset:', selected, 'Used set:', Array.from(used));
  
  // Test calculatePropZIndex
  const zIndex = calculatePropZIndex(500, 2);
  console.log('✅ Calculated zIndex:', zIndex, 'Expected: 500.02');
  
  // Test edge cases
  const zIndexClamped = calculatePropZIndex(300, 15); // Should clamp to 10
  console.log('✅ Clamped zIndex:', zIndexClamped, 'Expected: 300.10');
}