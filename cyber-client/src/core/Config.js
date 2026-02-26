/**
 * Configuration Module for Cyber Cycles
 *
 * Centralized configuration management for physics, game settings,
 * and collision detection parameters.
 *
 * Features:
 * - Type-safe configuration objects
 * - Validation helpers
 * - Preset export/import
 * - Runtime configuration updates
 *
 * @module Config
 */

// ============================================================================
// Physics Configuration
// ============================================================================

/**
 * Physics constants for game simulation
 *
 * These values control the core physics behavior of the game.
 * All speeds are in units/second, accelerations in units/second².
 */
export const PHYSICS_CONFIG = Object.freeze({
    /** Base movement speed (units/second) */
    baseSpeed: 40.0,

    /** Boost speed when in slipstream (units/second) */
    boostSpeed: 70.0,

    /** Brake speed (units/second) */
    brakeSpeed: 20.0,

    /** Acceleration rate (units/second²) */
    acceleration: 15.0,

    /** Turn speed in radians/second */
    turnSpeed: 3.0,

    /** Minimum seconds between turns (prevents jitter) */
    turnDelay: 0.08,

    /** Speed loss percentage per turn (0.05 = 5%) */
    turnPenalty: 0.05,

    /** Damping factor (0 = no damping, energy conserved) */
    damping: 0.0,

    /** Epsilon for floating-point comparisons */
    EPS: 0.01,

    /** Fixed time step for physics (seconds) */
    fixedTimeStep: 1 / 60,

    /** Maximum time step to prevent tunneling (seconds) */
    maxTimeStep: 1 / 30,

    /** Sub-stepping iterations for stability */
    subSteps: 1,

    /** Velocity threshold for sleeping (units/second) */
    sleepThreshold: 0.01,

    /** Gravity (not used in top-down, but available) */
    gravity: 0.0,

    /** Enable Tron-style 90° instant turns (default: false for smooth turning) */
    tronStyleTurning: false,

    /** Cooldown between 90° turns in seconds (prevents spinning) */
    turnCooldown: 0.15,

    /** Turn angle for instant turns in radians (PI/2 = 90°) */
    turnAngle: Math.PI / 2
});

// ============================================================================
// Game Configuration
// ============================================================================

/**
 * Game settings and rules
 *
 * Controls game mechanics, arena settings, and player options.
 */
export const GAME_CONFIG = Object.freeze({
    /** Arena half-size (full size is 400x400) */
    arenaSize: 200,

    /** Arena wall thickness for rendering */
    wallThickness: 2,

    /** Number of players per match */
    maxPlayers: 6,

    /** Minimum players to start match */
    minPlayers: 2,

    /** Countdown duration before race starts (seconds) */
    countdownDuration: 3,

    /** Respawn delay after death (seconds) */
    respawnDelay: 2.0,

    /** Match duration limit (0 = unlimited, seconds) */
    matchDuration: 0,

    /** Points per elimination */
    pointsPerKill: 1,

    /** Points per survival (end of round) */
    pointsPerSurvival: 3,

    /** Rounds to win match (0 = single round) */
    roundsToWin: 0,

    /** Slipstream mode: "standard" or "tail_only" */
    slipstreamMode: "tail_only",

    /** AI difficulty: "easy", "medium", "hard" */
    aiDifficulty: "medium",

    /** Camera follow smoothing (0-1) */
    cameraSmooth: 0.1,

    /** Camera distance from player */
    cameraDistance: 100,

    /** Camera height above arena */
    cameraHeight: 30,

    /** Field of view in degrees */
    fieldOfView: 70,

    /** Enable particle effects */
    particlesEnabled: true,

    /** Enable screen shake */
    screenShakeEnabled: true,

    /** Enable motion blur */
    motionBlurEnabled: false,

    /** Target frame rate (0 = unlimited) */
    targetFrameRate: 60,

    /** Enable vsync */
    vsyncEnabled: true
});

// ============================================================================
// Collision Configuration
// ============================================================================

/**
 * Collision detection thresholds and parameters
 *
 * Fine-tune collision behavior for gameplay balance.
 */
export const COLLISION_CONFIG = Object.freeze({
    /** Death radius - distance to trail that causes death */
    deathRadius: 2.0,

    /** Bike collision distance (bike-to-bike) */
    bikeCollisionDist: 4.0,

    /** Boost radius for slipstream detection */
    boostRadius: 5.0,

    /** Trail point spacing (units between points) */
    trailSpacing: 2.0,

    /** Trail height for rendering */
    trailHeight: 2.0,

    /** Maximum trail length (units) */
    maxTrailLength: 200,

    /** Recent trail segments count (for rendering emphasis) */
    recentTrailCount: 5,

    /** Spawn radius from center */
    spawnRadius: 100,

    /** Minimum spawn distance from center */
    minSpawnDistance: 50,

    /** Collision check iterations for CCD */
    ccdIterations: 4,

    /** Continuous collision threshold */
    ccdThreshold: 10.0,

    /** Spatial hash cell size */
    spatialHashCellSize: 20.0,

    /** Broadphase collision margin */
    broadphaseMargin: 10.0,

    /** Narrowphase precision */
    narrowphasePrecision: 0.001,

    /** Collision cooldown (seconds between checks) */
    collisionCooldown: 0.016,

    /** Self-collision enabled */
    selfCollisionEnabled: false,

    /** Team collision enabled */
    teamCollisionEnabled: true
});

// ============================================================================
// Visual Configuration
// ============================================================================

/**
 * Visual and rendering settings
 */
export const VISUAL_CONFIG = Object.freeze({
    /** Grid cell size */
    gridSize: 10,

    /** Grid color */
    gridColor: 0x002233,

    /** Grid highlight color */
    gridHighlightColor: 0x00ffff,

    /** Wall color */
    wallColor: 0xff0000,

    /** Wall opacity */
    wallOpacity: 0.5,

    /** Floor color */
    floorColor: 0x000011,

    /** Floor opacity */
    floorOpacity: 0.3,

    /** Boost effect color */
    boostColor: 0x00ffff,

    /** Boost effect opacity */
    boostOpacity: 0.7,

    /** Death explosion particle count */
    explosionParticles: 80,

    /** Particle lifetime (seconds) */
    particleLifetime: 1.5,

    /** Glow effect enabled */
    glowEnabled: true,

    /** Glow intensity */
    glowIntensity: 0.4,

    /** Bloom threshold */
    bloomThreshold: 0.8,

    /** Bloom strength */
    bloomStrength: 0.5,

    /** Bloom radius */
    bloomRadius: 0.4,

    /** Anti-aliasing enabled */
    antialiasEnabled: true,

    /** Shadow enabled */
    shadowsEnabled: false,

    /** Fog enabled */
    fogEnabled: true,

    /** Fog density */
    fogDensity: 0.0025,

    /** Fog color */
    fogColor: 0x000000
});

// ============================================================================
// Audio Configuration
// ============================================================================

/**
 * Audio settings
 */
export const AUDIO_CONFIG = Object.freeze({
    /** Master volume (0-1) */
    masterVolume: 0.8,

    /** Music volume (0-1) */
    musicVolume: 0.5,

    /** SFX volume (0-1) */
    sfxVolume: 0.7,

    /** Enable sound effects */
    sfxEnabled: true,

    /** Enable background music */
    musicEnabled: true,

    /** Enable voice chat */
    voiceEnabled: false,

    /** Audio fade time (seconds) */
    fadeTime: 0.5,

    /** Doppler effect enabled */
    dopplerEnabled: false,

    /** 3D audio enabled */
    audio3DEnabled: false
});

// ============================================================================
// Default Presets
// ============================================================================

/**
 * Predefined configuration presets
 */
export const PRESETS = {
    /** Default balanced settings */
    default: {
        physics: { ...PHYSICS_CONFIG },
        game: { ...GAME_CONFIG },
        collision: { ...COLLISION_CONFIG },
        visual: { ...VISUAL_CONFIG },
        audio: { ...AUDIO_CONFIG }
    },

    /** Fast-paced arcade mode */
    arcade: {
        physics: {
            ...PHYSICS_CONFIG,
            baseSpeed: 50.0,
            boostSpeed: 90.0,
            turnSpeed: 4.0,
            turnPenalty: 0.02
        },
        game: {
            ...GAME_CONFIG,
            slipstreamMode: "standard"
        },
        collision: {
            ...COLLISION_CONFIG,
            deathRadius: 2.5,
            boostRadius: 8.0
        }
    },

    /** Realistic simulation mode */
    simulation: {
        physics: {
            ...PHYSICS_CONFIG,
            baseSpeed: 30.0,
            boostSpeed: 55.0,
            turnSpeed: 2.0,
            turnPenalty: 0.1,
            damping: 0.02
        },
        collision: {
            ...COLLISION_CONFIG,
            deathRadius: 1.5,
            bikeCollisionDist: 3.0,
            ccdIterations: 8
        }
    },

    /** Practice/training mode */
    practice: {
        physics: {
            ...PHYSICS_CONFIG,
            baseSpeed: 35.0,
            turnSpeed: 2.5,
            turnPenalty: 0.0
        },
        game: {
            ...GAME_CONFIG,
            respawnDelay: 0.5,
            aiDifficulty: "easy"
        },
        collision: {
            ...COLLISION_CONFIG,
            deathRadius: 3.0,
            selfCollisionEnabled: true
        }
    },

    /** Competitive tournament settings */
    competitive: {
        physics: {
            ...PHYSICS_CONFIG,
            baseSpeed: 40.0,
            boostSpeed: 70.0,
            turnSpeed: 3.0,
            turnPenalty: 0.05
        },
        game: {
            ...GAME_CONFIG,
            slipstreamMode: "tail_only",
            aiDifficulty: "hard"
        },
        collision: {
            ...COLLISION_CONFIG,
            deathRadius: 2.0,
            bikeCollisionDist: 4.0
        }
    }
};

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate physics configuration
 *
 * @param {object} config - Config object to validate
 * @returns {{valid: boolean, errors: string[]}} Validation result
 */
export function validatePhysicsConfig(config) {
    const errors = [];

    if (!config) {
        return { valid: false, errors: ['Config is null or undefined'] };
    }

    // Speed validations
    if (typeof config.baseSpeed !== 'number' || config.baseSpeed <= 0) {
        errors.push('baseSpeed must be a positive number');
    }
    if (typeof config.boostSpeed !== 'number' || config.boostSpeed <= config.baseSpeed) {
        errors.push('boostSpeed must be greater than baseSpeed');
    }
    if (typeof config.brakeSpeed !== 'number' || config.brakeSpeed <= 0 || config.brakeSpeed >= config.baseSpeed) {
        errors.push('brakeSpeed must be between 0 and baseSpeed');
    }

    // Turn validations
    if (typeof config.turnSpeed !== 'number' || config.turnSpeed <= 0) {
        errors.push('turnSpeed must be a positive number');
    }
    if (typeof config.turnDelay !== 'number' || config.turnDelay < 0) {
        errors.push('turnDelay must be non-negative');
    }
    if (typeof config.turnPenalty !== 'number' || config.turnPenalty < 0 || config.turnPenalty > 1) {
        errors.push('turnPenalty must be between 0 and 1');
    }

    // Damping validation
    if (typeof config.damping !== 'number' || config.damping < 0 || config.damping >= 1) {
        errors.push('damping must be between 0 (inclusive) and 1 (exclusive)');
    }

    // Epsilon validation
    if (typeof config.EPS !== 'number' || config.EPS <= 0) {
        errors.push('EPS must be a positive number');
    }

    // Time step validations
    if (typeof config.fixedTimeStep !== 'number' || config.fixedTimeStep <= 0) {
        errors.push('fixedTimeStep must be a positive number');
    }
    if (typeof config.maxTimeStep !== 'number' || config.maxTimeStep < config.fixedTimeStep) {
        errors.push('maxTimeStep must be >= fixedTimeStep');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate game configuration
 *
 * @param {object} config - Config object to validate
 * @returns {{valid: boolean, errors: string[]}} Validation result
 */
export function validateGameConfig(config) {
    const errors = [];

    if (!config) {
        return { valid: false, errors: ['Config is null or undefined'] };
    }

    // Arena validation
    if (typeof config.arenaSize !== 'number' || config.arenaSize <= 0) {
        errors.push('arenaSize must be a positive number');
    }

    // Player count validations
    if (typeof config.maxPlayers !== 'number' || config.maxPlayers < 2) {
        errors.push('maxPlayers must be at least 2');
    }
    if (typeof config.minPlayers !== 'number' || config.minPlayers < 2 || config.minPlayers > config.maxPlayers) {
        errors.push('minPlayers must be between 2 and maxPlayers');
    }

    // Time validations
    if (typeof config.countdownDuration !== 'number' || config.countdownDuration < 0) {
        errors.push('countdownDuration must be non-negative');
    }
    if (typeof config.respawnDelay !== 'number' || config.respawnDelay < 0) {
        errors.push('respawnDelay must be non-negative');
    }

    // Slipstream mode validation
    if (!['standard', 'tail_only'].includes(config.slipstreamMode)) {
        errors.push('slipstreamMode must be "standard" or "tail_only"');
    }

    // AI difficulty validation
    if (!['easy', 'medium', 'hard'].includes(config.aiDifficulty)) {
        errors.push('aiDifficulty must be "easy", "medium", or "hard"');
    }

    // Camera validations
    if (typeof config.cameraSmooth !== 'number' || config.cameraSmooth < 0 || config.cameraSmooth > 1) {
        errors.push('cameraSmooth must be between 0 and 1');
    }
    if (typeof config.cameraDistance !== 'number' || config.cameraDistance <= 0) {
        errors.push('cameraDistance must be positive');
    }
    if (typeof config.fieldOfView !== 'number' || config.fieldOfView <= 0 || config.fieldOfView > 180) {
        errors.push('fieldOfView must be between 0 and 180');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate collision configuration
 *
 * @param {object} config - Config object to validate
 * @returns {{valid: boolean, errors: string[]}} Validation result
 */
export function validateCollisionConfig(config) {
    const errors = [];

    if (!config) {
        return { valid: false, errors: ['Config is null or undefined'] };
    }

    // Radius validations
    if (typeof config.deathRadius !== 'number' || config.deathRadius <= 0) {
        errors.push('deathRadius must be a positive number');
    }
    if (typeof config.bikeCollisionDist !== 'number' || config.bikeCollisionDist <= 0) {
        errors.push('bikeCollisionDist must be a positive number');
    }
    if (typeof config.boostRadius !== 'number' || config.boostRadius <= 0) {
        errors.push('boostRadius must be a positive number');
    }

    // Trail validations
    if (typeof config.trailSpacing !== 'number' || config.trailSpacing <= 0) {
        errors.push('trailSpacing must be a positive number');
    }
    if (typeof config.maxTrailLength !== 'number' || config.maxTrailLength <= 0) {
        errors.push('maxTrailLength must be a positive number');
    }

    // Spawn validations
    if (typeof config.spawnRadius !== 'number' || config.spawnRadius <= 0) {
        errors.push('spawnRadius must be a positive number');
    }
    if (typeof config.minSpawnDistance !== 'number' || config.minSpawnDistance < 0 || config.minSpawnDistance > config.spawnRadius) {
        errors.push('minSpawnDistance must be between 0 and spawnRadius');
    }

    // CCD validations
    if (typeof config.ccdIterations !== 'number' || config.ccdIterations < 1) {
        errors.push('ccdIterations must be at least 1');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate complete configuration
 *
 * @param {object} fullConfig - Complete config object
 * @returns {{valid: boolean, errors: object}} Validation result with per-section errors
 */
export function validateConfig(fullConfig) {
    const errors = {};
    let allValid = true;

    if (fullConfig.physics) {
        const physicsResult = validatePhysicsConfig(fullConfig.physics);
        if (!physicsResult.valid) {
            errors.physics = physicsResult.errors;
            allValid = false;
        }
    }

    if (fullConfig.game) {
        const gameResult = validateGameConfig(fullConfig.game);
        if (!gameResult.valid) {
            errors.game = gameResult.errors;
            allValid = false;
        }
    }

    if (fullConfig.collision) {
        const collisionResult = validateCollisionConfig(fullConfig.collision);
        if (!collisionResult.valid) {
            errors.collision = collisionResult.errors;
            allValid = false;
        }
    }

    return {
        valid: allValid,
        errors
    };
}

// ============================================================================
// Import/Export Functions
// ============================================================================

/**
 * Export configuration to JSON string
 *
 * @param {object} config - Config object to export
 * @param {boolean} pretty - Pretty print JSON
 * @returns {string|null} JSON string or null if config is invalid
 */
export function exportConfig(config, pretty = true) {
    if (!config) {
        return null;
    }
    try {
        const indent = pretty ? 2 : 0;
        return JSON.stringify(config, null, indent);
    } catch (e) {
        console.error('Failed to export config:', e);
        return null;
    }
}

/**
 * Import configuration from JSON string
 *
 * @param {string} jsonString - JSON string to parse
 * @returns {{success: boolean, config?: object, error?: string}} Result
 */
export function importConfig(jsonString) {
    try {
        const config = JSON.parse(jsonString);

        // Validate imported config
        const validation = validateConfig(config);
        if (!validation.valid) {
            return {
                success: false,
                error: 'Invalid configuration: ' + JSON.stringify(validation.errors)
            };
        }

        return { success: true, config };
    } catch (e) {
        return {
            success: false,
            error: 'Failed to parse JSON: ' + e.message
        };
    }
}

/**
 * Export configuration to file (browser)
 *
 * @param {object} config - Config to export
 * @param {string} filename - Output filename
 */
export function exportConfigToFile(config, filename = 'cyber-cycles-config.json') {
    const jsonString = exportConfig(config);
    if (!jsonString) return;

    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Load configuration from file (browser)
 *
 * @returns {Promise<{success: boolean, config?: object, error?: string}>}
 */
export function importConfigFromFile() {
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) {
                resolve({ success: false, error: 'No file selected' });
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const result = importConfig(event.target.result);
                resolve(result);
            };
            reader.onerror = () => {
                resolve({ success: false, error: 'Failed to read file' });
            };
            reader.readAsText(file);
        };

        input.click();
    });
}

/**
 * Save configuration to localStorage
 *
 * @param {object} config - Config to save
 * @param {string} key - Storage key
 * @returns {boolean} Success
 */
export function saveConfigToStorage(config, key = 'cyber-cycles-config') {
    try {
        const jsonString = exportConfig(config, false);
        localStorage.setItem(key, jsonString);
        return true;
    } catch (e) {
        console.error('Failed to save config:', e);
        return false;
    }
}

/**
 * Load configuration from localStorage
 *
 * @param {string} key - Storage key
 * @returns {{success: boolean, config?: object, error?: string}}
 */
export function loadConfigFromStorage(key = 'cyber-cycles-config') {
    try {
        const jsonString = localStorage.getItem(key);
        if (!jsonString) {
            return { success: false, error: 'No saved config found' };
        }
        return importConfig(jsonString);
    } catch (e) {
        return { success: false, error: 'Failed to load config: ' + e.message };
    }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Merge configurations (deep merge)
 *
 * @param {object} base - Base configuration
 * @param {object} override - Override configuration
 * @returns {object} Merged configuration
 */
export function mergeConfig(base, override) {
    if (!base) return { ...override };
    if (!override) return { ...base };

    const result = { ...base };

    for (const key in override) {
        if (override.hasOwnProperty(key)) {
            const baseVal = base[key];
            const overrideVal = override[key];

            if (overrideVal && typeof overrideVal === 'object' && !Array.isArray(overrideVal)) {
                result[key] = mergeConfig(baseVal || {}, overrideVal);
            } else {
                result[key] = overrideVal;
            }
        }
    }

    return result;
}

/**
 * Get default configuration
 *
 * @returns {object} Default config object
 */
export function getDefaultConfig() {
    return {
        physics: { ...PHYSICS_CONFIG },
        game: { ...GAME_CONFIG },
        collision: { ...COLLISION_CONFIG },
        visual: { ...VISUAL_CONFIG },
        audio: { ...AUDIO_CONFIG }
    };
}

/**
 * Get preset configuration
 *
 * @param {string} presetName - Name of preset
 * @returns {object|null} Preset config or null if not found
 */
export function getPreset(presetName) {
    const preset = PRESETS[presetName];
    if (!preset) return null;

    // Return deep copy
    return JSON.parse(JSON.stringify(preset));
}

/**
 * List available presets
 *
 * @returns {string[]} Array of preset names
 */
export function listPresets() {
    return Object.keys(PRESETS);
}

/**
 * Reset configuration to defaults
 *
 * @param {object} config - Config to reset (modified in place)
 * @returns {object} Reset config
 */
export function resetConfig(config) {
    return mergeConfig(config, getDefaultConfig());
}

/**
 * Create config builder for fluent API
 *
 * @returns {object} Builder object
 */
export function createConfigBuilder() {
    const config = getDefaultConfig();

    return {
        withPhysics(updates) {
            config.physics = mergeConfig(config.physics, updates);
            return this;
        },
        withGame(updates) {
            config.game = mergeConfig(config.game, updates);
            return this;
        },
        withCollision(updates) {
            config.collision = mergeConfig(config.collision, updates);
            return this;
        },
        withVisual(updates) {
            config.visual = mergeConfig(config.visual, updates);
            return this;
        },
        withAudio(updates) {
            config.audio = mergeConfig(config.audio, updates);
            return this;
        },
        fromPreset(name) {
            const preset = getPreset(name);
            if (preset) {
                Object.assign(config, preset);
            }
            return this;
        },
        validate() {
            return validateConfig(config);
        },
        build() {
            const validation = this.validate();
            if (!validation.valid) {
                throw new Error('Invalid configuration: ' + JSON.stringify(validation.errors));
            }
            return { ...config };
        }
    };
}

// ============================================================================
// Backward Compatibility Exports
// ============================================================================

/**
 * Default export for backward compatibility
 */
export default {
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
    exportConfigToFile,
    importConfigFromFile,
    saveConfigToStorage,
    loadConfigFromStorage,
    mergeConfig,
    getDefaultConfig,
    getPreset,
    listPresets,
    resetConfig,
    createConfigBuilder
};
