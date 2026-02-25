/**
 * Rubber System Tests for Cyber Cycles
 *
 * Comprehensive test suite for the RubberSystem module.
 * Tests cover:
 * - RubberState class (10 tests)
 * - Exponential decay (8 tests)
 * - Malus system (10 tests)
 * - Wall proximity detection (10 tests)
 * - Speed adjustment (8 tests)
 * - Rubber consumption/regeneration (8 tests)
 * - Server validation (6 tests)
 * - Integration tests (10 tests)
 *
 * Target: 70+ tests total
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
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
} from '../../src/physics/RubberSystem.js';

// ============================================================================
// RubberState Class Tests (10 tests)
// ============================================================================

describe('RubberState Class', () => {
    // Constructor tests
    it('should create RubberState with default values', () => {
        const state = new RubberState('player1');
        expect(state.playerId).toBe('player1');
        expect(state.rubber).toBe(1.0);
        expect(state.maxRubber).toBe(1.0);
        expect(state.serverRubber).toBe(3.0);
        expect(state.malus).toBe(1.0);
        expect(state.malusTimer).toBe(0);
        expect(state.effectiveness).toBe(1.0);
    });

    it('should create RubberState with custom baseRubber', () => {
        const state = new RubberState('player2', 2.0, 5.0);
        expect(state.rubber).toBe(2.0);
        expect(state.maxRubber).toBe(2.0);
        expect(state.serverRubber).toBe(5.0);
    });

    it('should create RubberState with zero baseRubber', () => {
        const state = new RubberState('player3', 0, 0);
        expect(state.rubber).toBe(0);
        expect(state.maxRubber).toBe(0);
    });

    // Reset tests
    it('should reset rubber to maxRubber', () => {
        const state = new RubberState('player1', 1.0);
        state.rubber = 0.5;
        state.malus = 0.3;
        state.malusTimer = 0.5;
        state.reset();
        expect(state.rubber).toBe(1.0);
        expect(state.malus).toBe(1.0);
        expect(state.malusTimer).toBe(0);
    });

    it('should reset rubber with new base value', () => {
        const state = new RubberState('player1', 1.0);
        state.reset(2.5);
        expect(state.rubber).toBe(2.5);
        expect(state.maxRubber).toBe(2.5);
    });

    // Clone tests
    it('should clone RubberState with all properties', () => {
        const original = new RubberState('player1', 1.5, 4.0);
        original.rubber = 1.2;
        original.malus = 0.5;
        original.malusTimer = 0.3;
        original.effectiveness = 0.6;

        const clone = original.clone();
        expect(clone.playerId).toBe('player1');
        expect(clone.rubber).toBe(1.2);
        expect(clone.maxRubber).toBe(1.5);
        expect(clone.serverRubber).toBe(4.0);
        expect(clone.malus).toBe(0.5);
        expect(clone.malusTimer).toBe(0.3);
        expect(clone.effectiveness).toBe(0.6);
    });

    it('should create independent clone', () => {
        const original = new RubberState('player1');
        const clone = original.clone();
        clone.rubber = 0.5;
        expect(original.rubber).toBe(1.0);
        expect(clone.rubber).toBe(0.5);
    });

    // toJSON tests
    it('should serialize to JSON', () => {
        const state = new RubberState('player1', 1.5, 3.5);
        state.rubber = 1.0;
        state.malus = 0.7;
        state.malusTimer = 0.2;

        const json = state.toJSON();
        expect(json.playerId).toBe('player1');
        expect(json.rubber).toBe(1.0);
        expect(json.maxRubber).toBe(1.5);
        expect(json.serverRubber).toBe(3.5);
        expect(json.malus).toBe(0.7);
        expect(json.malusTimer).toBe(0.2);
    });

    // fromJSON tests
    it('should deserialize from JSON', () => {
        const json = {
            playerId: 'player2',
            rubber: 0.8,
            maxRubber: 1.5,
            serverRubber: 4.0,
            malus: 0.5,
            malusTimer: 0.3,
            effectiveness: 0.4
        };
        const state = RubberState.fromJSON(json);
        expect(state.playerId).toBe('player2');
        expect(state.rubber).toBe(0.8);
        expect(state.maxRubber).toBe(1.5);
        expect(state.serverRubber).toBe(4.0);
        expect(state.malus).toBe(0.5);
        expect(state.malusTimer).toBe(0.3);
    });

    it('should handle edge case with zero values in fromJSON', () => {
        const json = {
            playerId: 'player3',
            rubber: 0,
            maxRubber: 0,
            serverRubber: 0,
            malus: 0,
            malusTimer: 0,
            effectiveness: 0
        };
        const state = RubberState.fromJSON(json);
        expect(state.rubber).toBe(0);
        expect(state.malus).toBe(0);
    });
});

// ============================================================================
// Exponential Decay Tests (8 tests)
// ============================================================================

describe('updateRubber - Exponential Decay', () => {
    it('should apply exponential decay formula correctly', () => {
        const state = new RubberState('player1', 1.0);
        const dt = 0.016; // ~60fps
        const decay = updateRubber(state, dt, RUBBER_CONFIG, true);

        // factor = 1 - exp(-dt * rubberSpeed) = 1 - exp(-0.016 * 40) = 1 - exp(-0.64) ≈ 0.472
        const expectedFactor = 1 - Math.exp(-dt * RUBBER_CONFIG.rubberSpeed);
        expect(decay).toBeCloseTo(1.0 * expectedFactor, 4);
    });

    it('should decay more with larger dt', () => {
        const state1 = new RubberState('player1', 1.0);
        const state2 = new RubberState('player2', 1.0);

        const decay1 = updateRubber(state1, 0.016, RUBBER_CONFIG, true);
        const decay2 = updateRubber(state2, 0.1, RUBBER_CONFIG, true);

        expect(decay2).toBeGreaterThan(decay1);
    });

    it('should decay less when not near wall', () => {
        const state1 = new RubberState('player1', 1.0);
        const state2 = new RubberState('player2', 1.0);

        const decay1 = updateRubber(state1, 0.016, RUBBER_CONFIG, true);
        const decay2 = updateRubber(state2, 0.016, RUBBER_CONFIG, false);

        expect(decay2).toBeLessThan(decay1);
    });

    it('should not decay below zero', () => {
        const state = new RubberState('player1', 0.1);
        updateRubber(state, 1.0, RUBBER_CONFIG, true); // Large dt
        expect(state.rubber).toBeGreaterThanOrEqual(0);
    });

    it('should return 0 decay for zero dt', () => {
        const state = new RubberState('player1', 1.0);
        const decay = updateRubber(state, 0, RUBBER_CONFIG, true);
        expect(decay).toBe(0);
    });

    it('should return 0 decay for negative dt', () => {
        const state = new RubberState('player1', 1.0);
        const decay = updateRubber(state, -0.016, RUBBER_CONFIG, true);
        expect(decay).toBe(0);
    });

    it('should return 0 decay for null state', () => {
        const decay = updateRubber(null, 0.016, RUBBER_CONFIG, true);
        expect(decay).toBe(0);
    });

    it('should update effectiveness based on decay', () => {
        const state = new RubberState('player1', 1.0);
        updateRubber(state, 0.016, RUBBER_CONFIG, true);
        expect(state.effectiveness).toBeLessThan(1.0);
        expect(state.effectiveness).toBeGreaterThan(0);
    });
});

// ============================================================================
// Malus System Tests (10 tests)
// ============================================================================

describe('applyMalus - Malus System', () => {
    it('should apply malus factor correctly', () => {
        const state = new RubberState('player1', 1.0);
        applyMalus(state, 0.5, 0.3);
        expect(state.malus).toBe(0.3);
        expect(state.malusTimer).toBe(0.5);
    });

    it('should clamp malus factor to valid range', () => {
        const state1 = new RubberState('player1', 1.0);
        applyMalus(state1, 0.5, 1.5); // > 1
        expect(state1.malus).toBe(1.0);

        const state2 = new RubberState('player2', 1.0);
        applyMalus(state2, 0.5, -0.5); // < 0
        expect(state2.malus).toBe(0);
    });

    it('should clamp malus duration to valid range', () => {
        const state = new RubberState('player1', 1.0);
        applyMalus(state, -0.5, 0.3);
        expect(state.malusTimer).toBe(0);
    });

    it('should set effectiveness to malus value', () => {
        const state = new RubberState('player1', 1.0);
        applyMalus(state, 0.5, 0.3);
        expect(state.effectiveness).toBe(0.3);
    });

    it('should return state for chaining', () => {
        const state = new RubberState('player1', 1.0);
        const result = applyMalus(state, 0.5, 0.3);
        expect(result).toBe(state);
    });

    it('should handle null state gracefully', () => {
        const result = applyMalus(null, 0.5, 0.3);
        expect(result).toBeNull();
    });

    it('should decay malus timer in updateRubber', () => {
        const state = new RubberState('player1', 1.0);
        applyMalus(state, 0.5, 0.3);

        // Simulate time passing
        updateRubber(state, 0.3, RUBBER_CONFIG, false);
        expect(state.malusTimer).toBeCloseTo(0.2, 2);
        expect(state.malus).toBe(0.3);
    });

    it('should reset malus when timer expires', () => {
        const state = new RubberState('player1', 1.0);
        applyMalus(state, 0.1, 0.3);

        // Let timer expire
        updateRubber(state, 0.15, RUBBER_CONFIG, false);
        expect(state.malusTimer).toBe(0);
        expect(state.malus).toBe(1.0);
    });

    it('should prevent chain grinding with malus', () => {
        const state = new RubberState('player1', 1.0);

        // First turn - apply malus
        applyMalus(state, 0.5, 0.3);
        const effectiveness1 = calculateEffectiveness(state);

        // During malus - effectiveness should be low
        expect(effectiveness1).toBeLessThan(0.5);

        // After malus expires
        updateRubber(state, 0.6, RUBBER_CONFIG, false);
        const effectiveness2 = calculateEffectiveness(state);

        // Effectiveness should recover
        expect(effectiveness2).toBeGreaterThan(effectiveness1);
    });

    it('should stack multiple malus applications', () => {
        const state = new RubberState('player1', 1.0);

        applyMalus(state, 0.3, 0.5);
        expect(state.malus).toBe(0.5);

        // Apply again with different factor
        applyMalus(state, 0.5, 0.2);
        expect(state.malus).toBe(0.2);
        expect(state.malusTimer).toBe(0.5);
    });
});

// ============================================================================
// Wall Proximity Detection Tests (10 tests)
// ============================================================================

describe('Wall Proximity Detection', () => {
    const segments = [
        { x1: -10, z1: 0, x2: 10, z2: 0, pid: 'wall1' },
        { x1: 0, z1: -10, x2: 0, z2: 10, pid: 'wall2' }
    ];

    // detectWallProximity tests
    it('should detect wall when player is close', () => {
        const player = { id: 'player1', x: 0, z: 1 };
        // Use only horizontal wall segment so player at (0,1) has distance 1
        const wallSegments = [{ x1: -10, z1: 0, x2: 10, z2: 0, pid: 'wall1' }];
        const wall = detectWallProximity(player, wallSegments, 10.0);
        expect(wall).not.toBeNull();
        expect(wall.distance).toBeCloseTo(1, 4);
    });

    it('should return null when no wall in detection radius', () => {
        const player = { id: 'player1', x: 50, z: 50 };
        const wall = detectWallProximity(player, segments, 10.0);
        expect(wall).toBeNull();
    });

    it('should return closest point on wall', () => {
        const player = { id: 'player1', x: 5, z: 3 };
        const wall = detectWallProximity(player, segments, 10.0);
        expect(wall.closestX).toBeCloseTo(5, 4);
        expect(wall.closestZ).toBeCloseTo(0, 4);
    });

    it('should handle player at diagonal to wall', () => {
        const player = { id: 'player1', x: 5, z: 5 };
        const wall = detectWallProximity(player, segments, 10.0);
        expect(wall.distance).toBeCloseTo(5, 4);
    });

    it('should skip own segments', () => {
        const player = { id: 'player1', x: 0, z: 1 };
        const ownSegments = [
            { x1: -10, z1: 0, x2: 10, z2: 0, pid: 'player1' }
        ];
        const wall = detectWallProximity(player, ownSegments, 10.0);
        expect(wall).toBeNull();
    });

    // calculateWallDistance tests
    it('should calculate exact distance to wall', () => {
        const player = { x: 0, z: 5 };
        const wallSegments = [{ x1: -10, z1: 0, x2: 10, z2: 0 }];
        const dist = calculateWallDistance(player, wallSegments);
        expect(dist).toBeCloseTo(5, 4);
    });

    it('should return Infinity for empty segments', () => {
        const player = { x: 0, z: 0 };
        const dist = calculateWallDistance(player, []);
        expect(dist).toBe(Infinity);
    });

    it('should return Infinity for null segments', () => {
        const player = { x: 0, z: 0 };
        const dist = calculateWallDistance(player, null);
        expect(dist).toBe(Infinity);
    });

    // isNearWall tests
    it('should return true when player is near wall', () => {
        const player = { x: 0, z: 1 };
        const wallSegments = [{ x1: -10, z1: 0, x2: 10, z2: 0 }];
        expect(isNearWall(player, wallSegments, 2.0)).toBe(true);
    });

    it('should return false when player is far from wall', () => {
        const player = { x: 0, z: 5 };
        const wallSegments = [{ x1: -10, z1: 0, x2: 10, z2: 0 }];
        expect(isNearWall(player, wallSegments, 2.0)).toBe(false);
    });

    it('should handle zero-length segments', () => {
        const player = { x: 0, z: 3 };
        const pointSegment = [{ x1: 0, z1: 0, x2: 0, z2: 0 }];
        const dist = calculateWallDistance(player, pointSegment);
        expect(dist).toBeCloseTo(3, 4);
    });
});

// ============================================================================
// Speed Adjustment Tests (8 tests)
// ============================================================================

describe('calculateSpeedAdjustment', () => {
    const segments = [{ x1: -10, z1: 0, x2: 10, z2: 0 }];

    it('should return original speed when far from wall', () => {
        const player = { x: 0, z: 10, speed: 40 };
        const newSpeed = calculateSpeedAdjustment(player, segments, RUBBER_CONFIG);
        expect(newSpeed).toBe(40);
    });

    it('should reduce speed when close to wall', () => {
        const player = { x: 0, z: 1, speed: 40 };
        const newSpeed = calculateSpeedAdjustment(player, segments, RUBBER_CONFIG);
        expect(newSpeed).toBeLessThan(40);
        expect(newSpeed).toBeGreaterThan(0);
    });

    it('should reduce speed more when very close to wall', () => {
        const player1 = { x: 0, z: 1.5, speed: 40 };
        const player2 = { x: 0, z: 0.5, speed: 40 };

        const speed1 = calculateSpeedAdjustment(player1, segments, RUBBER_CONFIG);
        const speed2 = calculateSpeedAdjustment(player2, segments, RUBBER_CONFIG);

        expect(speed2).toBeLessThan(speed1);
    });

    it('should handle zero speed', () => {
        const player = { x: 0, z: 1, speed: 0 };
        const newSpeed = calculateSpeedAdjustment(player, segments, RUBBER_CONFIG);
        expect(newSpeed).toBe(0);
    });

    it('should return default speed for null player', () => {
        const newSpeed = calculateSpeedAdjustment(null, segments, RUBBER_CONFIG);
        expect(newSpeed).toBe(40);
    });

    it('should return original speed for empty segments', () => {
        const player = { x: 0, z: 1, speed: 40 };
        const newSpeed = calculateSpeedAdjustment(player, [], RUBBER_CONFIG);
        expect(newSpeed).toBe(40);
    });

    it('should use custom slowdown threshold', () => {
        const player = { x: 0, z: 3, speed: 40 };
        const config = { ...RUBBER_CONFIG, slowdownThreshold: 5.0 };
        const newSpeed = calculateSpeedAdjustment(player, segments, config);
        expect(newSpeed).toBeLessThan(40); // Should slow down at 5.0 threshold
    });

    it('should provide smooth speed transition', () => {
        const speeds = [];
        for (let z = 0.1; z < 2.0; z += 0.1) {
            const player = { x: 0, z: z, speed: 40 };
            speeds.push(calculateSpeedAdjustment(player, segments, RUBBER_CONFIG));
        }
        // Speeds should increase monotonically as distance increases
        for (let i = 1; i < speeds.length; i++) {
            expect(speeds[i]).toBeGreaterThanOrEqual(speeds[i - 1]);
        }
    });
});

// ============================================================================
// Rubber Consumption and Regeneration Tests (8 tests)
// ============================================================================

describe('consumeRubber and regenerateRubber', () => {
    // consumeRubber tests
    it('should consume rubber successfully when enough available', () => {
        const state = new RubberState('player1', 1.0);
        const result = consumeRubber(state, 0.3);
        expect(result).toBe(true);
        expect(state.rubber).toBeCloseTo(0.7, 4);
    });

    it('should fail to consume when insufficient rubber', () => {
        const state = new RubberState('player1', 0.5);
        const result = consumeRubber(state, 1.0);
        expect(result).toBe(false);
        expect(state.rubber).toBe(0);
    });

    it('should respect malus when consuming', () => {
        const state = new RubberState('player1', 1.0);
        applyMalus(state, 0.5, 0.5); // 50% malus
        const result = consumeRubber(state, 0.6);
        // With 50% malus, effective available = 0.5, need 0.6 * 0.5 = 0.3
        expect(result).toBe(true);
    });

    it('should return false for zero amount', () => {
        const state = new RubberState('player1', 1.0);
        const result = consumeRubber(state, 0);
        expect(result).toBe(false);
    });

    it('should return false for null state', () => {
        const result = consumeRubber(null, 0.5);
        expect(result).toBe(false);
    });

    // regenerateRubber tests
    it('should regenerate rubber when not near wall', () => {
        const state = new RubberState('player1', 1.0);
        state.rubber = 0.5;
        const regenerated = regenerateRubber(state, 0.1, 0.5, false);
        expect(regenerated).toBeGreaterThan(0);
        expect(state.rubber).toBeGreaterThan(0.5);
    });

    it('should not regenerate when near wall', () => {
        const state = new RubberState('player1', 1.0);
        state.rubber = 0.5;
        const regenerated = regenerateRubber(state, 0.1, 0.5, true);
        expect(regenerated).toBe(0);
        expect(state.rubber).toBe(0.5);
    });

    it('should not regenerate during malus', () => {
        const state = new RubberState('player1', 1.0);
        state.rubber = 0.5;
        applyMalus(state, 0.5, 0.3);
        const regenerated = regenerateRubber(state, 0.1, 0.5, false);
        expect(regenerated).toBe(0);
    });

    it('should not exceed maxRubber', () => {
        const state = new RubberState('player1', 1.0);
        state.rubber = 0.9;
        regenerateRubber(state, 1.0, 0.5, false);
        expect(state.rubber).toBe(1.0);
    });

    it('should return 0 for zero dt', () => {
        const state = new RubberState('player1', 1.0);
        const regenerated = regenerateRubber(state, 0, 0.5, false);
        expect(regenerated).toBe(0);
    });
});

// ============================================================================
// Server Validation Tests (6 tests)
// ============================================================================

describe('validateRubberUsage', () => {
    it('should validate matching rubber values', () => {
        const result = validateRubberUsage(1.0, 1.0, 0.1);
        expect(result.valid).toBe(true);
        expect(result.deviation).toBe(0);
        expect(result.reason).toBeNull();
    });

    it('should accept values within tolerance', () => {
        const result = validateRubberUsage(1.0, 1.05, 0.1);
        expect(result.valid).toBe(true);
        expect(result.deviation).toBeLessThanOrEqual(0.1);
    });

    it('should reject values outside tolerance', () => {
        const result = validateRubberUsage(1.0, 1.5, 0.1);
        expect(result.valid).toBe(false);
        expect(result.deviation).toBeGreaterThan(0.1);
        expect(result.reason).toContain('exceeds tolerance');
    });

    it('should handle invalid client rubber', () => {
        const result1 = validateRubberUsage(NaN, 1.0, 0.1);
        expect(result1.valid).toBe(false);
        expect(result1.reason).toContain('Invalid client');

        const result2 = validateRubberUsage('invalid', 1.0, 0.1);
        expect(result2.valid).toBe(false);
    });

    it('should handle invalid server rubber', () => {
        const result = validateRubberUsage(1.0, NaN, 0.1);
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('Invalid server');
    });

    it('should clamp values to valid range', () => {
        const result = validateRubberUsage(15, 1.0, 0.1);
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('out of valid range');
    });
});

// ============================================================================
// Integration Tests (10 tests)
// ============================================================================

describe('Rubber System Integration', () => {
    it('should handle complete wall grinding cycle', () => {
        const state = new RubberState('player1', 1.0);
        const segments = [{ x1: -10, z1: 0, x2: 10, z2: 0 }];
        const player = { id: 'player1', x: 0, z: 0.5, speed: 40, dir_x: 1, dir_z: 0 };

        // Approach wall
        expect(isNearWall(player, segments, 2.0)).toBe(true);

        // Apply collision response
        const response = applyRubberCollision(player, segments, state, RUBBER_CONFIG);
        expect(response.rubberConsumed).toBeGreaterThan(0);

        // Rubber should decrease
        expect(state.rubber).toBeLessThan(1.0);
    });

    it('should handle malus preventing chain grinding', () => {
        const state = new RubberState('player1', 1.0);
        const segments = [{ x1: -10, z1: 0, x2: 10, z2: 0 }];

        // First turn - apply malus
        applyMalus(state, 0.5, 0.3);
        const effectiveness1 = calculateEffectiveness(state);

        // Try to grind immediately - low effectiveness
        expect(effectiveness1).toBeLessThan(0.5);

        // Wait for malus to expire
        updateRubber(state, 0.6, RUBBER_CONFIG, false);

        // Now effectiveness should be restored
        const effectiveness2 = calculateEffectiveness(state);
        expect(effectiveness2).toBeGreaterThan(effectiveness1);
    });

    it('should validate rubber after consumption', () => {
        const clientState = new RubberState('player1', 1.0);
        const serverRubber = 1.0;

        // Client consumes rubber
        consumeRubber(clientState, 0.2);

        // Server validates
        const validation = validateRubberUsage(clientState.rubber, serverRubber, 0.3);
        expect(validation.valid).toBe(true); // Within 30% tolerance
    });

    it('should generate valid rubber report', () => {
        const state = new RubberState('player1', 1.0);
        const player = { id: 'player1', x: 0, z: 1 };
        const segments = [{ x1: -10, z1: 0, x2: 10, z2: 0 }];

        const report = createRubberReport(player, segments, 0.016, state);

        expect(report.playerId).toBe('player1');
        expect(report.wallDistance).toBeCloseTo(1, 4);
        expect(report.isNearWall).toBe(1);
        expect(report.rubberState).not.toBeNull();
    });

    it('should handle player with no rubber near wall', () => {
        const state = new RubberState('player1', 0);
        const segments = [{ x1: -10, z1: 0, x2: 10, z2: 0 }];
        const player = { id: 'player1', x: 0, z: 0.0001, speed: 40, dir_x: 1, dir_z: 0 };

        const response = applyRubberCollision(player, segments, state, RUBBER_CONFIG);

        // No rubber - should result in collision
        expect(response.collided).toBe(true);
        expect(response.newSpeed).toBe(0);
    });

    it('should regenerate rubber after leaving wall area', () => {
        const state = new RubberState('player1', 1.0);
        const segments = [{ x1: -10, z1: 0, x2: 10, z2: 0 }];

        // Deplete rubber near wall
        state.rubber = 0.2;

        // Move away from wall
        const player = { x: 0, z: 50 };

        // Regenerate over time
        for (let i = 0; i < 10; i++) {
            regenerateRubber(state, 0.1, 0.5, false);
        }

        expect(state.rubber).toBeGreaterThan(0.2);
    });

    it('should calculate grinding quality correctly', () => {
        const state = new RubberState('player1', 1.0);
        const quality1 = getGrindingQuality(0.002, state, RUBBER_CONFIG);
        expect(quality1.score).toBeGreaterThan(50);

        const quality2 = getGrindingQuality(5.0, state, RUBBER_CONFIG);
        expect(quality2.score).toBeLessThan(quality1.score);
    });

    it('should handle calculateRubberNeeded for safe approach', () => {
        const needed1 = calculateRubberNeeded(1.0, 40, RUBBER_CONFIG);
        const needed2 = calculateRubberNeeded(0.5, 40, RUBBER_CONFIG);

        // Closer distance needs more rubber
        expect(needed2).toBeGreaterThan(needed1);

        const needed3 = calculateRubberNeeded(1.0, 70, RUBBER_CONFIG);
        // Higher speed needs more rubber
        expect(needed3).toBeGreaterThan(needed1);
    });

    it('should handle multiple players with separate rubber states', () => {
        const state1 = new RubberState('player1', 1.0);
        const state2 = new RubberState('player2', 1.0);

        // Apply different operations
        consumeRubber(state1, 0.3);
        applyMalus(state2, 0.5, 0.3);

        // States should be independent
        expect(state1.rubber).toBeCloseTo(0.7, 4);
        expect(state2.malus).toBe(0.3);
        expect(state1.malus).toBe(1.0);
        expect(state2.rubber).toBe(1.0);
    });

    it('should handle complete game loop integration', () => {
        const state = new RubberState('player1', 1.0);
        const segments = [{ x1: -10, z1: 0, x2: 10, z2: 0 }];
        const player = { id: 'player1', x: 0, z: 1, speed: 40, dir_x: 1, dir_z: 0 };

        // Simulate game loop
        const dt = 0.016;

        // Update rubber
        updateRubber(state, dt, RUBBER_CONFIG, isNearWall(player, segments, 2.0));

        // Apply collision response
        const response = applyRubberCollision(player, segments, state, RUBBER_CONFIG);

        // Generate report for server
        const report = createRubberReport(player, segments, dt, state);

        // Validate
        expect(report.rubberState.rubber).toBeLessThanOrEqual(1.0);
        expect(response.newSpeed).toBeLessThanOrEqual(40);
    });
});

// ============================================================================
// Edge Cases and Error Handling Tests
// ============================================================================

describe('Edge Cases', () => {
    it('should handle very small distances (sub-pixel)', () => {
        const player = { x: 0, z: 0.0001 };
        const segments = [{ x1: -10, z1: 0, x2: 10, z2: 0 }];
        const dist = calculateWallDistance(player, segments);
        expect(dist).toBeLessThan(0.001);
    });

    it('should handle very large coordinates', () => {
        const player = { x: 10000, z: 10000 };
        const segments = [{ x1: -1000, z1: 0, x2: 1000, z2: 0 }];
        const dist = calculateWallDistance(player, segments);
        expect(dist).toBeGreaterThan(9000);
    });

    it('should handle diagonal wall segments', () => {
        const player = { x: 5, z: 5 };
        const segments = [{ x1: 0, z1: 0, x2: 10, z2: 10 }];
        const dist = calculateWallDistance(player, segments);
        expect(dist).toBeCloseTo(0, 4); // Player is on the line
    });

    it('should handle curved wall approximation (multiple segments)', () => {
        const player = { x: 0, z: 5 };
        // Approximate a curve with multiple segments
        const segments = [
            { x1: -10, z1: 0, x2: -5, z2: 2 },
            { x1: -5, z1: 2, x2: 0, z2: 3 },
            { x1: 0, z1: 3, x2: 5, z2: 2 },
            { x1: 5, z1: 2, x2: 10, z2: 0 }
        ];
        const dist = calculateWallDistance(player, segments);
        expect(dist).toBeLessThan(3);
    });

    it('should handle zero rubber state', () => {
        const state = new RubberState('player1', 0);
        const effectiveness = calculateEffectiveness(state);
        expect(effectiveness).toBe(0);

        const result = consumeRubber(state, 0.1);
        expect(result).toBe(false);
    });

    it('should handle negative rubber values gracefully', () => {
        const state = new RubberState('player1', 1.0);
        state.rubber = -0.5;

        // Should not crash
        const effectiveness = calculateEffectiveness(state);
        expect(effectiveness).toBeLessThanOrEqual(0);
    });
});

// ============================================================================
// Configuration Tests
// ============================================================================

describe('RUBBER_CONFIG', () => {
    it('should have valid default values', () => {
        expect(RUBBER_CONFIG.baseRubber).toBe(1.0);
        expect(RUBBER_CONFIG.serverRubber).toBe(3.0);
        expect(RUBBER_CONFIG.rubberSpeed).toBe(40.0);
        expect(RUBBER_CONFIG.minDistance).toBe(0.001);
        expect(RUBBER_CONFIG.malusDuration).toBe(0.5);
        expect(RUBBER_CONFIG.malusFactor).toBe(0.3);
        expect(RUBBER_CONFIG.regenRate).toBe(0.5);
        expect(RUBBER_CONFIG.detectionRadius).toBe(10.0);
        expect(RUBBER_CONFIG.slowdownThreshold).toBe(2.0);
    });

    it('should allow config overrides', () => {
        const customConfig = {
            ...RUBBER_CONFIG,
            rubberSpeed: 80.0,
            malusDuration: 1.0
        };

        const state = new RubberState('player1', 1.0);
        applyMalus(state, customConfig.malusDuration, customConfig.malusFactor);
        expect(state.malusTimer).toBe(1.0);
    });
});
