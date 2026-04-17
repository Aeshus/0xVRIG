import { Exercise } from '../types';
import { AsmInstruction } from '@/engine/x86/types';

const instructions: AsmInstruction[] = [
  { addr: 0x08048000, bytes: [0xb8, 0x41, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: 'eax, 0x41', comment: 'Immediate to register' },
  { addr: 0x08048005, bytes: [0x89, 0xc3], mnemonic: 'mov', operands: 'ebx, eax', comment: 'Register to register' },
  { addr: 0x08048007, bytes: [0xa3, 0x00, 0x90, 0x04, 0x08], mnemonic: 'mov', operands: '[0x08049000], eax', comment: 'Register to memory' },
  { addr: 0x0804800c, bytes: [0x8b, 0x0d, 0x00, 0x90, 0x04, 0x08], mnemonic: 'mov', operands: 'ecx, [0x08049000]', comment: 'Memory to register' },
  { addr: 0x08048012, bytes: [0xba, 0xff, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: 'edx, 0xff', comment: 'Another immediate load' },
  { addr: 0x08048017, bytes: [0x89, 0x15, 0x04, 0x90, 0x04, 0x08], mnemonic: 'mov', operands: '[0x08049004], edx', comment: 'Store to adjacent address' },
  { addr: 0x0804801d, bytes: [0xf4], mnemonic: 'hlt', operands: '', comment: '' },
];

export const asm02: Exercise = {
  id: 'asm-02',
  unitId: 'unit0-asm',
  title: 'MOV',
  desc: '<b>Goal:</b> Understand the MOV instruction — the workhorse of x86. MOV copies data between registers, memory, and immediates. Watch how data flows: <code>immediate → register → memory → register</code>.',
  source: {
    c: [
      { text: '// MOV — Move (Copy) Data', cls: 'comment' },
      { text: '// Syntax: MOV dst, src', cls: 'comment' },
      { text: '// Forms:', cls: 'comment' },
      { text: '//   MOV reg, imm     ; immediate to register', cls: 'comment' },
      { text: '//   MOV reg, reg     ; register to register', cls: 'comment' },
      { text: '//   MOV [mem], reg   ; register to memory', cls: 'comment' },
      { text: '//   MOV reg, [mem]   ; memory to register', cls: 'comment' },
      { text: '', cls: '' },
      { text: 'mov eax, 0x41', cls: 'asm' },
      { text: 'mov ebx, eax', cls: 'asm' },
      { text: 'mov [0x08049000], eax', cls: 'asm' },
      { text: 'mov ecx, [0x08049000]', cls: 'asm' },
      { text: 'mov edx, 0xff', cls: 'asm' },
      { text: 'mov [0x08049004], edx', cls: 'asm' },
      { text: 'hlt', cls: 'asm' },
    ],
  },
  mode: 'asm-quiz',
  vizMode: 'asm',
  asmInstructions: instructions,
  asmQuiz: [
    { question: 'After "mov [0x08049000], eax" and "mov ecx, [0x08049000]", what is ECX?', answer: 0x41, format: 'hex', hint: 'EAX held 0x41 (65), which was stored to memory then loaded into ECX.' },
    { question: 'What is EDX at the end?', answer: 0xff, format: 'hex', hint: 'EDX was loaded with immediate 0xFF.' },
  ],
  check: () => false,
  winTitle: 'MOV Mastered!',
  winMsg: 'You understand data movement between registers, memory, and immediates.',
};
