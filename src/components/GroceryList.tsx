import { useMemo } from 'react';
import type { Dish, Ingredient, MealPlan } from '../types';
import { WEEKDAYS } from '../types';

interface Props {
  plan: MealPlan;
  dishes: Dish[];
  ingredients: Ingredient[];
}

export default function GroceryList({ plan, dishes, ingredients }: Props) {
  const { proteins, vegetables, carbohydrates, others } = useMemo(() => {
    const proteinCounts = new Map<number, number>();
    const vegSet = new Set<number>();
    const carbSet = new Set<number>();
    const otherSet = new Set<number>();

    for (const day of WEEKDAYS) {
      const dishId = plan.slots[day];
      if (!dishId) continue;
      const dish = dishes.find(d => d.id === dishId);
      if (!dish) continue;

      dish.proteinIds?.forEach(pid => proteinCounts.set(pid, (proteinCounts.get(pid) ?? 0) + 1));
      dish.vegetableIds.forEach(id => vegSet.add(id));
      dish.carbohydrateIds?.forEach(id => carbSet.add(id));
      dish.otherIds?.forEach(id => otherSet.add(id));
    }

    const proteins = Array.from(proteinCounts.entries()).map(([id, count]) => {
      const ing = ingredients.find(i => i.id === id);
      return { name: ing?.name ?? 'Unknown', count };
    }).sort((a, b) => a.name.localeCompare(b.name));

    const toNames = (set: Set<number>) => Array.from(set).map(id => {
      const ing = ingredients.find(i => i.id === id);
      return ing?.name ?? 'Unknown';
    }).sort();

    return { proteins, vegetables: toNames(vegSet), carbohydrates: toNames(carbSet), others: toNames(otherSet) };
  }, [plan, dishes, ingredients]);

  if (proteins.length === 0 && vegetables.length === 0 && carbohydrates.length === 0 && others.length === 0) {
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
        {carbohydrates.length > 0 && (
          <div className="grocery-section">
            <h4>Carbohydrates</h4>
            <ul>
              {carbohydrates.map(c => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        )}
        {others.length > 0 && (
          <div className="grocery-section">
            <h4>Others</h4>
            <ul>
              {others.map(o => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
