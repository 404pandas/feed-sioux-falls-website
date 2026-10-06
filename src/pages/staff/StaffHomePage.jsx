import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import Icon from '../../components/Icon';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { StatusPill, StoreLinks, formatNumber, formatOutreachDate } from '../../components/PublicData';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

// Where every volunteer and admin lands after logging in: the four things
// people do most as big buttons, then what needs attention.
export default function StaffHomePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [items, setItems] = useState(null);
  const [summary, setSummary] = useState(null);
  const [budget, setBudget] = useState(null);
  const [inbox, setInbox] = useState(null);

  useEffect(() => {
    api.getItems().then(setItems).catch(() => setItems([]));
    api.getPublicSummary().then(setSummary).catch(() => {});
    if (isAdmin) {
      api.getCurrentBudget().then(setBudget).catch(() => {});
      Promise.all([
        api.admin.list('contactMessages', { resolved: 'false', limit: 1 }),
        api.admin.list('surveyContactRequests', { resolved: 'false', limit: 1 }),
      ])
        .then(([m, c]) => setInbox({ messages: m.total, contactRequests: c.total }))
        .catch(() => {});
    }
  }, [isAdmin]);

  const out = (items || []).filter((i) => i.currentStock <= 0);
  const low = (items || []).filter((i) => i.currentStock > 0 && i.currentStock <= i.lowThreshold);
  const attention = [...out, ...low];

  return (
    <Layout title="Home">
      <div className="page-head">
        <div>
          <h1 className="h1">
            {greeting()}, {user?.name?.split(' ')[0]}
          </h1>
          <p className="sub">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            {summary?.nextOutreach && ` · Next outreach ${formatOutreachDate(summary.nextOutreach.date)}`}
          </p>
        </div>
      </div>

      <div className="action-grid">
        <Link to="/today" className="action-tile tile-teal">
          <Icon name="counter" />
          <span>
            <span className="tile-title">Count people</span>
            <br />
            <span className="tile-sub">Tap once per person served</span>
          </span>
        </Link>
        <Link to="/inventory" className="action-tile tile-coin">
          <Icon name="box" />
          <span>
            <span className="tile-title">Inventory</span>
            <br />
            <span className="tile-sub">Hand out, restock, check what's low</span>
          </span>
        </Link>
        <Link to="/survey" className="action-tile">
          <Icon name="clipboard" />
          <span>
            <span className="tile-title">Take a survey</span>
            <br />
            <span className="tile-sub">With someone, or type in a paper one</span>
          </span>
        </Link>
        {isAdmin ? (
          <Link to="/messages" className="action-tile tile-heart">
            <Icon name="mail" />
            <span>
              <span className="tile-title">Messages</span>
              <br />
              <span className="tile-sub">
                {inbox ? `${inbox.messages} new · ${inbox.contactRequests} asked to be contacted` : 'From the website'}
              </span>
            </span>
          </Link>
        ) : (
          <Link to="/site" className="action-tile tile-heart">
            <Icon name="globe" />
            <span>
              <span className="tile-title">Public website</span>
              <br />
              <span className="tile-sub">What neighbors see</span>
            </span>
          </Link>
        )}
      </div>

      <h2 className="h2" style={{ margin: '36px 0 14px' }}>
        At a glance
      </h2>
      <div className="stat-strip">
        <div className="stat">
          <span className="stat-value">{summary ? formatNumber(summary.peopleServed.thisMonth) : '–'}</span>
          <span className="stat-label">People served this month</span>
        </div>
        <div className="stat">
          <span className="stat-value">{summary ? formatNumber(summary.itemsGiven.thisMonth) : '–'}</span>
          <span className="stat-label">Items handed out this month</span>
        </div>
        <Link to="/inventory?show=out" className="stat stat-out" style={{ textDecoration: 'none' }}>
          <span className="stat-value">{items ? out.length : '–'}</span>
          <span className="stat-label">Items out of stock</span>
        </Link>
        {isAdmin && budget ? (
          <Link to="/budget" className="stat" style={{ textDecoration: 'none' }}>
            <span className="stat-value" style={{ color: budget.remaining < 0 ? 'var(--color-danger)' : undefined }}>
              ${formatNumber(Math.round(budget.remaining))}
            </span>
            <span className="stat-label">Budget left this month</span>
          </Link>
        ) : (
          <Link to="/inventory?show=low" className="stat stat-low" style={{ textDecoration: 'none' }}>
            <span className="stat-value">{items ? low.length : '–'}</span>
            <span className="stat-label">Items running low</span>
          </Link>
        )}
      </div>

      <h2 className="h2" style={{ margin: '36px 0 14px' }}>
        Needs restocking
      </h2>
      {items && attention.length === 0 && <p className="empty-note">Everything is above its low mark. Nice.</p>}
      {attention.length > 0 && (
        <ul className="need-list two-col">
          {attention.slice(0, 8).map((item) => (
            <li key={item._id} className="need">
              <div className="need-top">
                <span className="need-name">{item.name}</span>
                <StatusPill status={item.currentStock <= 0 ? 'out' : 'low'} />
              </div>
              <span className="body-muted">
                {item.currentStock} {item.unitType}
                {item.currentStock === 1 ? '' : 's'} left · low at {item.lowThreshold}
              </span>
              <StoreLinks sources={item.sources} itemName={item.name} />
            </li>
          ))}
        </ul>
      )}
      {attention.length > 8 && (
        <p style={{ marginTop: 16 }}>
          <Link className="text-link" to="/inventory?show=low">
            See all {attention.length} <Icon name="chevronRight" />
          </Link>
        </p>
      )}
    </Layout>
  );
}
