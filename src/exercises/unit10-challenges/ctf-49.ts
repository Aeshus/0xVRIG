import { Exercise } from '../types';

export const ctf49: Exercise = {
  id: 'ctf-49',
  unitId: 'unit10-challenges',
  title: 'CTF: Easy',
  desc: '<b>CTF Challenge!</b> Basic stack overflow with ret2win. The buffer is 24 bytes, no canary, no ASLR. Find the win() address in the symbol table and overwrite the return address. You need 24 bytes of padding + 4 bytes for saved EBP + 4 bytes for the return address.',
  source: {
    c: [
      { text: '// CTF Easy — ret2win', cls: 'comment' },
      { text: '// Protections: NONE', cls: 'comment' },
      { text: '// Buffer: 24 bytes', cls: 'comment' },
      { text: '', cls: '' },
      { text: 'void win() {', cls: 'fn' },
      { text: '  system("/bin/sh");', cls: '' },
      { text: '}', cls: '' },
      { text: '', cls: '' },
      { text: 'void vuln() {', cls: 'fn' },
      { text: '  char buf[24];', cls: 'vuln' },
      { text: '  printf("Enter: ");', cls: '' },
      { text: '  gets(buf);', cls: 'vuln' },
      { text: '}', cls: '' },
    ],
  },
  mode: 'input-hex',
  vizMode: 'stack',
  bufSize: 24,
  showSymbols: true,
  showBuilder: true,
  showCalc: true,
  check: (sim: any, _heap: any, symbols: Record<string, number>) => {
    if (!sim) return false;
    const retAddr = sim.readWord(sim.retOffset);
    return retAddr === symbols.win;
  },
  winTitle: 'CTF Easy Solved!',
  winMsg: 'Basic ret2win — the bread and butter of binary exploitation.',
};
