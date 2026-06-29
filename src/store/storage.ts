import type { Ingredient, Dish, MealPlan } from '../types';

const API = '/api';

export async function loadIngredients(): Promise<Ingredient[]> {
  const res = await fetch(`${API}/ingredients`);
  return res.json();
}

export async function saveIngredients(ingredients: Ingredient[]): Promise<void> {
  await fetch(`${API}/ingredients`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ingredients),
  });
}

export async function loadDishes(): Promise<Dish[]> {
  const res = await fetch(`${API}/dishes`);
  return res.json();
}

export async function saveDishes(dishes: Dish[]): Promise<void> {
  await fetch(`${API}/dishes`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dishes),
  });
}

export async function loadMealPlans(): Promise<MealPlan[]> {
  const res = await fetch(`${API}/meal-plans`);
  return res.json();
}

export async function saveMealPlans(plans: MealPlan[]): Promise<void> {
  await fetch(`${API}/meal-plans`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(plans),
  });
}
