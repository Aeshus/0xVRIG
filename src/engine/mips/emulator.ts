import { AsmInstruction, RegisterDiff, StepResult } from '../x86/types';
import { Emulator, EmulatorState } from '../emulator-interface';

/** Canonical MIPS register names indexed by number (0-31). */
const REG_NAMES: string[] = [
  '$zero', '$at',
  '$v0', '$v1',
  '$a0', '$a1', '$a2', '$a3',
  '$t0', '$t1', '$t2', '$t3', '$t4', '$t5', '$t6', '$t7',
  '$s0', '$s1', '$s2', '$s3', '$s4', '$s5', '$s6', '$s7',
  '$t8', '$t9',
  '$k0', '$k1',
  '$gp', '$sp', '$fp', '$ra',
];

/** Build a lookup from name -> index for quick resolution. */
const REG_INDEX: Record<string, number> = {};
for (let i = 0; i < REG_NAMES.length; i++) {
  REG_INDEX[REG_NAMES[i]] = i;
}

/** All register keys stored in state.registers (for diff tracking). */
const ALL_REG_KEYS: string[] = [...REG_NAMES, 'hi', 'lo', 'pc'];

function defaultRegisters(): Record<string, number> {
  const regs: Record<string, number> = {};
  for (const name of REG_NAMES) regs[name] = 0;
  regs['hi'] = 0;
  regs['lo'] = 0;
  regs['pc'] = 0;
  return regs;
}

/** Sign-extend a 16-bit immediate to 32 bits. */
function signExtend16(v: number): number {
  v = v & 0xffff;
  return (v & 0x8000) ? (v | 0xffff0000) : v;
}

/** Sign-extend an 8-bit value to 32 bits. */
function signExtend8(v: number): number {
  v = v & 0xff;
  return (v & 0x80) ? (v | 0xffffff00) : v;
}

/** Interpret a 32-bit unsigned value as signed. */
function toSigned(v: number): number {
  return (v | 0);
}

/** Clamp to unsigned 32-bit. */
function u32(v: number): number {
  return v >>> 0;
}

/** Parse a numeric string (decimal or 0x hex), returning NaN on failure. */
function parseNumber(s: string): number {
  s = s.trim();
  if (s.startsWith('0x') || s.startsWith('0X')) return parseInt(s, 16);
  if (s.startsWith('-0x') || s.startsWith('-0X')) return -parseInt(s.slice(1), 16);
  return parseInt(s, 10);
}

interface MipsState extends EmulatorState {
  arch: 'mips';
}

export class MipsEmulator implements Emulator {
  readonly instructions: AsmInstruction[];
  state: MipsState;

  private memory: Map<number, number> = new Map();
  private instrMap: Map<number, number> = new Map();

  /** When set, the next step will execute the delay slot then jump. */
  private pendingPC: number | null = null;

  private initialRegsSnapshot: Record<string, number>;
  private stackBase: number;

  constructor(
    instructions: AsmInstruction[],
    initialRegs?: Record<string, number>,
    stackBase = 0x7ffffffc,
  ) {
    this.instructions = instructions;
    this.stackBase = stackBase;

    for (let i = 0; i < instructions.length; i++) {
      this.instrMap.set(instructions[i].addr, i);
    }

    const regs = defaultRegisters();
    if (initialRegs) {
      for (const [k, v] of Object.entries(initialRegs)) {
        if (k in regs) regs[k] = u32(v);
      }
    }
    // $zero is always 0 regardless of initialRegs
    regs['$zero'] = 0;
    regs['$sp'] = regs['$sp'] || stackBase;
    if (instructions.length > 0 && !initialRegs?.['pc']) {
      regs['pc'] = instructions[0].addr;
    }

    this.initialRegsSnapshot = { ...regs };

    this.state = {
      registers: regs,
      flags: { delaySlot: false },
      halted: false,
      arch: 'mips',
    };
  }

  // ---------------------------------------------------------------------------
  // Memory (big-endian)
  // ---------------------------------------------------------------------------

  readMem(addr: number, size: number): number {
    let val = 0;
    for (let i = 0; i < size; i++) {
      val = (val << 8) | (this.memory.get(u32(addr + i)) ?? 0);
    }
    return u32(val);
  }

  writeMem(addr: number, value: number, size: number): void {
    for (let i = size - 1; i >= 0; i--) {
      this.memory.set(u32(addr + i), value & 0xff);
      value >>>= 8;
    }
  }

  // ---------------------------------------------------------------------------
  // Register helpers
  // ---------------------------------------------------------------------------

  /** Read a register by name. $zero always returns 0. */
  private readReg(name: string): number {
    if (name === '$zero' || name === '$0') return 0;
    return this.state.registers[name] ?? 0;
  }

  /** Write a register by name. Writes to $zero are silently ignored. */
  private writeReg(name: string, value: number): void {
    if (name === '$zero' || name === '$0') return;
    this.state.registers[name] = u32(value);
  }

  // ---------------------------------------------------------------------------
  // Operand parsing
  // ---------------------------------------------------------------------------

  /**
   * Normalise a register token.  Accepts `$name` as-is, and also the
   * numeric form `$0` .. `$31`.
   */
  private normaliseReg(s: string): string {
    s = s.trim();
    if (s.startsWith('$')) {
      const num = parseInt(s.slice(1), 10);
      if (!isNaN(num) && num >= 0 && num <= 31) {
        return REG_NAMES[num];
      }
    }
    return s;
  }

  /**
   * Parse an operand string of the form `offset($reg)`.
   * Returns { offset, reg }.
   */
  private parseMemOperand(s: string): { offset: number; reg: string } {
    s = s.trim();
    const match = s.match(/^(-?(?:0x[\da-fA-F]+|\d+))?\((\$\w+)\)$/);
    if (!match) throw new Error(`Invalid memory operand: ${s}`);
    const offset = match[1] ? parseNumber(match[1]) : 0;
    const reg = this.normaliseReg(match[2]);
    return { offset, reg };
  }

  /**
   * Split a comma-separated operand string, handling the memory operand
   * `offset($reg)` correctly (no split inside parentheses).
   */
  private splitOperands(s: string): string[] {
    const parts: string[] = [];
    let depth = 0;
    let cur = '';
    for (const ch of s) {
      if (ch === '(') depth++;
      if (ch === ')') depth--;
      if (ch === ',' && depth === 0) {
        parts.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    if (cur.trim()) parts.push(cur.trim());
    return parts;
  }

  /** Parse an immediate value (decimal or hex). */
  private parseImm(s: string): number {
    const n = parseNumber(s.trim());
    if (isNaN(n)) throw new Error(`Invalid immediate: ${s}`);
    return n;
  }

  // ---------------------------------------------------------------------------
  // Instruction execution
  // ---------------------------------------------------------------------------

  getCurrentInstruction(): AsmInstruction | null {
    const idx = this.instrMap.get(this.state.registers['pc']);
    return idx !== undefined ? this.instructions[idx] : null;
  }

  step(): StepResult | null {
    if (this.state.halted) return null;

    const instr = this.getCurrentInstruction();
    if (!instr) {
      this.state.halted = true;
      return null;
    }

    // Snapshot state before execution.
    const prevRegs = { ...this.state.registers };
    const memWrites: StepResult['memoryWrites'] = [];
    const memReads: StepResult['memoryReads'] = [];

    // Intercept memory operations for tracking.
    const origRead = this.readMem.bind(this);
    const origWrite = this.writeMem.bind(this);
    this.readMem = (addr, size) => {
      const val = origRead(addr, size);
      memReads.push({ addr, value: val, size });
      return val;
    };
    this.writeMem = (addr, value, size) => {
      memWrites.push({ addr, value: u32(value), size });
      origWrite(addr, value, size);
    };

    // If we are in a delay slot, capture the pending PC.
    const savedPendingPC = this.pendingPC;

    this.executeInstruction(instr);

    // Restore original memory methods.
    this.readMem = origRead;
    this.writeMem = origWrite;

    // Handle delay slot: if there was a pending PC from a previous branch,
    // apply it now (after executing the delay slot instruction).
    if (savedPendingPC !== null) {
      this.state.registers['pc'] = savedPendingPC;
      this.pendingPC = null;
      this.state.flags['delaySlot'] = false;
    }

    // Build diffs.
    const diffs: RegisterDiff[] = [];
    for (const r of ALL_REG_KEYS) {
      if (prevRegs[r] !== this.state.registers[r]) {
        diffs.push({ reg: r, oldValue: prevRegs[r], newValue: this.state.registers[r] });
      }
    }

    const log = this.formatLog(instr, diffs);

    return {
      instruction: instr,
      diffs,
      flagChanges: {},
      memoryWrites: memWrites,
      memoryReads: memReads,
      log,
      halted: this.state.halted,
    };
  }

  private executeInstruction(instr: AsmInstruction): void {
    const mnemonic = instr.mnemonic.toLowerCase();
    const ops = instr.operands ? this.splitOperands(instr.operands) : [];
    const nextPC = u32(instr.addr + 4); // MIPS instructions are always 4 bytes

    switch (mnemonic) {
      // -----------------------------------------------------------------------
      // Arithmetic
      // -----------------------------------------------------------------------
      case 'add': {
        const rd = this.normaliseReg(ops[0]);
        const rs = this.normaliseReg(ops[1]);
        const rt = this.normaliseReg(ops[2]);
        this.writeReg(rd, u32(this.readReg(rs) + this.readReg(rt)));
        this.state.registers['pc'] = nextPC;
        break;
      }

      case 'addi': {
        const rt = this.normaliseReg(ops[0]);
        const rs = this.normaliseReg(ops[1]);
        const imm = signExtend16(this.parseImm(ops[2]));
        this.writeReg(rt, u32(this.readReg(rs) + imm));
        this.state.registers['pc'] = nextPC;
        break;
      }

      case 'addiu': {
        const rt = this.normaliseReg(ops[0]);
        const rs = this.normaliseReg(ops[1]);
        const imm = signExtend16(this.parseImm(ops[2]));
        this.writeReg(rt, u32(this.readReg(rs) + imm));
        this.state.registers['pc'] = nextPC;
        break;
      }

      case 'sub': {
        const rd = this.normaliseReg(ops[0]);
        const rs = this.normaliseReg(ops[1]);
        const rt = this.normaliseReg(ops[2]);
        this.writeReg(rd, u32(this.readReg(rs) - this.readReg(rt)));
        this.state.registers['pc'] = nextPC;
        break;
      }

      case 'and': {
        const rd = this.normaliseReg(ops[0]);
        const rs = this.normaliseReg(ops[1]);
        const rt = this.normaliseReg(ops[2]);
        this.writeReg(rd, u32(this.readReg(rs) & this.readReg(rt)));
        this.state.registers['pc'] = nextPC;
        break;
      }

      case 'or': {
        const rd = this.normaliseReg(ops[0]);
        const rs = this.normaliseReg(ops[1]);
        const rt = this.normaliseReg(ops[2]);
        this.writeReg(rd, u32(this.readReg(rs) | this.readReg(rt)));
        this.state.registers['pc'] = nextPC;
        break;
      }

      case 'xor': {
        const rd = this.normaliseReg(ops[0]);
        const rs = this.normaliseReg(ops[1]);
        const rt = this.normaliseReg(ops[2]);
        this.writeReg(rd, u32(this.readReg(rs) ^ this.readReg(rt)));
        this.state.registers['pc'] = nextPC;
        break;
      }

      case 'nor': {
        const rd = this.normaliseReg(ops[0]);
        const rs = this.normaliseReg(ops[1]);
        const rt = this.normaliseReg(ops[2]);
        this.writeReg(rd, u32(~(this.readReg(rs) | this.readReg(rt))));
        this.state.registers['pc'] = nextPC;
        break;
      }

      case 'slt': {
        const rd = this.normaliseReg(ops[0]);
        const rs = this.normaliseReg(ops[1]);
        const rt = this.normaliseReg(ops[2]);
        this.writeReg(rd, toSigned(this.readReg(rs)) < toSigned(this.readReg(rt)) ? 1 : 0);
        this.state.registers['pc'] = nextPC;
        break;
      }

      case 'slti': {
        const rt = this.normaliseReg(ops[0]);
        const rs = this.normaliseReg(ops[1]);
        const imm = signExtend16(this.parseImm(ops[2]));
        this.writeReg(rt, toSigned(this.readReg(rs)) < toSigned(u32(imm)) ? 1 : 0);
        this.state.registers['pc'] = nextPC;
        break;
      }

      case 'lui': {
        const rt = this.normaliseReg(ops[0]);
        const imm = this.parseImm(ops[1]);
        this.writeReg(rt, u32((imm & 0xffff) << 16));
        this.state.registers['pc'] = nextPC;
        break;
      }

      // -----------------------------------------------------------------------
      // Shift
      // -----------------------------------------------------------------------
      case 'sll': {
        const rd = this.normaliseReg(ops[0]);
        const rt = this.normaliseReg(ops[1]);
        const shamt = this.parseImm(ops[2]) & 0x1f;
        this.writeReg(rd, u32(this.readReg(rt) << shamt));
        this.state.registers['pc'] = nextPC;
        break;
      }

      case 'srl': {
        const rd = this.normaliseReg(ops[0]);
        const rt = this.normaliseReg(ops[1]);
        const shamt = this.parseImm(ops[2]) & 0x1f;
        this.writeReg(rd, this.readReg(rt) >>> shamt);
        this.state.registers['pc'] = nextPC;
        break;
      }

      case 'sra': {
        const rd = this.normaliseReg(ops[0]);
        const rt = this.normaliseReg(ops[1]);
        const shamt = this.parseImm(ops[2]) & 0x1f;
        this.writeReg(rd, u32(toSigned(this.readReg(rt)) >> shamt));
        this.state.registers['pc'] = nextPC;
        break;
      }

      // -----------------------------------------------------------------------
      // Memory
      // -----------------------------------------------------------------------
      case 'lw': {
        const rt = this.normaliseReg(ops[0]);
        const { offset, reg } = this.parseMemOperand(ops[1]);
        const addr = u32(this.readReg(reg) + signExtend16(offset));
        this.writeReg(rt, this.readMem(addr, 4));
        this.state.registers['pc'] = nextPC;
        break;
      }

      case 'sw': {
        const rt = this.normaliseReg(ops[0]);
        const { offset, reg } = this.parseMemOperand(ops[1]);
        const addr = u32(this.readReg(reg) + signExtend16(offset));
        this.writeMem(addr, this.readReg(rt), 4);
        this.state.registers['pc'] = nextPC;
        break;
      }

      case 'lb': {
        const rt = this.normaliseReg(ops[0]);
        const { offset, reg } = this.parseMemOperand(ops[1]);
        const addr = u32(this.readReg(reg) + signExtend16(offset));
        const byte = this.readMem(addr, 1);
        this.writeReg(rt, u32(signExtend8(byte)));
        this.state.registers['pc'] = nextPC;
        break;
      }

      case 'sb': {
        const rt = this.normaliseReg(ops[0]);
        const { offset, reg } = this.parseMemOperand(ops[1]);
        const addr = u32(this.readReg(reg) + signExtend16(offset));
        this.writeMem(addr, this.readReg(rt) & 0xff, 1);
        this.state.registers['pc'] = nextPC;
        break;
      }

      // -----------------------------------------------------------------------
      // Branch (all set pendingPC for delay slot)
      // -----------------------------------------------------------------------
      case 'beq': {
        const rs = this.normaliseReg(ops[0]);
        const rt = this.normaliseReg(ops[1]);
        const offset = this.parseImm(ops[2]);
        if (this.readReg(rs) === this.readReg(rt)) {
          this.pendingPC = u32(nextPC + (signExtend16(offset) << 2));
          this.state.flags['delaySlot'] = true;
        }
        this.state.registers['pc'] = nextPC;
        break;
      }

      case 'bne': {
        const rs = this.normaliseReg(ops[0]);
        const rt = this.normaliseReg(ops[1]);
        const offset = this.parseImm(ops[2]);
        if (this.readReg(rs) !== this.readReg(rt)) {
          this.pendingPC = u32(nextPC + (signExtend16(offset) << 2));
          this.state.flags['delaySlot'] = true;
        }
        this.state.registers['pc'] = nextPC;
        break;
      }

      case 'j': {
        const target = this.parseImm(ops[0]);
        this.pendingPC = u32(target);
        this.state.flags['delaySlot'] = true;
        this.state.registers['pc'] = nextPC;
        break;
      }

      case 'jal': {
        const target = this.parseImm(ops[0]);
        this.writeReg('$ra', u32(nextPC + 4)); // return addr after delay slot
        this.pendingPC = u32(target);
        this.state.flags['delaySlot'] = true;
        this.state.registers['pc'] = nextPC;
        break;
      }

      case 'jr': {
        const rs = this.normaliseReg(ops[0]);
        this.pendingPC = this.readReg(rs);
        this.state.flags['delaySlot'] = true;
        this.state.registers['pc'] = nextPC;
        break;
      }

      // -----------------------------------------------------------------------
      // Multiply / Move
      // -----------------------------------------------------------------------
      case 'mult': {
        const rs = this.normaliseReg(ops[0]);
        const rt = this.normaliseReg(ops[1]);
        const a = toSigned(this.readReg(rs));
        const b = toSigned(this.readReg(rt));
        // 64-bit signed multiply without BigInt.
        // lo = low 32 bits, hi = high 32 bits.
        const lo = Math.imul(a, b);
        // Compute hi via the identity: a*b = (aHi*2^16 + aLo)*(bHi*2^16 + bLo)
        // We need the upper 32 bits of the full 64-bit signed product.
        const aU = a >>> 0;
        const bU = b >>> 0;
        const aLo = aU & 0xffff;
        const aHi = aU >>> 16;
        const bLo = bU & 0xffff;
        const bHi = bU >>> 16;
        let mid = aHi * bLo + (aLo * bLo >>> 16);
        mid += aLo * bHi;
        let hi = aHi * bHi + (mid >>> 16);
        // Correct for signed: if a < 0 subtract b, if b < 0 subtract a.
        if (a < 0) hi = (hi - bU) >>> 0;
        if (b < 0) hi = (hi - aU) >>> 0;
        this.state.registers['lo'] = u32(lo);
        this.state.registers['hi'] = u32(hi);
        this.state.registers['pc'] = nextPC;
        break;
      }

      case 'mfhi': {
        const rd = this.normaliseReg(ops[0]);
        this.writeReg(rd, this.state.registers['hi']);
        this.state.registers['pc'] = nextPC;
        break;
      }

      case 'mflo': {
        const rd = this.normaliseReg(ops[0]);
        this.writeReg(rd, this.state.registers['lo']);
        this.state.registers['pc'] = nextPC;
        break;
      }

      // -----------------------------------------------------------------------
      // Special
      // -----------------------------------------------------------------------
      case 'nop': {
        this.state.registers['pc'] = nextPC;
        break;
      }

      case 'syscall': {
        this.state.halted = true;
        this.state.registers['pc'] = nextPC;
        break;
      }

      default:
        // Unknown instruction: advance PC.
        this.state.registers['pc'] = nextPC;
        break;
    }
  }

  // ---------------------------------------------------------------------------
  // Reset
  // ---------------------------------------------------------------------------

  reset(initialRegs?: Record<string, number>): void {
    this.memory.clear();
    this.pendingPC = null;

    const regs = defaultRegisters();
    const applied = initialRegs ?? this.initialRegsSnapshot;
    for (const [k, v] of Object.entries(applied)) {
      if (k in regs) regs[k] = u32(v);
    }
    regs['$zero'] = 0;
    if (!applied['$sp']) regs['$sp'] = this.stackBase;
    if (!applied['pc'] && this.instructions.length > 0) {
      regs['pc'] = this.instructions[0].addr;
    }

    this.state = {
      registers: regs,
      flags: { delaySlot: false },
      halted: false,
      arch: 'mips',
    };
  }

  // ---------------------------------------------------------------------------
  // Stack view
  // ---------------------------------------------------------------------------

  getStackView(count = 16): Array<{ addr: number; value: number }> {
    const sp = this.state.registers['$sp'];
    const entries: Array<{ addr: number; value: number }> = [];
    for (let i = 0; i < count; i++) {
      const addr = u32(sp + i * 4);
      entries.push({ addr, value: this.readMem(addr, 4) });
    }
    return entries;
  }

  // ---------------------------------------------------------------------------
  // Logging
  // ---------------------------------------------------------------------------

  private formatLog(instr: AsmInstruction, diffs: RegisterDiff[]): string {
    const hex = (n: number) => '0x' + u32(n).toString(16).padStart(8, '0');
    let log = `${hex(instr.addr)}: ${instr.mnemonic} ${instr.operands}`;

    if (diffs.length > 0) {
      const changes = diffs
        .filter(d => d.reg !== 'pc')
        .map(d => `${d.reg}=${hex(d.newValue)}`)
        .join(', ');
      if (changes) log += ` -> ${changes}`;
    }

    return log;
  }
}
