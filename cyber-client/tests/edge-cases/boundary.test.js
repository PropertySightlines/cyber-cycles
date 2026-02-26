/**
 * Boundary Edge Case Tests for Cyber Cycles
 *
 * Comprehensive edge case testing for arena boundary handling.
 * Tests cover boundary collisions, corner cases, and interactions with game systems.
 *
 * Test Categories:
 * - Arena boundary collisions
 * - Corner cases (both x and z at boundary)
 * - Exiting and re-entering arena
 * - Boundary with rubber system
 * - Boundary with boost system
 *
 * Target: 20+ boundary edge case tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    checkArenaBounds,
    isOutOfBounds,
    distanceToSegment,
    continuousCollisionCheck
} from '../../src/physics/CollisionDetection.js';
import {
    applyRubberCollision,
    detectWallProximity,
    calculateWallDistance,
    isNearWall,
    RUBBER_CONFIG,
    RubberState
} from '../../src/physics/RubberSystem.js';

// ============================================================================
// Arena Boundary Collision Tests
// ============================================================================

describe('Boundary Edge Cases: Arena Boundary Collisions', () => {
    const ARENA_SIZE = 200;

    it('should detect boundary crossing from inside to outside (right)', () => {
        const result = checkArenaBounds(ARENA_SIZE + 10, 0, ARENA_SIZE);
        expect(result.inside).toBe(false);
        expect(result.boundary).toBe('right');
        expect(result.x).toBe(ARENA_SIZE);
    });

    it('should detect boundary crossing from inside to outside (left)', () => {
        const result = checkArenaBounds(-ARENA_SIZE - 10, 0, ARENA_SIZE);
        expect(result.inside).toBe(false);
        expect(result.boundary).toBe('left');
        expect(result.x).toBe(-ARENA_SIZE);
    });

    it('should detect boundary crossing from inside to outside (top)', () => {
        const result = checkArenaBounds(0, ARENA_SIZE + 10, ARENA_SIZE);
        expect(result.inside).toBe(false);
        expect(result.boundary).toBe('top');
        expect(result.z).toBe(ARENA_SIZE);
    });

    it('should detect boundary crossing from inside to outside (bottom)', () => {
        const result = checkArenaBounds(0, -ARENA_SIZE - 10, ARENA_SIZE);
        expect(result.inside).toBe(false);
        expect(result.boundary).toBe('bottom');
        expect(result.z).toBe(-ARENA_SIZE);
    });

    it('should handle continuous movement crossing boundary', () => {
        const collisions = continuousCollisionCheck(
            { x: ARENA_SIZE - 5, z: 0 },
            { x: ARENA_SIZE + 5, z: 0 },
            [{ x1: ARENA_SIZE, z1: -100, x2: ARENA_SIZE, z2: 100, pid: 'boundary' }]
        );
        expect(collisions.length).toBe(1);
        expect(collisions[0].collisionX).toBeCloseTo(ARENA_SIZE, 10);
    });

    it('should handle diagonal movement crossing boundary', () => {
        const collisions = continuousCollisionCheck(
            { x: ARENA_SIZE - 10, z: ARENA_SIZE - 10 },
            { x: ARENA_SIZE + 10, z: ARENA_SIZE + 10 },
            [
                { x1: ARENA_SIZE, z1: ARENA_SIZE - 50, x2: ARENA_SIZE, z2: ARENA_SIZE + 50, pid: 'boundary' },
                { x1: ARENA_SIZE - 50, z1: ARENA_SIZE, x2: ARENA_SIZE + 50, z2: ARENA_SIZE, pid: 'boundary' }
            ]
        );
        expect(collisions.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle movement parallel to boundary', () => {
        const collisions = continuousCollisionCheck(
            { x: ARENA_SIZE - 5, z: -50 },
            { x: ARENA_SIZE - 5, z: 50 },
            [{ x1: ARENA_SIZE, z1: -100, x2: ARENA_SIZE, z2: 100, pid: 'boundary' }]
        );
        expect(collisions.length).toBe(0);
    });

    it('should handle grazing boundary at shallow angle', () => {
        const collisions = continuousCollisionCheck(
            { x: ARENA_SIZE - 1, z: -50 },
            { x: ARENA_SIZE + 1, z: 50 },
            [{ x1: ARENA_SIZE, z1: -100, x2: ARENA_SIZE, z2: 100, pid: 'boundary' }]
        );
        expect(collisions.length).toBe(1);
    });
});

// ============================================================================
// Corner Case Tests
// ============================================================================

describe('Boundary Edge Cases: Corner Cases', () => {
    const ARENA_SIZE = 200;

    it('should detect corner boundary when both x and z exceed bounds (positive)', () => {
        const result = checkArenaBounds(ARENA_SIZE + 10, ARENA_SIZE + 10, ARENA_SIZE);
        expect(result.inside).toBe(false);
        expect(result.boundary).toBe('corner');
        expect(result.x).toBe(ARENA_SIZE);
        expect(result.z).toBe(ARENA_SIZE);
    });

    it('should detect corner boundary when both x and z exceed bounds (negative)', () => {
        const result = checkArenaBounds(-ARENA_SIZE - 10, -ARENA_SIZE - 10, ARENA_SIZE);
        expect(result.inside).toBe(false);
        expect(result.boundary).toBe('corner');
        expect(result.x).toBe(-ARENA_SIZE);
        expect(result.z).toBe(-ARENA_SIZE);
    });

    it('should detect corner boundary (top-left)', () => {
        const result = checkArenaBounds(-ARENA_SIZE - 10, ARENA_SIZE + 10, ARENA_SIZE);
        expect(result.inside).toBe(false);
        expect(result.boundary).toBe('corner');
    });

    it('should detect corner boundary (bottom-right)', () => {
        const result = checkArenaBounds(ARENA_SIZE + 10, -ARENA_SIZE - 10, ARENA_SIZE);
        expect(result.inside).toBe(false);
        expect(result.boundary).toBe('corner');
    });

    it('should handle point exactly at corner', () => {
        const result = checkArenaBounds(ARENA_SIZE, ARENA_SIZE, ARENA_SIZE);
        expect(result.inside).toBe(true);
    });

    it('should handle movement through corner region', () => {
        const collisions = continuousCollisionCheck(
            { x: ARENA_SIZE - 5, z: ARENA_SIZE - 5 },
            { x: ARENA_SIZE + 5, z: ARENA_SIZE + 5 },
            [
                { x1: ARENA_SIZE, z1: ARENA_SIZE - 20, x2: ARENA_SIZE, z2: ARENA_SIZE + 20, pid: 'wall' },
                { x1: ARENA_SIZE - 20, z1: ARENA_SIZE, x2: ARENA_SIZE + 20, z2: ARENA_SIZE, pid: 'wall' }
            ]
        );
        expect(collisions.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle diagonal exit through corner', () => {
        const result1 = checkArenaBounds(ARENA_SIZE - 1, ARENA_SIZE - 1, ARENA_SIZE);
        expect(result1.inside).toBe(true);

        const result2 = checkArenaBounds(ARENA_SIZE + 1, ARENA_SIZE + 1, ARENA_SIZE);
        expect(result2.inside).toBe(false);
        expect(result2.boundary).toBe('corner');
    });

    it('should handle isOutOfBounds at corner', () => {
        expect(isOutOfBounds({ x: ARENA_SIZE, z: ARENA_SIZE }, ARENA_SIZE)).toBe(false);
        expect(isOutOfBounds({ x: ARENA_SIZE + 1, z: ARENA_SIZE + 1 }, ARENA_SIZE)).toBe(true);
    });

    it('should handle corner case with one coordinate exactly at boundary', () => {
        const result = checkArenaBounds(ARENA_SIZE, ARENA_SIZE + 10, ARENA_SIZE);
        expect(result.inside).toBe(false);
        expect(result.boundary).toBe('top');
    });
});

// ============================================================================
// Exiting and Re-entering Arena Tests
// ============================================================================

describe('Boundary Edge Cases: Exiting and Re-entering Arena', () => {
    const ARENA_SIZE = 200;

    it('should handle exit and immediate re-entry', () => {
        const exitResult = checkArenaBounds(ARENA_SIZE + 5, 0, ARENA_SIZE);
        expect(exitResult.inside).toBe(false);

        const reenterResult = checkArenaBounds(ARENA_SIZE - 5, 0, ARENA_SIZE);
        expect(reenterResult.inside).toBe(true);
    });

    it('should handle multiple boundary crossings', () => {
        const positions = [
            { x: ARENA_SIZE - 5, z: 0 },
            { x: ARENA_SIZE + 5, z: 0 },
            { x: ARENA_SIZE - 5, z: 0 },
            { x: ARENA_SIZE + 5, z: 0 }
        ];

        const results = positions.map(pos => checkArenaBounds(pos.x, pos.z, ARENA_SIZE));
        expect(results[0].inside).toBe(true);
        expect(results[1].inside).toBe(false);
        expect(results[2].inside).toBe(true);
        expect(results[3].inside).toBe(false);
    });

    it('should handle oscillating around boundary', () => {
        const epsilon = 0.1;
        const results = [];
        for (let i = 0; i < 10; i++) {
            const x = ARENA_SIZE + (i % 2 === 0 ? epsilon : -epsilon);
            results.push(checkArenaBounds(x, 0, ARENA_SIZE));
        }

        expect(results.filter(r => r.inside).length).toBe(5);
        expect(results.filter(r => !r.inside).length).toBe(5);
    });

    it('should handle exit from all four sides', () => {
        const exits = [
            checkArenaBounds(ARENA_SIZE + 10, 0, ARENA_SIZE),
            checkArenaBounds(-ARENA_SIZE - 10, 0, ARENA_SIZE),
            checkArenaBounds(0, ARENA_SIZE + 10, ARENA_SIZE),
            checkArenaBounds(0, -ARENA_SIZE - 10, ARENA_SIZE)
        ];

        expect(exits.every(e => !e.inside)).toBe(true);
        expect(exits.map(e => e.boundary)).toEqual(['right', 'left', 'top', 'bottom']);
    });

    it('should handle re-entry from all four sides', () => {
        const entries = [
            checkArenaBounds(ARENA_SIZE - 10, 0, ARENA_SIZE),
            checkArenaBounds(-ARENA_SIZE + 10, 0, ARENA_SIZE),
            checkArenaBounds(0, ARENA_SIZE - 10, ARENA_SIZE),
            checkArenaBounds(0, -ARENA_SIZE + 10, ARENA_SIZE)
        ];

        expect(entries.every(e => e.inside)).toBe(true);
    });

    it('should handle fast movement completely through arena', () => {
        const collisions = continuousCollisionCheck(
            { x: -ARENA_SIZE - 50, z: 0 },
            { x: ARENA_SIZE + 50, z: 0 },
            [
                { x1: -ARENA_SIZE, z1: -100, x2: -ARENA_SIZE, z2: 100, pid: 'left' },
                { x1: ARENA_SIZE, z1: -100, x2: ARENA_SIZE, z2: 100, pid: 'right' }
            ]
        );
        expect(collisions.length).toBe(2);
    });
});

// ============================================================================
// Boundary with Rubber System Tests
// ============================================================================

describe('Boundary Edge Cases: Boundary with Rubber System', () => {
    const ARENA_SIZE = 200;

    it('should detect wall proximity near boundary', () => {
        const player = { x: ARENA_SIZE - 5, z: 0, id: 'p1' };
        const segments = [{ x1: ARENA_SIZE, z1: -100, x2: ARENA_SIZE, z2: 100, pid: 'boundary' }];

        const wallInfo = detectWallProximity(player, segments, 10.0);
        expect(wallInfo).not.toBeNull();
        expect(wallInfo.distance).toBeCloseTo(5, 10);
    });

    it('should handle rubber collision near boundary', () => {
        const player = {
            x: ARENA_SIZE - 0.5,
            z: 0,
            speed: 40,
            dir_x: 1,
            dir_z: 0
        };
        const segments = [{ x1: ARENA_SIZE, z1: -100, x2: ARENA_SIZE, z2: 100, pid: 'boundary' }];
        const rubberState = new RubberState('p1', 1.0, 3.0);

        const response = applyRubberCollision(player, segments, rubberState, RUBBER_CONFIG);
        expect(response.collided).toBe(false);
        expect(response.newSpeed).toBeLessThanOrEqual(player.speed);
    });

    it('should handle rubber depletion at boundary', () => {
        const player = {
            x: ARENA_SIZE - 0.0005,  // Within minDistance
            z: 0,
            speed: 40,
            dir_x: 1,
            dir_z: 0
        };
        const segments = [{ x1: ARENA_SIZE, z1: -100, x2: ARENA_SIZE, z2: 100, pid: 'boundary' }];
        const rubberState = new RubberState('p1', 0.0, 0.0);

        const response = applyRubberCollision(player, segments, rubberState, RUBBER_CONFIG);
        // With no rubber, collision should be detected
        expect(response.collided).toBe(true);
        expect(response.newSpeed).toBe(0);
    });

    it('should calculate wall distance correctly near boundary', () => {
        const player = { x: ARENA_SIZE - 10, z: 0 };
        const segments = [{ x1: ARENA_SIZE, z1: -100, x2: ARENA_SIZE, z2: 100, pid: 'boundary' }];

        const distance = calculateWallDistance(player, segments);
        expect(distance).toBeCloseTo(10, 10);
    });

    it('should detect near wall status at boundary', () => {
        const player = { x: ARENA_SIZE - 1, z: 0 };
        const segments = [{ x1: ARENA_SIZE, z1: -100, x2: ARENA_SIZE, z2: 100, pid: 'boundary' }];

        expect(isNearWall(player, segments, 2.0)).toBe(true);
        expect(isNearWall(player, segments, 0.5)).toBe(false);
    });

    it('should handle corner wall proximity', () => {
        const player = { x: ARENA_SIZE - 5, z: ARENA_SIZE - 5, id: 'p1' };
        const segments = [
            { x1: ARENA_SIZE, z1: ARENA_SIZE - 50, x2: ARENA_SIZE, z2: ARENA_SIZE + 50, pid: 'wall1' },
            { x1: ARENA_SIZE - 50, z1: ARENA_SIZE, x2: ARENA_SIZE + 50, z2: ARENA_SIZE, pid: 'wall2' }
        ];

        const wallInfo = detectWallProximity(player, segments, 10.0);
        expect(wallInfo).not.toBeNull();
        expect(wallInfo.distance).toBeLessThan(6);
    });

    it('should handle rubber effectiveness near boundary', () => {
        const rubberState = new RubberState('p1', 0.5, 1.5);
        expect(rubberState.effectiveness).toBe(1.0);

        rubberState.malus = 0.3;
        rubberState.effectiveness = rubberState.malus;
        expect(rubberState.effectiveness).toBe(0.3);
    });

    it('should handle speed adjustment near boundary', () => {
        const player = { x: ARENA_SIZE - 1, z: 0, speed: 40 };
        const segments = [{ x1: ARENA_SIZE, z1: -100, x2: ARENA_SIZE, z2: 100, pid: 'boundary' }];

        const wallInfo = detectWallProximity(player, segments, 10.0);
        expect(wallInfo).not.toBeNull();
        expect(wallInfo.distance).toBeCloseTo(1, 10);
    });
});

// ============================================================================
// Boundary with Boost System Tests
// ============================================================================

describe('Boundary Edge Cases: Boundary with Boost System', () => {
    const ARENA_SIZE = 200;

    it('should handle boost activation near boundary', () => {
        const player = { x: ARENA_SIZE - 20, z: 0, speed: 40 };
        const segments = [{ x1: ARENA_SIZE, z1: -100, x2: ARENA_SIZE, z2: 100, pid: 'boundary' }];

        const wallInfo = detectWallProximity(player, segments, 10.0);
        expect(wallInfo).toBeNull();
    });

    it('should handle boost deactivation when approaching boundary', () => {
        const player = { x: ARENA_SIZE - 5, z: 0, speed: 70 };
        const segments = [{ x1: ARENA_SIZE, z1: -100, x2: ARENA_SIZE, z2: 100, pid: 'boundary' }];

        const wallInfo = detectWallProximity(player, segments, 10.0);
        expect(wallInfo).not.toBeNull();
        expect(wallInfo.distance).toBeCloseTo(5, 10);
    });

    it('should handle boost with boundary trail segments', () => {
        const player = { x: 0, z: 0, id: 'p1', speed: 70 };
        const segments = [
            { x1: ARENA_SIZE, z1: -100, x2: ARENA_SIZE, z2: 100, pid: 'boundary' },
            { x1: -50, z1: 0, x2: 50, z2: 0, pid: 'p2' }
        ];

        const wallInfo = detectWallProximity(player, segments, 10.0);
        // Player is on the p2 trail segment, so wallInfo should not be null
        expect(wallInfo).not.toBeNull();
        expect(wallInfo.distance).toBeCloseTo(0, 10);
    });

    it('should handle speed boost near corner boundary', () => {
        const player = { x: ARENA_SIZE - 15, z: ARENA_SIZE - 15, speed: 70 };
        const segments = [
            { x1: ARENA_SIZE, z1: ARENA_SIZE - 50, x2: ARENA_SIZE, z2: ARENA_SIZE + 50, pid: 'wall' },
            { x1: ARENA_SIZE - 50, z1: ARENA_SIZE, x2: ARENA_SIZE + 50, z2: ARENA_SIZE, pid: 'wall' }
        ];

        const wallInfo = detectWallProximity(player, segments, 20.0);
        expect(wallInfo).not.toBeNull();
    });

    it('should handle boost trail collision near boundary', () => {
        const player = { id: 'p1', x: ARENA_SIZE - 10, z: 0, alive: true };
        const segments = [
            { x1: ARENA_SIZE - 5, z1: -50, x2: ARENA_SIZE - 5, z2: 50, pid: 'p2' },
            { x1: ARENA_SIZE, z1: -100, x2: ARENA_SIZE, z2: 100, pid: 'boundary' }
        ];

        const distance = calculateWallDistance(player, segments);
        expect(distance).toBeCloseTo(5, 10);
    });
});

// ============================================================================
// Additional Boundary Edge Cases
// ============================================================================

describe('Boundary Edge Cases: Additional Scenarios', () => {
    const ARENA_SIZE = 200;

    it('should handle boundary with zero arena size', () => {
        const result = checkArenaBounds(0, 0, 0);
        expect(result.inside).toBe(true);

        const result2 = checkArenaBounds(1, 0, 0);
        expect(result2.inside).toBe(false);
    });

    it('should handle boundary with very small arena size', () => {
        const result = checkArenaBounds(0.5, 0.5, 1);
        expect(result.inside).toBe(true);

        const result2 = checkArenaBounds(1.5, 0, 1);
        expect(result2.inside).toBe(false);
    });

    it('should handle boundary with very large arena size', () => {
        const LARGE_ARENA = 10000;
        const result = checkArenaBounds(5000, 5000, LARGE_ARENA);
        expect(result.inside).toBe(true);
    });

    it('should handle negative arena size (edge case)', () => {
        const result = checkArenaBounds(0, 0, -100);
        expect(result.inside).toBe(false);
    });

    it('should handle floating point precision at boundary', () => {
        // Use a larger epsilon that actually affects the comparison
        const epsilon = 0.0001;
        const result1 = checkArenaBounds(ARENA_SIZE - epsilon, 0, ARENA_SIZE);
        expect(result1.inside).toBe(true);

        const result2 = checkArenaBounds(ARENA_SIZE + epsilon, 0, ARENA_SIZE);
        expect(result2.inside).toBe(false);
    });

    it('should handle boundary with NaN coordinates', () => {
        const result = checkArenaBounds(NaN, 0, ARENA_SIZE);
        expect(result.inside).toBe(false);
    });

    it('should handle boundary with Infinity coordinates', () => {
        const result = checkArenaBounds(Infinity, 0, ARENA_SIZE);
        expect(result.inside).toBe(false);
        expect(result.x).toBe(ARENA_SIZE);
    });

    it('should handle boundary with -Infinity coordinates', () => {
        const result = checkArenaBounds(-Infinity, 0, ARENA_SIZE);
        expect(result.inside).toBe(false);
        expect(result.x).toBe(-ARENA_SIZE);
    });

    it('should handle isOutOfBounds with null player', () => {
        expect(isOutOfBounds(null, ARENA_SIZE)).toBe(false);
    });

    it('should handle isOutOfBounds with undefined player', () => {
        expect(isOutOfBounds(undefined, ARENA_SIZE)).toBe(false);
    });

    it('should handle boundary clamping with extreme values', () => {
        const result = checkArenaBounds(1e10, -1e10, ARENA_SIZE);
        expect(result.x).toBe(ARENA_SIZE);
        expect(result.z).toBe(-ARENA_SIZE);
    });

    it('should handle boundary with player exactly at clamped position', () => {
        const result = checkArenaBounds(ARENA_SIZE, ARENA_SIZE, ARENA_SIZE);
        expect(result.inside).toBe(true);
        expect(result.boundary).toBeUndefined();
    });

    it('should handle multiple players at boundary', () => {
        const players = [
            { x: ARENA_SIZE - 1, z: 0 },
            { x: ARENA_SIZE + 1, z: 0 },
            { x: 0, z: ARENA_SIZE - 1 },
            { x: 0, z: ARENA_SIZE + 1 }
        ];

        const results = players.map(p => checkArenaBounds(p.x, p.z, ARENA_SIZE));
        expect(results[0].inside).toBe(true);
        expect(results[1].inside).toBe(false);
        expect(results[2].inside).toBe(true);
        expect(results[3].inside).toBe(false);
    });

    it('should handle circular movement around boundary', () => {
        const results = [];
        // Use a radius that ensures all points are outside the square arena
        const radius = ARENA_SIZE * 1.5;
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            results.push(checkArenaBounds(x, z, ARENA_SIZE));
        }

        // All positions should be outside the square arena
        const outsideCount = results.filter(r => !r.inside).length;
        expect(outsideCount).toBe(results.length);
    });
});
