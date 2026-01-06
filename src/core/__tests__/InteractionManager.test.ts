import { InteractionManager, InteractionConfig, InteractionTarget } from '../InteractionManager';
import { CameraController } from '../CameraController';
import * as PIXI from 'pixi.js';

// Mock dependencies
jest.mock('../CameraController', () => ({
  CameraController: {
    app: {
      view: document.createElement('canvas')
    },
    screenToWorld: jest.fn((x, y) => ({ x, y }))
  }
}));

describe('InteractionManager', () => {
  const mockConfig: InteractionConfig = {
    minHitboxRadius: 22,
    highlightColor: 0xFFFF00,
    tapDebounceMs: 150,
    enableVisualFeedback: true
  };

  beforeEach(() => {
    // Reset singleton
    (InteractionManager as any).instance = null;
  });

  test('should initialize with config', () => {
    expect(() => {
      InteractionManager.initialize(mockConfig);
    }).not.toThrow();
  });

  test('should register and find targets', () => {
    InteractionManager.initialize(mockConfig);
    
    const mockSprite = new PIXI.Sprite();
    const target: InteractionTarget = {
      id: 'test_target',
      type: 'npc',
      sprite: mockSprite,
      hitbox: { x: 100, y: 100, radius: 22 },
      metadata: { name: 'Test NPC' }
    };

    InteractionManager.registerTarget(target);
    
    const found = InteractionManager.findTarget(100, 100);
    expect(found).toBe(target);
  });

  test('should handle click events', () => {
    InteractionManager.initialize(mockConfig);
    
    const mockSprite = new PIXI.Sprite();
    const target: InteractionTarget = {
      id: 'test_target',
      type: 'npc',
      sprite: mockSprite,
      hitbox: { x: 100, y: 100, radius: 22 }
    };

    InteractionManager.registerTarget(target);
    
    let clickedId = '';
    const unsubscribe = InteractionManager.onInteract((clickedTarget) => {
      clickedId = clickedTarget.id;
    });

    // Simulate click
    const event = new PointerEvent('pointerdown', {
      clientX: 100,
      clientY: 100
    });
    (CameraController.app.view as HTMLCanvasElement).dispatchEvent(event);

    expect(clickedId).toBe('test_target');
    unsubscribe();
  });
});