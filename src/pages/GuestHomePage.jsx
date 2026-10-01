import React from 'react';
import GuestLayout from '../components/GuestLayout';
import PantryInfo from '../components/PantryInfo';
import SupportForms from '../components/SupportForms';
import SurveyInvite from '../components/SurveyInvite';

export default function GuestHomePage() {
  return (
    <GuestLayout>
      <p className="h1">Feed Sioux Falls</p>
      <p className="body-muted" style={{ marginTop: 'var(--space-xs)', marginBottom: 'var(--space-lg)' }}>
        Get food and supplies, reach out, or help out. Every dollar goes toward hygiene and winter supplies for the pantry.
      </p>

      <PantryInfo />

      <SurveyInvite />

      <SupportForms />
    </GuestLayout>
  );
}
