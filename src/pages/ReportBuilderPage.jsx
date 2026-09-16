import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import { api } from '../api/client';

const DATE_PRESETS = [
  { key: 'month', label: 'This Month' },
  { key: 'quarter', label: 'Last 3 Months' },
  { key: 'year', label: 'This Year' },
  { key: 'custom', label: 'Custom' },
];

const SECTIONS = [
  { key: 'peopleServed', label: 'People Served Over Time' },
  { key: 'eventsHeld', label: 'Distribution Events Over Time' },
  { key: 'spending', label: 'Money Spent Over Time' },
  { key: 'donations', label: 'Donations Over Time' },
  { key: 'spendByCategory', label: 'Spending by Category' },
  { key: 'topItems', label: 'Most Distributed Items' },
  { key: 'inventory', label: 'Current Inventory Snapshot' },
];

const PIE_COLORS = ['var(--color-primary)', 'var(--color-accent)', 'var(--color-secondary)'];

function presetRange(key) {
  const now = new Date();
  if (key === 'month') {
    return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now, groupBy: 'week' };
  }
  if (key === 'quarter') {
    return { start: new Date(now.getFullYear(), now.getMonth() - 2, 1), end: now, groupBy: 'month' };
  }
  if (key === 'year') {
    return { start: new Date(now.getFullYear(), 0, 1), end: now, groupBy: 'month' };
  }
  return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now, groupBy: 'week' };
}

function formatShortDate(d) {
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function toInputDate(d) {
  return d.toISOString().slice(0, 10);
}

// A simple horizontal-bar row for lists where labels are too long/plentiful
// for a squeezed chart x-axis (item names, inventory).
function BarRow({ label, value, max, color, sublabel }) {
  const pct = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0;
  return (
    <div style={{ marginBottom: 'var(--space-sm)' }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className="body-text">{label}</span>
        <span className="body-muted">{value}</span>
      </div>
      {!!sublabel && <span className="body-muted">{sublabel}</span>}
      <div className="progress-track" style={{ height: 8, marginTop: 'var(--space-xs)' }}>
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function ChartSection({ title, children }) {
  return (
    <Card style={{ marginBottom: 'var(--space-md)' }}>
      <p className="h2" style={{ marginBottom: 'var(--space-sm)' }}>
        {title}
      </p>
      {children}
    </Card>
  );
}

function SummaryGrid({ summary }) {
  const stats = [
    { label: 'Events Held', value: summary.eventsHeld },
    { label: 'People Served', value: summary.peopleServed },
    { label: 'Avg per Event', value: summary.avgPeoplePerEvent },
    { label: 'Total Spent', value: `$${summary.totalSpent.toFixed(2)}` },
    { label: 'Total Donations', value: `$${summary.totalDonations.toFixed(2)}` },
    {
      label: 'Cost per Person Served',
      value: summary.costPerPersonServed != null ? `$${summary.costPerPersonServed.toFixed(2)}` : '—',
    },
  ];
  return (
    <Card style={{ marginBottom: 'var(--space-md)' }}>
      <div className="row-wrap">
        {stats.map((s) => (
          <div key={s.label} style={{ width: '50%', marginBottom: 'var(--space-md)' }}>
            <p className="body-muted">{s.label}</p>
            <p className="h1">{s.value}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function ReportBuilderPage() {
  const initial = presetRange('month');
  const [preset, setPreset] = useState('month');
  const [start, setStart] = useState(initial.start);
  const [end, setEnd] = useState(initial.end);
  const [groupBy, setGroupBy] = useState(initial.groupBy);
  const [sections, setSections] = useState(SECTIONS.reduce((acc, s) => ({ ...acc, [s.key]: true }), {}));
  const [narrative, setNarrative] = useState('');

  const [mode, setMode] = useState('builder'); // 'builder' | 'preview'
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  function selectPreset(key) {
    setPreset(key);
    if (key !== 'custom') {
      const range = presetRange(key);
      setStart(range.start);
      setEnd(range.end);
      setGroupBy(range.groupBy);
    }
  }

  function toggleSection(key) {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleGenerate() {
    if (start > end) {
      setError('Start date must be before end date.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await api.getCustomReport({ start: start.toISOString(), end: end.toISOString(), groupBy });
      setReport(data);
      setMode('preview');
    } catch (err) {
      setError('Could not generate report: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  if (mode === 'preview' && report) {
    return (
      <Layout>
        <div className="row no-print" style={{ justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
          <p className="h1">Report Preview</p>
          <Button title="Edit" variant="outline" small onClick={() => setMode('builder')} />
        </div>
        <p className="body-muted" style={{ marginBottom: 'var(--space-lg)' }}>
          {formatShortDate(start)} - {formatShortDate(end)}
        </p>

        <SummaryGrid summary={report.summary} />

        {sections.peopleServed && report.peopleServedByPeriod.length > 0 && (
          <ChartSection title="People Served Over Time">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={report.peopleServedByPeriod}>
                <CartesianGrid stroke="var(--color-border)" />
                <XAxis dataKey="label" stroke="var(--color-text-muted)" fontSize={12} />
                <YAxis stroke="var(--color-text-muted)" fontSize={12} />
                <Tooltip />
                <Bar dataKey="value" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartSection>
        )}

        {sections.eventsHeld && report.eventsByPeriod.length > 0 && (
          <ChartSection title="Distribution Events Over Time">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={report.eventsByPeriod}>
                <CartesianGrid stroke="var(--color-border)" />
                <XAxis dataKey="label" stroke="var(--color-text-muted)" fontSize={12} />
                <YAxis stroke="var(--color-text-muted)" fontSize={12} />
                <Tooltip />
                <Bar dataKey="value" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartSection>
        )}

        {sections.spending && report.spendByPeriod.length > 0 && (
          <ChartSection title="Money Spent Over Time">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={report.spendByPeriod}>
                <CartesianGrid stroke="var(--color-border)" />
                <XAxis dataKey="label" stroke="var(--color-text-muted)" fontSize={12} />
                <YAxis stroke="var(--color-text-muted)" fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartSection>
        )}

        {sections.donations && report.donationsByPeriod.length > 0 && (
          <ChartSection title="Donations Over Time">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={report.donationsByPeriod}>
                <CartesianGrid stroke="var(--color-border)" />
                <XAxis dataKey="label" stroke="var(--color-text-muted)" fontSize={12} />
                <YAxis stroke="var(--color-text-muted)" fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="var(--color-accent)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartSection>
        )}

        {sections.spendByCategory && report.spendByCategory.length > 0 && (
          <ChartSection title="Spending by Category">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={report.spendByCategory}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => `${entry.category} ($${entry.amount.toFixed(0)})`}
                >
                  {report.spendByCategory.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartSection>
        )}

        {sections.topItems && report.topItems.length > 0 && (
          <ChartSection title="Most Distributed Items">
            {report.topItems.map((item) => (
              <BarRow
                key={item.name}
                label={item.name}
                value={item.quantityDistributed}
                max={report.topItems[0].quantityDistributed}
                color="var(--color-accent)"
              />
            ))}
          </ChartSection>
        )}

        {sections.inventory && report.inventorySnapshot.length > 0 && (
          <ChartSection title="Current Inventory Snapshot">
            <p className="body-muted" style={{ marginBottom: 'var(--space-sm)' }}>
              As of today - not reconstructed for the report's date range.
            </p>
            {report.inventorySnapshot.map((item) => (
              <BarRow
                key={item.name}
                label={item.name}
                value={item.currentStock}
                max={Math.max(...report.inventorySnapshot.map((i) => i.currentStock), 1)}
                color={item.isLow ? 'var(--color-danger)' : 'var(--color-primary)'}
                sublabel={item.isLow ? 'LOW STOCK' : undefined}
              />
            ))}
          </ChartSection>
        )}

        {!!narrative.trim() && (
          <Card style={{ marginBottom: 'var(--space-md)' }}>
            <p className="h2" style={{ marginBottom: 'var(--space-sm)' }}>
              Notes
            </p>
            <p className="body-text" style={{ whiteSpace: 'pre-wrap' }}>
              {narrative}
            </p>
          </Card>
        )}

        <p className="body-muted" style={{ marginBottom: 'var(--space-lg)', fontStyle: 'italic' }}>
          {report.methodologyNote}
        </p>

        <Button title="Print / Save as PDF" onClick={() => window.print()} block className="no-print" />
      </Layout>
    );
  }

  return (
    <Layout>
      <p className="h1" style={{ marginBottom: 'var(--space-md)' }}>
        Build a Report
      </p>

      <label className="field-label" style={{ marginTop: 0 }}>
        Date Range
      </label>
      <div className="row-wrap gap-xs" style={{ marginBottom: 'var(--space-sm)' }}>
        {DATE_PRESETS.map((p) => (
          <Button key={p.key} title={p.label} small variant={preset === p.key ? 'primary' : 'outline'} onClick={() => selectPreset(p.key)} />
        ))}
      </div>

      {preset === 'custom' && (
        <div className="row gap-sm" style={{ marginBottom: 'var(--space-md)' }}>
          <input
            className="field-input"
            type="date"
            value={toInputDate(start)}
            onChange={(e) => setStart(new Date(e.target.value))}
            style={{ flex: 1 }}
          />
          <input
            className="field-input"
            type="date"
            value={toInputDate(end)}
            onChange={(e) => setEnd(new Date(e.target.value))}
            style={{ flex: 1 }}
          />
        </div>
      )}

      <label className="field-label" style={{ marginTop: 'var(--space-md)' }}>
        Group Charts By
      </label>
      <div className="row gap-sm" style={{ marginBottom: 'var(--space-md)' }}>
        {['week', 'month', 'year'].map((g) => (
          <Button key={g} title={g[0].toUpperCase() + g.slice(1)} small variant={groupBy === g ? 'primary' : 'outline'} onClick={() => setGroupBy(g)} style={{ flex: 1 }} />
        ))}
      </div>

      <label className="field-label" style={{ marginTop: 'var(--space-md)' }}>
        What do you want on your report?
      </label>
      <Card style={{ marginBottom: 'var(--space-md)' }}>
        <div className="stack gap-sm">
          {SECTIONS.map((s) => (
            <Button
              key={s.key}
              title={`${sections[s.key] ? '✓ ' : ''}${s.label}`}
              variant={sections[s.key] ? 'primary' : 'outline'}
              onClick={() => toggleSection(s.key)}
              block
            />
          ))}
        </div>
      </Card>

      <label className="field-label">Notes for this report (optional)</label>
      <textarea
        className="field-textarea"
        value={narrative}
        onChange={(e) => setNarrative(e.target.value)}
        placeholder="Qualitative context for grant reviewers - stories, changes observed, needs identified…"
        rows={4}
        style={{ marginBottom: 'var(--space-lg)' }}
      />

      {!!error && <p className="body-muted" style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-sm)' }}>{error}</p>}

      <Button title="Generate Preview" onClick={handleGenerate} loading={loading} block />
    </Layout>
  );
}
