import { useState, useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { Dish, Ingredient } from '../types';

function DraggableDish({ dish, ingredients, armed, onTap }: {
  dish: Dish;
  ingredients: Ingredient[];
  armed: boolean;
  onTap: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: String(dish.id),
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, opacity: isDragging ? 0.5 : 1 }
    : undefined;

  const proteinNames = dish.proteinIds
    ?.map(id => ingredients.find(i => i.id === id)?.name)
    .filter(Boolean)
    .join(', ');

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`dish-chip ${armed ? 'armed' : ''}`}
      onClick={onTap}
      {...attributes}
      {...listeners}
    >
      <span className="dish-chip-name">{dish.name}</span>
      {proteinNames && <span className="dish-chip-protein">{proteinNames}</span>}
    </div>
  );
}

interface DishPickerProps {
  dishes: Dish[];
  ingredients: Ingredient[];
  armedDishId: number | null;
  onArmDish: (dishId: number) => void;
}

export default function DishPicker({ dishes, ingredients, armedDishId, onArmDish }: DishPickerProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return dishes;
    const q = search.toLowerCase();
    return dishes.filter(d => d.name.toLowerCase().includes(q));
  }, [dishes, search]);

  return (
    <div className="dish-picker">
      <h3>Available Dishes</h3>
      <input
        className="search-input"
        placeholder="Search dishes..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      {armedDishId !== null && (
        <p className="dish-picker-hint">Tap a day to add it, or tap the dish again to cancel.</p>
      )}
      <div className="dish-picker-list">
        {filtered.map(dish => (
          <DraggableDish
            key={dish.id}
            dish={dish}
            ingredients={ingredients}
            armed={armedDishId === dish.id}
            onTap={() => onArmDish(dish.id)}
          />
        ))}
        {filtered.length === 0 && <p className="empty-state">No dishes available. Create some on the Dishes page.</p>}
      </div>
    </div>
  );
}
