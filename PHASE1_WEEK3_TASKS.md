# 📋 Phase 1 Week 3 Tasks - Architecture Refactor & Integration

**Week:** 3 of 8  
**Dates:** March 11-17, 2026  
**Focus:** Architecture Refactor & Game Loop Integration  
**Status:** In Progress

---

## 🎯 Week 3 Objectives

1. **Integrate physics modules into main.js**
2. **Create EntityManager for entity lifecycle**
3. **Refactor game loop with fixed timestep**
4. **Add comprehensive integration tests**
5. **Performance benchmarking suite**

---

## 📝 Task List

### Task 1: Update main.js Integration (Priority: HIGH)
**Subtasks:**
- [ ] Import all new physics modules
- [ ] Create SpatialHash instance for collision queries
- [ ] Replace old collision detection with CCD
- [ ] Integrate RubberSystem for grinding
- [ ] Use Config system for physics values
- [ ] Maintain backward compatibility with existing features
- [ ] Test no regression in gameplay

**Tests:** 50+ integration tests  
**Files:** `src/main.js`, `tests/integration/main-integration.test.js`

---

### Task 2: Create EntityManager (Priority: HIGH)
**Subtasks:**
- [ ] Create `src/core/EntityManager.js`
- [ ] Implement entity lifecycle (create, update, destroy)
- [ ] Add component-based architecture
- [ ] Entity query system (by type, by state)
- [ ] Event-driven entity updates
- [ ] Tests: 40+ tests

**Files:** `src/core/EntityManager.js`, `tests/core/entity-manager.test.js`

---

### Task 3: Game Loop Refactor (Priority: HIGH)
**Subtasks:**
- [ ] Create `src/core/GameLoop.js`
- [ ] Fixed timestep for physics (1/60s)
- [ ] Variable timestep for rendering
- [ ] Interpolation for smooth rendering
- [ ] Pause/resume functionality
- [ ] Frame timing statistics
- [ ] Tests: 30+ tests

**Files:** `src/core/GameLoop.js`, `tests/core/game-loop.test.js`

---

### Task 4: Player Entity Refactor (Priority: MEDIUM)
**Subtasks:**
- [ ] Create `src/game/PlayerEntity.js`
- [ ] Component-based player (physics, render, network)
- [ ] Integrate VerletIntegration
- [ ] Integrate RubberSystem
- [ ] State machine (alive, dead, boosting)
- [ ] Tests: 35+ tests

**Files:** `src/game/PlayerEntity.js`, `tests/game/player-entity.test.js`

---

### Task 5: Trail Entity Refactor (Priority: MEDIUM)
**Subtasks:**
- [ ] Create `src/game/TrailEntity.js`
- [ ] Trail segment management
- [ ] SpatialHash integration
- [ ] Trail length management
- [ ] Visual update callbacks
- [ ] Tests: 25+ tests

**Files:** `src/game/TrailEntity.js`, `tests/game/trail-entity.test.js`

---

### Task 6: Performance Benchmarking (Priority: MEDIUM)
**Subtasks:**
- [ ] Create `tests/benchmarks/physics.bench.js`
- [ ] Benchmark spatial hash (100, 1000, 10000 entities)
- [ ] Benchmark collision detection
- [ ] Benchmark rubber system
- [ ] Frame time analysis
- [ ] Memory profiling
- [ ] Generate benchmark report

**Files:** `tests/benchmarks/physics.bench.js`, `docs/BENCHMARK_REPORT.md`

---

### Task 7: Integration Tests (Priority: HIGH)
**Subtasks:**
- [ ] End-to-end gameplay tests
- [ ] Multi-player collision scenarios
- [ ] Rubber system integration tests
- [ ] Config preset integration tests
- [ ] Edge case testing
- [ ] Tests: 100+ integration tests

**Files:** `tests/integration/` (multiple files)

---

## 📊 Test Coverage Goals

| Component | Current | Week 3 Target | Stretch Goal |
|-----------|---------|---------------|-------------|
| Integration Tests | 0 | 100 | 150 |
| Entity Tests | 0 | 100 | 125 |
| Game Loop Tests | 0 | 30 | 50 |
| Benchmark Tests | 0 | 20 | 30 |
| **Total New** | **0** | **250** | **355** |
| **Cumulative** | **878** | **1128** | **1233** |

---

## 📁 New File Structure

```
cyber-client/src/
├── core/
│   ├── SpatialHash.js         ✅ Week 1
│   ├── EventSystem.js         ✅ Week 1
│   ├── Config.js              ✅ Week 1
│   ├── EntityManager.js       🆕 Week 3
│   └── GameLoop.js            🆕 Week 3
├── physics/
│   ├── CollisionDetection.js  ✅ Week 1
│   ├── VerletIntegration.js   ✅ Week 1
│   └── RubberSystem.js        ✅ Week 2
├── game/
│   ├── PlayerEntity.js        🆕 Week 3
│   └── TrailEntity.js         🆕 Week 3
└── main.js                    🔄 Week 3 (refactor)

cyber-client/tests/
├── integration/
│   ├── main-integration.test.js    🆕 Week 3
│   ├── physics-integration.test.js 🆕 Week 3
│   └── gameplay-integration.test.js 🆕 Week 3
├── core/
│   ├── entity-manager.test.js      🆕 Week 3
│   └── game-loop.test.js           🆕 Week 3
├── game/
│   ├── player-entity.test.js       🆕 Week 3
│   └── trail-entity.test.js        🆕 Week 3
└── benchmarks/
    └── physics.bench.js            🆕 Week 3
```

---

## 🎯 Success Criteria

- [ ] All 250+ new tests passing
- [ ] No regression in existing 878 tests
- [ ] Frame time < 16ms with 6 players
- [ ] Grinding precision < 0.1 units demonstrated
- [ ] Code committed and pushed
- [ ] Documentation updated

---

## 📝 Delegation Notes

### Subagent Task Templates

**EntityManager Task:**
```
You are creating an EntityManager for Cyber Cycles.

Create: src/core/EntityManager.js
- Entity lifecycle (create, update, destroy)
- Component-based architecture
- Query system (by type, state)
- Event-driven updates
- Tests: 40+ covering all operations
```

**GameLoop Task:**
```
You are creating a game loop with fixed timestep.

Create: src/core/GameLoop.js
- Fixed timestep for physics (1/60s)
- Variable timestep for rendering
- Interpolation for smooth rendering
- Pause/resume functionality
- Frame timing statistics
- Tests: 30+ covering timing scenarios
```

**Integration Task:**
```
You are integrating physics modules into main.js.

Update: src/main.js
- Import SpatialHash, CollisionDetection, RubberSystem
- Replace old collision with CCD
- Add rubber-based collision response
- Use Config system
- Tests: 50+ integration tests
```

---

## 📈 Progress Tracking

### Daily Goals

| Day | Focus | Deliverables |
|-----|-------|--------------|
| **Day 1** | EntityManager + GameLoop | 2 modules, 70 tests |
| **Day 2** | PlayerEntity + TrailEntity | 2 modules, 60 tests |
| **Day 3** | main.js Integration | Refactored main.js, 50 tests |
| **Day 4** | Integration Tests | 100+ integration tests |
| **Day 5** | Benchmarks + Polish | Benchmark report, bug fixes |
| **Day 6** | Testing + QA | All tests passing |
| **Day 7** | Commit + Document | Checkpoint pushed |

---

## 🔧 Technical Notes

### Fixed Timestep Pattern
```javascript
const FIXED_DT = 1/60; // 60 FPS physics
let accumulator = 0;

function gameLoop(timestamp) {
    const frameTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    
    accumulator += frameTime;
    
    while (accumulator >= FIXED_DT) {
        updatePhysics(FIXED_DT);
        accumulator -= FIXED_DT;
    }
    
    const alpha = accumulator / FIXED_DT;
    render(alpha); // Interpolation
}
```

### Entity Component Pattern
```javascript
class PlayerEntity {
    constructor(id, x, z) {
        this.id = id;
        this.components = {
            physics: new PhysicsComponent(x, z),
            rubber: new RubberComponent(id),
            render: new RenderComponent(),
            network: new NetworkComponent()
        };
    }
    
    update(dt) {
        this.components.physics.update(dt);
        this.components.rubber.update(dt);
    }
}
```

---

**Last Updated:** March 11, 2026  
**Status:** In Progress  
**Next Checkpoint:** End of Week 3 (March 17)
