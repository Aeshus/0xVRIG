'use client';

import { useExerciseContext } from '@/state/ExerciseContext';
import StackViz from './StackViz';
import HeapViz from './HeapViz';
import AsmViz from './AsmViz';
import ProtectionBadges from './ProtectionBadges';
import GOTViz from './GOTViz';
import ShadowStackViz from './ShadowStackViz';
import MemoryMapViz from './MemoryMapViz';
import CFIViz from './CFIViz';

const AUX_COMPONENTS: Record<string, React.ComponentType> = {
  'got': GOTViz,
  'shadow-stack': ShadowStackViz,
  'memory-map': MemoryMapViz,
  'cfi-targets': CFIViz,
};

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
    case 'asm': {
      const archLabel = currentExercise?.asmArch ?? 'x86';
      content = <AsmViz emulator={asmEmulator.current} renderKey={state.vizRenderKey} />;
      title = `${archLabel} emulator`;
      break;
    }
    case 'asm-stack': {
      const archLabel = currentExercise?.asmArch ?? 'x86';
      content = (
        <>
          <AsmViz emulator={asmEmulator.current} renderKey={state.vizRenderKey} />
          <div style={{ marginTop: '1rem' }}>
            <StackViz />
          </div>
        </>
      );
      title = `${archLabel} + stack`;
      break;
    }
    default:
      content = <StackViz />;
      title = 'stack';
      break;
  }

  return (
    <div className="panel" id="stack-panel">
      <div className="panel-hdr">{title}</div>
      <div className="panel-body">
        <ProtectionBadges />
        {content}
        {currentExercise?.auxViz?.map((key) => {
          const Comp = AUX_COMPONENTS[key];
          return Comp ? <Comp key={key} /> : null;
        })}
      </div>
    </div>
  );
}
