// src/core/InteractionManager.ts
import * as PIXI from 'pixi.js';

export type InteractionTargetType = 'npc' | 'ui' | 'prop' | 'environment';

// [FIX] Updated Interface to match Tests and Contract
export interface InteractionTarget {
  id: string;
  type: InteractionTargetType;
  sprite: PIXI.Container; // [REQUIRED] for event binding
  hitbox?: { 
    x?: number; 
    y?: number; 
    radius?: number; 
    width?: number; 
    height?: number; 
  };
  priority?: number;
  metadata?: any;
}

export interface InteractionConfig {
  minHitboxRadius?: number;
  highlightColor?: number;
  tapDebounceMs?: number;
  enableVisualFeedback?: boolean;
}

export class InteractionManager {
  private static instance: InteractionManager;
  private targets: Map<string, InteractionTarget> = new Map();
  private listeners: Set<(target: InteractionTarget) => void> = new Set();
  
  private config: InteractionConfig = {
    minHitboxRadius: 22,
    highlightColor: 0xFFFF00,
    tapDebounceMs: 150,
    enableVisualFeedback: true
  };

  private constructor() {}

  static getInstance(): InteractionManager {
    if (!InteractionManager.instance) {
      InteractionManager.instance = new InteractionManager();
    }
    return InteractionManager.instance;
  }

  static initialize(config: Partial<InteractionConfig> = {}): void {
    const instance = InteractionManager.getInstance();
    instance.config = { ...instance.config, ...config };
    console.log('Core InteractionManager initialized:', instance.config);
  }

  // [FIX] Implements logic defined in 00_CORE.md (registerProp)
  static registerTarget(target: InteractionTarget): void {
    const instance = InteractionManager.getInstance();
    instance.targets.set(target.id, target);

    // 1. Setup PixiJS v8 Event Mode
    target.sprite.eventMode = 'static';
    target.sprite.cursor = 'pointer';

    // 2. Configure Hit Area
    if (target.hitbox) {
      if (target.hitbox.radius) {
        // Circular Hitbox (used by NPCs in Test)
        const x = target.hitbox.x || 0;
        const y = target.hitbox.y || 0;
        target.sprite.hitArea = new PIXI.Circle(x, y, target.hitbox.radius);
      } else if (target.hitbox.width && target.hitbox.height) {
        // Rectangular Hitbox (used by Props in Contract)
        const x = target.hitbox.x || 0;
        const y = target.hitbox.y || 0;
        target.sprite.hitArea = new PIXI.Rectangle(x, y, target.hitbox.width, target.hitbox.height);
      }
    }

    // 3. Attach Event Listener (Core Requirement)
    // Remove existing listeners to prevent duplicates if re-registered
    target.sprite.removeAllListeners('pointerdown');
    target.sprite.on('pointerdown', (e) => {
      // Stop propagation if needed, or handle z-sorting here
      instance.triggerInteraction(target.id);
    });

    console.log(`Registered interaction target: ${target.id}`);
  }

  static onInteract(callback: (target: InteractionTarget) => void): () => void {
    const instance = InteractionManager.getInstance();
    instance.listeners.add(callback);
    return () => {
      instance.listeners.delete(callback);
    };
  }

  static clearTargets(): void {
    const instance = InteractionManager.getInstance();
    instance.getTargets().forEach(t => {
        // Cleanup Pixi listeners
        if (t.sprite) {
            t.sprite.removeAllListeners('pointerdown');
            t.sprite.eventMode = 'passive'; // Reset
        }
    });
    instance.targets.clear();
    console.log('All targets cleared');
  }

  // [FIX] Added missing method required by Unit Tests
  static findTarget(x: number, y: number): InteractionTarget | undefined {
    // This is a manual hit test fallback, primary interaction is via Pixi events
    const instance = InteractionManager.getInstance();
    for (const target of instance.targets.values()) {
        if (target.sprite && target.sprite.getBounds().contains(x, y)) {
            return target;
        }
    }
    return undefined;
  }

  triggerInteraction(targetId: string): void {
    const target = this.targets.get(targetId);
    if (target) {
      // Visual Feedback (Contract Requirement)
      if (this.config.enableVisualFeedback) {
        // Simple scale effect or tint could go here
        console.log(`Interaction triggered: ${targetId}`);
      }
      this.listeners.forEach(callback => callback(target));
    }
  }

  getTargets(): InteractionTarget[] {
    return Array.from(this.targets.values());
  }
}

export const interactionManager = InteractionManager.getInstance();