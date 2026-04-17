import { Exercise } from '../types';
import { AsmInstruction } from '@/engine/x86/types';

const instructions: AsmInstruction[] = [
  { addr: 0x00400000, bytes: [0x55], mnemonic: 'push', operands: 'rbp', comment: 'Prologue — how many bytes does PUSH move here?' },
  { addr: 0x00400001, bytes: [0x48, 0x89, 0xe5], mnemonic: 'mov', operands: 'rbp, rsp', comment: 'Frame pointer setup' },
  { addr: 0x00400004, bytes: [0x48, 0x83, 0xec, 0x20], mnemonic: 'sub', operands: 'rsp, 32', comment: 'Allocate local space' },
  { addr: 0x00400008, bytes: [0x48, 0xc7, 0x45, 0xf8, 0x41, 0x41, 0x41, 0x41], mnemonic: 'mov', operands: 'qword [rbp-8], 0x41414141', comment: 'Local variable' },
  { addr: 0x00400010, bytes: [0x48, 0xc7, 0x45, 0xf0, 0x42, 0x42, 0x42, 0x42], mnemonic: 'mov', operands: 'qword [rbp-16], 0x42424242', comment: 'Local variable' },
  { addr: 0x00400018, bytes: [0x48, 0x8b, 0x45, 0xf8], mnemonic: 'mov', operands: 'rax, [rbp-8]', comment: 'Load first local' },
  { addr: 0x0040001c, bytes: [0x48, 0x03, 0x45, 0xf0], mnemonic: 'add', operands: 'rax, [rbp-16]', comment: 'Add second local' },
  { addr: 0x00400020, bytes: [0xc9], mnemonic: 'leave', operands: '', comment: 'Epilogue' },
  { addr: 0x00400021, bytes: [0xf4], mnemonic: 'hlt', operands: '', comment: '' },
];

export const x6429: Exercise = {
  id: 'x64-29',
  unitId: 'unit7-x64',
  title: 'x64 Stack Frame',
  desc: '<b>Goal:</b> See the x64 stack frame. Key differences from x86: PUSH/POP move <b>8 bytes</b> (not 4), pointers are 8 bytes, and RSP/RBP replace ESP/EBP. The stack still grows downward. Local variables are at negative offsets from RBP.',
  source: {
    c: [
      { text: '// x64 vs x86 Stack Differences', cls: 'comment' },
      { text: '// • PUSH/POP operate on 8 bytes', cls: 'comment' },
      { text: '// • Pointers are 8 bytes (64-bit)', cls: 'comment' },
      { text: '// • RSP, RBP, RIP replace ESP, EBP, EIP', cls: 'comment' },
      { text: '// • 128-byte "red zone" below RSP', cls: 'comment' },
      { text: '//   (leaf functions can use without sub rsp)', cls: 'comment' },
      { text: '', cls: '' },
      { text: 'push rbp', cls: 'asm' },
      { text: 'mov rbp, rsp', cls: 'asm' },
      { text: 'sub rsp, 32', cls: 'asm' },
      { text: 'mov qword [rbp-8], 0x41414141', cls: 'asm' },
      { text: 'mov qword [rbp-16], 0x42424242', cls: 'asm' },
      { text: 'mov rax, [rbp-8]', cls: 'asm' },
      { text: 'add rax, [rbp-16]', cls: 'asm' },
      { text: 'leave', cls: 'asm' },
      { text: 'hlt', cls: 'asm' },
    ],
  },
  mode: 'asm-quiz',
  vizMode: 'asm',
  asmArch: 'x86-64',
  asmInstructions: instructions,
  asmQuiz: [
    { question: 'How many bytes does PUSH move on x64?', answer: 8, format: 'decimal', hint: 'x64 uses 8-byte (64-bit) pushes, not 4-byte like x86.' },
    { question: 'What is RAX after adding [rbp-8] and [rbp-16]? (0x41414141 + 0x42424242)', answer: 0x83838383, format: 'hex', hint: 'Just add the two values.' },
  ],
  check: () => false,
  winTitle: 'x64 Stack!',
  winMsg: 'You understand 64-bit stack frames with 8-byte words.',
};
