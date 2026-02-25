/**
 * Utility Functions Tests for Cyber Cycles
 *
 * Tests for helper and utility functions:
 * - Player cloning and serialization
 * - Configuration application
 * - Color and hex utilities
 * - JSON parsing helpers
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    clonePlayer,
    colorToHex,
    parseTurnPoints,
    serializeTurnPoints,
    generateSpawnPosition,
    distance,
    lerp
} from '../src/game-logic.js';

describe('Utility Functions', () => {
  describe('clonePlayer', () => {
    it('should clone a valid player object', () => {
      const input = {
        id: "player1",
        owner_id: "owner123",
        x: 100,
        z: 50,
        dir_x: 0,
        dir_z: -1,
        speed: 40,
        color: 0xff0000,
        alive: true,
        ready: true
      };
      const result = clonePlayer(input);
      expect(result.id).toBe("player1");
      expect(result.x).toBe(100);
      expect(result.z).toBe(50);
      expect(result.alive).toBe(true);
      expect(result.ready).toBe(true);
    });

    it('should handle null input', () => {
      expect(clonePlayer(null)).toBe(null);
    });

    it('should handle undefined input', () => {
      expect(clonePlayer(undefined)).toBe(null);
    });

    it('should parse turnPointsJson correctly', () => {
      const input = {
        id: "player1",
        turn_points_json: '[{"x": 10, "z": 20}, {"x": 30, "z": 40}]'
      };
      const result = clonePlayer(input);
      expect(result.turnPoints).toHaveLength(2);
      expect(result.turnPoints[0].x).toBe(10);
      expect(result.turnPoints[0].z).toBe(20);
    });

    it('should handle invalid turnPointsJson gracefully', () => {
      const input = {
        id: "player1",
        turn_points_json: 'invalid json'
      };
      const result = clonePlayer(input);
      expect(result.turnPoints).toEqual([]);
    });

    it('should handle missing turnPointsJson', () => {
      const input = { id: "player1" };
      const result = clonePlayer(input);
      expect(result.turnPoints).toEqual([]);
    });

    it('should default alive to true when not specified', () => {
      const input = { id: "player1" };
      const result = clonePlayer(input);
      expect(result.alive).toBe(true);
    });

    it('should handle camelCase field names', () => {
      const input = {
        id: "player1",
        ownerId: "owner123",
        dirX: 1,
        dirZ: 0,
        isBraking: true,
        isAi: true
      };
      const result = clonePlayer(input);
      expect(result.owner_id).toBe("owner123");
      expect(result.dir_x).toBe(1);
      expect(result.dir_z).toBe(0);
      expect(result.is_braking).toBe(true);
      expect(result.is_ai).toBe(true);
    });

    it('should initialize lastTrailPoint from position', () => {
      const input = { id: "player1", x: 50, z: -30 };
      const result = clonePlayer(input);
      expect(result.lastTrailPoint.x).toBe(50);
      expect(result.lastTrailPoint.z).toBe(-30);
    });

    it('should initialize distanceSinceLastPoint to 0', () => {
      const input = { id: "player1" };
      const result = clonePlayer(input);
      expect(result.distanceSinceLastPoint).toBe(0);
    });

    // TODO: Add tests for personality field
    // TODO: Add tests for is_turning_left/right fields
  });

  describe('colorToHex', () => {
    it('should convert color number to hex string', () => {
      expect(colorToHex(0xff0000)).toBe('#ff0000');
      expect(colorToHex(0x00ff00)).toBe('#00ff00');
      expect(colorToHex(0x0000ff)).toBe('#0000ff');
    });

    it('should pad hex values to 6 digits', () => {
      expect(colorToHex(0xff)).toBe('#0000ff');
      expect(colorToHex(0x00ff)).toBe('#0000ff');
    });

    it('should handle white color', () => {
      expect(colorToHex(0xffffff)).toBe('#ffffff');
    });

    it('should handle black color', () => {
      expect(colorToHex(0x000000)).toBe('#000000');
    });

    // TODO: Add tests for edge cases
  });

  describe('parseTurnPoints', () => {
    it('should parse valid JSON array', () => {
      const json = '[{"x": 1, "z": 2}, {"x": 3, "z": 4}]';
      const result = parseTurnPoints(json);
      expect(result).toHaveLength(2);
      expect(result[0].x).toBe(1);
    });

    it('should return empty array for null', () => {
      expect(parseTurnPoints(null)).toEqual([]);
    });

    it('should return empty array for empty string', () => {
      expect(parseTurnPoints("")).toEqual([]);
    });

    it('should return empty array for invalid JSON', () => {
      expect(parseTurnPoints("not json")).toEqual([]);
    });

    it('should return empty array for undefined', () => {
      expect(parseTurnPoints(undefined)).toEqual([]);
    });

    // TODO: Add tests for nested structures
  });

  describe('serializeTurnPoints', () => {
    it('should serialize array to JSON string', () => {
      const points = [{ x: 1, z: 2 }, { x: 3, z: 4 }];
      const result = serializeTurnPoints(points);
      expect(JSON.parse(result)).toEqual(points);
    });

    it('should handle empty array', () => {
      const result = serializeTurnPoints([]);
      expect(result).toBe('[]');
    });

    it('should handle null input', () => {
      const result = serializeTurnPoints(null);
      expect(result).toBe('[]');
    });

    it('should handle undefined input', () => {
      const result = serializeTurnPoints(undefined);
      expect(result).toBe('[]');
    });

    // TODO: Add tests for large arrays
  });

  describe('generateSpawnPosition', () => {
    it('should return object with x and z properties', () => {
      const result = generateSpawnPosition();
      expect(result).toHaveProperty('x');
      expect(result).toHaveProperty('z');
      expect(typeof result.x).toBe('number');
      expect(typeof result.z).toBe('number');
    });

    it('should generate position within arena bounds', () => {
      const arenaSize = 200;
      const result = generateSpawnPosition(arenaSize);
      expect(Math.abs(result.x)).toBeLessThanOrEqual(arenaSize);
      expect(Math.abs(result.z)).toBeLessThanOrEqual(arenaSize);
    });

    it('should respect minimum spawn radius', () => {
      const minRadius = 50;
      const result = generateSpawnPosition(200, minRadius);
      const distanceFromCenter = Math.hypot(result.x, result.z);
      expect(distanceFromCenter).toBeGreaterThanOrEqual(minRadius);
    });

    it('should generate different positions on multiple calls', () => {
      const positions = new Set();
      for (let i = 0; i < 10; i++) {
        const pos = generateSpawnPosition();
        positions.add(`${pos.x},${pos.z}`);
      }
      // With random generation, we should get mostly unique positions
      expect(positions.size).toBeGreaterThan(5);
    });

    // TODO: Add test for spawn distribution (uniformity)
  });

  describe('distance', () => {
    it('should calculate Euclidean distance', () => {
      expect(distance(0, 0, 3, 4)).toBeCloseTo(5, 5);
    });

    it('should return 0 for same point', () => {
      expect(distance(5, 5, 5, 5)).toBe(0);
    });

    it('should handle negative coordinates', () => {
      expect(distance(-3, -4, 0, 0)).toBeCloseTo(5, 5);
    });

    it('should be symmetric', () => {
      const d1 = distance(10, 20, 30, 40);
      const d2 = distance(30, 40, 10, 20);
      expect(d1).toBe(d2);
    });

    // TODO: Add tests for edge cases
  });

  describe('lerp', () => {
    it('should return start value at t=0', () => {
      expect(lerp(10, 20, 0)).toBe(10);
    });

    it('should return end value at t=1', () => {
      expect(lerp(10, 20, 1)).toBe(20);
    });

    it('should return midpoint at t=0.5', () => {
      expect(lerp(10, 20, 0.5)).toBe(15);
    });

    it('should clamp t to [0, 1] range', () => {
      expect(lerp(10, 20, -1)).toBe(10);
      expect(lerp(10, 20, 2)).toBe(20);
    });

    it('should handle negative values', () => {
      expect(lerp(-10, 10, 0.5)).toBe(0);
    });

    // TODO: Add tests for floating point precision
  });
});
