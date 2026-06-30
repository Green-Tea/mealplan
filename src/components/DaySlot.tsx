import { useDroppable, useDraggable } from '@dnd-kit/core';
import type { Dish, Ingredient, Weekday } from '../types';

interface Props {
  day: Weekday;
  label: string;
  dishes: Dish[];
  ingredients: Ingredient[];
  onRemove: (dishId: number) => void;
  onDuplicate: () => void;
  onClear: () => void;
}

function DraggableDishCard({ day, dish, ingredients, onRemove }: {
  day: Weekday;
  dish: Dish;
  ingredients: Ingredient[];
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `planned-${day}-${dish.id}`,
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, opacity: isDragging ? 0.5 : 1 }
    : undefined;

  const proteinNames = dish.proteinIds?.map(id => ingredients.find(i => i.id === id)?.name).filter(Boolean);
  const vegs = dish.vegetableIds.map(id => ingredients.find(i => i.id === id)?.name).filter(Boolean);

  return (
    <div ref={setNodeRef} style={style} className="planned-dish" {...attributes} {...listeners}>
      <div className="planned-dish-name">{dish.name}</div>
      <div className="planned-dish-details">
        {proteinNames && proteinNames.length > 0 && <span className="mini-protein">{proteinNames.join(', ')}</span>}
        {vegs.length > 0 && <span className="mini-vegs">{vegs.join(', ')}</span>}
      </div>
      <div className="planned-dish-actions" onPointerDown={e => e.stopPropagation()}>
        <button className="btn btn-xs btn-danger" onClick={onRemove} title="Remove">✕</button>
      </div>
    </div>
  );
}

export default function DaySlot({ day, label, dishes, ingredients, onRemove, onDuplicate, onClear }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: day });

  return (
    <div
      ref={setNodeRef}
      className={`day-slot ${isOver ? 'day-slot-over' : ''}`}
    >
      <div className="day-slot-header">
        {label}
        <div className="day-slot-header-actions">
          {dishes.length > 0 && (
            <button className="btn btn-xs btn-ghost" onClick={onDuplicate} title="Duplicate to another day">⧉</button>
          )}
          <button className="btn btn-xs btn-danger" onClick={onClear} title="Clear day">Clear</button>
        </div>
      </div>
      <div className="day-slot-content">
        {dishes.length > 0 ? (
          dishes.map(dish => (
            <DraggableDishCard
              key={dish.id}
              day={day}
              dish={dish}
              ingredients={ingredients}
              onRemove={() => onRemove(dish.id)}
            />
          ))
        ) : (
          <div className="day-slot-empty">Drop a dish here</div>
        )}
      </div>
    </div>
  );
}
