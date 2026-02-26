/**
 * PlayerEntity - Component-based player entity for Cyber Cycles
 *
 * Implements a component-based architecture for player entities with:
 * - Physics component (Verlet integration)
 * - Rubber component (wall grinding mechanics)
 * - Render component (visual representation)
 * - Network component (multiplayer sync with input buffering)
 * - State component (game state machine)
 *
 * @module PlayerEntity
 */

import { VerletPoint, integrate, applyVelocity, updatePosition } from '../physics/VerletIntegration.js';
import { RubberState, updateRubber, applyMalus, calculateEffectiveness, consumeRubber, regenerateRubber, isNearWall, calculateWallDistance } from '../physics/RubberSystem.js';
import { PHYSICS_CONFIG, GAME_CONFIG, COLLISION_CONFIG } from '../core/Config.js';
import { EventSystem } from '../core/EventSystem.js';
import { InputBuffer } from '../network/InputBuffer.js';

// ============================================================================
// State Machine Constants
// ============================================================================

/**
 * Player state enumeration
 * @enum {string}
 */
export const PlayerState = {
    ALIVE: 'ALIVE',
    DEAD: 'DEAD',
    RESPAWNING: 'RESPAWNING',
    BOOSTING: 'BOOSTING'
};

/**
 * Valid state transitions
 * @type {Map<string, string[]>}
 */
const STATE_TRANSITIONS = new Map([
    [PlayerState.ALIVE, [PlayerState.DEAD, PlayerState.BOOSTING]],
    [PlayerState.DEAD, [PlayerState.RESPAWNING, PlayerState.ALIVE]], // Allow direct ALIVE for immediate respawn
    [PlayerState.RESPAWNING, [PlayerState.ALIVE]],
    [PlayerState.BOOSTING, [PlayerState.ALIVE, PlayerState.DEAD]]
]);

// ============================================================================
// Component Classes
// ============================================================================

/**
 * PhysicsComponent - Handles position, velocity, and movement
 *
 * Uses Verlet integration for stable physics simulation.
 *
 * @class
 */
export class PhysicsComponent {
    /**
     * Create a PhysicsComponent
     * @param {number} x - Initial X position
     * @param {number} z - Initial Z position
     * @param {Object} options - Component options
     */
    constructor(x = 0, z = 0, options = {}) {
        /** @type {VerletPoint} Verlet integration point */
        this.point = new VerletPoint(x, 0, z, options.mass || 1.0);

        /** @type {number} Current speed (units/second) */
        this.speed = options.speed !== undefined ? options.speed : PHYSICS_CONFIG.baseSpeed;

        /** @type {number} Direction X component */
        this.directionX = options.dirX !== undefined ? options.dirX : 0;

        /** @type {number} Direction Z component */
        this.directionZ = options.dirZ !== undefined ? options.dirZ : -1;

        /** @type {number} Maximum speed */
        this.maxSpeed = options.maxSpeed || PHYSICS_CONFIG.boostSpeed;

        /** @type {number} Acceleration rate */
        this.acceleration = options.acceleration || PHYSICS_CONFIG.acceleration;

        /** @type {boolean} Is currently boosting */
        this.isBoosting = false;

        /** @type {boolean} Is currently braking */
        this.isBraking = false;

        /** @type {boolean} Is turning left */
        this.isTurningLeft = false;

        /** @type {boolean} Is turning right */
        this.isTurningRight = false;

        /** @type {number} Turn speed (radians/second) */
        this.turnSpeed = options.turnSpeed || PHYSICS_CONFIG.turnSpeed;
    }

    /**
     * Get current position
     * @returns {{x: number, z: number}}
     */
    getPosition() {
        return { x: this.point.x, z: this.point.z };
    }

    /**
     * Get current velocity
     * @returns {{x: number, z: number}}
     */
    getVelocity() {
        return {
            x: this.point.x - this.point.prevX,
            z: this.point.z - this.point.prevZ
        };
    }

    /**
     * Set position directly
     * @param {number} x - X position
     * @param {number} z - Z position
     */
    setPosition(x, z) {
        updatePosition(this.point, x, z, true);
    }

    /**
     * Set direction
     * @param {number} dirX - Direction X
     * @param {number} dirZ - Direction Z
     */
    setDirection(dirX, dirZ) {
        const len = Math.sqrt(dirX * dirX + dirZ * dirZ);
        if (len > 0.0001) {
            this.directionX = dirX / len;
            this.directionZ = dirZ / len;
        }
    }

    /**
     * Get current direction as normalized vector
     * @returns {{x: number, z: number}}
     */
    getDirection() {
        return { x: this.directionX, z: this.directionZ };
    }

    /**
     * Set speed
     * @param {number} speed - Speed value
     */
    setSpeed(speed) {
        this.speed = Math.max(0, Math.min(this.maxSpeed, speed));
    }

    /**
     * Apply boost
     * @param {number} boostAmount - Boost multiplier
     */
    applyBoost(boostAmount) {
        this.isBoosting = true;
        this.speed = Math.min(this.maxSpeed, this.speed * boostAmount);
    }

    /**
     * Apply brake
     * @param {number} brakeAmount - Brake multiplier
     */
    applyBrake(brakeAmount) {
        this.isBraking = true;
        this.speed = Math.max(PHYSICS_CONFIG.brakeSpeed, this.speed * brakeAmount);
    }

    /**
     * Clear boost/brake state
     */
    clearModifiers() {
        this.isBoosting = false;
        this.isBraking = false;
    }

    /**
     * Update physics for this frame
     * @param {number} dt - Delta time
     */
    update(dt) {
        // Apply turning rotation when flags are set
        if (this.isTurningLeft || this.isTurningRight) {
            const turnAmount = this.turnSpeed * dt;
            const turnDir = this.isTurningLeft ? -1 : 1;
            const angle = turnDir * turnAmount;
            
            // Rotate direction vector using 2D rotation matrix
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const newDirX = this.directionX * cos + this.directionZ * sin;
            const newDirZ = -this.directionX * sin + this.directionZ * cos;
            
            this.directionX = newDirX;
            this.directionZ = newDirZ;
        }
        
        // Apply velocity based on direction and speed
        const vx = this.directionX * this.speed;
        const vz = this.directionZ * this.speed;
        applyVelocity(this.point, vx, vz, dt);

        // Integrate Verlet point
        integrate(this.point, dt, PHYSICS_CONFIG.damping);
    }

    /**
     * Serialize to JSON
     * @returns {Object}
     */
    toJSON() {
        return {
            x: this.point.x,
            z: this.point.z,
            speed: this.speed,
            directionX: this.directionX,
            directionZ: this.directionZ,
            isBoosting: this.isBoosting,
            isBraking: this.isBraking,
            isTurningLeft: this.isTurningLeft,
            isTurningRight: this.isTurningRight
        };
    }

    /**
     * Deserialize from JSON
     * @param {Object} data - JSON data
     */
    fromJSON(data) {
        if (data.x !== undefined) this.point.x = data.x;
        if (data.z !== undefined) this.point.z = data.z;
        if (data.speed !== undefined) this.speed = data.speed;
        if (data.directionX !== undefined) this.directionX = data.directionX;
        if (data.directionZ !== undefined) this.directionZ = data.directionZ;
        if (data.isBoosting !== undefined) this.isBoosting = data.isBoosting;
        if (data.isBraking !== undefined) this.isBraking = data.isBraking;
        if (data.isTurningLeft !== undefined) this.isTurningLeft = data.isTurningLeft;
        if (data.isTurningRight !== undefined) this.isTurningRight = data.isTurningRight;
    }
}

/**
 * RubberComponent - Handles wall grinding mechanics
 *
 * Manages rubber state for precision wall grinding.
 *
 * @class
 */
export class RubberComponent {
    /**
     * Create a RubberComponent
     * @param {string} playerId - Player ID
     * @param {Object} options - Component options
     */
    constructor(playerId, options = {}) {
        /** @type {RubberState} Rubber state */
        this.state = new RubberState(
            playerId,
            options.baseRubber || 1.0,
            options.serverRubber || 3.0
        );

        /** @type {boolean} Is currently grinding */
        this.isGrinding = false;

        /** @type {number} Current wall distance */
        this.wallDistance = Infinity;

        /** @type {number} Rubber effectiveness */
        this.effectiveness = 1.0;

        /** @type {number} Rubber consumed this frame */
        this.rubberConsumed = 0;

        /** @type {Object} Rubber configuration */
        this.config = options.rubberConfig || null;
    }

    /**
     * Update rubber for this frame
     * @param {number} dt - Delta time
     * @param {Array} segments - Trail segments for wall detection
     * @param {Object} player - Player reference for position
     */
    update(dt, segments, player) {
        if (!segments || segments.length === 0) {
            this.isGrinding = false;
            this.wallDistance = Infinity;
            this.effectiveness = calculateEffectiveness(this.state);
            regenerateRubber(this.state, dt, this.config?.regenRate || 0.5, false);
            return;
        }

        // Calculate wall distance
        this.wallDistance = calculateWallDistance(player, segments);
        this.isGrinding = isNearWall(player, segments, this.config?.detectionRadius || 10.0);

        // Update rubber state
        updateRubber(this.state, dt, this.config, this.isGrinding);

        // Regenerate if not near wall and no malus
        if (!this.isGrinding && this.state.malusTimer <= 0) {
            regenerateRubber(this.state, dt, this.config?.regenRate || 0.5, false);
        }

        this.effectiveness = calculateEffectiveness(this.state);
        this.rubberConsumed = 0;
    }

    /**
     * Apply malus after turning
     */
    applyMalus() {
        const config = this.config || {};
        applyMalus(
            this.state,
            config.malusDuration || 0.5,
            config.malusFactor || 0.3
        );
    }

    /**
     * Consume rubber for collision avoidance
     * @param {number} amount - Amount to consume
     * @returns {boolean} Success
     */
    consumeRubber(amount) {
        const success = consumeRubber(this.state, amount);
        if (success) {
            this.rubberConsumed += amount;
        }
        return success;
    }

    /**
     * Get current rubber level
     * @returns {number}
     */
    getRubber() {
        return this.state.rubber;
    }

    /**
     * Get current effectiveness
     * @returns {number}
     */
    getEffectiveness() {
        return this.effectiveness;
    }

    /**
     * Serialize to JSON
     * @returns {Object}
     */
    toJSON() {
        return {
            rubber: this.state.rubber,
            maxRubber: this.state.maxRubber,
            serverRubber: this.state.serverRubber,
            malus: this.state.malus,
            malusTimer: this.state.malusTimer,
            effectiveness: this.effectiveness,
            isGrinding: this.isGrinding,
            wallDistance: this.wallDistance
        };
    }

    /**
     * Deserialize from JSON
     * @param {Object} data - JSON data
     */
    fromJSON(data) {
        if (data.rubber !== undefined) this.state.rubber = data.rubber;
        if (data.maxRubber !== undefined) this.state.maxRubber = data.maxRubber;
        if (data.serverRubber !== undefined) this.state.serverRubber = data.serverRubber;
        if (data.malus !== undefined) this.state.malus = data.malus;
        if (data.malusTimer !== undefined) this.state.malusTimer = data.malusTimer;
        if (data.effectiveness !== undefined) this.effectiveness = data.effectiveness;
        if (data.isGrinding !== undefined) this.isGrinding = data.isGrinding;
        if (data.wallDistance !== undefined) this.wallDistance = data.wallDistance;
    }
}

/**
 * RenderComponent - Handles visual representation
 *
 * Manages color, mesh, trail, and glow effects.
 *
 * @class
 */
export class RenderComponent {
    /**
     * Create a RenderComponent
     * @param {number} color - Color value (hex)
     * @param {Object} options - Component options
     */
    constructor(color = 0xffffff, options = {}) {
        /** @type {number} Color value */
        this.color = color;

        /** @type {Object|null} Three.js mesh reference */
        this.mesh = null;

        /** @type {Array} Trail points for rendering */
        this.trail = [];

        /** @type {Object|null} Glow sprite reference */
        this.glow = null;

        /** @type {boolean} Enable glow effect */
        this.glowEnabled = options.glowEnabled !== false;

        /** @type {number} Glow intensity */
        this.glowIntensity = options.glowIntensity || 0.4;

        /** @type {number} Trail max length */
        this.maxTrailLength = options.maxTrailLength || COLLISION_CONFIG.maxTrailLength;

        /** @type {number} Trail spacing */
        this.trailSpacing = options.trailSpacing || COLLISION_CONFIG.trailSpacing;

        /** @type {Object} Last trail point */
        this.lastTrailPoint = { x: 0, z: 0 };

        /** @type {number} Distance since last trail point */
        this.distanceSinceLastPoint = 0;
    }

    /**
     * Add trail point
     * @param {number} x - X position
     * @param {number} z - Z position
     */
    addTrailPoint(x, z) {
        this.trail.push({ x, z });

        // Manage trail length
        while (this.trail.length > 2 && this.distanceSinceLastPoint >= this.maxTrailLength) {
            this.trail.shift();
        }
    }

    /**
     * Update trail based on movement
     * @param {number} x - Current X
     * @param {number} z - Current Z
     */
    updateTrail(x, z) {
        const dx = x - this.lastTrailPoint.x;
        const dz = z - this.lastTrailPoint.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        this.distanceSinceLastPoint += dist;

        if (this.distanceSinceLastPoint >= this.trailSpacing) {
            this.addTrailPoint(x, z);
            this.lastTrailPoint = { x, z };
            this.distanceSinceLastPoint = 0;
        }
    }

    /**
     * Clear trail
     */
    clearTrail() {
        this.trail = [];
        this.distanceSinceLastPoint = 0;
    }

    /**
     * Set color
     * @param {number} color - New color
     */
    setColor(color) {
        this.color = color;
        if (this.mesh) {
            this.mesh.material.color.setHex(color);
            this.mesh.material.emissive.setHex(color);
        }
    }

    /**
     * Serialize to JSON
     * @returns {Object}
     */
    toJSON() {
        return {
            color: this.color,
            trail: [...this.trail],
            glowEnabled: this.glowEnabled,
            glowIntensity: this.glowIntensity,
            maxTrailLength: this.maxTrailLength
        };
    }

    /**
     * Deserialize from JSON
     * @param {Object} data - JSON data
     */
    fromJSON(data) {
        if (data.color !== undefined) this.color = data.color;
        if (data.trail !== undefined) this.trail = [...data.trail];
        if (data.glowEnabled !== undefined) this.glowEnabled = data.glowEnabled;
        if (data.glowIntensity !== undefined) this.glowIntensity = data.glowIntensity;
        if (data.maxTrailLength !== undefined) this.maxTrailLength = data.maxTrailLength;
    }
}

/**
 * NetworkComponent - Handles multiplayer synchronization
 *
 * Manages ownership, AI status, and input buffering with InputBuffer
 * for client-side prediction and lag compensation.
 *
 * @class
 */
export class NetworkComponent {
    /**
     * Create a NetworkComponent
     * @param {Object} options - Component options
     */
    constructor(options = {}) {
        /** @type {string|null} Owner ID */
        this.ownerId = options.ownerId || null;

        /** @type {boolean} Is AI controlled */
        this.isAi = options.isAi || false;

        /** @type {number} Last sync timestamp */
        this.lastSync = 0;

        /** @type {number} Sync interval */
        this.syncInterval = options.syncInterval || 0.05; // 50ms

        /** @type {InputBuffer} Input buffer for prediction */
        this.inputBuffer = new InputBuffer({
            maxBufferSize: options.maxBufferSize || 60,
            maxAge: options.maxAge || 200
        });

        /** @type {number} Last acknowledged sequence */
        this.lastAckedSequence = 0;

        /** @type {Object|null} Last server state for reconciliation */
        this.lastServerState = null;
    }

    /**
     * Add input to buffer with sequence number
     * @param {Object} input - Input data
     * @param {number} [timestamp] - Optional timestamp (defaults to Date.now())
     * @returns {number} Sequence number
     */
    addInput(input, timestamp) {
        const ts = timestamp || Date.now();
        const sequence = this.inputBuffer.addInput(ts, input);
        return sequence;
    }

    /**
     * Get inputs since sequence
     * @param {number} sinceSequence - Sequence number
     * @returns {Array}
     */
    getInputsSince(sinceSequence) {
        return this.inputBuffer.getInputsSince(sinceSequence);
    }

    /**
     * Get specific input by sequence
     * @param {number} sequenceNumber - Sequence number
     * @returns {Object|null}
     */
    getInput(sequenceNumber) {
        return this.inputBuffer.getInput(sequenceNumber);
    }

    /**
     * Get all unacknowledged inputs
     * @returns {Array}
     */
    getUnacknowledgedInputs() {
        return this.inputBuffer.getUnacknowledgedInputs();
    }

    /**
     * Acknowledge sequence
     * @param {number} sequence - Sequence to acknowledge
     * @returns {Array} Acknowledged inputs
     */
    acknowledgeSequence(sequence) {
        const acknowledged = this.inputBuffer.acknowledgeSequence(sequence);
        this.lastAckedSequence = sequence;
        return acknowledged;
    }

    /**
     * Reconcile with server state
     * @param {number} serverSequence - Server's last processed sequence
     * @param {Object} serverState - Server authoritative state
     * @returns {Object} Reconciliation result
     */
    reconcile(serverSequence, serverState) {
        this.lastServerState = serverState;
        return this.inputBuffer.reconcile(serverSequence, serverState);
    }

    /**
     * Get next sequence number
     * @returns {number}
     */
    getNextSequenceNumber() {
        return this.inputBuffer.getNextSequenceNumber();
    }

    /**
     * Get current sequence number
     * @returns {number}
     */
    getCurrentSequence() {
        return this.inputBuffer.getCurrentSequence();
    }

    /**
     * Get buffer size
     * @returns {number}
     */
    getBufferSize() {
        return this.inputBuffer.size();
    }

    /**
     * Clear old inputs
     * @param {number} currentTime - Current timestamp
     * @returns {number} Number of inputs removed
     */
    clearOldInputs(currentTime) {
        return this.inputBuffer.clearOldInputs(currentTime);
    }

    /**
     * Check if sync is needed
     * @param {number} currentTime - Current time
     * @returns {boolean}
     */
    needsSync(currentTime) {
        return currentTime - this.lastSync >= this.syncInterval;
    }

    /**
     * Mark as synced
     * @param {number} currentTime - Current time
     */
    markSynced(currentTime) {
        this.lastSync = currentTime;
    }

    /**
     * Clear all inputs
     */
    clearInputs() {
        this.inputBuffer.clear();
    }

    /**
     * Get buffer usage percentage
     * @returns {number}
     */
    getBufferUsage() {
        return this.inputBuffer.getBufferUsage();
    }

    /**
     * Serialize to JSON
     * @returns {Object}
     */
    toJSON() {
        return {
            ownerId: this.ownerId,
            isAi: this.isAi,
            lastSync: this.lastSync,
            lastAckedSequence: this.lastAckedSequence,
            currentSequence: this.getCurrentSequence(),
            bufferSize: this.getBufferSize()
        };
    }

    /**
     * Deserialize from JSON
     * @param {Object} data - JSON data
     */
    fromJSON(data) {
        if (data.ownerId !== undefined) this.ownerId = data.ownerId;
        if (data.isAi !== undefined) this.isAi = data.isAi;
        if (data.lastSync !== undefined) this.lastSync = data.lastSync;
        if (data.lastAckedSequence !== undefined) this.lastAckedSequence = data.lastAckedSequence;
    }
}

/**
 * StateComponent - Handles game state machine
 *
 * Manages player state with validation and callbacks.
 *
 * @class
 */
export class StateComponent {
    /**
     * Create a StateComponent
     * @param {Object} options - Component options
     */
    constructor(options = {}) {
        /** @type {PlayerState} Current state */
        this.state = PlayerState.ALIVE;

        /** @type {boolean} Is alive */
        this.alive = true;

        /** @type {boolean} Is ready to play */
        this.ready = false;

        /** @type {boolean} Is boosting */
        this.boosting = false;

        /** @type {boolean} Is braking */
        this.braking = false;

        /** @type {boolean} Is turning */
        this.turning = false;

        /** @type {Map} State enter callbacks */
        this.onEnterCallbacks = new Map();

        /** @type {Map} State exit callbacks */
        this.onExitCallbacks = new Map();

        /** @type {number} State enter time */
        this.stateEnterTime = 0;

        /** @type {number} Time in current state */
        this.stateTime = 0;
    }

    /**
     * Register enter callback
     * @param {PlayerState} state - State to register for
     * @param {Function} callback - Callback function
     */
    onEnter(state, callback) {
        this.onEnterCallbacks.set(state, callback);
    }

    /**
     * Register exit callback
     * @param {PlayerState} state - State to register for
     * @param {Function} callback - Callback function
     */
    onExit(state, callback) {
        this.onExitCallbacks.set(state, callback);
    }

    /**
     * Check if transition is valid
     * @param {PlayerState} newState - Target state
     * @returns {boolean}
     */
    canTransition(newState) {
        const validTransitions = STATE_TRANSITIONS.get(this.state);
        return validTransitions?.includes(newState) || false;
    }

    /**
     * Transition to new state
     * @param {PlayerState} newState - Target state
     * @param {Object} data - Transition data
     * @returns {boolean} Success
     */
    transition(newState, data = {}) {
        if (!this.canTransition(newState)) {
            console.warn(`Invalid state transition: ${this.state} -> ${newState}`);
            return false;
        }

        // Call exit callback
        const exitCallback = this.onExitCallbacks.get(this.state);
        if (exitCallback) {
            exitCallback(this.state, data);
        }

        const oldState = this.state;
        this.state = newState;
        this.stateEnterTime = Date.now();
        this.stateTime = 0;

        // Update derived flags
        this._updateFlags();

        // Call enter callback
        const enterCallback = this.onEnterCallbacks.get(newState);
        if (enterCallback) {
            enterCallback(newState, data);
        }

        return true;
    }

    /**
     * Update derived flags based on state
     * @private
     */
    _updateFlags() {
        this.alive = this.state === PlayerState.ALIVE || this.state === PlayerState.BOOSTING;
        this.boosting = this.state === PlayerState.BOOSTING;
    }

    /**
     * Set alive status
     * @param {boolean} alive - Is alive
     */
    setAlive(alive) {
        if (alive && !this.alive) {
            this.transition(PlayerState.ALIVE);
        } else if (!alive && this.alive) {
            this.transition(PlayerState.DEAD);
        }
        this.alive = alive;
    }

    /**
     * Set ready status
     * @param {boolean} ready - Is ready
     */
    setReady(ready) {
        this.ready = ready;
    }

    /**
     * Set boosting status
     * @param {boolean} boosting - Is boosting
     */
    setBoosting(boosting) {
        if (boosting && !this.boosting) {
            this.transition(PlayerState.BOOSTING);
        } else if (!boosting && this.boosting) {
            this.transition(PlayerState.ALIVE);
        }
        this.boosting = boosting;
    }

    /**
     * Set braking status
     * @param {boolean} braking - Is braking
     */
    setBraking(braking) {
        this.braking = braking;
    }

    /**
     * Set turning status
     * @param {boolean} turning - Is turning
     */
    setTurning(turning) {
        this.turning = turning;
    }

    /**
     * Update state timer
     * @param {number} dt - Delta time
     */
    update(dt) {
        this.stateTime += dt;
    }

    /**
     * Serialize to JSON
     * @returns {Object}
     */
    toJSON() {
        return {
            state: this.state,
            alive: this.alive,
            ready: this.ready,
            boosting: this.boosting,
            braking: this.braking,
            turning: this.turning,
            stateTime: this.stateTime
        };
    }

    /**
     * Deserialize from JSON
     * @param {Object} data - JSON data
     */
    fromJSON(data) {
        if (data.state !== undefined) {
            this.state = data.state;
            this._updateFlags();
        }
        if (data.alive !== undefined) this.alive = data.alive;
        if (data.ready !== undefined) this.ready = data.ready;
        if (data.boosting !== undefined) this.boosting = data.boosting;
        if (data.braking !== undefined) this.braking = data.braking;
        if (data.turning !== undefined) this.turning = data.turning;
        if (data.stateTime !== undefined) this.stateTime = data.stateTime;
    }
}

// ============================================================================
// PlayerEntity Class
// ============================================================================

/**
 * PlayerEntity - Main player entity class
 *
 * Component-based entity for Cyber Cycles players.
 * Combines physics, rubber, render, network, and state components.
 *
 * @class
 */
export class PlayerEntity {
    /**
     * Create a PlayerEntity
     * @param {string} id - Unique player ID
     * @param {number} x - Initial X position
     * @param {number} z - Initial Z position
     * @param {Object} options - Entity options
     */
    constructor(id, x = 0, z = 0, options = {}) {
        /** @type {string} Unique player ID */
        this.id = id;

        /** @type {string} Entity type */
        this.type = 'player';

        /** @type {EventSystem} Event emitter */
        this.events = new EventSystem();

        // Create components
        /** @type {PhysicsComponent} Physics component */
        this.physics = new PhysicsComponent(x, z, {
            speed: options.speed,
            dirX: options.dirX,
            dirZ: options.dirZ,
            maxSpeed: options.maxSpeed,
            turnSpeed: options.turnSpeed
        });

        /** @type {RubberComponent} Rubber component */
        this.rubber = new RubberComponent(id, {
            baseRubber: options.baseRubber,
            serverRubber: options.serverRubber,
            rubberConfig: options.rubberConfig
        });

        /** @type {RenderComponent} Render component */
        this.render = new RenderComponent(options.color || 0xffffff, {
            glowEnabled: options.glowEnabled,
            glowIntensity: options.glowIntensity,
            maxTrailLength: options.maxTrailLength,
            trailSpacing: options.trailSpacing
        });

        /** @type {NetworkComponent} Network component */
        this.network = new NetworkComponent({
            ownerId: options.ownerId,
            isAi: options.isAi,
            syncInterval: options.syncInterval
        });

        /** @type {StateComponent} State component */
        this.state = new StateComponent();

        // Setup state callbacks
        this._setupStateCallbacks();

        // Initialize direction if not set
        if (options.dirX === undefined && options.dirZ === undefined) {
            this.physics.setDirection(0, -1);
        }

        // Turn points for trail rendering
        /** @type {Array} Turn points */
        this.turnPoints = [];
    }

    /**
     * Setup state machine callbacks
     * @private
     */
    _setupStateCallbacks() {
        // State enter callbacks
        this.state.onEnter(PlayerState.ALIVE, (state, data) => {
            this.events.emit('state:alive', { playerId: this.id, ...data });
        });

        this.state.onEnter(PlayerState.DEAD, (state, data) => {
            this.events.emit('state:dead', { playerId: this.id, ...data });
        });

        this.state.onEnter(PlayerState.RESPAWNING, (state, data) => {
            this.events.emit('state:respawning', { playerId: this.id, ...data });
        });

        this.state.onEnter(PlayerState.BOOSTING, (state, data) => {
            this.events.emit('state:boosting', { playerId: this.id, ...data });
        });

        // State exit callbacks
        this.state.onExit(PlayerState.ALIVE, (state, data) => {
            this.events.emit('state:exit:alive', { playerId: this.id, ...data });
        });

        this.state.onExit(PlayerState.DEAD, (state, data) => {
            this.events.emit('state:exit:dead', { playerId: this.id, ...data });
        });

        this.state.onExit(PlayerState.RESPAWNING, (state, data) => {
            this.events.emit('state:exit:respawning', { playerId: this.id, ...data });
        });

        this.state.onExit(PlayerState.BOOSTING, (state, data) => {
            this.events.emit('state:exit:boosting', { playerId: this.id, ...data });
        });
    }

    /**
     * Get current state
     * @returns {PlayerState}
     */
    getState() {
        return this.state.state;
    }

    /**
     * Update all components
     * @param {number} dt - Delta time in seconds
     * @param {Array} segments - Trail segments for collision/rubber
     */
    update(dt, segments = []) {
        if (!this.state.alive || this.state.state === PlayerState.RESPAWNING) {
            return;
        }

        // Update state timer
        this.state.update(dt);

        // Update physics
        this.physics.update(dt);

        // Update rubber
        this.rubber.update(dt, segments, this.physics.point);

        // Update trail
        const pos = this.physics.getPosition();
        this.render.updateTrail(pos.x, pos.z);

        // Update boost state based on physics
        this.state.setBoosting(this.physics.isBoosting);
        this.state.setBraking(this.physics.isBraking);
        this.state.setTurning(this.physics.isTurningLeft || this.physics.isTurningRight);

        // Emit rubber events
        if (this.rubber.isGrinding) {
            this.events.emit('rubber:grinding', {
                playerId: this.id,
                effectiveness: this.rubber.effectiveness,
                wallDistance: this.rubber.wallDistance
            });
        }
    }

    /**
     * Apply player input
     * @param {Object} input - Input data
     * @param {boolean} input.left - Turn left
     * @param {boolean} input.right - Turn right
     * @param {boolean} input.brake - Brake
     * @param {boolean} input.boost - Boost (if available)
     * @returns {number} Sequence number of the buffered input
     */
    applyInput(input) {
        if (!this.state.alive) return -1;

        const dt = PHYSICS_CONFIG.fixedTimeStep;

        // Handle turning
        if (input.left) {
            this.startTurn(-1);
        } else if (input.right) {
            this.startTurn(1);
        } else {
            this.stopTurn();
        }

        // Handle braking
        if (input.brake) {
            this.applyBrake(1);
        } else {
            this.physics.isBraking = false;
            if (!this.physics.isBoosting) {
                this.physics.setSpeed(PHYSICS_CONFIG.baseSpeed);
            }
        }

        // Add input to network buffer with sequence number
        const sequence = this.network.addInput({
            left: input.left || false,
            right: input.right || false,
            brake: input.brake || false,
            boost: input.boost || false
        });

        return sequence;
    }

    /**
     * Set position
     * @param {number} x - X position
     * @param {number} z - Z position
     */
    setPosition(x, z) {
        this.physics.setPosition(x, z);
        this.events.emit('position:changed', { x, z, playerId: this.id });
    }

    /**
     * Set direction
     * @param {number} dirX - Direction X
     * @param {number} dirZ - Direction Z
     */
    setDirection(dirX, dirZ) {
        this.physics.setDirection(dirX, dirZ);
        this.events.emit('direction:changed', {
            dirX,
            dirZ,
            playerId: this.id
        });
    }

    /**
     * Set speed
     * @param {number} speed - Speed value
     */
    setSpeed(speed) {
        this.physics.setSpeed(speed);
        this.events.emit('speed:changed', { speed, playerId: this.id });
    }

    /**
     * Apply slipstream boost
     * @param {number} boostAmount - Boost multiplier (default: 1.75)
     */
    applyBoost(boostAmount = 1.75) {
        if (!this.state.alive) return;

        this.physics.applyBoost(boostAmount);
        this.state.setBoosting(true);
        this.events.emit('boost:applied', {
            boostAmount,
            speed: this.physics.speed,
            playerId: this.id
        });
    }

    /**
     * Apply braking
     * @param {number} brakeAmount - Brake multiplier (default: 0.5)
     */
    applyBrake(brakeAmount = 0.5) {
        if (!this.state.alive) return;

        this.physics.applyBrake(brakeAmount);
        this.state.setBraking(true);
        this.events.emit('brake:applied', {
            brakeAmount,
            speed: this.physics.speed,
            playerId: this.id
        });
    }

    /**
     * Start turning
     * @param {number} direction - -1 for left, 1 for right
     */
    startTurn(direction) {
        if (!this.state.alive) return;

        const wasTurning = this.physics.isTurningLeft || this.physics.isTurningRight;

        this.physics.isTurningLeft = direction < 0;
        this.physics.isTurningRight = direction > 0;

        // Apply rubber malus if starting a new turn while grinding
        if (!wasTurning && this.rubber.isGrinding) {
            this.rubber.applyMalus();
            this.events.emit('rubber:malus', {
                playerId: this.id,
                malus: this.rubber.state.malus,
                duration: this.rubber.state.malusTimer
            });
        }

        // Apply turn penalty to speed
        const penalty = PHYSICS_CONFIG.turnPenalty;
        this.physics.setSpeed(this.physics.speed * (1 - penalty));

        this.events.emit('turn:started', {
            direction: direction < 0 ? 'left' : 'right',
            playerId: this.id
        });
    }

    /**
     * Stop turning
     */
    stopTurn() {
        if (!this.physics.isTurningLeft && !this.physics.isTurningRight) return;

        this.physics.isTurningLeft = false;
        this.physics.isTurningRight = false;

        this.events.emit('turn:stopped', { playerId: this.id });
    }

    /**
     * Handle collision/death
     */
    takeDamage() {
        if (!this.state.alive) return;

        this.state.setAlive(false);
        this.physics.clearModifiers();
        this.stopTurn();

        this.events.emit('player:damage', { playerId: this.id });
        this.events.emit('player:death', { playerId: this.id });
    }

    /**
     * Respawn player
     * @param {number} x - Spawn X position
     * @param {number} z - Spawn Z position
     * @param {number} dirX - Spawn direction X
     * @param {number} dirZ - Spawn direction Z
     */
    respawn(x, z, dirX = 0, dirZ = -1) {
        // Transition to respawning state
        this.state.transition(PlayerState.RESPAWNING);

        // Reset components
        this.physics.setPosition(x, z);
        this.physics.setDirection(dirX, dirZ);
        this.physics.setSpeed(PHYSICS_CONFIG.baseSpeed);
        this.physics.clearModifiers();
        this.stopTurn();

        this.render.clearTrail();
        this.turnPoints = [];

        this.rubber.state.reset();

        // Clear input buffer on respawn
        this.network.clearInputs();

        // Transition to alive after delay
        setTimeout(() => {
            this.state.transition(PlayerState.ALIVE);
            this.events.emit('player:respawn', {
                playerId: this.id,
                x,
                z,
                dirX,
                dirZ
            });
        }, GAME_CONFIG.respawnDelay * 1000);
    }

    // =========================================================================
    // Network Prediction and Reconciliation Methods
    // =========================================================================

    /**
     * Reconcile with server state for client-side prediction
     * @param {number} serverSequence - Server's last processed sequence number
     * @param {Object} serverState - Server authoritative state
     * @returns {Object} Reconciliation result with inputs to replay
     */
    reconcileWithServer(serverSequence, serverState) {
        // Perform reconciliation
        const result = this.network.reconcile(serverSequence, serverState);

        // Apply server state if provided
        if (serverState && serverState.position) {
            // Store the server state for potential replay
            this._lastServerState = {
                ...serverState,
                sequence: serverSequence
            };
        }

        // Emit reconciliation event
        this.events.emit('network:reconcile', {
            playerId: this.id,
            serverSequence,
            acknowledgedCount: result.acknowledgedCount,
            replayCount: result.replayCount
        });

        return result;
    }

    /**
     * Replay inputs after reconciliation
     * @param {Array} inputs - Inputs to replay
     * @returns {Array} Results of replayed inputs
     */
    replayInputs(inputs) {
        const results = [];

        for (const input of inputs) {
            // Apply input without re-buffering
            this._applyInputWithoutBuffering(input);
            results.push({
                sequence: input.sequence,
                applied: true
            });
        }

        return results;
    }

    /**
     * Apply input without buffering (for replay)
     * @param {Object} input - Input data
     * @private
     */
    _applyInputWithoutBuffering(input) {
        if (!this.state.alive) return;

        // Handle turning
        if (input.left) {
            this.startTurn(-1);
        } else if (input.right) {
            this.startTurn(1);
        } else {
            this.stopTurn();
        }

        // Handle braking
        if (input.brake) {
            this.applyBrake(1);
        } else {
            this.physics.isBraking = false;
            if (!this.physics.isBoosting) {
                this.physics.setSpeed(PHYSICS_CONFIG.baseSpeed);
            }
        }
    }

    /**
     * Get unacknowledged inputs for sending to server
     * @returns {Array} Array of unacknowledged inputs
     */
    getUnacknowledgedInputs() {
        return this.network.getUnacknowledgedInputs();
    }

    /**
     * Acknowledge inputs up to sequence
     * @param {number} sequence - Sequence number to acknowledge
     * @returns {Array} Acknowledged inputs
     */
    acknowledgeInputs(sequence) {
        return this.network.acknowledgeSequence(sequence);
    }

    /**
     * Get current input sequence number
     * @returns {number}
     */
    getCurrentSequence() {
        return this.network.getCurrentSequence();
    }

    /**
     * Get last acknowledged sequence
     * @returns {number}
     */
    getLastAcknowledgedSequence() {
        return this.network.lastAckedSequence;
    }

    /**
     * Get buffer usage percentage
     * @returns {number}
     */
    getInputBufferUsage() {
        return this.network.getBufferUsage();
    }

    /**
     * Clear old inputs from buffer
     * @param {number} currentTime - Current timestamp
     * @returns {number} Number of inputs removed
     */
    clearOldInputs(currentTime) {
        return this.network.clearOldInputs(currentTime);
    }

    /**
     * Serialize entity for network
     * @returns {Object} Serialized data
     */
    toJSON() {
        const pos = this.physics.getPosition();
        return {
            id: this.id,
            type: this.type,
            state: this.state.toJSON(),
            physics: {
                ...this.physics.toJSON(),
                x: pos.x,
                z: pos.z
            },
            rubber: this.rubber.toJSON(),
            render: this.render.toJSON(),
            network: this.network.toJSON(),
            turnPoints: this.turnPoints
        };
    }

    /**
     * Deserialize entity from network
     * @param {Object} data - Serialized data
     */
    fromJSON(data) {
        if (!data) return;

        if (data.id !== undefined) this.id = data.id;
        if (data.type !== undefined) this.type = data.type;

        if (data.state !== undefined) {
            this.state.fromJSON(data.state);
        }

        if (data.physics !== undefined) {
            this.physics.fromJSON(data.physics);
        }

        if (data.rubber !== undefined) {
            this.rubber.fromJSON(data.rubber);
        }

        if (data.render !== undefined) {
            this.render.fromJSON(data.render);
        }

        if (data.network !== undefined) {
            this.network.fromJSON(data.network);
        }

        if (data.turnPoints !== undefined) {
            this.turnPoints = data.turnPoints;
        }
    }

    /**
     * Get player position
     * @returns {{x: number, z: number}}
     */
    getPosition() {
        return this.physics.getPosition();
    }

    /**
     * Get player direction
     * @returns {{x: number, z: number}}
     */
    getDirection() {
        return {
            x: this.physics.directionX,
            z: this.physics.directionZ
        };
    }

    /**
     * Get player speed
     * @returns {number}
     */
    getSpeed() {
        return this.physics.speed;
    }

    /**
     * Check if player is AI
     * @returns {boolean}
     */
    isAI() {
        return this.network.isAi;
    }

    /**
     * Check if player is local
     * @returns {boolean}
     */
    isLocal() {
        return this.network.ownerId !== null;
    }

    /**
     * Get color
     * @returns {number}
     */
    getColor() {
        return this.render.color;
    }

    /**
     * Set color
     * @param {number} color - New color
     */
    setColor(color) {
        this.render.setColor(color);
    }
}

// ============================================================================
// Default Export
// ============================================================================

export default {
    PlayerEntity,
    PlayerState,
    PhysicsComponent,
    RubberComponent,
    RenderComponent,
    NetworkComponent,
    StateComponent
};
