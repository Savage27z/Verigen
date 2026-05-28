import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function generateImage(prompt: string): Promise<Buffer> {
  const output = await replicate.run(
    'stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc',
    {
      input: {
        prompt,
        width: 1024,
        height: 1024,
        num_outputs: 1,
        guidance_scale: 7.5,
        num_inference_steps: 25,
      },
    }
  );

  // output is an array of URLs or ReadableStream
  const imageUrl = Array.isArray(output) ? output[0] : output;
  if (!imageUrl) throw new Error('Replicate returned no image');

  // If it's a ReadableStream, read it directly
  if (imageUrl instanceof ReadableStream) {
    const reader = imageUrl.getReader();
    const chunks: Uint8Array[] = [];
    let done = false;
    while (!done) {
      const result = await reader.read();
      done = result.done;
      if (result.value) chunks.push(result.value);
    }
    return Buffer.concat(chunks);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(imageUrl as string, {
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Failed to fetch generated image: ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } finally {
    clearTimeout(timeout);
  }
}
