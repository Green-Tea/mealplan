interface MealPlanPayload {
  weekStartDate: string;
  slots: Record<string, string | null>;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const { results } = await env.DB.prepare('SELECT * FROM meal_plans ORDER BY week_start_date').all() as { results: any[] };

  const planMap = new Map<string, Record<string, string | null>>();
  for (const row of results) {
    if (!planMap.has(row.week_start_date)) {
      planMap.set(row.week_start_date, { monday: null, tuesday: null, wednesday: null, thursday: null, friday: null });
    }
    planMap.get(row.week_start_date)![row.day] = row.dish_id;
  }

  const plans = Array.from(planMap.entries()).map(([weekStartDate, slots]) => ({
    weekStartDate,
    slots,
  }));

  return Response.json(plans);
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const plans: MealPlanPayload[] = await request.json();

  const stmts: D1PreparedStatement[] = [
    env.DB.prepare('DELETE FROM meal_plans WHERE week_start_date NOT IN (SELECT value FROM json_each(?1))')
      .bind(JSON.stringify(plans.map(p => p.weekStartDate))),
  ];

  for (const plan of plans) {
    stmts.push(
      env.DB.prepare('DELETE FROM meal_plans WHERE week_start_date = ?1').bind(plan.weekStartDate)
    );

    for (const [day, dishId] of Object.entries(plan.slots)) {
      if (dishId) {
        stmts.push(
          env.DB.prepare('INSERT INTO meal_plans (week_start_date, day, dish_id) VALUES (?1, ?2, ?3)')
            .bind(plan.weekStartDate, day, dishId)
        );
      }
    }
  }

  await env.DB.batch(stmts);
  return Response.json({ ok: true });
};
