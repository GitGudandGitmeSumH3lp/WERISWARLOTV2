// src/core/InteractionManager.ts

import * as PIXI from 'pixi.js';
import { CameraController } from './CameraController';

// ---------------------------------------------------------------------
// Public Interfaces (from master-index.md)
// ---------------------------------------------------------------------
export interface InteractionConfig {
    minHitboxRadius: number;    // Default: 22px (44px diameter, iOS guideline)
    highlightColor: number;     // PIXI color for glow effect
    tapDebounceMs: number;      // Default: 150ms (prevent double-taps)
    enableVisualFeedback: boolean; // Default: true
}

export interface InteractionTarget {
    id: string;                           // Unique identifier
    type: "npc" | "prop" | "evidence";    // Category
    sprite: PIXI.Sprite;                  // Visual representation
    hitbox: {
        x: number;                          // World coordinates
        y: number;
        radius: number;                     // Circular hit detection
    };
    metadata?: Record<string, unknown>;   // Custom data (NPC name, prop contents)
}

// ---------------------------------------------------------------------
// Internal Spatial Hash Helper
// ---------------------------------------------------------------------
class SpatialHash {
    private cellSize: number = 100;
    private grid: Map<string, InteractionTarget[]> = new Map();

    insert(target: InteractionTarget): void {
        const cellKey = this.getCellKey(target.hitbox.x, target.hitbox.y);
        if (!this.grid.has(cellKey)) {
            this.grid.set(cellKey, []);
        }
        this.grid.get(cellKey)!.push(target);
    }

    query(x: number, y: number, radius: number): InteractionTarget[] {
        const candidates: InteractionTarget[] = [];
        // Check 3x3 grid around query point
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const cellKey = this.getCellKey(
                    x + dx * this.cellSize,
                    y + dy * this.cellSize
                );
                const cellTargets = this.grid.get(cellKey) || [];
                candidates.push(...cellTargets);
            }
        }
        return candidates;
    }

    remove(target: InteractionTarget): void {
        const cellKey = this.getCellKey(target.hitbox.x, target.hitbox.y);
        const cell = this.grid.get(cellKey);
        if (cell) {
            const index = cell.indexOf(target);
            if (index !== -1) {
                cell.splice(index, 1);
                if (cell.length === 0) {
                    this.grid.delete(cellKey);
                }
            }
        }
    }

    clear(): void {
        this.grid.clear();
    }

    private getCellKey(x: number, y: number): string {
        const cellX = Math.floor(x / this.cellSize);
        const cellY = Math.floor(y / this.cellSize);
        return `${cellX},${cellY}`;
    }
}

// ---------------------------------------------------------------------
// Main InteractionManager Singleton
// ---------------------------------------------------------------------
export class InteractionManager {
    private static instance: InteractionManager | null = null;
    
    private targets: Map<string, InteractionTarget> = new Map();
    private spatialHash: SpatialHash = new SpatialHash();
    private config: InteractionConfig = {
        minHitboxRadius: 22,
        highlightColor: 0xFFFF00,
        tapDebounceMs: 150,
        enableVisualFeedback: true
    };
    
    private interactCallbacks: Set<(target: InteractionTarget) => void> = new Set();
    private highlightCallbacks: Set<(target: InteractionTarget | null) => void> = new Set();
    
    private lastInteraction: Map<string, number> = new Map();
    private canvas: HTMLCanvasElement | null = null;

    private constructor() {
        // Private constructor for singleton
    }

    private static getInstance(): InteractionManager {
        if (!InteractionManager.instance) {
            InteractionManager.instance = new InteractionManager();
        }
        return InteractionManager.instance;
    }

    // ---------------------------------------------------------------------
    // Public API (as defined in master-index.md)
    // ---------------------------------------------------------------------
    static initialize(config: InteractionConfig): void {
        const inst = this.getInstance();
        inst.config = { ...inst.config, ...config }; // Merge with defaults
        
        // Verify CameraController is ready
        if (!CameraController.app) {
            throw new Error("CameraController must be initialized before InteractionManager");
        }
        
        const canvas = CameraController.app.view as HTMLCanvasElement;
        inst.canvas = canvas;
        
        // Unified pointer event (handles touch + mouse)
        canvas.addEventListener("pointerdown", (e: PointerEvent) => {
            e.preventDefault(); // Prevent 300ms tap delay
            inst.handlePointerDown(e.clientX, e.clientY);
        });
        
        // Disable touch scrolling/panning
        canvas.style.touchAction = "none";
    }

    static registerTarget(target: InteractionTarget): void {
        const inst = this.getInstance();
        
        // Validation
        if (!target.id) throw new Error("Target must have id");
        if (!target.sprite) throw new Error("Target must have sprite");
        if (target.hitbox.radius < 10) {
            console.warn(`Hitbox too small: ${target.id}. Minimum 10px recommended.`);
        }
        
        // Duplicate ID check
        if (inst.targets.has(target.id)) {
            console.error(`Duplicate target ID: ${target.id}. Overwriting.`);
        }
        
        inst.targets.set(target.id, target);
        inst.spatialHash.insert(target);
    }

    static unregisterTarget(id: string): void {
        const inst = this.getInstance();
        const target = inst.targets.get(id);
        
        if (target) {
            inst.targets.delete(id);
            inst.spatialHash.remove(target);
        }
    }

    static clearTargets(): void {
        const inst = this.getInstance();
        inst.targets.clear();
        inst.spatialHash.clear();
        inst.lastInteraction.clear();
    }

    static findTarget(worldX: number, worldY: number): InteractionTarget | null {
        const inst = this.getInstance();
        const candidates = inst.spatialHash.query(worldX, worldY, 50);
        
        // Distance sort (closest first)
        candidates.sort((a, b) => {
            const distA = Math.hypot(a.hitbox.x - worldX, a.hitbox.y - worldY);
            const distB = Math.hypot(b.hitbox.x - worldX, b.hitbox.y - worldY);
            return distA - distB;
        });
        
        // Return closest within hitbox radius
        for (const target of candidates) {
            const dist = Math.hypot(target.hitbox.x - worldX, target.hitbox.y - worldY);
            if (dist <= target.hitbox.radius) {
                return target;
            }
        }
        
        return null;
    }

    static getTarget(id: string): InteractionTarget | null {
        return this.getInstance().targets.get(id) || null;
    }

    static onInteract(callback: (target: InteractionTarget) => void): () => void {
        const inst = this.getInstance();
        inst.interactCallbacks.add(callback);
        return () => inst.interactCallbacks.delete(callback);
    }

    static onHighlight(callback: (target: InteractionTarget | null) => void): () => void {
        const inst = this.getInstance();
        inst.highlightCallbacks.add(callback);
        return () => inst.highlightCallbacks.delete(callback);
    }

    // ---------------------------------------------------------------------
    // Private Methods
    // ---------------------------------------------------------------------
    private handlePointerDown(screenX: number, screenY: number): void {
        // Convert screen → world coordinates
        const worldPos = CameraController.screenToWorld(screenX, screenY);
        
        // Find target
        const target = InteractionManager.findTarget(worldPos.x, worldPos.y);
        
        // Notify highlight subscribers
        this.highlightCallbacks.forEach(cb => cb(target));
        
        if (target) {
            // Check debounce
            if (this.isDebounced(target.id)) {
                return;
            }
            
            // Apply visual feedback
            this.applyHighlight(target.sprite);
            
            // Emit event
            this.emitInteract(target);
            this.updateDebounce(target.id);
        }
    }

    private isDebounced(targetId: string): boolean {
        const now = performance.now();
        const lastTime = this.lastInteraction.get(targetId) || 0;
        return (now - lastTime) < this.config.tapDebounceMs;
    }

    private updateDebounce(targetId: string): void {
        this.lastInteraction.set(targetId, performance.now());
    }

private applyHighlight(sprite: PIXI.Sprite): void {
    if (!this.config.enableVisualFeedback) return;
    
    // Simple tint-based highlight (no external dependencies)
    const originalTint = sprite.tint;
    const originalAlpha = sprite.alpha;
    
    // Yellow tint with slight transparency
    sprite.tint = this.config.highlightColor;
    sprite.alpha = 0.8;
    
    // Auto-remove after 200ms
    setTimeout(() => {
        sprite.tint = originalTint;
        sprite.alpha = originalAlpha;
    }, 200);
}

    private emitInteract(target: InteractionTarget): void {
        this.interactCallbacks.forEach(cb => cb(target));
    }
}

// ---------------------------------------------------------------------
// Smoke Test Hook
// ---------------------------------------------------------------------
if (typeof window !== 'undefined' && (window as any).__TEST_INTERACTION_MANAGER) {
    console.log('InteractionManager smoke test:');
    console.log('- Public API:', Object.keys(InteractionManager).filter(k => typeof (InteractionManager as any)[k] === 'function'));
    console.log('- Interfaces:', { InteractionConfig: '', InteractionTarget: '' });
}