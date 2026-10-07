import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import { api } from '../api/client';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function dayBounds(date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

export default function EventsListPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(''); // '' = default "past events" view
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let data;
      if (filterDate) {
        const { start, end } = dayBounds(new Date(filterDate));
        data = await api.getEvents({ start: start.toISOString(), end: end.toISOString() });
      } else {
        data = await api.getEvents(); // most recent past events, per the backend's default
      }
      setEvents(data);
    } catch (err) {
      setError('Could not load events: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [filterDate]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Layout title="Past events">
      <p className="h1" style={{ marginBottom: 'var(--space-xs)' }}>
        {filterDate ? `Events on ${formatDate(filterDate)}` : 'Past Events'}
      </p>

      <div className="row gap-sm" style={{ marginBottom: 'var(--space-md)' }}>
        <input
          className="field-input"
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          style={{ flex: 1 }}
        />
        {filterDate && <Button title="Clear" variant="outline" onClick={() => setFilterDate('')} />}
      </div>

      {!!error && <p className="body-muted" style={{ color: 'var(--color-danger)' }}>{error}</p>}
      {loading && <p className="body-muted">Loading…</p>}

      <div className="stack gap-sm">
        {events.map((item) => (
          <button key={item._id} className="link-button" style={{ display: 'block', width: '100%', textAlign: 'left' }} onClick={() => navigate(`/events/${item._id}`)}>
            <Card>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <p className="h2">{formatDate(item.date)}</p>
                {!item.synced && <span className="low-badge">NOT SYNCED</span>}
              </div>
              <p className="body-muted">{item.location}</p>
              {!!item.details && <p className="body-text" style={{ marginTop: 'var(--space-xs)' }}>{item.details}</p>}
            </Card>
          </button>
        ))}
        {!loading && events.length === 0 && (
          <p className="body-muted">{filterDate ? 'No events on this date.' : 'No past events yet.'}</p>
        )}
      </div>
    </Layout>
  );
}
