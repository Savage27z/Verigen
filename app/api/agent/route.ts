import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { AGENT_TOOLS } from '@/lib/mcp/tools';
import { callMCPTool } from '@/lib/mcp/client';
import { sha256FromBuffer } from '@/lib/hash';
import { isDemoMode, generateDemoAgentReply } from '@/lib/demo';

const SYSTEM_PROMPT = `You are VeriGen's provenance verification agent. You have access to the VeriGen Sui registry via Tatum MCP and can fetch blobs from Walrus decentralized storage.

Answer questions about image provenance, certification status, and tampering detection. Be terse and forensic. Lead with the verdict (Verified / Tampered / Unknown), then facts. No filler.

You have these tools:
- get_registry_entry(blob_id) — query Sui registry via Tatum MCP
- fetch_original_image_hash(blob_id) — fetch original from Walrus and get hash
- compare_image_hash(blob_id, uploaded_hash) — detect tampering

If a blob_id is provided in context, use it automatically. Always cite the timestamp, creator, and hash in your response.`;

export async function POST(req: NextRequest) {
  try {
    const { message, blobId, uploadedImageBase64 } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    // Demo mode fallback
    if (isDemoMode() || !process.env.OPENROUTER_API_KEY) {
      console.log('[agent] demo mode — returning canned reply');
      const reply = generateDemoAgentReply(message, blobId);
      const res = NextResponse.json({ reply, toolCallsMade: 0 });
      res.headers.set('x-demo-mode', 'true');
      return res;
    }

    const openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    // Build context message
    let contextNote = '';
    if (blobId) contextNote += ` [Active blob ID: ${blobId}]`;

    let uploadedHash: string | undefined;
    if (uploadedImageBase64) {
      const buf = Buffer.from(uploadedImageBase64, 'base64');
      uploadedHash = sha256FromBuffer(buf);
      contextNote += ` [Uploaded image SHA-256: sha256:${uploadedHash}]`;
    }

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: message + contextNote },
    ];

    // Agentic loop — keep calling until no more tool calls
    let iterations = 0;
    const MAX_ITERATIONS = 5;

    while (iterations < MAX_ITERATIONS) {
      iterations++;

      const response = await openai.chat.completions.create({
        model: 'google/gemini-2.0-flash-001',
        messages,
        tools: AGENT_TOOLS,
        tool_choice: 'auto',
        max_tokens: 600,
      });

      const choice = response.choices[0];

      if (choice.finish_reason === 'stop' || !choice.message.tool_calls?.length) {
        return NextResponse.json({
          reply: choice.message.content || 'No response.',
          toolCallsMade: iterations - 1,
        });
      }

      // Execute tool calls via MCP client
      messages.push(choice.message);

      for (const toolCall of choice.message.tool_calls) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fn = (toolCall as any).function;

        let params: Record<string, string>;
        try {
          params = JSON.parse(fn.arguments || '{}');
        } catch {
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify({ error: 'Failed to parse tool arguments' }),
          });
          continue;
        }

        // Auto-inject blobId and uploadedHash if available
        if (blobId && !params.blob_id) params.blob_id = blobId;
        if (uploadedHash && !params.uploaded_hash) params.uploaded_hash = uploadedHash;

        console.log('[agent] calling MCP tool:', fn.name, params);
        const result = await callMCPTool(fn.name, params);

        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }
    }

    return NextResponse.json({
      reply: 'Agent reached iteration limit.',
      toolCallsMade: MAX_ITERATIONS,
    });
  } catch (err: unknown) {
    console.error('[agent] error:', err);
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
