# Feature: Red Herring System (v1.0)

## Experience Goal (The Vibe)
**"Paranoia."**
Trust nothing. That civilian looking at their watch? Are they checking the time for the murder, or just late for lunch? This feature injects doubt. The player should feel a spike of adrenaline when they see a clue, followed by the hesitation of second-guessing themselves.

## User Stories
- As a player, I want to see civilians perform actions that *look* like killer behaviors but are innocent.
- As a player, I want to find "evidence" that turns out to be unrelated trash, wasting my time/resources.
- As a player, I want the frequency of these false positives to increase in higher levels.

## Technical Requirements
- **Data Structure:**
  - `Civilian` entities need a `suspicionRating` or specific behavior tags (e.g., `isNervous`, `carriesItem`).
- **Logic:**
  - When spawning NPCs, a percentage (based on Difficulty Config) are assigned "Red Herring" traits.
  - **Red Herring Traits:**
    - *Pacing:* NPC moves back and forth rapidly (simulating anxiety).
    - *Loitering:* NPC stands near the "Kill Zone" but does nothing.
    - *Prop Interaction:* NPC interacts with a suspicious prop (e.g., opens a bag) but retrieves a harmless item (apple) instead of a weapon.

## Dependencies
- `feature_dialogue.md` (Civilian needs excuses if interrogated).
- `feature_killer_heat.md` (Interrogating a Red Herring shouldn't lower heat, or might raise it due to wasting time).

## Definition of Done
- [ ] A list of "Suspicious but Innocent" animations/behaviors is defined.
- [ ] Level logic injects these traits into X% of the civilian population.
- [ ] Interacting with a Red Herring NPC reveals they are innocent (via dialogue or item inspection).