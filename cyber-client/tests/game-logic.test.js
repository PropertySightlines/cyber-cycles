/**
 * Game Logic Tests for Cyber Cycles
 *
 * Tests for core game mechanics:
 * - distanceToSegment: Calculate distance from point to line segment
 * - rotateDirection: Rotate a direction vector by an angle
 * - normalize: Normalize a vector to unit length
 * - Collision detection functions
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
    distanceToSegment,
    normalize,
    rotateDirection,
    checkCircleCollision,
    isInsideArena
} from '../src/game-logic.js';

describe('Game Logic', () => {
  describe('distanceToSegment', () => {
    it('should return distance when point is perpendicular to segment', () => {
      // Point at (0, 5), segment from (-10, 0) to (10, 0)
      const distance = distanceToSegment(0, 5, -10, 0, 10, 0);
      expect(distance).toBeCloseTo(5, 5);
    });

    it('should return distance to endpoint when point is beyond segment', () => {
      // Point at (15, 0), segment from (0, 0) to (10, 0)
      const distance = distanceToSegment(15, 0, 0, 0, 10, 0);
      expect(distance).toBeCloseTo(5, 5);
    });

    it('should return distance to start endpoint when point is before segment', () => {
      // Point at (-5, 0), segment from (0, 0) to (10, 0)
      const distance = distanceToSegment(-5, 0, 0, 0, 10, 0);
      expect(distance).toBeCloseTo(5, 5);
    });

    it('should handle zero-length segment', () => {
      // Point at (3, 4), segment is a single point at (0, 0)
      const distance = distanceToSegment(3, 4, 0, 0, 0, 0);
      expect(distance).toBeCloseTo(5, 5);
    });

    it('should populate outClosest with the closest point on segment', () => {
      const outClosest = {};
      distanceToSegment(0, 5, -10, 0, 10, 0, outClosest);
      expect(outClosest.x).toBeCloseTo(0, 5);
      expect(outClosest.z).toBeCloseTo(0, 5);
    });

    it('should handle diagonal segments', () => {
      // Point at (0, 0), segment from (0, 10) to (10, 0)
      const distance = distanceToSegment(0, 0, 0, 10, 10, 0);
      expect(distance).toBeCloseTo(7.07, 2); // sqrt(50)
    });

    // TODO: Add more edge case tests
    // - Point exactly on the segment
    // - Very small segments
    // - Negative coordinates
  });

  describe('normalize', () => {
    it('should normalize a vector to unit length', () => {
      const result = normalize(3, 4);
      expect(result.x).toBeCloseTo(0.6, 5);
      expect(result.z).toBeCloseTo(0.8, 5);
      expect(Math.sqrt(result.x ** 2 + result.z ** 2)).toBeCloseTo(1, 5);
    });

    it('should handle already normalized vectors', () => {
      const result = normalize(1, 0);
      expect(result.x).toBeCloseTo(1, 5);
      expect(result.z).toBeCloseTo(0, 5);
    });

    it('should handle negative components', () => {
      const result = normalize(-3, -4);
      expect(result.x).toBeCloseTo(-0.6, 5);
      expect(result.z).toBeCloseTo(-0.8, 5);
    });

    it('should return default direction for zero vector', () => {
      const result = normalize(0, 0);
      expect(result.x).toBe(1);
      expect(result.z).toBe(0);
    });

    it('should handle pure X vectors', () => {
      const result = normalize(5, 0);
      expect(result.x).toBeCloseTo(1, 5);
      expect(result.z).toBeCloseTo(0, 5);
    });

    it('should handle pure Z vectors', () => {
      const result = normalize(0, -7);
      expect(result.x).toBeCloseTo(0, 5);
      expect(result.z).toBeCloseTo(-1, 5);
    });

    // TODO: Add tests for very small vectors (near-zero but not zero)
  });

  describe('rotateDirection', () => {
    it('should rotate a vector by 90 degrees (PI/2 radians)', () => {
      const result = rotateDirection(1, 0, Math.PI / 2);
      expect(result.x).toBeCloseTo(0, 5);
      expect(result.z).toBeCloseTo(-1, 5);
    });

    it('should rotate a vector by -90 degrees (-PI/2 radians)', () => {
      const result = rotateDirection(1, 0, -Math.PI / 2);
      expect(result.x).toBeCloseTo(0, 5);
      expect(result.z).toBeCloseTo(1, 5);
    });

    it('should rotate a vector by 180 degrees (PI radians)', () => {
      const result = rotateDirection(1, 0, Math.PI);
      expect(result.x).toBeCloseTo(-1, 5);
      expect(result.z).toBeCloseTo(0, 5);
    });

    it('should preserve vector length after rotation', () => {
      const original = { x: 3, z: 4 };
      const result = rotateDirection(original.x, original.z, Math.PI / 4);
      const originalLen = Math.sqrt(original.x ** 2 + original.z ** 2);
      const resultLen = Math.sqrt(result.x ** 2 + result.z ** 2);
      expect(resultLen).toBeCloseTo(originalLen, 5);
    });

    it('should handle zero rotation', () => {
      const result = rotateDirection(0.6, 0.8, 0);
      expect(result.x).toBeCloseTo(0.6, 5);
      expect(result.z).toBeCloseTo(0.8, 5);
    });

    it('should handle rotation of downward direction', () => {
      // Starting direction (0, -1) - facing down
      const result = rotateDirection(0, -1, Math.PI / 2);
      expect(result.x).toBeCloseTo(-1, 5);
      expect(result.z).toBeCloseTo(0, 5);
    });

    // TODO: Add tests for various angles and starting directions
  });

  describe('checkCircleCollision', () => {
    it('should detect collision when circles overlap', () => {
      const result = checkCircleCollision(0, 0, 5, 3, 0, 5);
      expect(result).toBe(true);
    });

    it('should not detect collision when circles are separate', () => {
      const result = checkCircleCollision(0, 0, 5, 20, 0, 5);
      expect(result).toBe(false);
    });

    it('should detect collision when circles touch exactly', () => {
      const result = checkCircleCollision(0, 0, 5, 10, 0, 5);
      expect(result).toBe(false); // Touching is not colliding (< not <=)
    });

    it('should handle different sized circles', () => {
      const result = checkCircleCollision(0, 0, 10, 5, 0, 3);
      expect(result).toBe(true);
    });

    it('should handle concentric circles', () => {
      const result = checkCircleCollision(0, 0, 10, 0, 0, 3);
      expect(result).toBe(true);
    });

    // TODO: Add tests for edge cases
  });

  describe('isInsideArena', () => {
    it('should return true for point inside arena', () => {
      expect(isInsideArena(0, 0)).toBe(true);
      expect(isInsideArena(100, 100)).toBe(true);
      expect(isInsideArena(-100, -100)).toBe(true);
    });

    it('should return true for point on boundary', () => {
      expect(isInsideArena(200, 0)).toBe(true);
      expect(isInsideArena(-200, 0)).toBe(true);
      expect(isInsideArena(0, 200)).toBe(true);
      expect(isInsideArena(0, -200)).toBe(true);
    });

    it('should return false for point outside arena', () => {
      expect(isInsideArena(201, 0)).toBe(false);
      expect(isInsideArena(-201, 0)).toBe(false);
      expect(isInsideArena(0, 201)).toBe(false);
      expect(isInsideArena(0, -201)).toBe(false);
    });

    it('should handle custom arena size', () => {
      expect(isInsideArena(50, 50, 100)).toBe(true);
      expect(isInsideArena(101, 0, 100)).toBe(false);
    });

    // TODO: Add tests for corner cases
  });

  // TODO: Add integration tests for combined game logic
  // - Full collision detection cycle
  // - Trail collision scenarios
  // - Arena boundary collision
  // - Player-to-player collision
});
