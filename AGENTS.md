# 🤖 Cyber Cycles - Subagent Delegation Guide

This document explains how to use subagents effectively for delegated work on the Cyber Cycles project.

---

## 📋 Overview

Subagents are specialized AI assistants that can be delegated specific tasks. Using subagents helps:
- Keep the main context window free
- Parallelize independent work
- Focus on specific domains (testing, deployment, feature implementation)

---

## 🎯 When to Delegate to Subagents

Delegate tasks when:
1. **Independent work** - Task doesn't need constant back-and-forth
2. **Specialized domain** - Testing, deployment, documentation, etc.
3. **Large file operations** - Creating multiple test files
4. **Verification tasks** - Running builds, checking errors
5. **Research tasks** - Looking up documentation, finding patterns

Keep in main conversation when:
1. **Strategic decisions** - Architecture changes, major refactors
2. **User interaction** - Clarifying requirements, showing progress
3. **Cross-cutting concerns** - Changes affecting multiple systems

---

## 📝 Task Delegation Templates

### Testing Tasks

```
You are setting up tests for [COMPONENT] in the Cyber Cycles game.

Your tasks:
1. [Specific task 1]
2. [Specific task 2]
3. [Specific task 3]

The [COMPONENT] uses:
- [Technology 1]
- [Technology 2]

Focus on:
- [Priority 1]
- [Priority 2]

Return a summary of what you created.
```

### Feature Implementation

```
You are implementing [FEATURE] for the Cyber Cycles game.

Your tasks:
1. Read existing code in [PATH]
2. Create/modify files: [LIST FILES]
3. Add tests for the new feature
4. Verify no compile errors

Context:
- [Relevant context from docs]
- [Dependencies on other features]

Return a summary of changes made.
```

### Deployment Tasks

```
You are handling deployment for Cyber Cycles.

Your tasks:
1. [Build/Deploy steps]
2. [Verification steps]
3. [Documentation updates]

Target environment: [GCP VM / Vercel / etc.]
Current URL: http://146.148.58.219:5173

Return confirmation when complete.
```

### Documentation Tasks

```
You are updating documentation for Cyber Cycles.

Your tasks:
1. [Docs to create/update]
2. [Code examples to add]
3. [Diagrams to create]

Target audience: [New developers / Users / API reference]

Return a summary of documentation changes.
```

---

## 🔧 Available Subagent Types

### `general-purpose`

Use for most tasks. Capable of:
- Reading/writing files
- Running shell commands
- Searching codebase
- Multi-step workflows

Example:
```
task:
  description: "Set up Rust tests"
  subagent_type: "general-purpose"
  prompt: "Create test infrastructure for Rust backend..."
```

---

## 📁 Project Structure Reference

### Key Directories

```
/home/property.sightlines/spacetime/
├── cyber-client/              # Frontend (Three.js + SpacetimeDB)
│   ├── src/
│   │   ├── main.js            # Main game logic
│   │   ├── game-logic.js      # Pure functions (testable)
│   │   └── module/            # Generated SpacetimeDB types
│   ├── tests/                 # Vitest tests
│   ├── package.json
│   └── vitest.config.js
│
└── cyber-cycles-db/
    └── spacetimedb/           # Backend (Rust)
        ├── src/lib.rs         # SpacetimeDB module
        ├── tests/             # Integration tests
        ├── Cargo.toml
        └── target/            # Build artifacts
```

### Key Files

| File | Purpose |
|------|---------|
| `00_START_HERE.md` | Project bootstrap |
| `01_ARCHITECTURE.md` | System design |
| `02_BUILD_DEPLOY.md` | Build instructions |
| `src/main.js` | Frontend game logic |
| `src/game-logic.js` | Testable pure functions |
| `spacetimedb/src/lib.rs` | Backend Rust code |

---

## 🧪 Testing Guidelines

### Rust Backend Tests

```bash
cd /home/property.sightlines/spacetime/cyber-cycles-db/spacetimedb
cargo test          # Run all tests
cargo test -- --nocapture  # Show println! output
```

### TypeScript Frontend Tests

```bash
cd /home/property.sightlines/spacetime/cyber-client
npm test            # Watch mode
npm run test:run    # Run once
npm run test:coverage  # With coverage
```

### Test File Naming

- Rust: `tests/integration_tests.rs`, `#[cfg(test)]` modules in source
- TypeScript: `tests/*.test.js`

---

## 🚀 Build & Deploy Commands

### Backend

```bash
cd /home/property.sightlines/spacetime/cyber-cycles-db/spacetimedb
cargo clean
spacetime publish cyber-cycles --delete-data
spacetime generate --lang typescript --out-dir ../../cyber-client/src/module
```

### Frontend

```bash
cd /home/property.sightlines/spacetime/cyber-client
npm install
npm run dev         # Dev server
npm run build       # Production build
```

---

## 🐛 Common Issues & Delegation

### Issue: Vec<T> Serialization

When delegating tasks involving arrays in reducers:

```
⚠️ IMPORTANT: SpacetimeDB v2 SDK crashes on Vec<T> parameters.
Use JSON strings instead:
- Rust: `pub turn_points_json: String`
- TypeScript: `JSON.stringify(p.turnPoints)`
```

### Issue: Field Name Conversion

When working with SpacetimeDB types:

```
⚠️ SpacetimeDB converts snake_case → camelCase in TypeScript:
- Rust: `turn_points_json` → TS: `turnPointsJson`
- Rust: `is_ai` → TS: `isAi`
Always check both conventions in client code.
```

### Issue: Reducer Names

```
⚠️ Reducers are also converted to camelCase:
- Rust: `tick_countdown` → TS: `tickCountdown()`
- Rust: `sync_state` → TS: `syncState()`
```

---

## 📊 Task Tracking

Use the todo_write tool to track tasks:

```
{
  "todos": [
    {"id": "1", "content": "Task description", "status": "pending"},
    {"id": "2", "content": "In progress task", "status": "in_progress"},
    {"id": "3", "content": "Completed task", "status": "completed"}
  ]
}
```

Update todos:
- Mark as `in_progress` when starting
- Mark as `completed` when done
- Add new todos if scope expands

---

## 🎯 Example Delegation Workflows

### Workflow 1: Adding a New Feature

1. **Main conversation**: Discuss feature requirements with user
2. **Delegate to subagent**: "Implement power-up system backend in Rust"
3. **Delegate to subagent**: "Add power-up UI components to frontend"
4. **Delegate to subagent**: "Write tests for power-up system"
5. **Main conversation**: Review results with user, get feedback

### Workflow 2: Bug Fix

1. **Main conversation**: User reports bug
2. **Delegate to subagent**: "Investigate collision detection bug"
3. **Subagent returns**: Root cause analysis
4. **Main conversation**: Explain fix to user
5. **Delegate to subagent**: "Apply collision detection fix"
6. **Delegate to subagent**: "Run tests to verify fix"

### Workflow 3: Deployment

1. **Main conversation**: User requests deployment
2. **Delegate to subagent**: "Build and deploy to GCP VM"
3. **Delegate to subagent**: "Verify deployment and check logs"
4. **Main conversation**: Report success to user

---

## 📞 Getting Help

If a subagent task fails or needs clarification:
1. Check the error output
2. Try to fix with more specific instructions
3. If blocked, report to main conversation for user input

---

## ✅ Delegation Checklist

Before delegating:
- [ ] Task is clearly defined
- [ ] All necessary context is provided
- [ ] Expected output is described
- [ ] File paths are absolute
- [ ] Dependencies are mentioned

After delegation:
- [ ] Review the summary
- [ ] Verify files were created/modified
- [ ] Run tests if code was changed
- [ ] Update todo list

---

**End of Guide** - For questions, refer to the main documentation in `00_START_HERE.md`.
