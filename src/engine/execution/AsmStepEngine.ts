import { X86Emulator } from '../x86/emulator';
import { AsmInstruction, X86Register, StepResult } from '../x86/types';

export interface AsmExerciseConfig {
  instructions: AsmInstruction[];
  initialRegisters?: Partial<Record<X86Register, number>>;
  stackBase?: number;
  initialMemory?: Array<{ addr: number; value: number; size: number }>;
}

export function createEmulatorFromConfig(config: AsmExerciseConfig): X86Emulator {
  const emu = new X86Emulator(
    config.instructions,
    config.initialRegisters,
    config.stackBase ?? 0xbfff0200,
  );

  if (config.initialMemory) {
    for (const { addr, value, size } of config.initialMemory) {
      emu.writeMem(addr, value, size);
    }
  }

  return emu;
}

export function stepEmulator(emu: X86Emulator): StepResult | null {
  return emu.step();
}

export function runToEnd(emu: X86Emulator, maxSteps = 1000): StepResult[] {
  const results: StepResult[] = [];
  while (!emu.state.halted && results.length < maxSteps) {
    const result = emu.step();
    if (!result) break;
    results.push(result);
  }
  return results;
}
