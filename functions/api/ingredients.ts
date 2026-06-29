export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const { results } = await env.DB.prepare('SELECT * FROM ingredients ORDER BY category, name').all();
  return Response.json(results);
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const ingredients: { id: string; name: string; category: string }[] = await request.json();

  await env.DB.batch([
    env.DB.prepare('DELETE FROM ingredients WHERE id NOT IN (SELECT value FROM json_each(?1))').bind(JSON.stringify(ingredients.map(i => i.id))),
    ...ingredients.map(i =>
      env.DB.prepare('INSERT OR REPLACE INTO ingredients (id, name, category) VALUES (?1, ?2, ?3)').bind(i.id, i.name, i.category)
    ),
  ]);

  return Response.json({ ok: true });
};
