import * as THREE from 'three';
import { DbConnection } from "./module";
import { CONSTANTS, DEFAULT_CONFIG, clonePlayer, normalize, rotateDirection, distanceToSegment } from './game-logic.js';

let localConfig = { ...DEFAULT_CONFIG };

const state = { 
    players: {}, 
    isBoosting: false, 
    countdown: 3,
    roundActive: false,
    cameraShake: 0,
    turnLeft: false,
    turnRight: false,
    brake: false
};
let myIdentity = null;
let myPlayerId = null;
let isAdmin = false;
let countdownInterval = null;
let lastTurnState = { left: false, right: false };

const ADMIN_IDENTITY = "c2007484dedccf3d247b44dc4ebafeee388121889dffea0ceedfd63b888106c1";

const conn = DbConnection.builder()
    .withUri("wss://maincloud.spacetimedb.com")
    .withDatabaseName("cyber-cycles")
    .withToken(localStorage.getItem("auth_token") || "")
    .onConnect((conn, identity, token) => {
        localStorage.setItem("auth_token", token);
        myIdentity = identity;
        console.log("Connected:", identity.toHexString().substring(0, 16) + "...");
        console.log("Available reducers:", Object.keys(conn.reducers));
        
        if (identity.toHexString() === ADMIN_IDENTITY) {
            isAdmin = true;
            const adminPanel = document.getElementById('admin-panel');
            if (adminPanel) adminPanel.style.display = 'block';
        }
        
        updateStatus("Press any arrow key to join the race!");
        
        conn.subscriptionBuilder()
            .onApplied(() => {
                console.log("Synced!");
                updatePlayerList();
                
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

conn.db.player.onInsert((ctx, p) => {
    console.log("Player joined:", p.id);
    state.players[p.id] = clonePlayer(p);
    updatePlayerList();
});

conn.db.player.onUpdate((ctx, oldP, newP) => {
    const ownerId = newP.owner_id || newP.ownerId;
    if (ownerId && ownerId.toHexString() === myIdentity.toHexString()) {
        myPlayerId = newP.id;
        updateStatus(`You are ${myPlayerId} - Get ready!`);
    }
    state.players[newP.id] = clonePlayer(newP);
    updatePlayerList();
});

conn.db.global_config.onInsert((ctx, cfg) => applyConfig(cfg));
conn.db.global_config.onUpdate((ctx, oldCfg, newCfg) => applyConfig(newCfg));

conn.db.game_state.onInsert((ctx, gs) => handleGameState(gs));
conn.db.game_state.onUpdate((ctx, oldGs, newGs) => handleGameState(newGs));

function handleGameState(gs) {
    const oldCountdown = state.countdown;
    const oldRoundActive = state.roundActive;
    
    state.countdown = gs.countdown !== undefined ? gs.countdown : 3;
    state.roundActive = gs.round_active !== undefined ? gs.round_active : 
                        (gs.roundActive !== undefined ? gs.roundActive : false);
    
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
    
    if (!state.roundActive && gs.winner_id && oldRoundActive) {
        if (gs.winner_id === myPlayerId) {
            showWinScreen();
            updateStatus("🏆 VICTORY! 🏆");
        } else if (state.players[myPlayerId] && !state.players[myPlayerId].alive) {
            showDeathScreen();
            updateStatus("Eliminated!");
        }
    }
    
    if (state.roundActive && !oldRoundActive) {
        hideDeathScreen();
        hideWinScreen();
        updateStatus("GO!");
        
        Object.values(state.players).forEach(p => {
            if (p && p.alive && p.ready) {
                p.speed = localConfig.baseSpeed;
            }
        });
        console.log("ROUND STARTED - Players:", Object.keys(state.players).length);
    }
}

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

function sendStateSync(p) {
    if (!p || !state.roundActive) return;

    const safeId = (typeof p.id === "string" && p.id.length > 0) ? p.id : "";
    if (safeId.length === 0) return;

    const turnPointsJson = JSON.stringify(p.turnPoints || []);

    try {
        conn.reducers.syncState(
            safeId, 
            Number(p.x) || 0,
            Number(p.z) || 0,
            Number(p.dir_x) || 0,
            Number(p.dir_z) || -1,
            Number(p.speed) || localConfig.baseSpeed,
            Boolean(state.brake),
            Boolean(p.alive),
            Boolean(state.turnLeft),
            Boolean(state.turnRight),
            turnPointsJson
        );
    } catch (e) {
        console.error("SDK Error:", e.message);
    }
}

function requestRespawn() {
    if (myPlayerId) {
        conn.reducers.respawn(myPlayerId);
        hideDeathScreen();
        hideWinScreen();
        updateStatus("New race starting...");
    }
}

window.addEventListener('keydown', (e) => {
    if (!myPlayerId && (e.key.startsWith('Arrow') || ['a','d','s','A','D','S'].includes(e.key))) {
        conn.reducers.join();
        updateStatus("Joining race...");
        return;
    }
    
    const p = state.players[myPlayerId];
    if (!p) return;
    
    if (!p.alive) {
        requestRespawn();
        return;
    }
    
    if (!state.roundActive) return;

    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        state.turnLeft = true;
        state.turnRight = false;
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        state.turnRight = true;
        state.turnLeft = false;
    } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        state.brake = true;
        p.is_braking = true;
        sendStateSync(p);
    }
});

window.addEventListener('keyup', (e) => {
    const p = state.players[myPlayerId];
    
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        state.turnLeft = false;
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        state.turnRight = false;
    } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        state.brake = false;
        if (p) {
            p.is_braking = false;
            sendStateSync(p);
        }
    }
    
    if (p && state.roundActive && (state.turnLeft !== lastTurnState.left || state.turnRight !== lastTurnState.right)) {
        lastTurnState.left = state.turnLeft;
        lastTurnState.right = state.turnRight;
        sendStateSync(p);
    }
});

// UI Functions
function updateStatus(msg) {
    const statusEl = document.getElementById('status');
    if (statusEl) statusEl.innerText = msg;
}

function showDeathScreen() {
    const deathEl = document.getElementById('death-screen');
    const respawnBtn = document.getElementById('respawn-btn');
    if (deathEl) deathEl.style.display = 'block';
    if (respawnBtn) respawnBtn.style.display = 'block';
    state.cameraShake = 0.5;
    createExplosion(state.players[myPlayerId], 0xff3333);
}

function hideDeathScreen() {
    const deathEl = document.getElementById('death-screen');
    const respawnBtn = document.getElementById('respawn-btn');
    if (deathEl) deathEl.style.display = 'none';
    if (respawnBtn) respawnBtn.style.display = 'none';
}

function showWinScreen() {
    const winEl = document.getElementById('win-screen');
    const respawnBtn = document.getElementById('respawn-btn');
    if (winEl) winEl.style.display = 'block';
    if (respawnBtn) respawnBtn.style.display = 'block';
    createExplosion(state.players[myPlayerId], 0x00ffff);
    createExplosion(state.players[myPlayerId], 0xffff00);
}

function hideWinScreen() {
    const winEl = document.getElementById('win-screen');
    if (winEl) winEl.style.display = 'none';
}

function updatePlayerList() {
    const container = document.getElementById('player-entries');
    if (!container) return;
    
    container.innerHTML = '';
    
    Object.values(state.players).forEach(p => {
        if (!p) return;
        
        const entry = document.createElement('div');
        entry.className = 'player-entry';
        
        const colorBox = document.createElement('div');
        colorBox.className = 'player-color';
        const colorHex = '#' + p.color.toString(16).padStart(6, '0');
        colorBox.style.backgroundColor = colorHex;
        colorBox.style.color = colorHex;
        colorBox.style.boxShadow = `0 0 10px ${colorHex}`;
        
        const name = document.createElement('span');
        name.className = 'player-name';
        let displayName = p.id.toUpperCase();
        if (p.id === myPlayerId) {
            displayName += ' (YOU)';
            name.style.color = '#00ffff';
            entry.style.background = 'rgba(0,255,255,0.1)';
            entry.style.border = '1px solid #00ffff';
        } else if (p.is_ai) {
            displayName += ' (AI)';
        }
        name.innerText = displayName;
        
        const status = document.createElement('span');
        status.className = 'player-status ' + (p.alive ? 'alive' : 'dead');
        status.innerText = p.alive ? '●' : '○';
        
        entry.appendChild(colorBox);
        entry.appendChild(name);
        entry.appendChild(status);
        container.appendChild(entry);
    });
}

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

function updateGameState(dt) {
    const players = Object.values(state.players);
    let allSegments = [];

    // First pass: Update positions and collect trail segments
    players.forEach(p => {
        if (!p || !p.id || !p.ready) return;
        if (!Array.isArray(p.turnPoints)) p.turnPoints = [];
        if (!p.alive) return;
        if (!state.roundActive) return;
        
        const dirX = p.dir_x || 0;
        const dirZ = p.dir_z || -1;
        
        // Normalize direction
        const normalized = normalize(dirX, dirZ);
        p.dir_x = normalized.x;
        p.dir_z = normalized.z;
        
        // Smooth steering
        const isTurningLeft = p.id === myPlayerId ? state.turnLeft : p.is_turning_left;
        const isTurningRight = p.id === myPlayerId ? state.turnRight : p.is_turning_right;
        
        let newDirX = dirX;
        let newDirZ = dirZ;
        
        if (isTurningLeft) {
            const rotated = rotateDirection(dirX, dirZ, CONSTANTS.TURN_SPEED * dt);
            newDirX = rotated.x;
            newDirZ = rotated.z;
        } else if (isTurningRight) {
            const rotated = rotateDirection(dirX, dirZ, -CONSTANTS.TURN_SPEED * dt);
            newDirX = rotated.x;
            newDirZ = rotated.z;
        }
        
        p.dir_x = newDirX;
        p.dir_z = newDirZ;
        
        // FIXED: Add trail point based on distance traveled (not just turning)
        const distMoved = Math.hypot(p.x - p.lastTrailPoint.x, p.z - p.lastTrailPoint.z);
        p.distanceSinceLastPoint += distMoved;
        
        if (p.distanceSinceLastPoint >= CONSTANTS.TRAIL_SPACING) {
            p.turnPoints.push({ x: p.x, z: p.z });
            p.lastTrailPoint = { x: p.x, z: p.z };
            p.distanceSinceLastPoint = 0;
        }
        
        // Speed control
        if (state.brake || p.is_braking) {
            p.speed = CONSTANTS.BRAKE_SPEED;
        } else {
            p.speed = localConfig.baseSpeed;
        }
        
        // Move
        p.x += newDirX * p.speed * dt;
        p.z += newDirZ * p.speed * dt;

        // Build trail segments for collision - ALL segments
        for (let i = 0; i < p.turnPoints.length - 1; i++) {
            let p1 = p.turnPoints[i];
            let p2 = p.turnPoints[i + 1];
            if (p1 && p2) {
                allSegments.push({ 
                    x1: p1.x, z1: p1.z, 
                    x2: p2.x, z2: p2.z, 
                    pid: p.id,
                    isRecent: i >= p.turnPoints.length - 5  // Last 5 segments are "recent"
                });
            }
        }
    });

    // Second pass: Collision detection
    players.forEach(p => {
        if (!p || !p.id || !p.alive || !p.ready) return;
        if (!state.roundActive) return;

        const dirX = p.dir_x || 0;
        const dirZ = p.dir_z || -1;

        let minDistanceToTrail = Infinity;
        let tempClosest = {};
        let isBoosting = false;
        
        // Slipstream detection
        allSegments.forEach(seg => {
            if (seg.pid === p.id) return;
            const dist = distanceToSegment(p.x, p.z, seg.x1, seg.z1, seg.x2, seg.z2, tempClosest);
            
            if (dist < minDistanceToTrail && dist <= CONSTANTS.BOOST_RADIUS) {
                let validBoost = true;
                if (localConfig.slipstreamMode === "tail_only") {
                    const dot = (tempClosest.x - p.x) * dirX + (tempClosest.z - p.z) * dirZ;
                    if (dot <= 0) validBoost = false;
                }
                if (validBoost) { 
                    minDistanceToTrail = dist; 
                }
            }
        });

        if (minDistanceToTrail <= CONSTANTS.BOOST_RADIUS) {
            p.speed = localConfig.boostSpeed;
            isBoosting = true;
        }

        if (p.id === myPlayerId) {
            state.isBoosting = isBoosting;
            const boostEl = document.getElementById('boost-indicator');
            const speedEl = document.getElementById('speed-display');
            if (boostEl) boostEl.style.display = isBoosting ? 'block' : 'none';
            if (speedEl) speedEl.innerText = Math.round(p.speed * 3.6) + ' km/h';
        }

        // FIXED: Trail collision - collide with ALL other player trails
        allSegments.forEach(seg => {
            if (seg.pid === p.id) return;  // Don't collide with own trail
            
            const dist = distanceToSegment(p.x, p.z, seg.x1, seg.z1, seg.x2, seg.z2);
            if (dist < CONSTANTS.DEATH_RADIUS) {
                p.alive = false;
                console.log("Player", p.id, "hit trail of", seg.pid, "at distance", dist);
                if (p.id === myPlayerId) {
                    sendStateSync(p);
                    showDeathScreen();
                }
            }
        });
        
        // Cycle-to-cycle collision
        players.forEach(other => {
            if (!other || !other.alive || other.id === p.id) return;
            const dist = Math.hypot(p.x - other.x, p.z - other.z);
            if (dist < CONSTANTS.BIKE_COLLISION_DIST) {
                p.alive = false;
                other.alive = false;
                if (p.id === myPlayerId) {
                    sendStateSync(p);
                    showDeathScreen();
                }
            }
        });
        
        // Arena bounds
        if (Math.abs(p.x) > 200 || Math.abs(p.z) > 200) { 
            p.alive = false; 
            if (p.id === myPlayerId) {
                sendStateSync(p);
                showDeathScreen();
            }
        }

        // Trail length management
        let remainingLength = localConfig.maxTrailLength;
        let points = [...p.turnPoints];
        let keptPoints = points.length > 0 ? [points[points.length - 1]] : [];
        
        for (let i = points.length - 2; i >= 0; i--) {
            let dist = Math.hypot(points[i+1].x - points[i].x, points[i+1].z - points[i].z);
            if (remainingLength >= dist) {
                keptPoints.unshift(points[i]);
                remainingLength -= dist;
            } else {
                let r = remainingLength / dist;
                keptPoints.unshift({ 
                    x: points[i+1].x + (points[i].x - points[i+1].x) * r, 
                    z: points[i+1].z + (points[i].z - points[i+1].z) * r 
                });
                break;
            }
        }
        p.turnPoints = keptPoints;

        // AI Logic
        const isAi = p.is_ai !== undefined ? p.is_ai : p.isAi;

        if (isAi) {
            const lookX = p.x + dirX * 25; 
            const lookZ = p.z + dirZ * 25;
            let blocked = Math.abs(lookX) > 180 || Math.abs(lookZ) > 180;
            
            if(!blocked) {
                allSegments.forEach(seg => {
                    if (seg.pid === p.id) return;
                    if (distanceToSegment(lookX, lookZ, seg.x1, seg.z1, seg.x2, seg.z2) < 10) blocked = true;
                });
                
                players.forEach(other => {
                    if (!other || !other.alive || other.id === p.id) return;
                    const dist = Math.hypot(lookX - other.x, lookZ - other.z);
                    if (dist < 15) blocked = true;
                });
            }

            if (blocked) {
                const towardCenterX = -p.x;
                const towardCenterZ = -p.z;
                const normalized = normalize(towardCenterX, towardCenterZ);
                
                const cross = dirX * normalized.z - dirZ * normalized.x;
                
                if (cross > 0.2) {
                    p.is_turning_left = true;
                    p.is_turning_right = false;
                } else if (cross < -0.2) {
                    p.is_turning_left = false;
                    p.is_turning_right = true;
                } else {
                    p.is_turning_left = false;
                    p.is_turning_right = false;
                }
                
                sendStateSync(p);
            } else {
                p.is_turning_left = false;
                p.is_turning_right = false;
            }
        }
    });
}

// Particle System
const particles = [];

function createExplosion(player, color = 0xff3333) {
    if (!player) return;
    
    const particleCount = 80;
    const positions = [];
    const velocities = [];
    
    for (let i = 0; i < particleCount; i++) {
        positions.push(player.x, 1, player.z);
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

// Rendering
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

const renderCache = {};

function renderGameState() {
    if (state.cameraShake > 0) {
        camera.position.x += (Math.random() - 0.5) * state.cameraShake;
        camera.position.y += (Math.random() - 0.5) * state.cameraShake;
        camera.position.z += (Math.random() - 0.5) * state.cameraShake;
        state.cameraShake -= 0.02;
        if (state.cameraShake < 0) state.cameraShake = 0;
    }
    
    Object.values(state.players).forEach(p => {
        if (!p || !p.id) return;
        
        if (!renderCache[p.id]) {
            const bikeGroup = new THREE.Group();
            
            const mesh = new THREE.Mesh(
                new THREE.BoxGeometry(2, 1.5, 4), 
                new THREE.MeshStandardMaterial({ 
                    color: p.color,
                    emissive: p.color,
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
                    color: p.color, 
                    transparent: true, 
                    opacity: 0.4,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false
                })
            );
            glowSprite.scale.set(12, 12, 1);
            glowSprite.position.y = 1;
            bikeGroup.add(glowSprite);
            
            // FIXED: Trail wall geometry (ribbon that goes up)
            const trailGeometry = new THREE.BufferGeometry();
            const trailMaterial = new THREE.MeshBasicMaterial({ 
                color: p.color,
                transparent: true,
                opacity: 0.7,
                side: THREE.DoubleSide,
                depthWrite: false
            });
            const trail = new THREE.Mesh(trailGeometry, trailMaterial);
            
            scene.add(bikeGroup); 
            scene.add(trail); 
            renderCache[p.id] = { bikeGroup, mesh, trail, glowSprite };
            console.log("Created render cache for:", p.id);
        }
        const { bikeGroup, trail, glowSprite } = renderCache[p.id];
        
        if (p.id === myPlayerId) {
            const dirX = p.dir_x || 0;
            const dirZ = p.dir_z || -1;
            camera.position.lerp(new THREE.Vector3(p.x - dirX * 35, 20, p.z - dirZ * 35), 0.08);
            camera.lookAt(p.x, 1, p.z);
        }

        bikeGroup.visible = trail.visible = p.alive;
        if (!p.alive) return;
        
        const dirX = p.dir_x || 0;
        const dirZ = p.dir_z || -1;
        bikeGroup.position.set(p.x, 0, p.z); 
        bikeGroup.rotation.y = Math.atan2(dirX, dirZ);
        
        const isBoosting = state.isBoosting && p.id === myPlayerId;
        glowSprite.material.opacity = isBoosting ? 0.7 : 0.4;
        glowSprite.scale.set(isBoosting ? 18 : 12, isBoosting ? 18 : 12, 1);
        
        // FIXED: Trail wall rendering
        if (p.turnPoints && p.turnPoints.length >= 2) {
            const positions = [];
            const height = CONSTANTS.TRAIL_HEIGHT;
            
            for (let i = 0; i < p.turnPoints.length; i++) {
                const pt = p.turnPoints[i];
                // Bottom vertex
                positions.push(pt.x, 0, pt.z);
                // Top vertex
                positions.push(pt.x, height, pt.z);
            }
            
            trail.geometry.dispose();
            trail.geometry = new THREE.BufferGeometry();
            trail.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            
            // Create indices for triangle strip
            const indices = [];
            for (let i = 0; i < p.turnPoints.length - 1; i++) {
                const base = i * 2;
                indices.push(base, base + 1, base + 2);
                indices.push(base + 1, base + 3, base + 2);
            }
            trail.geometry.setIndex(indices);
            trail.geometry.computeVertexNormals();
        }
    });
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

let lastTime = performance.now();

function animate() {
    requestAnimationFrame(animate);
    const now = performance.now();
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    
    updateGameState(dt);
    updateParticles(dt);
    renderGameState();
    renderer.render(scene, camera);
}
animate();