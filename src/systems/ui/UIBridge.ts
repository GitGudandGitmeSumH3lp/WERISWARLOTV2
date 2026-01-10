// File: src/systems/ui/UIBridge.ts
import { Prop, PropPool, ContainerManager } from '../inventory/PropPool';
import { usePropStore } from '../../stores/propStore';
import { useEvidenceStore } from '../../stores/propStore';
import { HeatManager } from '../combat/HeatManager';
import { TimerManager } from '../combat/HeatManager';

// ============================================
// UI BRIDGE (Matching ui.md contract)
// ============================================

/**
 * UIBridge matching ui.md contract
 * Connects Pixi click events to React state updates
 */
export class UIBridge {
    private heatManager: HeatManager | null = null;
    private containerManager: ContainerManager | null = null;
    private timerManager: TimerManager | null = null;
    private propPool: PropPool | null = null; // Add this
    private unsubscribeCallbacks: Array<() => void> = [];
    
    /**
     * Initialize with required systems
     */
    initialize(
        heatManager: HeatManager,
        containerManager: ContainerManager,
        timerManager: TimerManager,
        propPool?: PropPool // Add this parameter
    ): void {
        this.heatManager = heatManager;
        this.containerManager = containerManager;
        this.timerManager = timerManager;
        this.propPool = propPool || null;
        console.log('UIBridge initialized');
    }
    
    registerPropClick(propId: string, callback: () => void): void {
        // FIXED: Correct Zustand subscribe signature
    const unsubscribe = usePropStore.subscribe(
        (state, prevState) => {
            // Return the value to compare
            const currentInspectedPropId = state.inspectedProp?.id;
            const previousInspectedPropId = prevState.inspectedProp?.id;
            if (currentInspectedPropId === propId) {
                callback();
            }
            return currentInspectedPropId;
        }
    );
        
        this.unsubscribeCallbacks.push(unsubscribe);
    }
    
    /**
     * Updates React state when prop.inspected or prop.addedToEvidence changes
     * Matching ui.md contract signature
     */
    syncPropState(prop: Prop): void {
        // This would be called when prop state changes externally
        // For now, we rely on the store to manage state
        console.log(`Syncing prop state: ${prop.id}`, {
            inspected: prop.inspected,
            addedToEvidence: prop.addedToEvidence
        });
    }
    
    /**
     * Handle prop inspection (called from Pixi click)
     */
    handlePropInspect(prop: Prop): void {
        console.log(`UI Bridge: Inspecting prop ${prop.id}`);
        
        // Update store
        usePropStore.getState().setInspectedProp(prop);
        
        // Trigger heat event if crime prop
        if (prop.type === 'crime' && this.heatManager) {
            this.heatManager.triggerHeatEvent('prop_inspect_crime');
        }
    }
    
    /**
     * Handle add to evidence action
     */
    handleAddEvidence(prop: Prop): void {
        console.log(`UI Bridge: Adding ${prop.id} to evidence`);
        
        // Update evidence store
        useEvidenceStore.getState().addProp(prop);
        
        // Sync prop state
        this.syncPropState(prop);
    }
    
    /**
     * Handle container search action
     */
    handleSearchContainer(prop: Prop): void {
        if (!this.containerManager || !this.heatManager || !this.timerManager) {
            console.error('UIBridge systems not initialized');
            return;
        }
        
        console.log(`UI Bridge: Searching container ${prop.id}`);
        
        // Start search in store
        usePropStore.getState().startSearch(prop);
        
        // Block actions for 5 seconds
        this.timerManager.blockActions(5);
        
        // Add heat
        this.heatManager.triggerHeatEvent('container_search');
        
         // Simulate search completion after 5 seconds
        setTimeout(() => {
            if (this.containerManager && this.propPool) {
                // FIXED: Now has both required arguments
                const subProps = this.containerManager.searchContainer(prop, this.propPool);
                
                // Complete search in store
                usePropStore.getState().completeSearch(subProps);
                
                // Sync prop state
                this.syncPropState(prop);
                
                console.log(`Container search completed, found ${subProps.length} items`);
            } else {
                console.error('Missing containerManager or propPool');
            }
        }, 5000);
    }
    
    /**
     * Close inspection overlay
     */
    handleCloseInspection(): void {
        usePropStore.getState().setInspectedProp(null);
    }
    
    /**
     * Get current inspected prop from store
     */
    getInspectedProp(): Prop | null {
        return usePropStore.getState().inspectedProp;
    }
    
    /**
     * Check if search is in progress
     */
    isSearchInProgress(): boolean {
        return usePropStore.getState().searchInProgress;
    }
    
    /**
     * Clean up subscriptions
     */
    cleanup(): void {
        this.unsubscribeCallbacks.forEach(unsubscribe => unsubscribe());
        this.unsubscribeCallbacks = [];
        console.log('UIBridge cleaned up');
    }
}

// ============================================
// INSPECTION UI PROTOCOL IMPLEMENTATION
// ============================================

/**
 * InspectionUI implementation matching ui.md Python protocol
 * Bridge between Pixi click events and React overlay
 */
export class InspectionUI {
    private uiBridge: UIBridge;
    
    constructor(uiBridge: UIBridge) {
        this.uiBridge = uiBridge;
    }
    
    /**
     * Opens inspection overlay with prop data
     * Matching ui.md protocol signature
     */
    show(prop: Prop): void {
        this.uiBridge.handlePropInspect(prop);
    }
    
    /**
     * Closes overlay, resumes game
     * Matching ui.md protocol signature
     */
    hide(): void {
        this.uiBridge.handleCloseInspection();
    }
    
    /**
     * Calls inventory.Evidence.add(prop)
     * Matching ui.md protocol signature
     */
    handleAddEvidence(prop: Prop): void {
        this.uiBridge.handleAddEvidence(prop);
    }
    
    /**
     * Calls inventory.ContainerManager.searchContainer()
     * Matching ui.md protocol signature
     */
    handleSearchContainer(prop: Prop): void {
        this.uiBridge.handleSearchContainer(prop);
    }
}

// ============================================
// PROP TOOLTIP IMPLEMENTATION
// ============================================

/**
 * PropTooltip implementation matching ui.md protocol
 * Brief preview on mouse hover (before inspection)
 */
export class PropTooltip {
    private tooltipElement: HTMLElement | null = null;
    
    constructor() {
        this.createTooltipElement();
    }
    
    /**
     * Shows tooltip with prop info
     * Matching ui.md protocol signature
     */
    show(prop: Prop, x: number, y: number): void {
        if (!this.tooltipElement) return;
        
        // Update content
        this.tooltipElement.innerHTML = `
            <div style="font-weight: bold; color: #e0e0ff; margin-bottom: 4px;">
                ${this.formatPropName(prop.appearance)}
            </div>
            <div style="font-size: 12px; color: #aaa; margin-bottom: 4px;">
                ${this.getAppearanceIcon(prop.appearance)}
            </div>
            <div style="font-size: 11px; color: #888;">
                Click to inspect
            </div>
        `;
        
        // Position
        this.tooltipElement.style.left = `${x + 10}px`;
        this.tooltipElement.style.top = `${y + 10}px`;
        this.tooltipElement.style.display = 'block';
    }
    
    /**
     * Hides tooltip on mouse leave
     * Matching ui.md protocol signature
     */
    hide(): void {
        if (this.tooltipElement) {
            this.tooltipElement.style.display = 'none';
        }
    }
    
    private createTooltipElement(): void {
        this.tooltipElement = document.createElement('div');
        this.tooltipElement.style.cssText = `
            position: fixed;
            background: rgba(26, 26, 46, 0.95);
            border: 1px solid #4a4a6d;
            border-radius: 6px;
            padding: 10px;
            color: white;
            font-family: Arial, sans-serif;
            font-size: 14px;
            z-index: 10000;
            pointer-events: none;
            display: none;
            max-width: 200px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;
        document.body.appendChild(this.tooltipElement);
    }
    
    private formatPropName(appearance: string): string {
        return appearance
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    
    private getAppearanceIcon(appearance: string): string {
        const icons: Record<string, string> = {
            'weapon': '⚔️',
            'clothing': '👕',
            'tool': '🛠️',
            'organic': '🧬',
            'container': '📦'
        };
        return icons[appearance] || '🔍';
    }
}

// ============================================
// MAIN UI INTEGRATION FUNCTION
// ============================================

/**
 * Sets up the complete UI system integration
 */
export function setupUISystem(
    heatManager: HeatManager,
    containerManager: ContainerManager,
    timerManager: TimerManager
): {
    uiBridge: UIBridge;
    inspectionUI: InspectionUI;
    tooltip: PropTooltip;
} {
    const uiBridge = new UIBridge();
    uiBridge.initialize(heatManager, containerManager, timerManager);
    
    const inspectionUI = new InspectionUI(uiBridge);
    const tooltip = new PropTooltip();
    
    console.log('UI System setup complete');
    
    return {
        uiBridge,
        inspectionUI,
        tooltip
    };
}

// ============================================
// SMOKE TEST
// ============================================

if (typeof window !== 'undefined' && (window as any).TEST_UI_BRIDGE) {
    console.log('=== UI Bridge Smoke Test ===');
    
    // Create mock systems
    const mockHeatManager = {
        triggerHeatEvent: (action: string) => console.log(`Heat event: ${action}`)
    } as any;
    
    const mockContainerManager = {
        searchContainer: (prop: any) => {
            console.log(`Searching container: ${prop.id}`);
            return [];
        }
    } as any;
    
    const mockTimerManager = {
        blockActions: (duration: number) => console.log(`Blocking actions for ${duration}s`)
    } as any;
    
    // Test setup
    const { uiBridge, inspectionUI, tooltip } = setupUISystem(
        mockHeatManager,
        mockContainerManager,
        mockTimerManager
    );
    
    console.log('UI System components created:', {
        uiBridge: !!uiBridge,
        inspectionUI: !!inspectionUI,
        tooltip: !!tooltip
    });
    
    // Test prop tooltip
    const testProp: Prop = {
        id: 'test_tooltip',
        type: 'crime',
        appearance: 'weapon',
        description: 'test',
        evidenceValue: 75,
        inspected: false,
        addedToEvidence: false,
        biome: 'park',
        x: 100,
        y: 100
    };
    
    tooltip.show(testProp, 500, 300);
    console.log('Tooltip shown');
    
    setTimeout(() => {
        tooltip.hide();
        console.log('Tooltip hidden');
        console.log('=== UI Bridge Smoke Test Complete ===');
    }, 100);
}