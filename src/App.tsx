import { useState, useCallback } from 'react';
import type { Ingredient, Dish, MealPlan } from './types';
import { loadIngredients, saveIngredients, loadDishes, saveDishes, loadMealPlans, saveMealPlans } from './store/storage';
import IngredientsPage from './pages/IngredientsPage';
import DishesPage from './pages/DishesPage';
import PlannerPage from './pages/PlannerPage';

type Page = 'planner' | 'dishes' | 'ingredients';

export default function App() {
  const [page, setPage] = useState<Page>('planner');
  const [ingredients, setIngredients] = useState<Ingredient[]>(loadIngredients);
  const [dishes, setDishes] = useState<Dish[]>(loadDishes);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>(loadMealPlans);

  const handleSaveIngredients = useCallback((next: Ingredient[]) => {
    setIngredients(next);
    saveIngredients(next);
  }, []);

  const handleSaveDishes = useCallback((next: Dish[]) => {
    setDishes(next);
    saveDishes(next);
  }, []);

  const handleSavePlans = useCallback((next: MealPlan[]) => {
    setMealPlans(next);
    saveMealPlans(next);
  }, []);

  return (
    <div className="app">
      <nav className="nav">
        <div className="nav-brand">Meal Planner</div>
        <div className="nav-links">
          <button
            className={`nav-link ${page === 'planner' ? 'active' : ''}`}
            onClick={() => setPage('planner')}
          >
            Planner
          </button>
          <button
            className={`nav-link ${page === 'dishes' ? 'active' : ''}`}
            onClick={() => setPage('dishes')}
          >
            Dishes
          </button>
          <button
            className={`nav-link ${page === 'ingredients' ? 'active' : ''}`}
            onClick={() => setPage('ingredients')}
          >
            Ingredients
          </button>
        </div>
      </nav>
      <main className="main">
        {page === 'planner' && (
          <PlannerPage
            dishes={dishes}
            ingredients={ingredients}
            mealPlans={mealPlans}
            onSavePlans={handleSavePlans}
          />
        )}
        {page === 'dishes' && (
          <DishesPage
            dishes={dishes}
            ingredients={ingredients}
            onSave={handleSaveDishes}
          />
        )}
        {page === 'ingredients' && (
          <IngredientsPage
            ingredients={ingredients}
            onSave={handleSaveIngredients}
            dishes={dishes}
          />
        )}
      </main>
    </div>
  );
}
