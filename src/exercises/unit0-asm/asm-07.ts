import { Exercise } from '../types';
import { AsmInstruction } from '@/engine/x86/types';

const instructions: AsmInstruction[] = [
  // main:
  { addr: 0x08048000, bytes: [0xb8, 0x07, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: 'eax, 7', comment: 'Argument for our function' },
  { addr: 0x08048005, bytes: [0x50], mnemonic: 'push', operands: 'eax', comment: 'Push argument onto stack' },
  { addr: 0x08048006, bytes: [0xe8, 0x05, 0x00, 0x00, 0x00], mnemonic: 'call', operands: '0x08048010', comment: 'CALL pushes return addr, jumps to double' },
  { addr: 0x0804800b, bytes: [0x83, 0xc4, 0x04], mnemonic: 'add', operands: 'esp, 4', comment: 'Clean up argument from stack' },
  { addr: 0x0804800e, bytes: [0xf4], mnemonic: 'hlt', operands: '', comment: 'EAX should be 14 (7*2)' },
  // double function:
  { addr: 0x08048010, bytes: [0x8b, 0x44, 0x24, 0x04], mnemonic: 'mov', operands: 'eax, [esp+4]', comment: 'Load argument (skip return addr at [esp])' },
  { addr: 0x08048014, bytes: [0x01, 0xc0], mnemonic: 'add', operands: 'eax, eax', comment: 'EAX = EAX * 2' },
  { addr: 0x08048016, bytes: [0xc3], mnemonic: 'ret', operands: '', comment: 'RET pops return address, jumps to it' },
];

export const asm07: Exercise = {
  id: 'asm-07',
  unitId: 'unit0-asm',
  title: 'CALL & RET',
  desc: '<b>Goal:</b> Understand function calls. CALL pushes the <b>return address</b> (address of next instruction) onto the stack, then jumps to the function. RET pops that address and jumps back. This is the mechanism exploited in buffer overflows!',
  source: {
    c: [
      { text: '// CALL & RET', cls: 'comment' },
      { text: '// CALL addr → push EIP+5; jmp addr', cls: 'comment' },
      { text: '// RET      → pop EIP (jump to return addr)', cls: 'comment' },
      { text: '', cls: '' },
      { text: '// Equivalent C:', cls: 'comment' },
      { text: '// int double(int x) { return x * 2; }', cls: 'comment' },
      { text: '// int main() { return double(7); }', cls: 'comment' },
      { text: '', cls: '' },
      { text: 'main:', cls: 'label' },
      { text: '  mov eax, 7', cls: 'asm' },
      { text: '  push eax        ; push argument', cls: 'asm' },
      { text: '  call double     ; push ret addr, jump', cls: 'asm' },
      { text: '  add esp, 4      ; clean up stack', cls: 'asm' },
      { text: '  hlt             ; EAX = 14', cls: 'asm' },
      { text: '', cls: '' },
      { text: 'double:', cls: 'label' },
      { text: '  mov eax, [esp+4] ; get arg (past ret addr)', cls: 'asm' },
      { text: '  add eax, eax     ; x * 2', cls: 'asm' },
      { text: '  ret              ; pop & jump to caller', cls: 'asm' },
    ],
  },
  mode: 'asm-step',
  vizMode: 'asm',
  asmInstructions: instructions,
  check: () => true,
  winTitle: 'Functions Understood!',
  winMsg: 'You know how CALL and RET work — the foundation of stack-based exploitation.',
};
