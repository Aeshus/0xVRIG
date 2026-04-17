import { Exercise } from '../types';
import { AsmInstruction } from '@/engine/x86/types';

const instructions: AsmInstruction[] = [
  { addr: 0x08048000, bytes: [0xb8, 0x0a, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: 'eax, 10', comment: 'Load immediate into EAX' },
  { addr: 0x08048005, bytes: [0xbb, 0x14, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: 'ebx, 20', comment: 'Load immediate into EBX' },
  { addr: 0x0804800a, bytes: [0xb9, 0x1e, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: 'ecx, 30', comment: 'Load immediate into ECX' },
  { addr: 0x0804800f, bytes: [0xba, 0x28, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: 'edx, 40', comment: 'Load immediate into EDX' },
  { addr: 0x08048014, bytes: [0x89, 0xc3], mnemonic: 'mov', operands: 'ebx, eax', comment: 'Register-to-register copy' },
  { addr: 0x08048016, bytes: [0x31, 0xc0], mnemonic: 'xor', operands: 'eax, eax', comment: 'What does XOR with itself do?' },
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
      { text: 'mov eax, 10', cls: 'asm' },
      { text: 'mov ebx, 20', cls: 'asm' },
      { text: 'mov ecx, 30', cls: 'asm' },
      { text: 'mov edx, 40', cls: 'asm' },
      { text: 'mov ebx, eax', cls: 'asm' },
      { text: 'xor eax, eax', cls: 'asm' },
      { text: 'hlt', cls: 'asm' },
    ],
  },
  mode: 'asm-quiz',
  vizMode: 'asm',
  asmInstructions: instructions,
  asmQuiz: [
    { question: 'What value is in EBX after "mov ebx, eax"?', answer: 10, format: 'decimal', hint: 'EAX was set to 10 before the copy.' },
    { question: 'What value is in EAX at the end (after xor eax, eax)?', answer: 0, format: 'hex', hint: 'XOR a register with itself always produces 0.' },
  ],
  check: () => false,
  winTitle: 'Registers Explored!',
  winMsg: 'You learned about the x86 general-purpose registers.',
};
