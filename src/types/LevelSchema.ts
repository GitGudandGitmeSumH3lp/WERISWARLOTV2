// Level Schema Types - Phase 1 Foundation
// Based on specification from master-index.md

export type ZoneType = 'walkable' | 'obstacle' | 'vignette_hotspot' | 'exit';

export interface SpawnZone {
    x: number;              // World coordinate X (pixels)
    y: number;              // World coordinate Y (pixels)
    w: number;              // Width
    h: number;              // Height
    type: ZoneType;
    capacity_weight: number; // 0.0 to 1.0 (spawn probability)
}

export interface VignetteRule {
    id: string;             // e.g., "crime_scene_alley"
    required_zone: string;  // Matches ZoneType
    probability: number;    // 0.0 to 1.0
}

export interface LevelData {
    meta: {
        id: string;         // e.g., "level_01_docks"
        name: string;       // Display name
        version: string;    // Schema version (e.g., "1.0")
    };
    world: {
        width: number;              // Total world width in pixels
        height: number;             // Total world height in pixels
        background_asset_id: string; // Must exist in AssetRegistry
    };
    population: {
        civilian_count: number;     // Must be <= 60 (system.md constraint)
        killer_count: number;       // Usually 1
        density_map?: string;       // Optional: asset_id for density texture
    };
    zones: SpawnZone[];
    vignettes: VignetteRule[];
}

export interface ValidationResult {
    valid: boolean;
    errors: Array<{
        code: 'BOUNDS_OVERFLOW' | 'MISSING_ASSET' | 'POPULATION_EXCEEDED' | 'INVALID_WEIGHT' | 'SCHEMA_INVALID';
        message: string;
        path: string;          // JSON path (e.g., "zones[0].x")
    }>;
}

// Custom error types
export class ValidationError extends Error {
    constructor(public errors: ValidationResult['errors']) {
        super('Level validation failed');
        this.name = 'ValidationError';
    }
}

export class NetworkError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NetworkError';
    }
}

export class ParseError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ParseError';
    }
}