import { Exercise } from '../types';
import { AsmInstruction } from '@/engine/x86/types';

const instructions: AsmInstruction[] = [
  { addr: 0x08048000, bytes: [0xb8, 0x0a, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: 'eax, 10', comment: 'EAX = 10' },
  { addr: 0x08048005, bytes: [0xbb, 0x05, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: 'ebx, 5', comment: 'EBX = 5' },
  { addr: 0x0804800a, bytes: [0x01, 0xd8], mnemonic: 'add', operands: 'eax, ebx', comment: 'EAX = EAX + EBX = 15' },
  { addr: 0x0804800c, bytes: [0x83, 0xe8, 0x03], mnemonic: 'sub', operands: 'eax, 3', comment: 'EAX = 15 - 3 = 12' },
  { addr: 0x0804800f, bytes: [0x40], mnemonic: 'inc', operands: 'eax', comment: 'EAX++ = 13' },
  { addr: 0x08048010, bytes: [0x40], mnemonic: 'inc', operands: 'eax', comment: 'EAX++ = 14' },
  { addr: 0x08048011, bytes: [0x48], mnemonic: 'dec', operands: 'eax', comment: 'EAX-- = 13' },
  { addr: 0x08048012, bytes: [0xb9, 0x04, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: 'ecx, 4', comment: 'ECX = 4 (multiplier)' },
  { addr: 0x08048017, bytes: [0xf7, 0xe1], mnemonic: 'mul', operands: 'ecx', comment: 'EAX = EAX * ECX = 52' },
  { addr: 0x08048019, bytes: [0xf4], mnemonic: 'hlt', operands: '', comment: 'Final: EAX = 52' },
];

export const asm04: Exercise = {
  id: 'asm-04',
  unitId: 'unit0-asm',
  title: 'Arithmetic',
  desc: '<b>Goal:</b> Practice arithmetic instructions. ADD adds, SUB subtracts, INC/DEC add/subtract 1, MUL multiplies EAX by the operand. Trace through and predict EAX\'s final value before stepping!',
  source: {
    c: [
      { text: '// Arithmetic Instructions', cls: 'comment' },
      { text: '// ADD dst, src  → dst = dst + src', cls: 'comment' },
      { text: '// SUB dst, src  → dst = dst - src', cls: 'comment' },
      { text: '// INC dst       → dst = dst + 1', cls: 'comment' },
      { text: '// DEC dst       → dst = dst - 1', cls: 'comment' },
      { text: '// MUL src       → EAX = EAX * src', cls: 'comment' },
      { text: '', cls: '' },
      { text: 'mov eax, 10       ; start with 10', cls: 'asm' },
      { text: 'mov ebx, 5', cls: 'asm' },
      { text: 'add eax, ebx      ; 10 + 5 = 15', cls: 'asm' },
      { text: 'sub eax, 3        ; 15 - 3 = 12', cls: 'asm' },
      { text: 'inc eax           ; 12 + 1 = 13', cls: 'asm' },
      { text: 'inc eax           ; 13 + 1 = 14', cls: 'asm' },
      { text: 'dec eax           ; 14 - 1 = 13', cls: 'asm' },
      { text: 'mov ecx, 4', cls: 'asm' },
      { text: 'mul ecx           ; 13 * 4 = 52', cls: 'asm' },
      { text: 'hlt', cls: 'asm' },
    ],
  },
  mode: 'asm-step',
  vizMode: 'asm',
  asmInstructions: instructions,
  check: () => true,
  winTitle: 'Arithmetic Master!',
  winMsg: 'You can trace x86 arithmetic operations.',
};
