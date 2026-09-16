import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [names, setNames] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getNames().then(setNames).catch(() => setNames([]));
  }, []);

  async function handleLogin() {
    if (!selectedUser || !pin) return;
    setLoading(true);
    setError('');
    try {
      await login(selectedUser._id, pin);
      // Navigation happens automatically via App.jsx watching auth state.
    } catch (err) {
      setError(err.message);
      setPin('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <p className="h1">Feed Sioux Falls</p>
      <p className="body-muted" style={{ marginTop: 'var(--space-xs)', marginBottom: 'var(--space-lg)' }}>
        Bridging people who have a little extra with people who need a little extra.
      </p>

      <Card style={{ marginBottom: 'var(--space-lg)' }}>
        <p className="h2" style={{ marginBottom: 'var(--space-md)' }}>
          Volunteer / Admin Login
        </p>

        <p className="body-muted" style={{ marginBottom: 'var(--space-sm)' }}>
          Select your name
        </p>
        <div className="stack divider">
          {names.map((item) => (
            <button
              key={item._id}
              className="link-button row"
              style={{
                justifyContent: 'space-between',
                padding: 'var(--space-md) var(--space-sm)',
                borderBottom: '1px solid var(--color-border)',
                background: selectedUser?._id === item._id ? 'var(--color-background)' : 'transparent',
                borderRadius: selectedUser?._id === item._id ? 'var(--radius-sm)' : 0,
                textAlign: 'left',
              }}
              onClick={() => setSelectedUser(item)}
            >
              <span className="body-text">{item.name}</span>
              <span className="body-muted">{item.role}</span>
            </button>
          ))}
        </div>

        {selectedUser && (
          <div style={{ marginTop: 'var(--space-md)' }}>
            <p className="body-muted" style={{ marginBottom: 'var(--space-sm)' }}>
              Enter your PIN
            </p>
            <input
              className="field-input"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              inputMode="numeric"
              type="password"
              maxLength={6}
              placeholder="••••"
              style={{ fontSize: 24, letterSpacing: 8, textAlign: 'center' }}
            />
            {!!error && (
              <p className="body-muted" style={{ color: 'var(--color-danger)', marginTop: 'var(--space-sm)' }}>
                {error}
              </p>
            )}
            <Button
              title="Log In"
              onClick={handleLogin}
              loading={loading}
              disabled={!pin}
              style={{ marginTop: 'var(--space-md)' }}
              block
            />
          </div>
        )}
      </Card>

      <Button title="Continue as Guest" variant="outline" onClick={() => navigate('/support')} block />
    </div>
  );
}
