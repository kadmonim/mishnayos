import type { APIRoute } from 'astro';
import { sql } from '../../lib/db';
import { getStore } from '@netlify/blobs';

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const id = formData.get('id') as string;
    const editToken = formData.get('editToken') as string;
    const name = formData.get('name') as string;
    const letters = formData.get('letters') as string;
    const personName = formData.get('personName') as string || null;
    const image = formData.get('image') as File | null;

    if (!id || !editToken) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });
    }

    const rows = await sql`
      SELECT id FROM saved_links WHERE id = ${id} AND edit_token = ${editToken}
    `;

    if (rows.length === 0) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
    }

    if (image && image.size > 0) {
      if (image.size > 102400) {
        return new Response(JSON.stringify({ error: 'התמונה חייבת להיות עד 100KB' }), { status: 400 });
      }
      const store = getStore('images');
      const buffer = await image.arrayBuffer();
      await store.set(id, buffer, { metadata: { contentType: image.type } });
      await sql`
        UPDATE saved_links
        SET name = ${name}, letters = ${letters}, person_name = ${personName}, has_image = true
        WHERE id = ${id} AND edit_token = ${editToken}
      `;
    } else {
      await sql`
        UPDATE saved_links
        SET name = ${name}, letters = ${letters}, person_name = ${personName}
        WHERE id = ${id} AND edit_token = ${editToken}
      `;
    }

    return new Response(JSON.stringify({ ok: true }));
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
