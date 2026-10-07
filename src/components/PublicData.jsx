import React, { useEffect, useState } from 'react';
import Icon from './Icon';
import { api } from '../api/client';
import { storeLabel } from '../config/org';

// Loads /api/public/summary once per page view (the server caches it for a
// minute). `summary` stays null on failure - every section that uses it
// hides itself or shows a fallback instead of an error.
export function usePublicSummary() {
  const [summary, setSummary] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    api
      .getPublicSummary()
      .then((data) => !cancelled && setSummary(data))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, []);
  return { summary, failed, loading: !summary && !failed };
}

export function formatNumber(n) {
  return Number(n || 0).toLocaleString('en-US');
}

export function formatOutreachDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export function StatusPill({ status }) {
  if (status === 'out') return <span className="pill pill-out">Out right now</span>;
  if (status === 'low') return <span className="pill pill-low">Running low</span>;
  return <span className="pill pill-ok">Stocked</span>;
}

export function StoreLinks({ sources, itemName }) {
  if (!sources?.length) return null;
  return (
    <div className="store-links">
      {sources.map((s) => (
        <a
          key={s.url}
          className="store-link"
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Buy ${itemName} at ${storeLabel(s)} (opens a new tab)`}
        >
          {storeLabel(s)}
          <Icon name="external" />
        </a>
      ))}
    </div>
  );
}

// The public "what we're short on" list. Shows names and Out/Low only -
// never counts or costs.
export function NeedsList({ items, limit, twoCol = true, showLinks = true }) {
  const shown = limit ? items.slice(0, limit) : items;
  return (
    <ul className={`need-list${twoCol ? ' two-col' : ''}`}>
      {shown.map((item) => (
        <li key={item._id} className="need">
          <div className="need-top">
            <span className="need-name">{item.name}</span>
            <StatusPill status={item.status} />
          </div>
          {showLinks && item.sources?.length > 0 && (
            <>
              <span className="body-muted">Where we buy it, if you'd like to pick some up for the pantry:</span>
              <StoreLinks sources={item.sources} itemName={item.name} />
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
