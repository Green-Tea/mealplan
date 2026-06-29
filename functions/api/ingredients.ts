export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const { results } = await env.DB.prepare('SELECT * FROM ingredients ORDER BY category, name').all();
  return Response.json(results);
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const { name, category }: { name: string; category: string } = await request.json();
  const result = await env.DB.prepare('INSERT INTO ingredients (name, category) VALUES (?1, ?2)')
    .bind(name, category).run();
  return Response.json({ id: result.meta.last_row_id });
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const { id, name, category }: { id: number; name: string; category: string } = await request.json();
  await env.DB.prepare('UPDATE ingredients SET name = ?1, category = ?2 WHERE id = ?3')
    .bind(name, category, id).run();
  return Response.json({ ok: true });
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  const { id }: { id: number } = await request.json();
  await env.DB.prepare('DELETE FROM ingredients WHERE id = ?1').bind(id).run();
  return Response.json({ ok: true });
};
