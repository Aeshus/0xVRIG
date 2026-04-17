# Memory Corruption Curriculum — Design Spec

## Overview

Expand the existing stack buffer overflow teaching tool into a full 28-exercise curriculum covering stack attacks, logic bugs, heap exploitation, and advanced glibc heap techniques. Designed as a ramp-up project for new security club members — from complete beginners to CTF-ready.

Single self-contained `index.html`. No dependencies, no build step. Browser-only.

## Audience

High school students through college club members. Exercises start with zero assumed knowledge and ramp to real-world CTF difficulty. Language throughout is beginner-friendly (e.g., "go-back address" alongside "return address"), matching the tone already established in the existing exercises.

## Curriculum Structure

### Unit 1: Stack Attacks (Exercises 01–05) — EXISTS

No changes. Already implemented and tested.

| # | Title | Concept | Interaction |
|---|-------|---------|-------------|
| 01 | The Stack Frame | Stack layout: buffer, saved EBP, return address | Step-through guided |
| 02 | The Overflow | gets() with no bounds check, crash via corrupted return addr | Text input, win on SIGSEGV |
| 03 | Hijack Execution | Overwrite return address with win() address | Hex payload + builder |
| 04 | Randomized Addresses | ASLR, info leak of main(), offset calculation | Hex payload + calculator |
| 05 | The Tripwire | Stack canary, format string leak to bypass | Hex payload + canary field |

### Unit 2: Logic Bugs (Exercises 06–10) — NEW

These use the existing stack simulation engine. Each introduces a new bug class that ultimately corrupts memory.

| # | Title | Concept | Interaction |
|---|-------|---------|-------------|
| 06 | Integer Overflow | `len + header` wraps to small value, undersized buffer allocated, input overflows it | User picks a length value, viz shows the wrap on a number line, then the overflow |
| 07 | Format String: Reading | `printf(user_input)` with `%x` reads stack values | User types format specifiers, viz highlights which stack slot each `%x` reads |
| 08 | Format String: Writing | `%n` writes the count of printed chars to a stack address | User crafts format string to overwrite a specific variable, viz shows the write |
| 09 | Off-by-One | `for (i = 0; i <= len; i++)` writes one byte past buffer, corrupts low byte of saved EBP | User controls the final byte, viz shows frame pointer shift, second return hijacked |
| 10 | Signedness Bug | Signed/unsigned comparison: negative length passes a bounds check but wraps to huge value in memcpy | User enters a negative number, viz shows it pass the `if (len < MAX)` check, then wrap to 0xFFFF... in the copy |

#### Exercise 06: Integer Overflow — Detail

**Source code shown:**
```c
void process(int user_len) {
    int total = user_len + 64;  // header size
    char *buf = alloca(total);  // allocate on stack
    read_input(buf, user_len);  // reads user_len bytes
}
```

**Visualization:** A number line from 0 to 0xFFFFFFFF that wraps around. User drags a slider or enters a value for `user_len`. When `user_len` is close to `0xFFFFFFFF`, adding 64 wraps to a small number. The stack viz shows the tiny buffer being allocated, then the full `user_len` bytes being written — massive overflow.

**Win condition:** Overwrite the return address with win()'s address. The payload builder is available.

#### Exercise 07: Format String Reading — Detail

**Source code shown:**
```c
void vuln() {
    char buf[64];
    fgets(buf, 64, stdin);
    printf(buf);  // BUG: user input as format string
}
```

**Visualization:** The stack panel shows the full stack frame. When the user types `%x`, the viz highlights the next 4 bytes on the stack that printf will read and shows the value in the log. Each additional `%x` walks up the stack. The user's goal is to find and read the canary value (or a specific secret value placed on the stack).

**Win condition:** Successfully leak the target value (displayed in the log matches the hidden value).

#### Exercise 08: Format String Writing — Detail

**Source code shown:**
```c
int authorized = 0;
void vuln() {
    char buf[64];
    fgets(buf, 64, stdin);
    printf(buf);  // user controls format string
    if (authorized) win();
}
```

**Visualization:** Stack shows `authorized` variable at a known address. The user needs to use `%n` (which writes the number of bytes printed so far to the address pointed to by the next stack argument). The viz shows the write happening — bytes changing in the `authorized` variable's memory.

**Win condition:** `authorized` becomes non-zero after printf returns.

#### Exercise 09: Off-by-One — Detail

**Source code shown:**
```c
void vuln() {
    char buf[16];
    int i;
    for (i = 0; i <= 16; i++) {  // should be < 16
        buf[i] = read_byte();
    }
}
```

**Visualization:** Standard stack viz, but when the 17th byte is written, it overlaps the low byte of saved EBP. The viz zooms in on the EBP region and shows how changing one byte shifts where the frame pointer points. On function return, EBP is restored to the corrupted value. When the *calling* function returns, it uses the corrupted EBP to find *its* return address — which now points to attacker-controlled data.

The exercise steps through TWO function returns: first vuln()'s (looks normal), then main()'s (hijacked). This is the key insight — off-by-one doesn't give you direct control of the return address, it gives you indirect control through the frame pointer.

**Win condition:** The second return jumps to win().

#### Exercise 10: Signedness Bug — Detail

**Source code shown:**
```c
void copy_data(int len) {
    char buf[64];
    if (len > 64) {  // signed comparison
        printf("Too long!\n");
        return;
    }
    memcpy(buf, input, (size_t)len);  // cast to unsigned
}
```

**Visualization:** Shows the comparison check passing (len = -1 is < 64 ✓), then the cast: -1 becomes 0xFFFFFFFF as an unsigned value. The memcpy tries to copy ~4 billion bytes. In our sim, we cap it but show the overflow writing way past the buffer.

**Win condition:** Overwrite return address with win().

### Unit 3: Stack Attacks II (Exercises 11–14) — NEW

Advanced stack exploitation. These assume the user understands stack layout, overflow, and basic protections from Units 1–2.

| # | Title | Concept | Interaction |
|---|-------|---------|-------------|
| 11 | Return to Libc | NX is on, can't run shellcode — call system("/bin/sh") by setting up the stack with function address + return address + argument pointer | User arranges stack: [system addr] [dummy ret] ["/bin/sh" addr]. Viz shows the fake call frame. |
| 12 | ROP Basics | Chain small instruction snippets (gadgets) ending in RET to do multiple operations | User picks gadgets from a table, chains them. Viz shows EIP hopping gadget to gadget. |
| 13 | Stack Pivot | xchg eax, esp gadget redirects the stack to attacker-controlled heap/buffer, then ROP from there | Viz shows ESP jumping to a different memory region, then ROP chain executing from the new location. |
| 14 | SROP | sigreturn syscall restores ALL registers from a frame on the stack — one gadget, total control | User fills out a signal frame template (EIP, ESP, EAX, etc.), viz shows all registers being set at once. |

#### Exercise 11: Return to Libc — Detail

**Source code shown:**
```c
// NX enabled — stack is not executable
void vuln() {
    char buf[16];
    gets(buf);
}
// Available in libc:
// system() @ 0x08048200
// "/bin/sh" @ 0x08049300
```

**Visualization:** Standard stack viz with NX indicator. The symbol table shows system() and the "/bin/sh" string address. The user needs to construct: [16 padding] [4 junk EBP] [system() addr] [fake return addr] ["/bin/sh" addr].

The key teaching moment: when `vuln()` returns, it jumps to `system()`. The CPU treats the stack as if system() was called normally — the next value is system()'s "return address" (can be junk), and the value after that is system()'s first argument.

**Win condition:** system() is called with the correct argument pointer.

#### Exercise 12: ROP Basics — Detail

**Source code shown:**
```c
void vuln() {
    char buf[16];
    gets(buf);
}
// NX + ASLR on, but binary is not PIE
```

**New UI element:** Gadget table showing available gadgets:
```
0x08048100: pop eax; ret
0x08048104: pop ebx; ret
0x08048108: mov [ebx], eax; ret
0x0804810c: xor eax, eax; ret
```

**Visualization:** The stack viz shows the ROP chain laid out. As execution steps through, the viz highlights which gadget is executing, shows register values changing, and shows EIP bouncing from gadget to gadget via the return addresses on the stack.

**Win condition:** Chain gadgets to write the value `0x1` to a specific address (a "flag" variable), then return to win().

#### Exercise 13: Stack Pivot — Detail

**Source code shown:**
```c
void vuln() {
    char buf[16];
    gets(buf);
}
// Tiny overflow — only control 4 bytes (return address)
// Not enough room for a ROP chain on the stack
// But buf is at a known address...
```

**Gadget table includes:** `xchg eax, esp; ret` and `pop eax; ret`

**Visualization:** Two memory panels — the original stack and the buffer (which is at a known address). The user writes a ROP chain into the buffer, then uses the overflow to pivot ESP to point at the buffer. The viz shows ESP moving from one panel to the other, then execution continues in the buffer's ROP chain.

**Win condition:** Successfully pivot and execute a ROP chain from the buffer that calls win().

#### Exercise 14: SROP — Detail

**Source code shown:**
```c
void vuln() {
    char buf[128];
    gets(buf);
}
// Only one gadget available:
// 0x08048100: mov eax, 0x77; int 0x80; (sigreturn syscall)
```

**New UI element:** Signal frame template — a form with fields for each register (EIP, ESP, EBP, EAX, EBX, ECX, EDX, EFLAGS, etc.). The user fills in the values they want.

**Visualization:** The stack shows the fake signal frame. When sigreturn executes, ALL register fields highlight simultaneously and the register display updates to show the new values. EIP gets set to win().

**Win condition:** Correctly fill the signal frame so EIP = win() after sigreturn.

### Unit 4: Heap Fundamentals (Exercises 15–18) — NEW

Introduces the heap with a new visualization. Training wheels on.

| # | Title | Concept | Interaction |
|---|-------|---------|-------------|
| 15 | The Heap | malloc/free, chunk metadata (prev_size, size, fd, bk), free list | Step-through guided, like exercise 01 |
| 16 | Use-After-Free | Free chunk A, allocate B same size (gets A's memory), write to B → controls A's data | Guided decision points |
| 17 | Double Free | Free A, free B, free A → circular free list, get overlapping allocations | Guided decision points |
| 18 | Heap Overflow | Write past heap buffer, corrupt adjacent chunk's metadata | User crafts overflow payload, chunk layout visible |

#### Heap Visualization Design

Replaces the stack panel when a heap exercise is active. Shows:

- **Horizontal memory strip** — left-to-right address space (grows right, unlike stack)
- **Chunks** as colored blocks: `[prev_size 4B | size+flags 4B | data... ]`
- Allocated chunks: solid color with data region
- Free chunks: dimmer color, show fd/bk pointer arrows
- **Free list view** below the memory strip — linked list diagram showing the chain of free chunks with arrows
- **Metadata labels** on hover or always visible for guided exercises
- Color scheme: allocated=green, freed=grey, corrupted=red, attacker-controlled=amber

**HeapSim class:**
- `memory[]` — byte array (like StackSim)
- `chunks[]` — list of {addr, size, allocated, fd, bk}
- `tcache_bins[]` — array of singly-linked lists, indexed by size class
- `fastbins[]` — array of singly-linked lists
- `unsorted_bin` — doubly-linked list
- `malloc(size)` — searches tcache → fastbin → unsorted → top chunk
- `free(ptr)` — adds to tcache (if not full) → fastbin (if small) → unsorted
- `top_chunk` — wilderness, tracks remaining heap space
- `function_pointers{}` — simulated GOT/vtable entries that can be overwritten

#### Exercise 15: The Heap — Detail

Guided walkthrough like exercise 01. User clicks Step to see:
1. Program starts — heap is empty, just the top chunk (wilderness)
2. `malloc(16)` — carve 24 bytes from top (16 data + 8 metadata), show chunk structure
3. `malloc(16)` — second chunk carved, show two chunks side by side
4. `free(first)` — chunk goes grey, fd pointer appears pointing to... nowhere (list head)
5. `free(second)` — second chunk freed, fd pointer points to first, forming a list
6. `malloc(16)` — second chunk comes back (LIFO), show it re-allocated

**Win condition:** Complete the walkthrough (auto-completes on final step, like exercise 01).

#### Exercise 16: Use-After-Free — Detail

**Source code shown:**
```c
struct User {
    void (*greet)();  // function pointer
    char name[16];
};

struct User *admin = malloc(sizeof(struct User));
admin->greet = admin_greet;
free(admin);  // freed but pointer not nulled!

// ... later ...
struct Note *note = malloc(sizeof(struct Note)); // same size!
fgets(note->data, 20, stdin);  // user controls data

admin->greet();  // calls whatever is at admin->greet
```

**Visualization:** Heap shows the User chunk being allocated, freed, then a Note chunk landing in the same spot. The user's input overwrites the bytes where `greet` function pointer was. When `admin->greet()` is called, the viz shows it reading the function pointer from the attacker-controlled data.

**Interaction:** User enters the address they want the function pointer to be (guided — shown the symbol table with win()). The viz steps through malloc/free/malloc and shows the overlap.

**Win condition:** `admin->greet()` calls win().

#### Exercise 17: Double Free — Detail

**Source code shown:**
```c
char *a = malloc(16);
char *b = malloc(16);
free(a);
free(b);
free(a);  // double free! a is freed again

char *c = malloc(16);  // returns a
// c and a point to the same memory
// c's first 4 bytes are the fd pointer for the free list
fgets(c, 16, stdin);  // overwrite fd with target address

char *d = malloc(16);  // returns b
char *e = malloc(16);  // returns... target address!
```

**Visualization:** Free list diagram is the star here. Shows:
1. After three frees: free list = a → b → a (circular arrow highlighted red)
2. malloc returns a (as c). User writes into c, overwriting a's fd pointer
3. Free list now = b → [user's address]
4. malloc returns b (as d)
5. malloc returns the user's target address (as e) — attacker controls where malloc returns!

**Interaction:** User enters the target address for the fd pointer overwrite. The viz shows the free list mutation in real time.

**Win condition:** The final malloc returns the address of a function pointer table, and the user overwrites it with win().

#### Exercise 18: Heap Overflow — Detail

**Source code shown:**
```c
struct {
    char buf[16];
    int admin;
} data;

data *d = malloc(sizeof(data));
gets(d->buf);  // no bounds check within the struct

// But also: adjacent chunk metadata corruption
char *a = malloc(16);
char *b = malloc(16);
gets(a);  // overflow into b's chunk header
```

**Visualization:** Two views — first shows intra-struct overflow (buf overflows into admin field, simple). Second shows inter-chunk overflow: chunk A and chunk B side by side, user overflows A's data into B's prev_size and size fields. When B is freed with corrupted metadata, the allocator misbehaves.

**Win condition:** Part 1 — set `admin` to non-zero. Part 2 — corrupt chunk B's size to cause a consolidation error that overlaps a function pointer.

### Unit 5: Heap Exploitation (Exercises 19–26) — NEW

Training wheels off. Real glibc techniques.

| # | Title | Concept | Difficulty |
|---|-------|---------|-----------|
| 19 | Tcache Poisoning | Overwrite tcache fd → malloc returns arbitrary address | Medium |
| 20 | Fastbin Dup | Double-free with fastbins, bypass double-free check using alternating frees | Medium |
| 21 | Unsorted Bin Attack | Corrupt unsorted bin's bk → write `main_arena` address to arbitrary location | Hard |
| 22 | House of Force | Overflow top chunk size to 0xFFFFFFFF, calculated malloc wraps pointer to target | Hard |
| 23 | House of Spirit | Craft fake chunk at target address, free it, next malloc returns target | Hard |
| 24 | House of Orange | No free() in the program — corrupt top chunk to force unsorted bin allocation, abuse _IO_FILE vtable | Very Hard |
| 25 | House of Einherjar | Off-by-one null byte, corrupt prev_in_use flag, trigger backward consolidation to overlap chunks | Very Hard |
| 26 | House of Lore | Corrupt smallbin bk pointer, pass the bk->fd==victim check by crafting a fake chunk, get arbitrary malloc return | Very Hard |

#### Exercise 19: Tcache Poisoning — Detail

**Source code shown:**
```c
char *a = malloc(32);
char *b = malloc(32);
free(a);
free(b);
// tcache[32]: b → a

// UAF: can still write to b
read(0, b, 8);  // overwrite b's fd pointer

char *c = malloc(32);  // returns b
char *d = malloc(32);  // returns... attacker's address!
```

**Visualization:** Tcache bin shown as a simple singly-linked list (simpler than fastbin — no size check in glibc < 2.32). User overwrites b's fd to point to the target. Viz shows the tcache chain mutation and the final malloc returning the target address.

**Interaction:** User enters the target address. No payload builder — raw hex input for the fd overwrite. Symbol table visible.

**Win condition:** Final malloc returns address of function pointer, user overwrites it.

#### Exercise 20: Fastbin Dup — Detail

**Source code shown:**
```c
// tcache is full (7 entries) — allocations go to fastbins
char *a = malloc(32);
char *b = malloc(32);
free(a);  // fastbin[32]: a
free(b);  // fastbin[32]: b → a
free(a);  // fastbin[32]: a → b → a (circular!)
// glibc only checks: is head == ptr? b != a, so it passes

char *c = malloc(32);  // returns a
*(size_t *)c = target_addr;  // overwrite a's fd
char *d = malloc(32);  // returns b
char *e = malloc(32);  // returns a (again)
char *f = malloc(32);  // returns target_addr!
```

**Visualization:** Free list diagram shows the circular chain forming. Key teaching moment: the viz highlights glibc's check (`head == ptr?`) and shows why inserting B between the two frees of A bypasses it. After the fd overwrite, the free list shows the fake entry and the final malloc returning the target address.

**Interaction:** User enters the target address for the fd overwrite. Viz shows each malloc/free and the free list state.

**Win condition:** Final malloc returns the function pointer table address, user overwrites it with win().

#### Exercise 21: Unsorted Bin Attack — Detail

**Source code shown:**
```c
char *a = malloc(256);  // large enough to avoid fastbin/tcache
char *b = malloc(256);  // prevent consolidation with top
free(a);  // a goes to unsorted bin

// UAF: attacker can overwrite a's bk pointer
*(size_t *)(a + 4) = target_addr - 8;  // bk = target - 8

char *c = malloc(256);  // triggers unsorted bin scan
// During the scan, glibc writes: bk->fd = unsorted_bin_head
// That means: *(target_addr) = main_arena address (a large value)
```

**Visualization:** Unsorted bin shown as a doubly-linked list. When bk is corrupted, the viz shows the write: glibc writes the `main_arena` address to `bk->fd` (which is `target_addr`). The teaching moment: you can't control *what* value gets written (it's always the main_arena pointer), but you can write a large non-zero value to *any* address. The viz shows the target variable changing to a huge number.

**Interaction:** User enters the target address. The viz animates the unsorted bin unlinking and the write.

**Win condition:** Overwrite the `authorized` variable (like exercise 08) — any non-zero value passes the check, and the main_arena pointer is definitely non-zero.

#### Exercise 22: House of Force — Detail

**Source code shown:**
```c
char *buf = malloc(256);
gets(buf);  // overflow reaches the top chunk
// Top chunk size is now 0xFFFFFFFF

// Attacker calculates: target_addr - top_addr - 8 = evil_size
char *pad = malloc(evil_size);  // advances top chunk pointer
char *target = malloc(16);       // top chunk now at target address!
```

**Visualization:** Shows the heap linearly with the top chunk at the end. Overflow corrupts the top chunk's size. Then the calculated malloc advances the top chunk's pointer (wrapping around via integer overflow) to land exactly at the target. The "pointer math" is shown step by step with the hex calculator available.

**Interaction:** User must:
1. Overflow to corrupt top chunk size to 0xFFFFFFFF
2. Calculate the evil malloc size (hex calculator available)
3. Enter the size value

**Win condition:** The final malloc returns the target address (function pointer table).

#### Exercise 24: House of Orange — Detail

The hardest guided exercise before the final challenge.

**Source code shown:**
```c
// NOTE: there is NO call to free() in this program
char *buf = malloc(256);
gets(buf);  // overflow into top chunk

// ... program does more mallocs ...
malloc(0x1000);  // larger than corrupted top chunk
// Forces: old top → unsorted bin, new top from mmap
```

**Visualization:** Multi-phase:
1. Show top chunk corruption (size set to smaller value, prev_in_use preserved)
2. Large malloc triggers: old top chunk goes to unsorted bin (animated)
3. Unsorted bin chunk's bk is corrupted to point to a fake `_IO_FILE` struct
4. When the program tries to use the file operations, it follows the vtable pointer to win()

This exercise is more of a guided walkthrough with decision points, given its complexity. The user makes key choices (what size to set the top chunk to, where to point the fake vtable) but the multi-step allocator behavior is animated rather than requiring raw payloads for every step.

#### Exercises 23, 25, 26

Follow the same pattern as above: source code shown, heap viz active, guided or semi-guided interaction depending on complexity. Each teaches one specific technique.

- **House of Spirit (23):** User crafts fake chunk metadata (size field with correct flags) at a stack address, frees it, next malloc returns the stack address. Viz shows the allocator accepting the fake chunk.
- **House of Einherjar (25):** Off-by-one null byte clears prev_in_use flag on adjacent chunk. When that chunk is freed, allocator consolidates backward into an already-allocated chunk, creating overlap. Viz zooms into the flag byte and shows the consolidation.
- **House of Lore (26):** Corrupt smallbin bk to point to fake chunk. Fake chunk's fd must point back to the real bin entry (to pass the sanity check). Viz shows the doubly-linked list and the check. User must set up both the bk pointer and the fake chunk's fd.

### Final Challenge (Exercises 27–28) — NEW

| # | Title | Concept | Difficulty |
|---|-------|---------|-----------|
| 27 | Full Chain | Combine integer overflow + heap overflow + format string + UAF to get code execution. Hints available. | Boss |
| 28 | Blind Chain | Different program, zero hints, no labels, raw memory. | Final Boss |

#### Exercise 27: Full Chain — Detail

**Source code:** A ~30-line program with multiple bugs:
```c
struct Command {
    void (*execute)();
    char description[32];
};

void process_input() {
    int count;
    printf("How many items? ");
    scanf("%d", &count);

    int total_size = count * sizeof(struct Command);  // integer overflow possible
    struct Command *cmds = malloc(total_size);

    for (int i = 0; i < count; i++) {
        cmds[i].execute = default_handler;
        printf("Description for item %d: ", i);
        fgets(cmds[i].description, 32, stdin);
    }

    // Format string bug in logging
    char log_buf[128];
    snprintf(log_buf, 128, cmds[0].description);  // user controls format
    printf(log_buf);

    cmds[0].execute();  // calls function pointer
}
```

**Attack chain:**
1. Enter `count` that causes `count * sizeof(struct Command)` to integer-overflow to a small value
2. malloc allocates a tiny buffer, but the loop writes `count` full Command structs — heap overflow
3. The overflow corrupts adjacent heap metadata or another struct's function pointer
4. But ASLR is on, so use the format string bug in the logging line to leak an address
5. Calculate win()'s address from the leak
6. The overflow/UAF overwrites `cmds[0].execute` with win()
7. When `cmds[0].execute()` is called → win()

**Visualization:** Both heap viz and a mini stack panel visible. Execution log narrates each phase. Hex calculator available. No payload builder, no guided decision points — but the exercise description gives a high-level hint about the attack order.

**Win condition:** `cmds[0].execute()` calls win(). Displays `FLAG{full_chain_master}` and a completion badge.

#### Exercise 28: Blind Chain — Detail

Same multi-bug concept but:
- Different source code, different bug combination
- No description hints beyond "find the bugs, chain them, get code execution"
- Heap viz shows raw bytes, no metadata labels, no color-coded regions
- No symbol table (user must leak addresses themselves)
- No hex calculator
- The viz is just memory — like staring at a real debugger

**Win condition:** Call win(). Displays `FLAG{you_are_ready}` and a "Certified" badge in the header. This means you can actually do this stuff for real.

## Technical Architecture

### File Structure

Single `index.html`, estimated ~5000-6000 lines. Organized in sections:

```
<style>        — all CSS, including heap viz styles
<body>         — DOM structure
<script>
  StackSim    — existing stack simulation (unchanged)
  HeapSim     — new heap simulation
  Exercises[] — all 28 exercise definitions
  Rendering   — stack renderer, heap renderer, dual-mode renderer
  Engine      — step generation, execution, input handling
  Nav/UI      — unit-grouped navigation, badge display
</script>
```

### HeapSim Class

```
HeapSim {
  memory[]           — byte array, 1024 bytes default
  chunks[]           — [{addr, size, allocated, fd, bk, data_start}]
  tcache_bins[64]    — singly-linked lists by size class
  fastbins[10]       — singly-linked lists
  unsorted_bin       — doubly-linked circular list
  top_chunk          — {addr, size}
  function_ptrs{}    — simulated GOT/vtable

  malloc(size)       — tcache → fastbin → unsorted → top chunk
  free(ptr)          — tcache (< 7 entries) → fastbin (< 0x80) → unsorted
  write(addr, bytes) — raw memory write (for overflows)
  read(addr, size)   — raw memory read

  getChunkAt(addr)   — lookup chunk by address
  getFreeList(bin)   — return list of free chunks in a bin
}
```

### Heap Visualization

Rendered in the same panel slot as the stack viz. Exercise declares `vizMode: 'stack' | 'heap' | 'both'`.

**Heap panel layout:**
```
┌─────────────────────────────────────────┐
│ HEAP MEMORY                             │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌────────┐  │
│ │ A 24 │ │ B 24 │ │free  │ │ top    │  │
│ │ alloc│ │ alloc│ │  32  │ │ chunk  │  │
│ └──────┘ └──────┘ └──────┘ └────────┘  │
│                                         │
│ FREE LISTS                              │
│ tcache[32]: ── □ ── □ ── nil            │
│ fastbin[0]:  (empty)                    │
│ unsorted:    (empty)                    │
│                                         │
│ FUNCTION POINTERS                       │
│ greet   → 0x08048200 (default_handler)  │
│ execute → 0x08048200 (default_handler)  │
└─────────────────────────────────────────┘
```

- Chunks are colored blocks with metadata visible on hover (or always for guided exercises)
- Free list arrows are animated SVG lines
- Function pointer table shows current values with highlighting on overwrite
- "Both" mode: split panel — heap on top, mini stack on bottom

### Navigation Redesign

The nav bar becomes unit-grouped:

```
[STACK ▾] 01 02 03 04 05  [LOGIC ▾] 06 07 08 09 10  [STACK II ▾] 11 12 13 14  [HEAP ▾] 15 16 17 18  [HEAP II ▾] 19 20 21 22 23 24 25 26  [FINAL] 27 28
```

- Unit headers are labels, not buttons
- Exercise buttons show number only (title on hover)
- Completed exercises show a checkmark
- Units 2–5 unlock after completing Unit 1 (exercises 01–05)
- Exercises within a unit unlock sequentially
- Final challenge unlocks after completing all other units
- Badges displayed in header after completion of final challenges

### Exercise Definition Schema

Extended from current format:

```javascript
{
  title: 'string',
  desc: 'string (HTML, beginner-friendly)',
  code: [{text, cls}],         // source code lines
  mode: 'step' | 'input-text' | 'input-hex' | 'guided',
  vizMode: 'stack' | 'heap' | 'both',
  unit: 1-6,                   // which unit
  bufSize: number,             // for stack exercises
  heapSetup: function(heap),   // for heap exercises — initial mallocs/frees
  gadgets: [{addr, asm}],      // for ROP exercises
  signalFrame: boolean,        // for SROP exercise
  showSymbols: boolean,
  showBuilder: boolean,
  showCalc: boolean,
  showGadgetTable: boolean,
  showFunctionPtrs: boolean,
  showFreeLists: boolean,
  aslr: boolean,
  canary: boolean,
  nx: boolean,
  guided: boolean,             // true = decision points, false = free-form
  check: function(sim),
  winTitle: 'string',
  winMsg: 'string',
}
```

### Step Engine Extensions

The existing `generateExecSteps()` / `execCurrentStep()` system extends with:

- **Heap steps:** `heap_malloc`, `heap_free`, `heap_write`, `heap_read`, `heap_corrupt`
- **Format string steps:** `fmt_read` (read stack slot), `fmt_write` (write via %n)
- **ROP steps:** `rop_gadget` (execute one gadget, update registers)
- **Decision points:** For guided exercises, a step can be `type: 'decision'` which pauses and asks the user to enter a value before continuing

### Beginner-Friendly Language

All exercise descriptions and log messages follow the existing tone:
- "Go-back address" alongside "(return address)"
- "Tripwire" alongside "(canary)"
- "Bookmark" alongside "(saved EBP)"
- "The program crashed" not "SIGSEGV"
- "The computer refuses to run code here" not "DEP/NX violation"
- Technical terms introduced in parentheses, then the friendly name used going forward

New terms for heap:
- "Memory block" alongside "(chunk)"
- "Block header" alongside "(chunk metadata)"
- "Recycling list" alongside "(free list)"
- "Leftover space" alongside "(top chunk / wilderness)"
- "Block-in-use flag" alongside "(prev_in_use bit)"

### Badges

Displayed in the header after the nav:
- Completing all of Unit 1: "Stack Smasher"
- Completing all of Unit 2: "Logic Hacker"
- Completing all of Unit 3: "Stack Master"
- Completing all of Unit 4: "Heap Explorer"
- Completing all of Unit 5: "Heap Wizard"
- Exercise 27: "Full Chain"
- Exercise 28: "Certified Hacker"

Stored in localStorage so they persist across sessions.

## Verification Checklist

1. Exercises 01–05 still work exactly as before
2. Each new exercise loads, steps through, and completes correctly
3. Heap viz renders chunks, free lists, and function pointers
4. Navigation groups exercises by unit with correct unlock logic
5. Format string exercises correctly simulate %x reading and %n writing
6. ROP exercises show gadget-by-gadget execution with register state
7. House of Force/Spirit/Orange/Einherjar/Lore each demonstrate their specific allocator manipulation
8. Final challenge requires chaining 3+ techniques
9. Blind chain provides no hints or labels
10. Badges display and persist in localStorage
11. Works in Chrome and Firefox
12. Beginner-friendly language throughout — no unexplained jargon
