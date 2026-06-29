import { useDroppable, useDraggable } from '@dnd-kit/core';
import { Dish, Ingredient, Weekday } from '../types';

interface Props {
  day: Weekday;
  label: string;
  dish: Dish | null;
  ingredients: Ingredient[];
  onClear: () => void;
  onDuplicate: () => void;
}

function DraggableDishCard({ day, dish, ingredients, onClear, onDuplicate }: {
  day: Weekday;
  dish: Dish;
  ingredients: Ingredient[];
  onClear: () => void;
  onDuplicate: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `planned-${day}`,
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, opacity: isDragging ? 0.5 : 1 }
    : undefined;

  const protein = ingredients.find(i => i.id === dish.primaryProteinId);
  const vegs = dish.vegetableIds.map(id => ingredients.find(i => i.id === id)?.name).filter(Boolean);

  return (
    <div ref={setNodeRef} style={style} className="planned-dish" {...attributes} {...listeners}>
      <div className="planned-dish-name">{dish.name}</div>
      <div className="planned-dish-details">
        {protein && <span className="mini-protein">{protein.name}</span>}
        {vegs.length > 0 && <span className="mini-vegs">{vegs.join(', ')}</span>}
      </div>
      <div className="planned-dish-actions" onPointerDown={e => e.stopPropagation()}>
        <button className="btn btn-xs btn-ghost" onClick={onDuplicate} title="Duplicate">⧉</button>
        <button className="btn btn-xs btn-danger" onClick={onClear} title="Remove">✕</button>
      </div>
    </div>
  );
}

export default function DaySlot({ day, label, dish, ingredients, onClear, onDuplicate }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: day });

  return (
    <div
      ref={setNodeRef}
      className={`day-slot ${isOver ? 'day-slot-over' : ''}`}
    >
      <div className="day-slot-header">{label}</div>
      <div className="day-slot-content">
        {dish ? (
          <DraggableDishCard
            day={day}
            dish={dish}
            ingredients={ingredients}
            onClear={onClear}
            onDuplicate={onDuplicate}
          />
        ) : (
          <div className="day-slot-empty">Drop a dish here</div>
        )}
      </div>
    </div>
  );
}
