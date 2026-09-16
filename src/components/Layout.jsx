import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Logged-in screens (staff and neighbor) all get this header, so there's
// always a way to log out no matter which page someone's on.
export default function Layout({ title, children }) {
  const { logout } = useAuth();

  function confirmLogout() {
    if (window.confirm('Log out? You can log back in anytime.')) {
      logout();
    }
  }

  return (
    <div className="stack" style={{ minHeight: '100vh' }}>
      <div className="header-bar no-print">
        <Link to="/" className="header-title">
          {title || 'Feed Sioux Falls'}
        </Link>
        <button className="link-button" style={{ fontWeight: 600 }} onClick={confirmLogout}>
          Log Out
        </button>
      </div>
      <div className="page" style={{ flex: 1, width: '100%' }}>
        {children}
      </div>
    </div>
  );
}
