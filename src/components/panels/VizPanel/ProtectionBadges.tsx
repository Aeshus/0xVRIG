'use client';

import { useExerciseContext } from '@/state/ExerciseContext';

interface Protection {
  name: string;
  status: 'active' | 'bypassed' | 'disabled';
}

const statusColors: Record<string, string> = {
  active: 'var(--green)',
  bypassed: 'var(--amber)',
  disabled: 'var(--text-dim)',
};

const statusIcons: Record<string, string> = {
  active: '\u25CF',
  bypassed: '\u25CB',
  disabled: '\u2013',
};

function inferProtections(ex: {
  canary?: boolean;
  aslr?: boolean;
  nx?: boolean;
  protections?: Protection[];
}): Protection[] {
  if (ex.protections) return ex.protections;

  const list: Protection[] = [];
  if (ex.nx !== undefined) list.push({ name: 'NX/DEP', status: ex.nx ? 'active' : 'disabled' });
  if (ex.aslr !== undefined) list.push({ name: 'ASLR', status: ex.aslr ? 'active' : 'disabled' });
  if (ex.canary !== undefined) list.push({ name: 'Canary', status: ex.canary ? 'active' : 'disabled' });
  return list;
}

export default function ProtectionBadges() {
  const { currentExercise } = useExerciseContext();
  if (!currentExercise) return null;

  const protections = inferProtections(currentExercise);
  if (protections.length === 0) return null;

  return (
    <div style={{
      display: 'flex',
      gap: '0.4rem',
      flexWrap: 'wrap',
      marginBottom: '0.5rem',
      paddingBottom: '0.4rem',
      borderBottom: '1px solid var(--panel-border)',
    }}>
      {protections.map((p) => (
        <span
          key={p.name}
          style={{
            fontSize: '10px',
            padding: '1px 6px',
            border: `1px solid ${statusColors[p.status]}`,
            color: statusColors[p.status],
            borderRadius: '2px',
            fontFamily: 'var(--font)',
            letterSpacing: '0.02em',
          }}
          title={`${p.name}: ${p.status}`}
        >
          {statusIcons[p.status]} {p.name}
        </span>
      ))}
    </div>
  );
}
