export type IngredientCategory = 'Protein' | 'Vegetable' | 'Carbohydrate' | 'Other';

export interface Ingredient {
  id: number;
  name: string;
  category: IngredientCategory;
}

export interface Dish {
  id: number;
  name: string;
  proteinIds: number[];
  vegetableIds: number[];
  carbohydrateIds: number[];
  otherIds: number[];
  notes?: string;
  tags?: string[];
}

export interface MealPlan {
  weekStartDate: string;
  slots: {
    monday: number[];
    tuesday: number[];
    wednesday: number[];
    thursday: number[];
    friday: number[];
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
