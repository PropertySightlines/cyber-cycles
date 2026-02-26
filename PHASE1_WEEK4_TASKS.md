# 📋 Phase 1 Week 4 Tasks - Performance Testing & Human-Ready Build

**Week:** 4 of 8  
**Dates:** March 18-24, 2026  
**Focus:** Performance Testing, Polish, Human-Ready Build  
**Status:** In Progress

---

## 🎯 Week 4 Objectives

1. **Create comprehensive benchmarking suite**
2. **Implement input buffering system**
3. **Memory profiling and leak detection**
4. **Edge case testing and stress tests**
5. **Human testing preparation** (single player, spectating AI)
6. **Bug fixes and polish**

---

## 📝 Task List

### Task 1: Benchmarking Suite (Priority: HIGH)
**Subtasks:**
- [ ] Create `tests/benchmarks/benchmark-runner.js`
- [ ] Physics benchmark (SpatialHash, Collision, Rubber)
- [ ] Rendering benchmark (TrailEntity, PlayerEntity)
- [ ] Memory benchmark (allocation, GC pressure)
- [ ] Frame time benchmark (histogram, percentiles)
- [ ] Generate benchmark report (Markdown)
- [ ] Tests: 30+ benchmark tests

**Files:** `tests/benchmarks/`, `docs/BENCHMARK_REPORT.md`  
**Tests:** 30+ benchmarks

---

### Task 2: Input Buffering System (Priority: HIGH)
**Subtasks:**
- [ ] Create `src/network/InputBuffer.js`
- [ ] Input timestamp tracking
- [ ] Buffer management (add, get, clear)
- [ ] Sequence number tracking
- [ ] Input reconciliation
- [ ] Integration with PlayerEntity.NetworkComponent
- [ ] Tests: 40+ tests

**Files:** `src/network/InputBuffer.js`, `tests/network/input-buffer.test.js`  
**Tests:** 40+ tests

---

### Task 3: Memory Profiling (Priority: MEDIUM)
**Subtasks:**
- [ ] Create `tests/profiling/memory-profile.js`
- [ ] Track entity creation/destruction
- [ ] Monitor SpatialHash memory
- [ ] Trail memory profiling
- [ ] GC pressure measurement
- [ ] Identify memory leaks
- [ ] Tests: 20+ profiling tests

**Files:** `tests/profiling/memory-profile.js`, `docs/MEMORY_PROFILE.md`  
**Tests:** 20+ tests

---

### Task 4: Edge Case Testing (Priority: HIGH)
**Subtasks:**
- [ ] High player count testing (12+ players)
- [ ] Long trail testing (1000+ segments)
- [ ] Rapid input testing (spam inputs)
- [ ] Boundary collision testing
- [ ] Simultaneous collision testing
- [ ] Network lag simulation
- [ ] Tests: 50+ edge case tests

**Files:** `tests/edge-cases/` (multiple files)  
**Tests:** 50+ tests

---

### Task 5: Stress Testing (Priority: MEDIUM)
**Subtasks:**
- [ ] Create `tests/stress/stress-runner.js`
- [ ] 1000 entity stress test
- [ ] 10000 segment stress test
- [ ] Continuous operation test (1 hour)
- [ ] Memory growth monitoring
- [ ] Performance degradation tracking
- [ ] Tests: 15+ stress tests

**Files:** `tests/stress/`, `docs/STRESS_TEST_REPORT.md`  
**Tests:** 15+ tests

---

### Task 6: Human Testing Prep (Priority: CRITICAL)
**Subtasks:**
- [ ] Add AI spectating mode toggle
- [ ] Single player vs AI mode
- [ ] Simple in-game chat (local only for now)
- [ ] Testing UI overlay (FPS, entities, memory)
- [ ] Debug commands (pause, step, inspect)
- [ ] Build script for VM deployment
- [ ] Testing checklist document

**Files:** `src/ui/TestOverlay.js`, `docs/HUMAN_TESTING_PLAN.md`  
**Tests:** 25+ UI tests

---

### Task 7: Bug Fixes & Polish (Priority: HIGH)
**Subtasks:**
- [ ] Fix any issues from Week 1-3
- [ ] Optimize hot paths
- [ ] Improve error messages
- [ ] Add debug visualization
- [ ] Performance optimizations
- [ ] Code cleanup
- [ ] Tests: Regression tests for all fixes

**Files:** Various  
**Tests:** As needed

---

## 📊 Test Coverage Goals

| Component | Current | Week 4 Target | Stretch Goal |
|-----------|---------|---------------|-------------|
| Benchmarks | 0 | 30 | 50 |
| Input Buffer | 0 | 40 | 60 |
| Memory Profile | 0 | 20 | 30 |
| Edge Cases | 0 | 50 | 75 |
| Stress Tests | 0 | 15 | 25 |
| UI/Testing | 0 | 25 | 40 |
| **Total New** | **0** | **180** | **280** |
| **Cumulative** | **1345** | **1525** | **1625** |

---

## 📁 New File Structure

```
cyber-client/src/
├── network/
│   └── InputBuffer.js       🆕 Week 4
├── ui/
│   └── TestOverlay.js       🆕 Week 4 (debug UI)
cyber-client/tests/
├── benchmarks/
│   ├── benchmark-runner.js  🆕 Week 4
│   ├── physics.bench.js     🆕 Week 4
│   └── rendering.bench.js   🆕 Week 4
├── profiling/
│   └── memory-profile.js    🆕 Week 4
├── edge-cases/
│   ├── collision.test.js    🆕 Week 4
│   ├── input.test.js        🆕 Week 4
│   └── boundary.test.js     🆕 Week 4
├── stress/
│   └── stress-runner.js     🆕 Week 4
└── network/
    └── input-buffer.test.js 🆕 Week 4
```

---

## 🎯 Success Criteria

- [ ] All 180+ new tests passing
- [ ] No regression in existing 1345 tests
- [ ] Benchmark report generated
- [ ] Memory profile documented
- [ ] Stress test results documented
- [ ] Input buffering functional
- [ ] AI spectating mode working
- [ ] Single player mode working
- [ ] Test overlay showing FPS/stats
- [ ] Build script for VM deployment
- [ ] Human testing plan documented
- [ ] Code committed and pushed

---

## 📝 Delegation Notes

### Subagent Task Templates

**Benchmarking Task:**
```
You are creating a benchmarking suite for Cyber Cycles.

Create: tests/benchmarks/benchmark-runner.js
- Benchmark framework
- Physics benchmarks (SpatialHash, Collision, Rubber)
- Rendering benchmarks
- Memory benchmarks
- Report generation (Markdown)
- Tests: 30+ benchmarks
```

**Input Buffer Task:**
```
You are implementing input buffering for client-side prediction.

Create: src/network/InputBuffer.js
- Input timestamp tracking
- Buffer management (add, get, clear)
- Sequence numbers
- Input reconciliation
- Integration with PlayerEntity
- Tests: 40+ tests
```

**Human Testing Prep Task:**
```
You are preparing the game for human testing.

Create: src/ui/TestOverlay.js
- FPS counter
- Entity count
- Memory usage
- Physics stats
- Debug commands

Add to main.js:
- AI spectating toggle
- Single player mode
- Simple chat (local)
- Debug overlay

Tests: 25+ UI tests
```

---

## 📈 Progress Tracking

### Daily Goals

| Day | Focus | Deliverables |
|-----|-------|--------------|
| **Day 1** | Benchmarking Suite | Framework + physics benchmarks |
| **Day 2** | Input Buffer + Memory | InputBuffer + memory profiling |
| **Day 3** | Edge Cases | Collision, input, boundary tests |
| **Day 4** | Human Testing Prep | Test overlay, AI spectating |
| **Day 5** | Stress Testing | Stress runner + tests |
| **Day 6** | Bug Fixes + Polish | Fix issues, optimize |
| **Day 7** | Document + Commit | Reports, checkpoint push |

---

## 🔧 Technical Notes

### AI Spectating Mode
```javascript
// In main.js
const GAME_MODES = {
    SINGLE_PLAYER: 'single_player',  // Human vs 5 AI
    SPECTATE: 'spectate'             // All AI, camera control
};

function setGameMode(mode) {
    currentMode = mode;
    if (mode === 'spectate') {
        enableSpectatorCamera();
    }
}
```

### Simple Chat
```javascript
// Local-only chat for testing
const chatMessages = [];
function addChatMessage(playerId, message) {
    chatMessages.push({ playerId, message, timestamp: Date.now() });
    // Display in UI
}
```

### Test Overlay
```javascript
// Debug UI overlay
class TestOverlay {
    showFPS() {}
    showEntityCount() {}
    showMemoryUsage() {}
    showPhysicsStats() {}
    toggleDebug() {}
}
```

---

## 🎮 Human Testing Plan Preview

### Single Player Testing
- 1 human vs 5 AI opponents
- Test grinding mechanics
- Test collision detection
- Test rubber system feel
- Test frame rate stability

### Spectating Mode
- Watch 6 AI bikes
- Free camera control
- Test AI behavior
- Test performance with no human input

### Testing Checklist
- [ ] Controls responsive
- [ ] Grinding feels accurate
- [ ] Collisions detected correctly
- [ ] Frame rate stable (60 FPS)
- [ ] No visual glitches
- [ ] AI behavior reasonable
- [ ] UI displays correctly

---

## 📊 Expected Deliverables

### Reports
- `docs/BENCHMARK_REPORT.md` - Performance baselines
- `docs/MEMORY_PROFILE.md` - Memory usage analysis
- `docs/STRESS_TEST_REPORT.md` - Stress test results
- `docs/HUMAN_TESTING_PLAN.md` - Testing instructions

### Code
- Input buffering system
- Benchmark framework
- Memory profiling tools
- Test overlay UI
- AI spectating mode
- Single player mode

### Metrics
- Frame time histogram
- Memory usage baseline
- GC pressure metrics
- Entity creation/destruction rates
- Collision detection performance

---

**Last Updated:** March 18, 2026  
**Status:** In Progress  
**Next Checkpoint:** End of Week 4 (March 24)
