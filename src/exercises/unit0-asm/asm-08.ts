import { Exercise } from '../types';
import { AsmInstruction } from '@/engine/x86/types';

const instructions: AsmInstruction[] = [
  { addr: 0x08048000, bytes: [0xb8, 0x00, 0x90, 0x04, 0x08], mnemonic: 'mov', operands: 'eax, 0x08049000', comment: 'EAX = base address of array' },
  { addr: 0x08048005, bytes: [0xc7, 0x00, 0x0a, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: '[eax], 10', comment: 'array[0] = 10  (direct)' },
  { addr: 0x0804800b, bytes: [0xc7, 0x40, 0x04, 0x14, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: '[eax+4], 20', comment: 'array[1] = 20  (base+displacement)' },
  { addr: 0x08048012, bytes: [0xc7, 0x40, 0x08, 0x1e, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: '[eax+8], 30', comment: 'array[2] = 30' },
  { addr: 0x08048019, bytes: [0xbb, 0x01, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: 'ebx, 1', comment: 'EBX = index = 1' },
  { addr: 0x0804801e, bytes: [0x8b, 0x0c, 0x98], mnemonic: 'mov', operands: 'ecx, [eax+ebx*4]', comment: 'ECX = array[1] = 20 (scaled index!)' },
  { addr: 0x08048021, bytes: [0x8d, 0x50, 0x08], mnemonic: 'lea', operands: 'edx, [eax+8]', comment: 'EDX = address of array[2] (LEA = load addr)' },
  { addr: 0x08048024, bytes: [0x8b, 0x75, 0xfc], mnemonic: 'mov', operands: 'esi, [ebp-4]', comment: 'Local variable access (stack frame)' },
  { addr: 0x08048027, bytes: [0xf4], mnemonic: 'hlt', operands: '', comment: 'Done!' },
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
      { text: 'mov eax, 0x08049000  ; base of array', cls: 'asm' },
      { text: 'mov [eax], 10        ; array[0] = 10', cls: 'asm' },
      { text: 'mov [eax+4], 20      ; array[1] = 20', cls: 'asm' },
      { text: 'mov [eax+8], 30      ; array[2] = 30', cls: 'asm' },
      { text: '', cls: '' },
      { text: 'mov ebx, 1           ; index', cls: 'asm' },
      { text: 'mov ecx, [eax+ebx*4] ; array[index]', cls: 'asm' },
      { text: 'lea edx, [eax+8]     ; &array[2]', cls: 'asm' },
      { text: 'mov esi, [ebp-4]     ; local var access', cls: 'asm' },
      { text: 'hlt', cls: 'asm' },
    ],
  },
  mode: 'asm-step',
  vizMode: 'asm',
  asmInstructions: instructions,
  check: () => true,
  winTitle: 'Addressing Expert!',
  winMsg: 'You understand x86 memory addressing modes and LEA.',
};
