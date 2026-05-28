'use client';

import React, { useState, useEffect, useRef } from 'react';
import { fmtUTC, shortHash } from '@/lib/data';

interface VerifyResult {
  kind: string;
  originalHash: string;
  uploadedHash?: string;
  prompt: string;
  model: string;
  timestamp: Date;
  creatorShort: string;
  blobId: string;
  suiTx: string;
  block?: number;
  [key: string]: unknown;
}

interface ChatMessage {
  role: 'user' | 'agent';
  time: Date;
  text?: string;
  parts?: { strong?: string; body?: string }[];
  tamper?: boolean;
}

const CHAT_SUGGESTIONS = [
  'Is this image authentic?',
  'Who created blob 0xA9bFEz…?',
  'Show me the original prompt.',
  'Has this been modified?',
];

function buildLocalAgentReply(
  query: string,
  result: VerifyResult | null
): { strong?: string; body?: string }[] {
  const q = query.toLowerCase();
  const r = result;
  const certifiedAt = r ? fmtUTC(r.timestamp) : '—';

  if (!r) {
    return [
      {
        strong: 'No active verification.',
        body: ' Run a verification first or provide a blob ID inline.',
      },
    ];
  }

  if (q.includes('modif') || q.includes('tamper') || q.includes('alter')) {
    if (r.kind === 'tampered') {
      return [
        { strong: 'Tampered.', body: ' Hash mismatch detected.' },
        { body: ` On-chain: sha256:${shortHash(r.originalHash, 8, 8)}.` },
        { body: ` Uploaded: sha256:${shortHash(r.uploadedHash || '', 8, 8)}.` },
        { body: ' Image has been modified since certification.' },
      ];
    }
    return [
      { strong: 'Verified.', body: ' No tampering detected.' },
      { body: ` Hash match confirmed against on-chain record. Certified ${certifiedAt}.` },
    ];
  }

  if (q.includes('who') || q.includes('creator') || q.includes('author')) {
    return [
      {
        strong: 'Creator',
        body: `: ${r.creatorShort}. Certified ${certifiedAt}. Block ${(r.block || 124809213).toLocaleString()}.`,
      },
    ];
  }

  if (q.includes('prompt') || q.includes('original')) {
    return [{ strong: 'Original prompt', body: `: "${r.prompt}". Model: ${r.model}.` }];
  }

  if (q.includes('when') || q.includes('time') || q.includes('date')) {
    return [
      {
        strong: 'Certified',
        body: ` ${certifiedAt}. Block ${(r.block || 124809213).toLocaleString()}.`,
      },
    ];
  }

  if (q.includes('authent') || q.includes('real') || q.includes('verify')) {
    if (r.kind === 'authentic') {
      return [
        {
          strong: 'Verified.',
          body: ` Certified ${certifiedAt}. Hash match confirmed. No tampering detected. Creator: ${r.creatorShort}.`,
        },
      ];
    }
    return [
      {
        strong: 'Failed.',
        body: ' Image hash does not match on-chain record. Image has been modified.',
      },
    ];
  }

  return [
    {
      strong: r.kind === 'tampered' ? 'Tampered.' : 'Verified.',
      body: ` Certified ${certifiedAt}. Creator ${r.creatorShort}. Blob ${shortHash(r.blobId, 6, 6)}. Tx ${shortHash(r.suiTx, 6, 6)}.`,
    },
  ];
}

export function AgentChat({ result, blobId }: { result: VerifyResult | null; blobId?: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'agent',
      time: new Date(),
      parts: [
        {
          strong: 'Agent online.',
          body: ' Connected via Tatum MCP to Sui registry. Ask anything about an image\'s provenance.',
        },
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const streamRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.scrollTop = streamRef.current.scrollHeight;
    }
  }, [messages, typing]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || typing) return;
    setMessages((m) => [...m, { role: 'user', time: new Date(), text: q }]);
    setInput('');
    setTyping(true);

    try {
      // Try calling the real API agent endpoint
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q, blobId: blobId || '' }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((m) => [
          ...m,
          {
            role: 'agent',
            time: new Date(),
            parts: [{ body: data.reply }],
            tamper:
              result?.kind === 'tampered' &&
              (q.toLowerCase().includes('modif') ||
                q.toLowerCase().includes('tamper') ||
                q.toLowerCase().includes('alter') ||
                q.toLowerCase().includes('authen') ||
                q.toLowerCase().includes('real') ||
                q.toLowerCase().includes('verify')),
          },
        ]);
      } else {
        throw new Error('API error');
      }
    } catch {
      // Fallback to local agent reply
      const parts = buildLocalAgentReply(q, result);
      setMessages((m) => [
        ...m,
        {
          role: 'agent',
          time: new Date(),
          parts,
          tamper:
            result?.kind === 'tampered' &&
            (q.toLowerCase().includes('modif') ||
              q.toLowerCase().includes('tamper') ||
              q.toLowerCase().includes('alter') ||
              q.toLowerCase().includes('authen') ||
              q.toLowerCase().includes('real') ||
              q.toLowerCase().includes('verify')),
        },
      ]);
    } finally {
      setTyping(false);
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') send(input);
  };

  return (
    <div className="chat">
      <div className="chat-head">
        <div className="agent">
          <span className="mark" />
          AGENT · GEMINI-2.0-FLASH ↔ TATUM MCP
        </div>
        <span />
        <span className="stat-online">● ONLINE</span>
      </div>

      <div className="chat-stream" ref={streamRef}>
        {messages.map((m, i) => {
          const t = m.time.toISOString().slice(11, 19);
          if (m.role === 'user') {
            return (
              <div key={i} className="msg user">
                <div className="meta">
                  <span>{t}</span>
                  <span className="sender">YOU</span>
                </div>
                <div className="body">{m.text}</div>
              </div>
            );
          }
          return (
            <div key={i} className={'msg agent' + (m.tamper ? ' tamper' : '')}>
              <div className="meta">
                <span className="sender">VERIGEN AGENT</span>
                <span>{t}</span>
              </div>
              <div className="body">
                {m.parts?.map((p, j) => (
                  <React.Fragment key={j}>
                    {p.strong && <span className="strong">{p.strong}</span>}
                    {p.body && <span>{p.body}</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>
          );
        })}
        {typing && (
          <div className="msg agent">
            <div className="meta">
              <span className="sender">VERIGEN AGENT</span>
              <span>QUERYING TATUM MCP</span>
            </div>
            <div className="typing">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
      </div>

      <div className="chat-suggest">
        <span className="lbl">Try</span>
        {CHAT_SUGGESTIONS.map((s, i) => (
          <button key={i} onClick={() => send(s)}>
            {s}
          </button>
        ))}
      </div>

      <div className="chat-input">
        <span className="prompt-glyph">verigen:~$</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder="ask anything about provenance, or type / for commands…"
        />
        <button onClick={() => send(input)}>↵ Send</button>
      </div>
    </div>
  );
}
