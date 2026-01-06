# Feature: Evidence System
**Version:** 1.0.0 | **Phase:** 1 → 2 | **Priority:** HIGH

## Experience Goal
**The Vibe:** *Building a Case (That Might Be Wrong)*
The Evidence Bag is the player's "proof"—but it's subjective. The game doesn't tell you if you're right. The player must trust their own judgment, knowing that red herrings exist and that even "good" evidence can lead to the wrong suspect. The system should feel like building a conspiracy board: connections are emergent, not explicit.

## User Stories
- **As a player**, I want to collect props as evidence, so I can reference them later.
- **As a player**, I want to remove evidence, so I can revise my theory.
- **As a player**, I want testimony (from Dialogue) to be stored separately from physical evidence, so I can cross-reference.

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
1. **Adding Evidence:**
   - Inspection UI shows "Add to Evidence" button
   - Prop is copied to `evidenceBag.physicalEvidence` (not removed from world)

2. **Removing Evidence:**
   - Player opens Evidence Bag UI (sidebar or overlay)
   - Click evidence → Confirm removal

3. **Conviction Score Calculation:**
```
   convictionScore = (crimeProps * 20) + (testimonies * 10) - (herrings * 15)
```
   - Crime props: +20 points each
   - Testimonies: +10 points each
   - Red herrings: -15 points (penalties for false positives)

4. **Contradiction Detection:**
   - System compares testimony timestamps with prop locations
   - Example: Actor says "I was at the park" but evidence shows weapon at docks
   - Flags contradiction in UI (red highlight)

5. **Integration with Confrontation:**
   - Confrontation requires 3+ evidence items
   - `convictionScore > 60` = "Strong case" (post-game feedback)
   - `convictionScore < 40` = "Weak case" (higher victim count reveal)

### Constraints
- Cannot use localStorage (from `system.md`, must use Zustand)
- UI must be minimal (sidebar, not full-screen takeover)
- Evidence Bag must persist across Interrogations (state continuity)

## Dependencies
- [ ] `InspectionSystem` (physical evidence collection)
- [ ] `DialogueSystem` (testimony collection)
- [ ] `ConfrontationSystem` (score validation)

## Definition of Done
- [ ] Props can be added to Evidence Bag from Inspection UI
- [ ] Testimony is stored separately from physical evidence
- [ ] Conviction Score auto-calculates (visible in Evidence Bag UI)
- [ ] Contradictions are flagged with red highlights
- [ ] Evidence Bag requires 3+ items to trigger Confrontation