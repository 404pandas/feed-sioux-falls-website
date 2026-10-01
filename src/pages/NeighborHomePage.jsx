import React from 'react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import SupportForms from '../components/SupportForms';
import SurveyInvite from '../components/SurveyInvite';
import { useAuth } from '../context/AuthContext';

export default function NeighborHomePage() {
  const { user } = useAuth();

  return (
    <Layout>
      <p className="h1">Hi, {user?.name?.split(' ')[0]}</p>
      <p className="body-muted" style={{ marginTop: 'var(--space-xs)', marginBottom: 'var(--space-lg)' }}>
        Glad you're here. Here's what's available and how to reach us.
      </p>

      <Card style={{ marginBottom: 'var(--space-lg)' }}>
        <p className="h2" style={{ marginBottom: 'var(--space-sm)' }}>
          Pantry Hours &amp; Location
        </p>
        <p className="body-text">2809 S Spring Ave, Sioux Falls, SD 57105</p>
        <p className="body-muted" style={{ marginTop: 'var(--space-xs)' }}>
          Open 24/7 - shelves, fridge, and freezer available. Fridge/freezer use a child lock
          (required by city ordinance) that's freely available to open.
        </p>
        <p className="body-muted" style={{ marginTop: 'var(--space-xs)' }}>
          Located on the side of Vital Animal Veterinary Clinic - not affiliated with the
          veterinary business.
        </p>

        <p className="h2" style={{ marginTop: 'var(--space-md)', marginBottom: 'var(--space-sm)' }}>
          Weekly Outreach
        </p>
        <p className="body-text">Saturdays, 10-11am CST</p>
        <p className="body-muted">Heritage Park, Weber Ave, Sioux Falls, SD</p>
      </Card>

      <SurveyInvite />

      <SupportForms />
    </Layout>
  );
}
