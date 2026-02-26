/**
 * Continuous Collision Detection (CCD) Module for Cyber Cycles
 *
 * Provides high-precision collision detection for:
 * - Point to line segment distance (sub-pixel precision)
 * - Line segment intersection tests
 * - Continuous collision checks against trail segments
 * - Bike-to-bike collision detection
 * - Arena boundary checks
 *
 * @module CollisionDetection
 */

// ============================================================================
// Constants
// ============================================================================

/**
 * Epsilon constant for sub-pixel precision comparisons
 * Used to handle floating-point rounding errors
 */
export const EPS = 0.01;

// ============================================================================
// Point to Line Segment Distance
// ============================================================================

/**
 * Calculate the distance from a point (px, pz) to a line segment (x1, z1) -> (x2, z2)
 * Uses sub-pixel precision with EPS constant for edge cases.
 *
 * @param {number} px - Point X coordinate
 * @param {number} pz - Point Z coordinate
 * @param {number} x1 - Segment start X
 * @param {number} z1 - Segment start Z
 * @param {number} x2 - Segment end X
 * @param {number} z2 - Segment end Z
 * @param {object} [outClosest] - Optional output object for closest point (for backward compatibility)
 * @returns {number} Distance from point to segment
 *
 * @example
 * const dist = distanceToSegment(5, 5, 0, 0, 10, 0); // Returns 5
 * const out = {};
 * const dist2 = distanceToSegment(5, 5, 0, 0, 10, 0, out); // out.x = 5, out.z = 5
 */
export function distanceToSegment(px, pz, x1, z1, x2, z2, outClosest) {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const l2 = dx * dx + dz * dz;

    // Handle zero-length segment (degenerate case)
    if (l2 < EPS * EPS) {
        const pdx = px - x1;
        const pdz = pz - z1;
        const dist = Math.sqrt(pdx * pdx + pdz * pdz);
        if (outClosest) {
            outClosest.x = x1;
            outClosest.z = z1;
        }
        return dist;
    }

    // Project point onto line, clamped to segment
    let t = ((px - x1) * dx + (pz - z1) * dz) / l2;
    t = t < 0 ? 0 : (t > 1 ? 1 : t);

    const closestX = x1 + t * dx;
    const closestZ = z1 + t * dz;
    const pdx = px - closestX;
    const pdz = pz - closestZ;

    // Populate output object if provided (backward compatibility)
    if (outClosest) {
        outClosest.x = closestX;
        outClosest.z = closestZ;
    }

    return Math.sqrt(pdx * pdx + pdz * pdz);
}

/**
 * Calculate distance from point to line segment and return closest point info
 * Returns detailed collision information including distance and closest point.
 *
 * @param {number} px - Point X coordinate
 * @param {number} pz - Point Z coordinate
 * @param {number} x1 - Segment start X
 * @param {number} z1 - Segment start Z
 * @param {number} x2 - Segment end X
 * @param {number} z2 - Segment end Z
 * @returns {{distance: number, closestX: number, closestZ: number, t: number}}
 *          distance: Distance from point to segment
 *          closestX, closestZ: Coordinates of closest point on segment
 *          t: Parameter value (0=start, 1=end, 0-1=on segment)
 *
 * @example
 * const result = distanceToSegmentWithClosest(5, 5, 0, 0, 10, 0);
 * // Returns: { distance: 5, closestX: 5, closestZ: 0, t: 0.5 }
 */
export function distanceToSegmentWithClosest(px, pz, x1, z1, x2, z2) {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const l2 = dx * dx + dz * dz;

    // Handle zero-length segment
    if (l2 < EPS * EPS) {
        return {
            distance: Math.sqrt((px - x1) ** 2 + (pz - z1) ** 2),
            closestX: x1,
            closestZ: z1,
            t: 0
        };
    }

    // Project point onto line
    let t = ((px - x1) * dx + (pz - z1) * dz) / l2;
    const clampedT = t < 0 ? 0 : (t > 1 ? 1 : t);

    const closestX = x1 + clampedT * dx;
    const closestZ = z1 + clampedT * dz;
    const pdx = px - closestX;
    const pdz = pz - closestZ;

    return {
        distance: Math.sqrt(pdx * pdx + pdz * pdz),
        closestX,
        closestZ,
        t: clampedT
    };
}

// ============================================================================
// Line Segment Intersection
// ============================================================================

/**
 * Test if two line segments intersect and return intersection info
 * Uses parametric line intersection with proper handling of parallel lines.
 *
 * @param {number} x1 - Segment 1 start X
 * @param {number} z1 - Segment 1 start Z
 * @param {number} x2 - Segment 1 end X
 * @param {number} z2 - Segment 1 end Z
 * @param {number} x3 - Segment 2 start X
 * @param {number} z3 - Segment 2 start Z
 * @param {number} x4 - Segment 2 end X
 * @param {number} z4 - Segment 2 end Z
 * @returns {{intersects: boolean, x?: number, z?: number, t1?: number, t2?: number}}
 *          intersects: True if segments intersect
 *          x, z: Intersection point coordinates (if intersects)
 *          t1: Parameter on segment 1 (if intersects)
 *          t2: Parameter on segment 2 (if intersects)
 *
 * @example
 * const result = lineSegmentIntersection(0, 0, 10, 10, 0, 10, 10, 0);
 * // Returns: { intersects: true, x: 5, z: 5, t1: 0.5, t2: 0.5 }
 */
export function lineSegmentIntersection(x1, z1, x2, z2, x3, z3, x4, z4) {
    const dx1 = x2 - x1;
    const dz1 = z2 - z1;
    const dx2 = x4 - x3;
    const dz2 = z4 - z3;

    // Calculate denominator (cross product of direction vectors)
    const denom = dx1 * dz2 - dz1 * dx2;

    // Check for parallel lines (denominator near zero)
    if (Math.abs(denom) < EPS) {
        // Lines are parallel - check if collinear and overlapping
        // Cross product of (p3-p1) and direction1 to check collinearity
        const crossP = (x3 - x1) * dz1 - (z3 - z1) * dx1;

        if (Math.abs(crossP) < EPS) {
            // Lines are collinear - check for overlap
            // Project segment 2 endpoints onto segment 1's line
            const l2 = dx1 * dx1 + dz1 * dz1;

            if (l2 < EPS * EPS) {
                // Segment 1 is a point
                const d2 = dx2 * dx2 + dz2 * dz2;
                if (d2 < EPS * EPS) {
                    // Both are points
                    const dist = Math.sqrt((x3 - x1) ** 2 + (z3 - z1) ** 2);
                    return { intersects: dist < EPS, x: x1, z: z1, t1: 0, t2: 0 };
                }
                // Check if point is on segment 2
                const t2 = ((x1 - x3) * dx2 + (z1 - z3) * dz2) / d2;
                if (t2 >= -EPS && t2 <= 1 + EPS) {
                    return { intersects: true, x: x1, z: z1, t1: 0, t2: Math.max(0, Math.min(1, t2)) };
                }
                return { intersects: false };
            }

            const t3 = ((x3 - x1) * dx1 + (z3 - z1) * dz1) / l2;
            const t4 = ((x4 - x1) * dx1 + (z4 - z1) * dz1) / l2;

            // Check if ranges overlap
            const minT = Math.max(0, Math.min(t3, t4));
            const maxT = Math.min(1, Math.max(t3, t4));

            if (minT <= maxT + EPS) {
                // Overlapping - return midpoint of overlap
                const overlapT = (minT + maxT) / 2;
                return {
                    intersects: true,
                    x: x1 + overlapT * dx1,
                    z: z1 + overlapT * dz1,
                    t1: overlapT,
                    t2: 0.5 // Approximate
                };
            }
        }
        return { intersects: false };
    }

    // Calculate parameters for intersection point
    const dx3 = x3 - x1;
    const dz3 = z3 - z1;

    const t1 = (dx3 * dz2 - dz3 * dx2) / denom;
    const t2 = (dx3 * dz1 - dz3 * dx1) / denom;

    // Check if intersection is within both segments (with epsilon tolerance)
    if (t1 >= -EPS && t1 <= 1 + EPS && t2 >= -EPS && t2 <= 1 + EPS) {
        const clampedT1 = Math.max(0, Math.min(1, t1));
        return {
            intersects: true,
            x: x1 + clampedT1 * dx1,
            z: z1 + clampedT1 * dz1,
            t1: clampedT1,
            t2: Math.max(0, Math.min(1, t2))
        };
    }

    return { intersects: false };
}

// ============================================================================
// Continuous Collision Detection
// ============================================================================

/**
 * Perform continuous collision check against trail segments
 * Checks for collision along the entire path from prevPos to currPos.
 *
 * @param {{x: number, z: number}} prevPos - Previous position
 * @param {{x: number, z: number}} currPos - Current position
 * @param {Array<{x1: number, z1: number, x2: number, z2: number, pid?: string}>} segments - Trail segments to check
 * @returns {Array<{segment: object, distance: number, collisionX: number, collisionZ: number, t: number}>}
 *          Array of collision info for each segment hit
 *
 * @example
 * const collisions = continuousCollisionCheck(
 *   {x: 0, z: 0}, {x: 10, z: 0},
 *   [{x1: 5, z1: -2, x2: 5, z2: 2, pid: 'player1'}]
 * );
 */
export function continuousCollisionCheck(prevPos, currPos, segments) {
    const collisions = [];

    // Skip if no movement
    const moveDx = currPos.x - prevPos.x;
    const moveDz = currPos.z - prevPos.z;
    const moveLen2 = moveDx * moveDx + moveDz * moveDz;

    if (moveLen2 < EPS * EPS) {
        // No movement - check point collision at current position
        for (const seg of segments) {
            const result = distanceToSegmentWithClosest(prevPos.x, prevPos.z, seg.x1, seg.z1, seg.x2, seg.z2);
            if (result.distance < EPS) {
                collisions.push({
                    segment: seg,
                    distance: result.distance,
                    collisionX: result.closestX,
                    collisionZ: result.closestZ,
                    t: 1
                });
            }
        }
        return collisions;
    }

    // Check intersection with each segment
    for (const seg of segments) {
        const intersection = lineSegmentIntersection(
            prevPos.x, prevPos.z, currPos.x, currPos.z,
            seg.x1, seg.z1, seg.x2, seg.z2
        );

        if (intersection.intersects) {
            // Calculate distance from start of movement to collision
            const collisionDist = Math.sqrt(
                (intersection.x - prevPos.x) ** 2 +
                (intersection.z - prevPos.z) ** 2
            );

            collisions.push({
                segment: seg,
                distance: collisionDist,
                collisionX: intersection.x,
                collisionZ: intersection.z,
                t: intersection.t1
            });
        }
    }

    // Sort by collision time (earliest first)
    collisions.sort((a, b) => a.t - b.t);

    return collisions;
}

/**
 * Full trail collision check for a player
 * Checks if player collides with any trail segments within death radius.
 *
 * @param {{id: string, x: number, z: number, alive: boolean}} player - Player state
 * @param {Array<{x1: number, z1: number, x2: number, z2: number, pid: string}>} segments - All trail segments
 * @param {number} deathRadius - Death detection radius (default: 2.0)
 * @returns {{collided: boolean, segment?: object, distance?: number, closestX?: number, closestZ?: number} | null}
 *          Collision info or null if no collision
 *
 * @example
 * const collision = checkTrailCollision(player, allSegments, 2.0);
 * if (collision) {
 *   console.log('Hit trail of player:', collision.segment.pid);
 * }
 */
export function checkTrailCollision(player, segments, deathRadius = 2.0) {
    if (!player || !player.alive) {
        return null;
    }

    let minDistance = Infinity;
    let closestSegment = null;
    let closestPoint = null;

    for (const seg of segments) {
        // Skip self-collision - players should not collide with their own trails
        // (only collide with other players' trails)
        if (seg.pid === player.id) continue;

        const result = distanceToSegmentWithClosest(
            player.x, player.z,
            seg.x1, seg.z1, seg.x2, seg.z2
        );

        if (result.distance < minDistance) {
            minDistance = result.distance;
            closestSegment = seg;
            closestPoint = { x: result.closestX, z: result.closestZ };
        }
    }

    // Check if closest distance is within death radius
    if (minDistance < deathRadius && closestSegment !== null) {
        return {
            collided: true,
            segment: closestSegment,
            distance: minDistance,
            closestX: closestPoint.x,
            closestZ: closestPoint.z
        };
    }

    return null;
}

// ============================================================================
// Bike-to-Bike Collision
// ============================================================================

/**
 * Check for bike-to-bike collisions between players
 * Detects when two bikes are within collision distance.
 *
 * @param {Array<{id: string, x: number, z: number, alive: boolean}>} players - All player states
 * @param {number} bikeCollisionDist - Bike collision distance (default: 4.0)
 * @returns {Array<{player1: string, player2: string, distance: number}>}
 *          Array of collision pairs
 *
 * @example
 * const collisions = checkBikeCollision(players, 4.0);
 * collisions.forEach(c => {
 *   console.log(`${c.player1} collided with ${c.player2}`);
 * });
 */
export function checkBikeCollision(players, bikeCollisionDist = 4.0) {
    const collisions = [];
    const alivePlayers = players.filter(p => p && p.alive);

    for (let i = 0; i < alivePlayers.length; i++) {
        for (let j = i + 1; j < alivePlayers.length; j++) {
            const p1 = alivePlayers[i];
            const p2 = alivePlayers[j];

            const dx = p2.x - p1.x;
            const dz = p2.z - p1.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (dist < bikeCollisionDist) {
                collisions.push({
                    player1: p1.id,
                    player2: p2.id,
                    distance: dist
                });
            }
        }
    }

    return collisions;
}

// ============================================================================
// Arena Boundary Check
// ============================================================================

/**
 * Check if a position is within arena bounds
 *
 * @param {number} x - X coordinate
 * @param {number} z - Z coordinate
 * @param {number} arenaSize - Arena half-size (boundary limit)
 * @returns {{inside: boolean, x?: number, z?: number, boundary?: string}}
 *          inside: True if within bounds
 *          x, z: Clamped coordinates (if outside)
 *          boundary: Which boundary was crossed (if outside)
 *
 * @example
 * const result = checkArenaBounds(250, 100, 200);
 * // Returns: { inside: false, x: 200, z: 100, boundary: 'right' }
 */
export function checkArenaBounds(x, z, arenaSize = 200) {
    const absX = Math.abs(x);
    const absZ = Math.abs(z);

    if (absX <= arenaSize && absZ <= arenaSize) {
        return { inside: true };
    }

    // Determine which boundary was crossed
    let boundary = '';
    if (absX > arenaSize && absZ > arenaSize) {
        boundary = 'corner';
    } else if (absX > arenaSize) {
        boundary = x > 0 ? 'right' : 'left';
    } else {
        boundary = z > 0 ? 'top' : 'bottom';
    }

    return {
        inside: false,
        x: Math.max(-arenaSize, Math.min(arenaSize, x)),
        z: Math.max(-arenaSize, Math.min(arenaSize, z)),
        boundary
    };
}

/**
 * Check if player is out of arena bounds
 * Convenience function that returns boolean result.
 *
 * @param {{x: number, z: number}} player - Player position
 * @param {number} arenaSize - Arena half-size
 * @returns {boolean} True if out of bounds
 */
export function isOutOfBounds(player, arenaSize = 200) {
    if (!player) return false;
    return Math.abs(player.x) > arenaSize || Math.abs(player.z) > arenaSize;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the squared distance from point to segment (faster, no sqrt)
 *
 * @param {number} px - Point X
 * @param {number} pz - Point Z
 * @param {number} x1 - Segment start X
 * @param {number} z1 - Segment start Z
 * @param {number} x2 - Segment end X
 * @param {number} z2 - Segment end Z
 * @returns {number} Squared distance
 */
export function distanceToSegmentSquared(px, pz, x1, z1, x2, z2) {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const l2 = dx * dx + dz * dz;

    if (l2 < EPS * EPS) {
        const pdx = px - x1;
        const pdz = pz - z1;
        return pdx * pdx + pdz * pdz;
    }

    let t = ((px - x1) * dx + (pz - z1) * dz) / l2;
    t = t < 0 ? 0 : (t > 1 ? 1 : t);

    const closestX = x1 + t * dx;
    const closestZ = z1 + t * dz;
    const pdx = px - closestX;
    const pdz = pz - closestZ;

    return pdx * pdx + pdz * pdz;
}

/**
 * Check if point is within radius of segment (fast rejection test)
 *
 * @param {number} px - Point X
 * @param {number} pz - Point Z
 * @param {number} x1 - Segment start X
 * @param {number} z1 - Segment start Z
 * @param {number} x2 - Segment end X
 * @param {number} z2 - Segment end Z
 * @param {number} radius - Check radius
 * @returns {boolean} True if within radius
 */
export function isPointNearSegment(px, pz, x1, z1, x2, z2, radius) {
    const distSq = distanceToSegmentSquared(px, pz, x1, z1, x2, z2);
    return distSq < radius * radius;
}

/**
 * Calculate the length of a line segment
 *
 * @param {number} x1 - Start X
 * @param {number} z1 - Start Z
 * @param {number} x2 - End X
 * @param {number} z2 - End Z
 * @returns {number} Segment length
 */
export function segmentLength(x1, z1, x2, z2) {
    const dx = x2 - x1;
    const dz = z2 - z1;
    return Math.sqrt(dx * dx + dz * dz);
}

/**
 * Get a point along a segment at parameter t
 *
 * @param {number} x1 - Start X
 * @param {number} z1 - Start Z
 * @param {number} x2 - End X
 * @param {number} z2 - End Z
 * @param {number} t - Parameter (0-1)
 * @returns {{x: number, z: number}} Point coordinates
 */
export function pointOnSegment(x1, z1, x2, z2, t) {
    const clampedT = Math.max(0, Math.min(1, t));
    return {
        x: x1 + clampedT * (x2 - x1),
        z: z1 + clampedT * (z2 - z1)
    };
}

// Export all functions as default for convenience
export default {
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
};
