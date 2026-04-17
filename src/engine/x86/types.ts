export type X86Register = 'eax' | 'ebx' | 'ecx' | 'edx' | 'esp' | 'ebp' | 'esi' | 'edi' | 'eip';

export interface X86Flags {
  ZF: boolean;
  SF: boolean;
  CF: boolean;
  OF: boolean;
}

export interface AsmInstruction {
  addr: number;
  bytes: number[];
  mnemonic: string;
  operands: string;
  comment?: string;
}

export type Operand =
  | { type: 'reg'; reg: X86Register }
  | { type: 'imm'; value: number }
  | { type: 'mem'; base?: X86Register; index?: X86Register; scale?: number; disp?: number; size?: number };

export interface X86State {
  registers: Record<X86Register, number>;
  flags: X86Flags;
  stack: number[];
  stackBase: number;
  halted: boolean;
}

export interface RegisterDiff {
  reg: X86Register;
  oldValue: number;
  newValue: number;
}

export interface StepResult {
  instruction: AsmInstruction;
  diffs: RegisterDiff[];
  flagChanges: Partial<X86Flags>;
  memoryWrites: Array<{ addr: number; value: number; size: number }>;
  memoryReads: Array<{ addr: number; value: number; size: number }>;
  log: string;
  halted: boolean;
}
