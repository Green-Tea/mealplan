import { useState, useCallback, useEffect, useRef } from 'react';
import type { Ingredient, Dish, MealPlan } from './types';
import { loadIngredients, loadDishes, loadMealPlans } from './store/storage';
import IngredientsPage from './pages/IngredientsPage';
import DishesPage from './pages/DishesPage';
import PlannerPage from './pages/PlannerPage';

type Page = 'planner' | 'dishes' | 'ingredients';

const PAGES: Page[] = ['planner', 'dishes', 'ingredients'];
const SWIPE_THRESHOLD = 50;

export default function App() {
  const [page, setPage] = useState<Page>('planner');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const horizontalSwipe = useRef<boolean | null>(null);
  const dragOffsetRef = useRef(0);

  const pageIndex = PAGES.indexOf(page);

  const reload = useCallback(async () => {
    const [ing, d, mp] = await Promise.all([loadIngredients(), loadDishes(), loadMealPlans()]);
    setIngredients(ing);
    setDishes(d);
    setMealPlans(mp);
  }, []);

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, [reload]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    horizontalSwipe.current = null;
    setDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;

    if (horizontalSwipe.current === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      horizontalSwipe.current = Math.abs(dx) > Math.abs(dy);
    }
    if (!horizontalSwipe.current) return;

    if (e.cancelable) e.preventDefault();
    const atFirstPage = pageIndex === 0 && dx > 0;
    const atLastPage = pageIndex === PAGES.length - 1 && dx < 0;
    const offset = atFirstPage || atLastPage ? dx / 3 : dx;
    dragOffsetRef.current = offset;
    setDragOffset(offset);
  }, [pageIndex]);

  const handleTouchEnd = useCallback(() => {
    if (horizontalSwipe.current) {
      const offset = dragOffsetRef.current;
      if (offset <= -SWIPE_THRESHOLD && pageIndex < PAGES.length - 1) {
        setPage(PAGES[pageIndex + 1]);
      } else if (offset >= SWIPE_THRESHOLD && pageIndex > 0) {
        setPage(PAGES[pageIndex - 1]);
      }
    }
    setDragging(false);
    setDragOffset(0);
    dragOffsetRef.current = 0;
    horizontalSwipe.current = null;
  }, [pageIndex]);

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

  const trackStyle = {
    transform: `translateX(calc(${-pageIndex * 100}% + ${dragOffset}px))`,
    transition: dragging ? 'none' : 'transform 0.3s ease',
  };

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
      <div
        className="page-viewport"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <div className="page-track" style={trackStyle}>
          <main className="main page-slide">
            <PlannerPage
              dishes={dishes}
              ingredients={ingredients}
              mealPlans={mealPlans}
              onSavePlans={setMealPlans}
            />
          </main>
          <main className="main page-slide">
            <DishesPage
              dishes={dishes}
              ingredients={ingredients}
              onUpdate={reload}
            />
          </main>
          <main className="main page-slide">
            <IngredientsPage
              ingredients={ingredients}
              dishes={dishes}
              onUpdate={reload}
            />
          </main>
        </div>
      </div>
    </div>
  );
}
