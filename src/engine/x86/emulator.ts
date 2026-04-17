import {
  X86Register, X86Flags, X86State, AsmInstruction,
  Operand, RegisterDiff, StepResult,
} from './types';

const REGISTERS: X86Register[] = ['eax', 'ebx', 'ecx', 'edx', 'esp', 'ebp', 'esi', 'edi', 'eip'];

function defaultFlags(): X86Flags {
  return { ZF: false, SF: false, CF: false, OF: false };
}

function defaultRegisters(): Record<X86Register, number> {
  const regs = {} as Record<X86Register, number>;
  for (const r of REGISTERS) regs[r] = 0;
  return regs;
}

export class X86Emulator {
  state: X86State;
  instructions: AsmInstruction[];
  memory: Map<number, number>;
  private instrMap: Map<number, number>;

  constructor(instructions: AsmInstruction[], initialRegs?: Partial<Record<X86Register, number>>, stackBase = 0xbfff0200) {
    this.instructions = instructions;
    this.instrMap = new Map();
    for (let i = 0; i < instructions.length; i++) {
      this.instrMap.set(instructions[i].addr, i);
    }

    this.memory = new Map();
    this.state = {
      registers: { ...defaultRegisters(), ...initialRegs },
      flags: defaultFlags(),
      stack: [],
      stackBase,
      halted: false,
    };

    if (!initialRegs?.eip && instructions.length > 0) {
      this.state.registers.eip = instructions[0].addr;
    }
    if (!initialRegs?.esp) {
      this.state.registers.esp = stackBase;
    }
    if (!initialRegs?.ebp) {
      this.state.registers.ebp = stackBase;
    }
  }

  private u32(v: number): number {
    return v >>> 0;
  }

  private s32(v: number): number {
    return v | 0;
  }

  readMem(addr: number, size: number): number {
    let val = 0;
    for (let i = 0; i < size; i++) {
      val |= (this.memory.get((addr + i) >>> 0) ?? 0) << (i * 8);
    }
    return this.u32(val);
  }

  writeMem(addr: number, value: number, size: number): void {
    for (let i = 0; i < size; i++) {
      this.memory.set((addr + i) >>> 0, (value >> (i * 8)) & 0xff);
    }
  }

  parseOperand(s: string): Operand {
    s = s.trim();

    if (REGISTERS.includes(s as X86Register)) {
      return { type: 'reg', reg: s as X86Register };
    }

    if (s.startsWith('[') && s.endsWith(']')) {
      return this.parseMemOperand(s.slice(1, -1).trim());
    }

    if (s.startsWith('dword [') || s.startsWith('DWORD [')) {
      const inner = s.slice(s.indexOf('[') + 1, -1).trim();
      return { ...this.parseMemOperand(inner), size: 4 } as Operand;
    }

    const num = this.parseNumber(s);
    if (!isNaN(num)) {
      return { type: 'imm', value: this.u32(num) };
    }

    throw new Error(`Unknown operand: ${s}`);
  }

  private parseNumber(s: string): number {
    s = s.trim();
    if (s.startsWith('0x') || s.startsWith('0X')) return parseInt(s, 16);
    if (s.startsWith('-0x') || s.startsWith('-0X')) return -parseInt(s.slice(1), 16);
    return parseInt(s, 10);
  }

  private parseMemOperand(inner: string): Operand {
    const result: Operand = { type: 'mem' };

    const parts = inner.replace(/\s/g, '').match(/([+-]?[a-z0-9*]+)/gi) ?? [];

    for (const part of parts) {
      const clean = part.replace(/^\+/, '');

      if (clean.includes('*')) {
        const [a, b] = clean.split('*');
        if (REGISTERS.includes(a as X86Register)) {
          (result as any).index = a;
          (result as any).scale = parseInt(b);
        } else {
          (result as any).index = b;
          (result as any).scale = parseInt(a);
        }
      } else if (REGISTERS.includes(clean as X86Register)) {
        if (!(result as any).base) {
          (result as any).base = clean;
        } else {
          (result as any).index = clean;
          (result as any).scale = 1;
        }
      } else if (REGISTERS.includes(clean.replace(/^-/, '') as X86Register)) {
        // shouldn't happen but handle -reg
      } else {
        const num = this.parseNumber(clean);
        if (!isNaN(num)) {
          (result as any).disp = ((result as any).disp ?? 0) + num;
        }
      }
    }

    return result;
  }

  private resolveOperandAddr(op: Operand): number {
    if (op.type !== 'mem') throw new Error('Not a memory operand');
    let addr = 0;
    if (op.base) addr += this.state.registers[op.base];
    if (op.index) addr += this.state.registers[op.index] * (op.scale ?? 1);
    if (op.disp) addr += op.disp;
    return this.u32(addr);
  }

  private readOperand(op: Operand): number {
    if (op.type === 'reg') return this.state.registers[op.reg];
    if (op.type === 'imm') return op.value;
    return this.readMem(this.resolveOperandAddr(op), op.size ?? 4);
  }

  private writeOperand(op: Operand, value: number): void {
    value = this.u32(value);
    if (op.type === 'reg') {
      this.state.registers[op.reg] = value;
    } else if (op.type === 'mem') {
      this.writeMem(this.resolveOperandAddr(op), value, op.size ?? 4);
    } else {
      throw new Error('Cannot write to immediate');
    }
  }

  private updateFlags(result: number, size = 32): void {
    const masked = this.u32(result);
    this.state.flags.ZF = masked === 0;
    this.state.flags.SF = (masked & (1 << (size - 1))) !== 0;
  }

  private push(value: number): void {
    this.state.registers.esp = this.u32(this.state.registers.esp - 4);
    this.writeMem(this.state.registers.esp, value, 4);
  }

  private pop(): number {
    const val = this.readMem(this.state.registers.esp, 4);
    this.state.registers.esp = this.u32(this.state.registers.esp + 4);
    return val;
  }

  getCurrentInstruction(): AsmInstruction | null {
    const idx = this.instrMap.get(this.state.registers.eip);
    if (idx === undefined) return null;
    return this.instructions[idx];
  }

  step(): StepResult | null {
    if (this.state.halted) return null;

    const instr = this.getCurrentInstruction();
    if (!instr) {
      this.state.halted = true;
      return null;
    }

    const prevRegs = { ...this.state.registers };
    const prevFlags = { ...this.state.flags };
    const memWrites: StepResult['memoryWrites'] = [];
    const memReads: StepResult['memoryReads'] = [];

    const origWriteMem = this.writeMem.bind(this);
    const origReadMem = this.readMem.bind(this);
    this.writeMem = (addr, value, size) => {
      memWrites.push({ addr, value: this.u32(value), size });
      origWriteMem(addr, value, size);
    };
    this.readMem = (addr, size) => {
      const val = origReadMem(addr, size);
      memReads.push({ addr, value: val, size });
      return val;
    };

    this.executeInstruction(instr);

    this.writeMem = origWriteMem;
    this.readMem = origReadMem;

    const diffs: RegisterDiff[] = [];
    for (const r of REGISTERS) {
      if (prevRegs[r] !== this.state.registers[r]) {
        diffs.push({ reg: r, oldValue: prevRegs[r], newValue: this.state.registers[r] });
      }
    }

    const flagChanges: Partial<X86Flags> = {};
    for (const f of ['ZF', 'SF', 'CF', 'OF'] as (keyof X86Flags)[]) {
      if (prevFlags[f] !== this.state.flags[f]) {
        flagChanges[f] = this.state.flags[f];
      }
    }

    const log = this.formatLog(instr, diffs, flagChanges);

    return {
      instruction: instr,
      diffs,
      flagChanges,
      memoryWrites: memWrites,
      memoryReads: memReads,
      log,
      halted: this.state.halted,
    };
  }

  private executeInstruction(instr: AsmInstruction): void {
    const mnemonic = instr.mnemonic.toLowerCase();
    const nextAddr = this.u32(instr.addr + instr.bytes.length);

    const ops = instr.operands
      ? instr.operands.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    switch (mnemonic) {
      case 'nop':
        this.state.registers.eip = nextAddr;
        break;

      case 'mov': {
        const dst = this.parseOperand(ops[0]);
        const src = this.parseOperand(ops[1]);
        this.writeOperand(dst, this.readOperand(src));
        this.state.registers.eip = nextAddr;
        break;
      }

      case 'lea': {
        const dst = this.parseOperand(ops[0]);
        const src = this.parseOperand(ops[1]);
        if (src.type === 'mem') {
          this.writeOperand(dst, this.resolveOperandAddr(src));
        }
        this.state.registers.eip = nextAddr;
        break;
      }

      case 'push': {
        const src = this.parseOperand(ops[0]);
        this.push(this.readOperand(src));
        this.state.registers.eip = nextAddr;
        break;
      }

      case 'pop': {
        const dst = this.parseOperand(ops[0]);
        this.writeOperand(dst, this.pop());
        this.state.registers.eip = nextAddr;
        break;
      }

      case 'add': {
        const dst = this.parseOperand(ops[0]);
        const src = this.parseOperand(ops[1]);
        const a = this.readOperand(dst);
        const b = this.readOperand(src);
        const result = a + b;
        this.writeOperand(dst, result);
        this.updateFlags(result);
        this.state.flags.CF = result > 0xffffffff;
        this.state.flags.OF = ((a ^ result) & (b ^ result) & 0x80000000) !== 0;
        this.state.registers.eip = nextAddr;
        break;
      }

      case 'sub': {
        const dst = this.parseOperand(ops[0]);
        const src = this.parseOperand(ops[1]);
        const a = this.readOperand(dst);
        const b = this.readOperand(src);
        const result = a - b;
        this.writeOperand(dst, result);
        this.updateFlags(result);
        this.state.flags.CF = a < b;
        this.state.flags.OF = ((a ^ b) & (a ^ this.u32(result)) & 0x80000000) !== 0;
        this.state.registers.eip = nextAddr;
        break;
      }

      case 'inc': {
        const dst = this.parseOperand(ops[0]);
        const a = this.readOperand(dst);
        const result = a + 1;
        this.writeOperand(dst, result);
        this.updateFlags(result);
        this.state.flags.OF = a === 0x7fffffff;
        this.state.registers.eip = nextAddr;
        break;
      }

      case 'dec': {
        const dst = this.parseOperand(ops[0]);
        const a = this.readOperand(dst);
        const result = a - 1;
        this.writeOperand(dst, result);
        this.updateFlags(result);
        this.state.flags.OF = a === 0x80000000;
        this.state.registers.eip = nextAddr;
        break;
      }

      case 'mul': {
        const src = this.parseOperand(ops[0]);
        const a = this.state.registers.eax;
        const b = this.readOperand(src);
        const result = Math.imul(a, b) >>> 0;
        this.state.registers.eax = result;
        this.state.registers.edx = 0;
        this.updateFlags(result);
        this.state.registers.eip = nextAddr;
        break;
      }

      case 'imul': {
        if (ops.length === 2) {
          const dst = this.parseOperand(ops[0]);
          const src = this.parseOperand(ops[1]);
          const result = Math.imul(this.s32(this.readOperand(dst)), this.s32(this.readOperand(src)));
          this.writeOperand(dst, result);
          this.updateFlags(result);
        } else if (ops.length === 3) {
          const dst = this.parseOperand(ops[0]);
          const src = this.parseOperand(ops[1]);
          const imm = this.parseOperand(ops[2]);
          const result = Math.imul(this.s32(this.readOperand(src)), this.s32(this.readOperand(imm)));
          this.writeOperand(dst, result);
          this.updateFlags(result);
        }
        this.state.registers.eip = nextAddr;
        break;
      }

      case 'xor': {
        const dst = this.parseOperand(ops[0]);
        const src = this.parseOperand(ops[1]);
        const result = this.readOperand(dst) ^ this.readOperand(src);
        this.writeOperand(dst, result);
        this.updateFlags(result);
        this.state.flags.CF = false;
        this.state.flags.OF = false;
        this.state.registers.eip = nextAddr;
        break;
      }

      case 'and': {
        const dst = this.parseOperand(ops[0]);
        const src = this.parseOperand(ops[1]);
        const result = this.readOperand(dst) & this.readOperand(src);
        this.writeOperand(dst, result);
        this.updateFlags(result);
        this.state.flags.CF = false;
        this.state.flags.OF = false;
        this.state.registers.eip = nextAddr;
        break;
      }

      case 'or': {
        const dst = this.parseOperand(ops[0]);
        const src = this.parseOperand(ops[1]);
        const result = this.readOperand(dst) | this.readOperand(src);
        this.writeOperand(dst, result);
        this.updateFlags(result);
        this.state.flags.CF = false;
        this.state.flags.OF = false;
        this.state.registers.eip = nextAddr;
        break;
      }

      case 'not': {
        const dst = this.parseOperand(ops[0]);
        this.writeOperand(dst, ~this.readOperand(dst));
        this.state.registers.eip = nextAddr;
        break;
      }

      case 'shl':
      case 'sal': {
        const dst = this.parseOperand(ops[0]);
        const cnt = this.readOperand(this.parseOperand(ops[1])) & 0x1f;
        const val = this.readOperand(dst);
        const result = val << cnt;
        this.writeOperand(dst, result);
        this.updateFlags(result);
        this.state.registers.eip = nextAddr;
        break;
      }

      case 'shr': {
        const dst = this.parseOperand(ops[0]);
        const cnt = this.readOperand(this.parseOperand(ops[1])) & 0x1f;
        const val = this.readOperand(dst);
        const result = val >>> cnt;
        this.writeOperand(dst, result);
        this.updateFlags(result);
        this.state.registers.eip = nextAddr;
        break;
      }

      case 'cmp': {
        const a = this.readOperand(this.parseOperand(ops[0]));
        const b = this.readOperand(this.parseOperand(ops[1]));
        const result = a - b;
        this.updateFlags(result);
        this.state.flags.CF = a < b;
        this.state.flags.OF = ((a ^ b) & (a ^ this.u32(result)) & 0x80000000) !== 0;
        this.state.registers.eip = nextAddr;
        break;
      }

      case 'test': {
        const a = this.readOperand(this.parseOperand(ops[0]));
        const b = this.readOperand(this.parseOperand(ops[1]));
        const result = a & b;
        this.updateFlags(result);
        this.state.flags.CF = false;
        this.state.flags.OF = false;
        this.state.registers.eip = nextAddr;
        break;
      }

      case 'jmp': {
        const target = this.parseOperand(ops[0]);
        this.state.registers.eip = this.readOperand(target);
        break;
      }

      case 'je':
      case 'jz':
        this.conditionalJump(ops[0], nextAddr, this.state.flags.ZF);
        break;

      case 'jne':
      case 'jnz':
        this.conditionalJump(ops[0], nextAddr, !this.state.flags.ZF);
        break;

      case 'jg':
      case 'jnle':
        this.conditionalJump(ops[0], nextAddr, !this.state.flags.ZF && this.state.flags.SF === this.state.flags.OF);
        break;

      case 'jge':
      case 'jnl':
        this.conditionalJump(ops[0], nextAddr, this.state.flags.SF === this.state.flags.OF);
        break;

      case 'jl':
      case 'jnge':
        this.conditionalJump(ops[0], nextAddr, this.state.flags.SF !== this.state.flags.OF);
        break;

      case 'jle':
      case 'jng':
        this.conditionalJump(ops[0], nextAddr, this.state.flags.ZF || this.state.flags.SF !== this.state.flags.OF);
        break;

      case 'ja':
      case 'jnbe':
        this.conditionalJump(ops[0], nextAddr, !this.state.flags.CF && !this.state.flags.ZF);
        break;

      case 'jb':
      case 'jnae':
      case 'jc':
        this.conditionalJump(ops[0], nextAddr, this.state.flags.CF);
        break;

      case 'jae':
      case 'jnb':
      case 'jnc':
        this.conditionalJump(ops[0], nextAddr, !this.state.flags.CF);
        break;

      case 'jbe':
      case 'jna':
        this.conditionalJump(ops[0], nextAddr, this.state.flags.CF || this.state.flags.ZF);
        break;

      case 'js':
        this.conditionalJump(ops[0], nextAddr, this.state.flags.SF);
        break;

      case 'jns':
        this.conditionalJump(ops[0], nextAddr, !this.state.flags.SF);
        break;

      case 'call': {
        const target = this.parseOperand(ops[0]);
        this.push(nextAddr);
        this.state.registers.eip = this.readOperand(target);
        break;
      }

      case 'ret': {
        const retAddr = this.pop();
        this.state.registers.eip = retAddr;
        if (!this.instrMap.has(retAddr)) {
          this.state.halted = true;
        }
        break;
      }

      case 'leave': {
        this.state.registers.esp = this.state.registers.ebp;
        this.state.registers.ebp = this.pop();
        this.state.registers.eip = nextAddr;
        break;
      }

      case 'int': {
        this.state.halted = true;
        this.state.registers.eip = nextAddr;
        break;
      }

      case 'hlt': {
        this.state.halted = true;
        break;
      }

      default:
        this.state.registers.eip = nextAddr;
        break;
    }
  }

  private conditionalJump(targetOp: string, nextAddr: number, condition: boolean): void {
    if (condition) {
      const target = this.parseOperand(targetOp);
      this.state.registers.eip = this.readOperand(target);
    } else {
      this.state.registers.eip = nextAddr;
    }
  }

  private formatLog(instr: AsmInstruction, diffs: RegisterDiff[], flagChanges: Partial<X86Flags>): string {
    const hex = (n: number) => '0x' + (n >>> 0).toString(16).padStart(8, '0');
    let log = `${hex(instr.addr)}: ${instr.mnemonic} ${instr.operands}`;

    if (diffs.length > 0) {
      const changes = diffs
        .filter(d => d.reg !== 'eip')
        .map(d => `${d.reg.toUpperCase()}=${hex(d.newValue)}`)
        .join(', ');
      if (changes) log += ` → ${changes}`;
    }

    const fKeys = Object.keys(flagChanges) as (keyof X86Flags)[];
    if (fKeys.length > 0) {
      const fStr = fKeys.map(f => `${f}=${flagChanges[f] ? '1' : '0'}`).join(' ');
      log += ` [${fStr}]`;
    }

    return log;
  }

  reset(initialRegs?: Partial<Record<X86Register, number>>): void {
    this.memory.clear();
    this.state = {
      registers: { ...defaultRegisters(), ...initialRegs },
      flags: defaultFlags(),
      stack: [],
      stackBase: this.state.stackBase,
      halted: false,
    };
    if (!initialRegs?.eip && this.instructions.length > 0) {
      this.state.registers.eip = this.instructions[0].addr;
    }
    if (!initialRegs?.esp) {
      this.state.registers.esp = this.state.stackBase;
    }
    if (!initialRegs?.ebp) {
      this.state.registers.ebp = this.state.stackBase;
    }
  }

  getStackView(count = 16): Array<{ addr: number; value: number }> {
    const esp = this.state.registers.esp;
    const entries: Array<{ addr: number; value: number }> = [];
    for (let i = 0; i < count; i++) {
      const addr = this.u32(esp + i * 4);
      entries.push({ addr, value: this.readMem(addr, 4) });
    }
    return entries;
  }
}
