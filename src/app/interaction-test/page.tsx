// app/interaction-test/page.tsx
'use client'; // Required because InteractionTest uses useEffect/state
import { LevelLoaderTest } from '@/components/LevelLoaderTest';
import InteractionTest from '@/components/InteractionTest';

export default function InteractionTestPage() {
  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
      <InteractionTest />
      <LevelLoaderTest />
    </div>
  );
}