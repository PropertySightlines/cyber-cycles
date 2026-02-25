/**
 * Rubber System for Precision Wall Grinding in Cyber Cycles
 *
 * This module implements the rubber-based wall grinding mechanics inspired by Armagetron.
 * Rubber provides a resource for wall proximity management, enabling smooth grinding
 * while preventing chain grinding through a malus system.
 *
 * Key Features:
 * - Exponential decay model for rubber consumption
 * - Malus system prevents chain grinding (turning immediately after turn)
 * - Server-authoritative validation for anti-cheat
 * - Client-side prediction for responsiveness
 * - Sub-pixel precision (0.001 units)
 *
 * @module RubberSystem
 */

// ============================================================================
// Configuration
// ============================================================================

/**
 * Default rubber system configuration
 * @type {Object}
 */
export const RUBBER_CONFIG = {
    baseRubber: 1.0,        // Client rubber reservoir
    serverRubber: 3.0,      // Server rubber for validation
    rubberSpeed: 40.0,      // Decay rate (units/second)
    minDistance: 0.001,     // Minimum wall distance (meters)
    malusDuration: 0.5,     // Seconds after turn before recovery
    malusFactor: 0.3,       // Effectiveness during malus (70% reduction)
    regenRate: 0.5,         // Rubber regeneration rate
    detectionRadius: 10.0,  // Wall detection radius
    slowdownThreshold: 2.0, // Distance to start slowing
    validationTolerance: 0.1 // Server validation tolerance (10%)
};

// ============================================================================
// RubberState Class
// ============================================================================

/**
 * RubberState class manages individual player rubber state
 *
 * Tracks rubber reservoir, malus status, and effectiveness for wall grinding.
 * Each player has their own rubber state that decays when near walls and
 * regenerates when away from walls.
 *
 * @example
 * const state = new RubberState('player1', 1.0, 3.0);
 * state.rubber = 0.8; // Current rubber level
 * state.effectiveness = 0.3; // During malus period
 */
export class RubberState {
    /**
     * Create a new RubberState instance
     * @param {string} playerId - Unique player identifier
     * @param {number} baseRubber - Initial/client rubber reservoir (default: 1.0)
     * @param {number} serverRubber - Server-authoritative rubber value (default: 3.0)
     */
    constructor(playerId, baseRubber = 1.0, serverRubber = 3.0) {
        /** @type {string} Unique player identifier */
        this.playerId = playerId;

        /** @type {number} Current rubber level in reservoir */
        this.rubber = baseRubber;

        /** @type {number} Maximum rubber capacity */
        this.maxRubber = baseRubber;

        /** @type {number} Server-authoritative rubber value for validation */
        this.serverRubber = serverRubber;

        /** @type {number} Malus multiplier (0-1), 1 = no malus */
        this.malus = 1.0;

        /** @type {number} Timer for malus duration (seconds) */
        this.malusTimer = 0;

        /** @type {number} Current effectiveness considering malus (0-1) */
        this.effectiveness = 1.0;
    }

    /**
     * Reset rubber state to initial values
     * @param {number} [newBaseRubber] - Optional new base rubber value
     */
    reset(newBaseRubber = null) {
        if (newBaseRubber !== null) {
            this.rubber = newBaseRubber;
            this.maxRubber = newBaseRubber;
        } else {
            this.rubber = this.maxRubber;
        }
        this.malus = 1.0;
        this.malusTimer = 0;
        this.effectiveness = 1.0;
    }

    /**
     * Clone this rubber state
     * @returns {RubberState} New RubberState instance with same values
     */
    clone() {
        const state = new RubberState(this.playerId, this.maxRubber, this.serverRubber);
        state.rubber = this.rubber;
        state.malus = this.malus;
        state.malusTimer = this.malusTimer;
        state.effectiveness = this.effectiveness;
        return state;
    }

    /**
     * Serialize state for network transmission
     * @returns {Object} Serializable state object
     */
    toJSON() {
        return {
            playerId: this.playerId,
            rubber: this.rubber,
            maxRubber: this.maxRubber,
            serverRubber: this.serverRubber,
            malus: this.malus,
            malusTimer: this.malusTimer,
            effectiveness: this.effectiveness
        };
    }

    /**
     * Deserialize from JSON
     * @param {Object} json - Serialized state object
     * @returns {RubberState} New RubberState instance
     */
    static fromJSON(json) {
        const state = new RubberState(json.playerId, json.maxRubber, json.serverRubber);
        state.rubber = json.rubber;
        state.malus = json.malus;
        state.malusTimer = json.malusTimer;
        state.effectiveness = json.effectiveness;
        return state;
    }
}

// ============================================================================
// Core Rubber Functions
// ============================================================================

/**
 * Update rubber state with exponential decay
 *
 * Applies exponential decay model: factor = 1 - exp(-β) where β = dt * rubberSpeed
 * Rubber decays faster when near walls and during malus periods.
 *
 * @param {RubberState} state - Rubber state to update
 * @param {number} dt - Delta time in seconds
 * @param {Object} rubberConfig - Configuration object
 * @param {number} [rubberConfig.rubberSpeed] - Decay rate (default: 40.0)
 * @param {number} [rubberConfig.malusFactor] - Malus effectiveness (default: 0.3)
 * @param {boolean} [isNearWall] - Whether player is near wall (default: true)
 * @returns {number} Rubber decay amount (positive value)
 *
 * @example
 * const decay = updateRubber(state, 0.016, RUBBER_CONFIG, true);
 * // decay ≈ 0.47 for default config at 60fps
 */
export function updateRubber(state, dt, rubberConfig = RUBBER_CONFIG, isNearWall = true) {
    if (!state || dt <= 0) return 0;

    const config = { ...RUBBER_CONFIG, ...rubberConfig };
    const beta = dt * config.rubberSpeed;
    const decayFactor = 1 - Math.exp(-beta);

    // Calculate effective decay based on wall proximity and malus
    let effectiveDecay = decayFactor;
    if (!isNearWall) {
        // Much slower decay when not near walls
        effectiveDecay = decayFactor * 0.1;
    }

    // Apply malus to effectiveness
    state.effectiveness = state.malus * (1 - effectiveDecay);

    // Calculate actual rubber consumption
    const decayAmount = state.rubber * effectiveDecay * state.malus;
    state.rubber = Math.max(0, state.rubber - decayAmount);

    // Update malus timer
    if (state.malusTimer > 0) {
        state.malusTimer -= dt;
        if (state.malusTimer <= 0) {
            state.malusTimer = 0;
            state.malus = 1.0;
            state.effectiveness = 1 - decayFactor;
        }
    }

    return decayAmount;
}

/**
 * Apply malus penalty after a turn
 *
 * Malus prevents chain grinding by reducing rubber effectiveness
 * for a duration after making a turn. This encourages strategic
 * wall grinding rather than constant wall-hugging.
 *
 * @param {RubberState} state - Rubber state to modify
 * @param {number} malusDuration - Duration of malus in seconds
 * @param {number} malusFactor - Effectiveness during malus (0-1, lower = more penalty)
 * @returns {RubberState} Modified state (for chaining)
 *
 * @example
 * applyMalus(state, 0.5, 0.3);
 * // state.malus = 0.3, state.malusTimer = 0.5
 */
export function applyMalus(state, malusDuration, malusFactor) {
    if (!state) return state;

    state.malus = Math.max(0, Math.min(1, malusFactor));
    state.malusTimer = Math.max(0, malusDuration);
    state.effectiveness = state.malus;

    return state;
}

/**
 * Calculate current rubber effectiveness
 *
 * Effectiveness combines rubber level and malus status to determine
 * how much protection the rubber provides against wall collisions.
 *
 * @param {RubberState} state - Rubber state to evaluate
 * @returns {number} Effectiveness value (0-1)
 *
 * @example
 * const eff = calculateEffectiveness(state);
 * if (eff < 0.5) { /* Low effectiveness - avoid walls *\/ }
 */
export function calculateEffectiveness(state) {
    if (!state) return 0;

    // Effectiveness is product of rubber ratio and malus
    const rubberRatio = state.maxRubber > 0 ? state.rubber / state.maxRubber : 0;
    return rubberRatio * state.malus;
}

/**
 * Consume rubber for collision avoidance
 *
 * When approaching a wall, rubber is consumed to prevent collision.
 * Returns false if insufficient rubber is available.
 *
 * @param {RubberState} state - Rubber state to consume from
 * @param {number} amount - Amount of rubber to consume
 * @returns {boolean} True if consumption successful, false if insufficient rubber
 *
 * @example
 * if (consumeRubber(state, 0.2)) {
 *   // Successfully consumed rubber for avoidance
 * } else {
 *   // Not enough rubber - collision imminent
 * }
 */
export function consumeRubber(state, amount) {
    if (!state || amount <= 0) return false;

    const availableAmount = amount * state.malus;

    if (state.rubber >= availableAmount) {
        state.rubber -= availableAmount;
        return true;
    }

    // Consume remaining rubber
    state.rubber = 0;
    return false;
}

/**
 * Regenerate rubber over time
 *
 * Rubber slowly regenerates when player is not near walls.
 * Regeneration is paused during malus period.
 *
 * @param {RubberState} state - Rubber state to regenerate
 * @param {number} dt - Delta time in seconds
 * @param {number} regenRate - Regeneration rate (rubber units/second)
 * @param {boolean} [isNearWall] - Whether player is near wall (default: false)
 * @returns {number} Amount of rubber regenerated
 *
 * @example
 * const regenerated = regenerateRubber(state, 0.016, 0.5, false);
 * // regenerated ≈ 0.008 at 60fps
 */
export function regenerateRubber(state, dt, regenRate, isNearWall = false) {
    if (!state || dt <= 0) return 0;

    // No regeneration during malus or when near walls
    if (state.malusTimer > 0 || isNearWall) {
        return 0;
    }

    const regenAmount = dt * regenRate;
    const actualRegen = Math.min(regenAmount, state.maxRubber - state.rubber);

    state.rubber = Math.min(state.maxRubber, state.rubber + actualRegen);

    return actualRegen;
}

// ============================================================================
// Wall Proximity Detection
// ============================================================================

/**
 * Detect wall proximity for a player
 *
 * Finds the nearest wall segment within detection radius.
 * Returns detailed information about the closest wall.
 *
 * @param {Object} player - Player state with position
 * @param {number} player.x - Player X coordinate
 * @param {number} player.z - Player Z coordinate
 * @param {Array<{x1: number, z1: number, x2: number, z2: number, pid?: string}>} segments - Wall/Trail segments
 * @param {number} detectionRadius - Maximum detection distance
 * @returns {Object|null} Nearest wall info or null if no walls in range
 * @returns {number} return.distance - Distance to nearest wall
 * @returns {number} return.closestX - X coordinate of closest point
 * @returns {number} return.closestZ - Z coordinate of closest point
 * @returns {Object} return.segment - The closest segment
 *
 * @example
 * const wall = detectWallProximity(player, segments, 10.0);
 * if (wall) {
 *   console.log('Wall at distance:', wall.distance);
 * }
 */
export function detectWallProximity(player, segments, detectionRadius) {
    if (!player || !segments || segments.length === 0) return null;

    let minDistance = Infinity;
    let closestSegment = null;
    let closestPoint = { x: player.x, z: player.z };

    for (const seg of segments) {
        // Skip own segments for wall detection
        if (seg.pid === player.id) continue;

        const dx = seg.x2 - seg.x1;
        const dz = seg.z2 - seg.z1;
        const l2 = dx * dx + dz * dz;

        let t;
        if (l2 < 0.000001) {
            // Zero-length segment
            t = 0;
        } else {
            // Project point onto line segment
            t = ((player.x - seg.x1) * dx + (player.z - seg.z1) * dz) / l2;
            t = Math.max(0, Math.min(1, t));
        }

        const closestX = seg.x1 + t * dx;
        const closestZ = seg.z1 + t * dz;
        const distDx = player.x - closestX;
        const distDz = player.z - closestZ;
        const distance = Math.sqrt(distDx * distDx + distDz * distDz);

        if (distance < minDistance) {
            minDistance = distance;
            closestSegment = seg;
            closestPoint = { x: closestX, z: closestZ };
        }
    }

    // Return null if no wall within detection radius
    if (minDistance > detectionRadius) {
        return null;
    }

    return {
        distance: minDistance,
        closestX: closestPoint.x,
        closestZ: closestPoint.z,
        segment: closestSegment
    };
}

/**
 * Calculate distance to nearest wall
 *
 * Returns the minimum distance from player to any wall segment.
 * Does not apply detection radius filter.
 *
 * @param {Object} player - Player state with position
 * @param {number} player.x - Player X coordinate
 * @param {number} player.z - Player Z coordinate
 * @param {Array<{x1: number, z1: number, x2: number, z2: number}>} segments - Wall/Trail segments
 * @returns {number} Distance to nearest wall (Infinity if no segments)
 *
 * @example
 * const dist = calculateWallDistance(player, segments);
 * if (dist < 2.0) { /* Very close to wall *\/ }
 */
export function calculateWallDistance(player, segments) {
    if (!player || !segments || segments.length === 0) return Infinity;

    let minDistance = Infinity;

    for (const seg of segments) {
        const dx = seg.x2 - seg.x1;
        const dz = seg.z2 - seg.z1;
        const l2 = dx * dx + dz * dz;

        let t;
        if (l2 < 0.000001) {
            t = 0;
        } else {
            t = ((player.x - seg.x1) * dx + (player.z - seg.z1) * dz) / l2;
            t = Math.max(0, Math.min(1, t));
        }

        const closestX = seg.x1 + t * dx;
        const closestZ = seg.z1 + t * dz;
        const distDx = player.x - closestX;
        const distDz = player.z - closestZ;
        const distance = Math.sqrt(distDx * distDx + distDz * distDz);

        if (distance < minDistance) {
            minDistance = distance;
        }
    }

    return minDistance;
}

/**
 * Check if player is near any wall
 *
 * Boolean check for wall proximity within threshold distance.
 *
 * @param {Object} player - Player state with position
 * @param {number} player.x - Player X coordinate
 * @param {number} player.z - Player Z coordinate
 * @param {Array<{x1: number, z1: number, x2: number, z2: number}>} segments - Wall/Trail segments
 * @param {number} threshold - Distance threshold for "near"
 * @returns {boolean} True if player is near any wall
 *
 * @example
 * if (isNearWall(player, segments, 2.0)) {
 *   // Apply wall grinding mechanics
 * }
 */
export function isNearWall(player, segments, threshold) {
    if (!player || !segments || segments.length === 0) return false;

    const thresholdSq = threshold * threshold;

    for (const seg of segments) {
        const dx = seg.x2 - seg.x1;
        const dz = seg.z2 - seg.z1;
        const l2 = dx * dx + dz * dz;

        let t;
        if (l2 < 0.000001) {
            t = 0;
        } else {
            t = ((player.x - seg.x1) * dx + (player.z - seg.z1) * dz) / l2;
            t = Math.max(0, Math.min(1, t));
        }

        const closestX = seg.x1 + t * dx;
        const closestZ = seg.z1 + t * dz;
        const distDx = player.x - closestX;
        const distDz = player.z - closestZ;
        const distSq = distDx * distDx + distDz * distDz;

        if (distSq < thresholdSq) {
            return true;
        }
    }

    return false;
}

// ============================================================================
// Automatic Speed Adjustment
// ============================================================================

/**
 * Calculate speed adjustment based on wall proximity
 *
 * Automatically reduces speed when approaching walls to prevent
 * collisions when rubber is low. Uses exponential falloff for
 * smooth speed transitions.
 *
 * @param {Object} player - Player state
 * @param {number} player.x - Player X coordinate
 * @param {number} player.z - Player Z coordinate
 * @param {number} player.speed - Current speed
 * @param {Array<{x1: number, z1: number, x2: number, z2: number}>} segments - Wall/Trail segments
 * @param {Object} rubberConfig - Configuration object
 * @param {number} [rubberConfig.slowdownThreshold] - Distance to start slowing (default: 2.0)
 * @param {number} [rubberConfig.minDistance] - Minimum safe distance (default: 0.001)
 * @returns {number} Adjusted speed value
 *
 * @example
 * const newSpeed = calculateSpeedAdjustment(player, segments, RUBBER_CONFIG);
 * player.speed = newSpeed;
 */
export function calculateSpeedAdjustment(player, segments, rubberConfig = RUBBER_CONFIG) {
    if (!player || !segments || segments.length === 0) return player?.speed || 40;

    const config = { ...RUBBER_CONFIG, ...rubberConfig };
    const distance = calculateWallDistance(player, segments);

    // No adjustment if far from walls
    if (distance >= config.slowdownThreshold) {
        return player.speed;
    }

    // Calculate slowdown factor based on distance
    // Exponential falloff for smooth transition
    const normalizedDist = distance / config.slowdownThreshold;
    const slowdownFactor = Math.pow(normalizedDist, 0.5); // Square root for gradual curve

    return player.speed * slowdownFactor;
}

/**
 * Apply full rubber-based collision response
 *
 * Combines rubber consumption, speed adjustment, and position correction
 * for complete wall collision handling.
 *
 * @param {Object} player - Player state
 * @param {number} player.x - Player X coordinate
 * @param {number} player.z - Player Z coordinate
 * @param {number} player.speed - Current speed
 * @param {number} player.dir_x - Direction X component
 * @param {number} player.dir_z - Direction Z component
 * @param {RubberState} rubberState - Player's rubber state
 * @param {Array<{x1: number, z1: number, x2: number, z2: number}>} segments - Wall/Trail segments
 * @param {Object} rubberConfig - Configuration object
 * @returns {Object} Collision response result
 * @returns {boolean} return.collided - True if collision occurred
 * @returns {number} return.newSpeed - Adjusted speed
 * @returns {number} return.rubberConsumed - Amount of rubber used
 * @returns {number|null} return.newX - Corrected X position (if collision)
 * @returns {number|null} return.newZ - Corrected Z position (if collision)
 *
 * @example
 * const response = applyRubberCollision(player, segments, rubberState, RUBBER_CONFIG);
 * if (response.collided) {
 *   player.x = response.newX;
 *   player.z = response.newZ;
 * }
 * player.speed = response.newSpeed;
 */
export function applyRubberCollision(player, segments, rubberState, rubberConfig = RUBBER_CONFIG) {
    const result = {
        collided: false,
        newSpeed: player.speed,
        rubberConsumed: 0,
        newX: null,
        newZ: null
    };

    if (!player || !segments || segments.length === 0 || !rubberState) {
        return result;
    }

    const config = { ...RUBBER_CONFIG, ...rubberConfig };
    const wallInfo = detectWallProximity(player, segments, config.detectionRadius);

    if (!wallInfo) {
        return result;
    }

    const distance = wallInfo.distance;

    // Check if collision is imminent
    if (distance < config.minDistance) {
        // Attempt to consume rubber for collision avoidance
        const requiredRubber = (config.minDistance - distance) * 10;
        const consumed = consumeRubber(rubberState, requiredRubber);

        if (consumed) {
            result.rubberConsumed = requiredRubber;

            // Push player away from wall along normal
            const normalX = player.x - wallInfo.closestX;
            const normalZ = player.z - wallInfo.closestZ;
            const normalLen = Math.sqrt(normalX * normalX + normalZ * normalZ);

            if (normalLen > 0.0001) {
                const pushDist = config.minDistance - distance;
                result.newX = player.x + (normalX / normalLen) * pushDist;
                result.newZ = player.z + (normalZ / normalLen) * pushDist;
                result.collided = true;
            }

            // Reduce speed significantly
            result.newSpeed = player.speed * 0.5;
        } else {
            // No rubber left - hard collision
            result.collided = true;
            result.newSpeed = 0;
        }
    } else if (distance < config.slowdownThreshold) {
        // Gradual slowdown when approaching wall
        result.newSpeed = calculateSpeedAdjustment(player, segments, config);

        // Consume small amount of rubber for proximity
        const proximityCost = (config.slowdownThreshold - distance) * 0.01;
        consumeRubber(rubberState, proximityCost);
        result.rubberConsumed = proximityCost;
    }

    return result;
}

// ============================================================================
// Rubber Validation (Server-Side)
// ============================================================================

/**
 * Validate rubber usage against server state
 *
 * Server-side validation to detect rubber cheating.
 * Compares client-reported rubber with server-authoritative value.
 *
 * @param {number} clientRubber - Client-reported rubber value
 * @param {number} serverRubber - Server-authoritative rubber value
 * @param {number} tolerance - Acceptable deviation (0-1, default: 0.1 = 10%)
 * @returns {Object} Validation result
 * @returns {boolean} return.valid - True if rubber values match within tolerance
 * @returns {number} return.deviation - Actual deviation between values
 * @returns {string} return.reason - Reason for validation failure (if any)
 *
 * @example
 * const validation = validateRubberUsage(clientRubber, serverRubber, 0.1);
 * if (!validation.valid) {
 *   console.log('Rubber mismatch:', validation.reason);
 * }
 */
export function validateRubberUsage(clientRubber, serverRubber, tolerance = RUBBER_CONFIG.validationTolerance) {
    const result = {
        valid: true,
        deviation: 0,
        reason: null
    };

    // Handle edge cases
    if (typeof clientRubber !== 'number' || isNaN(clientRubber)) {
        result.valid = false;
        result.reason = 'Invalid client rubber value';
        return result;
    }

    if (typeof serverRubber !== 'number' || isNaN(serverRubber)) {
        result.valid = false;
        result.reason = 'Invalid server rubber value';
        return result;
    }

    // Check for impossible values first (before clamping)
    if (clientRubber < 0 || clientRubber > 10) {
        result.valid = false;
        result.reason = 'Client rubber out of valid range [0, 10]';
        return result;
    }

    // Clamp values to valid range
    const clampedClient = Math.max(0, Math.min(10, clientRubber));
    const clampedServer = Math.max(0, Math.min(10, serverRubber));

    // Calculate absolute and relative deviation
    const absDeviation = Math.abs(clampedClient - clampedServer);
    const maxRubber = Math.max(clampedClient, clampedServer, 0.001);
    const relDeviation = absDeviation / maxRubber;

    result.deviation = relDeviation;

    // Check if within tolerance
    if (relDeviation > tolerance) {
        result.valid = false;
        result.reason = `Rubber deviation ${((relDeviation * 100).toFixed(1))}% exceeds tolerance ${((tolerance * 100).toFixed(1))}%`;
    }

    return result;
}

/**
 * Generate rubber usage report for server
 *
 * Creates a detailed report of rubber state and usage for
 * server-side validation and anti-cheat analysis.
 *
 * @param {Object} player - Player state
 * @param {string} player.id - Player identifier
 * @param {number} player.x - Player X coordinate
 * @param {number} player.z - Player Z coordinate
 * @param {Array<{x1: number, z1: number, x2: number, z2: number}>} segments - Wall/Trail segments
 * @param {number} dt - Delta time since last report
 * @param {RubberState} [rubberState] - Optional rubber state
 * @returns {Object} Rubber usage report
 * @returns {string} return.playerId - Player identifier
 * @returns {number} return.timestamp - Report timestamp (ms)
 * @returns {number} return.wallDistance - Distance to nearest wall
 * @returns {number} return.isNearWall - Boolean (as number) for wall proximity
 * @returns {Object|null} return.rubberState - Rubber state snapshot (if provided)
 * @returns {number} return.estimatedConsumption - Estimated rubber consumption
 *
 * @example
 * const report = createRubberReport(player, segments, dt, rubberState);
 * sendToServer('rubber_report', report);
 */
export function createRubberReport(player, segments, dt, rubberState = null) {
    const config = RUBBER_CONFIG;
    const wallDistance = calculateWallDistance(player, segments);
    const nearWall = wallDistance < config.detectionRadius;

    // Estimate rubber consumption based on wall proximity
    let estimatedConsumption = 0;
    if (nearWall && rubberState) {
        const beta = dt * config.rubberSpeed;
        const decayFactor = 1 - Math.exp(-beta);
        estimatedConsumption = rubberState.rubber * decayFactor * rubberState.malus;
    }

    return {
        playerId: player.id,
        timestamp: Date.now(),
        wallDistance: wallDistance === Infinity ? -1 : wallDistance,
        isNearWall: nearWall ? 1 : 0,
        rubberState: rubberState ? rubberState.toJSON() : null,
        estimatedConsumption: estimatedConsumption,
        dt: dt
    };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate rubber needed for safe wall approach
 *
 * Determines the minimum rubber required to safely approach
 * a wall at a given distance and speed.
 *
 * @param {number} distance - Current distance to wall
 * @param {number} speed - Current player speed
 * @param {Object} rubberConfig - Configuration object
 * @returns {number} Minimum rubber needed
 */
export function calculateRubberNeeded(distance, speed, rubberConfig = RUBBER_CONFIG) {
    const config = { ...RUBBER_CONFIG, ...rubberConfig };

    // More rubber needed for higher speeds and closer distances
    const speedFactor = speed / 40; // Normalize to base speed
    const distanceFactor = config.slowdownThreshold / Math.max(distance, config.minDistance);

    return speedFactor * distanceFactor * 0.1;
}

/**
 * Get wall grinding quality score
 *
 * Rates the quality of wall grinding based on distance,
 * rubber effectiveness, and consistency.
 *
 * @param {number} wallDistance - Distance to wall
 * @param {RubberState} rubberState - Player's rubber state
 * @param {Object} rubberConfig - Configuration object
 * @returns {Object} Quality score
 * @returns {number} return.score - Overall score (0-100)
 * @returns {string} return.rating - Quality rating
 *
 * @example
 * const quality = getGrindingQuality(0.5, rubberState, RUBBER_CONFIG);
 * // { score: 85, rating: 'Excellent' }
 */
export function getGrindingQuality(wallDistance, rubberState, rubberConfig = RUBBER_CONFIG) {
    const config = { ...RUBBER_CONFIG, ...rubberConfig };

    // Optimal grinding distance is very close but not touching
    const optimalDistance = config.minDistance * 2;
    const distanceScore = Math.exp(-Math.abs(wallDistance - optimalDistance) * 2);

    // Rubber effectiveness score
    const rubberScore = calculateEffectiveness(rubberState);

    // Combined score
    const combinedScore = (distanceScore * 0.6 + rubberScore * 0.4) * 100;

    let rating;
    if (combinedScore >= 90) rating = 'Perfect';
    else if (combinedScore >= 75) rating = 'Excellent';
    else if (combinedScore >= 50) rating = 'Good';
    else if (combinedScore >= 25) rating = 'Fair';
    else rating = 'Poor';

    return {
        score: Math.round(combinedScore * 10) / 10,
        rating: rating
    };
}

// ============================================================================
// Default Export
// ============================================================================

export default {
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
};
