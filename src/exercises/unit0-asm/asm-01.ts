import { Exercise } from '../types';
import { AsmInstruction } from '@/engine/x86/types';

const instructions: AsmInstruction[] = [
  { addr: 0x08048000, bytes: [0xb8, 0x0a, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: 'eax, 10', comment: 'Load 10 into EAX (accumulator)' },
  { addr: 0x08048005, bytes: [0xbb, 0x14, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: 'ebx, 20', comment: 'Load 20 into EBX (base)' },
  { addr: 0x0804800a, bytes: [0xb9, 0x1e, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: 'ecx, 30', comment: 'Load 30 into ECX (counter)' },
  { addr: 0x0804800f, bytes: [0xba, 0x28, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: 'edx, 40', comment: 'Load 40 into EDX (data)' },
  { addr: 0x08048014, bytes: [0x89, 0xc3], mnemonic: 'mov', operands: 'ebx, eax', comment: 'Copy EAX into EBX (both now 10)' },
  { addr: 0x08048016, bytes: [0x31, 0xc0], mnemonic: 'xor', operands: 'eax, eax', comment: 'Clear EAX to zero (common idiom)' },
  { addr: 0x08048018, bytes: [0xf4], mnemonic: 'hlt', operands: '', comment: 'Halt execution' },
];

export const asm01: Exercise = {
  id: 'asm-01',
  unitId: 'unit0-asm',
  title: 'Registers',
  desc: '<b>Goal:</b> Step through each instruction and observe how registers change. x86 has 8 general-purpose 32-bit registers. EAX is the "accumulator," EBX the "base," ECX the "counter," and EDX the "data" register.',
  source: {
    c: [
      { text: '// x86 Registers', cls: 'comment' },
      { text: '// EAX — accumulator (return values)', cls: 'comment' },
      { text: '// EBX — base (general purpose)', cls: 'comment' },
      { text: '// ECX — counter (loop counts)', cls: 'comment' },
      { text: '// EDX — data (I/O, multiply)', cls: 'comment' },
      { text: '// ESI — source index', cls: 'comment' },
      { text: '// EDI — destination index', cls: 'comment' },
      { text: '// ESP — stack pointer', cls: 'comment' },
      { text: '// EBP — base pointer (frame)', cls: 'comment' },
      { text: '// EIP — instruction pointer', cls: 'comment' },
      { text: '', cls: '' },
      { text: 'mov eax, 10     ; EAX = 10', cls: 'asm' },
      { text: 'mov ebx, 20     ; EBX = 20', cls: 'asm' },
      { text: 'mov ecx, 30     ; ECX = 30', cls: 'asm' },
      { text: 'mov edx, 40     ; EDX = 40', cls: 'asm' },
      { text: 'mov ebx, eax    ; EBX = EAX', cls: 'asm' },
      { text: 'xor eax, eax    ; EAX = 0', cls: 'asm' },
      { text: 'hlt', cls: 'asm' },
    ],
  },
  mode: 'asm-step',
  vizMode: 'asm',
  asmInstructions: instructions,
  check: (_sim: any, _heap: any, _symbols: Record<string, number>, _flags: Record<string, boolean>) => {
    return true;
  },
  winTitle: 'Registers Explored!',
  winMsg: 'You learned about the x86 general-purpose registers.',
};
