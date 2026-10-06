import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Layout, { clearBadgeCache } from '../../components/Layout';
import Button from '../../components/Button';
import Icon from '../../components/Icon';
import Drawer from '../../components/Drawer';
import SourcesEditor from '../../components/SourcesEditor';
import SurveyAnswers from '../../survey/SurveyAnswers';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { loadCollections } from './DataHomePage';
import { DisplayValue, enumLabel, fromFormValue, recordTitle, refTitle, toFormValue } from './dataFormat';

const PAGE_SIZE = 25;
const MAX_COLUMNS = 6;

// One collection: a searchable, sortable table. Tap a row to see the whole
// record, then edit or delete it; "Add" makes a new one. What can be
// changed comes from the backend, so read-only things (Stripe donations,
// survey answers, the change log) simply don't offer those buttons.
export default function DataCollectionPage() {
  const { key } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [collection, setCollection] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(null); // { mode: 'view'|'edit'|'create', row }

  const page = Math.max(1, Number(params.get('page')) || 1);
  const sort = params.get('sort') || '';
  const filters = useMemo(() => {
    const out = {};
    for (const name of collection?.filters || []) {
      const v = params.get(name);
      if (v) out[name] = v;
    }
    return out;
  }, [params, collection]);

  useEffect(() => {
    setCollection(null);
    setData(null);
    setQuery('');
    setDebounced('');
    loadCollections()
      .then((all) => {
        const found = all.find((c) => c.key === key);
        if (!found) setError('That collection doesn\'t exist.');
        else setCollection(found);
      })
      .catch((err) => setError(err.message));
  }, [key]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const load = useCallback(async () => {
    if (!collection) return;
    try {
      setData(await api.admin.list(collection.key, { page, limit: PAGE_SIZE, sort, q: debounced, ...filters }));
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [collection, page, sort, debounced, filters]);

  useEffect(() => {
    load();
  }, [load]);

  // ?open=<id> opens that record (used by links between collections).
  useEffect(() => {
    const id = params.get('open');
    if (!collection || !id) return;
    api.admin
      .get(collection.key, id)
      .then((row) => setOpen({ mode: 'view', row }))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collection, params.get('open')]);

  function setParam(name, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(name, value);
    else next.delete(name);
    if (name !== 'page') next.delete('page');
    if (name !== 'open') next.delete('open');
    setParams(next, { replace: true });
  }

  function closeDrawer() {
    setOpen(null);
    if (params.get('open')) setParam('open', '');
  }

  const columns = useMemo(
    () => (collection ? collection.fields.filter((f) => f.type !== 'pin' && f.type !== 'json').slice(0, MAX_COLUMNS) : []),
    [collection]
  );

  if (error && !collection) {
    return (
      <Layout title="Data" back={{ to: '/data', label: 'All data' }}>
        <p className="error-text">{error}</p>
      </Layout>
    );
  }
  if (!collection) {
    return (
      <Layout title="Data" back={{ to: '/data', label: 'All data' }}>
        <p className="body-muted">Loading…</p>
      </Layout>
    );
  }

  const pages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const sortName = sort.replace(/^-/, '');

  return (
    <Layout title={collection.label} back={{ to: '/data', label: 'All data' }}>
      <div className="page-head">
        <div>
          <h1 className="h1">{collection.label}</h1>
          <p className="sub" style={{ maxWidth: '60ch' }}>
            {collection.description}
          </p>
        </div>
        <div className="row gap-sm" style={{ flexWrap: 'wrap' }}>
          {collection.key === 'surveyResponses' && (
            <Button variant="outline" to="/survey/responses">
              <Icon name="list" /> One at a time
            </Button>
          )}
          {collection.permissions.create && (
            <Button onClick={() => setOpen({ mode: 'create', row: {} })}>
              <Icon name="plus" /> Add
            </Button>
          )}
        </div>
      </div>

      <div className="toolbar">
        {collection.searchable && (
          <>
            <label className="visually-hidden" htmlFor="data-search">
              Search {collection.label}
            </label>
            <input
              id="data-search"
              className="field-input search-input"
              type="search"
              placeholder={`Search ${collection.label.toLowerCase()}`}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (page !== 1) setParam('page', '');
              }}
            />
          </>
        )}
        {(collection.filters || []).map((name) => {
          const field = collection.fields.find((f) => f.name === name);
          if (!field) return null;
          if (field.type === 'ref') {
            return params.get(name) ? (
              <button key={name} className="chip" aria-pressed="true" onClick={() => setParam(name, '')}>
                {field.label}: one record <Icon name="close" />
              </button>
            ) : null;
          }
          const options = field.type === 'boolean' ? ['true', 'false'] : field.options || [];
          return (
            <span key={name}>
              <label className="visually-hidden" htmlFor={`filter-${name}`}>
                {field.label}
              </label>
              <select
                id={`filter-${name}`}
                className="field-select"
                style={{ width: 'auto' }}
                value={params.get(name) || ''}
                onChange={(e) => setParam(name, e.target.value)}
              >
                <option value="">{field.label}: any</option>
                {options.map((o) => (
                  <option key={o} value={o}>
                    {field.label}: {field.type === 'boolean' ? (o === 'true' ? 'Yes' : 'No') : enumLabel(o)}
                  </option>
                ))}
              </select>
            </span>
          );
        })}
      </div>

      {error && <p className="error-text">{error}</p>}
      {!data && !error && <p className="body-muted">Loading…</p>}
      {data && data.rows.length === 0 && (
        <p className="empty-note">
          {debounced || Object.keys(filters).length ? 'Nothing matches. Try another search or filter.' : 'Nothing here yet.'}
        </p>
      )}

      {data && data.rows.length > 0 && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((f) => (
                  <th key={f.name} aria-sort={sortName === f.name ? (sort.startsWith('-') ? 'descending' : 'ascending') : undefined}>
                    {f.type === 'sources' ? (
                      f.label
                    ) : (
                      <button onClick={() => setParam('sort', sortName === f.name && !sort.startsWith('-') ? `-${f.name}` : f.name)}>
                        {f.label}
                        <Icon name="sort" style={{ opacity: sortName === f.name ? 1 : 0.35 }} />
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr
                  key={row._id}
                  tabIndex={0}
                  onClick={() => setOpen({ mode: 'view', row })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setOpen({ mode: 'view', row });
                    }
                  }}
                  aria-label={`Open ${recordTitle(collection, row)}`}
                >
                  {columns.map((f) => (
                    <td key={f.name} data-label={f.label} className={f.type === 'text' || f.type === 'string' ? 'clip' : undefined}>
                      <DisplayValue field={f} value={row[f.name]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.total > PAGE_SIZE && (
        <div className="pager">
          <Button variant="outline" small disabled={page <= 1} onClick={() => setParam('page', String(page - 1))}>
            <Icon name="chevronLeft" /> Newer
          </Button>
          <span className="body-muted">
            Page {page} of {pages} · {data.total} records
          </span>
          <Button variant="outline" small disabled={page >= pages} onClick={() => setParam('page', String(page + 1))}>
            Older <Icon name="chevronRight" />
          </Button>
        </div>
      )}
      {data && data.total <= PAGE_SIZE && data.total > 0 && (
        <p className="body-muted" style={{ marginTop: 12 }}>
          {data.total} record{data.total === 1 ? '' : 's'}
        </p>
      )}

      {open && (
        <RecordDrawer
          collection={collection}
          state={open}
          setState={setOpen}
          onClose={closeDrawer}
          onChanged={() => {
            clearBadgeCache();
            load();
          }}
          onNavigateRef={(refKey, id) => {
            setOpen(null);
            navigate(`/data/${refKey}?open=${id}`);
          }}
        />
      )}
    </Layout>
  );
}

function RecordDrawer({ collection, state, setState, onClose, onChanged, onNavigateRef }) {
  const { user } = useAuth();
  const { mode, row } = state;
  const editableFields = collection.fields.filter((f) => !f.readOnly && f.type !== 'json');
  const [form, setForm] = useState(() =>
    Object.fromEntries(
      editableFields.map((f) => [
        f.name,
        mode === 'create' ? (f.type === 'boolean' ? f.name === 'active' : f.type === 'sources' ? [] : '') : toFormValue(f, row[f.name]),
      ])
    )
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const title =
    mode === 'create' ? `Add to ${collection.label}` : mode === 'edit' ? `Edit ${recordTitle(collection, row)}` : recordTitle(collection, row);

  async function save() {
    setError('');
    const body = {};
    for (const f of editableFields) {
      const v = form[f.name];
      if (f.type === 'pin' && !v) continue; // blank PIN = keep the current one
      body[f.name] = fromFormValue(f, v);
    }
    setSaving(true);
    try {
      const saved =
        mode === 'create' ? await api.admin.create(collection.key, body) : await api.admin.update(collection.key, row._id, body);
      onChanged();
      setState({ mode: 'view', row: saved });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    const name = recordTitle(collection, row);
    const extra = collection.key === 'events' ? ' Its people-served counts will be deleted too.' : '';
    if (!window.confirm(`Delete "${name}"?${extra} This can't be undone.`)) return;
    setSaving(true);
    try {
      await api.admin.remove(collection.key, row._id);
      onChanged();
      onClose();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  const footer =
    mode === 'view' ? (
      <>
        {collection.permissions.delete && (
          <Button variant="outline-danger" small onClick={remove} disabled={saving}>
            <Icon name="trash" /> Delete
          </Button>
        )}
        <span className="spacer" />
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        {collection.permissions.update && editableFields.length > 0 && (
          <Button onClick={() => setState({ mode: 'edit', row })}>
            <Icon name="edit" /> Edit
          </Button>
        )}
      </>
    ) : (
      <>
        <span className="spacer" />
        <Button variant="outline" onClick={() => (mode === 'create' ? onClose() : setState({ mode: 'view', row }))}>
          Cancel
        </Button>
        <Button onClick={save} loading={saving}>
          {mode === 'create' ? 'Add' : 'Save changes'}
        </Button>
      </>
    );

  return (
    <Drawer title={title} onClose={onClose} footer={footer}>
      {error && (
        <p className="error-text" role="alert" style={{ marginTop: 12 }}>
          {error}
        </p>
      )}

      {mode === 'view' && (
        <>
          {collection.key === 'users' && String(row._id) === String(user?._id) && (
            <p className="pill pill-ok" style={{ marginTop: 12 }}>
              This is you
            </p>
          )}
          <dl style={{ margin: 0 }}>
            {collection.fields
              .filter((f) => f.type !== 'pin' && !(f.type === 'json' && collection.key === 'surveyResponses'))
              .map((f) => (
                <div key={f.name} className="kv">
                  <dt>{f.label}</dt>
                  <dd>
                    {f.type === 'ref' && row[f.name] && typeof row[f.name] === 'object' ? (
                      <button className="link-button text-link" onClick={() => onNavigateRef(f.ref, row[f.name]._id)}>
                        {refTitle(row[f.name])} <Icon name="chevronRight" />
                      </button>
                    ) : (
                      <DisplayValue field={f} value={row[f.name]} full />
                    )}
                  </dd>
                </div>
              ))}
          </dl>
          {collection.key === 'surveyResponses' && (
            <div className="card response-card" style={{ marginTop: 16, boxShadow: 'none' }}>
              <SurveyAnswers answers={row.answers} />
            </div>
          )}
          {collection.key === 'events' && (
            <p style={{ marginTop: 16 }}>
              <Link className="text-link" to={`/data/tallies?distributionEvent=${row._id}`}>
                See this event's people-served counts <Icon name="chevronRight" />
              </Link>
            </p>
          )}
          {collection.key === 'items' && (
            <p style={{ marginTop: 16 }}>
              <Link className="text-link" to={`/data/inventoryTransactions?item=${row._id}`}>
                See this item's stock history <Icon name="chevronRight" />
              </Link>
            </p>
          )}
        </>
      )}

      {mode !== 'view' &&
        editableFields.map((f) => (
          <FieldInput
            key={f.name}
            field={f}
            isCreate={mode === 'create'}
            value={form[f.name]}
            onChange={(v) => setForm((prev) => ({ ...prev, [f.name]: v }))}
          />
        ))}
    </Drawer>
  );
}

function RefSelect({ field, value, onChange, id }) {
  const [options, setOptions] = useState(null);
  useEffect(() => {
    api.admin
      .list(field.ref, { limit: 200 })
      .then((res) => setOptions(res.rows))
      .catch(() => setOptions([]));
  }, [field.ref]);
  return (
    <select id={id} className="field-select" value={value || ''} onChange={(e) => onChange(e.target.value)}>
      <option value="">{options ? 'Choose…' : 'Loading…'}</option>
      {(options || []).map((o) => (
        <option key={o._id} value={o._id}>
          {refTitle(o)}
        </option>
      ))}
    </select>
  );
}

function FieldInput({ field, value, onChange, isCreate }) {
  const id = `f-${field.name}`;
  const required = field.required || (isCreate && field.requiredOnCreate);
  const label = (
    <label className="field-label" htmlFor={id}>
      {field.label}
      {required ? '' : ' (optional)'}
    </label>
  );

  if (field.type === 'boolean') {
    return (
      <label className="check-row" htmlFor={id}>
        <input id={id} type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
        {field.label}
      </label>
    );
  }
  if (field.type === 'sources') {
    return (
      <div style={{ marginTop: 12 }}>
        <p className="field-label">{field.label}</p>
        <SourcesEditor value={value} onChange={onChange} />
      </div>
    );
  }
  if (field.type === 'enum') {
    return (
      <div>
        {label}
        <select id={id} className="field-select" value={value || ''} onChange={(e) => onChange(e.target.value)}>
          {!required && <option value="">—</option>}
          {required && !value && <option value="">Choose…</option>}
          {field.options.map((o) => (
            <option key={o} value={o}>
              {enumLabel(o)}
            </option>
          ))}
        </select>
      </div>
    );
  }
  if (field.type === 'ref') {
    return (
      <div>
        {label}
        <RefSelect id={id} field={field} value={value} onChange={onChange} />
      </div>
    );
  }
  if (field.type === 'text') {
    return (
      <div>
        {label}
        <textarea id={id} className="field-textarea" rows={5} value={value || ''} onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  }
  if (field.type === 'pin') {
    return (
      <div>
        <label className="field-label" htmlFor={id}>
          {isCreate ? field.label : `New ${field.label} (leave blank to keep the current one)`}
        </label>
        <input
          id={id}
          className="field-input pin-input"
          inputMode="numeric"
          type="password"
          autoComplete="new-password"
          maxLength={6}
          value={value || ''}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
        />
      </div>
    );
  }
  return (
    <div>
      {label}
      <input
        id={id}
        className="field-input"
        type={field.type === 'date' ? 'datetime-local' : 'text'}
        inputMode={field.type === 'number' ? 'decimal' : undefined}
        pattern={field.pattern}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
