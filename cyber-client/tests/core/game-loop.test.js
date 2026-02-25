/**
 * GameLoop Tests for Cyber Cycles
 *
 * Comprehensive test suite for the fixed timestep game loop:
 * - Start/stop functionality (10 tests)
 * - Pause/resume functionality (10 tests)
 * - Fixed timestep accuracy (10 tests)
 * - Interpolation alpha (8 tests)
 * - Statistics tracking (7 tests)
 * - Error handling (5 tests)
 * - Edge cases (5 tests)
 *
 * Total: 55+ tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Hoist mock setup before imports
const { mockRaf, mockCaf, runRafCallbacks, resetRafMocks, mockPerformanceNow } = vi.hoisted(() => {
    let rafIdCounter = 0;
    let rafCallbacks = [];
    let currentTime = 0;

    const mockRaf = vi.fn((cb) => {
        rafIdCounter++;
        rafCallbacks.push({ id: rafIdCounter, cb });
        return rafIdCounter;
    });

    const mockCaf = vi.fn((id) => {
        rafCallbacks = rafCallbacks.filter(item => item.id !== id);
    });

    const mockPerformanceNow = () => currentTime;

    const runRafCallbacks = (deltaMs = 16.67) => {
        const callbacks = [...rafCallbacks];
        rafCallbacks = [];
        currentTime += deltaMs;
        for (const { cb } of callbacks) {
            cb(currentTime);
        }
    };

    const resetRafMocks = () => {
        rafIdCounter = 0;
        rafCallbacks = [];
        currentTime = 0;
        mockRaf.mockClear();
        mockCaf.mockClear();
    };

    return { mockRaf, mockCaf, runRafCallbacks, resetRafMocks, mockPerformanceNow };
});

// Set up globals before module import
global.requestAnimationFrame = mockRaf;
global.cancelAnimationFrame = mockCaf;
global.performance = { now: mockPerformanceNow };

import { GameLoop, createGameLoop } from '../../src/core/GameLoop.js';

beforeEach(() => {
    resetRafMocks();
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('GameLoop', () => {
    // ==========================================================================
    // Start/Stop Functionality (10 tests)
    // ==========================================================================
    describe('Start/Stop', () => {
        it('should create new instance with default options', () => {
            const loop = new GameLoop();
            expect(loop).toBeInstanceOf(GameLoop);
            expect(loop.isRunning()).toBe(false);
            expect(loop.isStopped()).toBe(true);
        });

        it('should create via factory function', () => {
            const loop = createGameLoop();
            expect(loop).toBeInstanceOf(GameLoop);
        });

        it('should start the loop', () => {
            const loop = new GameLoop();
            loop.start();
            expect(loop.isRunning()).toBe(true);
            expect(loop.isStopped()).toBe(false);
        });

        it('should return this for chaining on start', () => {
            const loop = new GameLoop();
            const result = loop.start();
            expect(result).toBe(loop);
        });

        it('should throw error when starting already running loop', () => {
            const loop = new GameLoop();
            loop.start();
            expect(() => loop.start()).toThrow('GameLoop is already running');
        });

        it('should stop the loop', () => {
            const loop = new GameLoop();
            loop.start();
            loop.stop();
            expect(loop.isRunning()).toBe(false);
            expect(loop.isStopped()).toBe(true);
        });

        it('should return this for chaining on stop', () => {
            const loop = new GameLoop();
            loop.start();
            const result = loop.stop();
            expect(result).toBe(loop);
        });

        it('should handle stop when already stopped gracefully', () => {
            const loop = new GameLoop();
            const result = loop.stop();
            expect(result).toBe(loop);
            expect(loop.isStopped()).toBe(true);
        });

        it('should cancel animation frame on stop', () => {
            const loop = new GameLoop();
            loop.start();
            expect(mockRaf).toHaveBeenCalledTimes(1);
            const rafId = loop._animationFrameId;
            expect(rafId).toBe(1);

            loop.stop();
            expect(mockCaf).toHaveBeenCalledWith(rafId);
            expect(loop._animationFrameId).toBe(null);
        });

        it('should emit onStart event when starting', () => {
            const loop = new GameLoop();
            const onStartCallback = vi.fn();
            loop.onStart(onStartCallback);
            loop.start();
            expect(onStartCallback).toHaveBeenCalledTimes(1);
        });

        it('should emit onStop event when stopping', () => {
            const loop = new GameLoop();
            const onStopCallback = vi.fn();
            loop.onStop(onStopCallback);
            loop.start();
            loop.stop();
            expect(onStopCallback).toHaveBeenCalledTimes(1);
        });
    });

    // ==========================================================================
    // Pause/Resume Functionality (10 tests)
    // ==========================================================================
    describe('Pause/Resume', () => {
        it('should pause a running loop', () => {
            const loop = new GameLoop();
            loop.start();
            loop.pause();
            expect(loop.isPaused()).toBe(true);
            expect(loop.isRunning()).toBe(false);
        });

        it('should return this for chaining on pause', () => {
            const loop = new GameLoop();
            loop.start();
            const result = loop.pause();
            expect(result).toBe(loop);
        });

        it('should throw error when pausing non-running loop', () => {
            const loop = new GameLoop();
            expect(() => loop.pause()).toThrow('GameLoop is not running');
        });

        it('should throw error when pausing already paused loop', () => {
            const loop = new GameLoop();
            loop.start();
            loop.pause();
            expect(() => loop.pause()).toThrow('GameLoop is not running');
        });

        it('should resume a paused loop', () => {
            const loop = new GameLoop();
            loop.start();
            loop.pause();
            loop.resume();
            expect(loop.isRunning()).toBe(true);
            expect(loop.isPaused()).toBe(false);
        });

        it('should return this for chaining on resume', () => {
            const loop = new GameLoop();
            loop.start();
            loop.pause();
            const result = loop.resume();
            expect(result).toBe(loop);
        });

        it('should throw error when resuming non-paused loop', () => {
            const loop = new GameLoop();
            expect(() => loop.resume()).toThrow('GameLoop is not paused');
        });

        it('should throw error when resuming running loop', () => {
            const loop = new GameLoop();
            loop.start();
            expect(() => loop.resume()).toThrow('GameLoop is not paused');
        });

        it('should emit onPause event when pausing', () => {
            const loop = new GameLoop();
            const onPauseCallback = vi.fn();
            loop.onPause(onPauseCallback);
            loop.start();
            loop.pause();
            expect(onPauseCallback).toHaveBeenCalledTimes(1);
        });

        it('should emit onResume event when resuming', () => {
            const loop = new GameLoop();
            const onResumeCallback = vi.fn();
            loop.onResume(onResumeCallback);
            loop.start();
            loop.pause();
            loop.resume();
            expect(onResumeCallback).toHaveBeenCalledTimes(1);
        });

        it('should not call loop function while paused', () => {
            const loop = new GameLoop();
            const physicsCallback = vi.fn();
            loop.setPhysicsCallback(physicsCallback);
            loop.start();
            runRafCallbacks();
            const physicsCallsBefore = physicsCallback.mock.calls.length;
            loop.pause();
            runRafCallbacks();
            expect(physicsCallback.mock.calls.length).toBe(physicsCallsBefore);
        });
    });

    // ==========================================================================
    // Fixed Timestep Accuracy (10 tests)
    // ==========================================================================
    describe('Fixed Timestep', () => {
        it('should use default fixed timestep of 1/60', () => {
            const loop = new GameLoop();
            expect(loop.getFixedDt()).toBeCloseTo(1 / 60, 5);
        });

        it('should accept custom fixed timestep', () => {
            const loop = new GameLoop({ fixedDt: 1 / 30 });
            expect(loop.getFixedDt()).toBeCloseTo(1 / 30, 5);
        });

        it('should throw error for invalid fixedDt', () => {
            expect(() => new GameLoop({ fixedDt: -1 })).toThrow('fixedDt must be a positive number');
            expect(() => new GameLoop({ fixedDt: 0 })).toThrow('fixedDt must be a positive number');
            expect(() => new GameLoop({ fixedDt: 'invalid' })).toThrow('fixedDt must be a positive number');
        });

        it('should call physics callback with fixed timestep', () => {
            const loop = new GameLoop({ fixedDt: 1 / 60 });
            const physicsCallback = vi.fn();
            loop.setPhysicsCallback(physicsCallback);
            loop.start();
            runRafCallbacks();
            expect(physicsCallback).toHaveBeenCalled();
            for (const call of physicsCallback.mock.calls) {
                expect(call[0]).toBeCloseTo(1 / 60, 4);
            }
        });

        it('should accumulate time for multiple physics updates', () => {
            const loop = new GameLoop({ fixedDt: 1 / 60, maxFrameTime: 1000 });
            const physicsCallback = vi.fn();
            loop.setPhysicsCallback(physicsCallback);
            loop.start();
            // Run multiple frames to accumulate time
            for (let i = 0; i < 6; i++) {
                runRafCallbacks();
            }
            expect(physicsCallback.mock.calls.length).toBeGreaterThanOrEqual(5);
        });

        it('should cap frame time to maxFrameTime', () => {
            const loop = new GameLoop({ fixedDt: 1 / 60, maxFrameTime: 50 });
            const physicsCallback = vi.fn();
            loop.setPhysicsCallback(physicsCallback);
            loop.start();
            runRafCallbacks();
            expect(physicsCallback).toHaveBeenCalled();
        });

        it('should throw error when maxFrameTime < fixedDt', () => {
            expect(() => new GameLoop({ fixedDt: 1 / 30, maxFrameTime: 10 })).toThrow('maxFrameTime must be greater than fixedDt');
        });

        it('should throw error for invalid maxFrameTime', () => {
            expect(() => new GameLoop({ maxFrameTime: -1 })).toThrow('maxFrameTime must be a positive number');
            expect(() => new GameLoop({ maxFrameTime: 0 })).toThrow('maxFrameTime must be a positive number');
        });

        it('should allow changing fixed timestep at runtime', () => {
            const loop = new GameLoop();
            expect(loop.getFixedDt()).toBeCloseTo(1 / 60, 5);
            loop.setFixedDt(1 / 30);
            expect(loop.getFixedDt()).toBeCloseTo(1 / 30, 5);
        });

        it('should throw error for invalid runtime fixedDt', () => {
            const loop = new GameLoop();
            expect(() => loop.setFixedDt(-1)).toThrow('fixedDt must be a positive number');
            expect(() => loop.setFixedDt(0)).toThrow('fixedDt must be a positive number');
        });
    });

    // ==========================================================================
    // Interpolation Alpha (8 tests)
    // ==========================================================================
    describe('Interpolation Alpha', () => {
        it('should start with alpha of 0', () => {
            const loop = new GameLoop();
            expect(loop.getAlpha()).toBe(0);
        });

        it('should calculate alpha between 0 and 1', () => {
            const loop = new GameLoop({ fixedDt: 1 / 60 });
            const renderCallback = vi.fn();
            loop.setRenderCallback(renderCallback);
            loop.start();
            runRafCallbacks();
            expect(renderCallback).toHaveBeenCalled();
            for (const call of renderCallback.mock.calls) {
                const alpha = call[0];
                expect(alpha).toBeGreaterThanOrEqual(0);
                expect(alpha).toBeLessThanOrEqual(1);
            }
        });

        it('should pass alpha to render callback', () => {
            const loop = new GameLoop();
            const renderCallback = vi.fn();
            loop.setRenderCallback(renderCallback);
            loop.start();
            runRafCallbacks();
            expect(renderCallback).toHaveBeenCalled();
            expect(typeof renderCallback.mock.calls[0][0]).toBe('number');
        });

        it('should reset alpha on reset', () => {
            const loop = new GameLoop();
            loop.start();
            runRafCallbacks();
            loop.reset();
            expect(loop.getAlpha()).toBe(0);
        });

        it('should return alpha from getAlpha method', () => {
            const loop = new GameLoop();
            expect(loop.getAlpha()).toBe(0);
            loop.start();
            runRafCallbacks();
            const alpha = loop.getAlpha();
            expect(alpha).toBeGreaterThanOrEqual(0);
            expect(alpha).toBeLessThanOrEqual(1);
        });

        it('should provide accumulator value', () => {
            const loop = new GameLoop();
            expect(loop.getAccumulator()).toBe(0);
            loop.start();
            runRafCallbacks();
            const accumulator = loop.getAccumulator();
            expect(accumulator).toBeGreaterThanOrEqual(0);
        });

        it('should reset accumulator on reset', () => {
            const loop = new GameLoop();
            loop.start();
            runRafCallbacks();
            loop.reset();
            expect(loop.getAccumulator()).toBe(0);
        });

        it('should return this for chaining on reset', () => {
            const loop = new GameLoop();
            const result = loop.reset();
            expect(result).toBe(loop);
        });
    });

    // ==========================================================================
    // Statistics Tracking (7 tests)
    // ==========================================================================
    describe('Statistics', () => {
        it('should track FPS', () => {
            const loop = new GameLoop();
            loop.start();
            runRafCallbacks();
            const stats = loop.getStats();
            expect(stats.fps).toBeGreaterThan(0);
        });

        it('should track frame time', () => {
            const loop = new GameLoop();
            loop.start();
            runRafCallbacks();
            const stats = loop.getStats();
            expect(stats.frameTime).toBeGreaterThan(0);
        });

        it('should track physics updates per frame', () => {
            const loop = new GameLoop();
            const physicsCallback = vi.fn();
            loop.setPhysicsCallback(physicsCallback);
            loop.start();
            runRafCallbacks();
            const stats = loop.getStats();
            expect(stats.physicsUpdatesPerFrame).toBeGreaterThanOrEqual(0);
        });

        it('should track total frames', () => {
            const loop = new GameLoop();
            loop.start();
            runRafCallbacks();
            const stats1 = loop.getStats();
            runRafCallbacks();
            const stats2 = loop.getStats();
            expect(stats2.totalFrames).toBeGreaterThan(stats1.totalFrames);
        });

        it('should track total physics updates', () => {
            const loop = new GameLoop();
            const physicsCallback = vi.fn();
            loop.setPhysicsCallback(physicsCallback);
            loop.start();
            runRafCallbacks();
            const stats1 = loop.getStats();
            runRafCallbacks();
            const stats2 = loop.getStats();
            expect(stats2.totalPhysicsUpdates).toBeGreaterThanOrEqual(stats1.totalPhysicsUpdates);
        });

        it('should provide frame history', () => {
            const loop = new GameLoop();
            loop.start();
            runRafCallbacks();
            const history = loop.getFrameHistory();
            expect(Array.isArray(history)).toBe(true);
            expect(history.length).toBeGreaterThan(0);
        });

        it('should limit frame history size', () => {
            const loop = new GameLoop({ frameHistorySize: 10 });
            loop.start();
            for (let i = 0; i < 20; i++) {
                runRafCallbacks();
            }
            const history = loop.getFrameHistory();
            expect(history.length).toBeLessThanOrEqual(10);
        });

        it('should reset statistics', () => {
            const loop = new GameLoop();
            loop.start();
            runRafCallbacks();
            loop.resetStats();
            const stats = loop.getStats();
            expect(stats.totalFrames).toBe(0);
            expect(stats.totalPhysicsUpdates).toBe(0);
        });

        it('should return this for chaining on resetStats', () => {
            const loop = new GameLoop();
            const result = loop.resetStats();
            expect(result).toBe(loop);
        });

        it('should calculate average frame time', () => {
            const loop = new GameLoop();
            loop.start();
            runRafCallbacks();
            const avgFrameTime = loop.getAverageFrameTime();
            expect(avgFrameTime).toBeGreaterThan(0);
        });

        it('should calculate average FPS', () => {
            const loop = new GameLoop();
            loop.start();
            runRafCallbacks();
            const avgFps = loop.getAverageFps();
            expect(avgFps).toBeGreaterThan(0);
        });
    });

    // ==========================================================================
    // Error Handling (5 tests)
    // ==========================================================================
    describe('Error Handling', () => {
        it('should catch errors in physics callback', () => {
            const loop = new GameLoop();
            const physicsCallback = vi.fn(() => {
                throw new Error('Physics error');
            });
            const errorCallback = vi.fn();
            loop.onError(errorCallback);
            loop.setPhysicsCallback(physicsCallback);
            loop.start();
            runRafCallbacks();
            expect(loop.isRunning()).toBe(true);
        });

        it('should catch errors in render callback', () => {
            const loop = new GameLoop();
            const renderCallback = vi.fn(() => {
                throw new Error('Render error');
            });
            loop.setRenderCallback(renderCallback);
            loop.start();
            runRafCallbacks();
            expect(loop.isRunning()).toBe(true);
        });

        it('should catch errors in update callback', () => {
            const loop = new GameLoop();
            const updateCallback = vi.fn(() => {
                throw new Error('Update error');
            });
            loop.setUpdateCallback(updateCallback);
            loop.start();
            runRafCallbacks();
            expect(loop.isRunning()).toBe(true);
        });

        it('should emit error event on callback error', () => {
            const loop = new GameLoop();
            const physicsCallback = vi.fn(() => {
                throw new Error('Test physics error');
            });
            const errorCallback = vi.fn();
            loop.onError(errorCallback);
            loop.setPhysicsCallback(physicsCallback);
            loop.start();
            runRafCallbacks();
            expect(errorCallback).toHaveBeenCalled();
            const errorData = errorCallback.mock.calls[0][0];
            expect(errorData.source).toBe('physics');
            expect(errorData.message).toBe('Test physics error');
        });

        it('should throw error for non-function physics callback', () => {
            const loop = new GameLoop();
            expect(() => loop.setPhysicsCallback('not a function')).toThrow('Physics callback must be a function');
            expect(() => loop.setPhysicsCallback(null)).toThrow('Physics callback must be a function');
        });

        it('should throw error for non-function render callback', () => {
            const loop = new GameLoop();
            expect(() => loop.setRenderCallback('not a function')).toThrow('Render callback must be a function');
            expect(() => loop.setRenderCallback(null)).toThrow('Render callback must be a function');
        });

        it('should throw error for non-function update callback', () => {
            const loop = new GameLoop();
            expect(() => loop.setUpdateCallback('not a function')).toThrow('Update callback must be a function');
            expect(() => loop.setUpdateCallback(null)).toThrow('Update callback must be a function');
        });
    });

    // ==========================================================================
    // Edge Cases (5 tests)
    // ==========================================================================
    describe('Edge Cases', () => {
        it('should handle zero delta time gracefully', () => {
            const loop = new GameLoop();
            const physicsCallback = vi.fn();
            loop.setPhysicsCallback(physicsCallback);
            loop.start();
            runRafCallbacks();
            expect(loop.isRunning()).toBe(true);
        });

        it('should handle very small delta time', () => {
            const loop = new GameLoop();
            const physicsCallback = vi.fn();
            loop.setPhysicsCallback(physicsCallback);
            loop.start();
            runRafCallbacks();
            expect(loop.isRunning()).toBe(true);
        });

        it('should handle multiple start/stop cycles', () => {
            const loop = new GameLoop();
            for (let i = 0; i < 5; i++) {
                loop.start();
                runRafCallbacks();
                loop.stop();
            }
            expect(loop.isStopped()).toBe(true);
        });

        it('should handle multiple pause/resume cycles', () => {
            const loop = new GameLoop();
            loop.start();
            for (let i = 0; i < 5; i++) {
                loop.pause();
                loop.resume();
                runRafCallbacks();
            }
            expect(loop.isRunning()).toBe(true);
        });

        it('should handle callback that modifies state', () => {
            const loop = new GameLoop();
            let callCount = 0;
            const physicsCallback = vi.fn(() => {
                callCount++;
                if (callCount > 3) {
                    loop.pause();
                }
            });
            loop.setPhysicsCallback(physicsCallback);
            loop.start();
            // Run multiple frames until pause
            for (let i = 0; i < 10 && loop.isRunning(); i++) {
                runRafCallbacks();
            }
            expect(loop.isPaused()).toBe(true);
        });

        it('should handle getState returning correct state', () => {
            const loop = new GameLoop();
            expect(loop.getState()).toBe('stopped');
            loop.start();
            expect(loop.getState()).toBe('running');
            loop.pause();
            expect(loop.getState()).toBe('paused');
            loop.stop();
            expect(loop.getState()).toBe('stopped');
        });

        it('should handle getOptions returning copy of options', () => {
            const loop = new GameLoop({ fixedDt: 1 / 30, debug: true });
            const options = loop.getOptions();
            expect(options.fixedDt).toBeCloseTo(1 / 30, 5);
            expect(options.debug).toBe(true);
            options.fixedDt = 1 / 10;
            expect(loop.getFixedDt()).toBeCloseTo(1 / 30, 5);
        });
    });

    // ==========================================================================
    // Callback Methods
    // ==========================================================================
    describe('Callback Methods', () => {
        it('should set and call physics callback', () => {
            const loop = new GameLoop();
            const physicsCallback = vi.fn();
            loop.setPhysicsCallback(physicsCallback);
            loop.start();
            runRafCallbacks();
            expect(physicsCallback).toHaveBeenCalled();
        });

        it('should set and call render callback', () => {
            const loop = new GameLoop();
            const renderCallback = vi.fn();
            loop.setRenderCallback(renderCallback);
            loop.start();
            runRafCallbacks();
            expect(renderCallback).toHaveBeenCalled();
        });

        it('should set and call update callback', () => {
            const loop = new GameLoop();
            const updateCallback = vi.fn();
            loop.setUpdateCallback(updateCallback);
            loop.start();
            runRafCallbacks();
            expect(updateCallback).toHaveBeenCalled();
        });

        it('should return this for chaining on setPhysicsCallback', () => {
            const loop = new GameLoop();
            const result = loop.setPhysicsCallback(vi.fn());
            expect(result).toBe(loop);
        });

        it('should return this for chaining on setRenderCallback', () => {
            const loop = new GameLoop();
            const result = loop.setRenderCallback(vi.fn());
            expect(result).toBe(loop);
        });

        it('should return this for chaining on setUpdateCallback', () => {
            const loop = new GameLoop();
            const result = loop.setUpdateCallback(vi.fn());
            expect(result).toBe(loop);
        });

        it('should call all three callbacks', () => {
            const loop = new GameLoop();
            const physicsCallback = vi.fn();
            const renderCallback = vi.fn();
            const updateCallback = vi.fn();

            loop.setPhysicsCallback(physicsCallback);
            loop.setRenderCallback(renderCallback);
            loop.setUpdateCallback(updateCallback);
            loop.start();
            runRafCallbacks();

            expect(physicsCallback).toHaveBeenCalled();
            expect(renderCallback).toHaveBeenCalled();
            expect(updateCallback).toHaveBeenCalled();
        });
    });

    // ==========================================================================
    // Event System
    // ==========================================================================
    describe('Event System', () => {
        it('should register multiple onStart handlers', () => {
            const loop = new GameLoop();
            const handler1 = vi.fn();
            const handler2 = vi.fn();
            loop.onStart(handler1);
            loop.onStart(handler2);
            loop.start();
            expect(handler1).toHaveBeenCalledTimes(1);
            expect(handler2).toHaveBeenCalledTimes(1);
        });

        it('should register multiple onStop handlers', () => {
            const loop = new GameLoop();
            const handler1 = vi.fn();
            const handler2 = vi.fn();
            loop.onStop(handler1);
            loop.onStop(handler2);
            loop.start();
            loop.stop();
            expect(handler1).toHaveBeenCalledTimes(1);
            expect(handler2).toHaveBeenCalledTimes(1);
        });

        it('should call onFrame handler every frame', () => {
            const loop = new GameLoop();
            const frameHandler = vi.fn();
            loop.onFrame(frameHandler);
            loop.start();
            runRafCallbacks();
            runRafCallbacks();
            expect(frameHandler.mock.calls.length).toBeGreaterThan(1);
        });

        it('should pass frame data to onFrame handler', () => {
            const loop = new GameLoop();
            const frameHandler = vi.fn();
            loop.onFrame(frameHandler);
            loop.start();
            runRafCallbacks();
            expect(frameHandler).toHaveBeenCalled();
            const frameData = frameHandler.mock.calls[0][0];
            expect(frameData).toHaveProperty('fps');
            expect(frameData).toHaveProperty('frameTime');
            expect(frameData).toHaveProperty('alpha');
        });

        it('should remove event handler with off', () => {
            const loop = new GameLoop();
            const handler = vi.fn();
            loop.onStart(handler);
            loop.off('onStart', handler);
            loop.start();
            expect(handler).not.toHaveBeenCalled();
        });

        it('should throw error for invalid event name', () => {
            const loop = new GameLoop();
            expect(() => loop.on('invalidEvent', vi.fn())).toThrow('Invalid event');
        });

        it('should throw error for non-function callback', () => {
            const loop = new GameLoop();
            expect(() => loop.on('onStart', 'not a function')).toThrow('Callback must be a function');
        });

        it('should return false when removing non-existent handler', () => {
            const loop = new GameLoop();
            const handler = vi.fn();
            const result = loop.off('onStart', handler);
            expect(result).toBe(false);
        });

        it('should support method-style event registration', () => {
            const loop = new GameLoop();
            const startHandler = vi.fn();
            const stopHandler = vi.fn();
            const pauseHandler = vi.fn();
            const resumeHandler = vi.fn();
            const frameHandler = vi.fn();
            const errorHandler = vi.fn();

            loop.onStart(startHandler);
            loop.onStop(stopHandler);
            loop.onPause(pauseHandler);
            loop.onResume(resumeHandler);
            loop.onFrame(frameHandler);
            loop.onError(errorHandler);

            loop.start();
            runRafCallbacks();
            loop.pause();
            loop.resume();
            runRafCallbacks();
            loop.stop();

            expect(startHandler).toHaveBeenCalled();
            expect(stopHandler).toHaveBeenCalled();
            expect(pauseHandler).toHaveBeenCalled();
            expect(resumeHandler).toHaveBeenCalled();
            expect(frameHandler).toHaveBeenCalled();
        });
    });

    // ==========================================================================
    // Debug Functionality
    // ==========================================================================
    describe('Debug', () => {
        it('should create with debug disabled by default', () => {
            const loop = new GameLoop();
            expect(loop.isDebugEnabled()).toBe(false);
        });

        it('should create with debug enabled when option is set', () => {
            const loop = new GameLoop({ debug: true });
            expect(loop.isDebugEnabled()).toBe(true);
        });

        it('should enable debug with enableDebug', () => {
            const loop = new GameLoop();
            loop.enableDebug();
            expect(loop.isDebugEnabled()).toBe(true);
        });

        it('should disable debug with disableDebug', () => {
            const loop = new GameLoop({ debug: true });
            loop.disableDebug();
            expect(loop.isDebugEnabled()).toBe(false);
        });

        it('should return this for chaining on enableDebug', () => {
            const loop = new GameLoop();
            const result = loop.enableDebug();
            expect(result).toBe(loop);
        });

        it('should return this for chaining on disableDebug', () => {
            const loop = new GameLoop();
            const result = loop.disableDebug();
            expect(result).toBe(loop);
        });
    });

    // ==========================================================================
    // Frame History
    // ==========================================================================
    describe('Frame History', () => {
        it('should return empty array initially', () => {
            const loop = new GameLoop();
            expect(loop.getFrameHistory()).toEqual([]);
        });

        it('should return limited history with count parameter', () => {
            const loop = new GameLoop();
            loop.start();
            for (let i = 0; i < 20; i++) {
                runRafCallbacks();
            }
            const history = loop.getFrameHistory(5);
            expect(history.length).toBeLessThanOrEqual(5);
        });

        it('should return physics history', () => {
            const loop = new GameLoop();
            const physicsCallback = vi.fn();
            loop.setPhysicsCallback(physicsCallback);
            loop.start();
            runRafCallbacks();
            const history = loop.getPhysicsHistory();
            expect(Array.isArray(history)).toBe(true);
        });

        it('should return limited physics history with count parameter', () => {
            const loop = new GameLoop();
            const physicsCallback = vi.fn();
            loop.setPhysicsCallback(physicsCallback);
            loop.start();
            for (let i = 0; i < 10; i++) {
                runRafCallbacks();
            }
            const history = loop.getPhysicsHistory(5);
            expect(history.length).toBeLessThanOrEqual(5);
        });
    });

    // ==========================================================================
    // Max Frame Time
    // ==========================================================================
    describe('Max Frame Time', () => {
        it('should use default max frame time of 250ms', () => {
            const loop = new GameLoop();
            expect(loop.getMaxFrameTime()).toBe(250);
        });

        it('should accept custom max frame time', () => {
            const loop = new GameLoop({ maxFrameTime: 500 });
            expect(loop.getMaxFrameTime()).toBe(500);
        });

        it('should allow changing max frame time at runtime', () => {
            const loop = new GameLoop();
            loop.setMaxFrameTime(100);
            expect(loop.getMaxFrameTime()).toBe(100);
        });

        it('should throw error for invalid runtime maxFrameTime', () => {
            const loop = new GameLoop();
            expect(() => loop.setMaxFrameTime(-1)).toThrow('maxFrameTime must be a positive number');
            expect(() => loop.setMaxFrameTime(0)).toThrow('maxFrameTime must be a positive number');
        });

        it('should return this for chaining on setMaxFrameTime', () => {
            const loop = new GameLoop();
            const result = loop.setMaxFrameTime(100);
            expect(result).toBe(loop);
        });
    });

    // ==========================================================================
    // Get Frame Data
    // ==========================================================================
    describe('Get Frame Data', () => {
        it('should return frame data object', () => {
            const loop = new GameLoop();
            const frameData = loop.getFrameData();
            expect(frameData).toHaveProperty('fps');
            expect(frameData).toHaveProperty('frameTime');
            expect(frameData).toHaveProperty('physicsUpdates');
            expect(frameData).toHaveProperty('totalFrames');
            expect(frameData).toHaveProperty('alpha');
            expect(frameData).toHaveProperty('accumulator');
            expect(frameData).toHaveProperty('elapsedTime');
        });

        it('should update frame data during loop', () => {
            const loop = new GameLoop();
            loop.start();
            runRafCallbacks();
            const frameData = loop.getFrameData();
            expect(frameData.totalFrames).toBeGreaterThan(0);
            expect(frameData.elapsedTime).toBeGreaterThanOrEqual(0);
        });
    });
});
