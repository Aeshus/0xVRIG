import { Exercise } from '../types';
import { AsmInstruction } from '@/engine/x86/types';

const instructions: AsmInstruction[] = [
  { addr: 0x08048000, bytes: [0xb8, 0x00, 0x90, 0x04, 0x08], mnemonic: 'mov', operands: 'eax, 0x08049000', comment: 'Base address of array' },
  { addr: 0x08048005, bytes: [0xc7, 0x00, 0x0a, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: '[eax], 10', comment: 'Direct addressing' },
  { addr: 0x0804800b, bytes: [0xc7, 0x40, 0x04, 0x14, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: '[eax+4], 20', comment: 'Base + displacement' },
  { addr: 0x08048012, bytes: [0xc7, 0x40, 0x08, 0x1e, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: '[eax+8], 30', comment: '' },
  { addr: 0x08048019, bytes: [0xbb, 0x01, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: 'ebx, 1', comment: 'Index value' },
  { addr: 0x0804801e, bytes: [0x8b, 0x0c, 0x98], mnemonic: 'mov', operands: 'ecx, [eax+ebx*4]', comment: 'Scaled index — which element?' },
  { addr: 0x08048021, bytes: [0x8d, 0x50, 0x08], mnemonic: 'lea', operands: 'edx, [eax+8]', comment: 'LEA loads ADDRESS, not value' },
  { addr: 0x08048024, bytes: [0x8b, 0x75, 0xfc], mnemonic: 'mov', operands: 'esi, [ebp-4]', comment: 'Stack frame local variable' },
  { addr: 0x08048027, bytes: [0xf4], mnemonic: 'hlt', operands: '', comment: '' },
];

export const asm08: Exercise = {
  id: 'asm-08',
  unitId: 'unit0-asm',
  title: 'Memory Addressing',
  desc: '<b>Goal:</b> Master x86 addressing modes. <code>[reg]</code> = direct, <code>[reg+N]</code> = displacement, <code>[reg+reg*scale]</code> = indexed (for arrays). LEA loads the <i>address</i> itself, not the value at that address.',
  source: {
    c: [
      { text: '// Memory Addressing Modes', cls: 'comment' },
      { text: '// [reg]           — direct', cls: 'comment' },
      { text: '// [reg+disp]      — base + displacement', cls: 'comment' },
      { text: '// [reg+reg*scale] — base + scaled index', cls: 'comment' },
      { text: '// LEA — Load Effective Address (addr, not value)', cls: 'comment' },
      { text: '', cls: '' },
      { text: '// Like C: int array[3];', cls: 'comment' },
      { text: 'mov eax, 0x08049000', cls: 'asm' },
      { text: 'mov [eax], 10', cls: 'asm' },
      { text: 'mov [eax+4], 20', cls: 'asm' },
      { text: 'mov [eax+8], 30', cls: 'asm' },
      { text: '', cls: '' },
      { text: 'mov ebx, 1', cls: 'asm' },
      { text: 'mov ecx, [eax+ebx*4]', cls: 'asm' },
      { text: 'lea edx, [eax+8]', cls: 'asm' },
      { text: 'mov esi, [ebp-4]', cls: 'asm' },
      { text: 'hlt', cls: 'asm' },
    ],
  },
  mode: 'asm-quiz',
  vizMode: 'asm',
  asmInstructions: instructions,
  asmQuiz: [
    { question: 'What is ECX after "mov ecx, [eax+ebx*4]" (array[1])?', answer: 20, format: 'decimal', hint: 'EBX=1, so [eax + 1*4] = array[1] = 20.' },
    { question: 'What address does LEA edx, [eax+8] put in EDX?', answer: 0x08049008, format: 'hex', hint: 'EAX = 0x08049000, so 0x08049000 + 8 = 0x08049008. LEA computes the address, not the value.' },
  ],
  check: () => false,
  winTitle: 'Addressing Expert!',
  winMsg: 'You understand x86 memory addressing modes and LEA.',
};
