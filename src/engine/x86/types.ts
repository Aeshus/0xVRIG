export type X86Register =
  | 'eax' | 'ebx' | 'ecx' | 'edx' | 'esp' | 'ebp' | 'esi' | 'edi' | 'eip'
  | 'rax' | 'rbx' | 'rcx' | 'rdx' | 'rsp' | 'rbp' | 'rsi' | 'rdi' | 'rip'
  | 'r8' | 'r9' | 'r10' | 'r11' | 'r12' | 'r13' | 'r14' | 'r15';

export type Architecture = 'x86' | 'x86-64';

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
  registers: Record<string, number>;
  flags: X86Flags;
  stack: number[];
  stackBase: number;
  halted: boolean;
  arch: Architecture;
}

export interface RegisterDiff {
  reg: string;
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

export const X86_REGISTERS: X86Register[] = ['eax', 'ebx', 'ecx', 'edx', 'esp', 'ebp', 'esi', 'edi', 'eip'];

export const X64_REGISTERS: X86Register[] = [
  'rax', 'rbx', 'rcx', 'rdx', 'rsp', 'rbp', 'rsi', 'rdi', 'rip',
  'r8', 'r9', 'r10', 'r11', 'r12', 'r13', 'r14', 'r15',
];

export const ALL_REGISTERS: X86Register[] = [...X86_REGISTERS, ...X64_REGISTERS];
