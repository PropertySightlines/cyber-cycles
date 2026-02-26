/**
 * BenchmarkRunner - High-performance benchmarking framework for Cyber Cycles
 *
 * Provides comprehensive benchmarking capabilities including:
 * - High-resolution timing with performance.now()
 * - Warmup functionality to stabilize performance
 * - Multiple iterations support (100-10000+)
 * - Statistical analysis (min, max, avg, median, p95, p99)
 * - Markdown and JSON report generation
 *
 * @example
 * const runner = new BenchmarkRunner({ iterations: 1000, warmup: 100 });
 * await runner.run('My Benchmark', () => { /* benchmark code *\/ });
 * console.log(runner.generateReport());
 *
 * @module BenchmarkRunner
 */

// ============================================================================
// Statistics Utilities
// ============================================================================

/**
 * Calculate percentile from sorted array
 * @param {number[]} sorted - Sorted array of values
 * @param {number} p - Percentile (0-100)
 * @returns {number} Percentile value
 */
function percentile(sorted, p) {
    if (sorted.length === 0) return 0;
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    if (lower === upper) return sorted[lower];
    const weight = index - lower;
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

/**
 * Calculate statistics from array of values
 * @param {number[]} values - Array of timing values
 * @returns {Object} Statistics object
 */
function calculateStats(values) {
    if (values.length === 0) {
        return {
            count: 0,
            min: 0,
            max: 0,
            avg: 0,
            median: 0,
            p95: 0,
            p99: 0,
            stddev: 0,
            variance: 0
        };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const count = sorted.length;
    const sum = sorted.reduce((a, b) => a + b, 0);
    const avg = sum / count;
    const min = sorted[0];
    const max = sorted[count - 1];
    const median = percentile(sorted, 50);
    const p95 = percentile(sorted, 95);
    const p99 = percentile(sorted, 99);

    // Calculate variance and standard deviation
    const squaredDiffs = sorted.map(v => Math.pow(v - avg, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / count;
    const stddev = Math.sqrt(variance);

    return {
        count,
        min,
        max,
        avg,
        median,
        p95,
        p99,
        stddev,
        variance
    };
}

// ============================================================================
// BenchmarkResult Class
// ============================================================================

/**
 * BenchmarkResult - Stores results for a single benchmark
 */
export class BenchmarkResult {
    /**
     * Create a BenchmarkResult
     * @param {string} name - Benchmark name
     * @param {string} description - Benchmark description
     * @param {number} iterations - Number of iterations
     * @param {number} warmupIterations - Number of warmup iterations
     */
    constructor(name, description, iterations, warmupIterations) {
        this.name = name;
        this.description = description;
        this.iterations = iterations;
        this.warmupIterations = warmupIterations;
        this.samples = [];
        this.warmupSamples = [];
        this.startTime = 0;
        this.endTime = 0;
        this.error = null;
    }

    /**
     * Add a sample
     * @param {number} timeMs - Time in milliseconds
     */
    addSample(timeMs) {
        this.samples.push(timeMs);
    }

    /**
     * Add a warmup sample
     * @param {number} timeMs - Time in milliseconds
     */
    addWarmupSample(timeMs) {
        this.warmupSamples.push(timeMs);
    }

    /**
     * Get statistics for main samples
     * @returns {Object} Statistics object
     */
    getStats() {
        return calculateStats(this.samples);
    }

    /**
     * Get warmup statistics
     * @returns {Object} Statistics object
     */
    getWarmupStats() {
        return calculateStats(this.warmupSamples);
    }

    /**
     * Get total duration
     * @returns {number} Duration in milliseconds
     */
    getTotalDuration() {
        return this.endTime - this.startTime;
    }

    /**
     * Check if benchmark has error
     * @returns {boolean} True if error occurred
     */
    hasError() {
        return this.error !== null;
    }

    /**
     * Export to JSON-serializable object
     * @returns {Object} JSON object
     */
    toJSON() {
        return {
            name: this.name,
            description: this.description,
            iterations: this.iterations,
            warmupIterations: this.warmupIterations,
            samples: this.samples,
            warmupSamples: this.warmupSamples,
            stats: this.getStats(),
            warmupStats: this.getWarmupStats(),
            totalDuration: this.getTotalDuration(),
            startTime: this.startTime,
            endTime: this.endTime,
            error: this.error
        };
    }

    /**
     * Import from JSON object
     * @param {Object} json - JSON object
     * @returns {BenchmarkResult} New instance
     */
    static fromJSON(json) {
        const result = new BenchmarkResult(
            json.name,
            json.description,
            json.iterations,
            json.warmupIterations
        );
        result.samples = json.samples;
        result.warmupSamples = json.warmupSamples;
        result.startTime = json.startTime;
        result.endTime = json.endTime;
        result.error = json.error;
        return result;
    }
}

// ============================================================================
// BenchmarkRunner Class
// ============================================================================

/**
 * BenchmarkRunner - Main benchmark orchestration class
 */
export class BenchmarkRunner {
    /**
     * Create a BenchmarkRunner
     * @param {Object} options - Runner options
     * @param {number} [options.iterations=1000] - Default iterations per benchmark
     * @param {number} [options.warmup=100] - Default warmup iterations
     * @param {boolean} [options.verbose=true] - Enable verbose output
     * @param {number} [options.minSamples=10] - Minimum samples for valid results
     */
    constructor(options = {}) {
        this.options = {
            iterations: options.iterations ?? 1000,
            warmup: options.warmup ?? 100,
            verbose: options.verbose ?? true,
            minSamples: options.minSamples ?? 10
        };

        /** @type {BenchmarkResult[]} */
        this.results = [];

        /** @type {string} */
        this.suiteName = 'Cyber Cycles Benchmark Suite';

        /** @type {Object} */
        this.environment = {
            platform: typeof navigator !== 'undefined' ? navigator.platform : 'Node.js',
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js',
            memory: typeof process !== 'undefined' && process.memoryUsage ? process.memoryUsage() : null,
            cpuCores: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : null,
            timestamp: new Date().toISOString()
        };

        this.startTime = 0;
        this.endTime = 0;
    }

    /**
     * Set suite name
     * @param {string} name - Suite name
     */
    setSuiteName(name) {
        this.suiteName = name;
    }

    /**
     * Run a single benchmark
     * @param {string} name - Benchmark name
     * @param {Function} fn - Benchmark function (can be sync or async)
     * @param {Object} [options] - Override options
     * @param {number} [options.iterations] - Iterations count
     * @param {number} [options.warmup] - Warmup iterations
     * @param {string} [options.description] - Benchmark description
     * @returns {Promise<BenchmarkResult>} Benchmark result
     */
    async run(name, fn, options = {}) {
        const iterations = options.iterations ?? this.options.iterations;
        const warmup = options.warmup ?? this.options.warmup;
        const description = options.description || '';

        const result = new BenchmarkResult(name, description, iterations, warmup);

        if (this.options.verbose) {
            console.log(`\n[Benchmark] ${name}`);
            console.log(`  Iterations: ${iterations}, Warmup: ${warmup}`);
        }

        // Warmup phase
        if (warmup > 0) {
            if (this.options.verbose) {
                console.log(`  Running warmup (${warmup} iterations)...`);
            }

            for (let i = 0; i < warmup; i++) {
                const start = performance.now();
                try {
                    if (fn.length > 0) {
                        // Function expects iteration index
                        await fn(i);
                    } else {
                        await fn();
                    }
                } catch (err) {
                    result.error = `Warmup error at iteration ${i}: ${err.message}`;
                    break;
                }
                const end = performance.now();
                result.addWarmupSample(end - start);
            }

            if (this.options.verbose && result.warmupSamples.length > 0) {
                const warmupStats = result.getWarmupStats();
                console.log(`  Warmup complete. Avg: ${warmupStats.avg.toFixed(3)}ms`);
            }
        }

        // Check for warmup errors
        if (result.hasError()) {
            this.results.push(result);
            return result;
        }

        // Measurement phase
        result.startTime = performance.now();
        if (this.options.verbose) {
            console.log(`  Running benchmark (${iterations} iterations)...`);
        }

        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            try {
                if (fn.length > 0) {
                    // Function expects iteration index
                    await fn(i);
                } else {
                    await fn();
                }
            } catch (err) {
                result.error = `Error at iteration ${i}: ${err.message}`;
                break;
            }
            const end = performance.now();
            result.addSample(end - start);
        }

        result.endTime = performance.now();

        // Calculate and display results
        const stats = result.getStats();
        if (this.options.verbose) {
            console.log(`  Complete!`);
            console.log(`    Min: ${stats.min.toFixed(3)}ms`);
            console.log(`    Max: ${stats.max.toFixed(3)}ms`);
            console.log(`    Avg: ${stats.avg.toFixed(3)}ms`);
            console.log(`    Median: ${stats.median.toFixed(3)}ms`);
            console.log(`    P95: ${stats.p95.toFixed(3)}ms`);
            console.log(`    P99: ${stats.p99.toFixed(3)}ms`);
            if (stats.stddev > 0) {
                console.log(`    StdDev: ${stats.stddev.toFixed(3)}ms`);
            }
        }

        this.results.push(result);
        return result;
    }

    /**
     * Run multiple benchmarks in sequence
     * @param {Array<{name: string, fn: Function, options?: Object}>} benchmarks - Array of benchmark definitions
     * @returns {Promise<BenchmarkResult[]>} Array of results
     */
    async runAll(benchmarks) {
        this.startTime = performance.now();
        const results = [];

        console.log(`\n${'='.repeat(60)}`);
        console.log(`Starting: ${this.suiteName}`);
        console.log(`Timestamp: ${this.environment.timestamp}`);
        console.log('='.repeat(60));

        for (const benchmark of benchmarks) {
            const result = await this.run(benchmark.name, benchmark.fn, benchmark.options);
            results.push(result);
        }

        this.endTime = performance.now();

        console.log(`\n${'='.repeat(60)}`);
        console.log(`Suite complete! Total time: ${(this.endTime - this.startTime).toFixed(2)}ms`);
        console.log('='.repeat(60));

        return results;
    }

    /**
     * Generate Markdown report
     * @param {Object} options - Report options
     * @param {boolean} [options.includeSamples=false] - Include raw sample data
     * @param {boolean} [options.includeWarmup=false] - Include warmup statistics
     * @returns {string} Markdown report
     */
    generateReport(options = {}) {
        const { includeSamples = false, includeWarmup = false } = options;
        const now = new Date().toISOString();

        let report = `# ${this.suiteName} - Benchmark Report\n\n`;
        report += `**Generated:** ${now}\n\n`;

        // Environment section
        report += `## Test Environment\n\n`;
        report += `| Property | Value |\n`;
        report += `|----------|-------|\n`;
        report += `| Platform | ${this.environment.platform} |\n`;
        if (this.environment.cpuCores) {
            report += `| CPU Cores | ${this.environment.cpuCores} |\n`;
        }
        report += `| Timestamp | ${this.environment.timestamp} |\n`;
        if (this.endTime > 0 && this.startTime > 0) {
            report += `| Total Duration | ${(this.endTime - this.startTime).toFixed(2)}ms |\n`;
        }
        report += `\n`;

        // Summary table
        report += `## Summary\n\n`;
        report += `| Benchmark | Iterations | Min (ms) | Max (ms) | Avg (ms) | Median (ms) | P95 (ms) | P99 (ms) |\n`;
        report += `|-----------|------------|----------|----------|----------|-------------|----------|----------|\n`;

        for (const result of this.results) {
            const stats = result.getStats();
            const name = result.hasError() ? `${result.name} (ERROR)` : result.name;
            report += `| ${name} | ${result.iterations} | ${stats.min.toFixed(3)} | ${stats.max.toFixed(3)} | ${stats.avg.toFixed(3)} | ${stats.median.toFixed(3)} | ${stats.p95.toFixed(3)} | ${stats.p99.toFixed(3)} |\n`;
        }
        report += `\n`;

        // Detailed results
        report += `## Detailed Results\n\n`;

        for (const result of this.results) {
            report += `### ${result.name}\n\n`;

            if (result.description) {
                report += `${result.description}\n\n`;
            }

            if (result.hasError()) {
                report += `**ERROR:** ${result.error}\n\n`;
                continue;
            }

            const stats = result.getStats();

            report += `**Configuration:**\n`;
            report += `- Iterations: ${result.iterations}\n`;
            report += `- Warmup: ${result.warmupIterations}\n`;
            report += `- Total Duration: ${result.getTotalDuration().toFixed(2)}ms\n\n`;

            report += `**Statistics:**\n`;
            report += `| Metric | Value |\n`;
            report += `|--------|-------|\n`;
            report += `| Count | ${stats.count} |\n`;
            report += `| Min | ${stats.min.toFixed(3)} ms |\n`;
            report += `| Max | ${stats.max.toFixed(3)} ms |\n`;
            report += `| Average | ${stats.avg.toFixed(3)} ms |\n`;
            report += `| Median | ${stats.median.toFixed(3)} ms |\n`;
            report += `| P95 | ${stats.p95.toFixed(3)} ms |\n`;
            report += `| P99 | ${stats.p99.toFixed(3)} ms |\n`;
            report += `| Std Dev | ${stats.stddev.toFixed(3)} ms |\n`;
            report += `| Variance | ${stats.variance.toFixed(3)} |\n\n`;

            if (includeWarmup && result.warmupSamples.length > 0) {
                const warmupStats = result.getWarmupStats();
                report += `**Warmup Statistics:**\n`;
                report += `| Metric | Value |\n`;
                report += `|--------|-------|\n`;
                report += `| Count | ${warmupStats.count} |\n`;
                report += `| Average | ${warmupStats.avg.toFixed(3)} ms |\n`;
                report += `| Min | ${warmupStats.min.toFixed(3)} ms |\n`;
                report += `| Max | ${warmupStats.max.toFixed(3)} ms |\n\n`;
            }

            // ASCII histogram for distribution
            report += `**Distribution (ASCII Histogram):**\n\n`;
            report += this._generateHistogram(stats, result.samples);
            report += '\n\n';
        }

        // Recommendations section
        report += `## Recommendations\n\n`;
        report += this._generateRecommendations();

        return report;
    }

    /**
     * Generate ASCII histogram
     * @param {Object} stats - Statistics object
     * @param {number[]} samples - Sample values
     * @returns {string} ASCII histogram
     * @private
     */
    _generateHistogram(stats, samples) {
        if (samples.length < 10) {
            return 'Insufficient samples for histogram.\n';
        }

        const numBars = 10;
        const barWidth = 40;
        const min = stats.min;
        const max = stats.max;
        const range = max - min || 1;
        const bucketSize = range / numBars;

        // Create buckets
        const buckets = new Array(numBars).fill(0);
        for (const sample of samples) {
            const bucketIndex = Math.min(
                numBars - 1,
                Math.floor((sample - min) / bucketSize)
            );
            buckets[bucketIndex]++;
        }

        const maxCount = Math.max(...buckets);
        let histogram = '```\n';
        histogram += `Range: [${min.toFixed(2)}, ${max.toFixed(2)}] ms\n\n`;

        for (let i = 0; i < numBars; i++) {
            const bucketStart = min + i * bucketSize;
            const bucketEnd = min + (i + 1) * bucketSize;
            const count = buckets[i];
            const barLength = maxCount > 0 ? Math.round((count / maxCount) * barWidth) : 0;
            const bar = '#'.repeat(barLength);

            histogram += `${bucketStart.toFixed(2)} - ${bucketEnd.toFixed(2)} | ${bar} (${count})\n`;
        }

        histogram += '```\n';
        return histogram;
    }

    /**
     * Generate recommendations based on results
     * @returns {string} Recommendations text
     * @private
     */
    _generateRecommendations() {
        let recommendations = '';

        for (const result of this.results) {
            if (result.hasError()) continue;

            const stats = result.getStats();
            const name = result.name.toLowerCase();

            // Check for high variance
            if (stats.stddev > stats.avg * 0.5) {
                recommendations += `- **${result.name}**: High variance detected (stddev > 50% of avg). Consider increasing warmup iterations or checking for GC interference.\n`;
            }

            // Check for outliers
            if (stats.max > stats.p99 * 2) {
                recommendations += `- **${result.name}**: Significant outliers detected (max > 2x P99). May indicate occasional performance spikes.\n`;
            }

            // Physics-specific recommendations
            if (name.includes('spatialhash') || name.includes('collision')) {
                if (stats.avg > 1) {
                    recommendations += `- **${result.name}**: Consider optimizing spatial partitioning or reducing entity count for better performance.\n`;
                }
            }

            // Rendering-specific recommendations
            if (name.includes('trail') || name.includes('render')) {
                if (stats.avg > 0.5) {
                    recommendations += `- **${result.name}**: Render operations taking >0.5ms. Consider batching or reducing geometry complexity.\n`;
                }
            }
        }

        if (recommendations === '') {
            recommendations = 'All benchmarks are performing within expected parameters.\n';
        }

        return recommendations;
    }

    /**
     * Export results to JSON
     * @returns {Object} JSON-serializable results
     */
    exportJSON() {
        return {
            suiteName: this.suiteName,
            environment: this.environment,
            startTime: this.startTime,
            endTime: this.endTime,
            totalDuration: this.endTime - this.startTime,
            results: this.results.map(r => r.toJSON())
        };
    }

    /**
     * Save results to file (Node.js only)
     * @param {string} filePath - Output file path
     * @param {string} format - Output format ('json' or 'md')
     */
    async saveToFile(filePath, format = 'json') {
        if (typeof process === 'undefined' || !process.versions?.node) {
            throw new Error('saveToFile is only available in Node.js environment');
        }

        const { writeFileSync, mkdirSync, existsSync } = await import('fs');
        const { dirname } = await import('path');

        // Ensure directory exists
        const dir = dirname(filePath);
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }

        let content;
        if (format === 'json') {
            content = JSON.stringify(this.exportJSON(), null, 2);
        } else if (format === 'md') {
            content = this.generateReport();
        } else {
            throw new Error(`Unknown format: ${format}`);
        }

        writeFileSync(filePath, content, 'utf-8');
        console.log(`Results saved to: ${filePath}`);
    }

    /**
     * Get results summary
     * @returns {Object} Summary object
     */
    getSummary() {
        const summary = {
            suiteName: this.suiteName,
            totalBenchmarks: this.results.length,
            successfulBenchmarks: this.results.filter(r => !r.hasError()).length,
            failedBenchmarks: this.results.filter(r => r.hasError()).length,
            totalDuration: this.endTime - this.startTime,
            benchmarks: []
        };

        for (const result of this.results) {
            const stats = result.getStats();
            summary.benchmarks.push({
                name: result.name,
                hasError: result.hasError(),
                avg: stats.avg,
                median: stats.median,
                p95: stats.p95,
                p99: stats.p99
            });
        }

        return summary;
    }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a benchmark runner with default options
 * @param {Object} options - Runner options
 * @returns {BenchmarkRunner} New runner instance
 */
export function createRunner(options = {}) {
    return new BenchmarkRunner(options);
}

/**
 * Run a quick benchmark (single iteration test)
 * @param {string} name - Benchmark name
 * @param {Function} fn - Benchmark function
 * @returns {Promise<number>} Time in milliseconds
 */
export async function quickBenchmark(name, fn) {
    const start = performance.now();
    await fn();
    const end = performance.now();
    console.log(`[Quick] ${name}: ${(end - start).toFixed(3)}ms`);
    return end - start;
}

// Default export
export default BenchmarkRunner;
