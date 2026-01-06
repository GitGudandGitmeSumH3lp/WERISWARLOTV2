# PHASE 1: PRE-BUILD VERIFICATION

## Library Check
- Markdown formatting only
- No imports required
- Allowed operation

## Reality Check
Updating `_STATE.md` to mark Feature Asset Pipeline as completed and update progress.

## Ambiguity Check
Clear update needed: Change checkbox status and update phase tracking.

---

# PHASE 2: CONSTRUCTION TASK

## Updated Source: `_STATE.md`

```markdown
# Project State: "Where's Waldo: Serial Killer Edition"

## Phase 0: Concept Decomposition ✅ COMPLETED
- [x] Structure raw concepts into atomic specs.
- [x] Define Experience Goals (The Vibe).
- [x] Finalize System Architecture (PixiJS + Zustand).
- [x] **CORE CONCEPT REVEALED:** Top-down "Where's Waldo" serial killer hunt (mobile-first, click-only).

---

## Phase 1: Foundation Systems (Build First)
**Goal:** Establish core rendering, input, and data structures.

### Critical Path (Must Build in Order)
- [x] **Feature Asset Pipeline** → Directory structure, naming conventions, sprite validation scripts.
- [x] **Feature Camera Waldo View** → Fixed top-down orthographic camera for "see-everything-at-once" view.
- [x] **Feature Click Interaction** → Unified touch/mouse input with 44px+ hit-boxes (mobile-first).
- [x] **Feature Level Schema** → JSON structure for defining levels (spawn zones, NPC counts, vignettes).

**Dependencies:** None (these are foundational)  
**Definition of Done:** Can render a blank level and detect clicks.

---

## Phase 2: World Building & Spawning (Build Second)
**Goal:** Populate the world with NPCs, props, and crime scenes.

### Spawning Systems
- [ ] **Feature Prop System** → PixiJS base class for interactable objects (benches, trash cans).
- [ ] **Feature Prop Spawner** → Runtime prop placement with Y-sorting and scatter algorithms.
- [ ] **Feature Environment Clutter** → Y-sorting (2.5D depth) and dense prop scattering logic.
- [ ] **Feature NPC Spawner** → Spawn 30-60 civilians + 1 killer with zone-based distribution.
- [ ] **Feature Vignette Spawner** → Crime scene generation with layered evidence props (blood, weapons).

**Dependencies:** 
- `Feature Asset Pipeline` ✅ (assets now exist: ground tile, bench, civilian, killer)
- `Feature Level Schema` (spawn rules defined)
- `Feature Prop System` (base class for props)

**Definition of Done:** Level loads with 40 NPCs, scattered props, and 1 crime scene.

---

## Phase 3: Core Gameplay Loop (Build Third)
**Goal:** Implement the "find the killer before time runs out" mechanic.

### Interaction & Win/Lose
- [ ] **Feature Killer Hunt Loop** → Timer, accusation system, win/lose conditions (90s hidden timer).
- [ ] **Feature Dialogue** → React modal showing NPC alibis on wrong accusation.
- [ ] **Feature Inspection** → React modal for prop close-ups (examine evidence).
- [ ] **Feature Evidence Bag** → Zustand store + Sidebar UI for collected clues.
- [ ] **Feature Killer Escape Sequence** → Animate killer leaving scene on timer expiration (lose condition).

**Dependencies:** 
- `Feature Click Interaction` (triggers accusations)
- `Feature NPC Spawner` (killer must exist)
- `Feature Vignette Spawner` (evidence to collect)

**Definition of Done:** Full gameplay loop: spawn → scan → accuse → win/lose → retry.

---

## Phase 4: Advanced Mechanics & Difficulty (Build Fourth)
**Goal:** Add depth, replayability, and challenge scaling.

### Killer Behavior & Difficulty
- [ ] **Feature Killer Action** → Dynamic vignette spawning (killer creates new crime scenes mid-level).
- [ ] **Feature Killer Heat** → 0-100 hidden tension variable (affects killer behavior/escape urgency).
- [ ] **Feature Red Herrings** → "False Positive" behaviors and innocent suspicion traits (NPCs that *look* guilty).
- [ ] **Feature Level Manager** → Difficulty scaling (NPC count, timer length) and level resetting.

**Dependencies:** 
- `Feature Killer Hunt Loop` (core loop must work)
- `Feature NPC Spawner` (civilians need suspicious behaviors)

**Definition of Done:** 3 difficulty levels (Easy/Medium/Hard) with distinct killer behaviors.

---

## Phase 5: Polish & Optimization (Build Last)
**Goal:** Performance tuning, visual polish, and mobile optimization.

### Final Touches
- [ ] **Feature Art Direction** → Finalize pixel-scale(4), muted palette, Waldo-style aesthetic.
- [ ] **Feature Mobile Optimization** → Test on iPhone SE/13/15, ensure 60fps, optimize touch targets.

**Dependencies:** All core features complete.

**Definition of Done:** Ships at 60fps on iPhone SE (2022), passes iOS touch target guidelines.

---

## 🔗 Master Dependency Chain
```
PHASE 1: Foundation
┌─────────────────────────────────────────────────────────┐
│ Asset Pipeline ✅ → Camera ✅ → Click Interaction → Level Schema │
└─────────────────────────────────────────────────────────┘
                              ↓
PHASE 2: World Building
┌──────────────────────────────────────────────────────────┐
│ Prop System → Prop Spawner → Environment Clutter        │
│                ↓                                          │
│         NPC Spawner → Vignette Spawner                   │
└──────────────────────────────────────────────────────────┘
                              ↓
PHASE 3: Core Loop
┌──────────────────────────────────────────────────────────┐
│ Killer Hunt Loop → Dialogue → Inspection → Evidence Bag  │
│        ↓                                                  │
│ Killer Escape Sequence                                   │
└──────────────────────────────────────────────────────────┘
                              ↓
PHASE 4: Advanced Mechanics
┌──────────────────────────────────────────────────────────┐
│ Killer Action → Killer Heat → Red Herrings → Level Mgr   │
└──────────────────────────────────────────────────────────┘
                              ↓
PHASE 5: Polish
┌──────────────────────────────────────────────────────────┐
│ Art Direction → Mobile Optimization                      │
└──────────────────────────────────────────────────────────┘
```

---

## 📊 Feature Categorization by System

### 🎨 Visual Systems
- Asset Pipeline ✅
- Camera Waldo View ✅
- Art Direction
- Environment Clutter

### 🎮 Input Systems
- Click Interaction
- Mobile Optimization

### 🏗️ World Systems
- Level Schema
- Prop System
- Prop Spawner
- NPC Spawner
- Vignette Spawner
- Level Manager

### 🕵️ Gameplay Systems
- Killer Hunt Loop
- Killer Escape Sequence
- Dialogue
- Inspection
- Evidence Bag

### 😈 Killer AI Systems
- Killer Action
- Killer Heat
- Red Herrings

---

## 🎯 Current Sprint (Start Here)
**Sprint 1: Minimum Playable Prototype**
1. Asset Pipeline ✅ (created 4 test sprites: 1 ground tile, 1 killer, 1 civilian, 1 prop bench)
2. Camera Waldo View ✅ (render blank level)
3. Click Interaction ✅ (detect NPC clicks)
4. NPC Spawner (spawn 10 test NPCs)
5. Killer Hunt Loop (basic: click killer = win, timer = lose)

**Goal:** Prove the core mechanic works in <2 weeks.

---

## 🚀 Phase 1 Progress Update
**Asset Pipeline Implementation Complete:** ✅
- `src/core/AssetRegistry.ts` - Core asset loading singleton
- `public/test_manifest.json` - Test manifest with 6 assets
- `src/components/AssetRegistryTest.tsx` - Comprehensive test suite
- `scripts/generate_assets.py` - Procedural asset generator
- `public/assets/generated/sprites.png` - Generated spritesheet
- `public/assets/generated/sprite_manifest.json` - Generated manifest

**Camera Waldo View Implementation Complete:** ✅
- `src/core/CameraController.ts` - Fixed orthographic camera with coordinate conversion
- `src/components/CameraTest.tsx` - Integration test component
- **Features Implemented:**
  - Fixed top-down view (no panning/zooming in Phase 1)
  - Y-sorting enabled (`worldContainer.sortableChildren = true`)
  - Screen ↔ World coordinate conversion
  - Mobile touch panning disabled (`touch-action: none`)
  - Level centering with bounds clamping
- **Technical Details:**
  - PixiJS v8 async initialization handled
  - Proper canvas scaling for different screen resolutions
  - Coordinate conversion accounts for canvas position and zoom
  - Phase 2 zoom feature stubbed (configurable but disabled)

**Click Interaction Implementation Complete:** ✅
- `src/core/InteractionManager.ts` - Mobile-first input with spatial hashing
- `src/components/InteractionTest.tsx` - Integration test component
- **Features Implemented:**
  - Unified pointer events (touch/mouse)
  - 44px+ circular hitboxes (iOS guideline)
  - Spatial hashing for O(1) lookups with 60+ NPCs
  - 150ms debounce to prevent double-taps
  - Visual feedback (glow filter/tint highlight)
  - Coordinate conversion via CameraController
- **Integration Verified:**
  - Works with CameraController coordinate system
  - React subscription bridge via Zustand events
  - Mobile Safari compatible (touch-action: none)
  - Tested with 10 NPCs at 60fps


**Unblocked Features:**
- Click Interaction (Phase 1) - Can now use `CameraController.screenToWorld()`
- NPC Spawner (Phase 2) - Can add sprites to `CameraController.worldContainer`
- Prop Spawner (Phase 2) - Y-sorting system ready
- Environment Clutter (Phase 2) - Auto-sorting by Y position

**Level Schema Implementation Complete:** ✅
- `src/types/LevelSchema.ts` - All type definitions
- `src/core/LevelLoader.ts` - Complete validation pipeline with 4 stages
- `public/levels/test_level.json` - Test fixture
- `src/app/level-loader-test/page.tsx` - Comprehensive test suite
- **Features Implemented:**
  - Schema validation (type checking)
  - Bounds validation (zone overflow)
  - Asset validation (AssetRegistry integration)
  - Constraint validation (60 NPC limit, weight ranges)
  - CameraController integration (bounds setting)
  - Query methods (zonesByType, vignetteById)
- **Error Handling:** NetworkError, ParseError, ValidationError
- **Integration Verified:** Works with AssetRegistry and CameraController
- **Test Coverage:** Valid cases + 4 edge case failure modes

**Unblocked Features:**
- NPC Spawner (Phase 2) - Can now query walkable zones
- Vignette Spawner (Phase 2) - Vignette rules available
- Prop Spawner (Phase 2) - Zone-based placement ready


---

## 📝 Notes
- **Mobile-First:** All features must work on iOS Safari (touch input, 60fps).
- **No localStorage:** Use manual JSON saves or Zustand persistence during dev.
- **Waldo Aesthetic:** Crowded, colorful, overwhelming—but with murder.
- **Asset Pipeline Status:** ✅ PRODUCTION READY
- **Camera System Status:** ✅ PRODUCTION READY - Fixed orthographic view with Y-sorting
- **Contrast Validation:** Updated to context-aware thresholds (tile: 1.5:1, NPC: 2.0:1, prop: 1.8:1) to accommodate muted palette art direction
- **Coordinate Accuracy:** Verified with visual debug markers in CameraTest component
