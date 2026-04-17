import { Exercise } from '../types';

export const ctf52: Exercise = {
  id: 'ctf-52',
  unitId: 'unit10-challenges',
  title: 'CTF: Windows',
  desc: '<b>CTF Challenge!</b> A Windows-style exercise combining SEH overwrite concepts with a stack overflow. Overflow the buffer to reach the SEH handler, overwrite it with win(), and trigger an exception. This simulates the classic Windows exploit pattern.',
  source: {
    c: [
      { text: '// CTF Windows — SEH Overwrite', cls: 'comment' },
      { text: '// Simulated Windows SEH on stack', cls: 'comment' },
      { text: '', cls: '' },
      { text: 'void win() { WinExec("calc", 0); }', cls: 'fn' },
      { text: '', cls: '' },
      { text: 'void vuln() {', cls: 'fn' },
      { text: '  // SEH record on stack above buffer', cls: 'comment' },
      { text: '  EXCEPTION_REGISTRATION seh;', cls: '' },
      { text: '  seh.prev = fs:[0];', cls: '' },
      { text: '  seh.handler = safe_handler;', cls: '' },
      { text: '  fs:[0] = &seh;', cls: '' },
      { text: '', cls: '' },
      { text: '  char buf[16];', cls: 'vuln' },
      { text: '  gets(buf);  // overflow into SEH!', cls: 'vuln' },
      { text: '  *(int*)0 = 0;  // trigger exception', cls: '' },
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
  winTitle: 'CTF Windows Solved!',
  winMsg: 'SEH overwrite exploitation — a Windows classic!',
};
