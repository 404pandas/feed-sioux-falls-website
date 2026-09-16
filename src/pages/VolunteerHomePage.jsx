import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const TALLY_INCREMENTS = [1, 5, 10];
const DEFAULT_START_LOCATION = 'Heritage Park, 330 N Weber Ave, Sioux Falls, SD 57103';

function todayBounds() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

function AdminMenu({ navigate, style }) {
  return (
    <div className="stack gap-sm" style={style}>
      <Button title="Inventory" variant="outline" onClick={() => navigate('/inventory')} block />
      <Button title="Budget" variant="outline" onClick={() => navigate('/budget')} block />
      <Button title="Reports" variant="outline" onClick={() => navigate('/reports')} block />
      <Button title="Past Events" variant="outline" onClick={() => navigate('/events')} block />
    </div>
  );
}

export default function VolunteerHomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeEvent, setActiveEvent] = useState(null);
  const [totalServed, setTotalServed] = useState(0);
  const [starting, setStarting] = useState(false);
  const [checkingToday, setCheckingToday] = useState(true);
  const [startLocation, setStartLocation] = useState(DEFAULT_START_LOCATION);
  const [startDetails, setStartDetails] = useState('');
  const [checkError, setCheckError] = useState(false);
  const [tapError, setTapError] = useState('');
  const [tapping, setTapping] = useState(false);

  const checkTodaysEvent = useCallback(async () => {
    try {
      const { start, end } = todayBounds();
      const events = await api.getEvents({ start: start.toISOString(), end: end.toISOString() });
      if (events.length > 0) {
        const detail = await api.getEvent(events[0]._id);
        setActiveEvent(detail.event);
        setTotalServed(detail.totalServed);
      } else {
        setActiveEvent(null);
      }
      setCheckError(false);
    } catch (err) {
      setCheckError(true);
    } finally {
      setCheckingToday(false);
    }
  }, []);

  useEffect(() => {
    checkTodaysEvent();
  }, [checkTodaysEvent]);

  async function startEvent() {
    if (!startLocation.trim()) {
      alert('Enter where this distribution is happening.');
      return;
    }
    setStarting(true);
    try {
      const event = await api.createEvent({ location: startLocation.trim(), details: startDetails.trim() });
      setActiveEvent(event);
      setTotalServed(0);
    } catch (err) {
      alert('Could not start event. Check your connection and try again. ' + err.message);
    } finally {
      setStarting(false);
    }
  }

  async function tap(increment) {
    if (!activeEvent || tapping) return;
    setTapping(true);
    setTapError('');
    setTotalServed((c) => c + increment); // update UI instantly
    try {
      await api.tally(activeEvent._id, { countIncrement: increment });
    } catch (err) {
      setTotalServed((c) => c - increment); // revert the optimistic update
      setTapError('Could not record that tap: ' + err.message);
    } finally {
      setTapping(false);
    }
  }

  if (checkingToday) {
    return (
      <Layout>
        <p className="body-text">Checking today's schedule…</p>
      </Layout>
    );
  }

  if (!activeEvent && checkError) {
    return (
      <Layout>
        <p className="h1">Couldn't check today's schedule</p>
        <p className="body-muted" style={{ marginTop: 'var(--space-xs)', marginBottom: 'var(--space-lg)' }}>
          Check your connection and try again before starting a new event - there may already be
          one scheduled for today.
        </p>
        <Button title="Retry" onClick={checkTodaysEvent} />
      </Layout>
    );
  }

  if (!activeEvent) {
    return (
      <Layout>
        <p className="h1">Hi, {user?.name?.split(' ')[0]}</p>
        <p className="body-muted" style={{ marginTop: 'var(--space-xs)', marginBottom: 'var(--space-lg)' }}>
          Nothing's scheduled for today - fill in where this one's happening to begin counting.
        </p>

        <Card style={{ marginBottom: 'var(--space-xl)' }}>
          <label className="field-label" style={{ marginTop: 0 }}>
            Location
          </label>
          <input className="field-input" value={startLocation} onChange={(e) => setStartLocation(e.target.value)} placeholder="Where is this happening?" />

          <label className="field-label">Notes (optional)</label>
          <textarea
            className="field-textarea"
            value={startDetails}
            onChange={(e) => setStartDetails(e.target.value)}
            placeholder="Weather, expected turnout, anything worth noting"
            rows={3}
          />

          <Button title="Start Distribution Event" onClick={startEvent} loading={starting} style={{ marginTop: 'var(--space-md)' }} block />
        </Card>

        {user?.role === 'admin' && <AdminMenu navigate={navigate} style={{ marginTop: 'var(--space-xl)' }} />}
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="stack" style={{ gap: 'var(--space-xl)' }}>
        <div>
          <p className="h2">Today's Distribution</p>
          <p className="body-muted">{activeEvent.location}</p>
        </div>

        <div style={{ textAlign: 'center' }}>
          <p className="tally-number">{totalServed}</p>
          <p className="body-muted">people served so far</p>
        </div>

        <div className="stack gap-md">
          {!!tapError && <p className="body-muted" style={{ color: 'var(--color-danger)' }}>{tapError}</p>}
          <div className="row gap-sm">
            {TALLY_INCREMENTS.map((n) => (
              <Button
                key={n}
                title={n === 1 ? '+1 Person Served' : `+${n}`}
                variant="accent"
                onClick={() => tap(n)}
                disabled={tapping}
                style={{ flex: n === 1 ? 2 : 1, paddingTop: 'var(--space-xl)', paddingBottom: 'var(--space-xl)' }}
              />
            ))}
          </div>
          <Button
            title="-1 (fix a mistap)"
            variant="outline-danger"
            disabled={totalServed <= 0 || tapping}
            onClick={() => tap(-1)}
            block
          />
          <Button title="Adjust Inventory" variant="outline" onClick={() => navigate('/quick-stock')} block />
          {user?.role === 'admin' && (
            <Button
              title="End Event & Add Notes"
              variant="outline"
              onClick={() => navigate(`/events/${activeEvent._id}`)}
              block
            />
          )}
        </div>

        {user?.role === 'admin' && <AdminMenu navigate={navigate} />}
      </div>
    </Layout>
  );
}
