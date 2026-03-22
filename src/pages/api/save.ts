import type { APIRoute } from 'astro';
import { sql } from '../../lib/db';
import { getStore } from '@netlify/blobs';

function randomId(len: number) {
  return Array.from(crypto.getRandomValues(new Uint8Array(len)))
    .map(b => b.toString(36).padStart(2, '0'))
    .join('')
    .slice(0, len * 2 - 1);
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const letters = formData.get('letters') as string;
    const personName = formData.get('personName') as string || null;
    const image = formData.get('image') as File | null;

    if (!name || !letters) {
      return new Response(JSON.stringify({ error: 'חסרים שדות' }), { status: 400 });
    }

    let hasImage = false;
    const id = randomId(4);
    const editToken = randomId(8);

    if (image && image.size > 0) {
      if (image.size > 102400) {
        return new Response(JSON.stringify({ error: 'התמונה חייבת להיות עד 100KB' }), { status: 400 });
      }
      const store = getStore('images');
      const buffer = await image.arrayBuffer();
      await store.set(id, buffer, { metadata: { contentType: image.type } });
      hasImage = true;
    }

    await sql`
      INSERT INTO saved_links (id, name, letters, person_name, edit_token, has_image)
      VALUES (${id}, ${name}, ${letters}, ${personName}, ${editToken}, ${hasImage})
    `;

    return new Response(JSON.stringify({ id, editToken }));
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
