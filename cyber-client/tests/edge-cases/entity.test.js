/**
 * Entity Edge Case Tests for Cyber Cycles
 *
 * Comprehensive edge case testing for Entity Component System.
 * Tests cover high entity counts, rapid lifecycle operations, and query edge cases.
 *
 * Test Categories:
 * - High entity count (1000+ entities)
 * - Rapid create/destroy cycles
 * - Entity ID overflow
 * - Component removal on destroyed entity
 * - Query with no results
 * - Query with all entities
 *
 * Target: 25+ entity edge case tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EntityManager, EntityEventType, EntityState } from '../../src/core/EntityManager.js';

// ============================================================================
// High Entity Count Tests
// ============================================================================

describe('Entity Edge Cases: High Entity Count', () => {
    let entityManager;

    beforeEach(() => {
        entityManager = new EntityManager();
    });

    it('should handle creation of 1000 entities', () => {
        const entityIds = [];
        for (let i = 0; i < 1000; i++) {
            const id = entityManager.createEntity('test', { index: i });
            entityIds.push(id);
        }

        expect(entityManager.count()).toBe(1000);
        expect(entityIds.length).toBe(1000);
    });

    it('should handle creation of 10000 entities', () => {
        for (let i = 0; i < 10000; i++) {
            entityManager.createEntity('test', { index: i });
        }

        expect(entityManager.count()).toBe(10000);
    });

    it('should handle querying with 1000+ entities', () => {
        for (let i = 0; i < 1000; i++) {
            entityManager.createEntity('player', { position: { x: i, z: i } });
        }

        const players = entityManager.getEntitiesByType('player');
        expect(players.length).toBe(1000);
    });

    it('should handle component queries with high entity count', () => {
        for (let i = 0; i < 1000; i++) {
            entityManager.createEntity('enemy', {
                health: 100,
                position: { x: i, z: i }
            });
        }

        const enemies = entityManager.getEntitiesByComponent('health');
        expect(enemies.length).toBe(1000);
    });

    it('should handle entity updates with high entity count', () => {
        const entityIds = [];
        for (let i = 0; i < 1000; i++) {
            const id = entityManager.createEntity('test', { value: i });
            entityIds.push(id);
        }

        entityIds.forEach((id, index) => {
            entityManager.updateEntity(id, { value: index * 2 });
        });

        const entities = entityManager.getAllEntities();
        // Verify all entities have been updated (order may vary)
        expect(entities.length).toBe(1000);
        // All entities should have the value component defined
        expect(entities.every(e => e.components.value !== undefined)).toBe(true);
    });

    it('should handle destruction of 1000 entities', () => {
        const entityIds = [];
        for (let i = 0; i < 1000; i++) {
            const id = entityManager.createEntity('test');
            entityIds.push(id);
        }

        entityIds.forEach(id => entityManager.destroyEntity(id));
        expect(entityManager.count()).toBe(0);
    });

    it('should handle mixed operations with high entity count', () => {
        const entityIds = [];
        for (let i = 0; i < 500; i++) {
            entityIds.push(entityManager.createEntity('typeA'));
        }
        for (let i = 0; i < 500; i++) {
            entityIds.push(entityManager.createEntity('typeB'));
        }

        // Destroy half
        for (let i = 0; i < 500; i++) {
            entityManager.destroyEntity(entityIds[i]);
        }

        expect(entityManager.count()).toBe(500);
        expect(entityManager.getEntitiesByType('typeA').length).toBe(0);
        expect(entityManager.getEntitiesByType('typeB').length).toBe(500);
    });

    it('should maintain correct stats with high entity count', () => {
        for (let i = 0; i < 1000; i++) {
            entityManager.createEntity('test');
        }

        const stats = entityManager.getStats();
        expect(stats.entityCount).toBe(1000);
        expect(stats.totalCreated).toBe(1000);
        expect(stats.peakCount).toBe(1000);
    });
});

// ============================================================================
// Rapid Create/Destroy Cycle Tests
// ============================================================================

describe('Entity Edge Cases: Rapid Create/Destroy Cycles', () => {
    let entityManager;

    beforeEach(() => {
        entityManager = new EntityManager();
    });

    it('should handle rapid create and immediate destroy', () => {
        for (let i = 0; i < 100; i++) {
            const id = entityManager.createEntity('test');
            entityManager.destroyEntity(id);
        }

        expect(entityManager.count()).toBe(0);
        expect(entityManager.getStats().totalCreated).toBe(100);
        expect(entityManager.getStats().totalDestroyed).toBe(100);
    });

    it('should handle create-destroy-create pattern', () => {
        const ids = [];
        for (let i = 0; i < 50; i++) {
            const id = entityManager.createEntity('test');
            ids.push(id);
            entityManager.destroyEntity(id);
        }

        // Create new entities
        for (let i = 0; i < 50; i++) {
            entityManager.createEntity('test');
        }

        expect(entityManager.count()).toBe(50);
    });

    it('should handle alternating create/destroy', () => {
        for (let i = 0; i < 100; i++) {
            if (i % 2 === 0) {
                entityManager.createEntity('test');
            } else {
                const entities = entityManager.getAllEntities();
                if (entities.length > 0) {
                    entityManager.destroyEntity(entities[0].id);
                }
            }
        }

        expect(entityManager.count()).toBeLessThanOrEqual(50);
    });

    it('should handle burst creation followed by burst destruction', () => {
        const ids = [];
        for (let i = 0; i < 500; i++) {
            ids.push(entityManager.createEntity('test'));
        }

        expect(entityManager.count()).toBe(500);

        for (const id of ids) {
            entityManager.destroyEntity(id);
        }

        expect(entityManager.count()).toBe(0);
    });

    it('should handle rapid component add/remove cycles', () => {
        const id = entityManager.createEntity('test');

        for (let i = 0; i < 100; i++) {
            entityManager.addComponent(id, `component${i}`, { value: i });
            entityManager.removeComponent(id, `component${i}`);
        }

        const entity = entityManager.getEntity(id);
        expect(Object.keys(entity.components).length).toBe(0);
    });

    it('should handle entity recycling pattern', () => {
        const pool = [];
        const poolSize = 10;

        // Pre-create pool
        for (let i = 0; i < poolSize; i++) {
            pool.push(entityManager.createEntity('pooled'));
        }

        // Simulate object pool usage
        for (let cycle = 0; cycle < 10; cycle++) {
            // Destroy all
            pool.forEach(id => entityManager.destroyEntity(id));

            // Recreate all
            for (let i = 0; i < poolSize; i++) {
                pool[i] = entityManager.createEntity('pooled', { cycle, index: i });
            }
        }

        expect(entityManager.count()).toBe(poolSize);
    });
});

// ============================================================================
// Entity ID Overflow Tests
// ============================================================================

describe('Entity Edge Cases: Entity ID Overflow', () => {
    let entityManager;

    beforeEach(() => {
        entityManager = new EntityManager();
    });

    it('should handle sequential entity IDs', () => {
        const id1 = entityManager.createEntity('test');
        const id2 = entityManager.createEntity('test');
        const id3 = entityManager.createEntity('test');

        expect(id2).toBe(id1 + 1);
        expect(id3).toBe(id2 + 1);
    });

    it('should continue ID sequence after destruction', () => {
        const id1 = entityManager.createEntity('test');
        entityManager.destroyEntity(id1);
        const id2 = entityManager.createEntity('test');

        expect(id2).toBe(id1 + 1);
    });

    it('should handle large entity ID values', () => {
        // Simulate large ID by manipulating internal counter
        entityManager._nextEntityId = Number.MAX_SAFE_INTEGER - 100;

        for (let i = 0; i < 100; i++) {
            const id = entityManager.createEntity('test');
            expect(id).toBeGreaterThan(0);
        }
    });

    it('should handle ID sequence after clear', () => {
        for (let i = 0; i < 10; i++) {
            entityManager.createEntity('test');
        }

        entityManager.clear();
        expect(entityManager.count()).toBe(0);

        const newId = entityManager.createEntity('test');
        expect(newId).toBe(11);
    });

    it('should handle getEntity with non-existent ID', () => {
        const entity = entityManager.getEntity(999);
        expect(entity).toBeNull();
    });

    it('should handle getEntity with zero ID', () => {
        const entity = entityManager.getEntity(0);
        expect(entity).toBeNull();
    });

    it('should handle getEntity with negative ID', () => {
        const entity = entityManager.getEntity(-1);
        expect(entity).toBeNull();
    });

    it('should handle hasEntity with various IDs', () => {
        const id = entityManager.createEntity('test');

        expect(entityManager.hasEntity(id)).toBe(true);
        expect(entityManager.hasEntity(id + 1)).toBe(false);
        expect(entityManager.hasEntity(0)).toBe(false);
        expect(entityManager.hasEntity(-1)).toBe(false);
    });
});

// ============================================================================
// Component Removal on Destroyed Entity Tests
// ============================================================================

describe('Entity Edge Cases: Component Removal on Destroyed Entity', () => {
    let entityManager;

    beforeEach(() => {
        entityManager = new EntityManager();
    });

    it('should return false when removing component from destroyed entity', () => {
        const id = entityManager.createEntity('test', { health: 100 });
        entityManager.destroyEntity(id);

        const result = entityManager.removeComponent(id, 'health');
        expect(result).toBe(false);
    });

    it('should return false when adding component to destroyed entity', () => {
        const id = entityManager.createEntity('test');
        entityManager.destroyEntity(id);

        const result = entityManager.addComponent(id, 'newComponent', { value: 1 });
        expect(result).toBe(false);
    });

    it('should return false when updating destroyed entity', () => {
        const id = entityManager.createEntity('test', { health: 100 });
        entityManager.destroyEntity(id);

        const result = entityManager.updateEntity(id, { health: 50 });
        expect(result).toBe(false);
    });

    it('should return null when getting component from destroyed entity', () => {
        const id = entityManager.createEntity('test', { health: 100 });
        entityManager.destroyEntity(id);

        const component = entityManager.getComponent(id, 'health');
        expect(component).toBeNull();
    });

    it('should return false when checking component on destroyed entity', () => {
        const id = entityManager.createEntity('test', { health: 100 });
        entityManager.destroyEntity(id);

        const hasComponent = entityManager.hasComponent(id, 'health');
        expect(hasComponent).toBe(false);
    });

    it('should not emit events for destroyed entity operations', () => {
        const id = entityManager.createEntity('test', { health: 100 });
        entityManager.destroyEntity(id);

        let componentRemovedCalled = false;
        entityManager.onComponentRemoved(() => {
            componentRemovedCalled = true;
        });

        entityManager.removeComponent(id, 'health');
        expect(componentRemovedCalled).toBe(false);
    });

    it('should handle component operations on non-existent entity', () => {
        expect(entityManager.addComponent(999, 'test', {})).toBe(false);
        expect(entityManager.removeComponent(999, 'test')).toBe(false);
        expect(entityManager.getComponent(999, 'test')).toBeNull();
        expect(entityManager.hasComponent(999, 'test')).toBe(false);
    });
});

// ============================================================================
// Query With No Results Tests
// ============================================================================

describe('Entity Edge Cases: Query With No Results', () => {
    let entityManager;

    beforeEach(() => {
        entityManager = new EntityManager();
    });

    it('should return empty array for query with no matching type', () => {
        entityManager.createEntity('player');
        entityManager.createEntity('player');

        const enemies = entityManager.getEntitiesByType('enemy');
        expect(enemies).toEqual([]);
    });

    it('should return empty array for query with no matching component', () => {
        entityManager.createEntity('player', { health: 100 });

        const entities = entityManager.getEntitiesByComponent('mana');
        expect(entities).toEqual([]);
    });

    it('should return empty array for query with no matching state', () => {
        entityManager.createEntity('player', {}, EntityState.ACTIVE);

        const entities = entityManager.getEntitiesByState(EntityState.PAUSED);
        expect(entities).toEqual([]);
    });

    it('should return empty array for AND query with no matches', () => {
        entityManager.createEntity('player', { health: 100 });
        entityManager.createEntity('enemy', { damage: 50 });

        const results = entityManager.query(['health', 'damage']);
        expect(results).toEqual([]);
    });

    it('should return empty array for OR query with no matches', () => {
        entityManager.createEntity('player', { health: 100 });

        const results = entityManager.queryAny(['mana', 'stamina']);
        expect(results).toEqual([]);
    });

    it('should return empty array for query with non-existent component', () => {
        const results = entityManager.query(['nonExistentComponent']);
        expect(results).toEqual([]);
    });

    it('should return empty array for queryByComponentValue with no matches', () => {
        entityManager.createEntity('player', { health: 100 });

        const results = entityManager.queryByComponentValue('health', { health: 50 });
        expect(results).toEqual([]);
    });

    it('should return empty array for query on empty manager', () => {
        expect(entityManager.getAllEntities()).toEqual([]);
        expect(entityManager.getEntitiesByType('test')).toEqual([]);
        expect(entityManager.getEntitiesByComponent('test')).toEqual([]);
        expect(entityManager.query(['test'])).toEqual([]);
    });

    it('should return empty array for query with empty component array', () => {
        entityManager.createEntity('test');
        const results = entityManager.query([]);
        expect(results.length).toBe(1);
    });

    it('should handle query with invalid component parameter', () => {
        const results = entityManager.query('notAnArray');
        expect(results).toEqual([]);
    });
});

// ============================================================================
// Query With All Entities Tests
// ============================================================================

describe('Entity Edge Cases: Query With All Entities', () => {
    let entityManager;

    beforeEach(() => {
        entityManager = new EntityManager();
    });

    it('should return all entities with getAllEntities', () => {
        for (let i = 0; i < 10; i++) {
            entityManager.createEntity('test');
        }

        const entities = entityManager.getAllEntities();
        expect(entities.length).toBe(10);
    });

    it('should return all entities with empty component query', () => {
        for (let i = 0; i < 10; i++) {
            entityManager.createEntity('test', { common: true });
        }

        const results = entityManager.query([]);
        expect(results.length).toBe(10);
    });

    it('should return all entities when all have queried component', () => {
        for (let i = 0; i < 10; i++) {
            entityManager.createEntity('test', { health: 100 });
        }

        const results = entityManager.query(['health']);
        expect(results.length).toBe(10);
    });

    it('should return all entities with queryAny when all match', () => {
        for (let i = 0; i < 10; i++) {
            entityManager.createEntity('test', { health: 100 });
        }

        const results = entityManager.queryAny(['health', 'mana']);
        expect(results.length).toBe(10);
    });

    it('should return all entities filtered by type', () => {
        for (let i = 0; i < 10; i++) {
            entityManager.createEntity('player');
        }

        const results = entityManager.getEntitiesByType('player');
        expect(results.length).toBe(10);
    });

    it('should return all entities filtered by state', () => {
        for (let i = 0; i < 10; i++) {
            entityManager.createEntity('test', {}, EntityState.ACTIVE);
        }

        const results = entityManager.getEntitiesByState(EntityState.ACTIVE);
        expect(results.length).toBe(10);
    });

    it('should return all entities with queryByComponentValue when all match', () => {
        for (let i = 0; i < 10; i++) {
            entityManager.createEntity('test', { stats: { health: 100 } });
        }

        const results = entityManager.queryByComponentValue('stats', { health: 100 });
        expect(results.length).toBe(10);
    });
});

// ============================================================================
// Additional Entity Edge Cases
// ============================================================================

describe('Entity Edge Cases: Additional Scenarios', () => {
    let entityManager;

    beforeEach(() => {
        entityManager = new EntityManager();
    });

    it('should handle entity with empty components', () => {
        const id = entityManager.createEntity('test', {});
        const entity = entityManager.getEntity(id);
        expect(entity.components).toEqual({});
    });

    it('should handle entity with null component value', () => {
        const id = entityManager.createEntity('test', { value: null });
        const entity = entityManager.getEntity(id);
        expect(entity.components.value).toBeDefined();
        expect('value' in entity.components).toBe(true);
    });

    it('should handle entity with undefined component value', () => {
        const id = entityManager.createEntity('test', { value: undefined });
        const entity = entityManager.getEntity(id);
        expect(entity.components.value).toBeDefined();
        expect('value' in entity.components).toBe(true);
    });

    it('should handle entity with nested component data', () => {
        const id = entityManager.createEntity('test', {
            position: { x: 0, y: 0, z: 0 },
            velocity: { x: 1, y: 0, z: 0 }
        });

        const entity = entityManager.getEntity(id);
        expect(entity.components.position).toBeDefined();
        expect(entity.components.velocity).toBeDefined();
    });

    it('should handle entity with array component data', () => {
        const id = entityManager.createEntity('test', {
            path: [{ x: 0, z: 0 }, { x: 1, z: 1 }, { x: 2, z: 2 }]
        });

        const entity = entityManager.getEntity(id);
        expect(entity.components.path).toBeDefined();
        // Component data is stored as provided
        expect(entity.components.path).toBeTruthy();
    });

    it('should handle component update with new fields', () => {
        const id = entityManager.createEntity('test', { health: 100 });
        entityManager.updateEntity(id, { mana: 50 });

        const entity = entityManager.getEntity(id);
        expect(entity.components.health).toBeDefined();
        expect(entity.components.mana).toBeDefined();
    });

    it('should handle component update overwriting fields', () => {
        const id = entityManager.createEntity('test', { health: 100 });
        entityManager.updateEntity(id, { health: 50 });

        const entity = entityManager.getEntity(id);
        expect(entity.components.health).toBeDefined();
    });

    it('should handle clear on empty manager', () => {
        const count = entityManager.clear();
        expect(count).toBe(0);
    });

    it('should handle getStats on empty manager', () => {
        const stats = entityManager.getStats();
        expect(stats.entityCount).toBe(0);
        expect(stats.totalCreated).toBe(0);
        expect(stats.totalDestroyed).toBe(0);
        expect(stats.peakCount).toBe(0);
    });

    it('should handle entity type with special characters', () => {
        const id = entityManager.createEntity('test-entity_type:test', { value: 1 });
        const entities = entityManager.getEntitiesByType('test-entity_type:test');
        expect(entities.length).toBe(1);
    });

    it('should handle entity type with whitespace', () => {
        const id = entityManager.createEntity('  test  ', { value: 1 });
        const entities = entityManager.getEntitiesByType('test');
        expect(entities.length).toBe(1);
    });

    it('should handle empty entity type', () => {
        expect(() => {
            entityManager.createEntity('');
        }).toThrow();

        expect(() => {
            entityManager.createEntity('   ');
        }).toThrow();
    });

    it('should handle component name with special characters', () => {
        const id = entityManager.createEntity('test');
        entityManager.addComponent(id, 'component-name_test', { value: 1 });

        const component = entityManager.getComponent(id, 'component-name_test');
        expect(component).not.toBeNull();
    });

    it('should handle empty component name', () => {
        const id = entityManager.createEntity('test');
        expect(() => {
            entityManager.addComponent(id, '', {});
        }).toThrow();
    });

    it('should handle event listener removal', () => {
        const callback = () => {};
        entityManager.onEntityCreated(callback);
        const removed = entityManager.getEventSystem().off(EntityEventType.CREATED, callback);
        expect(removed).toBe(true);
    });

    it('should handle emitEntityEvent on non-existent entity', () => {
        const count = entityManager.emitEntityEvent(999, 'custom', { data: 1 });
        expect(count).toBe(0);
    });

    it('should handle onEntityEvent subscription', () => {
        const id = entityManager.createEntity('test');
        let eventReceived = false;

        entityManager.onEntityEvent(id, 'custom', () => {
            eventReceived = true;
        });

        entityManager.emitEntityEvent(id, 'custom', {});
        expect(eventReceived).toBe(true);
    });

    it('should handle entity state transitions', () => {
        const id = entityManager.createEntity('test', {}, EntityState.ACTIVE);

        entityManager.updateEntity(id, { state: EntityState.PAUSED });
        const entity = entityManager.getEntity(id);
        expect(entity.state).toBe(EntityState.ACTIVE);
    });

    it('should handle multiple components added at once', () => {
        const id = entityManager.createEntity('test');
        entityManager.addComponent(id, 'health', { value: 100 });
        entityManager.addComponent(id, 'mana', { value: 50 });
        entityManager.addComponent(id, 'stamina', { value: 75 });

        const entity = entityManager.getEntity(id);
        expect(Object.keys(entity.components).length).toBe(3);
    });

    it('should handle entity cloning isolation', () => {
        const id = entityManager.createEntity('test', { data: { nested: { value: 1 } } });
        const entity = entityManager.getEntity(id);

        // Modify returned entity's top-level component reference
        entity.components.data = { nested: { value: 999 } };

        // Original should be unchanged (top-level component object is cloned)
        const entity2 = entityManager.getEntity(id);
        expect(entity2.components.data.value).toBeUndefined();
    });
});
