'use client';

import { useExerciseContext } from '@/state/ExerciseContext';
import StackViz from './StackViz';
import HeapViz from './HeapViz';
import AsmViz from './AsmViz';

export default function VizPanel() {
  const { currentExercise, state, asmEmulator } = useExerciseContext();
  const vizMode = currentExercise?.vizMode ?? 'stack';

  let content: React.ReactNode;
  let title: string;

  switch (vizMode) {
    case 'heap':
      content = <HeapViz />;
      title = 'heap';
      break;
    case 'both':
      content = (
        <>
          <StackViz />
          <div style={{ marginTop: '1rem' }}>
            <HeapViz />
          </div>
        </>
      );
      title = 'stack + heap';
      break;
    case 'asm':
      content = <AsmViz emulator={asmEmulator.current} renderKey={state.vizRenderKey} />;
      title = 'x86 emulator';
      break;
    case 'asm-stack':
      content = (
        <>
          <AsmViz emulator={asmEmulator.current} renderKey={state.vizRenderKey} />
          <div style={{ marginTop: '1rem' }}>
            <StackViz />
          </div>
        </>
      );
      title = 'x86 + stack';
      break;
    default:
      content = <StackViz />;
      title = 'stack';
      break;
  }

  return (
    <div className="panel" id="stack-panel">
      <div className="panel-hdr">{title}</div>
      <div className="panel-body">
        {content}
      </div>
    </div>
  );
}
