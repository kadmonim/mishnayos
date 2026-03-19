import type { APIRoute } from 'astro';
import { sql } from '../../lib/db';

function randomId(len: number) {
  return Array.from(crypto.getRandomValues(new Uint8Array(len)))
    .map(b => b.toString(36).padStart(2, '0'))
    .join('')
    .slice(0, len * 2 - 1);
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const { name, letters, personName } = await request.json();

    if (!name || !letters) {
      return new Response(JSON.stringify({ error: 'חסרים שדות' }), { status: 400 });
    }

    const id = randomId(4);
    const editToken = randomId(8);
    await sql`
      INSERT INTO saved_links (id, name, letters, person_name, edit_token)
      VALUES (${id}, ${name}, ${letters}, ${personName || null}, ${editToken})
    `;

    return new Response(JSON.stringify({ id, editToken }));
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
