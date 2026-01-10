// File: src/systems/inventory/PropPool.ts

// ============================================
// DATA STRUCTURES (Matching inventory.md contract)
// ============================================

/**
 * Prop type definitions matching inventory.md contract
 */
export type PropType = 'crime' | 'herring' | 'ambiance' | 'container';
export type PropAppearance = 'weapon' | 'clothing' | 'tool' | 'organic' | 'container';
export type BiomeType = 'park' | 'docks' | 'subway';

/**
 * Prop entity matching inventory.md contract
 * Note: Using interface instead of class to match TypeScript style
 */
export interface Prop {
    id: string;
    type: PropType;
    appearance: PropAppearance;
    description: string;  // Min 3 sentences
    evidenceValue: number;  // 0-100 scale
    inspected: boolean;
    addedToEvidence: boolean;
    biome: BiomeType;  // Placement constraint
    x: number;
    y: number;
    contents?: Prop[];  // For containers only
    searchDuration?: number;  // Seconds (containers only)
}

/**
 * Evidence inventory matching inventory.md contract
 */
export interface Evidence {
    props: Prop[];
    totalValue: number;
    
    add(prop: Prop): boolean;
    getTotalValue(): number;
}

/**
 * Implementation of Evidence interface
 */
export class EvidenceImpl implements Evidence {
    props: Prop[];
    totalValue: number;

    constructor() {
        this.props = [];
        this.totalValue = 0;
    }

    /**
     * Add prop to evidence if not duplicate
     * Returns true if added, false if duplicate
     */
    add(prop: Prop): boolean {
        // Check for duplicate (same ID)
        if (this.props.some(p => p.id === prop.id)) {
            return false;
        }
        
        this.props.push(prop);
        prop.addedToEvidence = true;
        this.totalValue += prop.evidenceValue;
        return true;
    }

    /**
     * Sum all evidenceValue of collected props
     */
    getTotalValue(): number {
        return this.totalValue;
    }
}

// ============================================
// PROP POOL SYSTEM
// ============================================

/**
 * PropPool matching inventory.md contract
 * Manages prop spawning quotas per level
 */
export class PropPool {
    crime: Prop[] = [];
    herring: Prop[] = [];
    ambiance: Prop[] = [];
    container: Prop[] = [];

    // Helper for generating unique IDs
    private static nextId = 1;
    private generateId(prefix: string): string {
        return `${prefix}_${PropPool.nextId++}`;
    }

    /**
     * Generate props for a level matching quota rules from PROP_SYSTEM.MD
     * 
     * Quota rules:
     * - Crime: 5 + difficulty
     * - Herring: 10 + (difficulty × 2)
     * - Ambiance: fill remaining to reach ~50 total
     * - Container: fixed 7
     */
    generateForLevel(difficulty: number, biome: BiomeType): Prop[] {
        const allProps: Prop[] = [];
        
        // Clear existing pools
        this.crime = [];
        this.herring = [];
        this.ambiance = [];
        this.container = [];

        // 1. Generate Crime props (5 + difficulty)
        const crimeCount = 5 + difficulty;
        for (let i = 0; i < crimeCount; i++) {
            const crimeProp = this.createProp('crime', biome, true);
            this.crime.push(crimeProp);
            allProps.push(crimeProp);
        }

        // 2. Generate Herring props (10 + (difficulty × 2))
        const herringCount = 10 + (difficulty * 2);
        for (let i = 0; i < herringCount; i++) {
            const herringProp = this.getRedHerring(biome);
            this.herring.push(herringProp);
            allProps.push(herringProp);
        }

        // 3. Generate Container props (fixed 7)
        const containerCount = 7;
        for (let i = 0; i < containerCount; i++) {
            const containerProp = this.createContainerProp(biome);
            this.container.push(containerProp);
            allProps.push(containerProp);
        }

        // 4. Generate Ambiance props to reach ~50 total
        const targetTotal = 50;
        const currentCount = allProps.length;
        const ambianceCount = Math.max(0, targetTotal - currentCount);
        
        for (let i = 0; i < ambianceCount; i++) {
            const ambianceProp = this.createProp('ambiance', biome, false);
            this.ambiance.push(ambianceProp);
            allProps.push(ambianceProp);
        }

        console.log(`Generated level props: ${crimeCount} crime, ${herringCount} herring, ${containerCount} containers, ${ambianceCount} ambiance`);
        
        return allProps;
    }

    /**
     * Returns herring matching Crime appearance but low evidenceValue (10-30)
     * Description must be vague ("Looks suspicious...")
     * 
     * Implementation matches biome appearance constraints from world.md
     */
    getRedHerring(biome: BiomeType): Prop {
        // Get allowed appearances for this biome (from world.md BIOME_CONFIGS)
        const allowedAppearances = this.getAllowedAppearancesForBiome(biome);
        
        // Random appearance from allowed list
        const appearance = allowedAppearances[Math.floor(Math.random() * allowedAppearances.length)];
        
        // Low evidence value (10-30) as per contract
        const evidenceValue = 10 + Math.floor(Math.random() * 21); // 10-30
        
        // Vague description as per contract
        const description = `Looks suspicious... There's something about this ${appearance} that doesn't seem quite right. It could be related to the crime, or it might just be a coincidence. Further inspection is needed.`;

        return {
            id: this.generateId('herring'),
            type: 'herring',
            appearance: appearance as PropAppearance,
            description,
            evidenceValue,
            inspected: false,
            addedToEvidence: false,
            biome,
            x: 0, // Will be positioned by PropSpawner
            y: 0
        };
    }

    /**
     * Generate contents for a container
     * Distribution: 40% Crime, 40% Herring, 20% Ambiance
     */
    generateContents(containerType: string, biome: BiomeType): Prop[] {
        const contents: Prop[] = [];
        const count = 1 + Math.floor(Math.random() * 3); // 1-3 props as per plan
        
        for (let i = 0; i < count; i++) {
            const roll = Math.random();
            let prop: Prop;
            
            if (roll < 0.4) {
                // 40% Crime
                prop = this.createProp('crime', biome, true);
            } else if (roll < 0.8) {
                // 40% Herring
                prop = this.getRedHerring(biome);
            } else {
                // 20% Ambiance
                prop = this.createProp('ambiance', biome, false);
            }
            
            contents.push(prop);
        }
        
        return contents;
    }

    // ============================================
    // PRIVATE HELPER METHODS
    // ============================================

    private createProp(type: PropType, biome: BiomeType, isHighValue: boolean): Prop {
        const allowedAppearances = this.getAllowedAppearancesForBiome(biome);
        const appearance = allowedAppearances[Math.floor(Math.random() * allowedAppearances.length)];
        
        // Generate evidence value based on type
        let evidenceValue: number;
        let description: string;
        
        switch (type) {
            case 'crime':
                evidenceValue = isHighValue ? 70 + Math.floor(Math.random() * 31) : 40 + Math.floor(Math.random() * 31);
                description = this.generateCrimeDescription(appearance, biome);
                break;
            case 'herring':
                evidenceValue = 10 + Math.floor(Math.random() * 21); // 10-30
                description = `Looks suspicious... There's something about this ${appearance} that doesn't seem quite right.`;
                break;
            case 'ambiance':
                evidenceValue = 0; // No evidence value for ambiance
                description = this.generateAmbianceDescription(appearance, biome);
                break;
            default:
                evidenceValue = 0;
                description = `A ${appearance} found in the ${biome}.`;
        }
        
        return {
            id: this.generateId(type),
            type,
            appearance: appearance as PropAppearance,
            description,
            evidenceValue,
            inspected: false,
            addedToEvidence: false,
            biome,
            x: 0,
            y: 0
        };
    }

    private createContainerProp(biome: BiomeType): Prop {
        // Get container types for this biome (from world.md BIOME_CONFIGS)
        const containerTypes = this.getContainerTypesForBiome(biome);
        const containerType = containerTypes[Math.floor(Math.random() * containerTypes.length)];
        
        return {
            id: this.generateId('container'),
            type: 'container',
            appearance: 'container',
            description: `A ${containerType} that can be searched for evidence.`,
            evidenceValue: 0, // Container itself has no evidence value
            inspected: false,
            addedToEvidence: false,
            biome,
            x: 0,
            y: 0,
            searchDuration: 5.0
            // contents will be generated when searched
        };
    }

    /**
     * Helper to get allowed appearances per biome (from world.md BIOME_CONFIGS)
     */
    private getAllowedAppearancesForBiome(biome: BiomeType): string[] {
        // Simplified mapping from world.md BIOME_CONFIGS
        const biomeConfigs: Record<BiomeType, string[]> = {
            'park': ['organic', 'container', 'clothing'],
            'docks': ['tool', 'container', 'weapon'],
            'subway': ['clothing', 'container', 'organic']
        };
        
        return biomeConfigs[biome] || ['container']; // Default fallback
    }

    /**
     * Helper to get container types per biome (from world.md BIOME_CONFIGS)
     */
    private getContainerTypesForBiome(biome: BiomeType): string[] {
        // Simplified mapping from world.md BIOME_CONFIGS
        const containerConfigs: Record<BiomeType, string[]> = {
            'park': ['trash_can', 'park_bag', 'picnic_basket'],
            'docks': ['toolbox', 'shipping_container', 'duffel_bag'],
            'subway': ['locker', 'backpack', 'trash_bin']
        };
        
        return containerConfigs[biome] || ['container']; // Default fallback
    }

    /**
     * Generate crime prop description (3+ sentences as per contract)
     */
    private generateCrimeDescription(appearance: string, biome: string): string {
        const details = [
            `This ${appearance} shows clear signs of recent use.`,
            `There are markings that suggest it was involved in some kind of struggle.`,
            `Forensic analysis would likely reveal important clues about what happened here.`,
            `The condition suggests it was used recently in this ${biome}.`,
            `Careful examination reveals details that don't match normal ${appearance} usage.`
        ];
        
        // Return 3-5 sentences
        const sentenceCount = 3 + Math.floor(Math.random() * 3);
        const selectedDetails = [...details]
            .sort(() => Math.random() - 0.5)
            .slice(0, sentenceCount);
        
        return selectedDetails.join(' ');
    }

    /**
     * Generate ambiance prop description (3+ sentences as per contract)
     */
    private generateAmbianceDescription(appearance: string, biome: string): string {
        const details = [
            `A typical ${appearance} found in the ${biome}.`,
            `It shows normal wear and tear from environmental exposure.`,
            `There's nothing particularly remarkable about this item.`,
            `It appears to have been here for some time.`,
            `The ${appearance} serves its usual purpose in this environment.`
        ];
        
        // Return 3-5 sentences
        const sentenceCount = 3 + Math.floor(Math.random() * 3);
        const selectedDetails = [...details]
            .sort(() => Math.random() - 0.5)
            .slice(0, sentenceCount);
        
        return selectedDetails.join(' ');
    }
}

// ============================================
// CONTAINER MANAGER (Partial - full in Step 3)
// ============================================

/**
 * ContainerManager matching inventory.md contract
 * Note: Full implementation will be in Step 3 with HeatManager integration
 */
export class ContainerManager {
    /**
     * Opens container, returns 1-3 sub-props
     * Note: HeatManager integration will be added in Step 3
     */
    searchContainer(prop: Prop, propPool: PropPool): Prop[] {
        if (prop.type !== 'container' || prop.inspected) {
            return [];
        }
        
        prop.inspected = true;
        
        // Generate contents if not already generated
        if (!prop.contents) {
            prop.contents = propPool.generateContents(prop.appearance, prop.biome);
        }
        
        return prop.contents;
    }

    /**
     * Check if prop.type == 'container' and not inspected
     */
    isSearchable(prop: Prop): boolean {
        return prop.type === 'container' && !prop.inspected;
    }
}

// ============================================
// SMOKE TEST
// ============================================

if (typeof window !== 'undefined' && (window as any).TEST_PROP_POOL) {
    console.log('=== PropPool Smoke Test ===');
    
    const pool = new PropPool();
    
    // Test 1: Generate level props
    const levelProps = pool.generateForLevel(3, 'park');
    console.log(`Generated ${levelProps.length} total props`);
    console.log(`Crime props: ${pool.crime.length}`);
    console.log(`Herring props: ${pool.herring.length}`);
    console.log(`Container props: ${pool.container.length}`);
    console.log(`Ambiance props: ${pool.ambiance.length}`);
    
    // Test 2: Red herring validation
    const herring = pool.getRedHerring('park');
    console.log(`Red herring evidenceValue: ${herring.evidenceValue} (should be 10-30)`);
    console.log(`Red herring description: "${herring.description.substring(0, 50)}..."`);
    
    // Test 3: Container contents generation
    const containerManager = new ContainerManager();
    const containerProp = pool.container[0];
    const contents = containerManager.searchContainer(containerProp, pool);
    console.log(`Container search returned ${contents.length} sub-props (should be 1-3)`);
    
    // Test 4: Evidence system
    const evidence = new EvidenceImpl();
    const crimeProp = pool.crime[0];
    const added = evidence.add(crimeProp);
    console.log(`Evidence add successful: ${added}`);
    console.log(`Total evidence value: ${evidence.getTotalValue()}`);
    
    console.log('=== Smoke Test Complete ===');
}