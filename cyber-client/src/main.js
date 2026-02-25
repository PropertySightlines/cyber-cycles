/**
 * Cyber Cycles - Main Game Loop
 * 
 * Integrated with new physics modules:
 * - SpatialHash for O(log n) collision queries
 * - CollisionDetection for precise collision handling
 * - RubberSystem for wall grinding mechanics
 * - PlayerEntity/TrailEntity for component-based entities
 * 
 * @module main
 */

import * as THREE from 'three';
import { DbConnection } from "./module";

// ============================================================================
// Module Imports
// ============================================================================

// Core modules
import { SpatialHash } from './core/SpatialHash.js';
import { EventSystem } from './core/EventSystem.js';
import { PHYSICS_CONFIG, GAME_CONFIG, COLLISION_CONFIG, RUBBER_CONFIG } from './core/Config.js';

// Physics modules
import {
    checkTrailCollision,
    checkBikeCollision,
    checkArenaBounds,
    distanceToSegment,
    distanceToSegmentWithClosest,
    isPointNearSegment
} from './physics/CollisionDetection.js';

import {
    RubberState,
    updateRubber,
    applyMalus,
    calculateEffectiveness,
    detectWallProximity,
    calculateWallDistance,
    isNearWall,
    applyRubberCollision
} from './physics/RubberSystem.js';

// Game entities
import { PlayerEntity, PlayerState } from './game/PlayerEntity.js';
import { TrailEntity } from './game/TrailEntity.js';

// Backward compatibility imports
import {
    CONSTANTS,
    DEFAULT_CONFIG,
    clonePlayer,
    normalize,
    rotateDirection,
    distanceToSegment as legacyDistanceToSegment
} from './game-logic.js';

// ============================================================================
// Global State
// ============================================================================

/**
 * Main game state
 */
const state = {
    players: {},           // PlayerEntity instances by ID
    trails: {},            // TrailEntity instances by player ID
    rubberStates: {},      // RubberState instances by player ID
    isBoosting: false,
    countdown: 3,
    roundActive: false,
    cameraShake: 0,
    turnLeft: false,
    turnRight: false,
    brake: false,
    lastUpdate: performance.now()
};

/**
 * Spatial hash for efficient collision queries
 * Cell size optimized for trail segment queries
 */
const spatialHash = new SpatialHash(COLLISION_CONFIG.spatialHashCellSize);

/**
 * Event system for game events
 */
const eventSystem = new EventSystem();

/**
 * Local player references
 */
let myIdentity = null;
let myPlayerId = null;
let myPlayerEntity = null;
let myTrailEntity = null;
let myRubberState = null;
let isAdmin = false;

/**
 * Game configuration
 */
let localConfig = { ...DEFAULT_CONFIG };

/**
 * SpacetimeDB connection
 */
let conn = null;

/**
 * Countdown interval handle
 */
let countdownInterval = null;

/**
 * Last turn state for input debouncing
 */
let lastTurnState = { left: false, right: false };

/**
 * Admin identity for admin panel access
 */
const ADMIN_IDENTITY = "c2007484dedccf3d247b44dc4ebafeee388121889dffea0ceedfd63b888106c1";

// ============================================================================
// SpacetimeDB Connection
// ============================================================================

/**
 * Initialize SpacetimeDB connection
 */
function initSpacetimeDB() {
    conn = DbConnection.builder()
        .withUri("wss://maincloud.spacetimedb.com")
        .withDatabaseName("cyber-cycles")
        .withToken(localStorage.getItem("auth_token") || "")
        .onConnect((conn, identity, token) => {
            localStorage.setItem("auth_token", token);
            myIdentity = identity;
            console.log("Connected:", identity.toHexString().substring(0, 16) + "...");
            console.log("Available reducers:", Object.keys(conn.reducers));

            // Check for admin access
            if (identity.toHexString() === ADMIN_IDENTITY) {
                isAdmin = true;
                const adminPanel = document.getElementById('admin-panel');
                if (adminPanel) adminPanel.style.display = 'block';
            }

            updateStatus("Press any arrow key to join the race!");

            // Subscribe to tables
            conn.subscriptionBuilder()
                .onApplied(() => {
                    console.log("Synced!");
                    updatePlayerList();

                    // Start countdown ticker
                    if (countdownInterval) clearInterval(countdownInterval);
                    countdownInterval = setInterval(() => {
                        if (conn.reducers.tickCountdown) {
                            conn.reducers.tickCountdown();
                        }
                    }, 1000);
                })
                .subscribe([
                    "SELECT * FROM player",
                    "SELECT * FROM global_config",
                    "SELECT * FROM game_state"
                ]);
        })
        .build();

    // Player insert handler
    conn.db.player.onInsert((ctx, p) => {
        console.log("Player joined:", p.id);
        createPlayerEntity(p);
        updatePlayerList();
    });

    // Player update handler
    conn.db.player.onUpdate((ctx, oldP, newP) => {
        const ownerId = newP.owner_id || newP.ownerId;
        if (ownerId && ownerId.toHexString() === myIdentity.toHexString()) {
            myPlayerId = newP.id;
            updateStatus(`You are ${myPlayerId} - Get ready!`);
            
            // Get local player entity
            myPlayerEntity = state.players[myPlayerId];
            myTrailEntity = state.trails[myPlayerId];
            myRubberState = state.rubberStates[myPlayerId];
        }
        updatePlayerEntity(newP);
        updatePlayerList();
    });

    // Config handlers
    conn.db.global_config.onInsert((ctx, cfg) => applyConfig(cfg));
    conn.db.global_config.onUpdate((ctx, oldCfg, newCfg) => applyConfig(newCfg));

    // Game state handlers
    conn.db.game_state.onInsert((ctx, gs) => handleGameState(gs));
    conn.db.game_state.onUpdate((ctx, oldGs, newGs) => handleGameState(newGs));
}

// ============================================================================
// Player Entity Management
// ============================================================================

/**
 * Create a PlayerEntity from SpacetimeDB player data
 * @param {object} p - Player data from database
 */
function createPlayerEntity(p) {
    const playerId = p.id;
    
    // Create PlayerEntity
    const playerEntity = new PlayerEntity(playerId, p.x, p.z, {
        color: p.color || 0xffffff,
        speed: p.speed || localConfig.baseSpeed,
        dirX: p.dir_x || 0,
        dirZ: p.dir_z || -1,
        ownerId: p.owner_id?.toHexString() || null,
        isAi: p.is_ai || false,
        maxTrailLength: localConfig.maxTrailLength
    });

    // Create TrailEntity
    const trailEntity = new TrailEntity(playerId, {
        color: p.color || 0xffffff,
        maxLength: localConfig.maxTrailLength,
        height: CONSTANTS.TRAIL_HEIGHT,
        minPointSpacing: CONSTANTS.TRAIL_SPACING
    });

    // Create RubberState
    const rubberState = new RubberState(playerId, RUBBER_CONFIG.baseRubber, RUBBER_CONFIG.serverRubber);

    // Initialize turn points from existing data
    if (p.turn_points_json || p.turnPointsJson) {
        try {
            const turnPoints = JSON.parse(p.turn_points_json || p.turnPointsJson || "[]");
            playerEntity.turnPoints = turnPoints;
            
            // Add points to trail entity
            turnPoints.forEach(pt => {
                trailEntity.addPoint(pt.x, pt.z);
            });
        } catch (e) {
            console.warn("Failed to parse turn points for player", playerId);
        }
    }

    // Store entities
    state.players[playerId] = playerEntity;
    state.trails[playerId] = trailEntity;
    state.rubberStates[playerId] = rubberState;

    // Update spatial hash
    spatialHash.insert(playerId, p.x, p.z);

    // Emit event
    eventSystem.emit('player:created', { playerId, entity: playerEntity });

    console.log("Created PlayerEntity for:", playerId);
}

/**
 * Update a PlayerEntity from SpacetimeDB player data
 * @param {object} p - Player data from database
 */
function updatePlayerEntity(p) {
    const playerId = p.id;
    const entity = state.players[playerId];
    
    if (!entity) {
        createPlayerEntity(p);
        return;
    }

    // Update entity state from network data
    entity.setPosition(p.x, p.z);
    entity.setDirection(p.dir_x || 0, p.dir_z || -1);
    entity.setSpeed(p.speed || localConfig.baseSpeed);
    
    // Update state component
    if (p.alive === false) {
        entity.state.setAlive(false);
    } else if (!entity.state.alive) {
        entity.state.setAlive(true);
    }

    // Update turn points
    if (p.turn_points_json || p.turnPointsJson) {
        try {
            const turnPoints = JSON.parse(p.turn_points_json || p.turnPointsJson || "[]");
            entity.turnPoints = turnPoints;
            
            // Sync trail entity
            const trail = state.trails[playerId];
            if (trail) {
                // Clear and rebuild trail
                trail.clear();
                turnPoints.forEach(pt => {
                    trail.addPoint(pt.x, pt.z);
                });
            }
        } catch (e) {
            console.warn("Failed to parse turn points for player", playerId);
        }
    }

    // Update spatial hash
    spatialHash.update(playerId, p.x, p.z);

    // Emit event
    eventSystem.emit('player:updated', { playerId, entity });
}

/**
 * Remove a player entity
 * @param {string} playerId - Player ID to remove
 */
function removePlayerEntity(playerId) {
    const entity = state.players[playerId];
    if (entity) {
        spatialHash.remove(playerId);
        delete state.players[playerId];
        delete state.trails[playerId];
        delete state.rubberStates[playerId];
        eventSystem.emit('player:removed', { playerId });
    }
}

// ============================================================================
// Game State Handlers
// ============================================================================

/**
 * Handle game state updates from SpacetimeDB
 * @param {object} gs - Game state from database
 */
function handleGameState(gs) {
    const oldCountdown = state.countdown;
    const oldRoundActive = state.roundActive;

    state.countdown = gs.countdown !== undefined ? gs.countdown : 3;
    state.roundActive = gs.round_active !== undefined ? gs.round_active :
                        (gs.roundActive !== undefined ? gs.roundActive : false);

    // Update countdown UI
    const countdownEl = document.getElementById('countdown');
    if (countdownEl) {
        if (state.countdown > 0 && !state.roundActive) {
            countdownEl.style.display = 'block';
            countdownEl.innerText = state.countdown;
            countdownEl.style.color = state.countdown === 1 ? '#ff0000' : '#ffff00';
        } else {
            countdownEl.style.display = 'none';
        }
    }

    // Handle round end
    if (!state.roundActive && gs.winner_id && oldRoundActive) {
        if (gs.winner_id === myPlayerId) {
            showWinScreen();
            updateStatus("🏆 VICTORY! 🏆");
        } else if (state.players[myPlayerId] && !state.players[myPlayerId].state.alive) {
            showDeathScreen();
            updateStatus("Eliminated!");
        }
    }

    // Handle round start
    if (state.roundActive && !oldRoundActive) {
        hideDeathScreen();
        hideWinScreen();
        updateStatus("GO!");

        // Reset player states for new round
        Object.values(state.players).forEach(entity => {
            if (entity && entity.state.alive) {
                entity.physics.setSpeed(localConfig.baseSpeed);
                entity.render.clearTrail();
            }
        });
        
        // Clear spatial hash for new round
        spatialHash.clear();
        
        console.log("ROUND STARTED - Players:", Object.keys(state.players).length);
    }
}

/**
 * Apply configuration from SpacetimeDB
 * @param {object} cfg - Configuration data
 */
function applyConfig(cfg) {
    if (!cfg) return;
    localConfig = {
        ...localConfig,
        boostSpeed: typeof cfg.boost_speed === 'number' ? cfg.boost_speed : (typeof cfg.boostSpeed === 'number' ? cfg.boostSpeed : 70),
        slipstreamMode: cfg.slipstream_mode || cfg.slipstreamMode || "tail_only"
    };
    const btnMode = document.getElementById('btn-mode');
    const inpBoost = document.getElementById('inp-boost');
    if (btnMode) btnMode.innerText = localConfig.slipstreamMode;
    if (inpBoost) inpBoost.value = localConfig.boostSpeed;
}

// ============================================================================
// Network Sync
// ============================================================================

/**
 * Send player state sync to SpacetimeDB
 * @param {PlayerEntity} entity - Player entity to sync
 */
function sendStateSync(entity) {
    if (!entity || !state.roundActive) return;

    const safeId = (typeof entity.id === "string" && entity.id.length > 0) ? entity.id : "";
    if (safeId.length === 0) return;

    const pos = entity.physics.getPosition();
    const dir = entity.physics.getDirection();
    const turnPointsJson = JSON.stringify(entity.turnPoints || []);

    try {
        conn.reducers.syncState(
            safeId,
            Number(pos.x) || 0,
            Number(pos.z) || 0,
            Number(dir.x) || 0,
            Number(dir.z) || -1,
            Number(entity.physics.speed) || localConfig.baseSpeed,
            Boolean(state.brake),
            Boolean(entity.state.alive),
            Boolean(state.turnLeft),
            Boolean(state.turnRight),
            turnPointsJson
        );
    } catch (e) {
        console.error("SDK Error:", e.message);
    }
}

/**
 * Request respawn from SpacetimeDB
 */
function requestRespawn() {
    if (myPlayerId) {
        conn.reducers.respawn(myPlayerId);
        hideDeathScreen();
        hideWinScreen();
        updateStatus("New race starting...");
    }
}

// ============================================================================
// Input Handling
// ============================================================================

/**
 * Handle keyboard input
 */
function setupInputHandlers() {
    window.addEventListener('keydown', (e) => {
        // Join race on first input
        if (!myPlayerId && (e.key.startsWith('Arrow') || ['a','d','s','A','D','S'].includes(e.key))) {
            conn.reducers.join();
            updateStatus("Joining race...");
            return;
        }

        const entity = state.players[myPlayerId];
        if (!entity) return;

        // Auto-respawn if dead
        if (!entity.state.alive) {
            requestRespawn();
            return;
        }

        if (!state.roundActive) return;

        // Handle turn input
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            state.turnLeft = true;
            state.turnRight = false;
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            state.turnRight = true;
            state.turnLeft = false;
        } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
            state.brake = true;
            entity.physics.isBraking = true;
            sendStateSync(entity);
        }
    });

    window.addEventListener('keyup', (e) => {
        const entity = state.players[myPlayerId];

        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            state.turnLeft = false;
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            state.turnRight = false;
        } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
            state.brake = false;
            if (entity) {
                entity.physics.isBraking = false;
                sendStateSync(entity);
            }
        }

        // Send sync on turn state change
        if (entity && state.roundActive && 
            (state.turnLeft !== lastTurnState.left || state.turnRight !== lastTurnState.right)) {
            lastTurnState.left = state.turnLeft;
            lastTurnState.right = state.turnRight;
            sendStateSync(entity);
        }
    });
}

// ============================================================================
// UI Functions
// ============================================================================

/**
 * Update status text
 * @param {string} msg - Status message
 */
function updateStatus(msg) {
    const statusEl = document.getElementById('status');
    if (statusEl) statusEl.innerText = msg;
}

/**
 * Show death screen
 */
function showDeathScreen() {
    const deathEl = document.getElementById('death-screen');
    const respawnBtn = document.getElementById('respawn-btn');
    if (deathEl) deathEl.style.display = 'block';
    if (respawnBtn) respawnBtn.style.display = 'block';
    state.cameraShake = 0.5;
    createExplosion(state.players[myPlayerId], 0xff3333);
}

/**
 * Hide death screen
 */
function hideDeathScreen() {
    const deathEl = document.getElementById('death-screen');
    const respawnBtn = document.getElementById('respawn-btn');
    if (deathEl) deathEl.style.display = 'none';
    if (respawnBtn) respawnBtn.style.display = 'none';
}

/**
 * Show win screen
 */
function showWinScreen() {
    const winEl = document.getElementById('win-screen');
    const respawnBtn = document.getElementById('respawn-btn');
    if (winEl) winEl.style.display = 'block';
    if (respawnBtn) respawnBtn.style.display = 'block';
    createExplosion(state.players[myPlayerId], 0x00ffff);
    createExplosion(state.players[myPlayerId], 0xffff00);
}

/**
 * Hide win screen
 */
function hideWinScreen() {
    const winEl = document.getElementById('win-screen');
    if (winEl) winEl.style.display = 'none';
}

/**
 * Update player list UI
 */
function updatePlayerList() {
    const container = document.getElementById('player-entries');
    if (!container) return;

    container.innerHTML = '';

    Object.values(state.players).forEach(entity => {
        if (!entity) return;

        const entry = document.createElement('div');
        entry.className = 'player-entry';

        const colorBox = document.createElement('div');
        colorBox.className = 'player-color';
        const colorHex = '#' + entity.render.color.toString(16).padStart(6, '0');
        colorBox.style.backgroundColor = colorHex;
        colorBox.style.color = colorHex;
        colorBox.style.boxShadow = `0 0 10px ${colorHex}`;

        const name = document.createElement('span');
        name.className = 'player-name';
        let displayName = entity.id.toUpperCase();
        if (entity.id === myPlayerId) {
            displayName += ' (YOU)';
            name.style.color = '#00ffff';
            entry.style.background = 'rgba(0,255,255,0.1)';
            entry.style.border = '1px solid #00ffff';
        } else if (entity.network.isAi) {
            displayName += ' (AI)';
        }
        name.innerText = displayName;

        const status = document.createElement('span');
        status.className = 'player-status ' + (entity.state.alive ? 'alive' : 'dead');
        status.innerText = entity.state.alive ? '●' : '○';

        entry.appendChild(colorBox);
        entry.appendChild(name);
        entry.appendChild(status);
        container.appendChild(entry);
    });
}

/**
 * Setup UI controls
 */
function setupUIControls() {
    const respawnBtn = document.getElementById('respawn-btn');
    if (respawnBtn) {
        respawnBtn.onclick = () => requestRespawn();
    }

    const btnMode = document.getElementById('btn-mode');
    const btnSave = document.getElementById('btn-save');
    const inpBoost = document.getElementById('inp-boost');

    if (btnMode) {
        btnMode.onclick = (e) => {
            e.target.innerText = e.target.innerText === "standard" ? "tail_only" : "standard";
        };
    }

    if (btnSave && inpBoost) {
        btnSave.onclick = () => {
            conn.reducers.updateConfig(parseFloat(inpBoost.value) || 70, btnMode.innerText || "tail_only");
        };
    }
}

// ============================================================================
// Game Loop - Physics Update
// ============================================================================

/**
 * Collect all trail segments for collision detection
 * @returns {Array} Array of trail segments
 */
function collectTrailSegments() {
    const allSegments = [];
    
    Object.values(state.trails).forEach(trail => {
        const segments = trail.getSegments();
        segments.forEach(seg => {
            allSegments.push({
                x1: seg.x1,
                z1: seg.z1,
                x2: seg.x2,
                z2: seg.z2,
                pid: trail.playerId,
                isRecent: false
            });
        });
    });
    
    return allSegments;
}

/**
 * Update all player entities
 * @param {number} dt - Delta time
 */
function updatePlayers(dt, allSegments) {
    const players = Object.values(state.players);
    
    players.forEach(entity => {
        if (!entity || !entity.state.alive || !state.roundActive) return;
        
        // Apply input for local player
        if (entity.id === myPlayerId) {
            entity.applyInput({
                left: state.turnLeft,
                right: state.turnRight,
                brake: state.brake,
                boost: state.isBoosting
            });
        } else {
            // AI or remote player - use stored turn state
            entity.physics.isTurningLeft = entity.state.turning && state.turnLeft;
            entity.physics.isTurningRight = entity.state.turning && state.turnRight;
        }
        
        // Update physics
        entity.update(dt, allSegments);
        
        // Update position in spatial hash
        const pos = entity.getPosition();
        spatialHash.update(entity.id, pos.x, pos.z);
        
        // Add trail point based on distance traveled
        const trail = state.trails[entity.id];
        if (trail) {
            trail.addPoint(pos.x, pos.z);
        }
        
        // Update turn points array for backward compatibility
        if (trail && trail.segments) {
            entity.turnPoints = [...trail.segments];
        }
    });
}

/**
 * Check slipstream/boost for all players
 * @param {number} dt - Delta time
 * @param {Array} allSegments - All trail segments
 */
function updateSlipstream(dt, allSegments) {
    const players = Object.values(state.players);
    
    players.forEach(entity => {
        if (!entity || !entity.state.alive || !state.roundActive) return;
        
        const pos = entity.getPosition();
        const dir = entity.getDirection();
        
        let isBoosting = false;
        let minDistanceToTrail = Infinity;
        
        // Use spatial hash for nearby segment queries
        const nearbyResults = spatialHash.queryRange(pos.x, pos.z, CONSTANTS.BOOST_RADIUS);
        
        // Check slipstream against nearby trails
        allSegments.forEach(seg => {
            if (seg.pid === entity.id) return;
            
            const dist = distanceToSegment(pos.x, pos.z, seg.x1, seg.z1, seg.x2, seg.z2);
            
            if (dist <= CONSTANTS.BOOST_RADIUS) {
                // Check if player is behind the trail (for tail_only mode)
                if (localConfig.slipstreamMode === "tail_only") {
                    // Find closest point on segment
                    const tempClosest = {};
                    distanceToSegment(pos.x, pos.z, seg.x1, seg.z1, seg.x2, seg.z2, tempClosest);
                    const dot = (tempClosest.x - pos.x) * dir.x + (tempClosest.z - pos.z) * dir.z;
                    if (dot > 0) {
                        isBoosting = true;
                        minDistanceToTrail = Math.min(minDistanceToTrail, dist);
                    }
                } else {
                    isBoosting = true;
                    minDistanceToTrail = Math.min(minDistanceToTrail, dist);
                }
            }
        });
        
        // Apply boost
        if (isBoosting) {
            entity.applyBoost(1.75);
        }
        
        // Update boost state for local player
        if (entity.id === myPlayerId) {
            state.isBoosting = isBoosting;
            const boostEl = document.getElementById('boost-indicator');
            const speedEl = document.getElementById('speed-display');
            if (boostEl) boostEl.style.display = isBoosting ? 'block' : 'none';
            if (speedEl) speedEl.innerText = Math.round(entity.physics.speed * 3.6) + ' km/h';
        }
    });
}

/**
 * Check collisions for all players
 * @param {Array} allSegments - All trail segments
 */
function checkCollisions(allSegments) {
    const players = Object.values(state.players);
    
    players.forEach(entity => {
        if (!entity || !entity.state.alive || !state.roundActive) return;
        
        const pos = entity.getPosition();
        
        // Trail collision using new CollisionDetection module
        const trailCollision = checkTrailCollision(
            { id: entity.id, x: pos.x, z: pos.z, alive: true },
            allSegments,
            COLLISION_CONFIG.deathRadius
        );
        
        if (trailCollision) {
            entity.takeDamage();
            console.log("Player", entity.id, "hit trail of", trailCollision.segment.pid);
            
            if (entity.id === myPlayerId) {
                sendStateSync(entity);
                showDeathScreen();
            }
        }
        
        // Bike-to-bike collision
        players.forEach(other => {
            if (!other || !other.state.alive || other.id === entity.id) return;
            
            const otherPos = other.getPosition();
            const dist = Math.hypot(pos.x - otherPos.x, pos.z - otherPos.z);
            
            if (dist < CONSTANTS.BIKE_COLLISION_DIST) {
                entity.takeDamage();
                other.takeDamage();
                
                if (entity.id === myPlayerId) {
                    sendStateSync(entity);
                    showDeathScreen();
                }
            }
        });
        
        // Arena bounds check
        const boundsResult = checkArenaBounds(pos.x, pos.z, CONSTANTS.ARENA_SIZE / 2);
        if (!boundsResult.inside) {
            entity.takeDamage();
            
            if (entity.id === myPlayerId) {
                sendStateSync(entity);
                showDeathScreen();
            }
        }
        
        // Rubber-based collision response (optional enhancement)
        const rubberState = state.rubberStates[entity.id];
        if (rubberState && entity.state.alive) {
            const wallInfo = detectWallProximity(
                { x: pos.x, z: pos.z, id: entity.id },
                allSegments,
                RUBBER_CONFIG.detectionRadius
            );
            
            if (wallInfo) {
                // Update rubber state
                updateRubber(rubberState, dt, RUBBER_CONFIG, true);
                
                // Apply malus if turning while grinding
                if (entity.physics.isTurningLeft || entity.physics.isTurningRight) {
                    applyMalus(rubberState, RUBBER_CONFIG.malusDuration, RUBBER_CONFIG.malusFactor);
                }
            } else {
                // Regenerate rubber when not near walls
                updateRubber(rubberState, dt, RUBBER_CONFIG, false);
            }
        }
    });
}

/**
 * Update AI players
 * @param {Array} allSegments - All trail segments
 */
function updateAI(allSegments) {
    const players = Object.values(state.players);
    
    players.forEach(entity => {
        if (!entity || !entity.network.isAi || !entity.state.alive || !state.roundActive) return;
        
        const pos = entity.getPosition();
        const dir = entity.getDirection();
        
        // Look ahead for obstacles
        const lookX = pos.x + dir.x * 25;
        const lookZ = pos.z + dir.z * 25;
        let blocked = Math.abs(lookX) > 180 || Math.abs(lookZ) > 180;
        
        if (!blocked) {
            // Check for trail obstacles using spatial hash
            const nearbyResults = spatialHash.queryRange(lookX, lookZ, 10);
            
            allSegments.forEach(seg => {
                if (seg.pid === entity.id) return;
                if (distanceToSegment(lookX, lookZ, seg.x1, seg.z1, seg.x2, seg.z2) < 10) {
                    blocked = true;
                }
            });
            
            // Check for bike obstacles
            players.forEach(other => {
                if (!other || !other.state.alive || other.id === entity.id) return;
                const otherPos = other.getPosition();
                const dist = Math.hypot(lookX - otherPos.x, lookZ - otherPos.z);
                if (dist < 15) blocked = true;
            });
        }
        
        // AI steering logic
        if (blocked) {
            const towardCenterX = -pos.x;
            const towardCenterZ = -pos.z;
            const normalized = normalize(towardCenterX, towardCenterZ);
            
            const cross = dir.x * normalized.z - dir.z * normalized.x;
            
            if (cross > 0.2) {
                entity.physics.isTurningLeft = true;
                entity.physics.isTurningRight = false;
            } else if (cross < -0.2) {
                entity.physics.isTurningLeft = false;
                entity.physics.isTurningRight = true;
            } else {
                entity.physics.isTurningLeft = false;
                entity.physics.isTurningRight = false;
            }
            
            sendStateSync(entity);
        } else {
            entity.physics.isTurningLeft = false;
            entity.physics.isTurningRight = false;
        }
    });
}

/**
 * Main game update function
 * @param {number} dt - Delta time
 */
function updateGameState(dt) {
    // Collect all trail segments
    const allSegments = collectTrailSegments();
    
    // Update all players
    updatePlayers(dt, allSegments);
    
    // Check slipstream/boost
    updateSlipstream(dt, allSegments);
    
    // Check collisions
    checkCollisions(allSegments);
    
    // Update AI
    updateAI(allSegments);
    
    // Sync local player state
    if (myPlayerEntity && state.roundActive) {
        sendStateSync(myPlayerEntity);
    }
}

// ============================================================================
// Particle System
// ============================================================================

const particles = [];

/**
 * Create explosion particles
 * @param {PlayerEntity} player - Player entity
 * @param {number} color - Particle color
 */
function createExplosion(player, color = 0xff3333) {
    if (!player) return;

    const pos = player.getPosition();
    const particleCount = 80;
    const positions = [];
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
        positions.push(pos.x, 1, pos.z);
        velocities.push({
            x: (Math.random() - 0.5) * 30,
            y: (Math.random() - 0.5) * 30,
            z: (Math.random() - 0.5) * 30,
            life: 1.0
        });
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: color,
        size: 1.5,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });

    const particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);
    particles.push({ mesh: particleSystem, velocities: velocities, age: 0 });
}

/**
 * Update particle systems
 * @param {number} dt - Delta time
 */
function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        const positions = p.mesh.geometry.attributes.position.array;

        for (let j = 0; j < p.velocities.length; j++) {
            positions[j * 3] += p.velocities[j].x * dt;
            positions[j * 3 + 1] += p.velocities[j].y * dt;
            positions[j * 3 + 2] += p.velocities[j].z * dt;
            p.velocities[j].life -= dt * 1.5;
            p.velocities[j].y -= 9.8 * dt;
        }

        p.mesh.material.opacity = p.velocities[0]?.life || 0;
        p.mesh.geometry.attributes.position.needsUpdate = true;
        p.age += dt;

        if (p.velocities[0]?.life <= 0 || p.age > 2) {
            scene.remove(p.mesh);
            p.mesh.geometry.dispose();
            p.mesh.material.dispose();
            particles.splice(i, 1);
        }
    }
}

// ============================================================================
// Rendering
// ============================================================================

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.0025);

const ambientLight = new THREE.AmbientLight(0x404040, 2);
scene.add(ambientLight);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 30, 100);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const gridHelper = new THREE.GridHelper(CONSTANTS.ARENA_SIZE, 40, 0x00ffff, 0x002233);
gridHelper.position.y = -0.5;
scene.add(gridHelper);

const floorGeometry = new THREE.PlaneGeometry(CONSTANTS.ARENA_SIZE, CONSTANTS.ARENA_SIZE);
const floorMaterial = new THREE.MeshBasicMaterial({
    color: 0x000011,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide
});
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.6;
scene.add(floor);

const boundaryGeometry = new THREE.RingGeometry(198, 200, 64);
const boundaryMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide
});
const boundary = new THREE.Mesh(boundaryGeometry, boundaryMaterial);
boundary.rotation.x = -Math.PI / 2;
boundary.position.y = -0.4;
scene.add(boundary);

/**
 * Create glow texture for bike effects
 */
function createGlowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.3, 'rgba(255,255,255,0.5)');
    gradient.addColorStop(0.6, 'rgba(255,255,255,0.1)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

const glowTexture = createGlowTexture();

/**
 * Render cache for player meshes
 */
const renderCache = {};

/**
 * Create render objects for a player entity
 * @param {PlayerEntity} entity - Player entity
 */
function createRenderObjects(entity) {
    const bikeGroup = new THREE.Group();

    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(2, 1.5, 4),
        new THREE.MeshStandardMaterial({
            color: entity.render.color,
            emissive: entity.render.color,
            emissiveIntensity: 0.5,
            metalness: 0.8,
            roughness: 0.2
        })
    );
    mesh.position.y = 1;
    bikeGroup.add(mesh);

    const glowSprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
            map: glowTexture,
            color: entity.render.color,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        })
    );
    glowSprite.scale.set(12, 12, 1);
    glowSprite.position.y = 1;
    bikeGroup.add(glowSprite);

    // Trail wall geometry
    const trailGeometry = new THREE.BufferGeometry();
    const trailMaterial = new THREE.MeshBasicMaterial({
        color: entity.render.color,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
        depthWrite: false
    });
    const trail = new THREE.Mesh(trailGeometry, trailMaterial);

    scene.add(bikeGroup);
    scene.add(trail);
    
    return { bikeGroup, mesh, trail, glowSprite };
}

/**
 * Update trail mesh from TrailEntity
 * @param {TrailEntity} trail - Trail entity
 * @param {THREE.Mesh} trailMesh - Three.js trail mesh
 */
function updateTrailMesh(trail, trailMesh) {
    if (!trail || !trailMesh) return;
    
    const segments = trail.getSegments();
    
    if (segments.length < 1) {
        trailMesh.visible = false;
        return;
    }
    
    trailMesh.visible = true;
    
    // Build trail wall positions
    const positions = [];
    const height = CONSTANTS.TRAIL_HEIGHT;

    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        // Bottom vertex
        positions.push(seg.x1, 0, seg.z1);
        // Top vertex
        positions.push(seg.x1, height, seg.z1);
    }

    // Add last point
    const lastSeg = segments[segments.length - 1];
    if (lastSeg) {
        positions.push(lastSeg.x2, 0, lastSeg.z2);
        positions.push(lastSeg.x2, height, lastSeg.z2);
    }

    trailMesh.geometry.dispose();
    trailMesh.geometry = new THREE.BufferGeometry();
    trailMesh.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    // Create indices for triangle strip
    const indices = [];
    const numPoints = Math.floor(positions.length / 3);
    for (let i = 0; i < numPoints - 1; i++) {
        const base = i * 2;
        indices.push(base, base + 1, base + 2);
        indices.push(base + 1, base + 3, base + 2);
    }
    trailMesh.geometry.setIndex(indices);
    trailMesh.geometry.computeVertexNormals();
}

/**
 * Main render function
 */
function renderGameState() {
    // Camera shake effect
    if (state.cameraShake > 0) {
        camera.position.x += (Math.random() - 0.5) * state.cameraShake;
        camera.position.y += (Math.random() - 0.5) * state.cameraShake;
        camera.position.z += (Math.random() - 0.5) * state.cameraShake;
        state.cameraShake -= 0.02;
        if (state.cameraShake < 0) state.cameraShake = 0;
    }

    Object.values(state.players).forEach(entity => {
        if (!entity || !entity.id) return;

        // Create render cache if needed
        if (!renderCache[entity.id]) {
            renderCache[entity.id] = createRenderObjects(entity);
            console.log("Created render cache for:", entity.id);
        }
        
        const { bikeGroup, trail, glowSprite } = renderCache[entity.id];

        // Update local player camera
        if (entity.id === myPlayerId) {
            const pos = entity.getPosition();
            const dir = entity.getDirection();
            camera.position.set(pos.x, 30, pos.z + 100);
            camera.lookAt(pos.x, 1, pos.z);
        }

        // Update visibility based on alive state
        bikeGroup.visible = entity.state.alive;
        trail.visible = entity.state.alive;
        
        if (!entity.state.alive) return;

        const pos = entity.getPosition();
        const dir = entity.getDirection();
        
        // Update bike position and rotation
        bikeGroup.position.set(pos.x, 0, pos.z);
        bikeGroup.rotation.y = Math.atan2(dir.x, dir.z);

        // Update glow effect based on boost
        const isBoosting = state.isBoosting && entity.id === myPlayerId;
        glowSprite.material.opacity = isBoosting ? 0.7 : 0.4;
        glowSprite.scale.set(isBoosting ? 18 : 12, isBoosting ? 18 : 12, 1);

        // Update trail mesh from TrailEntity
        const trailEntity = state.trails[entity.id];
        if (trailEntity) {
            updateTrailMesh(trailEntity, trail);
        }
    });
}

// ============================================================================
// Window Resize Handler
// ============================================================================

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ============================================================================
// Main Animation Loop
// ============================================================================

let lastTime = performance.now();

/**
 * Main animation loop
 */
function animate() {
    requestAnimationFrame(animate);
    
    const now = performance.now();
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    // Update game state
    updateGameState(dt);
    
    // Update particles
    updateParticles(dt);
    
    // Render
    renderGameState();
    
    renderer.render(scene, camera);
}

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize the game
 */
function init() {
    console.log("Cyber Cycles - Initializing with new physics modules");
    
    // Initialize SpacetimeDB connection
    initSpacetimeDB();
    
    // Setup input handlers
    setupInputHandlers();
    
    // Setup UI controls
    setupUIControls();
    
    // Start animation loop
    animate();
    
    // Emit initialization event
    eventSystem.emit('game:init', {
        spatialHash,
        eventSystem,
        config: localConfig
    });
    
    console.log("Cyber Cycles - Initialization complete");
}

// Start the game
init();

// ============================================================================
// Exports for Testing
// ============================================================================

export {
    state,
    spatialHash,
    eventSystem,
    localConfig,
    createPlayerEntity,
    updatePlayerEntity,
    removePlayerEntity,
    updateGameState,
    renderGameState,
    collectTrailSegments,
    checkCollisions,
    updateSlipstream,
    updateAI
};
