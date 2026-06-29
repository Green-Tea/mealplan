import type { Ingredient, Dish, MealPlan } from '../types';

const KEYS = {
  ingredients: 'mealplan_ingredients',
  dishes: 'mealplan_dishes',
  mealPlans: 'mealplan_plans',
} as const;

function load<T>(key: string): T[] {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

function save<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export function loadIngredients(): Ingredient[] {
  return load<Ingredient>(KEYS.ingredients);
}

export function saveIngredients(ingredients: Ingredient[]): void {
  save(KEYS.ingredients, ingredients);
}

export function loadDishes(): Dish[] {
  return load<Dish>(KEYS.dishes);
}

export function saveDishes(dishes: Dish[]): void {
  save(KEYS.dishes, dishes);
}

export function loadMealPlans(): MealPlan[] {
  return load<MealPlan>(KEYS.mealPlans);
}

export function saveMealPlans(plans: MealPlan[]): void {
  save(KEYS.mealPlans, plans);
}
