import { Exercise } from '../types';

export const ctf50: Exercise = {
  id: 'ctf-50',
  unitId: 'unit10-challenges',
  title: 'CTF: Medium',
  desc: '<b>CTF Challenge!</b> Format string vulnerability + stack overflow combo. First use a format string to leak the canary value, then overflow the buffer while preserving the canary. Buffer is 16 bytes with canary protection enabled. Two-stage exploit!',
  source: {
    c: [
      { text: '// CTF Medium — Format String + Canary Bypass', cls: 'comment' },
      { text: '// Protections: Stack Canary', cls: 'comment' },
      { text: '// Buffer: 16 bytes', cls: 'comment' },
      { text: '', cls: '' },
      { text: 'void win() { system("/bin/sh"); }', cls: 'fn' },
      { text: '', cls: '' },
      { text: 'void vuln() {', cls: 'fn' },
      { text: '  char buf[16];', cls: 'vuln' },
      { text: '  char fmt[32];', cls: '' },
      { text: '  printf("Fmt: ");', cls: '' },
      { text: '  gets(fmt);', cls: '' },
      { text: '  printf(fmt);   // format string leak!', cls: 'vuln' },
      { text: '  printf("\\nBuf: ");', cls: '' },
      { text: '  gets(buf);     // overflow with leaked canary', cls: 'vuln' },
      { text: '}', cls: '' },
    ],
  },
  mode: 'input-hex',
  vizMode: 'stack',
  bufSize: 16,
  canary: true,
  showSymbols: true,
  showBuilder: true,
  showCalc: true,
  check: (sim: any, _heap: any, symbols: Record<string, number>) => {
    if (!sim) return false;
    const retAddr = sim.readWord(sim.retOffset);
    return retAddr === symbols.win && sim.checkCanary();
  },
  protections: [
    { name: 'NX', status: 'active' },
    { name: 'ASLR', status: 'disabled' },
    { name: 'Canary', status: 'active' },
  ],
  winTitle: 'CTF Medium Solved!',
  winMsg: 'Format string leak + canary bypass — a classic two-stage exploit.',
};
