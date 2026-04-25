import { Exercise } from '../types';

const rit00HowToUse: Exercise = {
  id: 'rit-00',
  unitId: 'imagine-rit',
  title: '00: How to Use 0xVRIG',
  desc: 'This short intro explains the interface before the real workshop starts. Keep the <strong>directions</strong> open when you need context, switch between <strong>Code</strong>, <strong>Assembly</strong>, <strong>Console</strong>, and <strong>Misc</strong> to inspect the program from different angles, and use the compact <strong>input</strong> area at the bottom to step or send payloads. The <strong>Contents</strong> button opens the full workshop map so you can jump between lessons.',
  source: {
    c: [
      { text: '#include <stdio.h>', cls: '' },
      { text: '', cls: '' },
      { text: 'void demo(void) {', cls: '', fn: true },
      { text: '    char buf[16];  // memory shown in the Assembly view', cls: 'highlight' },
      { text: '    puts("Explore each panel as you go.");', cls: '' },
      { text: '    (void)buf;', cls: '' },
      { text: '}', cls: '' },
      { text: '', cls: '' },
      { text: 'int main(void) {', cls: '' },
      { text: '    demo();', cls: 'highlight' },
      { text: '    return 0;', cls: '' },
      { text: '}', cls: '' },
    ],
  },
  mode: 'step',
  vizMode: 'stack',
  bufSize: 16,
  showSymbols: true,
  showBuilder: true,
  showCalc: true,
  showGadgetTable: true,
  gadgets: {
    0x08048300: 'pop eax; pop ebx; mov [ebx], eax; ret',
  },
  steps: [
    {
      region: 'none',
      log: ['info', 'Start here: directions explain the goal of the current lesson and stay separate from the code so you can read them while working.'],
    },
    {
      region: 'ret',
      log: ['action', 'Use the Code tab to inspect the source and the Assembly tab to watch the stack frame and control-flow state change underneath it.'],
    },
    {
      region: 'buffer',
      log: ['action', 'Open Misc for helper tools like symbols, the hex calculator, payload builder, and gadget listings when an exercise enables them.'],
    },
    {
      region: 'ebp',
      log: ['action', 'The bottom input dock is where you type payloads, step execution, or send trial inputs. Some lessons only need controls, so that area stays compact.'],
    },
    {
      region: 'all',
      log: ['info', 'Use Previous, Contents, and Next at the bottom to move through the workshop. Once this layout feels familiar, continue into the first real stack lesson.'],
    },
  ],
  check() { return false; },
  winTitle: 'Orientation Complete',
  winMsg: 'You now know where to read directions, inspect code and memory, use helper tools, and move between exercises.',
};

export default rit00HowToUse;
