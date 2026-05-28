import type { ChatCompletionTool } from 'openai/resources';

export const AGENT_TOOLS: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_registry_entry',
      description:
        'Query the VeriGen Sui registry via Tatum MCP to retrieve the on-chain provenance record for a certified image. Returns blobId, imageHash, prompt, timestamp, and creator.',
      parameters: {
        type: 'object',
        properties: {
          blob_id: {
            type: 'string',
            description: 'The Walrus blob ID of the certified image to look up',
          },
        },
        required: ['blob_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'fetch_original_image_hash',
      description:
        'Fetch the original image from Walrus storage by blobId and return its SHA-256 hash and metadata. Used to verify tamper detection.',
      parameters: {
        type: 'object',
        properties: {
          blob_id: {
            type: 'string',
            description: 'The Walrus blob ID to fetch',
          },
        },
        required: ['blob_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'compare_image_hash',
      description:
        'Compare a provided SHA-256 hash against the on-chain registered hash for a certified image. Returns whether they match (authentic) or differ (tampered).',
      parameters: {
        type: 'object',
        properties: {
          blob_id: {
            type: 'string',
            description: 'The Walrus blob ID of the original certified image',
          },
          uploaded_hash: {
            type: 'string',
            description: 'The SHA-256 hash of the image being checked',
          },
        },
        required: ['blob_id', 'uploaded_hash'],
      },
    },
  },
];
