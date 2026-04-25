'use client';

import { useRouter } from 'next/navigation';

export default function ImagineRitCongratulationsPage() {
  const router = useRouter();

  return (
    <div style={{
      maxWidth: '860px',
      margin: '3rem auto 4rem',
      padding: '2rem',
      fontFamily: 'var(--font-sans)',
      color: 'var(--text)',
    }}>
      <section style={{
        padding: '1.75rem',
        border: '1px solid var(--accent-secondary)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-panel-strong)',
        boxShadow: 'var(--shadow-lg)',
        backdropFilter: 'blur(18px)',
        marginBottom: '1.25rem',
      }}>
        <div style={{
          color: 'var(--accent-secondary)',
          fontSize: '0.82rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: '0.75rem',
        }}>
          Workshop Complete
        </div>
        <h1 style={{
          color: 'var(--text)',
          fontSize: 'clamp(2.2rem, 4vw, 3.4rem)',
          lineHeight: '1.02',
          marginBottom: '0.85rem',
          fontFamily: 'var(--font-display)',
        }}>
          Congratulations, and thank you for trying Imagine RIT.
        </h1>
        <p style={{ fontSize: '1rem', lineHeight: '1.75', maxWidth: '62ch', marginBottom: '0.85rem' }}>
          You just worked through the full beginner workshop: stack layout, overflow basics, return-address control,
          ASLR bypassing, and a first ROP chain. That is a real tour of how memory corruption exploits are built.
        </p>
        <p style={{ fontSize: '0.98rem', lineHeight: '1.75', maxWidth: '62ch', marginBottom: '1.25rem' }}>
          Thanks for spending the time with 0xVRIG. The goal of this track is to make low-level exploitation feel
          understandable instead of mysterious, and you made it to the end.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          <button className="link-button primary" onClick={() => router.push('/')}>
            Explore Full 0xVRIG
          </button>
          <button className="link-button secondary" onClick={() => router.push('/imagine-rit')}>
            Back To Imagine RIT
          </button>
        </div>
      </section>

      <section style={{
        display: 'grid',
        gap: '0.85rem',
        gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))',
      }}>
        {[
          {
            title: 'What you learned',
            text: 'How buffers sit near saved control data, why overflows matter, and how attackers turn memory corruption into control-flow changes.',
          },
          {
            title: 'What to try next',
            text: 'Use the full 0xVRIG catalog to dig into heap attacks, format strings, sandbox escapes, and more advanced exploit patterns.',
          },
          {
            title: 'When to revisit',
            text: 'Come back after a break and replay the workshop with the walkthrough turned off. If you can rebuild each payload yourself, the ideas have stuck.',
          },
        ].map((item) => (
          <div
            key={item.title}
            style={{
              padding: '1rem 1.1rem',
              border: '1px solid var(--panel-border)',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255,255,255,0.025)',
            }}
          >
            <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              {item.title}
            </div>
            <div style={{ fontSize: '0.95rem', lineHeight: '1.7' }}>
              {item.text}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
