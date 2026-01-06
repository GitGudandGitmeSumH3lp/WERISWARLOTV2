'use client'

import { useEffect, useRef, useState } from 'react'
import * as PIXI from 'pixi.js'
import { AssetRegistry } from '@/core/AssetRegistry'

interface TestResult {
  name: string
  status: 'pass' | 'fail' | 'pending'
  message: string
  details?: string
}

export default function AssetRegistryTest() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [results, setResults] = useState<TestResult[]>([
    { name: 'Load Manifest', status: 'pending', message: 'Waiting to start...' },
    { name: 'Create Sprites', status: 'pending', message: 'Waiting to start...' },
    { name: 'Scale Verification', status: 'pending', message: 'Waiting to start...' },
    { name: 'Z-Index Sorting', status: 'pending', message: 'Waiting to start...' },
    { name: 'Error Handling', status: 'pending', message: 'Waiting to start...' },
    { name: 'Asset Filtering', status: 'pending', message: 'Waiting to start...' },
    { name: 'Texture Sharing', status: 'pending', message: 'Waiting to start...' }
  ])
  const [loading, setLoading] = useState(true)
  const [spritesLoaded, setSpritesLoaded] = useState(0)

  useEffect(() => {
    const app = new PIXI.Application({
      canvas: canvasRef.current!,
      width: 800,
      height: 600,
      backgroundColor: 0x1a1a2e,
      antialias: false
    })

    const runTests = async () => {
      setLoading(true)
      const newResults = [...results]

      try {
        // Test 1: Load Manifest
        const startTime = performance.now()
        await AssetRegistry.load('/test_manifest.json')
        const loadTime = performance.now() - startTime
        
        newResults[0] = {
          name: 'Load Manifest',
          status: loadTime < 500 ? 'pass' : 'fail',
          message: `Manifest loaded in ${loadTime.toFixed(1)}ms`,
          details: `Loaded ${AssetRegistry.getAssetCount()} assets`
        }
        setResults(newResults)
        setSpritesLoaded(AssetRegistry.getAssetCount())

        // Test 2: Create Sprites
        const sprites: PIXI.Sprite[] = []
        try {
          const sprite1 = AssetRegistry.createSprite('bench')
          sprite1.position.set(150, 200)
          sprites.push(sprite1)

          const sprite2 = AssetRegistry.createSprite('civilian_male_01')
          sprite2.position.set(300, 180)
          sprites.push(sprite2)

          const sprite3 = AssetRegistry.createSprite('bloodstain_small')
          sprite3.position.set(250, 220)
          sprites.push(sprite3)

          app.stage.addChild(...sprites)

          newResults[1] = {
            name: 'Create Sprites',
            status: 'pass',
            message: `Created ${sprites.length} sprites successfully`,
            details: 'All sprites rendered on canvas'
          }
        } catch (error: any) {
          newResults[1] = {
            name: 'Create Sprites',
            status: 'fail',
            message: 'Failed to create sprites',
            details: error.message
          }
        }
        setResults([...newResults])

        // Test 3: Scale Verification
        const scaleCorrect = sprites.every(s => s.scale.x === 4 && s.scale.y === 4)
        newResults[2] = {
          name: 'Scale Verification',
          status: scaleCorrect ? 'pass' : 'fail',
          message: scaleCorrect ? 'All sprites have scale=4' : 'Scale mismatch detected',
          details: `Expected 4, got: ${sprites[0]?.scale.x ?? 'N/A'}`
        }
        setResults([...newResults])

        // Test 4: Z-Index Sorting
        const zIndexCorrect = sprites.every(s => s.zIndex === s.y)
        newResults[3] = {
          name: 'Z-Index Sorting',
          status: zIndexCorrect ? 'pass' : 'fail',
          message: zIndexCorrect ? 'Y-sorting applied correctly' : 'zIndex not equal to y',
          details: `Sprite at y=${sprites[0]?.y} has zIndex=${sprites[0]?.zIndex}`
        }
        setResults([...newResults])

        // Test 5: Error Handling
        try {
          AssetRegistry.createSprite('does_not_exist')
          newResults[4] = {
            name: 'Error Handling',
            status: 'fail',
            message: 'Should have thrown error for non-existent asset',
            details: 'No error thrown'
          }
        } catch (error: any) {
          newResults[4] = {
            name: 'Error Handling',
            status: 'pass',
            message: 'Error thrown correctly',
            details: error.message
          }
        }
        setResults([...newResults])

        // Test 6: Asset Filtering
        const npcs = AssetRegistry.listAssets({ type: 'npc' })
        const props = AssetRegistry.listAssets({ type: 'prop' })
        const tiles = AssetRegistry.listAssets({ type: 'tile' })
        
        newResults[5] = {
          name: 'Asset Filtering',
          status: npcs.includes('civilian_male_01') && props.includes('bench') ? 'pass' : 'fail',
          message: `Found ${npcs.length} NPCs, ${props.length} props, ${tiles.length} tiles`,
          details: `NPCs: ${npcs.join(', ')}`
        }
        setResults([...newResults])

        // Test 7: Texture Sharing
        const spriteA = AssetRegistry.createSprite('bench')
        const spriteB = AssetRegistry.createSprite('bench')
        const textureShared = spriteA.texture === spriteB.texture
        
        newResults[6] = {
          name: 'Texture Sharing',
          status: textureShared ? 'pass' : 'fail',
          message: textureShared ? 'Sprites share texture memory' : 'Textures duplicated',
          details: textureShared ? 'Same texture reference' : 'Different texture objects'
        }
        setResults([...newResults])

        // Add debug info to canvas
        const debugText = new PIXI.Text({
          text: `Assets: ${AssetRegistry.getAssetCount()} | Sprites: ${sprites.length}`,
          style: {
            fill: 0xffffff,
            fontSize: 14,
            fontFamily: 'monospace'
          }
        })
        debugText.position.set(10, 10)
        app.stage.addChild(debugText)

        // Add coordinate grid for visual verification
        const grid = new PIXI.Graphics()
        grid.lineStyle(1, 0x333366)
        for (let x = 0; x < 800; x += 50) {
          grid.moveTo(x, 0)
          grid.lineTo(x, 600)
        }
        for (let y = 0; y < 600; y += 50) {
          grid.moveTo(0, y)
          grid.lineTo(800, y)
        }
        app.stage.addChildAt(grid, 0)

      } catch (error: any) {
        console.error('Test suite failed:', error)
        newResults[0] = {
          name: 'Load Manifest',
          status: 'fail',
          message: 'Initialization failed',
          details: error.message
        }
        setResults(newResults)
      } finally {
        setLoading(false)
      }
    }

    runTests()

    return () => {
      app.destroy(true, { children: true, texture: true })
    }
  }, [])

  const passedCount = results.filter(r => r.status === 'pass').length
  const totalTests = results.length

  return (
    <div style={{ fontFamily: 'monospace, sans-serif', padding: '20px' }}>
      <h1 style={{ color: '#4cc9f0', marginBottom: '10px' }}>AssetRegistry Integration Test</h1>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1', minWidth: '300px' }}>
          <h2 style={{ color: '#f72585' }}>Test Results ({passedCount}/{totalTests})</h2>
          <div style={{ 
            backgroundColor: '#2b2d42', 
            borderRadius: '8px', 
            padding: '15px',
            marginBottom: '20px'
          }}>
            {results.map((result, index) => (
              <div 
                key={index} 
                style={{ 
                  marginBottom: '10px',
                  padding: '10px',
                  backgroundColor: result.status === 'pass' ? '#2a9d8f22' : 
                                 result.status === 'fail' ? '#e6394622' : '#457b9d22',
                  borderRadius: '4px',
                  borderLeft: `4px solid ${
                    result.status === 'pass' ? '#2a9d8f' : 
                    result.status === 'fail' ? '#e63946' : '#457b9d'
                  }`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong style={{ color: '#f1faee' }}>{result.name}</strong>
                  <span style={{ 
                    color: result.status === 'pass' ? '#2a9d8f' : 
                           result.status === 'fail' ? '#e63946' : '#a8dadc'
                  }}>
                    {result.status.toUpperCase()}
                  </span>
                </div>
                <div style={{ color: '#a8dadc', fontSize: '0.9em', marginTop: '4px' }}>
                  {result.message}
                </div>
                {result.details && (
                  <div style={{ color: '#8d99ae', fontSize: '0.8em', marginTop: '2px' }}>
                    {result.details}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ 
            backgroundColor: '#2b2d42', 
            borderRadius: '8px', 
            padding: '15px',
            marginBottom: '20px'
          }}>
            <h3 style={{ color: '#f72585', marginTop: 0 }}>Test Commands</h3>
            <div style={{ color: '#a8dadc', fontSize: '0.9em' }}>
              <p>Open browser console and try:</p>
              <pre style={{ 
                backgroundColor: '#1a1a2e', 
                padding: '10px', 
                borderRadius: '4px',
                overflowX: 'auto'
              }}>
{`// Check initialization
console.log('Initialized:', AssetRegistry.isInitialized())

// List all assets
console.log('All assets:', AssetRegistry.listAssets())

// Filter NPCs
console.log('NPCs:', AssetRegistry.listAssets({ type: 'npc' }))

// Check specific asset
console.log('Has bench:', AssetRegistry.has('bench'))

// Create new sprite
const benchSprite = AssetRegistry.createSprite('bench')
console.log('Bench scale:', benchSprite.scale.x)`}
              </pre>
            </div>
          </div>
        </div>

        <div style={{ flex: '1', minWidth: '300px' }}>
          <h2 style={{ color: '#f72585' }}>Canvas Preview</h2>
          <div style={{ 
            backgroundColor: '#2b2d42', 
            borderRadius: '8px', 
            padding: '10px',
            marginBottom: '20px'
          }}>
            {loading ? (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                height: '400px',
                color: '#a8dadc'
              }}>
                Loading test suite...
              </div>
            ) : (
              <>
                <canvas 
                  ref={canvasRef} 
                  width={800} 
                  height={600}
                  style={{ 
                    width: '100%', 
                    height: '400px',
                    backgroundColor: '#1a1a2e',
                    borderRadius: '4px',
                    border: '1px solid #457b9d'
                  }}
                />
                <div style={{ 
                  color: '#a8dadc', 
                  fontSize: '0.9em',
                  marginTop: '10px',
                  padding: '10px',
                  backgroundColor: '#1a1a2e',
                  borderRadius: '4px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Sprites loaded: {spritesLoaded}</span>
                    <span>Grid: 50px increments</span>
                  </div>
                  <div style={{ marginTop: '5px' }}>
                    <span style={{ color: '#2a9d8f' }}>■</span> Green: bench (prop)<br />
                    <span style={{ color: '#4cc9f0' }}>■</span> Blue: civilian (npc)<br />
                    <span style={{ color: '#f72585' }}>■</span> Red: bloodstain (prop)
                  </div>
                </div>
              </>
            )}
          </div>

          <div style={{ 
            backgroundColor: '#2b2d42', 
            borderRadius: '8px', 
            padding: '15px'
          }}>
            <h3 style={{ color: '#f72585', marginTop: 0 }}>Expected Behavior</h3>
            <ul style={{ color: '#a8dadc', fontSize: '0.9em', paddingLeft: '20px' }}>
              <li>All sprites should be 4× larger than their texture size</li>
              <li>Sprites should be positioned at Y-sorted depths (lower Y = behind)</li>
              <li>Multiple bench sprites should share the same texture memory</li>
              <li>Error should appear in console for invalid asset names</li>
              <li>Total load time should be under 500ms</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}