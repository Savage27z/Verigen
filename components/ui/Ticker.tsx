'use client';

import React from 'react';
import { shortHash, fmtRelTime } from '@/lib/data';
import type { FeedItem } from '@/lib/data';

export function Ticker({ feed }: { feed: FeedItem[] }) {
  const items = feed.slice(0, 8);
  const block = (key: string) => (
    <React.Fragment key={key}>
      {items.map((it, i) => (
        <span className="item" key={key + '-' + i}>
          <span className="pill" />
          <span>BLOB {shortHash(it.blobId, 6, 4)}</span>
          <span style={{ color: 'rgba(245,245,244,0.5)' }}>·</span>
          <span>{fmtRelTime(it.timestamp)}</span>
          <span className="sep">│</span>
        </span>
      ))}
    </React.Fragment>
  );
  return (
    <div className="ticker">
      <div className="ticker-track">
        {block('a')}
        {block('b')}
      </div>
    </div>
  );
}
