# Implementation Plan: Art Direction & Visual Standards

**Feature:** Art Direction  
**Phase:** 1 (Implementation)  
**Estimated Time:** 3-4 hours  
**Dependencies:** PixiJS v8, Zustand store, React 19

---

## Step 1: Core Visual Pipeline (60 mins)

### Files to Create
- `src/rendering/VisualManager.ts`
- `src/rendering/filters/GrainFilter.ts`
- `src/rendering/utils/colorPalette.ts`

### Implementation Tasks

#### 1.1 Create GrainFilter
```typescript
// src/rendering/filters/GrainFilter.ts
import { Filter } from 'pixi.js';

export class GrainFilter extends Filter {
    constructor(opacity: number = 0.05) {
        // Implementation follows PixiJS filter pattern
        // Use built-in NoiseFilter as base
        // Set blend mode to overlay
        // Configure opacity uniform
    }
}
```

#### 1.2 Implement VisualManager Singleton
```typescript
// src/rendering/VisualManager.ts

/**
 * Follow the interface from docs/master-index.md:
 * - getInstance(): VisualManager
 * - loadAsset(key, path, options?): Promise<Texture>
 * - applyGrainOverlay(sprite, opacity?): void
 * - enforceColorPalette(color): number
 * - createMugshotRenderer(width, height): MugshotRenderer
 */

// Initialize with:
// - textureCache = new Map()
// - grainFilter = new GrainFilter(0.05)
// - Set Pixi.settings.SCALE_MODE = 'nearest'
```

#### 1.3 Implement Color Palette Logic
```typescript
// src/rendering/utils/colorPalette.ts

export function enforceColorPalette(color: number): number {
    // Convert hex to RGB
    // Apply desaturation (-20%) and darkening (-10%)
    // Convert back to hex
    // See logic doc for full algorithm
}

export function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
    // Standard RGB→HSV conversion
}

export function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
    // Standard HSV→RGB conversion
}
```

### Testing Checkpoint
- [ ] `VisualManager.getInstance()` returns same instance on multiple calls
- [ ] `loadAsset()` caches textures (load same asset twice, verify single network request)
- [ ] `enforceColorPalette(0xFF0000)` returns muted red (~0xCC0000)
- [ ] Grain filter visible on test sprite (compare with/without)

---

## Step 2: Mugshot Rendering System (45 mins)

### Files to Create
- `src/rendering/MugshotRenderer.ts`

### Implementation Tasks

#### 2.1 Create MugshotRenderer Class
```typescript
// src/rendering/MugshotRenderer.ts
import { Renderer, Container, Sprite } from 'pixi.js';

/**
 * Follow interface from docs/master-index.md:
 * - constructor(width, height)
 * - render(sprite): HTMLCanvasElement
 * - dispose(): void
 */

export class MugshotRenderer {
    private renderer: Renderer;
    private stage: Container;
    private canvas: HTMLCanvasElement;
    
    constructor(width: number, height: number) {
        // Create isolated Pixi.Renderer
        // Set backgroundColor = 0x000000, backgroundAlpha = 0
        // Set antialias = false (pixel art)
        // Initialize empty stage
    }
    
    render(sprite: Sprite): HTMLCanvasElement {
        // Clear stage
        // Clone input sprite (avoid mutating world sprite)
        // Set scale to (4, 4)
        // Set position to (35, 5) per system.md
        // Add to stage
        // Call this.renderer.render(this.stage)
        // Return this.canvas
    }
    
    dispose(): void {
        // Destroy renderer
        // Clear stage
        // Remove canvas from DOM if attached
    }
}
```

### Testing Checkpoint
- [ ] Create renderer with 200x200 dimensions
- [ ] Render test sprite, verify canvas size is 200x200
- [ ] Verify sprite is centered at (35, 5) in output
- [ ] Call `dispose()`, check GPU memory freed (use Chrome DevTools)

---

## Step 3: React UI Components (75 mins)

### Files to Create
- `src/components/ui/DialogueBox.tsx`
- `src/components/ui/EvidenceBag.tsx`
- `src/components/ui/InspectionModal.tsx`
- `src/styles/ui.css` (Tailwind utilities + custom animations)

### Implementation Tasks

#### 3.1 DialogueBox Component
```typescript
// src/components/ui/DialogueBox.tsx

/**
 * Follow interface from docs/master-index.md
 */

interface DialogueBoxProps {
    text: string;
    speakerName?: string;
    onAdvance: () => void;
}

export function DialogueBox({ text, speakerName, onAdvance }: DialogueBoxProps) {
    // Styling:
    // - fixed bottom-0 h-[33vh]
    // - bg-black/85 text-white
    // - padding p-6
    // - animate-slide-up (define in ui.css)
    
    // Event handlers:
    // - onClick → onAdvance()
    // - useEffect: Listen for spacebar → onAdvance()
    
    return (/* JSX following spec */);
}
```

#### 3.2 EvidenceBag Component
```typescript
// src/components/ui/EvidenceBag.tsx
import { useStore } from '@/store';

interface EvidenceBagProps {
    items: PropData[];
    isOpen: boolean;
    onClose: () => void;
}

export function EvidenceBag({ items, isOpen, onClose }: EvidenceBagProps) {
    // Styling:
    // - fixed right-0 w-[300px] h-screen
    // - bg-gray-900/95
    // - animate-slide-right (define in ui.css)
    // - grid grid-cols-3 gap-2 (for items)
    
    // Event handlers:
    // - ESC key → onClose()
    // - Click item → setInspectionTarget(item.id)
    
    return (/* JSX with item grid */);
}
```

#### 3.3 InspectionModal Component
```typescript
// src/components/ui/InspectionModal.tsx
import { useEffect, useState, useRef } from 'react';
import { VisualManager } from '@/rendering/VisualManager';
import { MugshotRenderer } from '@/rendering/MugshotRenderer';

interface InspectionModalProps {
    propId: string;
    onClose: () => void;
}

export function InspectionModal({ propId, onClose }: InspectionModalProps) {
    const [imageUrl, setImageUrl] = useState<string>('');
    const rendererRef = useRef<MugshotRenderer | null>(null);
    
    useEffect(() => {
        // 1. Get PropData from Zustand
        const propData = useStore.getState().props[propId];
        
        // 2. Load texture via VisualManager
        const visualMgr = VisualManager.getInstance();
        visualMgr.loadAsset(propData.textureKey, `/sprites/${propData.textureKey}.png`)
            .then(texture => {
                // 3. Create MugshotRenderer
                const renderer = new MugshotRenderer(200, 200);
                rendererRef.current = renderer;
                
                // 4. Render sprite
                const sprite = new Sprite(texture);
                const canvas = renderer.render(sprite);
                
                // 5. Convert to data URL
                setImageUrl(canvas.toDataURL('image/png'));
            });
        
        // Cleanup on unmount
        return () => {
            if (rendererRef.current) {
                rendererRef.current.dispose();
            }
        };
    }, [propId]);
    
    // Styling:
    // - fixed inset-0 z-[300]
    // - backdrop-blur-sm bg-black/50
    // - center modal: w-[400px] h-[400px]
    // - animate-scale-fade (define in ui.css)
    
    return (/* JSX with image and prop details */);
}
```

#### 3.4 Define Animations
```css
/* src/styles/ui.css */

@keyframes slide-up {
    from {
        transform: translateY(100%);
    }
    to {
        transform: translateY(0);
    }
}

@keyframes slide-right {
    from {
        transform: translateX(100%);
    }
    to {
        transform: translateX(0);
    }
}

@keyframes scale-fade {
    from {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.9);
    }
    to {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
    }
}

.animate-slide-up {
    animation: slide-up 200ms ease-out;
}

.animate-slide-right {
    animation: slide-right 300ms ease-out;
}

.animate-scale-fade {
    animation: scale-fade 250ms ease-out;
}
```

### Testing Checkpoint
- [ ] DialogueBox appears at bottom, advances on click/spacebar
- [ ] EvidenceBag slides in from right, displays items in 3-col grid
- [ ] InspectionModal shows prop close-up with correct scaling
- [ ] No memory leaks (open/close modal 10 times, check Chrome DevTools)

---

## Step 4: Tile System & Integration (60 mins)

### Files to Create
- `src/rendering/TileRenderer.ts`
- `src/rendering/shaders/WaterShader.ts`

### Implementation Tasks

#### 4.1 Implement TileRenderer
```typescript
// src/rendering/TileRenderer.ts
import { Sprite, Texture, Filter } from 'pixi.js';
import { VisualManager } from './VisualManager';

export enum TileType {
    GRASS = 'grass',
    DIRT = 'dirt',
    WATER = 'water',
    WALL = 'wall'
}

/**
 * Follow interface from docs/master-index.md
 */

export class TileRenderer {
    private tileConfigs: Map<TileType, TileConfig>;
    
    constructor() {
        // Initialize configs per feature_art_direction.md:
        // GRASS: 0x2E7D32 + texture
        // DIRT: 0x795548 + texture
        // WATER: 0x29B6F6 + shader
        // WALL: 0x424242 + texture
    }
    
    createTile(type: TileType, x: number, y: number): Sprite {
        // Implementation follows logic doc pipeline:
        // 1. Create base sprite with color
        // 2. Apply texture overlay (if defined)
        // 3. Apply shader (if animated)
        // 4. Set position and zIndex
    }
    
    createWaterShader(): Filter {
        // Load custom GLSL shader
        // Return configured Filter with time uniform
    }
}
```

#### 4.2 Create Water Shader
```glsl
// src/rendering/shaders/water.frag

precision mediump float;

uniform float time;
uniform sampler2D uSampler;
varying vec2 vTextureCoord;

void main() {
    vec2 uv = vTextureCoord;
    
    // Sine wave distortion (from logic doc)
    uv.x += sin(uv.y * 10.0 + time) * 0.005;
    uv.y += cos(uv.x * 10.0 + time) * 0.005;
    
    vec4 color = texture2D(uSampler, uv);
    
    // Add brightness variation
    float wave = sin(time + uv.y * 5.0) * 0.05;
    color.rgb += wave;
    
    gl_FragColor = color;
}
```

```typescript
// src/rendering/shaders/WaterShader.ts
import { Filter } from 'pixi.js';
import waterFragShader from './water.frag';

export class WaterShader extends Filter {
    constructor() {
        super(null, waterFragShader);
        
        // Initialize time uniform
        this.uniforms.time = 0;
    }
    
    update(deltaTime: number) {
        // Increment time for animation
        this.uniforms.time += deltaTime * 0.001;
    }
}
```

#### 4.3 Integration with Game Loop
```typescript
// src/game/GameLoop.ts (modify existing)

import { TileRenderer } from '@/rendering/TileRenderer';

// In initialization:
const tileRenderer = new TileRenderer();

// Generate initial map
for (let x = 0; x < MAP_WIDTH; x++) {
    for (let y = 0; y < MAP_HEIGHT; y++) {
        const tileType = mapData[x][y]; // From level data
        const tile = tileRenderer.createTile(tileType, x * 64, y * 64);
        worldContainer.addChild(tile);
    }
}

// In update loop:
worldContainer.children.forEach(child => {
    if (child.filters) {
        child.filters.forEach(filter => {
            if (filter instanceof WaterShader) {
                filter.update(deltaTime);
            }
        });
    }
});
```

### Testing Checkpoint
- [ ] Grass tiles render with correct color (0x2E7D32)
- [ ] Water tiles animate smoothly (ripple visible)
- [ ] All tiles have grain overlay (texture not flat)
- [ ] Performance: 60 FPS with 200+ tiles

---

## Final Integration Test

### Scenario: Complete Inspection Flow
1. Start game
2. Click on prop in world (e.g. bloody knife)
3. Verify InspectionModal opens
4. Verify mugshot shows prop at 4x scale, centered
5. Click "Collect Evidence"
6. Verify prop removed from world
7. Open EvidenceBag (press 'E' key)
8. Verify prop appears in sidebar
9. Close EvidenceBag
10. Repeat 10 times, check for memory leaks

### Performance Validation
- [ ] Frame rate stays at 60 FPS during inspection
- [ ] Modal opens in <250ms
- [ ] No texture flickering or pop-in
- [ ] GPU memory stable (<200MB for entire scene)

---

## Rollout Checklist

### Code Quality
- [ ] All files follow TypeScript strict mode
- [ ] All public methods have JSDoc comments
- [ ] No console.log statements in production code
- [ ] All magic numbers replaced with named constants

### Documentation
- [ ] Update `_STATE.md`: Mark "Feature Art Direction" as COMPLETED
- [ ] Add usage examples to `docs/examples/art_direction_usage.md`
- [ ] Document any deviations from original spec

### Merge Requirements
- [ ] All tests pass (4 checkpoints above)
- [ ] Code reviewed by 1+ team member
- [ ] Performance metrics meet targets (60 FPS, <200MB)
- [ ] No breaking changes to existing systems

---

## Post-Implementation: Next Steps

Once this feature is complete, we can proceed to:
1. **Feature Killer Heat** (hidden tension variable)
2. **Feature Prop System** (complete prop interaction logic)
3. **Feature Dialogue** (full conversation tree)

The visual foundation established here will support all future features.