import { Exercise } from '../types';

export const win37: Exercise = {
  id: 'win-37',
  unitId: 'unit8-win-stack',
  title: '37: stdcall Overflow',
  desc: 'Windows uses <b>stdcall</b> for WinAPI functions — the <i>callee</i> cleans the stack with <code>ret N</code>. This changes how stack frames look, but <b>buffer overflows work the same way</b>. Overflow the 16-byte buffer past saved EBP to overwrite the return address with <code>win()</code>.',
  source: {
    c: [
      { text: '#include <windows.h>', cls: '' },
      { text: '', cls: '' },
      { text: 'void __stdcall win() {', cls: '' },
      { text: '    WinExec("calc", 0);', cls: '' },
      { text: '}', cls: '' },
      { text: '', cls: '' },
      { text: 'void __stdcall vuln() {', cls: '', fn: true },
      { text: '    char buf[16];', cls: '' },
      { text: '    gets(buf);', cls: 'highlight vuln' },
      { text: '}', cls: '' },
      { text: '', cls: '' },
      { text: 'int main() {', cls: '' },
      { text: '    vuln();', cls: '' },
      { text: '    return 0;', cls: '' },
      { text: '}', cls: '' },
    ],
  },
  mode: 'input-hex',
  vizMode: 'stack',
  bufSize: 16,
  showSymbols: true,
  showBuilder: true,
  showCalc: true,
  check(sim, _heap, symbols) {
    return sim.getRetAddr() === symbols.win;
  },
  winTitle: 'stdcall Smashed!',
  winMsg: 'stdcall changes who cleans the stack, but the overflow works the same — buf overflows into saved EBP, then the return address.',
};
