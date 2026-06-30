import { useState, useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { Dish, Ingredient } from '../types';

function DraggableDish({ dish, ingredients }: { dish: Dish; ingredients: Ingredient[] }) {
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
    <div ref={setNodeRef} style={style} className="dish-chip" {...attributes} {...listeners}>
      <span className="dish-chip-name">{dish.name}</span>
      {proteinNames && <span className="dish-chip-protein">{proteinNames}</span>}
    </div>
  );
}

export default function DishPicker({ dishes, ingredients }: { dishes: Dish[]; ingredients: Ingredient[] }) {
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
      <div className="dish-picker-list">
        {filtered.map(dish => (
          <DraggableDish key={dish.id} dish={dish} ingredients={ingredients} />
        ))}
        {filtered.length === 0 && <p className="empty-state">No dishes available. Create some on the Dishes page.</p>}
      </div>
    </div>
  );
}
