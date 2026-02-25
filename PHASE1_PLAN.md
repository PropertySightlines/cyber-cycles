# 🚀 Phase 1 Development Plan - Cyber Cycles Refactor

**Based on:** Armagetron Advanced analysis  
**Date:** February 25, 2026  
**Goal:** Competitive-grade light bike gameplay with modern tech stack

---

## 📋 Executive Summary

After thorough analysis of [Armagetron Advanced](https://github.com/ArmagetronAd/armagetronad), we've identified key systems and patterns to implement for competitive-grade gameplay:

### Key Insights from Armagetron

1. **The Rubber System** - Enables millimeter-precision grinding (THE competitive feature)
2. **DCEL Collision** - Perfect topological consistency, no tunneling
3. **Lag Compensation** - Fair play across ping ranges
4. **Configurable Physics** - Server presets for different play styles
5. **Modular Architecture** - Clean separation of engine/game/render/network

---

## 🎯 Phase 1 Objectives

### Priority 1: Core Physics Refactor (Weeks 1-2)

**Goal:** Implement accurate collision detection and physics system

#### 1.1 Rubber System Implementation
- [ ] Create rubber buffer per player
- [ ] Implement exponential decay model
- [ ] Add malus system (post-turn recovery delay)
- [ ] Server-authoritative rubber calculation
- [ ] Client-side rubber prediction

**Configuration:**
```javascript
const RUBBER_CONFIG = {
    baseRubber: 1.0,           // Client rubber reservoir
    serverRubber: 3.0,         // Server rubber for validation
    rubberSpeed: 40.0,         // Decay rate (units/second)
    minDistance: 0.001,        // Minimum wall distance (meters)
    malusDuration: 0.5,        // Seconds after turn before rubber recovers
    malusFactor: 0.3,          // Effectiveness during malus
};
```

#### 1.2 Improved Collision Detection
- [ ] Implement continuous collision detection (CCD)
- [ ] Add sub-pixel precision (EPS = 0.01)
- [ ] Create spatial partitioning for O(log n) queries
- [ ] Implement wall segment intersection testing
- [ ] Add topology validation (anti-tunneling)

**Current Issue:** Our point-to-segment distance is O(n) per player  
**Target:** O(log n) with quadtree/BVH

#### 1.3 Physics Overhaul
- [ ] Verlet integration for stable movement
- [ ] Wall slingshot acceleration (inverse distance)
- [ ] Turn speed penalty (5% per turn)
- [ ] Minimum turn delay (0.1s between turns)
- [ ] Configurable acceleration curve

---

### Priority 2: Architecture Refactor (Weeks 3-4)

**Goal:** Separate concerns into modular systems

#### 2.1 Proposed Directory Structure

```
cyber-client/
├── src/
│   ├── main.js                    # Entry point
│   ├── core/                      # Core engine
│   │   ├── Game.js                # Main game loop
│   │   ├── EntityManager.js       # Entity management
│   │   ├── EventSystem.js         # Event bus
│   │   └── Config.js              # Configuration system
│   ├── physics/                   # Physics system
│   │   ├── PhysicsEngine.js       # Main physics loop
│   │   ├── CollisionDetection.js  # CCD and rubber
│   │   ├── SpatialHash.js         # Spatial partitioning
│   │   └── Movement.js            # Verlet integration
│   ├── game/                      # Game logic
│   │   ├── Player.js              # Player entity
│   │   ├── Trail.js               # Trail/wall entity
│   │   ├── Arena.js               # Arena bounds
│   │   └── GameModes.js           # Game mode logic
│   ├── render/                    # Rendering
│   │   ├── Renderer.js            # Three.js wrapper
│   │   ├── Camera.js              # Camera system
│   │   ├── Effects.js             # Post-processing
│   │   └── UI.js                  # HUD rendering
│   ├── network/                   # Networking
│   │   ├── SpacetimeSync.js       # SpacetimeDB sync
│   │   ├── LagCompensation.js     # Client prediction
│   │   └── InputBuffer.js         # Input buffering
│   ├── ai/                        # AI system
│   │   ├── AIBrain.js             # AI decision making
│   │   └── Pathfinding.js         # AI navigation
│   └── utils/                     # Utilities
│       ├── Vector2.js             # Vector math
│       └── MathUtils.js           # Helper functions
├── tests/
│   ├── physics/                   # Physics tests
│   ├── game/                      # Game logic tests
│   └── network/                   # Network tests
└── config/                        # Config presets
    ├── competitive.cfg
    ├── casual.cfg
    └── practice.cfg
```

#### 2.2 Backend Structure (Rust)

```
cyber-cycles-db/spacetimedb/src/
├── lib.rs                         # Module entry
├── tables/                        # Table definitions
│   ├── player.rs
│   ├── trail.rs
│   ├── game_state.rs
│   └── config.rs
├── reducers/                      # Reducer logic
│   ├── join.rs
│   ├── sync_state.rs
│   ├── respawn.rs
│   └── admin.rs
├── physics/                       # Server physics
│   ├── collision.rs
│   ├── rubber.rs
│   └── movement.rs
├── game_modes/                    # Game mode logic
│   ├── duel.rs
│   ├── fortress.rs
│   └── sumo.rs
└── utils/                         # Utilities
    ├── vector.rs
    └── config.rs
```

---

### Priority 3: Competitive Features (Weeks 5-6)

**Goal:** Implement features for competitive play

#### 3.1 Game Modes

Based on Armagetron analysis:

| Mode | Description | Priority |
|------|-------------|----------|
| **Duel** | Last bike standing (current) | ✅ Existing |
| **Freestyle** | Rounds end when all die | High |
| **Fortress** | Zone conquest/defense | Medium |
| **Sumo** | Shrinking arena, team combat | Medium |
| **Death Zone** | Instant-kill zone after timeout | Low |

#### 3.2 Configuration System

**Server Presets:**
```javascript
// config/competitive.cfg
{
    "CYCLE_SPEED": 25.0,           // Faster base speed
    "CYCLE_ACCEL": 20.0,           // Higher acceleration
    "CYCLE_DELAY": 0.08,           // Tighter turns
    "CYCLE_RUBBER": 1.5,           // More rubber for grinding
    "CYCLE_TURN_PENALTY": 0.05,    // 5% speed loss per turn
    "WIN_ZONE_EXPANSION": 0.5,     // Shrinking arena
    "TIMEBOT_SENSITIVITY": 0.95,   // Anti-cheat
}
```

**Client Config UI:**
- [ ] Settings menu with sliders
- [ ] Preset selection (Competitive/Casual/Practice)
- [ ] Key binding customization
- [ ] Sensitivity settings

#### 3.3 Input System Overhaul

**Current:** Simple key state flags  
**Target:** Input buffering with timing

```javascript
class InputBuffer {
    constructor() {
        this.buffer = [];
        this.maxBufferTime = 0.2;  // 200ms buffer
    }
    
    addInput(timestamp, type, value) {
        this.buffer.push({ timestamp, type, value });
        this.pruneOldInputs();
    }
    
    // Send buffered inputs to server
    flushInputs() {
        // Batch send for efficiency
    }
}
```

---

### Priority 4: Network Improvements (Weeks 7-8)

**Goal:** Fair play across all ping ranges

#### 4.1 Lag Compensation

**Current:** No compensation  
**Target:** Client-side prediction with rollback

```javascript
class LagCompensation {
    constructor() {
        this.creditPool = 0.5;     // 500ms credit
        self.creditRate = 0.1;     // 100ms per event
        self.regenerateTime = 600; // 10 min full regen
    }
    
    // Client-side extrapolation
    extrapolatePlayerState(player, dt) {
        // Predict movement between server updates
    }
    
    // Server-side validation
    validateInput(input, playerState) {
        // Check against credit pool
    }
}
```

#### 4.2 State Synchronization

**Current:** Full state sync every frame  
**Target:** Delta compression + input sync

```rust
// Instead of syncing full state
pub fn sync_state(ctx: &ReducerContext, /* 12 parameters */)

// Sync only inputs
pub fn submit_input(ctx: &ReducerContext, 
    timestamp: u64,
    turn_left: bool,
    turn_right: bool,
    brake: bool
)
```

---

## 📊 Technical Debt to Address

### Current Issues

| Issue | Severity | Fix Timeline |
|-------|----------|--------------|
| O(n²) collision checks | High | Week 2 |
| No lag compensation | High | Week 7 |
| Monolithic main.js | Medium | Week 3-4 |
| No input buffering | Medium | Week 6 |
| Fixed physics values | Low | Week 5 |

### SpacetimeDB v2 Workarounds

| Workaround | Status | Future Fix |
|------------|--------|------------|
| JSON strings for Vec<T> | Active | Wait for SDK fix |
| snake_case ↔ camelCase | Documented | Permanent |
| Reducer name conversion | Documented | Permanent |

---

## 🎮 Feature Comparison

| Feature | Current | Armagetron | Target (Phase 1) |
|---------|---------|------------|------------------|
| **Speed** | 40 units/s | 20-30 m/s | 25-30 m/s ✅ |
| **Turn Delay** | Instant | 0.08-0.1s | 0.08s ✅ |
| **Collision Precision** | ~1.0 units | 0.001 units | 0.01 units ✅ |
| **Rubber System** | None | Full implementation | Basic implementation ✅ |
| **Lag Compensation** | None | Credit pool + rollback | Client prediction ✅ |
| **Spatial Partitioning** | None | DCEL | Quadtree ✅ |
| **Game Modes** | 1 (Duel) | 6+ | 3 (Duel, Freestyle, Sumo) ✅ |
| **Config Presets** | None | Full config system | 3 presets ✅ |

---

## 📝 Implementation Checklist

### Week 1-2: Physics Foundation
- [ ] Create `physics/` directory structure
- [ ] Implement `SpatialHash.js` for O(log n) queries
- [ ] Create `CollisionDetection.js` with CCD
- [ ] Implement basic rubber system
- [ ] Add Verlet integration
- [ ] Write physics tests (target: 50+ tests)
- [ ] Benchmark: < 1ms per frame for 6 players

### Week 3-4: Architecture Refactor
- [ ] Create new directory structure
- [ ] Extract game logic from `main.js`
- [ ] Create `EntityManager.js`
- [ ] Implement event system
- [ ] Create configuration system
- [ ] Update tests for new structure
- [ ] Verify no regression in functionality

### Week 5-6: Competitive Features
- [ ] Implement game mode system
- [ ] Add Freestyle mode
- [ ] Add Sumo mode (shrinking arena)
- [ ] Create config presets
- [ ] Implement input buffering
- [ ] Add key binding UI
- [ ] Create settings menu

### Week 7-8: Network Improvements
- [ ] Implement client-side prediction
- [ ] Add lag compensation (credit pool)
- [ ] Switch to input sync (vs state sync)
- [ ] Add delta compression
- [ ] Implement rollback for late inputs
- [ ] Test with simulated lag (50-200ms)
- [ ] Verify fair play across ping ranges

---

## 🧪 Testing Strategy

### Unit Tests (Current: 129 → Target: 300+)

**Physics Tests:**
```javascript
describe('RubberSystem', () => {
    test('rubber decays exponentially', () => {});
    test('malus reduces effectiveness after turn', () => {});
    test('rubber prevents collision within minDistance', () => {});
});

describe('CollisionDetection', () => {
    test('CCD catches fast-moving objects', () => {});
    test('spatial hash returns nearby segments', () => {});
    test('topology validation prevents tunneling', () => {});
});
```

### Integration Tests

**Network Tests:**
- Simulate 50/100/200ms latency
- Verify rubber system works with lag
- Test input buffering under packet loss

**Performance Tests:**
- 6 players, 1000 trail segments each
- Frame time < 16ms (60 FPS)
- Memory usage < 200MB

---

## 📈 Success Metrics

### Performance Targets

| Metric | Current | Target |
|--------|---------|--------|
| Frame Time (6 players) | ~20ms | < 16ms |
| Collision Check Time | O(n²) | O(log n) |
| Input Latency | ~100ms | < 50ms |
| Network Updates | 60/sec | 30/sec (delta) |

### Gameplay Targets

| Metric | Target |
|--------|--------|
| Grinding Precision | < 0.1 units |
| Turn Response Time | < 0.1s |
| Lag Compensation | Up to 200ms ping |
| Configurable Settings | 20+ options |

---

## 🔧 Tools & Libraries

### New Dependencies

```json
{
  "dependencies": {
    "spacetimedb": "^2.0.1",
    "three": "^0.183.1",
    "mitt": "^3.0.1",        // Event emitter
    "quadtree-lib": "^1.0.0" // Spatial partitioning
  },
  "devDependencies": {
    "vitest": "^3.0.0",
    "@testing-library/dom": "^10.4.0"
  }
}
```

### Rust Dependencies

```toml
[dependencies]
spacetimedb = "2.0.1"
log = "0.4"

[dependencies.quadtree]
version = "1.0"
```

---

## 📚 Documentation Updates

### New Documentation Files

- `PHASE1_PHYSICS.md` - Rubber system and collision detection
- `PHASE1_ARCHITECTURE.md` - New module structure
- `PHASE1_CONFIG.md` - Configuration reference
- `PHASE1_NETWORKING.md` - Lag compensation guide
- `COMPETITIVE_SETUP.md` - Server setup for competitive play

### Updated Documentation

- `01_ARCHITECTURE.md` - Update with new structure
- `02_BUILD_DEPLOY.md` - Add config deployment
- `04_GAME_MECHANICS.md` - Add rubber/physics details

---

## 🎯 Phase 1 Deliverables

1. ✅ Refactored codebase with modular architecture
2. ✅ Rubber system for precision grinding
3. ✅ Continuous collision detection (CCD)
4. ✅ Spatial partitioning (quadtree)
5. ✅ Input buffering system
6. ✅ Lag compensation (client prediction)
7. ✅ 3 game modes (Duel, Freestyle, Sumo)
8. ✅ Configuration system with presets
9. ✅ 300+ tests (physics, network, game logic)
10. ✅ Complete documentation

---

## 🚦 Go/No-Go Criteria for Phase 2

**Proceed to Phase 2 if:**
- [ ] All physics tests pass
- [ ] Frame time < 16ms with 6 players
- [ ] Grinding precision < 0.1 units demonstrated
- [ ] Lag compensation works up to 200ms
- [ ] No regression in existing features
- [ ] Documentation complete

**Phase 2 Preview:** Visual polish, audio, mobile support, advanced game modes

---

## 📞 Resources

### Armagetron Reference Implementation
- Collision: `src/engine/eGrid.cpp`
- Rubber: `src/engine/ePlayer.cpp`
- Physics: `src/engine/eWall.cpp`
- Config: `config/settings.cfg`

### SpacetimeDB Documentation
- TypeScript SDK: https://spacetimedb.com/docs/typescript/
- Rust API: https://spacetimedb.com/docs/rust/
- AI Rules: https://spacetimedb.com/ai-rules/spacetimedb-typescript.mdc

### Analysis Documents
- `armagetron-reference/ANALYSIS_DOCS.md` - Game design
- `armagetron-reference/ANALYSIS_PHYSICS.md` - Technical analysis
- `armagetron-reference/ANALYSIS_MODES.md` - Game modes
- `armagetron-reference/ANALYSIS_STRUCTURE.md` - Code structure

---

**Phase 1 Start Date:** February 25, 2026  
**Estimated Duration:** 8 weeks  
**Next Review:** Weekly progress checks via subagent delegation
