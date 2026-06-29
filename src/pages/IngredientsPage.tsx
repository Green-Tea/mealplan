import { useState, useMemo } from 'react';
import { Ingredient, IngredientCategory } from '../types';
import { generateId } from '../utils/id';

interface Props {
  ingredients: Ingredient[];
  onSave: (ingredients: Ingredient[]) => void;
  dishes: { primaryProteinId: string; vegetableIds: string[] }[];
}

export default function IngredientsPage({ ingredients, onSave, dishes }: Props) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<IngredientCategory>('Protein');
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<IngredientCategory | 'All'>('All');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<IngredientCategory>('Protein');

  const usedIngredientIds = useMemo(() => {
    const ids = new Set<string>();
    for (const d of dishes) {
      ids.add(d.primaryProteinId);
      d.vegetableIds.forEach(id => ids.add(id));
    }
    return ids;
  }, [dishes]);

  const filtered = useMemo(() => {
    return ingredients.filter(i => {
      if (filterCat !== 'All' && i.category !== filterCat) return false;
      if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [ingredients, search, filterCat]);

  const proteins = filtered.filter(i => i.category === 'Protein');
  const vegetables = filtered.filter(i => i.category === 'Vegetable');

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    if (ingredients.some(i => i.name.toLowerCase() === trimmed.toLowerCase())) {
      alert('An ingredient with this name already exists.');
      return;
    }
    onSave([...ingredients, { id: generateId(), name: trimmed, category }]);
    setName('');
  }

  function handleDelete(id: string) {
    if (usedIngredientIds.has(id)) {
      alert('Cannot delete: this ingredient is used by one or more dishes.');
      return;
    }
    onSave(ingredients.filter(i => i.id !== id));
  }

  function startEdit(ingredient: Ingredient) {
    setEditingId(ingredient.id);
    setEditName(ingredient.name);
    setEditCategory(ingredient.category);
  }

  function handleEditSave(id: string) {
    const trimmed = editName.trim();
    if (!trimmed) return;
    if (ingredients.some(i => i.id !== id && i.name.toLowerCase() === trimmed.toLowerCase())) {
      alert('An ingredient with this name already exists.');
      return;
    }
    onSave(ingredients.map(i => i.id === id ? { ...i, name: trimmed, category: editCategory } : i));
    setEditingId(null);
  }

  function renderGroup(title: string, items: Ingredient[]) {
    if (items.length === 0) return null;
    return (
      <div className="ingredient-group">
        <h3>{title}</h3>
        <div className="ingredient-list">
          {items.map(ingredient => (
            <div key={ingredient.id} className="ingredient-item">
              {editingId === ingredient.id ? (
                <div className="ingredient-edit-row">
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleEditSave(ingredient.id)}
                    autoFocus
                  />
                  <select value={editCategory} onChange={e => setEditCategory(e.target.value as IngredientCategory)}>
                    <option value="Protein">Protein</option>
                    <option value="Vegetable">Vegetable</option>
                  </select>
                  <button className="btn btn-sm" onClick={() => handleEditSave(ingredient.id)}>Save</button>
                  <button className="btn btn-sm btn-ghost" onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              ) : (
                <>
                  <span className="ingredient-name">{ingredient.name}</span>
                  <div className="ingredient-actions">
                    <button className="btn btn-sm btn-ghost" onClick={() => startEdit(ingredient)}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(ingredient.id)}>Delete</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <h2>Ingredients</h2>
      <form className="add-form" onSubmit={handleAdd}>
        <input
          placeholder="Ingredient name"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <select value={category} onChange={e => setCategory(e.target.value as IngredientCategory)}>
          <option value="Protein">Protein</option>
          <option value="Vegetable">Vegetable</option>
        </select>
        <button className="btn" type="submit">Add</button>
      </form>
      <div className="filter-bar">
        <input
          placeholder="Search ingredients..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="search-input"
        />
        <select value={filterCat} onChange={e => setFilterCat(e.target.value as IngredientCategory | 'All')}>
          <option value="All">All</option>
          <option value="Protein">Protein</option>
          <option value="Vegetable">Vegetable</option>
        </select>
      </div>
      {renderGroup('Proteins', proteins)}
      {renderGroup('Vegetables', vegetables)}
      {filtered.length === 0 && <p className="empty-state">No ingredients found.</p>}
    </div>
  );
}
