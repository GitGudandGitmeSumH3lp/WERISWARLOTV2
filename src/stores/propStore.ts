// File: src/stores/propStore.ts

import { create } from 'zustand';
import { Prop } from '../systems/inventory/PropPool';

// ============================================
// PROP STORE SLICE (Matching ui.md contract)
// ============================================

interface PropStoreSlice {
    // State
    inspectedProp: Prop | null;
    searchInProgress: boolean;
    searchProgress: number; // 0-1
    
    // Actions
    setInspectedProp: (prop: Prop | null) => void;
    startSearch: (prop: Prop) => void;
    completeSearch: (subProps: Prop[]) => void;
    updateSearchProgress: (progress: number) => void;
    resetSearch: () => void;
}

/**
 * Zustand store slice for prop interactions
 * Matching ui.md PropStoreSlice contract
 */
export const usePropStore = create<PropStoreSlice>((set) => ({
    // Initial state
    inspectedProp: null,
    searchInProgress: false,
    searchProgress: 0,
    
    // Actions
    setInspectedProp: (prop) => {
        set({ inspectedProp: prop });
        
        // Log for debugging
        if (prop) {
            console.log(`Inspecting prop: ${prop.id} (${prop.type})`);
        } else {
            console.log('Closed inspection overlay');
        }
    },
    
    startSearch: (prop) => {
        if (prop.type !== 'container') {
            console.warn('Cannot search non-container prop');
            return;
        }
        
        console.log(`Starting search on container: ${prop.id}`);
        set({ 
            searchInProgress: true,
            searchProgress: 0,
            inspectedProp: prop // Keep prop visible during search
        });
        
        // Start progress animation (would be handled by SearchProgressBar)
        // This is just the store update - animation happens in component
    },
    
    completeSearch: (subProps) => {
        console.log(`Search completed, found ${subProps.length} sub-props`);
        
        // Update the inspected prop with contents
        set((state) => {
            if (state.inspectedProp) {
                const updatedProp = {
                    ...state.inspectedProp,
                    contents: subProps,
                    inspected: true
                };
                
                return {
                    inspectedProp: updatedProp,
                    searchInProgress: false,
                    searchProgress: 1
                };
            }
            
            return {
                searchInProgress: false,
                searchProgress: 1
            };
        });
    },
    
    updateSearchProgress: (progress) => {
        // Clamp between 0 and 1
        const clampedProgress = Math.max(0, Math.min(1, progress));
        set({ searchProgress: clampedProgress });
    },
    
    resetSearch: () => {
        set({ 
            searchInProgress: false,
            searchProgress: 0
        });
    }
}));

// ============================================
// EVIDENCE STORE (Extension)
// ============================================

interface EvidenceStore {
    evidenceProps: Prop[];
    totalValue: number;
    
    addProp: (prop: Prop) => void;
    removeProp: (propId: string) => void;
    getTotalValue: () => number;
}

export const useEvidenceStore = create<EvidenceStore>((set, get) => ({
    evidenceProps: [],
    totalValue: 0,
    
    addProp: (prop) => {
        // Check if already in evidence
        const alreadyAdded = get().evidenceProps.some(p => p.id === prop.id);
        if (alreadyAdded) {
            console.warn(`Prop ${prop.id} already in evidence`);
            return;
        }
        
        // Mark prop as added
        prop.addedToEvidence = true;
        
        // Add to evidence with animation timestamp
        const propWithTimestamp = {
            ...prop,
            addedAt: Date.now()
        };
        
        set((state) => ({
            evidenceProps: [...state.evidenceProps, propWithTimestamp],
            totalValue: state.totalValue + prop.evidenceValue
        }));
        
        console.log(`Added ${prop.id} to evidence. Total value: ${get().totalValue}`);
    },
    
    removeProp: (propId: string) => {
        set((state) => {
            const propToRemove = state.evidenceProps.find(p => p.id === propId);
            if (!propToRemove) return state;
            
            return {
                evidenceProps: state.evidenceProps.filter(p => p.id !== propId),
                totalValue: state.totalValue - (propToRemove.evidenceValue || 0)
            };
        });
    },
    
    getTotalValue: () => {
        return get().totalValue;
    }
}));

// ============================================
// SELECTORS (For performance optimization)
// ============================================

export const selectInspectedProp = (state: PropStoreSlice) => state.inspectedProp;
export const selectIsSearching = (state: PropStoreSlice) => state.searchInProgress;
export const selectSearchProgress = (state: PropStoreSlice) => state.searchProgress;
export const selectEvidenceCount = (state: EvidenceStore) => state.evidenceProps.length;
export const selectEvidenceValue = (state: EvidenceStore) => state.totalValue;

// ============================================
// SMOKE TEST
// ============================================

if (typeof window !== 'undefined' && (window as any).TEST_PROP_STORE) {
    console.log('=== Prop Store Smoke Test ===');
    
    // Test store functionality
    const testProp: Prop = {
        id: 'test_prop_1',
        type: 'crime',
        appearance: 'weapon',
        description: 'A test prop',
        evidenceValue: 75,
        inspected: false,
        addedToEvidence: false,
        biome: 'park',
        x: 100,
        y: 100
    };
    
    // Note: In real usage, you'd use hooks in components
    // This is just demonstrating the store structure
    console.log('Store structure created successfully');
    console.log('Selectors defined:', {
        selectInspectedProp,
        selectIsSearching,
        selectSearchProgress
    });
    
    console.log('=== Prop Store Smoke Test Complete ===');
}