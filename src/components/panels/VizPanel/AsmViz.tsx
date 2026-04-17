'use client';

import { X86Emulator } from '@/engine/x86/emulator';
import { X86Register, AsmInstruction } from '@/engine/x86/types';
import styles from './AsmViz.module.css';

interface AsmVizProps {
  emulator: X86Emulator | null;
  renderKey: number;
  changedRegs?: Set<string>;
}

const GP_REGS: X86Register[] = ['eax', 'ebx', 'ecx', 'edx', 'esi', 'edi'];
const PTR_REGS: X86Register[] = ['esp', 'ebp', 'eip'];
const FLAG_NAMES = ['ZF', 'SF', 'CF', 'OF'] as const;

function hex8(n: number): string {
  return '0x' + (n >>> 0).toString(16).padStart(8, '0');
}

function hexBytes(bytes: number[]): string {
  return bytes.map(b => b.toString(16).padStart(2, '0')).join(' ');
}

export default function AsmViz({ emulator, renderKey, changedRegs }: AsmVizProps) {
  void renderKey;
  if (!emulator) return <div className={styles.container}>No emulator loaded</div>;

  const { registers, flags, halted } = emulator.state;
  const currentAddr = registers.eip;
  const stackView = emulator.getStackView(8);

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>REGISTERS</div>
        <div className={styles.regGrid}>
          {GP_REGS.map(r => (
            <div key={r} className={`${styles.regRow} ${changedRegs?.has(r) ? styles.regChanged : ''}`}>
              <span className={styles.regName}>{r.toUpperCase()}</span>
              <span className={styles.regValue}>{hex8(registers[r])}</span>
            </div>
          ))}
        </div>
        <div className={styles.regGrid}>
          {PTR_REGS.map(r => (
            <div key={r} className={`${styles.regRow} ${styles.regPtr} ${changedRegs?.has(r) ? styles.regChanged : ''}`}>
              <span className={styles.regName}>{r.toUpperCase()}</span>
              <span className={styles.regValue}>{hex8(registers[r])}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>FLAGS</div>
        <div className={styles.flagRow}>
          {FLAG_NAMES.map(f => (
            <span key={f} className={`${styles.flag} ${flags[f] ? styles.flagSet : ''}`}>
              {f}={flags[f] ? '1' : '0'}
            </span>
          ))}
        </div>
      </div>

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
              <span className={styles.instrAddr}>{hex8(instr.addr)}</span>
              <span className={styles.instrBytes}>{hexBytes(instr.bytes)}</span>
              <span className={styles.instrMnemonic}>{instr.mnemonic}</span>
              <span className={styles.instrOperands}>{instr.operands}</span>
              {instr.comment && <span className={styles.instrComment}>; {instr.comment}</span>}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>STACK (ESP → ↓)</div>
        <div className={styles.stackView}>
          {stackView.map(({ addr, value }) => (
            <div key={addr} className={`${styles.stackRow} ${addr === registers.esp ? styles.stackEsp : ''}`}>
              <span className={styles.stackAddr}>{hex8(addr)}</span>
              <span className={styles.stackValue}>{hex8(value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
