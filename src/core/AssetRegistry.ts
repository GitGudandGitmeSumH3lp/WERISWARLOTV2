import * as PIXI from 'pixi.js';

type AssetType = 'tile' | 'prop' | 'npc';
declare var process: { env: { NODE_ENV: string } }; // Quick inline shim if types are missing

interface AssetMetadata {
  texture: PIXI.Texture;
  anchor: { x: number; y: number };
  scale: number;
  type: AssetType;
}

interface ManifestFrame {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface ManifestMetadata {
  anchor?: { x: number; y: number };
  type?: AssetType;
}

interface SpriteManifest {
  spritesheet: string;
  frames: Record<string, ManifestFrame>;
  metadata?: Record<string, ManifestMetadata>;
}

/**
 * Centralized asset loading and sprite factory for PixiJS textures.
 * 
 * Usage:
 * 1. Initialize: `await AssetRegistry.load('/sprite_manifest.json')`
 * 2. Create sprites: `const sprite = AssetRegistry.createSprite('bench')`
 * 
 * All sprites created have `scale=4` and `zIndex=y` pre-applied.
 */
export class AssetRegistry {
  private static cache: Map<string, AssetMetadata> = new Map();
  private static initialized: boolean = false;

  /**
   * Load sprite manifest and build texture cache.
   * Must be called before any other methods.
   * 
   * @param manifestPath Path to sprite_manifest.json
   * @throws Error if manifest is invalid or fails to load
   */
  static async load(manifestPath: string): Promise<void> {
    if (this.initialized) {
      console.warn('AssetRegistry already initialized. Skipping reload.');
      return;
    }

    try {
      // Fetch manifest
      const response = await fetch(manifestPath);
      if (!response.ok) {
        throw new Error(`Failed to load manifest: ${response.statusText}`);
      }
      const manifest: SpriteManifest = await response.json();

      // Validate structure
      if (!manifest.spritesheet || !manifest.frames) {
        throw new Error('Invalid manifest: missing "spritesheet" or "frames"');
      }

      // Load spritesheet
      const baseTexture = await PIXI.Assets.load(manifest.spritesheet);

      // Build cache
      for (const [name, frame] of Object.entries(manifest.frames)) {
        const rectangle = new PIXI.Rectangle(frame.x, frame.y, frame.w, frame.h);
        // --- FIX START ---
        // PixiJS v8 Texture Constructor Fix
        const texture = new PIXI.Texture({
            source: baseTexture,
            frame: rectangle
        });
        // --- FIX END ---

        const metadata = manifest.metadata?.[name];
        this.cache.set(name, {
          texture,
          anchor: metadata?.anchor || { x: 0.5, y: 0.5 },
          scale: 4, // From system.md
          type: metadata?.type || 'prop'
        });
      }

      this.initialized = true;
      console.log(`AssetRegistry loaded ${this.cache.size} assets`);

      // Debug logging in development
      if (process.env.NODE_ENV === 'development') {
        console.table([
          { Type: 'tile', Count: this.listAssets({ type: 'tile' }).length },
          { Type: 'prop', Count: this.listAssets({ type: 'prop' }).length },
          { Type: 'npc', Count: this.listAssets({ type: 'npc' }).length }
        ]);
      }
    } catch (error) {
      console.error('AssetRegistry initialization failed:', error);
      throw error; // Propagate to caller
    }
  }

  /**
   * Get metadata for an asset.
   * 
   * @param name Asset name (e.g., "bench", "civilian_male_01")
   * @returns AssetMetadata object
   * @throws Error if registry not initialized or asset not found
   */
  static get(name: string): AssetMetadata {
    if (!this.initialized) {
      throw new Error('AssetRegistry not initialized. Call load() first.');
    }

    const metadata = this.cache.get(name);
    if (!metadata) {
      throw new Error(`Asset "${name}" not found in registry`);
    }

    return metadata;
  }

  /**
   * Create a configured PIXI.Sprite instance for an asset.
   * 
   * @param name Asset name
   * @returns Configured PIXI.Sprite with scale=4 and zIndex=y applied
   * @throws Error if asset not found
   */
  static createSprite(name: string): PIXI.Sprite {
    const meta = this.get(name); // Throws if not found

    const sprite = new PIXI.Sprite(meta.texture);
    sprite.anchor.set(meta.anchor.x, meta.anchor.y);
    sprite.scale.set(meta.scale);
    sprite.zIndex = sprite.y; // Y-sorting from system.md

    return sprite;
  }

  /**
   * Check if an asset exists in the registry.
   * 
   * @param name Asset name
   * @returns true if asset exists, false otherwise
   */
  static has(name: string): boolean {
    return this.cache.has(name);
  }

  /**
   * List assets, optionally filtered by type.
   * 
   * @param filter Optional type filter
   * @returns Array of asset names
   */
  static listAssets(filter?: { type?: AssetType }): string[] {
    const names = Array.from(this.cache.keys());

    if (!filter?.type) {
      return names;
    }

    return names.filter(name => {
      const meta = this.cache.get(name)!;
      return meta.type === filter.type;
    });
  }

  /**
   * Get initialization status.
   * 
   * @returns true if registry is loaded and ready
   */
  static isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get total number of loaded assets.
   * 
   * @returns Count of assets in cache
   */
  static getAssetCount(): number {
    return this.cache.size;
  }
}

// Test hook
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Expose for manual testing
  (window as any).AssetRegistry = AssetRegistry;
  
   const isJest = typeof (globalThis as any).jest !== 'undefined';
  // Simple smoke test when imported directly
 if (!isJest) {
    console.log('AssetRegistry module loaded successfully.');
    console.log('Manual test commands:');
    console.log('1. await AssetRegistry.load("/test_manifest.json")');
    console.log('2. AssetRegistry.createSprite("test_prop")');
    console.log('3. AssetRegistry.listAssets()');
  }
}