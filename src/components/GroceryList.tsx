import { useMemo } from 'react';
import type { Dish, Ingredient, MealPlan } from '../types';
import { WEEKDAYS } from '../types';

interface Props {
  plan: MealPlan;
  dishes: Dish[];
  ingredients: Ingredient[];
}

export default function GroceryList({ plan, dishes, ingredients }: Props) {
  const { proteins, vegetables } = useMemo(() => {
    const proteinCounts = new Map<string, number>();
    const vegSet = new Set<string>();

    for (const day of WEEKDAYS) {
      const dishId = plan.slots[day];
      if (!dishId) continue;
      const dish = dishes.find(d => d.id === dishId);
      if (!dish) continue;

      proteinCounts.set(dish.primaryProteinId, (proteinCounts.get(dish.primaryProteinId) ?? 0) + 1);
      dish.vegetableIds.forEach(id => vegSet.add(id));
    }

    const proteins = Array.from(proteinCounts.entries()).map(([id, count]) => {
      const ing = ingredients.find(i => i.id === id);
      return { name: ing?.name ?? 'Unknown', count };
    }).sort((a, b) => a.name.localeCompare(b.name));

    const vegetables = Array.from(vegSet).map(id => {
      const ing = ingredients.find(i => i.id === id);
      return ing?.name ?? 'Unknown';
    }).sort();

    return { proteins, vegetables };
  }, [plan, dishes, ingredients]);

  if (proteins.length === 0 && vegetables.length === 0) {
    return (
      <div className="grocery-list">
        <h3>Grocery List</h3>
        <p className="empty-state">No meals planned this week.</p>
      </div>
    );
  }

  return (
    <div className="grocery-list">
      <h3>Grocery List</h3>
      <div className="grocery-columns">
        <div className="grocery-section">
          <h4>Proteins</h4>
          <ul>
            {proteins.map(p => (
              <li key={p.name}>{p.name} – {p.count} {p.count === 1 ? 'meal' : 'meals'}</li>
            ))}
          </ul>
        </div>
        <div className="grocery-section">
          <h4>Vegetables</h4>
          <ul>
            {vegetables.map(v => (
              <li key={v}>{v}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
