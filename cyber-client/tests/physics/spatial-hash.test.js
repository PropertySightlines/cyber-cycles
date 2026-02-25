/**
 * SpatialHash Tests for Cyber Cycles
 *
 * Tests for the spatial hash grid system:
 * - Basic insert/remove operations
 * - Position updates
 * - Range queries (empty, single, multiple results)
 * - Edge cases (boundaries, overlapping cells)
 * - Performance with 1000+ entities
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SpatialHash, createSpatialHash } from '../../src/core/SpatialHash.js';

describe('SpatialHash', () => {
    describe('Constructor', () => {
        it('should create with default cell size of 5.0', () => {
            const hash = new SpatialHash();
            expect(hash.cellSize).toBe(5.0);
        });

        it('should create with custom cell size', () => {
            const hash = new SpatialHash(10.0);
            expect(hash.cellSize).toBe(10.0);
        });

        it('should throw error for non-positive cell size', () => {
            expect(() => new SpatialHash(0)).toThrow('Cell size must be positive');
            expect(() => new SpatialHash(-5)).toThrow('Cell size must be positive');
        });

        it('should create empty grid initially', () => {
            const hash = new SpatialHash();
            expect(hash.size()).toBe(0);
            expect(hash.cellCount()).toBe(0);
        });

        it('should create via factory function', () => {
            const hash = createSpatialHash(7.5);
            expect(hash.cellSize).toBe(7.5);
            expect(hash).toBeInstanceOf(SpatialHash);
        });
    });

    describe('Insert Operations', () => {
        let hash;

        beforeEach(() => {
            hash = new SpatialHash(5.0);
        });

        it('should insert entity at position', () => {
            const result = hash.insert('entity1', 10, 20);
            expect(result).toBe(true);
            expect(hash.size()).toBe(1);
        });

        it('should insert multiple entities', () => {
            hash.insert('entity1', 10, 20);
            hash.insert('entity2', 15, 25);
            hash.insert('entity3', 100, 200);
            expect(hash.size()).toBe(3);
        });

        it('should handle numeric entity IDs', () => {
            hash.insert(1, 10, 20);
            hash.insert(2, 15, 25);
            expect(hash.size()).toBe(2);
            expect(hash.has(1)).toBe(true);
            expect(hash.has(2)).toBe(true);
        });

        it('should throw error for null entity ID', () => {
            expect(() => hash.insert(null, 10, 20)).toThrow('Entity ID cannot be null or undefined');
        });

        it('should throw error for undefined entity ID', () => {
            expect(() => hash.insert(undefined, 10, 20)).toThrow('Entity ID cannot be null or undefined');
        });

        it('should handle negative coordinates', () => {
            hash.insert('entity1', -10, -20);
            expect(hash.size()).toBe(1);
            expect(hash.has('entity1')).toBe(true);
        });

        it('should handle zero coordinates', () => {
            hash.insert('entity1', 0, 0);
            expect(hash.size()).toBe(1);
            expect(hash.has('entity1')).toBe(true);
        });

        it('should handle floating point coordinates', () => {
            hash.insert('entity1', 10.5, 20.7);
            expect(hash.size()).toBe(1);
            const pos = hash.getPosition('entity1');
            expect(pos.x).toBe(10.5);
            expect(pos.z).toBe(20.7);
        });

        it('should place entities in correct cells', () => {
            // Cell size is 5.0
            // Position (10, 20) should be in cell (2, 4)
            // Position (12, 22) should also be in cell (2, 4)
            hash.insert('entity1', 10, 20);
            hash.insert('entity2', 12, 22);
            expect(hash.cellCount()).toBe(1); // Same cell
        });

        it('should place entities in different cells when far apart', () => {
            hash.insert('entity1', 0, 0);
            hash.insert('entity2', 50, 50);
            expect(hash.cellCount()).toBe(2); // Different cells
        });

        it('should update position when inserting existing entity', () => {
            hash.insert('entity1', 10, 20);
            hash.insert('entity1', 30, 40); // Should update, not duplicate
            expect(hash.size()).toBe(1);
            const pos = hash.getPosition('entity1');
            expect(pos.x).toBe(30);
            expect(pos.z).toBe(40);
        });
    });

    describe('Remove Operations', () => {
        let hash;

        beforeEach(() => {
            hash = new SpatialHash(5.0);
            hash.insert('entity1', 10, 20);
            hash.insert('entity2', 15, 25);
            hash.insert('entity3', 100, 200);
        });

        it('should remove existing entity', () => {
            const result = hash.remove('entity1');
            expect(result).toBe(true);
            expect(hash.size()).toBe(2);
            expect(hash.has('entity1')).toBe(false);
        });

        it('should return false for non-existent entity', () => {
            const result = hash.remove('nonexistent');
            expect(result).toBe(false);
        });

        it('should clean up empty cells', () => {
            hash.remove('entity3'); // entity3 is alone in its cell
            expect(hash.cellCount()).toBe(2); // One cell should be removed
        });

        it('should not remove other entities from same cell', () => {
            hash.remove('entity1');
            expect(hash.has('entity2')).toBe(true);
        });

        it('should handle removing all entities', () => {
            hash.remove('entity1');
            hash.remove('entity2');
            hash.remove('entity3');
            expect(hash.size()).toBe(0);
            expect(hash.cellCount()).toBe(0);
        });
    });

    describe('Update Operations', () => {
        let hash;

        beforeEach(() => {
            hash = new SpatialHash(5.0);
            hash.insert('entity1', 10, 20);
        });

        it('should update entity position within same cell', () => {
            const result = hash.update('entity1', 11, 21);
            expect(result).toBe(true);
            const pos = hash.getPosition('entity1');
            expect(pos.x).toBe(11);
            expect(pos.z).toBe(21);
            expect(hash.size()).toBe(1);
        });

        it('should update entity position to different cell', () => {
            const result = hash.update('entity1', 50, 50);
            expect(result).toBe(true);
            const pos = hash.getPosition('entity1');
            expect(pos.x).toBe(50);
            expect(pos.z).toBe(50);
        });

        it('should return false for non-existent entity', () => {
            const result = hash.update('nonexistent', 50, 50);
            expect(result).toBe(false);
        });

        it('should move entity between cells correctly', () => {
            hash.insert('entity2', 10, 20); // Same cell as entity1
            hash.update('entity1', 100, 100); // Move to different cell
            
            expect(hash.cellCount()).toBe(2);
            expect(hash.has('entity1')).toBe(true);
            expect(hash.has('entity2')).toBe(true);
        });

        it('should handle multiple updates', () => {
            hash.update('entity1', 20, 30);
            hash.update('entity1', 40, 50);
            hash.update('entity1', 60, 70);
            
            const pos = hash.getPosition('entity1');
            expect(pos.x).toBe(60);
            expect(pos.z).toBe(70);
        });

        it('should handle update across cell boundaries', () => {
            // Start at edge of cell (9.9, 9.9) -> cell (1, 1)
            hash.insert('entity2', 9.9, 9.9);
            // Move to next cell (10.1, 10.1) -> cell (2, 2)
            hash.update('entity2', 10.1, 10.1);
            
            const pos = hash.getPosition('entity2');
            expect(pos.x).toBe(10.1);
            expect(pos.z).toBe(10.1);
        });
    });

    describe('Range Queries', () => {
        let hash;

        beforeEach(() => {
            hash = new SpatialHash(5.0);
        });

        it('should return empty array for empty grid', () => {
            const results = hash.queryRange(0, 0, 10);
            expect(results).toEqual([]);
        });

        it('should return empty array when no entities in range', () => {
            hash.insert('entity1', 100, 100);
            const results = hash.queryRange(0, 0, 10);
            expect(results).toEqual([]);
        });

        it('should return single entity in range', () => {
            hash.insert('entity1', 5, 5);
            const results = hash.queryRange(5, 5, 10);
            expect(results).toHaveLength(1);
            expect(results[0].id).toBe('entity1');
        });

        it('should return multiple entities in range', () => {
            hash.insert('entity1', 5, 5);
            hash.insert('entity2', 7, 7);
            hash.insert('entity3', 10, 10);
            
            const results = hash.queryRange(5, 5, 10);
            expect(results.length).toBeGreaterThanOrEqual(2);
        });

        it('should include distance in results', () => {
            hash.insert('entity1', 3, 4); // Distance 5 from origin
            const results = hash.queryRange(0, 0, 10);
            expect(results[0].distance).toBeCloseTo(5, 5);
        });

        it('should sort results by distance', () => {
            hash.insert('far', 100, 100);
            hash.insert('close', 5, 5);
            hash.insert('medium', 50, 50);
            
            const results = hash.queryRange(0, 0, 200);
            expect(results[0].id).toBe('close');
            expect(results[1].id).toBe('medium');
            expect(results[2].id).toBe('far');
        });

        it('should respect radius boundary', () => {
            hash.insert('inside', 3, 4); // Distance 5
            hash.insert('outside', 10, 10); // Distance ~14.14
            
            const results = hash.queryRange(0, 0, 5);
            expect(results.map(r => r.id)).toContain('inside');
            expect(results.map(r => r.id)).not.toContain('outside');
        });

        it('should handle zero radius', () => {
            hash.insert('exact', 0, 0);
            hash.insert('nearby', 0.1, 0.1);
            
            const results = hash.queryRange(0, 0, 0);
            expect(results.map(r => r.id)).toContain('exact');
            expect(results.map(r => r.id)).not.toContain('nearby');
        });

        it('should query across cell boundaries', () => {
            // Place entities in adjacent cells
            hash.insert('center', 0, 0);
            hash.insert('right', 6, 0);
            hash.insert('left', -6, 0);
            hash.insert('up', 0, 6);
            hash.insert('down', 0, -6);
            
            const results = hash.queryRange(0, 0, 10);
            expect(results.length).toBe(5);
        });

        it('should check 3x3 grid of cells', () => {
            // Place entities in all 9 cells around center
            const positions = [
                [-6, -6], [-6, 0], [-6, 6],
                [0, -6], [0, 0], [0, 6],
                [6, -6], [6, 0], [6, 6]
            ];
            
            positions.forEach(([x, z], i) => {
                hash.insert(`entity${i}`, x, z);
            });
            
            const results = hash.queryRange(0, 0, 10);
            expect(results.length).toBe(9);
        });

        it('should not find entities beyond 3x3 grid even with large radius', () => {
            // This tests the cell-based optimization
            hash.insert('center', 0, 0);
            hash.insert('far', 100, 0); // Far outside 3x3 grid
            
            // Even with large radius, far entity won't be found due to cell optimization
            // This is expected behavior - the 3x3 grid check is an optimization
            const results = hash.queryRange(0, 0, 10);
            expect(results.map(r => r.id)).not.toContain('far');
        });

        it('should handle query at negative coordinates', () => {
            hash.insert('entity1', -10, -10);
            hash.insert('entity2', -12, -12);
            
            const results = hash.queryRange(-10, -10, 5);
            expect(results.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('QueryIds Method', () => {
        let hash;

        beforeEach(() => {
            hash = new SpatialHash(5.0);
            hash.insert('entity1', 5, 5);
            hash.insert('entity2', 7, 7);
            hash.insert('entity3', 100, 100);
        });

        it('should return array of IDs only', () => {
            const results = hash.queryIds(5, 5, 10);
            expect(results).toEqual(expect.arrayContaining(['entity1', 'entity2']));
            expect(results).not.toContain('entity3');
        });

        it('should return empty array for no matches', () => {
            const results = hash.queryIds(0, 0, 1);
            expect(results).toEqual([]);
        });
    });

    describe('Has and GetPosition Methods', () => {
        let hash;

        beforeEach(() => {
            hash = new SpatialHash(5.0);
        });

        it('should return true for existing entity', () => {
            hash.insert('entity1', 10, 20);
            expect(hash.has('entity1')).toBe(true);
        });

        it('should return false for non-existent entity', () => {
            expect(hash.has('nonexistent')).toBe(false);
        });

        it('should return position for existing entity', () => {
            hash.insert('entity1', 10, 20);
            const pos = hash.getPosition('entity1');
            expect(pos).toEqual({ x: 10, z: 20 });
        });

        it('should return null for non-existent entity position', () => {
            const pos = hash.getPosition('nonexistent');
            expect(pos).toBeNull();
        });
    });

    describe('Size and CellCount Methods', () => {
        let hash;

        beforeEach(() => {
            hash = new SpatialHash(5.0);
        });

        it('should return 0 for empty grid', () => {
            expect(hash.size()).toBe(0);
            expect(hash.cellCount()).toBe(0);
        });

        it('should count entities correctly', () => {
            hash.insert('entity1', 0, 0);
            hash.insert('entity2', 5, 5);
            hash.insert('entity3', 10, 10);
            expect(hash.size()).toBe(3);
        });

        it('should count cells correctly', () => {
            hash.insert('entity1', 0, 0);
            hash.insert('entity2', 1, 1); // Same cell
            hash.insert('entity3', 100, 100); // Different cell
            expect(hash.cellCount()).toBe(2);
        });
    });

    describe('Clear Method', () => {
        let hash;

        beforeEach(() => {
            hash = new SpatialHash(5.0);
            hash.insert('entity1', 0, 0);
            hash.insert('entity2', 5, 5);
            hash.insert('entity3', 10, 10);
        });

        it('should remove all entities', () => {
            hash.clear();
            expect(hash.size()).toBe(0);
        });

        it('should remove all cells', () => {
            hash.clear();
            expect(hash.cellCount()).toBe(0);
        });

        it('should allow re-insertion after clear', () => {
            hash.clear();
            hash.insert('newEntity', 50, 50);
            expect(hash.size()).toBe(1);
            expect(hash.has('newEntity')).toBe(true);
        });
    });

    describe('GetCellEntities Method', () => {
        let hash;

        beforeEach(() => {
            hash = new SpatialHash(5.0);
        });

        it('should return entities in specified cell', () => {
            hash.insert('entity1', 10, 20); // Cell (2, 4)
            hash.insert('entity2', 11, 21); // Same cell
            hash.insert('entity3', 50, 50); // Different cell
            
            const entities = hash.getCellEntities(2, 4);
            expect(entities).toEqual(expect.arrayContaining(['entity1', 'entity2']));
        });

        it('should return empty array for empty cell', () => {
            const entities = hash.getCellEntities(0, 0);
            expect(entities).toEqual([]);
        });
    });

    describe('Debug Methods', () => {
        let hash;

        beforeEach(() => {
            hash = new SpatialHash(5.0);
        });

        it('should return debug info', () => {
            hash.insert('entity1', 0, 0);
            hash.insert('entity2', 5, 5);
            hash.insert('entity3', 5, 5);
            
            const info = hash.getDebugInfo();
            expect(info.entityCount).toBe(3);
            expect(info.cellSize).toBe(5.0);
            expect(info.cellCount).toBe(2);
        });

        it('should return visualization string', () => {
            hash.insert('entity1', 0, 0);
            hash.insert('entity2', 5, 5);
            
            const viz = hash.debugVisualize(-10, 10, -10, 10);
            expect(typeof viz).toBe('string');
            expect(viz).toContain('Spatial Hash Grid Visualization');
        });
    });

    describe('Export and Import', () => {
        let hash;

        beforeEach(() => {
            hash = new SpatialHash(5.0);
        });

        it('should export entities', () => {
            hash.insert('entity1', 10, 20);
            hash.insert('entity2', 30, 40);
            
            const data = hash.export();
            expect(data.cellSize).toBe(5.0);
            expect(data.entities).toHaveLength(2);
        });

        it('should import entities', () => {
            const data = {
                cellSize: 5.0,
                entities: [
                    { id: 'entity1', x: 10, z: 20 },
                    { id: 'entity2', x: 30, z: 40 }
                ]
            };
            
            hash.import(data);
            expect(hash.size()).toBe(2);
            expect(hash.has('entity1')).toBe(true);
            expect(hash.has('entity2')).toBe(true);
        });

        it('should round-trip export/import', () => {
            hash.insert('entity1', 10, 20);
            hash.insert('entity2', 30, 40);
            
            const data = hash.export();
            const newHash = new SpatialHash();
            newHash.import(data);
            
            expect(newHash.size()).toBe(2);
            expect(newHash.getPosition('entity1')).toEqual({ x: 10, z: 20 });
        });
    });

    describe('Edge Cases', () => {
        let hash;

        beforeEach(() => {
            hash = new SpatialHash(5.0);
        });

        it('should handle entity at cell boundary', () => {
            hash.insert('boundary', 5.0, 5.0); // Exactly on boundary
            expect(hash.has('boundary')).toBe(true);
        });

        it('should handle very large coordinates', () => {
            hash.insert('large', 1000000, 1000000);
            expect(hash.has('large')).toBe(true);
        });

        it('should handle very small coordinates', () => {
            hash.insert('small', 0.001, 0.001);
            expect(hash.has('small')).toBe(true);
        });

        it('should handle entities at same position', () => {
            hash.insert('entity1', 10, 10);
            hash.insert('entity2', 10, 10);
            expect(hash.size()).toBe(2);
            
            const results = hash.queryRange(10, 10, 1);
            expect(results.length).toBe(2);
        });

        it('should handle special string IDs', () => {
            hash.insert('player:123', 10, 10);
            hash.insert('entity-with-dash', 15, 15);
            hash.insert('entity_with_underscore', 20, 20);
            expect(hash.size()).toBe(3);
        });
    });

    describe('Performance Tests', () => {
        it('should handle 1000+ entities efficiently', () => {
            const hash = new SpatialHash(5.0);
            const entityCount = 1000;
            
            // Insert 1000 entities
            for (let i = 0; i < entityCount; i++) {
                hash.insert(`entity${i}`, Math.random() * 500, Math.random() * 500);
            }
            
            expect(hash.size()).toBe(entityCount);
        });

        it('should perform range queries efficiently with many entities', () => {
            const hash = new SpatialHash(5.0);
            const entityCount = 1000;
            
            // Insert 1000 entities
            for (let i = 0; i < entityCount; i++) {
                hash.insert(`entity${i}`, Math.random() * 500, Math.random() * 500);
            }
            
            // Query should be fast (not O(n))
            const startTime = performance.now();
            const results = hash.queryRange(250, 250, 50);
            const endTime = performance.now();
            
            expect(endTime - startTime).toBeLessThan(100); // Should complete in < 100ms
            expect(Array.isArray(results)).toBe(true);
        });

        it('should handle rapid insert/remove cycles', () => {
            const hash = new SpatialHash(5.0);
            const iterations = 500;
            
            for (let i = 0; i < iterations; i++) {
                hash.insert(`entity${i}`, i * 10, i * 10);
                hash.remove(`entity${i}`);
            }
            
            expect(hash.size()).toBe(0);
        });

        it('should handle many entities in same cell', () => {
            const hash = new SpatialHash(5.0);
            const entityCount = 100;
            
            // Insert 100 entities in same cell
            for (let i = 0; i < entityCount; i++) {
                hash.insert(`entity${i}`, 2.5, 2.5); // All in cell (0, 0)
            }
            
            expect(hash.size()).toBe(entityCount);
            expect(hash.cellCount()).toBe(1);
            
            const results = hash.queryRange(2.5, 2.5, 10);
            expect(results.length).toBe(entityCount);
        });

        it('should maintain performance with sparse distribution', () => {
            const hash = new SpatialHash(5.0);
            const entityCount = 1000;
            
            // Insert entities spread across large area
            for (let i = 0; i < entityCount; i++) {
                hash.insert(`entity${i}`, i * 100, i * 100);
            }
            
            expect(hash.size()).toBe(entityCount);
            expect(hash.cellCount()).toBe(entityCount); // Each in own cell
            
            // Query should still be fast
            const startTime = performance.now();
            const results = hash.queryRange(0, 0, 10);
            const endTime = performance.now();
            
            expect(endTime - startTime).toBeLessThan(50);
            expect(results.length).toBe(1); // Only entity0
        });
    });

    describe('Integration with Game Mechanics', () => {
        it('should work with player-like entity IDs', () => {
            const hash = new SpatialHash(5.0);
            
            // Simulate player entities
            hash.insert('player_1', 0, 0);
            hash.insert('player_2', 10, 10);
            hash.insert('player_3', 20, 20);
            
            const nearby = hash.queryRange(5, 5, 15);
            expect(nearby.map(p => p.id)).toEqual(expect.arrayContaining(['player_1', 'player_2']));
        });

        it('should support collision detection use case', () => {
            const hash = new SpatialHash(5.0);
            
            // Insert player and obstacles
            hash.insert('player', 50, 50);
            hash.insert('obstacle_1', 52, 52);
            hash.insert('obstacle_2', 55, 55);
            hash.insert('obstacle_far', 200, 200);
            
            // Query for nearby obstacles
            const nearby = hash.queryRange(50, 50, 10);
            const obstacleIds = nearby.filter(p => p.id.startsWith('obstacle')).map(p => p.id);
            
            expect(obstacleIds).toContain('obstacle_1');
            expect(obstacleIds).toContain('obstacle_2');
            expect(obstacleIds).not.toContain('obstacle_far');
        });
    });
});
