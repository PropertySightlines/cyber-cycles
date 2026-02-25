## 📁 File 6: `05_KNOWN_ISSUES.md`

```markdown
# 🐛 Cyber Cycles - Known Issues & Workarounds

---

## 🔴 Critical Issues

### Issue #1: SpacetimeDB v2 Vec<T> Serialization

**Severity:** Critical  
**Status:** Workaround implemented  
**Tracking:** File issue at https://github.com/clockworklabs/spacetimedb

**Problem:**
```
TypeError: Cannot read properties of undefined (reading 'length')
    at sendStateSync
```

**Cause:** SDK v2 crashes when validating `Vec<T>` reducer parameters.

**Workaround:**
```rust
// Use JSON string instead
pub turn_points_json: String,  // ✅ Works
```

```javascript
// Serialize/deserialize
const turnPointsJson = JSON.stringify(p.turnPoints);
p.turnPoints = JSON.parse(turnPointsJson);
```

**To Fix Properly:** Wait for SpacetimeDB SDK v2.1+ or file bug report.

---

### Issue #2: Field Name Conversion Confusion

**Severity:** High  
**Status:** Documented  
**Tracking:** N/A (SDK behavior)

**Problem:**
```javascript
// This doesn't work:
const ownerId = p.owner_id;  // undefined

// This works:
const ownerId = p.ownerId;  // or check both
```

**Cause:** SpacetimeDB converts snake_case → camelCase in TypeScript.

**Workaround:**
```javascript
// Always check both conventions
const value = obj.snake_case || obj.camelCase;
```

---

## 🟡 Moderate Issues

### Issue #3: Trail Visibility When Going Straight

**Severity:** Moderate  
**Status:** Fixed  
**Version:** Current

**Problem:** Trail disappears when not turning.

**Cause:** Trail points only added on turn.

**Fix:**
```javascript
// Add point based on distance, not turning
const distMoved = Math.hypot(p.x - p.lastTrailPoint.x, p.z - p.lastTrailPoint.z);
p.distanceSinceLastPoint += distMoved;

if (p.distanceSinceLastPoint >= TRAIL_SPACING) {
    p.turnPoints.push({ x: p.x, z: p.z });
    p.distanceSinceLastPoint = 0;
}
```

---

### Issue #4: Camera Angle Makes Trail Disappear

**Severity:** Low  
**Status:** Visual artifact  
**Version:** Current

**Problem:** Trail seems to disappear from certain angles.

**Cause:** Trail wall is thin, camera angle can make it invisible.

**Potential Fix:**
- Make trail wider
- Add outline/border
- Use billboard rendering

---

### Issue #5: AI Sometimes Crashes Immediately

**Severity:** Moderate  
**Status:** Improved but not perfect  
**Version:** Current

**Problem:** AI bikes sometimes crash into each other at start.

**Cause:** All AI start in circle, all move toward center.

**Potential Fixes:**
- Stagger AI start times
- Add initial spread in directions
- Improve AI lookahead distance

---

## 🟢 Minor Issues

### Issue #6: No Sound Effects

**Severity:** Low  
**Status:** Not implemented  
**Version:** N/A

**Problem:** Game has no audio.

**To Implement:**
- Engine hum (pitch based on speed)
- Turn sound
- Crash explosion
- Countdown beeps
- Win/lose fanfare

---

### Issue #7: No Menu System

**Severity:** Low  
**Status:** Not implemented  
**Version:** N/A

**Problem:** Game starts immediately on page load.

**To Implement:**
- Start screen
- Settings menu
- Controls explanation
- Leaderboard

---

### Issue #8: Limited to 6 Players

**Severity:** Low  
**Status:** Design choice  
**Version:** Current

**Problem:** Only 6 players supported.

**To Change:**
```rust
// In lib.rs init()
let num_players = 8;  // Change from 6
let spawn_radius = 120.0;  // Adjust for more players
```

---

## 🔧 Debugging Tips

### Check Reducer Calls

```javascript
// Add logging
function sendStateSync(p) {
    console.log("sendStateSync:", p.id, p.x, p.z);
    conn.reducers.syncState(/* ... */);
}
```

### Check Collision Detection

```javascript
// Add collision logging
if (dist < CONSTANTS.DEATH_RADIUS) {
    console.log("COLLISION:", p.id, "hit trail of", seg.pid, "dist:", dist);
    p.alive = false;
}
```

### Check Network Sync

```javascript
// Log player updates
conn.db.player.onUpdate((ctx, oldP, newP) => {
    console.log("Player update:", newP.id, newP.x, newP.z, newP.alive);
});
```

---

## 📝 Bug Report Template

When filing issues:

```markdown
**Description:**
[What's broken?]

**Steps to Reproduce:**
1. [First step]
2. [Second step]
3. [etc.]

**Expected Behavior:**
[What should happen?]

**Actual Behavior:**
[What actually happens?]

**Console Errors:**
```
[Paste error messages]
```

**Environment:**
- Browser: [Chrome/Firefox/etc.]
- SpacetimeDB CLI: [version]
- Game Version: [current]

**Screenshots:**
[If applicable]
```

---

## 📞 SpacetimeDB Bug Reports

### File At:
https://github.com/clockworklabs/spacetimedb/issues

### Template for Vec<T> Bug:

```markdown
**Title:** SDK v2: TypeError on Vec<T> reducer parameter

**Description:**
The TypeScript SDK v2 crashes with "Cannot read properties of undefined 
(reading 'length')" when calling reducers with Vec<T> parameters.

**Reproduction:**
1. Create reducer with Vec<T> parameter
2. Call from TypeScript client
3. SDK crashes during serialization

**Workaround:**
Use JSON string instead of Vec<T>

**Environment:**
- SpacetimeDB CLI: 2.0.1
- SDK: Generated from CLI 2.0.1
- Browser: Chrome
```

---

## ✅ Issue Checklist

Before reporting a new issue:

- [ ] Checked existing documentation
- [ ] Verified it's not a SpacetimeDB SDK bug
- [ ] Tested in multiple browsers
- [ ] Checked browser console for errors
- [ ] Verified SpacetimeDB connection is working
- [ ] Tried regenerating TypeScript types
- [ ] Cleared browser cache

---

**Next:** Read `06_FUTURE_FEATURES.md` for planned improvements.
```

---

