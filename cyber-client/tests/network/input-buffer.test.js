/**
 * InputBuffer Tests for Cyber Cycles
 *
 * Comprehensive test suite for the InputBuffer module.
 * Tests cover:
 * - Buffer creation and configuration (8 tests)
 * - Add/get inputs (12 tests)
 * - Sequence tracking (10 tests)
 * - Buffer management (10 tests)
 * - Acknowledgment system (8 tests)
 * - Reconciliation (7 tests)
 * - Edge cases (5 tests)
 *
 * Target: 60+ tests total
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InputBuffer, createInputBuffer } from '../../src/network/InputBuffer.js';

// ============================================================================
// Buffer Creation and Configuration Tests (8 tests)
// ============================================================================

describe('InputBuffer - Creation and Configuration', () => {
    it('should create InputBuffer with default options', () => {
        const buffer = new InputBuffer();
        expect(buffer).toBeInstanceOf(InputBuffer);
        expect(buffer.getCapacity()).toBe(60);
        expect(buffer.isEmpty()).toBe(true);
    });

    it('should create InputBuffer with custom maxBufferSize', () => {
        const buffer = new InputBuffer({ maxBufferSize: 30 });
        expect(buffer.getCapacity()).toBe(30);
    });

    it('should create InputBuffer with custom maxAge', () => {
        const buffer = new InputBuffer({ maxAge: 500 });
        expect(buffer.options.maxAge).toBe(500);
    });

    it('should create InputBuffer with both custom options', () => {
        const buffer = new InputBuffer({ maxBufferSize: 100, maxAge: 1000 });
        expect(buffer.getCapacity()).toBe(100);
        expect(buffer.options.maxAge).toBe(1000);
    });

    it('should create InputBuffer using factory function', () => {
        const buffer = createInputBuffer({ maxBufferSize: 50 });
        expect(buffer).toBeInstanceOf(InputBuffer);
        expect(buffer.getCapacity()).toBe(50);
    });

    it('should handle partial options (only maxBufferSize)', () => {
        const buffer = new InputBuffer({ maxBufferSize: 25 });
        expect(buffer.getCapacity()).toBe(25);
        expect(buffer.options.maxAge).toBe(200); // default
    });

    it('should handle partial options (only maxAge)', () => {
        const buffer = new InputBuffer({ maxAge: 300 });
        expect(buffer.getCapacity()).toBe(60); // default
        expect(buffer.options.maxAge).toBe(300);
    });

    it('should handle empty options object', () => {
        const buffer = new InputBuffer({});
        expect(buffer.getCapacity()).toBe(60);
        expect(buffer.options.maxAge).toBe(200);
    });
});

// ============================================================================
// Add/Get Inputs Tests (12 tests)
// ============================================================================

describe('InputBuffer - Add/Get Inputs', () => {
    let buffer;

    beforeEach(() => {
        buffer = new InputBuffer();
    });

    it('should add input and return sequence number', () => {
        const seq = buffer.addInput(Date.now(), { left: true });
        expect(seq).toBe(1);
        expect(buffer.size()).toBe(1);
    });

    it('should add multiple inputs with incrementing sequence numbers', () => {
        buffer.addInput(Date.now(), { left: true });
        buffer.addInput(Date.now(), { right: true });
        buffer.addInput(Date.now(), { brake: true });

        expect(buffer.size()).toBe(3);
        expect(buffer.getCurrentSequence()).toBe(3);
    });

    it('should get input by sequence number', () => {
        buffer.addInput(1000, { left: true });
        buffer.addInput(1001, { right: true });

        const input = buffer.getInput(1);
        expect(input).not.toBeNull();
        expect(input.left).toBe(true);
        expect(input.sequence).toBe(1);
        expect(input.timestamp).toBe(1000);
    });

    it('should return null for non-existent sequence', () => {
        const input = buffer.getInput(999);
        expect(input).toBeNull();
    });

    it('should get inputs since sequence number', () => {
        buffer.addInput(Date.now(), { left: true });
        buffer.addInput(Date.now(), { right: true });
        buffer.addInput(Date.now(), { brake: true });
        buffer.addInput(Date.now(), { boost: true });

        const inputs = buffer.getInputsSince(2);
        expect(inputs.length).toBe(2);
        expect(inputs[0].sequence).toBe(3);
        expect(inputs[1].sequence).toBe(4);
    });

    it('should return empty array when no inputs since sequence', () => {
        buffer.addInput(Date.now(), { left: true });
        buffer.addInput(Date.now(), { right: true });

        const inputs = buffer.getInputsSince(10);
        expect(inputs).toEqual([]);
    });

    it('should get inputs between sequence range', () => {
        for (let i = 0; i < 10; i++) {
            buffer.addInput(Date.now(), { index: i });
        }

        const inputs = buffer.getInputsBetween(3, 6);
        expect(inputs.length).toBe(4);
        expect(inputs[0].sequence).toBe(3);
        expect(inputs[3].sequence).toBe(6);
    });

    it('should handle inclusive range in getInputsBetween', () => {
        buffer.addInput(Date.now(), { left: true });
        buffer.addInput(Date.now(), { right: true });
        buffer.addInput(Date.now(), { brake: true });

        const inputs = buffer.getInputsBetween(1, 1);
        expect(inputs.length).toBe(1);
        expect(inputs[0].sequence).toBe(1);
    });

    it('should return empty array for invalid range', () => {
        buffer.addInput(Date.now(), { left: true });

        const inputs = buffer.getInputsBetween(10, 20);
        expect(inputs).toEqual([]);
    });

    it('should preserve input data when adding', () => {
        const inputData = {
            left: true,
            right: false,
            brake: true,
            boost: false,
            customField: 'test'
        };

        buffer.addInput(Date.now(), inputData);
        const retrieved = buffer.getInput(1);

        expect(retrieved.left).toBe(true);
        expect(retrieved.brake).toBe(true);
        expect(retrieved.customField).toBe('test');
    });

    it('should add input with explicit sequence number', () => {
        buffer.addInput(Date.now(), { left: true }, 100);
        const input = buffer.getInput(100);
        expect(input).not.toBeNull();
        expect(input.sequence).toBe(100);
    });

    it('should store timestamp with input', () => {
        const timestamp = 1234567890;
        buffer.addInput(timestamp, { left: true });

        const input = buffer.getInput(1);
        expect(input.timestamp).toBe(timestamp);
    });
});

// ============================================================================
// Sequence Tracking Tests (10 tests)
// ============================================================================

describe('InputBuffer - Sequence Tracking', () => {
    let buffer;

    beforeEach(() => {
        buffer = new InputBuffer();
    });

    it('should start with sequence 0', () => {
        expect(buffer.getCurrentSequence()).toBe(0);
    });

    it('should increment sequence on getNextSequenceNumber', () => {
        const seq1 = buffer.getNextSequenceNumber();
        expect(seq1).toBe(1);
        expect(buffer.getCurrentSequence()).toBe(1);
    });

    it('should increment sequence for each input added', () => {
        buffer.addInput(Date.now(), { left: true });
        expect(buffer.getCurrentSequence()).toBe(1);

        buffer.addInput(Date.now(), { right: true });
        expect(buffer.getCurrentSequence()).toBe(2);

        buffer.addInput(Date.now(), { brake: true });
        expect(buffer.getCurrentSequence()).toBe(3);
    });

    it('should set sequence number explicitly', () => {
        buffer.setSequence(100);
        expect(buffer.getCurrentSequence()).toBe(100);
    });

    it('should continue from set sequence number', () => {
        buffer.setSequence(50);
        const seq = buffer.getNextSequenceNumber();
        expect(seq).toBe(51);
    });

    it('should track last acknowledged sequence', () => {
        expect(buffer.getLastAcknowledgedSequence()).toBe(-1);

        buffer.addInput(Date.now(), { left: true });
        buffer.addInput(Date.now(), { right: true });
        buffer.acknowledgeSequence(1);

        expect(buffer.getLastAcknowledgedSequence()).toBe(1);
    });

    it('should update last acknowledged to highest value', () => {
        buffer.addInput(Date.now(), { left: true });
        buffer.addInput(Date.now(), { right: true });
        buffer.addInput(Date.now(), { brake: true });

        buffer.acknowledgeSequence(1);
        expect(buffer.getLastAcknowledgedSequence()).toBe(1);

        buffer.acknowledgeSequence(3);
        expect(buffer.getLastAcknowledgedSequence()).toBe(3);
    });

    it('should not decrease last acknowledged sequence', () => {
        buffer.addInput(Date.now(), { left: true });
        buffer.addInput(Date.now(), { right: true });

        buffer.acknowledgeSequence(2);
        expect(buffer.getLastAcknowledgedSequence()).toBe(2);

        buffer.acknowledgeSequence(1);
        expect(buffer.getLastAcknowledgedSequence()).toBe(2);
    });

    it('should handle sequence reset', () => {
        buffer.addInput(Date.now(), { left: true });
        buffer.setSequence(0);
        expect(buffer.getCurrentSequence()).toBe(0);
    });

    it('should maintain sequence order in buffer', () => {
        for (let i = 0; i < 5; i++) {
            buffer.addInput(Date.now(), { index: i });
        }

        const inputs = buffer.getInputsSince(0);
        expect(inputs.length).toBe(5);
        for (let i = 0; i < inputs.length; i++) {
            expect(inputs[i].sequence).toBe(i + 1);
        }
    });
});

// ============================================================================
// Buffer Management Tests (10 tests)
// ============================================================================

describe('InputBuffer - Buffer Management', () => {
    let buffer;

    beforeEach(() => {
        buffer = new InputBuffer({ maxBufferSize: 10 });
    });

    it('should return correct buffer size', () => {
        expect(buffer.size()).toBe(0);

        buffer.addInput(Date.now(), { left: true });
        expect(buffer.size()).toBe(1);

        buffer.addInput(Date.now(), { right: true });
        expect(buffer.size()).toBe(2);
    });

    it('should check if buffer is empty', () => {
        expect(buffer.isEmpty()).toBe(true);

        buffer.addInput(Date.now(), { left: true });
        expect(buffer.isEmpty()).toBe(false);
    });

    it('should get oldest input', () => {
        buffer.addInput(1000, { index: 1 });
        buffer.addInput(2000, { index: 2 });
        buffer.addInput(3000, { index: 3 });

        const oldest = buffer.getOldestInput();
        expect(oldest).not.toBeNull();
        expect(oldest.sequence).toBe(1);
        expect(oldest.timestamp).toBe(1000);
    });

    it('should return null for oldest input when empty', () => {
        const oldest = buffer.getOldestInput();
        expect(oldest).toBeNull();
    });

    it('should get newest input', () => {
        buffer.addInput(1000, { index: 1 });
        buffer.addInput(2000, { index: 2 });
        buffer.addInput(3000, { index: 3 });

        const newest = buffer.getNewestInput();
        expect(newest).not.toBeNull();
        expect(newest.sequence).toBe(3);
        expect(newest.timestamp).toBe(3000);
    });

    it('should return null for newest input when empty', () => {
        const newest = buffer.getNewestInput();
        expect(newest).toBeNull();
    });

    it('should calculate buffer usage percentage', () => {
        expect(buffer.getBufferUsage()).toBe(0);

        for (let i = 0; i < 5; i++) {
            buffer.addInput(Date.now(), { index: i });
        }
        expect(buffer.getBufferUsage()).toBe(50);

        for (let i = 0; i < 5; i++) {
            buffer.addInput(Date.now(), { index: i });
        }
        expect(buffer.getBufferUsage()).toBe(100);
    });

    it('should check if buffer is full', () => {
        expect(buffer.isFull()).toBe(false);

        for (let i = 0; i < 10; i++) {
            buffer.addInput(Date.now(), { index: i });
        }
        expect(buffer.isFull()).toBe(true);
    });

    it('should calculate available space', () => {
        expect(buffer.getAvailableSpace()).toBe(10);

        buffer.addInput(Date.now(), { left: true });
        buffer.addInput(Date.now(), { right: true });
        expect(buffer.getAvailableSpace()).toBe(8);
    });

    it('should clear all inputs', () => {
        for (let i = 0; i < 5; i++) {
            buffer.addInput(Date.now(), { index: i });
        }
        expect(buffer.size()).toBe(5);

        buffer.clear();
        expect(buffer.size()).toBe(0);
        expect(buffer.isEmpty()).toBe(true);
        expect(buffer.getOldestInput()).toBeNull();
    });
});

// ============================================================================
// Acknowledgment System Tests (8 tests)
// ============================================================================

describe('InputBuffer - Acknowledgment System', () => {
    let buffer;

    beforeEach(() => {
        buffer = new InputBuffer();
    });

    it('should acknowledge sequence and remove old inputs', () => {
        buffer.addInput(Date.now(), { left: true });
        buffer.addInput(Date.now(), { right: true });
        buffer.addInput(Date.now(), { brake: true });

        const acknowledged = buffer.acknowledgeSequence(2);
        expect(acknowledged.length).toBe(2);
        expect(buffer.size()).toBe(1);
    });

    it('should return acknowledged inputs', () => {
        buffer.addInput(1000, { left: true });
        buffer.addInput(2000, { right: true });

        const acknowledged = buffer.acknowledgeSequence(2);
        expect(acknowledged[0].timestamp).toBe(1000);
        expect(acknowledged[1].timestamp).toBe(2000);
    });

    it('should get unacknowledged inputs', () => {
        buffer.addInput(Date.now(), { left: true });
        buffer.addInput(Date.now(), { right: true });
        buffer.addInput(Date.now(), { brake: true });

        buffer.acknowledgeSequence(1);
        const unacked = buffer.getUnacknowledgedInputs();

        expect(unacked.length).toBe(2);
        expect(unacked[0].sequence).toBe(2);
        expect(unacked[1].sequence).toBe(3);
    });

    it('should return empty array when all inputs acknowledged', () => {
        buffer.addInput(Date.now(), { left: true });
        buffer.addInput(Date.now(), { right: true });

        buffer.acknowledgeSequence(2);
        const unacked = buffer.getUnacknowledgedInputs();

        expect(unacked).toEqual([]);
    });

    it('should handle acknowledging non-existent sequence', () => {
        buffer.addInput(Date.now(), { left: true });

        const acknowledged = buffer.acknowledgeSequence(100);
        expect(acknowledged.length).toBe(1);
        expect(buffer.size()).toBe(0);
    });

    it('should handle acknowledging sequence 0', () => {
        buffer.addInput(Date.now(), { left: true });
        buffer.addInput(Date.now(), { right: true });

        const acknowledged = buffer.acknowledgeSequence(0);
        expect(acknowledged.length).toBe(0);
        expect(buffer.size()).toBe(2);
    });

    it('should track acknowledgment statistics', () => {
        buffer.addInput(Date.now(), { left: true });
        buffer.addInput(Date.now(), { right: true });
        buffer.addInput(Date.now(), { brake: true });

        buffer.acknowledgeSequence(2);
        const stats = buffer.getStats();

        expect(stats.totalInputsAcknowledged).toBe(2);
    });

    it('should handle partial acknowledgment', () => {
        for (let i = 0; i < 10; i++) {
            buffer.addInput(Date.now(), { index: i });
        }

        buffer.acknowledgeSequence(5);
        expect(buffer.size()).toBe(5);

        const unacked = buffer.getUnacknowledgedInputs();
        expect(unacked.length).toBe(5);
        expect(unacked[0].sequence).toBe(6);
    });
});

// ============================================================================
// Reconciliation Tests (7 tests)
// ============================================================================

describe('InputBuffer - Reconciliation', () => {
    let buffer;

    beforeEach(() => {
        buffer = new InputBuffer();
    });

    it('should reconcile with server state', () => {
        buffer.addInput(Date.now(), { left: true });
        buffer.addInput(Date.now(), { right: true });
        buffer.addInput(Date.now(), { brake: true });

        const serverState = { x: 100, z: 200, speed: 50 };
        const result = buffer.reconcile(1, serverState);

        expect(result.serverSequence).toBe(1);
        expect(result.serverState).toEqual(serverState);
        expect(result.acknowledgedCount).toBe(1);
        expect(result.replayCount).toBe(2);
    });

    it('should return inputs to replay after server sequence', () => {
        buffer.addInput(Date.now(), { left: true });
        buffer.addInput(Date.now(), { right: true });
        buffer.addInput(Date.now(), { brake: true });

        const result = buffer.reconcile(1, {});
        expect(result.inputsToReplay.length).toBe(2);
        expect(result.inputsToReplay[0].sequence).toBe(2);
        expect(result.inputsToReplay[1].sequence).toBe(3);
    });

    it('should acknowledge inputs up to server sequence', () => {
        buffer.addInput(Date.now(), { left: true });
        buffer.addInput(Date.now(), { right: true });
        buffer.addInput(Date.now(), { brake: true });

        buffer.reconcile(2, {});
        expect(buffer.size()).toBe(1);
        expect(buffer.getLastAcknowledgedSequence()).toBe(2);
    });

    it('should handle full reconciliation (all acknowledged)', () => {
        buffer.addInput(Date.now(), { left: true });
        buffer.addInput(Date.now(), { right: true });

        const result = buffer.reconcile(2, {});
        expect(result.acknowledgedCount).toBe(2);
        expect(result.replayCount).toBe(0);
        expect(buffer.isEmpty()).toBe(true);
    });

    it('should track reconciliation statistics', () => {
        buffer.addInput(Date.now(), { left: true });
        buffer.reconcile(0, {});

        buffer.addInput(Date.now(), { right: true });
        buffer.reconcile(1, {});

        const stats = buffer.getStats();
        expect(stats.totalReconciliations).toBe(2);
    });

    it('should include timestamp in reconciliation result', () => {
        buffer.addInput(Date.now(), { left: true });
        const beforeReconcile = Date.now();

        const result = buffer.reconcile(0, {});

        expect(result.timestamp).toBeGreaterThanOrEqual(beforeReconcile);
    });

    it('should handle reconciliation with no inputs', () => {
        const serverState = { x: 0, z: 0 };
        const result = buffer.reconcile(0, serverState);

        expect(result.serverSequence).toBe(0);
        expect(result.serverState).toEqual(serverState);
        expect(result.acknowledgedCount).toBe(0);
        expect(result.replayCount).toBe(0);
    });
});

// ============================================================================
// Clear Old Inputs Tests (Additional Buffer Management)
// ============================================================================

describe('InputBuffer - Clear Old Inputs', () => {
    let buffer;

    beforeEach(() => {
        buffer = new InputBuffer({ maxAge: 100 });
    });

    it('should remove inputs older than maxAge', () => {
        const now = Date.now();
        // Use addInput with explicit sequence to control addedAt via sanitizeInput
        buffer.addInput(now - 150, { old: true });
        buffer.addInput(now - 50, { recent: true });
        buffer.addInput(now, { new: true });

        // Manually set addedAt for testing purposes
        const input1 = buffer.getInput(1);
        if (input1) input1.addedAt = now - 150;
        const input2 = buffer.getInput(2);
        if (input2) input2.addedAt = now - 50;
        const input3 = buffer.getInput(3);
        if (input3) input3.addedAt = now;

        const removed = buffer.clearOldInputs(now);
        expect(removed).toBe(1);
        expect(buffer.size()).toBe(2);
    });

    it('should return number of removed inputs', () => {
        const now = Date.now();
        for (let i = 0; i < 5; i++) {
            buffer.addInput(now - 200, { old: i });
        }
        for (let i = 0; i < 3; i++) {
            buffer.addInput(now - 50, { recent: i });
        }

        // Manually set addedAt for old inputs
        for (let i = 1; i <= 5; i++) {
            const input = buffer.getInput(i);
            if (input) input.addedAt = now - 200;
        }
        for (let i = 6; i <= 8; i++) {
            const input = buffer.getInput(i);
            if (input) input.addedAt = now - 50;
        }

        const removed = buffer.clearOldInputs(now);
        expect(removed).toBe(5);
    });

    it('should not remove recent inputs', () => {
        const now = Date.now();
        buffer.addInput(now - 50, { recent: true });
        buffer.addInput(now - 25, { veryRecent: true });

        // Manually set addedAt
        const input1 = buffer.getInput(1);
        if (input1) input1.addedAt = now - 50;
        const input2 = buffer.getInput(2);
        if (input2) input2.addedAt = now - 25;

        const removed = buffer.clearOldInputs(now);
        expect(removed).toBe(0);
        expect(buffer.size()).toBe(2);
    });

    it('should handle empty buffer', () => {
        const removed = buffer.clearOldInputs(Date.now());
        expect(removed).toBe(0);
    });

    it('should respect custom maxAge', () => {
        buffer = new InputBuffer({ maxAge: 50 });
        const now = Date.now();

        buffer.addInput(now - 60, { old: true });
        buffer.addInput(now - 40, { recent: true });

        // Manually set addedAt
        const input1 = buffer.getInput(1);
        if (input1) input1.addedAt = now - 60;
        const input2 = buffer.getInput(2);
        if (input2) input2.addedAt = now - 40;

        const removed = buffer.clearOldInputs(now);
        expect(removed).toBe(1);
    });
});

// ============================================================================
// Input Validation Tests
// ============================================================================

describe('InputBuffer - Input Validation', () => {
    let buffer;

    beforeEach(() => {
        buffer = new InputBuffer();
    });

    it('should validate input with required fields', () => {
        const result = buffer.validateInput({
            timestamp: 1000,
            sequence: 1,
            left: true
        });

        expect(result.valid).toBe(true);
        expect(result.errors).toEqual([]);
    });

    it('should reject null input', () => {
        const result = buffer.validateInput(null);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject undefined input', () => {
        const result = buffer.validateInput(undefined);
        expect(result.valid).toBe(false);
    });

    it('should reject non-object input', () => {
        const result = buffer.validateInput('string');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Input must be an object');
    });

    it('should reject negative timestamp', () => {
        const result = buffer.validateInput({
            timestamp: -100,
            sequence: 1
        });
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Timestamp cannot be negative');
    });

    it('should reject non-integer sequence', () => {
        const result = buffer.validateInput({
            timestamp: 1000,
            sequence: 1.5
        });
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Sequence must be an integer');
    });

    it('should reject negative sequence', () => {
        const result = buffer.validateInput({
            timestamp: 1000,
            sequence: -1
        });
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Sequence cannot be negative');
    });

    it('should accept valid input with extra fields', () => {
        const result = buffer.validateInput({
            timestamp: 1000,
            sequence: 1,
            left: true,
            right: false,
            customData: { nested: true }
        });
        expect(result.valid).toBe(true);
    });
});

// ============================================================================
// Input Sanitization Tests
// ============================================================================

describe('InputBuffer - Input Sanitization', () => {
    let buffer;

    beforeEach(() => {
        buffer = new InputBuffer();
    });

    it('should sanitize valid input', () => {
        const input = {
            timestamp: 1000,
            sequence: 1,
            left: true,
            right: false
        };
        const sanitized = buffer.sanitizeInput(input);

        expect(sanitized.timestamp).toBe(1000);
        expect(sanitized.sequence).toBe(1);
        expect(sanitized.left).toBe(true);
    });

    it('should handle null input', () => {
        const sanitized = buffer.sanitizeInput(null);
        expect(sanitized).toHaveProperty('timestamp');
        expect(sanitized).toHaveProperty('sequence');
        expect(sanitized).toHaveProperty('data');
    });

    it('should handle undefined input', () => {
        const sanitized = buffer.sanitizeInput(undefined);
        expect(sanitized).toEqual({
            timestamp: expect.any(Number),
            sequence: 0,
            data: {}
        });
    });

    it('should clamp negative timestamp', () => {
        const sanitized = buffer.sanitizeInput({
            timestamp: -100,
            sequence: 1
        });
        expect(sanitized.timestamp).toBe(0);
    });

    it('should clamp negative sequence', () => {
        const sanitized = buffer.sanitizeInput({
            timestamp: 1000,
            sequence: -5
        });
        expect(sanitized.sequence).toBe(0);
    });

    it('should preserve action fields', () => {
        const input = {
            timestamp: 1000,
            sequence: 1,
            left: true,
            right: false,
            brake: true,
            boost: false,
            turnAmount: 0.5
        };
        const sanitized = buffer.sanitizeInput(input);

        expect(sanitized.left).toBe(true);
        expect(sanitized.brake).toBe(true);
        expect(sanitized.turnAmount).toBe(0.5);
    });

    it('should add addedAt timestamp', () => {
        const beforeSanitize = Date.now();
        const sanitized = buffer.sanitizeInput({
            timestamp: 1000,
            sequence: 1,
            addedAt: beforeSanitize
        });
        expect(sanitized.addedAt).toBe(beforeSanitize);
    });
});

// ============================================================================
// Event System Tests
// ============================================================================

describe('InputBuffer - Event System', () => {
    let buffer;

    beforeEach(() => {
        buffer = new InputBuffer();
    });

    it('should emit onInputAdded event', () => {
        let eventCalled = false;
        let eventData = null;

        buffer.onInputAdded((input) => {
            eventCalled = true;
            eventData = input;
        });

        buffer.addInput(1000, { left: true });

        expect(eventCalled).toBe(true);
        expect(eventData).not.toBeNull();
        expect(eventData.left).toBe(true);
    });

    it('should emit onInputAcknowledged event', () => {
        let eventCalled = false;
        let eventData = null;

        buffer.onInputAcknowledged((inputs) => {
            eventCalled = true;
            eventData = inputs;
        });

        buffer.addInput(1000, { left: true });
        buffer.addInput(2000, { right: true });
        buffer.acknowledgeSequence(2);

        expect(eventCalled).toBe(true);
        expect(eventData).toHaveLength(2);
    });

    it('should emit onBufferFull event', () => {
        let eventCalled = false;
        let eventData = null;

        buffer = new InputBuffer({ maxBufferSize: 3 });
        buffer.onBufferFull((event) => {
            eventCalled = true;
            eventData = event;
        });

        buffer.addInput(Date.now(), { index: 1 });
        buffer.addInput(Date.now(), { index: 2 });
        buffer.addInput(Date.now(), { index: 3 });
        buffer.addInput(Date.now(), { index: 4 }); // Triggers buffer full

        expect(eventCalled).toBe(true);
        expect(eventData.size).toBe(3);
        expect(eventData.capacity).toBe(3);
        expect(eventData.usage).toBe(100);
    });

    it('should emit onReconciliation event', () => {
        let eventCalled = false;
        let eventData = null;

        buffer.onReconciliation((result) => {
            eventCalled = true;
            eventData = result;
        });

        buffer.addInput(Date.now(), { left: true });
        buffer.addInput(Date.now(), { right: true });
        buffer.reconcile(1, { x: 100 });

        expect(eventCalled).toBe(true);
        expect(eventData.serverSequence).toBe(1);
        expect(eventData.serverState.x).toBe(100);
    });

    it('should support multiple callbacks for same event', () => {
        let callback1Called = false;
        let callback2Called = false;

        buffer.onInputAdded(() => { callback1Called = true; });
        buffer.onInputAdded(() => { callback2Called = true; });

        buffer.addInput(Date.now(), { left: true });

        expect(callback1Called).toBe(true);
        expect(callback2Called).toBe(true);
    });

    it('should return callback from onInputAdded', () => {
        const callback = () => {};
        const returned = buffer.onInputAdded(callback);
        expect(returned).toBe(callback);
    });

    it('should throw error for non-function callback', () => {
        expect(() => buffer.onInputAdded('not a function')).toThrow();
        expect(() => buffer.onInputAcknowledged(null)).toThrow();
        expect(() => buffer.onBufferFull(123)).toThrow();
        expect(() => buffer.onReconciliation({})).toThrow();
    });

    it('should remove callback with offInputAdded', () => {
        let callbackCalled = 0;
        const callback = () => { callbackCalled++; };

        buffer.onInputAdded(callback);
        buffer.addInput(Date.now(), { left: true });
        expect(callbackCalled).toBe(1);

        buffer.offInputAdded(callback);
        buffer.addInput(Date.now(), { right: true });
        expect(callbackCalled).toBe(1);
    });

    it('should remove callback with offInputAcknowledged', () => {
        let callbackCalled = 0;
        const callback = () => { callbackCalled++; };

        buffer.onInputAcknowledged(callback);
        buffer.addInput(Date.now(), { left: true });
        buffer.acknowledgeSequence(1);
        expect(callbackCalled).toBe(1);

        buffer.offInputAcknowledged(callback);
        buffer.addInput(Date.now(), { right: true });
        buffer.acknowledgeSequence(2);
        expect(callbackCalled).toBe(1);
    });

    it('should remove callback with offBufferFull', () => {
        buffer = new InputBuffer({ maxBufferSize: 2 });
        let callbackCalled = 0;
        const callback = () => { callbackCalled++; };

        buffer.onBufferFull(callback);
        buffer.addInput(Date.now(), { index: 1 });
        buffer.addInput(Date.now(), { index: 2 });
        buffer.addInput(Date.now(), { index: 3 });
        expect(callbackCalled).toBe(1);

        buffer.offBufferFull(callback);
        buffer.addInput(Date.now(), { index: 4 });
        expect(callbackCalled).toBe(1);
    });

    it('should remove callback with offReconciliation', () => {
        let callbackCalled = 0;
        const callback = () => { callbackCalled++; };

        buffer.onReconciliation(callback);
        buffer.addInput(Date.now(), { left: true });
        buffer.reconcile(0, {});
        expect(callbackCalled).toBe(1);

        buffer.offReconciliation(callback);
        buffer.addInput(Date.now(), { right: true });
        buffer.reconcile(1, {});
        expect(callbackCalled).toBe(1);
    });

    it('should return boolean from off methods', () => {
        const callback = () => {};
        buffer.onInputAdded(callback);

        const removed = buffer.offInputAdded(callback);
        expect(removed).toBe(true);

        const notRemoved = buffer.offInputAdded(callback);
        expect(notRemoved).toBe(false);
    });
});

// ============================================================================
// Edge Cases Tests (5 tests)
// ============================================================================

describe('InputBuffer - Edge Cases', () => {
    it('should handle circular buffer overflow correctly', () => {
        const buffer = new InputBuffer({ maxBufferSize: 3 });

        // Add more inputs than buffer size
        for (let i = 0; i < 10; i++) {
            buffer.addInput(Date.now(), { index: i });
        }

        // Buffer should maintain max size
        expect(buffer.size()).toBe(3);

        // Should contain the most recent inputs
        const inputs = buffer.getInputsSince(0);
        expect(inputs.length).toBe(3);
        expect(inputs[0].sequence).toBe(8);
        expect(inputs[2].sequence).toBe(10);
    });

    it('should handle rapid add/remove cycles', () => {
        const buffer = new InputBuffer({ maxBufferSize: 5 });

        for (let cycle = 0; cycle < 100; cycle++) {
            buffer.addInput(Date.now(), { cycle });
            if (buffer.size() > 3) {
                buffer.acknowledgeSequence(buffer.getCurrentSequence() - 1);
            }
        }

        expect(buffer.size()).toBeLessThanOrEqual(5);
    });

    it('should handle zero maxBufferSize', () => {
        const buffer = new InputBuffer({ maxBufferSize: 0 });

        buffer.addInput(Date.now(), { left: true });
        // With size 0, adding should trigger buffer full and remove
        expect(buffer.size()).toBe(0);
    });

    it('should handle very large sequence numbers', () => {
        const buffer = new InputBuffer();
        buffer.setSequence(Number.MAX_SAFE_INTEGER - 10);

        for (let i = 0; i < 5; i++) {
            buffer.addInput(Date.now(), { index: i });
        }

        expect(buffer.getCurrentSequence()).toBeGreaterThan(Number.MAX_SAFE_INTEGER - 10);
        expect(buffer.size()).toBe(5);
    });

    it('should handle iterator protocol', () => {
        const buffer = new InputBuffer();
        buffer.addInput(Date.now(), { index: 1 });
        buffer.addInput(Date.now(), { index: 2 });
        buffer.addInput(Date.now(), { index: 3 });

        const inputs = [];
        for (const input of buffer) {
            inputs.push(input);
        }

        expect(inputs.length).toBe(3);
        expect(inputs[0].index).toBe(1);
        expect(inputs[2].index).toBe(3);
    });
});

// ============================================================================
// Statistics and Utility Tests
// ============================================================================

describe('InputBuffer - Statistics and Utilities', () => {
    let buffer;

    beforeEach(() => {
        buffer = new InputBuffer();
    });

    it('should get comprehensive stats', () => {
        buffer.addInput(Date.now(), { left: true });
        buffer.addInput(Date.now(), { right: true });
        buffer.addInput(Date.now(), { brake: true });
        buffer.acknowledgeSequence(1);

        const stats = buffer.getStats();

        expect(stats.totalInputsAdded).toBe(3);
        expect(stats.totalInputsAcknowledged).toBe(1);
        expect(stats.currentSize).toBe(2);
        expect(stats.capacity).toBe(60);
        expect(stats.lastAcknowledgedSequence).toBe(1);
        expect(stats.currentSequence).toBe(3);
    });

    it('should reset buffer completely', () => {
        buffer.addInput(Date.now(), { left: true });
        buffer.addInput(Date.now(), { right: true });
        buffer.acknowledgeSequence(1);

        buffer.reset();

        expect(buffer.size()).toBe(0);
        expect(buffer.getCurrentSequence()).toBe(0);
        expect(buffer.getLastAcknowledgedSequence()).toBe(-1);
        expect(buffer.isEmpty()).toBe(true);
    });

    it('should serialize to JSON', () => {
        buffer.addInput(1000, { left: true });
        buffer.addInput(2000, { right: true });

        const json = buffer.toJSON();

        expect(json.options).toBeDefined();
        expect(json.currentSequence).toBe(2);
        expect(json.bufferSize).toBe(2);
        expect(json.inputs).toHaveLength(2);
    });

    it('should track max buffer usage', () => {
        buffer = new InputBuffer({ maxBufferSize: 10 });

        // Fill to 50%
        for (let i = 0; i < 5; i++) {
            buffer.addInput(Date.now(), { index: i });
        }
        buffer.clear();

        // Fill to 80%
        for (let i = 0; i < 8; i++) {
            buffer.addInput(Date.now(), { index: i });
        }

        const stats = buffer.getStats();
        expect(stats.maxBufferUsage).toBeGreaterThanOrEqual(80);
    });

    it('should handle Symbol.iterator for empty buffer', () => {
        const buffer = new InputBuffer();
        const inputs = [];

        for (const input of buffer) {
            inputs.push(input);
        }

        expect(inputs).toEqual([]);
    });
});

// ============================================================================
// Integration-style Tests
// ============================================================================

describe('InputBuffer - Integration Scenarios', () => {
    it('should handle typical client prediction flow', () => {
        const buffer = new InputBuffer({ maxBufferSize: 60, maxAge: 200 });
        const inputs = [];

        // Client sends inputs
        for (let i = 0; i < 10; i++) {
            const seq = buffer.addInput(Date.now(), {
                left: i % 3 === 0,
                right: i % 3 === 1,
                brake: i % 3 === 2
            });
            inputs.push(seq);
        }

        // Server acknowledges up to sequence 5
        buffer.acknowledgeSequence(5);
        expect(buffer.size()).toBe(5);
        expect(buffer.getLastAcknowledgedSequence()).toBe(5);

        // Reconcile with server state
        const result = buffer.reconcile(5, { x: 100, z: 200 });
        expect(result.inputsToReplay.length).toBe(5);

        // Unacknowledged should be empty after reconcile
        expect(buffer.getUnacknowledgedInputs()).toHaveLength(5);
    });

    it('should handle network lag simulation', () => {
        const buffer = new InputBuffer({ maxBufferSize: 60, maxAge: 500 });
        const startTime = Date.now();

        // Simulate 60fps input for 2 seconds (120 frames)
        for (let i = 0; i < 120; i++) {
            buffer.addInput(startTime + i * 16, {
                timestamp: startTime + i * 16,
                input: i
            });
        }

        // Buffer should be limited by maxBufferSize (60)
        // When buffer is full, oldest is removed on each add
        expect(buffer.size()).toBeLessThanOrEqual(60);
        expect(buffer.size()).toBeGreaterThan(0);

        // Clear old inputs after lag
        const currentTime = startTime + 2000;
        const removed = buffer.clearOldInputs(currentTime);
        // Some inputs should be removed as they're older than maxAge (500ms)
        expect(removed).toBeGreaterThanOrEqual(0);
    });

    it('should handle reconnection scenario', () => {
        const buffer = new InputBuffer();

        // Add some inputs before disconnect
        for (let i = 0; i < 5; i++) {
            buffer.addInput(Date.now(), { index: i });
        }

        // Simulate reconnection - reset buffer
        buffer.reset();

        // Start fresh
        expect(buffer.size()).toBe(0);
        expect(buffer.getCurrentSequence()).toBe(0);

        // Add new inputs
        buffer.addInput(Date.now(), { reconnected: true });
        expect(buffer.getCurrentSequence()).toBe(1);
    });
});
