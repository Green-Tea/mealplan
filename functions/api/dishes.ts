interface DishPayload {
  id: string;
  name: string;
  proteinIds: string[];
  vegetableIds: string[];
  carbohydrateIds: string[];
  otherIds: string[];
  notes?: string;
  tags?: string[];
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const { results: dishes } = await env.DB.prepare('SELECT * FROM dishes ORDER BY name').all();
  const { results: links } = await env.DB.prepare('SELECT * FROM dish_ingredients').all();

  const linkMap = new Map<string, { protein: string[]; vegetable: string[]; carbohydrate: string[]; other: string[] }>();
  for (const link of links as any[]) {
    if (!linkMap.has(link.dish_id)) {
      linkMap.set(link.dish_id, { protein: [], vegetable: [], carbohydrate: [], other: [] });
    }
    linkMap.get(link.dish_id)![link.role as keyof ReturnType<typeof linkMap.get>].push(link.ingredient_id);
  }

  const result = (dishes as any[]).map(d => ({
    id: d.id,
    name: d.name,
    proteinIds: linkMap.get(d.id)?.protein ?? [],
    vegetableIds: linkMap.get(d.id)?.vegetable ?? [],
    carbohydrateIds: linkMap.get(d.id)?.carbohydrate ?? [],
    otherIds: linkMap.get(d.id)?.other ?? [],
    notes: d.notes || undefined,
    tags: d.tags ? JSON.parse(d.tags) : undefined,
  }));

  return Response.json(result);
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const dishes: DishPayload[] = await request.json();
  const dishIds = dishes.map(d => d.id);

  const stmts: D1PreparedStatement[] = [
    env.DB.prepare('DELETE FROM dish_ingredients WHERE dish_id NOT IN (SELECT value FROM json_each(?1))').bind(JSON.stringify(dishIds)),
    env.DB.prepare('DELETE FROM dishes WHERE id NOT IN (SELECT value FROM json_each(?1))').bind(JSON.stringify(dishIds)),
  ];

  for (const d of dishes) {
    stmts.push(
      env.DB.prepare('INSERT OR REPLACE INTO dishes (id, name, notes, tags) VALUES (?1, ?2, ?3, ?4)')
        .bind(d.id, d.name, d.notes || null, d.tags?.length ? JSON.stringify(d.tags) : null)
    );

    stmts.push(
      env.DB.prepare('DELETE FROM dish_ingredients WHERE dish_id = ?1').bind(d.id)
    );

    const addLinks = (ids: string[], role: string) => {
      for (const ingId of ids) {
        stmts.push(
          env.DB.prepare('INSERT INTO dish_ingredients (dish_id, ingredient_id, role) VALUES (?1, ?2, ?3)')
            .bind(d.id, ingId, role)
        );
      }
    };

    addLinks(d.proteinIds, 'protein');
    addLinks(d.vegetableIds, 'vegetable');
    addLinks(d.carbohydrateIds, 'carbohydrate');
    addLinks(d.otherIds, 'other');
  }

  await env.DB.batch(stmts);
  return Response.json({ ok: true });
};
