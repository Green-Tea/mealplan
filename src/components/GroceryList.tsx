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
    const vegCounts = new Map<number, number>();
    const carbCounts = new Map<number, number>();
    const otherCounts = new Map<number, number>();

    const bump = (map: Map<number, number>, id: number) => map.set(id, (map.get(id) ?? 0) + 1);

    for (const day of WEEKDAYS) {
      for (const dishId of plan.slots[day]) {
        const dish = dishes.find(d => d.id === dishId);
        if (!dish) continue;

        dish.proteinIds?.forEach(id => bump(proteinCounts, id));
        dish.vegetableIds.forEach(id => bump(vegCounts, id));
        dish.carbohydrateIds?.forEach(id => bump(carbCounts, id));
        dish.otherIds?.forEach(id => bump(otherCounts, id));
      }
    }

    const toEntries = (map: Map<number, number>) => Array.from(map.entries()).map(([id, count]) => {
      const ing = ingredients.find(i => i.id === id);
      return { name: ing?.name ?? 'Unknown', count };
    }).sort((a, b) => a.name.localeCompare(b.name));

    return {
      proteins: toEntries(proteinCounts),
      vegetables: toEntries(vegCounts),
      carbohydrates: toEntries(carbCounts),
      others: toEntries(otherCounts),
    };
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
              <li key={p.name}>{p.name}{p.count > 1 ? ` – ${p.count} meals` : ''}</li>
            ))}
          </ul>
        </div>
        <div className="grocery-section">
          <h4>Vegetables</h4>
          <ul>
            {vegetables.map(v => (
              <li key={v.name}>{v.name}{v.count > 1 ? ` – ${v.count} meals` : ''}</li>
            ))}
          </ul>
        </div>
        {carbohydrates.length > 0 && (
          <div className="grocery-section">
            <h4>Carbohydrates</h4>
            <ul>
              {carbohydrates.map(c => (
                <li key={c.name}>{c.name}{c.count > 1 ? ` – ${c.count} meals` : ''}</li>
              ))}
            </ul>
          </div>
        )}
        {others.length > 0 && (
          <div className="grocery-section">
            <h4>Others</h4>
            <ul>
              {others.map(o => (
                <li key={o.name}>{o.name}{o.count > 1 ? ` – ${o.count} meals` : ''}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
