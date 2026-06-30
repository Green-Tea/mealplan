interface MealPlanPayload {
  weekStartDate: string;
  slots: Record<string, number[]>;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const { results } = await env.DB.prepare('SELECT * FROM meal_plans ORDER BY week_start_date, day, position').all() as { results: any[] };

  const planMap = new Map<string, Record<string, number[]>>();
  for (const row of results) {
    if (!planMap.has(row.week_start_date)) {
      planMap.set(row.week_start_date, { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [] });
    }
    planMap.get(row.week_start_date)![row.day].push(row.dish_id);
  }

  const plans = Array.from(planMap.entries()).map(([weekStartDate, slots]) => ({
    weekStartDate,
    slots,
  }));

  return Response.json(plans);
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const plan: MealPlanPayload = await request.json();

  const stmts: D1PreparedStatement[] = [
    env.DB.prepare('DELETE FROM meal_plans WHERE week_start_date = ?1').bind(plan.weekStartDate),
  ];

  for (const [day, dishIds] of Object.entries(plan.slots)) {
    dishIds.forEach((dishId, position) => {
      stmts.push(
        env.DB.prepare('INSERT INTO meal_plans (week_start_date, day, dish_id, position) VALUES (?1, ?2, ?3, ?4)')
          .bind(plan.weekStartDate, day, dishId, position)
      );
    });
  }

  await env.DB.batch(stmts);
  return Response.json({ ok: true });
};
