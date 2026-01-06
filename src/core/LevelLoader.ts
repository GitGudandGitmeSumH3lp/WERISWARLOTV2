import { LevelData, ValidationResult, ValidationError, NetworkError, ParseError, ZoneType, SpawnZone, VignetteRule } from '@/types/LevelSchema';

// Internal module state
let _currentLevel: LevelData | null = null;

export class LevelLoader {
    // ==================== PUBLIC API ====================
    
    /**
     * Load and validate a level from JSON file
     */
    static async load(levelPath: string): Promise<LevelData> {
        try {
            // Fetch JSON file
            const response = await fetch(levelPath);
            if (!response.ok) {
                throw new NetworkError(`Failed to load level: ${levelPath} (${response.status})`);
            }
            
            // Parse JSON
            const jsonText = await response.text();
            let rawData: unknown;
            try {
                rawData = JSON.parse(jsonText);
            } catch (error) {
                throw new ParseError(`Invalid JSON syntax in ${levelPath}: ${error}`);
            }
            
            // 4-stage validation pipeline
            const schemaResult = this._validateSchema(rawData);
            if (!schemaResult.valid) {
                throw new ValidationError(schemaResult.errors);
            }
            
            const typedData = rawData as LevelData;
            
            const boundsResult = this._validateBounds(typedData);
            if (!boundsResult.valid) {
                throw new ValidationError(boundsResult.errors);
            }
            
            const assetResult = await this._validateAssets(typedData);
            if (!assetResult.valid) {
                throw new ValidationError(assetResult.errors);
            }
            
            const constraintResult = this._validateConstraints(typedData);
            if (!constraintResult.valid) {
                throw new ValidationError(constraintResult.errors);
            }
            
            // Store as current level
            _currentLevel = typedData;
            
            // Initialize camera bounds if CameraController is available
            try {
                const { CameraController } = await import('@/core/CameraController');
                if (CameraController.setBounds) {
                    CameraController.setBounds(typedData.world.width, typedData.world.height);
                    console.log(`Camera bounds set to ${typedData.world.width}x${typedData.world.height}`);
                } else {
                    console.warn('CameraController.setBounds not available');
                }
            } catch (cameraError) {
                console.warn('CameraController not available, skipping bounds setup:', cameraError);
                // Don't fail the level load if camera isn't ready
            }
            
            return typedData;
            
        } catch (error) {
            // Re-throw validation/network errors
            if (error instanceof ValidationError || 
                error instanceof NetworkError || 
                error instanceof ParseError) {
                throw error;
            }
            // Wrap unknown errors
            throw new NetworkError(`Unexpected error loading level: ${error}`);
        }
    }
    
    /**
     * Get the currently loaded level
     */
    static getCurrentLevel(): LevelData | null {
        return _currentLevel;
    }
    
    /**
     * Validate level data without loading it
     */
    static validate(data: unknown): ValidationResult {
        const results: ValidationResult[] = [];
        
        const schemaResult = this._validateSchema(data);
        results.push(schemaResult);
        
        if (schemaResult.valid) {
            const typedData = data as LevelData;
            results.push(this._validateBounds(typedData));
            results.push(this._validateConstraints(typedData));
        }
        
        // Combine all errors
        const allErrors = results.flatMap(r => r.errors);
        return {
            valid: allErrors.length === 0,
            errors: allErrors
        };
    }
    
    /**
     * Get all zones of a specific type
     */
    static getZonesByType(type: ZoneType): SpawnZone[] {
        if (!_currentLevel) return [];
        return _currentLevel.zones.filter(zone => zone.type === type);
    }
    
    /**
     * Get a vignette rule by ID
     */
    static getVignetteById(id: string): VignetteRule | undefined {
        if (!_currentLevel) return undefined;
        return _currentLevel.vignettes.find(vignette => vignette.id === id);
    }
    
    // ==================== VALIDATION PIPELINE ====================
    
    /**
     * Stage 1: Schema validation - check required fields and types
     */
    private static _validateSchema(data: unknown): ValidationResult {
        const errors: ValidationResult['errors'] = [];
        
        // Check if data is an object
        if (!data || typeof data !== 'object') {
            errors.push({
                code: 'SCHEMA_INVALID',
                message: 'Level data must be a JSON object',
                path: ''
            });
            return { valid: false, errors };
        }
        
        const obj = data as Record<string, unknown>;
        
        // Check meta
        if (!obj.meta || typeof obj.meta !== 'object') {
            errors.push({
                code: 'SCHEMA_INVALID',
                message: 'Missing or invalid "meta" object',
                path: 'meta'
            });
        } else {
            const meta = obj.meta as Record<string, unknown>;
            if (!meta.id || typeof meta.id !== 'string') {
                errors.push({
                    code: 'SCHEMA_INVALID',
                    message: 'meta.id must be a string',
                    path: 'meta.id'
                });
            }
            if (!meta.name || typeof meta.name !== 'string') {
                errors.push({
                    code: 'SCHEMA_INVALID',
                    message: 'meta.name must be a string',
                    path: 'meta.name'
                });
            }
            if (!meta.version || typeof meta.version !== 'string') {
                errors.push({
                    code: 'SCHEMA_INVALID',
                    message: 'meta.version must be a string',
                    path: 'meta.version'
                });
            }
        }
        
        // Check world
        if (!obj.world || typeof obj.world !== 'object') {
            errors.push({
                code: 'SCHEMA_INVALID',
                message: 'Missing or invalid "world" object',
                path: 'world'
            });
        } else {
            const world = obj.world as Record<string, unknown>;
            if (typeof world.width !== 'number') {
                errors.push({
                    code: 'SCHEMA_INVALID',
                    message: 'world.width must be a number',
                    path: 'world.width'
                });
            }
            if (typeof world.height !== 'number') {
                errors.push({
                    code: 'SCHEMA_INVALID',
                    message: 'world.height must be a number',
                    path: 'world.height'
                });
            }
            if (!world.background_asset_id || typeof world.background_asset_id !== 'string') {
                errors.push({
                    code: 'SCHEMA_INVALID',
                    message: 'world.background_asset_id must be a string',
                    path: 'world.background_asset_id'
                });
            }
        }
        
        // Check population
        if (!obj.population || typeof obj.population !== 'object') {
            errors.push({
                code: 'SCHEMA_INVALID',
                message: 'Missing or invalid "population" object',
                path: 'population'
            });
        } else {
            const population = obj.population as Record<string, unknown>;
            if (typeof population.civilian_count !== 'number') {
                errors.push({
                    code: 'SCHEMA_INVALID',
                    message: 'population.civilian_count must be a number',
                    path: 'population.civilian_count'
                });
            }
            if (typeof population.killer_count !== 'number') {
                errors.push({
                    code: 'SCHEMA_INVALID',
                    message: 'population.killer_count must be a number',
                    path: 'population.killer_count'
                });
            }
            if (population.density_map !== undefined && typeof population.density_map !== 'string') {
                errors.push({
                    code: 'SCHEMA_INVALID',
                    message: 'population.density_map must be a string if present',
                    path: 'population.density_map'
                });
            }
        }
        
        // Check zones
        if (!Array.isArray(obj.zones)) {
            errors.push({
                code: 'SCHEMA_INVALID',
                message: '"zones" must be an array',
                path: 'zones'
            });
        } else {
            obj.zones.forEach((zone: unknown, index: number) => {
                if (!zone || typeof zone !== 'object') {
                    errors.push({
                        code: 'SCHEMA_INVALID',
                        message: `zone[${index}] must be an object`,
                        path: `zones[${index}]`
                    });
                    return;
                }
                
                const z = zone as Record<string, unknown>;
                const path = `zones[${index}]`;
                
                if (typeof z.x !== 'number') errors.push({ code: 'SCHEMA_INVALID', message: 'x must be a number', path: `${path}.x` });
                if (typeof z.y !== 'number') errors.push({ code: 'SCHEMA_INVALID', message: 'y must be a number', path: `${path}.y` });
                if (typeof z.w !== 'number') errors.push({ code: 'SCHEMA_INVALID', message: 'w must be a number', path: `${path}.w` });
                if (typeof z.h !== 'number') errors.push({ code: 'SCHEMA_INVALID', message: 'h must be a number', path: `${path}.h` });
                if (!z.type || typeof z.type !== 'string') {
                    errors.push({ code: 'SCHEMA_INVALID', message: 'type must be a string', path: `${path}.type` });
                }
                if (typeof z.capacity_weight !== 'number') {
                    errors.push({ code: 'SCHEMA_INVALID', message: 'capacity_weight must be a number', path: `${path}.capacity_weight` });
                }
            });
        }
        
        // Check vignettes (optional)
        if (obj.vignettes !== undefined) {
            if (!Array.isArray(obj.vignettes)) {
                errors.push({
                    code: 'SCHEMA_INVALID',
                    message: '"vignettes" must be an array if present',
                    path: 'vignettes'
                });
            } else {
                obj.vignettes.forEach((vignette: unknown, index: number) => {
                    if (!vignette || typeof vignette !== 'object') {
                        errors.push({
                            code: 'SCHEMA_INVALID',
                            message: `vignette[${index}] must be an object`,
                            path: `vignettes[${index}]`
                        });
                        return;
                    }
                    
                    const v = vignette as Record<string, unknown>;
                    const path = `vignettes[${index}]`;
                    
                    if (!v.id || typeof v.id !== 'string') errors.push({ code: 'SCHEMA_INVALID', message: 'id must be a string', path: `${path}.id` });
                    if (!v.required_zone || typeof v.required_zone !== 'string') {
                        errors.push({ code: 'SCHEMA_INVALID', message: 'required_zone must be a string', path: `${path}.required_zone` });
                    }
                    if (typeof v.probability !== 'number') {
                        errors.push({ code: 'SCHEMA_INVALID', message: 'probability must be a number', path: `${path}.probability` });
                    }
                });
            }
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
    
    /**
     * Stage 2: Bounds validation - check zones fit within world
     */
    private static _validateBounds(level: LevelData): ValidationResult {
        const errors: ValidationResult['errors'] = [];
        
        level.zones.forEach((zone, index) => {
            const path = `zones[${index}]`;
            
            // Check right boundary
            if (zone.x + zone.w > level.world.width) {
                errors.push({
                    code: 'BOUNDS_OVERFLOW',
                    message: `Zone extends beyond world width (x:${zone.x}, w:${zone.w}, world width:${level.world.width})`,
                    path: `${path}.x`
                });
            }
            
            // Check bottom boundary
            if (zone.y + zone.h > level.world.height) {
                errors.push({
                    code: 'BOUNDS_OVERFLOW',
                    message: `Zone extends beyond world height (y:${zone.y}, h:${zone.h}, world height:${level.world.height})`,
                    path: `${path}.y`
                });
            }
        });
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
    
    /**
     * Stage 3: Asset validation - check all referenced assets exist
     */
    private static async _validateAssets(level: LevelData): Promise<ValidationResult> {
        const errors: ValidationResult['errors'] = [];
        
        // Import dynamically to avoid circular dependencies
        const { AssetRegistry } = await import('@/core/AssetRegistry');
        
        // Check if AssetRegistry is initialized
        if (!AssetRegistry.isInitialized()) {
            console.warn('AssetRegistry not initialized, attempting to load default manifest...');
            try {
                await AssetRegistry.load('/test_manifest_fixed.json');
            } catch (loadError) {
                errors.push({
                    code: 'MISSING_ASSET',
                    message: `AssetRegistry not initialized and failed to load: ${loadError}`,
                    path: 'world.background_asset_id'
                });
                return { valid: false, errors };
            }
        }
        
        // Check background asset
        if (!AssetRegistry.has(level.world.background_asset_id)) {
            errors.push({
                code: 'MISSING_ASSET',
                message: `Background asset not found: "${level.world.background_asset_id}". Available assets: ${AssetRegistry.listAssets().join(', ')}`,
                path: 'world.background_asset_id'
            });
        }
        
        // Check optional density map
        if (level.population.density_map && !AssetRegistry.has(level.population.density_map)) {
            errors.push({
                code: 'MISSING_ASSET',
                message: `Density map asset not found: "${level.population.density_map}"`,
                path: 'population.density_map'
            });
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
    
    /**
     * Stage 4: Constraint validation - check system limits
     */
    private static _validateConstraints(level: LevelData): ValidationResult {
        const errors: ValidationResult['errors'] = [];
        
        // Check civilian count limit (60 from system.md)
        if (level.population.civilian_count > 60) {
            errors.push({
                code: 'POPULATION_EXCEEDED',
                message: `civilian_count (${level.population.civilian_count}) exceeds system limit (60)`,
                path: 'population.civilian_count'
            });
        }
        
        // Check capacity weights
        level.zones.forEach((zone, index) => {
            if (zone.capacity_weight < 0 || zone.capacity_weight > 1) {
                errors.push({
                    code: 'INVALID_WEIGHT',
                    message: `capacity_weight must be between 0.0 and 1.0 (got ${zone.capacity_weight})`,
                    path: `zones[${index}].capacity_weight`
                });
            }
        });
        
        // Check vignette probabilities if present
        if (level.vignettes) {
            level.vignettes.forEach((vignette, index) => {
                if (vignette.probability < 0 || vignette.probability > 1) {
                    errors.push({
                        code: 'INVALID_WEIGHT',
                        message: `vignette probability must be between 0.0 and 1.0 (got ${vignette.probability})`,
                        path: `vignettes[${index}].probability`
                    });
                }
            });
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
}

// Test hook
if (typeof window !== 'undefined') {
    // Browser environment test
    (window as any).LevelLoader = LevelLoader;
    console.log('LevelLoader loaded - available as window.LevelLoader for testing');
}