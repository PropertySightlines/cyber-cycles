/**
 * InputBuffer - Client-side prediction input buffering system
 *
 * Provides a circular buffer for storing player inputs with sequence numbers,
 * timestamps, and server reconciliation support for lag compensation.
 *
 * Features:
 * - Circular buffer for memory efficiency
 * - Sequence number tracking for ordering
 * - Timestamp tracking for age management
 * - Server acknowledgment system
 * - Reconciliation support for state correction
 * - Event emission for all operations
 * - Input validation and sanitization
 *
 * @module InputBuffer
 */

// ============================================================================
// Constants
// ============================================================================

/**
 * Default configuration options
 * @type {Object}
 */
const DEFAULT_OPTIONS = {
    maxBufferSize: 60,      // Maximum number of inputs to buffer (frames)
    maxAge: 200            // Maximum age in milliseconds before cleanup
};

/**
 * Required input fields for validation
 * @type {Array<string>}
 */
const REQUIRED_INPUT_FIELDS = ['timestamp', 'sequence'];

// ============================================================================
// InputBuffer Class
// ============================================================================

/**
 * InputBuffer - Manages buffered inputs for client-side prediction
 *
 * @class
 */
export class InputBuffer {
    /**
     * Create an InputBuffer
     * @param {Object} options - Configuration options
     * @param {number} options.maxBufferSize - Maximum buffer size (default: 60)
     * @param {number} options.maxAge - Maximum input age in ms (default: 200)
     */
    constructor(options = {}) {
        // Configuration
        this.options = {
            ...DEFAULT_OPTIONS,
            ...options
        };

        // Circular buffer storage
        this._buffer = new Map();
        this._sequenceOrder = [];  // Maintains insertion order for iteration

        // Sequence tracking
        this._currentSequence = 0;
        this._lastAcknowledgedSequence = -1;

        // Event callbacks
        this._onInputAddedCallbacks = [];
        this._onInputAcknowledgedCallbacks = [];
        this._onBufferFullCallbacks = [];
        this._onReconciliationCallbacks = [];

        // Statistics
        this._stats = {
            totalInputsAdded: 0,
            totalInputsAcknowledged: 0,
            totalInputsRemoved: 0,
            totalReconciliations: 0,
            maxBufferUsage: 0
        };
    }

    // =========================================================================
    // Core Buffer Operations
    // =========================================================================

    /**
     * Add input to buffer
     * @param {number} timestamp - Input timestamp in milliseconds
     * @param {Object} input - Input data (movement, actions, etc.)
     * @param {number} [sequenceNumber] - Optional sequence number (auto-generated if not provided)
     * @returns {number} The sequence number of the added input
     */
    addInput(timestamp, input, sequenceNumber) {
        const seq = sequenceNumber !== undefined ? sequenceNumber : this.getNextSequenceNumber();

        // Validate and sanitize input
        const sanitizedInput = this.sanitizeInput({
            ...input,
            timestamp,
            sequence: seq,
            addedAt: Date.now()
        });

        // Store in buffer
        this._buffer.set(seq, sanitizedInput);
        this._sequenceOrder.push(seq);

        // Update statistics
        this._stats.totalInputsAdded++;

        // Check buffer size and remove oldest if needed
        if (this._buffer.size > this.options.maxBufferSize) {
            this._removeOldestInput();
            this._emitBufferFull();
        }

        // Update max buffer usage stat
        const usage = this.getBufferUsage();
        if (usage > this._stats.maxBufferUsage) {
            this._stats.maxBufferUsage = usage;
        }

        // Emit event
        this._emitInputAdded(sanitizedInput);

        return seq;
    }

    /**
     * Get specific input by sequence number
     * @param {number} sequenceNumber - Sequence number to retrieve
     * @returns {Object|null} Input data or null if not found
     */
    getInput(sequenceNumber) {
        return this._buffer.get(sequenceNumber) || null;
    }

    /**
     * Get all inputs since a sequence number
     * @param {number} sequenceNumber - Sequence number (exclusive)
     * @returns {Array<Object>} Array of inputs newer than the sequence
     */
    getInputsSince(sequenceNumber) {
        const result = [];
        for (const seq of this._sequenceOrder) {
            if (seq > sequenceNumber) {
                const input = this._buffer.get(seq);
                if (input) {
                    result.push(input);
                }
            }
        }
        return result;
    }

    /**
     * Get inputs in a sequence range
     * @param {number} startSeq - Start sequence (inclusive)
     * @param {number} endSeq - End sequence (inclusive)
     * @returns {Array<Object>} Array of inputs in range
     */
    getInputsBetween(startSeq, endSeq) {
        const result = [];
        for (const seq of this._sequenceOrder) {
            if (seq >= startSeq && seq <= endSeq) {
                const input = this._buffer.get(seq);
                if (input) {
                    result.push(input);
                }
            }
        }
        return result;
    }

    /**
     * Acknowledge sequence up to which server has processed
     * @param {number} sequenceNumber - Last acknowledged sequence number
     * @returns {Array<Object>} Array of acknowledged inputs
     */
    acknowledgeSequence(sequenceNumber) {
        const acknowledged = [];

        for (const seq of this._sequenceOrder) {
            if (seq <= sequenceNumber) {
                const input = this._buffer.get(seq);
                if (input) {
                    acknowledged.push(input);
                    this._buffer.delete(seq);
                    this._stats.totalInputsAcknowledged++;
                }
            }
        }

        // Remove acknowledged sequences from order array
        this._sequenceOrder = this._sequenceOrder.filter(seq => seq > sequenceNumber);

        // Update last acknowledged
        if (sequenceNumber > this._lastAcknowledgedSequence) {
            this._lastAcknowledgedSequence = sequenceNumber;
        }

        // Emit event
        this._emitInputAcknowledged(acknowledged);

        return acknowledged;
    }

    /**
     * Get all unacknowledged inputs
     * @returns {Array<Object>} Array of unacknowledged inputs
     */
    getUnacknowledgedInputs() {
        return this.getInputsSince(this._lastAcknowledgedSequence);
    }

    /**
     * Clear inputs older than maxAge
     * @param {number} currentTime - Current timestamp in milliseconds
     * @returns {number} Number of inputs removed
     */
    clearOldInputs(currentTime) {
        const maxAge = this.options.maxAge;
        const cutoffTime = currentTime - maxAge;
        let removed = 0;

        const sequencesToRemove = [];
        for (const seq of this._sequenceOrder) {
            const input = this._buffer.get(seq);
            if (input && input.addedAt < cutoffTime) {
                sequencesToRemove.push(seq);
            }
        }

        for (const seq of sequencesToRemove) {
            this._buffer.delete(seq);
            removed++;
            this._stats.totalInputsRemoved++;
        }

        this._sequenceOrder = this._sequenceOrder.filter(
            seq => !sequencesToRemove.includes(seq)
        );

        return removed;
    }

    /**
     * Reconcile with server state
     * @param {number} serverSequence - Server's last processed sequence
     * @param {Object} serverState - Server authoritative state
     * @returns {Object} Reconciliation result
     */
    reconcile(serverSequence, serverState) {
        this._stats.totalReconciliations++;

        // Get inputs that need to be replayed (after server sequence)
        const inputsToReplay = this.getInputsSince(serverSequence);

        // Acknowledge up to server sequence
        const acknowledged = this.acknowledgeSequence(serverSequence);

        // Calculate reconciliation data
        const result = {
            serverSequence,
            serverState,
            acknowledgedCount: acknowledged.length,
            inputsToReplay,
            replayCount: inputsToReplay.length,
            timestamp: Date.now()
        };

        // Emit event
        this._emitReconciliation(result);

        return result;
    }

    /**
     * Clear all inputs from buffer
     */
    clear() {
        const clearedCount = this._buffer.size;
        this._buffer.clear();
        this._sequenceOrder = [];
        this._stats.totalInputsRemoved += clearedCount;
    }

    // =========================================================================
    // Sequence Tracking
    // =========================================================================

    /**
     * Get next sequence number
     * @returns {number} Next sequence number
     */
    getNextSequenceNumber() {
        return ++this._currentSequence;
    }

    /**
     * Get current sequence number
     * @returns {number} Current sequence number
     */
    getCurrentSequence() {
        return this._currentSequence;
    }

    /**
     * Set sequence number
     * @param {number} sequenceNumber - New sequence number
     */
    setSequence(sequenceNumber) {
        this._currentSequence = sequenceNumber;
    }

    /**
     * Get last acknowledged sequence
     * @returns {number} Last acknowledged sequence number
     */
    getLastAcknowledgedSequence() {
        return this._lastAcknowledgedSequence;
    }

    // =========================================================================
    // Buffer Management
    // =========================================================================

    /**
     * Get current buffer size
     * @returns {number} Number of inputs in buffer
     */
    size() {
        return this._buffer.size;
    }

    /**
     * Check if buffer is empty
     * @returns {boolean} True if buffer is empty
     */
    isEmpty() {
        return this._buffer.size === 0;
    }

    /**
     * Get oldest input in buffer
     * @returns {Object|null} Oldest input or null if empty
     */
    getOldestInput() {
        if (this._sequenceOrder.length === 0) {
            return null;
        }
        const oldestSeq = this._sequenceOrder[0];
        return this._buffer.get(oldestSeq) || null;
    }

    /**
     * Get newest input in buffer
     * @returns {Object|null} Newest input or null if empty
     */
    getNewestInput() {
        if (this._sequenceOrder.length === 0) {
            return null;
        }
        const newestSeq = this._sequenceOrder[this._sequenceOrder.length - 1];
        return this._buffer.get(newestSeq) || null;
    }

    /**
     * Get buffer usage percentage
     * @returns {number} Buffer usage as percentage (0-100)
     */
    getBufferUsage() {
        return (this._buffer.size / this.options.maxBufferSize) * 100;
    }

    /**
     * Check if buffer is full
     * @returns {boolean} True if buffer is at capacity
     */
    isFull() {
        return this._buffer.size >= this.options.maxBufferSize;
    }

    /**
     * Get buffer capacity
     * @returns {number} Maximum buffer size
     */
    getCapacity() {
        return this.options.maxBufferSize;
    }

    /**
     * Get available space in buffer
     * @returns {number} Number of slots available
     */
    getAvailableSpace() {
        return this.options.maxBufferSize - this._buffer.size;
    }

    // =========================================================================
    // Input Validation
    // =========================================================================

    /**
     * Validate input structure
     * @param {Object} input - Input to validate
     * @returns {{valid: boolean, errors: Array<string>}} Validation result
     */
    validateInput(input) {
        const errors = [];

        if (input === null || input === undefined) {
            errors.push('Input is null or undefined');
            return { valid: false, errors };
        }

        if (typeof input !== 'object') {
            errors.push('Input must be an object');
            return { valid: false, errors };
        }

        // Check required fields
        for (const field of REQUIRED_INPUT_FIELDS) {
            if (!(field in input)) {
                errors.push(`Missing required field: ${field}`);
            }
        }

        // Validate timestamp
        if (input.timestamp !== undefined) {
            if (typeof input.timestamp !== 'number') {
                errors.push('Timestamp must be a number');
            } else if (input.timestamp < 0) {
                errors.push('Timestamp cannot be negative');
            }
        }

        // Validate sequence
        if (input.sequence !== undefined) {
            if (typeof input.sequence !== 'number') {
                errors.push('Sequence must be a number');
            } else if (!Number.isInteger(input.sequence)) {
                errors.push('Sequence must be an integer');
            } else if (input.sequence < 0) {
                errors.push('Sequence cannot be negative');
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Sanitize input data
     * @param {Object} input - Input to sanitize
     * @returns {Object} Sanitized input
     */
    sanitizeInput(input) {
        if (!input || typeof input !== 'object') {
            return {
                timestamp: Date.now(),
                sequence: 0,
                data: {}
            };
        }

        const sanitized = {};

        // Copy and sanitize known fields
        if (typeof input.timestamp === 'number') {
            sanitized.timestamp = Math.max(0, input.timestamp);
        }

        if (typeof input.sequence === 'number' && Number.isInteger(input.sequence)) {
            sanitized.sequence = Math.max(0, input.sequence);
        }

        if (typeof input.addedAt === 'number') {
            sanitized.addedAt = input.addedAt;
        }

        // Copy action/input data fields (exclude internal fields)
        const internalFields = ['timestamp', 'sequence', 'addedAt'];
        for (const key of Object.keys(input)) {
            if (!internalFields.includes(key)) {
                const value = input[key];
                // Only copy primitive values and plain objects
                if (this._isSerializable(value)) {
                    sanitized[key] = value;
                }
            }
        }

        return sanitized;
    }

    /**
     * Check if value is serializable
     * @param {*} value - Value to check
     * @returns {boolean} True if serializable
     * @private
     */
    _isSerializable(value) {
        if (value === null || value === undefined) {
            return true;
        }
        const type = typeof value;
        return type === 'boolean' || type === 'number' || type === 'string' ||
               Array.isArray(value) ||
               (type === 'object' && value.constructor === Object);
    }

    // =========================================================================
    // Event System
    // =========================================================================

    /**
     * Register callback for input added event
     * @param {Function} callback - Callback function
     * @returns {Function} The callback
     */
    onInputAdded(callback) {
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }
        this._onInputAddedCallbacks.push(callback);
        return callback;
    }

    /**
     * Register callback for input acknowledged event
     * @param {Function} callback - Callback function
     * @returns {Function} The callback
     */
    onInputAcknowledged(callback) {
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }
        this._onInputAcknowledgedCallbacks.push(callback);
        return callback;
    }

    /**
     * Register callback for buffer full event
     * @param {Function} callback - Callback function
     * @returns {Function} The callback
     */
    onBufferFull(callback) {
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }
        this._onBufferFullCallbacks.push(callback);
        return callback;
    }

    /**
     * Register callback for reconciliation event
     * @param {Function} callback - Callback function
     * @returns {Function} The callback
     */
    onReconciliation(callback) {
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }
        this._onReconciliationCallbacks.push(callback);
        return callback;
    }

    /**
     * Remove callback for input added event
     * @param {Function} callback - Callback to remove
     * @returns {boolean} True if callback was found and removed
     */
    offInputAdded(callback) {
        const index = this._onInputAddedCallbacks.indexOf(callback);
        if (index !== -1) {
            this._onInputAddedCallbacks.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * Remove callback for input acknowledged event
     * @param {Function} callback - Callback to remove
     * @returns {boolean} True if callback was found and removed
     */
    offInputAcknowledged(callback) {
        const index = this._onInputAcknowledgedCallbacks.indexOf(callback);
        if (index !== -1) {
            this._onInputAcknowledgedCallbacks.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * Remove callback for buffer full event
     * @param {Function} callback - Callback to remove
     * @returns {boolean} True if callback was found and removed
     */
    offBufferFull(callback) {
        const index = this._onBufferFullCallbacks.indexOf(callback);
        if (index !== -1) {
            this._onBufferFullCallbacks.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * Remove callback for reconciliation event
     * @param {Function} callback - Callback to remove
     * @returns {boolean} True if callback was found and removed
     */
    offReconciliation(callback) {
        const index = this._onReconciliationCallbacks.indexOf(callback);
        if (index !== -1) {
            this._onReconciliationCallbacks.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * Emit input added event
     * @param {Object} input - The input that was added
     * @private
     */
    _emitInputAdded(input) {
        for (const callback of this._onInputAddedCallbacks) {
            try {
                callback(input);
            } catch (error) {
                console.error('Error in onInputAdded callback:', error);
            }
        }
    }

    /**
     * Emit input acknowledged event
     * @param {Array<Object>} inputs - Array of acknowledged inputs
     * @private
     */
    _emitInputAcknowledged(inputs) {
        for (const callback of this._onInputAcknowledgedCallbacks) {
            try {
                callback(inputs);
            } catch (error) {
                console.error('Error in onInputAcknowledged callback:', error);
            }
        }
    }

    /**
     * Emit buffer full event
     * @private
     */
    _emitBufferFull() {
        const event = {
            size: this._buffer.size,
            capacity: this.options.maxBufferSize,
            usage: this.getBufferUsage(),
            timestamp: Date.now()
        };
        for (const callback of this._onBufferFullCallbacks) {
            try {
                callback(event);
            } catch (error) {
                console.error('Error in onBufferFull callback:', error);
            }
        }
    }

    /**
     * Emit reconciliation event
     * @param {Object} result - Reconciliation result
     * @private
     */
    _emitReconciliation(result) {
        for (const callback of this._onReconciliationCallbacks) {
            try {
                callback(result);
            } catch (error) {
                console.error('Error in onReconciliation callback:', error);
            }
        }
    }

    // =========================================================================
    // Utility Methods
    // =========================================================================

    /**
     * Remove oldest input from buffer
     * @private
     */
    _removeOldestInput() {
        if (this._sequenceOrder.length === 0) {
            return;
        }

        const oldestSeq = this._sequenceOrder.shift();
        this._buffer.delete(oldestSeq);
        this._stats.totalInputsRemoved++;
    }

    /**
     * Get buffer statistics
     * @returns {Object} Statistics object
     */
    getStats() {
        return {
            ...this._stats,
            currentSize: this._buffer.size,
            capacity: this.options.maxBufferSize,
            currentUsage: this.getBufferUsage(),
            lastAcknowledgedSequence: this._lastAcknowledgedSequence,
            currentSequence: this._currentSequence
        };
    }

    /**
     * Reset buffer to initial state
     */
    reset() {
        this.clear();
        this._currentSequence = 0;
        this._lastAcknowledgedSequence = -1;
        this._stats = {
            totalInputsAdded: 0,
            totalInputsAcknowledged: 0,
            totalInputsRemoved: 0,
            totalReconciliations: 0,
            maxBufferUsage: 0
        };
    }

    /**
     * Serialize buffer to JSON
     * @returns {Object} JSON representation
     */
    toJSON() {
        return {
            options: this.options,
            currentSequence: this._currentSequence,
            lastAcknowledgedSequence: this._lastAcknowledgedSequence,
            bufferSize: this._buffer.size,
            inputs: Array.from(this._buffer.values())
        };
    }

    /**
     * Get iterator for buffered inputs
     * @returns {Iterator} Iterator over inputs
     */
    [Symbol.iterator]() {
        let index = 0;
        const sequences = this._sequenceOrder;
        const buffer = this._buffer;

        return {
            next: () => {
                if (index < sequences.length) {
                    const seq = sequences[index++];
                    return {
                        value: buffer.get(seq),
                        done: false
                    };
                }
                return { value: undefined, done: true };
            }
        };
    }
}

// ============================================================================
// Exports
// ============================================================================

export default InputBuffer;

/**
 * Create a new InputBuffer instance
 * @param {Object} options - Configuration options
 * @returns {InputBuffer} New InputBuffer instance
 */
export function createInputBuffer(options) {
    return new InputBuffer(options);
}
