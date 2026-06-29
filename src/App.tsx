import { useState, useCallback, useEffect } from 'react';
import type { Ingredient, Dish, MealPlan } from './types';
import { loadIngredients, loadDishes, loadMealPlans } from './store/storage';
import IngredientsPage from './pages/IngredientsPage';
import DishesPage from './pages/DishesPage';
import PlannerPage from './pages/PlannerPage';

type Page = 'planner' | 'dishes' | 'ingredients';

export default function App() {
  const [page, setPage] = useState<Page>('planner');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const [ing, d, mp] = await Promise.all([loadIngredients(), loadDishes(), loadMealPlans()]);
    setIngredients(ing);
    setDishes(d);
    setMealPlans(mp);
  }, []);

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, [reload]);

  if (loading) {
    return (
      <div className="app">
        <nav className="nav">
          <div className="nav-brand">Meal Planner</div>
        </nav>
        <main className="main">
          <p className="empty-state">Loading...</p>
        </main>
      </div>
    );
  }

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
            onSavePlans={setMealPlans}
          />
        )}
        {page === 'dishes' && (
          <DishesPage
            dishes={dishes}
            ingredients={ingredients}
            onUpdate={reload}
          />
        )}
        {page === 'ingredients' && (
          <IngredientsPage
            ingredients={ingredients}
            dishes={dishes}
            onUpdate={reload}
          />
        )}
      </main>
    </div>
  );
}
