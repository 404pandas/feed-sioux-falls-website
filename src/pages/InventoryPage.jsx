import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import { api } from '../api/client';

const CATEGORIES = ['hygiene', 'winter', 'other'];
const FILTER_CATEGORIES = ['all', ...CATEGORIES];

const BLANK_FORM = {
  name: '',
  category: 'hygiene',
  unitCost: '',
  currentStock: '',
  lowThreshold: '',
  unitType: '',
  amazonLink: '',
};

export default function InventoryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [error, setError] = useState('');

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      const matchesSearch = !query || item.name.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [items, search, categoryFilter]);

  const [formVisible, setFormVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null = creating a new item
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getItems();
      setItems(data);
    } catch (err) {
      setError('Could not load inventory: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreateForm() {
    setEditingItem(null);
    setForm(BLANK_FORM);
    setFormVisible(true);
  }

  function openEditForm(item) {
    setEditingItem(item);
    setForm({
      name: item.name,
      category: item.category,
      unitCost: String(item.unitCost),
      currentStock: String(item.currentStock),
      lowThreshold: String(item.lowThreshold),
      unitType: item.unitType,
      amazonLink: item.amazonLink || '',
    });
    setFormVisible(true);
  }

  function closeForm() {
    setFormVisible(false);
    setEditingItem(null);
    setForm(BLANK_FORM);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.unitType.trim() || form.unitCost === '') {
      alert('Name, unit type, and unit cost are required.');
      return;
    }

    const payload = {
      name: form.name.trim(),
      category: form.category,
      unitType: form.unitType.trim(),
      unitCost: Number(form.unitCost),
      currentStock: form.currentStock === '' ? 0 : Number(form.currentStock),
      lowThreshold: form.lowThreshold === '' ? 0 : Number(form.lowThreshold),
      amazonLink: form.amazonLink.trim() || null,
    };

    setSaving(true);
    try {
      if (editingItem) {
        await api.updateItem(editingItem._id, payload);
      } else {
        await api.createItem(payload);
      }
      closeForm();
      await load();
    } catch (err) {
      alert('Could not save item: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(`"${item.name}" will be removed from inventory. This can't be undone.`)) return;
    try {
      await api.deleteItem(item._id);
      await load();
    } catch (err) {
      alert('Could not delete item: ' + err.message);
    }
  }

  function openBuyNow(item) {
    if (!item.amazonLink) {
      alert(`Add an Amazon link for "${item.name}" to enable Buy Now.`);
      return;
    }
    window.open(item.amazonLink, '_blank', 'noopener,noreferrer');
  }

  return (
    <Layout>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
        <p className="h1">Inventory</p>
      </div>

      {!!error && <p className="body-muted" style={{ color: 'var(--color-danger)' }}>{error}</p>}

      {formVisible ? (
        <Card style={{ marginBottom: 'var(--space-md)' }}>
          <p className="h2" style={{ marginBottom: 'var(--space-md)' }}>
            {editingItem ? `Edit "${editingItem.name}"` : 'Add Item'}
          </p>

          <label className="field-label" style={{ marginTop: 0 }}>
            Name
          </label>
          <input
            className="field-input"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Bar soap (individually wrapped)"
          />

          <label className="field-label">Category</label>
          <div className="row gap-xs" style={{ marginBottom: 'var(--space-sm)' }}>
            {CATEGORIES.map((c) => (
              <Button
                key={c}
                title={c}
                small
                variant={form.category === c ? 'primary' : 'outline'}
                onClick={() => setForm((f) => ({ ...f, category: c }))}
                style={{ flex: 1 }}
              />
            ))}
          </div>

          <label className="field-label">Unit type (e.g. "bar", "pair", "bottle")</label>
          <input className="field-input" value={form.unitType} onChange={(e) => setForm((f) => ({ ...f, unitType: e.target.value }))} placeholder="bar" />

          <label className="field-label">Unit cost ($)</label>
          <input
            className="field-input"
            value={form.unitCost}
            onChange={(e) => setForm((f) => ({ ...f, unitCost: e.target.value }))}
            inputMode="decimal"
            placeholder="0.11"
          />

          <label className="field-label">Current stock</label>
          <input
            className="field-input"
            value={form.currentStock}
            onChange={(e) => setForm((f) => ({ ...f, currentStock: e.target.value }))}
            inputMode="numeric"
            placeholder="0"
          />

          <label className="field-label">Low stock threshold</label>
          <input
            className="field-input"
            value={form.lowThreshold}
            onChange={(e) => setForm((f) => ({ ...f, lowThreshold: e.target.value }))}
            inputMode="numeric"
            placeholder="0"
          />

          <label className="field-label">Amazon link (optional)</label>
          <input
            className="field-input"
            value={form.amazonLink}
            onChange={(e) => setForm((f) => ({ ...f, amazonLink: e.target.value }))}
            placeholder="https://www.amazon.com/..."
          />

          <div className="row gap-sm" style={{ marginTop: 'var(--space-md)' }}>
            <Button title="Cancel" variant="outline" onClick={closeForm} style={{ flex: 1 }} />
            <Button title="Save" onClick={handleSave} loading={saving} style={{ flex: 1 }} />
          </div>
        </Card>
      ) : (
        <>
          <Button title="+ Add Item" onClick={openCreateForm} style={{ marginBottom: 'var(--space-md)' }} block />

          <input
            className="field-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ marginBottom: 'var(--space-sm)' }}
            placeholder="Search items…"
          />

          <div className="row-wrap gap-xs" style={{ marginBottom: 'var(--space-md)' }}>
            {FILTER_CATEGORIES.map((c) => (
              <Button
                key={c}
                title={c === 'all' ? 'All' : c[0].toUpperCase() + c.slice(1)}
                small
                variant={categoryFilter === c ? 'primary' : 'outline'}
                onClick={() => setCategoryFilter(c)}
              />
            ))}
          </div>

          {loading && <p className="body-muted">Loading…</p>}

          <div className="stack gap-sm">
            {filteredItems.map((item) => {
              const isLow = item.currentStock <= item.lowThreshold;
              return (
                <Card key={item._id} style={{ borderColor: isLow ? 'var(--color-danger)' : undefined }}>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <p className="h2">{item.name}</p>
                    {isLow && <span className="low-badge">LOW</span>}
                  </div>
                  <p className="body-muted">
                    {item.currentStock} {item.unitType}
                    {item.currentStock === 1 ? '' : 's'} in stock &middot; low threshold {item.lowThreshold}
                  </p>
                  <p className="body-muted">
                    ${item.unitCost.toFixed(2)} / {item.unitType}
                  </p>

                  {isLow && item.amazonLink && (
                    <Button title="Buy Now on Amazon" variant="accent" onClick={() => openBuyNow(item)} style={{ marginTop: 'var(--space-sm)' }} block />
                  )}

                  <div className="row gap-sm" style={{ marginTop: 'var(--space-sm)' }}>
                    <Button title="Edit" variant="outline" small onClick={() => openEditForm(item)} style={{ flex: 1 }} />
                    <Button title="Delete" variant="outline-danger" small onClick={() => handleDelete(item)} style={{ flex: 1 }} />
                  </div>
                </Card>
              );
            })}
            {!loading && filteredItems.length === 0 && (
              <p className="body-muted">{items.length === 0 ? 'No items found.' : 'No items match your search.'}</p>
            )}
          </div>
        </>
      )}
    </Layout>
  );
}
