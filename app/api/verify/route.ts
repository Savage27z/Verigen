import { NextRequest, NextResponse } from 'next/server';
import { fetchBlob } from '@/lib/walrus';
import { sha256FromBase64 } from '@/lib/hash';
import { isDemoMode, generateDemoVerifyResult } from '@/lib/demo';

/** GET /api/verify?blobId=xxx — fetch from Walrus and return metadata */
export async function GET(req: NextRequest) {
  try {
    const blobId = req.nextUrl.searchParams.get('blobId');

    if (!blobId?.trim()) {
      return NextResponse.json({ error: 'blobId query parameter is required' }, { status: 400 });
    }

    // Demo mode fallback
    if (isDemoMode()) {
      console.log('[verify] demo mode — returning fixture data');
      const demo = generateDemoVerifyResult(blobId);
      const res = NextResponse.json(demo);
      res.headers.set('x-demo-mode', 'true');
      return res;
    }

    console.log('[verify] fetching blob from Walrus:', blobId);
    const blob = await fetchBlob(blobId);
    const imageHash = sha256FromBase64(blob.imageBase64);

    return NextResponse.json({
      blobId,
      imageBase64: blob.imageBase64,
      imageHash,
      metadata: blob.metadata,
    });
  } catch (err: unknown) {
    console.error('[verify] GET error:', err);
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** POST /api/verify — { blobId, uploadedHash } — compare hashes */
export async function POST(req: NextRequest) {
  try {
    const { blobId, uploadedHash } = await req.json();

    if (!blobId?.trim()) {
      return NextResponse.json({ error: 'blobId is required' }, { status: 400 });
    }
    if (!uploadedHash?.trim()) {
      return NextResponse.json({ error: 'uploadedHash is required' }, { status: 400 });
    }

    // Demo mode fallback
    if (isDemoMode()) {
      console.log('[verify] demo mode — comparing hashes');
      const demoResult = generateDemoVerifyResult(blobId);
      const originalHash = demoResult.imageHash;
      const match = originalHash === uploadedHash;

      const res = NextResponse.json({
        authentic: match,
        originalHash,
        uploadedHash,
        metadata: {
          prompt: demoResult.prompt,
          model: demoResult.model,
          timestamp: demoResult.timestamp,
          creator: demoResult.creator,
          imageHash: originalHash,
        },
      });
      res.headers.set('x-demo-mode', 'true');
      return res;
    }

    console.log('[verify] POST comparing hashes for blob:', blobId);
    const blob = await fetchBlob(blobId);
    const originalHash = sha256FromBase64(blob.imageBase64);
    const match = originalHash === uploadedHash;

    return NextResponse.json({
      authentic: match,
      originalHash,
      uploadedHash,
      metadata: blob.metadata,
    });
  } catch (err: unknown) {
    console.error('[verify] POST error:', err);
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
