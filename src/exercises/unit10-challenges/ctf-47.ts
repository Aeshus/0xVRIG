import { Exercise } from '../types';
import { BASE_SYMBOLS } from '../shared/symbols';

export const ctf47: Exercise = {
  id: 'ctf-47',
  unitId: 'unit10-challenges',
  title: 'Stack Sandbox',
  desc: '<b>Free-form stack exploitation!</b> A vulnerable function with a 16-byte buffer and no protections. Overflow the buffer, overwrite the return address, and redirect execution to <code>win()</code>. This is your playground — use the hex calculator and payload builder to craft your exploit.',
  source: {
    c: [
      { text: '#include <string.h>', cls: 'prep' },
      { text: '', cls: '' },
      { text: 'void win() {', cls: 'fn' },
      { text: '  printf("You win!\\n");', cls: '' },
      { text: '}', cls: '' },
      { text: '', cls: '' },
      { text: 'void vuln() {', cls: 'fn' },
      { text: '  char buf[16];', cls: 'vuln' },
      { text: '  gets(buf);', cls: 'vuln' },
      { text: '}', cls: '' },
      { text: '', cls: '' },
      { text: 'int main() {', cls: 'fn' },
      { text: '  vuln();', cls: '' },
      { text: '  return 0;', cls: '' },
      { text: '}', cls: '' },
    ],
  },
  mode: 'input-hex',
  vizMode: 'stack',
  bufSize: 16,
  showSymbols: true,
  showBuilder: true,
  showCalc: true,
  check: (sim: any, _heap: any, symbols: Record<string, number>) => {
    if (!sim) return false;
    const retAddr = sim.readWord(sim.retOffset);
    return retAddr === symbols.win;
  },
  winTitle: 'Stack Sandbox Complete!',
  winMsg: 'You exploited a basic stack overflow in free-form mode.',
};
