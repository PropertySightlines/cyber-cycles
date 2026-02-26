/**
 * MemoryProfiler Tests for Cyber Cycles
 *
 * Comprehensive test suite for the MemoryProfiler module.
 * Tests cover:
 * - MemoryProfiler basics (10 tests)
 * - Entity tracking (8 tests)
 * - Snapshot comparison (6 tests)
 * - GC monitoring (5 tests)
 * - Leak detection (6 tests)
 * - Report generation (5 tests)
 *
 * Target: 40+ tests total
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MemoryProfiler, createMemoryProfiler } from './memory-profile.js';

// Mock performance.memory API
const mockMemoryAPI = {
    usedJSHeapSize: 10 * 1024 * 1024, // 10MB
    totalJSHeapSize: 50 * 1024 * 1024, // 50MB
    jsHeapSizeLimit: 100 * 1024 * 1024, // 100MB
    external: 1024 * 1024 // 1MB
};

// ============================================================================
// MemoryProfiler Basics Tests (10 tests)
// ============================================================================

describe('MemoryProfiler - Basics', () => {
    let profiler;

    beforeEach(() => {
        profiler = new MemoryProfiler();
    });

    afterEach(() => {
        profiler.stopTracking();
    });

    it('should create MemoryProfiler instance', () => {
        expect(profiler).toBeInstanceOf(MemoryProfiler);
    });

    it('should create via factory function', () => {
        const p = createMemoryProfiler();
        expect(p).toBeInstanceOf(MemoryProfiler);
    });

    it('should start tracking', () => {
        const result = profiler.startTracking();
        expect(result).toBe(profiler);
    });

    it('should set isTracking to true after start', () => {
        profiler.startTracking();
        const usage = profiler.getMemoryUsage();
        expect(usage.isTracking).toBe(true);
    });

    it('should stop tracking', () => {
        profiler.startTracking();
        const result = profiler.stopTracking();
        expect(result).toBeDefined();
    });

    it('should set isTracking to false after stop', () => {
        profiler.startTracking();
        profiler.stopTracking();
        const usage = profiler.getMemoryUsage();
        expect(usage.isTracking).toBe(false);
    });

    it('should track duration correctly', () => {
        profiler.startTracking();
        const startTime = Date.now();
        vi.useFakeTimers();
        vi.advanceTimersByTime(1000);
        profiler.stopTracking();
        vi.useRealTimers();

        const usage = profiler.getMemoryUsage();
        expect(usage.trackingDuration).toBeGreaterThanOrEqual(0);
    });

    it('should take snapshot with default label', () => {
        profiler.startTracking();
        const snapshot = profiler.takeSnapshot();
        expect(snapshot.label).toBe('snapshot');
        expect(snapshot.index).toBe(1); // 0 was initial
    });

    it('should take snapshot with custom label', () => {
        profiler.startTracking();
        const snapshot = profiler.takeSnapshot('test_label');
        expect(snapshot.label).toBe('test_label');
    });

    it('should increment snapshot index', () => {
        profiler.startTracking();
        profiler.takeSnapshot('s1');
        profiler.takeSnapshot('s2');
        profiler.takeSnapshot('s3');

        const usage = profiler.getMemoryUsage();
        expect(usage.snapshots).toBe(4); // initial + 3
    });
});

// ============================================================================
// Entity Tracking Tests (8 tests)
// ============================================================================

describe('MemoryProfiler - Entity Tracking', () => {
    let profiler;

    beforeEach(() => {
        profiler = new MemoryProfiler();
        profiler.startTracking();
    });

    afterEach(() => {
        profiler.stopTracking();
    });

    it('should track entity creation', () => {
        profiler.trackEntityCreation('Player');
        const stats = profiler.getEntityStats();
        expect(stats.Player).toBeDefined();
        expect(stats.Player.created).toBe(1);
    });

    it('should track multiple entity creations', () => {
        profiler.trackEntityCreation('Player');
        profiler.trackEntityCreation('Player');
        profiler.trackEntityCreation('TrailEntity');

        const stats = profiler.getEntityStats();
        expect(stats.Player.created).toBe(2);
        expect(stats.TrailEntity.created).toBe(1);
    });

    it('should track entity destruction', () => {
        profiler.trackEntityCreation('Player');
        profiler.trackEntityDestruction('Player');

        const stats = profiler.getEntityStats();
        expect(stats.Player.destroyed).toBe(1);
    });

    it('should calculate active entities correctly', () => {
        profiler.trackEntityCreation('Player', 'p1');
        profiler.trackEntityCreation('Player', 'p2');
        profiler.trackEntityCreation('Player', 'p3');
        profiler.trackEntityDestruction('Player', 'p1');

        const stats = profiler.getEntityStats();
        expect(stats.Player.active).toBe(2);
    });

    it('should track entities with IDs', () => {
        profiler.trackEntityCreation('Player', 'player1');
        profiler.trackEntityCreation('Player', 'player2');
        profiler.trackEntityDestruction('Player', 'player1');

        const stats = profiler.getEntityStats();
        expect(stats.Player.active).toBe(1);
    });

    it('should calculate leak ratio', () => {
        profiler.trackEntityCreation('Player');
        profiler.trackEntityCreation('Player');
        profiler.trackEntityCreation('Player');
        profiler.trackEntityCreation('Player');
        profiler.trackEntityDestruction('Player');

        const stats = profiler.getEntityStats();
        expect(stats.Player.leakRatio).toBe(0.75); // 3/4 not destroyed
    });

    it('should detect entity leaks', () => {
        // Create many entities without destroying
        for (let i = 0; i < 20; i++) {
            profiler.trackEntityCreation('LeakyEntity');
        }

        const leaks = profiler.detectEntityLeaks();
        expect(leaks.length).toBeGreaterThan(0);
        expect(leaks[0].type).toBe('LeakyEntity');
    });

    it('should not detect leak when entities are properly destroyed', () => {
        for (let i = 0; i < 10; i++) {
            profiler.trackEntityCreation('ProperEntity');
            profiler.trackEntityDestruction('ProperEntity');
        }

        const leaks = profiler.detectEntityLeaks();
        const properLeak = leaks.find(l => l.type === 'ProperEntity');
        expect(properLeak).toBeUndefined();
    });
});

// ============================================================================
// Snapshot Comparison Tests (6 tests)
// ============================================================================

describe('MemoryProfiler - Snapshot Comparison', () => {
    let profiler;

    beforeEach(() => {
        profiler = new MemoryProfiler();
        profiler.startTracking();
    });

    afterEach(() => {
        profiler.stopTracking();
    });

    it('should compare two snapshots', () => {
        const s1 = profiler.takeSnapshot('before');
        profiler.trackEntityCreation('Player');
        const s2 = profiler.takeSnapshot('after');

        const comparison = profiler.compareSnapshots(s1, s2);
        expect(comparison).toBeDefined();
        expect(comparison.timeElapsed).toBeGreaterThanOrEqual(0);
    });

    it('should detect entity changes in comparison', () => {
        const s1 = profiler.takeSnapshot('before');
        profiler.trackEntityCreation('Player');
        profiler.trackEntityCreation('Player');
        const s2 = profiler.takeSnapshot('after');

        const comparison = profiler.compareSnapshots(s1, s2);
        expect(comparison.entityChanges.Player).toBeDefined();
        expect(comparison.entityChanges.Player.change).toBe(2);
    });

    it('should calculate memory change', () => {
        const s1 = profiler.takeSnapshot('before');
        const s2 = profiler.takeSnapshot('after');

        const comparison = profiler.compareSnapshots(s1, s2);
        expect(comparison.memoryChange).toBeDefined();
    });

    it('should handle null snapshots', () => {
        const comparison = profiler.compareSnapshots(null, null);
        expect(comparison.error).toBeDefined();
    });

    it('should assess health status', () => {
        const s1 = profiler.takeSnapshot('before');
        const s2 = profiler.takeSnapshot('after');

        const comparison = profiler.compareSnapshots(s1, s2);
        expect(comparison.isHealthy).toBeDefined();
    });

    it('should track spatial hash changes', () => {
        const s1 = profiler.takeSnapshot('before');
        profiler.trackSpatialHashUsage({
            getDebugInfo: () => ({ cellCount: 10, entityCount: 50 })
        });
        const s2 = profiler.takeSnapshot('after');

        const comparison = profiler.compareSnapshots(s1, s2);
        expect(comparison.spatialHashChange).toBeDefined();
        expect(comparison.spatialHashChange.instances).toBe(1);
    });
});

// ============================================================================
// GC Monitoring Tests (5 tests)
// ============================================================================

describe('MemoryProfiler - GC Monitoring', () => {
    let profiler;

    beforeEach(() => {
        profiler = new MemoryProfiler();
        profiler.startTracking();
    });

    afterEach(() => {
        profiler.stopTracking();
    });

    it('should track GC event', () => {
        profiler.trackGC(5);
        const stats = profiler.getGCStats();
        expect(stats.collections).toBe(1);
        expect(stats.totalPauseTime).toBe(5);
    });

    it('should track multiple GC events', () => {
        profiler.trackGC(10);
        profiler.trackGC(15);
        profiler.trackGC(20);

        const stats = profiler.getGCStats();
        expect(stats.collections).toBe(3);
        expect(stats.totalPauseTime).toBe(45);
    });

    it('should calculate average pause time', () => {
        profiler.trackGC(10);
        profiler.trackGC(20);
        profiler.trackGC(30);

        const stats = profiler.getGCStats();
        expect(stats.averagePauseTime).toBe(20);
    });

    it('should estimate GC pressure', () => {
        const pressure = profiler.estimateGCPressure();
        expect(['low', 'medium', 'high']).toContain(pressure);
    });

    it('should include GC stats in snapshot', () => {
        profiler.trackGC(10);
        const snapshot = profiler.takeSnapshot();

        expect(snapshot.gcStats).toBeDefined();
        expect(snapshot.gcStats.collections).toBe(1);
    });
});

// ============================================================================
// Leak Detection Tests (6 tests)
// ============================================================================

describe('MemoryProfiler - Leak Detection', () => {
    let profiler;

    beforeEach(() => {
        profiler = new MemoryProfiler();
        profiler.startTracking();
    });

    afterEach(() => {
        profiler.stopTracking();
    });

    it('should detect leaks', () => {
        const result = profiler.detectLeaks();
        expect(result).toBeDefined();
        expect(result.summary).toBeDefined();
    });

    it('should get leak report', () => {
        profiler.trackEntityCreation('LeakyEntity');
        profiler.trackEntityCreation('LeakyEntity');

        const report = profiler.getLeakReport();
        expect(report).toBeDefined();
        expect(report.summary.totalLeaksDetected).toBeGreaterThanOrEqual(0);
    });

    it('should suggest optimizations', () => {
        const suggestions = profiler.suggestOptimizations();
        expect(Array.isArray(suggestions)).toBe(true);
        expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should detect allocation leaks', () => {
        profiler.trackAllocation('LargeBuffer', 60 * 1024 * 1024); // 60MB

        const leaks = profiler.detectLeaks();
        const allocLeak = leaks.allocationLeaks.find(l => l.label === 'LargeBuffer');
        expect(allocLeak).toBeDefined();
    });

    it('should calculate overall severity', () => {
        // Create significant leak
        for (let i = 0; i < 150; i++) {
            profiler.trackEntityCreation('MassiveLeak');
        }

        const report = profiler.getLeakReport();
        expect(['none', 'low', 'medium', 'high', 'critical']).toContain(report.summary.severity);
    });

    it('should provide recommendations for leaks', () => {
        profiler.trackEntityCreation('TrailEntity');
        profiler.trackEntityCreation('TrailEntity');

        const report = profiler.getLeakReport();
        expect(report.summary.recommendations).toBeDefined();
        expect(Array.isArray(report.summary.recommendations)).toBe(true);
    });
});

// ============================================================================
// Report Generation Tests (5 tests)
// ============================================================================

describe('MemoryProfiler - Report Generation', () => {
    let profiler;

    beforeEach(() => {
        profiler = new MemoryProfiler();
        profiler.startTracking();

        // Add some data for reports
        profiler.trackEntityCreation('Player');
        profiler.trackEntityCreation('TrailEntity');
        profiler.trackSpatialHashUsage({
            getDebugInfo: () => ({ cellCount: 100, entityCount: 500 })
        });
        profiler.trackGC(15);
    });

    afterEach(() => {
        profiler.stopTracking();
    });

    it('should generate text report', () => {
        const report = profiler.generateReport();
        expect(typeof report).toBe('string');
        expect(report).toContain('CYBER CYCLES MEMORY PROFILE REPORT');
        expect(report).toContain('MEMORY USAGE');
        expect(report).toContain('ENTITY STATISTICS');
    });

    it('should export to JSON', () => {
        const json = profiler.exportToJSON();
        expect(typeof json).toBe('object');
        expect(json.version).toBe('1.0.0');
        expect(json.memory).toBeDefined();
        expect(json.entities).toBeDefined();
    });

    it('should export to Markdown', () => {
        const md = profiler.exportToMarkdown();
        expect(typeof md).toBe('string');
        expect(md).toContain('# Cyber Cycles Memory Profile Report');
        expect(md).toContain('## Overview');
        expect(md).toContain('|');
    });

    it('should include all sections in JSON export', () => {
        const json = profiler.exportToJSON();

        expect(json.overview).toBeDefined();
        expect(json.memory).toBeDefined();
        expect(json.entities).toBeDefined();
        expect(json.spatialHash).toBeDefined();
        expect(json.trails).toBeDefined();
        expect(json.gc).toBeDefined();
        expect(json.leaks).toBeDefined();
        expect(json.suggestions).toBeDefined();
        expect(json.snapshots).toBeDefined();
    });

    it('should include formatted tables in Markdown', () => {
        const md = profiler.exportToMarkdown();

        expect(md).toContain('| Metric | Value |');
        expect(md).toContain('|--------|-------|');
        expect(md).toContain('| Type | Created | Destroyed | Active | Leak Ratio |');
    });
});

// ============================================================================
// SpatialHash Monitoring Tests
// ============================================================================

describe('MemoryProfiler - SpatialHash Monitoring', () => {
    let profiler;

    beforeEach(() => {
        profiler = new MemoryProfiler();
        profiler.startTracking();
    });

    afterEach(() => {
        profiler.stopTracking();
    });

    it('should track SpatialHash usage', () => {
        const mockSpatialHash = {
            getDebugInfo: () => ({ cellCount: 50, entityCount: 200 })
        };

        profiler.trackSpatialHashUsage(mockSpatialHash);
        const stats = profiler.getSpatialHashStats();

        expect(stats.instances).toBe(1);
        expect(stats.totalCells).toBe(50);
        expect(stats.totalEntities).toBe(200);
    });

    it('should handle SpatialHash without getDebugInfo', () => {
        profiler.trackSpatialHashUsage({});
        const stats = profiler.getSpatialHashStats();
        expect(stats.instances).toBe(1);
    });

    it('should track multiple SpatialHash instances', () => {
        profiler.trackSpatialHashUsage({ getDebugInfo: () => ({ cellCount: 10, entityCount: 50 }) });
        profiler.trackSpatialHashUsage({ getDebugInfo: () => ({ cellCount: 20, entityCount: 100 }) });

        const stats = profiler.getSpatialHashStats();
        expect(stats.instances).toBe(2);
        expect(stats.totalCells).toBe(30);
        expect(stats.totalEntities).toBe(150);
    });

    it('should calculate average entities per instance', () => {
        profiler.trackSpatialHashUsage({ getDebugInfo: () => ({ cellCount: 10, entityCount: 100 }) });
        profiler.trackSpatialHashUsage({ getDebugInfo: () => ({ cellCount: 10, entityCount: 200 }) });

        const stats = profiler.getSpatialHashStats();
        expect(stats.avgEntitiesPerInstance).toBe(150);
    });

    it('should estimate memory usage', () => {
        profiler.trackSpatialHashUsage({ getDebugInfo: () => ({ cellCount: 100, entityCount: 500 }) });
        const stats = profiler.getSpatialHashStats();
        expect(stats.memoryEstimate).toBeGreaterThan(0);
    });
});

// ============================================================================
// Trail Monitoring Tests
// ============================================================================

describe('MemoryProfiler - Trail Monitoring', () => {
    let profiler;

    beforeEach(() => {
        profiler = new MemoryProfiler();
        profiler.startTracking();
    });

    afterEach(() => {
        profiler.stopTracking();
    });

    it('should track trail memory', () => {
        const mockTrail = {
            segmentCount: () => 50,
            segments: new Array(51).fill({ x: 0, z: 0 })
        };

        profiler.trackTrailMemory(mockTrail);
        const stats = profiler.getTrailStats();

        expect(stats.instances).toBe(1);
        expect(stats.totalSegments).toBe(50);
        expect(stats.totalPoints).toBe(51);
    });

    it('should handle trail without segmentCount', () => {
        profiler.trackTrailMemory({ segments: [{ x: 0, z: 0 }] });
        const stats = profiler.getTrailStats();
        expect(stats.instances).toBe(1);
    });

    it('should track multiple trails', () => {
        profiler.trackTrailMemory({ segmentCount: () => 10, segments: new Array(11).fill({}) });
        profiler.trackTrailMemory({ segmentCount: () => 20, segments: new Array(21).fill({}) });

        const stats = profiler.getTrailStats();
        expect(stats.instances).toBe(2);
        expect(stats.totalSegments).toBe(30);
    });

    it('should calculate average segments per trail', () => {
        profiler.trackTrailMemory({ segmentCount: () => 10, segments: new Array(11).fill({}) });
        profiler.trackTrailMemory({ segmentCount: () => 30, segments: new Array(31).fill({}) });

        const stats = profiler.getTrailStats();
        expect(stats.avgSegmentsPerTrail).toBe(20);
    });

    it('should estimate trail memory usage', () => {
        profiler.trackTrailMemory({ segmentCount: () => 100, segments: new Array(101).fill({}) });
        const stats = profiler.getTrailStats();
        expect(stats.memoryEstimate).toBeGreaterThan(0);
    });
});

// ============================================================================
// Allocation Tracking Tests
// ============================================================================

describe('MemoryProfiler - Allocation Tracking', () => {
    let profiler;

    beforeEach(() => {
        profiler = new MemoryProfiler();
        profiler.startTracking();
    });

    afterEach(() => {
        profiler.stopTracking();
    });

    it('should track allocation', () => {
        profiler.trackAllocation('Buffer', 1024);
        const usage = profiler.getMemoryUsage();

        expect(usage.allocations.totalAllocated).toBe(1024);
        expect(usage.allocations.allocationCount).toBe(1);
    });

    it('should track multiple allocations with same label', () => {
        profiler.trackAllocation('Buffer', 100);
        profiler.trackAllocation('Buffer', 200);
        profiler.trackAllocation('Buffer', 300);

        const usage = profiler.getMemoryUsage();
        expect(usage.allocations.totalAllocated).toBe(600);
        expect(usage.allocations.allocationCount).toBe(3);
    });

    it('should track deallocation', () => {
        profiler.trackAllocation('Buffer', 1000);
        profiler.trackDeallocation('Buffer', 400);

        const usage = profiler.getMemoryUsage();
        expect(usage.allocations.totalDeallocated).toBe(400);
        expect(usage.allocations.netRemaining).toBe(600);
    });

    it('should track allocations by label', () => {
        profiler.trackAllocation('Buffer1', 100);
        profiler.trackAllocation('Buffer2', 200);

        const usage = profiler.getMemoryUsage();
        expect(usage.allocations.remainingByLabel.Buffer1.size).toBe(100);
        expect(usage.allocations.remainingByLabel.Buffer2.size).toBe(200);
    });

    it('should handle deallocation exceeding allocation', () => {
        profiler.trackAllocation('Buffer', 100);
        profiler.trackDeallocation('Buffer', 150);

        const usage = profiler.getMemoryUsage();
        expect(usage.allocations.remainingByLabel.Buffer.size).toBe(0); // Should not go negative
    });
});

// ============================================================================
// Memory Usage Tests
// ============================================================================

describe('MemoryProfiler - Memory Usage', () => {
    let profiler;

    beforeEach(() => {
        profiler = new MemoryProfiler();
    });

    afterEach(() => {
        profiler.stopTracking();
    });

    it('should get memory usage before tracking', () => {
        const usage = profiler.getMemoryUsage();
        expect(usage.isTracking).toBe(false);
    });

    it('should get peak memory', () => {
        profiler.startTracking();
        profiler.takeSnapshot('s1');
        profiler.takeSnapshot('s2');
        profiler.takeSnapshot('s3');

        const usage = profiler.getMemoryUsage();
        expect(usage.peak).toBeDefined();
    });

    it('should get average memory', () => {
        profiler.startTracking();
        profiler.takeSnapshot('s1');
        profiler.takeSnapshot('s2');
        profiler.takeSnapshot('s3');

        const usage = profiler.getMemoryUsage();
        expect(usage.average).toBeDefined();
    });

    it('should determine memory status', () => {
        profiler.startTracking();
        const usage = profiler.getMemoryUsage();

        expect(['HEALTHY', 'WARNING', 'CRITICAL']).toContain(usage.status);
    });

    it('should handle environments without memory API', () => {
        // The profiler should work even without performance.memory
        profiler.startTracking();
        const usage = profiler.getMemoryUsage();

        expect(usage).toBeDefined();
        expect(usage.current).toBeDefined();
    });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('MemoryProfiler - Integration', () => {
    it('should run complete profiling session', () => {
        const profiler = new MemoryProfiler();

        // Start tracking
        profiler.startTracking();

        // Simulate game activity
        for (let i = 0; i < 10; i++) {
            profiler.trackEntityCreation('Player', `player_${i}`);
            profiler.trackEntityCreation('TrailEntity', `trail_${i}`);
        }

        profiler.trackSpatialHashUsage({
            getDebugInfo: () => ({ cellCount: 100, entityCount: 500 })
        });

        profiler.trackTrailMemory({
            segmentCount: () => 50,
            segments: new Array(51).fill({ x: 0, z: 0 })
        });

        profiler.trackGC(10);
        profiler.trackGC(15);

        // Take snapshots
        profiler.takeSnapshot('mid_session');

        // Destroy some entities
        for (let i = 0; i < 5; i++) {
            profiler.trackEntityDestruction('Player', `player_${i}`);
        }

        // Stop tracking
        profiler.stopTracking();

        // Generate reports
        const usage = profiler.getMemoryUsage();
        const report = profiler.generateReport();
        const json = profiler.exportToJSON();
        const md = profiler.exportToMarkdown();

        // Verify results
        expect(usage.trackingDuration).toBeGreaterThanOrEqual(0);
        expect(report).toContain('CYBER CYCLES MEMORY PROFILE REPORT');
        expect(json.version).toBe('1.0.0');
        expect(md).toContain('# Cyber Cycles Memory Profile Report');
    });

    it('should detect realistic leak scenario', () => {
        const profiler = new MemoryProfiler();
        profiler.startTracking();

        // Simulate players joining but not properly cleaning up
        for (let i = 0; i < 50; i++) {
            profiler.trackEntityCreation('Player', `player_${i}`);
            profiler.trackEntityCreation('TrailEntity', `trail_${i}`);
        }

        // Only some players disconnect properly
        for (let i = 0; i < 10; i++) {
            profiler.trackEntityDestruction('Player', `player_${i}`);
            profiler.trackEntityDestruction('TrailEntity', `trail_${i}`);
        }

        const leaks = profiler.detectLeaks();

        expect(leaks.summary.hasLeaks).toBe(true);
        expect(leaks.entityLeaks.length).toBeGreaterThan(0);
    });

    it('should handle high-frequency tracking', () => {
        const profiler = new MemoryProfiler();
        profiler.startTracking();

        // Rapid tracking calls
        for (let i = 0; i < 100; i++) {
            profiler.trackEntityCreation('Particle');
            profiler.trackAllocation('TempBuffer', 100);
            profiler.takeSnapshot(`rapid_${i}`);
        }

        const usage = profiler.getMemoryUsage();
        expect(usage.snapshots).toBe(101); // initial + 100
    });
});

// ============================================================================
// Edge Cases Tests
// ============================================================================

describe('MemoryProfiler - Edge Cases', () => {
    let profiler;

    beforeEach(() => {
        profiler = new MemoryProfiler();
    });

    it('should handle empty entity type', () => {
        profiler.startTracking();
        profiler.trackEntityCreation('');
        const stats = profiler.getEntityStats();
        expect(stats['']).toBeDefined();
    });

    it('should handle null entity ID', () => {
        profiler.startTracking();
        profiler.trackEntityCreation('Player', null);
        const stats = profiler.getEntityStats();
        expect(stats.Player.active).toBe(1);
    });

    it('should handle zero-size allocation', () => {
        profiler.startTracking();
        profiler.trackAllocation('ZeroBuffer', 0);
        const usage = profiler.getMemoryUsage();
        expect(usage.allocations.totalAllocated).toBe(0);
    });

    it('should handle negative deallocation gracefully', () => {
        profiler.startTracking();
        profiler.trackAllocation('Buffer', 100);
        profiler.trackDeallocation('Buffer', -50); // Negative should still count
        const usage = profiler.getMemoryUsage();
        expect(usage.allocations.deallocationCount).toBe(1);
    });

    it('should handle stop without start', () => {
        // Should not throw
        expect(() => profiler.stopTracking()).not.toThrow();
    });

    it('should handle multiple start calls', () => {
        profiler.startTracking();
        profiler.startTracking(); // Should reset
        const usage = profiler.getMemoryUsage();
        expect(usage.isTracking).toBe(true);
    });

    it('should handle comparison of same snapshot', () => {
        profiler.startTracking();
        const snapshot = profiler.takeSnapshot('same');
        const comparison = profiler.compareSnapshots(snapshot, snapshot);

        expect(comparison.timeElapsed).toBe(0);
        expect(comparison.memoryChange).toBe(0);
    });
});

// ============================================================================
// Format Helper Tests
// ============================================================================

describe('MemoryProfiler - Format Helpers', () => {
    let profiler;

    beforeEach(() => {
        profiler = new MemoryProfiler();
    });

    it('should format bytes correctly', () => {
        // These are internal methods, but we can test via report output
        profiler.startTracking();
        profiler.trackAllocation('Test', 1024);
        const report = profiler.generateReport();

        expect(report).toContain('KB');
    });

    it('should format duration correctly', () => {
        profiler.startTracking();
        const report = profiler.generateReport();

        expect(report).toMatch(/(ms|s|m)/);
    });
});

// ============================================================================
// Snapshot History Tests
// ============================================================================

describe('MemoryProfiler - Snapshot History', () => {
    let profiler;

    beforeEach(() => {
        profiler = new MemoryProfiler();
        profiler.startTracking();
    });

    afterEach(() => {
        profiler.stopTracking();
    });

    it('should maintain memory history', () => {
        profiler.takeSnapshot('s1');
        profiler.takeSnapshot('s2');
        profiler.takeSnapshot('s3');

        const usage = profiler.getMemoryUsage();
        expect(usage.snapshots).toBe(4); // initial + 3
    });

    it('should include timestamp in snapshots', () => {
        const snapshot = profiler.takeSnapshot('timestamped');
        expect(snapshot.timestamp).toBeDefined();
        expect(typeof snapshot.timestamp).toBe('number');
    });

    it('should include memory info in snapshots', () => {
        const snapshot = profiler.takeSnapshot('with_memory');
        expect(snapshot.memory).toBeDefined();
        expect(snapshot.memory.usedJSHeapSize).toBeDefined();
    });

    it('should include entity stats in snapshots', () => {
        profiler.trackEntityCreation('Player');
        const snapshot = profiler.takeSnapshot('with_entities');
        expect(snapshot.entityStats).toBeDefined();
    });
});
