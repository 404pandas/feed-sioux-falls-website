import React from 'react';
import { STORES } from '../../config/org';

// How each kind of field from /api/admin/collections is shown and edited.

const ENUM_LABELS = {
  admin: 'Admin',
  volunteer: 'Volunteer',
  neighbor: 'Neighbor',
  hygiene: 'Hygiene',
  winter: 'Winter',
  other: 'Other',
  restock: 'Restock (bought)',
  distributed: 'Handed out',
  adjustment: 'Adjustment',
  pending: 'Pending',
  succeeded: 'Succeeded',
  failed: 'Failed',
  contact: 'General',
  assistance: 'Needs help',
  donate: 'Donation question',
  partner: 'Partnership',
  suggestion: 'Suggestion',
  self: 'On their own',
  paper: 'Paper survey',
  en: 'English',
  es: 'Spanish',
  ne: 'Nepali',
  sw: 'Swahili',
  ar: 'Arabic',
  dak: 'Dakota',
  lkt: 'Lakota',
  tap: 'Counter in the app',
  import: 'Copied from count sheet',
  create: 'Added',
  update: 'Edited',
  delete: 'Deleted',
};

export function enumLabel(value) {
  if (value === null || value === undefined || value === '') return '—';
  return ENUM_LABELS[value] || String(value);
}

export function formatDate(value, dateOnly) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return dateOnly
    ? d.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' })
    : d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function refTitle(value) {
  if (!value) return '—';
  if (typeof value === 'string') return 'Deleted or missing';
  if (value.name) return value.name;
  if (value.month) return value.month;
  if (value.date) return `${formatDate(value.date, true)}${value.location ? `, ${value.location.split(',')[0]}` : ''}`;
  return String(value._id || '—');
}

// A record's name in lists and drawer titles.
export function recordTitle(collection, row) {
  const v = row?.[collection.titleField];
  const field = collection.fields.find((f) => f.name === collection.titleField);
  if (!field) return 'Record';
  if (field.type === 'date') return formatDate(v, field.dateOnly);
  if (field.type === 'enum') return enumLabel(v);
  if (field.type === 'number' && collection.key === 'donations') return `$${v}`;
  if (field.type === 'number') return String(v);
  if (typeof v === 'string') return v.length > 60 ? `${v.slice(0, 60)}…` : v || 'Untitled';
  return 'Record';
}

export function DisplayValue({ field, value, full = false }) {
  if (field.type === 'boolean') {
    if (value === null || value === undefined) return <span className="body-muted">—</span>;
    return <span className={`pill ${value ? 'pill-ok' : 'pill-muted'}`}>{value ? 'Yes' : 'No'}</span>;
  }
  if (field.type === 'date') return <span>{formatDate(value, field.dateOnly)}</span>;
  if (field.type === 'enum') return <span>{enumLabel(value)}</span>;
  if (field.type === 'ref') return <span>{refTitle(value)}</span>;
  if (field.type === 'number') {
    if (value === null || value === undefined) return <span className="body-muted">—</span>;
    const money = /\(\$\)|\$/.test(field.label);
    return <span>{money ? `$${Number(value).toFixed(2)}` : value}</span>;
  }
  if (field.type === 'sources') {
    const list = value || [];
    if (!list.length) return <span className="body-muted">None</span>;
    if (!full) return <span>{list.map((s) => STORES[s.store] || s.store).join(', ')}</span>;
    return (
      <span className="stack gap-xs">
        {list.map((s) => (
          <a key={s._id || s.url} href={s.url} target="_blank" rel="noopener noreferrer">
            {STORES[s.store] || s.store}
            {s.price != null && ` · $${Number(s.price).toFixed(2)}${s.unitsPerPack ? ` for ${s.unitsPerPack}` : ''}`}
          </a>
        ))}
      </span>
    );
  }
  if (field.type === 'json') {
    if (Array.isArray(value)) return <span>{value.join(', ') || '—'}</span>;
    if (value && typeof value === 'object') {
      const n = Object.keys(value).length;
      return <span>{n} answer{n === 1 ? '' : 's'}</span>;
    }
    return <span>—</span>;
  }
  if (value === null || value === undefined || value === '') return <span className="body-muted">—</span>;
  return <span style={full ? { whiteSpace: 'pre-wrap' } : undefined}>{String(value)}</span>;
}

// Value as it goes into a form field.
export function toFormValue(field, value) {
  if (field.type === 'pin') return '';
  if (value === null || value === undefined) return field.type === 'boolean' ? false : field.type === 'sources' ? [] : '';
  if (field.type === 'date') {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  }
  if (field.type === 'ref') return typeof value === 'object' ? value._id : value;
  if (field.type === 'sources') return value.map((s) => ({ ...s, price: s.price ?? '', unitsPerPack: s.unitsPerPack ?? '' }));
  return value;
}

export function fromFormValue(field, value) {
  if (field.type === 'date') return value ? new Date(value).toISOString() : null;
  if (field.type === 'number') return value === '' ? null : Number(value);
  return value;
}
