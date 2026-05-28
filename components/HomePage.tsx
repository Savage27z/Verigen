'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Generator } from './Generator';
import { CertificateCard } from './CertificateCard';
import { Feed, AuditLog } from './ProvenanceFeed';
import { shortHash, fmtRelTime } from '@/lib/data';
import type { FeedItem } from '@/lib/data';

/* ─── Trust Grid + Live Readout ─── */
function TrustGrid({ totalCount }: { totalCount: number }) {
  return (
    <div className="trust-grid">
      <div className="trust-tile">
        <span className="lbl">Certifications</span>
        <span className="val">{totalCount.toLocaleString()}</span>
        <span className="delta">↑ +218 / 24h</span>
      </div>
      <div className="trust-tile">
        <span className="lbl">Creators</span>
        <span className="val">4,827</span>
        <span className="delta">↑ +41 / 24h</span>
      </div>
      <div className="trust-tile">
        <span className="lbl">Tamper detection</span>
        <span className="val">
          312{' '}
          <span style={{ fontSize: 16, color: 'var(--fg-3)' }}>ms</span>
        </span>
        <span className="delta muted">p50 latency</span>
      </div>
      <div className="trust-tile">
        <span className="lbl">Registry uptime</span>
        <span className="val">
          99.99
          <span style={{ fontSize: 16, color: 'var(--fg-3)' }}>%</span>
        </span>
        <span className="delta">90d rolling</span>
      </div>
    </div>
  );
}

function HeroReadout({ feed }: { feed: FeedItem[] }) {
  const [block, setBlock] = useState(124809213);
  useEffect(() => {
    const id = setInterval(() => setBlock((b) => b + 1), 2400);
    return () => clearInterval(id);
  }, []);
  const last = feed[0];
  return (
    <div className="hero-readout">
      <span className="seg">
        <span className="blink-dot" /> CURRENT BLOCK · <b>{block.toLocaleString()}</b>
      </span>
      <span className="center-rule" />
      <span className="seg">
        LAST CERT · <b>{last ? shortHash(last.blobId, 6, 4) : '—'}</b> ·{' '}
        {last ? fmtRelTime(last.timestamp) : '—'}
      </span>
    </div>
  );
}

export function HomePage({
  feed,
  onCertify,
  lastCert,
  busy,
  stepIdx,
  totalCount,
}: {
  feed: FeedItem[];
  onCertify: (prompt: string) => void;
  lastCert: FeedItem | null;
  busy: boolean;
  stepIdx: number;
  totalCount: number;
}) {
  const [prompt, setPrompt] = useState('');

  const SUGGESTIONS = useMemo(
    () => [
      'a samurai fox in neon Tokyo, digital art',
      'abandoned lighthouse at dawn, oil painting',
      'monastery library carved into a glacier',
      'porcelain robot tending bonsai, studio light',
    ],
    []
  );

  const handleGenerate = useCallback(() => {
    if (!prompt.trim() || busy) return;
    onCertify(prompt.trim());
  }, [prompt, busy, onCertify]);

  return (
    <main>
      <div className="shell">
        <section className="hero">
          <div className="hero-filing">№ 00001</div>

          <div className="hero-meta">
            <span>PROVENANCE INFRASTRUCTURE · EST. 2026</span>
            <span className="center-tag">FILING № A-001 · PUBLIC REGISTRY</span>
            <span style={{ textAlign: 'right' }}>WALRUS / SUI / TATUM</span>
          </div>

          <h1 className="hero-headline">
            Certify AI&nbsp;images.
            <br />
            Tamper-proof, <em>on-chain,</em>
            <br />
            <span className="accent">forever.</span>
          </h1>

          <div className="hero-sub">
            <p>
              VeriGen permanently registers a cryptographic fingerprint of every generated image
              on the Sui blockchain. The original is stored on Walrus — immutable,
              decentralized, verifiable by anyone with a link.
            </p>
            <div className="legend">
              <span>
                · <b>SHA-256</b> fingerprint of raw bytes
              </span>
              <span>
                · Original blob lives on <b>Walrus</b>
              </span>
              <span>
                · Registry shared object on <b>Sui</b>
              </span>
              <span>
                · Tamper detection in <b>&lt; 400ms</b>
              </span>
            </div>
          </div>

          <HeroReadout feed={feed} />
          <TrustGrid totalCount={totalCount} />

          <Generator
            prompt={prompt}
            setPrompt={setPrompt}
            onGenerate={handleGenerate}
            busy={busy}
            stepIdx={stepIdx}
            suggestions={SUGGESTIONS}
            onPick={(s) => setPrompt(s)}
          />
        </section>

        {(busy || lastCert) && <CertificateCard cert={lastCert} busy={busy} />}

        <Feed items={feed} newId={lastCert ? lastCert.id : null} />

        <AuditLog feed={feed} />
      </div>
    </main>
  );
}
