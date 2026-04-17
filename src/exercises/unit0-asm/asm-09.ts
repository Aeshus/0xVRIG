import { Exercise } from '../types';
import { AsmInstruction } from '@/engine/x86/types';

const instructions: AsmInstruction[] = [
  // main prologue
  { addr: 0x08048000, bytes: [0x55], mnemonic: 'push', operands: 'ebp', comment: 'Save caller\'s frame pointer' },
  { addr: 0x08048001, bytes: [0x89, 0xe5], mnemonic: 'mov', operands: 'ebp, esp', comment: 'Set up new frame pointer' },
  { addr: 0x08048003, bytes: [0x83, 0xec, 0x10], mnemonic: 'sub', operands: 'esp, 16', comment: 'Allocate 16 bytes for locals' },
  // local variables
  { addr: 0x08048006, bytes: [0xc7, 0x45, 0xfc, 0x0a, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: '[ebp-4], 10', comment: 'int x = 10  (local at [ebp-4])' },
  { addr: 0x0804800d, bytes: [0xc7, 0x45, 0xf8, 0x14, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: '[ebp-8], 20', comment: 'int y = 20  (local at [ebp-8])' },
  // compute x + y
  { addr: 0x08048014, bytes: [0x8b, 0x45, 0xfc], mnemonic: 'mov', operands: 'eax, [ebp-4]', comment: 'Load x' },
  { addr: 0x08048017, bytes: [0x03, 0x45, 0xf8], mnemonic: 'add', operands: 'eax, [ebp-8]', comment: 'EAX = x + y = 30' },
  // epilogue
  { addr: 0x0804801a, bytes: [0xc9], mnemonic: 'leave', operands: '', comment: 'Restore ESP and EBP (undo prologue)' },
  { addr: 0x0804801b, bytes: [0xf4], mnemonic: 'hlt', operands: '', comment: 'EAX = 30, stack frame destroyed' },
];

export const asm09: Exercise = {
  id: 'asm-09',
  unitId: 'unit0-asm',
  title: 'Stack Frames',
  desc: '<b>Goal:</b> Understand the function prologue and epilogue — the setup and teardown of every function\'s stack frame. <b>Prologue:</b> push ebp; mov ebp,esp; sub esp,N. <b>Epilogue:</b> leave (= mov esp,ebp; pop ebp). Local variables live at negative offsets from EBP.',
  source: {
    c: [
      { text: '// Stack Frame Layout', cls: 'comment' },
      { text: '//   [ebp+8]  → first argument', cls: 'comment' },
      { text: '//   [ebp+4]  → return address', cls: 'comment' },
      { text: '//   [ebp]    → saved EBP', cls: 'comment' },
      { text: '//   [ebp-4]  → first local variable', cls: 'comment' },
      { text: '//   [ebp-8]  → second local variable', cls: 'comment' },
      { text: '', cls: '' },
      { text: '// C equivalent:', cls: 'comment' },
      { text: '// void func() {', cls: 'comment' },
      { text: '//   int x = 10, y = 20;', cls: 'comment' },
      { text: '//   return x + y;', cls: 'comment' },
      { text: '// }', cls: 'comment' },
      { text: '', cls: '' },
      { text: '; — Prologue —', cls: 'label' },
      { text: 'push ebp          ; save old frame', cls: 'asm' },
      { text: 'mov ebp, esp      ; new frame pointer', cls: 'asm' },
      { text: 'sub esp, 16       ; space for locals', cls: 'asm' },
      { text: '', cls: '' },
      { text: 'mov [ebp-4], 10   ; int x = 10', cls: 'asm' },
      { text: 'mov [ebp-8], 20   ; int y = 20', cls: 'asm' },
      { text: 'mov eax, [ebp-4]  ; load x', cls: 'asm' },
      { text: 'add eax, [ebp-8]  ; eax = x + y', cls: 'asm' },
      { text: '', cls: '' },
      { text: '; — Epilogue —', cls: 'label' },
      { text: 'leave             ; restore frame', cls: 'asm' },
      { text: 'hlt', cls: 'asm' },
    ],
  },
  mode: 'asm-step',
  vizMode: 'asm',
  asmInstructions: instructions,
  check: () => true,
  winTitle: 'Stack Frames Mastered!',
  winMsg: 'You understand prologue/epilogue — the structure that buffer overflows target.',
};
