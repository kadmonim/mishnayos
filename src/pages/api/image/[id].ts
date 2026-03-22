import type { APIRoute } from 'astro';
import { getStore } from '@netlify/blobs';

export const GET: APIRoute = async ({ params }) => {
  const store = getStore('images');
  const result = await store.getWithMetadata(params.id!, { type: 'arrayBuffer' });

  if (!result) {
    return new Response('Not found', { status: 404 });
  }

  return new Response(result.data, {
    headers: {
      'Content-Type': (result.metadata?.contentType as string) || 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
