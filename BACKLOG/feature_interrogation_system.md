# Feature: Interrogation System
**Version:** 1.0.0 | **Phase:** 1 → 2 | **Priority:** MEDIUM

## Experience Goal
**The Vibe:** *Pressure Cooker*
This is the "deep dive" interaction—when the player commits to focusing on one suspect. The UI should feel claustrophobic (close-up mugshot, limited time, high stakes). Every question narrows the possibility space but also risks spooking the killer if you're wrong. It's the moment where the player goes from "gathering info" to "making an accusation."

## User Stories
- **As a player**, I want to interrogate suspects in a focused mode, so I can extract more detailed information than casual dialogue.
- **As a player**, I want interrogation to have a cost (time, killerHeat), so it's a meaningful decision, not a spam-click.
- **As a player**, I want the killer to have unique interrogation responses that tie to evidence, so I can cross-reference props with testimony.

## Technical Requirements

### Data Structures
```typescript
interrogationState: {
  target: Actor,
  questionsAsked: string[],
  responsesGiven: string[],
  stressLevel: number, // Affects response quality
  timeRemaining: number // Soft cap, not hard timer
}
```

### Logic Rules
1. **Entry Condition:**
   - Player must right-click (or hold-click) an actor to enter Interrogation Mode
   - Costs 10 seconds of game time (killerHeat increases during this period)

2. **Question Types:**
   - **Alibi:** "Where were you at [time]?" (references vignette timestamps)
   - **Observation:** "Did you see anything unusual?" (checks actor's proximity to crime)
   - **Motive:** "What's your relationship with [victim]?" (generates if victim prop exists)

3. **Killer-Specific Responses:**
   - Links to `KillerArchetype`:
     - `professional`: Calm, over-prepared alibis (too perfect = suspicious)
     - `psychopath`: Erratic, may slip incriminating details if stressed
     - `opportunist`: Changes story if asked same question twice

4. **Integration with Inspection System:**
   - If player has inspected props near the actor, interrogation reveals additional context
   - Example: "You found a bloody knife. This NPC was within 50px of it. Interrogation now includes: 'Do you recognize this weapon?'"

### Constraints
- Must pause actor movement (they stand still during interrogation)
- UI must show actor's mugshot (200x200 canvas, `system.md` centering rules)
- Cannot exceed 3 interrogations per game (resource scarcity)

## Dependencies
- [ ] `DialogueSystem` (interrogation is a deeper layer of dialogue)
- [ ] `InspectionSystem` (prop-context integration)
- [ ] `EvidenceSystem` (testimony storage)

## Definition of Done
- [ ] Right-clicking an actor opens Interrogation UI
- [ ] Killer gives 1-2 inconsistent responses when interrogated
- [ ] Interrogation increases killerHeat by 5 points
- [ ] Player can ask up to 5 questions before NPC "closes off"
- [ ] Testimony is added to Evidence Bag as separate entries