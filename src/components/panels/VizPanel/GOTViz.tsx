'use client';

import { useExerciseContext } from '@/state/ExerciseContext';
import { hex8 } from '@/engine/helpers';

export default function GOTViz() {
  const { auxViz, state } = useExerciseContext();
  const _renderKey = state.vizRenderKey;

  const entries = auxViz.current.got;
  if (entries.length === 0) {
    return (
      <div className="aux-viz-section">
        <div className="aux-viz-title">GOT / PLT</div>
        <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>No GOT data yet.</span>
      </div>
    );
  }

  return (
    <div className="aux-viz-section">
      <div className="aux-viz-title">GOT / PLT</div>
      <div style={{ fontSize: '11px' }}>
        {entries.map((entry, i) => {
          const statusColor = entry.overwritten
            ? 'var(--red)'
            : entry.resolved
              ? 'var(--green)'
              : 'var(--text-dim)';
          const statusLabel = entry.overwritten
            ? 'HIJACKED'
            : entry.resolved
              ? 'resolved'
              : 'lazy';

          return (
            <div
              key={i}
              className={`got-row${entry.overwritten ? ' got-overwritten' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '3px 0',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
              }}
            >
              <span style={{ color: 'var(--text-dim)', width: '8em', textAlign: 'right', flexShrink: 0, fontSize: '11px' }}>
                {hex8(entry.addr)}
              </span>
              <span style={{ color: 'var(--yellow)', width: '10em', flexShrink: 0 }}>
                {entry.name}@got
              </span>
              <span style={{
                color: entry.overwritten ? 'var(--red)' : 'var(--amber)',
                fontFamily: 'var(--font)',
                animation: entry.overwritten ? 'flash 0.4s ease' : undefined,
              }}>
                {hex8(entry.value)}
              </span>
              <span style={{
                fontSize: '10px',
                color: statusColor,
                padding: '0 4px',
                border: `1px solid ${statusColor}`,
                borderRadius: '2px',
                flexShrink: 0,
              }}>
                {statusLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
