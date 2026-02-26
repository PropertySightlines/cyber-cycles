/**
 * MemoryProfiler - Memory profiling system for Cyber Cycles
 *
 * Provides comprehensive memory tracking, leak detection, and optimization
 * recommendations for the Cyber Cycles game client.
 *
 * Features:
 * - Real-time memory tracking with snapshots
 * - Entity creation/destruction monitoring
 * - SpatialHash memory usage tracking
 * - Trail memory monitoring
 * - Garbage collection monitoring
 * - Leak detection and reporting
 * - Export to JSON and Markdown formats
 *
 * @example
 * const profiler = new MemoryProfiler();
 * profiler.startTracking();
 * // ... run game operations ...
 * const report = profiler.stopTracking();
 * console.log(profiler.generateReport());
 *
 * @module MemoryProfiler
 */

// ============================================================================
// Constants
// ============================================================================

const MEMORY_THRESHOLD_WARNING = 50 * 1024 * 1024; // 50MB
const MEMORY_THRESHOLD_CRITICAL = 100 * 1024 * 1024; // 100MB
const ENTITY_LEAK_THRESHOLD = 10; // Entities created but not destroyed
const GROWTH_RATE_THRESHOLD = 0.1; // 10% growth rate indicates potential leak
const SNAPSHOT_INTERVAL_DEFAULT = 1000; // ms
const GC_PRESSURE_LOW = 0.3;
const GC_PRESSURE_MEDIUM = 0.6;
const GC_PRESSURE_HIGH = 0.8;

// ============================================================================
// MemoryProfiler Class
// ============================================================================

export class MemoryProfiler {
    /**
     * Creates a new MemoryProfiler instance
     */
    constructor() {
        // Tracking state
        this._isTracking = false;
        this._startTime = null;
        this._stopTime = null;

        // Memory snapshots
        this._snapshots = [];
        this._currentSnapshotIndex = 0;

        // Entity tracking
        this._entityCreations = new Map(); // entityType -> count
        this._entityDestructions = new Map(); // entityType -> count
        this._activeEntities = new Map(); // entityType -> Set of entityIds

        // SpatialHash tracking
        this._spatialHashStats = {
            instances: 0,
            totalCells: 0,
            totalEntities: 0,
            memoryEstimate: 0
        };

        // Trail tracking
        this._trailStats = {
            instances: 0,
            totalSegments: 0,
            totalPoints: 0,
            memoryEstimate: 0
        };

        // GC tracking
        this._gcStats = {
            collections: 0,
            totalPauseTime: 0,
            lastCollectionTime: null,
            collectionIntervals: []
        };

        // Allocation tracking
        this._allocations = new Map(); // label -> {size, timestamp, count}
        this._deallocationCount = 0;
        this._totalAllocated = 0;
        this._totalDeallocated = 0;

        // Leak detection results
        this._leakReport = null;
        this._detectedLeaks = [];

        // Historical data for growth analysis
        this._memoryHistory = [];
        this._snapshotInterval = SNAPSHOT_INTERVAL_DEFAULT;
        this._autoSnapshotTimer = null;
    }

    // ========================================================================
    // Core Tracking Methods
    // ========================================================================

    /**
     * Start memory tracking
     * Initializes tracking and begins collecting memory data
     */
    startTracking() {
        this._isTracking = true;
        this._startTime = Date.now();
        this._snapshots = [];
        this._memoryHistory = [];
        this._detectedLeaks = [];
        this._leakReport = null;

        // Take initial snapshot
        this.takeSnapshot('initial');

        // Start auto-snapshotting if performance.memory is available
        if (this._hasMemoryAPI()) {
            this._startAutoSnapshotting();
        }

        return this;
    }

    /**
     * Stop memory tracking and return report
     * @returns {Object} Final memory report
     */
    stopTracking() {
        this._isTracking = false;
        this._stopTime = Date.now();
        this._stopAutoSnapshotting();

        // Take final snapshot
        this.takeSnapshot('final');

        // Generate leak report
        this.detectLeaks();

        return this.getMemoryUsage();
    }

    /**
     * Take a memory snapshot
     * @param {string} [label='snapshot'] - Label for the snapshot
     * @returns {Object} Snapshot data
     */
    takeSnapshot(label = 'snapshot') {
        const snapshot = {
            label,
            timestamp: Date.now(),
            index: this._snapshots.length,
            memory: this._getMemoryInfo(),
            entityStats: this.getEntityStats(),
            spatialHashStats: { ...this._spatialHashStats },
            trailStats: { ...this._trailStats },
            gcStats: { ...this._gcStats },
            allocationStats: this._getAllocationStats()
        };

        this._snapshots.push(snapshot);
        this._memoryHistory.push({
            timestamp: snapshot.timestamp,
            usedJSHeapSize: snapshot.memory.usedJSHeapSize || 0,
            totalJSHeapSize: snapshot.memory.totalJSHeapSize || 0
        });

        return snapshot;
    }

    /**
     * Compare two snapshots
     * @param {Object} snapshot1 - First snapshot
     * @param {Object} snapshot2 - Second snapshot
     * @returns {Object} Comparison results
     */
    compareSnapshots(snapshot1, snapshot2) {
        if (!snapshot1 || !snapshot2) {
            return { error: 'Invalid snapshots provided' };
        }

        const timeDiff = snapshot2.timestamp - snapshot1.timestamp;
        const memoryDiff = (snapshot2.memory.usedJSHeapSize || 0) -
                          (snapshot1.memory.usedJSHeapSize || 0);
        const growthRate = timeDiff > 0 ? memoryDiff / timeDiff : 0;

        const entityDiff = {};
        const entityTypes = new Set([
            ...Object.keys(snapshot1.entityStats || {}),
            ...Object.keys(snapshot2.entityStats || {})
        ]);

        for (const type of entityTypes) {
            const before = snapshot1.entityStats?.[type]?.active || 0;
            const after = snapshot2.entityStats?.[type]?.active || 0;
            entityDiff[type] = {
                before,
                after,
                change: after - before,
                growthRate: before > 0 ? (after - before) / before : after > 0 ? 1 : 0
            };
        }

        return {
            timeElapsed: timeDiff,
            memoryChange: memoryDiff,
            memoryGrowthRate: growthRate,
            entityChanges: entityDiff,
            spatialHashChange: {
                instances: (snapshot2.spatialHashStats?.instances || 0) -
                          (snapshot1.spatialHashStats?.instances || 0),
                memoryChange: (snapshot2.spatialHashStats?.memoryEstimate || 0) -
                             (snapshot1.spatialHashStats?.memoryEstimate || 0)
            },
            trailChange: {
                instances: (snapshot2.trailStats?.instances || 0) -
                          (snapshot1.trailStats?.instances || 0),
                segmentsChange: (snapshot2.trailStats?.totalSegments || 0) -
                               (snapshot1.trailStats?.totalSegments || 0),
                memoryChange: (snapshot2.trailStats?.memoryEstimate || 0) -
                             (snapshot1.trailStats?.memoryEstimate || 0)
            },
            gcChange: {
                collections: (snapshot2.gcStats?.collections || 0) -
                            (snapshot1.gcStats?.collections || 0),
                pauseTimeChange: (snapshot2.gcStats?.totalPauseTime || 0) -
                                (snapshot1.gcStats?.totalPauseTime || 0)
            },
            isHealthy: this._assessHealth(memoryDiff, growthRate, entityDiff)
        };
    }

    /**
     * Get current memory usage statistics
     * @returns {Object} Memory statistics
     */
    getMemoryUsage() {
        const memory = this._getMemoryInfo();
        const allocationStats = this._getAllocationStats();

        return {
            isTracking: this._isTracking,
            trackingDuration: this._isTracking ? Date.now() - this._startTime :
                             (this._stopTime - this._startTime),
            current: memory,
            peak: this._getPeakMemory(),
            average: this._getAverageMemory(),
            allocations: allocationStats,
            snapshots: this._snapshots.length,
            status: this._getMemoryStatus(memory)
        };
    }

    /**
     * Track a manual allocation
     * @param {string} label - Allocation label
     * @param {number} size - Allocation size in bytes
     */
    trackAllocation(label, size) {
        if (!this._allocations.has(label)) {
            this._allocations.set(label, {
                size: 0,
                timestamp: Date.now(),
                count: 0
            });
        }

        const allocation = this._allocations.get(label);
        allocation.size += size;
        allocation.count++;
        this._totalAllocated += size;
    }

    /**
     * Track a manual deallocation
     * @param {string} label - Deallocation label
     * @param {number} size - Deallocation size in bytes
     */
    trackDeallocation(label, size) {
        this._deallocationCount++;
        this._totalDeallocated += size;

        if (this._allocations.has(label)) {
            const allocation = this._allocations.get(label);
            allocation.size = Math.max(0, allocation.size - size);
        }
    }

    // ========================================================================
    // Entity Tracking Methods
    // ========================================================================

    /**
     * Track entity creation
     * @param {string} entityType - Type of entity (e.g., 'Player', 'TrailEntity')
     * @param {string|number} [entityId] - Optional entity ID
     */
    trackEntityCreation(entityType, entityId = null) {
        // Update creation count
        const currentCount = this._entityCreations.get(entityType) || 0;
        this._entityCreations.set(entityType, currentCount + 1);

        // Track active entity - use counter for entities without IDs
        if (!this._activeEntities.has(entityType)) {
            this._activeEntities.set(entityType, { set: new Set(), count: 0 });
        }

        const activeData = this._activeEntities.get(entityType);
        if (entityId !== null && entityId !== undefined) {
            activeData.set.add(entityId);
        } else {
            // For entities without IDs, just increment counter
            activeData.count++;
        }
    }

    /**
     * Track entity destruction
     * @param {string} entityType - Type of entity
     * @param {string|number} [entityId] - Optional entity ID
     */
    trackEntityDestruction(entityType, entityId = null) {
        // Update destruction count
        const currentCount = this._entityDestructions.get(entityType) || 0;
        this._entityDestructions.set(entityType, currentCount + 1);

        // Remove from active entities
        if (this._activeEntities.has(entityType)) {
            const activeData = this._activeEntities.get(entityType);
            if (entityId !== null && entityId !== undefined) {
                activeData.set.delete(entityId);
            } else {
                // For entities without IDs, decrement counter
                activeData.count = Math.max(0, activeData.count - 1);
            }
        }
    }

    /**
     * Get entity creation/destruction statistics
     * @returns {Object} Entity statistics by type
     */
    getEntityStats() {
        const stats = {};
        const allTypes = new Set([
            ...this._entityCreations.keys(),
            ...this._entityDestructions.keys()
        ]);

        for (const type of allTypes) {
            const created = this._entityCreations.get(type) || 0;
            const destroyed = this._entityDestructions.get(type) || 0;
            const activeData = this._activeEntities.get(type);
            // Calculate active: sum of tracked IDs in set + counter for untracked
            const active = activeData ? (activeData.set.size + activeData.count) : created - destroyed;

            stats[type] = {
                created,
                destroyed,
                active,
                leakRatio: created > 0 ? (created - destroyed) / created : 0
            };
        }

        return stats;
    }

    /**
     * Detect entity leaks
     * @returns {Array<Object>} Array of detected entity leaks
     */
    detectEntityLeaks() {
        const leaks = [];
        const stats = this.getEntityStats();

        for (const [type, data] of Object.entries(stats)) {
            if (data.active > ENTITY_LEAK_THRESHOLD || data.leakRatio > GROWTH_RATE_THRESHOLD) {
                leaks.push({
                    type,
                    activeCount: data.active,
                    createdCount: data.created,
                    destroyedCount: data.destroyed,
                    leakRatio: data.leakRatio,
                    severity: this._getLeakSeverity(data.active, data.leakRatio),
                    recommendation: this._getEntityLeakRecommendation(type, data)
                });
            }
        }

        return leaks;
    }

    // ========================================================================
    // SpatialHash Monitoring Methods
    // ========================================================================

    /**
     * Track SpatialHash usage
     * @param {Object} spatialHash - SpatialHash instance to track
     */
    trackSpatialHashUsage(spatialHash) {
        if (!spatialHash) return;

        this._spatialHashStats.instances++;

        // Get debug info if available
        if (typeof spatialHash.getDebugInfo === 'function') {
            const info = spatialHash.getDebugInfo();
            this._spatialHashStats.totalCells += info.cellCount || 0;
            this._spatialHashStats.totalEntities += info.entityCount || 0;
        }

        // Estimate memory usage
        // Rough estimate: Map entry ~100 bytes, Set entry ~50 bytes
        const estimatedMemory = (this._spatialHashStats.totalCells * 100) +
                               (this._spatialHashStats.totalEntities * 50);
        this._spatialHashStats.memoryEstimate = estimatedMemory;
    }

    /**
     * Get SpatialHash memory statistics
     * @returns {Object} SpatialHash statistics
     */
    getSpatialHashStats() {
        return {
            ...this._spatialHashStats,
            avgEntitiesPerInstance: this._spatialHashStats.instances > 0 ?
                this._spatialHashStats.totalEntities / this._spatialHashStats.instances : 0,
            avgCellsPerInstance: this._spatialHashStats.instances > 0 ?
                this._spatialHashStats.totalCells / this._spatialHashStats.instances : 0
        };
    }

    // ========================================================================
    // Trail Monitoring Methods
    // ========================================================================

    /**
     * Track trail memory usage
     * @param {Object} trailEntity - TrailEntity instance to track
     */
    trackTrailMemory(trailEntity) {
        if (!trailEntity) return;

        this._trailStats.instances++;

        // Get segment count if available
        if (typeof trailEntity.segmentCount === 'function') {
            this._trailStats.totalSegments += trailEntity.segmentCount();
        }

        // Get point count if available
        if (trailEntity.segments && Array.isArray(trailEntity.segments)) {
            this._trailStats.totalPoints += trailEntity.segments.length;
        }

        // Estimate memory usage
        // Each segment: ~200 bytes (coordinates, length, metadata)
        // Each point: ~100 bytes
        const estimatedMemory = (this._trailStats.totalSegments * 200) +
                               (this._trailStats.totalPoints * 100);
        this._trailStats.memoryEstimate = estimatedMemory;
    }

    /**
     * Get trail memory statistics
     * @returns {Object} Trail statistics
     */
    getTrailStats() {
        return {
            ...this._trailStats,
            avgSegmentsPerTrail: this._trailStats.instances > 0 ?
                this._trailStats.totalSegments / this._trailStats.instances : 0,
            avgPointsPerTrail: this._trailStats.instances > 0 ?
                this._trailStats.totalPoints / this._trailStats.instances : 0,
            avgMemoryPerTrail: this._trailStats.instances > 0 ?
                this._trailStats.memoryEstimate / this._trailStats.instances : 0
        };
    }

    // ========================================================================
    // GC Monitoring Methods
    // ========================================================================

    /**
     * Track garbage collection event
     * @param {number} [pauseTime=0] - GC pause time in ms
     */
    trackGC(pauseTime = 0) {
        this._gcStats.collections++;
        this._gcStats.totalPauseTime += pauseTime;
        this._gcStats.lastCollectionTime = Date.now();

        // Track collection intervals
        if (this._gcStats.collectionIntervals.length > 0) {
            const lastTime = this._gcStats.lastCollectionTime - pauseTime;
            const interval = this._gcStats.lastCollectionTime - lastTime;
            this._gcStats.collectionIntervals.push(interval);

            // Keep only last 100 intervals
            if (this._gcStats.collectionIntervals.length > 100) {
                this._gcStats.collectionIntervals.shift();
            }
        }
    }

    /**
     * Get GC statistics
     * @returns {Object} GC statistics
     */
    getGCStats() {
        const intervals = this._gcStats.collectionIntervals;
        const avgInterval = intervals.length > 0 ?
            intervals.reduce((a, b) => a + b, 0) / intervals.length : 0;

        return {
            ...this._gcStats,
            averageInterval: avgInterval,
            averagePauseTime: this._gcStats.collections > 0 ?
                this._gcStats.totalPauseTime / this._gcStats.collections : 0,
            pressure: this.estimateGCPressure()
        };
    }

    /**
     * Estimate GC pressure
     * @returns {string} GC pressure level ('low', 'medium', 'high')
     */
    estimateGCPressure() {
        const memory = this._getMemoryInfo();
        const heapUsed = memory.usedJSHeapSize || 0;
        const heapTotal = memory.totalJSHeapSize || 1;
        const heapRatio = heapUsed / heapTotal;

        // Factor in collection frequency
        const intervals = this._gcStats.collectionIntervals;
        let frequencyFactor = 0;

        if (intervals.length >= 10) {
            const recentIntervals = intervals.slice(-10);
            const avgInterval = recentIntervals.reduce((a, b) => a + b, 0) / recentIntervals.length;
            // High frequency = intervals < 1 second
            frequencyFactor = avgInterval < 1000 ? 0.3 : avgInterval < 5000 ? 0.15 : 0;
        }

        const pressure = Math.min(1, heapRatio + frequencyFactor);

        if (pressure >= GC_PRESSURE_HIGH) return 'high';
        if (pressure >= GC_PRESSURE_MEDIUM) return 'medium';
        return 'low';
    }

    // ========================================================================
    // Leak Detection Methods
    // ========================================================================

    /**
     * Run comprehensive leak detection
     * @returns {Object} Leak detection results
     */
    detectLeaks() {
        const leaks = {
            timestamp: Date.now(),
            entityLeaks: this.detectEntityLeaks(),
            memoryLeaks: this._detectMemoryLeaks(),
            allocationLeaks: this._detectAllocationLeaks(),
            summary: {}
        };

        // Generate summary
        const totalLeaks = leaks.entityLeaks.length + leaks.memoryLeaks.length +
                          leaks.allocationLeaks.length;

        leaks.summary = {
            totalLeaksDetected: totalLeaks,
            hasLeaks: totalLeaks > 0,
            severity: this._getOverallSeverity(leaks),
            recommendations: this._generateLeakRecommendations(leaks)
        };

        this._leakReport = leaks;
        this._detectedLeaks = [
            ...leaks.entityLeaks,
            ...leaks.memoryLeaks,
            ...leaks.allocationLeaks
        ];

        return leaks;
    }

    /**
     * Get detailed leak report
     * @returns {Object} Detailed leak report
     */
    getLeakReport() {
        if (!this._leakReport) {
            this.detectLeaks();
        }
        return this._leakReport;
    }

    /**
     * Get optimization suggestions
     * @returns {Array<string>} Array of optimization suggestions
     */
    suggestOptimizations() {
        const suggestions = [];
        const memory = this.getMemoryUsage();
        const gcStats = this.getGCStats();
        const entityStats = this.getEntityStats();
        const leakReport = this.getLeakReport();

        // Memory-based suggestions
        if (memory.current.usedJSHeapSize > MEMORY_THRESHOLD_WARNING) {
            suggestions.push('High memory usage detected. Consider implementing object pooling.');
        }

        if (memory.peak.usedJSHeapSize > MEMORY_THRESHOLD_CRITICAL) {
            suggestions.push('Peak memory exceeded critical threshold. Review large allocations.');
        }

        // GC-based suggestions
        if (gcStats.pressure === 'high') {
            suggestions.push('High GC pressure. Reduce object creation rate or use object pooling.');
        }

        if (gcStats.averagePauseTime > 50) {
            suggestions.push('Long GC pause times detected. Consider reducing heap size or object count.');
        }

        // Entity-based suggestions
        for (const [type, data] of Object.entries(entityStats)) {
            if (data.leakRatio > 0.5) {
                suggestions.push(`Entity type "${type}" has ${Math.round(data.leakRatio * 100)}% leak ratio. Ensure proper cleanup.`);
            }
        }

        // Allocation-based suggestions
        const allocStats = memory.allocations;
        if (allocStats.totalAllocated > 0 && allocStats.netRemaining > MEMORY_THRESHOLD_WARNING) {
            suggestions.push('Large net allocation detected. Review allocation/deallocation patterns.');
        }

        // Leak-based suggestions
        if (leakReport.summary.hasLeaks) {
            suggestions.push(...leakReport.summary.recommendations);
        }

        // SpatialHash suggestions
        const spatialStats = this.getSpatialHashStats();
        if (spatialStats.avgEntitiesPerInstance > 1000) {
            suggestions.push('SpatialHash instances contain many entities. Consider increasing cell size or using multiple hashes.');
        }

        // Trail suggestions
        const trailStats = this.getTrailStats();
        if (trailStats.avgSegmentsPerTrail > 500) {
            suggestions.push('Trails have many segments. Consider reducing max trail length or point density.');
        }

        if (suggestions.length === 0) {
            suggestions.push('No significant optimization opportunities detected. Memory usage appears healthy.');
        }

        return suggestions;
    }

    // ========================================================================
    // Report Generation Methods
    // ========================================================================

    /**
     * Generate comprehensive memory report
     * @returns {string} Formatted memory report
     */
    generateReport() {
        const memory = this.getMemoryUsage();
        const entityStats = this.getEntityStats();
        const spatialStats = this.getSpatialHashStats();
        const trailStats = this.getTrailStats();
        const gcStats = this.getGCStats();
        const leakReport = this.getLeakReport();
        const suggestions = this.suggestOptimizations();

        let report = '=' .repeat(70) + '\n';
        report += '                    CYBER CYCLES MEMORY PROFILE REPORT\n';
        report += '=' .repeat(70) + '\n\n';

        // Overview
        report += 'OVERVIEW\n';
        report += '-'.repeat(70) + '\n';
        report += `Tracking Duration: ${this._formatDuration(memory.trackingDuration)}\n`;
        report += `Snapshots Taken: ${memory.snapshots}\n`;
        report += `Memory Status: ${memory.status}\n\n`;

        // Memory Usage
        report += 'MEMORY USAGE\n';
        report += '-'.repeat(70) + '\n';
        report += `Current Heap: ${this._formatBytes(memory.current.usedJSHeapSize)}\n`;
        report += `Total Heap: ${this._formatBytes(memory.current.totalJSHeapSize)}\n`;
        report += `Peak Heap: ${this._formatBytes(memory.peak.usedJSHeapSize)}\n`;
        report += `Average Heap: ${this._formatBytes(memory.average.usedJSHeapSize)}\n`;
        if (memory.current.external) {
            report += `External Memory: ${this._formatBytes(memory.current.external)}\n`;
        }
        report += '\n';

        // Entity Statistics
        report += 'ENTITY STATISTICS\n';
        report += '-'.repeat(70) + '\n';
        for (const [type, data] of Object.entries(entityStats)) {
            report += `  ${type}:\n`;
            report += `    Created: ${data.created}, Destroyed: ${data.destroyed}, Active: ${data.active}\n`;
            report += `    Leak Ratio: ${(data.leakRatio * 100).toFixed(1)}%\n`;
        }
        report += '\n';

        // SpatialHash Statistics
        report += 'SPATIALHASH STATISTICS\n';
        report += '-'.repeat(70) + '\n';
        report += `Instances: ${spatialStats.instances}\n`;
        report += `Total Cells: ${spatialStats.totalCells}\n`;
        report += `Total Entities: ${spatialStats.totalEntities}\n`;
        report += `Estimated Memory: ${this._formatBytes(spatialStats.memoryEstimate)}\n`;
        report += `Avg Entities/Instance: ${spatialStats.avgEntitiesPerInstance.toFixed(1)}\n\n`;

        // Trail Statistics
        report += 'TRAIL STATISTICS\n';
        report += '-'.repeat(70) + '\n';
        report += `Instances: ${trailStats.instances}\n`;
        report += `Total Segments: ${trailStats.totalSegments}\n`;
        report += `Total Points: ${trailStats.totalPoints}\n`;
        report += `Estimated Memory: ${this._formatBytes(trailStats.memoryEstimate)}\n`;
        report += `Avg Segments/Trail: ${trailStats.avgSegmentsPerTrail.toFixed(1)}\n\n`;

        // GC Statistics
        report += 'GARBAGE COLLECTION STATISTICS\n';
        report += '-'.repeat(70) + '\n';
        report += `Collections: ${gcStats.collections}\n`;
        report += `Total Pause Time: ${gcStats.totalPauseTime.toFixed(2)}ms\n`;
        report += `Average Pause Time: ${gcStats.averagePauseTime.toFixed(2)}ms\n`;
        report += `GC Pressure: ${gcStats.pressure}\n\n`;

        // Allocation Statistics
        report += 'ALLOCATION STATISTICS\n';
        report += '-'.repeat(70) + '\n';
        report += `Total Allocated: ${this._formatBytes(memory.allocations.totalAllocated)}\n`;
        report += `Total Deallocated: ${this._formatBytes(memory.allocations.totalDeallocated)}\n`;
        report += `Net Remaining: ${this._formatBytes(memory.allocations.netRemaining)}\n\n`;

        // Leak Detection
        report += 'LEAK DETECTION\n';
        report += '-'.repeat(70) + '\n';
        report += `Total Leaks Detected: ${leakReport.summary.totalLeaksDetected}\n`;
        report += `Overall Severity: ${leakReport.summary.severity}\n`;
        if (leakReport.summary.hasLeaks) {
            report += '\nDetected Leaks:\n';
            for (const leak of this._detectedLeaks.slice(0, 10)) {
                report += `  - ${leak.type || leak.label}: ${leak.activeCount || leak.remainingSize} (${leak.severity})\n`;
            }
        }
        report += '\n';

        // Optimization Suggestions
        report += 'OPTIMIZATION SUGGESTIONS\n';
        report += '-'.repeat(70) + '\n';
        for (let i = 0; i < suggestions.length; i++) {
            report += `${i + 1}. ${suggestions[i]}\n`;
        }
        report += '\n';

        report += '=' .repeat(70) + '\n';
        report += '                         END OF MEMORY PROFILE REPORT\n';
        report += '=' .repeat(70) + '\n';

        return report;
    }

    /**
     * Export report to JSON
     * @returns {Object} JSON-serializable report object
     */
    exportToJSON() {
        return {
            version: '1.0.0',
            generated: new Date().toISOString(),
            overview: {
                trackingDuration: this.getMemoryUsage().trackingDuration,
                snapshotsTaken: this._snapshots.length,
                startTime: this._startTime,
                stopTime: this._stopTime
            },
            memory: this.getMemoryUsage(),
            entities: this.getEntityStats(),
            spatialHash: this.getSpatialHashStats(),
            trails: this.getTrailStats(),
            gc: this.getGCStats(),
            leaks: this.getLeakReport(),
            suggestions: this.suggestOptimizations(),
            snapshots: this._snapshots.map(s => ({
                label: s.label,
                timestamp: s.timestamp,
                memory: s.memory,
                entityStats: s.entityStats
            }))
        };
    }

    /**
     * Export report to Markdown format
     * @returns {string} Markdown-formatted report
     */
    exportToMarkdown() {
        const memory = this.getMemoryUsage();
        const entityStats = this.getEntityStats();
        const spatialStats = this.getSpatialHashStats();
        const trailStats = this.getTrailStats();
        const gcStats = this.getGCStats();
        const leakReport = this.getLeakReport();
        const suggestions = this.suggestOptimizations();

        let md = '# Cyber Cycles Memory Profile Report\n\n';
        md += `**Generated:** ${new Date().toISOString()}\n\n`;

        // Overview
        md += '## Overview\n\n';
        md += `| Metric | Value |\n`;
        md += `|--------|-------|\n`;
        md += `| Tracking Duration | ${this._formatDuration(memory.trackingDuration)} |\n`;
        md += `| Snapshots Taken | ${memory.snapshots} |\n`;
        md += `| Memory Status | ${memory.status} |\n\n`;

        // Memory Usage
        md += '## Memory Usage\n\n';
        md += `| Metric | Value |\n`;
        md += `|--------|-------|\n`;
        md += `| Current Heap | ${this._formatBytes(memory.current.usedJSHeapSize)} |\n`;
        md += `| Total Heap | ${this._formatBytes(memory.current.totalJSHeapSize)} |\n`;
        md += `| Peak Heap | ${this._formatBytes(memory.peak.usedJSHeapSize)} |\n`;
        md += `| Average Heap | ${this._formatBytes(memory.average.usedJSHeapSize)} |\n\n`;

        // Entity Statistics
        md += '## Entity Statistics\n\n';
        md += '| Type | Created | Destroyed | Active | Leak Ratio |\n';
        md += '|------|---------|-----------|--------|------------|\n';
        for (const [type, data] of Object.entries(entityStats)) {
            md += `| ${type} | ${data.created} | ${data.destroyed} | ${data.active} | ${(data.leakRatio * 100).toFixed(1)}% |\n`;
        }
        md += '\n';

        // SpatialHash Statistics
        md += '## SpatialHash Statistics\n\n';
        md += `| Metric | Value |\n`;
        md += `|--------|-------|\n`;
        md += `| Instances | ${spatialStats.instances} |\n`;
        md += `| Total Cells | ${spatialStats.totalCells} |\n`;
        md += `| Total Entities | ${spatialStats.totalEntities} |\n`;
        md += `| Estimated Memory | ${this._formatBytes(spatialStats.memoryEstimate)} |\n\n`;

        // Trail Statistics
        md += '## Trail Statistics\n\n';
        md += `| Metric | Value |\n`;
        md += `|--------|-------|\n`;
        md += `| Instances | ${trailStats.instances} |\n`;
        md += `| Total Segments | ${trailStats.totalSegments} |\n`;
        md += `| Total Points | ${trailStats.totalPoints} |\n`;
        md += `| Estimated Memory | ${this._formatBytes(trailStats.memoryEstimate)} |\n\n`;

        // GC Statistics
        md += '## Garbage Collection Statistics\n\n';
        md += `| Metric | Value |\n`;
        md += `|--------|-------|\n`;
        md += `| Collections | ${gcStats.collections} |\n`;
        md += `| Total Pause Time | ${gcStats.totalPauseTime.toFixed(2)}ms |\n`;
        md += `| Average Pause Time | ${gcStats.averagePauseTime.toFixed(2)}ms |\n`;
        md += `| GC Pressure | ${gcStats.pressure} |\n\n`;

        // Leak Detection
        md += '## Leak Detection\n\n';
        md += `**Total Leaks Detected:** ${leakReport.summary.totalLeaksDetected}\n\n`;
        md += `**Overall Severity:** ${leakReport.summary.severity}\n\n`;

        if (leakReport.summary.hasLeaks) {
            md += '### Detected Leaks\n\n';
            md += '| Type/Label | Count/Size | Severity |\n';
            md += '|------------|------------|----------|\n';
            for (const leak of this._detectedLeaks.slice(0, 20)) {
                const count = leak.activeCount || leak.remainingSize || '-';
                md += `| ${leak.type || leak.label} | ${count} | ${leak.severity} |\n`;
            }
            md += '\n';
        }

        // Optimization Suggestions
        md += '## Optimization Suggestions\n\n';
        for (let i = 0; i < suggestions.length; i++) {
            md += `${i + 1}. ${suggestions[i]}\n`;
        }
        md += '\n';

        // Memory Growth Chart (ASCII)
        if (this._memoryHistory.length > 1) {
            md += '## Memory Growth Over Time\n\n';
            md += '```\n';
            md += this._generateASCIIChart();
            md += '\n```\n\n';
        }

        return md;
    }

    // ========================================================================
    // Private Helper Methods
    // ========================================================================

    /**
     * Check if performance.memory API is available
     * @returns {boolean} True if memory API is available
     * @private
     */
    _hasMemoryAPI() {
        return typeof performance !== 'undefined' &&
               performance.memory !== undefined;
    }

    /**
     * Get memory information from browser or fallback
     * @returns {Object} Memory information
     * @private
     */
    _getMemoryInfo() {
        if (this._hasMemoryAPI()) {
            const mem = performance.memory;
            return {
                usedJSHeapSize: mem.usedJSHeapSize,
                totalJSHeapSize: mem.totalJSHeapSize,
                jsHeapSizeLimit: mem.jsHeapSizeLimit,
                external: mem.external || 0
            };
        }

        // Fallback for environments without memory API
        // Estimate based on tracked allocations
        return {
            usedJSHeapSize: this._totalAllocated - this._totalDeallocated,
            totalJSHeapSize: 0,
            jsHeapSizeLimit: 0,
            external: 0,
            estimated: true
        };
    }

    /**
     * Start automatic snapshotting
     * @private
     */
    _startAutoSnapshotting() {
        this._stopAutoSnapshotting();
        this._autoSnapshotTimer = setInterval(() => {
            if (this._isTracking) {
                this.takeSnapshot(`auto_${this._snapshots.length}`);
            }
        }, this._snapshotInterval);
    }

    /**
     * Stop automatic snapshotting
     * @private
     */
    _stopAutoSnapshotting() {
        if (this._autoSnapshotTimer) {
            clearInterval(this._autoSnapshotTimer);
            this._autoSnapshotTimer = null;
        }
    }

    /**
     * Get peak memory from snapshots
     * @returns {Object} Peak memory stats
     * @private
     */
    _getPeakMemory() {
        if (this._snapshots.length === 0) {
            return { usedJSHeapSize: 0, totalJSHeapSize: 0 };
        }

        let peak = { usedJSHeapSize: 0, totalJSHeapSize: 0 };
        for (const snapshot of this._snapshots) {
            if (snapshot.memory.usedJSHeapSize > peak.usedJSHeapSize) {
                peak = { ...snapshot.memory };
            }
        }
        return peak;
    }

    /**
     * Get average memory from snapshots
     * @returns {Object} Average memory stats
     * @private
     */
    _getAverageMemory() {
        if (this._snapshots.length === 0) {
            return { usedJSHeapSize: 0, totalJSHeapSize: 0 };
        }

        const total = this._snapshots.reduce((acc, s) => ({
            usedJSHeapSize: acc.usedJSHeapSize + (s.memory.usedJSHeapSize || 0),
            totalJSHeapSize: acc.totalJSHeapSize + (s.memory.totalJSHeapSize || 0)
        }), { usedJSHeapSize: 0, totalJSHeapSize: 0 });

        return {
            usedJSHeapSize: total.usedJSHeapSize / this._snapshots.length,
            totalJSHeapSize: total.totalJSHeapSize / this._snapshots.length
        };
    }

    /**
     * Get allocation statistics
     * @returns {Object} Allocation statistics
     * @private
     */
    _getAllocationStats() {
        let totalSize = 0;
        let totalCount = 0;

        for (const [label, data] of this._allocations.entries()) {
            totalSize += data.size;
            totalCount += data.count;
        }

        return {
            totalAllocated: this._totalAllocated,
            totalDeallocated: this._totalDeallocated,
            netRemaining: this._totalAllocated - this._totalDeallocated,
            allocationCount: totalCount,
            deallocationCount: this._deallocationCount,
            trackedLabels: this._allocations.size,
            remainingByLabel: Object.fromEntries(this._allocations)
        };
    }

    /**
     * Get memory status string
     * @param {Object} memory - Memory info
     * @returns {string} Status string
     * @private
     */
    _getMemoryStatus(memory) {
        const used = memory.usedJSHeapSize || 0;

        if (used > MEMORY_THRESHOLD_CRITICAL) return 'CRITICAL';
        if (used > MEMORY_THRESHOLD_WARNING) return 'WARNING';
        return 'HEALTHY';
    }

    /**
     * Assess memory health
     * @param {number} memoryDiff - Memory change
     * @param {number} growthRate - Growth rate
     * @param {Object} entityDiff - Entity changes
     * @returns {boolean} True if healthy
     * @private
     */
    _assessHealth(memoryDiff, growthRate, entityDiff) {
        // Check for concerning growth patterns
        if (growthRate > 1024 * 1024) return false; // Growing > 1MB/s

        // Check for entity leaks
        for (const data of Object.values(entityDiff)) {
            if (data.growthRate > GROWTH_RATE_THRESHOLD) return false;
        }

        return true;
    }

    /**
     * Get leak severity
     * @param {number} count - Leak count
     * @param {number} ratio - Leak ratio
     * @returns {string} Severity level
     * @private
     */
    _getLeakSeverity(count, ratio) {
        if (count > 100 || ratio > 0.8) return 'critical';
        if (count > 50 || ratio > 0.5) return 'high';
        if (count > 20 || ratio > 0.3) return 'medium';
        return 'low';
    }

    /**
     * Get entity leak recommendation
     * @param {string} type - Entity type
     * @param {Object} data - Entity data
     * @returns {string} Recommendation
     * @private
     */
    _getEntityLeakRecommendation(type, data) {
        if (type.includes('Trail') || type.includes('trail')) {
            return 'Ensure trails are cleared when players disconnect or reset.';
        }
        if (type.includes('Particle') || type.includes('particle')) {
            return 'Implement particle pooling to reduce allocation overhead.';
        }
        if (type.includes('Effect') || type.includes('effect')) {
            return 'Ensure visual effects are properly disposed after completion.';
        }
        return `Review creation/destruction lifecycle for ${type} entities.`;
    }

    /**
     * Detect memory leaks from snapshots
     * @returns {Array<Object>} Memory leaks
     * @private
     */
    _detectMemoryLeaks() {
        const leaks = [];

        if (this._memoryHistory.length < 5) return leaks;

        // Analyze memory growth trend
        const recentSamples = this._memoryHistory.slice(-10);
        const firstSample = recentSamples[0].usedJSHeapSize;
        const lastSample = recentSamples[recentSamples.length - 1].usedJSHeapSize;
        const growth = lastSample - firstSample;
        const growthRate = growth / recentSamples.length;

        if (growthRate > 1024 * 100) { // Growing > 100KB per sample
            leaks.push({
                type: 'memory_growth',
                growthRate,
                totalGrowth: growth,
                severity: this._getLeakSeverity(growth / 1024, growth / firstSample),
                recommendation: 'Memory is consistently growing. Check for unclosed references or event listeners.'
            });
        }

        return leaks;
    }

    /**
     * Detect allocation leaks
     * @returns {Array<Object>} Allocation leaks
     * @private
     */
    _detectAllocationLeaks() {
        const leaks = [];

        for (const [label, data] of this._allocations.entries()) {
            if (data.size > MEMORY_THRESHOLD_WARNING) {
                leaks.push({
                    label,
                    remainingSize: data.size,
                    allocationCount: data.count,
                    severity: this._getLeakSeverity(data.size / 1024, 0.5),
                    recommendation: `Review allocation pattern for "${label}". Consider pooling or earlier deallocation.`
                });
            }
        }

        return leaks;
    }

    /**
     * Get overall leak severity
     * @param {Object} leaks - Leak report
     * @returns {string} Overall severity
     * @private
     */
    _getOverallSeverity(leaks) {
        const allLeaks = [...leaks.entityLeaks, ...leaks.memoryLeaks, ...leaks.allocationLeaks];

        if (allLeaks.some(l => l.severity === 'critical')) return 'critical';
        if (allLeaks.some(l => l.severity === 'high')) return 'high';
        if (allLeaks.some(l => l.severity === 'medium')) return 'medium';
        if (allLeaks.length > 0) return 'low';
        return 'none';
    }

    /**
     * Generate leak recommendations
     * @param {Object} leaks - Leak report
     * @returns {Array<string>} Recommendations
     * @private
     */
    _generateLeakRecommendations(leaks) {
        const recommendations = [];

        for (const leak of leaks.entityLeaks) {
            recommendations.push(leak.recommendation);
        }

        for (const leak of leaks.memoryLeaks) {
            recommendations.push(leak.recommendation);
        }

        for (const leak of leaks.allocationLeaks) {
            recommendations.push(leak.recommendation);
        }

        return [...new Set(recommendations)]; // Remove duplicates
    }

    /**
     * Format bytes to human-readable string
     * @param {number} bytes - Bytes to format
     * @returns {string} Formatted string
     * @private
     */
    _formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Format milliseconds to human-readable duration
     * @param {number} ms - Milliseconds to format
     * @returns {string} Formatted duration
     * @private
     */
    _formatDuration(ms) {
        if (ms < 1000) return `${ms}ms`;
        const seconds = Math.floor(ms / 1000);
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    }

    /**
     * Generate ASCII chart for memory history
     * @returns {string} ASCII chart
     * @private
     */
    _generateASCIIChart() {
        if (this._memoryHistory.length < 2) return 'Insufficient data for chart';

        const height = 10;
        const width = Math.min(60, this._memoryHistory.length);
        const samples = this._memoryHistory.slice(-width);

        const values = samples.map(s => s.usedJSHeapSize);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min || 1;

        let chart = '';
        for (let row = height - 1; row >= 0; row--) {
            const threshold = min + (row / height) * range;
            let line = '';

            for (let col = 0; col < width; col++) {
                const value = values[col];
                if (value >= threshold) {
                    line += '#';
                } else {
                    line += ' ';
                }
            }

            const label = row === height - 1 ? this._formatBytes(max) :
                         row === 0 ? this._formatBytes(min) : '';
            chart += `${label.padStart(10)} |${line}\n`;
        }

        chart += ' '.repeat(10) + '+' + '-'.repeat(width) + '\n';
        chart += ' '.repeat(10) + ' Time -->\n';

        return chart;
    }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Creates a new MemoryProfiler instance
 * @returns {MemoryProfiler}
 */
export function createMemoryProfiler() {
    return new MemoryProfiler();
}

export default MemoryProfiler;
