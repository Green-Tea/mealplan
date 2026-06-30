import { useMemo, useState } from 'react';
import type { Dish, Ingredient, MealPlan } from '../types';
import { WEEKDAYS, WEEKDAY_LABELS } from '../types';
import { addDays, getToday } from '../utils/dates';

interface Props {
  plan: MealPlan;
  dishes: Dish[];
  ingredients: Ingredient[];
}

interface Entry {
  name: string;
  count: number;
}

function buildSection(entries: Entry[]) {
  return entries
    .map(e => ({ name: e.name, count: e.count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export default function GroceryList({ plan, dishes, ingredients }: Props) {
  const [byDay, setByDay] = useState(false);
  const [includePastDays, setIncludePastDays] = useState(false);

  const today = getToday();
  const hasPastDays = WEEKDAYS.some((_, i) => addDays(plan.weekStartDate, i) < today);

  const dayGroups = useMemo(() => {
    const relevantDays = includePastDays
      ? WEEKDAYS
      : WEEKDAYS.filter((_, i) => addDays(plan.weekStartDate, i) >= today);

    return relevantDays.map(day => {
      const proteinCounts = new Map<number, number>();
      const vegCounts = new Map<number, number>();
      const carbCounts = new Map<number, number>();
      const otherCounts = new Map<number, number>();
      const bump = (map: Map<number, number>, id: number) => map.set(id, (map.get(id) ?? 0) + 1);

      for (const dishId of plan.slots[day]) {
        const dish = dishes.find(d => d.id === dishId);
        if (!dish) continue;
        dish.proteinIds?.forEach(id => bump(proteinCounts, id));
        dish.vegetableIds.forEach(id => bump(vegCounts, id));
        dish.carbohydrateIds?.forEach(id => bump(carbCounts, id));
        dish.otherIds?.forEach(id => bump(otherCounts, id));
      }

      const toEntries = (map: Map<number, number>) => buildSection(Array.from(map.entries()).map(([id, count]) => ({
        name: ingredients.find(i => i.id === id)?.name ?? 'Unknown',
        count,
      })));

      return {
        day,
        label: WEEKDAY_LABELS[day],
        proteins: toEntries(proteinCounts),
        vegetables: toEntries(vegCounts),
        carbohydrates: toEntries(carbCounts),
        others: toEntries(otherCounts),
      };
    }).filter(g => g.proteins.length > 0 || g.vegetables.length > 0 || g.carbohydrates.length > 0 || g.others.length > 0);
  }, [plan, dishes, ingredients, includePastDays, today]);

  const { proteins, vegetables, carbohydrates, others } = useMemo(() => {
    const merge = (key: 'proteins' | 'vegetables' | 'carbohydrates' | 'others') => {
      const totals = new Map<string, number>();
      for (const g of dayGroups) {
        for (const e of g[key]) totals.set(e.name, (totals.get(e.name) ?? 0) + e.count);
      }
      return buildSection(Array.from(totals.entries()).map(([name, count]) => ({ name, count })));
    };

    return {
      proteins: merge('proteins'),
      vegetables: merge('vegetables'),
      carbohydrates: merge('carbohydrates'),
      others: merge('others'),
    };
  }, [dayGroups]);

  if (proteins.length === 0 && vegetables.length === 0 && carbohydrates.length === 0 && others.length === 0) {
    return (
      <div className="grocery-list">
        <h3>Grocery List</h3>
        <p className="empty-state">
          {hasPastDays && !includePastDays
            ? 'No remaining meals planned this week.'
            : 'No meals planned this week.'}
        </p>
        {hasPastDays && !includePastDays && (
          <button className="btn btn-sm" onClick={() => setIncludePastDays(true)}>Show past days too</button>
        )}
      </div>
    );
  }

  function renderSection(title: string, entries: Entry[]) {
    if (entries.length === 0) return null;
    return (
      <div className="grocery-section">
        <h4>{title}</h4>
        <ul>
          {entries.map(e => (
            <li key={e.name}>{e.name}{e.count > 1 ? ` – ${e.count} meals` : ''}</li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="grocery-list">
      <div className="grocery-list-header">
        <h3>Grocery List</h3>
        <div className="grocery-list-actions">
          {hasPastDays && (
            <label className="grocery-past-toggle">
              <input
                type="checkbox"
                checked={includePastDays}
                onChange={e => setIncludePastDays(e.target.checked)}
              />
              Include past days
            </label>
          )}
          <button className="btn btn-sm" onClick={() => setByDay(v => !v)}>
            {byDay ? 'View Aggregate' : 'View by Day'}
          </button>
        </div>
      </div>
      {byDay ? (
        <div className="grocery-days">
          {dayGroups.map(g => (
            <div key={g.day} className="grocery-day">
              <h4 className="grocery-day-label">{g.label}</h4>
              <div className="grocery-columns">
                {renderSection('Proteins', g.proteins)}
                {renderSection('Vegetables', g.vegetables)}
                {renderSection('Carbohydrates', g.carbohydrates)}
                {renderSection('Others', g.others)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grocery-columns">
          {renderSection('Proteins', proteins)}
          {renderSection('Vegetables', vegetables)}
          {renderSection('Carbohydrates', carbohydrates)}
          {renderSection('Others', others)}
        </div>
      )}
    </div>
  );
}
