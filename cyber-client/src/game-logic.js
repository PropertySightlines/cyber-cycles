/**
 * Game Logic Module for Cyber Cycles
 *
 * This module contains pure game logic functions that can be unit tested.
 * These functions have no dependencies on Three.js, SpacetimeDB, or DOM APIs.
 *
 * @deprecated The collision detection functions in this module are deprecated.
 * Please use the new CollisionDetection module instead:
 * @see {@link ./physics/CollisionDetection.js}
 */

// Import configuration from Config module
import {
    PHYSICS_CONFIG,
    GAME_CONFIG,
    COLLISION_CONFIG,
    VISUAL_CONFIG,
    AUDIO_CONFIG,
    PRESETS,
    validatePhysicsConfig,
    validateGameConfig,
    validateCollisionConfig,
    validateConfig,
    exportConfig,
    importConfig,
    mergeConfig,
    getDefaultConfig,
    getPreset,
    listPresets,
    resetConfig,
    createConfigBuilder
} from './core/Config.js';

// Import collision detection functions for internal use and re-export
import {
    EPS,
    distanceToSegment,
    distanceToSegmentWithClosest,
    lineSegmentIntersection,
    continuousCollisionCheck,
    checkTrailCollision,
    checkBikeCollision,
    checkArenaBounds,
    isOutOfBounds,
    distanceToSegmentSquared,
    isPointNearSegment,
    segmentLength,
    pointOnSegment
} from './physics/CollisionDetection.js';

// Re-export collision detection functions
export {
    EPS,
    distanceToSegment,
    distanceToSegmentWithClosest,
    lineSegmentIntersection,
    continuousCollisionCheck,
    checkTrailCollision,
    checkBikeCollision,
    checkArenaBounds,
    isOutOfBounds,
    distanceToSegmentSquared,
    isPointNearSegment,
    segmentLength,
    pointOnSegment
} from './physics/CollisionDetection.js';

// Import Rubber System for precision wall grinding
export {
    RUBBER_CONFIG,
    RubberState,
    updateRubber,
    applyMalus,
    calculateEffectiveness,
    consumeRubber,
    regenerateRubber,
    detectWallProximity,
    calculateWallDistance,
    isNearWall,
    calculateSpeedAdjustment,
    applyRubberCollision,
    validateRubberUsage,
    createRubberReport,
    calculateRubberNeeded,
    getGrindingQuality
} from './physics/RubberSystem.js';

// ============================================================================
// Re-exports from Config.js for Backward Compatibility
// ============================================================================

/**
 * @deprecated Use PHYSICS_CONFIG from ./core/Config.js instead
 */
export { PHYSICS_CONFIG };

/**
 * @deprecated Use GAME_CONFIG from ./core/Config.js instead
 */
export { GAME_CONFIG };

/**
 * @deprecated Use COLLISION_CONFIG from ./core/Config.js instead
 */
export { COLLISION_CONFIG };

/**
 * @deprecated Use VISUAL_CONFIG from ./core/Config.js instead
 */
export { VISUAL_CONFIG };

/**
 * @deprecated Use AUDIO_CONFIG from ./core/Config.js instead
 */
export { AUDIO_CONFIG };

/**
 * @deprecated Use PRESETS from ./core/Config.js instead
 */
export { PRESETS };

/**
 * @deprecated Use validatePhysicsConfig from ./core/Config.js instead
 */
export { validatePhysicsConfig };

/**
 * @deprecated Use validateGameConfig from ./core/Config.js instead
 */
export { validateGameConfig };

/**
 * @deprecated Use validateCollisionConfig from ./core/Config.js instead
 */
export { validateCollisionConfig };

/**
 * @deprecated Use validateConfig from ./core/Config.js instead
 */
export { validateConfig };

/**
 * @deprecated Use exportConfig from ./core/Config.js instead
 */
export { exportConfig };

/**
 * @deprecated Use importConfig from ./core/Config.js instead
 */
export { importConfig };

/**
 * @deprecated Use mergeConfig from ./core/Config.js instead
 */
export { mergeConfig };

/**
 * @deprecated Use getDefaultConfig from ./core/Config.js instead
 */
export { getDefaultConfig };

/**
 * @deprecated Use getPreset from ./core/Config.js instead
 */
export { getPreset };

/**
 * @deprecated Use listPresets from ./core/Config.js instead
 */
export { listPresets };

/**
 * @deprecated Use resetConfig from ./core/Config.js instead
 */
export { resetConfig };

/**
 * @deprecated Use createConfigBuilder from ./core/Config.js instead
 */
export { createConfigBuilder };

// ============================================================================
// Constants
// ============================================================================

export const CONSTANTS = {
    ARENA_SIZE: 400,
    BOOST_RADIUS: 5,
    DEATH_RADIUS: 2.0,
    BRAKE_SPEED: 20,
    TURN_SPEED: 2.0,
    NUM_PLAYERS: 6,
    SPAWN_RADIUS: 100,
    BIKE_COLLISION_DIST: 4.0,
    TRAIL_SPACING: 2.0,
    TRAIL_HEIGHT: 2.0
};

export const DEFAULT_CONFIG = {
    baseSpeed: 40,
    boostSpeed: 70,
    maxTrailLength: 200,
    slipstreamMode: "tail_only"
};

export const ADMIN_IDENTITY = "c2007484dedccf3d247b44dc4ebafeee388121889dffea0ceedfd63b888106c1";

// ============================================================================
// Vector Math Functions
// ============================================================================

/**
 * Normalize a 2D vector to unit length
 * @param {number} x - X component
 * @param {number} z - Z component
 * @returns {{x: number, z: number}} Normalized vector
 */
export function normalize(x, z) {
    const len = Math.sqrt(x * x + z * z);
    if (len === 0) return { x: 1, z: 0 };
    return { x: x / len, z: z / len };
}

/**
 * Rotate a direction vector by an angle (in radians)
 * @param {number} dirX - Direction X component
 * @param {number} dirZ - Direction Z component
 * @param {number} angle - Rotation angle in radians
 * @returns {{x: number, z: number}} Rotated vector
 */
export function rotateDirection(dirX, dirZ, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
        x: dirX * cos + dirZ * sin,
        z: -dirX * sin + dirZ * cos
    };
}

/**
 * Calculate distance between two points
 * @param {number} x1 - Point 1 X
 * @param {number} z1 - Point 1 Z
 * @param {number} x2 - Point 2 X
 * @param {number} z2 - Point 2 Z
 * @returns {number} Distance
 */
export function distance(x1, z1, x2, z2) {
    return Math.hypot(x2 - x1, z2 - z1);
}

/**
 * Linear interpolation between two values
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number} Interpolated value
 */
export function lerp(a, b, t) {
    return a + (b - a) * Math.max(0, Math.min(1, t));
}

// ============================================================================
// Collision Detection Functions
// ============================================================================

/**
 * Check if two circles collide
 * @param {number} x1 - Circle 1 X
 * @param {number} z1 - Circle 1 Z
 * @param {number} r1 - Circle 1 radius
 * @param {number} x2 - Circle 2 X
 * @param {number} z2 - Circle 2 Z
 * @param {number} r2 - Circle 2 radius
 * @returns {boolean} True if circles collide
 */
export function checkCircleCollision(x1, z1, r1, x2, z2, r2) {
    const dist = Math.hypot(x2 - x1, z2 - z1);
    return dist < (r1 + r2);
}

/**
 * Check if a point is inside the arena bounds
 * @param {number} x - Point X coordinate
 * @param {number} z - Point Z coordinate
 * @param {number} arenaSize - Arena half-size (boundary)
 * @returns {boolean} True if point is inside bounds
 */
export function isInsideArena(x, z, arenaSize = 200) {
    return Math.abs(x) <= arenaSize && Math.abs(z) <= arenaSize;
}

// Note: isOutOfBounds and checkTrailCollision are now exported from
// ./physics/CollisionDetection.js with improved implementations

// ============================================================================
// Player State Functions
// ============================================================================

/**
 * Create a player state object
 * @param {string} id - Player ID
 * @param {object} overrides - Property overrides
 * @returns {object} Player state
 */
export function createPlayerState(id, overrides = {}) {
    return {
        id: id || "",
        owner_id: "",
        is_ai: false,
        personality: "safe",
        color: 0xffffff,
        x: 0,
        z: 0,
        dir_x: 0,
        dir_z: -1,
        speed: 40,
        is_braking: false,
        is_turning_left: false,
        is_turning_right: false,
        alive: true,
        ready: false,
        turnPoints: [],
        lastTrailPoint: { x: 0, z: 0 },
        distanceSinceLastPoint: 0,
        ...overrides
    };
}

/**
 * Clone a player object from SpacetimeDB format to local state format
 * @param {object} p - Player object from database
 * @returns {object|null} Cloned player object or null if invalid
 */
export function clonePlayer(p) {
    if (!p) return null;

    let turnPoints = [];
    try {
        const turnPointsJson = p.turn_points_json || p.turnPointsJson;
        turnPoints = JSON.parse(turnPointsJson || "[]");
    } catch (e) {
        turnPoints = [];
    }

    return {
        id: p.id || "",
        owner_id: p.owner_id || p.ownerId,
        is_ai: p.is_ai !== undefined ? p.is_ai : (p.isAi !== undefined ? p.isAi : false),
        personality: p.personality || "safe",
        color: p.color || 0xffffff,
        x: typeof p.x === 'number' ? p.x : 0,
        z: typeof p.z === 'number' ? p.z : 0,
        dir_x: typeof p.dir_x === 'number' ? p.dir_x : (typeof p.dirX === 'number' ? p.dirX : 0),
        dir_z: typeof p.dir_z === 'number' ? p.dir_z : (typeof p.dirZ === 'number' ? p.dirZ : -1),
        speed: typeof p.speed === 'number' ? p.speed : DEFAULT_CONFIG.baseSpeed,
        is_braking: p.is_braking !== undefined ? p.is_braking : (p.isBraking !== undefined ? p.isBraking : false),
        is_turning_left: p.is_turning_left !== undefined ? p.is_turning_left : false,
        is_turning_right: p.is_turning_right !== undefined ? p.is_turning_right : false,
        alive: p.alive !== false,
        ready: p.ready !== false,
        turnPoints: turnPoints,
        lastTrailPoint: { x: p.x, z: p.z },
        distanceSinceLastPoint: 0
    };
}

// ============================================================================
// Slipstream/Boost Functions
// ============================================================================

/**
 * Check if player is eligible for slipstream boost
 * @param {object} player - Player state
 * @param {Array} segments - Trail segments from other players
 * @param {number} boostRadius - Boost detection radius
 * @param {string} slipstreamMode - "standard" or "tail_only"
 * @returns {boolean} True if player can boost
 */
export function canSlipstream(player, segments, boostRadius = CONSTANTS.BOOST_RADIUS, slipstreamMode = "tail_only") {
    if (!player || !player.alive) return false;

    const dirX = player.dir_x || 0;
    const dirZ = player.dir_z || -1;

    for (const seg of segments) {
        if (seg.pid === player.id) continue;

        // Use distanceToSegment for accurate calculation
        const tempClosest = {};
        const dist = distanceToSegment(player.x, player.z, seg.x1, seg.z1, seg.x2, seg.z2, tempClosest);

        if (dist <= boostRadius) {
            // Check if player is behind the trail (for tail_only mode)
            if (slipstreamMode === "tail_only") {
                const dot = (tempClosest.x - player.x) * dirX + (tempClosest.z - player.z) * dirZ;
                if (dot > 0) return true;
            } else {
                // Standard mode - any direction works
                return true;
            }
        }
    }

    return false;
}

/**
 * Update player speed based on slipstream status
 * @param {object} player - Player state
 * @param {boolean} isBoosting - Whether player is in slipstream
 * @param {object} config - Game configuration
 */
export function updatePlayerSpeed(player, isBoosting, config = DEFAULT_CONFIG) {
    if (!player) return;

    if (player.is_braking) {
        player.speed = CONSTANTS.BRAKE_SPEED;
    } else if (isBoosting) {
        player.speed = config.boostSpeed;
    } else {
        player.speed = config.baseSpeed;
    }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert a color number to hex string
 * @param {number} color - Color as integer
 * @returns {string} Hex color string with #
 */
export function colorToHex(color) {
    return '#' + color.toString(16).padStart(6, '0');
}

/**
 * Parse turn points from JSON string
 * @param {string} json - JSON string of turn points
 * @returns {Array} Array of turn point objects
 */
export function parseTurnPoints(json) {
    try {
        return JSON.parse(json || "[]");
    } catch (e) {
        return [];
    }
}

/**
 * Serialize turn points to JSON string
 * @param {Array} points - Array of turn point objects
 * @returns {string} JSON string
 */
export function serializeTurnPoints(points) {
    return JSON.stringify(points || []);
}

/**
 * Generate a random spawn position within the arena
 * @param {number} arenaSize - Arena half-size
 * @param {number} minSpawnRadius - Minimum distance from center
 * @returns {{x: number, z: number}} Spawn position
 */
export function generateSpawnPosition(arenaSize = 200, minSpawnRadius = 50) {
    const angle = Math.random() * Math.PI * 2;
    const radius = minSpawnRadius + Math.random() * (arenaSize - minSpawnRadius);
    return {
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius
    };
}

// ============================================================================
// Rubber-Based Collision Functions
// ============================================================================

/**
 * Apply rubber-based collision detection and response
 *
 * Integrates the RubberSystem for precision wall grinding.
 * This function combines traditional collision detection with rubber mechanics
 * to provide smooth wall grinding while preventing chain grinding.
 *
 * @param {Object} player - Player state with position and direction
 * @param {number} player.x - Player X coordinate
 * @param {number} player.z - Player Z coordinate
 * @param {number} player.speed - Current player speed
 * @param {number} player.dir_x - Direction X component
 * @param {number} player.dir_z - Direction Z component
 * @param {string} player.id - Player identifier
 * @param {RubberState} rubberState - Player's rubber state
 * @param {Array<{x1: number, z1: number, x2: number, z2: number, pid?: string}>} segments - All trail segments
 * @param {Object} [rubberConfig] - Optional rubber configuration override
 * @returns {Object} Collision result with rubber-based adjustments
 * @returns {boolean} return.collided - True if collision occurred
 * @returns {boolean} return.isGrinding - True if player is wall grinding
 * @returns {number} return.newSpeed - Adjusted speed after collision response
 * @returns {number|null} return.newX - Corrected X position (if collision)
 * @returns {number|null} return.newZ - Corrected Z position (if collision)
 * @returns {number} return.rubberConsumed - Amount of rubber used
 * @returns {number} return.wallDistance - Distance to nearest wall
 *
 * @example
 * const result = applyRubberBasedCollision(player, rubberState, allSegments);
 * if (result.collided) {
 *   player.x = result.newX;
 *   player.z = result.newZ;
 * }
 * player.speed = result.newSpeed;
 */
export function applyRubberBasedCollision(player, rubberState, segments, rubberConfig = null) {
    const config = rubberConfig || RUBBER_CONFIG;

    const result = {
        collided: false,
        isGrinding: false,
        newSpeed: player.speed,
        newX: null,
        newZ: null,
        rubberConsumed: 0,
        wallDistance: Infinity
    };

    if (!player || !rubberState || !segments || segments.length === 0) {
        return result;
    }

    // Calculate wall distance
    result.wallDistance = calculateWallDistance(player, segments);

    // Check if player is near wall for grinding
    const isNear = isNearWall(player, segments, config.detectionRadius);

    if (isNear) {
        result.isGrinding = true;

        // Apply rubber-based collision response
        const collisionResponse = applyRubberCollision(player, segments, rubberState, config);

        result.collided = collisionResponse.collided;
        result.newSpeed = collisionResponse.newSpeed;
        result.newX = collisionResponse.newX;
        result.newZ = collisionResponse.newZ;
        result.rubberConsumed = collisionResponse.rubberConsumed;

        // Apply malus if player turned while grinding
        if (player.is_turning_left || player.is_turning_right) {
            applyMalus(rubberState, config.malusDuration, config.malusFactor);
        }
    }

    // Update rubber state
    updateRubber(rubberState, 0.016, config, isNear);

    return result;
}

/**
 * Check for rubber-based trail collision with death handling
 *
 * Extends traditional trail collision with rubber mechanics.
 * Players with sufficient rubber can survive close calls.
 *
 * @param {Object} player - Player state
 * @param {RubberState} rubberState - Player's rubber state
 * @param {Array<{x1: number, z1: number, x2: number, z2: number, pid: string}>} segments - Trail segments
 * @param {number} deathRadius - Death detection radius (default: 2.0)
 * @returns {Object} Collision result
 * @returns {boolean} return.collided - True if fatal collision
 * @returns {boolean} return.survived - True if rubber prevented death
 * @returns {number} return.distance - Distance to closest trail
 * @returns {Object|null} return.segment - Hit segment info
 *
 * @example
 * const result = checkRubberTrailCollision(player, rubberState, segments);
 * if (result.collided && !result.survived) {
 *   player.alive = false;
 * }
 */
export function checkRubberTrailCollision(player, rubberState, segments, deathRadius = 2.0) {
    const result = {
        collided: false,
        survived: false,
        distance: Infinity,
        segment: null
    };

    if (!player || !player.alive || !segments || segments.length === 0) {
        return result;
    }

    // Check traditional trail collision
    const traditionalCollision = checkTrailCollision(player, segments, deathRadius);

    if (!traditionalCollision) {
        return result;
    }

    result.collided = true;
    result.distance = traditionalCollision.distance;
    result.segment = traditionalCollision.segment;

    // Check if rubber can prevent death
    const effectiveness = calculateEffectiveness(rubberState);
    const requiredRubber = (deathRadius - traditionalCollision.distance) * 2;

    if (effectiveness > 0.5 && consumeRubber(rubberState, requiredRubber)) {
        // Rubber saved the player - survive with penalty
        result.survived = true;
        result.rubberConsumed = requiredRubber;

        // Apply heavy malus for surviving
        applyMalus(rubberState, RUBBER_CONFIG.malusDuration * 2, RUBBER_CONFIG.malusFactor);
    }

    return result;
}

/**
 * Update player rubber state for game loop
 *
 * Central function for updating all rubber-related state
 * during the game loop. Should be called each frame.
 *
 * @param {Object} player - Player state
 * @param {RubberState} rubberState - Player's rubber state
 * @param {Array<{x1: number, z1: number, x2: number, z2: number}>} segments - Trail segments
 * @param {number} dt - Delta time in seconds
 * @param {Object} [config] - Optional configuration override
 * @returns {Object} Update result
 * @returns {boolean} return.isNearWall - Whether player is near wall
 * @returns {number} return.rubberRemaining - Current rubber level
 * @returns {number} return.effectiveness - Current effectiveness
 */
export function updatePlayerRubber(player, rubberState, segments, dt, config = null) {
    const cfg = config || RUBBER_CONFIG;

    const isNear = isNearWall(player, segments, cfg.detectionRadius);

    // Update rubber with decay
    updateRubber(rubberState, dt, cfg, isNear);

    // Regenerate if not near wall and no malus
    if (!isNear && rubberState.malusTimer <= 0) {
        regenerateRubber(rubberState, dt, cfg.regenRate, false);
    }

    return {
        isNearWall: isNear,
        rubberRemaining: rubberState.rubber,
        effectiveness: calculateEffectiveness(rubberState)
    };
}

// ============================================================================
// State Management Functions
// ============================================================================

/**
 * Create initial game state
 * @returns {object} Initial state object
 */
export function createInitialState() {
    return {
        players: {},
        isBoosting: false,
        countdown: 3,
        roundActive: false,
        cameraShake: 0,
        turnLeft: false,
        turnRight: false,
        brake: false
    };
}

/**
 * Create default configuration
 * @returns {object} Default config object
 */
export function createDefaultConfig() {
    return { ...DEFAULT_CONFIG };
}
