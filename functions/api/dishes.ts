interface DishPayload {
  id?: number;
  name: string;
  proteinIds: number[];
  vegetableIds: number[];
  carbohydrateIds: number[];
  otherIds: number[];
  notes?: string;
  tags?: string[];
}

function buildLinkStatements(db: D1Database, dishId: number, dish: DishPayload): D1PreparedStatement[] {
  const stmts: D1PreparedStatement[] = [
    db.prepare('DELETE FROM dish_ingredients WHERE dish_id = ?1').bind(dishId),
  ];

  const addLinks = (ids: number[], role: string) => {
    for (const ingId of ids) {
      stmts.push(
        db.prepare('INSERT INTO dish_ingredients (dish_id, ingredient_id, role) VALUES (?1, ?2, ?3)')
          .bind(dishId, ingId, role)
      );
    }
  };

  addLinks(dish.proteinIds, 'protein');
  addLinks(dish.vegetableIds, 'vegetable');
  addLinks(dish.carbohydrateIds, 'carbohydrate');
  addLinks(dish.otherIds, 'other');

  return stmts;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const { results: dishes } = await env.DB.prepare('SELECT * FROM dishes ORDER BY name').all();
  const { results: links } = await env.DB.prepare('SELECT * FROM dish_ingredients').all();

  const linkMap = new Map<number, { protein: number[]; vegetable: number[]; carbohydrate: number[]; other: number[] }>();
  for (const link of links as any[]) {
    if (!linkMap.has(link.dish_id)) {
      linkMap.set(link.dish_id, { protein: [], vegetable: [], carbohydrate: [], other: [] });
    }
    linkMap.get(link.dish_id)![link.role as 'protein' | 'vegetable' | 'carbohydrate' | 'other'].push(link.ingredient_id);
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

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const dish: DishPayload = await request.json();
  const result = await env.DB.prepare('INSERT INTO dishes (name, notes, tags) VALUES (?1, ?2, ?3)')
    .bind(dish.name, dish.notes || null, dish.tags?.length ? JSON.stringify(dish.tags) : null)
    .run();

  const dishId = result.meta.last_row_id as number;
  const linkStmts = buildLinkStatements(env.DB, dishId, dish);
  if (linkStmts.length > 1) {
    await env.DB.batch(linkStmts);
  }

  return Response.json({ id: dishId });
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const dish: DishPayload & { id: number } = await request.json();

  const stmts: D1PreparedStatement[] = [
    env.DB.prepare('UPDATE dishes SET name = ?1, notes = ?2, tags = ?3 WHERE id = ?4')
      .bind(dish.name, dish.notes || null, dish.tags?.length ? JSON.stringify(dish.tags) : null, dish.id),
    ...buildLinkStatements(env.DB, dish.id, dish),
  ];

  await env.DB.batch(stmts);
  return Response.json({ ok: true });
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  const { id }: { id: number } = await request.json();
  await env.DB.batch([
    env.DB.prepare('DELETE FROM dish_ingredients WHERE dish_id = ?1').bind(id),
    env.DB.prepare('DELETE FROM dishes WHERE id = ?1').bind(id),
  ]);
  return Response.json({ ok: true });
};
