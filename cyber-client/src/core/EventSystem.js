/**
 * EventSystem - A simple event emitter for game events
 *
 * This class provides a publish-subscribe pattern implementation for
 * handling game events. It supports multiple listeners per event,
 * wildcard subscriptions, and one-time event handlers.
 *
 * @example
 * const events = new EventSystem();
 * events.on('player:join', (data) => console.log('Player joined:', data));
 * events.emit('player:join', { id: 'player1', name: 'CyberRacer' });
 * events.off('player:join', callback);
 */

export class EventSystem {
    /**
     * Creates a new EventSystem instance
     */
    constructor() {
        // Map of event name -> Set of callback functions
        this._events = new Map();
        
        // Map of event name -> Set of one-time callback functions
        this._onceEvents = new Map();
        
        // For wildcard subscriptions (e.g., 'player:*')
        this._wildcards = new Map();
        
        // Statistics for debugging
        this._stats = {
            totalEmits: 0,
            totalListeners: 0,
            eventsByType: new Map()
        };
    }

    /**
     * Subscribes to an event
     * @param {string} event - The event name to subscribe to
     * @param {Function} callback - The callback function to invoke
     * @param {Object} [options] - Optional configuration
     * @param {number} [options.priority=0] - Callback priority (higher = called first)
     * @returns {Function} The callback for later removal
     */
    on(event, callback, options = {}) {
        if (typeof event !== 'string') {
            throw new Error('Event name must be a string');
        }
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }

        // Handle wildcard subscriptions
        if (event.includes('*')) {
            if (!this._wildcards.has(event)) {
                this._wildcards.set(event, new Set());
            }
            this._wildcards.get(event).add(callback);
        } else {
            if (!this._events.has(event)) {
                this._events.set(event, new Set());
            }
            this._events.get(event).add(callback);
        }

        this._stats.totalListeners++;
        
        // Track events by type
        const eventType = event.split(':')[0];
        const count = this._stats.eventsByType.get(eventType) || 0;
        this._stats.eventsByType.set(eventType, count + 1);

        return callback;
    }

    /**
     * Subscribes to an event once (listener is removed after first emit)
     * @param {string} event - The event name
     * @param {Function} callback - The callback function
     * @returns {Function} The callback
     */
    once(event, callback) {
        if (typeof event !== 'string') {
            throw new Error('Event name must be a string');
        }
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }

        if (!this._onceEvents.has(event)) {
            this._onceEvents.set(event, new Set());
        }
        this._onceEvents.get(event).add(callback);

        return callback;
    }

    /**
     * Unsubscribes from an event
     * @param {string} event - The event name
     * @param {Function} callback - The callback to remove
     * @returns {boolean} True if callback was found and removed
     */
    off(event, callback) {
        if (typeof event !== 'string') {
            throw new Error('Event name must be a string');
        }

        let removed = false;

        // Remove from regular events
        if (this._events.has(event)) {
            removed = this._events.get(event).delete(callback) || removed;
            // Clean up empty event sets
            if (this._events.get(event).size === 0) {
                this._events.delete(event);
            }
        }

        // Remove from once events
        if (this._onceEvents.has(event)) {
            removed = this._onceEvents.get(event).delete(callback) || removed;
            if (this._onceEvents.get(event).size === 0) {
                this._onceEvents.delete(event);
            }
        }

        // Remove from wildcards
        for (const [wildcardEvent, callbacks] of this._wildcards.entries()) {
            if (callbacks.delete(callback)) {
                removed = true;
                if (callbacks.size === 0) {
                    this._wildcards.delete(wildcardEvent);
                }
            }
        }

        if (removed) {
            this._stats.totalListeners = Math.max(0, this._stats.totalListeners - 1);
        }

        return removed;
    }

    /**
     * Unsubscribes all listeners from an event
     * @param {string} event - The event name (use '*' for all events)
     * @returns {number} Number of listeners removed
     */
    offAll(event) {
        if (event === '*') {
            let count = 0;
            for (const callbacks of this._events.values()) {
                count += callbacks.size;
            }
            for (const callbacks of this._onceEvents.values()) {
                count += callbacks.size;
            }
            for (const callbacks of this._wildcards.values()) {
                count += callbacks.size;
            }
            this._events.clear();
            this._onceEvents.clear();
            this._wildcards.clear();
            this._stats.totalListeners = 0;
            this._stats.eventsByType.clear();
            return count;
        }

        let count = 0;

        if (this._events.has(event)) {
            count += this._events.get(event).size;
            this._events.delete(event);
        }

        if (this._onceEvents.has(event)) {
            count += this._onceEvents.get(event).size;
            this._onceEvents.delete(event);
        }

        // Remove wildcard subscriptions for this specific event
        for (const [wildcardEvent, callbacks] of this._wildcards.entries()) {
            count += callbacks.size;
            this._wildcards.delete(wildcardEvent);
        }

        this._stats.totalListeners = Math.max(0, this._stats.totalListeners - count);
        return count;
    }

    /**
     * Emits an event to all subscribers
     * @param {string} event - The event name
     * @param {*} [data] - Data to pass to callbacks
     * @returns {number} Number of callbacks invoked
     */
    emit(event, data) {
        if (typeof event !== 'string') {
            throw new Error('Event name must be a string');
        }

        this._stats.totalEmits++;
        let callbacksInvoked = 0;

        // Create a copy of callbacks to avoid issues if listeners modify the list
        const callbacksToInvoke = [];

        // Regular event listeners
        if (this._events.has(event)) {
            for (const callback of this._events.get(event)) {
                callbacksToInvoke.push(callback);
            }
        }

        // One-time event listeners
        if (this._onceEvents.has(event)) {
            for (const callback of this._onceEvents.get(event)) {
                callbacksToInvoke.push(callback);
            }
            this._onceEvents.delete(event);
        }

        // Wildcard listeners
        for (const [wildcardPattern, callbacks] of this._wildcards.entries()) {
            if (this._matchesWildcard(event, wildcardPattern)) {
                for (const callback of callbacks) {
                    callbacksToInvoke.push(callback);
                }
            }
        }

        // Invoke all callbacks
        for (const callback of callbacksToInvoke) {
            try {
                callback(data, event);
                callbacksInvoked++;
            } catch (error) {
                console.error(`Error in event listener for "${event}":`, error);
            }
        }

        return callbacksInvoked;
    }

    /**
     * Emits an event asynchronously
     * @param {string} event - The event name
     * @param {*} [data] - Data to pass to callbacks
     * @returns {Promise<number>} Number of callbacks invoked
     */
    async emitAsync(event, data) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const count = this.emit(event, data);
                resolve(count);
            }, 0);
        });
    }

    /**
     * Checks if an event has any listeners
     * @param {string} event - The event name
     * @returns {boolean} True if event has listeners
     */
    hasListeners(event) {
        if (this._events.has(event)) {
            return this._events.get(event).size > 0;
        }
        if (this._onceEvents.has(event)) {
            return this._onceEvents.get(event).size > 0;
        }
        
        // Check wildcards
        for (const wildcardPattern of this._wildcards.keys()) {
            if (this._matchesWildcard(event, wildcardPattern)) {
                return this._wildcards.get(wildcardPattern).size > 0;
            }
        }

        return false;
    }

    /**
     * Gets the number of listeners for an event
     * @param {string} event - The event name
     * @returns {number} Number of listeners
     */
    listenerCount(event) {
        let count = 0;

        if (this._events.has(event)) {
            count += this._events.get(event).size;
        }
        if (this._onceEvents.has(event)) {
            count += this._onceEvents.get(event).size;
        }

        // Count matching wildcards
        for (const [wildcardPattern, callbacks] of this._wildcards.entries()) {
            if (this._matchesWildcard(event, wildcardPattern)) {
                count += callbacks.size;
            }
        }

        return count;
    }

    /**
     * Gets all registered event names
     * @returns {Array<string>} Array of event names
     */
    eventNames() {
        const names = new Set();
        
        for (const event of this._events.keys()) {
            names.add(event);
        }
        for (const event of this._onceEvents.keys()) {
            names.add(event);
        }
        for (const event of this._wildcards.keys()) {
            names.add(event);
        }

        return Array.from(names);
    }

    /**
     * Gets debug statistics
     * @returns {{
     *   totalEmits: number,
     *   totalListeners: number,
     *   eventCount: number,
     *   eventsByType: Map<string, number>
     * }}
     */
    getStats() {
        return {
            totalEmits: this._stats.totalEmits,
            totalListeners: this._stats.totalListeners,
            eventCount: this.eventNames().length,
            eventsByType: new Map(this._stats.eventsByType)
        };
    }

    /**
     * Clears all events and resets statistics
     */
    clear() {
        this._events.clear();
        this._onceEvents.clear();
        this._wildcards.clear();
        this._stats = {
            totalEmits: 0,
            totalListeners: 0,
            eventsByType: new Map()
        };
    }

    /**
     * Checks if an event name matches a wildcard pattern
     * @param {string} event - The event name
     * @param {string} pattern - The wildcard pattern (e.g., 'player:*')
     * @returns {boolean} True if matches
     * @private
     */
    _matchesWildcard(event, pattern) {
        if (pattern === '*') return true;
        
        const regexPattern = pattern
            .replace(/\./g, '\\.')
            .replace(/\*/g, '.*');
        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(event);
    }

    /**
     * Creates a scoped event emitter that prefixes all events
     * @param {string} prefix - The prefix to add to all events
     * @returns {EventSystem} Scoped emitter
     */
    scope(prefix) {
        const scoped = new ScopedEventSystem(this, prefix);
        return scoped;
    }
}

/**
 * A scoped event system that prefixes all events
 */
class ScopedEventSystem {
    constructor(parent, prefix) {
        this._parent = parent;
        this._prefix = prefix.endsWith(':') ? prefix : `${prefix}:`;
    }

    on(event, callback, options) {
        return this._parent.on(`${this._prefix}${event}`, callback, options);
    }

    once(event, callback) {
        return this._parent.once(`${this._prefix}${event}`, callback);
    }

    off(event, callback) {
        return this._parent.off(`${this._prefix}${event}`, callback);
    }

    offAll(event) {
        return this._parent.offAll(`${this._prefix}${event}`);
    }

    emit(event, data) {
        return this._parent.emit(`${this._prefix}${event}`, data);
    }

    emitAsync(event, data) {
        return this._parent.emitAsync(`${this._prefix}${event}`, data);
    }

    hasListeners(event) {
        return this._parent.hasListeners(`${this._prefix}${event}`);
    }

    listenerCount(event) {
        return this._parent.listenerCount(`${this._prefix}${event}`);
    }
}

/**
 * Creates a new EventSystem instance
 * @returns {EventSystem}
 */
export function createEventSystem() {
    return new EventSystem();
}

export default EventSystem;
