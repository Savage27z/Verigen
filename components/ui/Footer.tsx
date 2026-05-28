'use client';

import React from 'react';

export function Footer({ feedCount }: { feedCount: number }) {
  return (
    <footer className="foot">
      <div className="shell">
        <div className="foot-inner">
          <div>VERIGEN · PROVENANCE INFRASTRUCTURE · EST. 2026</div>
          <div>{feedCount.toLocaleString()} CERTIFICATIONS · SUI MAINNET · WALRUS NETWORK</div>
          <div>v0.1.0 / NODE 03</div>
        </div>
      </div>
    </footer>
  );
}
