## 📁 File 3: `02_BUILD_DEPLOY.md`

```markdown
# 🔨 Cyber Cycles - Build & Deployment Guide

---

## 📋 Prerequisites

### Required Software

```bash
# Check Rust installation
rustc --version  # Should be 1.70+

# Check SpacetimeDB CLI
spacetime --version  # Should be 2.0+

# Check Node.js
node --version  # Should be 18+
npm --version
```

### Install Missing Tools

```bash
# Install Rust (if needed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install SpacetimeDB CLI
cargo install spacetimedb-cli

# Install Node.js (if needed)
# Use nvm or download from nodejs.org
```

---

## 🏗️ Initial Setup

### Clone/Navigate to Project

```bash
cd /home/property.sightlines/spacetime
```

### Verify Directory Structure

```bash
# Should see:
ls -la
# cyber-client/
# cyber-cycles-db/
```

---

## 🔧 Development Workflow

### Step 1: Make Backend Changes

```bash
cd /home/property.sightlines/spacetime/cyber-cycles-db/spacetimedb

# Edit lib.rs
nano src/lib.rs
```

### Step 2: Build & Publish Backend

```bash
# Clean previous build (IMPORTANT - forces rebuild)
cargo clean

# Publish to SpacetimeDB cloud
spacetime publish cyber-cycles --delete-data

# Expected output:
# - Compiling cyber_cycles_db...
# - Finished release profile...
# - Updated database with name: cyber-cycles
# - Dashboard: https://spacetimedb.com/cyber-cycles
```

### Step 3: Generate TypeScript Types

```bash
# From Rust module directory
spacetime generate --lang typescript --out-dir /home/property.sightlines/spacetime/cyber-client/src/module

# Verify generation
ls -la /home/property.sightlines/spacetime/cyber-client/src/module/
# Should see: index.ts, player_table.ts, etc.
```

### Step 4: Update Frontend (if needed)

```bash
cd /home/property.sightlines/spacetime/cyber-client

# Edit main.js
nano src/main.js

# Edit index.html (if needed)
nano index.html  # ⚠️ NOT src/index.html!
```

### Step 5: Start Development Server

```bash
cd /home/property.sightlines/spacetime/cyber-client

# Install dependencies (first time only)
npm install

# Start Vite dev server
npm run dev

# Expected output:
# VITE v7.3.1 ready in 334 ms
# ➜  Local:   http://localhost:5173/
# ➜  Network: http://10.128.0.7:5173/
```

### Step 6: Access Game

```
# On GCP VM, access via external IP:
http://146.148.58.219:5173

# Or from VM itself:
http://localhost:5173
```

---

## 🚀 Production Deployment

### Option A: Continue Using Dev Server

For prototype/testing, the Vite dev server is fine:

```bash
# Run in background
cd /home/property.sightlines/spacetime/cyber-client
nohup npm run dev > /var/log/cyber-cycles.log 2>&1 &

# Check it's running
ps aux | grep vite
```

### Option B: Build for Production

```bash
cd /home/property.sightlines/spacetime/cyber-client

# Build optimized bundle
npm run build

# Output in dist/
ls -la dist/

# Serve with nginx or similar
```

### Option C: Deploy to Vercel/Netlify

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd /home/property.sightlines/spacetime/cyber-client
vercel

# Follow prompts, get public URL
```

---

## 🔄 Common Tasks

### Regenerate Types Only

```bash
spacetime generate --lang typescript \
  --out-dir /home/property.sightlines/spacetime/cyber-client/src/module \
  --module-path /home/property.sightlines/spacetime/cyber-cycles-db/spacetimedb
```

### Check Database Status

```bash
# List databases
spacetime list

# View database logs
spacetime logs cyber-cycles
```

### Reset Database

```bash
# Delete and recreate
spacetime delete cyber-cycles
spacetime publish cyber-cycles
```

### View Generated Types

```bash
# Check player table schema
cat /home/property.sightlines/spacetime/cyber-client/src/module/player_table.ts

# Check available reducers
cat /home/property.sightlines/spacetime/cyber-client/src/module/index.ts | grep -E "export.*reducer"
```

---

## 🐛 Troubleshooting

### Problem: "Module not found" errors

```bash
# Check module directory exists
ls -la /home/property.sightlines/spacetime/cyber-client/src/module/

# If missing, regenerate
spacetime generate --lang typescript --out-dir /home/property.sightlines/spacetime/cyber-client/src/module
```

### Problem: "Reducer not found" errors

```javascript
// Check available reducers in browser console
console.log(Object.keys(conn.reducers));

// Common issue: snake_case vs camelCase
// Rust: tick_countdown
// JS: tickCountdown (not tick_countdown!)
```

### Problem: Types don't match backend

```bash
# Force clean rebuild
cd /home/property.sightlines/spacetime/cyber-cycles-db/spacetimedb
cargo clean
spacetime publish cyber-cycles --delete-data
spacetime generate --lang typescript --out-dir /home/property.sightlines/spacetime/cyber-client/src/module
```

### Problem: Game doesn't load

```bash
# Check Vite is running
ps aux | grep vite

# Check firewall allows port 5173
sudo ufw status
sudo ufw allow 5173

# Check index.html path (common mistake!)
ls -la /home/property.sightlines/spacetime/cyber-client/index.html
# NOT: /home/property.sightlines/spacetime/cyber-client/src/index.html
```

### Problem: Vec<T> serialization crashes

```rust
// WRONG - will crash SDK
pub turn_points: Vec<Vec2>,

// RIGHT - use JSON string
pub turn_points_json: String,
```

---

## 📝 Build Checklist

Before deploying:

- [ ] Backend changes published (`spacetime publish`)
- [ ] TypeScript types regenerated (`spacetime generate`)
- [ ] No TypeScript errors in module/
- [ ] Frontend changes saved
- [ ] Dev server restarted
- [ ] Browser cache cleared (Ctrl+Shift+R)
- [ ] Multiplayer tested (2+ browser windows)
- [ ] Console shows no errors

---

## 🌐 GCP VM Configuration

### Firewall Rules

Ensure port 5173 is open:

```bash
# Check firewall
sudo ufw status

# Allow port if needed
sudo ufw allow 5173/tcp
```

### External IP

```
Current External IP: 146.148.58.219
Game URL: http://146.148.58.219:5173
```

### Keep Server Running

```bash
# Use screen or tmux for persistent session
screen -S cyber-cycles
npm run dev
# Ctrl+A, D to detach

# Reattach later
screen -r cyber-cycles
```

---

## 📊 Monitoring

### Check Server Logs

```bash
# Vite dev server output
tail -f /var/log/cyber-cycles.log

# SpacetimeDB logs
spacetime logs cyber-cycles --follow
```

### Browser Console

Open DevTools (F12) and watch for:
- Connection errors
- Reducer call failures
- Collision detection logs

---

**Next:** Read `03_SPACETIMEDB_GUIDE.md` for SpacetimeDB-specific details.
```

---
