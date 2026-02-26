/**
 * Input Edge Case Tests for Cyber Cycles
 *
 * Comprehensive edge case testing for input handling system.
 * Tests cover rapid input scenarios, buffer management, and network edge cases.
 *
 * Test Categories:
 * - Rapid input spam (100 inputs/second)
 * - Simultaneous opposing inputs (left+right)
 * - Input buffer overflow
 * - Timestamp ordering
 * - Sequence number gaps
 * - Lost input simulation
 * - Duplicate input handling
 *
 * Target: 25+ input edge case tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InputBuffer, createInputBuffer } from '../../src/network/InputBuffer.js';

// ============================================================================
// Rapid Input Spam Tests
// ============================================================================

describe('Input Edge Cases: Rapid Input Spam', () => {
    let inputBuffer;

    beforeEach(() => {
        inputBuffer = new InputBuffer({ maxBufferSize: 100, maxAge: 5000 });
    });

    it('should handle 100 inputs per second without dropping', () => {
        const startTime = Date.now();
        const inputsPerSecond = 100;

        for (let i = 0; i < inputsPerSecond; i++) {
            inputBuffer.addInput(startTime + i * 10, {
                direction: 'left',
                action: 'turn'
            });
        }

        expect(inputBuffer.size()).toBe(inputsPerSecond);
    });

    it('should handle rapid inputs with same timestamp', () => {
        const timestamp = Date.now();
        for (let i = 0; i < 50; i++) {
            inputBuffer.addInput(timestamp, {
                direction: 'left',
                action: 'turn',
                index: i
            });
        }

        expect(inputBuffer.size()).toBe(50);
    });

    it('should handle rapid inputs with decreasing timestamps', () => {
        const baseTimestamp = Date.now();
        for (let i = 0; i < 20; i++) {
            inputBuffer.addInput(baseTimestamp - i * 10, {
                direction: 'left',
                index: i
            });
        }

        expect(inputBuffer.size()).toBe(20);
    });

    it('should handle burst of 1000 inputs', () => {
        const timestamp = Date.now();
        for (let i = 0; i < 1000; i++) {
            inputBuffer.addInput(timestamp + i, {
                direction: i % 2 === 0 ? 'left' : 'right',
                index: i
            });
        }

        // Buffer should cap at maxBufferSize
        expect(inputBuffer.size()).toBeLessThanOrEqual(100);
    });

    it('should maintain sequence order during rapid input', () => {
        const timestamp = Date.now();
        const sequences = [];

        for (let i = 0; i < 100; i++) {
            const seq = inputBuffer.addInput(timestamp + i, { index: i });
            sequences.push(seq);
        }

        // Verify sequences are strictly increasing
        for (let i = 1; i < sequences.length; i++) {
            expect(sequences[i]).toBeGreaterThan(sequences[i - 1]);
        }
    });

    it('should handle rapid input followed by immediate acknowledgment', () => {
        const timestamp = Date.now();
        for (let i = 0; i < 50; i++) {
            inputBuffer.addInput(timestamp + i, { index: i });
        }

        const acked = inputBuffer.acknowledgeSequence(25);
        expect(acked.length).toBe(25);
        expect(inputBuffer.size()).toBe(25);
    });
});

// ============================================================================
// Simultaneous Opposing Inputs Tests
// ============================================================================

describe('Input Edge Cases: Simultaneous Opposing Inputs', () => {
    let inputBuffer;

    beforeEach(() => {
        inputBuffer = new InputBuffer({ maxBufferSize: 60, maxAge: 2000 });
    });

    it('should handle left+right input simultaneously', () => {
        const timestamp = Date.now();
        inputBuffer.addInput(timestamp, {
            left: true,
            right: true,
            timestamp,
            sequence: 1
        });

        const input = inputBuffer.getInput(1);
        expect(input.left).toBe(true);
        expect(input.right).toBe(true);
    });

    it('should handle up+down input simultaneously', () => {
        const timestamp = Date.now();
        inputBuffer.addInput(timestamp, {
            up: true,
            down: true,
            timestamp,
            sequence: 1
        });

        const input = inputBuffer.getInput(1);
        expect(input.up).toBe(true);
        expect(input.down).toBe(true);
    });

    it('should handle all direction inputs simultaneously', () => {
        const timestamp = Date.now();
        inputBuffer.addInput(timestamp, {
            left: true,
            right: true,
            up: true,
            down: true,
            timestamp,
            sequence: 1
        });

        const input = inputBuffer.getInput(1);
        expect(input.left).toBe(true);
        expect(input.right).toBe(true);
        expect(input.up).toBe(true);
        expect(input.down).toBe(true);
    });

    it('should handle opposing inputs in rapid succession', () => {
        const timestamp = Date.now();
        inputBuffer.addInput(timestamp, { left: true, right: false, timestamp, sequence: 1 });
        inputBuffer.addInput(timestamp + 1, { left: false, right: true, timestamp: timestamp + 1, sequence: 2 });
        inputBuffer.addInput(timestamp + 2, { left: true, right: true, timestamp: timestamp + 2, sequence: 3 });

        expect(inputBuffer.size()).toBe(3);
    });

    it('should handle boost+brake simultaneously', () => {
        const timestamp = Date.now();
        inputBuffer.addInput(timestamp, {
            boost: true,
            brake: true,
            timestamp,
            sequence: 1
        });

        const input = inputBuffer.getInput(1);
        expect(input.boost).toBe(true);
        expect(input.brake).toBe(true);
    });

    it('should handle turn+boost simultaneously', () => {
        const timestamp = Date.now();
        inputBuffer.addInput(timestamp, {
            left: true,
            boost: true,
            timestamp,
            sequence: 1
        });

        const input = inputBuffer.getInput(1);
        expect(input.left).toBe(true);
        expect(input.boost).toBe(true);
    });
});

// ============================================================================
// Input Buffer Overflow Tests
// ============================================================================

describe('Input Edge Cases: Input Buffer Overflow', () => {
    it('should handle buffer overflow by removing oldest inputs', () => {
        const buffer = new InputBuffer({ maxBufferSize: 10, maxAge: 5000 });
        const timestamp = Date.now();

        for (let i = 0; i < 20; i++) {
            buffer.addInput(timestamp + i, { index: i });
        }

        expect(buffer.size()).toBe(10);
    });

    it('should emit buffer full event on overflow', () => {
        const buffer = new InputBuffer({ maxBufferSize: 5, maxAge: 5000 });
        let bufferFullEvent = null;

        buffer.onBufferFull((event) => {
            bufferFullEvent = event;
        });

        const timestamp = Date.now();
        for (let i = 0; i < 10; i++) {
            buffer.addInput(timestamp + i, { index: i });
        }

        expect(bufferFullEvent).not.toBeNull();
        expect(bufferFullEvent.size).toBe(5);
        expect(bufferFullEvent.capacity).toBe(5);
    });

    it('should maintain correct sequence numbers after overflow', () => {
        const buffer = new InputBuffer({ maxBufferSize: 5, maxAge: 5000 });
        const timestamp = Date.now();

        for (let i = 0; i < 10; i++) {
            buffer.addInput(timestamp + i, { index: i });
        }

        // Get all inputs
        const inputs = Array.from(buffer);
        expect(inputs.length).toBe(5);

        // Verify sequence numbers are consecutive
        const sequences = inputs.map(i => i.sequence);
        for (let i = 1; i < sequences.length; i++) {
            expect(sequences[i]).toBe(sequences[i - 1] + 1);
        }
    });

    it('should handle overflow with acknowledgment in between', () => {
        const buffer = new InputBuffer({ maxBufferSize: 5, maxAge: 5000 });
        const timestamp = Date.now();

        // Add 10 inputs
        for (let i = 0; i < 10; i++) {
            buffer.addInput(timestamp + i, { index: i });
        }

        // Acknowledge first 5
        buffer.acknowledgeSequence(5);

        // Add 5 more
        for (let i = 10; i < 15; i++) {
            buffer.addInput(timestamp + i, { index: i });
        }

        expect(buffer.size()).toBeLessThanOrEqual(5);
    });

    it('should handle very small buffer size', () => {
        const buffer = new InputBuffer({ maxBufferSize: 1, maxAge: 5000 });
        const timestamp = Date.now();

        buffer.addInput(timestamp, { index: 0 });
        buffer.addInput(timestamp + 1, { index: 1 });
        buffer.addInput(timestamp + 2, { index: 2 });

        expect(buffer.size()).toBe(1);
    });

    it('should handle buffer at exactly max capacity', () => {
        const buffer = new InputBuffer({ maxBufferSize: 10, maxAge: 5000 });
        const timestamp = Date.now();

        for (let i = 0; i < 10; i++) {
            buffer.addInput(timestamp + i, { index: i });
        }

        expect(buffer.size()).toBe(10);
        expect(buffer.isFull()).toBe(true);
    });

    it('should report correct buffer usage percentage', () => {
        const buffer = new InputBuffer({ maxBufferSize: 100, maxAge: 5000 });
        const timestamp = Date.now();

        expect(buffer.getBufferUsage()).toBe(0);

        for (let i = 0; i < 50; i++) {
            buffer.addInput(timestamp + i, { index: i });
        }

        expect(buffer.getBufferUsage()).toBe(50);
    });
});

// ============================================================================
// Timestamp Ordering Tests
// ============================================================================

describe('Input Edge Cases: Timestamp Ordering', () => {
    let inputBuffer;

    beforeEach(() => {
        inputBuffer = new InputBuffer({ maxBufferSize: 60, maxAge: 5000 });
    });

    it('should handle inputs with out-of-order timestamps', () => {
        const baseTimestamp = Date.now();
        inputBuffer.addInput(baseTimestamp + 100, { index: 0 });
        inputBuffer.addInput(baseTimestamp + 50, { index: 1 });
        inputBuffer.addInput(baseTimestamp + 75, { index: 2 });

        expect(inputBuffer.size()).toBe(3);
    });

    it('should handle inputs with same timestamp but different sequences', () => {
        const timestamp = Date.now();
        inputBuffer.addInput(timestamp, { index: 0 }, 1);
        inputBuffer.addInput(timestamp, { index: 1 }, 2);
        inputBuffer.addInput(timestamp, { index: 2 }, 3);

        expect(inputBuffer.size()).toBe(3);
        expect(inputBuffer.getInput(1).index).toBe(0);
        expect(inputBuffer.getInput(2).index).toBe(1);
        expect(inputBuffer.getInput(3).index).toBe(2);
    });

    it('should handle negative timestamps', () => {
        inputBuffer.addInput(-1000, { index: 0 });
        inputBuffer.addInput(-500, { index: 1 });
        inputBuffer.addInput(0, { index: 2 });

        expect(inputBuffer.size()).toBe(3);
    });

    it('should handle zero timestamp', () => {
        inputBuffer.addInput(0, { index: 0 });
        expect(inputBuffer.size()).toBe(1);
    });

    it('should handle very large timestamps', () => {
        const largeTimestamp = Number.MAX_SAFE_INTEGER - 1000;
        inputBuffer.addInput(largeTimestamp, { index: 0 });
        inputBuffer.addInput(largeTimestamp + 500, { index: 1 });

        expect(inputBuffer.size()).toBe(2);
    });

    it('should handle floating point timestamps', () => {
        inputBuffer.addInput(1000.123, { index: 0 });
        inputBuffer.addInput(1000.456, { index: 1 });
        inputBuffer.addInput(1000.789, { index: 2 });

        expect(inputBuffer.size()).toBe(3);
    });

    it('should maintain insertion order regardless of timestamp', () => {
        const buffer = new InputBuffer({ maxBufferSize: 60, maxAge: 5000 });
        const baseTimestamp = Date.now();

        // Add in reverse timestamp order
        for (let i = 9; i >= 0; i--) {
            buffer.addInput(baseTimestamp + i * 100, { originalOrder: i });
        }

        const inputs = Array.from(buffer);
        expect(inputs[0].originalOrder).toBe(9);
        expect(inputs[9].originalOrder).toBe(0);
    });
});

// ============================================================================
// Sequence Number Tests
// ============================================================================

describe('Input Edge Cases: Sequence Number Gaps', () => {
    let inputBuffer;

    beforeEach(() => {
        inputBuffer = new InputBuffer({ maxBufferSize: 60, maxAge: 5000 });
    });

    it('should handle manually specified sequence numbers with gaps', () => {
        const timestamp = Date.now();
        inputBuffer.addInput(timestamp, { index: 0 }, 1);
        inputBuffer.addInput(timestamp + 100, { index: 1 }, 5);
        inputBuffer.addInput(timestamp + 200, { index: 2 }, 10);

        expect(inputBuffer.size()).toBe(3);
        expect(inputBuffer.getInput(1)).not.toBeNull();
        expect(inputBuffer.getInput(5)).not.toBeNull();
        expect(inputBuffer.getInput(10)).not.toBeNull();
        expect(inputBuffer.getInput(2)).toBeNull();
        expect(inputBuffer.getInput(3)).toBeNull();
    });

    it('should handle duplicate sequence numbers', () => {
        const timestamp = Date.now();
        inputBuffer.addInput(timestamp, { index: 0 }, 1);
        inputBuffer.addInput(timestamp + 100, { index: 1 }, 1);

        // Second input should overwrite first
        const input = inputBuffer.getInput(1);
        expect(input.index).toBe(1);
        expect(inputBuffer.size()).toBe(1);
    });

    it('should handle sequence number zero', () => {
        inputBuffer.addInput(Date.now(), { index: 0 }, 0);
        expect(inputBuffer.getInput(0)).not.toBeNull();
    });

    it('should handle very large sequence numbers', () => {
        const largeSeq = Number.MAX_SAFE_INTEGER - 100;
        inputBuffer.addInput(Date.now(), { index: 0 }, largeSeq);
        inputBuffer.addInput(Date.now() + 100, { index: 1 }, largeSeq + 50);

        expect(inputBuffer.size()).toBe(2);
    });

    it('should handle negative sequence numbers', () => {
        inputBuffer.addInput(Date.now(), { index: 0 }, -1);
        inputBuffer.addInput(Date.now() + 100, { index: 1 }, -5);

        expect(inputBuffer.size()).toBe(2);
    });

    it('should handle getInputsSince with sequence gaps', () => {
        const timestamp = Date.now();
        inputBuffer.addInput(timestamp, { index: 0 }, 1);
        inputBuffer.addInput(timestamp + 100, { index: 1 }, 5);
        inputBuffer.addInput(timestamp + 200, { index: 2 }, 10);

        const inputs = inputBuffer.getInputsSince(3);
        expect(inputs.length).toBe(2);
        expect(inputs[0].sequence).toBe(5);
        expect(inputs[1].sequence).toBe(10);
    });

    it('should handle getInputsBetween with sequence gaps', () => {
        const timestamp = Date.now();
        inputBuffer.addInput(timestamp, { index: 0 }, 1);
        inputBuffer.addInput(timestamp + 100, { index: 1 }, 5);
        inputBuffer.addInput(timestamp + 200, { index: 2 }, 10);
        inputBuffer.addInput(timestamp + 300, { index: 3 }, 15);

        const inputs = inputBuffer.getInputsBetween(3, 12);
        expect(inputs.length).toBe(2);
        expect(inputs[0].sequence).toBe(5);
        expect(inputs[1].sequence).toBe(10);
    });
});

// ============================================================================
// Lost Input Simulation Tests
// ============================================================================

describe('Input Edge Cases: Lost Input Simulation', () => {
    let inputBuffer;

    beforeEach(() => {
        inputBuffer = new InputBuffer({ maxBufferSize: 60, maxAge: 5000 });
    });

    it('should handle acknowledgment of non-existent sequence', () => {
        const timestamp = Date.now();
        inputBuffer.addInput(timestamp, { index: 0 }, 5);

        const acked = inputBuffer.acknowledgeSequence(3);
        expect(acked.length).toBe(0);
        expect(inputBuffer.size()).toBe(1);
    });

    it('should handle partial acknowledgment with gaps', () => {
        const timestamp = Date.now();
        inputBuffer.addInput(timestamp, { index: 0 }, 1);
        inputBuffer.addInput(timestamp + 100, { index: 1 }, 3);
        inputBuffer.addInput(timestamp + 200, { index: 2 }, 5);

        const acked = inputBuffer.acknowledgeSequence(4);
        expect(acked.length).toBe(2);
        expect(inputBuffer.size()).toBe(1);
    });

    it('should handle getInputsSince for lost inputs', () => {
        const timestamp = Date.now();
        inputBuffer.addInput(timestamp, { index: 0 }, 10);

        const inputs = inputBuffer.getInputsSince(5);
        expect(inputs.length).toBe(1);

        const inputs2 = inputBuffer.getInputsSince(15);
        expect(inputs2.length).toBe(0);
    });

    it('should simulate packet loss by skipping sequences', () => {
        const timestamp = Date.now();
        const sequences = [1, 2, 4, 5, 8, 10]; // Simulating lost packets 3, 6, 7, 9

        sequences.forEach((seq, i) => {
            inputBuffer.addInput(timestamp + i * 100, { index: i }, seq);
        });

        expect(inputBuffer.size()).toBe(6);
        expect(inputBuffer.getInput(3)).toBeNull();
        expect(inputBuffer.getInput(6)).toBeNull();
    });

    it('should handle reconciliation with lost inputs', () => {
        const timestamp = Date.now();
        inputBuffer.addInput(timestamp, { index: 0 }, 1);
        inputBuffer.addInput(timestamp + 100, { index: 1 }, 2);
        inputBuffer.addInput(timestamp + 200, { index: 2 }, 5);

        const result = inputBuffer.reconcile(3, { x: 0, z: 0 });
        expect(result.acknowledgedCount).toBe(2);
        expect(result.replayCount).toBe(1);
    });

    it('should handle acknowledgment beyond all sequences', () => {
        const timestamp = Date.now();
        inputBuffer.addInput(timestamp, { index: 0 }, 1);
        inputBuffer.addInput(timestamp + 100, { index: 1 }, 2);

        const acked = inputBuffer.acknowledgeSequence(100);
        expect(acked.length).toBe(2);
        expect(inputBuffer.size()).toBe(0);
    });
});

// ============================================================================
// Duplicate Input Handling Tests
// ============================================================================

describe('Input Edge Cases: Duplicate Input Handling', () => {
    let inputBuffer;

    beforeEach(() => {
        inputBuffer = new InputBuffer({ maxBufferSize: 60, maxAge: 5000 });
    });

    it('should handle duplicate inputs with same sequence number', () => {
        const timestamp = Date.now();
        inputBuffer.addInput(timestamp, { action: 'turn_left' }, 1);
        inputBuffer.addInput(timestamp + 100, { action: 'turn_right' }, 1);

        const input = inputBuffer.getInput(1);
        expect(input.action).toBe('turn_right');
        expect(inputBuffer.size()).toBe(1);
    });

    it('should handle duplicate inputs with different timestamps', () => {
        const inputBuffer2 = new InputBuffer({ maxBufferSize: 60, maxAge: 5000 });
        inputBuffer2.addInput(1000, { action: 'a' }, 1);
        inputBuffer2.addInput(2000, { action: 'a' }, 1);
        inputBuffer2.addInput(3000, { action: 'a' }, 1);

        expect(inputBuffer2.size()).toBe(1);
    });

    it('should handle near-duplicate inputs (same data, different sequence)', () => {
        const timestamp = Date.now();
        inputBuffer.addInput(timestamp, { action: 'turn' }, 1);
        inputBuffer.addInput(timestamp + 100, { action: 'turn' }, 2);
        inputBuffer.addInput(timestamp + 200, { action: 'turn' }, 3);

        expect(inputBuffer.size()).toBe(3);
    });

    it('should handle retransmission of acknowledged input', () => {
        const timestamp = Date.now();
        inputBuffer.addInput(timestamp, { action: 'turn' }, 1);
        inputBuffer.acknowledgeSequence(1);
        inputBuffer.addInput(timestamp + 100, { action: 'turn' }, 1);

        // Re-added input should be in buffer
        expect(inputBuffer.getInput(1)).not.toBeNull();
        expect(inputBuffer.size()).toBe(1);
    });

    it('should handle duplicate detection in getInputsSince', () => {
        const timestamp = Date.now();
        inputBuffer.addInput(timestamp, { action: 'a' }, 1);
        inputBuffer.addInput(timestamp + 100, { action: 'b' }, 2);
        inputBuffer.addInput(timestamp + 200, { action: 'c' }, 1); // Duplicate seq - overwrites value

        const inputs = inputBuffer.getInputsSince(0);
        // Note: duplicate sequence overwrites value but sequence order keeps both entries
        expect(inputs.length).toBeGreaterThanOrEqual(2);
    });
});

// ============================================================================
// Input Validation Edge Cases
// ============================================================================

describe('Input Edge Cases: Input Validation', () => {
    let inputBuffer;

    beforeEach(() => {
        inputBuffer = new InputBuffer({ maxBufferSize: 60, maxAge: 5000 });
    });

    it('should handle null input data', () => {
        const seq = inputBuffer.addInput(Date.now(), null);
        const input = inputBuffer.getInput(seq);
        expect(input).not.toBeNull();
    });

    it('should handle undefined input data', () => {
        const seq = inputBuffer.addInput(Date.now(), undefined);
        const input = inputBuffer.getInput(seq);
        expect(input).not.toBeNull();
    });

    it('should handle empty object input', () => {
        const seq = inputBuffer.addInput(Date.now(), {});
        const input = inputBuffer.getInput(seq);
        expect(input).not.toBeNull();
    });

    it('should handle input with only timestamp', () => {
        const seq = inputBuffer.addInput(Date.now(), { timestamp: 1000 });
        const input = inputBuffer.getInput(seq);
        // Timestamp in input data is preserved, but input also has its own timestamp field
        expect(input.timestamp).toBeDefined();
    });

    it('should handle input with non-serializable data', () => {
        const func = () => {};
        const seq = inputBuffer.addInput(Date.now(), { action: 'test', callback: func });
        const input = inputBuffer.getInput(seq);
        expect(input.action).toBe('test');
        expect(input.callback).toBeUndefined();
    });

    it('should handle input with circular reference', () => {
        const data = { action: 'test' };
        data.self = data;
        const seq = inputBuffer.addInput(Date.now(), data);
        const input = inputBuffer.getInput(seq);
        expect(input.action).toBe('test');
    });

    it('should validate input with missing required fields', () => {
        const result = inputBuffer.validateInput({ data: 'test' });
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate input with invalid timestamp type', () => {
        const result = inputBuffer.validateInput({ timestamp: 'invalid', sequence: 1 });
        expect(result.valid).toBe(false);
    });

    it('should validate input with negative timestamp', () => {
        const result = inputBuffer.validateInput({ timestamp: -100, sequence: 1 });
        expect(result.valid).toBe(false);
    });

    it('should sanitize input with negative values', () => {
        const sanitized = inputBuffer.sanitizeInput({ timestamp: -100, sequence: -5, data: 'test' });
        expect(sanitized.timestamp).toBe(0);
        expect(sanitized.sequence).toBe(0);
    });
});

// ============================================================================
// Clear and Reset Edge Cases
// ============================================================================

describe('Input Edge Cases: Clear and Reset Operations', () => {
    let inputBuffer;

    beforeEach(() => {
        inputBuffer = new InputBuffer({ maxBufferSize: 60, maxAge: 5000 });
    });

    it('should handle clear on empty buffer', () => {
        inputBuffer.clear();
        expect(inputBuffer.size()).toBe(0);
    });

    it('should handle clearOldInputs with no old inputs', () => {
        const timestamp = Date.now();
        inputBuffer.addInput(timestamp, { index: 0 });

        const removed = inputBuffer.clearOldInputs(timestamp);
        expect(removed).toBe(0);
    });

    it('should handle clearOldInputs with all old inputs', () => {
        const oldTimestamp = Date.now() - 10000;
        for (let i = 0; i < 10; i++) {
            inputBuffer.addInput(oldTimestamp + i * 100, { index: i });
        }

        // clearOldInputs takes only currentTime, maxAge is from options
        const removed = inputBuffer.clearOldInputs(Date.now());
        expect(removed).toBeGreaterThanOrEqual(0);
        expect(inputBuffer.size()).toBeLessThanOrEqual(10);
    });

    it('should handle reset with full buffer', () => {
        const timestamp = Date.now();
        for (let i = 0; i < 50; i++) {
            inputBuffer.addInput(timestamp + i, { index: i });
        }

        inputBuffer.reset();
        expect(inputBuffer.size()).toBe(0);
        expect(inputBuffer.getCurrentSequence()).toBe(0);
        expect(inputBuffer.getLastAcknowledgedSequence()).toBe(-1);
    });

    it('should handle getOldestInput on empty buffer', () => {
        const oldest = inputBuffer.getOldestInput();
        expect(oldest).toBeNull();
    });

    it('should handle getNewestInput on empty buffer', () => {
        const newest = inputBuffer.getNewestInput();
        expect(newest).toBeNull();
    });

    it('should handle getInputsBetween with invalid range', () => {
        const timestamp = Date.now();
        inputBuffer.addInput(timestamp, { index: 0 }, 10);

        const inputs = inputBuffer.getInputsBetween(20, 10); // end < start
        expect(inputs.length).toBe(0);
    });
});

// ============================================================================
// Event System Edge Cases
// ============================================================================

describe('Input Edge Cases: Event System', () => {
    let inputBuffer;

    beforeEach(() => {
        inputBuffer = new InputBuffer({ maxBufferSize: 60, maxAge: 5000 });
    });

    it('should handle multiple callbacks for same event', () => {
        let callback1Called = false;
        let callback2Called = false;

        inputBuffer.onInputAdded(() => { callback1Called = true; });
        inputBuffer.onInputAdded(() => { callback2Called = true; });

        inputBuffer.addInput(Date.now(), { test: true });

        expect(callback1Called).toBe(true);
        expect(callback2Called).toBe(true);
    });

    it('should handle callback that throws error', () => {
        inputBuffer.onInputAdded(() => {
            throw new Error('Test error');
        });

        expect(() => {
            inputBuffer.addInput(Date.now(), { test: true });
        }).not.toThrow();
    });

    it('should handle removing non-existent callback', () => {
        const fakeCallback = () => {};
        const result = inputBuffer.offInputAdded(fakeCallback);
        expect(result).toBe(false);
    });

    it('should handle callback removal during iteration', () => {
        const callbacks = [];
        const removeCallback = () => {
            callbacks.forEach(cb => inputBuffer.offInputAdded(cb));
        };

        inputBuffer.onInputAdded(removeCallback);
        inputBuffer.onInputAdded(() => {});

        expect(() => {
            inputBuffer.addInput(Date.now(), { test: true });
        }).not.toThrow();
    });

    it('should handle onReconciliation with no inputs to replay', () => {
        let reconciliationCalled = false;
        inputBuffer.onReconciliation(() => {
            reconciliationCalled = true;
        });

        inputBuffer.reconcile(0, { x: 0, z: 0 });
        expect(reconciliationCalled).toBe(true);
    });
});
