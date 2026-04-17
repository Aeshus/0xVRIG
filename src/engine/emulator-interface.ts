import { AsmInstruction, StepResult } from './x86/types';

export interface EmulatorState {
  registers: Record<string, number>;
  flags: Record<string, boolean>;
  halted: boolean;
  arch: string;
}

export interface Emulator {
  step(): StepResult | null;
  reset(initialRegs?: Record<string, number>): void;
  getCurrentInstruction(): AsmInstruction | null;
  getStackView(count?: number): Array<{ addr: number; value: number }>;
  readMem(addr: number, size: number): number;
  writeMem(addr: number, value: number, size: number): void;
  readonly state: EmulatorState;
  readonly instructions: AsmInstruction[];
}
