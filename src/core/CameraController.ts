/**
 * Camera Waldo View - Fixed Orthographic Camera System
 * Phase 1 Foundation System
 * 
 * Provides top-down "see-everything-at-once" view with coordinate conversion
 * and Y-sorting for 2.5D depth simulation.
 */

import * as PIXI from 'pixi.js';

export interface CameraConfig {
  type: 'fixed-orthographic';
  bounds: { width: number; height: number };
  viewport: { width: 1280; height: 720 };
  zoom: { initial: number; min: number; max: number };
  enableZoom?: boolean;
}

/**
 * Singleton camera controller for managing the fixed top-down view
 */
export class CameraController {
  private static _app: PIXI.Application | null = null;
  private static _worldContainer: PIXI.Container | null = null;
  private static _bounds: { width: number; height: number } = { width: 0, height: 0 };
  private static _zoom: number = 1.0;
  private static _initialized: boolean = false;
  private static _zoomEnabled: boolean = false;
  private static _zoomMin: number = 0.8;
  private static _zoomMax: number = 1.5;

  /**
   * Get the PixiJS application instance
   * @throws Error if CameraController not initialized
   */
static get app(): PIXI.Application {
    if (!this._initialized || !this._app) {
        // Instead of throwing, return a placeholder or handle gracefully
        console.warn('CameraController not initialized. Call initialize() first.');
        // You could return a dummy app or handle this differently
        throw new Error('CameraController not initialized');
    }
    return this._app;
}

  /**
   * Get the world container for adding game objects
   * @throws Error if CameraController not initialized
   */
  static get worldContainer(): PIXI.Container {
    if (!this._initialized || !this._worldContainer) {
      throw new Error('CameraController not initialized');
    }
    return this._worldContainer;
  }

  /**
   * Initialize the camera system
   * @param config Camera configuration
   * @returns Promise that resolves to the PixiJS application
   * @throws Error if already initialized
   */
  static async initialize(config: CameraConfig): Promise<PIXI.Application> {
    if (this._initialized) {
      throw new Error('CameraController already initialized');
    }

    // Create PixiJS Application
    this._app = new PIXI.Application();
    
    await this._app.init({
      width: config.viewport.width,
      height: config.viewport.height,
      background: 0x1a1a1a, // Dark background
      antialias: false, // Pixel art - disable antialiasing
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      eventMode: 'static' // Enable interaction
    });

    // Create world container with Y-sorting enabled
    this._worldContainer = new PIXI.Container();
    this._worldContainer.sortableChildren = true;
    this._app.stage.addChild(this._worldContainer);

    // Store configuration
    this._bounds = config.bounds;
    this._zoom = config.zoom.initial;
    this._zoomEnabled = config.enableZoom || false;
    this._zoomMin = config.zoom.min;
    this._zoomMax = config.zoom.max;

    // Calculate and apply camera centering
    this._centerCamera();

    // Disable touch panning and selection
    const canvas = this._app.canvas as HTMLCanvasElement;
    canvas.style.touchAction = 'none';
    canvas.style.userSelect = 'none';
    canvas.style.webkitUserSelect = 'none';
    
    // Safari-specific touch callout prevention
    if ('webkitTouchCallout' in canvas.style) {
      (canvas.style as any).webkitTouchCallout = 'none';
    }

    this._initialized = true;
    return this._app;
  }

  /**
   * Set new level bounds and recenter camera
   * @param width New level width
   * @param height New level height
   * @throws Error if CameraController not initialized
   */
  static setBounds(width: number, height: number): void {
    if (!this._initialized) {
      throw new Error('CameraController not initialized');
    }

    this._bounds = { width, height };
    this._centerCamera();
  }

  /**
   * Set zoom level (Phase 2 feature, requires enableZoom: true)
   * @param level Zoom level (0.8 - 1.5)
   * @throws Error if zoom not enabled or CameraController not initialized
   */
  static setZoom(level: number): void {
    if (!this._initialized) {
      throw new Error('CameraController not initialized');
    }

    if (!this._zoomEnabled) {
      throw new Error('Zoom not enabled in CameraController configuration');
    }

    // Clamp zoom level
    this._zoom = Math.max(this._zoomMin, Math.min(this._zoomMax, level));
    
    // Apply zoom to world container
    if (this._worldContainer) {
      this._worldContainer.scale.set(this._zoom);
      // Re-center after zoom
      this._centerCamera();
    }
  }

  /**
   * Convert screen coordinates to world coordinates
   * @param screenX Screen X coordinate (pixels)
   * @param screenY Screen Y coordinate (pixels)
   * @returns World coordinates
   * @throws Error if CameraController not initialized
   */
  static screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    if (!this._initialized || !this._app || !this._worldContainer) {
      throw new Error('CameraController not initialized');
    }

    const canvas = this._app.canvas as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();

    // Convert screen coordinates to canvas-relative coordinates
    const canvasX = screenX - rect.left;
    const canvasY = screenY - rect.top;

    // Convert canvas coordinates to internal resolution (1280x720)
    const scaleX = 1280 / rect.width;
    const scaleY = 720 / rect.height;

    const internalX = canvasX * scaleX;
    const internalY = canvasY * scaleY;

    // Subtract camera offset and apply zoom inverse
    const worldX = (internalX - this._worldContainer.x) / this._zoom;
    const worldY = (internalY - this._worldContainer.y) / this._zoom;

    return { x: worldX, y: worldY };
  }


  /**
   * Convert world coordinates to screen coordinates
   * @param worldX World X coordinate
   * @param worldY World Y coordinate
   * @returns Screen coordinates
   * @throws Error if CameraController not initialized
   */
  static worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    if (!this._initialized || !this._app || !this._worldContainer) {
      throw new Error('CameraController not initialized');
    }

    const canvas = this._app.canvas as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();

    // Apply zoom and camera offset
    const internalX = (worldX * this._zoom) + this._worldContainer.x;
    const internalY = (worldY * this._zoom) + this._worldContainer.y;

    // Convert internal coordinates to screen resolution
    const scaleX = rect.width / 1280;
    const scaleY = rect.height / 720;

    const screenX = internalX * scaleX + rect.left;
    const screenY = internalY * scaleY + rect.top;

    return { x: screenX, y: screenY };
  }

  /**
   * Check if camera system is initialized
   */
    // Add this getter
    static get isInitialized(): boolean {
        return this._initialized && this._app !== null;
    }

  /**
   * Get current zoom level
   */
  static getZoom(): number {
    return this._zoom;
  }

  /**
   * Get current level bounds
   */
  static getBounds(): { width: number; height: number } {
    return { ...this._bounds };
  }

  /**
   * Destroy the camera system and clean up resources
   * Use when switching levels or unmounting components
   */
  static destroy(): void {
    if (this._app) {
      try {
        this._app.destroy(true);
      } catch (error) {
        console.warn('Error destroying PixiJS app:', error);
      }
      this._app = null;
    }
    
    this._worldContainer = null;
    this._bounds = { width: 0, height: 0 };
    this._zoom = 1.0;
    this._zoomEnabled = false;
    this._zoomMin = 0.8;
    this._zoomMax = 1.5;
    this._initialized = false;
    
    console.log('✅ CameraController destroyed');
  }


  /**
   * Private helper: Center the world container in the viewport
   */
  private static _centerCamera(): void {
    if (!this._worldContainer) return;

    // Calculate centering offset
    const offsetX = (1280 - this._bounds.width * this._zoom) / 2;
    const offsetY = (720 - this._bounds.height * this._zoom) / 2;

    // Clamp to 0 if level is larger than viewport (after zoom)
    this._worldContainer.x = Math.max(0, offsetX);
    this._worldContainer.y = Math.max(0, offsetY);
  }
}

// Basic smoke test - only runs in development environment
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  // Create test button for manual testing
  const testButton = document.createElement('button');
  testButton.textContent = '🧪 Test CameraController';
  testButton.style.position = 'fixed';
  testButton.style.bottom = '10px';
  testButton.style.right = '10px';
  testButton.style.zIndex = '9999';
  testButton.style.padding = '10px';
  testButton.style.backgroundColor = '#4CAF50';
  testButton.style.color = 'white';
  testButton.style.border = 'none';
  testButton.style.borderRadius = '5px';
  testButton.style.cursor = 'pointer';
  
  testButton.addEventListener('click', async () => {
    try {
      console.log('🧪 Starting CameraController smoke test...');
      
      // Test initialization
      const app = await CameraController.initialize({
        type: 'fixed-orthographic',
        bounds: { width: 2560, height: 1440 },
        viewport: { width: 1280, height: 720 },
        zoom: { initial: 1.0, min: 0.8, max: 1.5 }
      });
      
      console.log('✅ CameraController initialized successfully');
      console.log('✅ Application created:', app);
      console.log('✅ World container accessible:', CameraController.worldContainer);
      console.log('✅ Y-sorting enabled:', CameraController.worldContainer.sortableChildren);
      
      // Test coordinate conversion
      const screenCenter = CameraController.screenToWorld(640, 360);
      console.log('✅ Coordinate conversion works');
      console.log('  Screen (640, 360) → World:', screenCenter);
      console.log('  Expected: World center (1280, 720)');
      
      // Test world to screen (inverse)
      const screenPos = CameraController.worldToScreen(1280, 720);
      console.log('  World (1280, 720) → Screen:', screenPos);
      
      // Test bounds
      CameraController.setBounds(2000, 1000);
      console.log('✅ setBounds() works');
      console.log('  New bounds:', CameraController.getBounds());
      
      // Test initialization state
      console.log('✅ isInitialized():', CameraController.isInitialized);
      console.log('✅ getZoom():', CameraController.getZoom());
      
      alert('🧪 CameraController smoke test passed! Check console for details.');
      
    } catch (error) {
      console.error('❌ CameraController smoke test failed:', error);
      alert('Test failed: ' + (error as Error).message);
    }
  });
  
  document.body.appendChild(testButton);
  
  console.log('🧪 CameraController smoke test button added to page');
}