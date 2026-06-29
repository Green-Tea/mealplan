import { useState, useMemo } from 'react';
import type { Dish, Ingredient } from '../types';
import { createDish, updateDish, deleteDish } from '../store/storage';

interface Props {
  dishes: Dish[];
  ingredients: Ingredient[];
  onUpdate: () => Promise<void>;
}

export default function DishesPage({ dishes, ingredients, onUpdate }: Props) {
  const [search, setSearch] = useState('');
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [showForm, setShowForm] = useState(false);

  const proteins = ingredients.filter(i => i.category === 'Protein');
  const vegetables = ingredients.filter(i => i.category === 'Vegetable');
  const carbohydrates = ingredients.filter(i => i.category === 'Carbohydrate');
  const others = ingredients.filter(i => i.category === 'Other');

  const filtered = useMemo(() => {
    if (!search) return dishes;
    const q = search.toLowerCase();
    return dishes.filter(d => {
      if (d.name.toLowerCase().includes(q)) return true;
      if (d.proteinIds.some(pid => ingredients.find(i => i.id === pid)?.name.toLowerCase().includes(q))) return true;
      if (d.tags?.some(t => t.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [dishes, search, ingredients]);

  async function handleDelete(id: number) {
    await deleteDish(id);
    await onUpdate();
  }

  function handleEdit(dish: Dish) {
    setEditingDish({ ...dish, proteinIds: [...dish.proteinIds], vegetableIds: [...dish.vegetableIds], tags: dish.tags ? [...dish.tags] : [] });
    setShowForm(true);
  }

  function handleNew() {
    setEditingDish(null);
    setShowForm(true);
  }

  function getProteinNames(ids: number[]): string {
    return ids.map(id => ingredients.find(i => i.id === id)?.name ?? 'Unknown').join(', ');
  }

  function getVegetableNames(ids: number[]): string {
    return ids.map(id => ingredients.find(i => i.id === id)?.name ?? 'Unknown').join(', ');
  }

  return (
    <div className="page">
      <h2>Dishes</h2>
      <div className="filter-bar">
        <input
          placeholder="Search dishes..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="search-input"
        />
        <button className="btn" onClick={handleNew}>+ New Dish</button>
      </div>

      {showForm && (
        <DishForm
          dish={editingDish}
          proteins={proteins}
          vegetables={vegetables}
          carbohydrates={carbohydrates}
          others={others}
          existingDishes={dishes}
          onSave={async (dish) => {
            if (editingDish) {
              await updateDish(dish as Dish);
            } else {
              await createDish(dish as Omit<Dish, 'id'>);
            }
            setShowForm(false);
            setEditingDish(null);
            await onUpdate();
          }}
          onCancel={() => { setShowForm(false); setEditingDish(null); }}
        />
      )}

      <div className="dish-list">
        {filtered.map(dish => (
          <div key={dish.id} className="dish-card">
            <div className="dish-card-header">
              <h3>{dish.name}</h3>
              <div className="dish-actions">
                <button className="btn btn-sm btn-ghost" onClick={() => handleEdit(dish)}>Edit</button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(dish.id)}>Delete</button>
              </div>
            </div>
            <div className="dish-details">
              {dish.proteinIds.length > 0 && (
                <span className="dish-protein">🥩 {getProteinNames(dish.proteinIds)}</span>
              )}
              {dish.vegetableIds.length > 0 && (
                <span className="dish-vegs">🥬 {getVegetableNames(dish.vegetableIds)}</span>
              )}
            </div>
            {dish.notes && <p className="dish-notes">{dish.notes}</p>}
            {dish.tags && dish.tags.length > 0 && (
              <div className="dish-tags">
                {dish.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && <p className="empty-state">No dishes found.</p>}
      </div>
    </div>
  );
}

function DishForm({ dish, proteins, vegetables, carbohydrates, others, existingDishes, onSave, onCancel }: {
  dish: Dish | null;
  proteins: Ingredient[];
  vegetables: Ingredient[];
  carbohydrates: Ingredient[];
  others: Ingredient[];
  existingDishes: Dish[];
  onSave: (dish: Dish | Omit<Dish, 'id'>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(dish?.name ?? '');
  const [proteinIds, setProteinIds] = useState<Set<number>>(new Set(dish?.proteinIds ?? []));
  const [vegIds, setVegIds] = useState<Set<number>>(new Set(dish?.vegetableIds ?? []));
  const [carbIds, setCarbIds] = useState<Set<number>>(new Set(dish?.carbohydrateIds ?? []));
  const [otherIds, setOtherIds] = useState<Set<number>>(new Set(dish?.otherIds ?? []));
  const [notes, setNotes] = useState(dish?.notes ?? '');
  const [tagInput, setTagInput] = useState(dish?.tags?.join(', ') ?? '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    if (existingDishes.some(d => d.id !== dish?.id && d.name.toLowerCase() === trimmed.toLowerCase())) {
      alert('A dish with this name already exists.');
      return;
    }
    const tags = tagInput.split(',').map(t => t.trim()).filter(Boolean);
    const data = {
      name: trimmed,
      proteinIds: Array.from(proteinIds),
      vegetableIds: Array.from(vegIds),
      carbohydrateIds: Array.from(carbIds),
      otherIds: Array.from(otherIds),
      notes: notes.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
    };
    if (dish) {
      onSave({ id: dish.id, ...data });
    } else {
      onSave(data);
    }
  }

  function toggle(set: Set<number>, setFn: (s: Set<number>) => void, id: number) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setFn(next);
  }

  function renderCheckboxGroup(legend: string, items: Ingredient[], selected: Set<number>, setSelected: (s: Set<number>) => void, emptyHint: string) {
    return (
      <fieldset className="veg-fieldset">
        <legend>{legend}</legend>
        {items.length === 0 ? (
          <p className="form-hint">{emptyHint}</p>
        ) : (
          <div className="checkbox-grid">
            {items.map(item => (
              <label key={item.id} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selected.has(item.id)}
                  onChange={() => toggle(selected, setSelected, item.id)}
                />
                {item.name}
              </label>
            ))}
          </div>
        )}
      </fieldset>
    );
  }

  return (
    <form className="dish-form" onSubmit={handleSubmit}>
      <h3>{dish ? 'Edit Dish' : 'New Dish'}</h3>
      <label>
        Name
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Dish name" autoFocus required />
      </label>
      {renderCheckboxGroup('Proteins', proteins, proteinIds, setProteinIds, 'Add proteins on the Ingredients page first.')}
      {renderCheckboxGroup('Vegetables', vegetables, vegIds, setVegIds, 'Add vegetables on the Ingredients page first.')}
      {renderCheckboxGroup('Carbohydrates', carbohydrates, carbIds, setCarbIds, 'Add carbohydrates on the Ingredients page first.')}
      {renderCheckboxGroup('Others', others, otherIds, setOtherIds, 'Add other ingredients on the Ingredients page first.')}
      <label>
        Notes <span className="optional">(optional)</span>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes..." rows={2} />
      </label>
      <label>
        Tags <span className="optional">(optional, comma-separated)</span>
        <input value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="e.g. quick, asian, comfort" />
      </label>
      <div className="form-actions">
        <button className="btn" type="submit">{dish ? 'Save Changes' : 'Add Dish'}</button>
        <button className="btn btn-ghost" type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
