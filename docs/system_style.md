# CODING STYLE GUIDE
**Language:** TypeScript (Strict), Python 3.11 (Scripts).

## SYNTAX RULES (TypeScript)
1. **Naming:** 
   - Variables/Functions: `camelCase` (e.g., `spawnKiller`, `isActive`).
   - Classes/Components: `PascalCase` (e.g., `KillerActor`, `EvidenceBag`).
   - Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_NPC_COUNT`).
2. **Typing:** NO `any`. Interfaces must be defined in `/types` or collocated if atomic.
3. **State:** specific Zustand stores use atomic selectors to prevent re-renders.
4. **PixiJS:** 
   - Extend `Container` or `Sprite` for game entities.
   - Clean up event listeners in `destroy()`.

## DIRECTORY STRUCTURE
- `/src/components`: React UI components.
- `/src/game`: PixiJS logic and systems.
- `/src/store`: Zustand stores.