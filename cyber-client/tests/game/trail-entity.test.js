/**
 * TrailEntity Tests for Cyber Cycles
 *
 * Comprehensive test suite for the TrailEntity module.
 * Tests cover:
 * - Trail creation and management (15 tests)
 * - Point addition and segments (15 tests)
 * - Length management (10 tests)
 * - SpatialHash integration (10 tests)
 * - Serialization (8 tests)
 * - Edge cases (7 tests)
 *
 * Target: 65+ tests total
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    TrailEntity,
    createTrailEntity,
    TRAIL_DEFAULTS
} from '../../src/game/TrailEntity.js';
import { SpatialHash } from '../../src/core/SpatialHash.js';

// ============================================================================
// Trail Creation and Management Tests (15 tests)
// ============================================================================

describe('TrailEntity - Creation and Management', () => {
    it('should create TrailEntity with player ID', () => {
        const trail = new TrailEntity('player1');
        expect(trail.playerId).toBe('player1');
    });

    it('should throw error when player ID is missing', () => {
        expect(() => new TrailEntity()).toThrow('Player ID is required');
        expect(() => new TrailEntity(null)).toThrow('Player ID is required');
        expect(() => new TrailEntity('')).toThrow('Player ID is required');
    });

    it('should create TrailEntity with default color', () => {
        const trail = new TrailEntity('player1');
        expect(trail.color).toBe(TRAIL_DEFAULTS.color);
    });

    it('should create TrailEntity with custom color', () => {
        const trail = new TrailEntity('player1', { color: 0xff0000 });
        expect(trail.color).toBe(0xff0000);
    });

    it('should create TrailEntity with default max length', () => {
        const trail = new TrailEntity('player1');
        expect(trail.maxLength).toBe(TRAIL_DEFAULTS.maxLength);
    });

    it('should create TrailEntity with custom max length', () => {
        const trail = new TrailEntity('player1', { maxLength: 300 });
        expect(trail.maxLength).toBe(300);
    });

    it('should create TrailEntity with custom height', () => {
        const trail = new TrailEntity('player1', { height: 3.0 });
        expect(trail.height).toBe(3.0);
    });

    it('should create TrailEntity with custom width', () => {
        const trail = new TrailEntity('player1', { width: 1.0 });
        expect(trail.width).toBe(1.0);
    });

    it('should create TrailEntity with custom min point spacing', () => {
        const trail = new TrailEntity('player1', { minPointSpacing: 2.0 });
        expect(trail.minPointSpacing).toBe(2.0);
    });

    it('should create TrailEntity with custom spatial hash cell size', () => {
        const trail = new TrailEntity('player1', { spatialHashCellSize: 15.0 });
        expect(trail.spatialHashCellSize).toBe(15.0);
    });

    it('should initialize with empty segments array', () => {
        const trail = new TrailEntity('player1');
        expect(trail.segments).toEqual([]);
    });

    it('should initialize with zero total length', () => {
        const trail = new TrailEntity('player1');
        expect(trail.getLength()).toBe(0);
    });

    it('should initialize with empty cached segments', () => {
        const trail = new TrailEntity('player1');
        expect(trail.getSegments()).toEqual([]);
    });

    it('should create TrailEntity using factory function', () => {
        const trail = createTrailEntity('player1', { color: 0x00ff00 });
        expect(trail).toBeInstanceOf(TrailEntity);
        expect(trail.playerId).toBe('player1');
        expect(trail.color).toBe(0x00ff00);
    });

    it('should start with dirty flag true', () => {
        const trail = new TrailEntity('player1');
        expect(trail.isDirty()).toBe(true);
    });
});

// ============================================================================
// Point Addition and Segments Tests (15 tests)
// ============================================================================

describe('TrailEntity - Point Addition and Segments', () => {
    let trail;

    beforeEach(() => {
        trail = new TrailEntity('player1');
    });

    it('should add first point successfully', () => {
        const result = trail.addPoint(0, 0);
        expect(result).toBe(true);
        expect(trail.segments.length).toBe(1);
    });

    it('should add multiple points', () => {
        trail.addPoint(0, 0);
        trail.addPoint(10, 0);
        trail.addPoint(20, 5);

        expect(trail.segments.length).toBe(3);
    });

    it('should reject point too close to last point', () => {
        trail.minPointSpacing = 5.0;
        trail.addPoint(0, 0);

        const result = trail.addPoint(1, 0); // Only 1 unit away
        expect(result).toBe(false);
        expect(trail.segments.length).toBe(1);
    });

    it('should accept point at minimum spacing distance', () => {
        trail.minPointSpacing = 5.0;
        trail.addPoint(0, 0);

        const result = trail.addPoint(5, 0); // Exactly 5 units away
        expect(result).toBe(true);
        expect(trail.segments.length).toBe(2);
    });

    it('should get segment count correctly', () => {
        expect(trail.segmentCount()).toBe(0);

        trail.addPoint(0, 0);
        expect(trail.segmentCount()).toBe(0); // Need 2 points for 1 segment

        trail.addPoint(10, 0);
        expect(trail.segmentCount()).toBe(1);

        trail.addPoint(20, 0);
        expect(trail.segmentCount()).toBe(2);
    });

    it('should get segments array', () => {
        trail.addPoint(0, 0);
        trail.addPoint(10, 0);
        trail.addPoint(10, 10);

        const segments = trail.getSegments();
        expect(segments.length).toBe(2);
        expect(segments[0].x1).toBe(0);
        expect(segments[0].z1).toBe(0);
        expect(segments[0].x2).toBe(10);
        expect(segments[0].z2).toBe(0);
    });

    it('should get specific segment by index', () => {
        trail.addPoint(0, 0);
        trail.addPoint(10, 0);
        trail.addPoint(10, 10);

        const seg0 = trail.getSegment(0);
        expect(seg0.x1).toBe(0);
        expect(seg0.z1).toBe(0);

        const seg1 = trail.getSegment(1);
        expect(seg1.x1).toBe(10);
        expect(seg1.z1).toBe(0);
    });

    it('should return null for invalid segment index', () => {
        trail.addPoint(0, 0);
        trail.addPoint(10, 0);

        expect(trail.getSegment(-1)).toBe(null);
        expect(trail.getSegment(5)).toBe(null);
    });

    it('should include player ID in segment data', () => {
        trail.addPoint(0, 0);
        trail.addPoint(10, 0);

        const segments = trail.getSegments();
        expect(segments[0].pid).toBe('player1');
    });

    it('should calculate segment lengths', () => {
        trail.addPoint(0, 0);
        trail.addPoint(3, 0);
        trail.addPoint(3, 4);

        const segments = trail.getSegments();
        expect(segments[0].length).toBe(3);
        expect(segments[1].length).toBe(4);
    });

    it('should clear all trail points', () => {
        trail.addPoint(0, 0);
        trail.addPoint(10, 0);
        trail.addPoint(20, 0);

        trail.clear();

        expect(trail.segments.length).toBe(0);
        expect(trail.segmentCount()).toBe(0);
        expect(trail.getLength()).toBe(0);
    });

    it('should update dirty flag when adding points', () => {
        trail.addPoint(0, 0);
        expect(trail.isDirty()).toBe(true);

        trail.getSegments(); // This should clear dirty flag
        expect(trail.isDirty()).toBe(false);

        trail.addPoint(10, 0);
        expect(trail.isDirty()).toBe(true);
    });

    it('should cache segments after first getSegments call', () => {
        trail.addPoint(0, 0);
        trail.addPoint(10, 0);

        const segments1 = trail.getSegments();
        expect(trail.isDirty()).toBe(false);

        const segments2 = trail.getSegments();
        expect(segments1).toBe(segments2); // Same reference
    });

    it('should handle adding points in various directions', () => {
        trail.addPoint(0, 0);
        trail.addPoint(10, 0);  // Right
        trail.addPoint(10, 10); // Up
        trail.addPoint(0, 10);  // Left
        trail.addPoint(0, 0);   // Down

        expect(trail.segmentCount()).toBe(4);
        const segments = trail.getSegments();
        expect(segments.length).toBe(4);
    });

    it('should handle negative coordinates', () => {
        trail.addPoint(-10, -10);
        trail.addPoint(0, 0);
        trail.addPoint(10, 10);

        const segments = trail.getSegments();
        expect(segments[0].x1).toBe(-10);
        expect(segments[0].z1).toBe(-10);
    });
});

// ============================================================================
// Length Management Tests (10 tests)
// ============================================================================

describe('TrailEntity - Length Management', () => {
    let trail;

    beforeEach(() => {
        trail = new TrailEntity('player1', { maxLength: 50 });
    });

    it('should get total trail length', () => {
        trail.addPoint(0, 0);
        trail.addPoint(10, 0);
        trail.addPoint(20, 0);

        expect(trail.getLength()).toBe(20);
    });

    it('should calculate individual segment length', () => {
        trail.addPoint(0, 0);
        trail.addPoint(3, 0);
        trail.addPoint(3, 4);

        expect(trail.calculateSegmentLength(0)).toBe(3);
        expect(trail.calculateSegmentLength(1)).toBe(4);
    });

    it('should return 0 for invalid segment length index', () => {
        trail.addPoint(0, 0);
        trail.addPoint(10, 0);

        expect(trail.calculateSegmentLength(-1)).toBe(0);
        expect(trail.calculateSegmentLength(5)).toBe(0);
    });

    it('should enforce max length constraint', () => {
        trail.maxLength = 20;

        trail.addPoint(0, 0);
        trail.addPoint(10, 0);
        trail.addPoint(20, 0);
        trail.addPoint(30, 0);

        expect(trail.getLength()).toBeLessThanOrEqual(20);
    });

    it('should trim trail to specified length', () => {
        trail.addPoint(0, 0);
        trail.addPoint(10, 0);
        trail.addPoint(20, 0);
        trail.addPoint(30, 0);

        const removed = trail.trimToLength(15);

        expect(trail.getLength()).toBeLessThanOrEqual(15);
        expect(removed).toBeGreaterThan(0);
    });

    it('should return number of segments removed', () => {
        trail.addPoint(0, 0);
        trail.addPoint(10, 0);
        trail.addPoint(20, 0);
        trail.addPoint(30, 0);

        const removed = trail.trimToLength(10);
        expect(removed).toBeGreaterThanOrEqual(1);
    });

    it('should return 0 when no trimming needed', () => {
        trail.addPoint(0, 0);
        trail.addPoint(10, 0);

        const removed = trail.trimToLength(100);
        expect(removed).toBe(0);
    });

    it('should handle trim on empty trail', () => {
        const removed = trail.trimToLength(10);
        expect(removed).toBe(0);
    });

    it('should handle trim on single point trail', () => {
        trail.addPoint(0, 0);
        const removed = trail.trimToLength(10);
        expect(removed).toBe(0);
    });

    it('should auto-enforce max length when adding points', () => {
        trail.maxLength = 15;

        trail.addPoint(0, 0);
        trail.addPoint(10, 0);
        trail.addPoint(20, 0); // This should trigger enforcement

        expect(trail.getLength()).toBeLessThanOrEqual(15);
    });
});

// ============================================================================
// SpatialHash Integration Tests (10 tests)
// ============================================================================

describe('TrailEntity - SpatialHash Integration', () => {
    let trail;
    let spatialHash;

    beforeEach(() => {
        trail = new TrailEntity('player1', { spatialHashCellSize: 10.0 });
        spatialHash = new SpatialHash(10.0);
    });

    it('should update spatial hash with external instance', () => {
        trail.addPoint(0, 0);
        trail.addPoint(10, 0);

        const result = trail.updateSpatialHash(spatialHash);

        expect(result).toBe(spatialHash);
        expect(trail._spatialHashEnabled).toBe(true);
    });

    it('should create internal spatial hash if not provided', () => {
        trail.addPoint(0, 0);
        trail.addPoint(10, 0);

        trail.updateSpatialHash();

        expect(trail._spatialHash).toBeInstanceOf(SpatialHash);
        expect(trail._spatialHashEnabled).toBe(true);
    });

    it('should remove trail from spatial hash', () => {
        trail.addPoint(0, 0);
        trail.addPoint(10, 0);
        trail.updateSpatialHash(spatialHash);

        const result = trail.removeFromSpatialHash(spatialHash);

        expect(result).toBe(true);
    });

    it('should get nearby segments using spatial hash', () => {
        trail.addPoint(0, 0);
        trail.addPoint(10, 0);
        trail.addPoint(20, 0);
        trail.updateSpatialHash(spatialHash);

        const nearby = trail.getNearbySegments(spatialHash, 10, 0, 15);

        expect(nearby.length).toBeGreaterThan(0);
    });

    it('should sort nearby segments by distance', () => {
        trail.addPoint(0, 0);
        trail.addPoint(10, 0);
        trail.addPoint(50, 0);
        trail.updateSpatialHash(spatialHash);

        const nearby = trail.getNearbySegments(spatialHash, 5, 0, 20);

        if (nearby.length > 1) {
            for (let i = 1; i < nearby.length; i++) {
                expect(nearby[i].distance).toBeGreaterThanOrEqual(nearby[i - 1].distance);
            }
        }
    });

    it('should fallback to brute force without spatial hash', () => {
        trail.addPoint(0, 0);
        trail.addPoint(10, 0);
        trail.addPoint(20, 0);

        const nearby = trail.getNearbySegments(null, 10, 0, 15);

        expect(nearby.length).toBeGreaterThan(0);
    });

    it('should rebuild spatial hash when trail changes', () => {
        trail.updateSpatialHash(spatialHash);

        trail.addPoint(0, 0);
        trail.addPoint(10, 0);

        const nearby1 = trail.getNearbySegments(spatialHash, 5, 0, 15);

        trail.addPoint(20, 0);
        trail.addPoint(30, 0);

        const nearby2 = trail.getNearbySegments(spatialHash, 25, 0, 15);

        expect(nearby2.length).toBeGreaterThanOrEqual(nearby1.length);
    });

    it('should clear spatial hash when trail is cleared', () => {
        trail.addPoint(0, 0);
        trail.addPoint(10, 0);
        trail.updateSpatialHash(spatialHash);

        trail.clear();

        const nearby = trail.getNearbySegments(spatialHash, 5, 0, 15);
        expect(nearby.length).toBe(0);
    });

    it('should handle remove from non-existent spatial hash', () => {
        const result = trail.removeFromSpatialHash();
        expect(result).toBe(false);
    });

    it('should query correct radius', () => {
        trail.addPoint(0, 0);
        trail.addPoint(100, 0); // Far away
        trail.updateSpatialHash(spatialHash);

        const nearby = trail.getNearbySegments(spatialHash, 0, 0, 50);

        // Should only find the segment near origin
        for (const item of nearby) {
            expect(item.distance).toBeLessThanOrEqual(50);
        }
    });
});

// ============================================================================
// Serialization Tests (8 tests)
// ============================================================================

describe('TrailEntity - Serialization', () => {
    let trail;

    beforeEach(() => {
        trail = new TrailEntity('player1', {
            color: 0xff0000,
            maxLength: 150,
            height: 3.0,
            width: 0.8
        });
        trail.addPoint(0, 0);
        trail.addPoint(10, 0);
        trail.addPoint(10, 10);
    });

    it('should serialize to JSON', () => {
        const json = trail.toJSON();

        expect(json.playerId).toBe('player1');
        expect(json.segments.length).toBe(3);
        expect(json.color).toBe(0xff0000);
        expect(json.length).toBe(20);
    });

    it('should deserialize from JSON', () => {
        const json = trail.toJSON();
        const newTrail = new TrailEntity('player2');

        const result = newTrail.fromJSON(json);

        expect(result).toBe(true);
        expect(newTrail.playerId).toBe('player1');
        expect(newTrail.segments.length).toBe(3);
        expect(newTrail.color).toBe(0xff0000);
    });

    it('should handle invalid JSON data', () => {
        const newTrail = new TrailEntity('player2');

        expect(newTrail.fromJSON(null)).toBe(false);
        expect(newTrail.fromJSON(undefined)).toBe(false);
        expect(newTrail.fromJSON('invalid')).toBe(false);
    });

    it('should export full trail data', () => {
        const exported = trail.export();

        expect(exported.type).toBe('TrailEntity');
        expect(exported.version).toBe(1);
        expect(exported.playerId).toBe('player1');
        expect(exported.color).toBe(0xff0000);
        expect(exported.maxLength).toBe(150);
        expect(exported.height).toBe(3.0);
        expect(exported.width).toBe(0.8);
        expect(exported.segments.length).toBe(3);
    });

    it('should import from full export', () => {
        const exported = trail.export();
        const newTrail = new TrailEntity('player2');

        const result = newTrail.import(exported);

        expect(result).toBe(true);
        expect(newTrail.playerId).toBe('player1');
        expect(newTrail.color).toBe(0xff0000);
        expect(newTrail.maxLength).toBe(150);
        expect(newTrail.height).toBe(3.0);
        expect(newTrail.width).toBe(0.8);
    });

    it('should reject invalid export type', () => {
        const newTrail = new TrailEntity('player2');
        const invalidExport = { type: 'InvalidType', playerId: 'player1' };

        const result = newTrail.import(invalidExport);
        expect(result).toBe(false);
    });

    it('should handle round-trip serialization', () => {
        const json = trail.toJSON();
        const newTrail = new TrailEntity('player2');
        newTrail.fromJSON(json);

        const json2 = newTrail.toJSON();

        expect(json2.playerId).toBe(json.playerId);
        expect(json2.segments.length).toBe(json.segments.length);
        expect(json2.color).toBe(json.color);
    });

    it('should handle round-trip export/import', () => {
        const exported = trail.export();
        const newTrail = new TrailEntity('player2');
        newTrail.import(exported);

        const exported2 = newTrail.export();

        expect(exported2.playerId).toBe(exported.playerId);
        expect(exported2.color).toBe(exported.color);
        expect(exported2.maxLength).toBe(exported.maxLength);
    });
});

// ============================================================================
// Edge Cases Tests (7 tests)
// ============================================================================

describe('TrailEntity - Edge Cases', () => {
    it('should handle empty trail getBounds', () => {
        const trail = new TrailEntity('player1');
        expect(trail.getBounds()).toBe(null);
    });

    it('should get correct trail bounds', () => {
        const trail = new TrailEntity('player1');
        trail.addPoint(0, 0);
        trail.addPoint(10, 0);
        trail.addPoint(10, 10);
        trail.addPoint(0, 10);

        const bounds = trail.getBounds();
        expect(bounds.minX).toBe(0);
        expect(bounds.minZ).toBe(0);
        expect(bounds.maxX).toBe(10);
        expect(bounds.maxZ).toBe(10);
    });

    it('should handle empty trail getStartPoint', () => {
        const trail = new TrailEntity('player1');
        expect(trail.getStartPoint()).toBe(null);
    });

    it('should get correct start and end points', () => {
        const trail = new TrailEntity('player1');
        trail.addPoint(5, 5);
        trail.addPoint(10, 10);
        trail.addPoint(15, 15);

        const start = trail.getStartPoint();
        const end = trail.getEndPoint();

        expect(start.x).toBe(5);
        expect(start.z).toBe(5);
        expect(end.x).toBe(15);
        expect(end.z).toBe(15);
    });

    it('should return true for isEmpty on new trail', () => {
        const trail = new TrailEntity('player1');
        expect(trail.isEmpty()).toBe(true);
    });

    it('should return false for isEmpty with segments', () => {
        const trail = new TrailEntity('player1');
        trail.addPoint(0, 0);
        trail.addPoint(10, 0);

        expect(trail.isEmpty()).toBe(false);
    });

    it('should get debug info', () => {
        const trail = new TrailEntity('player1', { color: 0x00ff00 });
        trail.addPoint(0, 0);
        trail.addPoint(10, 0);

        const debug = trail.getDebugInfo();

        expect(debug.playerId).toBe('player1');
        expect(debug.segmentCount).toBe(1);
        expect(debug.pointCount).toBe(2);
        expect(debug.color).toBe('0x00ff00');
    });
});

// ============================================================================
// Collision Integration Tests
// ============================================================================

describe('TrailEntity - Collision Integration', () => {
    let trail;

    beforeEach(() => {
        trail = new TrailEntity('player1');
        trail.addPoint(0, 0);
        trail.addPoint(10, 0);
        trail.addPoint(10, 10);
    });

    it('should get collision segments', () => {
        const segments = trail.getCollisionSegments();
        expect(segments.length).toBe(2);
        expect(segments[0].pid).toBe('player1');
    });

    it('should check if point is near trail', () => {
        const result = trail.isPointNearTrail(5, 0, 3);

        expect(result.near).toBe(true);
        expect(result.distance).toBe(0); // Point is on the trail
    });

    it('should check if point is far from trail', () => {
        const result = trail.isPointNearTrail(50, 50, 3);

        expect(result.near).toBe(false);
        expect(result.distance).toBeGreaterThan(3);
    });

    it('should get closest segment to point', () => {
        const result = trail.getClosestSegment(5, 0);

        expect(result.segment).not.toBe(null);
        expect(result.distance).toBe(0);
    });

    it('should get closest segment with distance info', () => {
        const result = trail.getClosestSegment(15, 5);

        expect(result.distance).toBeGreaterThan(0);
        expect(result.closestX).toBeDefined();
        expect(result.closestZ).toBeDefined();
    });

    it('should handle empty trail for closest segment', () => {
        const emptyTrail = new TrailEntity('player2');
        const result = emptyTrail.getClosestSegment(0, 0);

        expect(result.segment).toBe(null);
        expect(result.distance).toBe(Infinity);
    });
});

// ============================================================================
// Render Data Tests
// ============================================================================

describe('TrailEntity - Render Data', () => {
    let trail;

    beforeEach(() => {
        trail = new TrailEntity('player1', {
            color: 0xff0000,
            height: 2.0,
            width: 0.5
        });
    });

    it('should get render data for empty trail', () => {
        const renderData = trail.getRenderData();

        expect(renderData.segmentCount).toBe(0);
        expect(renderData.vertexCount).toBe(0);
    });

    it('should get render data with positions', () => {
        trail.addPoint(0, 0);
        trail.addPoint(10, 0);

        const renderData = trail.getRenderData();

        expect(renderData.segmentCount).toBe(1);
        expect(renderData.vertexCount).toBe(4);
        expect(renderData.positions.length).toBe(12); // 4 vertices * 3 components
    });

    it('should get render data with colors', () => {
        trail.addPoint(0, 0);
        trail.addPoint(10, 0);

        const renderData = trail.getRenderData();

        expect(renderData.colors.length).toBe(12); // 4 vertices * 3 components
        // Red color (0xff0000)
        expect(renderData.colors[0]).toBeCloseTo(1.0, 5); // R
        expect(renderData.colors[1]).toBeCloseTo(0.0, 5); // G
        expect(renderData.colors[2]).toBeCloseTo(0.0, 5); // B
    });

    it('should get render data with indices', () => {
        trail.addPoint(0, 0);
        trail.addPoint(10, 0);

        const renderData = trail.getRenderData();

        expect(renderData.indices.length).toBe(6); // 2 triangles * 3 indices
    });

    it('should create trail geometry', () => {
        trail.addPoint(0, 0);
        trail.addPoint(10, 0);

        // Note: Three.js may or may not be available in test environment
        // This tests that the method handles both cases gracefully
        const geometry = trail.createTrailGeometry();

        // If Three.js is available, geometry should be an object
        // If not, it should be null
        if (window.THREE && window.THREE.BufferGeometry) {
            expect(geometry).toBeTruthy();
        } else {
            expect(geometry).toBe(null);
        }
    });

    it('should handle updateRenderMesh without Three.js', () => {
        trail.addPoint(0, 0);
        trail.addPoint(10, 0);

        // Without Three.js, this should return false
        const result = trail.updateRenderMesh({});
        expect(result).toBe(false);
    });
});

// ============================================================================
// Additional Utility Tests
// ============================================================================

describe('TrailEntity - Utility Methods', () => {
    let trail;

    beforeEach(() => {
        trail = new TrailEntity('player1');
    });

    it('should get last update timestamp', () => {
        const beforeUpdate = trail.getLastUpdate();

        trail.addPoint(0, 0);

        const afterUpdate = trail.getLastUpdate();

        expect(afterUpdate).toBeGreaterThanOrEqual(beforeUpdate);
    });

    it('should handle multiple trim operations', () => {
        trail.maxLength = 100;

        for (let i = 0; i < 20; i++) {
            trail.addPoint(i * 5, 0);
        }

        expect(trail.getLength()).toBeLessThanOrEqual(100);

        trail.trimToLength(50);
        expect(trail.getLength()).toBeLessThanOrEqual(50);
    });

    it('should preserve point references in getStartPoint/getEndPoint', () => {
        trail.addPoint(5, 10);
        trail.addPoint(15, 20);

        const start = trail.getStartPoint();
        const end = trail.getEndPoint();

        // Modify returned points should not affect trail
        start.x = 999;
        end.z = 999;

        const start2 = trail.getStartPoint();
        const end2 = trail.getEndPoint();

        expect(start2.x).toBe(5);
        expect(end2.z).toBe(20);
    });

    it('should handle diagonal segments', () => {
        trail.addPoint(0, 0);
        trail.addPoint(3, 4); // 5 units diagonal

        const segments = trail.getSegments();
        expect(segments[0].length).toBeCloseTo(5, 5);
    });

    it('should handle collinear points', () => {
        trail.addPoint(0, 0);
        trail.addPoint(5, 0);
        trail.addPoint(10, 0);

        const segments = trail.getSegments();
        expect(segments.length).toBe(2);
        expect(trail.getLength()).toBe(10);
    });
});

// ============================================================================
// Performance and Stress Tests
// ============================================================================

describe('TrailEntity - Performance', () => {
    it('should handle many points efficiently', () => {
        const trail = new TrailEntity('player1', { 
            minPointSpacing: 1.0,
            maxLength: 2000  // Allow longer trail for this test
        });

        for (let i = 0; i < 1000; i++) {
            trail.addPoint(i, 0);
        }

        expect(trail.segmentCount()).toBe(999);
        expect(trail.getLength()).toBe(999);
    });

    it('should handle rapid point additions', () => {
        const trail = new TrailEntity('player1', { minPointSpacing: 0.1 });

        const startTime = Date.now();

        for (let i = 0; i < 500; i++) {
            trail.addPoint(i * 0.5, Math.sin(i) * 10);
        }

        const endTime = Date.now();

        // Should complete in reasonable time (< 100ms)
        expect(endTime - startTime).toBeLessThan(100);
    });

    it('should handle multiple spatial hash queries', () => {
        const trail = new TrailEntity('player1', { spatialHashCellSize: 5.0 });
        const spatialHash = new SpatialHash(5.0);

        for (let i = 0; i < 100; i++) {
            trail.addPoint(i, 0);
        }

        trail.updateSpatialHash(spatialHash);

        const startTime = Date.now();

        for (let i = 0; i < 50; i++) {
            trail.getNearbySegments(spatialHash, i, 0, 10);
        }

        const endTime = Date.now();

        // Should complete in reasonable time
        expect(endTime - startTime).toBeLessThan(100);
    });
});

// ============================================================================
// Integration with Collision Detection
// ============================================================================

describe('TrailEntity - Collision Detection Integration', () => {
    it('should work with distanceToSegmentWithClosest', () => {
        const trail = new TrailEntity('player1');
        trail.addPoint(0, 0);
        trail.addPoint(10, 0);

        const result = trail.getClosestSegment(5, 5);

        expect(result.distance).toBe(5);
        expect(result.closestX).toBe(5);
        expect(result.closestZ).toBe(0);
    });

    it('should detect collision with trail segments', () => {
        const trail = new TrailEntity('player1');
        trail.addPoint(0, 0);
        trail.addPoint(10, 0);

        const result = trail.isPointNearTrail(5, 0.5, 1.0);

        expect(result.near).toBe(true);
        expect(result.distance).toBeLessThanOrEqual(1.0);
    });

    it('should handle multiple trail segments for collision', () => {
        const trail = new TrailEntity('player1');
        trail.addPoint(0, 0);
        trail.addPoint(10, 0);
        trail.addPoint(10, 10);
        trail.addPoint(0, 10);

        // Point in center of square
        const result = trail.isPointNearTrail(5, 5, 6);

        expect(result.near).toBe(true);
    });
});
