import React from 'react';
import Layout from '../components/Layout';
import PantryInfo from '../components/PantryInfo';
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

      <PantryInfo />

      <SurveyInvite />

      <SupportForms />
    </Layout>
  );
}
