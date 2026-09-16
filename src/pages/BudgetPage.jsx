import React, { useCallback, useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import { api } from '../api/client';

export default function BudgetPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const result = await api.getCurrentBudget();
      setData(result);
    } catch (err) {
      setError('Could not load budget: ' + err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!data) {
    return (
      <Layout>
        <p className="body-text">{error || 'Loading budget…'}</p>
      </Layout>
    );
  }

  const percentSpent = Math.min(100, Math.round((data.amountSpent / data.budget.totalBudget) * 100));
  const isOverBudget = data.remaining < 0;

  return (
    <Layout>
      <p className="h1">{data.budget.month} Budget</p>

      <Card style={{ marginTop: 'var(--space-lg)' }}>
        <p className="body-muted">Remaining</p>
        <p className="tally-number" style={{ fontSize: 48, color: isOverBudget ? 'var(--color-danger)' : 'var(--color-primary)' }}>
          ${data.remaining.toFixed(0)}
        </p>
        <p className="body-muted">
          ${data.amountSpent.toFixed(0)} spent of ${data.budget.totalBudget.toFixed(0)}
        </p>

        <div className="progress-track" style={{ marginTop: 'var(--space-md)' }}>
          <div
            className="progress-fill"
            style={{
              width: `${percentSpent}%`,
              background: isOverBudget ? 'var(--color-danger)' : 'var(--color-accent)',
            }}
          />
        </div>
      </Card>

      <p className="h2" style={{ marginTop: 'var(--space-lg)', marginBottom: 'var(--space-sm)' }}>
        By Category
      </p>
      <div className="stack gap-sm">
        {Object.entries(data.spentByCategory).map(([category, amount]) => (
          <Card key={category}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span className="body-text">{category}</span>
              <span className="body-text">${amount.toFixed(2)}</span>
            </div>
          </Card>
        ))}
      </div>

      <p className="h2" style={{ marginTop: 'var(--space-lg)', marginBottom: 'var(--space-sm)' }}>
        Recent Purchases
      </p>
      <div className="stack gap-sm">
        {data.purchases.slice(0, 10).map((p) => (
          <Card key={p._id}>
            <p className="body-text">{p.item?.name || 'Unknown item'}</p>
            <p className="body-muted">
              {p.quantity} × ${(p.cost / p.quantity).toFixed(2)} = ${p.cost.toFixed(2)}
            </p>
          </Card>
        ))}
      </div>
    </Layout>
  );
}
