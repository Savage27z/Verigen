'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Nav } from '@/components/ui/Nav';
import { Footer } from '@/components/ui/Footer';
import { Ticker } from '@/components/ui/Ticker';
import { VerifyPage } from '@/components/VerifyPage';
import { buildSeedFeed } from '@/lib/data';

export default function Verify() {
  const router = useRouter();
  const [feed] = useState(() => buildSeedFeed());
  const totalCount = 38214;

  return (
    <div className="app">
      <div className="bg-grid" />
      <Nav page="verify" onNav={(p) => {
        if (p === 'home') router.push('/');
      }} feedCount={totalCount} />
      <Ticker feed={feed} />
      <VerifyPage />
      <Footer feedCount={totalCount} />
    </div>
  );
}
