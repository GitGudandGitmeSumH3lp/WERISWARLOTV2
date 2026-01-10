// File: src/systems/core/InteractionManager.ts
import { Prop } from '../inventory/PropPool'; 

// ============================================
// TYPE DEFINITIONS FOR PIXI INTEGRATION
// ============================================

/**
 * PixiJS v8 Sprite interface matching contract requirements
 * This would be imported from actual Pixi types in production
 */
interface PixiSprite {
    eventMode: 'static' | 'dynamic' | 'none' | 'auto' | 'passive';
    hitArea: { x: number, y: number, width: number, height: number } | null;
    zIndex: number;
    cursor: 'pointer' | 'default' | 'wait' | 'help' | 'not-allowed';
    on: (event: string, handler: Function) => void;
    off: (event: string, handler: Function) => void;
    x: number;
    y: number;
    visible: boolean;
    destroy: (options?: any) => void;
}

interface PixiContainer {
    eventMode: 'static' | 'dynamic' | 'none' | 'auto' | 'passive';
    interactiveChildren: boolean;
    sortableChildren: boolean;
    children: PixiSprite[];
    addChild: (child: PixiSprite) => void;
    removeChild: (child: PixiSprite) => void;
}

interface PixiApplication {
    stage: PixiContainer;
    renderer: {
        width: number;
        height: number;
    };
}

// ============================================
// INTERACTION MANAGER (Matching 00_CORE.md contract)
// ============================================

/**
 * InteractionManager matching 00_CORE.md contract
 * Handles mouse/touch input for prop interactions
 */
export class InteractionManager {
    private app: PixiApplication | null = null;
    private registeredProps: Map<string, { sprite: PixiSprite, prop: Prop }> = new Map();
    private onInspect: ((prop: Prop) => void) | null = null;
    private zSorter: ZSorter;
    
    constructor() {
        this.zSorter = new ZSorter();
    }
    
    /**
     * Initialize with Pixi application
     */
    initialize(app: PixiApplication, onInspect: (prop: Prop) => void): void {
        this.app = app;
        this.onInspect = onInspect;
        console.log('InteractionManager initialized');
    }
    
    /**
     * Sets up click handler for a prop sprite
     * Matching 00_CORE.md contract signature
     */
    registerProp(sprite: PixiSprite, prop: Prop): void {
        if (!this.app || !this.onInspect) {
            console.warn('InteractionManager not initialized');
            return;
        }
        
        // Configure sprite as per contract
        sprite.eventMode = 'static';
        
        // Set hit area (using prop bounds or manifest data)
        // For now, use reasonable defaults - would come from PropAtlas.getHitbox()
        sprite.hitArea = {
            x: -16,
            y: -16,
            width: 32,
            height: 32
        };
        
        sprite.cursor = 'pointer';
        sprite.zIndex = sprite.y; // Initial z-index
        
        // Store reference
        this.registeredProps.set(prop.id, { sprite, prop });
        
        // Set up click handler
        const clickHandler = () => {
            if (this.onInspect) {
                this.onInspect(prop);
            }
        };
        
        sprite.on('pointerdown', clickHandler);
        
        // Store handler for cleanup
        (sprite as any)._clickHandler = clickHandler;
        
        console.log(`Registered prop: ${prop.id} at (${prop.x}, ${prop.y})`);
    }
    
    /**
     * Allows sub-props inside containers to receive clicks
     * Matching 00_CORE.md contract signature
     */
    enableRecursiveHitTest(containerSprite: PixiContainer): void {
        containerSprite.interactiveChildren = true;
        console.log('Enabled recursive hit test for container');
    }
    
    /**
     * Blocks all Pixi events during container search
     * Matching 00_CORE.md contract signature
     */
    disableInputDuringSearch(): void {
        if (!this.app) return;
        
        this.app.stage.eventMode = 'none';
        console.log('Input disabled during search');
        
        // Re-enable after 5 seconds (container search duration)
        setTimeout(() => {
            this.enableInput();
        }, 5000);
    }
    
    /**
     * Re-enable input after search
     */
    enableInput(): void {
        if (!this.app) return;
        
        this.app.stage.eventMode = 'static';
        console.log('Input re-enabled');
    }
    
    /**
     * Update prop position and z-index
     */
    updatePropPosition(propId: string, x: number, y: number): void {
        const entry = this.registeredProps.get(propId);
        if (entry) {
            entry.sprite.x = x;
            entry.sprite.y = y;
            entry.sprite.zIndex = y;
            entry.prop.x = x;
            entry.prop.y = y;
            
            // Force z-sort update
            this.zSorter.forceUpdate(entry.sprite);
        }
    }
    
    /**
     * Remove prop from interaction system
     */
    unregisterProp(propId: string): void {
        const entry = this.registeredProps.get(propId);
        if (entry) {
            // Remove event listener
            if ((entry.sprite as any)._clickHandler) {
                entry.sprite.off('pointerdown', (entry.sprite as any)._clickHandler);
            }
            
            this.registeredProps.delete(propId);
            console.log(`Unregistered prop: ${propId}`);
        }
    }
    
    /**
     * Clean up all registered props
     */
cleanup(): void {
    // FIXED: Convert Map to array for ES5 compatibility
    const entries: Array<[string, { sprite: PixiSprite; prop: Prop; }]> = [];
    this.registeredProps.forEach((value, key) => {
        entries.push([key, value]);
    });
    
    for (const [propId, entry] of entries) {
        if ((entry.sprite as any)._clickHandler) {
            entry.sprite.off('pointerdown', (entry.sprite as any)._clickHandler);
        }
    }
    this.registeredProps.clear();
    console.log('InteractionManager cleaned up');
}
}

// ============================================
// Z-SORTER (Matching 00_CORE.md contract)
// ============================================

/**
 * ZSorter matching 00_CORE.md contract
 * Ensures proper depth layering for props
 */
export class ZSorter {
    /**
     * Update z-index based on y-position for all children
     * Matching 00_CORE.md contract signature
     */
    sortByY(container: PixiContainer): void {
        container.sortableChildren = true;
        
        for (const child of container.children) {
            child.zIndex = child.y;
        }
        
        // Sort children array by zIndex
        container.children.sort((a, b) => a.zIndex - b.zIndex);
    }
    
    /**
     * Manually triggers z-index recalculation after prop movement
     * Matching 00_CORE.md contract signature
     */
    forceUpdate(sprite: PixiSprite): void {
        sprite.zIndex = sprite.y;
        // The parent container should call sortByY() periodically
    }
}

// ============================================
// PROP CULLING (Matching 00_CORE.md contract)
// ============================================

/**
 * PropCulling matching 00_CORE.md contract
 * Optimizes rendering for 60 prop limit
 */
export class PropCulling {
    private readonly MAX_VISIBLE_DISTANCE = 400; // pixels
    private lastUpdateTime: number = 0;
    private readonly UPDATE_INTERVAL = 1000 / 30; // 30 TPS
    
    /**
     * Sets sprite.visible = false for off-screen props
     * Matching 00_CORE.md contract signature
     */
    updateVisibility(camera: { x: number, y: number, width: number, height: number }, props: Array<{ sprite: PixiSprite, prop: Prop }>): void {
        const now = Date.now();
        if (now - this.lastUpdateTime < this.UPDATE_INTERVAL) {
            return; // Respect 30 TPS constraint
        }
        
        this.lastUpdateTime = now;
        
        const cameraCenterX = camera.x + camera.width / 2;
        const cameraCenterY = camera.y + camera.height / 2;
        
        for (const entry of props) {
            const distanceX = Math.abs(entry.sprite.x - cameraCenterX);
            const distanceY = Math.abs(entry.sprite.y - cameraCenterY);
            const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
            
            entry.sprite.visible = distance <= this.MAX_VISIBLE_DISTANCE;
        }
    }
    
    /**
     * Keeps Crime and Container props always loaded
     * Culls Ambiance props first when nearing 60-prop limit
     * Matching 00_CORE.md contract signature
     */
    prioritizeInteractive(props: Prop[]): Prop[] {
        // Separate by priority
        const highPriority: Prop[] = []; // Crime and Container
        const lowPriority: Prop[] = []; // Ambiance
        const mediumPriority: Prop[] = []; // Herring
        
        for (const prop of props) {
            if (prop.type === 'crime' || prop.type === 'container') {
                highPriority.push(prop);
            } else if (prop.type === 'ambiance') {
                lowPriority.push(prop);
            } else {
                mediumPriority.push(prop);
            }
        }
        
        // Combine with priority order
        const prioritized: Prop[] = [...highPriority, ...mediumPriority];
        
        // Add ambiance props until we reach limit
        const MAX_TOTAL = 60;
        const remainingSlots = MAX_TOTAL - prioritized.length;
        if (remainingSlots > 0) {
            prioritized.push(...lowPriority.slice(0, remainingSlots));
        }
        
        return prioritized.slice(0, MAX_TOTAL);
    }
}

// ============================================
// SMOKE TEST
// ============================================

if (typeof window !== 'undefined' && (window as any).TEST_INTERACTION_SYSTEM) {
    console.log('=== Interaction System Smoke Test ===');
    
    // Test 1: ZSorter
    const zSorter = new ZSorter();
    
    // Mock sprite objects
    const mockSprites: any[] = [
        { x: 100, y: 200, zIndex: 0 },
        { x: 150, y: 100, zIndex: 0 },
        { x: 200, y: 300, zIndex: 0 }
    ];
    
    const mockContainer: any = {
        children: [...mockSprites],
        sortableChildren: false
    };
    
    zSorter.sortByY(mockContainer);
    console.log(`Container sortableChildren: ${mockContainer.sortableChildren}`);
    console.log('Sprite zIndex after sort:', mockSprites.map(s => ({ y: s.y, zIndex: s.zIndex })));
    
    // Test 2: PropCulling
    const propCulling = new PropCulling();
    
    const mockProps: Array<{ sprite: any, prop: Prop }> = [
        { 
            sprite: { x: 100, y: 100, visible: true },
            prop: { 
                id: 'test1', type: 'crime', appearance: 'weapon', 
                description: 'test', evidenceValue: 50, inspected: false, 
                addedToEvidence: false, biome: 'park', x: 100, y: 100 
            }
        },
        { 
            sprite: { x: 1000, y: 1000, visible: true },
            prop: { 
                id: 'test2', type: 'ambiance', appearance: 'organic', 
                description: 'test', evidenceValue: 0, inspected: false, 
                addedToEvidence: false, biome: 'park', x: 1000, y: 1000 
            }
        }
    ];
    
    const camera = { x: 0, y: 0, width: 1280, height: 720 };
    propCulling.updateVisibility(camera, mockProps);
    
    console.log(`Prop visibility: near=${mockProps[0].sprite.visible}, far=${mockProps[1].sprite.visible}`);
    
    // Test 3: Priority sorting
    const testProps: Prop[] = [];
    for (let i = 0; i < 100; i++) {
        const type = i % 4 === 0 ? 'crime' : i % 4 === 1 ? 'container' : i % 4 === 2 ? 'herring' : 'ambiance';
        testProps.push({
            id: `test_${i}`,
            type: type as any,
            appearance: 'weapon',
            description: 'test',
            evidenceValue: 50,
            inspected: false,
            addedToEvidence: false,
            biome: 'park',
            x: i * 10,
            y: i * 10
        });
    }
    
    const prioritized = propCulling.prioritizeInteractive(testProps);
    console.log(`Prioritized ${prioritized.length} props (max 60)`);
    
    const counts: Record<string, number> = { crime: 0, container: 0, herring: 0, ambiance: 0 };
    prioritized.forEach(p => counts[p.type]++);
    console.log('Priority distribution:', counts);
    
    console.log('=== Interaction System Smoke Test Complete ===');
}