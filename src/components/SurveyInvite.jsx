import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from './Card';
import Button from './Button';

// Points guests and neighbors to the community survey (/survey).
export default function SurveyInvite() {
  const navigate = useNavigate();
  return (
    <Card style={{ marginBottom: 'var(--space-lg)' }}>
      <p className="h2" style={{ marginBottom: 'var(--space-xs)' }}>
        Sioux Falls Community Survey
      </p>
      <p className="body-muted" style={{ marginBottom: 'var(--space-md)' }}>
        Help City Council understand what people in our city need. About 3 minutes, every question optional, no name needed.
        <span lang="es"> También en español.</span>
      </p>
      <Button title="Take the survey" variant="accent" onClick={() => navigate('/survey')} block />
    </Card>
  );
}
