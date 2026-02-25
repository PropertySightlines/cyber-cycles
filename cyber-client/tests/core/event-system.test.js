/**
 * EventSystem Tests for Cyber Cycles
 *
 * Tests for the event emitter system:
 * - Basic subscribe/unsubscribe operations
 * - Event emission
 * - One-time listeners
 * - Wildcard subscriptions
 * - Error handling
 * - Edge cases
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventSystem, createEventSystem } from '../../src/core/EventSystem.js';

describe('EventSystem', () => {
    describe('Constructor', () => {
        it('should create new instance', () => {
            const events = new EventSystem();
            expect(events).toBeInstanceOf(EventSystem);
        });

        it('should start with no events', () => {
            const events = new EventSystem();
            expect(events.eventNames()).toEqual([]);
        });

        it('should create via factory function', () => {
            const events = createEventSystem();
            expect(events).toBeInstanceOf(EventSystem);
        });
    });

    describe('Subscribe (on)', () => {
        let events;

        beforeEach(() => {
            events = new EventSystem();
        });

        it('should subscribe to an event', () => {
            const callback = vi.fn();
            events.on('test:event', callback);
            expect(events.hasListeners('test:event')).toBe(true);
        });

        it('should accept multiple listeners for same event', () => {
            const callback1 = vi.fn();
            const callback2 = vi.fn();
            events.on('test:event', callback1);
            events.on('test:event', callback2);
            expect(events.listenerCount('test:event')).toBe(2);
        });

        it('should throw error for non-string event name', () => {
            expect(() => events.on(123, vi.fn())).toThrow('Event name must be a string');
            expect(() => events.on(null, vi.fn())).toThrow('Event name must be a string');
        });

        it('should throw error for non-function callback', () => {
            expect(() => events.on('test:event', 'not a function')).toThrow('Callback must be a function');
            expect(() => events.on('test:event', null)).toThrow('Callback must be a function');
        });

        it('should return the callback', () => {
            const callback = vi.fn();
            const result = events.on('test:event', callback);
            expect(result).toBe(callback);
        });

        it('should handle event names with colons', () => {
            const callback = vi.fn();
            events.on('player:join:game', callback);
            expect(events.hasListeners('player:join:game')).toBe(true);
        });

        it('should handle event names with dots', () => {
            const callback = vi.fn();
            events.on('game.state.changed', callback);
            expect(events.hasListeners('game.state.changed')).toBe(true);
        });
    });

    describe('Emit', () => {
        let events;

        beforeEach(() => {
            events = new EventSystem();
        });

        it('should call listener when event is emitted', () => {
            const callback = vi.fn();
            events.on('test:event', callback);
            events.emit('test:event');
            expect(callback).toHaveBeenCalledTimes(1);
        });

        it('should pass data to listener', () => {
            const callback = vi.fn();
            events.on('test:event', callback);
            const testData = { foo: 'bar', count: 42 };
            events.emit('test:event', testData);
            expect(callback).toHaveBeenCalledWith(testData, 'test:event');
        });

        it('should call all listeners for an event', () => {
            const callback1 = vi.fn();
            const callback2 = vi.fn();
            const callback3 = vi.fn();
            events.on('test:event', callback1);
            events.on('test:event', callback2);
            events.on('test:event', callback3);
            
            events.emit('test:event');
            
            expect(callback1).toHaveBeenCalledTimes(1);
            expect(callback2).toHaveBeenCalledTimes(1);
            expect(callback3).toHaveBeenCalledTimes(1);
        });

        it('should return number of callbacks invoked', () => {
            events.on('test:event', vi.fn());
            events.on('test:event', vi.fn());
            events.on('test:event', vi.fn());
            
            const count = events.emit('test:event');
            expect(count).toBe(3);
        });

        it('should not call listeners for unemitted events', () => {
            const callback = vi.fn();
            events.on('test:event', callback);
            events.emit('other:event');
            expect(callback).not.toHaveBeenCalled();
        });

        it('should handle emit with no listeners gracefully', () => {
            const count = events.emit('nonexistent:event');
            expect(count).toBe(0);
        });

        it('should handle emit with null data', () => {
            const callback = vi.fn();
            events.on('test:event', callback);
            events.emit('test:event', null);
            expect(callback).toHaveBeenCalledWith(null, 'test:event');
        });

        it('should handle emit with undefined data', () => {
            const callback = vi.fn();
            events.on('test:event', callback);
            events.emit('test:event', undefined);
            expect(callback).toHaveBeenCalledWith(undefined, 'test:event');
        });

        it('should throw error for non-string event name', () => {
            expect(() => events.emit(123)).toThrow('Event name must be a string');
        });

        it('should continue calling other listeners if one throws', () => {
            const callback1 = vi.fn(() => { throw new Error('Test error'); });
            const callback2 = vi.fn();
            
            events.on('test:event', callback1);
            events.on('test:event', callback2);
            
            expect(() => events.emit('test:event')).not.toThrow();
            expect(callback2).toHaveBeenCalledTimes(1);
        });
    });

    describe('Unsubscribe (off)', () => {
        let events;

        beforeEach(() => {
            events = new EventSystem();
        });

        it('should remove specific listener', () => {
            const callback = vi.fn();
            events.on('test:event', callback);
            events.off('test:event', callback);
            expect(events.hasListeners('test:event')).toBe(false);
        });

        it('should return true when listener is removed', () => {
            const callback = vi.fn();
            events.on('test:event', callback);
            const result = events.off('test:event', callback);
            expect(result).toBe(true);
        });

        it('should return false when listener not found', () => {
            const callback = vi.fn();
            const result = events.off('test:event', callback);
            expect(result).toBe(false);
        });

        it('should remove only the specified listener', () => {
            const callback1 = vi.fn();
            const callback2 = vi.fn();
            events.on('test:event', callback1);
            events.on('test:event', callback2);
            
            events.off('test:event', callback1);
            
            expect(events.hasListeners('test:event')).toBe(true);
            expect(events.listenerCount('test:event')).toBe(1);
        });

        it('should throw error for non-string event name', () => {
            expect(() => events.off(123, vi.fn())).toThrow('Event name must be a string');
        });
    });

    describe('Unsubscribe All (offAll)', () => {
        let events;

        beforeEach(() => {
            events = new EventSystem();
        });

        it('should remove all listeners from an event', () => {
            events.on('test:event', vi.fn());
            events.on('test:event', vi.fn());
            events.on('test:event', vi.fn());
            
            const count = events.offAll('test:event');
            expect(count).toBe(3);
            expect(events.hasListeners('test:event')).toBe(false);
        });

        it('should remove all listeners with wildcard', () => {
            events.on('event1', vi.fn());
            events.on('event2', vi.fn());
            events.on('event3', vi.fn());
            
            const count = events.offAll('*');
            expect(count).toBe(3);
            expect(events.eventNames()).toEqual([]);
        });

        it('should return 0 for non-existent event', () => {
            const count = events.offAll('nonexistent');
            expect(count).toBe(0);
        });
    });

    describe('Once (one-time listeners)', () => {
        let events;

        beforeEach(() => {
            events = new EventSystem();
        });

        it('should call listener once', () => {
            const callback = vi.fn();
            events.once('test:event', callback);
            
            events.emit('test:event');
            events.emit('test:event');
            
            expect(callback).toHaveBeenCalledTimes(1);
        });

        it('should remove listener after first call', () => {
            const callback = vi.fn();
            events.once('test:event', callback);
            
            events.emit('test:event');
            
            expect(events.hasListeners('test:event')).toBe(false);
        });

        it('should pass data to once listener', () => {
            const callback = vi.fn();
            events.once('test:event', callback);
            
            events.emit('test:event', { data: 'test' });
            
            expect(callback).toHaveBeenCalledWith({ data: 'test' }, 'test:event');
        });

        it('should throw error for non-string event name', () => {
            expect(() => events.once(123, vi.fn())).toThrow('Event name must be a string');
        });

        it('should throw error for non-function callback', () => {
            expect(() => events.once('test:event', 'not a function')).toThrow('Callback must be a function');
        });
    });

    describe('Wildcard Subscriptions', () => {
        let events;

        beforeEach(() => {
            events = new EventSystem();
        });

        it('should match events with wildcard pattern', () => {
            const callback = vi.fn();
            events.on('player:*', callback);
            
            events.emit('player:join');
            events.emit('player:leave');
            events.emit('player:score');
            
            expect(callback).toHaveBeenCalledTimes(3);
        });

        it('should not match unrelated events', () => {
            const callback = vi.fn();
            events.on('player:*', callback);
            
            events.emit('enemy:join');
            
            expect(callback).not.toHaveBeenCalled();
        });

        it('should match nested wildcards', () => {
            const callback = vi.fn();
            events.on('game:player:*', callback);
            
            events.emit('game:player:join');
            events.emit('game:player:leave');
            
            expect(callback).toHaveBeenCalledTimes(2);
        });

        it('should match all events with single asterisk', () => {
            const callback = vi.fn();
            events.on('*', callback);
            
            events.emit('event1');
            events.emit('event2');
            events.emit('event3');
            
            expect(callback).toHaveBeenCalledTimes(3);
        });

        it('should work with off for wildcards', () => {
            const callback = vi.fn();
            events.on('player:*', callback);
            
            events.off('player:*', callback);
            
            events.emit('player:join');
            expect(callback).not.toHaveBeenCalled();
        });
    });

    describe('Listener Count and Has Listeners', () => {
        let events;

        beforeEach(() => {
            events = new EventSystem();
        });

        it('should return correct listener count', () => {
            events.on('test:event', vi.fn());
            events.on('test:event', vi.fn());
            events.on('test:event', vi.fn());
            
            expect(events.listenerCount('test:event')).toBe(3);
        });

        it('should return 0 for non-existent event', () => {
            expect(events.listenerCount('nonexistent')).toBe(0);
        });

        it('should return true when listeners exist', () => {
            events.on('test:event', vi.fn());
            expect(events.hasListeners('test:event')).toBe(true);
        });

        it('should return false when no listeners', () => {
            expect(events.hasListeners('nonexistent')).toBe(false);
        });

        it('should count once listeners', () => {
            events.once('test:event', vi.fn());
            expect(events.listenerCount('test:event')).toBe(1);
        });

        it('should count wildcard listeners', () => {
            events.on('player:*', vi.fn());
            expect(events.listenerCount('player:join')).toBe(1);
        });
    });

    describe('Event Names', () => {
        let events;

        beforeEach(() => {
            events = new EventSystem();
        });

        it('should return empty array initially', () => {
            expect(events.eventNames()).toEqual([]);
        });

        it('should return registered event names', () => {
            events.on('event1', vi.fn());
            events.on('event2', vi.fn());
            events.on('event3', vi.fn());
            
            const names = events.eventNames();
            expect(names).toEqual(expect.arrayContaining(['event1', 'event2', 'event3']));
        });

        it('should not duplicate event names', () => {
            events.on('event1', vi.fn());
            events.on('event1', vi.fn());
            
            const names = events.eventNames();
            expect(names.filter(n => n === 'event1')).toHaveLength(1);
        });
    });

    describe('Statistics', () => {
        let events;

        beforeEach(() => {
            events = new EventSystem();
        });

        it('should track total emits', () => {
            events.emit('event1');
            events.emit('event2');
            events.emit('event3');
            
            const stats = events.getStats();
            expect(stats.totalEmits).toBe(3);
        });

        it('should track total listeners', () => {
            events.on('event1', vi.fn());
            events.on('event2', vi.fn());
            
            const stats = events.getStats();
            expect(stats.totalListeners).toBe(2);
        });

        it('should track event count', () => {
            events.on('event1', vi.fn());
            events.on('event2', vi.fn());
            events.on('event3', vi.fn());
            
            const stats = events.getStats();
            expect(stats.eventCount).toBe(3);
        });
    });

    describe('Clear', () => {
        let events;

        beforeEach(() => {
            events = new EventSystem();
            events.on('event1', vi.fn());
            events.on('event2', vi.fn());
            events.once('event3', vi.fn());
            events.emit('event1'); // Increment emit counter
        });

        it('should remove all events', () => {
            events.clear();
            expect(events.eventNames()).toEqual([]);
        });

        it('should reset statistics', () => {
            events.clear();
            const stats = events.getStats();
            expect(stats.totalEmits).toBe(0);
            expect(stats.totalListeners).toBe(0);
        });

        it('should allow re-subscription after clear', () => {
            events.clear();
            events.on('new:event', vi.fn());
            expect(events.hasListeners('new:event')).toBe(true);
        });
    });

    describe('Async Emit', () => {
        let events;

        beforeEach(() => {
            events = new EventSystem();
        });

        it('should emit asynchronously', async () => {
            const callback = vi.fn();
            events.on('test:event', callback);
            
            const promise = events.emitAsync('test:event', { async: true });
            
            // Callback should not be called immediately
            expect(callback).not.toHaveBeenCalled();
            
            await promise;
            
            expect(callback).toHaveBeenCalledTimes(1);
        });

        it('should resolve with callback count', async () => {
            events.on('test:event', vi.fn());
            events.on('test:event', vi.fn());
            
            const count = await events.emitAsync('test:event');
            expect(count).toBe(2);
        });
    });

    describe('Scoped Event System', () => {
        let events;
        let scoped;

        beforeEach(() => {
            events = new EventSystem();
            scoped = events.scope('player');
        });

        it('should prefix events with scope', () => {
            const callback = vi.fn();
            scoped.on('join', callback);
            
            events.emit('player:join');
            
            expect(callback).toHaveBeenCalledTimes(1);
        });

        it('should not affect parent events', () => {
            const parentCallback = vi.fn();
            const scopedCallback = vi.fn();
            
            events.on('other:event', parentCallback);
            scoped.on('join', scopedCallback);
            
            events.emit('other:event');
            events.emit('player:join');
            
            expect(parentCallback).toHaveBeenCalledTimes(1);
            expect(scopedCallback).toHaveBeenCalledTimes(1);
        });

        it('should support scoped off', () => {
            const callback = vi.fn();
            scoped.on('join', callback);
            
            scoped.off('join', callback);
            
            events.emit('player:join');
            expect(callback).not.toHaveBeenCalled();
        });

        it('should support scoped emit', () => {
            const callback = vi.fn();
            events.on('player:move', callback);
            
            scoped.emit('move', { x: 10, z: 20 });
            
            expect(callback).toHaveBeenCalledTimes(1);
        });

        it('should support scoped once', () => {
            const callback = vi.fn();
            scoped.once('join', callback);
            
            events.emit('player:join');
            events.emit('player:join');
            
            expect(callback).toHaveBeenCalledTimes(1);
        });
    });

    describe('Edge Cases', () => {
        let events;

        beforeEach(() => {
            events = new EventSystem();
        });

        it('should handle empty string event name', () => {
            const callback = vi.fn();
            events.on('', callback);
            events.emit('');
            expect(callback).toHaveBeenCalledTimes(1);
        });

        it('should handle very long event names', () => {
            const longName = 'a'.repeat(1000);
            const callback = vi.fn();
            events.on(longName, callback);
            events.emit(longName);
            expect(callback).toHaveBeenCalledTimes(1);
        });

        it('should handle unicode in event names', () => {
            const callback = vi.fn();
            events.on('事件：测试', callback);
            events.emit('事件：测试');
            expect(callback).toHaveBeenCalledTimes(1);
        });

        it('should handle same callback for multiple events', () => {
            const callback = vi.fn();
            events.on('event1', callback);
            events.on('event2', callback);
            events.on('event3', callback);
            
            events.emit('event1');
            events.emit('event2');
            
            expect(callback).toHaveBeenCalledTimes(2);
        });

        it('should handle listener that modifies listeners', () => {
            const results = [];
            
            events.on('test', () => {
                results.push(1);
                events.on('test', () => results.push(2));
            });
            
            events.emit('test');
            events.emit('test');
            
            expect(results).toContain(1);
        });
    });

    describe('Game Integration Scenarios', () => {
        let events;

        beforeEach(() => {
            events = new EventSystem();
        });

        it('should handle player lifecycle events', () => {
            const joinCallback = vi.fn();
            const leaveCallback = vi.fn();
            const deathCallback = vi.fn();

            events.on('player:join', joinCallback);
            events.on('player:leave', leaveCallback);
            events.on('player:death', deathCallback);

            events.emit('player:join', { id: 'player1' });
            events.emit('player:death', { id: 'player1' });
            events.emit('player:leave', { id: 'player1' });

            expect(joinCallback).toHaveBeenCalledWith({ id: 'player1' }, 'player:join');
            expect(deathCallback).toHaveBeenCalledWith({ id: 'player1' }, 'player:death');
            expect(leaveCallback).toHaveBeenCalledWith({ id: 'player1' }, 'player:leave');
        });

        it('should handle game state events', () => {
            const stateCallback = vi.fn();
            
            events.on('game:state:change', stateCallback);
            
            events.emit('game:state:change', { from: 'lobby', to: 'playing' });
            events.emit('game:state:change', { from: 'playing', to: 'ended' });
            
            expect(stateCallback).toHaveBeenCalledTimes(2);
        });

        it('should handle collision events with wildcards', () => {
            const collisionCallback = vi.fn();
            
            // Listen to all collision types
            events.on('collision:*', collisionCallback);
            
            events.emit('collision:player:wall');
            events.emit('collision:player:trail');
            events.emit('collision:player:player');
            
            expect(collisionCallback).toHaveBeenCalledTimes(3);
        });
    });
});
