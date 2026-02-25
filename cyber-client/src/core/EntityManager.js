/**
 * EntityManager - Entity Component System (ECS) Manager for Cyber Cycles
 *
 * This class manages entity lifecycle, components, and provides query capabilities
 * for the game's Entity Component System architecture.
 *
 * @example
 * const entityManager = new EntityManager();
 * const entityId = entityManager.createEntity('player', {
 *   position: { x: 0, y: 0, z: 0 },
 *   velocity: { x: 0, y: 0, z: 0 }
 * });
 *
 * @author Cyber Cycles Team
 * @version 1.0.0
 */

import { EventSystem } from './EventSystem.js';

/**
 * Entity event types
 */
export const EntityEventType = {
    CREATED: 'entity:created',
    DESTROYED: 'entity:destroyed',
    COMPONENT_ADDED: 'entity:component:added',
    COMPONENT_REMOVED: 'entity:component:removed',
    COMPONENT_UPDATED: 'entity:component:updated',
    ENTITY_UPDATED: 'entity:updated'
};

/**
 * Default entity states
 */
export const EntityState = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    DESTROYED: 'destroyed',
    PAUSED: 'paused'
};

export class EntityManager {
    /**
     * Creates a new EntityManager instance
     */
    constructor() {
        // Auto-incrementing entity ID counter
        this._nextEntityId = 1;

        // Map of entityId -> entity object
        // Entity structure: { id, type, state, components: Map, createdAt, updatedAt }
        this._entities = new Map();

        // Index: type -> Set of entityIds
        this._typeIndex = new Map();

        // Index: state -> Set of entityIds
        this._stateIndex = new Map();

        // Index: componentName -> Set of entityIds
        this._componentIndex = new Map();

        // Event system for entity lifecycle events
        this._events = new EventSystem();

        // Statistics for debugging
        this._stats = {
            totalCreated: 0,
            totalDestroyed: 0,
            peakCount: 0
        };
    }

    // ==================== Entity Lifecycle ====================

    /**
     * Creates a new entity with the specified type and components
     * @param {string} type - The entity type (e.g., 'player', 'enemy', 'obstacle')
     * @param {Object} [components] - Initial components to add
     * @param {string} [state=EntityState.ACTIVE] - Initial entity state
     * @returns {number} The created entity ID
     * @throws {Error} If type is not a string
     */
    createEntity(type, components = {}, state = EntityState.ACTIVE) {
        if (typeof type !== 'string' || type.trim() === '') {
            throw new Error('Entity type must be a non-empty string');
        }

        const entityId = this._nextEntityId++;
        const now = Date.now();

        const entity = {
            id: entityId,
            type: type.trim(),
            state: state,
            components: new Map(),
            createdAt: now,
            updatedAt: now
        };

        // Add initial components
        for (const [name, data] of Object.entries(components)) {
            entity.components.set(name, { ...data });
        }

        // Store entity
        this._entities.set(entityId, entity);

        // Update indexes
        this._addToTypeIndex(entityId, entity.type);
        this._addToStateIndex(entityId, entity.state);
        for (const componentName of entity.components.keys()) {
            this._addToComponentIndex(entityId, componentName);
        }

        // Update statistics
        this._stats.totalCreated++;
        const currentCount = this._entities.size;
        if (currentCount > this._stats.peakCount) {
            this._stats.peakCount = currentCount;
        }

        // Emit creation event
        this._events.emit(EntityEventType.CREATED, {
            entityId,
            type: entity.type,
            state: entity.state,
            components: this._getComponentData(entity),
            timestamp: now
        });

        return entityId;
    }

    /**
     * Destroys an entity and removes all its components
     * @param {number} entityId - The entity ID to destroy
     * @returns {boolean} True if entity was destroyed, false if not found
     */
    destroyEntity(entityId) {
        if (!this._entities.has(entityId)) {
            return false;
        }

        const entity = this._entities.get(entityId);
        const now = Date.now();

        // Remove from indexes
        this._removeFromTypeIndex(entityId, entity.type);
        this._removeFromStateIndex(entityId, entity.state);
        for (const componentName of entity.components.keys()) {
            this._removeFromComponentIndex(entityId, componentName);
        }

        // Emit destruction event before removing
        this._events.emit(EntityEventType.DESTROYED, {
            entityId,
            type: entity.type,
            components: this._getComponentData(entity),
            timestamp: now
        });

        // Remove entity
        this._entities.delete(entityId);
        this._stats.totalDestroyed++;

        return true;
    }

    /**
     * Gets an entity by ID
     * @param {number} entityId - The entity ID
     * @returns {Object|null} The entity object or null if not found
     */
    getEntity(entityId) {
        const entity = this._entities.get(entityId);
        if (!entity) {
            return null;
        }

        // Return a copy to prevent direct modification
        return this._cloneEntity(entity);
    }

    /**
     * Gets all entities
     * @returns {Array<Object>} Array of all entity objects
     */
    getAllEntities() {
        return Array.from(this._entities.values()).map(entity => this._cloneEntity(entity));
    }

    /**
     * Gets entities filtered by type
     * @param {string} type - The entity type to filter by
     * @returns {Array<Object>} Array of matching entity objects
     */
    getEntitiesByType(type) {
        const entityIds = this._typeIndex.get(type);
        if (!entityIds) {
            return [];
        }

        return Array.from(entityIds)
            .map(id => this._entities.get(id))
            .filter(entity => entity !== undefined)
            .map(entity => this._cloneEntity(entity));
    }

    /**
     * Gets entities filtered by component name
     * @param {string} componentName - The component name to filter by
     * @returns {Array<Object>} Array of matching entity objects
     */
    getEntitiesByComponent(componentName) {
        const entityIds = this._componentIndex.get(componentName);
        if (!entityIds) {
            return [];
        }

        return Array.from(entityIds)
            .map(id => this._entities.get(id))
            .filter(entity => entity !== undefined)
            .map(entity => this._cloneEntity(entity));
    }

    /**
     * Gets entities filtered by state
     * @param {string} state - The entity state to filter by
     * @returns {Array<Object>} Array of matching entity objects
     */
    getEntitiesByState(state) {
        const entityIds = this._stateIndex.get(state);
        if (!entityIds) {
            return [];
        }

        return Array.from(entityIds)
            .map(id => this._entities.get(id))
            .filter(entity => entity !== undefined)
            .map(entity => this._cloneEntity(entity));
    }

    /**
     * Updates an entity's components
     * @param {number} entityId - The entity ID to update
     * @param {Object} components - Components to update/add
     * @returns {boolean} True if entity was updated, false if not found
     * @throws {Error} If entityId is invalid
     */
    updateEntity(entityId, components) {
        if (!this._entities.has(entityId)) {
            return false;
        }

        const entity = this._entities.get(entityId);
        const now = Date.now();
        const updatedComponents = [];

        for (const [name, data] of Object.entries(components)) {
            const existed = entity.components.has(name);

            if (existed) {
                // Update existing component
                const oldData = entity.components.get(name);
                entity.components.set(name, { ...oldData, ...data });
            } else {
                // Add new component
                entity.components.set(name, { ...data });
                this._addToComponentIndex(entityId, name);
            }

            updatedComponents.push(name);

            // Emit component update event
            this._events.emit(EntityEventType.COMPONENT_UPDATED, {
                entityId,
                componentName: name,
                data: entity.components.get(name),
                existed,
                timestamp: now
            });
        }

        entity.updatedAt = now;

        // Emit entity update event
        this._events.emit(EntityEventType.ENTITY_UPDATED, {
            entityId,
            components: updatedComponents,
            timestamp: now
        });

        return true;
    }

    /**
     * Checks if an entity exists
     * @param {number} entityId - The entity ID to check
     * @returns {boolean} True if entity exists
     */
    hasEntity(entityId) {
        return this._entities.has(entityId);
    }

    /**
     * Gets the total entity count
     * @returns {number} Number of entities
     */
    count() {
        return this._entities.size;
    }

    /**
     * Destroys all entities
     * @returns {number} Number of entities destroyed
     */
    clear() {
        const count = this._entities.size;

        // Emit destruction events for all entities
        for (const entity of this._entities.values()) {
            this._events.emit(EntityEventType.DESTROYED, {
                entityId: entity.id,
                type: entity.type,
                components: this._getComponentData(entity),
                timestamp: Date.now()
            });
        }

        // Clear all data
        this._entities.clear();
        this._typeIndex.clear();
        this._stateIndex.clear();
        this._componentIndex.clear();

        return count;
    }

    // ==================== Component Management ====================

    /**
     * Adds a component to an entity
     * @param {number} entityId - The entity ID
     * @param {string} name - The component name
     * @param {Object} component - The component data
     * @returns {boolean} True if component was added, false if entity not found
     * @throws {Error} If component name is invalid
     */
    addComponent(entityId, name, component) {
        if (!this._entities.has(entityId)) {
            return false;
        }

        if (typeof name !== 'string' || name.trim() === '') {
            throw new Error('Component name must be a non-empty string');
        }

        const entity = this._entities.get(entityId);
        const now = Date.now();
        const componentName = name.trim();

        entity.components.set(componentName, { ...component });
        this._addToComponentIndex(entityId, componentName);
        entity.updatedAt = now;

        // Emit event
        this._events.emit(EntityEventType.COMPONENT_ADDED, {
            entityId,
            componentName,
            data: component,
            timestamp: now
        });

        return true;
    }

    /**
     * Removes a component from an entity
     * @param {number} entityId - The entity ID
     * @param {string} name - The component name to remove
     * @returns {boolean} True if component was removed, false if not found
     */
    removeComponent(entityId, name) {
        if (!this._entities.has(entityId)) {
            return false;
        }

        const entity = this._entities.get(entityId);
        if (!entity.components.has(name)) {
            return false;
        }

        const now = Date.now();
        const removedData = entity.components.get(name);

        entity.components.delete(name);
        this._removeFromComponentIndex(entityId, name);
        entity.updatedAt = now;

        // Emit event
        this._events.emit(EntityEventType.COMPONENT_REMOVED, {
            entityId,
            componentName: name,
            data: removedData,
            timestamp: now
        });

        return true;
    }

    /**
     * Gets a component from an entity
     * @param {number} entityId - The entity ID
     * @param {string} name - The component name
     * @returns {Object|null} The component data or null if not found
     */
    getComponent(entityId, name) {
        const entity = this._entities.get(entityId);
        if (!entity || !entity.components.has(name)) {
            return null;
        }

        // Return a copy to prevent direct modification
        return { ...entity.components.get(name) };
    }

    /**
     * Checks if an entity has a specific component
     * @param {number} entityId - The entity ID
     * @param {string} name - The component name
     * @returns {boolean} True if entity has the component
     */
    hasComponent(entityId, name) {
        const entity = this._entities.get(entityId);
        return entity ? entity.components.has(name) : false;
    }

    // ==================== Event System ====================

    /**
     * Subscribes to entity creation events
     * @param {Function} callback - Callback receiving entity creation data
     * @returns {Function} The callback for later removal
     */
    onEntityCreated(callback) {
        return this._events.on(EntityEventType.CREATED, callback);
    }

    /**
     * Subscribes to entity destruction events
     * @param {Function} callback - Callback receiving entity destruction data
     * @returns {Function} The callback for later removal
     */
    onEntityDestroyed(callback) {
        return this._events.on(EntityEventType.DESTROYED, callback);
    }

    /**
     * Subscribes to component addition events
     * @param {Function} callback - Callback receiving component addition data
     * @returns {Function} The callback for later removal
     */
    onComponentAdded(callback) {
        return this._events.on(EntityEventType.COMPONENT_ADDED, callback);
    }

    /**
     * Subscribes to component removal events
     * @param {Function} callback - Callback receiving component removal data
     * @returns {Function} The callback for later removal
     */
    onComponentRemoved(callback) {
        return this._events.on(EntityEventType.COMPONENT_REMOVED, callback);
    }

    /**
     * Subscribes to component update events
     * @param {Function} callback - Callback receiving component update data
     * @returns {Function} The callback for later removal
     */
    onComponentUpdated(callback) {
        return this._events.on(EntityEventType.COMPONENT_UPDATED, callback);
    }

    /**
     * Subscribes to entity update events
     * @param {Function} callback - Callback receiving entity update data
     * @returns {Function} The callback for later removal
     */
    onEntityUpdated(callback) {
        return this._events.on(EntityEventType.ENTITY_UPDATED, callback);
    }

    /**
     * Emits a custom entity-specific event
     * @param {number} entityId - The entity ID
     * @param {string} event - The event name
     * @param {*} [data] - Data to pass to callbacks
     * @returns {number} Number of callbacks invoked
     */
    emitEntityEvent(entityId, event, data) {
        const fullEventName = `entity:${entityId}:${event}`;
        return this._events.emit(fullEventName, { entityId, event, data, timestamp: Date.now() });
    }

    /**
     * Subscribes to a specific entity's events
     * @param {number} entityId - The entity ID
     * @param {string} event - The event name
     * @param {Function} callback - The callback function
     * @returns {Function} The callback
     */
    onEntityEvent(entityId, event, callback) {
        const fullEventName = `entity:${entityId}:${event}`;
        return this._events.on(fullEventName, callback);
    }

    /**
     * Gets the internal event system (for advanced usage)
     * @returns {EventSystem} The event system
     */
    getEventSystem() {
        return this._events;
    }

    // ==================== Query System ====================

    /**
     * Performs a complex query with AND logic
     * Returns entities that have ALL specified components
     * @param {Array<string>} components - Array of component names (all must exist)
     * @param {Object} [options] - Query options
     * @param {string} [options.type] - Filter by entity type
     * @param {string} [options.state] - Filter by entity state
     * @returns {Array<Object>} Array of matching entity objects
     */
    query(components, options = {}) {
        if (!Array.isArray(components)) {
            return [];
        }

        // Start with all entities if no components specified
        let resultIds;
        if (components.length === 0) {
            resultIds = new Set(this._entities.keys());
        } else {
            // Get entity sets for each component
            const componentSets = components.map(name => this._componentIndex.get(name));

            // If any component has no entities, return empty
            if (componentSets.some(set => !set || set.size === 0)) {
                return [];
            }

            // Find intersection of all component sets (AND logic)
            resultIds = new Set(componentSets[0]);
            for (let i = 1; i < componentSets.length; i++) {
                resultIds = new Set([...resultIds].filter(id => componentSets[i].has(id)));
            }
        }

        // Apply type filter if specified
        if (options.type) {
            const typeSet = this._typeIndex.get(options.type);
            if (typeSet) {
                resultIds = new Set([...resultIds].filter(id => typeSet.has(id)));
            } else {
                return [];
            }
        }

        // Apply state filter if specified
        if (options.state) {
            const stateSet = this._stateIndex.get(options.state);
            if (stateSet) {
                resultIds = new Set([...resultIds].filter(id => stateSet.has(id)));
            } else {
                return [];
            }
        }

        return Array.from(resultIds)
            .map(id => this._entities.get(id))
            .filter(entity => entity !== undefined)
            .map(entity => this._cloneEntity(entity));
    }

    /**
     * Performs a complex query with OR logic
     * Returns entities that have ANY of the specified components
     * @param {Array<string>} components - Array of component names (any can exist)
     * @param {Object} [options] - Query options
     * @param {string} [options.type] - Filter by entity type
     * @param {string} [options.state] - Filter by entity state
     * @returns {Array<Object>} Array of matching entity objects
     */
    queryAny(components, options = {}) {
        if (!Array.isArray(components) || components.length === 0) {
            return [];
        }

        // Get entity sets for each component and find union (OR logic)
        const resultIds = new Set();
        for (const name of components) {
            const componentSet = this._componentIndex.get(name);
            if (componentSet) {
                for (const id of componentSet) {
                    resultIds.add(id);
                }
            }
        }

        // Apply type filter if specified
        if (options.type) {
            const typeSet = this._typeIndex.get(options.type);
            if (typeSet) {
                for (const id of resultIds) {
                    if (!typeSet.has(id)) {
                        resultIds.delete(id);
                    }
                }
            } else {
                return [];
            }
        }

        // Apply state filter if specified
        if (options.state) {
            const stateSet = this._stateIndex.get(options.state);
            if (stateSet) {
                for (const id of resultIds) {
                    if (!stateSet.has(id)) {
                        resultIds.delete(id);
                    }
                }
            } else {
                return [];
            }
        }

        return Array.from(resultIds)
            .map(id => this._entities.get(id))
            .filter(entity => entity !== undefined)
            .map(entity => this._cloneEntity(entity));
    }

    /**
     * Performs a query for entities with specific component values
     * @param {string} componentName - The component name
     * @param {Object} criteria - Key-value pairs to match
     * @returns {Array<Object>} Array of matching entity objects
     */
    queryByComponentValue(componentName, criteria) {
        const entities = this.getEntitiesByComponent(componentName);
        if (!entities || entities.length === 0) {
            return [];
        }

        const criteriaKeys = Object.keys(criteria);
        return entities.filter(entity => {
            const component = entity.components[componentName];
            if (!component) return false;

            return criteriaKeys.every(key => {
                return component[key] === criteria[key];
            });
        });
    }

    // ==================== Statistics ====================

    /**
     * Gets debug statistics
     * @returns {{
     *   entityCount: number,
     *   totalCreated: number,
     *   totalDestroyed: number,
     *   peakCount: number,
     *   typeCount: number,
     *   componentTypes: number
     * }}
     */
    getStats() {
        return {
            entityCount: this._entities.size,
            totalCreated: this._stats.totalCreated,
            totalDestroyed: this._stats.totalDestroyed,
            peakCount: this._stats.peakCount,
            typeCount: this._typeIndex.size,
            componentTypes: this._componentIndex.size
        };
    }

    // ==================== Private Helper Methods ====================

    /**
     * Creates a deep clone of an entity for safe external access
     * @param {Object} entity - The entity to clone
     * @returns {Object} Cloned entity with plain object components
     * @private
     */
    _cloneEntity(entity) {
        return {
            id: entity.id,
            type: entity.type,
            state: entity.state,
            components: this._getComponentData(entity),
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt
        };
    }

    /**
     * Gets component data as a plain object
     * @param {Object} entity - The entity
     * @returns {Object} Plain object with component data
     * @private
     */
    _getComponentData(entity) {
        const result = {};
        for (const [name, data] of entity.components.entries()) {
            result[name] = { ...data };
        }
        return result;
    }

    /**
     * Adds entity ID to type index
     * @param {number} entityId - The entity ID
     * @param {string} type - The entity type
     * @private
     */
    _addToTypeIndex(entityId, type) {
        if (!this._typeIndex.has(type)) {
            this._typeIndex.set(type, new Set());
        }
        this._typeIndex.get(type).add(entityId);
    }

    /**
     * Removes entity ID from type index
     * @param {number} entityId - The entity ID
     * @param {string} type - The entity type
     * @private
     */
    _removeFromTypeIndex(entityId, type) {
        const typeSet = this._typeIndex.get(type);
        if (typeSet) {
            typeSet.delete(entityId);
            if (typeSet.size === 0) {
                this._typeIndex.delete(type);
            }
        }
    }

    /**
     * Adds entity ID to state index
     * @param {number} entityId - The entity ID
     * @param {string} state - The entity state
     * @private
     */
    _addToStateIndex(entityId, state) {
        if (!this._stateIndex.has(state)) {
            this._stateIndex.set(state, new Set());
        }
        this._stateIndex.get(state).add(entityId);
    }

    /**
     * Removes entity ID from state index
     * @param {number} entityId - The entity ID
     * @param {string} state - The entity state
     * @private
     */
    _removeFromStateIndex(entityId, state) {
        const stateSet = this._stateIndex.get(state);
        if (stateSet) {
            stateSet.delete(entityId);
            if (stateSet.size === 0) {
                this._stateIndex.delete(state);
            }
        }
    }

    /**
     * Adds entity ID to component index
     * @param {number} entityId - The entity ID
     * @param {string} componentName - The component name
     * @private
     */
    _addToComponentIndex(entityId, componentName) {
        if (!this._componentIndex.has(componentName)) {
            this._componentIndex.set(componentName, new Set());
        }
        this._componentIndex.get(componentName).add(entityId);
    }

    /**
     * Removes entity ID from component index
     * @param {number} entityId - The entity ID
     * @param {string} componentName - The component name
     * @private
     */
    _removeFromComponentIndex(entityId, componentName) {
        const componentSet = this._componentIndex.get(componentName);
        if (componentSet) {
            componentSet.delete(entityId);
            if (componentSet.size === 0) {
                this._componentIndex.delete(componentName);
            }
        }
    }
}

/**
 * Creates a new EntityManager instance
 * @returns {EntityManager}
 */
export function createEntityManager() {
    return new EntityManager();
}

export default EntityManager;
