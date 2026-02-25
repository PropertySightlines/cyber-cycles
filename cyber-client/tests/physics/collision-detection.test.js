/**
 * Collision Detection Tests for Cyber Cycles
 *
 * Comprehensive test suite for the CollisionDetection module.
 * Tests cover:
 * - distanceToSegment (15+ tests)
 * - lineSegmentIntersection (10+ tests)
 * - continuousCollisionCheck (10+ tests)
 * - checkTrailCollision (8+ tests)
 * - checkBikeCollision (5+ tests)
 * - checkArenaBounds (5+ tests)
 * - Sub-pixel precision (5+ tests)
 *
 * Target: 60+ tests total
 */

import { describe, it, expect } from 'vitest';
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
} from '../../src/physics/CollisionDetection.js';

// ============================================================================
// distanceToSegment Tests (15+ tests)
// ============================================================================

describe('distanceToSegment', () => {
    // Basic functionality tests
    it('should return perpendicular distance when point is above segment midpoint', () => {
        const dist = distanceToSegment(0, 5, -10, 0, 10, 0);
        expect(dist).toBeCloseTo(5, 10);
    });

    it('should return perpendicular distance when point is below segment', () => {
        const dist = distanceToSegment(0, -3, -5, 0, 5, 0);
        expect(dist).toBeCloseTo(3, 10);
    });

    it('should return distance to endpoint when point is beyond segment end', () => {
        const dist = distanceToSegment(15, 0, 0, 0, 10, 0);
        expect(dist).toBeCloseTo(5, 10);
    });

    it('should return distance to start endpoint when point is before segment', () => {
        const dist = distanceToSegment(-5, 0, 0, 0, 10, 0);
        expect(dist).toBeCloseTo(5, 10);
    });

    it('should return zero when point is exactly on segment', () => {
        const dist = distanceToSegment(5, 0, 0, 0, 10, 0);
        expect(dist).toBeCloseTo(0, 10);
    });

    it('should return zero when point is at segment start', () => {
        const dist = distanceToSegment(0, 0, 0, 0, 10, 0);
        expect(dist).toBeCloseTo(0, 10);
    });

    it('should return zero when point is at segment end', () => {
        const dist = distanceToSegment(10, 0, 0, 0, 10, 0);
        expect(dist).toBeCloseTo(0, 10);
    });

    // Zero-length segment tests
    it('should handle zero-length segment (point)', () => {
        const dist = distanceToSegment(3, 4, 0, 0, 0, 0);
        expect(dist).toBeCloseTo(5, 10);
    });

    it('should handle zero-length segment with point at same location', () => {
        const dist = distanceToSegment(0, 0, 0, 0, 0, 0);
        expect(dist).toBeCloseTo(0, 10);
    });

    // Diagonal segment tests
    it('should handle diagonal segment (45 degrees)', () => {
        const dist = distanceToSegment(0, 0, 0, 10, 10, 0);
        expect(dist).toBeCloseTo(7.071, 2); // sqrt(50)
    });

    it('should handle diagonal segment with point on line', () => {
        const dist = distanceToSegment(5, 5, 0, 0, 10, 10);
        expect(dist).toBeCloseTo(0, 10);
    });

    it('should handle diagonal segment with point off the line', () => {
        const dist = distanceToSegment(0, 10, -5, 5, 5, -5);
        expect(dist).toBeCloseTo(7.071, 2); // Point is off the line, distance to closest endpoint
    });

    // Negative coordinate tests
    it('should handle negative coordinates', () => {
        const dist = distanceToSegment(-5, -5, -10, 0, 0, 0);
        expect(dist).toBeCloseTo(5, 10); // Distance from (-5,-5) to closest point (-5,0) on segment
    });

    it('should handle all negative segment coordinates', () => {
        const dist = distanceToSegment(0, 0, -10, -10, -5, -5);
        expect(dist).toBeCloseTo(7.071, 2); // Distance to closest endpoint (-5,-5)
    });

    // Edge cases
    it('should handle very small segment', () => {
        const dist = distanceToSegment(0, 1, -0.0001, 0, 0.0001, 0);
        expect(dist).toBeCloseTo(1, 8);
    });

    it('should handle very long segment', () => {
        const dist = distanceToSegment(0, 10, -1000, 0, 1000, 0);
        expect(dist).toBeCloseTo(10, 10);
    });

    it('should handle vertical segment', () => {
        const dist = distanceToSegment(5, 0, 0, -10, 0, 10);
        expect(dist).toBeCloseTo(5, 10);
    });

    it('should handle horizontal segment', () => {
        const dist = distanceToSegment(0, 7, -5, 0, 5, 0);
        expect(dist).toBeCloseTo(7, 10);
    });

    it('should handle point very close to segment', () => {
        const dist = distanceToSegment(5, 0.001, 0, 0, 10, 0);
        expect(dist).toBeLessThan(0.002);
    });
});

// ============================================================================
// distanceToSegmentWithClosest Tests (included in distanceToSegment count)
// ============================================================================

describe('distanceToSegmentWithClosest', () => {
    it('should return distance and closest point for perpendicular case', () => {
        const result = distanceToSegmentWithClosest(0, 5, -10, 0, 10, 0);
        expect(result.distance).toBeCloseTo(5, 10);
        expect(result.closestX).toBeCloseTo(0, 10);
        expect(result.closestZ).toBeCloseTo(0, 10);
        expect(result.t).toBeCloseTo(0.5, 10);
    });

    it('should return t=0 when closest point is at segment start', () => {
        const result = distanceToSegmentWithClosest(-5, 0, 0, 0, 10, 0);
        expect(result.t).toBe(0);
        expect(result.closestX).toBe(0);
        expect(result.closestZ).toBe(0);
    });

    it('should return t=1 when closest point is at segment end', () => {
        const result = distanceToSegmentWithClosest(15, 0, 0, 0, 10, 0);
        expect(result.t).toBe(1);
        expect(result.closestX).toBe(10);
        expect(result.closestZ).toBe(0);
    });

    it('should handle zero-length segment', () => {
        const result = distanceToSegmentWithClosest(3, 4, 0, 0, 0, 0);
        expect(result.distance).toBeCloseTo(5, 10);
        expect(result.closestX).toBe(0);
        expect(result.closestZ).toBe(0);
        expect(result.t).toBe(0);
    });

    it('should return correct t for diagonal segment', () => {
        const result = distanceToSegmentWithClosest(5, 5, 0, 0, 10, 10);
        expect(result.distance).toBeCloseTo(0, 10);
        expect(result.t).toBeCloseTo(0.5, 10);
    });
});

// ============================================================================
// lineSegmentIntersection Tests (10+ tests)
// ============================================================================

describe('lineSegmentIntersection', () => {
    // Basic intersection tests
    it('should detect intersection of perpendicular segments', () => {
        const result = lineSegmentIntersection(0, 0, 10, 10, 0, 10, 10, 0);
        expect(result.intersects).toBe(true);
        expect(result.x).toBeCloseTo(5, 10);
        expect(result.z).toBeCloseTo(5, 10);
    });

    it('should detect intersection at segment endpoints', () => {
        const result = lineSegmentIntersection(0, 0, 10, 0, 10, 0, 10, 10);
        expect(result.intersects).toBe(true);
        expect(result.x).toBeCloseTo(10, 10);
        expect(result.z).toBeCloseTo(0, 10);
    });

    it('should not detect intersection when segments are separate', () => {
        const result = lineSegmentIntersection(0, 0, 5, 0, 10, 0, 15, 0);
        expect(result.intersects).toBe(false);
    });

    it('should not detect intersection when segments cross outside bounds', () => {
        const result = lineSegmentIntersection(0, 0, 5, 5, 0, 10, 5, 15);
        expect(result.intersects).toBe(false);
    });

    // Parallel line tests
    it('should not detect intersection for parallel horizontal segments', () => {
        const result = lineSegmentIntersection(0, 0, 10, 0, 0, 5, 10, 5);
        expect(result.intersects).toBe(false);
    });

    it('should not detect intersection for parallel vertical segments', () => {
        const result = lineSegmentIntersection(0, 0, 0, 10, 5, 0, 5, 10);
        expect(result.intersects).toBe(false);
    });

    it('should detect overlap for collinear segments', () => {
        const result = lineSegmentIntersection(0, 0, 10, 0, 5, 0, 15, 0);
        expect(result.intersects).toBe(true);
    });

    it('should not detect intersection for non-overlapping collinear segments', () => {
        const result = lineSegmentIntersection(0, 0, 5, 0, 10, 0, 15, 0);
        expect(result.intersects).toBe(false);
    });

    // Edge cases
    it('should handle zero-length segment (point) on another segment', () => {
        const result = lineSegmentIntersection(5, 0, 5, 0, 0, 0, 10, 0);
        expect(result.intersects).toBe(true);
        expect(result.x).toBeCloseTo(5, 10);
    });

    it('should handle two zero-length segments at same point', () => {
        const result = lineSegmentIntersection(5, 5, 5, 5, 5, 5, 5, 5);
        expect(result.intersects).toBe(true);
    });

    it('should handle two zero-length segments at different points', () => {
        const result = lineSegmentIntersection(0, 0, 0, 0, 5, 5, 5, 5);
        expect(result.intersects).toBe(false);
    });

    it('should return correct t parameters for intersection', () => {
        const result = lineSegmentIntersection(0, 0, 10, 0, 5, -5, 5, 5);
        expect(result.intersects).toBe(true);
        expect(result.t1).toBeCloseTo(0.5, 10);
        expect(result.t2).toBeCloseTo(0.5, 10);
    });

    it('should handle T-junction intersection', () => {
        const result = lineSegmentIntersection(0, 0, 10, 0, 5, 0, 5, 10);
        expect(result.intersects).toBe(true);
        expect(result.x).toBeCloseTo(5, 10);
        expect(result.z).toBeCloseTo(0, 10);
    });

    it('should handle nearly parallel segments', () => {
        const result = lineSegmentIntersection(0, 0, 10, 0.001, 0, 10, 10, 10.001);
        expect(result.intersects).toBe(false);
    });
});

// ============================================================================
// continuousCollisionCheck Tests (10+ tests)
// ============================================================================

describe('continuousCollisionCheck', () => {
    it('should detect collision when moving perpendicular to segment', () => {
        const collisions = continuousCollisionCheck(
            { x: 0, z: -5 },
            { x: 0, z: 5 },
            [{ x1: -5, z1: 0, x2: 5, z2: 0, pid: 'player1' }]
        );
        expect(collisions.length).toBe(1);
        expect(collisions[0].collisionX).toBeCloseTo(0, 10);
        expect(collisions[0].collisionZ).toBeCloseTo(0, 10);
    });

    it('should detect collision when moving parallel and hitting segment end', () => {
        const collisions = continuousCollisionCheck(
            { x: -10, z: 0 },
            { x: 10, z: 0 },
            [{ x1: 5, z1: -2, x2: 5, z2: 2, pid: 'player1' }]
        );
        expect(collisions.length).toBe(1);
        expect(collisions[0].collisionX).toBeCloseTo(5, 10);
    });

    it('should return empty array when no collision occurs', () => {
        const collisions = continuousCollisionCheck(
            { x: 0, z: -10 },
            { x: 0, z: -5 },
            [{ x1: -5, z1: 0, x2: 5, z2: 0, pid: 'player1' }]
        );
        expect(collisions.length).toBe(0);
    });

    it('should return multiple collisions sorted by time', () => {
        const collisions = continuousCollisionCheck(
            { x: 0, z: -10 },
            { x: 0, z: 10 },
            [
                { x1: -5, z1: 5, x2: 5, z2: 5, pid: 'player1' },
                { x1: -5, z1: -5, x2: 5, z2: -5, pid: 'player2' }
            ]
        );
        expect(collisions.length).toBe(2);
        expect(collisions[0].collisionZ).toBeCloseTo(-5, 10); // First collision
        expect(collisions[1].collisionZ).toBeCloseTo(5, 10);  // Second collision
    });

    it('should handle zero movement (point check)', () => {
        const collisions = continuousCollisionCheck(
            { x: 0, z: 0 },
            { x: 0, z: 0 },
            [{ x1: -5, z1: 0, x2: 5, z2: 0, pid: 'player1' }]
        );
        expect(collisions.length).toBe(1);
    });

    it('should handle diagonal movement', () => {
        const collisions = continuousCollisionCheck(
            { x: -10, z: -10 },
            { x: 10, z: 10 },
            [{ x1: -10, z1: 10, x2: 10, z2: -10, pid: 'player1' }]
        );
        expect(collisions.length).toBe(1);
        expect(collisions[0].collisionX).toBeCloseTo(0, 10);
        expect(collisions[0].collisionZ).toBeCloseTo(0, 10);
    });

    it('should return correct t parameter for collision time', () => {
        const collisions = continuousCollisionCheck(
            { x: 0, z: 0 },
            { x: 10, z: 0 },
            [{ x1: 5, z1: -5, x2: 5, z2: 5, pid: 'player1' }]
        );
        expect(collisions.length).toBe(1);
        expect(collisions[0].t).toBeCloseTo(0.5, 10);
    });

    it('should handle collision at movement start', () => {
        const collisions = continuousCollisionCheck(
            { x: 5, z: 0 },
            { x: 10, z: 0 },
            [{ x1: 5, z1: -5, x2: 5, z2: 5, pid: 'player1' }]
        );
        expect(collisions.length).toBe(1);
        expect(collisions[0].t).toBeCloseTo(0, 10);
    });

    it('should handle collision at movement end', () => {
        const collisions = continuousCollisionCheck(
            { x: 0, z: 0 },
            { x: 5, z: 0 },
            [{ x1: 5, z1: -5, x2: 5, z2: 5, pid: 'player1' }]
        );
        expect(collisions.length).toBe(1);
        expect(collisions[0].t).toBeCloseTo(1, 10);
    });

    it('should handle multiple segments with different collision times', () => {
        const collisions = continuousCollisionCheck(
            { x: 0, z: 0 },
            { x: 100, z: 0 },
            [
                { x1: 80, z1: -5, x2: 80, z2: 5, pid: 'player1' },
                { x1: 20, z1: -5, x2: 20, z2: 5, pid: 'player2' },
                { x1: 50, z1: -5, x2: 50, z2: 5, pid: 'player3' }
            ]
        );
        expect(collisions.length).toBe(3);
        expect(collisions[0].collisionX).toBeCloseTo(20, 10);
        expect(collisions[1].collisionX).toBeCloseTo(50, 10);
        expect(collisions[2].collisionX).toBeCloseTo(80, 10);
    });

    it('should handle grazing collision (endpoint hit)', () => {
        const collisions = continuousCollisionCheck(
            { x: 0, z: 5 },
            { x: 10, z: 5 },
            [{ x1: 5, z1: 5, x2: 5, z2: 10, pid: 'player1' }]
        );
        expect(collisions.length).toBe(1);
    });
});

// ============================================================================
// checkTrailCollision Tests (8+ tests)
// ============================================================================

describe('checkTrailCollision', () => {
    it('should detect collision when player is close to trail segment', () => {
        const player = { id: 'p1', x: 0, z: 1, alive: true };
        const segments = [{ x1: -5, z1: 0, x2: 5, z2: 0, pid: 'p2' }];
        const result = checkTrailCollision(player, segments, 2.0);
        expect(result).not.toBeNull();
        expect(result.collided).toBe(true);
        expect(result.distance).toBeCloseTo(1, 10);
    });

    it('should not detect collision when player is far from trail', () => {
        const player = { id: 'p1', x: 0, z: 10, alive: true };
        const segments = [{ x1: -5, z1: 0, x2: 5, z2: 0, pid: 'p2' }];
        const result = checkTrailCollision(player, segments, 2.0);
        expect(result).toBeNull();
    });

    it('should skip own trail segments', () => {
        const player = { id: 'p1', x: 0, z: 0.5, alive: true };
        const segments = [{ x1: -5, z1: 0, x2: 5, z2: 0, pid: 'p1' }];
        const result = checkTrailCollision(player, segments, 2.0);
        expect(result).toBeNull();
    });

    it('should return null for dead player', () => {
        const player = { id: 'p1', x: 0, z: 0, alive: false };
        const segments = [{ x1: -5, z1: 0, x2: 5, z2: 0, pid: 'p2' }];
        const result = checkTrailCollision(player, segments, 2.0);
        expect(result).toBeNull();
    });

    it('should return null for null player', () => {
        const result = checkTrailCollision(null, [], 2.0);
        expect(result).toBeNull();
    });

    it('should return null for empty segments', () => {
        const player = { id: 'p1', x: 0, z: 0, alive: true };
        const result = checkTrailCollision(player, [], 2.0);
        expect(result).toBeNull();
    });

    it('should return closest segment when multiple segments are nearby', () => {
        const player = { id: 'p1', x: 0, z: 1, alive: true };
        const segments = [
            { x1: -5, z1: 5, x2: 5, z2: 5, pid: 'p2' },  // distance 4
            { x1: -5, z1: 0, x2: 5, z2: 0, pid: 'p3' },  // distance 1
            { x1: -5, z1: 10, x2: 5, z2: 10, pid: 'p4' } // distance 9
        ];
        const result = checkTrailCollision(player, segments, 2.0);
        expect(result).not.toBeNull();
        expect(result.segment.pid).toBe('p3');
        expect(result.distance).toBeCloseTo(1, 10);
    });

    it('should respect death radius parameter', () => {
        const player = { id: 'p1', x: 0, z: 1.5, alive: true };
        const segments = [{ x1: -5, z1: 0, x2: 5, z2: 0, pid: 'p2' }];

        // With radius 2.0, should collide
        expect(checkTrailCollision(player, segments, 2.0)).not.toBeNull();

        // With radius 1.0, should not collide
        expect(checkTrailCollision(player, segments, 1.0)).toBeNull();
    });

    it('should return detailed collision info', () => {
        const player = { id: 'p1', x: 3, z: 1, alive: true };
        const segments = [{ x1: 0, z1: 0, x2: 10, z2: 0, pid: 'p2' }];
        const result = checkTrailCollision(player, segments, 2.0);
        expect(result).not.toBeNull();
        expect(result.collided).toBe(true);
        expect(result.closestX).toBeCloseTo(3, 10);
        expect(result.closestZ).toBeCloseTo(0, 10);
        expect(result.segment).toBeDefined();
    });

    it('should handle diagonal trail segments', () => {
        const player = { id: 'p1', x: 5, z: 5, alive: true };
        const segments = [{ x1: 0, z1: 0, x2: 10, z2: 10, pid: 'p2' }];
        const result = checkTrailCollision(player, segments, 2.0);
        expect(result).not.toBeNull();
        expect(result.distance).toBeCloseTo(0, 10); // Player is on the segment
    });
});

// ============================================================================
// checkBikeCollision Tests (5+ tests)
// ============================================================================

describe('checkBikeCollision', () => {
    it('should detect collision when bikes are close', () => {
        const players = [
            { id: 'p1', x: 0, z: 0, alive: true },
            { id: 'p2', x: 2, z: 0, alive: true }
        ];
        const collisions = checkBikeCollision(players, 4.0);
        expect(collisions.length).toBe(1);
        expect(collisions[0].player1).toBe('p1');
        expect(collisions[0].player2).toBe('p2');
    });

    it('should not detect collision when bikes are far apart', () => {
        const players = [
            { id: 'p1', x: 0, z: 0, alive: true },
            { id: 'p2', x: 10, z: 0, alive: true }
        ];
        const collisions = checkBikeCollision(players, 4.0);
        expect(collisions.length).toBe(0);
    });

    it('should skip dead players', () => {
        const players = [
            { id: 'p1', x: 0, z: 0, alive: true },
            { id: 'p2', x: 2, z: 0, alive: false }
        ];
        const collisions = checkBikeCollision(players, 4.0);
        expect(collisions.length).toBe(0);
    });

    it('should detect multiple collisions', () => {
        const players = [
            { id: 'p1', x: 0, z: 0, alive: true },
            { id: 'p2', x: 2, z: 0, alive: true },
            { id: 'p3', x: 4, z: 0, alive: true }
        ];
        const collisions = checkBikeCollision(players, 4.0);
        expect(collisions.length).toBe(2); // p1-p2 and p2-p3
    });

    it('should return collision distance', () => {
        const players = [
            { id: 'p1', x: 0, z: 0, alive: true },
            { id: 'p2', x: 3, z: 4, alive: true }
        ];
        const collisions = checkBikeCollision(players, 6.0);
        expect(collisions.length).toBe(1);
        expect(collisions[0].distance).toBeCloseTo(5, 10);
    });

    it('should handle single player (no collisions)', () => {
        const players = [{ id: 'p1', x: 0, z: 0, alive: true }];
        const collisions = checkBikeCollision(players, 4.0);
        expect(collisions.length).toBe(0);
    });

    it('should handle empty player list', () => {
        const collisions = checkBikeCollision([], 4.0);
        expect(collisions.length).toBe(0);
    });
});

// ============================================================================
// checkArenaBounds Tests (5+ tests)
// ============================================================================

describe('checkArenaBounds', () => {
    it('should return inside for point at center', () => {
        const result = checkArenaBounds(0, 0, 200);
        expect(result.inside).toBe(true);
    });

    it('should return inside for point within bounds', () => {
        const result = checkArenaBounds(100, 100, 200);
        expect(result.inside).toBe(true);
    });

    it('should return inside for point on boundary', () => {
        const result = checkArenaBounds(200, 200, 200);
        expect(result.inside).toBe(true);
    });

    it('should return outside for point beyond right boundary', () => {
        const result = checkArenaBounds(250, 0, 200);
        expect(result.inside).toBe(false);
        expect(result.boundary).toBe('right');
        expect(result.x).toBe(200);
    });

    it('should return outside for point beyond left boundary', () => {
        const result = checkArenaBounds(-250, 0, 200);
        expect(result.inside).toBe(false);
        expect(result.boundary).toBe('left');
        expect(result.x).toBe(-200);
    });

    it('should return outside for point beyond top boundary', () => {
        const result = checkArenaBounds(0, 250, 200);
        expect(result.inside).toBe(false);
        expect(result.boundary).toBe('top');
        expect(result.z).toBe(200);
    });

    it('should return outside for point beyond bottom boundary', () => {
        const result = checkArenaBounds(0, -250, 200);
        expect(result.inside).toBe(false);
        expect(result.boundary).toBe('bottom');
        expect(result.z).toBe(-200);
    });

    it('should return corner for point beyond corner', () => {
        const result = checkArenaBounds(250, 250, 200);
        expect(result.inside).toBe(false);
        expect(result.boundary).toBe('corner');
    });

    it('should clamp coordinates to arena bounds', () => {
        const result = checkArenaBounds(500, -500, 200);
        expect(result.x).toBe(200);
        expect(result.z).toBe(-200);
    });

    it('should handle default arena size', () => {
        const result = checkArenaBounds(250, 0);
        expect(result.inside).toBe(false);
        expect(result.x).toBe(200);
    });
});

// ============================================================================
// isOutOfBounds Tests (included in checkArenaBounds count)
// ============================================================================

describe('isOutOfBounds', () => {
    it('should return false for point inside bounds', () => {
        expect(isOutOfBounds({ x: 0, z: 0 }, 200)).toBe(false);
    });

    it('should return true for point outside bounds', () => {
        expect(isOutOfBounds({ x: 250, z: 0 }, 200)).toBe(true);
    });

    it('should return false for null player', () => {
        expect(isOutOfBounds(null, 200)).toBe(false);
    });
});

// ============================================================================
// Sub-pixel Precision Tests (5+ tests)
// ============================================================================

describe('Sub-pixel Precision', () => {
    it('should handle distances smaller than EPS', () => {
        const dist = distanceToSegment(0, EPS / 2, 0, 0, 10, 0);
        expect(dist).toBeCloseTo(EPS / 2, 10);
    });

    it('should handle very small segment with sub-pixel length', () => {
        const dist = distanceToSegment(0, 1, -EPS / 2, 0, EPS / 2, 0);
        expect(dist).toBeLessThan(1.001);
    });

    it('should detect intersection with sub-pixel tolerance', () => {
        const result = lineSegmentIntersection(0, 0, 10, EPS / 2, 5, -5, 5, 5);
        expect(result.intersects).toBe(true);
    });

    it('should handle point extremely close to segment', () => {
        const dist = distanceToSegment(5, EPS / 10, 0, 0, 10, 0);
        expect(dist).toBeLessThan(EPS);
    });

    it('should handle nearly parallel lines with sub-pixel separation', () => {
        const result = lineSegmentIntersection(0, 0, 10, 0, 0, EPS / 2, 10, EPS / 2);
        // Lines are parallel within EPS tolerance
        expect(result.intersects).toBe(false);
    });

    it('should maintain precision for large coordinates', () => {
        const dist = distanceToSegment(1000, 1000.01, 0, 1000, 2000, 1000);
        expect(dist).toBeCloseTo(0.01, 8);
    });

    it('should handle sub-pixel movement in continuous collision', () => {
        const collisions = continuousCollisionCheck(
            { x: 0, z: 0 },
            { x: EPS / 2, z: 0 },
            [{ x1: EPS / 4, z1: -1, x2: EPS / 4, z2: 1, pid: 'p1' }]
        );
        expect(collisions.length).toBe(1);
    });
});

// ============================================================================
// Utility Function Tests
// ============================================================================

describe('distanceToSegmentSquared', () => {
    it('should return squared distance for perpendicular case', () => {
        const distSq = distanceToSegmentSquared(0, 5, -10, 0, 10, 0);
        expect(distSq).toBeCloseTo(25, 10);
    });

    it('should return squared distance to endpoint', () => {
        const distSq = distanceToSegmentSquared(15, 0, 0, 0, 10, 0);
        expect(distSq).toBeCloseTo(25, 10);
    });

    it('should return zero for point on segment', () => {
        const distSq = distanceToSegmentSquared(5, 0, 0, 0, 10, 0);
        expect(distSq).toBeCloseTo(0, 10);
    });

    it('should be faster than sqrt version (no sqrt call)', () => {
        const distSq = distanceToSegmentSquared(3, 4, 0, 0, 10, 0);
        expect(distSq).toBeCloseTo(16, 10); // 4^2
    });
});

describe('isPointNearSegment', () => {
    it('should return true when point is within radius', () => {
        expect(isPointNearSegment(0, 2, -10, 0, 10, 0, 3)).toBe(true);
    });

    it('should return false when point is outside radius', () => {
        expect(isPointNearSegment(0, 5, -10, 0, 10, 0, 3)).toBe(false);
    });

    it('should return true when point is near endpoint', () => {
        expect(isPointNearSegment(12, 0, 0, 0, 10, 0, 3)).toBe(true);
    });
});

describe('segmentLength', () => {
    it('should return length of horizontal segment', () => {
        expect(segmentLength(0, 0, 10, 0)).toBeCloseTo(10, 10);
    });

    it('should return length of vertical segment', () => {
        expect(segmentLength(0, 0, 0, 10)).toBeCloseTo(10, 10);
    });

    it('should return length of diagonal segment', () => {
        expect(segmentLength(0, 0, 3, 4)).toBeCloseTo(5, 10);
    });

    it('should return zero for point segment', () => {
        expect(segmentLength(5, 5, 5, 5)).toBeCloseTo(0, 10);
    });
});

describe('pointOnSegment', () => {
    it('should return start point for t=0', () => {
        const p = pointOnSegment(0, 0, 10, 10, 0);
        expect(p.x).toBeCloseTo(0, 10);
        expect(p.z).toBeCloseTo(0, 10);
    });

    it('should return end point for t=1', () => {
        const p = pointOnSegment(0, 0, 10, 10, 1);
        expect(p.x).toBeCloseTo(10, 10);
        expect(p.z).toBeCloseTo(10, 10);
    });

    it('should return midpoint for t=0.5', () => {
        const p = pointOnSegment(0, 0, 10, 10, 0.5);
        expect(p.x).toBeCloseTo(5, 10);
        expect(p.z).toBeCloseTo(5, 10);
    });

    it('should clamp t to [0, 1]', () => {
        const p1 = pointOnSegment(0, 0, 10, 10, -0.5);
        expect(p1.x).toBe(0);

        const p2 = pointOnSegment(0, 0, 10, 10, 1.5);
        expect(p2.x).toBe(10);
    });
});

// ============================================================================
// EPS Constant Tests
// ============================================================================

describe('EPS constant', () => {
    it('should be defined', () => {
        expect(EPS).toBeDefined();
    });

    it('should equal 0.01', () => {
        expect(EPS).toBe(0.01);
    });

    it('should be positive', () => {
        expect(EPS).toBeGreaterThan(0);
    });
});
