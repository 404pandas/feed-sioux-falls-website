import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/Button';
import Icon from '../../components/Icon';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const ROLE_ORDER = { admin: 0, volunteer: 1, neighbor: 2 };
const ROLE_LABEL = { admin: 'Admin', volunteer: 'Volunteer', neighbor: 'Neighbor' };

// Staff & volunteer login. The list of names only shows up here, never on
// the public pages. Pick your name, type your PIN.
export default function LoginPage() {
  const { login } = useAuth();
  const [names, setNames] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [selected, setSelected] = useState(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const pinRef = useRef(null);

  function loadNames() {
    setLoadFailed(false);
    api
      .getNames()
      .then((list) => setNames([...list].sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role] || a.name.localeCompare(b.name))))
      .catch(() => setLoadFailed(true));
  }

  useEffect(loadNames, []);

  useEffect(() => {
    if (selected) pinRef.current?.focus();
  }, [selected]);

  async function handleLogin(e) {
    e.preventDefault();
    if (!selected || !pin) return;
    setLoading(true);
    setError('');
    try {
      await login(selected._id, pin);
      // App.jsx sees the new user and shows the right home.
    } catch (err) {
      setError(err.message);
      setPin('');
      pinRef.current?.focus();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <div style={{ width: '100%', maxWidth: 460 }}>
        <Link to="/" className="brand" style={{ marginBottom: 20 }}>
          <img src="/brand/heart.png" alt="" style={{ height: 52 }} />
          <span className="brand-name">Feed Sioux Falls</span>
        </Link>

        <form className="card login-card" onSubmit={handleLogin}>
          <h1 className="h1">Staff & volunteer log in</h1>
          <p className="body-text" style={{ marginTop: 6 }}>
            Tap your name, then type your PIN.
          </p>

          {loadFailed && (
            <div style={{ marginTop: 16 }}>
              <p className="error-text">Couldn't load the list of names. Check your internet connection.</p>
              <Button title="Try again" variant="outline" onClick={loadNames} small style={{ marginTop: 8 }} />
            </div>
          )}
          {!names && !loadFailed && <p className="body-muted" style={{ marginTop: 16 }}>Loading names…</p>}

          {names && (
            <div className="name-list" role="group" aria-label="Who are you?">
              {names.map((u) => (
                <button
                  key={u._id}
                  type="button"
                  className="name-option"
                  aria-pressed={selected?._id === u._id}
                  onClick={() => {
                    setSelected(u);
                    setPin('');
                    setError('');
                  }}
                >
                  <span>{u.name}</span>
                  <span className="pill pill-muted" style={{ color: 'inherit', borderColor: 'currentColor', background: 'transparent' }}>
                    {ROLE_LABEL[u.role] || u.role}
                  </span>
                </button>
              ))}
            </div>
          )}

          {selected && (
            <div className="stack gap-sm">
              <label className="field-label" htmlFor="pin">
                PIN for {selected.name.split(' ')[0]}
              </label>
              <input
                id="pin"
                ref={pinRef}
                className="field-input pin-input"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                inputMode="numeric"
                type="password"
                autoComplete="current-password"
                maxLength={6}
                placeholder="••••"
              />
              {error && (
                <p className="error-text" role="alert">
                  {error}
                </p>
              )}
              <Button type="submit" title="Log in" loading={loading} disabled={pin.length < 4} block style={{ marginTop: 8 }} />
            </div>
          )}
        </form>

        <p style={{ marginTop: 20 }}>
          <Link to="/" className="text-link">
            <Icon name="chevronLeft" /> Back to the website
          </Link>
        </p>
      </div>
    </div>
  );
}
