import { Exercise } from '../types';
import { AsmInstruction } from '@/engine/x86/types';

const instructions: AsmInstruction[] = [
  { addr: 0x08048000, bytes: [0xb8, 0xaa, 0xbb, 0xcc, 0xdd], mnemonic: 'mov', operands: 'eax, 0xddccbbaa', comment: 'Load a value to push' },
  { addr: 0x08048005, bytes: [0x50], mnemonic: 'push', operands: 'eax', comment: 'Push EAX — watch ESP change' },
  { addr: 0x08048006, bytes: [0xbb, 0x11, 0x22, 0x33, 0x44], mnemonic: 'mov', operands: 'ebx, 0x44332211', comment: 'Load another value' },
  { addr: 0x0804800b, bytes: [0x53], mnemonic: 'push', operands: 'ebx', comment: 'Push EBX' },
  { addr: 0x0804800c, bytes: [0x59], mnemonic: 'pop', operands: 'ecx', comment: 'Pop into ECX — which value comes out?' },
  { addr: 0x0804800d, bytes: [0x5a], mnemonic: 'pop', operands: 'edx', comment: 'Pop into EDX' },
  { addr: 0x0804800e, bytes: [0x6a, 0x42], mnemonic: 'push', operands: '0x42', comment: 'Push immediate' },
  { addr: 0x08048010, bytes: [0x58], mnemonic: 'pop', operands: 'eax', comment: 'Pop into EAX' },
  { addr: 0x08048011, bytes: [0xf4], mnemonic: 'hlt', operands: '', comment: '' },
];

export const asm03: Exercise = {
  id: 'asm-03',
  unitId: 'unit0-asm',
  title: 'PUSH & POP',
  desc: '<b>Goal:</b> See how the stack works. PUSH decreases ESP by 4 and writes a value. POP reads the value at ESP and increases ESP by 4. The stack is <b>LIFO</b> — Last In, First Out. Watch ESP change with each operation!',
  source: {
    c: [
      { text: '// PUSH & POP — Stack Operations', cls: 'comment' },
      { text: '// PUSH: ESP -= 4; [ESP] = value', cls: 'comment' },
      { text: '// POP:  value = [ESP]; ESP += 4', cls: 'comment' },
      { text: '// Stack grows DOWN (toward lower addresses)', cls: 'comment' },
      { text: '', cls: '' },
      { text: 'mov eax, 0xDDCCBBAA', cls: 'asm' },
      { text: 'push eax', cls: 'asm' },
      { text: 'mov ebx, 0x44332211', cls: 'asm' },
      { text: 'push ebx', cls: 'asm' },
      { text: 'pop ecx            ; what value?', cls: 'asm' },
      { text: 'pop edx', cls: 'asm' },
      { text: 'push 0x42', cls: 'asm' },
      { text: 'pop eax', cls: 'asm' },
      { text: 'hlt', cls: 'asm' },
    ],
  },
  mode: 'asm-quiz',
  vizMode: 'asm',
  asmInstructions: instructions,
  asmQuiz: [
    { question: 'After pushing EAX (0xDDCCBBAA) then EBX (0x44332211), what does POP ECX give?', answer: 0x44332211, format: 'hex', hint: 'LIFO: the last value pushed (EBX) is the first popped.' },
    { question: 'What is EAX at the very end (after final pop)?', answer: 0x42, format: 'hex', hint: 'The last push was 0x42, and it gets popped into EAX.' },
  ],
  check: () => false,
  winTitle: 'Stack Operations!',
  winMsg: 'You understand PUSH, POP, and LIFO stack ordering.',
};
