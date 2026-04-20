'use client';

import { useExerciseContext } from '@/state/ExerciseContext';
import { hex8 } from '@/engine/helpers';

export default function CFIViz() {
  const { auxViz, state } = useExerciseContext();
  const _renderKey = state.vizRenderKey;

  const targets = auxViz.current.cfiTargets;
  if (targets.length === 0) {
    return (
      <div className="aux-viz-section">
        <div className="aux-viz-title">CFI Targets</div>
        <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>No CFI data yet.</span>
      </div>
    );
  }

  return (
    <div className="aux-viz-section">
      <div className="aux-viz-title">CFI Valid Call Targets</div>
      <div style={{ fontSize: '11px' }}>
        {targets.map((target, i) => {
          const isAttempted = target.attempted;
          const color = !isAttempted
            ? (target.valid ? 'var(--green)' : 'var(--text-dim)')
            : (target.valid ? 'var(--green)' : 'var(--red)');

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '3px 0',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
                background: isAttempted && !target.valid ? 'rgba(244,71,71,0.08)' : undefined,
              }}
            >
              <span style={{ color: 'var(--text-dim)', width: '8em', textAlign: 'right', flexShrink: 0 }}>
                {hex8(target.addr)}
              </span>
              <span style={{ color, flex: 1 }}>
                {target.name}
              </span>
              <span style={{
                fontSize: '10px',
                color,
                border: `1px solid ${color}`,
                padding: '0 4px',
                borderRadius: '2px',
              }}>
                {target.valid ? '\u2713 valid' : '\u2717 invalid'}
              </span>
              {isAttempted && (
                <span style={{
                  fontSize: '10px',
                  color: 'var(--yellow)',
                  animation: 'flash 0.4s ease',
                }}>
                  \u25C0 called
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
