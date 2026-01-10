// File: src/systems/world/PropSpawner.ts

import { Prop, PropType, BiomeType, PropPool } from '../inventory/PropPool';

// ============================================
// BIOME RULES (Matching world.md contract)
// ============================================

/**
 * BiomeRules matching world.md contract
 * Defines prop appearance constraints per location
 */
export class BiomeRules {
    name: BiomeType;
    allowedAppearances: string[];
    ambientProps: string[];
    containerTypes: string[];

    constructor(
        name: BiomeType,
        allowedAppearances: string[],
        ambientProps: string[],
        containerTypes: string[]
    ) {
        this.name = name;
        this.allowedAppearances = allowedAppearances;
        this.ambientProps = ambientProps;
        this.containerTypes = containerTypes;
    }

    /**
     * Check if prop.appearance allowed in this biome
     * Matching world.md contract signature
     */
    validateProp(prop: Prop): boolean {
        return this.allowedAppearances.includes(prop.appearance);
    }
}

/**
 * BIOME_CONFIGS matching world.md contract exactly
 */
export const BIOME_CONFIGS: Record<BiomeType, BiomeRules> = {
    'park': new BiomeRules(
        'park',
        ['organic', 'container', 'clothing'],
        ['bench', 'flower_pot', 'newspaper', 'soda_can'],
        ['trash_can', 'park_bag', 'picnic_basket']
    ),
    'docks': new BiomeRules(
        'docks',
        ['tool', 'container', 'weapon'],
        ['rope', 'oil_drum', 'crate', 'anchor'],
        ['toolbox', 'shipping_container', 'duffel_bag']
    ),
    'subway': new BiomeRules(
        'subway',
        ['clothing', 'container', 'organic'],
        ['graffiti', 'newspaper', 'vending_machine', 'ticket'],
        ['locker', 'backpack', 'trash_bin']
    )
};

// ============================================
// VIGNETTE SYSTEM (Matching world.md contract)
// ============================================

/**
 * VignetteManager matching world.md contract
 * Places Crime props using authored scenarios (no randomness)
 */
export class VignetteManager {
    private vignetteRegistry: Map<string, (origin: [number, number]) => Prop[]> = new Map();
    private biomeVignettes: Map<BiomeType, string[]> = new Map();

    constructor() {
        this.initializeVignettes();
    }

    /**
     * Spawns pre-designed Crime prop cluster at origin point
     * Returns list of Crime props with logical spatial relationships
     * Matching world.md contract signature
     */
    placeVignette(vignetteId: string, origin: [number, number]): Prop[] {
        const vignetteFn = this.vignetteRegistry.get(vignetteId);
        if (!vignetteFn) {
            console.warn(`Vignette ${vignetteId} not found`);
            return [];
        }

        return vignetteFn(origin);
    }

    /**
     * Returns available vignette IDs matching biome constraints
     * Matching world.md contract signature
     */
    getVignettesForBiome(biome: BiomeType): string[] {
        return this.biomeVignettes.get(biome) || [];
    }

    /**
     * Links killer behavior to vignette spawning (auto-placement)
     * Matching world.md contract signature
     */
    registerHook(killerAction: string, vignetteId: string): void {
        console.log(`Registered hook: ${killerAction} → ${vignetteId}`);
        // Implementation for killer-triggered vignettes
        // This connects to combat.KillerBehavior in Step 3
    }

    private initializeVignettes(): void {
        // Initialize biome vignette mappings
        this.biomeVignettes.set('park', ['stabbing_01', 'poisoning_03']);
        this.biomeVignettes.set('docks', ['shooting_02', 'drowning_04']);
        this.biomeVignettes.set('subway', ['pushing_05', 'strangling_06']);

        // Define vignette implementations (pre-authored crime clusters)
        this.vignetteRegistry.set('stabbing_01', (origin: [number, number]) => {
            const [x, y] = origin;
            return [
                this.createCrimeProp('knife', 'weapon', x + 20, y + 10, 'Bloody knife with fingerprints'),
                this.createCrimeProp('blood_pool', 'organic', x, y, 'Fresh blood pool, still warm'),
                this.createCrimeProp('torn_fabric', 'clothing', x - 15, y + 5, 'Torn clothing fragment')
            ];
        });

        this.vignetteRegistry.set('shooting_02', (origin: [number, number]) => {
            const [x, y] = origin;
            return [
                this.createCrimeProp('gun', 'weapon', x, y, 'Handgun, recently fired'),
                this.createCrimeProp('shell_casing', 'tool', x + 30, y - 10, 'Spent shell casing'),
                this.createCrimeProp('blood_spatter', 'organic', x - 20, y + 20, 'Blood spatter pattern on wall')
            ];
        });

        this.vignetteRegistry.set('poisoning_03', (origin: [number, number]) => {
            const [x, y] = origin;
            return [
                this.createCrimeProp('bottle', 'container', x, y, 'Empty bottle with chemical residue'),
                this.createCrimeProp('glass', 'tool', x + 25, y + 5, 'Broken drinking glass'),
                this.createCrimeProp('stain', 'organic', x - 10, y + 15, 'Unusual stain on surface')
            ];
        });
    }

    private createCrimeProp(
        idPrefix: string,
        appearance: string,
        x: number,
        y: number,
        description: string
    ): Prop {
        return {
            id: `crime_${idPrefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'crime',
            appearance: appearance as any,
            description: `${description}. This appears to be critical evidence. Further examination is required.`,
            evidenceValue: 70 + Math.floor(Math.random() * 31), // 70-100
            inspected: false,
            addedToEvidence: false,
            biome: 'park', // Will be overridden by WorldBuilder
            x,
            y
        };
    }
}

// ============================================
// PROP DISTRIBUTION LOGIC (Matching world.md contract)
// ============================================

/**
 * PropSpawner matching world.md contract
 * Handles spatial distribution of props across map
 */
export class PropSpawner {
    private readonly MIN_DISTANCE = 32; // pixels as per contract
    private readonly POISSON_MAX_ATTEMPTS = 30;

    /**
     * Returns {propId: (x, y)} mapping
     * Rules from world.md contract:
     * - Crime props placed via Vignettes ONLY
     * - Ambiance props use Poisson disk sampling (min 32px apart)
     * - Container props placed at biome-specific landmarks
     * - Red herrings placed near (but not in) vignettes
     */
    distributeProps(
        propPool: Prop[],
        bounds: [number, number, number, number], // [x, y, width, height]
        avoidAreas: [number, number, number, number][] = []
    ): Map<string, [number, number]> {
        const placements = new Map<string, [number, number]>();
        const [boundsX, boundsY, boundsWidth, boundsHeight] = bounds;

        // Group props by type for different placement strategies
        const crimeProps = propPool.filter(p => p.type === 'crime');
        const herringProps = propPool.filter(p => p.type === 'herring');
        const ambianceProps = propPool.filter(p => p.type === 'ambiance');
        const containerProps = propPool.filter(p => p.type === 'container');

        // Step 1: Crime props are already placed by Vignettes (positions pre-set)
        crimeProps.forEach(prop => {
            if (prop.x !== 0 || prop.y !== 0) { // Already positioned by vignette
                placements.set(prop.id, [prop.x, prop.y]);
            }
        });

        // Step 2: Place container props at biome-specific landmarks
        // For now, use fixed positions - would be authored per biome
        const containerPositions = this.generateContainerLandmarks(
            bounds,
            containerProps.length,
            propPool[0]?.biome || 'park'
        );
        containerProps.forEach((prop, index) => {
            const pos = containerPositions[index] || this.getRandomPosition(bounds, avoidAreas);
            placements.set(prop.id, pos);
            prop.x = pos[0];
            prop.y = pos[1];
        });

        // Step 3: Place herring props near (but not in) vignette areas
        const vignetteCenters = crimeProps.map(p => [p.x, p.y] as [number, number]);
        herringProps.forEach(prop => {
            const pos = this.placeNearVignettes(vignetteCenters, bounds, avoidAreas, 64, 128);
            placements.set(prop.id, pos);
            prop.x = pos[0];
            prop.y = pos[1];
        });

        // Step 4: Place ambiance props using Poisson disk sampling
        const ambiancePlacements = this.poissonDiskSampling(
            bounds,
            ambianceProps.length,
            this.MIN_DISTANCE,
            avoidAreas
        );
        ambianceProps.forEach((prop, index) => {
            const pos = ambiancePlacements[index] || this.getRandomPosition(bounds, avoidAreas);
            placements.set(prop.id, pos);
            prop.x = pos[0];
            prop.y = pos[1];
        });

        return placements;
    }

    /**
     * Returns valid spawn points (avoids walls, NPCs)
     * Matching world.md contract signature
     */
    getPlacementGrid(biome: BiomeType): [number, number][] {
        // For now, return a simple grid - would integrate with actual map data
        const grid: [number, number][] = [];
        const cellSize = 64; // 64px grid
        
        for (let x = 100; x < 1180; x += cellSize) { // Within 1280x720 bounds
            for (let y = 100; y < 620; y += cellSize) {
                grid.push([x, y]);
            }
        }
        
        return grid;
    }

    // ============================================
    // PRIVATE HELPER METHODS
    // ============================================

    private generateContainerLandmarks(
        bounds: [number, number, number, number],
        count: number,
        biome: BiomeType
    ): [number, number][] {
        // Biome-specific landmark positions (would be authored)
        const landmarkTemplates: Record<BiomeType, [number, number][]> = {
            'park': [
                [200, 150], [600, 300], [1000, 200],
                [350, 500], [850, 450], [500, 600], [1100, 550]
            ],
            'docks': [
                [150, 200], [400, 150], [800, 250],
                [300, 450], [700, 400], [1000, 350], [1150, 500]
            ],
            'subway': [
                [180, 250], [450, 180], [850, 220],
                [250, 480], [650, 420], [950, 380], [1080, 520]
            ]
        };

        const landmarks = landmarkTemplates[biome] || landmarkTemplates.park;
        return landmarks.slice(0, count);
    }

    private placeNearVignettes(
        vignetteCenters: [number, number][],
        bounds: [number, number, number, number],
        avoidAreas: [number, number, number, number][],
        minDistance: number,
        maxDistance: number
    ): [number, number] {
        if (vignetteCenters.length === 0) {
            return this.getRandomPosition(bounds, avoidAreas);
        }

        // Try to place near a random vignette
        const center = vignetteCenters[Math.floor(Math.random() * vignetteCenters.length)];
        
        for (let attempt = 0; attempt < 20; attempt++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = minDistance + Math.random() * (maxDistance - minDistance);
            
            const x = center[0] + Math.cos(angle) * distance;
            const y = center[1] + Math.sin(angle) * distance;
            
            if (this.isValidPosition([x, y], bounds, avoidAreas)) {
                return [x, y];
            }
        }
        
        // Fallback to random position
        return this.getRandomPosition(bounds, avoidAreas);
    }

    private poissonDiskSampling(
        bounds: [number, number, number, number],
        numPoints: number,
        minDistance: number,
        avoidAreas: [number, number, number, number][]
    ): [number, number][] {
        const [x, y, width, height] = bounds;
        const points: [number, number][] = [];
        const activeList: [number, number][] = [];
        
        // Start with a random point
        const firstPoint = this.getRandomPosition(bounds, avoidAreas);
        points.push(firstPoint);
        activeList.push(firstPoint);
        
        while (activeList.length > 0 && points.length < numPoints) {
            const randomIndex = Math.floor(Math.random() * activeList.length);
            const point = activeList[randomIndex];
            
            let found = false;
            for (let attempt = 0; attempt < this.POISSON_MAX_ATTEMPTS; attempt++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = minDistance + Math.random() * minDistance;
                
                const newX = point[0] + Math.cos(angle) * distance;
                const newY = point[1] + Math.sin(angle) * distance;
                const newPoint: [number, number] = [newX, newY];
                
                if (this.isValidPosition(newPoint, bounds, avoidAreas) &&
                    !this.isTooClose(newPoint, points, minDistance)) {
                    
                    points.push(newPoint);
                    activeList.push(newPoint);
                    found = true;
                    break;
                }
            }
            
            if (!found) {
                activeList.splice(randomIndex, 1);
            }
        }
        
        return points.slice(0, numPoints);
    }

    private getRandomPosition(
        bounds: [number, number, number, number],
        avoidAreas: [number, number, number, number][] = []
    ): [number, number] {
        const [x, y, width, height] = bounds;
        
        for (let attempt = 0; attempt < 100; attempt++) {
            const posX = x + Math.random() * width;
            const posY = y + Math.random() * height;
            const position: [number, number] = [posX, posY];
            
            if (this.isValidPosition(position, bounds, avoidAreas)) {
                return position;
            }
        }
        
        // Fallback to center if no valid position found
        return [x + width / 2, y + height / 2];
    }

    private isValidPosition(
        position: [number, number],
        bounds: [number, number, number, number],
        avoidAreas: [number, number, number, number][]
    ): boolean {
        const [x, y, width, height] = bounds;
        const [posX, posY] = position;
        
        // Check bounds
        if (posX < x || posX > x + width || posY < y || posY > y + height) {
            return false;
        }
        
        // Check avoid areas
        for (const avoid of avoidAreas) {
            const [ax, ay, aw, ah] = avoid;
            if (posX >= ax && posX <= ax + aw && posY >= ay && posY <= ay + ah) {
                return false;
            }
        }
        
        return true;
    }

    private isTooClose(
        point: [number, number],
        existingPoints: [number, number][],
        minDistance: number
    ): boolean {
        for (const existing of existingPoints) {
            const dx = point[0] - existing[0];
            const dy = point[1] - existing[1];
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < minDistance) {
                return true;
            }
        }
        return false;
    }
}

// ============================================
// WORLD BUILDER (Matching world.md contract)
// ============================================

/**
 * WorldBuilder matching world.md contract
 * Orchestrates full level assembly
 */
export class WorldBuilder {
    private propPool: PropPool;
    private vignetteManager: VignetteManager;
    private propSpawner: PropSpawner;

    constructor() {
        this.propPool = new PropPool();
        this.vignetteManager = new VignetteManager();
        this.propSpawner = new PropSpawner();
    }

    /**
     * Build level following steps from world.md contract:
     * 1. Generate PropPool
     * 2. Place Vignettes
     * 3. Distribute remaining props
     * 4. Validate biome constraints
     */
    buildLevel(
        difficulty: number,
        biome: BiomeType,
        killerProfile: any // KillerData type from actor system
    ): LevelState {
        console.log(`Building level: difficulty=${difficulty}, biome=${biome}`);
        
        // Step 1: Generate PropPool
        const allProps = this.propPool.generateForLevel(difficulty, biome);
        
        // Update biome for all props
        allProps.forEach(prop => prop.biome = biome);
        
        // Step 2: Place Vignettes (Crime props)
        const crimeProps = allProps.filter(p => p.type === 'crime');
        const vignetteIds = this.vignetteManager.getVignettesForBiome(biome);
        
        // Place vignettes at strategic locations
        const vignetteOrigins = this.getVignetteOrigins(biome, vignetteIds.length);
        const vignetteProps: Prop[] = [];
        
        vignetteIds.forEach((vignetteId, index) => {
            if (index < vignetteOrigins.length) {
                const props = this.vignetteManager.placeVignette(vignetteId, vignetteOrigins[index]);
                // Assign crime props to vignette positions
                props.forEach((vignetteProp, propIndex) => {
                    if (propIndex < crimeProps.length) {
                        const crimeProp = crimeProps[propIndex + (index * 3)];
                        if (crimeProp) {
                            crimeProp.x = vignetteProp.x;
                            crimeProp.y = vignetteProp.y;
                            crimeProp.description = vignetteProp.description;
                            vignetteProps.push(crimeProp);
                        }
                    }
                });
            }
        });
        
        // Step 3: Distribute remaining props
        const bounds: [number, number, number, number] = [0, 0, 1280, 720];
        const avoidAreas: [number, number, number, number][] = [
            [0, 0, 100, 720], // Left wall
            [1180, 0, 100, 720], // Right wall
            [0, 0, 1280, 100], // Top wall
            [0, 620, 1280, 100] // Bottom wall
        ];
        
        const placements = this.propSpawner.distributeProps(allProps, bounds, avoidAreas);
        
        // Step 4: Validate biome constraints
        const biomeRules = BIOME_CONFIGS[biome];
        const invalidProps = allProps.filter(prop => !biomeRules.validateProp(prop));
        
        if (invalidProps.length > 0) {
            console.warn(`Found ${invalidProps.length} props violating biome constraints`);
            // Remove or fix invalid props
            invalidProps.forEach(prop => {
                console.warn(`Invalid prop: ${prop.id} with appearance ${prop.appearance} in ${biome}`);
            });
        }
        
        return {
            props: allProps,
            placements: placements,
            biome: biome,
            difficulty: difficulty,
            isValid: invalidProps.length === 0
        };
    }

    /**
     * Spawns new Crime props when killer acts mid-level
     * Matching world.md contract signature
     */
    rebuildAfterKillerAction(action: any): Prop[] {
        // This would be called by combat.KillerBehavior in Step 3
        console.log(`Rebuilding after killer action: ${action.type}`);
        
        // For now, return empty array - implementation depends on killer action system
        return [];
    }

    private getVignetteOrigins(biome: BiomeType, count: number): [number, number][] {
        // Strategic positions for vignettes per biome
        const originTemplates: Record<BiomeType, [number, number][]> = {
            'park': [[300, 200], [800, 300], [500, 500]],
            'docks': [[200, 250], [700, 180], [1000, 350]],
            'subway': [[250, 300], [650, 220], [900, 400]]
        };
        
        const origins = originTemplates[biome] || originTemplates.park;
        return origins.slice(0, count);
    }
}

// ============================================
// LEVEL STATE INTERFACE
// ============================================

export interface LevelState {
    props: Prop[];
    placements: Map<string, [number, number]>;
    biome: BiomeType;
    difficulty: number;
    isValid: boolean;
}

// ============================================
// SMOKE TEST
// ============================================

if (typeof window !== 'undefined' && (window as any).TEST_WORLD_SYSTEM) {
    console.log('=== World System Smoke Test ===');
    
    // Test 1: Biome Rules Validation
    const parkRules = BIOME_CONFIGS.park;
    const testProp: Prop = {
        id: 'test',
        type: 'crime',
        appearance: 'organic',
        description: 'Test',
        evidenceValue: 50,
        inspected: false,
        addedToEvidence: false,
        biome: 'park',
        x: 0,
        y: 0
    };
    
    console.log(`Park validates organic prop: ${parkRules.validateProp(testProp)}`);
    
    const invalidProp: Prop = {
        ...testProp,
        appearance: 'tool' // Not allowed in park
    };
    console.log(`Park validates tool prop: ${parkRules.validateProp(invalidProp)} (should be false)`);
    
    // Test 2: Vignette Manager
    const vignetteManager = new VignetteManager();
    const vignettes = vignetteManager.getVignettesForBiome('park');
    console.log(`Park vignettes: ${vignettes.join(', ')}`);
    
    // Test 3: Prop Spawner
    const propSpawner = new PropSpawner();
    const bounds: [number, number, number, number] = [0, 0, 1280, 720];
    const grid = propSpawner.getPlacementGrid('park');
    console.log(`Placement grid points: ${grid.length}`);
    
    // Test 4: World Builder Integration
    const worldBuilder = new WorldBuilder();
    const levelState = worldBuilder.buildLevel(3, 'park', {});
    
    console.log(`Level built: ${levelState.props.length} total props`);
    console.log(`Level valid: ${levelState.isValid}`);
    
    // Check crime prop placement
    const crimeProps = levelState.props.filter(p => p.type === 'crime');
    console.log(`Crime props placed: ${crimeProps.length}, positions: ${crimeProps.map(p => `(${Math.round(p.x)},${Math.round(p.y)})`).join(', ')}`);
    
    console.log('=== World System Smoke Test Complete ===');
}