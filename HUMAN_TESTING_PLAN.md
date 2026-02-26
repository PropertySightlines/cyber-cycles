# 🎮 Human Testing Plan - Cyber Cycles Phase 1

**Version:** 1.0  
**Date:** March 24, 2026  
**Status:** Ready for Testing

---

## 🎯 Testing Goals

1. **Validate physics feel** - Grinding, collision, rubber system
2. **Test performance** - Frame rate, responsiveness
3. **Verify AI behavior** - Appropriate difficulty, no crashes
4. **Identify bugs** - Edge cases, crashes, glitches
5. **Gather feedback** - Fun factor, difficulty, suggestions

---

## 🚀 Getting Started

### Access the Game

**URL:** http://146.148.58.219:5173

**Requirements:**
- Modern browser (Chrome, Firefox, Edge)
- Keyboard with arrow keys or WASD
- No installation needed

### First Steps

1. Open browser to URL above
2. Press any arrow key to join the race
3. Wait for countdown (3-2-1-GO!)
4. Use arrow keys to control your bike
5. Try to survive!

---

## 🎮 Controls

| Key | Action |
|-----|--------|
| **← or A** | Hold to turn left |
| **→ or D** | Hold to turn right |
| **↓ or S** | Brake (slow down) |
| **Space** | Join race / Respawn |
| **F1** | Toggle debug overlay |
| **F2** | Step frame (debug) |
| **F3** | Reset game |

---

## 🧪 Test Scenarios

### Scenario 1: Single Player vs AI

**Setup:**
- Default settings (1 human, 5 AI)
- Press arrow key to join

**Test:**
- [ ] Controls feel responsive
- [ ] Turning is smooth
- [ ] Braking works
- [ ] You can survive more than 10 seconds
- [ ] Grinding near walls feels fair
- [ ] Death/respawn works correctly

**Expected:**
- Bike responds immediately to input
- Smooth turning arc
- Grinding allows millimeter-precision
- Respawn after death

---

### Scenario 2: Debug Overlay

**Setup:**
- Press F1 during gameplay

**Test:**
- [ ] Overlay appears
- [ ] FPS counter shows green (>55 FPS)
- [ ] Entity count shows ~12 (6 players + 6 trails)
- [ ] Command input works
- [ ] Try command: `ai 3` (reduce AI to 3)
- [ ] Try command: `stats` (show stats)

**Expected:**
- Clear, readable display
- No performance impact
- Commands execute correctly

---

### Scenario 3: Spectate Mode

**Setup:**
- Press F1
- Type command: `spectate`

**Test:**
- [ ] Camera follows action
- [ ] All 6 AI bikes visible
- [ ] AI behavior observable
- [ ] FPS remains stable

**Expected:**
- Free camera movement
- AI bikes behave reasonably
- No crashes or glitches

---

### Scenario 4: Grinding Test

**Setup:**
- Join race
- Try to follow close behind another bike's trail

**Test:**
- [ ] Can get close to trail without dying
- [ ] Rubber system allows near-misses
- [ ] Grinding feels rewarding, not frustrating
- [ ] Visual feedback clear

**Expected:**
- Millimeter-precision grinding
- No unfair deaths
- Clear visual distinction between safe/danger zones

---

### Scenario 5: Collision Test

**Setup:**
- Intentionally crash into trails

**Test:**
- [ ] Collision detected accurately
- [ ] Death screen appears
- [ ] Can respawn with Space
- [ ] No false positives (dying when not hitting)
- [ ] No tunneling (going through trails)

**Expected:**
- Instant death on trail contact
- Clear feedback (explosion, death screen)
- Fair collision detection

---

### Scenario 6: Performance Test

**Setup:**
- Play for 2+ minutes
- Watch FPS counter (F1)

**Test:**
- [ ] FPS stays above 55 (green)
- [ ] No stuttering or lag
- [ ] Memory usage stable
- [ ] No crashes

**Expected:**
- Consistent 60 FPS
- Smooth gameplay
- No memory leaks

---

## 📋 Testing Checklist

### Basic Functionality
- [ ] Game loads in browser
- [ ] Controls work (left, right, brake)
- [ ] Join race works
- [ ] Countdown displays
- [ ] Race starts
- [ ] Death detected
- [ ] Respawn works
- [ ] Win/loss screens show

### Physics & Collision
- [ ] Turning feels smooth
- [ ] Speed feels appropriate
- [ ] Grinding is fair
- [ ] Collisions accurate
- [ ] No tunneling
- [ ] Boundaries enforced
- [ ] AI behavior reasonable

### Performance
- [ ] FPS > 55 (green)
- [ ] No stuttering
- [ ] No crashes
- [ ] Memory stable
- [ ] Input responsive

### Debug Features
- [ ] F1 toggle works
- [ ] FPS counter accurate
- [ ] Entity count correct
- [ ] Commands work
- [ ] Log displays

---

## 🐛 Bug Reporting

### Bug Report Template

```markdown
**Bug Title:**
[Brief description]

**Steps to Reproduce:**
1. [First step]
2. [Second step]
3. [etc.]

**Expected Behavior:**
[What should happen?]

**Actual Behavior:**
[What actually happens?]

**Screenshots/Video:**
[If applicable]

**Environment:**
- Browser: [Chrome/Firefox/Edge version]
- OS: [Windows/Mac/Linux]
- FPS: [From debug overlay]

**Severity:**
- [ ] Critical (game breaking)
- [ ] High (major feature broken)
- [ ] Medium (minor issue)
- [ ] Low (cosmetic)
```

### Where to Report

- GitHub Issues: https://github.com/PropertySightlines/cyber-cycles/issues
- Or document in testing session notes

---

## 📊 Feedback Form

### Rate Your Experience (1-5 scale)

**Controls:**
- Responsiveness: [1-5]
- Smoothness: [1-5]
- Intuitiveness: [1-5]

**Gameplay:**
- Fun factor: [1-5]
- Difficulty: [Too Easy / Just Right / Too Hard]
- Grinding satisfaction: [1-5]

**Visual:**
- Trail visibility: [1-5]
- Bike visibility: [1-5]
- Overall aesthetics: [1-5]

**Performance:**
- Frame rate: [1-5]
- Input lag: [None / Slight / Noticeable / Bad]
- Stability: [1-5]

### Open Feedback

**What did you enjoy most?**
[Your answer]

**What was most frustrating?**
[Your answer]

**What would you improve?**
[Your answer]

**Any other comments?**
[Your answer]

---

## 🎯 Success Criteria

### Must Pass
- [ ] Game loads without errors
- [ ] Controls are responsive
- [ ] Collision detection works
- [ ] FPS stays above 55
- [ ] No game-breaking bugs

### Should Pass
- [ ] Grinding feels fair
- [ ] AI behavior reasonable
- [ ] Debug overlay useful
- [ ] No visual glitches

### Nice to Have
- [ ] High fun factor
- [ ] Smooth visuals
- [ ] Perfect AI balance

---

## 📅 Testing Schedule

### Session 1: Basic Functionality (30 min)
- Load game
- Test controls
- Verify basic features
- Report any blockers

### Session 2: Physics & Collision (45 min)
- Extended gameplay
- Test grinding mechanics
- Verify collision accuracy
- Rate physics feel

### Session 3: Performance (30 min)
- Monitor FPS
- Check memory usage
- Test with debug overlay
- Verify stability

### Session 4: Feedback (15 min)
- Complete feedback form
- Suggest improvements
- Prioritize issues

---

## 🔧 Troubleshooting

### Game Won't Load
- Check browser console (F12)
- Verify URL is correct
- Try different browser
- Clear cache (Ctrl+Shift+R)

### Controls Not Working
- Make sure game window is focused
- Try different keys (arrow keys vs WASD)
- Check browser doesn't have key bindings
- Refresh page

### Low FPS
- Close other browser tabs
- Reduce browser zoom to 100%
- Try different browser
- Check system resources

### Crashes
- Note what you were doing when it crashed
- Check browser console for errors
- Try to reproduce
- Report with steps

---

## 📞 Contact

For questions or issues during testing:
- GitHub: https://github.com/PropertySightlines/cyber-cycles
- Document issues in testing notes

---

**Good luck and have fun! 🏁**
