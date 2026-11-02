import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import Drawer from '../components/Drawer';
import Icon from '../components/Icon';
import { api, saveFile } from '../api/client';
import { useAuth } from '../context/AuthContext';

// What a receipt's money went to (same codes as the backend's Receipt model).
const CATEGORIES = [
  { key: 'hygiene', label: 'Hygiene' },
  { key: 'winter', label: 'Winter gear' },
  { key: 'other', label: 'Other supplies' },
  { key: 'operations', label: 'Operations (gas, bins, printing)' },
];
const COMMON_STORES = ['Walmart', 'Dollar General', 'Target', 'Hy-Vee', 'Costco', "Sam's Club", 'Amazon', 'Temu'];
const MAX_SIDE = 1600;

const categoryLabel = (key) => CATEGORIES.find((c) => c.key === key)?.label || key;
const money = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
function shiftMonth(month, by) {
  const [y, m] = month.split('-').map(Number);
  return monthKey(new Date(y, m - 1 + by, 1));
}
function monthName(month) {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
function today() {
  const d = new Date();
  return `${monthKey(d)}-${String(d.getDate()).padStart(2, '0')}`;
}
function formatDay(value) {
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
// "2026-10-31 Walmart 42.50.jpg" - same name the server and app use.
function photoFilename(r) {
  const store = (r.store || 'Receipt').replace(/[^\w .&'-]+/g, '').trim().slice(0, 40) || 'Receipt';
  return `${String(r.date).slice(0, 10)} ${store} ${Number(r.total).toFixed(2)}.jpg`;
}

// Shrinks an uploaded picture to MAX_SIDE as a JPEG, like the phone does.
async function shrinkPhoto(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.75));
  const base64 = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.readAsDataURL(blob);
  });
  return { base64, contentType: 'image/jpeg', previewUrl: URL.createObjectURL(blob) };
}

// Add, view, or (admins) fix and delete one receipt. Typed in by hand, with
// an optional photo or scan so the paper can be thrown away.
function ReceiptDrawer({ receipt, isAdmin, onClose, onSaved }) {
  const editable = !receipt || isAdmin;
  const [store, setStore] = useState(receipt?.store || '');
  const [date, setDate] = useState(receipt ? String(receipt.date).slice(0, 10) : today());
  const [total, setTotal] = useState(receipt ? String(receipt.total) : '');
  const [category, setCategory] = useState(receipt?.category || 'other');
  const [note, setNote] = useState(receipt?.note || '');
  const [photo, setPhoto] = useState(null); // new upload
  const [existingPhoto, setExistingPhoto] = useState(null); // { url, blob }
  const [removePhoto, setRemovePhoto] = useState(false);
  const [items, setItems] = useState([]);
  const [lines, setLines] = useState([]);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let url;
    if (receipt?.hasPhoto) {
      api
        .getReceiptPhoto(receipt._id)
        .then((blob) => {
          url = URL.createObjectURL(blob);
          setExistingPhoto({ url, blob });
        })
        .catch(() => {});
    }
    if (!receipt) api.getItems().then(setItems).catch(() => {});
    return () => url && URL.revokeObjectURL(url);
  }, [receipt]);

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return items.filter((i) => i.name.toLowerCase().includes(q) && !lines.some((l) => l.item._id === i._id)).slice(0, 6);
  }, [search, items, lines]);

  async function pickFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Choose a photo or image file (JPG or PNG).');
      return;
    }
    try {
      setPhoto(await shrinkPhoto(file));
      setRemovePhoto(false);
      setError('');
    } catch {
      setError("Couldn't open that image. Try a JPG or PNG.");
    }
  }

  async function save() {
    if (!store.trim()) return setError('Enter the store.');
    if (total.trim() === '' || Number.isNaN(Number(total)) || Number(total) < 0) return setError('Enter the total as a number.');
    const payload = { store: store.trim(), date, total: Number(total), category, note: note.trim() };
    if (photo) payload.photo = { base64: photo.base64, contentType: photo.contentType };
    setSaving(true);
    setError('');
    try {
      if (receipt) {
        if (!photo && removePhoto) payload.removePhoto = true;
        await api.updateReceipt(receipt._id, payload);
      } else {
        payload.lines = lines.map((l) => ({ itemId: l.item._id, quantity: l.quantity }));
        await api.createReceipt(payload);
      }
      onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete this receipt (${receipt.store}, ${money(receipt.total)})? It comes off the budget and its photo is deleted. Any stock it added stays.`)) return;
    try {
      await api.deleteReceipt(receipt._id);
      onSaved();
    } catch (err) {
      setError(err.message);
    }
  }

  const shownPhoto = photo?.previewUrl || (!removePhoto && existingPhoto?.url);
  const title = receipt ? (editable ? 'Edit receipt' : receipt.store) : 'Add a receipt';

  const footer = editable ? (
    <div className="row gap-sm" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
      <Button onClick={save} loading={saving}>
        {receipt ? 'Save changes' : 'Save receipt'}
      </Button>
      {receipt && isAdmin && (
        <Button variant="outline-danger" onClick={remove}>
          <Icon name="trash" /> Delete
        </Button>
      )}
    </div>
  ) : null;

  return (
    <Drawer title={title} onClose={onClose} footer={footer}>
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}

      <div className="stack gap-sm" style={{ marginBottom: 16 }}>
        <p className="field-label">Photo or scan (optional)</p>
        {shownPhoto ? (
          <img src={shownPhoto} alt="Receipt" style={{ width: '100%', maxHeight: 420, objectFit: 'contain', background: 'var(--mist, #f3f8f6)', borderRadius: 12 }} />
        ) : (
          <p className="body-muted">Attach the receipt so the paper can be thrown away. Everything else is typed in below.</p>
        )}
        <div className="row gap-sm" style={{ flexWrap: 'wrap' }}>
          {editable && (
            <label className="btn btn-outline btn-small" style={{ cursor: 'pointer' }}>
              {shownPhoto ? 'Replace photo' : 'Upload photo'}
              <input type="file" accept="image/*" capture="environment" onChange={pickFile} style={{ display: 'none' }} />
            </label>
          )}
          {existingPhoto && !photo && !removePhoto && (
            <Button variant="outline" small onClick={() => saveFile(existingPhoto.blob, photoFilename({ ...receipt, store, date, total }))}>
              <Icon name="download" /> Download for QuickBooks
            </Button>
          )}
          {editable && shownPhoto && (
            <Button
              variant="outline-danger"
              small
              onClick={() => {
                setPhoto(null);
                setRemovePhoto(true);
              }}
            >
              Remove photo
            </Button>
          )}
        </div>
      </div>

      {editable ? (
        <div className="stack gap-md">
          <div>
            <label className="field-label" htmlFor="r-store">
              Store
            </label>
            <input id="r-store" className="field-input" value={store} maxLength={100} onChange={(e) => setStore(e.target.value)} />
            <div className="chip-row" style={{ marginTop: 8 }}>
              {COMMON_STORES.map((s) => (
                <button key={s} type="button" className="chip" aria-pressed={store === s} onClick={() => setStore(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="grid-2">
            <div>
              <label className="field-label" htmlFor="r-date">
                Date on the receipt
              </label>
              <input id="r-date" className="field-input" type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="field-label" htmlFor="r-total">
                Total ($)
              </label>
              <input id="r-total" className="field-input" inputMode="decimal" value={total} onChange={(e) => setTotal(e.target.value)} />
            </div>
          </div>
          <div>
            <p className="field-label">What it was for</p>
            <div className="chip-row">
              {CATEGORIES.map((c) => (
                <button key={c.key} type="button" className="chip" aria-pressed={category === c.key} onClick={() => setCategory(c.key)}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="field-label" htmlFor="r-note">
              Note (optional)
            </label>
            <textarea id="r-note" className="field-textarea field-input" rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          {receipt ? (
            receipt.lines?.length > 0 && (
              <p className="body-muted">
                Restocked when saved: {receipt.lines.map((l) => `${l.name} ×${l.quantity}`).join(', ')}. Fix stock on the Inventory page.
              </p>
            )
          ) : (
            <Card>
              <p className="h2">Add to inventory (optional)</p>
              <p className="body-muted" style={{ marginBottom: 8 }}>
                Items from this trip that should go into stock. Skip this for gas, bins, and other non-inventory buys.
              </p>
              {lines.map((l) => (
                <div key={l.item._id} className="row gap-sm" style={{ alignItems: 'center', padding: '6px 0', borderTop: '1px solid var(--line, #e1ddd5)' }}>
                  <span style={{ flex: 1 }}>{l.item.name}</span>
                  <input
                    className="field-input"
                    style={{ width: 80 }}
                    inputMode="numeric"
                    aria-label={`How many ${l.item.name}`}
                    value={l.quantity}
                    onChange={(e) => {
                      const quantity = Math.max(1, Number(e.target.value.replace(/\D/g, '')) || 1);
                      setLines((prev) => prev.map((x) => (x.item._id === l.item._id ? { ...x, quantity } : x)));
                    }}
                  />
                  <Button variant="outline-danger" small ariaLabel={`Remove ${l.item.name}`} onClick={() => setLines((prev) => prev.filter((x) => x.item._id !== l.item._id))}>
                    <Icon name="trash" />
                  </Button>
                </div>
              ))}
              <input className="field-input" style={{ marginTop: 8 }} placeholder="Search items to add…" value={search} onChange={(e) => setSearch(e.target.value)} />
              {results.map((i) => (
                <button
                  key={i._id}
                  type="button"
                  className="sidebar-link"
                  style={{ width: '100%', textAlign: 'left' }}
                  onClick={() => {
                    setLines((prev) => [...prev, { item: i, quantity: 1 }]);
                    setSearch('');
                  }}
                >
                  + {i.name}
                </button>
              ))}
            </Card>
          )}
        </div>
      ) : (
        <div className="stack gap-sm">
          <p className="h2">{money(receipt.total)}</p>
          <p className="body-muted">
            {formatDay(receipt.date)} · {categoryLabel(receipt.category)} · added by {receipt.uploadedBy?.name || 'someone'}
          </p>
          {receipt.note && <p className="body-text">{receipt.note}</p>}
        </div>
      )}
    </Drawer>
  );
}

// Receipts and the budget, one month at a time. Every volunteer can add a
// receipt; admins can change the month's budget, fix or delete receipts,
// and export the month for the bookkeeper (QuickBooks).
export default function BudgetPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const thisMonth = monthKey();
  const [month, setMonth] = useState(thisMonth);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [editingBudget, setEditingBudget] = useState(null);
  const [drawer, setDrawer] = useState(null); // null | { receipt } (receipt null = new)
  const [storage, setStorage] = useState(null);

  const load = useCallback(async () => {
    try {
      setData(await api.getBudgetMonth(month));
      setError('');
    } catch (err) {
      setError('Could not load the budget: ' + err.message);
    }
    if (isAdmin) api.getReceiptStorage().then(setStorage).catch(() => {});
  }, [month, isAdmin]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveBudget(e) {
    e.preventDefault();
    try {
      await api.setBudgetMonth(month, Number(editingBudget));
      setEditingBudget(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function exportCsv() {
    try {
      saveFile(await api.getReceiptsCsv(month), `Feed Sioux Falls receipts ${month}.csv`);
    } catch (err) {
      setError(err.message);
    }
  }

  const total = data?.budget.totalBudget || 0;
  const percentSpent = total > 0 ? Math.min(100, Math.round((data.amountSpent / total) * 100)) : data?.amountSpent > 0 ? 100 : 0;
  const isOver = data && data.remaining < 0;

  return (
    <Layout title="Receipts & budget" narrow>
      <div className="row" style={{ alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Button variant="outline" small ariaLabel="Previous month" onClick={() => setMonth(shiftMonth(month, -1))}>
          <Icon name="chevronLeft" />
        </Button>
        <h1 className="h1" style={{ textAlign: 'center' }}>
          {monthName(month)}
        </h1>
        <Button variant="outline" small ariaLabel="Next month" disabled={month >= thisMonth} onClick={() => setMonth(shiftMonth(month, 1))}>
          <Icon name="chevronRight" />
        </Button>
      </div>

      <Button variant="accent" block style={{ marginTop: 'var(--space-md)' }} onClick={() => setDrawer({ receipt: null })}>
        <Icon name="plus" /> Add a receipt
      </Button>

      {error && (
        <p className="error-text" role="alert" style={{ marginTop: 12 }}>
          {error}
        </p>
      )}
      {!data && !error && <p className="body-muted">Loading…</p>}

      {data && (
        <>
          <Card style={{ marginTop: 'var(--space-lg)' }}>
            <p className="body-muted">Left to spend</p>
            <p className="tally-number" style={{ fontSize: 48, color: isOver ? 'var(--color-danger)' : 'var(--color-primary)' }}>
              {money(data.remaining)}
            </p>
            <p className="body-muted">
              {money(data.amountSpent)} spent of {money(total)}
              {data.isDefault ? ' (the usual budget)' : ''}
            </p>
            <div className="progress-track" style={{ marginTop: 'var(--space-md)' }}>
              <div className="progress-fill" style={{ width: `${percentSpent}%`, background: isOver ? 'var(--color-danger)' : 'var(--color-accent)' }} />
            </div>
            {isAdmin &&
              (editingBudget === null ? (
                <Button variant="outline" small style={{ marginTop: 'var(--space-md)' }} onClick={() => setEditingBudget(String(total))}>
                  <Icon name="edit" /> Change budget
                </Button>
              ) : (
                <form onSubmit={saveBudget} className="row gap-sm" style={{ marginTop: 'var(--space-md)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div>
                    <label className="field-label" htmlFor="budget-total">
                      Budget for {monthName(month)} ($)
                    </label>
                    <input id="budget-total" className="field-input" inputMode="decimal" autoFocus value={editingBudget} onChange={(e) => setEditingBudget(e.target.value)} />
                  </div>
                  <Button type="submit" small>
                    Save
                  </Button>
                  <Button variant="outline" small onClick={() => setEditingBudget(null)}>
                    Cancel
                  </Button>
                </form>
              ))}
          </Card>

          {Object.keys(data.spentByCategory).length > 0 && (
            <>
              <h2 className="h2" style={{ marginTop: 'var(--space-lg)', marginBottom: 'var(--space-sm)' }}>
                By category
              </h2>
              <Card>
                {Object.entries(data.spentByCategory).map(([cat, amount]) => (
                  <div key={cat} className="row" style={{ justifyContent: 'space-between', padding: '6px 0' }}>
                    <span className="body-text">{categoryLabel(cat)}</span>
                    <strong>{money(amount)}</strong>
                  </div>
                ))}
              </Card>
            </>
          )}

          <h2 className="h2" style={{ marginTop: 'var(--space-lg)', marginBottom: 'var(--space-sm)' }}>
            Receipts
          </h2>
          {data.receipts.length === 0 && <p className="body-muted">No receipts for this month yet.</p>}
          <div className="stack gap-sm">
            {data.receipts.map((r) => (
              <button key={r._id} type="button" className="card" style={{ textAlign: 'left', cursor: 'pointer', width: '100%' }} onClick={() => setDrawer({ receipt: r })}>
                <div className="row" style={{ justifyContent: 'space-between', gap: 8 }}>
                  <strong>{r.store}</strong>
                  <strong>{money(r.total)}</strong>
                </div>
                <p className="body-muted">
                  {formatDay(r.date)} · {categoryLabel(r.category)}
                  {r.hasPhoto ? ' · photo' : ''} · {r.uploadedBy?.name || 'someone'}
                </p>
              </button>
            ))}
          </div>

          {data.purchases.length > 0 && (
            <>
              <h2 className="h2" style={{ marginTop: 'var(--space-lg)', marginBottom: 'var(--space-sm)' }}>
                Single-item purchases
              </h2>
              <div className="stack gap-sm">
                {data.purchases.map((p) => (
                  <Card key={p._id}>
                    <p className="body-text">{p.item?.name || 'Unknown item'}</p>
                    <p className="body-muted">
                      {formatDay(p.date)} · {p.quantity} for {money(p.cost)}
                    </p>
                  </Card>
                ))}
              </div>
            </>
          )}

          {isAdmin && (
            <Card style={{ marginTop: 'var(--space-lg)', background: 'var(--coin-soft, #fff4cf)' }}>
              <h2 className="h2">For the bookkeeper</h2>
              <p className="body-muted" style={{ margin: '4px 0 12px' }}>
                A spreadsheet of this month's receipts (date, payee, amount, category, memo, photo file name). Open a receipt to download its
                photo for QuickBooks.
              </p>
              <Button variant="outline" small onClick={exportCsv}>
                <Icon name="download" /> Export month (CSV)
              </Button>
              {storage && (
                <p className="body-muted" style={{ marginTop: 12 }}>
                  {storage.photos} receipt photo{storage.photos === 1 ? '' : 's'} saved, using {(storage.bytes / 1048576).toFixed(1)} MB of about 400 MB
                  available.
                </p>
              )}
            </Card>
          )}
        </>
      )}

      {drawer && (
        <ReceiptDrawer
          receipt={drawer.receipt}
          isAdmin={isAdmin}
          onClose={() => setDrawer(null)}
          onSaved={() => {
            setDrawer(null);
            load();
          }}
        />
      )}
    </Layout>
  );
}
