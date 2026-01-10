// File: src/systems/combat/HeatManager.ts

import { Prop } from '../inventory/PropPool';

// ============================================
// HEAT SYSTEM (Matching combat.md contract)
// ============================================

export type HeatLevel = 'cold' | 'warm' | 'hot' | 'critical';

/**
 * HeatManager matching combat.md contract
 * Tracks player detection risk and killer aggression
 */
export class HeatManager {
    currentHeat: number = 0; // 0-100 scale
    heatDecayRate: number = -0.5; // -0.5 per second (idle)
    private log: Array<{delta: number, reason: string, timestamp: number}> = [];
    
    /**
     * Modify heat value with attribution logging
     * Matching combat.md contract signature
     */
    adjustHeat(delta: number, reason: string): void {
        const oldHeat = this.currentHeat;
        this.currentHeat = Math.max(0, Math.min(100, this.currentHeat + delta));
        
        this.log.push({
            delta,
            reason,
            timestamp: Date.now()
        });
        
        // Keep log manageable
        if (this.log.length > 100) {
            this.log = this.log.slice(-50);
        }
        
        console.log(`Heat adjusted: ${oldHeat} → ${this.currentHeat} (${delta} for: ${reason})`);
    }
    
    /**
     * Returns threat tier
     * Matching combat.md contract signature
     */
    getHeatLevel(): HeatLevel {
        if (this.currentHeat <= 25) return 'cold';
        if (this.currentHeat <= 50) return 'warm';
        if (this.currentHeat <= 75) return 'hot';
        return 'critical';
    }
    
    /**
     * Called by external systems
     * Matching combat.md contract signature
     */
    triggerHeatEvent(actionType: string): void {
        // Map action types to heat adjustments from combat.md ACTION_COSTS
        const heatAdjustments: Record<string, number> = {
            'container_search': 2,
            'sprint': 1,
            'flashlight_use': 3,
            'prop_inspect_crime': 1,
            'prop_inspect_herring': 0
        };
        
        const delta = heatAdjustments[actionType] || 0;
        if (delta !== 0) {
            this.adjustHeat(delta, actionType);
        }
    }
    
    /**
     * Update heat based on decay (called every frame/tick)
     */
    update(deltaTime: number): void {
        // Apply decay if not in critical state
        if (this.currentHeat > 0 && this.getHeatLevel() !== 'critical') {
            const decay = this.heatDecayRate * deltaTime;
            this.adjustHeat(decay, 'idle_decay');
        }
    }
    
    /**
     * Get heat log for debugging UI
     */
    getLog(): Array<{delta: number, reason: string, timestamp: number}> {
        return [...this.log];
    }
}

// ============================================
// KILLER BEHAVIOR (Matching combat.md contract)
// ============================================

/**
 * KillerBehavior matching combat.md contract
 * Defines killer responses to player actions
 */
export class KillerBehavior {
    private heatManager: HeatManager;
    private vignetteManager: any; // Will be injected from world system
    private vignetteSpawnChance = 0.2; // 20% chance
    
    constructor(heatManager: HeatManager) {
        this.heatManager = heatManager;
    }
    
    /**
     * Set vignette manager for spawning new crime scenes
     */
    setVignetteManager(vignetteManager: any): void {
        this.vignetteManager = vignetteManager;
    }
    
    /**
     * Reaction to container interaction
     * Matching combat.md contract signature
     */
    onContainerSearched(prop: Prop, playerPos: [number, number]): void {
        console.log(`Killer reacting to container search at (${playerPos[0]}, ${playerPos[1]})`);
        
        // Increase heat (+2) - already handled by triggerHeatEvent
        // This method logs the reaction
        
        // 20% chance to spawn new vignette nearby if heat > 50
        if (this.heatManager.currentHeat > 50 && Math.random() < this.vignetteSpawnChance) {
            this.spawnNewVignette(playerPos);
        }
        
        // If heat > 75: path to player location
        if (this.heatManager.currentHeat > 75) {
            this.pathToPlayer(playerPos);
        }
    }
    
    /**
     * Mild reaction to prop inspection
     * Matching combat.md contract signature
     */
    onPropInspected(prop: Prop): void {
        console.log(`Killer reacting to prop inspection: ${prop.type} prop`);
        
        // Heat adjustments based on prop type
        if (prop.type === 'crime') {
            this.heatManager.triggerHeatEvent('prop_inspect_crime');
        }
        // herring: no heat change (as per contract)
    }
    
    /**
     * Returns next killer move based on heat level
     * Triggers world.VignetteManager.registerHook() for prop spawning
     * Matching combat.md contract signature
     */
    executeAction(): KillerAction {
        const heatLevel = this.heatManager.getHeatLevel();
        
        switch (heatLevel) {
            case 'cold':
                return this.idleAction();
            case 'warm':
                return this.investigateAction();
            case 'hot':
                return this.stalkAction();
            case 'critical':
                return this.attackAction();
        }
    }
    
    // ============================================
    // PRIVATE HELPER METHODS
    // ============================================
    
    private spawnNewVignette(playerPos: [number, number]): void {
        if (!this.vignetteManager) {
            console.warn('VignetteManager not set for KillerBehavior');
            return;
        }
        
        // Spawn vignette 200-400px away from player
        const angle = Math.random() * Math.PI * 2;
        const distance = 200 + Math.random() * 200;
        const origin: [number, number] = [
            playerPos[0] + Math.cos(angle) * distance,
            playerPos[1] + Math.sin(angle) * distance
        ];
        
        // Get available vignettes (would need biome context)
        const vignetteId = 'stabbing_01'; // Default for now
        this.vignetteManager.placeVignette(vignetteId, origin);
        
        console.log(`Killer spawned new vignette at (${origin[0]}, ${origin[1]})`);
    }
    
    private pathToPlayer(playerPos: [number, number]): void {
        console.log(`Killer pathing to player at (${playerPos[0]}, ${playerPos[1]})`);
        // Would integrate with actual pathfinding system
    }
    
    private idleAction(): KillerAction {
        return {
            type: 'idle',
            duration: 5 + Math.random() * 10,
            description: 'Killer is unaware of player'
        };
    }
    
    private investigateAction(): KillerAction {
        return {
            type: 'investigate',
            duration: 3 + Math.random() * 5,
            description: 'Killer is investigating suspicious activity'
        };
    }
    
    private stalkAction(): KillerAction {
        return {
            type: 'stalk',
            duration: 2 + Math.random() * 3,
            description: 'Killer is stalking the player'
        };
    }
    
    private attackAction(): KillerAction {
        return {
            type: 'attack',
            duration: 1,
            description: 'Killer is attacking!'
        };
    }
}

// ============================================
// TIMER MANAGER (Matching combat.md contract)
// ============================================

/**
 * TimerManager matching combat.md contract
 * Enforces action durations and killer turn timing
 */
export class TimerManager {
    private startTime: number = 0;
    private blockedUntil: number = 0;
    private isBlocked: boolean = false;
    
    constructor() {
        this.startTime = Date.now();
    }
    
    /**
     * Prevents player input during container search
     * Matching combat.md contract signature
     */
    blockActions(duration: number): void {
        this.blockedUntil = Date.now() + (duration * 1000);
        this.isBlocked = true;
        console.log(`Actions blocked for ${duration} seconds`);
        
        // Auto-unblock after duration
        setTimeout(() => {
            this.isBlocked = false;
            console.log('Actions unblocked');
        }, duration * 1000);
    }
    
    /**
     * Returns seconds since level start
     * Matching combat.md contract signature
     */
    getElapsedTime(): number {
        return (Date.now() - this.startTime) / 1000;
    }
    
    /**
     * Check if actions are currently blocked
     */
    areActionsBlocked(): boolean {
        if (this.isBlocked && Date.now() < this.blockedUntil) {
            return true;
        }
        this.isBlocked = false;
        return false;
    }
    
    /**
     * Force unblock actions (emergency/cancel)
     */
    unblockActions(): void {
        this.isBlocked = false;
        this.blockedUntil = 0;
    }
}

// ============================================
// ACTION COSTS TABLE (Matching combat.md contract)
// ============================================

export const ACTION_COSTS = {
    'inspect_prop': { duration: 2.0, heat: 0 },
    'search_container': { duration: 5.0, heat: 2 },
    'add_to_evidence': { duration: 1.0, heat: 0 },
    'sprint': { duration: null, heat: 1 }, // Per second
    'use_flashlight': { duration: null, heat: 3 } // One-time cost
};

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface KillerAction {
    type: 'idle' | 'investigate' | 'stalk' | 'attack';
    duration: number;
    description: string;
}

// ============================================
// SMOKE TEST
// ============================================

if (typeof window !== 'undefined' && (window as any).TEST_HEAT_SYSTEM) {
    console.log('=== Heat System Smoke Test ===');
    
    // Test 1: HeatManager basic operations
    const heatManager = new HeatManager();
    
    heatManager.adjustHeat(30, 'test_rise');
    console.log(`Heat after +30: ${heatManager.currentHeat} (level: ${heatManager.getHeatLevel()})`);
    
    heatManager.adjustHeat(-10, 'test_drop');
    console.log(`Heat after -10: ${heatManager.currentHeat} (level: ${heatManager.getHeatLevel()})`);
    
    heatManager.adjustHeat(100, 'overflow_test');
    console.log(`Heat clamped at: ${heatManager.currentHeat} (should be 100)`);
    
    // Test 2: Trigger events
    heatManager.currentHeat = 50;
    heatManager.triggerHeatEvent('container_search');
    console.log(`Heat after container search: ${heatManager.currentHeat} (should be 52)`);
    
    // Test 3: KillerBehavior
    const killerBehavior = new KillerBehavior(heatManager);
    const action = killerBehavior.executeAction();
    console.log(`Killer action at heat ${heatManager.currentHeat}: ${action.type} - ${action.description}`);
    
    // Test 4: TimerManager
    const timerManager = new TimerManager();
    timerManager.blockActions(0.1); // Short block for test
    console.log(`Actions blocked: ${timerManager.areActionsBlocked()}`);
    console.log(`Elapsed time: ${timerManager.getElapsedTime()}s`);
    
    setTimeout(() => {
        console.log(`After 0.1s, actions blocked: ${timerManager.areActionsBlocked()}`);
        console.log('=== Heat System Smoke Test Complete ===');
    }, 150);
}