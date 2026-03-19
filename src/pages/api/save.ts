import type { APIRoute } from 'astro';
import { sql } from '../../lib/db';

export const POST: APIRoute = async ({ request }) => {
  const { name, letters, personName } = await request.json();

  if (!name || !letters) {
    return new Response(JSON.stringify({ error: 'חסרים שדות' }), { status: 400 });
  }

  const rows = await sql`
    INSERT INTO saved_links (name, letters, person_name)
    VALUES (${name}, ${letters}, ${personName || null})
    RETURNING id
  `;

  return new Response(JSON.stringify({ id: rows[0].id }));
};
