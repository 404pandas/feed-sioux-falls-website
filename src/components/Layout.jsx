import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import Icon from './Icon';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

// The staff app frame: header with who's logged in, a sidebar on computers,
// and a bottom tab bar on phones. Every staff page renders inside it (v1
// pages already called <Layout>, so they moved in without changes).
//
// back: omit for no back link, pass { to, label } for one.
// narrow: keep the page to a comfortable reading width.

const MAIN = [
  { to: '/dashboard', label: 'Home', icon: 'home' },
  { to: '/today', label: 'Count people', short: 'Count', icon: 'counter' },
  { to: '/inventory', label: 'Inventory', icon: 'box' },
  { to: '/survey', label: 'Take a survey', short: 'Survey', icon: 'clipboard' },
];

const ADMIN_RUN = [
  { to: '/messages', label: 'Messages', icon: 'mail', badge: 'messages' },
  { to: '/survey/results', label: 'Survey results', icon: 'chart', badge: 'contactRequests' },
  { to: '/survey/responses', label: 'Survey responses', icon: 'list' },
  { to: '/budget', label: 'Budget', icon: 'wallet' },
  { to: '/reports', label: 'Reports', icon: 'chart' },
  { to: '/events', label: 'Past events', icon: 'calendar' },
];

const ADMIN_DATA = [
  { to: '/data/users', label: 'People & logins', icon: 'people' },
  { to: '/data', label: 'All data', icon: 'database' },
  { to: '/data/auditLog', label: 'Change log', icon: 'history' },
];

// Unread counts for the badges, shared across pages for a minute so moving
// around the app doesn't refetch them every time.
let badgeCache = { at: 0, value: null };
function useBadges(isAdmin) {
  const [badges, setBadges] = useState(badgeCache.value || {});
  useEffect(() => {
    if (!isAdmin) return undefined;
    if (badgeCache.value && Date.now() - badgeCache.at < 60000) return undefined;
    let cancelled = false;
    Promise.all([
      api.admin.list('contactMessages', { resolved: 'false', limit: 1 }).catch(() => null),
      api.admin.list('surveyContactRequests', { resolved: 'false', limit: 1 }).catch(() => null),
    ]).then(([m, c]) => {
      const value = { messages: m?.total || 0, contactRequests: c?.total || 0 };
      badgeCache = { at: Date.now(), value };
      if (!cancelled) setBadges(value);
    });
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);
  return badges;
}

export function clearBadgeCache() {
  badgeCache = { at: 0, value: null };
}

function NavItem({ item, badges, className = 'sidebar-link' }) {
  const count = item.badge ? badges[item.badge] : 0;
  return (
    <NavLink to={item.to} end className={className}>
      <Icon name={item.icon} />
      <span>{className === 'tab-link' ? item.short || item.label : item.label}</span>
      {count > 0 && (
        <span className="badge" aria-label={`${count} new`}>
          {count}
        </span>
      )}
    </NavLink>
  );
}

function NavGroups({ isAdmin, badges }) {
  return (
    <>
      {isAdmin && (
        <>
          <p className="sidebar-group">Run the pantry</p>
          {ADMIN_RUN.map((item) => (
            <NavItem key={item.to} item={item} badges={badges} />
          ))}
          <p className="sidebar-group">Database</p>
          {ADMIN_DATA.map((item) => (
            <NavItem key={item.to} item={item} badges={badges} />
          ))}
        </>
      )}
      <p className="sidebar-group">Public</p>
      <NavLink to="/site" className="sidebar-link">
        <Icon name="globe" />
        <span>Public website</span>
      </NavLink>
    </>
  );
}

export default function Layout({ title, back, narrow, children }) {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';
  const badges = useBadges(isAdmin);
  const [moreOpen, setMoreOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.title = title ? `${title} · Feed Sioux Falls` : 'Feed Sioux Falls';
  }, [title]);

  function confirmLogout() {
    if (window.confirm('Log out? You can log back in anytime.')) logout();
  }

  const moreBadge = (badges.messages || 0) + (badges.contactRequests || 0);
  const inMain = MAIN.some((i) => i.to === pathname);

  return (
    <div className="app">
      <a href="#app-main" className="skip-link">
        Skip to content
      </a>
      <header className="app-top no-print">
        <Link to="/dashboard" className="brand" aria-label="Staff home">
          <img src="/brand/heart.png" alt="" />
          <span className="brand-name">Feed Sioux Falls</span>
        </Link>
        <div className="app-user">
          <span className="who">{user?.name}</span>
          <button className="btn btn-outline btn-small" onClick={confirmLogout}>
            <Icon name="logout" /> Log out
          </button>
        </div>
      </header>

      <div className="app-body">
        <nav className="sidebar no-print" aria-label="Staff">
          <div style={{ height: 12 }} />
          {MAIN.map((item) => (
            <NavItem key={item.to} item={item} badges={badges} />
          ))}
          <NavGroups isAdmin={isAdmin} badges={badges} />
        </nav>

        <main id="app-main" className={`app-main${narrow ? ' is-narrow' : ''}`}>
          <div className="page-inner">
            {back && (
              <Link to={back.to} className="back-link no-print">
                <Icon name="chevronLeft" />
                {back.label}
              </Link>
            )}
            {children}
          </div>
        </main>
      </div>

      <nav className="tabbar no-print" aria-label="Staff shortcuts" style={{ '--tabs': 5 }}>
        {MAIN.map((item) => (
          <NavItem key={item.to} item={item} badges={badges} className="tab-link" />
        ))}
        <button
          className="tab-link"
          aria-current={!inMain && !moreOpen ? 'page' : undefined}
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen(true)}
        >
          <Icon name="more" />
          <span>More</span>
          {moreBadge > 0 && <span className="badge">{moreBadge}</span>}
        </button>
      </nav>

      {moreOpen && (
        <>
          <div className="sheet-backdrop" onClick={() => setMoreOpen(false)} aria-hidden="true" />
          <div className="sheet" role="dialog" aria-modal="true" aria-label="More pages">
            <div className="sheet-handle" />
            <NavGroups isAdmin={isAdmin} badges={badges} />
            <button
              className="sidebar-link link-button"
              style={{ width: 'calc(100% - 16px)' }}
              onClick={confirmLogout}
            >
              <Icon name="logout" />
              <span>Log out</span>
            </button>
            <button
              className="sidebar-link link-button"
              style={{ width: 'calc(100% - 16px)' }}
              onClick={() => setMoreOpen(false)}
            >
              <Icon name="close" />
              <span>Close</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
