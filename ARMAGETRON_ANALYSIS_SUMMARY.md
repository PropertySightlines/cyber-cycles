# 📊 Armagetron Advanced Analysis Summary

**Analysis Date:** February 25, 2026  
**Reference:** https://github.com/ArmagetronAd/armagetronad  
**Purpose:** Inform Cyber Cycles Phase 1 refactor

---

## 🎯 Key Takeaways

### What Makes Armagetron "Lightning Fast and Accurate"

1. **The Rubber System** - THE competitive feature
   - Allows millimeter-precision wall grinding
   - Exponential decay model with malus recovery
   - Server-authoritative with client prediction
   - Default: 1.0 units client, 3.0 units server

2. **DCEL Collision Detection**
   - Doubly-Connected Edge List for perfect topology
   - Sub-pixel precision (EPS = 0.01)
   - No tunneling possible
   - O(log n) spatial queries

3. **Physics System**
   - Verlet integration for stability
   - Wall slingshot acceleration (inverse distance)
   - 5% speed penalty per turn
   - 0.08-0.1s minimum turn delay

4. **Lag Compensation**
   - Credit pool (500ms total, 100ms per event)
   - Client-side extrapolation
   - Server-side rollback validation
   - 10-minute full regeneration

5. **Configurable Gameplay**
   - 20+ physics parameters
   - Multiple game modes with presets
   - Server-side enforcement
   - Client-side overrides (visual only)

---

## 📁 Analysis Documents Created

| Document | Location | Content |
|----------|----------|---------|
| **Game Design** | `armagetron-reference/ANALYSIS_DOCS.md` | Game modes, controls, config options |
| **Physics** | `armagetron-reference/ANALYSIS_PHYSICS.md` | Collision, rubber, lag compensation |
| **Game Modes** | `armagetron-reference/ANALYSIS_MODES.md` | Mode configurations and presets |
| **Code Structure** | `armagetron-reference/ANALYSIS_STRUCTURE.md` | Architecture and module separation |

---

## 🎮 Game Modes Analyzed

### 1. Standard Duel (`GAME_TYPE 1`)
- Last-man-standing
- Balanced scoring: +10 win, +3 kill, -2 death, -4 suicide
- Win zone expansion forces late-game confrontations

### 2. Freestyle (`GAME_TYPE 0`)
- Survival-focused
- Rounds end only when everyone dies
- No round winner points

### 3. Fortress
- Zone conquest/defense
- Mathematical balance: 0.3 attack vs 0.2 defend vs 0.1 decay
- 1 defender + 1 attacker = stalemate

### 4. Sumo (2v2)
- Shrinking arena
- One zone per team, conquest kills all owners
- High conquest score (60 points)
- Physics: 30 m/s speed, 400m walls, rubber=5

### 5. Death Zone
- Instant-kill zone after inactivity
- 45-second minimum round time
- 30-second death timeout

---

## ⚙️ Competitive Configuration Presets

### Tournament Physics (from `fortress_physics.cfg`)

```cfg
# Speed and Movement
CYCLE_SPEED            25.0      # Base speed (m/s)
CYCLE_ACCEL            20.0      # Wall acceleration
CYCLE_DELAY            0.08      # Minimum turn delay (s)
CYCLE_TURN_SPEED_FACTOR 0.95     # Speed retention after turn

# Rubber System (CRITICAL)
CYCLE_RUBBER           1.5       # Client rubber reservoir
CYCLE_RUBBER_MINDISTANCE 0.001   # Minimum wall distance (m)
CYCLE_RUBBER_SPEED     40.0      # Decay rate
CYCLE_RUBBER_MALUS     0.5       # Malus duration (s)

# Arena
WIN_ZONE_INITIAL_SIZE  0.8       # Starting size (fraction)
WIN_ZONE_EXPANSION     0.5       # Expansion rate (negative = shrinking)

# Anti-Cheat
TIMEBOT_SENSITIVITY    0.95      # Timing assist detection
TOPOLOGY_POLICE        1         # Wall tunneling detection
```

### Control Scheme (from `keys_cursor_single.cfg`)

```cfg
# Primary Controls
TURN_LEFT              Z, Q, LEFT
TURN_RIGHT             X, E, RIGHT
BRAKE                  SPACE, W, DOWN
GLANCE_LEFT            A
GLANCE_RIGHT           D
SWITCH_VIEW            V
```

---

## 🏗️ Architecture Patterns to Adopt

### 1. Layered Architecture (6 layers)

```
Layer 4: tron/       - Game-specific logic
Layer 3: engine/     - Physics, collision, game objects
Layer 2: render/     - OpenGL abstraction
Layer 2: ui/         - Menus, input handling
Layer 1: network/    - Sync, bandwidth control
Layer 0: tools/      - Config, logging, containers
```

**Dependency Rule:** Lower layers cannot depend on higher layers

### 2. Smart Pointers
- `tCONTROLLED_PTR` - Reference counting
- `tJUST_CONTROLLED_PTR` - Weak references

### 3. Abstract Renderer Interface
```cpp
class rRenderer {
    virtual void Render(const eGameObject& obj) = 0;
    // No direct OpenGL calls in game code
};
```

### 4. Network Object Pattern
```cpp
class nNetObject {
    virtual void SyncMessage() = 0;    // Serialize state
    virtual void Act() = 0;            // Server authority
    virtual void ClientAct() = 0;      // Client prediction
};
```

### 5. Configuration System
```cpp
template<typename T>
class tConfItem {
    T value;
    std::string name;
    // Type-safe, auto-registered
};
```

---

## 🔧 Technical Implementation Details

### Rubber System Algorithm

```cpp
// Exponential decay model
float rubberFactor = 1.0 - exp(-beta);
float beta = timestep * rubberSpeed;  // timestep * 40.0

// Automatic slowdown when near walls
if (distanceToWall < minDistance + rubber * rubberFactor) {
    speed = baseSpeed * (1.0 - rubber * effectiveness);
}

// Malus after turns (prevents chain grinding)
float malus = 1.0;
if (timeSinceTurn < malusDuration) {
    malus = malusFactor;  // 0.3 = 70% reduction
}
```

### DCEL Collision Detection

```cpp
// Wall placement with perfect topology
void eGrid::DrawLine(eWall* wall) {
    // 1. Find intersection points
    // 2. Split existing walls at intersections
    // 3. Update doubly-linked edges
    // 4. Maintain consistent winding order
    
    // Result: No gaps, no overlaps, no tunneling
}
```

### Lag Compensation

```cpp
// Client-side credit pool
class LagCompensation {
    float creditPool = 0.5;        // 500ms total
    float creditRate = 0.1;        // 100ms per event
    float regenerateTime = 600;    // 10 min full regen
    
    bool ValidateInput(Input& input) {
        float cost = CalculateCreditCost(input);
        if (cost <= creditPool) {
            creditPool -= cost;
            return true;
        }
        return false;  // Too far ahead, reject
    }
};
```

---

## 📊 Comparison: Current vs Target

| Feature | Cyber Cycles (Current) | Armagetron | Phase 1 Target |
|---------|------------------------|------------|----------------|
| **Physics** |
| Speed | 40 units/s | 20-30 m/s | 25-30 m/s |
| Turn Delay | Instant | 0.08-0.1s | 0.08s |
| Collision Precision | ~1.0 units | 0.001 units | 0.01 units |
| Rubber System | ❌ None | ✅ Full | ✅ Basic |
| Spatial Partitioning | ❌ None | ✅ DCEL | ✅ Quadtree |
| **Networking** |
| Lag Compensation | ❌ None | ✅ Credit pool | ✅ Client prediction |
| Sync Method | Full state | Input + delta | Input + delta |
| Update Rate | 60/sec | 30/sec | 30/sec |
| **Game Modes** |
| Duel | ✅ Yes | ✅ Yes | ✅ Yes |
| Freestyle | ❌ No | ✅ Yes | ✅ Yes |
| Fortress | ❌ No | ✅ Yes | ❌ Phase 2 |
| Sumo | ❌ No | ✅ Yes | ✅ Yes |
| Death Zone | ❌ No | ✅ Yes | ❌ Phase 2 |
| **Configuration** |
| Physics Config | ❌ Hardcoded | ✅ 20+ params | ✅ 10+ params |
| Presets | ❌ None | ✅ Multiple | ✅ 3 presets |
| Key Binding | ❌ Fixed | ✅ Full | ✅ Customizable |

---

## 🎯 Phase 1 Priorities (In Order)

### Week 1-2: Physics Foundation
1. Implement spatial hash/quadtree
2. Add continuous collision detection
3. Create basic rubber system
4. Verlet integration for movement

### Week 3-4: Architecture Refactor
1. Create modular directory structure
2. Extract game logic from main.js
3. Implement event system
4. Configuration system

### Week 5-6: Competitive Features
1. Input buffering
2. Game mode system
3. Freestyle and Sumo modes
4. Config presets and UI

### Week 7-8: Network Improvements
1. Client-side prediction
2. Lag compensation (credit pool)
3. Input sync (vs state sync)
4. Delta compression

---

## 📚 Reference Files

### Must-Read Armagetron Source Files

| File | Purpose | Lines |
|------|---------|-------|
| `src/engine/eGrid.cpp` | DCEL collision | ~2000 |
| `src/engine/ePlayer.cpp` | Rubber system | ~800 |
| `src/engine/eWall.cpp` | Wall physics | ~600 |
| `src/engine/eLagCompensation.cpp` | Lag handling | ~400 |
| `config/settings.cfg` | Main config | ~500 |
| `config/examples/*.cfg` | Mode presets | ~200 each |

### Our Implementation Files (To Create)

| File | Purpose | Priority |
|------|---------|----------|
| `src/physics/SpatialHash.js` | O(log n) queries | Week 1 |
| `src/physics/CollisionDetection.js` | CCD + rubber | Week 1-2 |
| `src/physics/RubberSystem.js` | Rubber logic | Week 2 |
| `src/core/EntityManager.js` | Entity management | Week 3 |
| `src/core/EventSystem.js` | Event bus | Week 3 |
| `src/network/LagCompensation.js` | Prediction | Week 7 |
| `src/game/GameModes.js` | Mode system | Week 5 |

---

## ✅ Actionable Insights

### 1. Rubber System is THE Priority
- Single most important competitive feature
- Enables millimeter-precision grinding
- Must be server-authoritative
- Client prediction for responsiveness

### 2. Spatial Partitioning Critical for Performance
- Current O(n²) collision won't scale
- Quadtree simpler than DCEL, sufficient for our needs
- Target: O(log n) per player

### 3. Input Sync > State Sync
- Current: Sync full player state every frame
- Target: Sync only inputs, simulate locally
- Reduces bandwidth, enables prediction

### 4. Configuration System Enables Competitive Scene
- Server operators need fine control
- Presets for different play styles
- Client-side visual overrides only

### 5. Modular Architecture Enables Growth
- Current monolithic main.js limits features
- Separation: physics/game/render/network
- Clean interfaces between modules

---

## 🚀 Next Steps

1. **Review Phase 1 Plan** - `PHASE1_PLAN.md`
2. **Prioritize Week 1-2 Tasks** - Physics foundation
3. **Create Subagent Tasks** - Delegate implementation
4. **Set Up Project Board** - Track progress
5. **Begin Refactor** - Start with spatial hash

---

**Analysis Complete:** All 4 analysis documents created  
**Phase 1 Plan:** Detailed 8-week roadmap  
**Ready to Begin:** Week 1 tasks defined
