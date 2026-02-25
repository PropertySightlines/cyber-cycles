/**
 * EntityManager Tests for Cyber Cycles
 *
 * Comprehensive test suite for the EntityManager class:
 * - Entity creation/destruction (15 tests)
 * - Entity queries (15 tests)
 * - Component management (15 tests)
 * - Event system (10 tests)
 * - Edge cases (10 tests)
 * - Performance tests (5 tests)
 *
 * Total: 80 tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    EntityManager,
    createEntityManager,
    EntityEventType,
    EntityState
} from '../../src/core/EntityManager.js';

describe('EntityManager', () => {
    // ==================== Entity Creation/Destruction (15 tests) ====================
    describe('Entity Creation/Destruction', () => {
        let entityManager;

        beforeEach(() => {
            entityManager = new EntityManager();
        });

        it('should create new instance', () => {
            const em = new EntityManager();
            expect(em).toBeInstanceOf(EntityManager);
        });

        it('should create via factory function', () => {
            const em = createEntityManager();
            expect(em).toBeInstanceOf(EntityManager);
        });

        it('should create entity with type and return ID', () => {
            const id = entityManager.createEntity('player');
            expect(id).toBe(1);
            expect(typeof id).toBe('number');
        });

        it('should auto-increment entity IDs', () => {
            const id1 = entityManager.createEntity('player');
            const id2 = entityManager.createEntity('enemy');
            const id3 = entityManager.createEntity('obstacle');
            expect(id1).toBe(1);
            expect(id2).toBe(2);
            expect(id3).toBe(3);
        });

        it('should create entity with initial components', () => {
            const id = entityManager.createEntity('player', {
                position: { x: 0, y: 0, z: 0 },
                velocity: { x: 1, y: 0, z: 0 }
            });
            const entity = entityManager.getEntity(id);
            expect(entity.components.position).toEqual({ x: 0, y: 0, z: 0 });
            expect(entity.components.velocity).toEqual({ x: 1, y: 0, z: 0 });
        });

        it('should create entity with custom state', () => {
            const id = entityManager.createEntity('player', {}, EntityState.INACTIVE);
            const entity = entityManager.getEntity(id);
            expect(entity.state).toBe(EntityState.INACTIVE);
        });

        it('should throw error for empty type', () => {
            expect(() => entityManager.createEntity('')).toThrow('Entity type must be a non-empty string');
        });

        it('should throw error for non-string type', () => {
            expect(() => entityManager.createEntity(123)).toThrow('Entity type must be a non-empty string');
            expect(() => entityManager.createEntity(null)).toThrow('Entity type must be a non-empty string');
        });

        it('should destroy entity and return true', () => {
            const id = entityManager.createEntity('player');
            const result = entityManager.destroyEntity(id);
            expect(result).toBe(true);
            expect(entityManager.hasEntity(id)).toBe(false);
        });

        it('should return false when destroying non-existent entity', () => {
            const result = entityManager.destroyEntity(999);
            expect(result).toBe(false);
        });

        it('should get entity by ID', () => {
            const id = entityManager.createEntity('player', { health: { value: 100 } });
            const entity = entityManager.getEntity(id);
            expect(entity.id).toBe(id);
            expect(entity.type).toBe('player');
            expect(entity.components.health).toEqual({ value: 100 });
        });

        it('should return null for non-existent entity', () => {
            const entity = entityManager.getEntity(999);
            expect(entity).toBe(null);
        });

        it('should get all entities', () => {
            entityManager.createEntity('player');
            entityManager.createEntity('enemy');
            entityManager.createEntity('obstacle');
            const entities = entityManager.getAllEntities();
            expect(entities).toHaveLength(3);
        });

        it('should get entities by type', () => {
            entityManager.createEntity('player');
            entityManager.createEntity('player');
            entityManager.createEntity('enemy');
            const players = entityManager.getEntitiesByType('player');
            expect(players).toHaveLength(2);
        });

        it('should return empty array for non-existent type', () => {
            const entities = entityManager.getEntitiesByType('nonexistent');
            expect(entities).toEqual([]);
        });
    });

    // ==================== Entity Queries (15 tests) ====================
    describe('Entity Queries', () => {
        let entityManager;

        beforeEach(() => {
            entityManager = new EntityManager();
        });

        it('should get entities by component', () => {
            entityManager.createEntity('player', { position: { x: 0, y: 0 } });
            entityManager.createEntity('enemy', { position: { x: 10, y: 10 } });
            entityManager.createEntity('obstacle');
            const entities = entityManager.getEntitiesByComponent('position');
            expect(entities).toHaveLength(2);
        });

        it('should get entities by state', () => {
            entityManager.createEntity('player', {}, EntityState.ACTIVE);
            entityManager.createEntity('enemy', {}, EntityState.INACTIVE);
            entityManager.createEntity('obstacle', {}, EntityState.ACTIVE);
            const active = entityManager.getEntitiesByState(EntityState.ACTIVE);
            expect(active).toHaveLength(2);
        });

        it('should query with AND logic - all components must exist', () => {
            entityManager.createEntity('player', { position: {}, velocity: {}, health: {} });
            entityManager.createEntity('enemy', { position: {}, velocity: {} });
            entityManager.createEntity('obstacle', { position: {} });

            const result = entityManager.query(['position', 'velocity']);
            expect(result).toHaveLength(2);

            const result2 = entityManager.query(['position', 'velocity', 'health']);
            expect(result2).toHaveLength(1);
        });

        it('should query with OR logic - any component can exist', () => {
            entityManager.createEntity('player', { position: {} });
            entityManager.createEntity('enemy', { velocity: {} });
            entityManager.createEntity('obstacle', { health: {} });

            const result = entityManager.queryAny(['position', 'velocity']);
            expect(result).toHaveLength(2);
        });

        it('should query with type filter', () => {
            entityManager.createEntity('player', { position: {}, velocity: {} });
            entityManager.createEntity('enemy', { position: {}, velocity: {} });
            entityManager.createEntity('obstacle', { position: {} });

            const result = entityManager.query(['position'], { type: 'player' });
            expect(result).toHaveLength(1);
            expect(result[0].type).toBe('player');
        });

        it('should query with state filter', () => {
            entityManager.createEntity('player', {}, EntityState.ACTIVE);
            entityManager.createEntity('enemy', {}, EntityState.INACTIVE);

            const result = entityManager.query([], { state: EntityState.ACTIVE });
            expect(result).toHaveLength(1);
        });

        it('should query by component value', () => {
            entityManager.createEntity('player', { position: { x: 0, y: 0 } });
            entityManager.createEntity('enemy', { position: { x: 10, y: 10 } });
            entityManager.createEntity('obstacle', { position: { x: 0, y: 5 } });

            const result = entityManager.queryByComponentValue('position', { x: 0 });
            expect(result).toHaveLength(2);
        });

        it('should return empty array for query with non-existent component', () => {
            entityManager.createEntity('player', { position: {} });
            const result = entityManager.query(['nonexistent']);
            expect(result).toEqual([]);
        });

        it('should return empty array for queryAny with no matches', () => {
            entityManager.createEntity('player');
            const result = entityManager.queryAny(['nonexistent1', 'nonexistent2']);
            expect(result).toEqual([]);
        });

        it('should handle empty component array in query', () => {
            entityManager.createEntity('player');
            const result = entityManager.query([]);
            // Empty component array returns all entities (can be filtered by type/state)
            expect(result).toHaveLength(1);
        });

        it('should handle empty component array in queryAny', () => {
            entityManager.createEntity('player');
            const result = entityManager.queryAny([]);
            expect(result).toEqual([]);
        });

        it('should combine type and state filters in query', () => {
            entityManager.createEntity('player', { position: {} }, EntityState.ACTIVE);
            entityManager.createEntity('player', { position: {} }, EntityState.INACTIVE);
            entityManager.createEntity('enemy', { position: {} }, EntityState.ACTIVE);

            const result = entityManager.query(['position'], {
                type: 'player',
                state: EntityState.ACTIVE
            });
            expect(result).toHaveLength(1);
        });

        it('should combine type and state filters in queryAny', () => {
            entityManager.createEntity('player', { position: {} }, EntityState.ACTIVE);
            entityManager.createEntity('player', { velocity: {} }, EntityState.INACTIVE);
            entityManager.createEntity('enemy', { position: {} }, EntityState.ACTIVE);

            const result = entityManager.queryAny(['position', 'velocity'], {
                type: 'player'
            });
            expect(result).toHaveLength(2);
        });

        it('should query entities with multiple components correctly', () => {
            for (let i = 0; i < 10; i++) {
                entityManager.createEntity('player', {
                    position: { x: i, y: i },
                    velocity: { x: 1, y: 1 },
                    health: { value: 100 }
                });
            }
            entityManager.createEntity('enemy', { position: {} });

            const result = entityManager.query(['position', 'velocity', 'health']);
            expect(result).toHaveLength(10);
        });

        it('should handle query with type filter that has no entities', () => {
            entityManager.createEntity('player', { position: {} });
            const result = entityManager.query(['position'], { type: 'nonexistent' });
            expect(result).toEqual([]);
        });
    });

    // ==================== Component Management (15 tests) ====================
    describe('Component Management', () => {
        let entityManager;

        beforeEach(() => {
            entityManager = new EntityManager();
        });

        it('should add component to entity', () => {
            const id = entityManager.createEntity('player');
            const result = entityManager.addComponent(id, 'position', { x: 0, y: 0, z: 0 });
            expect(result).toBe(true);
            expect(entityManager.hasComponent(id, 'position')).toBe(true);
        });

        it('should return false when adding component to non-existent entity', () => {
            const result = entityManager.addComponent(999, 'position', {});
            expect(result).toBe(false);
        });

        it('should throw error for empty component name', () => {
            const id = entityManager.createEntity('player');
            expect(() => entityManager.addComponent(id, '', {})).toThrow('Component name must be a non-empty string');
        });

        it('should throw error for non-string component name', () => {
            const id = entityManager.createEntity('player');
            expect(() => entityManager.addComponent(id, 123, {})).toThrow('Component name must be a non-empty string');
        });

        it('should remove component from entity', () => {
            const id = entityManager.createEntity('player', { position: {} });
            const result = entityManager.removeComponent(id, 'position');
            expect(result).toBe(true);
            expect(entityManager.hasComponent(id, 'position')).toBe(false);
        });

        it('should return false when removing non-existent component', () => {
            const id = entityManager.createEntity('player');
            const result = entityManager.removeComponent(id, 'nonexistent');
            expect(result).toBe(false);
        });

        it('should return false when removing component from non-existent entity', () => {
            const result = entityManager.removeComponent(999, 'position');
            expect(result).toBe(false);
        });

        it('should get component from entity', () => {
            const id = entityManager.createEntity('player', { position: { x: 10, y: 20 } });
            const component = entityManager.getComponent(id, 'position');
            expect(component).toEqual({ x: 10, y: 20 });
        });

        it('should return null for non-existent component', () => {
            const id = entityManager.createEntity('player');
            const component = entityManager.getComponent(id, 'nonexistent');
            expect(component).toBe(null);
        });

        it('should return null when getting component from non-existent entity', () => {
            const component = entityManager.getComponent(999, 'position');
            expect(component).toBe(null);
        });

        it('should check if entity has component', () => {
            const id = entityManager.createEntity('player', { position: {} });
            expect(entityManager.hasComponent(id, 'position')).toBe(true);
            expect(entityManager.hasComponent(id, 'velocity')).toBe(false);
        });

        it('should return false when checking component on non-existent entity', () => {
            expect(entityManager.hasComponent(999, 'position')).toBe(false);
        });

        it('should update entity components', () => {
            const id = entityManager.createEntity('player', { position: { x: 0, y: 0 } });
            const result = entityManager.updateEntity(id, {
                position: { x: 10 },
                velocity: { x: 1, y: 1 }
            });
            expect(result).toBe(true);
            const entity = entityManager.getEntity(id);
            expect(entity.components.position).toEqual({ x: 10, y: 0 });
            expect(entity.components.velocity).toEqual({ x: 1, y: 1 });
        });

        it('should return false when updating non-existent entity', () => {
            const result = entityManager.updateEntity(999, { position: {} });
            expect(result).toBe(false);
        });

        it('should return component copy to prevent direct modification', () => {
            const id = entityManager.createEntity('player', { position: { x: 0, y: 0 } });
            const component = entityManager.getComponent(id, 'position');
            component.x = 999;
            const original = entityManager.getComponent(id, 'position');
            expect(original.x).toBe(0);
        });
    });

    // ==================== Event System (10 tests) ====================
    describe('Event System', () => {
        let entityManager;

        beforeEach(() => {
            entityManager = new EntityManager();
        });

        it('should emit entity created event', () => {
            const callback = vi.fn();
            entityManager.onEntityCreated(callback);
            entityManager.createEntity('player', { position: {} });
            expect(callback).toHaveBeenCalledTimes(1);
            const eventData = callback.mock.calls[0][0];
            expect(eventData.type).toBe('player');
            expect(eventData.entityId).toBe(1);
        });

        it('should emit entity destroyed event', () => {
            const callback = vi.fn();
            entityManager.onEntityDestroyed(callback);
            const id = entityManager.createEntity('player');
            entityManager.destroyEntity(id);
            expect(callback).toHaveBeenCalledTimes(1);
            const eventData = callback.mock.calls[0][0];
            expect(eventData.entityId).toBe(id);
        });

        it('should emit component added event', () => {
            const callback = vi.fn();
            entityManager.onComponentAdded(callback);
            const id = entityManager.createEntity('player');
            entityManager.addComponent(id, 'position', { x: 0, y: 0 });
            expect(callback).toHaveBeenCalledTimes(1);
            const eventData = callback.mock.calls[0][0];
            expect(eventData.entityId).toBe(id);
            expect(eventData.componentName).toBe('position');
        });

        it('should emit component removed event', () => {
            const callback = vi.fn();
            entityManager.onComponentRemoved(callback);
            const id = entityManager.createEntity('player', { position: {} });
            entityManager.removeComponent(id, 'position');
            expect(callback).toHaveBeenCalledTimes(1);
            const eventData = callback.mock.calls[0][0];
            expect(eventData.entityId).toBe(id);
            expect(eventData.componentName).toBe('position');
        });

        it('should emit component updated event', () => {
            const callback = vi.fn();
            entityManager.onComponentUpdated(callback);
            const id = entityManager.createEntity('player', { position: { x: 0 } });
            entityManager.updateEntity(id, { position: { x: 10 } });
            expect(callback).toHaveBeenCalled();
        });

        it('should emit entity updated event', () => {
            const callback = vi.fn();
            entityManager.onEntityUpdated(callback);
            const id = entityManager.createEntity('player', { position: {} });
            entityManager.updateEntity(id, { velocity: {} });
            expect(callback).toHaveBeenCalledTimes(1);
        });

        it('should emit custom entity event', () => {
            const callback = vi.fn();
            const id = entityManager.createEntity('player');
            entityManager.onEntityEvent(id, 'damage', callback);
            entityManager.emitEntityEvent(id, 'damage', { amount: 10 });
            expect(callback).toHaveBeenCalledTimes(1);
            const eventData = callback.mock.calls[0][0];
            expect(eventData.entityId).toBe(id);
            expect(eventData.event).toBe('damage');
            expect(eventData.data).toEqual({ amount: 10 });
        });

        it('should allow unsubscribing from events', () => {
            const callback = vi.fn();
            entityManager.onEntityCreated(callback);
            entityManager.getEventSystem().off(EntityEventType.CREATED, callback);
            entityManager.createEntity('player');
            expect(callback).not.toHaveBeenCalled();
        });

        it('should pass timestamp in events', () => {
            const callback = vi.fn();
            entityManager.onEntityCreated(callback);
            const before = Date.now();
            entityManager.createEntity('player');
            const after = Date.now();
            expect(callback).toHaveBeenCalledTimes(1);
            const eventData = callback.mock.calls[0][0];
            expect(eventData.timestamp).toBeGreaterThanOrEqual(before);
            expect(eventData.timestamp).toBeLessThanOrEqual(after);
        });

        it('should support multiple listeners for same event', () => {
            const callback1 = vi.fn();
            const callback2 = vi.fn();
            const callback3 = vi.fn();
            entityManager.onEntityCreated(callback1);
            entityManager.onEntityCreated(callback2);
            entityManager.onEntityCreated(callback3);
            entityManager.createEntity('player');
            expect(callback1).toHaveBeenCalledTimes(1);
            expect(callback2).toHaveBeenCalledTimes(1);
            expect(callback3).toHaveBeenCalledTimes(1);
        });
    });

    // ==================== Edge Cases (10 tests) ====================
    describe('Edge Cases', () => {
        let entityManager;

        beforeEach(() => {
            entityManager = new EntityManager();
        });

        it('should handle entity with no components', () => {
            const id = entityManager.createEntity('empty');
            const entity = entityManager.getEntity(id);
            expect(entity.components).toEqual({});
        });

        it('should handle entity with many components', () => {
            const components = {};
            for (let i = 0; i < 100; i++) {
                components[`component${i}`] = { value: i };
            }
            const id = entityManager.createEntity('complex', components);
            const entity = entityManager.getEntity(id);
            expect(Object.keys(entity.components)).toHaveLength(100);
        });

        it('should handle entity type with special characters', () => {
            const id = entityManager.createEntity('player-type_v1.0');
            const entity = entityManager.getEntity(id);
            expect(entity.type).toBe('player-type_v1.0');
        });

        it('should handle component with nested objects', () => {
            const id = entityManager.createEntity('player', {
                transform: {
                    position: { x: 0, y: 0, z: 0 },
                    rotation: { x: 0, y: 0, z: 0 },
                    scale: { x: 1, y: 1, z: 1 }
                }
            });
            const entity = entityManager.getEntity(id);
            expect(entity.components.transform).toBeDefined();
        });

        it('should handle destroying all entities', () => {
            entityManager.createEntity('player');
            entityManager.createEntity('enemy');
            entityManager.createEntity('obstacle');
            const count = entityManager.clear();
            expect(count).toBe(3);
            expect(entityManager.count()).toBe(0);
        });

        it('should handle getting entities after some are destroyed', () => {
            const id1 = entityManager.createEntity('player');
            const id2 = entityManager.createEntity('enemy');
            const id3 = entityManager.createEntity('obstacle');
            entityManager.destroyEntity(id2);
            const all = entityManager.getAllEntities();
            expect(all).toHaveLength(2);
            expect(all.map(e => e.id)).toEqual([id1, id3]);
        });

        it('should handle component index cleanup after destroy', () => {
            const id = entityManager.createEntity('player', { position: {} });
            entityManager.destroyEntity(id);
            const entities = entityManager.getEntitiesByComponent('position');
            expect(entities).toEqual([]);
        });

        it('should handle type index cleanup after destroy', () => {
            const id = entityManager.createEntity('uniqueType');
            entityManager.destroyEntity(id);
            const entities = entityManager.getEntitiesByType('uniqueType');
            expect(entities).toEqual([]);
        });

        it('should handle entity with same component added twice', () => {
            const id = entityManager.createEntity('player', { position: { x: 0 } });
            entityManager.addComponent(id, 'position', { x: 10, y: 10 });
            const component = entityManager.getComponent(id, 'position');
            expect(component.x).toBe(10);
            expect(component.y).toBe(10);
        });

        it('should handle whitespace in type name', () => {
            const id = entityManager.createEntity('  player  ');
            const entity = entityManager.getEntity(id);
            expect(entity.type).toBe('player');
        });
    });

    // ==================== Performance Tests (5 tests) ====================
    describe('Performance Tests', () => {
        let entityManager;

        beforeEach(() => {
            entityManager = new EntityManager();
        });

        it('should create 1000 entities efficiently', () => {
            const start = performance.now();
            for (let i = 0; i < 1000; i++) {
                entityManager.createEntity('entity', {
                    position: { x: i, y: i, z: i },
                    velocity: { x: 1, y: 1, z: 1 }
                });
            }
            const end = performance.now();
            expect(entityManager.count()).toBe(1000);
            expect(end - start).toBeLessThan(1000); // Should complete in under 1 second
        });

        it('should query 1000 entities efficiently', () => {
            for (let i = 0; i < 1000; i++) {
                entityManager.createEntity('entity', {
                    position: {},
                    velocity: {}
                });
            }
            const start = performance.now();
            const result = entityManager.query(['position', 'velocity']);
            const end = performance.now();
            expect(result).toHaveLength(1000);
            expect(end - start).toBeLessThan(100); // Query should be fast
        });

        it('should destroy 1000 entities efficiently', () => {
            for (let i = 0; i < 1000; i++) {
                entityManager.createEntity('entity');
            }
            const start = performance.now();
            entityManager.clear();
            const end = performance.now();
            expect(entityManager.count()).toBe(0);
            expect(end - start).toBeLessThan(500);
        });

        it('should handle component lookups efficiently', () => {
            for (let i = 0; i < 500; i++) {
                entityManager.createEntity('entity', { position: {} });
            }
            for (let i = 0; i < 500; i++) {
                entityManager.createEntity('entity', { velocity: {} });
            }
            const start = performance.now();
            const positionEntities = entityManager.getEntitiesByComponent('position');
            const velocityEntities = entityManager.getEntitiesByComponent('velocity');
            const end = performance.now();
            expect(positionEntities).toHaveLength(500);
            expect(velocityEntities).toHaveLength(500);
            expect(end - start).toBeLessThan(100);
        });

        it('should maintain performance with many entity types', () => {
            const start = performance.now();
            for (let i = 0; i < 100; i++) {
                for (let j = 0; j < 10; j++) {
                    entityManager.createEntity(`type_${i}`, { component: { value: j } });
                }
            }
            const end = performance.now();
            expect(entityManager.count()).toBe(1000);
            expect(end - start).toBeLessThan(1000);

            // Query by type should still be fast
            const queryStart = performance.now();
            const result = entityManager.getEntitiesByType('type_50');
            const queryEnd = performance.now();
            expect(result).toHaveLength(10);
            expect(queryEnd - queryStart).toBeLessThan(50);
        });
    });

    // ==================== Additional Integration Tests ====================
    describe('Integration Tests', () => {
        let entityManager;

        beforeEach(() => {
            entityManager = new EntityManager();
        });

        it('should track statistics correctly', () => {
            entityManager.createEntity('player');
            entityManager.createEntity('enemy');
            entityManager.destroyEntity(1);
            entityManager.createEntity('obstacle');

            const stats = entityManager.getStats();
            expect(stats.entityCount).toBe(2);
            expect(stats.totalCreated).toBe(3);
            expect(stats.totalDestroyed).toBe(1);
            expect(stats.peakCount).toBe(2);
        });

        it('should return entity copy to prevent external modification', () => {
            const id = entityManager.createEntity('player', { position: { x: 0 } });
            const entity = entityManager.getEntity(id);
            entity.type = 'hacked';
            entity.components.position.x = 999;

            const original = entityManager.getEntity(id);
            expect(original.type).toBe('player');
            expect(original.components.position.x).toBe(0);
        });

        it('should handle entity state transitions', () => {
            const id = entityManager.createEntity('player', {}, EntityState.ACTIVE);
            entityManager.updateEntity(id, { state: EntityState.PAUSED });

            // Note: state is not directly updatable via updateEntity
            // This tests that updateEntity works for components
            const entity = entityManager.getEntity(id);
            expect(entity.state).toBe(EntityState.ACTIVE);
        });

        it('should support entity event subscription for specific entity', () => {
            const id1 = entityManager.createEntity('player');
            const id2 = entityManager.createEntity('player');

            const callback1 = vi.fn();
            const callback2 = vi.fn();

            entityManager.onEntityEvent(id1, 'custom', callback1);
            entityManager.onEntityEvent(id2, 'custom', callback2);

            entityManager.emitEntityEvent(id1, 'custom', { data: 'for1' });
            entityManager.emitEntityEvent(id2, 'custom', { data: 'for2' });

            expect(callback1).toHaveBeenCalledTimes(1);
            expect(callback2).toHaveBeenCalledTimes(1);
            const eventData1 = callback1.mock.calls[0][0];
            expect(eventData1.entityId).toBe(id1);
            expect(eventData1.data).toEqual({ data: 'for1' });
        });

        it('should handle complex query scenarios', () => {
            // Create entities with various component combinations
            entityManager.createEntity('player', { position: {}, velocity: {}, health: {}, render: {} });
            entityManager.createEntity('enemy', { position: {}, velocity: {}, health: {} });
            entityManager.createEntity('obstacle', { position: {}, render: {} });
            entityManager.createEntity('powerup', { position: {}, effect: {} });

            // Query entities with position and render (for rendering system)
            const renderable = entityManager.query(['position', 'render']);
            expect(renderable).toHaveLength(2);

            // Query entities with position and velocity (for physics system)
            const physics = entityManager.query(['position', 'velocity']);
            expect(physics).toHaveLength(2);

            // Query entities with health (for health system)
            const hasHealth = entityManager.getEntitiesByComponent('health');
            expect(hasHealth).toHaveLength(2);
        });

        it('should handle entity lifecycle with events', () => {
            const events = [];

            entityManager.onEntityCreated((data) => events.push({ eventKind: 'created', ...data }));
            entityManager.onEntityUpdated((data) => events.push({ eventKind: 'updated', ...data }));
            entityManager.onEntityDestroyed((data) => events.push({ eventKind: 'destroyed', ...data }));

            const id = entityManager.createEntity('player', { position: {} });
            entityManager.updateEntity(id, { velocity: {} });
            entityManager.destroyEntity(id);

            expect(events).toHaveLength(3);
            expect(events[0].eventKind).toBe('created');
            expect(events[1].eventKind).toBe('updated');
            expect(events[2].eventKind).toBe('destroyed');
        });

        it('should handle component value queries with multiple criteria', () => {
            entityManager.createEntity('player', { position: { x: 0, y: 0, z: 0 } });
            entityManager.createEntity('enemy', { position: { x: 10, y: 10, z: 0 } });
            entityManager.createEntity('obstacle', { position: { x: 0, y: 10, z: 0 } });
            entityManager.createEntity('powerup', { position: { x: 0, y: 0, z: 5 } });

            const result = entityManager.queryByComponentValue('position', { x: 0, y: 0 });
            expect(result).toHaveLength(2);
        });

        it('should handle entity count after various operations', () => {
            expect(entityManager.count()).toBe(0);

            entityManager.createEntity('player');
            expect(entityManager.count()).toBe(1);

            entityManager.createEntity('enemy');
            entityManager.createEntity('obstacle');
            expect(entityManager.count()).toBe(3);

            entityManager.destroyEntity(1);
            expect(entityManager.count()).toBe(2);

            entityManager.clear();
            expect(entityManager.count()).toBe(0);
        });

        it('should handle hasEntity correctly', () => {
            expect(entityManager.hasEntity(1)).toBe(false);

            const id = entityManager.createEntity('player');
            expect(entityManager.hasEntity(id)).toBe(true);
            expect(entityManager.hasEntity(999)).toBe(false);

            entityManager.destroyEntity(id);
            expect(entityManager.hasEntity(id)).toBe(false);
        });

        it('should export EntityEventType and EntityState constants', () => {
            expect(EntityEventType.CREATED).toBe('entity:created');
            expect(EntityEventType.DESTROYED).toBe('entity:destroyed');
            expect(EntityEventType.COMPONENT_ADDED).toBe('entity:component:added');
            expect(EntityEventType.COMPONENT_REMOVED).toBe('entity:component:removed');
            expect(EntityEventType.COMPONENT_UPDATED).toBe('entity:component:updated');
            expect(EntityEventType.ENTITY_UPDATED).toBe('entity:updated');

            expect(EntityState.ACTIVE).toBe('active');
            expect(EntityState.INACTIVE).toBe('inactive');
            expect(EntityState.DESTROYED).toBe('destroyed');
            expect(EntityState.PAUSED).toBe('paused');
        });
    });

    // ==================== State Management Tests ====================
    describe('State Management', () => {
        let entityManager;

        beforeEach(() => {
            entityManager = new EntityManager();
        });

        it('should create entity with default active state', () => {
            const id = entityManager.createEntity('player');
            const entity = entityManager.getEntity(id);
            expect(entity.state).toBe(EntityState.ACTIVE);
        });

        it('should create entity with inactive state', () => {
            const id = entityManager.createEntity('player', {}, EntityState.INACTIVE);
            const entity = entityManager.getEntity(id);
            expect(entity.state).toBe(EntityState.INACTIVE);
        });

        it('should create entity with paused state', () => {
            const id = entityManager.createEntity('player', {}, EntityState.PAUSED);
            const entity = entityManager.getEntity(id);
            expect(entity.state).toBe(EntityState.PAUSED);
        });

        it('should filter entities by destroyed state', () => {
            // Note: destroyed entities are removed from the manager
            // This tests that destroyed entities don't appear in queries
            const id = entityManager.createEntity('player');
            entityManager.destroyEntity(id);
            const destroyed = entityManager.getEntitiesByState(EntityState.DESTROYED);
            expect(destroyed).toEqual([]);
        });

        it('should maintain state index correctly', () => {
            entityManager.createEntity('player1', {}, EntityState.ACTIVE);
            entityManager.createEntity('player2', {}, EntityState.ACTIVE);
            entityManager.createEntity('enemy1', {}, EntityState.INACTIVE);

            const active = entityManager.getEntitiesByState(EntityState.ACTIVE);
            const inactive = entityManager.getEntitiesByState(EntityState.INACTIVE);

            expect(active).toHaveLength(2);
            expect(inactive).toHaveLength(1);
        });
    });

    // ==================== Component Index Tests ====================
    describe('Component Index', () => {
        let entityManager;

        beforeEach(() => {
            entityManager = new EntityManager();
        });

        it('should maintain component index on entity creation', () => {
            entityManager.createEntity('player', { position: {}, velocity: {} });
            const positionEntities = entityManager.getEntitiesByComponent('position');
            const velocityEntities = entityManager.getEntitiesByComponent('velocity');
            expect(positionEntities).toHaveLength(1);
            expect(velocityEntities).toHaveLength(1);
        });

        it('should maintain component index on component addition', () => {
            const id = entityManager.createEntity('player');
            entityManager.addComponent(id, 'render', {});
            const renderEntities = entityManager.getEntitiesByComponent('render');
            expect(renderEntities).toHaveLength(1);
        });

        it('should maintain component index on component removal', () => {
            const id = entityManager.createEntity('player', { position: {} });
            entityManager.removeComponent(id, 'position');
            const positionEntities = entityManager.getEntitiesByComponent('position');
            expect(positionEntities).toEqual([]);
        });

        it('should maintain component index on entity destruction', () => {
            const id = entityManager.createEntity('player', { position: {} });
            entityManager.destroyEntity(id);
            const positionEntities = entityManager.getEntitiesByComponent('position');
            expect(positionEntities).toEqual([]);
        });

        it('should handle multiple entities with same component', () => {
            entityManager.createEntity('player1', { position: {} });
            entityManager.createEntity('player2', { position: {} });
            entityManager.createEntity('player3', { position: {} });
            const positionEntities = entityManager.getEntitiesByComponent('position');
            expect(positionEntities).toHaveLength(3);
        });
    });
});
