import type { APIRoute } from 'astro';
import { sql } from '../../lib/db';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { id, editToken, name, letters, personName } = await request.json();

    if (!id || !editToken) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });
    }

    const rows = await sql`
      SELECT id FROM saved_links WHERE id = ${id} AND edit_token = ${editToken}
    `;

    if (rows.length === 0) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
    }

    await sql`
      UPDATE saved_links
      SET name = ${name}, letters = ${letters}, person_name = ${personName || null}
      WHERE id = ${id} AND edit_token = ${editToken}
    `;

    return new Response(JSON.stringify({ ok: true }));
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
