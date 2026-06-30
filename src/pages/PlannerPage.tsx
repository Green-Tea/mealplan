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
}

function getOrCreatePlan(plans: MealPlan[], weekStart: string): MealPlan {
  const existing = plans.find(p => p.weekStartDate === weekStart);
  if (existing) return existing;
  return {
    weekStartDate: weekStart,
    slots: { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [] },
  };
}

export default function PlannerPage({ dishes, ingredients, mealPlans, onSavePlans }: Props) {
  const [weekStart, setWeekStart] = useState(getCurrentWeekStart);
  const [showGrocery, setShowGrocery] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [activeDishId, setActiveDishId] = useState<string | null>(null);
  const [armedDishId, setArmedDishId] = useState<number | null>(null);

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

  function addDish(day: Weekday, dishId: number) {
    if (plan.slots[day].includes(dishId)) return;
    persistPlan({ ...plan, slots: { ...plan.slots, [day]: [...plan.slots[day], dishId] } });
  }

  function removeDish(day: Weekday, dishId: number) {
    persistPlan({ ...plan, slots: { ...plan.slots, [day]: plan.slots[day].filter(id => id !== dishId) } });
  }

  function clearDay(day: Weekday) {
    persistPlan({ ...plan, slots: { ...plan.slots, [day]: [] } });
  }

  function toggleArmedDish(dishId: number) {
    setArmedDishId(current => (current === dishId ? null : dishId));
  }

  function tapAddToDay(day: Weekday) {
    if (armedDishId === null) return;
    addDish(day, armedDishId);
    setArmedDishId(null);
  }

  function moveDish(fromDay: Weekday, toDay: Weekday, dishId: number) {
    if (fromDay === toDay) return;
    const toSlots = plan.slots[toDay].includes(dishId) ? plan.slots[toDay] : [...plan.slots[toDay], dishId];
    persistPlan({
      ...plan,
      slots: {
        ...plan.slots,
        [fromDay]: plan.slots[fromDay].filter(id => id !== dishId),
        [toDay]: toSlots,
      },
    });
  }

  function duplicateMeal(fromDay: Weekday) {
    const dishIds = plan.slots[fromDay];
    if (dishIds.length === 0) return;
    const emptyDay = WEEKDAYS.find(d => d !== fromDay && plan.slots[d].length === 0);
    if (emptyDay) {
      persistPlan({ ...plan, slots: { ...plan.slots, [emptyDay]: [...dishIds] } });
    } else {
      alert('No empty slots available to duplicate into.');
    }
  }

  function clearWeek() {
    if (!confirm('Clear all meals planned for this week?')) return;
    persistPlan({ ...plan, slots: { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [] } });
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

      const plannedMatch = dragId.match(/^planned-(\w+)-(\d+)$/);
      if (plannedMatch) {
        const sourceDay = plannedMatch[1] as Weekday;
        const dishId = Number(plannedMatch[2]);
        moveDish(sourceDay, targetDay, dishId);
      } else {
        addDish(targetDay, Number(dragId));
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
        const plannedMatch = activeDishId.match(/^planned-(\w+)-(\d+)$/);
        if (plannedMatch) return dishes.find(d => d.id === Number(plannedMatch[2])) ?? null;
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
        <button className="btn btn-sm" onClick={copyPreviousWeek}>Copy Last Week</button>
        <button className="btn btn-sm" onClick={() => setShowGrocery(!showGrocery)}>
          {showGrocery ? 'Hide List' : 'Grocery List'}
        </button>
        <button className="btn btn-sm" onClick={() => setShowStats(!showStats)}>
          {showStats ? 'Hide Statistics' : 'Statistics'}
        </button>
        <div className="spacer" />
        <button className="btn btn-sm btn-danger" onClick={clearWeek}>Clear List</button>
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
              dishes={plan.slots[day].map(id => dishes.find(d => d.id === id)).filter((d): d is Dish => Boolean(d))}
              ingredients={ingredients}
              onRemove={dishId => removeDish(day, dishId)}
              onDuplicate={() => duplicateMeal(day)}
              onClear={() => clearDay(day)}
              armed={armedDishId !== null}
              onTapAdd={() => tapAddToDay(day)}
            />
          ))}
        </div>

        <DishPicker
          dishes={dishes}
          ingredients={ingredients}
          armedDishId={armedDishId}
          onArmDish={toggleArmedDish}
        />

        <DragOverlay>
          {resolvedActiveDish ? (
            <div className="dish-chip dragging">{resolvedActiveDish.name}</div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
