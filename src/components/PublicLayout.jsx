import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import Icon from './Icon';
import { ORG } from '../config/org';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/help', label: 'Get help' },
  { to: '/give', label: 'Give' },
  { to: '/survey', label: 'Survey' },
  { to: '/about', label: 'About us' },
];

// Every public page: header with the logo and big plain-language links,
// and a footer with every way to reach or support Feed Sioux Falls.
// The staff login is a small link here - the name list only appears on
// the login page itself.
export default function PublicLayout({ children }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const isStaff = user && user.role !== 'neighbor';

  useEffect(() => {
    setMenuOpen(false);
    window.scrollTo(0, 0);
  }, [pathname]);

  const account = user ? (
    isStaff ? (
      <Link to="/dashboard" className="btn btn-primary btn-small">
        Staff app
      </Link>
    ) : (
      <button className="login-link link-button" onClick={logout}>
        Log out {user.name.split(' ')[0]}
      </button>
    )
  ) : (
    <Link to="/login" className="login-link">
      Staff log in
    </Link>
  );

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="site-header">
        <div className="container site-header-inner">
          <Link to="/" className="brand" aria-label={`${ORG.name} home`}>
            <img src="/brand/heart.png" alt="" width="32" height="100" />
            <span className="brand-name">{ORG.name}</span>
          </Link>

          <nav className="site-nav" aria-label="Main">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end}>
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="header-actions">
            {account}
            <button
              className="menu-button"
              aria-expanded={menuOpen}
              aria-controls="site-menu"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <Icon name={menuOpen ? 'close' : 'menu'} />
              {menuOpen ? 'Close' : 'Menu'}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav id="site-menu" className="container site-menu" aria-label="Main">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end}>
                {n.label}
                <Icon name="chevronRight" />
              </NavLink>
            ))}
            {user ? (
              isStaff ? (
                <Link to="/dashboard" className="menu-small">
                  Open the staff app
                </Link>
              ) : (
                <a
                  href="#logout"
                  className="menu-small"
                  onClick={(e) => {
                    e.preventDefault();
                    logout();
                  }}
                >
                  Log out ({user.name.split(' ')[0]})
                </a>
              )
            ) : (
              <Link to="/login" className="menu-small">
                Staff & volunteer log in
              </Link>
            )}
          </nav>
        )}
      </header>

      <main id="main">{children}</main>

      <SiteFooter />
    </>
  );
}

function SiteFooter() {
  const { links } = ORG;
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <p className="footer-title">{ORG.name}</p>
            <p>{ORG.mission}</p>
            <p style={{ marginTop: 12 }}>{ORG.legal}</p>
          </div>

          <div>
            <p className="footer-title">Find us</p>
            <ul className="footer-list">
              <li>
                <a href={ORG.pantry.mapUrl} target="_blank" rel="noopener noreferrer">
                  {ORG.pantry.address}
                </a>
                <br />
                <span>Pantry open 24/7</span>
              </li>
              <li>
                <a href={`mailto:${ORG.email}`}>{ORG.email}</a>
              </li>
              <li>
                <a href={links.facebook} target="_blank" rel="noopener noreferrer">
                  Facebook
                </a>
              </li>
              <li>
                <a href={links.meetup} target="_blank" rel="noopener noreferrer">
                  Meetup (volunteer outreach group)
                </a>
              </li>
              <li>
                <a href={links.website} target="_blank" rel="noopener noreferrer">
                  feedsiouxfalls.com
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="footer-title">Give</p>
            <ul className="footer-list">
              <li>
                <a href={links.zeffy} target="_blank" rel="noopener noreferrer">
                  Donate on Zeffy
                </a>
              </li>
              <li>
                Text <strong>{ORG.textToGive.keyword}</strong> to <strong>{ORG.textToGive.number}</strong>
              </li>
              <li>
                <a href={links.pledge} target="_blank" rel="noopener noreferrer">
                  Pledge
                </a>
              </li>
              {links.amazonWishlist && (
                <li>
                  <a href={links.amazonWishlist} target="_blank" rel="noopener noreferrer">
                    Amazon wish list
                  </a>
                </li>
              )}
              <li>
                <Link to="/give">More ways to give</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>Food is a human right.</span>
          <Link to="/login">Staff & volunteer log in</Link>
        </div>
      </div>
    </footer>
  );
}
