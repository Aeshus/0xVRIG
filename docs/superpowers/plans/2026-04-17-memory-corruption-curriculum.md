# Memory Corruption Curriculum Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the existing 5-exercise stack overflow teaching tool into a 28-exercise memory corruption curriculum covering stack attacks, logic bugs, heap fundamentals, advanced heap exploitation (glibc techniques), and two final boss challenges.

**Architecture:** Single self-contained `index.html`. Extends existing StackSim + step engine with a new HeapSim class, heap visualization renderer, unit-grouped navigation, gadget/register UI panels, and badge system. Exercises 01–05 remain unchanged. New exercises 06–28 are added incrementally by unit.

**Tech Stack:** Vanilla HTML/CSS/JS, no dependencies. DOM rendering. localStorage for badge persistence.

---

## Scope Note

This is a large plan (~5000 lines of new code in a single file). The tasks are ordered so each one produces a working, testable increment. Each task adds one exercise or one infrastructure component. The file will grow from ~1614 lines to ~5500-6000 lines.

**Spec:** `docs/superpowers/specs/2026-04-17-memory-corruption-curriculum-design.md`

---

### Task 1: Navigation Redesign + Unit System + Badges

**Files:**
- Modify: `index.html` (CSS nav section ~lines 38-47, renderNav function ~lines 628-652, header HTML ~line 258-261, init ~line 1611)

This task restructures navigation to support 6 units and 28 exercises, adds badge display, and adds localStorage persistence. All existing exercises continue to work.

- [ ] **Step 1: Add unit metadata to EXERCISES array**

Add a `unit` property to each existing exercise and define the unit structure:

```javascript
const UNITS = [
  { id: 1, name: 'STACK', exercises: [0,1,2,3,4] },
  { id: 2, name: 'LOGIC', exercises: [] },      // filled in later tasks
  { id: 3, name: 'STACK II', exercises: [] },
  { id: 4, name: 'HEAP', exercises: [] },
  { id: 5, name: 'HEAP II', exercises: [] },
  { id: 6, name: 'FINAL', exercises: [] },
];

const BADGES = {
  1: { name: 'Stack Smasher', icon: '🔨' },
  2: { name: 'Logic Hacker', icon: '🧩' },
  3: { name: 'Stack Master', icon: '⚡' },
  4: { name: 'Heap Explorer', icon: '🗺️' },
  5: { name: 'Heap Wizard', icon: '🧙' },
  27: { name: 'Full Chain', icon: '🔗' },
  28: { name: 'Certified Hacker', icon: '🏆' },
};
```

Add `unit: 1` to each of the 5 existing exercise objects.

- [ ] **Step 2: Add CSS for unit-grouped nav and badges**

Replace the existing nav CSS (~lines 38-47) and add badge styles:

```css
nav { display: flex; gap: 0.15rem; flex-wrap: wrap; align-items: center; }
.nav-unit-label {
  font-size: 10px; color: var(--text-dim); text-transform: uppercase;
  letter-spacing: 0.05em; padding: 0.25rem 0.5rem; margin-left: 0.5rem;
  border-left: 1px solid var(--panel-border);
}
.nav-unit-label:first-child { margin-left: 0; border-left: none; }
nav button {
  background: transparent; border: 1px solid var(--panel-border); color: var(--text-dim);
  padding: 0.25rem 0.5rem; font-family: var(--font); font-size: 11px; cursor: pointer;
  transition: all 0.15s; min-width: 2em; text-align: center;
}
nav button:hover:not(:disabled) { border-color: var(--text-dim); color: var(--text); }
nav button.active { border-color: var(--green); color: var(--green); }
nav button.completed { border-color: var(--comment); color: var(--comment); }
nav button.completed::after { content: ' ✓'; font-size: 9px; }
nav button:disabled { opacity: 0.3; cursor: not-allowed; }

#badges { display: flex; gap: 0.5rem; margin-left: auto; }
.badge {
  font-size: 11px; padding: 0.15rem 0.5rem; border: 1px solid var(--yellow);
  color: var(--yellow); border-radius: 2px; white-space: nowrap;
}
```

- [ ] **Step 3: Add badge display element to header HTML**

Change the header from:
```html
<header>
  <h1>// STACK OVERFLOW LAB</h1>
  <nav id="exercise-nav"></nav>
</header>
```
To:
```html
<header>
  <h1>// MEMORY CORRUPTION LAB</h1>
  <nav id="exercise-nav"></nav>
  <div id="badges"></div>
</header>
```

- [ ] **Step 4: Rewrite renderNav() for unit-grouped navigation**

Replace the existing `renderNav()` function:

```javascript
function renderNav() {
  const nav = document.getElementById('exercise-nav');
  nav.innerHTML = '';

  UNITS.forEach(unit => {
    if (unit.exercises.length === 0) return;
    const label = document.createElement('span');
    label.className = 'nav-unit-label';
    label.textContent = unit.name;
    nav.appendChild(label);

    unit.exercises.forEach(idx => {
      const ex = EXERCISES[idx];
      const btn = document.createElement('button');
      btn.textContent = String(idx + 1).padStart(2, '0');
      btn.title = ex.title;
      btn.dataset.ex = idx;
      if (idx === state.currentEx) btn.classList.add('active');
      if (state.completed.has(idx)) btn.classList.add('completed');
      if (!isExerciseUnlocked(idx)) {
        btn.disabled = true;
      }
      btn.onclick = () => { if (isExerciseUnlocked(idx)) loadExercise(idx); };
      nav.appendChild(btn);
    });
  });

  renderBadges();
}

function isExerciseUnlocked(idx) {
  if (idx === 0) return true;
  const ex = EXERCISES[idx];
  if (!ex) return false;
  // First exercise in a unit: requires all of unit 1 complete (except unit 1 itself)
  const unit = UNITS.find(u => u.exercises.includes(idx));
  if (!unit) return false;
  if (unit.id === 1) {
    return idx === 0 || state.completed.has(idx - 1);
  }
  // Units 2-5: require unit 1 complete + sequential within unit
  const unit1Done = UNITS[0].exercises.every(i => state.completed.has(i));
  if (!unit1Done) return false;
  // Final unit: requires all other units complete
  if (unit.id === 6) {
    return UNITS.slice(0, 5).every(u =>
      u.exercises.every(i => state.completed.has(i))
    );
  }
  // Sequential within unit
  const posInUnit = unit.exercises.indexOf(idx);
  if (posInUnit === 0) return true;
  return state.completed.has(unit.exercises[posInUnit - 1]);
}
```

- [ ] **Step 5: Add badge rendering and localStorage persistence**

```javascript
function renderBadges() {
  const container = document.getElementById('badges');
  container.innerHTML = '';
  const earned = getEarnedBadges();
  earned.forEach(b => {
    const el = document.createElement('span');
    el.className = 'badge';
    el.textContent = b.icon + ' ' + b.name;
    container.appendChild(el);
  });
}

function getEarnedBadges() {
  const earned = [];
  UNITS.forEach(unit => {
    if (unit.exercises.length > 0 && unit.exercises.every(i => state.completed.has(i))) {
      const badge = BADGES[unit.id];
      if (badge) earned.push(badge);
    }
  });
  // Individual exercise badges (final challenges)
  [27, 28].forEach(idx => {
    if (state.completed.has(idx) && BADGES[idx]) {
      earned.push(BADGES[idx]);
    }
  });
  return earned;
}

function saveProgress() {
  const data = { completed: [...state.completed] };
  localStorage.setItem('memcorr-progress', JSON.stringify(data));
}

function loadProgress() {
  try {
    const data = JSON.parse(localStorage.getItem('memcorr-progress'));
    if (data && data.completed) {
      state.completed = new Set(data.completed);
    }
  } catch (e) {}
}
```

- [ ] **Step 6: Hook saveProgress into completion and loadProgress into init**

In `showSuccess()`, after `state.completed.add(state.currentEx)`, add `saveProgress();`.

In the existing completion paths (exercise 01 step walkthrough, sandbox), also add `saveProgress();`.

At the top of the init section (before `loadExercise(0)`), add `loadProgress();`.

- [ ] **Step 7: Remove the old sandbox nav button code**

The old `renderNav()` had a hardcoded sandbox button. Remove that entirely — sandbox will become exercise 29 or will be accessed differently once all exercises exist. For now, keep the sandbox accessible via a button at the end of the nav if all Unit 1 exercises are complete (preserve existing behavior but adapt to unit style).

- [ ] **Step 8: Test in browser**

Open `index.html`. Verify:
- Nav shows "STACK" label followed by buttons 01–05
- Buttons show exercise title on hover
- Clicking exercises works as before
- Completing an exercise shows ✓ on the button
- Refresh page — completed state persists via localStorage
- No other unit labels show yet (empty units are hidden)
- Title changed to "MEMORY CORRUPTION LAB"

- [ ] **Step 9: Commit**

```bash
git add index.html
git commit -m "feat: unit-grouped navigation, badge system, localStorage persistence"
```

---

### Task 2: Exercise 06 — Integer Overflow

**Files:**
- Modify: `index.html` (add exercise to EXERCISES array, update UNITS, add number-line CSS, add integer overflow step generation)

- [ ] **Step 1: Add CSS for the integer number line visualization**

Add after the existing stack CSS:

```css
/* Integer overflow number line */
.int-overflow-viz {
  margin: 0.75rem 0; padding: 0.5rem;
  border: 1px solid var(--panel-border);
}
.number-line {
  position: relative; height: 3em; margin: 1rem 0;
  border-bottom: 2px solid var(--text-dim);
}
.number-line .tick {
  position: absolute; bottom: 0; transform: translateX(-50%);
  font-size: 10px; color: var(--text-dim); text-align: center;
}
.number-line .tick::before {
  content: ''; display: block; width: 1px; height: 8px;
  background: var(--text-dim); margin: 0 auto 2px;
}
.number-line .marker {
  position: absolute; bottom: 1.5em; transform: translateX(-50%);
  font-size: 11px; font-weight: bold; padding: 2px 6px;
  border-radius: 2px;
}
.number-line .marker.input { color: var(--green); border: 1px solid var(--green); }
.number-line .marker.result { color: var(--red); border: 1px solid var(--red); }
.number-line .wrap-arrow {
  position: absolute; bottom: 2.5em; color: var(--red);
  font-size: 11px; white-space: nowrap;
}
```

- [ ] **Step 2: Add exercise 06 definition**

Add after exercise 05 in the EXERCISES array:

```javascript
{
  title: '06: Integer Overflow',
  unit: 2,
  desc: 'The program adds a header size (64) to your input length. But what happens when your number is so big that the addition <strong>wraps around</strong> past the maximum value? The buffer ends up tiny, but the program still reads your full input — overflow!',
  code: [
    { text: '#include <stdio.h>', cls: '' },
    { text: '', cls: '' },
    { text: 'void win() { printf("FLAG\\n"); }', cls: '' },
    { text: '', cls: '' },
    { text: 'void process(unsigned int user_len) {', cls: '', fn: true },
    { text: '    unsigned int total = user_len + 64;', cls: 'highlight vuln' },
    { text: '    char buf[total];', cls: '' },
    { text: '    read_input(buf, user_len);', cls: 'highlight' },
    { text: '}', cls: '' },
    { text: '', cls: '' },
    { text: 'int main() {', cls: '' },
    { text: '    unsigned int len;', cls: '' },
    { text: '    scanf("%u", &len);', cls: '' },
    { text: '    process(len);', cls: '' },
    { text: '    return 0;', cls: '' },
    { text: '}', cls: '' },
  ],
  mode: 'input-int-overflow',
  vizMode: 'stack',
  bufSize: 16,
  showSymbols: true,
  showBuilder: true,
  aslr: false,
  intOverflow: true,
  headerSize: 64,
  check(sim) {
    return sim.getRetAddr() === state.symbols.win;
  },
  winTitle: 'FLAG{integer_wrap}',
  winMsg: 'The math wrapped around! A huge number + 64 became a tiny number, so the buffer was too small. Your input overflowed it and hijacked the go-back address. This is how integer overflows lead to memory corruption.',
},
```

- [ ] **Step 3: Update UNITS array**

```javascript
{ id: 2, name: 'LOGIC', exercises: [5] },  // index 5 = exercise 06
```

- [ ] **Step 4: Add integer overflow input mode handling**

In `renderInput()`, add a case for `mode === 'input-int-overflow'`. This shows:
1. A numeric input for `user_len`
2. A display showing the math: `user_len + 64 = total` with wrap detection
3. After the user picks a wrapping value, the standard hex payload input appears for the overflow content
4. Step/Run/Reset controls

```javascript
if (ex.mode === 'input-int-overflow') {
  area.innerHTML = `
    <div style="margin-bottom:0.75rem">
      <label style="font-size:11px;color:var(--text-dim)">Enter the length value (unsigned 32-bit integer):</label>
      <div style="display:flex;gap:0.5rem;align-items:center;margin-top:0.35rem">
        <input id="int-input" type="text" placeholder="e.g. 4294967232"
          style="background:#0a0a0a;border:1px solid var(--panel-border);color:var(--text);font-family:var(--font);font-size:13px;padding:0.5rem;width:16em"
          oninput="onIntOverflowInput()">
        <span style="color:var(--text-dim)">+ ${ex.headerSize} =</span>
        <span id="int-result" style="color:var(--green);font-weight:bold">—</span>
      </div>
      <div id="int-overflow-indicator" style="font-size:11px;margin-top:0.35rem;min-height:1.5em"></div>
    </div>
    <div id="int-overflow-payload" style="display:none">
      <label style="font-size:11px;color:var(--text-dim)">Now enter your payload (hex bytes) — the buffer is tiny but the program reads your full length:</label>
      <textarea id="payload-input" placeholder="Enter hex bytes: 41 41 41 41 ..." oninput="onPayloadInput()" rows="2"
        style="width:100%;background:#0a0a0a;border:1px solid var(--panel-border);color:var(--text);font-family:var(--font);font-size:13px;padding:0.5rem;resize:none;margin-top:0.35rem"></textarea>
      <div id="step-counter" style="font-size:11px;color:var(--text-dim);margin-top:0.5rem;min-height:1.2em"></div>
      <div class="controls" style="margin-top:0.25rem">
        <button class="primary" onclick="doStep()">Step →</button>
        <button onclick="doRunAll()">Run ▶▶</button>
        <button onclick="doReset()">Reset</button>
      </div>
    </div>
  `;
  state.inputMode = 'hex';
}
```

- [ ] **Step 5: Add onIntOverflowInput() function**

```javascript
function onIntOverflowInput() {
  const input = document.getElementById('int-input');
  const result = document.getElementById('int-result');
  const indicator = document.getElementById('int-overflow-indicator');
  const payloadDiv = document.getElementById('int-overflow-payload');
  if (!input || !result) return;

  const val = parseInt(input.value);
  if (isNaN(val) || val < 0) {
    result.textContent = '—';
    indicator.innerHTML = '';
    payloadDiv.style.display = 'none';
    return;
  }

  const ex = EXERCISES[state.currentEx];
  const total = (val + ex.headerSize) >>> 0;  // unsigned 32-bit wrap
  const wrapped = val > 0 && total < val;  // overflow occurred

  result.textContent = '0x' + total.toString(16).toUpperCase();
  result.style.color = wrapped ? 'var(--red)' : 'var(--green)';

  if (wrapped) {
    indicator.innerHTML = '<span style="color:var(--red)">⚠ WRAP! ' + val + ' + ' + ex.headerSize +
      ' overflows past 0xFFFFFFFF → buffer is only ' + total + ' bytes!</span>';
    payloadDiv.style.display = 'block';
    // Reconfigure the sim with the tiny wrapped buffer size
    const retAddr = retAddrInMain();
    state.sim = new StackSim(Math.min(total, 256), retAddr, 0xbfff0200);
    state.sim.intOverflowLen = val;  // store the "real" read length
    state.execSteps = null;
    state.execIndex = 0;
    renderStack();
  } else {
    indicator.innerHTML = total <= 256
      ? '<span style="color:var(--text-dim)">No overflow — buffer is ' + total + ' bytes, plenty of room.</span>'
      : '<span style="color:var(--text-dim)">Buffer is ' + total + ' bytes — normal allocation.</span>';
    payloadDiv.style.display = 'none';
  }
}
```

- [ ] **Step 6: Add integer overflow step generation**

In `generateExecSteps()`, add handling for `intOverflow` exercises. Before the existing step generation, check `if (ex.intOverflow)` and generate steps that show:
1. `scanf()` reads the user's length value
2. The addition wraps — show the math in the log
3. `alloca(total)` — tiny buffer allocated (show on stack)
4. `read_input()` reads the full original length — standard word-by-word overflow

The key is that the buffer size in the sim is the *wrapped* value (tiny), but the input length written is the payload the user entered. The overflow steps are the same as the existing gets() overflow — reuse `generateExecSteps` by setting `sim.bufSize` to the wrapped value.

```javascript
// In generateExecSteps, add at the top:
if (ex.intOverflow) {
  const userLen = sim.intOverflowLen || bytes.length;
  const total = (userLen + ex.headerSize) >>> 0;
  steps.push({
    label: 'scanf — read user length',
    srcLine: findCodeLine(ex, 'scanf'),
    logs: [['action', 'scanf("%u", &len) → user entered: ' + userLen]],
    action() {}
  });
  steps.push({
    label: 'compute total = len + ' + ex.headerSize,
    srcLine: findCodeLine(ex, 'total = user_len'),
    logs: [
      ['action', 'total = ' + userLen + ' + ' + ex.headerSize + ' = ...'],
      ['error', '⚠ Integer overflow! Result wraps to: ' + total + ' (0x' + total.toString(16) + ')'],
    ],
    action() {}
  });
  steps.push({
    label: 'allocate tiny buffer',
    srcLine: findCodeLine(ex, 'char buf'),
    logs: [['action', 'char buf[' + total + '] — only ' + total + ' bytes allocated on the stack!']],
    action(sim) {
      for (let i = 0; i < sim.bufSize; i++) sim.memory[i] = 0;
      sim.markRegion(0, sim.bufSize);
    }
  });
  // Then fall through to normal gets() word-by-word steps for the payload write
}
```

The rest of step generation (the gets-style word-by-word write, canary check, LEAVE, RET, jump check) is reused from the existing engine.

- [ ] **Step 7: Test in browser**

Open `index.html`. Complete exercises 01–05 (or use localStorage hack to mark them done). Verify:
- Exercise 06 appears under "LOGIC" unit label
- Entering a normal number shows no overflow
- Entering `4294967232` (0xFFFFFFC0) shows wrap: 4294967232 + 64 = 0 → buffer is 0 bytes
- Actually use a value like `4294967280` where total wraps to 16 → small buffer appears in stack viz
- Enter a hex payload that overflows the tiny buffer and overwrites the return address with win()
- Stepping shows the integer math, tiny allocation, then overflow word-by-word
- Win triggers FLAG{integer_wrap}

- [ ] **Step 8: Commit**

```bash
git add index.html
git commit -m "feat: exercise 06 — integer overflow"
```

---

### Task 3: Exercise 07 — Format String Reading

**Files:**
- Modify: `index.html` (add exercise, add format string simulation logic)

- [ ] **Step 1: Add exercise 07 definition**

```javascript
{
  title: '07: Format String: Reading',
  unit: 2,
  desc: 'The program passes your input directly to <strong>printf()</strong> as the format string. Normally printf expects a fixed string like "hello %s". But if YOU control the format string, you can use <strong>%x</strong> to read values from the stack — like a secret password stored in memory.',
  code: [
    { text: '#include <stdio.h>', cls: '' },
    { text: '', cls: '' },
    { text: 'void vuln() {', cls: '', fn: true },
    { text: '    int secret = 0xCAFEBABE;', cls: '' },
    { text: '    char buf[64];', cls: '' },
    { text: '    fgets(buf, 64, stdin);', cls: '' },
    { text: '    printf(buf);', cls: 'highlight vuln' },
    { text: '    // BUG: user input IS the format string!', cls: 'cmt' },
    { text: '}', cls: '' },
    { text: '', cls: '' },
    { text: 'int main() {', cls: '' },
    { text: '    vuln();', cls: '' },
    { text: '    return 0;', cls: '' },
    { text: '}', cls: '' },
  ],
  mode: 'input-fmt-read',
  vizMode: 'stack',
  bufSize: 64,
  showSymbols: false,
  showBuilder: false,
  aslr: false,
  fmtRead: true,
  secretValue: 0xCAFEBABE,
  secretOffset: 3,
  check(sim) {
    return state.fmtLeakedSecret === true;
  },
  winTitle: 'Secret Leaked!',
  winMsg: 'You used %x to walk up the stack and read the secret value. In real exploits, this technique leaks canaries, return addresses, and heap pointers — anything stored on the stack.',
},
```

- [ ] **Step 2: Add format string read simulation**

The format string exercise doesn't use the normal step engine. Instead, when the user types `%x` specifiers, the simulation immediately shows which stack values get printed.

```javascript
function simulateFmtRead(input) {
  const ex = EXERCISES[state.currentEx];
  if (!ex || !ex.fmtRead) return;

  state.logMessages = [];
  log('info', '═══ ' + ex.title + ' ═══');
  log('action', 'printf(buf) — interpreting your input as a format string...');
  log('info', '');

  // Simulated stack values above buf (what printf would read as arguments)
  const stackValues = [
    { label: 'printf arg area', value: 0xbfff0200 },
    { label: 'buf pointer', value: state.sim.baseAddr },
    { label: 'saved register', value: 0x00000040 },
    { label: 'secret', value: ex.secretValue },
    { label: 'saved EBP', value: 0xbfff0300 },
    { label: 'return address', value: retAddrInMain() },
  ];

  let output = '';
  let stackIdx = 0;
  let i = 0;
  state.fmtLeakedSecret = false;

  while (i < input.length) {
    if (input[i] === '%' && i + 1 < input.length) {
      const spec = input[i + 1];
      if (spec === 'x' && stackIdx < stackValues.length) {
        const sv = stackValues[stackIdx];
        const hexVal = (sv.value >>> 0).toString(16);
        output += hexVal;
        log('action', '%x → read stack slot ' + (stackIdx + 1) + ': <span class="log-addr">0x' +
          hexVal.padStart(8, '0') + '</span> <span class="log-label">(' + sv.label + ')</span>');

        // Highlight the corresponding region in the stack viz
        if (sv.value === ex.secretValue) {
          log('success', '^ That\'s the secret! You found it: 0x' + hexVal.toUpperCase());
          state.fmtLeakedSecret = true;
        }

        stackIdx++;
        i += 2;
        continue;
      } else if (spec === 'p' && stackIdx < stackValues.length) {
        const sv = stackValues[stackIdx];
        const hexVal = '0x' + (sv.value >>> 0).toString(16).padStart(8, '0');
        output += hexVal;
        log('action', '%p → read stack slot ' + (stackIdx + 1) + ': <span class="log-addr">' +
          hexVal + '</span> <span class="log-label">(' + sv.label + ')</span>');
        if (sv.value === ex.secretValue) {
          log('success', '^ That\'s the secret! You found it: ' + hexVal);
          state.fmtLeakedSecret = true;
        }
        stackIdx++;
        i += 2;
        continue;
      } else if (spec === 's') {
        output += '(string)';
        log('warn', '%s → tried to read a string pointer from the stack — could crash!');
        stackIdx++;
        i += 2;
        continue;
      }
    }
    output += input[i];
    i++;
  }

  log('info', '');
  log('action', 'printf output: "' + output + '"');

  if (state.fmtLeakedSecret) {
    log('info', '');
    log('success', 'The secret was at stack slot ' + (ex.secretOffset + 1) + '. In a real exploit, you\'d use %' + (ex.secretOffset + 1) + '$x to read it directly.');
    showSuccess(ex.winTitle, ex.winMsg);
    state.completed.add(state.currentEx);
    saveProgress();
    renderNav();
  } else if (stackIdx > 0) {
    log('info', '');
    log('info', 'Keep adding more %x to walk further up the stack. The secret is 0xCAFEBABE — find it!');
  }

  renderLog();
}
```

- [ ] **Step 3: Add input mode for format string reading**

In `renderInput()`, add:

```javascript
if (ex.mode === 'input-fmt-read') {
  area.innerHTML = `
    <label style="font-size:11px;color:var(--text-dim)">Type a format string (try %x to read stack values):</label>
    <textarea id="payload-input" placeholder="Try: %x %x %x %x" rows="2"
      style="width:100%;background:#0a0a0a;border:1px solid var(--panel-border);color:var(--text);font-family:var(--font);font-size:13px;padding:0.5rem;resize:none;margin-top:0.35rem"></textarea>
    <div class="controls" style="margin-top:0.5rem">
      <button class="primary" onclick="runFmtRead()">Run printf()</button>
      <button onclick="doReset()">Reset</button>
    </div>
  `;
}
```

- [ ] **Step 4: Add runFmtRead() function**

```javascript
function runFmtRead() {
  const ta = document.getElementById('payload-input');
  if (!ta || !ta.value.trim()) { log('info', 'Enter a format string first.'); renderLog(); return; }
  simulateFmtRead(ta.value);
}
```

- [ ] **Step 5: Update UNITS**

Add exercise index to unit 2's exercises array.

- [ ] **Step 6: Test in browser**

- Type `AAAA` → printed literally, no stack reads
- Type `%x` → shows one stack value
- Type `%x %x %x` → shows three stack values
- Type `%x %x %x %x` → fourth value is 0xCAFEBABE → win!
- Success banner shows

- [ ] **Step 7: Commit**

```bash
git add index.html
git commit -m "feat: exercise 07 — format string reading"
```

---

### Task 4: Exercise 08 — Format String Writing

**Files:**
- Modify: `index.html` (add exercise, add %n write simulation)

- [ ] **Step 1: Add exercise 08 definition**

```javascript
{
  title: '08: Format String: Writing',
  unit: 2,
  desc: 'The <strong>%n</strong> format specifier doesn\'t print — it <strong>writes</strong>. It writes the number of characters printed so far to a memory address. If you can put an address on the stack and line up %n to use it, you can write anywhere in memory. Change the <strong>authorized</strong> variable from 0 to anything else.',
  code: [
    { text: '#include <stdio.h>', cls: '' },
    { text: '', cls: '' },
    { text: 'void win() { printf("FLAG\\n"); }', cls: '' },
    { text: '', cls: '' },
    { text: 'int authorized = 0;', cls: 'highlight' },
    { text: '', cls: '' },
    { text: 'void vuln() {', cls: '', fn: true },
    { text: '    char buf[64];', cls: '' },
    { text: '    fgets(buf, 64, stdin);', cls: '' },
    { text: '    printf(buf);', cls: 'highlight vuln' },
    { text: '    if (authorized) win();', cls: 'highlight' },
    { text: '}', cls: '' },
    { text: '', cls: '' },
    { text: 'int main() {', cls: '' },
    { text: '    vuln();', cls: '' },
    { text: '    return 0;', cls: '' },
    { text: '}', cls: '' },
  ],
  mode: 'input-fmt-write',
  vizMode: 'stack',
  bufSize: 64,
  showSymbols: false,
  showBuilder: false,
  aslr: false,
  fmtWrite: true,
  targetAddr: 0x0804a020,
  check() {
    return state.fmtWriteSuccess === true;
  },
  winTitle: 'FLAG{format_string_write}',
  winMsg: 'You used %n to write a value to the authorized variable. Format string bugs are powerful — they let you read AND write arbitrary memory, all through printf!',
},
```

- [ ] **Step 2: Add format string write simulation**

This is more complex. The user needs to:
1. Put the address of `authorized` at the start of their input (as raw bytes in the buffer — which is also on the stack)
2. Use `%x` to advance the stack pointer past the intervening slots until it points at the buffer
3. Use `%n` to write the count of printed chars to the address at the current stack position

The simulation shows: "Your buffer starts at stack slot N. The first 4 bytes of your buffer are an address. When %n fires at that slot, it writes to that address."

```javascript
function simulateFmtWrite(input) {
  const ex = EXERCISES[state.currentEx];
  if (!ex || !ex.fmtWrite) return;

  state.logMessages = [];
  log('info', '═══ ' + ex.title + ' ═══');
  log('info', 'authorized is at address <span class="log-addr">' + hex8(ex.targetAddr) + '</span> — currently 0');
  log('action', 'printf(buf) — interpreting your input as a format string...');
  log('info', '');

  // The buffer itself is on the stack. Slot 1-3 are other things,
  // slot 4+ is the buffer content. So %4$n would write to the address
  // stored at the start of the buffer.
  const bufBytes = strToBytes(input.slice(0, 4));
  const addrFromBuf = bufBytes.length >= 4
    ? (bufBytes[0] | (bufBytes[1] << 8) | (bufBytes[2] << 16) | (bufBytes[3] << 24)) >>> 0
    : 0;

  const stackSlots = [
    { label: 'printf internal', value: 0xbfff0200 },
    { label: 'buf pointer', value: state.sim.baseAddr },
    { label: 'saved register', value: 0x00000040 },
    { label: 'buf[0..3] (your input!)', value: addrFromBuf },
  ];

  let printedChars = 0;
  let stackIdx = 0;
  let i = 4; // skip the first 4 bytes (address)
  state.fmtWriteSuccess = false;

  // Count the address bytes as printed (they show as garbage chars)
  printedChars = 4;
  log('info', 'First 4 bytes of input = address bytes: <span class="log-addr">' + hex8(addrFromBuf) + '</span>');

  while (i < input.length) {
    if (input[i] === '%' && i + 1 < input.length) {
      const spec = input[i + 1];
      // Handle direct parameter access %N$x or %N$n
      const directMatch = input.slice(i).match(/^%(\d+)\$([xn])/);
      if (directMatch) {
        const slotNum = parseInt(directMatch[1]);
        const action = directMatch[2];
        if (action === 'x' && slotNum <= stackSlots.length) {
          const sv = stackSlots[slotNum - 1];
          const hexVal = (sv.value >>> 0).toString(16);
          printedChars += hexVal.length;
          log('action', '%' + slotNum + '$x → read slot ' + slotNum + ': <span class="log-addr">0x' +
            hexVal.padStart(8, '0') + '</span> <span class="log-label">(' + sv.label + ')</span>');
        } else if (action === 'n' && slotNum <= stackSlots.length) {
          const sv = stackSlots[slotNum - 1];
          log('action', '%' + slotNum + '$n → WRITE ' + printedChars + ' to address at slot ' + slotNum +
            ': <span class="log-addr">' + hex8(sv.value) + '</span>');
          if (sv.value === ex.targetAddr) {
            log('success', 'Wrote ' + printedChars + ' to authorized at ' + hex8(ex.targetAddr) + '!');
            log('success', 'authorized is now ' + printedChars + ' (non-zero) → win() is called!');
            state.fmtWriteSuccess = true;
          } else {
            log('warn', 'Wrote to ' + hex8(sv.value) + ' but that\'s not the authorized variable (' + hex8(ex.targetAddr) + ')');
          }
        }
        i += directMatch[0].length;
        continue;
      }

      if (spec === 'x' && stackIdx < stackSlots.length) {
        const sv = stackSlots[stackIdx];
        const hexVal = (sv.value >>> 0).toString(16);
        printedChars += hexVal.length;
        log('action', '%x → read slot ' + (stackIdx + 1) + ': <span class="log-addr">0x' +
          hexVal.padStart(8, '0') + '</span> <span class="log-label">(' + sv.label + ')</span>');
        stackIdx++;
        i += 2;
        continue;
      } else if (spec === 'n') {
        if (stackIdx < stackSlots.length) {
          const sv = stackSlots[stackIdx];
          log('action', '%n → WRITE ' + printedChars + ' to address at slot ' + (stackIdx + 1) +
            ': <span class="log-addr">' + hex8(sv.value) + '</span>');
          if (sv.value === ex.targetAddr) {
            log('success', 'Wrote ' + printedChars + ' to authorized at ' + hex8(ex.targetAddr) + '!');
            log('success', 'authorized is now ' + printedChars + ' (non-zero) → win() is called!');
            state.fmtWriteSuccess = true;
          } else {
            log('warn', 'Wrote to ' + hex8(sv.value) + ' — not the authorized variable. Use %x to advance to the right slot first.');
          }
          stackIdx++;
        }
        i += 2;
        continue;
      }
    }
    printedChars++;
    i++;
  }

  log('info', '');
  if (state.fmtWriteSuccess) {
    showSuccess(ex.winTitle, ex.winMsg);
    state.completed.add(state.currentEx);
    saveProgress();
    renderNav();
  } else if (addrFromBuf !== ex.targetAddr) {
    log('info', 'Hint: the first 4 bytes of your input should be the address of authorized (' + hex8(ex.targetAddr) + ') in little-endian. Then use %x to advance and %n to write.');
  } else {
    log('info', 'The address is correct! Now use %x to advance past the first 3 stack slots, then %n (or %4$n) to write to slot 4 — which is your address.');
  }

  renderLog();
}
```

- [ ] **Step 3: Add input mode for format string writing**

In `renderInput()`:

```javascript
if (ex.mode === 'input-fmt-write') {
  area.innerHTML = `
    <label style="font-size:11px;color:var(--text-dim)">Craft a format string. Start with the target address as raw bytes, then use %x to advance and %n to write.</label>
    <div style="font-size:11px;color:var(--amber);margin:0.35rem 0">authorized is at: <strong>${hex8(ex.targetAddr)}</strong> → little-endian bytes: ${
      [ex.targetAddr & 0xff, (ex.targetAddr >> 8) & 0xff, (ex.targetAddr >> 16) & 0xff, (ex.targetAddr >> 24) & 0xff]
      .map(b => '\\x' + hex2(b)).join('')
    }</div>
    <div style="font-size:11px;color:var(--text-dim);margin-bottom:0.35rem">Tip: type the address bytes, then %x %x %x %n (or use %4$n to jump directly to slot 4)</div>
    <textarea id="payload-input" placeholder="\\x20\\xa0\\x04\\x08%x%x%x%n" rows="2"
      style="width:100%;background:#0a0a0a;border:1px solid var(--panel-border);color:var(--text);font-family:var(--font);font-size:13px;padding:0.5rem;resize:none"></textarea>
    <div class="controls" style="margin-top:0.5rem">
      <button class="primary" onclick="runFmtWrite()">Run printf()</button>
      <button onclick="doReset()">Reset</button>
    </div>
  `;
}
```

- [ ] **Step 4: Add runFmtWrite() and input parsing**

```javascript
function runFmtWrite() {
  const ta = document.getElementById('payload-input');
  if (!ta || !ta.value.trim()) { log('info', 'Enter a format string first.'); renderLog(); return; }
  // Parse \x escape sequences into actual bytes
  const parsed = ta.value.replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  simulateFmtWrite(parsed);
}
```

- [ ] **Step 5: Update UNITS array and test**

Add exercise index to unit 2. Test:
- Enter `\x20\xa0\x04\x08%x%x%x%n` → writes to authorized → win
- Enter `\x20\xa0\x04\x08%4$n` → direct access, writes 4 to authorized → win
- Enter without address → hint shown

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat: exercise 08 — format string writing with %n"
```

---

### Task 5: Exercise 09 — Off-by-One

**Files:**
- Modify: `index.html` (add exercise, add dual-return step generation)

- [ ] **Step 1: Add exercise 09 definition**

```javascript
{
  title: '09: Off-by-One',
  unit: 2,
  desc: 'The loop uses <strong>&lt;=</strong> instead of <strong>&lt;</strong>, writing one extra byte past the buffer. That one byte overlaps the low byte of the saved bookmark (EBP). By changing just one byte, you shift where the <strong>next</strong> function\'s go-back address is read from — giving you indirect control.',
  code: [
    { text: '#include <stdio.h>', cls: '' },
    { text: '', cls: '' },
    { text: 'void win() { printf("FLAG\\n"); }', cls: '' },
    { text: '', cls: '' },
    { text: 'void vuln() {', cls: '', fn: true },
    { text: '    char buf[16];', cls: '' },
    { text: '    int i;', cls: '' },
    { text: '    for (i = 0; i <= 16; i++) {', cls: 'highlight vuln' },
    { text: '        buf[i] = read_byte();', cls: '' },
    { text: '    }', cls: '' },
    { text: '    // i <= 16 means we write 17 bytes', cls: 'cmt' },
    { text: '    // the 17th byte hits saved EBP!', cls: 'cmt' },
    { text: '}', cls: '' },
    { text: '', cls: '' },
    { text: 'int main() {', cls: '' },
    { text: '    vuln();', cls: '' },
    { text: '    return 0;', cls: '' },
    { text: '}', cls: '' },
  ],
  mode: 'input-hex',
  vizMode: 'stack',
  bufSize: 16,
  showSymbols: true,
  showBuilder: false,
  aslr: false,
  offByOne: true,
  check(sim) {
    // Win if the OBO redirect leads to win()
    return state.oboWin === true;
  },
  winTitle: 'FLAG{off_by_one}',
  winMsg: 'One single byte! You changed the low byte of the saved bookmark, which shifted where main() reads its go-back address. On main\'s return, it jumped to win(). This is why off-by-one errors are dangerous even when you can\'t directly reach the return address.',
},
```

- [ ] **Step 2: Add off-by-one step generation in generateExecSteps**

When `ex.offByOne` is true, generate steps that:
1. Show the loop writing bytes 0–15 into buf (normal)
2. Show byte 16 being written — this is ONE PAST the buffer, hitting the low byte of saved EBP
3. LEAVE — EBP is restored from the corrupted saved EBP
4. RET from vuln() — normal, return address wasn't touched
5. Show main() now using the corrupted EBP
6. When main() executes LEAVE + RET, it reads the return address from the WRONG location (attacker-controlled buffer region)
7. Jump check — if the attacker placed win()'s address at the right offset in their buffer

The user needs to figure out: write 16 bytes of buf content (placing win() address at the right offset), then the 17th byte shifts the low byte of EBP so that main()'s return reads from their controlled data.

This requires extending the step engine to simulate TWO function returns. Add a `secondReturn` step type.

- [ ] **Step 3: Implement dual-return stepping**

```javascript
// After the normal RET + jump steps for offByOne exercises, add:
if (ex.offByOne) {
  // vuln()'s RET is normal — return address wasn't overwritten
  // But EBP was corrupted by 1 byte, so main()'s frame is shifted

  // Calculate where main() will read its return address from
  const corruptedEbp = sim.getSavedEbp(); // this has the low byte changed
  steps.push({
    label: 'Back in main() — but EBP is wrong!',
    srcLine: findCodeLine(ex, 'return 0'),
    logs: [
      ['action', 'Returned to main() normally.'],
      ['warn', 'But main()\'s EBP is now <span class="log-addr">' + hex8(corruptedEbp) + '</span> — the low byte was corrupted!'],
    ],
    action() {}
  });

  steps.push({
    label: 'main() LEAVE — reads return addr from wrong place',
    srcLine: findCodeLine(ex, 'return 0'),
    logs: [
      ['action', 'main() executes LEAVE — reads its go-back address from EBP+4...'],
      ['warn', 'But EBP points to your buffer! Reading go-back address from attacker-controlled data!'],
    ],
    action() {},
    oboRetCheck: true
  });
}
```

In `execCurrentStep()`, handle the `oboRetCheck` step type — read 4 bytes from the corrupted EBP+4 offset within the buffer, check if it equals win().

- [ ] **Step 4: Update UNITS, test, commit**

```bash
git add index.html
git commit -m "feat: exercise 09 — off-by-one with dual return"
```

---

### Task 6: Exercise 10 — Signedness Bug

**Files:**
- Modify: `index.html` (add exercise, add signedness simulation)

- [ ] **Step 1: Add exercise 10 definition**

Similar structure to exercise 06 (integer overflow). The user enters a negative number. The viz shows:
1. The signed comparison: `-1 > 64` → false (check passes!)
2. The cast to unsigned: `-1` → `0xFFFFFFFF` (4294967295)
3. memcpy copies way more than the buffer can hold

```javascript
{
  title: '10: Signedness Bug',
  unit: 2,
  desc: 'The program checks if your length is too big: <strong>if (len > 64)</strong>. But len is a <strong>signed</strong> integer — negative numbers are always "less than" 64! When the program then uses len as an <strong>unsigned</strong> size in memcpy, -1 becomes 4,294,967,295. Massive overflow.',
  code: [
    { text: '#include <stdio.h>', cls: '' },
    { text: '#include <string.h>', cls: '' },
    { text: '', cls: '' },
    { text: 'void win() { printf("FLAG\\n"); }', cls: '' },
    { text: '', cls: '' },
    { text: 'void copy_data(int len) {', cls: '', fn: true },
    { text: '    char buf[64];', cls: '' },
    { text: '    if (len > 64) {', cls: 'highlight' },
    { text: '        printf("Too long!\\n");', cls: '' },
    { text: '        return;', cls: '' },
    { text: '    }', cls: '' },
    { text: '    memcpy(buf, input, (size_t)len);', cls: 'highlight vuln' },
    { text: '    // cast to unsigned: -1 → 0xFFFFFFFF!', cls: 'cmt' },
    { text: '}', cls: '' },
    { text: '', cls: '' },
    { text: 'int main() {', cls: '' },
    { text: '    int len;', cls: '' },
    { text: '    scanf("%d", &len);', cls: '' },
    { text: '    copy_data(len);', cls: '' },
    { text: '    return 0;', cls: '' },
    { text: '}', cls: '' },
  ],
  mode: 'input-signedness',
  vizMode: 'stack',
  bufSize: 64,
  showSymbols: true,
  showBuilder: true,
  aslr: false,
  signedness: true,
  check(sim) {
    return sim.getRetAddr() === state.symbols.win;
  },
  winTitle: 'FLAG{signed_vs_unsigned}',
  winMsg: 'The signed/unsigned mismatch let your negative length slip past the bounds check. When cast to unsigned, it became a huge number — and memcpy happily overwrote everything. Always use consistent types for sizes!',
},
```

- [ ] **Step 2: Add signedness input mode**

Similar to integer overflow: a numeric input for the length value, shows the comparison and cast, then unlocks the hex payload input.

- [ ] **Step 3: Add step generation for signedness exercises**

Steps show: `scanf` reads length, `if (len > 64)` check passes (show -1 < 64), cast to `size_t` shows 0xFFFFFFFF, then standard overflow write.

- [ ] **Step 4: Update UNITS, test, commit**

```bash
git add index.html
git commit -m "feat: exercise 10 — signedness bug"
```

---

### Task 7: Exercises 11–14 — Stack Attacks II (ret2libc, ROP, Stack Pivot, SROP)

**Files:**
- Modify: `index.html` (add 4 exercises, add gadget table UI, register display, signal frame UI)

This is a larger task because it adds 4 exercises and shared infrastructure (gadget table, register display).

- [ ] **Step 1: Add CSS for gadget table and register display**

```css
/* Gadget table */
#gadget-table { margin-top: 0.75rem; font-size: 11px; }
#gadget-table h4 { color: var(--text-dim); font-weight: normal; margin-bottom: 0.35rem; text-transform: uppercase; letter-spacing: 0.05em; }
.gadget-row { display: flex; gap: 0.75rem; padding: 0.15rem 0; cursor: pointer; }
.gadget-row:hover { background: rgba(255,255,255,0.03); }
.gadget-addr { color: var(--amber); width: 9em; }
.gadget-asm { color: var(--text); }
.gadget-row.used { opacity: 0.5; }

/* Register display */
#register-display {
  margin-top: 0.75rem; padding: 0.5rem; border: 1px solid var(--panel-border);
  font-size: 11px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.25rem;
}
.reg-entry { display: flex; gap: 0.35rem; }
.reg-name { color: var(--blue); width: 3em; }
.reg-val { color: var(--amber); }
.reg-val.changed { color: var(--green); animation: flash 0.4s ease; }

/* Signal frame builder */
#sigframe-builder {
  margin-top: 0.75rem; padding: 0.5rem; border: 1px solid var(--panel-border);
  font-size: 11px;
}
#sigframe-builder h4 { color: var(--text-dim); font-weight: normal; margin-bottom: 0.5rem; text-transform: uppercase; }
.sigframe-row { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem; }
.sigframe-row label { color: var(--blue); width: 5em; }
.sigframe-row input {
  background: #0a0a0a; border: 1px solid var(--panel-border); color: var(--text);
  font-family: var(--font); font-size: 11px; padding: 0.2rem 0.4rem; width: 10em;
}
```

- [ ] **Step 2: Add exercise 11 — Return to Libc**

```javascript
{
  title: '11: Return to Libc',
  unit: 3,
  desc: 'NX is on — the stack is not executable. But you can still call <strong>existing functions</strong>! Overwrite the go-back address with <strong>system()</strong>\'s address, then set up the stack so system() thinks it was called normally with <strong>"/bin/sh"</strong> as its argument.',
  code: [
    { text: '// NX enabled — stack not executable', cls: 'cmt' },
    { text: '#include <stdio.h>', cls: '' },
    { text: '', cls: '' },
    { text: 'void win() { printf("FLAG\\n"); }', cls: '' },
    { text: '', cls: '' },
    { text: '// Available in libc:', cls: 'cmt' },
    { text: '// system() @ shown in symbol table', cls: 'cmt' },
    { text: '// "/bin/sh" @ shown in symbol table', cls: 'cmt' },
    { text: '', cls: '' },
    { text: 'void vuln() {', cls: '', fn: true },
    { text: '    char buf[16];', cls: '' },
    { text: '    gets(buf);', cls: 'highlight vuln' },
    { text: '}', cls: '' },
    { text: '', cls: '' },
    { text: 'int main() {', cls: '' },
    { text: '    vuln();', cls: '' },
    { text: '    return 0;', cls: '' },
    { text: '}', cls: '' },
  ],
  mode: 'input-hex',
  vizMode: 'stack',
  bufSize: 16,
  showSymbols: true,
  showBuilder: false,
  aslr: false,
  nx: true,
  ret2libc: true,
  check(sim) {
    // Check: ret addr = system, and system's arg (at EBP+12 from overflow) = binsh addr
    const retAddr = sim.getRetAddr();
    if (retAddr !== state.symbols.system) return false;
    // system's argument is 8 bytes after the return address in the payload
    // (4 bytes for system's own "return address" + 4 bytes for arg)
    const argOffset = sim.bufSize + sim.canarySize + 4 + 4 + 4;
    if (argOffset + 4 <= sim.totalSize) {
      const arg = sim._readLE(argOffset, 4);
      return arg === state.symbols.binsh;
    }
    return false;
  },
  winTitle: 'FLAG{ret2libc}',
  winMsg: 'You called system("/bin/sh") by setting up a fake call frame on the stack. NX doesn\'t matter — you\'re not running code on the stack, you\'re calling real functions that already exist. This is return-to-libc.',
},
```

Add `system` and `binsh` to BASE_SYMBOLS:
```javascript
system: 0x08048200,
binsh:  0x08049300,
```

Override the `totalSize` for this exercise to accommodate the extra 8 bytes (system's ret + arg) by using a larger StackSim — modify `loadExercise()` to allocate 8 extra bytes when `ret2libc` is set.

- [ ] **Step 3: Add exercise 12 — ROP Basics**

```javascript
{
  title: '12: ROP Basics',
  unit: 3,
  desc: 'Instead of calling one function, chain multiple small instruction sequences (<strong>gadgets</strong>) that each end in RET. Each RET pops the next address from your stack payload, jumping to the next gadget. Chain them to write a value to memory, then return to win().',
  // ... (code, gadget definitions, etc.)
  mode: 'input-hex',
  vizMode: 'stack',
  bufSize: 16,
  showSymbols: true,
  showGadgetTable: true,
  aslr: false,
  nx: true,
  rop: true,
  gadgets: [
    { addr: 0x08048100, asm: 'pop eax; ret', desc: 'Load a value into EAX' },
    { addr: 0x08048104, asm: 'pop ebx; ret', desc: 'Load a value into EBX' },
    { addr: 0x08048108, asm: 'mov [ebx], eax; ret', desc: 'Write EAX to address in EBX' },
  ],
  flagAddr: 0x0804a030,
  check(sim) { return state.ropWin === true; },
  winTitle: 'FLAG{rop_chain}',
  winMsg: 'You chained gadgets to write a value to memory and then jumped to win(). This is Return-Oriented Programming — the backbone of modern exploitation. NX, DEP, none of it matters when you can reuse the program\'s own code.',
},
```

Add a ROP execution mode in `execCurrentStep()` that:
- Reads addresses from the stack payload one by one
- Looks up each address in the gadget table
- Simulates the gadget (pop = read next stack word into register, mov = write, etc.)
- Shows register state changing in the register display
- Each RET pops the next gadget address

- [ ] **Step 4: Add exercise 13 — Stack Pivot**

Uses the same ROP infrastructure but with a twist: the buffer is too small for a full ROP chain. The user writes the ROP chain into the buffer (which is at a known address), then uses the overflow to set EAX = buffer address and execute `xchg eax, esp; ret` — which moves the stack pointer to the buffer.

- [ ] **Step 5: Add exercise 14 — SROP**

Add a signal frame builder UI. The user fills in register values. The payload is: padding + sigreturn gadget address + signal frame bytes. When sigreturn executes, all registers are set from the frame simultaneously.

- [ ] **Step 6: Add gadget table and register display rendering**

In `renderInput()`, when `showGadgetTable` is true, render the gadget table with clickable rows. When a gadget is clicked, its address is appended to the payload input.

Add `renderRegisters()` function that shows EAX, EBX, ECX, EDX, ESP, EBP, EIP, EFLAGS.

- [ ] **Step 7: Add ROP step execution to execCurrentStep**

When a step has `ropGadget: true`, the step engine:
1. Reads the gadget address from the current stack position
2. Looks it up in the exercise's gadget table
3. Simulates the instruction(s)
4. Logs each instruction with register changes
5. Highlights the register display

- [ ] **Step 8: Update UNITS array**

```javascript
{ id: 3, name: 'STACK II', exercises: [10, 11, 12, 13] },  // indices for ex 11-14
```

- [ ] **Step 9: Test all 4 exercises in browser**

- Ex 11: payload = [16 pad] [4 junk EBP] [system addr LE] [4 junk] [binsh addr LE] → win
- Ex 12: payload = [16 pad] [4 junk] [gadget chain...] → registers change → write to flagAddr → return to win()
- Ex 13: ROP chain in buffer, pivot ESP to buffer via overflow → chain executes from buffer
- Ex 14: fill signal frame with EIP=win → sigreturn sets all registers

- [ ] **Step 10: Commit**

```bash
git add index.html
git commit -m "feat: exercises 11-14 — ret2libc, ROP, stack pivot, SROP"
```

---

### Task 8: HeapSim Class

**Files:**
- Modify: `index.html` (add HeapSim class after StackSim)

This is pure infrastructure — no exercises yet. The heap simulator models glibc-like allocation.

- [ ] **Step 1: Implement HeapSim class**

```javascript
class HeapSim {
  constructor(size = 1024) {
    this.memorySize = size;
    this.memory = new Uint8Array(size);
    this.written = new Uint8Array(size);
    this.highlight = { start: -1, end: -1 };

    // Chunk tracking
    this.chunks = new Map(); // addr → {size, allocated, dataStart}
    this.HEADER_SIZE = 8; // prev_size(4) + size(4)
    this.MIN_CHUNK = 16;  // header + at least 8 data (or fd+bk)

    // Free lists
    this.tcache = {};      // size → [addr, addr, ...] (max 7 per bin)
    this.fastbins = {};    // size → [addr, addr, ...]
    this.unsorted = [];    // [addr, addr, ...]

    // Top chunk
    this.topAddr = 0;
    this.topSize = size;

    // Function pointer table
    this.funcPtrs = {};
    this.mainArena = 0x0804b100; // fake main_arena address for unsorted bin attack

    // Base address for display
    this.baseAddr = 0x08050000;
  }

  _writeLE(offset, value, size) {
    for (let i = 0; i < size && offset + i < this.memorySize; i++) {
      this.memory[offset + i] = (value >>> (i * 8)) & 0xff;
    }
  }

  _readLE(offset, size) {
    let v = 0;
    for (let i = size - 1; i >= 0; i--) {
      v = (v * 256) + (this.memory[offset + i] || 0);
    }
    return v >>> 0;
  }

  _alignSize(requested) {
    const total = requested + this.HEADER_SIZE;
    return Math.max(this.MIN_CHUNK, Math.ceil(total / 8) * 8);
  }

  malloc(requested) {
    const alignedSize = this._alignSize(requested);
    const sizeClass = alignedSize;

    // 1. Check tcache
    if (this.tcache[sizeClass] && this.tcache[sizeClass].length > 0) {
      const addr = this.tcache[sizeClass].pop();
      const chunk = this.chunks.get(addr);
      if (chunk) {
        chunk.allocated = true;
        this._writeChunkHeader(addr, chunk.size, true);
        return { addr: addr, dataAddr: addr + this.HEADER_SIZE, chunk };
      }
    }

    // 2. Check fastbins
    if (alignedSize <= 64 && this.fastbins[sizeClass] && this.fastbins[sizeClass].length > 0) {
      const addr = this.fastbins[sizeClass].pop();
      const chunk = this.chunks.get(addr);
      if (chunk) {
        chunk.allocated = true;
        this._writeChunkHeader(addr, chunk.size, true);
        return { addr: addr, dataAddr: addr + this.HEADER_SIZE, chunk };
      }
    }

    // 3. Check unsorted bin
    for (let i = 0; i < this.unsorted.length; i++) {
      const addr = this.unsorted[i];
      const chunk = this.chunks.get(addr);
      if (chunk && chunk.size >= alignedSize) {
        this.unsorted.splice(i, 1);
        chunk.allocated = true;
        this._writeChunkHeader(addr, chunk.size, true);
        return { addr: addr, dataAddr: addr + this.HEADER_SIZE, chunk };
      }
    }

    // 4. Carve from top chunk
    if (this.topSize >= alignedSize) {
      const addr = this.topAddr;
      this.chunks.set(addr, { size: alignedSize, allocated: true, dataStart: addr + this.HEADER_SIZE });
      this._writeChunkHeader(addr, alignedSize, true);
      this.topAddr += alignedSize;
      this.topSize -= alignedSize;
      // Write new top chunk header
      if (this.topSize > 0) {
        this._writeChunkHeader(this.topAddr, this.topSize, true);
      }
      return { addr: addr, dataAddr: addr + this.HEADER_SIZE, chunk: this.chunks.get(addr) };
    }

    return null; // out of memory
  }

  free(addr) {
    // addr is the chunk start (not data start)
    const chunk = this.chunks.get(addr);
    if (!chunk) return false;
    chunk.allocated = false;

    const sizeClass = chunk.size;

    // Clear data region (write fd/bk)
    const dataStart = addr + this.HEADER_SIZE;

    // Tcache first (max 7 per bin)
    if (!this.tcache[sizeClass]) this.tcache[sizeClass] = [];
    if (this.tcache[sizeClass].length < 7) {
      // Write fd pointer (next in tcache)
      const oldHead = this.tcache[sizeClass].length > 0
        ? this.tcache[sizeClass][this.tcache[sizeClass].length - 1]
        : 0;
      this._writeLE(dataStart, oldHead, 4); // fd = old head
      this.tcache[sizeClass].push(addr);
      this._writeChunkHeader(addr, chunk.size, false);
      return true;
    }

    // Fastbin (if small enough)
    if (sizeClass <= 64) {
      if (!this.fastbins[sizeClass]) this.fastbins[sizeClass] = [];
      const oldHead = this.fastbins[sizeClass].length > 0
        ? this.fastbins[sizeClass][this.fastbins[sizeClass].length - 1]
        : 0;
      this._writeLE(dataStart, oldHead, 4); // fd
      this.fastbins[sizeClass].push(addr);
      this._writeChunkHeader(addr, chunk.size, false);
      return true;
    }

    // Unsorted bin
    this._writeLE(dataStart, 0, 4);     // fd
    this._writeLE(dataStart + 4, 0, 4); // bk
    this.unsorted.push(addr);
    this._writeChunkHeader(addr, chunk.size, false);
    return true;
  }

  _writeChunkHeader(addr, size, inUse) {
    this._writeLE(addr, 0, 4);  // prev_size
    this._writeLE(addr + 4, inUse ? (size | 1) : size, 4);  // size + prev_in_use flag
  }

  write(offset, bytes) {
    for (let i = 0; i < bytes.length && offset + i < this.memorySize; i++) {
      this.memory[offset + i] = bytes[i];
      this.written[offset + i] = 1;
    }
  }

  read(offset, size) {
    const result = [];
    for (let i = 0; i < size && offset + i < this.memorySize; i++) {
      result.push(this.memory[offset + i]);
    }
    return result;
  }

  getChunksForDisplay() {
    const chunks = [];
    for (const [addr, chunk] of this.chunks) {
      chunks.push({
        addr: this.baseAddr + addr,
        rawAddr: addr,
        size: chunk.size,
        allocated: chunk.allocated,
        dataStart: addr + this.HEADER_SIZE,
        prevSize: this._readLE(addr, 4),
        sizeField: this._readLE(addr + 4, 4),
        fd: chunk.allocated ? null : this._readLE(addr + this.HEADER_SIZE, 4),
        bk: chunk.allocated ? null : this._readLE(addr + this.HEADER_SIZE + 4, 4),
      });
    }
    chunks.sort((a, b) => a.rawAddr - b.rawAddr);
    return chunks;
  }

  getFreeLists() {
    return {
      tcache: { ...this.tcache },
      fastbins: { ...this.fastbins },
      unsorted: [...this.unsorted],
    };
  }

  markRegion(start, end) {
    this.highlight = { start, end };
    for (let i = start; i < end && i < this.memorySize; i++) {
      this.written[i] = 1;
    }
  }

  clearHighlight() {
    this.highlight = { start: -1, end: -1 };
  }
}
```

- [ ] **Step 2: Test HeapSim in console**

Open browser console and verify:
```javascript
const h = new HeapSim(256);
const a = h.malloc(16); // should carve from top
const b = h.malloc(16);
h.free(a.addr);         // should go to tcache
const c = h.malloc(16); // should return a's address
console.log(c.addr === a.addr); // true
```

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: HeapSim class — glibc-like heap allocator simulation"
```

---

### Task 9: Heap Visualization Renderer

**Files:**
- Modify: `index.html` (add heap viz CSS, renderHeap function, vizMode switching)

- [ ] **Step 1: Add heap visualization CSS**

```css
/* Heap visualization */
#heap-viz { font-size: 12px; }

.heap-memory-strip {
  display: flex; flex-wrap: wrap; gap: 2px; margin-bottom: 1rem;
  padding: 0.5rem; border: 1px solid var(--panel-border);
}

.heap-chunk {
  display: flex; flex-direction: column; border: 1px solid var(--panel-border);
  border-radius: 2px; overflow: hidden; min-width: 4em;
}
.heap-chunk.allocated { border-color: var(--green); }
.heap-chunk.freed { border-color: var(--text-dim); opacity: 0.7; }
.heap-chunk.corrupted { border-color: var(--red); }
.heap-chunk.highlighted { outline: 2px solid var(--yellow); outline-offset: 1px; }

.heap-chunk-header {
  display: flex; font-size: 10px; padding: 2px 4px;
  background: rgba(255,255,255,0.05);
}
.heap-chunk-header .prev-size { color: var(--text-dim); margin-right: 0.5em; }
.heap-chunk-header .size-field { color: var(--amber); }
.heap-chunk-header .flags { color: var(--purple); margin-left: 0.25em; }

.heap-chunk-data {
  padding: 4px; font-size: 11px; min-height: 1.5em;
  display: flex; flex-wrap: wrap; gap: 1px;
}
.heap-chunk-data .byte {
  width: 2em; text-align: center; font-size: 11px;
  padding: 1px 0; border-radius: 1px;
}
.heap-chunk-data .byte.allocated { color: var(--green); background: rgba(78,201,176,0.1); }
.heap-chunk-data .byte.freed { color: var(--text-dim); background: rgba(255,255,255,0.03); }
.heap-chunk-data .byte.pointer { color: var(--amber); background: rgba(206,145,120,0.15); }
.heap-chunk-data .byte.corrupted { color: var(--red); background: rgba(244,71,71,0.2); }

.heap-chunk-label {
  font-size: 10px; color: var(--text-dim); padding: 2px 4px;
  text-align: center; border-top: 1px solid var(--panel-border);
}

/* Free list display */
.free-lists {
  margin-top: 0.75rem; font-size: 11px;
}
.free-lists h4 {
  color: var(--text-dim); font-weight: normal; margin-bottom: 0.35rem;
  text-transform: uppercase; letter-spacing: 0.05em;
}
.free-list-row {
  display: flex; align-items: center; gap: 0.25rem; padding: 0.15rem 0;
  flex-wrap: wrap;
}
.free-list-name { color: var(--blue); width: 10em; }
.free-list-node {
  display: inline-flex; align-items: center; gap: 0.25rem;
}
.free-list-addr {
  color: var(--amber); padding: 1px 4px;
  border: 1px solid var(--panel-border); border-radius: 2px;
}
.free-list-arrow { color: var(--text-dim); }
.free-list-nil { color: var(--text-dim); font-style: italic; }

/* Function pointer table */
.func-ptr-table {
  margin-top: 0.75rem; font-size: 11px;
}
.func-ptr-table h4 {
  color: var(--text-dim); font-weight: normal; margin-bottom: 0.35rem;
  text-transform: uppercase; letter-spacing: 0.05em;
}
.func-ptr-row { display: flex; gap: 0.75rem; padding: 0.15rem 0; }
.func-ptr-name { color: var(--yellow); width: 10em; }
.func-ptr-val { color: var(--amber); }
.func-ptr-val.overwritten { color: var(--red); animation: flash 0.4s ease; }

/* Top chunk */
.heap-top-chunk {
  border: 1px dashed var(--text-dim); border-radius: 2px;
  padding: 4px 8px; font-size: 10px; color: var(--text-dim);
  text-align: center; flex: 1; min-width: 4em;
}
```

- [ ] **Step 2: Add renderHeap() function**

```javascript
function renderHeap() {
  const heap = state.heap;
  if (!heap) return;

  const el = document.getElementById('stack-viz');
  el.innerHTML = '';

  // Change panel header
  document.querySelector('#stack-panel .panel-hdr').innerHTML =
    'heap <span id="stack-info">— ' + heap.memorySize + ' bytes</span>';

  // Chunk strip
  const strip = document.createElement('div');
  strip.className = 'heap-memory-strip';

  const chunks = heap.getChunksForDisplay();
  chunks.forEach(chunk => {
    const chunkEl = document.createElement('div');
    chunkEl.className = 'heap-chunk ' + (chunk.allocated ? 'allocated' : 'freed');
    if (chunk.rawAddr >= heap.highlight.start && chunk.rawAddr < heap.highlight.end) {
      chunkEl.classList.add('highlighted');
    }

    // Header
    const header = document.createElement('div');
    header.className = 'heap-chunk-header';
    header.innerHTML = `<span class="prev-size">ps:${hex8(chunk.prevSize)}</span>` +
      `<span class="size-field">sz:${hex8(chunk.sizeField)}</span>` +
      `<span class="flags">${chunk.sizeField & 1 ? 'P' : '-'}</span>`;
    chunkEl.appendChild(header);

    // Data bytes
    const data = document.createElement('div');
    data.className = 'heap-chunk-data';
    const dataSize = chunk.size - heap.HEADER_SIZE;
    for (let i = 0; i < Math.min(dataSize, 32); i++) {
      const byteEl = document.createElement('span');
      byteEl.className = 'byte ' + (chunk.allocated ? 'allocated' : 'freed');
      if (!chunk.allocated && i < 4) byteEl.classList.add('pointer'); // fd
      if (!chunk.allocated && i >= 4 && i < 8) byteEl.classList.add('pointer'); // bk
      byteEl.textContent = hex2(heap.memory[chunk.dataStart + i] || 0);
      data.appendChild(byteEl);
    }
    if (dataSize > 32) {
      const more = document.createElement('span');
      more.className = 'byte freed';
      more.textContent = '...';
      data.appendChild(more);
    }
    chunkEl.appendChild(data);

    // Label
    const label = document.createElement('div');
    label.className = 'heap-chunk-label';
    label.textContent = (chunk.allocated ? 'alloc ' : 'free ') + chunk.size + 'B @ ' + hex8(chunk.addr);
    chunkEl.appendChild(label);

    strip.appendChild(chunkEl);
  });

  // Top chunk
  if (heap.topSize > 0) {
    const topEl = document.createElement('div');
    topEl.className = 'heap-top-chunk';
    topEl.textContent = 'top chunk — ' + heap.topSize + ' bytes remaining';
    strip.appendChild(topEl);
  }

  el.appendChild(strip);

  // Free lists
  const listsEl = document.createElement('div');
  listsEl.className = 'free-lists';
  listsEl.innerHTML = '<h4>Recycling Lists (Free Lists)</h4>';

  const lists = heap.getFreeLists();

  // Tcache
  for (const [size, addrs] of Object.entries(lists.tcache)) {
    if (addrs.length === 0) continue;
    const row = document.createElement('div');
    row.className = 'free-list-row';
    row.innerHTML = `<span class="free-list-name">tcache[${size}]:</span>` +
      addrs.map(a => `<span class="free-list-node"><span class="free-list-addr">${hex8(heap.baseAddr + a)}</span><span class="free-list-arrow">→</span></span>`).join('') +
      '<span class="free-list-nil">nil</span>';
    listsEl.appendChild(row);
  }

  // Fastbins
  for (const [size, addrs] of Object.entries(lists.fastbins)) {
    if (addrs.length === 0) continue;
    const row = document.createElement('div');
    row.className = 'free-list-row';
    row.innerHTML = `<span class="free-list-name">fastbin[${size}]:</span>` +
      addrs.map(a => `<span class="free-list-node"><span class="free-list-addr">${hex8(heap.baseAddr + a)}</span><span class="free-list-arrow">→</span></span>`).join('') +
      '<span class="free-list-nil">nil</span>';
    listsEl.appendChild(row);
  }

  // Unsorted
  if (lists.unsorted.length > 0) {
    const row = document.createElement('div');
    row.className = 'free-list-row';
    row.innerHTML = `<span class="free-list-name">unsorted:</span>` +
      lists.unsorted.map(a => `<span class="free-list-node"><span class="free-list-addr">${hex8(heap.baseAddr + a)}</span><span class="free-list-arrow">→</span></span>`).join('') +
      '<span class="free-list-nil">nil</span>';
    listsEl.appendChild(row);
  }

  el.appendChild(listsEl);

  // Function pointer table
  if (Object.keys(heap.funcPtrs).length > 0) {
    const fpEl = document.createElement('div');
    fpEl.className = 'func-ptr-table';
    fpEl.innerHTML = '<h4>Function Pointers</h4>';
    for (const [name, val] of Object.entries(heap.funcPtrs)) {
      const sym = Object.entries(state.symbols).find(([, a]) => a === val);
      const symName = sym ? ' (' + sym[0] + ')' : '';
      fpEl.innerHTML += `<div class="func-ptr-row">
        <span class="func-ptr-name">${name}</span>
        <span class="func-ptr-val">${hex8(val)}${symName}</span>
      </div>`;
    }
    el.appendChild(fpEl);
  }
}
```

- [ ] **Step 3: Add vizMode switching logic**

In `loadExercise()`, after setting up the sim:

```javascript
// Determine viz mode
const vizMode = ex.vizMode || 'stack';
if (vizMode === 'heap' || vizMode === 'both') {
  state.heap = new HeapSim(ex.heapSize || 512);
  if (ex.heapSetup) ex.heapSetup(state.heap);
}
```

Modify `renderStack()` to check vizMode:
```javascript
function renderViz() {
  const ex = typeof state.currentEx === 'number' ? EXERCISES[state.currentEx] : null;
  const vizMode = (ex && ex.vizMode) || 'stack';
  if (vizMode === 'heap') {
    renderHeap();
  } else if (vizMode === 'both') {
    renderHeapAndStack();
  } else {
    renderStack();
  }
}
```

Replace all calls to `renderStack()` with `renderViz()` throughout the codebase.

- [ ] **Step 4: Test heap rendering**

Create a temporary test exercise or use the console to:
```javascript
state.heap = new HeapSim(256);
state.heap.malloc(16);
state.heap.malloc(16);
state.heap.free(0);
renderHeap();
```
Verify chunks, free list, and top chunk render correctly.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: heap visualization renderer with chunk display and free lists"
```

---

### Task 10: Exercises 15–18 — Heap Fundamentals

**Files:**
- Modify: `index.html` (add 4 heap exercises with guided step logic)

- [ ] **Step 1: Add exercise 15 — The Heap (guided walkthrough)**

Predefined steps like exercise 01. Each step calls heap.malloc() or heap.free() and the viz updates.

```javascript
{
  title: '15: The Heap',
  unit: 4,
  desc: 'The <strong>heap</strong> is another region of memory, used when the program asks for memory at runtime with <strong>malloc()</strong>. Each block has a small header (metadata) followed by your data. When you <strong>free()</strong> a block, it goes on a recycling list — and the next malloc of the same size gets it back.',
  // ... code showing malloc/free usage
  mode: 'step',
  vizMode: 'heap',
  heapSize: 256,
  heapSetup(heap) {
    // Start with empty heap
  },
  steps: [
    { action: 'init', log: ['info', 'The heap starts as one big block of empty memory — the "top chunk" (leftover space).'] },
    { action: 'malloc', size: 16, name: 'A', log: ['action', 'malloc(16) — carve a 24-byte block from the top (16 data + 8 header)'] },
    { action: 'malloc', size: 16, name: 'B', log: ['action', 'malloc(16) — second block carved, right after the first'] },
    { action: 'free', name: 'A', log: ['action', 'free(A) — block A goes to the recycling list. Notice the pointer (fd) that appeared in its data.'] },
    { action: 'free', name: 'B', log: ['action', 'free(B) — block B also freed. Its fd pointer points to A, forming a chain.'] },
    { action: 'malloc', size: 16, name: 'C', log: ['action', 'malloc(16) — the allocator checks the recycling list first. B comes back (last in, first out)!'] },
    { action: 'done', log: ['success', 'The heap allocator recycles freed blocks. This is important — when you free memory and it gets reused, the new data occupies the SAME location as the old data.'] },
  ],
  check() { return false; },
},
```

Add a heap step handler in `doStep()` for heap guided exercises.

- [ ] **Step 2: Add exercise 16 — Use-After-Free**

Guided heap exercise with decision points. Steps: malloc User struct, set function pointer, free, malloc Note (same size = lands in same spot), user enters win() address as the data → when old pointer is called, it jumps to win().

- [ ] **Step 3: Add exercise 17 — Double Free**

Guided with decision points. Steps show the circular free list forming, then user picks the target address for the fd overwrite.

- [ ] **Step 4: Add exercise 18 — Heap Overflow**

Semi-guided. Two adjacent chunks, user overflows from A into B's header. Crafts overflow payload in hex.

- [ ] **Step 5: Add heap guided step execution**

In `doStep()`, add a branch for heap exercises:

```javascript
if (ex && ex.vizMode === 'heap' && ex.mode === 'step') {
  if (state.stepIndex >= ex.steps.length) {
    state.completed.add(state.currentEx);
    saveProgress();
    renderNav();
    return;
  }
  const step = ex.steps[state.stepIndex];
  executeHeapStep(step);
  state.stepIndex++;
  renderHeap();
  renderLog();
  return;
}
```

```javascript
function executeHeapStep(step) {
  const heap = state.heap;
  if (!heap) return;

  if (step.action === 'malloc') {
    const result = heap.malloc(step.size);
    if (result && step.name) {
      state.heapNames = state.heapNames || {};
      state.heapNames[step.name] = result.addr;
    }
  } else if (step.action === 'free') {
    const addr = state.heapNames[step.name];
    if (addr !== undefined) heap.free(addr);
  }

  step.log.forEach(([cls, msg]) => log(cls, msg));
}
```

- [ ] **Step 6: Add decision point UI for guided heap exercises**

When a step has `decision: true`, show an input field and wait for the user's answer before continuing.

- [ ] **Step 7: Update UNITS array**

```javascript
{ id: 4, name: 'HEAP', exercises: [14, 15, 16, 17] },  // indices for ex 15-18
```

- [ ] **Step 8: Test all 4 exercises**

- Ex 15: step through, see heap build up and tear down
- Ex 16: step through UAF, enter win() address at decision point → win
- Ex 17: step through double free, enter target address → win
- Ex 18: craft overflow payload → corrupt chunk B → win

- [ ] **Step 9: Commit**

```bash
git add index.html
git commit -m "feat: exercises 15-18 — heap fundamentals (heap intro, UAF, double free, heap overflow)"
```

---

### Task 11: Exercises 19–22 — Heap Exploitation Part 1

**Files:**
- Modify: `index.html` (add tcache poisoning, fastbin dup, unsorted bin attack, house of force)

- [ ] **Step 1: Add exercise 19 — Tcache Poisoning**

Free b, overwrite b's fd (via UAF), next malloc returns attacker's address. User enters target in hex. Viz shows tcache chain mutation.

- [ ] **Step 2: Add exercise 20 — Fastbin Dup**

Pre-fill tcache to force fastbin usage. Free A, free B, free A (bypass head check). User enters target for fd overwrite. Viz shows circular list and the check bypass.

- [ ] **Step 3: Add exercise 21 — Unsorted Bin Attack**

Large malloc to avoid tcache/fastbin. Free to unsorted bin. UAF to corrupt bk. Next malloc triggers write of main_arena to target. Viz shows the doubly-linked list and the write.

- [ ] **Step 4: Add exercise 22 — House of Force**

Overflow into top chunk size (set to 0xFFFFFFFF). User calculates evil malloc size. Viz shows top chunk pointer wrapping to target. Hex calculator available.

- [ ] **Step 5: Update UNITS, test, commit**

```bash
git add index.html
git commit -m "feat: exercises 19-22 — tcache poisoning, fastbin dup, unsorted bin, house of force"
```

---

### Task 12: Exercises 23–26 — Heap Exploitation Part 2 (House of X)

**Files:**
- Modify: `index.html` (add house of spirit, orange, einherjar, lore)

- [ ] **Step 1: Add exercise 23 — House of Spirit**

User crafts fake chunk on stack (correct size field + flags). Free the fake chunk. Next malloc returns the stack address. Viz shows allocator accepting the fake chunk.

- [ ] **Step 2: Add exercise 24 — House of Orange**

Guided walkthrough. No free() available. Corrupt top chunk size → large malloc forces old top to unsorted bin → abuse _IO_FILE vtable. Multi-phase guided with decision points.

- [ ] **Step 3: Add exercise 25 — House of Einherjar**

Off-by-one null byte clears prev_in_use flag. Free triggers backward consolidation. Viz zooms into the flag byte. User controls the null byte offset.

- [ ] **Step 4: Add exercise 26 — House of Lore**

Corrupt smallbin bk → fake chunk with fd pointing back to real bin. Viz shows the doubly-linked list check. User sets up both pointers.

- [ ] **Step 5: Update UNITS, test, commit**

```bash
git add index.html
git commit -m "feat: exercises 23-26 — house of spirit, orange, einherjar, lore"
```

---

### Task 13: Exercises 27–28 — Final Challenges

**Files:**
- Modify: `index.html` (add full chain and blind chain exercises, add "both" viz mode renderer)

- [ ] **Step 1: Add renderHeapAndStack() for "both" viz mode**

Split the viz panel: heap on top half, mini stack on bottom half.

```javascript
function renderHeapAndStack() {
  const el = document.getElementById('stack-viz');
  el.innerHTML = '';
  document.querySelector('#stack-panel .panel-hdr').innerHTML = 'heap + stack';

  const heapDiv = document.createElement('div');
  heapDiv.id = 'heap-section';
  heapDiv.style.cssText = 'border-bottom:1px solid var(--panel-border);padding-bottom:0.5rem;margin-bottom:0.5rem';
  el.appendChild(heapDiv);

  const stackDiv = document.createElement('div');
  stackDiv.id = 'stack-section';
  el.appendChild(stackDiv);

  // Render heap into heapDiv
  renderHeapInto(heapDiv);
  // Render compact stack into stackDiv
  renderStackInto(stackDiv);
}
```

- [ ] **Step 2: Add exercise 27 — Full Chain**

Multi-bug program with integer overflow + heap overflow + format string leak + function pointer overwrite. The exercise has a multi-phase step engine:
1. Phase 1: user enters count (integer overflow)
2. Phase 2: malloc with tiny size, loop overflows heap
3. Phase 3: format string leak shows an address in the log
4. Phase 4: user enters payload to overwrite function pointer
5. Execute: function pointer called → win or crash

Hex calculator available. Description gives high-level hints about attack order.

- [ ] **Step 3: Add exercise 28 — Blind Chain**

Same multi-bug concept, different code. Zero labels on the viz — `showLabels: false` flag. No symbol table, no calculator, no color-coded regions. Raw hex only.

- [ ] **Step 4: Add badge display for final challenges**

Exercise 27 completion shows "Full Chain" badge, exercise 28 shows "Certified Hacker" badge in the header.

- [ ] **Step 5: Update UNITS, test both exercises, commit**

```bash
git add index.html
git commit -m "feat: exercises 27-28 — full chain and blind chain final challenges"
```

---

### Task 14: Polish and Integration Testing

**Files:**
- Modify: `index.html` (fix edge cases, test all 28 exercises, fix nav edge cases)

- [ ] **Step 1: Test all Unit 1 exercises still work**

Verify exercises 01–05 are completely unchanged in behavior.

- [ ] **Step 2: Test unit unlock logic**

- Fresh localStorage: only Unit 1 visible
- Complete Unit 1: Units 2–5 unlock
- Complete all units: Final Challenge unlocks
- Exercises within units unlock sequentially

- [ ] **Step 3: Test badge persistence**

- Complete all of Unit 1 → "Stack Smasher" badge appears
- Refresh page → badge still shows
- Complete Unit 4 → "Heap Explorer" appears alongside Stack Smasher

- [ ] **Step 4: Test heap exercises**

Walk through exercises 15–26, verify each:
- Heap viz updates correctly on each step
- Free lists show correct chains
- Function pointer overwrites register and display correctly
- Win conditions trigger properly

- [ ] **Step 5: Test final challenges**

- Exercise 27: complete the multi-phase chain → FLAG{full_chain_master}
- Exercise 28: complete with no hints → FLAG{you_are_ready}

- [ ] **Step 6: Cross-browser test**

Test in Chrome and Firefox. Check for layout issues, console errors.

- [ ] **Step 7: Final commit**

```bash
git add index.html
git commit -m "polish: integration testing and edge case fixes for 28-exercise curriculum"
```

---

## Implementation Notes

- **Exercise indices:** When adding exercises, the EXERCISES array index IS the exercise's internal ID. Exercise 06 = EXERCISES[5], exercise 15 = EXERCISES[14], etc. Update UNITS arrays accordingly.
- **File size management:** The file will be ~5500 lines. This is large but acceptable for a single-page teaching tool with no build step.
- **Heap exercises share infrastructure:** HeapSim, renderHeap(), and the heap step execution are shared across all heap exercises. Each exercise just defines different heapSetup, steps, and check functions.
- **Backward compatibility:** Exercises 01–05 must not change at all. The StackSim class is untouched. The only changes to existing code are: renderNav() rewrite, renderStack→renderViz rename, saveProgress/loadProgress hooks, and the title change.
