/
├── .gitignore
├── package.json
├── README.md
├── next.config.mjs
├── tsconfig.json
├── setup.py                  # Automation script
├── docs/                     # Documentation & Architecture
│   ├── master-index.md       # Global Interface Contracts
│   ├── modules/              # Logic Mappings
│   └── architecture/         # System diagrams/notes
├── specs/                    # The Feature Specifications (Source of Truth)
├── scripts/                  # Python tools (Level Gen, Balancing)
│   ├── __init__.py
│   └── level_generator.py
├── public/                   # Static Assets
│   ├── assets/
│   │   ├── sprites/          # Character & Prop pngs
│   │   ├── ui/               # HUD elements
│   │   └── audio/
│   └── data/                 # JSON exports from Python tools
└── src/
    ├── app/                  # Next.js 15 App Router
    │   ├── page.tsx          # Entry point
    │   ├── layout.tsx
    │   └── globals.css
    ├── components/
    │   ├── ui/               # React Overlays (Dialogue, Evidence Bag)
    │   │   └── debug/        # DevTools overlays
    │   └── world/            # PixiJS Components
    │       ├── core/         # Canvas setup, Viewport
    │       ├── entities/     # NPCs, Player
    │       └── props/        # PropSprites
    ├── stores/               # State Management (Zustand)
    │   ├── gameStore.ts      # Global game state (Paused, Heat)
    │   ├── propStore.ts      # Object persistence
    │   └── uiStore.ts        # Overlay visibility
    ├── types/                # TypeScript Interfaces
    │   ├── prop.ts
    │   └── state.ts
    ├── lib/                  # Utilities
    │   ├── pixi-utils.ts
    │   └── constants.ts
    └── data/                 # Hardcoded Registries (if not in DB)
        └── registries/