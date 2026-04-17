import { Exercise } from '../types';
import { AsmInstruction } from '@/engine/x86/types';

const instructions: AsmInstruction[] = [
  { addr: 0x08048000, bytes: [0xb8, 0x01, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: 'eax, 1', comment: 'Loop counter = 1' },
  { addr: 0x08048005, bytes: [0xbb, 0x00, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: 'ebx, 0', comment: 'Sum accumulator = 0' },
  // loop start
  { addr: 0x0804800a, bytes: [0x01, 0xc3], mnemonic: 'add', operands: 'ebx, eax', comment: 'sum += counter' },
  { addr: 0x0804800c, bytes: [0x40], mnemonic: 'inc', operands: 'eax', comment: 'counter++' },
  { addr: 0x0804800d, bytes: [0x83, 0xf8, 0x06], mnemonic: 'cmp', operands: 'eax, 6', comment: 'counter <= 5?' },
  { addr: 0x08048010, bytes: [0x7e, 0xf8], mnemonic: 'jle', operands: '0x0804800a', comment: 'If counter <= 5, jump back to loop' },
  // after loop
  { addr: 0x08048012, bytes: [0x83, 0xfb, 0x0f], mnemonic: 'cmp', operands: 'ebx, 15', comment: 'Check: is sum == 15?' },
  { addr: 0x08048015, bytes: [0x74, 0x05], mnemonic: 'je', operands: '0x0804801c', comment: 'If equal, jump to success' },
  { addr: 0x08048017, bytes: [0xb9, 0x00, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: 'ecx, 0', comment: 'Failure path' },
  { addr: 0x0804801c, bytes: [0xb9, 0x01, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: 'ecx, 1', comment: 'Success! ECX = 1' },
  { addr: 0x08048021, bytes: [0xf4], mnemonic: 'hlt', operands: '', comment: 'EBX should be 15 (1+2+3+4+5)' },
];

export const asm06: Exercise = {
  id: 'asm-06',
  unitId: 'unit0-asm',
  title: 'Jumps',
  desc: '<b>Goal:</b> See conditional jumps in action. This code sums 1+2+3+4+5 using a loop. JLE (Jump if Less or Equal) creates the loop. JE (Jump if Equal) checks the result. Watch EIP jump backward!',
  source: {
    c: [
      { text: '// Conditional Jumps', cls: 'comment' },
      { text: '// JE/JZ  — jump if equal (ZF=1)', cls: 'comment' },
      { text: '// JNE/JNZ — jump if not equal (ZF=0)', cls: 'comment' },
      { text: '// JG/JNLE — jump if greater (signed)', cls: 'comment' },
      { text: '// JL/JNGE — jump if less (signed)', cls: 'comment' },
      { text: '// JLE/JNG — jump if less or equal', cls: 'comment' },
      { text: '', cls: '' },
      { text: 'mov eax, 1        ; counter = 1', cls: 'asm' },
      { text: 'mov ebx, 0        ; sum = 0', cls: 'asm' },
      { text: 'loop:', cls: 'label' },
      { text: '  add ebx, eax    ; sum += counter', cls: 'asm' },
      { text: '  inc eax         ; counter++', cls: 'asm' },
      { text: '  cmp eax, 6', cls: 'asm' },
      { text: '  jle loop        ; while counter <= 5', cls: 'asm' },
      { text: '', cls: '' },
      { text: '  cmp ebx, 15     ; check result', cls: 'asm' },
      { text: '  je success', cls: 'asm' },
      { text: '  mov ecx, 0      ; fail', cls: 'asm' },
      { text: 'success:', cls: 'label' },
      { text: '  mov ecx, 1      ; pass!', cls: 'asm' },
      { text: '  hlt', cls: 'asm' },
    ],
  },
  mode: 'asm-step',
  vizMode: 'asm',
  asmInstructions: instructions,
  check: () => true,
  winTitle: 'Jump Master!',
  winMsg: 'You understand conditional jumps and loops in x86.',
};
