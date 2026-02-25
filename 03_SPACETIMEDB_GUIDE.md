## 📁 File 4: `03_SPACETIMEDB_GUIDE.md`

```markdown
# 🌌 SpacetimeDB v2 - Complete Guide

---

## 📚 What is SpacetimeDB?

SpacetimeDB is a **serverless multiplayer backend** that:
- Runs Rust code on the server
- Syncs state to clients via WebSocket
- Handles authentication, subscriptions, and reducers
- Version 2.0 released recently (breaking changes from v1)

**Documentation:** https://spacetimedb.com/docs/

---

## ⚠️ CRITICAL: SpacetimeDB v2 Bugs & Workarounds

### Bug #1: Vec<T> Parameter Serialization

**Symptom:**
```
TypeError: Cannot read properties of undefined (reading 'length')
    at sendStateSync
```

**Cause:** SDK v2 crashes when validating `Vec<T>` reducer parameters.

**Workaround:** Use JSON strings instead:

```rust
// ❌ DON'T - Will crash
#[reducer]
pub fn sync_state(ctx: &ReducerContext, ..., turn_points: Vec<Vec2>) { }

// ✅ DO - Works
#[reducer]
pub fn sync_state(ctx: &ReducerContext, ..., turn_points_json: String) {
    // Parse on server if needed
    let turn_points: Vec<Vec2> = serde_json::from_str(&turn_points_json).unwrap();
}
```

```javascript
// Client side
const turnPointsJson = JSON.stringify(p.turnPoints);
conn.reducers.syncState(..., turnPointsJson);
```

### Bug #2: Field Name Conversion

**Symptom:**
```
Cannot read properties of undefined (reading 'toHexString')
```

**Cause:** SpacetimeDB converts snake_case → camelCase in TypeScript.

**Solution:** Always check both conventions:

```javascript
// Check both field names
const ownerId = p.owner_id || p.ownerId;
const isAi = p.is_ai !== undefined ? p.is_ai : p.isAi;
const turnPointsJson = p.turn_points_json || p.turnPointsJson;
```

### Bug #3: Reducer Name Conversion

**Symptom:**
```
conn.reducers.tick_countdown is not a function
```

**Cause:** Reducers are also converted to camelCase.

**Solution:**

| Rust | TypeScript |
|------|------------|
| `tick_countdown` | `tickCountdown` |
| `sync_state` | `syncState` |
| `update_config` | `updateConfig` |

---

## 🗄️ Database Design

### Table Design Patterns

```rust
// Singleton pattern (one row per table)
#[table(accessor = game_state, public)]
pub struct GameState {
    #[primary_key]
    pub id: u32,  // Always 1
    pub round_active: bool,
    // ...
}

// Entity pattern (many rows)
#[table(accessor = player, public)]
pub struct Player {
    #[primary_key]
    pub id: String,  // "p1", "p2", etc.
    pub owner_id: Identity,
    // ...
}
```

### Index Considerations

```rust
#[table(accessor = player, public)]
pub struct Player {
    #[primary_key]  // Automatically indexed
    pub id: String,
    
    // Add secondary indexes if needed
    // #[index(btree)]
    // pub owner_id: Identity,
}
```

---

## 🔧 Reducer Patterns

### Join Pattern (Claim Entity)

```rust
#[reducer]
pub fn join(ctx: &ReducerContext) {
    // Check if already has entity
    if ctx.db.player().iter().any(|p| p.owner_id == ctx.sender()) {
        return;
    }
    
    // Find available AI entity
    if let Some(mut p) = ctx.db.player().iter()
        .filter(|p| p.is_ai)
        .next() 
    {
        p.is_ai = false;
        p.owner_id = ctx.sender();
        ctx.db.player().id().update(p);
    }
}
```

### Sync State Pattern

```rust
#[reducer]
pub fn sync_state(ctx: &ReducerContext, id: String, /* ... */) {
    if let Some(mut p) = ctx.db.player().id().find(id) {
        // Authorization check
        if p.owner_id == ctx.sender() || p.is_ai {
            // Update fields
            p.x = x;
            p.z = z;
            // ...
            ctx.db.player().id().update(p);
            
            // Trigger game logic
            check_winner(ctx);
        }
    }
}
```

### Countdown Pattern

```rust
#[reducer]
pub fn tick_countdown(ctx: &ReducerContext) {
    if let Some(mut gs) = ctx.db.game_state().id().find(1) {
        if !gs.round_active && gs.countdown > 0 {
            gs.countdown -= 1;
            
            if gs.countdown == 0 {
                gs.round_active = true;
                // Start all players
            }
            
            ctx.db.game_state().id().update(gs);
        }
    }
}
```

---

## 🔐 Authentication

### Identity Management

```rust
// Hardcode admin identity
let admin_identity = Identity::from_hex("c2007484...").unwrap();

// Check sender identity
if ctx.sender() == cfg.admin_id {
    // Admin action allowed
}

// Get sender identity
let sender = ctx.sender();
```

### Client-Side Identity

```javascript
// Identity is provided on connect
.onConnect((conn, identity, token) => {
    localStorage.setItem("auth_token", token);
    myIdentity = identity;
    
    // Check admin
    if (identity.toHexString() === ADMIN_IDENTITY) {
        isAdmin = true;
    }
})
```

---

## 📡 Subscriptions

### Basic Subscription

```javascript
conn.subscriptionBuilder()
    .onApplied(() => {
        console.log("Initial state synced!");
    })
    .subscribe([
        "SELECT * FROM player",
        "SELECT * FROM game_state",
        "SELECT * FROM global_config"
    ]);
```

### Subscription Callbacks

```javascript
// On insert
conn.db.player.onInsert((ctx, p) => {
    console.log("Player joined:", p.id);
    state.players[p.id] = clonePlayer(p);
});

// On update
conn.db.player.onUpdate((ctx, oldP, newP) => {
    state.players[newP.id] = clonePlayer(newP);
});

// On delete
conn.db.player.onDelete((ctx, p) => {
    delete state.players[p.id];
});
```

---

## 🔄 Client-Server Sync Patterns

### Pattern 1: Full State Sync

```rust
// Server
#[reducer]
pub fn sync_state(ctx: &ReducerContext, id: String, x: f32, z: f32, /* ... */) {
    // Update all fields
}
```

```javascript
// Client
function sendStateSync(p) {
    conn.reducers.syncState(
        p.id, p.x, p.z, p.dir_x, p.dir_z,
        p.speed, p.is_braking, p.alive,
        p.is_turning_left, p.is_turning_right,
        JSON.stringify(p.turnPoints)
    );
}
```

### Pattern 2: Input Sync (Better for Fast Action)

```rust
// Server
#[reducer]
pub fn set_input(ctx: &ReducerContext, left: bool, right: bool, brake: bool) {
    // Server simulates physics
}
```

```javascript
// Client
window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
        conn.reducers.set_input(true, false, false);
    }
});
```

---

## 🐛 Common Errors

### "Cannot read properties of undefined"

**Cause:** Field name mismatch (snake_case vs camelCase)

**Fix:**
```javascript
// Check both conventions
const value = obj.snake_case || obj.camelCase;
```

### "Reducer is not a function"

**Cause:** Reducer name not converted to camelCase

**Fix:**
```javascript
// Use camelCase
conn.reducers.tickCountdown();  // Not tick_countdown()
```

### "Schema mismatch"

**Cause:** Client types don't match server schema

**Fix:**
```bash
# Regenerate types
spacetime generate --lang typescript --out-dir src/module
# Clear browser cache
# Hard refresh
```

---

## 📊 Performance Tips

### Batch Updates

```rust
// ❌ DON'T - Multiple DB calls
for player in players {
    ctx.db.player().id().update(player);
}

// ✅ DO - Single pass
// (SpacetimeDB handles this internally)
```

### Minimize Data Transfer

```rust
// ❌ DON'T - Send everything
pub fn sync_state(ctx: &ReducerContext, /* 20 parameters */)

// ✅ DO - Send only what changed
pub fn set_direction(ctx: &ReducerContext, dir_x: f32, dir_z: f32)
```

### Use Indexes

```rust
#[table(accessor = player, public)]
pub struct Player {
    #[primary_key]  // Indexed automatically
    pub id: String,
    
    // Add index for frequent queries
    #[index(btree)]
    pub owner_id: Identity,
}
```

---

## 🔍 Debugging

### Server-Side Logging

```rust
#[reducer]
pub fn debug_test(ctx: &ReducerContext) {
    log::info!("Debug: sender = {:?}", ctx.sender());
    log::info!("Debug: player count = {}", ctx.db.player().count());
}
```

### Client-Side Logging

```javascript
// Log available reducers
console.log("Reducers:", Object.keys(conn.reducers));

// Log available tables
console.log("Tables:", Object.keys(conn.db));

// Log subscription applied
conn.subscriptionBuilder()
    .onApplied(() => {
        console.log("Subscription applied!");
    })
```

### View Database in Dashboard

```
https://spacetimedb.com/cyber-cycles

- View tables
- View logs
- View connected clients
```

---

## 📖 Resources

| Resource | URL |
|----------|-----|
| **Official Docs** | https://spacetimedb.com/docs/ |
| **Rust API Docs** | https://spacetimedb.com/docs/rust/ |
| **TypeScript API** | https://spacetimedb.com/docs/typescript/ |
| **Dashboard** | https://spacetimedb.com/cyber-cycles |
| **GitHub** | https://github.com/clockworklabs/spacetimedb |

---

**Next:** Read `04_GAME_MECHANICS.md` for gameplay implementation details.
```

---
