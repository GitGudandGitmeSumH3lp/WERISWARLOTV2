'use client';

import React, { useState, useEffect } from 'react';
import { LevelLoader } from '@/core/LevelLoader';
import { ValidationError } from '@/types/LevelSchema';
import Link from 'next/link';

export default function LevelLoaderTestPage() {
    const [levelData, setLevelData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [zoneStats, setZoneStats] = useState<Record<string, number>>({});
    const [cameraBounds, setCameraBounds] = useState<{width: number, height: number} | null>(null);
    const [systemStatus, setSystemStatus] = useState({
        assets: { loaded: false, message: 'Not initialized' },
        camera: { initialized: false, message: 'Not initialized' },
        levelLoader: { ready: false, message: 'Waiting for dependencies' }
    });

    // Initialize systems on component mount
    useEffect(() => {
const initializeSystems = async () => {
    try {
        // 1. Initialize AssetRegistry
        setSystemStatus(prev => ({
            ...prev,
            assets: { loaded: false, message: 'Loading AssetRegistry...' }
        }));
        
        const { AssetRegistry } = await import('@/core/AssetRegistry');
        if (!AssetRegistry.isInitialized()) {
            await AssetRegistry.load('/test_manifest_fixed.json');
            console.log('✅ AssetRegistry loaded with assets:', AssetRegistry.listAssets());
        }
        
        setSystemStatus(prev => ({
            ...prev,
            assets: { loaded: true, message: `Loaded ${AssetRegistry.getAssetCount()} assets` }
        }));

        // 2. Initialize CameraController - DON'T check CameraController.app first
        setSystemStatus(prev => ({
            ...prev,
            camera: { initialized: false, message: 'Initializing CameraController...' }
        }));
        
        const { CameraController } = await import('@/core/CameraController');
        
        // Use a safer check
        const isAlreadyInitialized = CameraController._initialized || 
                                    (CameraController as any)._app !== undefined;
        
        if (!CameraController.isInitialized) {
            CameraController.initialize({
                type: "fixed-orthographic",
                bounds: { width: 2048, height: 1024 },
                viewport: { width: 1280, height: 720 },
                zoom: { initial: 1.0, min: 0.8, max: 1.5 }
            });
            console.log('✅ CameraController initialized');
        }
else {
            console.log('✅ CameraController already initialized');
        }
        
        setSystemStatus(prev => ({
            ...prev,
            camera: { initialized: true, message: 'Ready' }
        }));

        // 3. Mark LevelLoader as ready
        setSystemStatus(prev => ({
            ...prev,
            levelLoader: { ready: true, message: 'Ready to load levels' }
        }));

    } catch (err) {
        console.error('Failed to initialize systems:', err);
        setError(`System initialization failed: ${err instanceof Error ? err.message : String(err)}`);
            }
        };
        
        initializeSystems();
    }, []);

    const loadTestLevel = async () => {
        if (!systemStatus.assets.loaded || !systemStatus.camera.initialized) {
            setError('Please wait for systems to initialize...');
            return;
        }
        
        setLoading(true);
        setError(null);
        setLevelData(null);
        setZoneStats({});
        setCameraBounds(null);

        try {
            const level = await LevelLoader.load('/levels/test_level.json');
            setLevelData(level);

            // Calculate zone statistics
            const stats: Record<string, number> = {};
            level.zones.forEach((zone: any) => {
                stats[zone.type] = (stats[zone.type] || 0) + 1;
            });
            setZoneStats(stats);

            // Get camera bounds
            setCameraBounds({ width: level.world.width, height: level.world.height });

        } catch (err) {
            if (err instanceof ValidationError) {
                const errorMessages = err.errors.map(e => `[${e.code}] ${e.path}: ${e.message}`).join('\n');
                setError(`Validation Failed:\n${errorMessages}`);
            } else {
                setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const testValidation = async () => {
        // Test with invalid data (civilian_count > 60)
        const invalidData = {
            meta: { id: "test", name: "Test", version: "1.0" },
            world: { width: 1000, height: 1000, background_asset_id: "ground" },
            population: { civilian_count: 70, killer_count: 1 },
            zones: []
        };

        const result = LevelLoader.validate(invalidData);
        console.log('Validation Test Result:', result);
        
        if (!result.valid) {
            setError(`Validation Test - Should Fail:\n${result.errors.map(e => `[${e.code}] ${e.message}`).join('\n')}`);
        } else {
            setError('⚠️ Validation should have failed but passed!');
        }
    };

    const runEdgeCaseTests = async () => {
        const testCases = [
            { name: 'bounds', file: 'invalid_bounds.json', expected: 'BOUNDS_OVERFLOW' },
            { name: 'asset', file: 'missing_asset.json', expected: 'MISSING_ASSET' },
            { name: 'weight', file: 'invalid_weight.json', expected: 'INVALID_WEIGHT' }
        ];

        console.log('=== Running Edge Case Tests ===');
        
        for (const testCase of testCases) {
            try {
                await LevelLoader.load(`/levels/${testCase.file}`);
                console.error(`❌ ${testCase.name}: Expected error but loaded successfully`);
            } catch (err) {
                if (err instanceof ValidationError) {
                    const hasExpectedError = err.errors.some(e => e.code === testCase.expected);
                    console.log(`${hasExpectedError ? '✅' : '❌'} ${testCase.name}: ${hasExpectedError ? 'Got expected error' : 'Wrong error type'}`);
                } else {
                    console.error(`❌ ${testCase.name}: Unexpected error type`, err);
                }
            }
        }
        
        alert('Edge case tests completed. Check browser console for results.');
    };

    const testConsoleAPI = async () => {
        console.log('=== Testing LevelLoader Console API ===');
        
        try {
            // Test 1: Load via API
            const level = await LevelLoader.load('/levels/test_level.json');
            console.log('✅ Load test passed:', level.meta);
            
            // Test 2: Get current level
            console.log('✅ Current level:', LevelLoader.getCurrentLevel()?.meta);
            
            // Test 3: Query zones
            console.log('✅ Walkable zones:', LevelLoader.getZonesByType('walkable'));
            
            // Test 4: Get vignette
            console.log('✅ Vignette:', LevelLoader.getVignetteById('crime_scene_alley'));
            
            alert('Console API tests passed! Check browser console for results.');
        } catch (err) {
            console.error('❌ Console API test failed:', err);
            alert(`Console API test failed: ${err instanceof Error ? err.message : String(err)}`);
        }
    };

    const debugAssets = async () => {
        try {
            const { AssetRegistry } = await import('@/core/AssetRegistry');
            const assets = AssetRegistry.listAssets();
            console.log('Available assets:', assets);
            alert(`Available assets: ${assets.join(', ')}`);
        } catch (err) {
            console.error('Debug failed:', err);
            alert(`Error: ${err instanceof Error ? err.message : String(err)}`);
        }
    };

    const allSystemsReady = systemStatus.assets.loaded && systemStatus.camera.initialized;

    return (
        <div style={{ 
            padding: '30px', 
            fontFamily: 'monospace, system-ui',
            maxWidth: '1200px',
            margin: '0 auto'
        }}>
            <header style={{ marginBottom: '30px' }}>
                <h1 style={{ color: '#333', marginBottom: '10px' }}>🔍 Level Loader Test</h1>
                <p style={{ color: '#666' }}>Testing Phase 1 Foundation: Level Schema System</p>
                
                <div style={{ margin: '20px 0', padding: '15px', background: '#f0f8ff', borderRadius: '5px' }}>
                    <div style={{ display: 'flex', gap: '20px', marginBottom: '10px' }}>
                        <Link href="/interaction-test" style={{ color: '#0066cc', textDecoration: 'none' }}>
                            ← Interaction Test
                        </Link>
                        <Link href="/test-camera" style={{ color: '#0066cc', textDecoration: 'none' }}>
                            ← Camera Test
                        </Link>
                    </div>
                    
                    <h3 style={{ marginTop: 0, color: '#444' }}>System Status</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                        <div style={{ 
                            padding: '10px', 
                            background: systemStatus.assets.loaded ? '#e6ffe6' : '#fff0e6',
                            borderRadius: '3px'
                        }}>
                            <strong>AssetRegistry:</strong><br />
                            {systemStatus.assets.loaded ? '✅ ' : '🔄 '}
                            {systemStatus.assets.message}
                        </div>
                        <div style={{ 
                            padding: '10px', 
                            background: systemStatus.camera.initialized ? '#e6ffe6' : '#fff0e6',
                            borderRadius: '3px'
                        }}>
                            <strong>CameraController:</strong><br />
                            {systemStatus.camera.initialized ? '✅ ' : '🔄 '}
                            {systemStatus.camera.message}
                        </div>
                        <div style={{ 
                            padding: '10px', 
                            background: allSystemsReady ? '#e6ffe6' : '#fff0e6',
                            borderRadius: '3px'
                        }}>
                            <strong>LevelLoader:</strong><br />
                            {allSystemsReady ? '✅ ' : '🔄 '}
                            {allSystemsReady ? 'Ready' : 'Waiting...'}
                        </div>
                    </div>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                {/* Left Column: Test Controls */}
                <div>
                    <h2 style={{ color: '#444', marginBottom: '15px' }}>Test Controls</h2>
                    
                    <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '10px',
                        marginBottom: '20px'
                    }}>
                        <button 
                            onClick={loadTestLevel}
                            disabled={loading || !allSystemsReady}
                            style={{ 
                                padding: '12px 20px',
                                background: !allSystemsReady ? '#ccc' : loading ? '#999' : '#0066cc',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: (!allSystemsReady || loading) ? 'not-allowed' : 'pointer',
                                fontSize: '16px'
                            }}
                        >
                            {!allSystemsReady ? '🔄 Waiting for systems...' : 
                             loading ? '🔄 Loading...' : '📂 Load Test Level'}
                        </button>
                        
                        <button 
                            onClick={testValidation}
                            disabled={!allSystemsReady}
                            style={{ 
                                padding: '12px 20px',
                                background: !allSystemsReady ? '#ccc' : '#ff9900',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: !allSystemsReady ? 'not-allowed' : 'pointer',
                                fontSize: '16px'
                            }}
                        >
                            🧪 Test Validation (should fail)
                        </button>
                        
                        <button 
                            onClick={runEdgeCaseTests}
                            disabled={!allSystemsReady}
                            style={{ 
                                padding: '12px 20px',
                                background: !allSystemsReady ? '#ccc' : '#9933cc',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: !allSystemsReady ? 'not-allowed' : 'pointer',
                                fontSize: '16px'
                            }}
                        >
                            ⚠️ Run Edge Case Tests
                        </button>
                        
                        <button 
                            onClick={testConsoleAPI}
                            disabled={!allSystemsReady}
                            style={{ 
                                padding: '12px 20px',
                                background: !allSystemsReady ? '#ccc' : '#339966',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: !allSystemsReady ? 'not-allowed' : 'pointer',
                                fontSize: '16px'
                            }}
                        >
                            💻 Test Console API
                        </button>
                        
                        <button 
                            onClick={debugAssets}
                            style={{ 
                                padding: '12px 20px',
                                background: '#666',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontSize: '16px'
                            }}
                        >
                            🔍 Debug Assets
                        </button>
                    </div>

                    {error && (
                        <div style={{ 
                            background: '#ffe6e6', 
                            border: '2px solid #ff3333',
                            padding: '15px', 
                            borderRadius: '5px',
                            whiteSpace: 'pre-wrap',
                            marginTop: '20px'
                        }}>
                            <h3 style={{ color: '#cc0000', marginTop: 0 }}>❌ Error</h3>
                            <div style={{ fontFamily: 'monospace', fontSize: '14px' }}>
                                {error}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Status */}
                <div>
                    <h2 style={{ color: '#444', marginBottom: '15px' }}>Test Files</h2>
                    
                    <div style={{ 
                        background: '#f9f9f9', 
                        padding: '20px', 
                        borderRadius: '5px',
                        border: '1px solid #ddd'
                    }}>
                        <div style={{ marginBottom: '15px' }}>
                            <strong>📊 Level Files:</strong>
                            <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
                                <li>✅ <code>/levels/test_level.json</code></li>
                                <li>✅ <code>/levels/invalid_bounds.json</code></li>
                                <li>✅ <code>/levels/missing_asset.json</code></li>
                                <li>✅ <code>/levels/invalid_weight.json</code></li>
                            </ul>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <strong>🎯 Manifest:</strong>
                            <div style={{ marginTop: '5px' }}>
                                ✅ <code>/test_manifest_fixed.json</code>
                            </div>
                        </div>

                        <div>
                            <strong>🔗 Dependencies:</strong>
                            <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
                                <li>✅ AssetRegistry.ts</li>
                                <li>✅ CameraController.ts</li>
                                <li>✅ LevelSchema.ts types</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Display */}
            {levelData && (
                <div style={{ 
                    background: '#f0f8ff', 
                    padding: '25px', 
                    borderRadius: '5px',
                    border: '2px solid #0066cc'
                }}>
                    <h2 style={{ color: '#0066cc', marginTop: 0 }}>✅ Level Loaded Successfully</h2>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                        {/* Meta Data */}
                        <div>
                            <h3 style={{ color: '#333' }}>📋 Meta</h3>
                            <div style={{ background: 'white', padding: '15px', borderRadius: '3px' }}>
                                <div><strong>ID:</strong> {levelData.meta.id}</div>
                                <div><strong>Name:</strong> {levelData.meta.name}</div>
                                <div><strong>Version:</strong> {levelData.meta.version}</div>
                            </div>
                        </div>

                        {/* World Data */}
                        <div>
                            <h3 style={{ color: '#333' }}>🌍 World</h3>
                            <div style={{ background: 'white', padding: '15px', borderRadius: '3px' }}>
                                <div><strong>Size:</strong> {levelData.world.width} × {levelData.world.height}px</div>
                                <div><strong>Background:</strong> {levelData.world.background_asset_id}</div>
                            </div>
                        </div>

                        {/* Population Data */}
                        <div>
                            <h3 style={{ color: '#333' }}>👥 Population</h3>
                            <div style={{ background: 'white', padding: '15px', borderRadius: '3px' }}>
                                <div><strong>Civilians:</strong> {levelData.population.civilian_count}</div>
                                <div><strong>Killers:</strong> {levelData.population.killer_count}</div>
                            </div>
                        </div>
                    </div>

                    {/* Zone Statistics */}
                    <div style={{ marginTop: '20px' }}>
                        <h3 style={{ color: '#333' }}>🗺️ Zone Statistics</h3>
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(4, 1fr)', 
                            gap: '10px',
                            marginTop: '10px'
                        }}>
                            {Object.entries(zoneStats).map(([type, count]) => (
                                <div key={type} style={{
                                    background: 'white',
                                    padding: '15px',
                                    borderRadius: '3px',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{count}</div>
                                    <div style={{ fontSize: '12px', color: '#666' }}>{type}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Query Results */}
                    <div style={{ marginTop: '20px' }}>
                        <h3 style={{ color: '#333' }}>🔍 Query Results</h3>
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: '1fr 1fr', 
                            gap: '15px',
                            marginTop: '10px'
                        }}>
                            <div style={{ background: 'white', padding: '15px', borderRadius: '3px' }}>
                                <strong>Walkable Zones:</strong> {LevelLoader.getZonesByType('walkable').length}
                            </div>
                            <div style={{ background: 'white', padding: '15px', borderRadius: '3px' }}>
                                <strong>Vignette Found:</strong> {LevelLoader.getVignetteById('crime_scene_alley')?.id || 'None'}
                            </div>
                        </div>
                    </div>
                    
                    {/* Camera Info */}
                    {cameraBounds && (
                        <div style={{ marginTop: '20px' }}>
                            <h3 style={{ color: '#333' }}>🎥 Camera</h3>
                            <div style={{ background: 'white', padding: '15px', borderRadius: '3px' }}>
                                <strong>Bounds Set:</strong> {cameraBounds.width} × {cameraBounds.height}px
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Instructions */}
            <div style={{ 
                marginTop: '30px', 
                padding: '20px', 
                background: '#fff8e1',
                borderRadius: '5px',
                border: '1px solid #ffcc00'
            }}>
                <h3 style={{ color: '#cc9900', marginTop: 0 }}>📖 Testing Instructions</h3>
                
                <ol style={{ paddingLeft: '20px', marginBottom: '0' }}>
                    <li><strong>Wait</strong> for all systems to show ✅ ready status</li>
                    <li><strong>First:</strong> Click "Load Test Level" - should succeed with no errors</li>
                    <li><strong>Second:</strong> Click "Test Validation" - should show POPULATION_EXCEEDED error</li>
                    <li><strong>Third:</strong> Click "Run Edge Case Tests" - check browser console for results</li>
                    <li><strong>Fourth:</strong> Click "Test Console API" - verify all API methods work</li>
                    <li><strong>Manual:</strong> Open browser console (F12) and test: <code>window.LevelLoader</code></li>
                </ol>
            </div>
        </div>
    );
}