import { useState, useMemo } from 'react';
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import type { Dish, Ingredient, MealPlan, Weekday } from '../types';
import { WEEKDAYS, WEEKDAY_LABELS } from '../types';
import { addWeeks, formatWeekRange, getCurrentWeekStart } from '../utils/dates';
import { saveMealPlan } from '../store/storage';
import DaySlot from '../components/DaySlot';
import DishPicker from '../components/DishPicker';
import GroceryList from '../components/GroceryList';
import Statistics from '../components/Statistics';

interface Props {
  dishes: Dish[];
  ingredients: Ingredient[];
  mealPlans: MealPlan[];
  onSavePlans: (plans: MealPlan[]) => void;
  onReload: () => Promise<void>;
}

function getOrCreatePlan(plans: MealPlan[], weekStart: string): MealPlan {
  const existing = plans.find(p => p.weekStartDate === weekStart);
  if (existing) return existing;
  return {
    weekStartDate: weekStart,
    slots: { monday: null, tuesday: null, wednesday: null, thursday: null, friday: null },
  };
}

export default function PlannerPage({ dishes, ingredients, mealPlans, onSavePlans, onReload }: Props) {
  const [weekStart, setWeekStart] = useState(getCurrentWeekStart);
  const [showGrocery, setShowGrocery] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [activeDishId, setActiveDishId] = useState<string | null>(null);

  const plan = useMemo(() => getOrCreatePlan(mealPlans, weekStart), [mealPlans, weekStart]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function persistPlan(updated: MealPlan) {
    const idx = mealPlans.findIndex(p => p.weekStartDate === updated.weekStartDate);
    if (idx >= 0) {
      const next = [...mealPlans];
      next[idx] = updated;
      onSavePlans(next);
    } else {
      onSavePlans([...mealPlans, updated]);
    }
    saveMealPlan(updated);
  }

  function assignDish(day: Weekday, dishId: number | null) {
    persistPlan({ ...plan, slots: { ...plan.slots, [day]: dishId } });
  }

  function clearDay(day: Weekday) {
    assignDish(day, null);
  }

  function duplicateMeal(fromDay: Weekday) {
    const dishId = plan.slots[fromDay];
    if (!dishId) return;
    const emptyDay = WEEKDAYS.find(d => d !== fromDay && !plan.slots[d]);
    if (emptyDay) {
      assignDish(emptyDay, dishId);
    } else {
      alert('No empty slots available to duplicate into.');
    }
  }

  function copyPreviousWeek() {
    const prevWeek = addWeeks(weekStart, -1);
    const prevPlan = mealPlans.find(p => p.weekStartDate === prevWeek);
    if (!prevPlan) {
      alert('No meal plan found for the previous week.');
      return;
    }
    persistPlan({ ...plan, slots: { ...prevPlan.slots } });
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveDishId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDishId(null);
    const { active, over } = event;
    if (!over) return;

    const overId = over.id as string;

    if (WEEKDAYS.includes(overId as Weekday)) {
      const targetDay = overId as Weekday;
      const dragId = active.id as string;

      const sourceDay = WEEKDAYS.find(d => `planned-${d}` === dragId);
      if (sourceDay) {
        const sourceDish = plan.slots[sourceDay];
        const targetDish = plan.slots[targetDay];
        persistPlan({
          ...plan,
          slots: {
            ...plan.slots,
            [sourceDay]: targetDish,
            [targetDay]: sourceDish,
          },
        });
      } else {
        assignDish(targetDay, Number(dragId));
      }
    }
  }

  const resolvedActiveDish = activeDishId
    ? (() => {
        const numId = Number(activeDishId);
        if (!isNaN(numId)) {
          const direct = dishes.find(d => d.id === numId);
          if (direct) return direct;
        }
        const day = WEEKDAYS.find(d => `planned-${d}` === activeDishId);
        if (day && plan.slots[day]) return dishes.find(d => d.id === plan.slots[day]!);
        return null;
      })()
    : null;

  return (
    <div className="page">
      <div className="planner-header">
        <h2>Weekly Planner</h2>
        <div className="week-nav">
          <button className="btn btn-sm" onClick={() => setWeekStart(s => addWeeks(s, -1))}>← Prev</button>
          <span className="week-label">{formatWeekRange(weekStart)}</span>
          <button className="btn btn-sm" onClick={() => setWeekStart(s => addWeeks(s, 1))}>Next →</button>
        </div>
      </div>

      <div className="planner-actions">
        <button className="btn btn-sm" onClick={copyPreviousWeek}>Copy Previous Week</button>
        <button className="btn btn-sm" onClick={() => setShowGrocery(!showGrocery)}>
          {showGrocery ? 'Hide Grocery List' : 'Generate Grocery List'}
        </button>
        <button className="btn btn-sm" onClick={() => setShowStats(!showStats)}>
          {showStats ? 'Hide Statistics' : 'Statistics'}
        </button>
      </div>

      {showGrocery && (
        <GroceryList plan={plan} dishes={dishes} ingredients={ingredients} />
      )}

      {showStats && (
        <Statistics mealPlans={mealPlans} dishes={dishes} ingredients={ingredients} />
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="planner-board">
          {WEEKDAYS.map(day => (
            <DaySlot
              key={day}
              day={day}
              label={WEEKDAY_LABELS[day]}
              dish={plan.slots[day] ? dishes.find(d => d.id === plan.slots[day]) ?? null : null}
              ingredients={ingredients}
              onClear={() => clearDay(day)}
              onDuplicate={() => duplicateMeal(day)}
            />
          ))}
        </div>

        <DragOverlay>
          {resolvedActiveDish ? (
            <div className="dish-chip dragging">{resolvedActiveDish.name}</div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <DishPicker dishes={dishes} ingredients={ingredients} />
    </div>
  );
}
