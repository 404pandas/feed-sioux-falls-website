import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import { api } from '../api/client';

const STEPS = [1, 10, 20];
const CATEGORIES = ['all', 'hygiene', 'winter', 'other'];

// Volunteer-facing quick stock adjustment - +/- only, while counting people
// and handing out supplies. Deliberately has no add/edit/delete controls;
// those stay on the admin-only Inventory page. The backend already enforces
// this split (adjust-stock is staff+, item create/edit/delete is
// admin-only), so this page is just exposing what volunteers are already
// allowed to call.
export default function QuickStockPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [error, setError] = useState('');

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesCategory = category === 'all' || item.category === category;
      const matchesSearch = !query || item.name.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [items, search, category]);

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

  async function adjust(item, delta) {
    setBusyId(item._id);
    try {
      const { item: updated } = await api.adjustStock(item._id, {
        type: delta > 0 ? 'adjustment' : 'distributed',
        quantityDelta: delta,
      });
      setItems((prev) => prev.map((i) => (i._id === updated._id ? updated : i)));
    } catch (err) {
      alert('Could not update stock: ' + err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Layout>
      <p className="h1" style={{ marginBottom: 'var(--space-xs)' }}>
        Adjust Inventory
      </p>
      <p className="body-muted" style={{ marginBottom: 'var(--space-md)' }}>
        + for supplies donated, − for supplies handed out.
      </p>

      <input
        className="field-input"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 'var(--space-sm)' }}
        placeholder="Search items…"
      />

      <div className="row-wrap gap-xs" style={{ marginBottom: 'var(--space-md)' }}>
        {CATEGORIES.map((c) => (
          <Button
            key={c}
            title={c === 'all' ? 'All' : c[0].toUpperCase() + c.slice(1)}
            small
            variant={category === c ? 'primary' : 'outline'}
            onClick={() => setCategory(c)}
          />
        ))}
      </div>

      {!!error && <p className="body-muted" style={{ color: 'var(--color-danger)' }}>{error}</p>}
      {loading && <p className="body-muted">Loading…</p>}

      <div className="stack gap-sm">
        {filteredItems.map((item) => {
          const isLow = item.currentStock <= item.lowThreshold;
          const isBusy = busyId === item._id;
          return (
            <Card key={item._id} style={{ borderColor: isLow ? 'var(--color-danger)' : undefined }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <p className="h2">{item.name}</p>
                {isLow && <span className="low-badge">LOW</span>}
              </div>
              <p className="body-muted" style={{ marginBottom: 'var(--space-sm)' }}>
                {item.currentStock} {item.unitType}
                {item.currentStock === 1 ? '' : 's'} in stock
              </p>

              <div className="row gap-xs" style={{ marginBottom: 'var(--space-xs)' }}>
                {STEPS.map((n) => (
                  <Button
                    key={`minus-${n}`}
                    title={`-${n}`}
                    variant="outline-danger"
                    small
                    disabled={isBusy}
                    onClick={() => adjust(item, -n)}
                    style={{ flex: 1 }}
                  />
                ))}
              </div>
              <div className="row gap-xs">
                {STEPS.map((n) => (
                  <Button
                    key={`plus-${n}`}
                    title={`+${n}`}
                    variant="outline-success"
                    small
                    disabled={isBusy}
                    onClick={() => adjust(item, n)}
                    style={{ flex: 1 }}
                  />
                ))}
              </div>
            </Card>
          );
        })}
        {!loading && filteredItems.length === 0 && (
          <p className="body-muted">{items.length === 0 ? 'No items found.' : 'No items match your search.'}</p>
        )}
      </div>
    </Layout>
  );
}
