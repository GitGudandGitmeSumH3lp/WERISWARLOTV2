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
1. **Dialogue Priority (InteractionRouter):**
```
   Click Actor → Check isKiller → Load killerDialogue : Load civilianDialogue
```
   
2. **Civilian Dialogue Types:**
   - **Helpful (20%):** Provides vague directional hints ("I saw someone near the fountain")
   - **Evasive (40%):** Deflects ("Why are you asking me?"), increases suspicionLevel
   - **Nervous (15%):** Acts guilty even if innocent (red herring mechanic)
   - **Gossip (25%):** References other NPCs ("That guy in the suit seemed off")

3. **Killer Dialogue Mechanics:**
   - **Consistency Check:** Killer's alibi is stored. If questioned twice, responses are compared.
   - **Prop-Triggered Hints:** If player inspects a weapon, then questions killer, dialogue shifts:
```
     Normal: "I've been here all day."
     Post-Weapon: "That thing? Probably just a tool someone left behind."
```
   - **Stress Escalation:** Each question increases `killerHeat` by 2 (they know they're being watched)

4. **Integration with Evidence:**
   - Dialogue responses can generate `testimonialEvidence` items in Evidence System
   - Contradictory statements are flagged if Evidence Bag contains conflicting props

### Constraints
- Must hook into existing `InteractionRouter` (second-highest priority)
- Cannot use form elements (React 19 restriction from `system.md`)
- Dialogue UI must be minimal (no text boxes cluttering the 2.5D view)

## Dependencies
- [ ] `InteractionRouter` (framework exists, needs dialogue hook)
- [ ] `EvidenceSystem` (testimonial evidence storage)
- [ ] `KillerActionSystem` (killerHeat integration)

## Definition of Done
- [ ] Clicking any actor triggers dialogue (no more "Just a suit" fallback)
- [ ] Killer's dialogue contains 2-3 subtle inconsistencies per game
- [ ] Civilian dialogue references nearby vignettes (contextual awareness)
- [ ] Questioning the same NPC twice yields slightly different responses
- [ ] Dialogue UI renders without blocking game view (overlay/sidebar)