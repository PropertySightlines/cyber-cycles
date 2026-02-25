/**
 * Game Logic Module for Cyber Cycles
 *
 * This module contains pure game logic functions that can be unit tested.
 * These functions have no dependencies on Three.js, SpacetimeDB, or DOM APIs.
 */

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
 * Calculate the distance from a point (px, pz) to a line segment (x1, z1) -> (x2, z2)
 * @param {number} px - Point X coordinate
 * @param {number} pz - Point Z coordinate
 * @param {number} x1 - Segment start X
 * @param {number} z1 - Segment start Z
 * @param {number} x2 - Segment end X
 * @param {number} z2 - Segment end Z
 * @param {object} outClosest - Optional output object for closest point
 * @returns {number} Distance from point to segment
 */
export function distanceToSegment(px, pz, x1, z1, x2, z2, outClosest = {}) {
    const l2 = (x2 - x1) ** 2 + (z2 - z1) ** 2;
    if (l2 === 0) return Math.hypot(px - x1, pz - z1);
    let t = Math.max(0, Math.min(1, ((px - x1) * (x2 - x1) + (pz - z1) * (z2 - z1)) / l2));
    outClosest.x = x1 + t * (x2 - x1);
    outClosest.z = z1 + t * (z2 - z1);
    return Math.hypot(px - outClosest.x, pz - outClosest.z);
}

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

/**
 * Check if player is out of arena bounds
 * @param {object} player - Player state
 * @param {number} arenaSize - Arena boundary
 * @returns {boolean} True if out of bounds
 */
export function isOutOfBounds(player, arenaSize = CONSTANTS.ARENA_SIZE / 2) {
    if (!player) return false;
    return Math.abs(player.x) > arenaSize || Math.abs(player.z) > arenaSize;
}

/**
 * Check if player should be eliminated (hit trail)
 * @param {object} player - Player state
 * @param {Array} segments - All trail segments
 * @param {number} deathRadius - Death detection radius
 * @returns {object|null} Collision info or null
 */
export function checkTrailCollision(player, segments, deathRadius = CONSTANTS.DEATH_RADIUS) {
    if (!player || !player.alive) return null;

    for (const seg of segments) {
        if (seg.pid === player.id) continue;

        // Simplified collision check
        const dist = Math.hypot(player.x - seg.x1, player.z - seg.z1);
        if (dist < deathRadius) {
            return { collided: true, segment: seg, distance: dist };
        }
    }

    return null;
}

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
