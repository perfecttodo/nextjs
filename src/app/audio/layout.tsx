'use client';

import FixedShareAudioPlayer from '@/app/components/FixedShareAudioPlayer';

export default function AudioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <div>{children}</div>
      <FixedShareAudioPlayer />
    </>
  );
}