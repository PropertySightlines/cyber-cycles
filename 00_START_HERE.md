## 📁 File 1: `00_START_HERE.md` (Bootstrap - Read First)

```markdown
# 🏁 Cyber Cycles - Project Bootstrap Guide

**READ THIS FIRST** - This is your entry point to understanding the entire project.

---

## 🎮 What Is This?

Cyber Cycles is a **multiplayer Tron-style light bike game** built with:
- **SpacetimeDB v2** - Rust backend for real-time multiplayer sync
- **Three.js** - WebGL rendering with glowing trails and effects
- **Vite** - Frontend build tool
- **GCP VM** - Deployed on Google Cloud Platform

**Play URL:** http://146.148.58.219:5173

---

## 📂 Critical File Locations

| File | Path | Purpose |
|------|------|---------|
| **Frontend Entry** | `/home/property.sightlines/spacetime/cyber-client/index.html` | HTML entry point (NOT in src/) |
| **Main Game Logic** | `/home/property.sightlines/spacetime/cyber-client/src/main.js` | Three.js + SpacetimeDB client |
| **Rust Backend** | `/home/property.sightlines/spacetime/cyber-cycles-db/spacetimedb/src/lib.rs` | SpacetimeDB module |
| **Generated Types** | `/home/property.sightlines/spacetime/cyber-client/src/module/` | Auto-generated from SpacetimeDB |
| **Package Config** | `/home/property.sightlines/spacetime/cyber-client/package.json` | Node dependencies |

---

## ⚠️ CRITICAL DISCOVERIES (SpacetimeDB v2 Bugs)

### Bug #1: Vec<T> Serialization Broken

**Problem:** SpacetimeDB v2 TypeScript SDK crashes when passing `Vec<T>` to reducers:
```
TypeError: Cannot read properties of undefined (reading 'length')
```

**Workaround:** Use JSON strings instead of arrays:
```rust
// Rust - DON'T use this:
pub turn_points: Vec<Vec2>,  // ❌ Crashes SDK

// Use this instead:
pub turn_points_json: String,  // ✅ Works
```

```javascript
// JavaScript - Serialize before sending:
const turnPointsJson = JSON.stringify(p.turnPoints);
conn.reducers.syncState(..., turnPointsJson);

// Deserialize on receive:
p.turnPoints = JSON.parse(p.turn_points_json || "[]");
```

### Bug #2: Field Name Conversion

**Problem:** SpacetimeDB converts snake_case → camelCase in TypeScript SDK:

| Rust Field | TypeScript Field |
|------------|------------------|
| `turn_points_json` | `turnPointsJson` |
| `is_ai` | `isAi` |
| `owner_id` | `ownerId` |
| `dir_x` | `dirX` |
| `round_active` | `roundActive` |

**Solution:** Always check both conventions in client code:
```javascript
const turnPointsJson = p.turn_points_json || p.turnPointsJson;
const isAi = p.is_ai !== undefined ? p.is_ai : p.isAi;
```

### Bug #3: Reducer Name Conversion

**Problem:** Reducers are also converted to camelCase:

| Rust Reducer | TypeScript Function |
|--------------|---------------------|
| `sync_state` | `syncState` |
| `update_config` | `updateConfig` |
| `tick_countdown` | `tickCountdown` |

---

## 🚀 Quick Start Commands

```bash
# 1. Navigate to Rust module
cd /home/property.sightlines/spacetime/cyber-cycles-db/spacetimedb

# 2. Publish backend changes
cargo clean
spacetime publish cyber-cycles --delete-data

# 3. Generate TypeScript types
spacetime generate --lang typescript --out-dir /home/property.sightlines/spacetime/cyber-client/src/module

# 4. Start frontend dev server
cd /home/property.sightlines/spacetime/cyber-client
npm run dev

# 5. Access on GCP VM
# Open: http://146.148.58.219:5173
```

---

## 🎯 Game Features (Current State)

| Feature | Status | Notes |
|---------|--------|-------|
| **Smooth Steering** | ✅ Working | Hold ←/→ to turn gradually |
| **6 Players** | ✅ Working | Circular spawn formation |
| **Trail Walls** | ✅ Working | 2-unit tall glowing walls |
| **Trail Collision** | ✅ Working | Hit any trail = eliminated |
| **Bike Collision** | ✅ Working | Hit another bike = both die |
| **Slipstream Boost** | ✅ Working | Follow close behind for speed |
| **AI Opponents** | ✅ Working | Smooth turning AI |
| **Countdown System** | ✅ Working | 3-2-1 GO! |
| **Respawn** | ✅ Working | All players reset together |
| **Win Detection** | ✅ Working | Last bike standing wins |

---

## 📖 Documentation Index

Read these files in order:

1. **`00_START_HERE.md`** ← You are here
2. **`01_ARCHITECTURE.md`** - System design and data flow
3. **02_BUILD_DEPLOY.md`** - Complete build instructions
4. **`03_SPACETIMEDB_GUIDE.md`** - SpacetimeDB v2 specifics
5. **`04_GAME_MECHANICS.md`** - Gameplay implementation details
6. **`05_KNOWN_ISSUES.md`** - Bugs and workarounds
7. **`06_FUTURE_FEATURES.md`** - Planned improvements

---

## 🔧 Development Environment

| Component | Version/Info |
|-----------|--------------|
| **OS** | Linux (GCP VM) |
| **Node** | Check with `node --version` |
| **Rust** | Check with `rustc --version` |
| **SpacetimeDB CLI** | v2.0.1 |
| **Three.js** | Via CDN in main.js |
| **Vite** | v7.3.1 |

---

## 🎨 Visual Style

- **Neon/Cyberpunk aesthetic**
- **Glowing bike sprites** (circular, not square)
- **Trail walls** (2 units tall, semi-transparent)
- **Dark arena** with fog
- **Grid floor** with cyan accent
- **Red boundary ring** at arena edge

---

## 🎮 Controls

| Key | Action |
|-----|--------|
| **← / A** | Hold to turn left (smooth) |
| **→ / D** | Hold to turn right (smooth) |
| **↓ / S** | Brake (slow down) |

---

## 📞 Key Contacts

| Role | Identity |
|------|----------|
| **Admin User** | `c2007484dedccf3d247b44dc4ebafeee388121889dffea0ceedfd63b888106c1` |
| **Database** | `cyber-cycles` on `maincloud.spacetimedb.com` |

---

## ✅ Checklist for New Agents

- [ ] Read all documentation files
- [ ] Understand SpacetimeDB v2 bugs and workarounds
- [ ] Know correct file paths (especially index.html)
- [ ] Can build and deploy from scratch
- [ ] Understand snake_case ↔ camelCase conversion
- [ ] Know how to test multiplayer (open 2 browser windows)

---

**Next:** Read `01_ARCHITECTURE.md` for system design details.
```

---
