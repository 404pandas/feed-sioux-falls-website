import React from 'react';
import Button from './Button';
import Icon from './Icon';
import { STORES } from '../config/org';

export const BLANK_SOURCE = { store: 'amazon', url: '', price: '', unitsPerPack: '', note: '' };

export function perUnit(source) {
  const price = Number(source.price);
  const units = Number(source.unitsPerPack) || 1;
  if (!price) return null;
  return price / units;
}

// Edits an item's "where to buy" list: any number of stores, each with a
// link, and optionally the price and how many come in the pack so stores
// can be compared per unit. The cheapest per unit is marked.
export default function SourcesEditor({ value, onChange }) {
  const sources = value || [];
  const unitPrices = sources.map(perUnit);
  const cheapest = Math.min(...unitPrices.filter((p) => p != null));

  function update(i, field, v) {
    onChange(sources.map((s, idx) => (idx === i ? { ...s, [field]: v } : s)));
  }

  return (
    <div>
      {sources.length === 0 && <p className="body-muted">No store links yet.</p>}
      {sources.map((s, i) => (
        <div key={s._id || i} className="source-row">
          <div>
            <label className="field-label" htmlFor={`store-${i}`}>
              Store
            </label>
            <select id={`store-${i}`} className="field-select" value={s.store} onChange={(e) => update(i, 'store', e.target.value)}>
              {Object.entries(STORES).map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor={`note-${i}`}>
              {s.store === 'other' ? 'Store name' : 'Note (optional)'}
            </label>
            <input id={`note-${i}`} className="field-input" value={s.note || ''} onChange={(e) => update(i, 'note', e.target.value)} />
          </div>
          <div className="full">
            <label className="field-label" htmlFor={`url-${i}`}>
              Link
            </label>
            <input
              id={`url-${i}`}
              className="field-input"
              type="url"
              inputMode="url"
              placeholder="https://"
              value={s.url}
              onChange={(e) => update(i, 'url', e.target.value)}
            />
          </div>
          <div>
            <label className="field-label" htmlFor={`price-${i}`}>
              Price ($)
            </label>
            <input
              id={`price-${i}`}
              className="field-input"
              inputMode="decimal"
              value={s.price ?? ''}
              onChange={(e) => update(i, 'price', e.target.value)}
            />
          </div>
          <div>
            <label className="field-label" htmlFor={`units-${i}`}>
              How many in it
            </label>
            <input
              id={`units-${i}`}
              className="field-input"
              inputMode="numeric"
              value={s.unitsPerPack ?? ''}
              onChange={(e) => update(i, 'unitsPerPack', e.target.value)}
            />
          </div>
          <div className="full row" style={{ justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <span className="body-muted">
              {unitPrices[i] != null && (
                <>
                  ${unitPrices[i].toFixed(2)} each
                  {unitPrices[i] === cheapest && sources.filter((x) => perUnit(x) != null).length > 1 && (
                    <span className="pill pill-ok" style={{ marginLeft: 8 }}>
                      Cheapest
                    </span>
                  )}
                </>
              )}
            </span>
            <span className="row gap-sm">
              {s.url && /^https?:\/\//.test(s.url) && (
                <a className="text-link" href={s.url} target="_blank" rel="noopener noreferrer">
                  Open <Icon name="external" />
                </a>
              )}
              <Button
                variant="outline-danger"
                small
                onClick={() => onChange(sources.filter((_, idx) => idx !== i))}
                ariaLabel={`Remove ${STORES[s.store]} link`}
              >
                <Icon name="trash" /> Remove
              </Button>
            </span>
          </div>
        </div>
      ))}
      <Button variant="outline" small style={{ marginTop: 12 }} onClick={() => onChange([...sources, { ...BLANK_SOURCE }])}>
        <Icon name="plus" /> Add a store
      </Button>
    </div>
  );
}
