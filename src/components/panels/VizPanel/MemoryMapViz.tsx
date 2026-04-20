'use client';

import { useExerciseContext } from '@/state/ExerciseContext';
import { hex8 } from '@/engine/helpers';

const permColors: Record<string, string> = {
  R: 'var(--blue)',
  W: 'var(--amber)',
  X: 'var(--green)',
  '-': 'var(--text-dim)',
};

function PermBadge({ perms }: { perms: string }) {
  return (
    <span style={{ display: 'inline-flex', gap: '1px', fontFamily: 'var(--font)' }}>
      {perms.split('').map((ch, i) => (
        <span key={i} style={{
          color: permColors[ch] || 'var(--text-dim)',
          fontSize: '11px',
          fontWeight: ch !== '-' ? 'bold' : 'normal',
        }}>
          {ch}
        </span>
      ))}
    </span>
  );
}

export default function MemoryMapViz() {
  const { auxViz, state } = useExerciseContext();
  const _renderKey = state.vizRenderKey;

  const regions = auxViz.current.memMap;
  if (regions.length === 0) {
    return (
      <div className="aux-viz-section">
        <div className="aux-viz-title">Memory Map</div>
        <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>No memory map data yet.</span>
      </div>
    );
  }

  return (
    <div className="aux-viz-section">
      <div className="aux-viz-title">Memory Map</div>
      <div style={{ fontSize: '11px' }}>
        {regions.map((region, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '3px 0',
              borderBottom: '1px solid rgba(255,255,255,0.03)',
              background: region.blocked
                ? 'rgba(244,71,71,0.08)'
                : region.highlight
                  ? 'rgba(78,201,176,0.08)'
                  : undefined,
            }}
          >
            <span style={{ color: 'var(--text-dim)', fontSize: '10px', width: '18em', textAlign: 'right', flexShrink: 0 }}>
              {hex8(region.start)}-{hex8(region.end)}
            </span>
            <PermBadge perms={region.perms} />
            <span style={{
              color: region.blocked ? 'var(--red)' : region.highlight ? 'var(--green)' : 'var(--text)',
              flex: 1,
            }}>
              {region.name}
            </span>
            {region.blocked && (
              <span style={{
                fontSize: '10px',
                color: 'var(--red)',
                border: '1px solid var(--red)',
                padding: '0 4px',
                borderRadius: '2px',
              }}>
                BLOCKED
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
