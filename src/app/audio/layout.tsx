'use client';

import { PlayerProvider } from '@/app/components/context/PlayerContext';

export default function AudioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PlayerProvider>
      {children}
    </PlayerProvider>
  );
}