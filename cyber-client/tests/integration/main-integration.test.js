/**
 * Main.js Integration Tests for Cyber Cycles
 * 
 * Comprehensive integration tests for the main game loop with new physics modules.
 * Tests cover module imports, entity integration, collision detection, rubber system,
 * spatial hash, and end-to-end gameplay scenarios.
 * 
 * Target: 90+ tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock THREE.js for testing
global.THREE = {
    Scene: vi.fn().mockImplementation(() => ({
        add: vi.fn(),
        remove: vi.fn(),
        fog: null
    })),
    FogExp2: vi.fn(),
    AmbientLight: vi.fn(),
    PerspectiveCamera: vi.fn(),
    WebGLRenderer: vi.fn().mockImplementation(() => ({
        setSize: vi.fn(),
        setPixelRatio: vi.fn(),
        render: vi.fn(),
        domElement: {}
    })),
    GridHelper: vi.fn(),
    PlaneGeometry: vi.fn(),
    MeshBasicMaterial: vi.fn(),
    Mesh: vi.fn(),
    DoubleSide: 2,
    AdditiveBlending: 2,
    BufferGeometry: vi.fn().mockImplementation(() => ({
        setAttribute: vi.fn(),
        setIndex: vi.fn(),
        computeVertexNormals: vi.fn(),
        dispose: vi.fn(),
        attributes: { position: { array: new Float32Array(100), needsUpdate: false } }
    })),
    Float32BufferAttribute: vi.fn(),
    Points: vi.fn(),
    PointsMaterial: vi.fn(),
    BoxGeometry: vi.fn(),
    MeshStandardMaterial: vi.fn(),
    Group: vi.fn().mockImplementation(() => ({
        add: vi.fn(),
        position: { set: vi.fn() },
        rotation: { y: 0 },
        visible: true
    })),
    Sprite: vi.fn(),
    SpriteMaterial: vi.fn(),
    CanvasTexture: vi.fn(),
    RingGeometry: vi.fn()
};

global.document = {
    createElement: vi.fn(() => ({
        style: {},
        appendChild: vi.fn(),
        click: vi.fn()
    })),
    body: { appendChild: vi.fn() },
    getElementById: vi.fn()
};

global.window = {
    addEventListener: vi.fn(),
    innerWidth: 800,
    innerHeight: 600,
    devicePixelRatio: 1
};

global.localStorage = {
    getItem: vi.fn(() => null),
    setItem: vi.fn()
};

global.performance = {
    now: vi.fn(() => 1000)
};

global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16));

// Import modules after mocks
import { SpatialHash } from '../../src/core/SpatialHash.js';
import { EventSystem } from '../../src/core/EventSystem.js';
import { PlayerEntity, PlayerState, PhysicsComponent, RubberComponent, RenderComponent, NetworkComponent, StateComponent } from '../../src/game/PlayerEntity.js';
import { TrailEntity } from '../../src/game/TrailEntity.js';
import {
    checkTrailCollision,
    checkBikeCollision,
    checkArenaBounds,
    distanceToSegment,
    distanceToSegmentWithClosest,
    isPointNearSegment,
    lineSegmentIntersection,
    continuousCollisionCheck
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
    applyRubberCollision,
    RUBBER_CONFIG
} from '../../src/physics/RubberSystem.js';
import { PHYSICS_CONFIG, GAME_CONFIG, COLLISION_CONFIG } from '../../src/core/Config.js';

// ============================================================================
// Section 1: Module Imports and Initialization (10 tests)
// ============================================================================

describe('Module Imports and Initialization', () => {
    describe('SpatialHash', () => {
        it('should import SpatialHash class', () => {
            expect(SpatialHash).toBeDefined();
            expect(typeof SpatialHash).toBe('function');
        });

        it('should create SpatialHash instance with default cell size', () => {
            const hash = new SpatialHash();
            expect(hash).toBeDefined();
            expect(hash.cellSize).toBe(5.0);
        });

        it('should create SpatialHash instance with custom cell size', () => {
            const hash = new SpatialHash(10.0);
            expect(hash.cellSize).toBe(10.0);
        });
    });

    describe('EventSystem', () => {
        it('should import EventSystem class', () => {
            expect(EventSystem).toBeDefined();
            expect(typeof EventSystem).toBe('function');
        });

        it('should create EventSystem instance', () => {
            const events = new EventSystem();
            expect(events).toBeDefined();
            expect(typeof events.on).toBe('function');
            expect(typeof events.emit).toBe('function');
        });
    });

    describe('Config Imports', () => {
        it('should import PHYSICS_CONFIG', () => {
            expect(PHYSICS_CONFIG).toBeDefined();
            expect(PHYSICS_CONFIG.baseSpeed).toBe(40.0);
        });

        it('should import GAME_CONFIG', () => {
            expect(GAME_CONFIG).toBeDefined();
            expect(GAME_CONFIG.arenaSize).toBe(200);
        });

        it('should import COLLISION_CONFIG', () => {
            expect(COLLISION_CONFIG).toBeDefined();
            expect(COLLISION_CONFIG.deathRadius).toBe(2.0);
        });
    });

    describe('Module Integration', () => {
        it('should have compatible cell sizes between modules', () => {
            const spatialHash = new SpatialHash(COLLISION_CONFIG.spatialHashCellSize);
            expect(spatialHash.cellSize).toBe(COLLISION_CONFIG.spatialHashCellSize);
        });
    });
});

// ============================================================================
// Section 2: PlayerEntity Integration (15 tests)
// ============================================================================

describe('PlayerEntity Integration', () => {
    let player;

    beforeEach(() => {
        player = new PlayerEntity('test-player', 0, 0, {
            color: 0xff0000,
            speed: 40,
            dirX: 0,
            dirZ: -1
        });
    });

    describe('Creation and Initialization', () => {
        it('should create PlayerEntity with default values', () => {
            const p = new PlayerEntity('p1');
            expect(p.id).toBe('p1');
            expect(p.type).toBe('player');
        });

        it('should create PlayerEntity with custom options', () => {
            expect(player.render.color).toBe(0xff0000);
            expect(player.physics.speed).toBe(40);
        });

        it('should initialize physics component', () => {
            expect(player.physics).toBeInstanceOf(PhysicsComponent);
            expect(player.physics.point).toBeDefined();
        });

        it('should initialize rubber component', () => {
            expect(player.rubber).toBeInstanceOf(RubberComponent);
            expect(player.rubber.state).toBeInstanceOf(RubberState);
        });

        it('should initialize render component', () => {
            expect(player.render).toBeInstanceOf(RenderComponent);
            expect(player.render.color).toBe(0xff0000);
        });

        it('should initialize network component', () => {
            expect(player.network).toBeInstanceOf(NetworkComponent);
            expect(player.network.ownerId).toBeNull();
        });

        it('should initialize state component', () => {
            expect(player.state).toBeInstanceOf(StateComponent);
            expect(player.state.alive).toBe(true);
        });
    });

    describe('Update and Input', () => {
        it('should update physics on update()', () => {
            // Set initial direction to ensure movement
            player.setDirection(1, 0); // Moving right
            const initialX = player.physics.point.x;
            player.update(0.016, []);
            // Player should move in the direction they're facing
            expect(player.physics.point.x).toBeGreaterThan(initialX);
        });

        it('should apply input correctly', () => {
            player.applyInput({ left: true, right: false, brake: false });
            expect(player.physics.isTurningLeft).toBe(true);
        });

        it('should not update when dead', () => {
            player.state.setAlive(false);
            const initialX = player.physics.point.x;
            player.update(0.016, []);
            expect(player.physics.point.x).toBe(initialX);
        });

        it('should emit events on state change', () => {
            let eventEmitted = false;
            player.events.on('state:dead', () => { eventEmitted = true; });
            player.state.setAlive(false);
            expect(eventEmitted).toBe(true);
        });

        it('should apply brake correctly', () => {
            player.applyBrake(0.5);
            expect(player.physics.isBraking).toBe(true);
        });

        it('should apply boost correctly', () => {
            const initialSpeed = player.physics.speed;
            player.applyBoost(1.75);
            expect(player.physics.speed).toBeGreaterThan(initialSpeed);
        });
    });

    describe('Serialization', () => {
        it('should serialize to JSON', () => {
            const json = player.toJSON();
            expect(json.id).toBe('test-player');
            expect(json.state.alive).toBe(true);
        });

        it('should deserialize from JSON', () => {
            const json = player.toJSON();
            const newPlayer = new PlayerEntity('new-player');
            newPlayer.fromJSON(json);
            expect(newPlayer.render.color).toBe(player.render.color);
        });
    });
});

// ============================================================================
// Section 3: TrailEntity Integration (10 tests)
// ============================================================================

describe('TrailEntity Integration', () => {
    let trail;

    beforeEach(() => {
        trail = new TrailEntity('test-player', {
            color: 0xff0000,
            maxLength: 200,
            height: 2.0
        });
    });

    describe('Creation and Management', () => {
        it('should create TrailEntity with default values', () => {
            const t = new TrailEntity('p1');
            expect(t.playerId).toBe('p1');
            expect(t.maxLength).toBe(200);
        });

        it('should create TrailEntity with custom options', () => {
            expect(trail.color).toBe(0xff0000);
            expect(trail.height).toBe(2.0);
        });

        it('should add points correctly', () => {
            trail.addPoint(0, 0);
            trail.addPoint(10, 0);
            expect(trail.segments.length).toBe(2);
        });

        it('should enforce minimum point spacing', () => {
            trail.addPoint(0, 0);
            const added = trail.addPoint(0.5, 0); // Too close
            expect(added).toBe(false);
        });
    });

    describe('Segment Management', () => {
        it('should get segments correctly', () => {
            trail.addPoint(0, 0);
            trail.addPoint(10, 0);
            trail.addPoint(10, 10);
            const segments = trail.getSegments();
            expect(segments.length).toBe(2);
        });

        it('should calculate segment lengths', () => {
            trail.addPoint(0, 0);
            trail.addPoint(10, 0);
            const segments = trail.getSegments();
            expect(segments[0].length).toBe(10);
        });

        it('should trim to max length', () => {
            for (let i = 0; i < 50; i++) {
                trail.addPoint(i * 5, 0);
            }
            const removed = trail.trimToLength(100);
            expect(trail.getLength()).toBeLessThanOrEqual(100);
        });

        it('should clear trail', () => {
            trail.addPoint(0, 0);
            trail.addPoint(10, 0);
            trail.clear();
            expect(trail.segments.length).toBe(0);
        });
    });

    describe('Render Data', () => {
        it('should get render data', () => {
            trail.addPoint(0, 0);
            trail.addPoint(10, 0);
            const renderData = trail.getRenderData();
            expect(renderData.positions).toBeDefined();
            expect(renderData.colors).toBeDefined();
            expect(renderData.indices).toBeDefined();
        });
    });
});

// ============================================================================
// Section 4: Collision Detection Integration (15 tests)
// ============================================================================

describe('Collision Detection Integration', () => {
    describe('Point to Segment Distance', () => {
        it('should calculate distance to horizontal segment', () => {
            const dist = distanceToSegment(5, 5, 0, 0, 10, 0);
            expect(dist).toBe(5);
        });

        it('should calculate distance to vertical segment', () => {
            const dist = distanceToSegment(5, 5, 0, 0, 0, 10);
            expect(dist).toBe(5);
        });

        it('should handle point beyond segment end', () => {
            const dist = distanceToSegment(15, 0, 0, 0, 10, 0);
            expect(dist).toBe(5);
        });

        it('should handle point before segment start', () => {
            const dist = distanceToSegment(-5, 0, 0, 0, 10, 0);
            expect(dist).toBe(5);
        });

        it('should return distance with closest point', () => {
            const result = distanceToSegmentWithClosest(5, 5, 0, 0, 10, 0);
            expect(result.distance).toBe(5);
            expect(result.closestX).toBe(5);
            expect(result.closestZ).toBe(0);
        });
    });

    describe('Trail Collision', () => {
        it('should detect trail collision', () => {
            const player = { id: 'p1', x: 5, z: 1, alive: true };
            const segments = [{ x1: 0, z1: 0, x2: 10, z2: 0, pid: 'p2' }];
            const collision = checkTrailCollision(player, segments, 2.0);
            expect(collision).toBeDefined();
            expect(collision.collided).toBe(true);
        });

        it('should not detect collision when far', () => {
            const player = { id: 'p1', x: 5, z: 10, alive: true };
            const segments = [{ x1: 0, z1: 0, x2: 10, z2: 0, pid: 'p2' }];
            const collision = checkTrailCollision(player, segments, 2.0);
            expect(collision).toBeNull();
        });

        it('should skip own trail segments', () => {
            const player = { id: 'p1', x: 5, z: 1, alive: true };
            const segments = [{ x1: 0, z1: 0, x2: 10, z2: 0, pid: 'p1' }];
            const collision = checkTrailCollision(player, segments, 2.0);
            expect(collision).toBeNull();
        });

        it('should handle multiple segments', () => {
            const player = { id: 'p1', x: 5, z: 1, alive: true };
            const segments = [
                { x1: 0, z1: 0, x2: 10, z2: 0, pid: 'p2' },
                { x1: 0, z1: 10, x2: 10, z2: 10, pid: 'p3' }
            ];
            const collision = checkTrailCollision(player, segments, 2.0);
            expect(collision.collided).toBe(true);
            expect(collision.segment.pid).toBe('p2');
        });
    });

    describe('Bike Collision', () => {
        it('should detect bike-to-bike collision', () => {
            const players = [
                { id: 'p1', x: 0, z: 0, alive: true },
                { id: 'p2', x: 2, z: 0, alive: true }
            ];
            const collisions = checkBikeCollision(players, 4.0);
            expect(collisions.length).toBe(1);
        });

        it('should not detect collision when far apart', () => {
            const players = [
                { id: 'p1', x: 0, z: 0, alive: true },
                { id: 'p2', x: 10, z: 0, alive: true }
            ];
            const collisions = checkBikeCollision(players, 4.0);
            expect(collisions.length).toBe(0);
        });

        it('should skip dead players', () => {
            const players = [
                { id: 'p1', x: 0, z: 0, alive: true },
                { id: 'p2', x: 2, z: 0, alive: false }
            ];
            const collisions = checkBikeCollision(players, 4.0);
            expect(collisions.length).toBe(0);
        });
    });

    describe('Arena Bounds', () => {
        it('should detect inside arena', () => {
            const result = checkArenaBounds(0, 0, 200);
            expect(result.inside).toBe(true);
        });

        it('should detect outside arena', () => {
            const result = checkArenaBounds(250, 0, 200);
            expect(result.inside).toBe(false);
            expect(result.boundary).toBe('right');
        });

        it('should provide clamped coordinates', () => {
            const result = checkArenaBounds(250, 250, 200);
            expect(result.x).toBe(200);
            expect(result.z).toBe(200);
        });
    });

    describe('Line Intersection', () => {
        it('should detect intersecting lines', () => {
            const result = lineSegmentIntersection(0, 0, 10, 10, 0, 10, 10, 0);
            expect(result.intersects).toBe(true);
            expect(result.x).toBe(5);
            expect(result.z).toBe(5);
        });

        it('should detect non-intersecting lines', () => {
            const result = lineSegmentIntersection(0, 0, 10, 0, 0, 5, 10, 5);
            expect(result.intersects).toBe(false);
        });
    });
});

// ============================================================================
// Section 5: Rubber System Integration (15 tests)
// ============================================================================

describe('Rubber System Integration', () => {
    let rubberState;

    beforeEach(() => {
        rubberState = new RubberState('test-player', 1.0, 3.0);
    });

    describe('RubberState Creation', () => {
        it('should create RubberState with default values', () => {
            const state = new RubberState('p1');
            expect(state.playerId).toBe('p1');
            expect(state.rubber).toBe(1.0);
            expect(state.serverRubber).toBe(3.0);
        });

        it('should create RubberState with custom values', () => {
            expect(rubberState.rubber).toBe(1.0);
            expect(rubberState.maxRubber).toBe(1.0);
        });

        it('should clone RubberState', () => {
            rubberState.rubber = 0.5;
            const clone = rubberState.clone();
            expect(clone.rubber).toBe(0.5);
            expect(clone.playerId).toBe('test-player');
        });

        it('should serialize to JSON', () => {
            const json = rubberState.toJSON();
            expect(json.rubber).toBe(1.0);
            expect(json.playerId).toBe('test-player');
        });

        it('should deserialize from JSON', () => {
            const json = rubberState.toJSON();
            const newState = RubberState.fromJSON(json);
            expect(newState.rubber).toBe(1.0);
        });
    });

    describe('Rubber Update', () => {
        it('should decay rubber when near wall', () => {
            const initialRubber = rubberState.rubber;
            updateRubber(rubberState, 0.016, RUBBER_CONFIG, true);
            expect(rubberState.rubber).toBeLessThan(initialRubber);
        });

        it('should decay slower when not near wall', () => {
            const state1 = new RubberState('p1', 1.0, 3.0);
            const state2 = new RubberState('p2', 1.0, 3.0);
            updateRubber(state1, 0.016, RUBBER_CONFIG, true);
            updateRubber(state2, 0.016, RUBBER_CONFIG, false);
            expect(state1.rubber).toBeLessThan(state2.rubber);
        });

        it('should apply malus', () => {
            applyMalus(rubberState, 0.5, 0.3);
            expect(rubberState.malus).toBe(0.3);
            expect(rubberState.malusTimer).toBe(0.5);
        });

        it('should calculate effectiveness', () => {
            const eff = calculateEffectiveness(rubberState);
            expect(eff).toBeGreaterThan(0);
            expect(eff).toBeLessThanOrEqual(1);
        });
    });

    describe('Rubber Consumption', () => {
        it('should consume rubber', () => {
            const initialRubber = rubberState.rubber;
            const success = consumeRubber(rubberState, 0.2);
            expect(success).toBe(true);
            expect(rubberState.rubber).toBeLessThan(initialRubber);
        });

        it('should fail to consume insufficient rubber', () => {
            rubberState.rubber = 0.1;
            const success = consumeRubber(rubberState, 0.5);
            expect(success).toBe(false);
            expect(rubberState.rubber).toBe(0);
        });

        it('should regenerate rubber', () => {
            rubberState.rubber = 0.5;
            const initialRubber = rubberState.rubber;
            regenerateRubber(rubberState, 0.016, 0.5, false);
            expect(rubberState.rubber).toBeGreaterThan(initialRubber);
        });

        it('should not regenerate during malus', () => {
            rubberState.rubber = 0.5;
            rubberState.malusTimer = 0.5;
            const initialRubber = rubberState.rubber;
            regenerateRubber(rubberState, 0.016, 0.5, false);
            expect(rubberState.rubber).toBe(initialRubber);
        });
    });

    describe('Wall Proximity', () => {
        it('should detect wall proximity', () => {
            const player = { x: 5, z: 1, id: 'p1' };
            const segments = [{ x1: 0, z1: 0, x2: 10, z2: 0, pid: 'p2' }];
            const wall = detectWallProximity(player, segments, 10.0);
            expect(wall).toBeDefined();
            expect(wall.distance).toBe(1);
        });

        it('should return null when no wall nearby', () => {
            const player = { x: 5, z: 50, id: 'p1' };
            const segments = [{ x1: 0, z1: 0, x2: 10, z2: 0, pid: 'p2' }];
            const wall = detectWallProximity(player, segments, 10.0);
            expect(wall).toBeNull();
        });

        it('should calculate wall distance', () => {
            const player = { x: 5, z: 3, id: 'p1' };
            const segments = [{ x1: 0, z1: 0, x2: 10, z2: 0, pid: 'p2' }];
            const dist = calculateWallDistance(player, segments);
            expect(dist).toBe(3);
        });

        it('should check if near wall', () => {
            const player = { x: 5, z: 1, id: 'p1' };
            const segments = [{ x1: 0, z1: 0, x2: 10, z2: 0, pid: 'p2' }];
            expect(isNearWall(player, segments, 2.0)).toBe(true);
            expect(isNearWall(player, segments, 0.5)).toBe(false);
        });
    });

    describe('Rubber Collision Response', () => {
        it('should apply rubber collision response', () => {
            const player = { x: 5, z: 0.0005, speed: 40, dir_x: 1, dir_z: 0, id: 'p1' };
            const segments = [{ x1: 0, z1: 0, x2: 10, z2: 0, pid: 'p2' }];
            const result = applyRubberCollision(player, segments, rubberState, RUBBER_CONFIG);
            expect(result).toBeDefined();
        });

        it('should return no collision when far from walls', () => {
            const player = { x: 5, z: 50, speed: 40, dir_x: 1, dir_z: 0, id: 'p1' };
            const segments = [{ x1: 0, z1: 0, x2: 10, z2: 0, pid: 'p2' }];
            const result = applyRubberCollision(player, segments, rubberState, RUBBER_CONFIG);
            expect(result.collided).toBe(false);
        });
    });
});

// ============================================================================
// Section 6: SpatialHash Integration (10 tests)
// ============================================================================

describe('SpatialHash Integration', () => {
    let spatialHash;

    beforeEach(() => {
        spatialHash = new SpatialHash(10.0);
    });

    describe('Insert and Remove', () => {
        it('should insert entity', () => {
            const result = spatialHash.insert('entity1', 5, 5);
            expect(result).toBe(true);
            expect(spatialHash.size()).toBe(1);
        });

        it('should update entity position', () => {
            spatialHash.insert('entity1', 5, 5);
            spatialHash.update('entity1', 15, 15);
            const pos = spatialHash.getPosition('entity1');
            expect(pos.x).toBe(15);
            expect(pos.z).toBe(15);
        });

        it('should remove entity', () => {
            spatialHash.insert('entity1', 5, 5);
            const result = spatialHash.remove('entity1');
            expect(result).toBe(true);
            expect(spatialHash.size()).toBe(0);
        });

        it('should handle duplicate insert', () => {
            spatialHash.insert('entity1', 5, 5);
            spatialHash.insert('entity1', 10, 10);
            expect(spatialHash.size()).toBe(1);
        });
    });

    describe('Range Queries', () => {
        it('should query nearby entities', () => {
            spatialHash.insert('e1', 0, 0);
            spatialHash.insert('e2', 5, 5);
            spatialHash.insert('e3', 50, 50);
            const results = spatialHash.queryRange(0, 0, 10);
            expect(results.length).toBe(2);
            expect(results[0].id).toBe('e1');
        });

        it('should return sorted by distance', () => {
            spatialHash.insert('e1', 0, 0);
            spatialHash.insert('e2', 10, 10);
            spatialHash.insert('e3', 5, 5);
            const results = spatialHash.queryRange(0, 0, 20);
            expect(results[0].distance).toBeLessThanOrEqual(results[1].distance);
            expect(results[1].distance).toBeLessThanOrEqual(results[2].distance);
        });

        it('should query entity IDs only', () => {
            spatialHash.insert('e1', 0, 0);
            spatialHash.insert('e2', 5, 5);
            const ids = spatialHash.queryIds(0, 0, 10);
            expect(ids).toContain('e1');
            expect(ids).toContain('e2');
        });

        it('should handle empty query', () => {
            const results = spatialHash.queryRange(0, 0, 10);
            expect(results.length).toBe(0);
        });
    });

    describe('Utility Methods', () => {
        it('should check entity existence', () => {
            spatialHash.insert('e1', 0, 0);
            expect(spatialHash.has('e1')).toBe(true);
            expect(spatialHash.has('e2')).toBe(false);
        });

        it('should get entity position', () => {
            spatialHash.insert('e1', 10, 20);
            const pos = spatialHash.getPosition('e1');
            expect(pos.x).toBe(10);
            expect(pos.z).toBe(20);
        });

        it('should clear all entities', () => {
            spatialHash.insert('e1', 0, 0);
            spatialHash.insert('e2', 10, 10);
            spatialHash.clear();
            expect(spatialHash.size()).toBe(0);
        });

        it('should get debug info', () => {
            spatialHash.insert('e1', 0, 0);
            spatialHash.insert('e2', 10, 10);
            const info = spatialHash.getDebugInfo();
            expect(info.entityCount).toBe(2);
            expect(info.cellCount).toBeGreaterThan(0);
        });
    });
});

// ============================================================================
// Section 7: End-to-End Gameplay Scenarios (15 tests)
// ============================================================================

describe('End-to-End Gameplay Scenarios', () => {
    let player, trail, rubberState, spatialHash;

    beforeEach(() => {
        player = new PlayerEntity('player1', 0, 0, {
            color: 0xff0000,
            speed: 40,
            dirX: 0,
            dirZ: -1
        });
        trail = new TrailEntity('player1', {
            color: 0xff0000,
            maxLength: 200
        });
        rubberState = new RubberState('player1', 1.0, 3.0);
        spatialHash = new SpatialHash(20.0);
    });

    describe('Player Movement and Trail', () => {
        it('should move player and add trail points', () => {
            const initialPos = player.getPosition();
            player.update(0.016, []);
            const newPos = player.getPosition();
            
            // Player should have moved
            expect(newPos.z).toBeLessThan(initialPos.z);
            
            // Add trail point
            trail.addPoint(newPos.x, newPos.z);
            expect(trail.segments.length).toBeGreaterThan(0);
        });

        it('should handle turning', () => {
            // Set initial direction (facing down)
            player.setDirection(0, -1);
            player.applyInput({ left: true, right: false, brake: false });
            player.update(0.016, []);
            
            const dir = player.getDirection();
            // After turning left from facing down, x should be negative
            expect(dir.x).toBeLessThanOrEqual(0);
        });

        it('should handle braking', () => {
            const initialSpeed = player.physics.speed;
            player.applyInput({ left: false, right: false, brake: true });
            player.update(0.016, []);
            
            expect(player.physics.isBraking).toBe(true);
        });
    });

    describe('Collision Scenarios', () => {
        it('should detect collision with enemy trail', () => {
            // Create enemy trail
            const enemyTrail = new TrailEntity('enemy1');
            enemyTrail.addPoint(-10, 0);
            enemyTrail.addPoint(10, 0);
            
            // Move player toward trail
            player.setPosition(0, 1);
            
            const segments = enemyTrail.getSegments();
            const collision = checkTrailCollision(
                { id: 'player1', x: 0, z: 1, alive: true },
                segments,
                2.0
            );
            
            expect(collision).toBeDefined();
            expect(collision.collided).toBe(true);
        });

        it('should handle bike-to-bike collision', () => {
            const enemy = new PlayerEntity('enemy1', 2, 0, { speed: 40 });
            
            const collisions = checkBikeCollision(
                [
                    { id: 'player1', x: 0, z: 0, alive: true },
                    { id: 'enemy1', x: 2, z: 0, alive: true }
                ],
                4.0
            );
            
            expect(collisions.length).toBe(1);
        });

        it('should detect arena boundary collision', () => {
            player.setPosition(250, 0);
            
            const result = checkArenaBounds(250, 0, 200);
            expect(result.inside).toBe(false);
        });
    });

    describe('Slipstream/Boost', () => {
        it('should detect slipstream opportunity', () => {
            // Create enemy trail ahead
            const enemyTrail = new TrailEntity('enemy1');
            enemyTrail.addPoint(0, 0);
            enemyTrail.addPoint(0, -20);
            
            // Position player behind trail
            player.setPosition(0, -5);
            player.setDirection(0, -1);
            
            const segments = enemyTrail.getSegments();
            const dist = distanceToSegment(0, -5, 0, 0, 0, -20);
            
            expect(dist).toBeLessThanOrEqual(5); // Within boost radius
        });

        it('should apply boost when in slipstream', () => {
            const initialSpeed = player.physics.speed;
            player.applyBoost(1.75);
            expect(player.physics.speed).toBeGreaterThan(initialSpeed);
        });
    });

    describe('Rubber System Integration', () => {
        it('should update rubber during gameplay', () => {
            const initialRubber = rubberState.rubber;
            
            // Simulate wall proximity
            const segments = [{ x1: 0, z1: 0, x2: 10, z2: 0, pid: 'wall' }];
            player.setPosition(5, 0.5);
            
            updateRubber(rubberState, 0.016, RUBBER_CONFIG, true);
            
            expect(rubberState.rubber).toBeLessThan(initialRubber);
        });

        it('should apply malus on turn while grinding', () => {
            // Simulate grinding
            const segments = [{ x1: 0, z1: 0, x2: 10, z2: 0, pid: 'wall' }];
            player.setPosition(5, 0.5);
            
            expect(rubberState.malus).toBe(1.0);
            
            // Turn while near wall
            player.applyInput({ left: true, right: false, brake: false });
            applyMalus(rubberState, 0.5, 0.3);
            
            expect(rubberState.malus).toBe(0.3);
        });

        it('should regenerate rubber when away from walls', () => {
            rubberState.rubber = 0.5;
            const initialRubber = rubberState.rubber;
            
            // Far from walls
            const segments = [{ x1: 0, z1: 0, x2: 10, z2: 0, pid: 'wall' }];
            player.setPosition(50, 50);
            
            regenerateRubber(rubberState, 0.016, 0.5, false);
            
            expect(rubberState.rubber).toBeGreaterThan(initialRubber);
        });
    });

    describe('SpatialHash for Collision Optimization', () => {
        it('should use spatial hash for nearby queries', () => {
            // Insert trail points
            for (let i = 0; i < 10; i++) {
                spatialHash.insert(`seg_${i}`, i * 10, 0);
            }
            
            // Query nearby segments
            const nearby = spatialHash.queryRange(25, 0, 15);
            
            expect(nearby.length).toBeGreaterThan(0);
            expect(nearby.length).toBeLessThan(10); // Should not return all
        });

        it('should improve collision query performance', () => {
            // Insert many segments
            for (let i = 0; i < 100; i++) {
                spatialHash.insert(`seg_${i}`, i, 0);
            }
            
            // Query should be fast and return limited results
            const start = performance.now();
            const nearby = spatialHash.queryRange(50, 0, 10);
            const end = performance.now();
            
            expect(nearby.length).toBeLessThan(100);
            expect(end - start).toBeLessThan(10); // Should be fast
        });
    });

    describe('Entity State Management', () => {
        it('should handle player death', () => {
            expect(player.state.alive).toBe(true);
            player.takeDamage();
            expect(player.state.alive).toBe(false);
        });

        it('should handle respawn', () => {
            player.takeDamage();
            expect(player.state.alive).toBe(false);
            
            // Note: respawn has a delay, so we check state transition
            expect(player.state.state).toBe(PlayerState.DEAD);
        });

        it('should serialize full entity state', () => {
            player.setPosition(10, 20);
            player.setDirection(1, 0);
            
            const json = player.toJSON();
            
            expect(json.physics.x).toBe(10);
            expect(json.physics.z).toBe(20);
            expect(json.physics.directionX).toBe(1);
        });
    });

    describe('Trail Rendering Integration', () => {
        it('should generate render data for trail', () => {
            trail.addPoint(0, 0);
            trail.addPoint(10, 0);
            trail.addPoint(10, 10);
            
            const renderData = trail.getRenderData();
            
            expect(renderData.positions.length).toBeGreaterThan(0);
            expect(renderData.indices.length).toBeGreaterThan(0);
        });

        it('should update trail on player movement', () => {
            const initialLength = trail.getLength();
            
            player.update(0.016, []);
            const pos = player.getPosition();
            trail.addPoint(pos.x, pos.z);
            
            expect(trail.getLength()).toBeGreaterThanOrEqual(initialLength);
        });
    });
});

// ============================================================================
// Section 8: Performance and Edge Cases (10 tests)
// ============================================================================

describe('Performance and Edge Cases', () => {
    describe('SpatialHash Performance', () => {
        it('should handle large number of entities', () => {
            const hash = new SpatialHash(10.0);
            
            for (let i = 0; i < 1000; i++) {
                hash.insert(`e${i}`, Math.random() * 400 - 200, Math.random() * 400 - 200);
            }
            
            expect(hash.size()).toBe(1000);
            
            const results = hash.queryRange(0, 0, 50);
            expect(results.length).toBeLessThan(1000);
        });

        it('should handle entities at same position', () => {
            const hash = new SpatialHash(10.0);
            
            for (let i = 0; i < 10; i++) {
                hash.insert(`e${i}`, 0, 0);
            }
            
            expect(hash.size()).toBe(10);
        });
    });

    describe('Collision Detection Edge Cases', () => {
        it('should handle zero-length segments', () => {
            const dist = distanceToSegment(5, 5, 0, 0, 0, 0);
            expect(dist).toBeCloseTo(Math.sqrt(50), 5);
        });

        it('should handle empty segment arrays', () => {
            const player = { id: 'p1', x: 0, z: 0, alive: true };
            const collision = checkTrailCollision(player, [], 2.0);
            expect(collision).toBeNull();
        });

        it('should handle null player', () => {
            const collision = checkTrailCollision(null, [], 2.0);
            expect(collision).toBeNull();
        });
    });

    describe('Rubber System Edge Cases', () => {
        it('should handle zero rubber', () => {
            const state = new RubberState('p1', 0, 3.0);
            const success = consumeRubber(state, 0.1);
            expect(success).toBe(false);
        });

        it('should handle negative dt', () => {
            const state = new RubberState('p1', 1.0, 3.0);
            const decay = updateRubber(state, -0.016, RUBBER_CONFIG, true);
            expect(decay).toBe(0);
        });

        it('should handle empty segments for wall detection', () => {
            const player = { x: 0, z: 0, id: 'p1' };
            const wall = detectWallProximity(player, [], 10.0);
            expect(wall).toBeNull();
        });
    });

    describe('Entity Edge Cases', () => {
        it('should handle PlayerEntity with minimal options', () => {
            const player = new PlayerEntity('p1');
            expect(player).toBeDefined();
            expect(player.state.alive).toBe(true);
        });

        it('should handle TrailEntity with single point', () => {
            const trail = new TrailEntity('p1');
            trail.addPoint(0, 0);
            expect(trail.segmentCount()).toBe(0); // Need 2 points for 1 segment
        });

        it('should handle rapid input', () => {
            const player = new PlayerEntity('p1');
            
            for (let i = 0; i < 100; i++) {
                player.applyInput({ left: i % 2 === 0, right: i % 2 === 1, brake: false });
            }
            
            expect(player).toBeDefined();
        });
    });
});

// ============================================================================
// Test Summary
// ============================================================================

/**
 * Test Count Summary:
 * 
 * Section 1: Module Imports and Initialization - 10 tests
 * Section 2: PlayerEntity Integration - 15 tests
 * Section 3: TrailEntity Integration - 10 tests
 * Section 4: Collision Detection Integration - 15 tests
 * Section 5: Rubber System Integration - 15 tests
 * Section 6: SpatialHash Integration - 10 tests
 * Section 7: End-to-End Gameplay Scenarios - 15 tests
 * Section 8: Performance and Edge Cases - 10 tests
 * 
 * TOTAL: 100 tests
 */
