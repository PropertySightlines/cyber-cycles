/**
 * Physics Benchmarks for Cyber Cycles
 *
 * Comprehensive performance benchmarks for physics-related systems:
 * - SpatialHash: Insert, query, update operations at various scales
 * - CollisionDetection: Distance calculations, segment intersections
 * - RubberSystem: Rubber updates, wall proximity detection
 * - EntityManager: Entity lifecycle and query operations
 *
 * Target: 20+ physics benchmarks
 *
 * @module PhysicsBenchmarks
 */

import { BenchmarkRunner, createRunner } from './benchmark-runner.js';
import { SpatialHash } from '../../src/core/SpatialHash.js';
import {
    distanceToSegment,
    distanceToSegmentWithClosest,
    lineSegmentIntersection,
    continuousCollisionCheck,
    checkTrailCollision,
    checkBikeCollision,
    checkArenaBounds,
    isPointNearSegment,
    distanceToSegmentSquared
} from '../../src/physics/CollisionDetection.js';
import {
    RubberState,
    updateRubber,
    applyMalus,
    calculateEffectiveness,
    consumeRubber,
    regenerateRubber,
    detectWallProximity,
    calculateWallDistance,
    isNearWall,
    calculateSpeedAdjustment,
    applyRubberCollision,
    RUBBER_CONFIG
} from '../../src/physics/RubberSystem.js';
import { EntityManager, EntityState } from '../../src/core/EntityManager.js';

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
 * Generate random trail segments
 * @param {number} count - Number of segments
 * @param {number} arenaSize - Arena half-size
 * @returns {Array<{x1: number, z1: number, x2: number, z2: number, pid: string}>}
 */
function generateSegments(count, arenaSize = 200) {
    const segments = [];
    for (let i = 0; i < count; i++) {
        const p1 = randomPosition(arenaSize);
        const p2 = randomPosition(arenaSize);
        segments.push({
            x1: p1.x,
            z1: p1.z,
            x2: p2.x,
            z2: p2.z,
            pid: `player_${i % 10}`
        });
    }
    return segments;
}

/**
 * Generate random players for collision tests
 * @param {number} count - Number of players
 * @param {number} arenaSize - Arena half-size
 * @returns {Array<{id: string, x: number, z: number, alive: boolean}>}
 */
function generatePlayers(count, arenaSize = 200) {
    const players = [];
    for (let i = 0; i < count; i++) {
        const pos = randomPosition(arenaSize);
        players.push({
            id: `player_${i}`,
            x: pos.x,
            z: pos.z,
            alive: Math.random() > 0.2 // 80% alive
        });
    }
    return players;
}

// ============================================================================
// SpatialHash Benchmarks
// ============================================================================

/**
 * Benchmark SpatialHash insert operations
 */
export async function benchmarkSpatialHashInsert(runner) {
    console.log('\n--- SpatialHash Insert Benchmarks ---\n');

    // Insert 100 entities
    await runner.run('SpatialHash: Insert 100 entities', async () => {
        const hash = new SpatialHash(5.0);
        for (let i = 0; i < 100; i++) {
            const pos = randomPosition(100);
            hash.insert(`entity_${i}`, pos.x, pos.z);
        }
    }, { iterations: 500, description: 'Insert 100 entities into SpatialHash' });

    // Insert 1000 entities
    await runner.run('SpatialHash: Insert 1000 entities', async () => {
        const hash = new SpatialHash(5.0);
        for (let i = 0; i < 1000; i++) {
            const pos = randomPosition(100);
            hash.insert(`entity_${i}`, pos.x, pos.z);
        }
    }, { iterations: 100, description: 'Insert 1000 entities into SpatialHash' });

    // Insert 10000 entities
    await runner.run('SpatialHash: Insert 10000 entities', async () => {
        const hash = new SpatialHash(5.0);
        for (let i = 0; i < 10000; i++) {
            const pos = randomPosition(100);
            hash.insert(`entity_${i}`, pos.x, pos.z);
        }
    }, { iterations: 20, description: 'Insert 10000 entities into SpatialHash' });
}

/**
 * Benchmark SpatialHash query operations
 */
export async function benchmarkSpatialHashQuery(runner) {
    console.log('\n--- SpatialHash Query Benchmarks ---\n');

    // Query with 100 entities
    await runner.run('SpatialHash: Query 100 entities (radius=10)', async () => {
        const hash = new SpatialHash(5.0);
        for (let i = 0; i < 100; i++) {
            const pos = randomPosition(100);
            hash.insert(`entity_${i}`, pos.x, pos.z);
        }
        const center = randomPosition(100);
        hash.queryRange(center.x, center.z, 10);
    }, { iterations: 1000, description: 'Query range with 100 entities' });

    // Query with 1000 entities
    await runner.run('SpatialHash: Query 1000 entities (radius=10)', async () => {
        const hash = new SpatialHash(5.0);
        for (let i = 0; i < 1000; i++) {
            const pos = randomPosition(100);
            hash.insert(`entity_${i}`, pos.x, pos.z);
        }
        const center = randomPosition(100);
        hash.queryRange(center.x, center.z, 10);
    }, { iterations: 500, description: 'Query range with 1000 entities' });

    // Query with 10000 entities
    await runner.run('SpatialHash: Query 10000 entities (radius=10)', async () => {
        const hash = new SpatialHash(5.0);
        for (let i = 0; i < 10000; i++) {
            const pos = randomPosition(100);
            hash.insert(`entity_${i}`, pos.x, pos.z);
        }
        const center = randomPosition(100);
        hash.queryRange(center.x, center.z, 10);
    }, { iterations: 100, description: 'Query range with 10000 entities' });

    // Query IDs (faster, no distance calculation)
    await runner.run('SpatialHash: Query IDs 1000 entities', async () => {
        const hash = new SpatialHash(5.0);
        for (let i = 0; i < 1000; i++) {
            const pos = randomPosition(100);
            hash.insert(`entity_${i}`, pos.x, pos.z);
        }
        const center = randomPosition(100);
        hash.queryIds(center.x, center.z, 10);
    }, { iterations: 1000, description: 'Query IDs only (no distance calc)' });
}

/**
 * Benchmark SpatialHash update operations
 */
export async function benchmarkSpatialHashUpdate(runner) {
    console.log('\n--- SpatialHash Update Benchmarks ---\n');

    // Update 100 entities
    await runner.run('SpatialHash: Update 100 entities', async () => {
        const hash = new SpatialHash(5.0);
        // Pre-populate
        for (let i = 0; i < 100; i++) {
            hash.insert(`entity_${i}`, i * 5, 0);
        }
        // Update all
        for (let i = 0; i < 100; i++) {
            hash.update(`entity_${i}`, i * 5 + 1, 1);
        }
    }, { iterations: 500, description: 'Update positions of 100 entities' });

    // Update 1000 entities
    await runner.run('SpatialHash: Update 1000 entities', async () => {
        const hash = new SpatialHash(5.0);
        for (let i = 0; i < 1000; i++) {
            hash.insert(`entity_${i}`, i * 5, 0);
        }
        for (let i = 0; i < 1000; i++) {
            hash.update(`entity_${i}`, i * 5 + 1, 1);
        }
    }, { iterations: 100, description: 'Update positions of 1000 entities' });

    // Remove entities
    await runner.run('SpatialHash: Remove 100 entities', async () => {
        const hash = new SpatialHash(5.0);
        for (let i = 0; i < 100; i++) {
            hash.insert(`entity_${i}`, i * 5, 0);
        }
        for (let i = 0; i < 100; i++) {
            hash.remove(`entity_${i}`);
        }
    }, { iterations: 500, description: 'Remove 100 entities' });
}

// ============================================================================
// CollisionDetection Benchmarks
// ============================================================================

/**
 * Benchmark distanceToSegment operations
 */
export async function benchmarkDistanceToSegment(runner) {
    console.log('\n--- CollisionDetection: Distance to Segment Benchmarks ---\n');

    // Basic distance calculation
    await runner.run('CollisionDetection: distanceToSegment (basic)', async (i) => {
        const px = Math.sin(i) * 50;
        const pz = Math.cos(i) * 50;
        distanceToSegment(px, pz, 0, 0, 100, 0);
    }, { iterations: 10000, description: 'Basic point to segment distance' });

    // Distance with closest point
    await runner.run('CollisionDetection: distanceToSegmentWithClosest', async (i) => {
        const px = Math.sin(i) * 50;
        const pz = Math.cos(i) * 50;
        distanceToSegmentWithClosest(px, pz, 0, 0, 100, 0);
    }, { iterations: 10000, description: 'Distance with closest point calculation' });

    // Squared distance (faster, no sqrt)
    await runner.run('CollisionDetection: distanceToSegmentSquared', async (i) => {
        const px = Math.sin(i) * 50;
        const pz = Math.cos(i) * 50;
        distanceToSegmentSquared(px, pz, 0, 0, 100, 0);
    }, { iterations: 10000, description: 'Squared distance (no sqrt)' });

    // Many segments test
    await runner.run('CollisionDetection: distanceToSegment (100 segments)', async () => {
        const px = 50, pz = 50;
        const segments = generateSegments(100, 100);
        let minDist = Infinity;
        for (const seg of segments) {
            const dist = distanceToSegment(px, pz, seg.x1, seg.z1, seg.x2, seg.z2);
            if (dist < minDist) minDist = dist;
        }
    }, { iterations: 1000, description: 'Distance to 100 segments' });

    // Many segments test (1000)
    await runner.run('CollisionDetection: distanceToSegment (1000 segments)', async () => {
        const px = 50, pz = 50;
        const segments = generateSegments(1000, 100);
        let minDist = Infinity;
        for (const seg of segments) {
            const dist = distanceToSegment(px, pz, seg.x1, seg.z1, seg.x2, seg.z2);
            if (dist < minDist) minDist = dist;
        }
    }, { iterations: 200, description: 'Distance to 1000 segments' });
}

/**
 * Benchmark line segment intersection
 */
export async function benchmarkLineIntersection(runner) {
    console.log('\n--- CollisionDetection: Line Intersection Benchmarks ---\n');

    // Basic intersection
    await runner.run('CollisionDetection: lineSegmentIntersection (basic)', async (i) => {
        const angle = (i / 1000) * Math.PI * 2;
        const x1 = Math.cos(angle) * 50;
        const z1 = Math.sin(angle) * 50;
        const x2 = Math.cos(angle + Math.PI) * 50;
        const z2 = Math.sin(angle + Math.PI) * 50;
        lineSegmentIntersection(x1, z1, x2, z2, -50, 0, 50, 0);
    }, { iterations: 10000, description: 'Basic line segment intersection' });

    // Parallel lines (edge case)
    await runner.run('CollisionDetection: lineSegmentIntersection (parallel)', async () => {
        lineSegmentIntersection(0, 0, 100, 0, 0, 10, 100, 10);
    }, { iterations: 10000, description: 'Parallel lines intersection test' });

    // Many segment intersections
    await runner.run('CollisionDetection: intersection vs 100 segments', async () => {
        const x1 = 0, z1 = 0, x2 = 100, z2 = 100;
        const segments = generateSegments(100, 100);
        let intersections = 0;
        for (const seg of segments) {
            const result = lineSegmentIntersection(x1, z1, x2, z2, seg.x1, seg.z1, seg.x2, seg.z2);
            if (result.intersects) intersections++;
        }
    }, { iterations: 1000, description: 'Intersection test with 100 segments' });
}

/**
 * Benchmark continuous collision detection
 */
export async function benchmarkContinuousCollision(runner) {
    console.log('\n--- CollisionDetection: Continuous Collision Benchmarks ---\n');

    // Basic CCD
    await runner.run('CollisionDetection: continuousCollisionCheck (10 segments)', async () => {
        const prevPos = { x: 0, z: 0 };
        const currPos = { x: 50, z: 50 };
        const segments = generateSegments(10, 100);
        continuousCollisionCheck(prevPos, currPos, segments);
    }, { iterations: 2000, description: 'CCD with 10 segments' });

    // CCD with many segments
    await runner.run('CollisionDetection: continuousCollisionCheck (100 segments)', async () => {
        const prevPos = { x: 0, z: 0 };
        const currPos = { x: 50, z: 50 };
        const segments = generateSegments(100, 100);
        continuousCollisionCheck(prevPos, currPos, segments);
    }, { iterations: 500, description: 'CCD with 100 segments' });

    // Trail collision check
    await runner.run('CollisionDetection: checkTrailCollision', async () => {
        const player = { id: 'player1', x: 50, z: 50, alive: true };
        const segments = generateSegments(100, 100);
        checkTrailCollision(player, segments, 2.0);
    }, { iterations: 1000, description: 'Trail collision check' });

    // Bike collision
    await runner.run('CollisionDetection: checkBikeCollision (10 players)', async () => {
        const players = generatePlayers(10, 100);
        checkBikeCollision(players, 4.0);
    }, { iterations: 2000, description: 'Bike collision with 10 players' });

    // Bike collision (50 players)
    await runner.run('CollisionDetection: checkBikeCollision (50 players)', async () => {
        const players = generatePlayers(50, 100);
        checkBikeCollision(players, 4.0);
    }, { iterations: 500, description: 'Bike collision with 50 players' });
}

/**
 * Benchmark arena bounds checking
 */
export async function benchmarkArenaBounds(runner) {
    console.log('\n--- CollisionDetection: Arena Bounds Benchmarks ---\n');

    // Inside bounds
    await runner.run('CollisionDetection: checkArenaBounds (inside)', async (i) => {
        const x = Math.sin(i) * 100;
        const z = Math.cos(i) * 100;
        checkArenaBounds(x, z, 200);
    }, { iterations: 10000, description: 'Arena bounds check (inside)' });

    // Outside bounds
    await runner.run('CollisionDetection: checkArenaBounds (outside)', async (i) => {
        const x = Math.sin(i) * 300;
        const z = Math.cos(i) * 300;
        checkArenaBounds(x, z, 200);
    }, { iterations: 10000, description: 'Arena bounds check (outside)' });

    // isPointNearSegment
    await runner.run('CollisionDetection: isPointNearSegment', async (i) => {
        const px = Math.sin(i) * 50;
        const pz = Math.cos(i) * 50;
        isPointNearSegment(px, pz, 0, 0, 100, 0, 5.0);
    }, { iterations: 10000, description: 'Point near segment check' });
}

// ============================================================================
// RubberSystem Benchmarks
// ============================================================================

/**
 * Benchmark RubberSystem operations
 */
export async function benchmarkRubberSystem(runner) {
    console.log('\n--- RubberSystem Benchmarks ---\n');

    // Create RubberState
    await runner.run('RubberSystem: Create RubberState', async () => {
        new RubberState('player1', 1.0, 3.0);
    }, { iterations: 10000, description: 'Create new RubberState instance' });

    // Update rubber
    await runner.run('RubberSystem: updateRubber', async () => {
        const state = new RubberState('player1', 1.0, 3.0);
        updateRubber(state, 0.016, RUBBER_CONFIG, true);
    }, { iterations: 10000, description: 'Update rubber with decay' });

    // Apply malus
    await runner.run('RubberSystem: applyMalus', async () => {
        const state = new RubberState('player1', 1.0, 3.0);
        applyMalus(state, 0.5, 0.3);
    }, { iterations: 10000, description: 'Apply malus penalty' });

    // Calculate effectiveness
    await runner.run('RubberSystem: calculateEffectiveness', async () => {
        const state = new RubberState('player1', 1.0, 3.0);
        state.rubber = 0.5;
        state.malus = 0.7;
        calculateEffectiveness(state);
    }, { iterations: 10000, description: 'Calculate rubber effectiveness' });

    // Consume rubber
    await runner.run('RubberSystem: consumeRubber', async () => {
        const state = new RubberState('player1', 1.0, 3.0);
        consumeRubber(state, 0.1);
    }, { iterations: 10000, description: 'Consume rubber amount' });

    // Regenerate rubber
    await runner.run('RubberSystem: regenerateRubber', async () => {
        const state = new RubberState('player1', 1.0, 3.0);
        state.rubber = 0.5;
        regenerateRubber(state, 0.016, 0.5, false);
    }, { iterations: 10000, description: 'Regenerate rubber over time' });
}

/**
 * Benchmark wall proximity detection
 */
export async function benchmarkWallProximity(runner) {
    console.log('\n--- RubberSystem: Wall Proximity Benchmarks ---\n');

    // Detect wall proximity (10 segments)
    await runner.run('RubberSystem: detectWallProximity (10 segments)', async () => {
        const player = { id: 'player1', x: 50, z: 50 };
        const segments = generateSegments(10, 100);
        detectWallProximity(player, segments, 10.0);
    }, { iterations: 2000, description: 'Detect wall proximity with 10 segments' });

    // Detect wall proximity (100 segments)
    await runner.run('RubberSystem: detectWallProximity (100 segments)', async () => {
        const player = { id: 'player1', x: 50, z: 50 };
        const segments = generateSegments(100, 100);
        detectWallProximity(player, segments, 10.0);
    }, { iterations: 500, description: 'Detect wall proximity with 100 segments' });

    // Calculate wall distance
    await runner.run('RubberSystem: calculateWallDistance (100 segments)', async () => {
        const player = { id: 'player1', x: 50, z: 50 };
        const segments = generateSegments(100, 100);
        calculateWallDistance(player, segments);
    }, { iterations: 1000, description: 'Calculate wall distance' });

    // isNearWall check
    await runner.run('RubberSystem: isNearWall (100 segments)', async () => {
        const player = { id: 'player1', x: 50, z: 50 };
        const segments = generateSegments(100, 100);
        isNearWall(player, segments, 2.0);
    }, { iterations: 2000, description: 'Check if near wall' });

    // Speed adjustment
    await runner.run('RubberSystem: calculateSpeedAdjustment', async () => {
        const player = { id: 'player1', x: 50, z: 50, speed: 40 };
        const segments = generateSegments(50, 100);
        calculateSpeedAdjustment(player, segments, RUBBER_CONFIG);
    }, { iterations: 1000, description: 'Calculate speed adjustment near walls' });

    // Full collision response
    await runner.run('RubberSystem: applyRubberCollision', async () => {
        const player = { id: 'player1', x: 50, z: 50, speed: 40 };
        const rubberState = new RubberState('player1', 1.0, 3.0);
        const segments = generateSegments(50, 100);
        applyRubberCollision(player, segments, rubberState, RUBBER_CONFIG);
    }, { iterations: 500, description: 'Full rubber collision response' });
}

// ============================================================================
// EntityManager Benchmarks
// ============================================================================

/**
 * Benchmark EntityManager operations
 */
export async function benchmarkEntityManager(runner) {
    console.log('\n--- EntityManager Benchmarks ---\n');

    // Create 100 entities
    await runner.run('EntityManager: Create 100 entities', async () => {
        const em = new EntityManager();
        for (let i = 0; i < 100; i++) {
            em.createEntity('player', {
                position: { x: i, z: 0 },
                velocity: { x: 0, z: 0 }
            });
        }
    }, { iterations: 500, description: 'Create 100 entities' });

    // Create 1000 entities
    await runner.run('EntityManager: Create 1000 entities', async () => {
        const em = new EntityManager();
        for (let i = 0; i < 1000; i++) {
            em.createEntity('player', {
                position: { x: i, z: 0 },
                velocity: { x: 0, z: 0 }
            });
        }
    }, { iterations: 100, description: 'Create 1000 entities' });

    // Create 10000 entities
    await runner.run('EntityManager: Create 10000 entities', async () => {
        const em = new EntityManager();
        for (let i = 0; i < 10000; i++) {
            em.createEntity('player', {
                position: { x: i, z: 0 },
                velocity: { x: 0, z: 0 }
            });
        }
    }, { iterations: 20, description: 'Create 10000 entities' });

    // Update entities
    await runner.run('EntityManager: Update 100 entities', async () => {
        const em = new EntityManager();
        const ids = [];
        for (let i = 0; i < 100; i++) {
            ids.push(em.createEntity('player', { position: { x: i, z: 0 } }));
        }
        for (const id of ids) {
            em.updateEntity(id, { position: { x: id + 1, z: 1 } });
        }
    }, { iterations: 500, description: 'Update 100 entities' });

    // Query by type
    await runner.run('EntityManager: Query by type (1000 entities)', async () => {
        const em = new EntityManager();
        for (let i = 0; i < 1000; i++) {
            em.createEntity(i % 2 === 0 ? 'player' : 'enemy', { position: { x: i, z: 0 } });
        }
        em.getEntitiesByType('player');
    }, { iterations: 500, description: 'Query entities by type' });

    // Query by component
    await runner.run('EntityManager: Query by component (1000 entities)', async () => {
        const em = new EntityManager();
        for (let i = 0; i < 1000; i++) {
            em.createEntity('player', {
                position: { x: i, z: 0 },
                velocity: { x: 0, z: 0 },
                health: { value: 100 }
            });
        }
        em.getEntitiesByComponent('position');
    }, { iterations: 500, description: 'Query entities by component' });

    // Complex query (AND)
    await runner.run('EntityManager: Query AND (position + velocity)', async () => {
        const em = new EntityManager();
        for (let i = 0; i < 1000; i++) {
            em.createEntity('player', {
                position: { x: i, z: 0 },
                velocity: { x: 0, z: 0 },
                health: { value: 100 }
            });
        }
        em.query(['position', 'velocity']);
    }, { iterations: 500, description: 'Complex query with AND logic' });

    // Destroy entities
    await runner.run('EntityManager: Destroy 100 entities', async () => {
        const em = new EntityManager();
        const ids = [];
        for (let i = 0; i < 100; i++) {
            ids.push(em.createEntity('player', { position: { x: i, z: 0 } }));
        }
        for (const id of ids) {
            em.destroyEntity(id);
        }
    }, { iterations: 500, description: 'Destroy 100 entities' });

    // Clear all entities
    await runner.run('EntityManager: Clear 1000 entities', async () => {
        const em = new EntityManager();
        for (let i = 0; i < 1000; i++) {
            em.createEntity('player', { position: { x: i, z: 0 } });
        }
        em.clear();
    }, { iterations: 100, description: 'Clear all entities' });
}

// ============================================================================
// Main Runner
// ============================================================================

/**
 * Run all physics benchmarks
 * @param {Object} options - Runner options
 * @returns {Promise<BenchmarkRunner>} Runner with results
 */
export async function runPhysicsBenchmarks(options = {}) {
    const runner = createRunner({
        iterations: options.iterations ?? 1000,
        warmup: options.warmup ?? 100,
        verbose: options.verbose ?? true
    });

    runner.setSuiteName('Cyber Cycles Physics Benchmarks');

    // Run all benchmark groups
    await benchmarkSpatialHashInsert(runner);
    await benchmarkSpatialHashQuery(runner);
    await benchmarkSpatialHashUpdate(runner);
    await benchmarkDistanceToSegment(runner);
    await benchmarkLineIntersection(runner);
    await benchmarkContinuousCollision(runner);
    await benchmarkArenaBounds(runner);
    await benchmarkRubberSystem(runner);
    await benchmarkWallProximity(runner);
    await benchmarkEntityManager(runner);

    return runner;
}

/**
 * Run specific benchmark group
 * @param {string} group - Benchmark group name
 * @param {Object} options - Runner options
 * @returns {Promise<BenchmarkRunner>} Runner with results
 */
export async function runPhysicsBenchmarkGroup(group, options = {}) {
    const runner = createRunner({
        iterations: options.iterations ?? 1000,
        warmup: options.warmup ?? 100,
        verbose: options.verbose ?? true
    });

    runner.setSuiteName(`Cyber Cycles Physics Benchmarks: ${group}`);

    const groupFunctions = {
        'spatialhash-insert': benchmarkSpatialHashInsert,
        'spatialhash-query': benchmarkSpatialHashQuery,
        'spatialhash-update': benchmarkSpatialHashUpdate,
        'collision-distance': benchmarkDistanceToSegment,
        'collision-intersection': benchmarkLineIntersection,
        'collision-continuous': benchmarkContinuousCollision,
        'collision-bounds': benchmarkArenaBounds,
        'rubber': benchmarkRubberSystem,
        'wall-proximity': benchmarkWallProximity,
        'entity': benchmarkEntityManager
    };

    const fn = groupFunctions[group];
    if (!fn) {
        throw new Error(`Unknown benchmark group: ${group}`);
    }

    await fn(runner);
    return runner;
}

// Run if executed directly (Node.js)
if (typeof process !== 'undefined' && process.argv[1]?.includes('physics.bench.js')) {
    (async () => {
        const runner = await runPhysicsBenchmarks();
        console.log('\n\n' + '='.repeat(60));
        console.log('GENERATING REPORT');
        console.log('='.repeat(60) + '\n');
        console.log(runner.generateReport());

        // Save results
        await runner.saveToFile('./tests/benchmarks/results/physics-results.json', 'json');
        await runner.saveToFile('./tests/benchmarks/results/physics-report.md', 'md');
    })();
}

export default {
    runPhysicsBenchmarks,
    runPhysicsBenchmarkGroup,
    benchmarkSpatialHashInsert,
    benchmarkSpatialHashQuery,
    benchmarkSpatialHashUpdate,
    benchmarkDistanceToSegment,
    benchmarkLineIntersection,
    benchmarkContinuousCollision,
    benchmarkArenaBounds,
    benchmarkRubberSystem,
    benchmarkWallProximity,
    benchmarkEntityManager
};
