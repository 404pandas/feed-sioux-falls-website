import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import SupportForms from '../components/SupportForms';
import SurveyInvite from '../components/SurveyInvite';

export default function GuestHomePage() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <p className="h1">Support Feed Sioux Falls</p>
      <p className="body-muted" style={{ marginTop: 'var(--space-xs)', marginBottom: 'var(--space-lg)' }}>
        Every dollar goes toward hygiene and winter supplies for the pantry.
      </p>

      <SurveyInvite />

      <SupportForms />

      <Button
        title="Volunteer / Admin Login"
        variant="outline"
        onClick={() => navigate('/')}
        style={{ marginTop: 'var(--space-lg)' }}
        block
      />
    </div>
  );
}
