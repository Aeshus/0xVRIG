'use client';

import { ExerciseContextProvider } from '@/state/ExerciseContext';
import Sidebar from '@/components/AppShell/Sidebar';
import SuccessBanner from '@/components/shared/SuccessBanner';

export default function ExerciseLayout({ children }: { children: React.ReactNode }) {
  return (
    <ExerciseContextProvider>
      <div id="app">
        <header>
          <h1>0xVRIG</h1>
          <div id="badges"></div>
        </header>
        <div id="app-body">
          <Sidebar />
          <main>
            {children}
          </main>
        </div>
        <SuccessBanner />
      </div>
    </ExerciseContextProvider>
  );
}
