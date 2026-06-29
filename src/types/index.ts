export type IngredientCategory = 'Protein' | 'Vegetable';

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
}

export interface Dish {
  id: string;
  name: string;
  primaryProteinId: string;
  vegetableIds: string[];
  notes?: string;
  tags?: string[];
}

export interface MealPlan {
  weekStartDate: string; // ISO date string of Monday
  slots: {
    monday: string | null;
    tuesday: string | null;
    wednesday: string | null;
    thursday: string | null;
    friday: string | null;
  };
}

export type Weekday = keyof MealPlan['slots'];

export const WEEKDAYS: Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
};
