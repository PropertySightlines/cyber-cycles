## 📁 File 2: `01_ARCHITECTURE.md`

```markdown
# 🏗️ Cyber Cycles - System Architecture

---

## 📊 High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        GCP VM (146.148.58.219)                  │
│                                                                 │
│  ┌──────────────────┐         ┌─────────────────────────────┐  │
│  │   Vite Dev       │         │   SpacetimeDB Cloud         │  │
│  │   Server         │◄───────►│   (maincloud.spacetimedb)   │  │
│  │   Port: 5173     │  WebSocket  │                         │  │
│  │                  │         │   ┌─────────────────────┐   │  │
│  │  index.html      │         │   │ cyber-cycles DB     │   │  │
│  │  src/main.js     │         │   │                     │   │  │
│  │  src/module/     │         │   │ - player table      │   │  │
│  │                  │         │   │ - game_state table  │   │  │
│  └──────────────────┘         │   │ - global_config     │   │  │
│                                │   │                     │   │  │
│                                │   │ Reducers:           │   │  │
│                                │   │ - join              │   │  │
│                                │   │ - sync_state        │   │  │
│                                │   │ - respawn           │   │  │
│                                │   │ - tick_countdown    │   │  │
│                                │   │ - update_config     │   │  │
│                                │   └─────────────────────┘   │  │
│                                └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/WebSocket
                              ▼
                    ┌─────────────────────┐
                    │   Player Browsers   │
                    │   (Multiple)        │
                    └─────────────────────┘
```

---

## 🗄️ Database Schema

### Player Table

```rust
pub struct Player {
    pub id: String,              // "p1", "p2", etc.
    pub owner_id: Identity,      // Player's SpacetimeDB identity
    pub is_ai: bool,             // true = AI, false = human
    pub personality: String,     // "aggressive", "safe", "random"
    pub color: u32,              // Hex color (0x00ffff, etc.)
    pub x: f32,                  // Position X
    pub z: f32,                  // Position Z
    pub dir_x: f32,              // Direction X (normalized)
    pub dir_z: f32,              // Direction Z (normalized)
    pub speed: f32,              // Current speed
    pub is_braking: bool,        // Braking state
    pub is_turning_left: bool,   // Smooth steering state
    pub is_turning_right: bool,  // Smooth steering state
    pub alive: bool,             // Still in race?
    pub ready: bool,             // Ready for round?
    pub turn_points_json: String,// JSON array of trail points
}
```

**Why JSON String?** SpacetimeDB v2 SDK crashes on `Vec<T>` parameters. Workaround is to serialize to JSON string.

### Game State Table

```rust
pub struct GameState {
    pub id: u32,           // Always 1 (singleton)
    pub winner_id: String, // Winner's player ID
    pub round_active: bool,// Is race in progress?
    pub countdown: u32,    // 3, 2, 1, 0
    pub player_count: u32, // Total players
    pub alive_count: u32,  // Players still alive
}
```

### Global Config Table

```rust
pub struct GlobalConfig {
    pub version: u32,           // Always 1 (singleton)
    pub admin_id: Identity,     // Admin user identity
    pub base_speed: f32,        // Normal speed (40)
    pub boost_speed: f32,       // Slipstream speed (70)
    pub max_trail_length: f32,  // Trail length limit (200)
    pub slipstream_mode: String,// "tail_only" or "standard"
    pub turn_speed: f32,        // Radians/second (3.0)
}
```

---

## 🔄 Data Flow

### Player Movement Loop

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Browser   │     │  SpacetimeDB │     │   Other Browsers│
│   (Client)  │     │   (Server)   │     │   (Clients)     │
└──────┬──────┘     └──────┬───────┘     └────────┬────────┘
       │                   │                      │
       │ 1. Player presses │                      │
       │    arrow key      │                      │
       │──────────────────►│                      │
       │                   │                      │
       │                   │ 2. Update player     │
       │                   │    position in DB    │
       │                   │─────────────────────►│
       │                   │                      │
       │                   │ 3. onInsert/onUpdate │
       │                   │    triggers          │
       │◄──────────────────│                      │
       │                   │                      │
       │ 4. Render new     │                      │
       │    position       │                      │
       │                   │                      │
```

### Round Start Sequence

```
1. Player presses arrow key → conn.reducers.join()
2. Server assigns player to AI bike
3. Server starts countdown (tick_countdown every second)
4. Countdown: 3 → 2 → 1 → 0
5. round_active = true
6. All player speeds set to base_speed
7. Race begins!
```

---

## 🎮 Game Loop (Client-Side)

```javascript
function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    
    updateGameState(dt);    // Physics, collision, AI
    updateParticles(dt);    // Explosion effects
    renderGameState();      // Three.js rendering
    renderer.render(scene, camera);
}
```

### updateGameState() Phases

1. **Position Update** - Move all players based on direction + speed
2. **Trail Generation** - Add trail points every 2 units traveled
3. **Segment Collection** - Build list of all trail segments for collision
4. **Slipstream Detection** - Check if players are in boost zones
5. **Trail Collision** - Check if players hit any trail
6. **Bike Collision** - Check if players hit each other
7. **Arena Bounds** - Check if players went out of bounds
8. **AI Logic** - Update AI steering decisions

---

## 🎨 Rendering Architecture

### Scene Graph

```
Scene
├── Fog (black, density 0.0025)
├── AmbientLight
├── GridHelper (arena floor)
├── Floor (glowing plane)
├── Boundary (red ring)
├── Player 1
│   ├── BikeGroup
│   │   ├── Mesh (box geometry)
│   │   └── GlowSprite (circular)
│   └── Trail (Mesh - triangle strip wall)
├── Player 2
│   └── ...
└── Particles (explosion effects)
```

### Trail Wall Rendering

Trails use `THREE.Mesh` with triangle strip geometry:

```javascript
// For each trail point, create 2 vertices (bottom + top)
positions.push(pt.x, 0, pt.z);      // Bottom
positions.push(pt.x, height, pt.z); // Top

// Create indices for triangle strip
for (let i = 0; i < points.length - 1; i++) {
    const base = i * 2;
    indices.push(base, base + 1, base + 2);
    indices.push(base + 1, base + 3, base + 2);
}
```

---

## 🌐 Network Architecture

### Connection Setup

```javascript
const conn = DbConnection.builder()
    .withUri("wss://maincloud.spacetimedb.com")
    .withDatabaseName("cyber-cycles")
    .withToken(localStorage.getItem("auth_token") || "")
    .onConnect((conn, identity, token) => {
        // Handle connection
    })
    .build();
```

### Subscription

```javascript
conn.subscriptionBuilder()
    .onApplied(() => {
        // Initial state synced
    })
    .subscribe([
        "SELECT * FROM player",
        "SELECT * FROM global_config",
        "SELECT * FROM game_state"
    ]);
```

### Reducer Calls

```javascript
// Join race
conn.reducers.join();

// Sync state (called when turning/braking)
conn.reducers.syncState(
    playerId, x, z, dirX, dirZ, speed,
    isBraking, alive, isTurningLeft, isTurningRight,
    turnPointsJson
);

// Respawn all
conn.reducers.respawn(playerId);

// Update countdown (called every second)
conn.reducers.tickCountdown();
```

---

## 📁 Project Structure

```
/home/property.sightlines/spacetime/
├── cyber-client/                    # Frontend
│   ├── index.html                   # ⚠️ Entry point (NOT in src/)
│   ├── package.json
│   ├── vite.config.js
│   ├── src/
│   │   ├── main.js                  # Game logic + rendering
│   │   └── module/                  # Generated SpacetimeDB types
│   │       ├── index.ts
│   │       ├── player_table.ts
│   │       ├── game_state_table.ts
│   │       ├── global_config_table.ts
│   │       ├── sync_state_reducer.ts
│   │       ├── join_reducer.ts
│   │       ├── respawn_reducer.ts
│   │       ├── tick_countdown_reducer.ts
│   │       ├── update_config_reducer.ts
│   │       └── types/
│   └── docs/                        # This documentation
│       ├── 00_START_HERE.md
│       ├── 01_ARCHITECTURE.md
│       └── ...
│
└── cyber-cycles-db/
    └── spacetimedb/                 # Backend
        ├── Cargo.toml
        ├── src/
        │   └── lib.rs               # SpacetimeDB module
        └── target/                  # Build artifacts
```

---

## 🔐 Security Notes

| Concern | Status |
|---------|--------|
| **Authentication** | SpacetimeDB identity tokens (stored in localStorage) |
| **Authorization** | Admin checks via identity comparison |
| **Input Validation** | Server-side validation in reducers |
| **Rate Limiting** | Not implemented (clients can spam reducers) |
| **CORS** | Not configured (dev mode only) |

---

## 📈 Performance Considerations

| Aspect | Current | Notes |
|--------|---------|-------|
| **Players** | 6 | Can increase with performance testing |
| **Trail Points** | Every 2 units | Balance between smoothness and performance |
| **Trail Length** | 200 units | Longer trails = more collision checks |
| **Collision Checks** | O(n²) | Could optimize with spatial partitioning |
| **Render Rate** | 60 FPS | Depends on GPU |

---

**Next:** Read `02_BUILD_DEPLOY.md` for build instructions.
```

---

