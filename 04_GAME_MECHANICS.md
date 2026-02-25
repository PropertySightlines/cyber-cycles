## 📁 File 5: `04_GAME_MECHANICS.md`

```markdown
# 🎮 Cyber Cycles - Game Mechanics Implementation

---

## 🏁 Game Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Lobby     │────►│  Countdown  │────►│    Race     │
│  (Waiting)  │     │   3-2-1     │     │  (Active)   │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                              ┌────────────────┤
                              │                │
                              ▼                ▼
                     ┌─────────────┐   ┌─────────────┐
                     │   Winner    │   │  Eliminated │
                     │   Screen    │   │   Screen    │
                     └──────┬──────┘   └──────┬──────┘
                            │                │
                            └────────┬───────┘
                                     │
                                     ▼
                            ┌─────────────┐
                            │  Respawn    │
                            │  (All)      │
                            └─────────────┘
```

---

## 🎯 Player Movement

### Smooth Steering

```javascript
// Direction rotation (FIXED - correct signs)
function rotateDirection(dirX, dirZ, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
        x: dirX * cos + dirZ * sin,
        z: -dirX * sin + dirZ * cos
    };
}

// Apply steering
if (isTurningLeft) {
    const rotated = rotateDirection(dirX, dirZ, TURN_SPEED * dt);
    newDirX = rotated.x;
    newDirZ = rotated.z;
} else if (isTurningRight) {
    const rotated = rotateDirection(dirX, dirZ, -TURN_SPEED * dt);
    newDirX = rotated.x;
    newDirZ = rotated.z;
}
```

### Trail Generation

```javascript
// Add trail point based on distance traveled
const distMoved = Math.hypot(p.x - p.lastTrailPoint.x, p.z - p.lastTrailPoint.z);
p.distanceSinceLastPoint += distMoved;

if (p.distanceSinceLastPoint >= TRAIL_SPACING) {  // Every 2 units
    p.turnPoints.push({ x: p.x, z: p.z });
    p.lastTrailPoint = { x: p.x, z: p.z };
    p.distanceSinceLastPoint = 0;
}
```

### Speed Control

```javascript
// Base speed
p.speed = localConfig.baseSpeed;  // 40

// Brake
if (state.brake || p.is_braking) {
    p.speed = BRAKE_SPEED;  // 20
}

// Slipstream boost
if (minDistanceToTrail <= BOOST_RADIUS) {
    p.speed = localConfig.boostSpeed;  // 70
}
```

---

## 💥 Collision Detection

### Trail Collision

```javascript
// Distance from point to line segment
function distanceToSegment(px, pz, x1, z1, x2, z2, outClosest = {}) {
    const l2 = (x2 - x1) ** 2 + (z2 - z1) ** 2;
    if (l2 === 0) return Math.hypot(px - x1, pz - z1);
    
    let t = Math.max(0, Math.min(1, 
        ((px - x1) * (x2 - x1) + (pz - z1) * (z2 - z1)) / l2
    ));
    
    outClosest.x = x1 + t * (x2 - x1);
    outClosest.z = z1 + t * (z2 - z1);
    
    return Math.hypot(px - outClosest.x, pz - outClosest.z);
}

// Check collision
allSegments.forEach(seg => {
    if (seg.pid === p.id) return;  // Don't collide with own trail
    
    const dist = distanceToSegment(p.x, p.z, seg.x1, seg.z1, seg.x2, seg.z2);
    if (dist < DEATH_RADIUS) {  // 2.0 units
        p.alive = false;
    }
});
```

### Bike-to-Bike Collision

```javascript
players.forEach(other => {
    if (!other || !other.alive || other.id === p.id) return;
    
    const dist = Math.hypot(p.x - other.x, p.z - other.z);
    if (dist < BIKE_COLLISION_DIST) {  // 4.0 units
        p.alive = false;
        other.alive = false;  // Both die!
    }
});
```

### Arena Bounds

```javascript
if (Math.abs(p.x) > 200 || Math.abs(p.z) > 200) {
    p.alive = false;
}
```

---

## 🤖 AI Behavior

### Decision Making

```javascript
if (isAi) {
    // Look ahead
    const lookX = p.x + dirX * 25;
    const lookZ = p.z + dirZ * 25;
    
    // Check if blocked
    let blocked = Math.abs(lookX) > 180 || Math.abs(lookZ) > 180;
    
    if (!blocked) {
        // Check trails
        allSegments.forEach(seg => {
            if (seg.pid === p.id) return;
            if (distanceToSegment(lookX, lookZ, seg.x1, seg.z1, seg.x2, seg.z2) < 10) {
                blocked = true;
            }
        });
        
        // Check other bikes
        players.forEach(other => {
            if (!other || !other.alive || other.id === p.id) return;
            const dist = Math.hypot(lookX - other.x, lookZ - other.z);
            if (dist < 15) blocked = true;
        });
    }
    
    // Turn if blocked
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
        }
        
        sendStateSync(p);
    }
}
```

### Personalities

```rust
let personalities = ["aggressive", "safe", "random", "aggressive", "safe", "random"];

// Aggressive: Turn later, riskier
// Safe: Turn earlier, cautious
// Random: Mixed behavior
```

---

## 🏆 Win Detection

```rust
fn check_winner(ctx: &ReducerContext) {
    let alive_players: Vec<_> = ctx.db.player().iter()
        .filter(|p| p.alive).collect();
    let total_players = ctx.db.player().iter()
        .filter(|p| p.ready).count();
    
    if let Some(mut gs) = ctx.db.game_state().id().find(1) {
        gs.alive_count = alive_players.len() as u32;
        
        // Last player standing wins
        if alive_players.len() == 1 && total_players > 1 && gs.round_active {
            gs.round_active = false;
            gs.winner_id = alive_players[0].id.clone();
            ctx.db.game_state().id().update(gs);
        } else if alive_players.is_empty() && gs.round_active {
            // Everyone died - no winner
            gs.round_active = false;
            ctx.db.game_state().id().update(gs);
        }
    }
}
```

---

## 🎨 Visual Effects

### Trail Wall Rendering

```javascript
// Create triangle strip for wall
const positions = [];
const height = 2.0;

for (let i = 0; i < p.turnPoints.length; i++) {
    const pt = p.turnPoints[i];
    positions.push(pt.x, 0, pt.z);        // Bottom
    positions.push(pt.x, height, pt.z);   // Top
}

// Create indices
const indices = [];
for (let i = 0; i < p.turnPoints.length - 1; i++) {
    const base = i * 2;
    indices.push(base, base + 1, base + 2);
    indices.push(base + 1, base + 3, base + 2);
}
```

### Explosion Particles

```javascript
function createExplosion(player, color = 0xff3333) {
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
    
    // Create particle system with gravity
    // Update each frame, remove when life <= 0
}
```

### Glow Effects

```javascript
// Circular glow texture
function createGlowTexture() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    
    return new THREE.CanvasTexture(canvas);
}
```

---

## 🎮 Input Handling

```javascript
// Key down - start turning
window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') {
        state.turnLeft = true;
        state.turnRight = false;
    } else if (e.key === 'ArrowRight' || e.key === 'd') {
        state.turnRight = true;
        state.turnLeft = false;
    } else if (e.key === 'ArrowDown' || e.key === 's') {
        state.brake = true;
        sendStateSync(p);
    }
});

// Key up - stop turning
window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') {
        state.turnLeft = false;
    } else if (e.key === 'ArrowRight' || e.key === 'd') {
        state.turnRight = false;
    } else if (e.key === 'ArrowDown' || e.key === 's') {
        state.brake = false;
        sendStateSync(p);
    }
});
```

---

## 📊 Game Constants

```javascript
const CONSTANTS = {
    ARENA_SIZE: 400,           // Total arena size
    BOOST_RADIUS: 5,           // Distance for slipstream
    DEATH_RADIUS: 2.0,         // Trail collision distance
    BRAKE_SPEED: 20,           // Speed when braking
    TURN_SPEED: 2.0,           // Radians per second
    NUM_PLAYERS: 6,            // Total players
    SPAWN_RADIUS: 100,         // Circle spawn radius
    BIKE_COLLISION_DIST: 4.0,  // Bike-to-bike collision
    TRAIL_SPACING: 2.0,        // Trail point spacing
    TRAIL_HEIGHT: 2.0,         // Trail wall height
};
```

---

**Next:** Read `05_KNOWN_ISSUES.md` for bugs and workarounds.
```

---
