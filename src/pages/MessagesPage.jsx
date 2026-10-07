import React, { useCallback, useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import { CATEGORIES } from '../components/SupportForms';
import { api } from '../api/client';

const CATEGORY_LABELS = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));

// Admin inbox for the public contact form (including "I need help" requests
// and survey translation offers). "I need help" messages are listed first.
export default function MessagesPage() {
  const [messages, setMessages] = useState([]);
  const [showResolved, setShowResolved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setMessages(await api.getContactMessages());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function resolve(id) {
    try {
      const updated = await api.resolveContactMessage(id);
      setMessages((list) => list.map((m) => (m._id === id ? updated : m)));
    } catch (err) {
      alert('Could not mark that as handled: ' + err.message);
    }
  }

  const visible = messages
    .filter((m) => showResolved || !m.resolved)
    .sort((a, b) => (a.category === 'assistance' ? 0 : 1) - (b.category === 'assistance' ? 0 : 1));
  const openCount = messages.filter((m) => !m.resolved).length;

  return (
    <Layout title="Messages">
      <p className="h1">Messages</p>
      <p className="body-muted" style={{ marginTop: 'var(--space-xs)', marginBottom: 'var(--space-md)' }}>
        From the contact form. {openCount} open.
      </p>

      <label className="row gap-sm" style={{ marginBottom: 'var(--space-md)' }}>
        <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} />
        <span className="body-text">Show handled messages too</span>
      </label>

      {loading && <p className="body-muted">Loading…</p>}
      {!!error && (
        <div className="stack gap-sm">
          <p className="body-muted" style={{ color: 'var(--color-danger)' }}>
            {error}
          </p>
          <Button title="Retry" small onClick={load} />
        </div>
      )}
      {!loading && !error && visible.length === 0 && <p className="body-muted">No open messages.</p>}

      <div className="stack gap-md">
        {visible.map((m) => (
          <Card key={m._id} style={m.category === 'assistance' && !m.resolved ? { borderColor: 'var(--color-accent)', borderWidth: 2 } : undefined}>
            <p className="body-muted">
              <strong style={{ color: m.category === 'assistance' ? 'var(--color-accent)' : undefined }}>
                {CATEGORY_LABELS[m.category] || m.category}
              </strong>
              {' · '}
              {new Date(m.date || m.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
              {m.resolved ? ' · Handled' : ''}
            </p>
            <p className="body-text" style={{ marginTop: 'var(--space-sm)', whiteSpace: 'pre-wrap' }}>
              {m.message}
            </p>
            <div className="stack" style={{ marginTop: 'var(--space-sm)' }}>
              <p className="body-text">{m.name || 'No name given'}</p>
              {m.phone && (
                <a className="body-text" href={`tel:${m.phone}`}>
                  {m.phone}
                </a>
              )}
              {m.email && (
                <a className="body-text" href={`mailto:${m.email}`}>
                  {m.email}
                </a>
              )}
              {!m.phone && !m.email && <p className="body-muted">No way to reply was left.</p>}
            </div>
            {!m.resolved && (
              <Button title="Mark as handled" variant="outline-success" small onClick={() => resolve(m._id)} style={{ marginTop: 'var(--space-md)' }} />
            )}
          </Card>
        ))}
      </div>
    </Layout>
  );
}
