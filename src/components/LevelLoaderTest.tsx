import React, { useState } from 'react';
import { LevelLoader } from '@/core/LevelLoader';
import { ValidationError } from '@/types/LevelSchema';

export const LevelLoaderTest: React.FC = () => {
    const [levelData, setLevelData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [zoneStats, setZoneStats] = useState<Record<string, number>>({});

    const loadTestLevel = async () => {
        setLoading(true);
        setError(null);
        setLevelData(null);
        setZoneStats({});

        try {
            const level = await LevelLoader.load('/levels/test_level.json');
            setLevelData(level);

            // Calculate zone statistics
            const stats: Record<string, number> = {};
            level.zones.forEach((zone: any) => {
                stats[zone.type] = (stats[zone.type] || 0) + 1;
            });
            setZoneStats(stats);

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
            world: { width: 1000, height: 1000, background_asset_id: "bg_subway_tile_01" },
            population: { civilian_count: 70, killer_count: 1 },
            zones: []
        };

        const result = LevelLoader.validate(invalidData);
        console.log('Validation Test Result:', result);
        
        if (!result.valid) {
            setError(`Validation Test - Should Fail:\n${result.errors.map(e => `[${e.code}] ${e.message}`).join('\n')}`);
        }
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'monospace' }}>
            <h2>Level Loader Test</h2>
            
            <div style={{ marginBottom: '20px' }}>
                <button 
                    onClick={loadTestLevel}
                    disabled={loading}
                    style={{ marginRight: '10px', padding: '10px' }}
                >
                    {loading ? 'Loading...' : 'Load Test Level'}
                </button>
                
                <button 
                    onClick={testValidation}
                    style={{ padding: '10px' }}
                >
                    Test Validation
                </button>
            </div>

            {error && (
                <div style={{ 
                    background: '#ffe6e6', 
                    border: '1px solid #ff9999', 
                    padding: '15px', 
                    marginBottom: '20px',
                    whiteSpace: 'pre-wrap'
                }}>
                    <strong>Error:</strong><br />
                    {error}
                </div>
            )}

            {levelData && (
                <div style={{ background: '#f5f5f5', padding: '15px' }}>
                    <h3>Loaded Level Data</h3>
                    
                    <div style={{ marginBottom: '15px' }}>
                        <strong>Meta:</strong>
                        <div>ID: {levelData.meta.id}</div>
                        <div>Name: {levelData.meta.name}</div>
                        <div>Version: {levelData.meta.version}</div>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <strong>World:</strong>
                        <div>Size: {levelData.world.width} × {levelData.world.height}</div>
                        <div>Background: {levelData.world.background_asset_id}</div>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <strong>Population:</strong>
                        <div>Civilians: {levelData.population.civilian_count}</div>
                        <div>Killers: {levelData.population.killer_count}</div>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <strong>Zone Statistics:</strong>
                        <ul>
                            {Object.entries(zoneStats).map(([type, count]) => (
                                <li key={type}>{type}: {count} zones</li>
                            ))}
                        </ul>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <strong>Vignettes:</strong>
                        <div>Count: {levelData.vignettes?.length || 0}</div>
                        {levelData.vignettes?.map((v: any) => (
                            <div key={v.id}>- {v.id} (probability: {v.probability})</div>
                        ))}
                    </div>

                    <div>
                        <strong>Query Test:</strong>
                        <div>Walkable Zones: {LevelLoader.getZonesByType('walkable').length}</div>
                        <div>Vignette: {LevelLoader.getVignetteById('crime_scene_alley')?.id || 'Not found'}</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LevelLoaderTest;