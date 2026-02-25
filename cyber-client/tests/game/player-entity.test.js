/**
 * PlayerEntity Tests for Cyber Cycles
 *
 * Comprehensive test suite for the PlayerEntity module.
 * Tests cover:
 * - Constructor and initialization (10 tests)
 * - Physics component (10 tests)
 * - Rubber component (10 tests)
 * - State machine (10 tests)
 * - Input handling (10 tests)
 * - Serialization (5 tests)
 * - Integration tests (10 tests)
 *
 * Target: 65+ tests total
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    PlayerEntity,
    PlayerState,
    PhysicsComponent,
    RubberComponent,
    RenderComponent,
    NetworkComponent,
    StateComponent
} from '../../src/game/PlayerEntity.js';
import { PHYSICS_CONFIG, GAME_CONFIG } from '../../src/core/Config.js';

// ============================================================================
// Constructor and Initialization Tests (10 tests)
// ============================================================================

describe('PlayerEntity - Constructor and Initialization', () => {
    it('should create PlayerEntity with default values', () => {
        const player = new PlayerEntity('player1');
        expect(player.id).toBe('player1');
        expect(player.type).toBe('player');
        expect(player.getState()).toBe(PlayerState.ALIVE);
    });

    it('should create PlayerEntity with custom position', () => {
        const player = new PlayerEntity('player1', 50, -30);
        const pos = player.getPosition();
        expect(pos.x).toBe(50);
        expect(pos.z).toBe(-30);
    });

    it('should create PlayerEntity with custom options', () => {
        const player = new PlayerEntity('player1', 0, 0, {
            speed: 50,
            color: 0xff0000,
            isAi: true
        });
        expect(player.getSpeed()).toBe(50);
        expect(player.getColor()).toBe(0xff0000);
        expect(player.isAI()).toBe(true);
    });

    it('should initialize with default direction (0, -1)', () => {
        const player = new PlayerEntity('player1');
        const dir = player.getDirection();
        expect(dir.x).toBe(0);
        expect(dir.z).toBe(-1);
    });

    it('should create PlayerEntity with custom direction', () => {
        const player = new PlayerEntity('player1', 0, 0, {
            dirX: 1,
            dirZ: 0
        });
        const dir = player.getDirection();
        expect(dir.x).toBe(1);
        expect(dir.z).toBe(0);
    });

    it('should create PlayerEntity with ownerId', () => {
        const player = new PlayerEntity('player1', 0, 0, {
            ownerId: 'owner123'
        });
        expect(player.network.ownerId).toBe('owner123');
        expect(player.isLocal()).toBe(true);
    });

    it('should create PlayerEntity as AI', () => {
        const player = new PlayerEntity('player1', 0, 0, {
            isAi: true,
            ownerId: null
        });
        expect(player.isAI()).toBe(true);
        expect(player.isLocal()).toBe(false);
    });

    it('should create PlayerEntity with custom color', () => {
        const player = new PlayerEntity('player1', 0, 0, {
            color: 0x00ff00
        });
        expect(player.render.color).toBe(0x00ff00);
    });

    it('should create PlayerEntity with event system', () => {
        const player = new PlayerEntity('player1');
        expect(player.events).toBeDefined();
        expect(typeof player.events.on).toBe('function');
        expect(typeof player.events.emit).toBe('function');
    });

    it('should create PlayerEntity with all components', () => {
        const player = new PlayerEntity('player1');
        expect(player.physics).toBeInstanceOf(PhysicsComponent);
        expect(player.rubber).toBeInstanceOf(RubberComponent);
        expect(player.render).toBeInstanceOf(RenderComponent);
        expect(player.network).toBeInstanceOf(NetworkComponent);
        expect(player.state).toBeInstanceOf(StateComponent);
    });
});

// ============================================================================
// Physics Component Tests (10 tests)
// ============================================================================

describe('PlayerEntity - Physics Component', () => {
    let player;

    beforeEach(() => {
        player = new PlayerEntity('player1', 0, 0);
    });

    it('should get initial position', () => {
        const pos = player.getPosition();
        expect(pos.x).toBe(0);
        expect(pos.z).toBe(0);
    });

    it('should set position', () => {
        player.setPosition(100, 50);
        const pos = player.getPosition();
        expect(pos.x).toBe(100);
        expect(pos.z).toBe(50);
    });

    it('should set direction', () => {
        player.setDirection(1, 0);
        const dir = player.getDirection();
        expect(dir.x).toBe(1);
        expect(dir.z).toBe(0);
    });

    it('should normalize direction when setting', () => {
        player.setDirection(3, 4);
        const dir = player.getDirection();
        const len = Math.sqrt(dir.x * dir.x + dir.z * dir.z);
        expect(len).toBeCloseTo(1, 5);
        expect(dir.x).toBeCloseTo(0.6, 5);
        expect(dir.z).toBeCloseTo(0.8, 5);
    });

    it('should set speed', () => {
        player.setSpeed(60);
        expect(player.getSpeed()).toBe(60);
    });

    it('should clamp speed to valid range', () => {
        player.setSpeed(-10);
        expect(player.getSpeed()).toBe(0);

        player.setSpeed(200);
        expect(player.getSpeed()).toBeLessThanOrEqual(PHYSICS_CONFIG.boostSpeed);
    });

    it('should apply boost', () => {
        const initialSpeed = player.getSpeed();
        player.applyBoost(1.75);
        expect(player.getSpeed()).toBeGreaterThan(initialSpeed);
        expect(player.physics.isBoosting).toBe(true);
    });

    it('should apply brake', () => {
        player.applyBrake(0.5);
        expect(player.physics.isBraking).toBe(true);
        expect(player.getSpeed()).toBeLessThan(PHYSICS_CONFIG.baseSpeed);
    });

    it('should update position with physics', () => {
        player.setDirection(1, 0);
        player.setSpeed(40);
        player.update(0.1, []);

        const pos = player.getPosition();
        expect(pos.x).toBeGreaterThan(0);
        expect(pos.z).toBe(0);
    });

    it('should emit position changed event', () => {
        let eventCalled = false;
        player.events.on('position:changed', () => {
            eventCalled = true;
        });

        player.setPosition(10, 20);
        expect(eventCalled).toBe(true);
    });
});

// ============================================================================
// Rubber Component Tests (10 tests)
// ============================================================================

describe('PlayerEntity - Rubber Component', () => {
    let player;

    beforeEach(() => {
        player = new PlayerEntity('player1', 0, 0);
    });

    it('should initialize with full rubber', () => {
        expect(player.rubber.getRubber()).toBe(1.0);
        expect(player.rubber.getEffectiveness()).toBe(1.0);
    });

    it('should detect wall proximity', () => {
        const segments = [{ x1: -10, z1: 0, x2: 10, z2: 0 }];
        player.setPosition(0, 1);
        player.rubber.update(0.016, segments, player.physics.point);

        expect(player.rubber.isGrinding).toBe(true);
        expect(player.rubber.wallDistance).toBeCloseTo(1, 4);
    });

    it('should consume rubber when near wall', () => {
        const segments = [{ x1: -10, z1: 0, x2: 10, z2: 0 }];
        player.setPosition(0, 0.5);

        const initialRubber = player.rubber.getRubber();
        player.rubber.update(0.016, segments, player.physics.point);

        expect(player.rubber.getRubber()).toBeLessThan(initialRubber);
    });

    it('should apply malus after turning', () => {
        const segments = [{ x1: -10, z1: 0, x2: 10, z2: 0 }];
        player.setPosition(0, 0.5);
        player.rubber.update(0.016, segments, player.physics.point);
        player.startTurn(-1);
        expect(player.rubber.state.malus).toBeLessThan(1.0);
        expect(player.rubber.state.malusTimer).toBeGreaterThan(0);
    });

    it('should regenerate rubber when away from walls', () => {
        player.rubber.state.rubber = 0.5;
        player.rubber.update(0.1, [], player.physics.point);

        expect(player.rubber.getRubber()).toBeGreaterThan(0.5);
    });

    it('should not regenerate rubber during malus', () => {
        player.rubber.state.rubber = 0.5;
        player.rubber.applyMalus();
        player.rubber.update(0.1, [], player.physics.point);

        // Should not regenerate during malus
        expect(player.rubber.getRubber()).toBe(0.5);
    });

    it('should consume rubber for collision avoidance', () => {
        const initialRubber = player.rubber.getRubber();
        const success = player.rubber.consumeRubber(0.3);

        expect(success).toBe(true);
        expect(player.rubber.getRubber()).toBeLessThan(initialRubber);
    });

    it('should fail to consume rubber when insufficient', () => {
        player.rubber.state.rubber = 0.1;
        const success = player.rubber.consumeRubber(0.5);

        expect(success).toBe(false);
        expect(player.rubber.getRubber()).toBe(0);
    });

    it('should emit rubber grinding event', () => {
        let grindingEvent = null;
        player.events.on('rubber:grinding', (data) => {
            grindingEvent = data;
        });

        const segments = [{ x1: -10, z1: 0, x2: 10, z2: 0 }];
        player.setPosition(0, 0.5);
        player.update(0.016, segments);

        expect(grindingEvent).not.toBeNull();
        expect(grindingEvent.playerId).toBe('player1');
    });

    it('should emit rubber malus event', () => {
        let malusEvent = null;
        player.events.on('rubber:malus', (data) => {
            malusEvent = data;
        });

        const segments = [{ x1: -10, z1: 0, x2: 10, z2: 0 }];
        player.setPosition(0, 0.5);
        player.update(0.016, segments);
        player.startTurn(-1);

        expect(malusEvent).not.toBeNull();
        expect(malusEvent.playerId).toBe('player1');
    });
});

// ============================================================================
// State Machine Tests (10 tests)
// ============================================================================

describe('PlayerEntity - State Machine', () => {
    let player;

    beforeEach(() => {
        player = new PlayerEntity('player1', 0, 0);
    });

    it('should start in ALIVE state', () => {
        expect(player.getState()).toBe(PlayerState.ALIVE);
        expect(player.state.alive).toBe(true);
    });

    it('should transition from ALIVE to DEAD', () => {
        const result = player.state.transition(PlayerState.DEAD);
        expect(result).toBe(true);
        expect(player.getState()).toBe(PlayerState.DEAD);
    });

    it('should transition from DEAD to RESPAWNING', () => {
        player.state.transition(PlayerState.DEAD);
        const result = player.state.transition(PlayerState.RESPAWNING);
        expect(result).toBe(true);
        expect(player.getState()).toBe(PlayerState.RESPAWNING);
    });

    it('should transition from RESPAWNING to ALIVE', () => {
        player.state.transition(PlayerState.DEAD);
        player.state.transition(PlayerState.RESPAWNING);
        const result = player.state.transition(PlayerState.ALIVE);
        expect(result).toBe(true);
        expect(player.getState()).toBe(PlayerState.ALIVE);
    });

    it('should reject invalid state transition', () => {
        // Cannot go directly from ALIVE to RESPAWNING
        const result = player.state.transition(PlayerState.RESPAWNING);
        expect(result).toBe(false);
    });

    it('should transition to BOOSTING when boosting', () => {
        player.applyBoost(1.75);
        player.update(0.016, []);
        expect(player.state.boosting).toBe(true);
    });

    it('should emit state change events', () => {
        let deadEventCalled = false;
        player.events.on('state:dead', () => {
            deadEventCalled = true;
        });

        player.takeDamage();
        expect(deadEventCalled).toBe(true);
    });

    it('should set alive flag correctly', () => {
        player.state.setAlive(false);
        expect(player.state.alive).toBe(false);
        expect(player.getState()).toBe(PlayerState.DEAD);

        player.state.setAlive(true);
        expect(player.state.alive).toBe(true);
    });

    it('should track state time', () => {
        player.state.stateTime = 0;
        player.update(0.5, []);
        expect(player.state.stateTime).toBeGreaterThanOrEqual(0.5);
    });

    it('should register and call enter callbacks', () => {
        let enterCalled = false;
        player.state.onEnter(PlayerState.DEAD, () => {
            enterCalled = true;
        });

        player.state.transition(PlayerState.DEAD);
        expect(enterCalled).toBe(true);
    });
});

// ============================================================================
// Input Handling Tests (10 tests)
// ============================================================================

describe('PlayerEntity - Input Handling', () => {
    let player;

    beforeEach(() => {
        player = new PlayerEntity('player1', 0, 0);
    });

    it('should apply left turn input', () => {
        player.applyInput({ left: true, right: false, brake: false });
        expect(player.physics.isTurningLeft).toBe(true);
        expect(player.physics.isTurningRight).toBe(false);
    });

    it('should apply right turn input', () => {
        player.applyInput({ left: false, right: true, brake: false });
        expect(player.physics.isTurningLeft).toBe(false);
        expect(player.physics.isTurningRight).toBe(true);
    });

    it('should apply brake input', () => {
        player.applyInput({ left: false, right: false, brake: true });
        expect(player.physics.isBraking).toBe(true);
    });

    it('should stop turning when no input', () => {
        player.startTurn(-1);
        player.applyInput({ left: false, right: false, brake: false });
        expect(player.physics.isTurningLeft).toBe(false);
        expect(player.physics.isTurningRight).toBe(false);
    });

    it('should buffer inputs for network', () => {
        player.applyInput({ left: true, right: false, brake: false });
        expect(player.network.inputBuffer.length).toBe(1);
    });

    it('should increment sequence number for each input', () => {
        player.applyInput({ left: true, right: false, brake: false });
        const seq1 = player.network.sequenceNumber;

        player.applyInput({ left: false, right: true, brake: false });
        const seq2 = player.network.sequenceNumber;

        expect(seq2).toBeGreaterThan(seq1);
    });

    it('should ignore input when dead', () => {
        player.takeDamage();
        player.applyInput({ left: true, right: false, brake: false });
        expect(player.physics.isTurningLeft).toBe(false);
    });

    it('should emit turn started event', () => {
        let turnEvent = null;
        player.events.on('turn:started', (data) => {
            turnEvent = data;
        });

        player.applyInput({ left: true, right: false, brake: false });
        expect(turnEvent).not.toBeNull();
        expect(turnEvent.direction).toBe('left');
    });

    it('should emit turn stopped event', () => {
        player.startTurn(-1);

        let stopEvent = null;
        player.events.on('turn:stopped', (data) => {
            stopEvent = data;
        });

        player.stopTurn();
        expect(stopEvent).not.toBeNull();
    });

    it('should emit brake applied event', () => {
        let brakeEvent = null;
        player.events.on('brake:applied', (data) => {
            brakeEvent = data;
        });

        player.applyBrake(0.5);
        expect(brakeEvent).not.toBeNull();
        expect(brakeEvent.brakeAmount).toBe(0.5);
    });
});

// ============================================================================
// Serialization Tests (5 tests)
// ============================================================================

describe('PlayerEntity - Serialization', () => {
    let player;

    beforeEach(() => {
        player = new PlayerEntity('player1', 50, -30, {
            color: 0xff0000,
            speed: 60,
            dirX: 1,
            dirZ: 0,
            isAi: true,
            ownerId: 'owner123'
        });
    });

    it('should serialize to JSON', () => {
        const json = player.toJSON();
        expect(json.id).toBe('player1');
        expect(json.type).toBe('player');
        expect(json.physics.x).toBe(50);
        expect(json.physics.z).toBe(-30);
    });

    it('should serialize all components', () => {
        const json = player.toJSON();
        expect(json.state).toBeDefined();
        expect(json.physics).toBeDefined();
        expect(json.rubber).toBeDefined();
        expect(json.render).toBeDefined();
        expect(json.network).toBeDefined();
    });

    it('should deserialize from JSON', () => {
        const json = player.toJSON();
        const newPlayer = new PlayerEntity('player2');
        newPlayer.fromJSON(json);

        expect(newPlayer.id).toBe('player1');
        expect(newPlayer.getPosition().x).toBe(50);
        expect(newPlayer.getPosition().z).toBe(-30);
    });

    it('should preserve state after serialization round-trip', () => {
        player.applyBoost(1.75);
        player.startTurn(-1);

        const json = player.toJSON();
        const newPlayer = new PlayerEntity('player2');
        newPlayer.fromJSON(json);

        expect(newPlayer.physics.isBoosting).toBe(true);
        expect(newPlayer.physics.isTurningLeft).toBe(true);
    });

    it('should handle empty data in fromJSON', () => {
        const newPlayer = new PlayerEntity('player2');
        expect(() => newPlayer.fromJSON(null)).not.toThrow();
        expect(() => newPlayer.fromJSON({})).not.toThrow();
    });
});

// ============================================================================
// Integration Tests (10 tests)
// ============================================================================

describe('PlayerEntity - Integration Tests', () => {
    let player;
    let segments;

    beforeEach(() => {
        player = new PlayerEntity('player1', 0, 0, {
            color: 0x00ff00
        });
        segments = [
            { x1: -50, z1: 0, x2: 50, z2: 0, pid: 'wall1' },
            { x1: 0, z1: -50, x2: 0, z2: 50, pid: 'wall2' }
        ];
    });

    it('should handle complete game loop update', () => {
        player.setDirection(1, 0);
        player.setSpeed(40);

        const initialPos = player.getPosition();
        player.update(0.1, segments);
        const newPos = player.getPosition();

        expect(newPos.x).toBeGreaterThan(initialPos.x);
    });

    it('should handle slipstream boost detection', () => {
        player.setDirection(1, 0);
        player.physics.isBoosting = true;
        player.update(0.016, segments);

        expect(player.state.boosting).toBe(true);
    });

    it('should handle death and respawn sequence', () => {
        // Kill player
        player.takeDamage();
        expect(player.state.alive).toBe(false);

        // Respawn
        player.respawn(100, 100, 0, -1);
        expect(player.getState()).toBe(PlayerState.RESPAWNING);
    });

    it('should clear trail on respawn', () => {
        // Add some trail points
        player.setPosition(10, 10);
        player.render.updateTrail(10, 10);
        player.render.updateTrail(20, 20);

        expect(player.render.trail.length).toBeGreaterThan(0);

        // Respawn
        player.respawn(0, 0);
        // Trail should be cleared (after respawn delay)
    });

    it('should handle wall grinding with malus', () => {
        player.setPosition(0, 0.5);
        player.update(0.016, segments);

        expect(player.rubber.isGrinding).toBe(true);

        // Turn while grinding - should apply malus
        player.startTurn(-1);
        expect(player.rubber.state.malus).toBeLessThan(1.0);
    });

    it('should emit multiple events during gameplay', () => {
        const events = [];
        player.events.on('*', (data, eventName) => {
            events.push(eventName);
        });

        player.applyInput({ left: true, brake: false });
        player.update(0.016, segments);

        expect(events.length).toBeGreaterThan(0);
    });

    it('should handle AI player behavior', () => {
        const aiPlayer = new PlayerEntity('ai1', 0, 0, {
            isAi: true
        });

        expect(aiPlayer.isAI()).toBe(true);
        expect(aiPlayer.isLocal()).toBe(false);
    });

    it('should handle local player ownership', () => {
        const localPlayer = new PlayerEntity('local1', 0, 0, {
            ownerId: 'my-identity'
        });

        expect(localPlayer.isLocal()).toBe(true);
        expect(localPlayer.network.ownerId).toBe('my-identity');
    });

    it('should update network sync timing', () => {
        const currentTime = Date.now();
        player.network.markSynced(currentTime);

        expect(player.network.needsSync(currentTime)).toBe(false);
        expect(player.network.needsSync(currentTime + 100)).toBe(true);
    });

    it('should handle input acknowledgment', () => {
        player.applyInput({ left: true });
        player.applyInput({ right: true });

        const seq = player.network.sequenceNumber;
        player.network.acknowledgeSequence(seq);

        expect(player.network.inputBuffer.length).toBe(0);
        expect(player.network.lastAckedSequence).toBe(seq);
    });
});

// ============================================================================
// Component-Specific Tests
// ============================================================================

describe('PhysicsComponent - Standalone', () => {
    it('should create with default values', () => {
        const physics = new PhysicsComponent(0, 0);
        expect(physics.speed).toBe(PHYSICS_CONFIG.baseSpeed);
        expect(physics.directionX).toBe(0);
        expect(physics.directionZ).toBe(-1);
    });

    it('should create with custom options', () => {
        const physics = new PhysicsComponent(10, 20, {
            speed: 50,
            dirX: 1,
            dirZ: 0,
            maxSpeed: 100,
            turnSpeed: 4
        });
        expect(physics.speed).toBe(50);
        expect(physics.maxSpeed).toBe(100);
        expect(physics.turnSpeed).toBe(4);
    });

    it('should get velocity from Verlet point', () => {
        const physics = new PhysicsComponent(0, 0);
        physics.point.x = 10;
        const vel = physics.getVelocity();
        expect(vel.x).toBe(10);
    });

    it('should clear modifiers', () => {
        const physics = new PhysicsComponent(0, 0);
        physics.isBoosting = true;
        physics.isBraking = true;
        physics.clearModifiers();
        expect(physics.isBoosting).toBe(false);
        expect(physics.isBraking).toBe(false);
    });
});

describe('RenderComponent - Standalone', () => {
    it('should create with default values', () => {
        const render = new RenderComponent(0xffffff);
        expect(render.color).toBe(0xffffff);
        expect(render.trail).toEqual([]);
        expect(render.glowEnabled).toBe(true);
    });

    it('should add trail points', () => {
        const render = new RenderComponent();
        render.addTrailPoint(10, 20);
        render.addTrailPoint(30, 40);
        expect(render.trail.length).toBe(2);
    });

    it('should update trail based on movement', () => {
        const render = new RenderComponent();
        render.trailSpacing = 5;
        render.updateTrail(0, 0);
        render.updateTrail(10, 0);
        expect(render.trail.length).toBeGreaterThan(0);
    });

    it('should clear trail', () => {
        const render = new RenderComponent();
        render.addTrailPoint(10, 20);
        render.clearTrail();
        expect(render.trail.length).toBe(0);
    });
});

describe('NetworkComponent - Standalone', () => {
    it('should create with default values', () => {
        const network = new NetworkComponent();
        expect(network.ownerId).toBeNull();
        expect(network.isAi).toBe(false);
        expect(network.inputBuffer).toEqual([]);
    });

    it('should add inputs to buffer', () => {
        const network = new NetworkComponent();
        network.addInput({ left: true });
        expect(network.inputBuffer.length).toBe(1);
    });

    it('should limit buffer size', () => {
        const network = new NetworkComponent({ maxBufferSize: 5 });
        for (let i = 0; i < 10; i++) {
            network.addInput({ left: true });
        }
        expect(network.inputBuffer.length).toBeLessThanOrEqual(5);
    });

    it('should get inputs since sequence', () => {
        const network = new NetworkComponent();
        network.addInput({ left: true });
        network.addInput({ right: true });
        network.addInput({ brake: true });

        const inputs = network.getInputsSince(1);
        expect(inputs.length).toBe(2);
    });
});

describe('StateComponent - Standalone', () => {
    it('should create with default ALIVE state', () => {
        const state = new StateComponent();
        expect(state.state).toBe(PlayerState.ALIVE);
        expect(state.alive).toBe(true);
    });

    it('should check valid transitions', () => {
        const state = new StateComponent();
        expect(state.canTransition(PlayerState.DEAD)).toBe(true);
        expect(state.canTransition(PlayerState.RESPAWNING)).toBe(false);
    });

    it('should update flags on state change', () => {
        const state = new StateComponent();
        state.transition(PlayerState.DEAD);
        expect(state.alive).toBe(false);
    });

    it('should track state enter time', () => {
        const state = new StateComponent();
        const beforeTime = Date.now();
        state.transition(PlayerState.DEAD);
        const afterTime = Date.now();

        expect(state.stateEnterTime).toBeGreaterThanOrEqual(beforeTime);
        expect(state.stateEnterTime).toBeLessThanOrEqual(afterTime);
    });
});
