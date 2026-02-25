/**
 * Verlet Integration Physics Module for Cyber Cycles
 *
 * Implements stable Verlet integration for physics simulation.
 * Verlet integration is numerically stable and energy-conserving,
 * making it ideal for game physics where stability is more important
 * than perfect accuracy.
 *
 * Key Features:
 * - Position-based integration (no explicit velocity storage)
 * - Natural handling of constraints
 * - Stable under large time steps
 * - Time-reversible (symplectic integrator)
 *
 * @module VerletIntegration
 */

// ============================================================================
// VerletPoint Class
// ============================================================================

/**
 * VerletPoint - A point mass with Verlet integration state
 *
 * Stores position, previous position, and acceleration for Verlet integration.
 * Velocity is implicitly calculated from position difference.
 *
 * @class
 * @property {number} x - Current X position
 * @property {number} y - Current Y position (usually 0 for 2D)
 * @property {number} z - Current Z position
 * @property {number} prevX - Previous X position
 * @property {number} prevY - Previous Y position
 * @property {number} prevZ - Previous Z position
 * @property {number} ax - Current X acceleration
 * @property {number} ay - Current Y acceleration
 * @property {number} az - Current Z acceleration
 * @property {number} mass - Point mass (default: 1.0)
 * @property {boolean} constrained - Whether point is locked in place
 * @property {*} userData - Custom data storage
 */
export class VerletPoint {
    /**
     * Create a VerletPoint
     * @param {number} x - Initial X position
     * @param {number} y - Initial Y position (default: 0)
     * @param {number} z - Initial Z position
     * @param {number} mass - Point mass (default: 1.0)
     */
    constructor(x = 0, y = 0, z = 0, mass = 1.0) {
        // Current position
        this.x = x;
        this.y = y;
        this.z = z;

        // Previous position (for Verlet integration)
        this.prevX = x;
        this.prevY = y;
        this.prevZ = z;

        // Acceleration (accumulated per frame)
        this.ax = 0;
        this.ay = 0;
        this.az = 0;

        // Physical properties
        this.mass = mass;
        this.invMass = mass > 0 ? 1.0 / mass : 0;

        // State flags
        this.constrained = false;
        this.userData = null;
    }

    /**
     * Reset the point to initial state
     * @param {number} x - New X position
     * @param {number} y - New Y position
     * @param {number} z - New Z position
     */
    reset(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.prevX = x;
        this.prevY = y;
        this.prevZ = z;
        this.ax = 0;
        this.ay = 0;
        this.az = 0;
    }

    /**
     * Set velocity directly by adjusting previous position
     * @param {number} vx - X velocity
     * @param {number} vy - Y velocity
     * @param {number} vz - Z velocity
     * @param {number} dt - Time step for velocity conversion
     */
    setVelocity(vx, vy, vz, dt = 1.0) {
        this.prevX = this.x - vx * dt;
        this.prevY = this.y - vy * dt;
        this.prevZ = this.z - vz * dt;
    }

    /**
     * Clone this point
     * @returns {VerletPoint} New point with same state
     */
    clone() {
        const point = new VerletPoint(this.x, this.y, this.z, this.mass);
        point.prevX = this.prevX;
        point.prevY = this.prevY;
        point.prevZ = this.prevZ;
        point.ax = this.ax;
        point.ay = this.ay;
        point.az = this.az;
        point.constrained = this.constrained;
        point.userData = this.userData;
        return point;
    }

    /**
     * Copy state from another point
     * @param {VerletPoint} other - Source point
     */
    copy(other) {
        this.x = other.x;
        this.y = other.y;
        this.z = other.z;
        this.prevX = other.prevX;
        this.prevY = other.prevY;
        this.prevZ = other.prevZ;
        this.ax = other.ax;
        this.ay = other.ay;
        this.az = other.az;
        this.mass = other.mass;
        this.invMass = other.invMass;
        this.constrained = other.constrained;
        this.userData = other.userData;
    }

    /**
     * Get position as object
     * @returns {{x: number, y: number, z: number}}
     */
    getPosition() {
        return { x: this.x, y: this.y, z: this.z };
    }

    /**
     * Get velocity as object
     * @returns {{x: number, y: number, z: number}}
     */
    getVelocity() {
        return {
            x: this.x - this.prevX,
            y: this.y - this.prevY,
            z: this.z - this.prevZ
        };
    }
}

// ============================================================================
// Core Verlet Integration Functions
// ============================================================================

/**
 * Perform Verlet integration step for a point
 *
 * Verlet formula: newPos = 2*curr - prev + acc*dt²
 *
 * This is the core integration step that advances the point's position
 * based on its previous position and accumulated acceleration.
 *
 * @param {VerletPoint} point - Point to integrate
 * @param {number} dt - Time step in seconds
 * @param {number} [damping=0] - Optional damping factor (0-1) for energy loss
 * @returns {{x: number, y: number, z: number}} New position
 *
 * @example
 * const point = new VerletPoint(0, 0, 0);
 * point.ax = 9.8; // Gravity
 * integrate(point, 0.016); // Advance by 16ms
 */
export function integrate(point, dt, damping = 0) {
    if (!point || point.constrained) {
        return { x: point?.x || 0, y: point?.y || 0, z: point?.z || 0 };
    }

    const dt2 = dt * dt;

    // Store current position
    const currX = point.x;
    const currY = point.y;
    const currZ = point.z;

    // Verlet integration: newPos = 2*curr - prev + acc*dt²
    let newX = 2 * currX - point.prevX + point.ax * dt2;
    let newY = 2 * currY - point.prevY + point.ay * dt2;
    let newZ = 2 * currZ - point.prevZ + point.az * dt2;

    // Apply damping (optional energy loss)
    if (damping > 0 && damping < 1) {
        const dampingFactor = 1 - damping;
        const vx = currX - point.prevX;
        const vy = currY - point.prevY;
        const vz = currZ - point.prevZ;

        newX = currX + vx * dampingFactor + point.ax * dt2;
        newY = currY + vy * dampingFactor + point.ay * dt2;
        newZ = currZ + vz * dampingFactor + point.az * dt2;
    }

    // Update previous position to current
    point.prevX = currX;
    point.prevY = currY;
    point.prevZ = currZ;

    // Update to new position
    point.x = newX;
    point.y = newY;
    point.z = newZ;

    // Reset acceleration for next frame
    point.ax = 0;
    point.ay = 0;
    point.az = 0;

    return { x: newX, y: newY, z: newZ };
}

/**
 * Apply acceleration to a point
 *
 * Accumulates acceleration for the current frame. Multiple calls
 * will add to the total acceleration.
 *
 * @param {VerletPoint} point - Point to accelerate
 * @param {number} ax - X acceleration
 * @param {number} az - Z acceleration (Y is 0 for 2D)
 * @param {number} dt - Time step (for scaling if needed)
 *
 * @example
 * applyAcceleration(point, 0, -9.8, dt); // Apply gravity
 */
export function applyAcceleration(point, ax, az, dt = 1) {
    if (!point || point.constrained) return;

    point.ax += ax;
    point.ay += 0; // No Y acceleration in 2D
    point.az += az;
}

/**
 * Apply velocity directly to a point
 *
 * Sets the point's velocity by adjusting the previous position.
 * This is useful for instant velocity changes (collisions, boosts).
 *
 * @param {VerletPoint} point - Point to modify
 * @param {number} vx - X velocity
 * @param {number} vz - Z velocity
 * @param {number} dt - Time step for velocity conversion
 *
 * @example
 * applyVelocity(point, 40, 0, dt); // Set speed to 40 in X direction
 */
export function applyVelocity(point, vx, vz, dt = 1) {
    if (!point || point.constrained) return;

    // Set velocity by adjusting previous position
    // v = (curr - prev) / dt, so prev = curr - v * dt
    point.prevX = point.x - vx * dt;
    point.prevY = point.y; // Keep Y unchanged
    point.prevZ = point.z - vz * dt;
}

/**
 * Constrain point position to rectangular bounds
 *
 * Clamps the point's position within the specified bounds.
 * Also adjusts previous position to prevent "sticking" to boundaries.
 *
 * @param {VerletPoint} point - Point to constrain
 * @param {number} minX - Minimum X bound
 * @param {number} maxX - Maximum X bound
 * @param {number} minZ - Minimum Z bound
 * @param {number} maxZ - Maximum Z bound
 * @returns {{constrained: boolean, x: number, z: number}} Constraint result
 *
 * @example
 * constrainPosition(point, -200, 200, -200, 200);
 */
export function constrainPosition(point, minX, maxX, minZ, maxZ) {
    if (!point) return { constrained: false, x: point?.x || 0, z: point?.z || 0 };

    let constrained = false;
    let newX = point.x;
    let newZ = point.z;

    // Clamp X position
    if (point.x < minX) {
        newX = minX;
        constrained = true;
    } else if (point.x > maxX) {
        newX = maxX;
        constrained = true;
    }

    // Clamp Z position
    if (point.z < minZ) {
        newZ = minZ;
        constrained = true;
    } else if (point.z > maxZ) {
        newZ = maxZ;
        constrained = true;
    }

    // Apply constraint
    if (constrained) {
        // Adjust previous position to prevent sticking
        // This reflects velocity at the boundary
        const dx = newX - point.x;
        const dz = newZ - point.z;

        point.x = newX;
        point.z = newZ;

        // Reflect previous position to simulate bounce
        point.prevX = point.x + (point.prevX - point.x + dx) * 0.5;
        point.prevZ = point.z + (point.prevZ - point.z + dz) * 0.5;
    }

    return { constrained, x: newX, z: newZ };
}

/**
 * Calculate current velocity from positions
 *
 * In Verlet integration, velocity is implicit: v = (curr - prev) / dt
 *
 * @param {VerletPoint} point - Point to query
 * @param {number} [dt=1] - Time step for velocity calculation
 * @returns {{x: number, y: number, z: number}} Velocity vector
 *
 * @example
 * const vel = calculateVelocity(point, dt);
 * console.log('Speed:', Math.hypot(vel.x, vel.z));
 */
export function calculateVelocity(point, dt = 1) {
    if (!point) return { x: 0, y: 0, z: 0 };

    return {
        x: (point.x - point.prevX) / dt,
        y: (point.y - point.prevY) / dt,
        z: (point.z - point.prevZ) / dt
    };
}

/**
 * Update position directly
 *
 * Sets the point's position without affecting velocity.
 * Previous position is also updated to maintain current velocity.
 *
 * @param {VerletPoint} point - Point to update
 * @param {number} newX - New X position
 * @param {number} newZ - New Z position
 * @param {boolean} [preserveVelocity=true] - Whether to preserve velocity
 *
 * @example
 * updatePosition(point, 100, 50); // Teleport to new position
 */
export function updatePosition(point, newX, newZ, preserveVelocity = true) {
    if (!point) return;

    if (preserveVelocity) {
        // Calculate current velocity
        const vx = point.x - point.prevX;
        const vz = point.z - point.prevZ;

        // Update position
        point.x = newX;
        point.z = newZ;

        // Adjust previous position to maintain velocity
        point.prevX = newX - vx;
        point.prevZ = newZ - vz;
    } else {
        // Reset velocity to zero
        point.x = newX;
        point.z = newZ;
        point.prevX = newX;
        point.prevZ = newZ;
    }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create physics state for a player
 *
 * Creates a VerletPoint initialized with player position and default values.
 * Includes additional game-specific properties.
 *
 * @param {number} x - Initial X position
 * @param {number} z - Initial Z position
 * @param {object} [options] - Additional options
 * @param {number} [options.mass=1] - Point mass
 * @param {number} [options.vx=0] - Initial X velocity
 * @param {number} [options.vz=0] - Initial Z velocity
 * @param {string} [options.playerId] - Player ID
 * @param {number} [options.speed=40] - Base speed
 * @returns {VerletPoint & {playerId: string, speed: number, dirX: number, dirZ: number}}
 *
 * @example
 * const physics = createPlayerPhysics(0, 0, {
 *   playerId: 'player1',
 *   vx: 0,
 *   vz: -40
 * });
 */
export function createPlayerPhysics(x, z, options = {}) {
    const {
        mass = 1,
        vx = 0,
        vz = 0,
        playerId = '',
        speed = 40,
        dirX = 0,
        dirZ = -1
    } = options;

    const point = new VerletPoint(x, 0, z, mass);

    // Set initial velocity
    if (vx !== 0 || vz !== 0) {
        point.setVelocity(vx, 0, vz, 1);
    }

    // Add game-specific properties
    point.playerId = playerId;
    point.speed = speed;
    point.dirX = dirX;
    point.dirZ = dirZ;

    return point;
}

// ============================================================================
// Advanced Physics Functions
// ============================================================================

/**
 * Apply impulse to a point
 *
 * Instantaneously changes velocity by adding an impulse.
 * Impulse is scaled by inverse mass for realistic physics.
 *
 * @param {VerletPoint} point - Point to apply impulse to
 * @param {number} ix - X impulse
 * @param {number} iz - Z impulse
 * @param {number} dt - Time step
 */
export function applyImpulse(point, ix, iz, dt = 1) {
    if (!point || point.constrained) return;

    // Impulse changes velocity: dv = impulse / mass
    const dvx = ix * point.invMass;
    const dvz = iz * point.invMass;

    // Adjust previous position to reflect velocity change
    point.prevX -= dvx * dt;
    point.prevZ -= dvz * dt;
}

/**
 * Apply force to a point
 *
 * Accumulates force as acceleration (F = ma, so a = F/m).
 * Force is scaled by inverse mass.
 *
 * @param {VerletPoint} point - Point to apply force to
 * @param {number} fx - X force
 * @param {number} fz - Z force
 */
export function applyForce(point, fx, fz) {
    if (!point || point.constrained) return;

    // F = ma, so a = F/m = F * invMass
    point.ax += fx * point.invMass;
    point.az += fz * point.invMass;
}

/**
 * Apply drag force (air resistance)
 *
 * Applies a force opposite to velocity, proportional to speed.
 *
 * @param {VerletPoint} point - Point to apply drag to
 * @param {number} dragCoefficient - Drag coefficient (higher = more drag)
 * @param {number} dt - Time step
 */
export function applyDrag(point, dragCoefficient, dt = 1) {
    if (!point || point.constrained) return;

    const vx = (point.x - point.prevX) / dt;
    const vz = (point.z - point.prevZ) / dt;

    // Drag force is opposite to velocity
    const dragX = -dragCoefficient * vx;
    const dragZ = -dragCoefficient * vz;

    applyForce(point, dragX, dragZ);
}

/**
 * Apply spring force to a point
 *
 * Hooke's law: F = -k * displacement
 *
 * @param {VerletPoint} point - Point to apply spring to
 * @param {number} anchorX - Spring anchor X
 * @param {number} anchorZ - Spring anchor Z
 * @param {number} k - Spring constant
 * @param {number} restLength - Rest length of spring
 */
export function applySpringForce(point, anchorX, anchorZ, k, restLength = 0) {
    if (!point || point.constrained) return;

    const dx = point.x - anchorX;
    const dz = point.z - anchorZ;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 0.0001) return; // Avoid division by zero

    // Spring force magnitude
    const displacement = dist - restLength;
    const force = -k * displacement;

    // Apply force in direction of anchor
    const fx = (dx / dist) * force;
    const fz = (dz / dist) * force;

    applyForce(point, fx, fz);
}

/**
 * Reflect velocity at boundary
 *
 * Used for bouncing off walls with energy loss.
 *
 * @param {VerletPoint} point - Point to reflect
 * @param {number} normalX - Boundary normal X
 * @param {number} normalZ - Boundary normal Z
 * @param {number} restitution - Bounciness (0-1)
 * @param {number} dt - Time step
 */
export function reflectVelocity(point, normalX, normalZ, restitution = 0.8, dt = 1) {
    if (!point) return;

    const vx = (point.x - point.prevX) / dt;
    const vz = (point.z - point.prevZ) / dt;

    // Dot product of velocity and normal
    const dot = vx * normalX + vz * normalZ;

    // Only reflect if moving toward boundary (dot product is negative when moving against normal)
    if (dot < 0) {
        // Reflect: v' = v - 2(v·n)n
        const rvx = vx - 2 * dot * normalX;
        const rvz = vz - 2 * dot * normalZ;

        // Apply restitution
        point.prevX = point.x - rvx * restitution * dt;
        point.prevZ = point.z - rvz * restitution * dt;
    }
    // If dot >= 0, velocity is unchanged (moving away from or parallel to boundary)
}

/**
 * Integrate multiple points at once
 *
 * Batch integration for efficiency.
 *
 * @param {VerletPoint[]} points - Array of points to integrate
 * @param {number} dt - Time step
 * @param {number} [damping=0] - Damping factor
 */
export function integrateAll(points, dt, damping = 0) {
    for (const point of points) {
        integrate(point, dt, damping);
    }
}

/**
 * Reset accelerations for all points
 *
 * Called at start of each physics step.
 *
 * @param {VerletPoint[]} points - Array of points
 */
export function resetAccelerations(points) {
    for (const point of points) {
        if (point) {
            point.ax = 0;
            point.ay = 0;
            point.az = 0;
        }
    }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate speed (magnitude of velocity)
 *
 * @param {VerletPoint} point - Point to query
 * @param {number} [dt=1] - Time step
 * @returns {number} Speed
 */
export function calculateSpeed(point, dt = 1) {
    if (!point) return 0;

    const vx = (point.x - point.prevX) / dt;
    const vz = (point.z - point.prevZ) / dt;

    return Math.sqrt(vx * vx + vz * vz);
}

/**
 * Calculate kinetic energy
 *
 * KE = 0.5 * m * v²
 *
 * @param {VerletPoint} point - Point to query
 * @param {number} [dt=1] - Time step
 * @returns {number} Kinetic energy
 */
export function calculateKineticEnergy(point, dt = 1) {
    if (!point) return 0;

    const speed = calculateSpeed(point, dt);
    return 0.5 * point.mass * speed * speed;
}

/**
 * Get distance between two points
 *
 * @param {VerletPoint} a - First point
 * @param {VerletPoint} b - Second point
 * @returns {number} Distance
 */
export function distanceBetween(a, b) {
    if (!a || !b) return Infinity;

    const dx = b.x - a.x;
    const dz = b.z - a.z;

    return Math.sqrt(dx * dx + dz * dz);
}

/**
 * Set point as constrained (frozen)
 *
 * Constrained points don't integrate but can still have forces applied.
 *
 * @param {VerletPoint} point - Point to constrain
 * @param {boolean} constrained - Whether to constrain
 */
export function setConstrained(point, constrained = true) {
    if (!point) return;
    point.constrained = constrained;
}

/**
 * Get total momentum of system
 *
 * @param {VerletPoint[]} points - Array of points
 * @param {number} [dt=1] - Time step
 * @returns {{x: number, z: number}} Total momentum
 */
export function calculateTotalMomentum(points, dt = 1) {
    let px = 0;
    let pz = 0;

    for (const point of points) {
        if (!point) continue;

        const vx = (point.x - point.prevX) / dt;
        const vz = (point.z - point.prevZ) / dt;

        px += point.mass * vx;
        pz += point.mass * vz;
    }

    return { x: px, z: pz };
}

// ============================================================================
// Default Export
// ============================================================================

export default {
    VerletPoint,
    integrate,
    applyAcceleration,
    applyVelocity,
    constrainPosition,
    calculateVelocity,
    updatePosition,
    createPlayerPhysics,
    applyImpulse,
    applyForce,
    applyDrag,
    applySpringForce,
    reflectVelocity,
    integrateAll,
    resetAccelerations,
    calculateSpeed,
    calculateKineticEnergy,
    distanceBetween,
    setConstrained,
    calculateTotalMomentum
};
