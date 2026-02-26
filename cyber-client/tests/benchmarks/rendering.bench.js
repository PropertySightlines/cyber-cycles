/**
 * Rendering Benchmarks for Cyber Cycles
 *
 * Comprehensive performance benchmarks for rendering-related systems:
 * - TrailEntity: Point addition, render data generation, mesh updates
 * - PlayerEntity: Component updates, render operations
 * - Frame time simulation: Simulating render loops at various entity counts
 *
 * Target: 15+ rendering benchmarks
 *
 * @module RenderingBenchmarks
 */

import { BenchmarkRunner, createRunner } from './benchmark-runner.js';
import { TrailEntity } from '../../src/game/TrailEntity.js';
import { PlayerEntity, PlayerState } from '../../src/game/PlayerEntity.js';
import { SpatialHash } from '../../src/core/SpatialHash.js';

// ============================================================================
// Test Data Generators
// ============================================================================

/**
 * Generate random position within arena
 * @param {number} arenaSize - Arena half-size
 * @returns {{x: number, z: number}}
 */
function randomPosition(arenaSize = 200) {
    return {
        x: (Math.random() - 0.5) * 2 * arenaSize,
        z: (Math.random() - 0.5) * 2 * arenaSize
    };
}

/**
 * Generate trail points along a path
 * @param {number} count - Number of points
 * @param {number} spacing - Distance between points
 * @returns {Array<{x: number, z: number}>}
 */
function generateTrailPoints(count, spacing = 2) {
    const points = [];
    let x = 0, z = 0;
    let angle = 0;

    for (let i = 0; i < count; i++) {
        points.push({ x, z });
        x += Math.cos(angle) * spacing;
        z += Math.sin(angle) * spacing;
        angle += (Math.random() - 0.5) * 0.5; // Random turns
    }

    return points;
}

// ============================================================================
// TrailEntity Benchmarks
// ============================================================================

/**
 * Benchmark TrailEntity point addition
 */
export async function benchmarkTrailEntityAddPoint(runner) {
    console.log('\n--- TrailEntity: Add Point Benchmarks ---\n');

    // Add single point
    await runner.run('TrailEntity: addPoint (single)', async () => {
        const trail = new TrailEntity('player1');
        trail.addPoint(0, 0);
        trail.addPoint(10, 0);
        trail.addPoint(20, 5);
    }, { iterations: 10000, description: 'Add individual trail points' });

    // Add 10 points
    await runner.run('TrailEntity: addPoint (10 points)', async () => {
        const trail = new TrailEntity('player1');
        for (let i = 0; i < 10; i++) {
            trail.addPoint(i * 10, Math.sin(i) * 5);
        }
    }, { iterations: 5000, description: 'Add 10 trail points' });

    // Add 100 points
    await runner.run('TrailEntity: addPoint (100 points)', async () => {
        const trail = new TrailEntity('player1');
        for (let i = 0; i < 100; i++) {
            trail.addPoint(i * 5, Math.sin(i * 0.1) * 20);
        }
    }, { iterations: 1000, description: 'Add 100 trail points' });

    // Add 1000 points (with trimming)
    await runner.run('TrailEntity: addPoint (1000 points, maxLength=200)', async () => {
        const trail = new TrailEntity('player1', { maxLength: 200 });
        for (let i = 0; i < 1000; i++) {
            trail.addPoint(i * 2, Math.sin(i * 0.05) * 50);
        }
    }, { iterations: 200, description: 'Add 1000 points with automatic trimming' });

    // Add points with min spacing rejection
    await runner.run('TrailEntity: addPoint (with spacing check)', async (i) => {
        const trail = new TrailEntity('player1', { minPointSpacing: 1.0 });
        trail.addPoint(0, 0);
        // Try to add point too close (should be rejected)
        trail.addPoint(0.5, 0);
        // Add valid point
        trail.addPoint(2, 0);
    }, { iterations: 5000, description: 'Add points with minimum spacing validation' });
}

/**
 * Benchmark TrailEntity getRenderData
 */
export async function benchmarkTrailEntityRenderData(runner) {
    console.log('\n--- TrailEntity: Render Data Benchmarks ---\n');

    // Get render data (10 segments)
    await runner.run('TrailEntity: getRenderData (10 segments)', async () => {
        const trail = new TrailEntity('player1');
        for (let i = 0; i < 11; i++) {
            trail.addPoint(i * 10, Math.sin(i) * 5);
        }
        trail.getRenderData();
    }, { iterations: 2000, description: 'Generate render data for 10 segments' });

    // Get render data (50 segments)
    await runner.run('TrailEntity: getRenderData (50 segments)', async () => {
        const trail = new TrailEntity('player1');
        for (let i = 0; i < 51; i++) {
            trail.addPoint(i * 5, Math.sin(i * 0.2) * 20);
        }
        trail.getRenderData();
    }, { iterations: 500, description: 'Generate render data for 50 segments' });

    // Get render data (100 segments)
    await runner.run('TrailEntity: getRenderData (100 segments)', async () => {
        const trail = new TrailEntity('player1');
        for (let i = 0; i < 101; i++) {
            trail.addPoint(i * 3, Math.sin(i * 0.1) * 30);
        }
        trail.getRenderData();
    }, { iterations: 200, description: 'Generate render data for 100 segments' });

    // Get render data (200 segments - max typical)
    await runner.run('TrailEntity: getRenderData (200 segments)', async () => {
        const trail = new TrailEntity('player1', { maxLength: 400 });
        for (let i = 0; i < 201; i++) {
            trail.addPoint(i * 2, Math.sin(i * 0.05) * 50);
        }
        trail.getRenderData();
    }, { iterations: 100, description: 'Generate render data for 200 segments' });

    // Get render data repeatedly (simulating frames)
    await runner.run('TrailEntity: getRenderData (repeated, 50 segments)', async () => {
        const trail = new TrailEntity('player1');
        for (let i = 0; i < 51; i++) {
            trail.addPoint(i * 5, Math.sin(i * 0.2) * 20);
        }
        // Call multiple times to simulate multiple frames
        for (let f = 0; f < 5; f++) {
            trail.getRenderData();
        }
    }, { iterations: 500, description: 'Repeated render data calls' });
}

/**
 * Benchmark TrailEntity segment operations
 */
export async function benchmarkTrailEntitySegments(runner) {
    console.log('\n--- TrailEntity: Segment Operations Benchmarks ---\n');

    // Get segments
    await runner.run('TrailEntity: getSegments (100 points)', async () => {
        const trail = new TrailEntity('player1');
        for (let i = 0; i < 101; i++) {
            trail.addPoint(i * 3, Math.sin(i * 0.1) * 30);
        }
        trail.getSegments();
    }, { iterations: 2000, description: 'Get cached segments' });

    // Get specific segment
    await runner.run('TrailEntity: getSegment (by index)', async () => {
        const trail = new TrailEntity('player1');
        for (let i = 0; i < 101; i++) {
            trail.addPoint(i * 3, Math.sin(i * 0.1) * 30);
        }
        trail.getSegment(50);
    }, { iterations: 5000, description: 'Get specific segment by index' });

    // Get segment count
    await runner.run('TrailEntity: segmentCount', async () => {
        const trail = new TrailEntity('player1');
        for (let i = 0; i < 101; i++) {
            trail.addPoint(i * 3, Math.sin(i * 0.1) * 30);
        }
        trail.segmentCount();
    }, { iterations: 10000, description: 'Get segment count' });

    // Get trail length
    await runner.run('TrailEntity: getLength', async () => {
        const trail = new TrailEntity('player1');
        for (let i = 0; i < 101; i++) {
            trail.addPoint(i * 3, Math.sin(i * 0.1) * 30);
        }
        trail.getLength();
    }, { iterations: 5000, description: 'Calculate total trail length' });

    // Trim trail
    await runner.run('TrailEntity: trimToLength', async () => {
        const trail = new TrailEntity('player1', { maxLength: 500 });
        for (let i = 0; i < 201; i++) {
            trail.addPoint(i * 3, Math.sin(i * 0.1) * 30);
        }
        trail.trimToLength(300);
    }, { iterations: 1000, description: 'Trim trail to max length' });

    // Clear trail
    await runner.run('TrailEntity: clear', async () => {
        const trail = new TrailEntity('player1');
        for (let i = 0; i < 101; i++) {
            trail.addPoint(i * 3, Math.sin(i * 0.1) * 30);
        }
        trail.clear();
    }, { iterations: 2000, description: 'Clear all trail points' });
}

/**
 * Benchmark TrailEntity collision operations
 */
export async function benchmarkTrailEntityCollision(runner) {
    console.log('\n--- TrailEntity: Collision Operations Benchmarks ---\n');

    // Get collision segments
    await runner.run('TrailEntity: getCollisionSegments', async () => {
        const trail = new TrailEntity('player1');
        for (let i = 0; i < 101; i++) {
            trail.addPoint(i * 3, Math.sin(i * 0.1) * 30);
        }
        trail.getCollisionSegments();
    }, { iterations: 2000, description: 'Get segments for collision detection' });

    // Check point near trail
    await runner.run('TrailEntity: isPointNearTrail (100 segments)', async () => {
        const trail = new TrailEntity('player1');
        for (let i = 0; i < 101; i++) {
            trail.addPoint(i * 3, Math.sin(i * 0.1) * 30);
        }
        trail.isPointNearTrail(50, 10, 5.0);
    }, { iterations: 1000, description: 'Check if point is near trail' });

    // Get closest segment
    await runner.run('TrailEntity: getClosestSegment (100 segments)', async () => {
        const trail = new TrailEntity('player1');
        for (let i = 0; i < 101; i++) {
            trail.addPoint(i * 3, Math.sin(i * 0.1) * 30);
        }
        trail.getClosestSegment(50, 10);
    }, { iterations: 1000, description: 'Find closest segment to point' });
}

/**
 * Benchmark TrailEntity spatial hash operations
 */
export async function benchmarkTrailEntitySpatialHash(runner) {
    console.log('\n--- TrailEntity: SpatialHash Operations Benchmarks ---\n');

    // Update spatial hash
    await runner.run('TrailEntity: updateSpatialHash (100 points)', async () => {
        const trail = new TrailEntity('player1');
        for (let i = 0; i < 101; i++) {
            trail.addPoint(i * 3, Math.sin(i * 0.1) * 30);
        }
        trail.updateSpatialHash();
    }, { iterations: 500, description: 'Build spatial hash index' });

    // Get nearby segments (with spatial hash)
    await runner.run('TrailEntity: getNearbySegments (with spatial hash)', async () => {
        const trail = new TrailEntity('player1');
        for (let i = 0; i < 101; i++) {
            trail.addPoint(i * 3, Math.sin(i * 0.1) * 30);
        }
        trail.updateSpatialHash();
        trail.getNearbySegments(null, 50, 10, 20);
    }, { iterations: 500, description: 'Query nearby segments using spatial hash' });

    // Remove from spatial hash
    await runner.run('TrailEntity: removeFromSpatialHash', async () => {
        const trail = new TrailEntity('player1');
        for (let i = 0; i < 101; i++) {
            trail.addPoint(i * 3, Math.sin(i * 0.1) * 30);
        }
        trail.updateSpatialHash();
        trail.removeFromSpatialHash();
    }, { iterations: 500, description: 'Remove trail from spatial hash' });
}

// ============================================================================
// PlayerEntity Benchmarks
// ============================================================================

/**
 * Benchmark PlayerEntity creation and lifecycle
 */
export async function benchmarkPlayerEntityLifecycle(runner) {
    console.log('\n--- PlayerEntity: Lifecycle Benchmarks ---\n');

    // Create player entity
    await runner.run('PlayerEntity: Create', async () => {
        new PlayerEntity('player1', 0, 0, {
            color: 0xff0000,
            speed: 40
        });
    }, { iterations: 5000, description: 'Create new PlayerEntity' });

    // Create multiple players
    await runner.run('PlayerEntity: Create 10 players', async () => {
        const players = [];
        for (let i = 0; i < 10; i++) {
            players.push(new PlayerEntity(`player${i}`, i * 10, 0, {
                color: 0xff0000 + i * 0x100000
            }));
        }
    }, { iterations: 1000, description: 'Create 10 PlayerEntities' });

    // Create 100 players
    await runner.run('PlayerEntity: Create 100 players', async () => {
        const players = [];
        for (let i = 0; i < 100; i++) {
            players.push(new PlayerEntity(`player${i}`, i * 5, 0));
        }
    }, { iterations: 200, description: 'Create 100 PlayerEntities' });
}

/**
 * Benchmark PlayerEntity update operations
 */
export async function benchmarkPlayerEntityUpdate(runner) {
    console.log('\n--- PlayerEntity: Update Benchmarks ---\n');

    // Update physics component
    await runner.run('PlayerEntity: physics.update', async () => {
        const player = new PlayerEntity('player1', 0, 0, { speed: 40 });
        player.physics.update(0.016);
    }, { iterations: 10000, description: 'Update physics component' });

    // Update rubber component
    await runner.run('PlayerEntity: rubber.update', async () => {
        const player = new PlayerEntity('player1', 50, 50);
        const segments = [];
        for (let i = 0; i < 50; i++) {
            segments.push({
                x1: i * 5, z1: 0, x2: i * 5 + 3, z2: 5, pid: 'other'
            });
        }
        player.rubber.update(0.016, segments, { x: 50, z: 50 });
    }, { iterations: 2000, description: 'Update rubber component' });

    // Update state component
    await runner.run('PlayerEntity: state.update', async () => {
        const player = new PlayerEntity('player1', 0, 0);
        player.state.update(0.016);
    }, { iterations: 10000, description: 'Update state component' });

    // Full player update (all components)
    await runner.run('PlayerEntity: Full update', async () => {
        const player = new PlayerEntity('player1', 50, 50, { speed: 40 });
        const segments = [];
        for (let i = 0; i < 20; i++) {
            segments.push({
                x1: i * 10, z1: 0, x2: i * 10 + 5, z2: 10, pid: 'other'
            });
        }
        player.physics.update(0.016);
        player.rubber.update(0.016, segments, { x: 50, z: 50 });
        player.state.update(0.016);
    }, { iterations: 2000, description: 'Full player update (all components)' });
}

/**
 * Benchmark PlayerEntity render component operations
 */
export async function benchmarkPlayerEntityRender(runner) {
    console.log('\n--- PlayerEntity: Render Component Benchmarks ---\n');

    // Add trail point
    await runner.run('PlayerEntity: render.addTrailPoint', async (i) => {
        const player = new PlayerEntity('player1', 0, 0);
        player.render.addTrailPoint(i * 5, Math.sin(i) * 10);
    }, { iterations: 10000, description: 'Add trail point to render component' });

    // Update trail
    await runner.run('PlayerEntity: render.updateTrail', async (i) => {
        const player = new PlayerEntity('player1', 0, 0);
        player.render.updateTrail(i * 2, Math.sin(i * 0.1) * 20);
    }, { iterations: 5000, description: 'Update render trail based on movement' });

    // Set color
    await runner.run('PlayerEntity: render.setColor', async () => {
        const player = new PlayerEntity('player1', 0, 0, { color: 0xff0000 });
        player.render.setColor(0x00ff00);
    }, { iterations: 10000, description: 'Set player color' });

    // Clear trail
    await runner.run('PlayerEntity: render.clearTrail', async () => {
        const player = new PlayerEntity('player1', 0, 0);
        for (let i = 0; i < 50; i++) {
            player.render.addTrailPoint(i * 5, Math.sin(i) * 10);
        }
        player.render.clearTrail();
    }, { iterations: 2000, description: 'Clear render trail' });
}

/**
 * Benchmark PlayerEntity state transitions
 */
export async function benchmarkPlayerEntityState(runner) {
    console.log('\n--- PlayerEntity: State Transition Benchmarks ---\n');

    // State transition (ALIVE -> DEAD)
    await runner.run('PlayerEntity: state.transition (ALIVE->DEAD)', async () => {
        const player = new PlayerEntity('player1', 0, 0);
        player.state.setAlive(false);
    }, { iterations: 5000, description: 'Transition from ALIVE to DEAD' });

    // State transition (DEAD -> RESPAWNING -> ALIVE)
    await runner.run('PlayerEntity: state.respawn cycle', async () => {
        const player = new PlayerEntity('player1', 0, 0);
        player.state.setAlive(false); // ALIVE -> DEAD
        // Note: Direct transition to RESPAWNING would need proper state machine
        player.state.setAlive(true); // Back to ALIVE
    }, { iterations: 2000, description: 'Full respawn cycle' });

    // Boost toggle
    await runner.run('PlayerEntity: state.setBoosting', async () => {
        const player = new PlayerEntity('player1', 0, 0);
        player.state.setBoosting(true);
        player.state.setBoosting(false);
    }, { iterations: 5000, description: 'Toggle boost state' });

    // Check canTransition
    await runner.run('PlayerEntity: state.canTransition', async () => {
        const player = new PlayerEntity('player1', 0, 0);
        player.state.canTransition(PlayerState.DEAD);
        player.state.canTransition(PlayerState.BOOSTING);
    }, { iterations: 10000, description: 'Check valid state transitions' });
}

/**
 * Benchmark PlayerEntity serialization
 */
export async function benchmarkPlayerEntitySerialization(runner) {
    console.log('\n--- PlayerEntity: Serialization Benchmarks ---\n');

    // Serialize to JSON
    await runner.run('PlayerEntity: physics.toJSON', async () => {
        const player = new PlayerEntity('player1', 50, 50, { speed: 40 });
        player.physics.toJSON();
    }, { iterations: 5000, description: 'Serialize physics component' });

    // Serialize rubber to JSON
    await runner.run('PlayerEntity: rubber.toJSON', async () => {
        const player = new PlayerEntity('player1', 50, 50);
        player.rubber.toJSON();
    }, { iterations: 5000, description: 'Serialize rubber component' });

    // Serialize render to JSON
    await runner.run('PlayerEntity: render.toJSON', async () => {
        const player = new PlayerEntity('player1', 0, 0, { color: 0xff0000 });
        for (let i = 0; i < 20; i++) {
            player.render.addTrailPoint(i * 5, Math.sin(i) * 10);
        }
        player.render.toJSON();
    }, { iterations: 2000, description: 'Serialize render component' });

    // Deserialize from JSON
    await runner.run('PlayerEntity: physics.fromJSON', async () => {
        const player = new PlayerEntity('player1', 0, 0);
        const data = { x: 50, z: 50, speed: 45, directionX: 1, directionZ: 0 };
        player.physics.fromJSON(data);
    }, { iterations: 5000, description: 'Deserialize physics component' });
}

// ============================================================================
// Frame Time Simulation Benchmarks
// ============================================================================

/**
 * Benchmark simulated frame times with multiple entities
 */
export async function benchmarkFrameTimeSimulation(runner) {
    console.log('\n--- Frame Time Simulation Benchmarks ---\n');

    // Simulate frame with 10 players
    await runner.run('FrameTime: 10 players (physics + rubber)', async () => {
        const players = [];
        for (let i = 0; i < 10; i++) {
            players.push(new PlayerEntity(`player${i}`, i * 20, 0, { speed: 40 }));
        }
        const segments = [];
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
                segments.push({
                    x1: j * 5, z1: i * 20, x2: j * 5 + 3, z2: i * 20 + 5, pid: `player${i}`
                });
            }
        }
        for (const player of players) {
            player.physics.update(0.016);
            player.rubber.update(0.016, segments, { x: player.physics.point.x, z: player.physics.point.z });
        }
    }, { iterations: 1000, description: 'Simulate frame with 10 players' });

    // Simulate frame with 50 players
    await runner.run('FrameTime: 50 players (physics + rubber)', async () => {
        const players = [];
        for (let i = 0; i < 50; i++) {
            players.push(new PlayerEntity(`player${i}`, i * 8, 0, { speed: 40 }));
        }
        const segments = [];
        for (let i = 0; i < 50; i++) {
            for (let j = 0; j < 5; j++) {
                segments.push({
                    x1: j * 5, z1: i * 8, x2: j * 5 + 3, z2: i * 8 + 5, pid: `player${i}`
                });
            }
        }
        for (const player of players) {
            player.physics.update(0.016);
            player.rubber.update(0.016, segments, { x: player.physics.point.x, z: player.physics.point.z });
        }
    }, { iterations: 200, description: 'Simulate frame with 50 players' });

    // Simulate frame with trail rendering
    await runner.run('FrameTime: 10 players (with trail render)', async () => {
        const players = [];
        for (let i = 0; i < 10; i++) {
            const player = new PlayerEntity(`player${i}`, i * 20, 0, { speed: 40 });
            // Add trail points
            for (let j = 0; j < 20; j++) {
                player.render.addTrailPoint(j * 3, Math.sin(j) * 10);
            }
            players.push(player);
        }
        for (const player of players) {
            player.physics.update(0.016);
            // Simulate render data generation
            const trail = new TrailEntity(player.id);
            for (let j = 0; j < 20; j++) {
                trail.addPoint(j * 3, Math.sin(j) * 10);
            }
            trail.getRenderData();
        }
    }, { iterations: 500, description: 'Simulate frame with trail rendering' });

    // Simulate 60fps budget check (16.67ms per frame)
    await runner.run('FrameTime: Budget check (100 entities)', async () => {
        const startTime = performance.now();
        const budget = 16.67; // 60fps budget

        const players = [];
        for (let i = 0; i < 100; i++) {
            players.push(new PlayerEntity(`player${i}`, i * 4, 0));
        }

        for (const player of players) {
            player.physics.update(0.016);
        }

        const elapsed = performance.now() - startTime;
        // Return whether we stayed within budget
        return { elapsed, withinBudget: elapsed < budget };
    }, { iterations: 100, description: 'Check if 100 entities fit in 60fps budget' });
}

// ============================================================================
// Main Runner
// ============================================================================

/**
 * Run all rendering benchmarks
 * @param {Object} options - Runner options
 * @returns {Promise<BenchmarkRunner>} Runner with results
 */
export async function runRenderingBenchmarks(options = {}) {
    const runner = createRunner({
        iterations: options.iterations ?? 1000,
        warmup: options.warmup ?? 100,
        verbose: options.verbose ?? true
    });

    runner.setSuiteName('Cyber Cycles Rendering Benchmarks');

    // Run all benchmark groups
    await benchmarkTrailEntityAddPoint(runner);
    await benchmarkTrailEntityRenderData(runner);
    await benchmarkTrailEntitySegments(runner);
    await benchmarkTrailEntityCollision(runner);
    await benchmarkTrailEntitySpatialHash(runner);
    await benchmarkPlayerEntityLifecycle(runner);
    await benchmarkPlayerEntityUpdate(runner);
    await benchmarkPlayerEntityRender(runner);
    await benchmarkPlayerEntityState(runner);
    await benchmarkPlayerEntitySerialization(runner);
    await benchmarkFrameTimeSimulation(runner);

    return runner;
}

/**
 * Run specific benchmark group
 * @param {string} group - Benchmark group name
 * @param {Object} options - Runner options
 * @returns {Promise<BenchmarkRunner>} Runner with results
 */
export async function runRenderingBenchmarkGroup(group, options = {}) {
    const runner = createRunner({
        iterations: options.iterations ?? 1000,
        warmup: options.warmup ?? 100,
        verbose: options.verbose ?? true
    });

    runner.setSuiteName(`Cyber Cycles Rendering Benchmarks: ${group}`);

    const groupFunctions = {
        'trail-addpoint': benchmarkTrailEntityAddPoint,
        'trail-renderdata': benchmarkTrailEntityRenderData,
        'trail-segments': benchmarkTrailEntitySegments,
        'trail-collision': benchmarkTrailEntityCollision,
        'trail-spatialhash': benchmarkTrailEntitySpatialHash,
        'player-lifecycle': benchmarkPlayerEntityLifecycle,
        'player-update': benchmarkPlayerEntityUpdate,
        'player-render': benchmarkPlayerEntityRender,
        'player-state': benchmarkPlayerEntityState,
        'player-serialization': benchmarkPlayerEntitySerialization,
        'frametime': benchmarkFrameTimeSimulation
    };

    const fn = groupFunctions[group];
    if (!fn) {
        throw new Error(`Unknown benchmark group: ${group}`);
    }

    await fn(runner);
    return runner;
}

// Run if executed directly (Node.js)
if (typeof process !== 'undefined' && process.argv[1]?.includes('rendering.bench.js')) {
    (async () => {
        const runner = await runRenderingBenchmarks();
        console.log('\n\n' + '='.repeat(60));
        console.log('GENERATING REPORT');
        console.log('='.repeat(60) + '\n');
        console.log(runner.generateReport());

        // Save results
        await runner.saveToFile('./tests/benchmarks/results/rendering-results.json', 'json');
        await runner.saveToFile('./tests/benchmarks/results/rendering-report.md', 'md');
    })();
}

export default {
    runRenderingBenchmarks,
    runRenderingBenchmarkGroup,
    benchmarkTrailEntityAddPoint,
    benchmarkTrailEntityRenderData,
    benchmarkTrailEntitySegments,
    benchmarkTrailEntityCollision,
    benchmarkTrailEntitySpatialHash,
    benchmarkPlayerEntityLifecycle,
    benchmarkPlayerEntityUpdate,
    benchmarkPlayerEntityRender,
    benchmarkPlayerEntityState,
    benchmarkPlayerEntitySerialization,
    benchmarkFrameTimeSimulation
};
