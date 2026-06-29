import { useMemo } from 'react';
import { Dish, Ingredient, MealPlan, WEEKDAYS, WEEKDAY_LABELS } from '../types';

interface Props {
  mealPlans: MealPlan[];
  dishes: Dish[];
  ingredients: Ingredient[];
}

interface DishStat {
  dish: Dish;
  proteinName: string;
  lastCooked: string;
  timesThisYear: number;
}

export default function Statistics({ mealPlans, dishes, ingredients }: Props) {
  const stats = useMemo(() => {
    const now = new Date();
    const yearStart = `${now.getFullYear()}-01-01`;

    const dishStats = new Map<string, { lastDate: string; countThisYear: number }>();

    const sortedPlans = [...mealPlans].sort((a, b) => a.weekStartDate.localeCompare(b.weekStartDate));

    for (const plan of sortedPlans) {
      for (let i = 0; i < WEEKDAYS.length; i++) {
        const dishId = plan.slots[WEEKDAYS[i]];
        if (!dishId) continue;

        const mealDate = new Date(plan.weekStartDate + 'T00:00:00');
        mealDate.setDate(mealDate.getDate() + i);
        const dateStr = mealDate.toISOString().split('T')[0];

        const entry = dishStats.get(dishId) ?? { lastDate: '', countThisYear: 0 };
        if (dateStr > entry.lastDate) entry.lastDate = dateStr;
        if (dateStr >= yearStart) entry.countThisYear++;
        dishStats.set(dishId, entry);
      }
    }

    const result: DishStat[] = [];
    for (const dish of dishes) {
      const entry = dishStats.get(dish.id);
      const protein = ingredients.find(i => i.id === dish.primaryProteinId);
      result.push({
        dish,
        proteinName: protein?.name ?? 'Unknown',
        lastCooked: entry?.lastDate ?? 'Never',
        timesThisYear: entry?.countThisYear ?? 0,
      });
    }

    result.sort((a, b) => {
      if (a.lastCooked === 'Never' && b.lastCooked === 'Never') return a.dish.name.localeCompare(b.dish.name);
      if (a.lastCooked === 'Never') return 1;
      if (b.lastCooked === 'Never') return -1;
      return b.lastCooked.localeCompare(a.lastCooked);
    });

    return result;
  }, [mealPlans, dishes, ingredients]);

  if (stats.length === 0) {
    return (
      <div className="statistics">
        <h3>Statistics</h3>
        <p className="empty-state">No dishes to show statistics for.</p>
      </div>
    );
  }

  return (
    <div className="statistics">
      <h3>Statistics</h3>
      <table className="stats-table">
        <thead>
          <tr>
            <th>Dish</th>
            <th>Protein</th>
            <th>Last Cooked</th>
            <th>Times This Year</th>
          </tr>
        </thead>
        <tbody>
          {stats.map(s => (
            <tr key={s.dish.id}>
              <td>{s.dish.name}</td>
              <td>{s.proteinName}</td>
              <td>{s.lastCooked === 'Never' ? 'Never' : new Date(s.lastCooked + 'T00:00:00').toLocaleDateString()}</td>
              <td>{s.timesThisYear}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
