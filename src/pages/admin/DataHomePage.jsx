import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import Button from '../../components/Button';
import Icon from '../../components/Icon';
import { api } from '../../api/client';
import { formatNumber } from '../../components/PublicData';

// Cached for the session so moving between Data screens doesn't refetch the
// collection layout every time.
let collectionsCache = null;
export async function loadCollections(force = false) {
  if (!collectionsCache || force) collectionsCache = await api.admin.collections();
  return collectionsCache;
}

const GROUPS = [
  { title: 'People', keys: ['users'] },
  { title: 'Pantry', keys: ['items', 'inventoryTransactions', 'purchases', 'budgets'] },
  { title: 'Outreach', keys: ['events', 'tallies', 'estimates'] },
  { title: 'From the public', keys: ['contactMessages', 'surveyResponses', 'surveyContactRequests', 'donations'] },
  { title: 'Records', keys: ['auditLog'] },
];

// Admin "All data": every collection in the database, with how many records
// each has. Tap one to view, search, add, edit, or delete.
export default function DataHomePage() {
  const [collections, setCollections] = useState(null);
  const [error, setError] = useState('');

  function load() {
    setError('');
    loadCollections(true)
      .then(setCollections)
      .catch((err) => setError(err.message));
  }

  useEffect(load, []);

  const byKey = Object.fromEntries((collections || []).map((c) => [c.key, c]));

  return (
    <Layout title="All data">
      <div className="page-head">
        <div>
          <h1 className="h1">All data</h1>
          <p className="sub">
            Everything Feed Sioux Falls keeps, in one place. Only admins can see this page, and every change is written
            to the change log.
          </p>
        </div>
      </div>

      {error && (
        <div className="card" role="alert">
          <p className="error-text">{error}</p>
          <Button small variant="outline" onClick={load} style={{ marginTop: 8 }}>
            Try again
          </Button>
        </div>
      )}
      {!collections && !error && <p className="body-muted">Loading…</p>}

      {collections &&
        GROUPS.map((group) => {
          const list = group.keys.map((k) => byKey[k]).filter(Boolean);
          if (!list.length) return null;
          return (
            <section key={group.title} style={{ marginBottom: 32 }}>
              <h2 className="h2" style={{ marginBottom: 12 }}>
                {group.title}
              </h2>
              <div className="collection-grid">
                {list.map((c) => (
                  <Link key={c.key} to={`/data/${c.key}`} className="collection-card">
                    <span className="row" style={{ justifyContent: 'space-between' }}>
                      <span className="h2">{c.label}</span>
                      <Icon name="chevronRight" />
                    </span>
                    <span className="count">{formatNumber(c.count)}</span>
                    <span className="body-muted">{c.description}</span>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
    </Layout>
  );
}
