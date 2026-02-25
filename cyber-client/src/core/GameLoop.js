/**
 * GameLoop - Fixed Timestep Game Loop for Cyber Cycles
 *
 * A robust game loop implementation with fixed timestep physics,
 * variable rendering, and comprehensive statistics tracking.
 *
 * Features:
 * - Fixed timestep physics (default: 1/60s = 16.67ms)
 * - Variable render timestep with interpolation
 * - Accumulator-based frame timing
 * - Pause/resume functionality
 * - Statistics and debug logging
 * - Event system for lifecycle hooks
 * - Error handling with graceful recovery
 *
 * @example
 * const loop = new GameLoop({
 *   fixedDt: 1/60,
 *   maxFrameTime: 250,
 *   debug: true
 * });
 *
 * loop.setPhysicsCallback((dt) => {
 *   // Update physics at fixed timestep
 *   physics.update(dt);
 * });
 *
 * loop.setRenderCallback((alpha) => {
 *   // Render with interpolation alpha (0.0 - 1.0)
 *   renderer.render(alpha);
 * });
 *
 * loop.start();
 *
 * @module GameLoop
 */

/**
 * Default configuration options
 */
const DEFAULT_OPTIONS = Object.freeze({
    /** Fixed physics timestep in seconds (1/60 = 16.67ms) */
    fixedDt: 1 / 60,

    /** Maximum frame time to prevent spiral of death (ms) */
    maxFrameTime: 250,

    /** Enable debug logging */
    debug: false,

    /** Frame history size for statistics */
    frameHistorySize: 60
});

/**
 * GameLoop states
 */
const STATE = Object.freeze({
    STOPPED: 'stopped',
    RUNNING: 'running',
    PAUSED: 'paused'
});

/**
 * GameLoop Class
 *
 * Implements a fixed timestep game loop with variable rendering.
 * Uses requestAnimationFrame for browser compatibility and
 * performance.now() for high-resolution timing.
 */
export class GameLoop {
    /**
     * Creates a new GameLoop instance
     *
     * @param {Object} [options] - Configuration options
     * @param {number} [options.fixedDt=1/60] - Fixed physics timestep (seconds)
     * @param {number} [options.maxFrameTime=250] - Max frame time (ms) to prevent spiral of death
     * @param {boolean} [options.debug=false] - Enable debug logging
     */
    constructor(options = {}) {
        // Merge options with defaults
        this._options = {
            ...DEFAULT_OPTIONS,
            ...options
        };

        // Validate options
        this._validateOptions();

        // State
        this._state = STATE.STOPPED;
        this._animationFrameId = null;

        // Timing
        this._lastTime = 0;
        this._accumulator = 0;
        this._alpha = 0; // Interpolation factor (0.0 - 1.0)

        // Callbacks
        this._physicsCallback = null;
        this._renderCallback = null;
        this._updateCallback = null;

        // Event handlers
        this._eventHandlers = {
            onStart: [],
            onStop: [],
            onPause: [],
            onResume: [],
            onFrame: [],
            onError: []
        };

        // Statistics
        this._stats = {
            fps: 0,
            frameTime: 0,
            physicsUpdates: 0,
            physicsUpdatesPerFrame: 0,
            totalFrames: 0,
            totalPhysicsUpdates: 0,
            startTime: 0,
            elapsedTime: 0
        };

        // Frame history for statistics
        this._frameHistory = [];
        this._physicsHistory = [];

        // Debug state
        this._debugEnabled = this._options.debug;

        // Bind methods
        this._loop = this._loop.bind(this);
    }

    /**
     * Validate configuration options
     *
     * @private
     * @throws {Error} If options are invalid
     */
    _validateOptions() {
        const { fixedDt, maxFrameTime } = this._options;

        if (typeof fixedDt !== 'number' || fixedDt <= 0) {
            throw new Error('fixedDt must be a positive number');
        }

        if (typeof maxFrameTime !== 'number' || maxFrameTime <= 0) {
            throw new Error('maxFrameTime must be a positive number');
        }

        if (maxFrameTime < fixedDt * 1000) {
            throw new Error('maxFrameTime must be greater than fixedDt');
        }
    }

    /**
     * Get high-resolution current time in milliseconds
     *
     * @returns {number} Current time in milliseconds
     * @private
     */
    _now() {
        if (typeof performance !== 'undefined' && performance.now) {
            return performance.now();
        }
        // Fallback for environments without performance.now
        return Date.now();
    }

    /**
     * Main game loop function
     *
     * @param {number} currentTime - Current timestamp from requestAnimationFrame
     * @private
     */
    _loop(currentTime) {
        if (this._state !== STATE.RUNNING) {
            return;
        }

        try {
            // Calculate delta time
            let deltaTime = currentTime - this._lastTime;

            // Cap delta time to prevent spiral of death
            if (deltaTime > this._options.maxFrameTime) {
                deltaTime = this._options.maxFrameTime;
                this._lastTime = currentTime - deltaTime;

                if (this._debugEnabled) {
                    this._log('Frame time capped:', deltaTime.toFixed(2), 'ms');
                }
            }

            // Update last time
            this._lastTime = currentTime;

            // Convert to seconds for physics
            const deltaSeconds = deltaTime / 1000;

            // Add to accumulator
            this._accumulator += deltaSeconds;

            // Track physics updates this frame
            let physicsUpdatesThisFrame = 0;

            // Fixed timestep physics updates
            const fixedDt = this._options.fixedDt;
            while (this._accumulator >= fixedDt) {
                // Execute physics callback
                if (this._physicsCallback) {
                    try {
                        this._physicsCallback(fixedDt);
                    } catch (error) {
                        this._handleError('physics', error);
                    }
                }

                // Execute general update callback
                if (this._updateCallback) {
                    try {
                        this._updateCallback(fixedDt);
                    } catch (error) {
                        this._handleError('update', error);
                    }
                }

                this._accumulator -= fixedDt;
                physicsUpdatesThisFrame++;
                this._stats.totalPhysicsUpdates++;
            }

            // Calculate interpolation alpha (0.0 - 1.0)
            this._alpha = this._accumulator / fixedDt;

            // Execute render callback with interpolation alpha
            if (this._renderCallback) {
                try {
                    this._renderCallback(this._alpha);
                } catch (error) {
                    this._handleError('render', error);
                }
            }

            // Update statistics
            this._updateStats(deltaTime, physicsUpdatesThisFrame);

            // Emit frame event
            this._emitFrameEvent();

            // Request next frame
            this._animationFrameId = requestAnimationFrame(this._loop);
        } catch (error) {
            // Handle unexpected errors in the loop
            this._handleError('loop', error);

            // Continue the loop on non-fatal errors
            this._animationFrameId = requestAnimationFrame(this._loop);
        }
    }

    /**
     * Update statistics
     *
     * @param {number} frameTime - Frame time in milliseconds
     * @param {number} physicsUpdates - Number of physics updates this frame
     * @private
     */
    _updateStats(frameTime, physicsUpdates) {
        this._stats.frameTime = frameTime;
        this._stats.fps = 1000 / frameTime;
        this._stats.physicsUpdatesPerFrame = physicsUpdates;
        this._stats.totalFrames++;
        this._stats.elapsedTime = this._now() - this._stats.startTime;

        // Update frame history
        this._frameHistory.push(frameTime);
        if (this._frameHistory.length > this._options.frameHistorySize) {
            this._frameHistory.shift();
        }

        // Update physics history
        this._physicsHistory.push(physicsUpdates);
        if (this._physicsHistory.length > this._options.frameHistorySize) {
            this._physicsHistory.shift();
        }
    }

    /**
     * Emit frame event to all listeners
     *
     * @private
     */
    _emitFrameEvent() {
        const frameData = this.getFrameData();

        for (const handler of this._eventHandlers.onFrame) {
            try {
                handler(frameData);
            } catch (error) {
                console.error('Error in onFrame handler:', error);
            }
        }
    }

    /**
     * Handle errors in callbacks
     *
     * @param {string} source - Source of the error (physics, render, update, loop)
     * @param {Error} error - The error object
     * @private
     */
    _handleError(source, error) {
        const errorData = {
            source,
            message: error.message,
            stack: error.stack,
            timestamp: this._now()
        };

        if (this._debugEnabled) {
            console.error(`GameLoop [${source}] Error:`, error);
        }

        // Emit error event
        for (const handler of this._eventHandlers.onError) {
            try {
                handler(errorData);
            } catch (handlerError) {
                console.error('Error in error handler:', handlerError);
            }
        }
    }

    /**
     * Log debug message if debug is enabled
     *
     * @param {...any} args - Arguments to log
     * @private
     */
    _log(...args) {
        if (this._debugEnabled) {
            console.log('[GameLoop]', ...args);
        }
    }

    /**
     * Start the game loop
     *
     * @returns {GameLoop} this for chaining
     * @throws {Error} If loop is already running
     */
    start() {
        if (this._state === STATE.RUNNING) {
            throw new Error('GameLoop is already running');
        }

        this._state = STATE.RUNNING;
        this._lastTime = this._now();
        this._stats.startTime = this._lastTime;
        this._accumulator = 0;
        this._alpha = 0;

        this._log('GameLoop started');

        // Emit start event
        for (const handler of this._eventHandlers.onStart) {
            try {
                handler();
            } catch (error) {
                console.error('Error in onStart handler:', error);
            }
        }

        // Start the loop
        this._animationFrameId = requestAnimationFrame(this._loop);

        return this;
    }

    /**
     * Stop the game loop
     *
     * @returns {GameLoop} this for chaining
     */
    stop() {
        if (this._state === STATE.STOPPED) {
            return this;
        }

        this._state = STATE.STOPPED;

        if (this._animationFrameId !== null) {
            cancelAnimationFrame(this._animationFrameId);
            this._animationFrameId = null;
        }

        this._log('GameLoop stopped');

        // Emit stop event
        for (const handler of this._eventHandlers.onStop) {
            try {
                handler();
            } catch (error) {
                console.error('Error in onStop handler:', error);
            }
        }

        return this;
    }

    /**
     * Pause the game loop without resetting timing
     *
     * @returns {GameLoop} this for chaining
     * @throws {Error} If loop is not running
     */
    pause() {
        if (this._state !== STATE.RUNNING) {
            throw new Error('GameLoop is not running');
        }

        this._state = STATE.PAUSED;

        if (this._animationFrameId !== null) {
            cancelAnimationFrame(this._animationFrameId);
            this._animationFrameId = null;
        }

        this._log('GameLoop paused');

        // Emit pause event
        for (const handler of this._eventHandlers.onPause) {
            try {
                handler();
            } catch (error) {
                console.error('Error in onPause handler:', error);
            }
        }

        return this;
    }

    /**
     * Resume the game loop from pause
     *
     * @returns {GameLoop} this for chaining
     * @throws {Error} If loop is not paused
     */
    resume() {
        if (this._state !== STATE.PAUSED) {
            throw new Error('GameLoop is not paused');
        }

        this._state = STATE.RUNNING;
        this._lastTime = this._now(); // Reset last time to prevent large delta

        this._log('GameLoop resumed');

        // Emit resume event
        for (const handler of this._eventHandlers.onResume) {
            try {
                handler();
            } catch (error) {
                console.error('Error in onResume handler:', error);
            }
        }

        // Restart the loop
        this._animationFrameId = requestAnimationFrame(this._loop);

        return this;
    }

    /**
     * Reset the accumulator and timing
     *
     * @returns {GameLoop} this for chaining
     */
    reset() {
        this._accumulator = 0;
        this._alpha = 0;
        this._lastTime = this._now();

        this._log('GameLoop timing reset');

        return this;
    }

    /**
     * Check if the loop is running
     *
     * @returns {boolean} True if running
     */
    isRunning() {
        return this._state === STATE.RUNNING;
    }

    /**
     * Check if the loop is paused
     *
     * @returns {boolean} True if paused
     */
    isPaused() {
        return this._state === STATE.PAUSED;
    }

    /**
     * Check if the loop is stopped
     *
     * @returns {boolean} True if stopped
     */
    isStopped() {
        return this._state === STATE.STOPPED;
    }

    /**
     * Set the physics update callback
     *
     * @param {Function} callback - Callback receiving (fixedDt) parameter
     * @returns {GameLoop} this for chaining
     * @throws {Error} If callback is not a function
     */
    setPhysicsCallback(callback) {
        if (typeof callback !== 'function') {
            throw new Error('Physics callback must be a function');
        }
        this._physicsCallback = callback;
        return this;
    }

    /**
     * Set the render callback
     *
     * @param {Function} callback - Callback receiving (alpha) for interpolation
     * @returns {GameLoop} this for chaining
     * @throws {Error} If callback is not a function
     */
    setRenderCallback(callback) {
        if (typeof callback !== 'function') {
            throw new Error('Render callback must be a function');
        }
        this._renderCallback = callback;
        return this;
    }

    /**
     * Set the general update callback
     *
     * @param {Function} callback - Callback receiving (fixedDt) parameter
     * @returns {GameLoop} this for chaining
     * @throws {Error} If callback is not a function
     */
    setUpdateCallback(callback) {
        if (typeof callback !== 'function') {
            throw new Error('Update callback must be a function');
        }
        this._updateCallback = callback;
        return this;
    }

    /**
     * Get current statistics
     *
     * @returns {Object} Statistics object
     */
    getStats() {
        return {
            fps: Math.round(this._stats.fps * 100) / 100,
            frameTime: Math.round(this._stats.frameTime * 100) / 100,
            physicsUpdatesPerFrame: this._stats.physicsUpdatesPerFrame,
            totalFrames: this._stats.totalFrames,
            totalPhysicsUpdates: this._stats.totalPhysicsUpdates,
            elapsedTime: Math.round(this._stats.elapsedTime),
            averageFrameTime: this.getAverageFrameTime(),
            averageFps: this.getAverageFps()
        };
    }

    /**
     * Get frame history (last N frame times)
     *
     * @param {number} [count] - Number of frames to return (default: all)
     * @returns {number[]} Array of frame times in milliseconds
     */
    getFrameHistory(count) {
        if (count === undefined) {
            return [...this._frameHistory];
        }
        return this._frameHistory.slice(-count);
    }

    /**
     * Get physics update history
     *
     * @param {number} [count] - Number of entries to return
     * @returns {number[]} Array of physics updates per frame
     */
    getPhysicsHistory(count) {
        if (count === undefined) {
            return [...this._physicsHistory];
        }
        return this._physicsHistory.slice(-count);
    }

    /**
     * Get average frame time
     *
     * @returns {number} Average frame time in milliseconds
     */
    getAverageFrameTime() {
        if (this._frameHistory.length === 0) {
            return 0;
        }
        const sum = this._frameHistory.reduce((a, b) => a + b, 0);
        return sum / this._frameHistory.length;
    }

    /**
     * Get average FPS
     *
     * @returns {number} Average frames per second
     */
    getAverageFps() {
        const avgFrameTime = this.getAverageFrameTime();
        if (avgFrameTime <= 0) {
            return 0;
        }
        return 1000 / avgFrameTime;
    }

    /**
     * Reset statistics
     *
     * @returns {GameLoop} this for chaining
     */
    resetStats() {
        this._stats = {
            fps: 0,
            frameTime: 0,
            physicsUpdates: 0,
            physicsUpdatesPerFrame: 0,
            totalFrames: 0,
            totalPhysicsUpdates: 0,
            startTime: 0,
            elapsedTime: 0
        };
        this._frameHistory = [];
        this._physicsHistory = [];

        return this;
    }

    /**
     * Enable debug logging
     *
     * @returns {GameLoop} this for chaining
     */
    enableDebug() {
        this._debugEnabled = true;
        this._log('Debug enabled');
        return this;
    }

    /**
     * Disable debug logging
     *
     * @returns {GameLoop} this for chaining
     */
    disableDebug() {
        this._debugEnabled = false;
        return this;
    }

    /**
     * Check if debug is enabled
     *
     * @returns {boolean} True if debug is enabled
     */
    isDebugEnabled() {
        return this._debugEnabled;
    }

    /**
     * Get current frame data for event handlers
     *
     * @returns {Object} Frame data
     */
    getFrameData() {
        return {
            fps: this._stats.fps,
            frameTime: this._stats.frameTime,
            physicsUpdates: this._stats.physicsUpdatesPerFrame,
            totalFrames: this._stats.totalFrames,
            alpha: this._alpha,
            accumulator: this._accumulator,
            elapsedTime: this._stats.elapsedTime
        };
    }

    /**
     * Get current interpolation alpha
     *
     * @returns {number} Alpha value (0.0 - 1.0)
     */
    getAlpha() {
        return this._alpha;
    }

    /**
     * Get current accumulator value
     *
     * @returns {number} Accumulator value in seconds
     */
    getAccumulator() {
        return this._accumulator;
    }

    /**
     * Get fixed timestep
     *
     * @returns {number} Fixed timestep in seconds
     */
    getFixedDt() {
        return this._options.fixedDt;
    }

    /**
     * Set fixed timestep
     *
     * @param {number} dt - New fixed timestep in seconds
     * @returns {GameLoop} this for chaining
     * @throws {Error} If dt is invalid
     */
    setFixedDt(dt) {
        if (typeof dt !== 'number' || dt <= 0) {
            throw new Error('fixedDt must be a positive number');
        }
        this._options.fixedDt = dt;
        return this;
    }

    /**
     * Get max frame time
     *
     * @returns {number} Max frame time in milliseconds
     */
    getMaxFrameTime() {
        return this._options.maxFrameTime;
    }

    /**
     * Set max frame time
     *
     * @param {number} ms - New max frame time in milliseconds
     * @returns {GameLoop} this for chaining
     * @throws {Error} If ms is invalid
     */
    setMaxFrameTime(ms) {
        if (typeof ms !== 'number' || ms <= 0) {
            throw new Error('maxFrameTime must be a positive number');
        }
        this._options.maxFrameTime = ms;
        return this;
    }

    /**
     * Register event handler
     *
     * @param {string} event - Event name (onStart, onStop, onPause, onResume, onFrame, onError)
     * @param {Function} callback - Event handler callback
     * @returns {GameLoop} this for chaining
     * @throws {Error} If event name is invalid
     */
    on(event, callback) {
        if (!this._eventHandlers.hasOwnProperty(event)) {
            throw new Error(`Invalid event: ${event}. Valid events: ${Object.keys(this._eventHandlers).join(', ')}`);
        }

        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }

        this._eventHandlers[event].push(callback);
        return this;
    }

    /**
     * Remove event handler
     *
     * @param {string} event - Event name
     * @param {Function} callback - Callback to remove
     * @returns {boolean} True if callback was found and removed
     */
    off(event, callback) {
        if (!this._eventHandlers.hasOwnProperty(event)) {
            return false;
        }

        const index = this._eventHandlers[event].indexOf(callback);
        if (index !== -1) {
            this._eventHandlers[event].splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * Register start event handler
     *
     * @param {Function} callback - Handler called when loop starts
     * @returns {GameLoop} this for chaining
     */
    onStart(callback) {
        return this.on('onStart', callback);
    }

    /**
     * Register stop event handler
     *
     * @param {Function} callback - Handler called when loop stops
     * @returns {GameLoop} this for chaining
     */
    onStop(callback) {
        return this.on('onStop', callback);
    }

    /**
     * Register pause event handler
     *
     * @param {Function} callback - Handler called when loop pauses
     * @returns {GameLoop} this for chaining
     */
    onPause(callback) {
        return this.on('onPause', callback);
    }

    /**
     * Register resume event handler
     *
     * @param {Function} callback - Handler called when loop resumes
     * @returns {GameLoop} this for chaining
     */
    onResume(callback) {
        return this.on('onResume', callback);
    }

    /**
     * Register frame event handler
     *
     * @param {Function} callback - Handler called every frame with frame data
     * @returns {GameLoop} this for chaining
     */
    onFrame(callback) {
        return this.on('onFrame', callback);
    }

    /**
     * Register error event handler
     *
     * @param {Function} callback - Handler called on errors
     * @returns {GameLoop} this for chaining
     */
    onError(callback) {
        return this.on('onError', callback);
    }

    /**
     * Get current state
     *
     * @returns {string} Current state ('stopped', 'running', 'paused')
     */
    getState() {
        return this._state;
    }

    /**
     * Get options
     *
     * @returns {Object} Current options
     */
    getOptions() {
        return { ...this._options };
    }
}

/**
 * Create a new GameLoop instance
 *
 * @param {Object} [options] - Configuration options
 * @returns {GameLoop} New GameLoop instance
 */
export function createGameLoop(options) {
    return new GameLoop(options);
}

export default GameLoop;
