import { Exercise } from '../types';
import { AsmInstruction } from '@/engine/x86/types';

const instructions: AsmInstruction[] = [
  // main: call add3(10, 20, 30)
  { addr: 0x00400000, bytes: [0x55], mnemonic: 'push', operands: 'rbp', comment: 'main prologue' },
  { addr: 0x00400001, bytes: [0x48, 0x89, 0xe5], mnemonic: 'mov', operands: 'rbp, rsp', comment: '' },
  { addr: 0x00400004, bytes: [0xba, 0x1e, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: 'edx, 30', comment: 'arg3 in EDX (3rd arg register)' },
  { addr: 0x00400009, bytes: [0xbe, 0x14, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: 'esi, 20', comment: 'arg2 in ESI (2nd arg register)' },
  { addr: 0x0040000e, bytes: [0xbf, 0x0a, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: 'edi, 10', comment: 'arg1 in EDI (1st arg register)' },
  { addr: 0x00400013, bytes: [0xe8, 0x06, 0x00, 0x00, 0x00], mnemonic: 'call', operands: '0x0040001e', comment: 'call add3 — NO stack args needed!' },
  { addr: 0x00400018, bytes: [0x89, 0xc3], mnemonic: 'mov', operands: 'ebx, eax', comment: 'Result in EAX (same as x86)' },
  { addr: 0x0040001a, bytes: [0xc9], mnemonic: 'leave', operands: '', comment: '' },
  { addr: 0x0040001b, bytes: [0xf4], mnemonic: 'hlt', operands: '', comment: 'EBX = 60' },
  // add3(rdi=a, rsi=b, rdx=c): return a+b+c
  { addr: 0x0040001e, bytes: [0x55], mnemonic: 'push', operands: 'rbp', comment: 'add3 prologue' },
  { addr: 0x0040001f, bytes: [0x48, 0x89, 0xe5], mnemonic: 'mov', operands: 'rbp, rsp', comment: '' },
  { addr: 0x00400022, bytes: [0x89, 0xf8], mnemonic: 'mov', operands: 'eax, edi', comment: 'EAX = arg1 (10)' },
  { addr: 0x00400024, bytes: [0x01, 0xf0], mnemonic: 'add', operands: 'eax, esi', comment: 'EAX += arg2 (20) → 30' },
  { addr: 0x00400026, bytes: [0x01, 0xd0], mnemonic: 'add', operands: 'eax, edx', comment: 'EAX += arg3 (30) → 60' },
  { addr: 0x00400028, bytes: [0xc9], mnemonic: 'leave', operands: '', comment: '' },
  { addr: 0x00400029, bytes: [0xc3], mnemonic: 'ret', operands: '', comment: 'Return 60 in EAX' },
];

export const x6430: Exercise = {
  id: 'x64-30',
  unitId: 'unit7-x64',
  title: 'x64 Calling Convention',
  desc: '<b>Goal:</b> x64 System V calling convention passes the first 6 integer args in registers: <b>RDI, RSI, RDX, RCX, R8, R9</b>. Only the 7th+ arg goes on the stack. This is much faster than x86 cdecl (which pushes everything). Return value still in RAX/EAX.',
  source: {
    c: [
      { text: '// x64 System V Calling Convention', cls: 'comment' },
      { text: '// Args: RDI, RSI, RDX, RCX, R8, R9', cls: 'comment' },
      { text: '// Return: RAX', cls: 'comment' },
      { text: '// Caller-saved: RAX, RCX, RDX, RSI, RDI, R8-R11', cls: 'comment' },
      { text: '// Callee-saved: RBX, RBP, R12-R15', cls: 'comment' },
      { text: '', cls: '' },
      { text: '// int add3(int a, int b, int c) {', cls: 'comment' },
      { text: '//   return a + b + c;', cls: 'comment' },
      { text: '// }', cls: 'comment' },
      { text: '// int main() { return add3(10,20,30); }', cls: 'comment' },
      { text: '', cls: '' },
      { text: 'main:', cls: 'label' },
      { text: '  mov edx, 30     ; arg3 → RDX', cls: 'asm' },
      { text: '  mov esi, 20     ; arg2 → RSI', cls: 'asm' },
      { text: '  mov edi, 10     ; arg1 → RDI', cls: 'asm' },
      { text: '  call add3       ; no stack push!', cls: 'asm' },
      { text: '  mov ebx, eax    ; result', cls: 'asm' },
      { text: '', cls: '' },
      { text: 'add3:', cls: 'label' },
      { text: '  mov eax, edi    ; a', cls: 'asm' },
      { text: '  add eax, esi    ; + b', cls: 'asm' },
      { text: '  add eax, edx    ; + c', cls: 'asm' },
      { text: '  ret', cls: 'asm' },
    ],
  },
  mode: 'asm-step',
  vizMode: 'asm',
  asmArch: 'x86-64',
  asmInstructions: instructions,
  check: () => true,
  winTitle: 'x64 Calling Convention!',
  winMsg: 'You know System V x64: args in RDI, RSI, RDX, RCX, R8, R9.',
};
