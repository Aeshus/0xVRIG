import { Exercise } from '../types';
import { AsmInstruction } from '@/engine/x86/types';

const instructions: AsmInstruction[] = [
  { addr: 0x00400000, bytes: [0x48, 0xb8], mnemonic: 'mov', operands: 'rax, 0x7ffff7a52340', comment: 'Leaked libc address (e.g., __libc_start_main)' },
  { addr: 0x0040000a, bytes: [0x48, 0xbb], mnemonic: 'mov', operands: 'rbx, 0x7ffff7a52340', comment: 'Known offset of __libc_start_main' },
  { addr: 0x00400014, bytes: [0x48, 0x29, 0xd8], mnemonic: 'sub', operands: 'rax, rbx', comment: 'libc_base = leaked - known_offset' },
  { addr: 0x00400017, bytes: [0x48, 0x89, 0xc1], mnemonic: 'mov', operands: 'rcx, rax', comment: 'RCX = libc_base (0 in this example)' },
  { addr: 0x0040001a, bytes: [0x48, 0xb8], mnemonic: 'mov', operands: 'rax, 0x4526a', comment: 'one_gadget offset in libc' },
  { addr: 0x00400024, bytes: [0x48, 0x01, 0xc8], mnemonic: 'add', operands: 'rax, rcx', comment: 'RAX = libc_base + one_gadget_offset' },
  { addr: 0x00400027, bytes: [0x48, 0x89, 0xc2], mnemonic: 'mov', operands: 'rdx, rax', comment: 'RDX = full one_gadget address' },
  { addr: 0x0040002a, bytes: [0xf4], mnemonic: 'hlt', operands: '', comment: 'Overwrite ret addr with RDX → shell!' },
];

export const x6433: Exercise = {
  id: 'x64-33',
  unitId: 'unit7-x64',
  title: 'One-Gadget',
  desc: '<b>Goal:</b> A "one-gadget" is a single address in libc that, when jumped to, executes <code>execve("/bin/sh")</code> — no ROP chain needed! You find them with the <code>one_gadget</code> tool. Each has <b>constraints</b> (e.g., RAX==NULL, [RSP+0x30]==NULL) that must be satisfied.',
  source: {
    c: [
      { text: '// One-Gadget (Magic Gadget)', cls: 'comment' },
      { text: '// A single libc address that spawns a shell', cls: 'comment' },
      { text: '', cls: '' },
      { text: '// $ one_gadget /lib/x86_64-linux-gnu/libc.so.6', cls: 'comment' },
      { text: '// 0x4526a execve("/bin/sh", rsp+0x30, environ)', cls: 'comment' },
      { text: '//   constraints: [rsp+0x30] == NULL', cls: 'comment' },
      { text: '// 0xf02a4 execve("/bin/sh", rsp+0x50, environ)', cls: 'comment' },
      { text: '//   constraints: [rsp+0x50] == NULL', cls: 'comment' },
      { text: '', cls: '' },
      { text: '// Steps:', cls: 'comment' },
      { text: '// 1. Leak a libc address', cls: 'comment' },
      { text: '// 2. Calculate libc base', cls: 'comment' },
      { text: '// 3. Add one_gadget offset', cls: 'comment' },
      { text: '// 4. Overwrite return address', cls: 'comment' },
      { text: '', cls: '' },
      { text: 'mov rax, leaked_addr', cls: 'asm' },
      { text: 'sub rax, known_offset  ; libc_base', cls: 'asm' },
      { text: 'add rax, 0x4526a       ; one_gadget', cls: 'asm' },
      { text: '; overwrite ret with rax → shell!', cls: 'asm' },
    ],
  },
  mode: 'asm-step',
  vizMode: 'asm',
  asmArch: 'x86-64',
  asmInstructions: instructions,
  check: () => true,
  winTitle: 'One-Gadget!',
  winMsg: 'You understand one-gadget shortcuts for instant shell in libc.',
};
