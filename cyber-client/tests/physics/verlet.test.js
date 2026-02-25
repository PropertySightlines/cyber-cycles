/**
 * Verlet Integration Tests for Cyber Cycles
 *
 * Comprehensive test suite for the VerletIntegration module.
 * Tests cover:
 * - VerletPoint class functionality
 * - Core integration functions
 * - Physics operations (acceleration, velocity, impulses)
 * - Constraints and boundaries
 * - Utility functions
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
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
} from '../../src/physics/VerletIntegration.js';

// ============================================================================
// VerletPoint Class Tests
// ============================================================================

describe('VerletPoint', () => {
    describe('constructor', () => {
        it('should create a point at origin with default values', () => {
            const point = new VerletPoint();
            expect(point.x).toBe(0);
            expect(point.y).toBe(0);
            expect(point.z).toBe(0);
            expect(point.prevX).toBe(0);
            expect(point.prevY).toBe(0);
            expect(point.prevZ).toBe(0);
            expect(point.ax).toBe(0);
            expect(point.ay).toBe(0);
            expect(point.az).toBe(0);
            expect(point.mass).toBe(1.0);
            expect(point.invMass).toBe(1.0);
            expect(point.constrained).toBe(false);
        });

        it('should create a point at specified position', () => {
            const point = new VerletPoint(10, 5, 20);
            expect(point.x).toBe(10);
            expect(point.y).toBe(5);
            expect(point.z).toBe(20);
            expect(point.prevX).toBe(10);
            expect(point.prevY).toBe(5);
            expect(point.prevZ).toBe(20);
        });

        it('should create a point with custom mass', () => {
            const point = new VerletPoint(0, 0, 0, 2.0);
            expect(point.mass).toBe(2.0);
            expect(point.invMass).toBe(0.5);
        });

        it('should handle zero mass (infinite mass)', () => {
            const point = new VerletPoint(0, 0, 0, 0);
            expect(point.mass).toBe(0);
            expect(point.invMass).toBe(0);
        });
    });

    describe('reset', () => {
        it('should reset point to new position', () => {
            const point = new VerletPoint(10, 10, 10);
            point.ax = 5;
            point.prevX = 8;

            point.reset(20, 20, 20);

            expect(point.x).toBe(20);
            expect(point.y).toBe(20);
            expect(point.z).toBe(20);
            expect(point.prevX).toBe(20);
            expect(point.prevY).toBe(20);
            expect(point.prevZ).toBe(20);
            expect(point.ax).toBe(0);
            expect(point.ay).toBe(0);
            expect(point.az).toBe(0);
        });

        it('should reset to origin when no arguments', () => {
            const point = new VerletPoint(10, 10, 10);
            point.reset();

            expect(point.x).toBe(0);
            expect(point.z).toBe(0);
        });
    });

    describe('setVelocity', () => {
        it('should set velocity by adjusting previous position', () => {
            const point = new VerletPoint(10, 0, 10);
            point.setVelocity(5, 0, 3, 1.0);

            expect(point.x - point.prevX).toBe(5);
            expect(point.z - point.prevZ).toBe(3);
        });

        it('should handle custom dt', () => {
            const point = new VerletPoint(0, 0, 0);
            point.setVelocity(10, 0, 0, 0.5);

            expect(point.prevX).toBe(-5); // 0 - 10 * 0.5
        });
    });

    describe('clone', () => {
        it('should create a deep copy of the point', () => {
            const original = new VerletPoint(10, 5, 20, 2.0);
            original.prevX = 8;
            original.ax = 1;
            original.constrained = true;
            original.userData = { test: 'data' };

            const clone = original.clone();

            expect(clone.x).toBe(10);
            expect(clone.y).toBe(5);
            expect(clone.z).toBe(20);
            expect(clone.mass).toBe(2.0);
            expect(clone.prevX).toBe(8);
            expect(clone.ax).toBe(1);
            expect(clone.constrained).toBe(true);
            expect(clone.userData).toEqual({ test: 'data' });

            // Verify it's a deep copy
            clone.x = 100;
            expect(original.x).toBe(10);
        });
    });

    describe('copy', () => {
        it('should copy state from another point', () => {
            const source = new VerletPoint(15, 10, 25, 3.0);
            source.prevX = 12;
            source.ax = 2;

            const dest = new VerletPoint();
            dest.copy(source);

            expect(dest.x).toBe(15);
            expect(dest.y).toBe(10);
            expect(dest.z).toBe(25);
            expect(dest.mass).toBe(3.0);
            expect(dest.prevX).toBe(12);
            expect(dest.ax).toBe(2);
        });
    });

    describe('getPosition', () => {
        it('should return position as object', () => {
            const point = new VerletPoint(10, 20, 30);
            const pos = point.getPosition();

            expect(pos).toEqual({ x: 10, y: 20, z: 30 });
        });
    });

    describe('getVelocity', () => {
        it('should return velocity as object', () => {
            const point = new VerletPoint(10, 0, 10);
            point.prevX = 8;
            point.prevZ = 7;

            const vel = point.getVelocity();

            expect(vel).toEqual({ x: 2, y: 0, z: 3 });
        });
    });
});

// ============================================================================
// Core Integration Tests
// ============================================================================

describe('integrate', () => {
    it('should apply Verlet integration formula', () => {
        const point = new VerletPoint(10, 0, 10);
        point.prevX = 8;
        point.prevZ = 8;
        point.ax = 2;
        point.az = 2;

        const dt = 1.0;
        integrate(point, dt);

        // newPos = 2*curr - prev + acc*dt²
        // newX = 2*10 - 8 + 2*1 = 14
        // newZ = 2*10 - 8 + 2*1 = 14
        expect(point.x).toBe(14);
        expect(point.z).toBe(14);
    });

    it('should update previous position to current', () => {
        const point = new VerletPoint(10, 0, 10);
        point.prevX = 8;
        point.prevZ = 8;

        integrate(point, 1.0);

        expect(point.prevX).toBe(10);
        expect(point.prevZ).toBe(10);
    });

    it('should reset acceleration after integration', () => {
        const point = new VerletPoint(0, 0, 0);
        point.ax = 5;
        point.az = 5;

        integrate(point, 1.0);

        expect(point.ax).toBe(0);
        expect(point.az).toBe(0);
    });

    it('should handle null point gracefully', () => {
        const result = integrate(null, 1.0);
        expect(result).toEqual({ x: 0, y: 0, z: 0 });
    });

    it('should not integrate constrained points', () => {
        const point = new VerletPoint(10, 0, 10);
        point.prevX = 8;
        point.constrained = true;
        point.ax = 100;

        integrate(point, 1.0);

        expect(point.x).toBe(10);
        expect(point.z).toBe(10);
    });

    it('should apply damping correctly', () => {
        const point = new VerletPoint(10, 0, 10);
        point.prevX = 8; // velocity = 2
        point.prevZ = 8;

        const dt = 1.0;
        const damping = 0.5;
        integrate(point, dt, damping);

        // With damping: newX = curr + vx * (1 - damping) + acc*dt²
        // newX = 10 + 2 * 0.5 + 0 = 11
        expect(point.x).toBe(11);
    });

    it('should handle zero damping (no energy loss)', () => {
        const point = new VerletPoint(10, 0, 10);
        point.prevX = 8;

        integrate(point, 1.0, 0);

        expect(point.x).toBe(12); // 2*10 - 8 + 0 = 12
    });
});

// ============================================================================
// Acceleration and Velocity Tests
// ============================================================================

describe('applyAcceleration', () => {
    it('should add acceleration to point', () => {
        const point = new VerletPoint();
        applyAcceleration(point, 5, 3);

        expect(point.ax).toBe(5);
        expect(point.az).toBe(3);
    });

    it('should accumulate multiple accelerations', () => {
        const point = new VerletPoint();
        applyAcceleration(point, 5, 3);
        applyAcceleration(point, 2, 1);

        expect(point.ax).toBe(7);
        expect(point.az).toBe(4);
    });

    it('should not apply to null point', () => {
        expect(() => applyAcceleration(null, 5, 3)).not.toThrow();
    });

    it('should not apply to constrained points', () => {
        const point = new VerletPoint();
        point.constrained = true;
        applyAcceleration(point, 5, 3);

        expect(point.ax).toBe(0);
        expect(point.az).toBe(0);
    });
});

describe('applyVelocity', () => {
    it('should set velocity by adjusting previous position', () => {
        const point = new VerletPoint(10, 0, 10);
        applyVelocity(point, 5, 3, 1.0);

        expect(point.prevX).toBe(5); // 10 - 5*1
        expect(point.prevZ).toBe(7); // 10 - 3*1
    });

    it('should handle custom dt', () => {
        const point = new VerletPoint(0, 0, 0);
        applyVelocity(point, 10, 0, 0.5);

        expect(point.prevX).toBe(-5);
    });

    it('should not apply to null point', () => {
        expect(() => applyVelocity(null, 5, 3)).not.toThrow();
    });

    it('should not apply to constrained points', () => {
        const point = new VerletPoint(10, 0, 10);
        point.constrained = true;
        applyVelocity(point, 5, 3);

        expect(point.prevX).toBe(10);
        expect(point.prevZ).toBe(10);
    });
});

// ============================================================================
// Constraint Tests
// ============================================================================

describe('constrainPosition', () => {
    it('should not modify point inside bounds', () => {
        const point = new VerletPoint(50, 0, 50);
        const result = constrainPosition(point, -100, 100, -100, 100);

        expect(result.constrained).toBe(false);
        expect(point.x).toBe(50);
        expect(point.z).toBe(50);
    });

    it('should clamp point outside right boundary', () => {
        const point = new VerletPoint(150, 0, 50);
        const result = constrainPosition(point, -100, 100, -100, 100);

        expect(result.constrained).toBe(true);
        expect(point.x).toBe(100);
        expect(point.z).toBe(50);
    });

    it('should clamp point outside left boundary', () => {
        const point = new VerletPoint(-150, 0, 50);
        const result = constrainPosition(point, -100, 100, -100, 100);

        expect(result.constrained).toBe(true);
        expect(point.x).toBe(-100);
    });

    it('should clamp point outside top boundary', () => {
        const point = new VerletPoint(50, 0, 150);
        const result = constrainPosition(point, -100, 100, -100, 100);

        expect(result.constrained).toBe(true);
        expect(point.z).toBe(100);
    });

    it('should clamp point outside bottom boundary', () => {
        const point = new VerletPoint(50, 0, -150);
        const result = constrainPosition(point, -100, 100, -100, 100);

        expect(result.constrained).toBe(true);
        expect(point.z).toBe(-100);
    });

    it('should clamp corner positions', () => {
        const point = new VerletPoint(150, 0, 150);
        const result = constrainPosition(point, -100, 100, -100, 100);

        expect(result.constrained).toBe(true);
        expect(point.x).toBe(100);
        expect(point.z).toBe(100);
    });

    it('should adjust previous position to prevent sticking', () => {
        const point = new VerletPoint(105, 0, 50);
        point.prevX = 103; // Moving right

        constrainPosition(point, -100, 100, -100, 100);

        // Previous position should be adjusted to reflect bounce
        expect(point.x).toBe(100);
        expect(point.prevX).toBeLessThan(100);
    });

    it('should handle null point gracefully', () => {
        const result = constrainPosition(null, -100, 100, -100, 100);
        expect(result).toEqual({ constrained: false, x: 0, z: 0 });
    });
});

// ============================================================================
// Velocity Calculation Tests
// ============================================================================

describe('calculateVelocity', () => {
    it('should calculate velocity from position difference', () => {
        const point = new VerletPoint(10, 0, 10);
        point.prevX = 8;
        point.prevZ = 7;

        const vel = calculateVelocity(point, 1.0);

        expect(vel.x).toBe(2);
        expect(vel.z).toBe(3);
    });

    it('should handle custom dt', () => {
        const point = new VerletPoint(10, 0, 10);
        point.prevX = 8;

        const vel = calculateVelocity(point, 0.5);

        expect(vel.x).toBe(4); // (10 - 8) / 0.5
    });

    it('should return zero for null point', () => {
        const vel = calculateVelocity(null);
        expect(vel).toEqual({ x: 0, y: 0, z: 0 });
    });

    it('should return zero for stationary point', () => {
        const point = new VerletPoint(10, 0, 10);
        const vel = calculateVelocity(point);

        expect(vel.x).toBe(0);
        expect(vel.z).toBe(0);
    });
});

// ============================================================================
// Position Update Tests
// ============================================================================

describe('updatePosition', () => {
    it('should update position preserving velocity', () => {
        const point = new VerletPoint(10, 0, 10);
        point.prevX = 8; // velocity = 2
        point.prevZ = 8; // velocity = 2

        updatePosition(point, 50, 50, true);

        expect(point.x).toBe(50);
        expect(point.z).toBe(50);
        expect(point.x - point.prevX).toBe(2); // Velocity preserved
        expect(point.z - point.prevZ).toBe(2);
    });

    it('should update position without preserving velocity', () => {
        const point = new VerletPoint(10, 0, 10);
        point.prevX = 8;

        updatePosition(point, 50, 50, false);

        expect(point.x).toBe(50);
        expect(point.z).toBe(50);
        expect(point.prevX).toBe(50); // Velocity reset
        expect(point.prevZ).toBe(50);
    });

    it('should handle null point gracefully', () => {
        expect(() => updatePosition(null, 50, 50)).not.toThrow();
    });
});

// ============================================================================
// Player Physics Factory Tests
// ============================================================================

describe('createPlayerPhysics', () => {
    it('should create player physics with default values', () => {
        const physics = createPlayerPhysics(100, 200);

        expect(physics.x).toBe(100);
        expect(physics.z).toBe(200);
        expect(physics.mass).toBe(1);
        expect(physics.playerId).toBe('');
        expect(physics.speed).toBe(40);
        expect(physics.dirX).toBe(0);
        expect(physics.dirZ).toBe(-1);
    });

    it('should create player physics with custom options', () => {
        const physics = createPlayerPhysics(50, 75, {
            mass: 2.0,
            vx: 10,
            vz: -10,
            playerId: 'player1',
            speed: 50,
            dirX: 1,
            dirZ: 0
        });

        expect(physics.x).toBe(50);
        expect(physics.z).toBe(75);
        expect(physics.mass).toBe(2.0);
        expect(physics.playerId).toBe('player1');
        expect(physics.speed).toBe(50);
        expect(physics.dirX).toBe(1);
        expect(physics.dirZ).toBe(0);

        // Verify velocity was set
        expect(physics.x - physics.prevX).toBe(10);
        expect(physics.z - physics.prevZ).toBe(-10);
    });

    it('should create player at origin with no arguments', () => {
        const physics = createPlayerPhysics(0, 0);

        expect(physics.x).toBe(0);
        expect(physics.z).toBe(0);
    });
});

// ============================================================================
// Advanced Physics Tests
// ============================================================================

describe('applyImpulse', () => {
    it('should apply impulse changing velocity', () => {
        const point = new VerletPoint(10, 0, 10, 1.0);
        point.prevX = 8;
        point.prevZ = 8;

        applyImpulse(point, 5, 0, 1.0);

        // Impulse adds to velocity: prevX = curr - (v + dv)*dt
        // dv = impulse / mass = 5 / 1 = 5
        // prevX = 10 - (2 + 5) * 1 = 3
        expect(point.prevX).toBe(3);
    });

    it('should scale impulse by inverse mass', () => {
        const point = new VerletPoint(0, 0, 0, 2.0);

        applyImpulse(point, 10, 0, 1.0);

        // dv = 10 / 2 = 5
        expect(point.prevX).toBe(-5);
    });

    it('should not apply to constrained points', () => {
        const point = new VerletPoint(10, 0, 10);
        point.constrained = true;

        applyImpulse(point, 5, 5);

        expect(point.prevX).toBe(10);
        expect(point.prevZ).toBe(10);
    });
});

describe('applyForce', () => {
    it('should apply force as acceleration', () => {
        const point = new VerletPoint(0, 0, 0, 2.0);

        applyForce(point, 10, 6);

        // a = F / m = F * invMass
        expect(point.ax).toBe(5); // 10 * 0.5
        expect(point.az).toBe(3); // 6 * 0.5
    });

    it('should accumulate forces', () => {
        const point = new VerletPoint(0, 0, 0, 1.0);

        applyForce(point, 5, 3);
        applyForce(point, 5, 3);

        expect(point.ax).toBe(10);
        expect(point.az).toBe(6);
    });
});

describe('applyDrag', () => {
    it('should apply drag opposite to velocity', () => {
        const point = new VerletPoint(10, 0, 10);
        point.prevX = 8; // velocity = 2
        point.prevZ = 8; // velocity = 2

        applyDrag(point, 0.5, 1.0);

        // Drag force = -dragCoeff * velocity
        // Fx = -0.5 * 2 = -1
        expect(point.ax).toBeCloseTo(-1, 5);
        expect(point.az).toBeCloseTo(-1, 5);
    });
});

describe('applySpringForce', () => {
    it('should apply spring force toward anchor', () => {
        const point = new VerletPoint(10, 0, 0, 1.0);
        const k = 1.0;
        const restLength = 0;

        applySpringForce(point, 0, 0, k, restLength);

        // Force should be toward origin (negative x)
        expect(point.ax).toBeLessThan(0);
        expect(point.az).toBe(0);
    });

    it('should apply zero force at rest length', () => {
        const point = new VerletPoint(5, 0, 0, 1.0);

        applySpringForce(point, 0, 0, 1.0, 5);

        expect(point.ax).toBe(0);
        expect(point.az).toBe(0);
    });
});

describe('reflectVelocity', () => {
    it('should reflect velocity at boundary', () => {
        const point = new VerletPoint(10, 0, 10);
        point.prevX = 12; // Moving right (positive x velocity)
        point.prevZ = 10;

        // Reflect off right wall (normal points left: -1, 0)
        reflectVelocity(point, -1, 0, 0.8, 1.0);

        // Velocity should be reversed and reduced by restitution
        expect(point.x - point.prevX).toBeLessThan(0);
    });

    it('should not reflect when moving away from boundary', () => {
        const point = new VerletPoint(10, 0, 10);
        point.prevX = 12; // Moving right (velocity = -2), away from left wall
        point.prevZ = 10;

        // Left wall normal points left (-1, 0)
        // Moving right means moving away from left wall
        reflectVelocity(point, -1, 0, 0.8, 1.0);

        // Velocity unchanged (moving away from boundary)
        expect(point.prevX).toBe(12);
    });
});

// ============================================================================
// Batch Operations Tests
// ============================================================================

describe('integrateAll', () => {
    it('should integrate multiple points', () => {
        const points = [
            new VerletPoint(10, 0, 10),
            new VerletPoint(20, 0, 20),
            new VerletPoint(30, 0, 30)
        ];

        points.forEach(p => {
            p.prevX -= 1;
            p.prevZ -= 1;
        });

        integrateAll(points, 1.0);

        points.forEach(p => {
            expect(p.x).toBeGreaterThan(p.prevX);
        });
    });

    it('should handle empty array', () => {
        expect(() => integrateAll([], 1.0)).not.toThrow();
    });
});

describe('resetAccelerations', () => {
    it('should reset all accelerations to zero', () => {
        const points = [
            new VerletPoint(),
            new VerletPoint(),
            new VerletPoint()
        ];

        points.forEach((p, i) => {
            p.ax = i + 1;
            p.az = i + 1;
        });

        resetAccelerations(points);

        points.forEach(p => {
            expect(p.ax).toBe(0);
            expect(p.az).toBe(0);
        });
    });
});

// ============================================================================
// Utility Function Tests
// ============================================================================

describe('calculateSpeed', () => {
    it('should calculate speed magnitude', () => {
        const point = new VerletPoint(10, 0, 10);
        point.prevX = 7; // vx = 3
        point.prevZ = 6; // vz = 4

        const speed = calculateSpeed(point, 1.0);

        expect(speed).toBe(5); // sqrt(3² + 4²)
    });

    it('should return zero for stationary point', () => {
        const point = new VerletPoint(10, 0, 10);
        const speed = calculateSpeed(point);

        expect(speed).toBe(0);
    });

    it('should return zero for null point', () => {
        expect(calculateSpeed(null)).toBe(0);
    });
});

describe('calculateKineticEnergy', () => {
    it('should calculate KE = 0.5 * m * v²', () => {
        const point = new VerletPoint(0, 0, 0, 2.0);
        point.prevX = -1; // v = 1

        const ke = calculateKineticEnergy(point, 1.0);

        expect(ke).toBe(1.0); // 0.5 * 2 * 1²
    });

    it('should return zero for null point', () => {
        expect(calculateKineticEnergy(null)).toBe(0);
    });
});

describe('distanceBetween', () => {
    it('should calculate distance between two points', () => {
        const a = new VerletPoint(0, 0, 0);
        const b = new VerletPoint(3, 0, 4);

        const dist = distanceBetween(a, b);

        expect(dist).toBe(5);
    });

    it('should return zero for same point', () => {
        const point = new VerletPoint(10, 0, 10);
        const dist = distanceBetween(point, point);

        expect(dist).toBe(0);
    });

    it('should return Infinity for null points', () => {
        expect(distanceBetween(null, null)).toBe(Infinity);
        expect(distanceBetween(new VerletPoint(), null)).toBe(Infinity);
    });
});

describe('setConstrained', () => {
    it('should set constrained flag', () => {
        const point = new VerletPoint();

        setConstrained(point, true);
        expect(point.constrained).toBe(true);

        setConstrained(point, false);
        expect(point.constrained).toBe(false);
    });

    it('should default to true', () => {
        const point = new VerletPoint();
        setConstrained(point);

        expect(point.constrained).toBe(true);
    });

    it('should handle null point', () => {
        expect(() => setConstrained(null)).not.toThrow();
    });
});

describe('calculateTotalMomentum', () => {
    it('should calculate total momentum of system', () => {
        const points = [
            new VerletPoint(0, 0, 0, 1.0),
            new VerletPoint(0, 0, 0, 2.0)
        ];

        // Point 1: v = (1, 0), p = 1 * 1 = 1
        points[0].prevX = -1;
        // Point 2: v = (2, 0), p = 2 * 2 = 4
        points[1].prevX = -2;

        const momentum = calculateTotalMomentum(points, 1.0);

        expect(momentum.x).toBe(5); // 1 + 4
        expect(momentum.z).toBe(0);
    });

    it('should handle empty array', () => {
        const momentum = calculateTotalMomentum([]);
        expect(momentum).toEqual({ x: 0, z: 0 });
    });
});
