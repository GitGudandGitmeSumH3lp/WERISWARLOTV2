// src/components/InteractionTest.tsx
import React, { useEffect, useState, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { CameraController } from '../core/CameraController';
import { InteractionManager } from '../core/InteractionManager';

export default function InteractionTest() {
  const [clickedTarget, setClickedTarget] = useState<string | null>(null);
  const [clickCount, setClickCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        console.log('🚀 Starting InteractionTest initialization...');
        setError(null);
        
        if (!containerRef.current) {
          throw new Error('Container ref not available');
        }
        
        // 1. Initialize CameraController FIRST (await the async init)
        console.log('Step 1: Initializing CameraController...');
        let app: PIXI.Application;
        try {
          app = await CameraController.initialize({
            type: "fixed-orthographic",
            bounds: { width: 2560, height: 1440 },
            viewport: { width: 1280, height: 720 },
            zoom: { initial: 1.0, min: 0.8, max: 1.5 }
          });
          console.log('✅ CameraController initialized');
        } catch (cameraError) {
          throw new Error(`CameraController failed: ${cameraError}`);
        }
        
        // 2. Mount canvas to DOM - in PixiJS v8, canvas is app.canvas
        console.log('Step 2: Mounting canvas...');
        const canvas = app.canvas as HTMLCanvasElement;
        if (containerRef.current && canvas) {
          // Clear container
          containerRef.current.innerHTML = '';
          containerRef.current.appendChild(canvas);
          console.log('✅ Canvas mounted');
        } else {
          throw new Error('Failed to mount canvas: container or canvas missing');
        }
        
        // 3. Initialize InteractionManager
        console.log('Step 3: Initializing InteractionManager...');
        try {
          InteractionManager.initialize({
            minHitboxRadius: 22,
            highlightColor: 0xFFFF00,
            tapDebounceMs: 150,
            enableVisualFeedback: true
          });
          console.log('✅ InteractionManager initialized');
        } catch (interactionError) {
          throw new Error(`InteractionManager failed: ${interactionError}`);
        }
        
        // 4. Create NPCs with graphics
        console.log('Step 4: Creating NPCs...');
        for (let i = 0; i < 10; i++) {
          // Create simple NPC with graphics
          const container = new PIXI.Container();
          
          // Body
          const body = new PIXI.Graphics();
          body.beginFill(0x3498db); // Blue shirt
          body.drawRect(-8, -20, 16, 20);
          body.endFill();
          
          // Head
          const head = new PIXI.Graphics();
          head.beginFill(0xf1c40f); // Yellow head
          head.drawCircle(0, -25, 6);
          head.endFill();
          
          // Pants
          const pants = new PIXI.Graphics();
          pants.beginFill(0x2c3e50); // Dark pants
          pants.drawRect(-8, 0, 16, 8);
          pants.endFill();
          
          container.addChild(body);
          container.addChild(head);
          container.addChild(pants);
          
          container.x = Math.random() * 1000 + 100;
          container.y = Math.random() * 600 + 100;
          
          // Add to world
          CameraController.worldContainer.addChild(container);

          // Register for interaction
          InteractionManager.registerTarget({
            id: `test_npc_${i}`,
            type: "npc",
            sprite: container as any,
            hitbox: { x: container.x, y: container.y, radius: 22 },
            metadata: { name: `NPC ${i}` }
          });
        }
        console.log('✅ 10 NPCs created and registered');
        
        // 5. Subscribe to interactions
        console.log('Step 5: Setting up interaction subscription...');
        const unsubscribe = InteractionManager.onInteract((target) => {
          console.log('🎯 Click detected:', target.id);
          setClickedTarget(target.id);
          setClickCount(prev => prev + 1);
        });
        
        if (mounted) {
          setIsInitialized(true);
          console.log('🎉 InteractionTest initialization COMPLETE!');
        }
        
        // Cleanup function
        return () => {
          console.log('🧹 Cleaning up...');
          unsubscribe();
          InteractionManager.clearTargets();
          
          // Note: Don't destroy app here as CameraController manages it
        };
        
      } catch (err) {
        console.error('❌ Initialization failed:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : String(err));
        }
      }
    }
    
    initialize();
    
    // Cleanup on unmount
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      {/* Canvas container */}
      <div 
        ref={containerRef}
        id="pixi-container" 
        style={{ 
          width: '100%', 
          height: '100%'
        }}
      />
      
      {/* Debug overlay */}
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '15px',
        borderRadius: '8px',
        fontFamily: 'monospace',
        zIndex: 1000,
        minWidth: '300px'
      }}>
        <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
          🎮 Interaction Test {isInitialized ? '✅' : error ? '❌' : '🔄'}
        </div>
        
        <div style={{ marginBottom: '5px' }}>
          <strong>Status:</strong> {isInitialized ? 'Ready' : error ? 'Error' : 'Initializing...'}
        </div>
        
        {error && (
          <div style={{ 
            color: '#ff6b6b', 
            backgroundColor: 'rgba(255,0,0,0.1)', 
            padding: '8px',
            borderRadius: '4px',
            marginBottom: '10px',
            fontSize: '12px'
          }}>
            ❌ {error}
          </div>
        )}
        
        {isInitialized && (
          <>
            <div style={{ marginBottom: '5px' }}>
              <strong>Last clicked:</strong> {clickedTarget || 'None yet'}
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <strong>Total clicks:</strong> {clickCount}
            </div>
            
            <div style={{ 
              fontSize: '12px', 
              color: '#aaa',
              borderTop: '1px solid #444',
              paddingTop: '10px'
            }}>
              <div>Test instructions:</div>
              <div>1. Click any colored NPC</div>
              <div>2. Should see yellow glow</div>
              <div>3. ID appears above</div>
            </div>
          </>
        )}
      </div>

      {/* Initialization status */}
      {!isInitialized && !error && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '20px',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '20px', marginBottom: '10px' }}>🔄 Initializing...</div>
          <div>Setting up camera and interaction systems</div>
          <div style={{ fontSize: '12px', marginTop: '10px', color: '#aaa' }}>
            This may take a moment...
          </div>
        </div>
      )}
    </div>
  );
}