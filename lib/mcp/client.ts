/**
 * Tatum MCP client — wraps Tatum SDK calls as MCP-style tool invocations.
 * In production, connect to Tatum's MCP server endpoint.
 * This client implements the tool interface so the structure is MCP-compatible.
 */

import { getRegistryEntry } from '../tatum';
import { fetchBlob } from '../walrus';
import { sha256FromBase64 } from '../hash';

export async function callMCPTool(
  toolName: string,
  params: Record<string, string>
): Promise<Record<string, unknown>> {
  try {
    switch (toolName) {
      case 'get_registry_entry': {
        const entry = await getRegistryEntry(params.blob_id);
        if (!entry) return { error: 'No registry entry found for this blob ID' };
        return { success: true, entry };
      }

      case 'fetch_original_image_hash': {
        const blob = await fetchBlob(params.blob_id);
        const hash = sha256FromBase64(blob.imageBase64);
        return {
          success: true,
          imageHash: hash,
          metadata: blob.metadata,
        };
      }

      case 'compare_image_hash': {
        const blob = await fetchBlob(params.blob_id);
        const originalHash = sha256FromBase64(blob.imageBase64);
        const match = originalHash === params.uploaded_hash;
        return {
          success: true,
          authentic: match,
          originalHash,
          uploadedHash: params.uploaded_hash,
          metadata: blob.metadata,
        };
      }

      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Tool execution failed';
    console.error(`[mcp] tool ${toolName} error:`, err);
    return { error: message };
  }
}
