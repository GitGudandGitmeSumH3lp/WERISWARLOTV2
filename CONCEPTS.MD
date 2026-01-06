Here is the consolidated `CONCEPTS.TXT` file containing all the atomic feature specifications we have defined (including the ones I filled in for you).

You can save this file in your project root or `docs/` folder to track your Feature Specifications.

`CONCEPTS.TXT`:
```markdown
================================================================================
FILE: specs/feature_art_direction.md
================================================================================
# Feature: Art Direction & Visual Standards
**Version:** 1.0.0 | **Phase:** 0 (Design) → 1 (Implementation) | **Priority:** LOW (But Critical for Polish)

## Experience Goal
**The Vibe:** *Stardew Meets Se7en*
The art should be approachable (Stardew Valley's warmth) but with subtle darkness (muted colors, textured shadows). It's a game about murder, but it shouldn't be grimdark. Think "cozy mystery with teeth." The player should feel comfortable spending hours in this world, even as they hunt a killer.

## User Stories
- **As a player**, I want the art to be readable (good for glasses-wearers), so I don't squint at tiny sprites.
- **As a player**, I want the art to have texture (not flat colors), so the world feels handcrafted.
- **As a player**, I want the UI to be minimal, so the game view isn't cluttered.

## Technical Requirements
### Visual Standards
1. **Character Sprites:**
   - Size: 32x48px (matches existing system)
   - Style: Stardew Valley-inspired (soft outlines, expressive faces)
   - Color Palette: Muted tones (avoid neon/oversaturated colors)
   - Texture: Add grain/noise overlay (5% opacity) to avoid flatness
2. **Prop Design:**
   - Size: 16x16px to 32x32px (depending on type)
   - Detail: Enough to be identifiable, not cluttered
   - Crime Props: Slightly desaturated (blood is dark red, not bright)
   - Herring Props: Visually similar to Crime props (intentional confusion)
3. **Environment Tiles:**
   - Grass: `0x2E7D32` (from `system.md`, add texture overlay)
   - Dirt: `0x795548` (add pebble details)
   - Water: `0x29B6F6` (animated ripples via shader if possible)
   - Walls: `0x424242` (add brick texture)
4. **UI Elements:**
   - Minimal overlays (no cluttered HUD)
   - Dialogue: Bottom-third banner (dark BG, white text)
   - Evidence Bag: Sidebar (slides in from right)
   - Inspection UI: Center modal (prop close-up, 200x200px)

### Constraints (from `system.md`)
- Mugshot rendering: `scale(4)`, `x(35)`, `y(5)` for 200x200 canvas
- Pixi v8 rendering with `zIndex: y` for layering
- No localStorage (all UI state in Zustand)

## Dependencies
- [ ] `PropSystem` (prop visual design)
- [ ] `InspectionSystem` (UI layout)
- [ ] `DialogueSystem` (dialogue UI design)

## Definition of Done
- [ ] All sprites have texture overlays (not flat)
- [ ] Color palette is muted (no oversaturation)
- [ ] UI elements are minimal (no visual clutter)
- [ ] Mugshot rendering uses correct scale/position
- [ ] Crime props are visually distinct but not obvious

================================================================================
FILE: specs/feature_confrontation_system.md
================================================================================
# Feature: Confrontation System
**Version:** 1.0.0 | **Phase:** 2 → 3 | **Priority:** CRITICAL

## Experience Goal
**The Vibe:** *Damned If You Do, Damned If You Don't*
This is the moral crescendo. The player has found the killer, but now they face the game's central dilemma: **Apprehend the killer (and face the victim count) OR defuse the Crisis (and let the killer escape).** There is no "good" ending. The UI should feel heavy—like choosing which lives to prioritize. The post-choice screen should make the player sit with their decision.

## User Stories
- **As a player**, I want to choose between arresting the killer or saving lives, so the game respects my agency.
- **As a player**, I want the victim count to be revealed only AFTER I choose arrest, so there's no "optimal" path.
- **As a player**, I want the Crisis to feel urgent but vague, so I don't know if it's a bluff.

## Technical Requirements
### Data Structures
```typescript
confrontationState: {
  killerFound: boolean,
  choiceMade: 'arrest' | 'crisis' | null,
  victimCount: number, // Hidden until arrest
  crisisType: 'bomb' | 'poison' | 'hostage' | 'bluff',
  crisisActive: boolean
}
```
### Logic Rules
1. **Trigger Condition:**
   - Player clicks killer + Evidence Bag has 3+ Crime props
   - Opens Confrontation UI (full-screen modal, dark vignette)
2. **Choice Mechanics:**
   - **Option A: Apprehend**
     - Roll victimCount = `killerState.crimeCount + random(0-2)` (uncertainty!)
     - Reveal victim count in post-game screen
     - `convictionScore` calculated based on evidence quality
   - **Option B: Crisis**
     - Spawn Crisis UI (timer, clue hunt)
     - Killer escapes (sets `killerFound = false`)
     - If Crisis is defused, save lives BUT killer is still loose
3. **Victim Count Logic:**
   - Based on: Crime vignettes spawned, Props tagged as "victim-adjacent", Killer archetype.
   - Formula: `victimCount = vignetteCount + (archetype === 'psychopath' ? 2 : 0)`
4. **Crisis Types:**
   - **Bomb (40%):** 60-second timer, must find 3 wires in city
   - **Poison (30%):** Must identify contaminated water source
   - **Hostage (20%):** Must reach specific location before timer
   - **Bluff (10%):** No actual crisis, wastes player's time (reinforces theme)

### Constraints
- Must tie into `gameStore.convictionScore`
- Cannot show victimCount before choice is made (no metagaming)
- Crisis must use existing prop spawn system (no new art assets)

## Dependencies
- [ ] `KillerActionSystem` (victimCount calculation)
- [ ] `CrisisSystem` (scenario logic)
- [ ] `EvidenceSystem` (convictionScore calculation)

## Definition of Done
- [ ] Confrontation UI appears after finding killer with 3+ evidence
- [ ] Choosing "Arrest" reveals victim count post-game
- [ ] Choosing "Crisis" spawns scenario and lets killer escape
- [ ] Bluff Crisis appears 10% of the time (player learns distrust)
- [ ] Post-game screen displays moral weight of choice (somber UI)

================================================================================
FILE: specs/feature_crisis_system.md
================================================================================
# Feature: Crisis System
**Version:** 1.0.0 | **Phase:** 2 → 3 | **Priority:** HIGH

## Experience Goal
**The Vibe:** *Ticking Clock of Helplessness*
The Crisis is the game's way of saying, "You can't have it all." It's a second detective game within the first—but this time, lives are actively at stake. The player should feel rushed but methodical, knowing that even if they succeed, the killer is still out there. The game ends in bittersweet victory at best.

## User Stories
- **As a player**, I want Crisis scenarios to feel distinct (bomb, poison, hostage), so replaying isn't predictable.
- **As a player**, I want Crises to have environmental clues (not just UI timers), so it feels integrated into the world.
- **As a player**, I want some Crises to be bluffs, so I learn to distrust the killer's final move.

## Technical Requirements
### Data Structures
```typescript
crisisScenario: {
  type: 'bomb' | 'poison' | 'hostage' | 'bluff',
  timeLimit: number, // Seconds
  cluesRequired: number,
  cluesFound: Prop[],
  resolved: boolean,
  livesSaved: number
}
```
### Logic Rules
1. **Spawn Trigger:**
   - Player chooses "Crisis" in Confrontation System
2. **Crisis Mechanics:**
   - **BOMB (Level 1-2):** Spawns 3 wire props. Click in sequence (1-2-3). Timer: 60s.
   - **POISON (Level 2-3):** Spawns contaminated water. Inspect 5 NPCs for symptoms. Timer: 90s.
   - **HOSTAGE (Level 3+):** Spawns locked door. Find key in container. No timer, but heat rises rapidly.
   - **BLUFF (All Levels, 10%):** No actual crisis. Reveals after 30s.
3. **Integration with Victim Count:**
   - Crisis success reduces `victimCount` displayed in post-game.

### Constraints
- Must reuse existing prop types (no new assets).
- Timer must be visual (on-screen countdown).

## Dependencies
- [ ] `ConfrontationSystem` (triggers Crisis)
- [ ] `PropSystem` (spawns Crisis-specific props)
- [ ] `VignetteSystem` (placement logic)

## Definition of Done
- [ ] 4 distinct Crisis types (Bomb, Poison, Hostage, Bluff)
- [ ] Timer is visible on-screen (UI overlay)
- [ ] Success/failure affects post-game victim count
- [ ] Bluff Crisis triggers 10% of the time

================================================================================
FILE: specs/feature_dialogue_system.md
================================================================================
# Feature: Dialogue System
**Version:** 1.0.0 | **Phase:** 0 → 1 | **Priority:** HIGH

## Experience Goal
**The Vibe:** *Paranoia Through Banality*
Every NPC should feel like a potential suspect. The killer's dialogue is hidden among 24 other civilians who are equally evasive, annoying, or helpful. The player must learn to detect *micro-tells*—slight inconsistencies, nervous phrasing, knowledge they shouldn't have. The system should make you doubt your own judgments.

## User Stories
- **As a player**, I want NPCs to give varied responses (helpful/evasive/irrelevant), so dialogue doesn't feel like a menu system.
- **As a player**, I want the killer to subtly betray themselves through dialogue inconsistencies, so I can deduce their identity without explicit "clues."
- **As a player**, I want dialogue to reference nearby props/evidence, so the world feels reactive and integrated.

## Technical Requirements
### Data Structures
```typescript
// Per-Actor State
actor: {
  dialogueProfile: 'helpful' | 'evasive' | 'nervous' | 'gossip',
  memoryBank: string[], // References to nearby vignettes/props
  hasBeenQuestioned: boolean,
  suspicionLevel: number // Affects future dialogue tone
}
// Killer-Specific
killerDialogue: {
  archetype: string, // Links to killerState.personality
  lies: string[], // Stored alibis (can contradict evidence)
  hintTriggers: { propId: string, response: string }[]
}
```
### Logic Rules
1. **Dialogue Priority (InteractionRouter):** `Click Actor → Check isKiller → Load killerDialogue : Load civilianDialogue`
2. **Civilian Dialogue Types:** Helpful (20%), Evasive (40%), Nervous (15%), Gossip (25%).
3. **Killer Dialogue Mechanics:**
   - **Consistency Check:** If questioned twice, compares against stored alibi.
   - **Stress Escalation:** Each question increases `killerHeat` by 2.
4. **Integration with Evidence:**
   - Dialogue responses can generate `testimonialEvidence`.
   - Contradictory statements are flagged if Evidence Bag contains conflicting props.

### Constraints
- Must hook into existing `InteractionRouter`.
- Cannot use form elements (React 19 restriction).
- Dialogue UI must be minimal.

## Dependencies
- [ ] `InteractionRouter` (framework exists, needs dialogue hook)
- [ ] `EvidenceSystem` (testimonial evidence storage)
- [ ] `KillerActionSystem` (killerHeat integration)

## Definition of Done
- [ ] Clicking any actor triggers dialogue.
- [ ] Killer's dialogue contains 2-3 subtle inconsistencies per game.
- [ ] Civilian dialogue references nearby vignettes.
- [ ] Dialogue UI renders without blocking game view.

================================================================================
FILE: specs/feature_evidence_system.md
================================================================================
# Feature: Evidence System
**Version:** 1.0.0 | **Phase:** 1 → 2 | **Priority:** HIGH

## Experience Goal
**The Vibe:** *Building a Case (That Might Be Wrong)*
The Evidence Bag is the player's "proof"—but it's subjective. The game doesn't tell you if you're right. The player must trust their own judgment, knowing that red herrings exist. The system should feel like building a conspiracy board: connections are emergent, not explicit.

## User Stories
- **As a player**, I want to collect props as evidence, so I can reference them later.
- **As a player**, I want to remove evidence, so I can revise my theory.
- **As a player**, I want testimony (from Dialogue) to be stored separately from physical evidence.

## Technical Requirements
### Data Structures
```typescript
evidenceBag: {
  physicalEvidence: Prop[],
  testimony: { actor: string, statement: string, timestamp: number }[],
  convictionScore: number, // Auto-calculated
  contradictions: string[] // Flagged inconsistencies
}
```
### Logic Rules
1. **Adding Evidence:** Prop copied to `evidenceBag.physicalEvidence` (not removed from world).
2. **Conviction Score Calculation:** `(crimeProps * 20) + (testimonies * 10) - (herrings * 15)`.
3. **Contradiction Detection:** System compares testimony timestamps with prop locations.
4. **Integration with Confrontation:** `convictionScore > 60` = Strong case.

### Constraints
- No localStorage (Zustand only).
- UI must be minimal (sidebar).

## Dependencies
- [ ] `InspectionSystem` (physical evidence collection)
- [ ] `DialogueSystem` (testimony collection)
- [ ] `ConfrontationSystem` (score validation)

## Definition of Done
- [ ] Props can be added to Evidence Bag from Inspection UI.
- [ ] Testimony is stored separately from physical evidence.
- [ ] Conviction Score auto-calculates.
- [ ] Contradictions are flagged with red highlights.
- [ ] Evidence Bag requires 3+ items to trigger Confrontation.

================================================================================
FILE: specs/feature_inspection_system.md
================================================================================
# Feature: Inspection System
**Version:** 1.0.0 | **Phase:** 0 → 1 | **Priority:** HIGH

## Experience Goal
**The Vibe:** *Obsessive Detective*
The world is a crime scene, and every object is a potential clue. The player should feel rewarded for slowing down and examining details. But there's a catch: not every "clue" is real. Red herrings are intentionally designed to waste time.

## User Stories
- **As a player**, I want to click on props to reveal hidden details, so I can piece together the crime.
- **As a player**, I want some props to be red herrings, so the game isn't just "click everything."
- **As a player**, I want container props (bags, trash cans) to hide items, so exploration feels layered.

## Technical Requirements
### Data Structures
```typescript
prop: {
  id: string,
  type: 'crime' | 'herring' | 'ambiance' | 'container',
  description: string,
  hiddenItems?: Prop[], // For containers
  evidenceValue: number, // 0-100, how useful this is
  inspected: boolean
}
```
### Logic Rules
1. **Prop Types:** Crime (20%), Herring (30%), Ambiance (40%), Container (10%).
2. **Inspection UI:** Click prop → Show close-up modal. Container props → Require second click to "Search Inside".
3. **Evidence Value Scoring:** Crime (80-100), Herring (10-30), Ambiance (0).
4. **Container Logic:** Searching takes 5 seconds (killerHeat increases).

### Constraints
- Props must use `eventMode="static"` for clicks.
- Must define explicit `hitArea` for decals.

## Dependencies
- [ ] `PropSystem` (static/dynamic prop spawn logic)
- [ ] `VignetteSystem` (crime props are tied to vignettes)
- [ ] `EvidenceSystem` (stores inspected items)

## Definition of Done
- [ ] Clicking any prop shows Inspection UI.
- [ ] Container props reveal hidden items on second click.
- [ ] Crime props have higher evidenceValue than herrings.
- [ ] Inspecting 5+ props increases convictionScore accuracy.

================================================================================
FILE: specs/feature_interrogation_system.md
================================================================================
# Feature: Interrogation System
**Version:** 1.0.0 | **Phase:** 1 → 2 | **Priority:** MEDIUM

## Experience Goal
**The Vibe:** *Pressure Cooker*
This is the "deep dive" interaction. The UI should feel claustrophobic (close-up mugshot, limited time, high stakes). Every question narrows the possibility space but also risks spooking the killer if you're wrong.

## User Stories
- **As a player**, I want to interrogate suspects in a focused mode, so I can extract more detailed information.
- **As a player**, I want interrogation to have a cost (time, killerHeat), so it's a meaningful decision.
- **As a player**, I want the killer to have unique interrogation responses that tie to evidence.

## Technical Requirements
### Data Structures
```typescript
interrogationState: {
  target: Actor,
  questionsAsked: string[],
  responsesGiven: string[],
  stressLevel: number,
  timeRemaining: number
}
```
### Logic Rules
1. **Entry Condition:** Right-click actor. Costs 10 seconds of game time.
2. **Question Types:** Alibi, Observation, Motive.
3. **Killer-Specific Responses:**
   - Professional: Calm, over-prepared.
   - Psychopath: Erratic, slips details if stressed.
   - Opportunist: Changes story.
4. **Integration with Inspection:** inspected props near actor unlocks context questions.

### Constraints
- Must pause actor movement.
- UI must show actor's mugshot (200x200 canvas).
- Max 3 interrogations per game.

## Dependencies
- [ ] `DialogueSystem` (interrogation is a deeper layer of dialogue)
- [ ] `InspectionSystem` (prop-context integration)
- [ ] `EvidenceSystem` (testimony storage)

## Definition of Done
- [ ] Right-clicking an actor opens Interrogation UI.
- [ ] Killer gives 1-2 inconsistent responses when interrogated.
- [ ] Interrogation increases killerHeat by 5 points.
- [ ] Player can ask up to 5 questions before NPC "closes off".

================================================================================
FILE: specs/feature_killer_action_system.md
================================================================================
# Feature: Killer Action System
**Version:** 1.0.0 | **Phase:** 1 → 2 | **Priority:** CRITICAL

## Experience Goal
**The Vibe:** *The Invisible Shadow*
The killer is not a scripted event; they are a participant in the simulation. The player should feel that the killer is "out there" making moves while they are busy talking to NPCs. It creates a "race against time" feeling.

## User Stories
- **As a developer**, I want the killer to have a logic loop independent of the player, so the game world feels alive.
- **As a player**, I want to see the "aftermath" of killer actions (vignettes), so I can track their movement.
- **As a player**, I want the killer to change behavior based on my proximity (stalking vs. hiding).

## Technical Requirements
### Logic Rules
1. **The Loop:**
   - The killer selects a "Target Zone" every 60-120 seconds (scaled by `killerHeat`).
   - Movement: The killer walks to the zone using the same pathing as civilians.
2. **Action Selection:**
   - **Commit Crime:** If `killerHeat` is low, spawn a `Crime Vignette`.
   - **Plant Evidence:** If `killerHeat` is medium, spawn a `Herring Prop`.
   - **Stalk:** If player is close, the killer follows at a distance (150px) but stays in "Civilian" state.
3. **State Management:**
   - `killerState`: `{ currentAction: string, cooldown: number, targetVignette: string | null }`

## Dependencies
- [ ] `CivilianSystem` (for movement/pathing)
- [ ] `VignetteSystem` (to trigger spawns)
- [ ] `KillerHeatSystem` (to determine frequency)

## Definition of Done
- [ ] Killer successfully moves to a target and spawns a vignette.
- [ ] Cooldown between actions decreases as game progresses.
- [ ] Killer never "teleports"; they must walk to their crime scenes.

================================================================================
FILE: specs/feature_killer_heat_system.md
================================================================================
# Feature: Killer Heat System
**Version:** 1.0.0 | **Phase:** 0 → 1 | **Priority:** CRITICAL

## Experience Goal
**The Vibe:** *The World Is Watching You*
Heat should be the game's invisible director. As it rises, the city should feel "tighter"—civilians move faster, avoid eye contact, the killer becomes more aggressive. This is how we create dread without jump scares.

## User Stories
- **As a player**, I want the world to feel more tense as time passes.
- **As a player**, I want civilians to react to high Heat (flee, gossip, avoid me).
- **As a player**, I want the killer to act more boldly at high Heat.

## Technical Requirements
### Data Structures
```typescript
killerHeat: {
  value: number, // 0-100
  sources: { timeElapsed, crimesCommitted, playerInterrogations, witnessedVignettes },
  thresholds: { nervous: 30, flee: 70, cascade: 90 }
}
```
### Logic Rules
1. **Heat Calculation:** Based on time, crimes, interrogations, witnessed vignettes.
2. **Civilian Behavior Integration:**
   - Heat 30-70: Nervous (faster movement).
   - Heat > 70: Flee (run from player, `waitTimer = 0`).
3. **Killer Behavior Integration:**
   - Heat 50-90: Cooldown reduced by 50%.
   - Heat > 90: Cascade mode (commit crime every 20s).
4. **Visual Feedback:** Ambient sound louder, screen vignette darkens.

### Constraints
- Heat must trigger behavioral changes in `useCivilianSystem`.
- Cannot display Heat as a number (atmospheric system).

## Dependencies
- [ ] `CivilianSystem` (behavior state machine)
- [ ] `KillerActionSystem` (cooldown modifiers)
- [ ] `World.tsx` (global state management)

## Definition of Done
- [ ] Heat increases based on time, crimes, and player actions.
- [ ] Civilians flee when Heat > 70.
- [ ] Killer's crime cooldown shortens at Heat > 50.
- [ ] Screen vignette darkens at Heat > 70.

================================================================================
FILE: specs/feature_progression_system.md
================================================================================
# Feature: Progression & Level Scaling
**Version:** 1.0.0 | **Phase:** 3 → 4 | **Priority:** LOW (Post-MVP)

## Experience Goal
**The Vibe:** *Escalating Complexity, Diminishing Returns*
Each level should feel harder. The world gets more crowded, more props appear, and the killer gets smarter. The player should feel like they're getting better at the game, but the game is also getting better at fooling them.

## User Stories
- **As a player**, I want each level to introduce new challenges, so the game doesn't feel repetitive.
- **As a player**, I want levels to have distinct environments (park, docks, subway).
- **As a player**, I want the difficulty to scale organically.

## Technical Requirements
### Data Structures
```typescript
levelConfig: {
  levelNumber: number,
  environment: 'park' | 'docks' | 'subway',
  population: number, // NPC count
  propDensity: number, // Props per 100px²
  herringRatio: number, // % of props that are red herrings
  crisisTypes: string[],
  killerArchetypes: string[]
}
```
### Logic Rules
- **Level 1:** Park, 15 NPCs, 10% herrings, Bomb Crisis.
- **Level 2:** Docks, 25 NPCs, 20% herrings, Bomb/Poison.
- **Level 3:** Subway, 40 NPCs, 30% herrings, All Crises.
- **Post-Game Unlocks:** Killer archetypes and Hard Mode.

### Constraints
- No localStorage (Zustand only).
- Levels must reuse existing prop types.

## Dependencies
- [ ] All core systems (Killer, Civilian, Evidence, Crisis)
- [ ] `VignetteSystem` (environment-specific vignettes)

## Definition of Done
- [ ] 3 distinct levels with unique environments.
- [ ] Population scales 15 → 25 → 40 NPCs.
- [ ] Herring ratio scales 10% → 20% → 30%.
- [ ] Post-game screen shows level completion stats.

================================================================================
FILE: specs/feature_prop_system.md
================================================================================
# Feature: Prop System (The Physical World)
**Version:** 1.0.0 | **Phase:** 1 | **Priority:** HIGH

## Experience Goal
**The Vibe:** *Tactile Clues*
Props shouldn't feel like flat UI icons. They should feel like objects you found on the ground. When you click a "Bloody Glove," the slight zoom and texture should make you feel like you're actually picking it up. It turns the map from a background into a crime scene.

## User Stories
- **As a player**, I want to interact with objects in the environment, so I can find clues.
- **As a player**, I want props to have different visual weights, so I can distinguish between "trash" and "evidence."

## Technical Requirements
1. **Rendering (Pixi v8):**
   - All props are `Sprite` or `AnimatedSprite`.
   - `zIndex` MUST be set to `y` coordinate for correct depth sorting.
   - Hitboxes must be 10% larger than the visual sprite.
2. **Data Structure:**
   ```typescript
   interface Prop {
     id: string;
     texture: string;
     isInspectable: boolean;
     isCollectable: boolean;
     metadata: { weight: 'light' | 'heavy', bloodied: boolean };
   }
   ```

## Dependencies
- [ ] `Art Direction` (for sprite sheets)
- [ ] `InspectionSystem` (for the pop-up UI)

## Definition of Done
- [ ] Props render at the correct depth relative to NPCs.
- [ ] Hovering over an inspectable prop changes the cursor.
- [ ] Props can be spawned dynamically by the `KillerActionSystem`.

================================================================================
FILE: specs/feature_vignette_system.md
================================================================================
# Feature: Vignette System
**Version:** 1.0.0 | **Phase:** 0 (Exists) → 1 (Expand) | **Priority:** MEDIUM

## Experience Goal
**The Vibe:** *Environmental Storytelling*
Vignettes are the game's "show, don't tell" mechanism. A bloodstain + discarded glove + kicked-over chair tells a story without dialogue. But not every vignette is a crime—some are just life happening, which makes the real clues harder to spot.

## User Stories
- **As a player**, I want vignettes to tell micro-stories, so the world feels lived-in.
- **As a player**, I want crime vignettes to be distinct from normal ones, so I can identify patterns.

## Technical Requirements
### Data Structures
```typescript
vignette: {
  id: string,
  type: 'crime' | 'normal',
  props: Prop[],
  location: { x: number, y: number },
  narrative: string,
  linkedKiller?: string
}
```
### Logic Rules
1. **Spawn Logic:** Crime vignettes spawned by `KillerActionSystem`; Normal vignettes spawned during map gen.
2. **Crime Vignette Design:** Includes 2-3 spatially clustered Crime props.
3. **Integration with Witness System:** NPCs within 100px become "Witnesses".

### Constraints
- Vignettes must be registered in `KillerRegistry.ts`.
- Witness checks occur in `World.tsx`.

## Dependencies
- [ ] `KillerActionSystem` (crime vignette spawn trigger)
- [ ] `PropSystem` (vignette composition)
- [ ] `DialogueSystem` (Witness integration)

## Definition of Done
- [ ] Crime vignettes spawn after each killer action.
- [ ] Normal vignettes populate map.
- [ ] Witnesses reference nearby vignettes in dialogue.
- [ ] Crime vignettes match killer archetype.
```