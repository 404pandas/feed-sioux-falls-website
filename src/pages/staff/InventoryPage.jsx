import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import Button from '../../components/Button';
import Icon from '../../components/Icon';
import Drawer from '../../components/Drawer';
import SourcesEditor, { perUnit } from '../../components/SourcesEditor';
import { StatusPill, StoreLinks, formatNumber } from '../../components/PublicData';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const CATEGORIES = ['hygiene', 'winter', 'other'];
const STEPS = [1, 10, 20];
const cap = (s) => s[0].toUpperCase() + s.slice(1);

function statusOf(item) {
  if (item.currentStock <= 0) return 'out';
  if (item.currentStock <= item.lowThreshold) return 'low';
  return 'ok';
}

function toCsv(items) {
  const head = ['Item', 'Category', 'Unit', 'In stock', 'Low at', 'Status', 'Cost per unit', 'Stock value', 'Stores'];
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = items.map((i) => [
    i.name,
    i.category,
    i.unitType,
    i.currentStock,
    i.lowThreshold,
    statusOf(i),
    i.unitCost.toFixed(2),
    (i.currentStock * i.unitCost).toFixed(2),
    (i.sources || []).map((s) => `${s.store}: ${s.url}`).join(' | '),
  ]);
  return [head, ...rows].map((r) => r.map(esc).join(',')).join('\n');
}

// One page for all inventory work.
//   Everyone on staff: see the snapshot, filter, and +/- stock as things
//   are handed out or donated (each change is logged as history).
//   Admins also: edit "low at" and cost right in the list, open an item to
//   change anything (store links included), log a purchase, add, delete,
//   download a spreadsheet, or print.
export default function InventoryPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [params, setParams] = useSearchParams();
  const show = params.get('show') || 'all';

  const [items, setItems] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [step, setStep] = useState(1);
  const [notice, setNotice] = useState('');
  const [editing, setEditing] = useState(null); // item, or {} for a new one

  const load = useCallback(async () => {
    try {
      setItems(await api.getItems());
      setLoadError('');
    } catch (err) {
      setLoadError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(''), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const counts = useMemo(() => {
    const all = items || [];
    return {
      all: all.length,
      out: all.filter((i) => statusOf(i) === 'out').length,
      low: all.filter((i) => statusOf(i) !== 'ok').length,
      value: all.reduce((sum, i) => sum + i.currentStock * i.unitCost, 0),
    };
  }, [items]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (items || [])
      .filter((i) => category === 'all' || i.category === category)
      .filter((i) => !q || i.name.toLowerCase().includes(q))
      .filter((i) => (show === 'out' ? statusOf(i) === 'out' : show === 'low' ? statusOf(i) !== 'ok' : true))
      .sort((a, b) => {
        const rank = { out: 0, low: 1, ok: 2 };
        return rank[statusOf(a)] - rank[statusOf(b)] || a.name.localeCompare(b.name);
      });
  }, [items, search, category, show]);

  function setShow(value) {
    const next = new URLSearchParams(params);
    if (value === 'all') next.delete('show');
    else next.set('show', value);
    setParams(next, { replace: true });
  }

  function replaceItem(updated) {
    setItems((prev) => prev.map((i) => (i._id === updated._id ? { ...i, ...updated } : i)));
  }

  async function changeStock(item, delta) {
    const before = item.currentStock;
    const next = Math.max(0, before + delta);
    if (next === before) return;
    replaceItem({ ...item, currentStock: next });
    try {
      const { item: updated } = await api.adjustStock(item._id, {
        // + is a donation or found stock, - is handed out (feeds the
        // "what goes fastest" numbers).
        type: delta > 0 ? 'adjustment' : 'distributed',
        quantityDelta: next - before,
      });
      replaceItem(updated);
    } catch (err) {
      replaceItem({ ...item, currentStock: before });
      setNotice(`Couldn't save the change to ${item.name}: ${err.message}`);
    }
  }

  async function saveField(item, field, raw) {
    const value = Number(raw);
    if (raw === '' || !Number.isFinite(value) || value < 0 || value === item[field]) return;
    const before = item[field];
    replaceItem({ ...item, [field]: value });
    try {
      replaceItem(await api.updateItem(item._id, { [field]: value }));
      setNotice(`Saved ${item.name}.`);
    } catch (err) {
      replaceItem({ ...item, [field]: before });
      setNotice(`Couldn't save ${item.name}: ${err.message}`);
    }
  }

  function downloadCsv() {
    const blob = new Blob([toCsv(shown)], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feed-sioux-falls-inventory-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Layout title="Inventory">
      <div className="page-head">
        <div>
          <h1 className="h1">Inventory</h1>
          <p className="sub">
            Use − when you hand something out and + when something is donated. Every change is saved and logged.
          </p>
        </div>
        {isAdmin && (
          <div className="row gap-sm no-print" style={{ flexWrap: 'wrap' }}>
            <Button onClick={() => setEditing({})}>
              <Icon name="plus" /> Add item
            </Button>
          </div>
        )}
      </div>

      <div className="stat-strip" role="group" aria-label="Show">
        <button className="stat" aria-pressed={show === 'all'} onClick={() => setShow('all')}>
          <span className="stat-value">{items ? counts.all : '–'}</span>
          <span className="stat-label">All items</span>
        </button>
        <button className="stat stat-out" aria-pressed={show === 'out'} onClick={() => setShow('out')}>
          <span className="stat-value">{items ? counts.out : '–'}</span>
          <span className="stat-label">Out of stock</span>
        </button>
        <button className="stat stat-low" aria-pressed={show === 'low'} onClick={() => setShow('low')}>
          <span className="stat-value">{items ? counts.low : '–'}</span>
          <span className="stat-label">Low or out</span>
        </button>
        {isAdmin && (
          <div className="stat">
            <span className="stat-value">${formatNumber(Math.round(counts.value))}</span>
            <span className="stat-label">Worth on the shelves</span>
          </div>
        )}
      </div>

      <div className="toolbar no-print">
        <label className="visually-hidden" htmlFor="inv-search">
          Search items
        </label>
        <input
          id="inv-search"
          className="field-input search-input"
          type="search"
          placeholder="Search items"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="chip-row" role="group" aria-label="Category">
          {['all', ...CATEGORIES].map((c) => (
            <button key={c} className="chip" aria-pressed={category === c} onClick={() => setCategory(c)}>
              {c === 'all' ? 'All kinds' : cap(c)}
            </button>
          ))}
        </div>
      </div>
      <div className="toolbar no-print" style={{ marginTop: 0 }}>
        <span className="step-picker" role="group" aria-label="Change by">
          Change by
          {STEPS.map((n) => (
            <button key={n} className="chip" aria-pressed={step === n} onClick={() => setStep(n)}>
              {n}
            </button>
          ))}
        </span>
        <span style={{ flex: 1 }} />
        <Button variant="outline" small onClick={() => window.print()}>
          <Icon name="print" /> Print
        </Button>
        {isAdmin && (
          <Button variant="outline" small onClick={downloadCsv} disabled={!shown.length}>
            <Icon name="download" /> Spreadsheet
          </Button>
        )}
      </div>

      {notice && (
        <p className="card" role="status" style={{ marginBottom: 12, background: 'var(--coin-soft)' }}>
          {notice}
        </p>
      )}
      {loadError && (
        <div className="card" role="alert" style={{ marginBottom: 12 }}>
          <p className="error-text">Couldn't load inventory: {loadError}</p>
          <Button small variant="outline" onClick={load} style={{ marginTop: 8 }}>
            Try again
          </Button>
        </div>
      )}
      {!items && !loadError && <p className="body-muted">Loading inventory…</p>}

      {items && shown.length === 0 && (
        <p className="empty-note">
          {items.length === 0 ? 'No items yet. Add the first one.' : 'Nothing matches. Try another search or filter.'}
        </p>
      )}

      {shown.length > 0 && (
        <div className="inv-list">
          <div className="inv-head" aria-hidden="true">
            <span>Item</span>
            <span>In stock</span>
            <span>Low at</span>
            <span>{isAdmin ? 'Cost each' : ''}</span>
            <span>Where to buy</span>
            <span />
          </div>
          {shown.map((item) => {
            const status = statusOf(item);
            return (
              <div key={item._id} className={`inv-row${status !== 'ok' ? ` is-${status}` : ''}`}>
                <div>
                  <div className="inv-name">{item.name}</div>
                  <div className="inv-meta">
                    <StatusPill status={status} />
                    <span>
                      {cap(item.category)} · per {item.unitType}
                    </span>
                    {item.hideFromPublic && <span className="pill pill-muted">Hidden from public</span>}
                  </div>
                </div>

                <div className="inv-stock">
                  <span className="cell-label">In stock</span>
                  <span className="stepper">
                    <button
                      onClick={() => changeStock(item, -step)}
                      disabled={item.currentStock <= 0}
                      aria-label={`Hand out ${step} ${item.name}`}
                    >
                      −
                    </button>
                    <span className="count" aria-live="polite" aria-label={`${item.currentStock} in stock`}>
                      {item.currentStock}
                    </span>
                    <button onClick={() => changeStock(item, step)} aria-label={`Add ${step} ${item.name}`}>
                      +
                    </button>
                  </span>
                </div>

                <div className="inv-cells">
                  <div>
                    <span className="cell-label">Low at</span>
                    {isAdmin ? (
                      <input
                        className="field-input inline-num"
                        inputMode="numeric"
                        defaultValue={item.lowThreshold}
                        key={`low-${item._id}-${item.lowThreshold}`}
                        aria-label={`Low at, ${item.name}`}
                        onBlur={(e) => saveField(item, 'lowThreshold', e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                      />
                    ) : (
                      <span>{item.lowThreshold}</span>
                    )}
                  </div>

                  <div>
                    {isAdmin && (
                      <>
                        <span className="cell-label">Cost each ($)</span>
                        <input
                          className="field-input inline-num"
                          inputMode="decimal"
                          defaultValue={item.unitCost.toFixed(2)}
                          key={`cost-${item._id}-${item.unitCost}`}
                          aria-label={`Cost each, ${item.name}`}
                          onBlur={(e) => saveField(item, 'unitCost', e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                        />
                      </>
                    )}
                  </div>

                  <div>
                    <span className="visually-hidden">Where to buy</span>
                    {item.sources?.length ? (
                      <StoreLinks sources={item.sources} itemName={item.name} />
                    ) : (
                      <span className="body-muted" style={{ fontSize: 15 }}>{isAdmin ? "No store links" : ""}</span>
                    )}
                  </div>

                  <div className="row-actions no-print">
                    {isAdmin && (
                      <Button variant="outline" small onClick={() => setEditing(item)} ariaLabel={`Edit ${item.name}`}>
                        <Icon name="edit" /> Edit
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <ItemEditor
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={(saved, message) => {
            setItems((prev) => {
              const exists = prev.some((i) => i._id === saved._id);
              return exists ? prev.map((i) => (i._id === saved._id ? saved : i)) : [...prev, saved];
            });
            setNotice(message);
            setEditing(null);
          }}
          onDeleted={(deleted) => {
            setItems((prev) => prev.filter((i) => i._id !== deleted._id));
            setNotice(`Deleted ${deleted.name}.`);
            setEditing(null);
          }}
        />
      )}
    </Layout>
  );
}

const BLANK = { name: '', category: 'hygiene', unitType: '', unitCost: '', lowThreshold: '', currentStock: '', sources: [], hideFromPublic: false };

function ItemEditor({ item, onClose, onSaved, onDeleted }) {
  const isNew = !item._id;
  const [form, setForm] = useState(() =>
    isNew
      ? BLANK
      : {
          name: item.name,
          category: item.category,
          unitType: item.unitType,
          unitCost: String(item.unitCost),
          lowThreshold: String(item.lowThreshold),
          currentStock: String(item.currentStock),
          sources: (item.sources || []).map((s) => ({ ...s, price: s.price ?? '', unitsPerPack: s.unitsPerPack ?? '' })),
          hideFromPublic: !!item.hideFromPublic,
        }
  );
  const [purchase, setPurchase] = useState({ quantity: '', cost: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const cheapest = form.sources.map(perUnit).filter((p) => p != null).sort((a, b) => a - b)[0];

  async function save() {
    setError('');
    if (!form.name.trim() || !form.unitType.trim() || form.unitCost === '') {
      setError('Name, unit, and cost each are required.');
      return;
    }
    const nums = ['unitCost', 'lowThreshold', 'currentStock'].map((k) => form[k]).filter((v) => v !== '');
    if (nums.some((v) => !Number.isFinite(Number(v)) || Number(v) < 0)) {
      setError('Cost, low at, and stock need to be numbers of 0 or more.');
      return;
    }
    const sources = form.sources
      .filter((s) => s.url.trim())
      .map((s) => ({
        ...s,
        url: s.url.trim(),
        price: s.price === '' ? null : Number(s.price),
        unitsPerPack: s.unitsPerPack === '' ? null : Number(s.unitsPerPack),
      }));
    if (sources.some((s) => !/^https?:\/\//i.test(s.url))) {
      setError('Store links need to start with https://');
      return;
    }

    const payload = {
      name: form.name.trim(),
      category: form.category,
      unitType: form.unitType.trim(),
      unitCost: Number(form.unitCost),
      lowThreshold: form.lowThreshold === '' ? 0 : Number(form.lowThreshold),
      sources,
      hideFromPublic: form.hideFromPublic,
    };

    setSaving(true);
    try {
      let saved;
      if (isNew) {
        saved = await api.createItem({ ...payload, currentStock: form.currentStock === '' ? 0 : Number(form.currentStock) });
      } else {
        saved = await api.updateItem(item._id, payload);
        // A changed count goes through adjust-stock so it's in the history.
        const counted = form.currentStock === '' ? item.currentStock : Number(form.currentStock);
        if (counted !== item.currentStock) {
          ({ item: saved } = await api.adjustStock(item._id, { type: 'adjustment', quantityDelta: counted - item.currentStock }));
        }
      }
      onSaved(saved, isNew ? `Added ${saved.name}.` : `Saved ${saved.name}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function logPurchase() {
    setError('');
    const quantity = Number(purchase.quantity);
    const cost = Number(purchase.cost);
    if (!Number.isInteger(quantity) || quantity < 1 || !Number.isFinite(cost) || cost < 0 || purchase.cost === '') {
      setError('Enter how many you bought and what it cost in total.');
      return;
    }
    setSaving(true);
    try {
      const firstLink = form.sources.find((s) => s.url)?.url;
      await api.logPurchase({ itemId: item._id, quantity, cost, amazonLink: firstLink });
      // The purchase response only has the item's id, so re-read the item
      // to show its new stock.
      const saved = (await api.getItems()).find((i) => i._id === item._id);
      if (!saved) throw new Error('Saved, but couldn\'t reload the item. Refresh the page.');
      onSaved(saved, `Logged ${quantity} ${item.name} for $${cost.toFixed(2)}. Stock and budget updated.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete "${item.name}"? Its past history stays, but the item goes away. This can't be undone.`)) return;
    setSaving(true);
    try {
      await api.deleteItem(item._id);
      onDeleted(item);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <Drawer
      title={isNew ? 'Add an item' : item.name}
      onClose={onClose}
      footer={
        <>
          {!isNew && (
            <Button variant="outline-danger" small onClick={remove} disabled={saving}>
              <Icon name="trash" /> Delete
            </Button>
          )}
          <span className="spacer" />
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving}>
            {isNew ? 'Add item' : 'Save'}
          </Button>
        </>
      }
    >
      {error && (
        <p className="error-text" role="alert" style={{ marginTop: 12 }}>
          {error}
        </p>
      )}

      <label className="field-label" htmlFor="ie-name">
        Name
      </label>
      <input id="ie-name" className="field-input" value={form.name} onChange={set('name')} placeholder="Bar soap (individually wrapped)" />

      <div className="grid-2" style={{ gap: 12 }}>
        <div>
          <label className="field-label" htmlFor="ie-cat">
            Kind
          </label>
          <select id="ie-cat" className="field-select" value={form.category} onChange={set('category')}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {cap(c)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="ie-unit">
            Counted by the…
          </label>
          <input id="ie-unit" className="field-input" value={form.unitType} onChange={set('unitType')} placeholder="bar, pair, bottle" />
        </div>
        <div>
          <label className="field-label" htmlFor="ie-stock">
            {isNew ? 'How many on hand' : 'How many on hand (fix the count)'}
          </label>
          <input id="ie-stock" className="field-input" inputMode="numeric" value={form.currentStock} onChange={set('currentStock')} />
        </div>
        <div>
          <label className="field-label" htmlFor="ie-low">
            Running low at
          </label>
          <input id="ie-low" className="field-input" inputMode="numeric" value={form.lowThreshold} onChange={set('lowThreshold')} />
        </div>
        <div>
          <label className="field-label" htmlFor="ie-cost">
            Cost each ($)
          </label>
          <input id="ie-cost" className="field-input" inputMode="decimal" value={form.unitCost} onChange={set('unitCost')} />
        </div>
        <div style={{ alignSelf: 'end' }}>
          {cheapest != null && Number(form.unitCost) > 0 && cheapest < Number(form.unitCost) && (
            <p className="body-muted">A store below has it for ${cheapest.toFixed(2)} each.</p>
          )}
        </div>
      </div>

      <label className="check-row">
        <input type="checkbox" checked={form.hideFromPublic} onChange={set('hideFromPublic')} />
        Keep this off the public "what we need" list
      </label>

      <h3 className="h2" style={{ marginTop: 24 }}>
        Where to buy it
      </h3>
      <p className="body-muted">Amazon, Temu, Dollar General, anywhere. These links also show on the public site when this item runs low.</p>
      <SourcesEditor value={form.sources} onChange={(sources) => setForm((f) => ({ ...f, sources }))} />

      {!isNew && (
        <div className="card" style={{ marginTop: 28, background: 'var(--teal-soft)', boxShadow: 'none' }}>
          <h3 className="h2">Log a purchase</h3>
          <p className="body-muted" style={{ marginBottom: 8 }}>
            Bought more? This adds them to stock and counts the cost against this month's budget.
          </p>
          <div className="grid-2" style={{ gap: 12 }}>
            <div>
              <label className="field-label" htmlFor="ie-pq">
                How many came in
              </label>
              <input
                id="ie-pq"
                className="field-input"
                inputMode="numeric"
                value={purchase.quantity}
                onChange={(e) => setPurchase((p) => ({ ...p, quantity: e.target.value }))}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="ie-pc">
                Total cost ($)
              </label>
              <input
                id="ie-pc"
                className="field-input"
                inputMode="decimal"
                value={purchase.cost}
                onChange={(e) => setPurchase((p) => ({ ...p, cost: e.target.value }))}
              />
            </div>
          </div>
          <Button variant="coin" style={{ marginTop: 12 }} onClick={logPurchase} disabled={saving}>
            Log purchase
          </Button>
        </div>
      )}
    </Drawer>
  );
}
