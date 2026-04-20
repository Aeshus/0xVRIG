'use client';

import { useExerciseContext } from '@/state/ExerciseContext';
import { hex8 } from '@/engine/helpers';

export default function ShadowStackViz() {
  const { auxViz, state } = useExerciseContext();
  const _renderKey = state.vizRenderKey;

  const entries = auxViz.current.shadow;
  if (entries.length === 0) {
    return (
      <div className="aux-viz-section">
        <div className="aux-viz-title">Shadow Stack</div>
        <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>No shadow stack data yet.</span>
      </div>
    );
  }

  return (
    <div className="aux-viz-section">
      <div className="aux-viz-title">Shadow Stack</div>
      <div style={{ fontSize: '11px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '8em 1fr 1fr 6em',
          gap: '0 0.5rem',
          padding: '2px 0 4px',
          borderBottom: '1px solid var(--panel-border)',
          color: 'var(--text-dim)',
          fontSize: '10px',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}>
          <span style={{ textAlign: 'right' }}>addr</span>
          <span>real ret</span>
          <span>shadow ret</span>
          <span>status</span>
        </div>
        {entries.map((entry, i) => (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: '8em 1fr 1fr 6em',
              gap: '0 0.5rem',
              padding: '3px 0',
              borderBottom: '1px solid rgba(255,255,255,0.03)',
              background: entry.mismatch ? 'rgba(244,71,71,0.08)' : undefined,
            }}
          >
            <span style={{ color: 'var(--text-dim)', textAlign: 'right' }}>
              {hex8(entry.addr)}
            </span>
            <span style={{
              color: entry.mismatch ? 'var(--red)' : 'var(--amber)',
              animation: entry.mismatch ? 'flash 0.4s ease' : undefined,
            }}>
              {hex8(entry.realRet)}
            </span>
            <span style={{ color: 'var(--green)' }}>
              {hex8(entry.shadowRet)}
            </span>
            <span style={{
              fontSize: '10px',
              color: entry.mismatch ? 'var(--red)' : 'var(--green)',
            }}>
              {entry.mismatch ? '\u2717 MISMATCH' : '\u2713 match'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
