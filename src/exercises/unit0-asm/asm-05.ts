import { Exercise } from '../types';
import { AsmInstruction } from '@/engine/x86/types';

const instructions: AsmInstruction[] = [
  { addr: 0x08048000, bytes: [0xb8, 0x05, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: 'eax, 5', comment: 'EAX = 5' },
  { addr: 0x08048005, bytes: [0xbb, 0x05, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: 'ebx, 5', comment: 'EBX = 5' },
  { addr: 0x0804800a, bytes: [0x39, 0xd8], mnemonic: 'cmp', operands: 'eax, ebx', comment: 'Compare: 5 - 5 = 0 → ZF=1' },
  { addr: 0x0804800c, bytes: [0xb9, 0x0a, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: 'ecx, 10', comment: 'ECX = 10' },
  { addr: 0x08048011, bytes: [0x39, 0xc8], mnemonic: 'cmp', operands: 'eax, ecx', comment: 'Compare: 5 - 10 = -5 → SF=1, CF=1' },
  { addr: 0x08048013, bytes: [0x39, 0xd9], mnemonic: 'cmp', operands: 'ecx, ebx', comment: 'Compare: 10 - 5 = 5 → SF=0, CF=0' },
  { addr: 0x08048015, bytes: [0xb8, 0x00, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: 'eax, 0', comment: 'EAX = 0' },
  { addr: 0x0804801a, bytes: [0x85, 0xc0], mnemonic: 'test', operands: 'eax, eax', comment: 'TEST: 0 AND 0 = 0 → ZF=1 (common zero-check)' },
  { addr: 0x0804801c, bytes: [0xf4], mnemonic: 'hlt', operands: '', comment: 'Watch how flags change with each CMP!' },
];

export const asm05: Exercise = {
  id: 'asm-05',
  unitId: 'unit0-asm',
  title: 'CMP & Flags',
  desc: '<b>Goal:</b> Understand CPU flags. CMP subtracts without storing the result — it only sets flags. <b>ZF</b> (Zero Flag) = result was 0. <b>SF</b> (Sign Flag) = result was negative. <b>CF</b> (Carry Flag) = unsigned borrow. TEST does AND and sets flags.',
  source: {
    c: [
      { text: '// CMP & Flags', cls: 'comment' },
      { text: '// CMP a, b → computes a - b, sets flags', cls: 'comment' },
      { text: '// ZF = 1 if a == b (result is zero)', cls: 'comment' },
      { text: '// SF = 1 if a < b  (result is negative)', cls: 'comment' },
      { text: '// CF = 1 if a < b  (unsigned borrow)', cls: 'comment' },
      { text: '// TEST a, b → computes a AND b, sets flags', cls: 'comment' },
      { text: '', cls: '' },
      { text: 'mov eax, 5', cls: 'asm' },
      { text: 'mov ebx, 5', cls: 'asm' },
      { text: 'cmp eax, ebx     ; 5 == 5 → ZF=1', cls: 'asm' },
      { text: 'mov ecx, 10', cls: 'asm' },
      { text: 'cmp eax, ecx     ; 5 < 10 → SF=1, CF=1', cls: 'asm' },
      { text: 'cmp ecx, ebx     ; 10 > 5 → SF=0, CF=0', cls: 'asm' },
      { text: 'mov eax, 0', cls: 'asm' },
      { text: 'test eax, eax    ; 0 AND 0 = 0 → ZF=1', cls: 'asm' },
      { text: 'hlt', cls: 'asm' },
    ],
  },
  mode: 'asm-step',
  vizMode: 'asm',
  asmInstructions: instructions,
  check: () => true,
  winTitle: 'Flags Understood!',
  winMsg: 'You know how CMP sets CPU flags for conditional logic.',
};
