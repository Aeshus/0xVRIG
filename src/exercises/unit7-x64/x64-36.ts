import { Exercise } from '../types';
import { AsmInstruction } from '@/engine/x86/types';

const instructions: AsmInstruction[] = [
  // Step 1: PIE leak via format string
  { addr: 0x00001000, bytes: [0x48, 0xb8], mnemonic: 'mov', operands: 'rax, 0x0000555555555830', comment: 'Step 1: Leaked PIE addr (format string %p)' },
  { addr: 0x0000100a, bytes: [0x48, 0x2d], mnemonic: 'sub', operands: 'rax, 0x830', comment: 'PIE base = leaked - offset' },
  { addr: 0x00001014, bytes: [0x48, 0x89, 0xc3], mnemonic: 'mov', operands: 'rbx, rax', comment: 'RBX = PIE base' },
  // Step 2: Use PIE base to find GOT entry, leak libc
  { addr: 0x00001017, bytes: [0x48, 0x8d, 0x83], mnemonic: 'lea', operands: 'rax, [rbx+0x3fc8]', comment: 'Step 2: RAX = GOT entry for puts (PIE+0x3fc8)' },
  { addr: 0x00001024, bytes: [0x48, 0xb8], mnemonic: 'mov', operands: 'rax, 0x00007ffff7a64e80', comment: 'Leaked libc puts address from GOT' },
  { addr: 0x0000102e, bytes: [0x48, 0xbb], mnemonic: 'mov', operands: 'rbx, 0x64e80', comment: 'Known puts offset in libc' },
  { addr: 0x00001038, bytes: [0x48, 0x29, 0xd8], mnemonic: 'sub', operands: 'rax, rbx', comment: 'libc_base = puts_addr - puts_offset' },
  { addr: 0x0000103b, bytes: [0x48, 0x89, 0xc1], mnemonic: 'mov', operands: 'rcx, rax', comment: 'RCX = libc_base' },
  // Step 3: Calculate one_gadget
  { addr: 0x0000103e, bytes: [0x48, 0xb8], mnemonic: 'mov', operands: 'rax, 0x4526a', comment: 'Step 3: one_gadget offset' },
  { addr: 0x00001048, bytes: [0x48, 0x01, 0xc8], mnemonic: 'add', operands: 'rax, rcx', comment: 'RAX = libc_base + one_gadget → shell addr!' },
  { addr: 0x0000104b, bytes: [0xf4], mnemonic: 'hlt', operands: '', comment: 'Full chain: PIE leak → libc leak → one_gadget!' },
];

export const x6436: Exercise = {
  id: 'x64-36',
  unitId: 'unit7-x64',
  title: 'x64 Full Chain',
  desc: '<b>Goal:</b> Chain everything together! <b>Step 1:</b> Leak PIE address → compute binary base. <b>Step 2:</b> Read GOT entry → leak libc address → compute libc base. <b>Step 3:</b> Calculate one-gadget address → overwrite return → shell. This is a realistic modern x64 exploit chain.',
  source: {
    c: [
      { text: '// Full x64 Exploit Chain', cls: 'comment' },
      { text: '// PIE + ASLR + NX enabled', cls: 'comment' },
      { text: '', cls: '' },
      { text: '// Step 1: Leak PIE address', cls: 'comment' },
      { text: '//   Use format string (%p) or info leak', cls: 'comment' },
      { text: '//   Subtract known offset → PIE base', cls: 'comment' },
      { text: '', cls: '' },
      { text: '// Step 2: Leak libc address', cls: 'comment' },
      { text: '//   Read GOT entry (resolved by dynamic linker)', cls: 'comment' },
      { text: '//   Subtract known symbol offset → libc base', cls: 'comment' },
      { text: '', cls: '' },
      { text: '// Step 3: One-gadget', cls: 'comment' },
      { text: '//   libc_base + one_gadget_offset → shell!', cls: 'comment' },
      { text: '', cls: '' },
      { text: '// Real-world: typically requires 2 overflows', cls: 'comment' },
      { text: '// (one for leak, one for exploit) or a', cls: 'comment' },
      { text: '// vulnerability that allows both', cls: 'comment' },
    ],
  },
  mode: 'asm-step',
  vizMode: 'asm',
  asmArch: 'x86-64',
  asmInstructions: instructions,
  check: () => true,
  winTitle: 'Full Chain Complete!',
  winMsg: 'You understand the full modern x64 exploit chain: PIE leak → libc leak → one-gadget.',
};
