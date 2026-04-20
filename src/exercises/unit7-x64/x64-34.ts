import { Exercise } from '../types';
import { AsmInstruction } from '@/engine/x86/types';

const instructions: AsmInstruction[] = [
  // Simulate byte-by-byte canary brute force
  { addr: 0x00400000, bytes: [0x48, 0xb8], mnemonic: 'mov', operands: 'rax, 0x00deadbeefcafe00', comment: 'The actual 8-byte canary (null byte at position 0!)' },
  { addr: 0x0040000a, bytes: [0x48, 0x89, 0xc1], mnemonic: 'mov', operands: 'rcx, rax', comment: 'Save canary for comparison' },
  // Brute-force byte 1 (byte 0 is always 0x00)
  { addr: 0x0040000d, bytes: [0xb2, 0x00], mnemonic: 'mov', operands: 'edx, 0', comment: 'Guess byte 0: always 0x00 (known!)' },
  { addr: 0x0040000f, bytes: [0xb6, 0xfe], mnemonic: 'mov', operands: 'esi, 0xfe', comment: 'Guess byte 1: try 0xFE...' },
  { addr: 0x00400011, bytes: [0xb6, 0xca], mnemonic: 'mov', operands: 'esi, 0xca', comment: '...try 0xCA — match! (real: brute 256 tries)' },
  { addr: 0x00400013, bytes: [0xb7, 0xfe], mnemonic: 'mov', operands: 'edi, 0xfe', comment: 'Guess byte 2: try 0xFE...' },
  { addr: 0x00400015, bytes: [0xb7, 0xbe], mnemonic: 'mov', operands: 'edi, 0xbe', comment: '...try 0xBE — match!' },
  // Show the recovered canary
  { addr: 0x00400017, bytes: [0x48, 0xb8], mnemonic: 'mov', operands: 'rax, 0x00deadbeefcafe00', comment: 'Full canary recovered after 7 * 256 = 1792 attempts max' },
  { addr: 0x00400021, bytes: [0xf4], mnemonic: 'hlt', operands: '', comment: 'Canary leaked! Can now overflow safely.' },
];

export const x6434: Exercise = {
  id: 'x64-34',
  unitId: 'unit7-x64',
  title: 'x64 Canary Leak',
  desc: '<b>Goal:</b> x64 canaries are 8 bytes with byte 0 always <code>\\x00</code>. In a forking server, each fork has the <b>same canary</b>. You can brute-force it one byte at a time: overwrite byte N, if the server doesn\'t crash → correct guess. 7 bytes × 256 tries = 1792 max attempts.',
  source: {
    c: [
      { text: '// x64 Canary Byte-by-Byte Brute Force', cls: 'comment' },
      { text: '// Canary: 0x00DEADBEEFCAFE00', cls: 'comment' },
      { text: '//   byte 0: always 0x00 (known)', cls: 'comment' },
      { text: '//   bytes 1-7: brute-force 256 each', cls: 'comment' },
      { text: '', cls: '' },
      { text: '// Requirements:', cls: 'comment' },
      { text: '// 1. Server must fork() per connection', cls: 'comment' },
      { text: '//    (same canary in child processes)', cls: 'comment' },
      { text: '// 2. Distinguishable crash vs no-crash', cls: 'comment' },
      { text: '', cls: '' },
      { text: '// Algorithm:', cls: 'comment' },
      { text: '// for byte_pos in 1..7:', cls: 'comment' },
      { text: '//   for guess in 0..255:', cls: 'comment' },
      { text: '//     overwrite buf + canary[0..pos] + guess', cls: 'comment' },
      { text: '//     if no crash: canary[pos] = guess; break', cls: 'comment' },
      { text: '', cls: '' },
      { text: '// Max attempts: 7 * 256 = 1,792', cls: 'comment' },
      { text: '// (vs brute-forcing 8 bytes: 2^56 ≈ impossible)', cls: 'comment' },
    ],
  },
  mode: 'asm-quiz',
  vizMode: 'asm',
  asmArch: 'x86-64',
  asmInstructions: instructions,
  protections: [{ name: 'Canary', status: 'bypassed' }],
  asmQuiz: [
    { question: 'What is byte 0 of an x64 stack canary always set to?', answer: 0, format: 'hex', hint: 'The null byte prevents string functions from reading past the canary.' },
    { question: 'Maximum brute-force attempts to leak a full 8-byte canary (byte-by-byte)?', answer: 1792, format: 'decimal', hint: '7 unknown bytes × 256 guesses each = 1792.' },
  ],
  check: () => false,
  winTitle: 'Canary Cracked!',
  winMsg: 'You understand byte-by-byte canary brute force in forking servers.',
};
