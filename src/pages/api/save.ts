import type { APIRoute } from 'astro';
import { sql } from '../../lib/db';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { name, letters, personName } = await request.json();

    if (!name || !letters) {
      return new Response(JSON.stringify({ error: 'חסרים שדות' }), { status: 400 });
    }

    const id = crypto.randomUUID();
    await sql`
      INSERT INTO saved_links (id, name, letters, person_name)
      VALUES (${id}, ${name}, ${letters}, ${personName || null})
    `;

    return new Response(JSON.stringify({ id }));
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
