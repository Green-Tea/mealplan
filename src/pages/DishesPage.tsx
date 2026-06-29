import { useState, useMemo } from 'react';
import type { Dish, Ingredient } from '../types';
import { generateId } from '../utils/id';

interface Props {
  dishes: Dish[];
  ingredients: Ingredient[];
  onSave: (dishes: Dish[]) => void;
}

export default function DishesPage({ dishes, ingredients, onSave }: Props) {
  const [search, setSearch] = useState('');
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [showForm, setShowForm] = useState(false);

  const proteins = ingredients.filter(i => i.category === 'Protein');
  const vegetables = ingredients.filter(i => i.category === 'Vegetable');

  const filtered = useMemo(() => {
    if (!search) return dishes;
    const q = search.toLowerCase();
    return dishes.filter(d => {
      if (d.name.toLowerCase().includes(q)) return true;
      const protein = ingredients.find(i => i.id === d.primaryProteinId);
      if (protein?.name.toLowerCase().includes(q)) return true;
      if (d.tags?.some(t => t.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [dishes, search, ingredients]);

  function handleDelete(id: string) {
    onSave(dishes.filter(d => d.id !== id));
  }

  function handleEdit(dish: Dish) {
    setEditingDish({ ...dish, vegetableIds: [...dish.vegetableIds], tags: dish.tags ? [...dish.tags] : [] });
    setShowForm(true);
  }

  function handleNew() {
    setEditingDish(null);
    setShowForm(true);
  }

  function getProteinName(id: string): string {
    return ingredients.find(i => i.id === id)?.name ?? 'Unknown';
  }

  function getVegetableNames(ids: string[]): string {
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
          existingDishes={dishes}
          onSave={(dish) => {
            if (editingDish) {
              onSave(dishes.map(d => d.id === dish.id ? dish : d));
            } else {
              onSave([...dishes, dish]);
            }
            setShowForm(false);
            setEditingDish(null);
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
              <span className="dish-protein">🥩 {getProteinName(dish.primaryProteinId)}</span>
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

function DishForm({ dish, proteins, vegetables, existingDishes, onSave, onCancel }: {
  dish: Dish | null;
  proteins: Ingredient[];
  vegetables: Ingredient[];
  existingDishes: Dish[];
  onSave: (dish: Dish) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(dish?.name ?? '');
  const [proteinId, setProteinId] = useState(dish?.primaryProteinId ?? (proteins[0]?.id ?? ''));
  const [vegIds, setVegIds] = useState<Set<string>>(new Set(dish?.vegetableIds ?? []));
  const [notes, setNotes] = useState(dish?.notes ?? '');
  const [tagInput, setTagInput] = useState(dish?.tags?.join(', ') ?? '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!proteinId) {
      alert('Please select a primary protein.');
      return;
    }
    if (existingDishes.some(d => d.id !== dish?.id && d.name.toLowerCase() === trimmed.toLowerCase())) {
      alert('A dish with this name already exists.');
      return;
    }
    const tags = tagInput.split(',').map(t => t.trim()).filter(Boolean);
    onSave({
      id: dish?.id ?? generateId(),
      name: trimmed,
      primaryProteinId: proteinId,
      vegetableIds: Array.from(vegIds),
      notes: notes.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
    });
  }

  function toggleVeg(id: string) {
    const next = new Set(vegIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setVegIds(next);
  }

  return (
    <form className="dish-form" onSubmit={handleSubmit}>
      <h3>{dish ? 'Edit Dish' : 'New Dish'}</h3>
      <label>
        Name
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Dish name" autoFocus required />
      </label>
      <label>
        Primary Protein
        {proteins.length === 0 ? (
          <p className="form-hint">Add proteins on the Ingredients page first.</p>
        ) : (
          <select value={proteinId} onChange={e => setProteinId(e.target.value)}>
            {proteins.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
      </label>
      <fieldset className="veg-fieldset">
        <legend>Vegetables</legend>
        {vegetables.length === 0 ? (
          <p className="form-hint">Add vegetables on the Ingredients page first.</p>
        ) : (
          <div className="checkbox-grid">
            {vegetables.map(v => (
              <label key={v.id} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={vegIds.has(v.id)}
                  onChange={() => toggleVeg(v.id)}
                />
                {v.name}
              </label>
            ))}
          </div>
        )}
      </fieldset>
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
