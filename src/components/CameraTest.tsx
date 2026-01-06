/**
 * Camera System Integration Test Component
 * Demonstrates CameraController usage with AssetRegistry
 */

import { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { CameraController, CameraConfig } from '@/core/CameraController';
import { AssetRegistry } from '@/core/AssetRegistry';

interface CameraTestProps {
  config?: Partial<CameraConfig>;
}

export function CameraTest({ config }: CameraTestProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clickLog, setClickLog] = useState<Array<{x: number, y: number, worldX: number, worldY: number}>>([]);

  // Default configuration
  const defaultConfig: CameraConfig = {
    type: 'fixed-orthographic',
    bounds: { width: 2560, height: 1440 },
    viewport: { width: 1280, height: 720 },
    zoom: { initial: 1.0, min: 0.8, max: 1.5 },
    enableZoom: false
  };

  const finalConfig = { ...defaultConfig, ...config };

  useEffect(() => {
    let mounted = true;
    let app: PIXI.Application | null = null;

    async function init() {
      if (!canvasRef.current || !mounted) return;

      try {
        // Clean up any previous instance
        if (CameraController.isInitialized()) {
          CameraController.destroy();
        }

        // Initialize camera
        app = await CameraController.initialize(finalConfig);
        
        // Add canvas to DOM
        canvasRef.current.innerHTML = '';
        canvasRef.current.appendChild(app.canvas as HTMLCanvasElement);
        
        // Try to load test assets if AssetRegistry is available
        try {
          await AssetRegistry.load('/test_manifest.json');
          console.log('✅ Assets loaded for CameraTest');
          
          // Create test sprites in a grid
          for (let x = 0; x < 5; x++) {
            for (let y = 0; y < 5; y++) {
              const sprite = AssetRegistry.createSprite('civilian');
              sprite.x = 200 + (x * 400);
              sprite.y = 200 + (y * 200);
              sprite.zIndex = sprite.y;
              CameraController.worldContainer.addChild(sprite);
            }
          }
        } catch (assetError) {
          console.warn('⚠️ AssetRegistry not available, using placeholder graphics');
          console.log('Tip: Run the asset generator first: python scripts/generate_assets.py');
          
          // Create placeholder graphics if assets not loaded
          for (let x = 0; x < 5; x++) {
            for (let y = 0; y < 5; y++) {
              const graphics = new PIXI.Graphics();
              
              // Different colors for visual variety
              const colors = [0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00, 0xFF00FF];
              graphics.beginFill(colors[(x + y) % colors.length], 0.7);
              graphics.drawRect(0, 0, 32, 64);
              graphics.endFill();
              
              graphics.x = 200 + (x * 400);
              graphics.y = 200 + (y * 200);
              graphics.zIndex = graphics.y;
              CameraController.worldContainer.addChild(graphics);
            }
          }
        }

        // Add click handler
        const handleClick = (e: MouseEvent) => {
          try {
            const worldPos = CameraController.screenToWorld(e.clientX, e.clientY);
            
            setClickLog(prev => [...prev.slice(-9), {
              x: Math.round(e.clientX),
              y: Math.round(e.clientY),
              worldX: Math.round(worldPos.x),
              worldY: Math.round(worldPos.y)
            }]);
            
            // Visual feedback: Add marker at click location
            const marker = new PIXI.Graphics();
            marker.beginFill(0xFFFFFF, 0.8);
            marker.drawCircle(0, 0, 8);
            marker.endFill();
            marker.x = worldPos.x;
            marker.y = worldPos.y;
            marker.zIndex = worldPos.y + 0.5; // Slightly above clicked object
            
            CameraController.worldContainer.addChild(marker);
            
            // Remove marker after 1 second
            setTimeout(() => {
              if (CameraController.worldContainer.children.includes(marker)) {
                CameraController.worldContainer.removeChild(marker);
              }
            }, 1000);
          } catch (error) {
            console.warn('Click handler error:', error);
          }
        };

        app.canvas.addEventListener('click', handleClick);
        setIsInitialized(true);
        setError(null);

        // Cleanup function
        return () => {
          mounted = false;
          if (app) {
            app.canvas.removeEventListener('click', handleClick);
            // Don't destroy here - CameraController handles it
          }
        };
      } catch (error) {
        console.error('❌ Failed to initialize CameraTest:', error);
        if (mounted) {
          setIsInitialized(false);
          setError((error as Error).message);
        }
      }
    }

    init();

    // Cleanup on unmount
    return () => {
      mounted = false;
      if (CameraController.isInitialized()) {
        CameraController.destroy();
      }
    };
  }, [finalConfig]);

  return (
    <div style={{ 
      position: 'relative', 
      width: '1280px', 
      height: '820px', // Extra for controls
      margin: '0 auto'
    }}>
      <div 
        ref={canvasRef} 
        style={{ 
          width: '1280px', 
          height: '720px',
          border: '2px solid #4a4a4a',
          backgroundColor: '#1a1a1a',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
        }}
      />
      
      {error && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          right: '10px',
          backgroundColor: 'rgba(255,0,0,0.2)',
          color: '#ff6b6b',
          padding: '10px',
          borderRadius: '5px',
          border: '1px solid #ff6b6b',
          fontFamily: 'monospace',
          fontSize: '12px'
        }}>
          <strong>⚠️ Error:</strong> {error}
        </div>
      )}
      
      <div style={{
        position: 'absolute',
        top: '730px',
        left: 0,
        right: 0,
        backgroundColor: 'rgba(30,30,30,0.95)',
        color: 'white',
        padding: '15px',
        fontFamily: 'monospace',
        fontSize: '13px',
        border: '1px solid #444',
        borderRadius: '0 0 8px 8px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div>
            <strong>🎥 Camera Waldo View Test</strong>
          </div>
          <div>
            Status: <span style={{ color: isInitialized ? '#4CAF50' : '#FF9800' }}>
              {isInitialized ? '✅ LIVE' : '🔄 INITIALIZING'}
            </span>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <div style={{ color: '#aaa', marginBottom: '5px' }}>Configuration</div>
            <div style={{ fontSize: '12px' }}>
              <div>Viewport: <code>1280×720</code></div>
              <div>Level Bounds: <code>{finalConfig.bounds.width}×{finalConfig.bounds.height}</code></div>
              <div>Zoom: <code>{CameraController.getZoom().toFixed(1)}x</code></div>
              <div>Y-Sorting: <code>{CameraController.isInitialized() ? 'ENABLED' : '—'}</code></div>
            </div>
          </div>
          
          <div>
            <div style={{ color: '#aaa', marginBottom: '5px' }}>Recent Clicks</div>
            {clickLog.length === 0 ? (
              <div style={{ fontSize: '12px', color: '#777', fontStyle: 'italic' }}>
                Click on canvas to test coordinate conversion
              </div>
            ) : (
              <div style={{ fontSize: '11px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ color: '#aaa' }}>
                      <th style={{ textAlign: 'left', paddingBottom: '3px' }}>Screen (px)</th>
                      <th style={{ textAlign: 'left', paddingBottom: '3px' }}>→ World (px)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clickLog.map((click, i) => (
                      <tr key={i} style={{ borderTop: i > 0 ? '1px solid #333' : 'none' }}>
                        <td style={{ padding: '2px 0' }}>
                          <code>({click.x}, {click.y})</code>
                        </td>
                        <td style={{ padding: '2px 0' }}>
                          <code style={{ color: '#4CAF50' }}>({click.worldX}, {click.worldY})</code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        
        <div style={{ 
          marginTop: '10px', 
          paddingTop: '10px', 
          borderTop: '1px solid #444',
          fontSize: '11px', 
          color: '#888',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ color: '#4CAF50' }}>✅</span> Fixed orthographic camera
            <span style={{ marginLeft: '10px', color: '#4CAF50' }}>✅</span> Y-sorting enabled
          </div>
          <div>
            <span style={{ color: '#4CAF50' }}>✅</span> Touch panning disabled
            <span style={{ marginLeft: '10px', color: '#4CAF50' }}>✅</span> Coordinate conversion
          </div>
        </div>
      </div>
    </div>
  );
}

// Basic smoke test - only runs in development environment
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  console.log('🧪 CameraTest component loaded');
}