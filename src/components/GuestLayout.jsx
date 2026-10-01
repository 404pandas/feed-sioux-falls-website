import React from 'react';
import { Link } from 'react-router-dom';

// Header for public pages once a guest has moved past the landing page,
// so getting back home or to the login is always one tap away.
export default function GuestLayout({ children }) {
  return (
    <div className="stack" style={{ minHeight: '100vh' }}>
      <div className="header-bar no-print">
        <Link to="/" className="header-title">
          Feed Sioux Falls
        </Link>
        <Link to="/" className="header-action">
          Log In
        </Link>
      </div>
      <div className="page" style={{ flex: 1, width: '100%' }}>
        <Link to="/" className="back-link no-print">
          <span aria-hidden="true">←</span>
          Home
        </Link>
        {children}
      </div>
    </div>
  );
}
