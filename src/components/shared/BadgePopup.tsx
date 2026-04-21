'use client';

import { useEffect, useRef, useState } from 'react';
import { useExerciseContext } from '@/state/ExerciseContext';
import { BADGES } from '@/exercises/registry';
import { Badge } from '@/exercises/types';

export default function BadgePopup() {
  const { state } = useExerciseContext();
  const [queue, setQueue] = useState<Badge[]>([]);
  const [visible, setVisible] = useState<Badge | null>(null);
  const initializedRef = useRef(false);
  const prevEarnedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const currentEarned = new Set<string>();
    for (const badge of BADGES) {
      if (badge.condition(state.completed)) {
        currentEarned.add(badge.id);
      }
    }

    if (!initializedRef.current) {
      initializedRef.current = true;
      prevEarnedRef.current = currentEarned;
      return;
    }

    const newlyEarned: Badge[] = [];
    for (const id of currentEarned) {
      if (!prevEarnedRef.current.has(id)) {
        const badge = BADGES.find(b => b.id === id);
        if (badge) newlyEarned.push(badge);
      }
    }

    prevEarnedRef.current = currentEarned;

    if (newlyEarned.length > 0) {
      setQueue(prev => [...prev, ...newlyEarned]);
    }
  }, [state.completed]);

  useEffect(() => {
    if (!visible && queue.length > 0) {
      setVisible(queue[0]);
      setQueue(prev => prev.slice(1));
    }
  }, [queue, visible]);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setVisible(null), 4000);
    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '1.5rem',
      right: '1.5rem',
      zIndex: 200,
      background: '#111',
      border: '2px solid var(--yellow)',
      padding: '1rem 1.5rem',
      boxShadow: '0 0 40px rgba(220, 220, 170, 0.15)',
      animation: 'badgeSlideIn 0.4s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      fontFamily: 'var(--font)',
    }}>
      <span style={{ fontSize: '28px' }}>{visible.icon}</span>
      <div>
        <div style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Badge Unlocked
        </div>
        <div style={{ fontSize: '14px', color: 'var(--yellow)', fontWeight: 'bold', marginTop: '2px' }}>
          {visible.name}
        </div>
      </div>
    </div>
  );
}
