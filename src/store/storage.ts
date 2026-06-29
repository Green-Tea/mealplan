import type { Ingredient, Dish, MealPlan } from '../types';

const API = '/api';

async function request<T>(url: string, method: string = 'GET', body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

// Ingredients
export const loadIngredients = () => request<Ingredient[]>(`${API}/ingredients`);

export const createIngredient = (data: Omit<Ingredient, 'id'>) =>
  request<{ id: number }>(`${API}/ingredients`, 'POST', data);

export const updateIngredient = (data: Ingredient) =>
  request(`${API}/ingredients`, 'PUT', data);

export const deleteIngredient = (id: number) =>
  request(`${API}/ingredients`, 'DELETE', { id });

// Dishes
export const loadDishes = () => request<Dish[]>(`${API}/dishes`);

export const createDish = (data: Omit<Dish, 'id'>) =>
  request<{ id: number }>(`${API}/dishes`, 'POST', data);

export const updateDish = (data: Dish) =>
  request(`${API}/dishes`, 'PUT', data);

export const deleteDish = (id: number) =>
  request(`${API}/dishes`, 'DELETE', { id });

// Meal Plans
export const loadMealPlans = () => request<MealPlan[]>(`${API}/meal-plans`);

export const saveMealPlan = (plan: MealPlan) =>
  request(`${API}/meal-plans`, 'PUT', plan);
