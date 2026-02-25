/**
 * State Management Tests for Cyber Cycles
 *
 * Tests for game state management:
 * - Player state initialization and updates
 * - Game state transitions (countdown, round active, etc.)
 * - Input state handling
 * - State synchronization
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    CONSTANTS,
    DEFAULT_CONFIG,
    createPlayerState,
    createInitialState,
    createDefaultConfig,
    canSlipstream,
    updatePlayerSpeed,
    checkTrailCollision,
    isOutOfBounds
} from '../src/game-logic.js';

describe('State Management', () => {
  describe('Initial State', () => {
    it('should create valid initial state', () => {
      const state = createInitialState();
      expect(state.players).toEqual({});
      expect(state.isBoosting).toBe(false);
      expect(state.countdown).toBe(3);
      expect(state.roundActive).toBe(false);
      expect(state.cameraShake).toBe(0);
      expect(state.turnLeft).toBe(false);
      expect(state.turnRight).toBe(false);
      expect(state.brake).toBe(false);
    });

    it('should have empty players object initially', () => {
      const state = createInitialState();
      expect(Object.keys(state.players)).toHaveLength(0);
    });

    it('should have default countdown of 3', () => {
      const state = createInitialState();
      expect(state.countdown).toBe(3);
    });

    // TODO: Test state reset functionality
    // TODO: Test state persistence
  });

  describe('Player State', () => {
    it('should create player with default values', () => {
      const player = createPlayerState("player1");
      expect(player.id).toBe("player1");
      expect(player.alive).toBe(true);
      expect(player.ready).toBe(false);
      expect(player.speed).toBe(40);
      expect(player.dir_x).toBe(0);
      expect(player.dir_z).toBe(-1);
    });

    it('should override default values', () => {
      const player = createPlayerState("player1", {
        x: 100,
        z: 50,
        alive: false,
        ready: true
      });
      expect(player.x).toBe(100);
      expect(player.z).toBe(50);
      expect(player.alive).toBe(false);
      expect(player.ready).toBe(true);
    });

    it('should initialize with empty turnPoints', () => {
      const player = createPlayerState("player1");
      expect(player.turnPoints).toEqual([]);
    });

    it('should initialize with default direction (facing down)', () => {
      const player = createPlayerState("player1");
      expect(player.dir_x).toBe(0);
      expect(player.dir_z).toBe(-1);
    });

    it('should create AI player', () => {
      const player = createPlayerState("ai1", { is_ai: true, personality: "aggressive" });
      expect(player.is_ai).toBe(true);
      expect(player.personality).toBe("aggressive");
    });

    // TODO: Test player color assignment
    // TODO: Test player spawn positioning
  });

  describe('Game State Transitions', () => {
    it('should transition from countdown to round active', () => {
      const state = createInitialState();
      state.countdown = 1;

      // Simulate countdown reaching 0
      state.countdown = 0;
      state.roundActive = true;

      expect(state.countdown).toBe(0);
      expect(state.roundActive).toBe(true);
    });

    it('should handle round end with winner', () => {
      const state = createInitialState();
      state.roundActive = true;

      // Simulate round end
      state.roundActive = false;
      // winner_id would be set by server

      expect(state.roundActive).toBe(false);
    });

    it('should reset state for new round', () => {
      const state = createInitialState();
      state.roundActive = true;
      state.countdown = 0;

      // Reset for new round
      state.roundActive = false;
      state.countdown = 3;

      expect(state.roundActive).toBe(false);
      expect(state.countdown).toBe(3);
    });

    // TODO: Test countdown tick logic
    // TODO: Test game over conditions
  });

  describe('Input State', () => {
    it('should handle turn left input', () => {
      const state = createInitialState();
      state.turnLeft = true;
      expect(state.turnLeft).toBe(true);
      expect(state.turnRight).toBe(false);
    });

    it('should handle turn right input', () => {
      const state = createInitialState();
      state.turnRight = true;
      expect(state.turnRight).toBe(true);
      expect(state.turnLeft).toBe(false);
    });

    it('should handle brake input', () => {
      const state = createInitialState();
      state.brake = true;
      expect(state.brake).toBe(true);
    });

    it('should handle simultaneous inputs', () => {
      const state = createInitialState();
      state.turnLeft = true;
      state.brake = true;
      expect(state.turnLeft).toBe(true);
      expect(state.brake).toBe(true);
    });

    it('should reset input on key release', () => {
      const state = createInitialState();
      state.turnLeft = true;
      state.turnLeft = false; // Key released
      expect(state.turnLeft).toBe(false);
    });

    // TODO: Test input debouncing
    // TODO: Test input priority (can't turn both ways)
  });

  describe('Slipstream Detection', () => {
    it('should detect slipstream when close to opponent trail', () => {
      const player = createPlayerState("player1", {
        x: 0, z: 0, dir_x: 0, dir_z: 1, alive: true  // Facing up (positive z)
      });
      const segments = [{
        pid: "player2",
        x1: 0, z1: 3,  // Segment 3 units ahead in player's direction
        x2: 0, z2: 8
      }];

      const result = canSlipstream(player, segments, 5);
      expect(result).toBe(true);
    });

    it('should not detect slipstream when too far', () => {
      const player = createPlayerState("player1", {
        x: 0, z: 0, dir_x: 0, dir_z: -1, alive: true
      });
      const segments = [{
        pid: "player2",
        x1: 100, z1: 100,
        x2: 100, z2: 110
      }];

      const result = canSlipstream(player, segments, 5);
      expect(result).toBe(false);
    });

    it('should not detect slipstream from own trail', () => {
      const player = createPlayerState("player1", {
        x: 0, z: 0, dir_x: 0, dir_z: -1, alive: true
      });
      const segments = [{
        pid: "player1", // Same player
        x1: 2, z1: 5,
        x2: 2, z2: 10
      }];

      const result = canSlipstream(player, segments, 5);
      expect(result).toBe(false);
    });

    it('should not detect slipstream for dead player', () => {
      const player = createPlayerState("player1", {
        x: 0, z: 0, alive: false
      });
      const segments = [{
        pid: "player2",
        x1: 2, z1: 5,
        x2: 2, z2: 10
      }];

      const result = canSlipstream(player, segments, 5);
      expect(result).toBe(false);
    });

    // TODO: Test tail_only mode validation
    // TODO: Test standard mode (all directions)
  });

  describe('Speed Updates', () => {
    it('should set base speed when not boosting or braking', () => {
      const player = createPlayerState("player1");
      const config = createDefaultConfig();

      updatePlayerSpeed(player, false, config);
      expect(player.speed).toBe(config.baseSpeed);
    });

    it('should set boost speed when slipstreaming', () => {
      const player = createPlayerState("player1");
      const config = createDefaultConfig();

      updatePlayerSpeed(player, true, config);
      expect(player.speed).toBe(config.boostSpeed);
    });

    it('should set brake speed when braking', () => {
      const player = createPlayerState("player1", { is_braking: true });
      const config = createDefaultConfig();

      updatePlayerSpeed(player, true, config); // Even if boosting
      expect(player.speed).toBe(CONSTANTS.BRAKE_SPEED);
    });

    it('should prioritize brake over boost', () => {
      const player = createPlayerState("player1", { is_braking: true });
      const config = createDefaultConfig();

      updatePlayerSpeed(player, true, config);
      expect(player.speed).toBeLessThan(config.boostSpeed);
    });

    // TODO: Test speed transitions (smooth acceleration/deceleration)
  });

  describe('Collision Detection', () => {
    it('should detect trail collision', () => {
      const player = createPlayerState("player1", { x: 0, z: 0, alive: true });
      const segments = [{
        pid: "player2",
        x1: 1, z1: 0,
        x2: 1, z2: 5
      }];

      const result = checkTrailCollision(player, segments, 2.0);
      expect(result).not.toBeNull();
      expect(result.collided).toBe(true);
    });

    it('should not detect collision when far from trail', () => {
      const player = createPlayerState("player1", { x: 0, z: 0, alive: true });
      const segments = [{
        pid: "player2",
        x1: 100, z1: 100,
        x2: 100, z2: 110
      }];

      const result = checkTrailCollision(player, segments, 2.0);
      expect(result).toBeNull();
    });

    it('should not detect collision with own trail', () => {
      const player = createPlayerState("player1", { x: 0, z: 0, alive: true });
      const segments = [{
        pid: "player1",
        x1: 1, z1: 0,
        x2: 1, z2: 5
      }];

      const result = checkTrailCollision(player, segments, 2.0);
      expect(result).toBeNull();
    });

    it('should not detect collision for dead player', () => {
      const player = createPlayerState("player1", { x: 0, z: 0, alive: false });
      const segments = [{
        pid: "player2",
        x1: 1, z1: 0,
        x2: 1, z2: 5
      }];

      const result = checkTrailCollision(player, segments, 2.0);
      expect(result).toBeNull();
    });

    // TODO: Test collision with different death radius values
    // TODO: Test multiple segment collisions
  });

  describe('Arena Bounds', () => {
    it('should detect out of bounds on positive X', () => {
      const player = createPlayerState("player1", { x: 201, z: 0 });
      expect(isOutOfBounds(player)).toBe(true);
    });

    it('should detect out of bounds on negative X', () => {
      const player = createPlayerState("player1", { x: -201, z: 0 });
      expect(isOutOfBounds(player)).toBe(true);
    });

    it('should detect out of bounds on positive Z', () => {
      const player = createPlayerState("player1", { x: 0, z: 201 });
      expect(isOutOfBounds(player)).toBe(true);
    });

    it('should detect out of bounds on negative Z', () => {
      const player = createPlayerState("player1", { x: 0, z: -201 });
      expect(isOutOfBounds(player)).toBe(true);
    });

    it('should allow position on boundary', () => {
      const player = createPlayerState("player1", { x: 200, z: 200 });
      expect(isOutOfBounds(player)).toBe(false);
    });

    it('should allow position inside arena', () => {
      const player = createPlayerState("player1", { x: 0, z: 0 });
      expect(isOutOfBounds(player)).toBe(false);
    });

    // TODO: Test with custom arena sizes
  });

  describe('Camera Shake', () => {
    it('should initialize camera shake to 0', () => {
      const state = createInitialState();
      expect(state.cameraShake).toBe(0);
    });

    it('should set camera shake on death', () => {
      const state = createInitialState();
      state.cameraShake = 0.5; // Death effect
      expect(state.cameraShake).toBeGreaterThan(0);
    });

    it('should decay camera shake over time', () => {
      const state = createInitialState();
      state.cameraShake = 0.5;

      // Simulate decay
      state.cameraShake = Math.max(0, state.cameraShake - 0.1);
      expect(state.cameraShake).toBe(0.4);
    });

    // TODO: Test camera shake integration with rendering
  });

  describe('State Serialization', () => {
    it('should serialize player state to JSON', () => {
      const player = createPlayerState("player1", { x: 100, z: 50 });
      const json = JSON.stringify(player);
      const parsed = JSON.parse(json);

      expect(parsed.id).toBe("player1");
      expect(parsed.x).toBe(100);
      expect(parsed.z).toBe(50);
    });

    it('should handle turnPoints in serialization', () => {
      const player = createPlayerState("player1");
      player.turnPoints = [{ x: 10, z: 20 }, { x: 30, z: 40 }];

      const json = JSON.stringify(player);
      const parsed = JSON.parse(json);

      expect(parsed.turnPoints).toHaveLength(2);
    });

    // TODO: Test state hydration from JSON
    // TODO: Test state diffing for network optimization
  });
});
