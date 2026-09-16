import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import { api } from '../api/client';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function EventDetailPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [totalServed, setTotalServed] = useState(0);
  const [location, setLocation] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [adjusting, setAdjusting] = useState(false);
  const [adjustedTotal, setAdjustedTotal] = useState('');
  const [adjustSaving, setAdjustSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await api.getEvent(eventId);
      setEvent(data.event);
      setTotalServed(data.totalServed);
      setLocation(data.event.location || '');
      setDetails(data.event.details || '');
    } catch (err) {
      setError('Could not load event: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave() {
    setSaving(true);
    try {
      await api.updateEvent(eventId, { location, details });
      navigate('/events');
    } catch (err) {
      alert('Could not save: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  function openAdjustForm() {
    setAdjustedTotal(String(totalServed));
    setAdjusting(true);
  }

  async function handleSaveAdjustment() {
    const newTotal = Number(adjustedTotal);
    if (!Number.isInteger(newTotal) || newTotal < 0) {
      alert('Enter a whole number of 0 or more.');
      return;
    }

    const delta = newTotal - totalServed;
    if (delta === 0) {
      setAdjusting(false);
      return;
    }

    setAdjustSaving(true);
    try {
      // Reuses the same tally endpoint every live tap goes through - this
      // adjustment is just one more (possibly negative) tally row.
      await api.tally(eventId, { countIncrement: delta });
      await load(); // pull the server's recomputed total back
      setAdjusting(false);
    } catch (err) {
      alert('Could not adjust count: ' + err.message);
    } finally {
      setAdjustSaving(false);
    }
  }

  if (loading || !event) {
    return (
      <Layout>
        <p className="body-text">{error || 'Loading…'}</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <p className="h1">{formatDate(event.date)}</p>

      <Card style={{ marginTop: 'var(--space-lg)', marginBottom: 'var(--space-sm)', textAlign: 'center' }}>
        <p className="tally-number">{totalServed}</p>
        <p className="body-muted">people served</p>
      </Card>

      {adjusting ? (
        <Card style={{ marginBottom: 'var(--space-lg)' }}>
          <p className="body-text">Do you want to adjust the count from {totalServed}?</p>
          <input
            className="field-input"
            value={adjustedTotal}
            onChange={(e) => setAdjustedTotal(e.target.value)}
            inputMode="numeric"
            style={{ marginTop: 'var(--space-sm)' }}
          />
          <div className="row gap-sm" style={{ marginTop: 'var(--space-md)' }}>
            <Button title="Cancel" variant="outline" onClick={() => setAdjusting(false)} style={{ flex: 1 }} />
            <Button title="Save Adjustment" onClick={handleSaveAdjustment} loading={adjustSaving} style={{ flex: 1 }} />
          </div>
        </Card>
      ) : (
        <Button title="Adjust Count" variant="outline" onClick={openAdjustForm} style={{ marginBottom: 'var(--space-lg)' }} block />
      )}

      <label className="field-label" style={{ marginTop: 0 }}>
        Location
      </label>
      <input className="field-input" value={location} onChange={(e) => setLocation(e.target.value)} />

      <label className="field-label">Notes</label>
      <textarea
        className="field-textarea"
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        placeholder="Total guests, weather, what ran out, anything worth remembering…"
        rows={6}
      />

      <Button title="Save" onClick={handleSave} loading={saving} style={{ marginTop: 'var(--space-lg)' }} block />
    </Layout>
  );
}
