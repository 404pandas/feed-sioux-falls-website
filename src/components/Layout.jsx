import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Logged-in screens (staff and neighbor) all get this header, so there's
// always a way to log out no matter which page someone's on - plus a
// visible back link on every page except home.
//
// back: omit for "← Home" (hidden on the home page itself), pass
// { to, label } to go somewhere more specific, or false to hide it.
export default function Layout({ title, back, children }) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  const backLink = back === false ? null : back || (pathname !== '/' ? { to: '/', label: 'Home' } : null);

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
        <div className="row gap-md">
          {user?.name && <span className="header-user">{user.name.split(' ')[0]}</span>}
          <button className="link-button header-action" onClick={confirmLogout}>
            Log Out
          </button>
        </div>
      </div>
      <div className="page" style={{ flex: 1, width: '100%' }}>
        {backLink && (
          <Link to={backLink.to} className="back-link no-print">
            <span aria-hidden="true">←</span>
            {backLink.label}
          </Link>
        )}
        {children}
      </div>
    </div>
  );
}
