/**
 * Configuration Module Tests for Cyber Cycles
 *
 * Comprehensive test suite for the Config module.
 * Tests cover:
 * - Configuration constants
 * - Validation functions
 * - Import/Export functionality
 * - Preset management
 * - Config builder
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    PHYSICS_CONFIG,
    GAME_CONFIG,
    COLLISION_CONFIG,
    VISUAL_CONFIG,
    AUDIO_CONFIG,
    PRESETS,
    validatePhysicsConfig,
    validateGameConfig,
    validateCollisionConfig,
    validateConfig,
    exportConfig,
    importConfig,
    mergeConfig,
    getDefaultConfig,
    getPreset,
    listPresets,
    resetConfig,
    createConfigBuilder
} from '../../src/core/Config.js';

// ============================================================================
// Configuration Constants Tests
// ============================================================================

describe('Configuration Constants', () => {
    describe('PHYSICS_CONFIG', () => {
        it('should have required physics properties', () => {
            expect(PHYSICS_CONFIG).toHaveProperty('baseSpeed');
            expect(PHYSICS_CONFIG).toHaveProperty('boostSpeed');
            expect(PHYSICS_CONFIG).toHaveProperty('brakeSpeed');
            expect(PHYSICS_CONFIG).toHaveProperty('acceleration');
            expect(PHYSICS_CONFIG).toHaveProperty('turnSpeed');
            expect(PHYSICS_CONFIG).toHaveProperty('turnDelay');
            expect(PHYSICS_CONFIG).toHaveProperty('turnPenalty');
            expect(PHYSICS_CONFIG).toHaveProperty('damping');
            expect(PHYSICS_CONFIG).toHaveProperty('EPS');
        });

        it('should have correct default values', () => {
            expect(PHYSICS_CONFIG.baseSpeed).toBe(40.0);
            expect(PHYSICS_CONFIG.boostSpeed).toBe(70.0);
            expect(PHYSICS_CONFIG.brakeSpeed).toBe(20.0);
            expect(PHYSICS_CONFIG.turnSpeed).toBe(3.0);
            expect(PHYSICS_CONFIG.turnDelay).toBe(0.08);
            expect(PHYSICS_CONFIG.turnPenalty).toBe(0.05);
            expect(PHYSICS_CONFIG.damping).toBe(0.0);
            expect(PHYSICS_CONFIG.EPS).toBe(0.01);
        });

        it('should be frozen (immutable)', () => {
            expect(Object.isFrozen(PHYSICS_CONFIG)).toBe(true);
        });

        it('should have boostSpeed greater than baseSpeed', () => {
            expect(PHYSICS_CONFIG.boostSpeed).toBeGreaterThan(PHYSICS_CONFIG.baseSpeed);
        });

        it('should have brakeSpeed less than baseSpeed', () => {
            expect(PHYSICS_CONFIG.brakeSpeed).toBeLessThan(PHYSICS_CONFIG.baseSpeed);
        });
    });

    describe('GAME_CONFIG', () => {
        it('should have required game properties', () => {
            expect(GAME_CONFIG).toHaveProperty('arenaSize');
            expect(GAME_CONFIG).toHaveProperty('maxPlayers');
            expect(GAME_CONFIG).toHaveProperty('minPlayers');
            expect(GAME_CONFIG).toHaveProperty('countdownDuration');
            expect(GAME_CONFIG).toHaveProperty('respawnDelay');
            expect(GAME_CONFIG).toHaveProperty('slipstreamMode');
        });

        it('should have correct default values', () => {
            expect(GAME_CONFIG.arenaSize).toBe(200);
            expect(GAME_CONFIG.maxPlayers).toBe(6);
            expect(GAME_CONFIG.minPlayers).toBe(2);
            expect(GAME_CONFIG.countdownDuration).toBe(3);
            expect(GAME_CONFIG.respawnDelay).toBe(2.0);
            expect(GAME_CONFIG.slipstreamMode).toBe('tail_only');
        });

        it('should be frozen (immutable)', () => {
            expect(Object.isFrozen(GAME_CONFIG)).toBe(true);
        });

        it('should have valid slipstream mode', () => {
            expect(['standard', 'tail_only']).toContain(GAME_CONFIG.slipstreamMode);
        });
    });

    describe('COLLISION_CONFIG', () => {
        it('should have required collision properties', () => {
            expect(COLLISION_CONFIG).toHaveProperty('deathRadius');
            expect(COLLISION_CONFIG).toHaveProperty('bikeCollisionDist');
            expect(COLLISION_CONFIG).toHaveProperty('boostRadius');
            expect(COLLISION_CONFIG).toHaveProperty('trailSpacing');
            expect(COLLISION_CONFIG).toHaveProperty('maxTrailLength');
        });

        it('should have correct default values', () => {
            expect(COLLISION_CONFIG.deathRadius).toBe(2.0);
            expect(COLLISION_CONFIG.bikeCollisionDist).toBe(4.0);
            expect(COLLISION_CONFIG.boostRadius).toBe(5.0);
            expect(COLLISION_CONFIG.trailSpacing).toBe(2.0);
            expect(COLLISION_CONFIG.maxTrailLength).toBe(200);
        });

        it('should be frozen (immutable)', () => {
            expect(Object.isFrozen(COLLISION_CONFIG)).toBe(true);
        });
    });

    describe('VISUAL_CONFIG', () => {
        it('should have required visual properties', () => {
            expect(VISUAL_CONFIG).toHaveProperty('gridSize');
            expect(VISUAL_CONFIG).toHaveProperty('gridColor');
            expect(VISUAL_CONFIG).toHaveProperty('wallColor');
            expect(VISUAL_CONFIG).toHaveProperty('fogEnabled');
        });

        it('should be frozen (immutable)', () => {
            expect(Object.isFrozen(VISUAL_CONFIG)).toBe(true);
        });
    });

    describe('AUDIO_CONFIG', () => {
        it('should have required audio properties', () => {
            expect(AUDIO_CONFIG).toHaveProperty('masterVolume');
            expect(AUDIO_CONFIG).toHaveProperty('musicVolume');
            expect(AUDIO_CONFIG).toHaveProperty('sfxVolume');
            expect(AUDIO_CONFIG).toHaveProperty('sfxEnabled');
        });

        it('should have valid volume ranges', () => {
            expect(AUDIO_CONFIG.masterVolume).toBeGreaterThanOrEqual(0);
            expect(AUDIO_CONFIG.masterVolume).toBeLessThanOrEqual(1);
            expect(AUDIO_CONFIG.musicVolume).toBeGreaterThanOrEqual(0);
            expect(AUDIO_CONFIG.musicVolume).toBeLessThanOrEqual(1);
            expect(AUDIO_CONFIG.sfxVolume).toBeGreaterThanOrEqual(0);
            expect(AUDIO_CONFIG.sfxVolume).toBeLessThanOrEqual(1);
        });

        it('should be frozen (immutable)', () => {
            expect(Object.isFrozen(AUDIO_CONFIG)).toBe(true);
        });
    });
});

// ============================================================================
// Preset Tests
// ============================================================================

describe('PRESETS', () => {
    it('should have default preset', () => {
        expect(PRESETS).toHaveProperty('default');
        expect(PRESETS.default).toHaveProperty('physics');
        expect(PRESETS.default).toHaveProperty('game');
        expect(PRESETS.default).toHaveProperty('collision');
    });

    it('should have arcade preset', () => {
        expect(PRESETS).toHaveProperty('arcade');
        expect(PRESETS.arcade.physics.baseSpeed).toBeGreaterThan(PHYSICS_CONFIG.baseSpeed);
    });

    it('should have simulation preset', () => {
        expect(PRESETS).toHaveProperty('simulation');
        expect(PRESETS.simulation.physics.baseSpeed).toBeLessThan(PHYSICS_CONFIG.baseSpeed);
    });

    it('should have practice preset', () => {
        expect(PRESETS).toHaveProperty('practice');
        expect(PRESETS.practice.game.respawnDelay).toBeLessThan(GAME_CONFIG.respawnDelay);
    });

    it('should have competitive preset', () => {
        expect(PRESETS).toHaveProperty('competitive');
        expect(PRESETS.competitive.physics.baseSpeed).toBe(PHYSICS_CONFIG.baseSpeed);
    });
});

// ============================================================================
// Validation Tests
// ============================================================================

describe('validatePhysicsConfig', () => {
    it('should validate correct config', () => {
        const config = {
            baseSpeed: 40,
            boostSpeed: 70,
            brakeSpeed: 20,
            turnSpeed: 3,
            turnDelay: 0.08,
            turnPenalty: 0.05,
            damping: 0,
            EPS: 0.01,
            fixedTimeStep: 1/60,
            maxTimeStep: 1/30
        };

        const result = validatePhysicsConfig(config);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('should reject null config', () => {
        const result = validatePhysicsConfig(null);
        expect(result.valid).toBe(false);
        expect(result.errors).toContainEqual(expect.stringContaining('null'));
    });

    it('should reject invalid baseSpeed', () => {
        const config = { ...PHYSICS_CONFIG, baseSpeed: -10 };
        const result = validatePhysicsConfig(config);
        expect(result.valid).toBe(false);
        expect(result.errors).toContainEqual(expect.stringContaining('baseSpeed'));
    });

    it('should reject boostSpeed less than baseSpeed', () => {
        const config = { ...PHYSICS_CONFIG, boostSpeed: 30 };
        const result = validatePhysicsConfig(config);
        expect(result.valid).toBe(false);
        expect(result.errors).toContainEqual(expect.stringContaining('boostSpeed'));
    });

    it('should reject invalid brakeSpeed', () => {
        const config = { ...PHYSICS_CONFIG, brakeSpeed: 50 };
        const result = validatePhysicsConfig(config);
        expect(result.valid).toBe(false);
        expect(result.errors).toContainEqual(expect.stringContaining('brakeSpeed'));
    });

    it('should reject invalid turnPenalty', () => {
        const config = { ...PHYSICS_CONFIG, turnPenalty: 1.5 };
        const result = validatePhysicsConfig(config);
        expect(result.valid).toBe(false);
        expect(result.errors).toContainEqual(expect.stringContaining('turnPenalty'));
    });

    it('should reject invalid damping', () => {
        const config = { ...PHYSICS_CONFIG, damping: 1.5 };
        const result = validatePhysicsConfig(config);
        expect(result.valid).toBe(false);
        expect(result.errors).toContainEqual(expect.stringContaining('damping'));
    });
});

describe('validateGameConfig', () => {
    it('should validate correct config', () => {
        const config = {
            arenaSize: 200,
            maxPlayers: 6,
            minPlayers: 2,
            countdownDuration: 3,
            respawnDelay: 2,
            slipstreamMode: 'tail_only',
            aiDifficulty: 'medium',
            cameraSmooth: 0.1,
            cameraDistance: 100,
            fieldOfView: 70
        };

        const result = validateGameConfig(config);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('should reject null config', () => {
        const result = validateGameConfig(null);
        expect(result.valid).toBe(false);
    });

    it('should reject invalid maxPlayers', () => {
        const config = { ...GAME_CONFIG, maxPlayers: 1 };
        const result = validateGameConfig(config);
        expect(result.valid).toBe(false);
        expect(result.errors).toContainEqual(expect.stringContaining('maxPlayers'));
    });

    it('should reject invalid slipstreamMode', () => {
        const config = { ...GAME_CONFIG, slipstreamMode: 'invalid' };
        const result = validateGameConfig(config);
        expect(result.valid).toBe(false);
        expect(result.errors).toContainEqual(expect.stringContaining('slipstreamMode'));
    });

    it('should reject invalid aiDifficulty', () => {
        const config = { ...GAME_CONFIG, aiDifficulty: 'expert' };
        const result = validateGameConfig(config);
        expect(result.valid).toBe(false);
        expect(result.errors).toContainEqual(expect.stringContaining('aiDifficulty'));
    });

    it('should reject invalid cameraSmooth', () => {
        const config = { ...GAME_CONFIG, cameraSmooth: 1.5 };
        const result = validateGameConfig(config);
        expect(result.valid).toBe(false);
        expect(result.errors).toContainEqual(expect.stringContaining('cameraSmooth'));
    });
});

describe('validateCollisionConfig', () => {
    it('should validate correct config', () => {
        const config = {
            deathRadius: 2,
            bikeCollisionDist: 4,
            boostRadius: 5,
            trailSpacing: 2,
            maxTrailLength: 200,
            spawnRadius: 100,
            minSpawnDistance: 50,
            ccdIterations: 4
        };

        const result = validateCollisionConfig(config);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('should reject null config', () => {
        const result = validateCollisionConfig(null);
        expect(result.valid).toBe(false);
    });

    it('should reject invalid deathRadius', () => {
        const config = { ...COLLISION_CONFIG, deathRadius: 0 };
        const result = validateCollisionConfig(config);
        expect(result.valid).toBe(false);
        expect(result.errors).toContainEqual(expect.stringContaining('deathRadius'));
    });

    it('should reject invalid ccdIterations', () => {
        const config = { ...COLLISION_CONFIG, ccdIterations: 0 };
        const result = validateCollisionConfig(config);
        expect(result.valid).toBe(false);
        expect(result.errors).toContainEqual(expect.stringContaining('ccdIterations'));
    });
});

describe('validateConfig', () => {
    it('should validate complete config', () => {
        const config = {
            physics: PHYSICS_CONFIG,
            game: GAME_CONFIG,
            collision: COLLISION_CONFIG
        };

        const result = validateConfig(config);
        expect(result.valid).toBe(true);
    });

    it('should return errors per section', () => {
        const config = {
            physics: { baseSpeed: -10 },
            game: { maxPlayers: 1 }
        };

        const result = validateConfig(config);
        expect(result.valid).toBe(false);
        expect(result.errors).toHaveProperty('physics');
        expect(result.errors).toHaveProperty('game');
    });

    it('should handle empty config', () => {
        const result = validateConfig({});
        expect(result.valid).toBe(true);
    });
});

// ============================================================================
// Import/Export Tests
// ============================================================================

describe('exportConfig', () => {
    it('should export config to JSON string', () => {
        const config = { physics: { baseSpeed: 40 } };
        const json = exportConfig(config, false);

        expect(json).toContain('baseSpeed');
        expect(json).toContain('40');
    });

    it('should pretty print when requested', () => {
        const config = { physics: { baseSpeed: 40 } };
        const json = exportConfig(config, true);

        expect(json).toContain('\n');
    });

    it('should handle null config', () => {
        const result = exportConfig(null);
        expect(result).toBeNull();
    });
});

describe('importConfig', () => {
    it('should import valid JSON config', () => {
        const json = JSON.stringify({
            physics: { ...PHYSICS_CONFIG },
            game: { ...GAME_CONFIG },
            collision: { ...COLLISION_CONFIG }
        });

        const result = importConfig(json);
        expect(result.success).toBe(true);
        expect(result.config).toHaveProperty('physics');
        expect(result.config).toHaveProperty('game');
    });

    it('should reject invalid JSON', () => {
        const result = importConfig('not valid json');
        expect(result.success).toBe(false);
        expect(result.error).toContain('parse');
    });

    it('should validate imported config', () => {
        const json = JSON.stringify({
            physics: { baseSpeed: -10 }
        });

        const result = importConfig(json);
        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid');
    });
});

// ============================================================================
// Merge Config Tests
// ============================================================================

describe('mergeConfig', () => {
    it('should merge two configs', () => {
        const base = { physics: { baseSpeed: 40, boostSpeed: 70 } };
        const override = { physics: { baseSpeed: 50 } };

        const merged = mergeConfig(base, override);

        expect(merged.physics.baseSpeed).toBe(50);
        expect(merged.physics.boostSpeed).toBe(70);
    });

    it('should handle null base', () => {
        const override = { physics: { baseSpeed: 50 } };
        const merged = mergeConfig(null, override);

        expect(merged.physics.baseSpeed).toBe(50);
    });

    it('should handle null override', () => {
        const base = { physics: { baseSpeed: 40 } };
        const merged = mergeConfig(base, null);

        expect(merged.physics.baseSpeed).toBe(40);
    });

    it('should deep merge nested objects', () => {
        const base = {
            physics: { baseSpeed: 40, nested: { a: 1, b: 2 } }
        };
        const override = {
            physics: { nested: { a: 10 } }
        };

        const merged = mergeConfig(base, override);

        expect(merged.physics.nested.a).toBe(10);
        expect(merged.physics.nested.b).toBe(2);
    });
});

// ============================================================================
// Default Config Tests
// ============================================================================

describe('getDefaultConfig', () => {
    it('should return complete default config', () => {
        const config = getDefaultConfig();

        expect(config).toHaveProperty('physics');
        expect(config).toHaveProperty('game');
        expect(config).toHaveProperty('collision');
        expect(config).toHaveProperty('visual');
        expect(config).toHaveProperty('audio');
    });

    it('should return independent copies', () => {
        const config1 = getDefaultConfig();
        const config2 = getDefaultConfig();

        config1.physics.baseSpeed = 100;

        expect(config2.physics.baseSpeed).toBe(PHYSICS_CONFIG.baseSpeed);
    });
});

// ============================================================================
// Preset Management Tests
// ============================================================================

describe('getPreset', () => {
    it('should return preset by name', () => {
        const preset = getPreset('arcade');

        expect(preset).not.toBeNull();
        expect(preset.physics.baseSpeed).toBeGreaterThan(PHYSICS_CONFIG.baseSpeed);
    });

    it('should return deep copy', () => {
        const preset1 = getPreset('arcade');
        const preset2 = getPreset('arcade');

        preset1.physics.baseSpeed = 999;

        expect(preset2.physics.baseSpeed).not.toBe(999);
    });

    it('should return null for unknown preset', () => {
        const preset = getPreset('nonexistent');
        expect(preset).toBeNull();
    });
});

describe('listPresets', () => {
    it('should return array of preset names', () => {
        const presets = listPresets();

        expect(Array.isArray(presets)).toBe(true);
        expect(presets).toContain('default');
        expect(presets).toContain('arcade');
        expect(presets).toContain('simulation');
        expect(presets).toContain('practice');
        expect(presets).toContain('competitive');
    });
});

// ============================================================================
// Reset Config Tests
// ============================================================================

describe('resetConfig', () => {
    it('should reset config to defaults', () => {
        const config = {
            physics: { baseSpeed: 999, boostSpeed: 999 }
        };

        const reset = resetConfig(config);

        expect(reset.physics.baseSpeed).toBe(PHYSICS_CONFIG.baseSpeed);
        expect(reset.physics.boostSpeed).toBe(PHYSICS_CONFIG.boostSpeed);
    });
});

// ============================================================================
// Config Builder Tests
// ============================================================================

describe('createConfigBuilder', () => {
    it('should create builder with default config', () => {
        const builder = createConfigBuilder();
        const config = builder.build();

        expect(config.physics.baseSpeed).toBe(PHYSICS_CONFIG.baseSpeed);
    });

    it('should allow chaining withPhysics', () => {
        const builder = createConfigBuilder();
        const config = builder
            .withPhysics({ baseSpeed: 50 })
            .build();

        expect(config.physics.baseSpeed).toBe(50);
        expect(config.physics.boostSpeed).toBe(PHYSICS_CONFIG.boostSpeed);
    });

    it('should allow chaining withGame', () => {
        const builder = createConfigBuilder();
        const config = builder
            .withGame({ arenaSize: 300 })
            .build();

        expect(config.game.arenaSize).toBe(300);
    });

    it('should allow chaining withCollision', () => {
        const builder = createConfigBuilder();
        const config = builder
            .withCollision({ deathRadius: 3 })
            .build();

        expect(config.collision.deathRadius).toBe(3);
    });

    it('should allow chaining withVisual', () => {
        const builder = createConfigBuilder();
        const config = builder
            .withVisual({ fogEnabled: false })
            .build();

        expect(config.visual.fogEnabled).toBe(false);
    });

    it('should allow chaining withAudio', () => {
        const builder = createConfigBuilder();
        const config = builder
            .withAudio({ masterVolume: 0.5 })
            .build();

        expect(config.audio.masterVolume).toBe(0.5);
    });

    it('should allow loading from preset', () => {
        const builder = createConfigBuilder();
        const config = builder
            .fromPreset('arcade')
            .build();

        expect(config.physics.baseSpeed).toBeGreaterThan(PHYSICS_CONFIG.baseSpeed);
    });

    it('should validate before building', () => {
        const builder = createConfigBuilder();
        const result = builder
            .withPhysics({ baseSpeed: -10 })
            .validate();

        expect(result.valid).toBe(false);
    });

    it('should throw on invalid build', () => {
        const builder = createConfigBuilder();
        builder.withPhysics({ baseSpeed: -10 });

        expect(() => builder.build()).toThrow();
    });

    it('should allow multiple chained calls', () => {
        const builder = createConfigBuilder();
        const config = builder
            .withPhysics({ baseSpeed: 50 })
            .withGame({ arenaSize: 300 })
            .withCollision({ deathRadius: 3 })
            .build();

        expect(config.physics.baseSpeed).toBe(50);
        expect(config.game.arenaSize).toBe(300);
        expect(config.collision.deathRadius).toBe(3);
    });
});
