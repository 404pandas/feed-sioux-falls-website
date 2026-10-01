import React from 'react';
import Card from './Card';

// Where and when to get food - shown to guests and logged-in neighbors.
export default function PantryInfo() {
  return (
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
  );
}
