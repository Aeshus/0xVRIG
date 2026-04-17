'use client';

import { Emulator } from '@/engine/emulator-interface';
import { AsmInstruction } from '@/engine/x86/types';
import styles from './AsmViz.module.css';

interface AsmVizProps {
  emulator: Emulator | null;
  renderKey: number;
  changedRegs?: Set<string>;
}

const X86_GP = ['eax', 'ebx', 'ecx', 'edx', 'esi', 'edi'];
const X86_PTR = ['esp', 'ebp', 'eip'];
const X64_GP = ['rax', 'rbx', 'rcx', 'rdx', 'rsi', 'rdi', 'r8', 'r9', 'r10', 'r11', 'r12', 'r13', 'r14', 'r15'];
const X64_PTR = ['rsp', 'rbp', 'rip'];

const ARM_GP = ['r0', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8', 'r9', 'r10', 'r11', 'r12'];
const ARM_PTR = ['r13', 'r14', 'r15'];

const MIPS_GP = ['$v0', '$v1', '$a0', '$a1', '$a2', '$a3', '$t0', '$t1', '$t2', '$t3', '$t4', '$t5', '$t6', '$t7', '$s0', '$s1', '$s2', '$s3', '$s4', '$s5', '$s6', '$s7', '$t8', '$t9'];
const MIPS_PTR = ['$sp', '$fp', '$ra', 'pc'];
const MIPS_EXTRA = ['hi', 'lo'];

const REG_TOOLTIPS: Record<string, string> = {
  // x86
  eax: 'Accumulator -- return values, arithmetic',
  ebx: 'Base register -- general purpose, callee-saved',
  ecx: 'Counter -- loop counts, shift amounts',
  edx: 'Data -- I/O, multiply/divide extension',
  esi: 'Source index -- string/memory source',
  edi: 'Destination index -- string/memory destination',
  esp: 'Stack pointer -- top of stack, changes on push/pop/call/ret',
  ebp: 'Base pointer -- frame reference for local variables',
  eip: 'Instruction pointer -- address of next instruction to execute',
  // x86-64
  rax: 'Accumulator -- return values, syscall number',
  rbx: 'Base register -- general purpose, callee-saved',
  rcx: 'Counter -- 4th argument in System V ABI',
  rdx: 'Data -- 3rd argument in System V ABI',
  rsi: 'Source index -- 2nd argument in System V ABI',
  rdi: 'Destination index -- 1st argument in System V ABI',
  rsp: 'Stack pointer -- top of stack',
  rbp: 'Base pointer -- frame reference, callee-saved',
  rip: 'Instruction pointer -- address of next instruction',
  r8: '5th argument in System V ABI', r9: '6th argument in System V ABI',
  r10: 'Temp register, caller-saved', r11: 'Temp register, caller-saved',
  r12: 'General purpose, callee-saved', r13: 'General purpose, callee-saved',
  r14: 'General purpose, callee-saved', r15: 'General purpose, callee-saved',
  // ARM
  r0: 'Argument 1 / return value',
  r1: 'Argument 2 / return value (64-bit)',
  r2: 'Argument 3', r3: 'Argument 4',
  r4: 'General purpose, callee-saved', r5: 'General purpose, callee-saved',
  r6: 'General purpose, callee-saved', r7: 'Syscall number (Thumb)',
  // r8-r12 use the x86-64 fallback from above, override:
  // MIPS
  '$v0': 'Return value / syscall number', '$v1': 'Return value (64-bit)',
  '$a0': 'Argument 1', '$a1': 'Argument 2', '$a2': 'Argument 3', '$a3': 'Argument 4',
  '$t0': 'Temporary, caller-saved', '$t1': 'Temporary, caller-saved',
  '$t2': 'Temporary, caller-saved', '$t3': 'Temporary, caller-saved',
  '$t4': 'Temporary, caller-saved', '$t5': 'Temporary, caller-saved',
  '$t6': 'Temporary, caller-saved', '$t7': 'Temporary, caller-saved',
  '$t8': 'Temporary, caller-saved', '$t9': 'Temporary, caller-saved',
  '$s0': 'Saved, callee-saved', '$s1': 'Saved, callee-saved',
  '$s2': 'Saved, callee-saved', '$s3': 'Saved, callee-saved',
  '$s4': 'Saved, callee-saved', '$s5': 'Saved, callee-saved',
  '$s6': 'Saved, callee-saved', '$s7': 'Saved, callee-saved',
  '$sp': 'Stack pointer', '$fp': 'Frame pointer',
  '$ra': 'Return address -- saved by JAL, used by JR $ra',
  hi: 'Multiply high -- upper 32 bits of MULT result',
  lo: 'Multiply low -- lower 32 bits of MULT result',
  pc: 'Program counter',
};

// ARM-specific overrides (since r8-r12 clash with x64 r8-r15 tooltips)
const ARM_TOOLTIPS: Record<string, string> = {
  r0: 'Argument 1 / return value (AAPCS)',
  r1: 'Argument 2', r2: 'Argument 3', r3: 'Argument 4',
  r4: 'General purpose, callee-saved', r5: 'General purpose, callee-saved',
  r6: 'General purpose, callee-saved', r7: 'Syscall number (Thumb mode)',
  r8: 'General purpose, callee-saved', r9: 'Platform register / callee-saved',
  r10: 'General purpose, callee-saved', r11: 'Frame pointer (FP)',
  r12: 'Intra-procedure scratch (IP)',
  r13: 'Stack pointer (SP)', r14: 'Link register (LR) -- return address',
  r15: 'Program counter (PC)',
};

function hex(n: number, width = 8): string {
  return '0x' + (n >>> 0).toString(16).padStart(width, '0');
}

function hexBytes(bytes: number[]): string {
  return bytes.map(b => b.toString(16).padStart(2, '0')).join(' ');
}

function getArchConfig(arch: string) {
  switch (arch) {
    case 'arm':
      return {
        gpRegs: ARM_GP, ptrRegs: ARM_PTR, extraRegs: [] as string[],
        ipReg: 'r15', spReg: 'r13', hexW: 8,
        flagNames: ['N', 'Z', 'C', 'V'],
        tooltips: ARM_TOOLTIPS,
      };
    case 'mips':
      return {
        gpRegs: MIPS_GP, ptrRegs: MIPS_PTR, extraRegs: MIPS_EXTRA,
        ipReg: 'pc', spReg: '$sp', hexW: 8,
        flagNames: [] as string[],
        tooltips: REG_TOOLTIPS,
      };
    case 'x86-64':
      return {
        gpRegs: X64_GP, ptrRegs: X64_PTR, extraRegs: [] as string[],
        ipReg: 'rip', spReg: 'rsp', hexW: 16,
        flagNames: ['ZF', 'SF', 'CF', 'OF'],
        tooltips: REG_TOOLTIPS,
      };
    default: // x86
      return {
        gpRegs: X86_GP, ptrRegs: X86_PTR, extraRegs: [] as string[],
        ipReg: 'eip', spReg: 'esp', hexW: 8,
        flagNames: ['ZF', 'SF', 'CF', 'OF'],
        tooltips: REG_TOOLTIPS,
      };
  }
}

export default function AsmViz({ emulator, renderKey, changedRegs }: AsmVizProps) {
  void renderKey;
  if (!emulator) return <div className={styles.container}>No emulator loaded</div>;

  const { registers, flags, halted, arch } = emulator.state;
  const config = getArchConfig(arch);
  const currentAddr = registers[config.ipReg];
  const stackView = emulator.getStackView(8);

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>REGISTERS ({arch.toUpperCase()})</div>
        <div className={styles.regGrid}>
          {config.gpRegs.map(r => (
            <div key={r} className={`${styles.regRow} ${changedRegs?.has(r) ? styles.regChanged : ''}`} data-tooltip={config.tooltips[r] || REG_TOOLTIPS[r]}>
              <span className={styles.regName}>{r.toUpperCase()}</span>
              <span className={styles.regValue}>{hex(registers[r] ?? 0, config.hexW)}</span>
            </div>
          ))}
        </div>
        <div className={styles.regGrid}>
          {config.ptrRegs.map(r => (
            <div key={r} className={`${styles.regRow} ${styles.regPtr} ${changedRegs?.has(r) ? styles.regChanged : ''}`} data-tooltip={config.tooltips[r] || REG_TOOLTIPS[r]}>
              <span className={styles.regName}>{r.toUpperCase()}</span>
              <span className={styles.regValue}>{hex(registers[r] ?? 0, config.hexW)}</span>
            </div>
          ))}
        </div>
        {config.extraRegs.length > 0 && (
          <div className={styles.regGrid}>
            {config.extraRegs.map(r => (
              <div key={r} className={`${styles.regRow} ${changedRegs?.has(r) ? styles.regChanged : ''}`} data-tooltip={config.tooltips[r] || REG_TOOLTIPS[r]}>
                <span className={styles.regName}>{r.toUpperCase()}</span>
                <span className={styles.regValue}>{hex(registers[r] ?? 0, config.hexW)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {config.flagNames.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>FLAGS</div>
          <div className={styles.flagRow}>
            {config.flagNames.map(f => (
              <span key={f} className={`${styles.flag} ${flags[f] ? styles.flagSet : ''}`}>
                {f}={flags[f] ? '1' : '0'}
              </span>
            ))}
          </div>
        </div>
      )}

      {arch === 'mips' && flags['delaySlot'] && (
        <div className={styles.section}>
          <div style={{ color: 'var(--amber)', fontSize: '10px' }}>DELAY SLOT ACTIVE</div>
        </div>
      )}

      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          INSTRUCTIONS {halted && <span className={styles.halted}>[HALTED]</span>}
        </div>
        <div className={styles.instrList}>
          {emulator.instructions.map((instr: AsmInstruction) => (
            <div
              key={instr.addr}
              className={`${styles.instrRow} ${instr.addr === currentAddr ? styles.instrCurrent : ''}`}
            >
              <span className={styles.instrAddr}>{hex(instr.addr, config.hexW)}</span>
              <span className={styles.instrBytes}>{hexBytes(instr.bytes)}</span>
              <span className={styles.instrMnemonic}>{instr.mnemonic}</span>
              <span className={styles.instrOperands}>{instr.operands}</span>
              {instr.comment && <span className={styles.instrComment}>; {instr.comment}</span>}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>STACK ({config.spReg.toUpperCase()} {'\u2192'} {'\u2193'})</div>
        <div className={styles.stackView}>
          {stackView.map(({ addr, value }) => (
            <div key={addr} className={`${styles.stackRow} ${addr === (registers[config.spReg] ?? 0) ? styles.stackEsp : ''}`}>
              <span className={styles.stackAddr}>{hex(addr, config.hexW)}</span>
              <span className={styles.stackValue}>{hex(value, config.hexW)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
