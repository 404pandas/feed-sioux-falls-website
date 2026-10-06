import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import { api } from '../api/client';
import { PREFER_NOT, SECTIONS } from '../survey/questions';
import { getLanguage } from '../survey/languages';
import en from '../survey/strings/en';

// Groups smaller than this are shown as "fewer than 5" when hiding small
// numbers, so a printed summary can't point to one specific person (e.g.
// the only pregnant veteran in the northeast).
const SMALL_GROUP = 5;

const SOURCE_LABELS = { self: 'On their own', volunteer: 'With a volunteer', paper: 'Paper, typed in later' };

function toInputDate(d) {
  return d.toISOString().slice(0, 10);
}

function formatMonth(month) {
  const [y, m] = month.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

function CountLabel({ count, hideSmall, compact }) {
  if (hideSmall && count > 0 && count < SMALL_GROUP) return compact ? <>&lt;{SMALL_GROUP}</> : <>fewer than {SMALL_GROUP}</>;
  return <>{count}</>;
}

function QuestionSummary({ question, summary, hideSmall }) {
  const copy = en.q[question.id];
  if (question.type === 'text') {
    return (
      <div className="survey-result">
        <p className="body-text" style={{ fontWeight: 600 }}>
          {copy.label}
        </p>
        <p className="body-muted">
          {summary.answered} written answers. Read them under Comments below.
        </p>
      </div>
    );
  }

  const rows = [...question.options, PREFER_NOT]
    .map((code) => ({ code, label: code === PREFER_NOT ? 'Prefer not to say' : copy.options[code], count: summary.counts[code] || 0 }))
    .filter((r) => r.count > 0 || r.code !== PREFER_NOT);

  return (
    <div className="survey-result">
      <p className="body-text" style={{ fontWeight: 600 }}>
        {copy.label}
      </p>
      <p className="body-muted">
        {summary.answered} answered{question.type === 'multi' ? ' · people could pick more than one' : ''}
      </p>
      <div className="stack gap-xs" style={{ marginTop: 'var(--space-sm)' }}>
        {rows.map((r) => {
          const pct = summary.answered ? Math.round((r.count / summary.answered) * 100) : 0;
          const hidden = hideSmall && r.count > 0 && r.count < SMALL_GROUP;
          return (
            <div key={r.code} className="survey-result-row">
              <span className="survey-result-label">{r.label}</span>
              <span className="progress-track survey-result-bar" aria-hidden="true">
                <span className="progress-fill" style={{ display: 'block', width: hidden ? 0 : `${pct}%`, background: 'var(--color-primary)' }} />
              </span>
              <span className="survey-result-count">
                <CountLabel count={r.count} hideSmall={hideSmall} />
                {!hidden && r.count > 0 ? ` (${pct}%)` : ''}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Admin-only. The top half (totals and per-question counts) is what's meant
// to be shared with City Council; comments and contact requests below it
// are for Feed Sioux Falls only and are left off the printout.
export default function SurveyResultsPage() {
  const navigate = useNavigate();
  const now = new Date();
  const [start, setStart] = useState(toInputDate(new Date(now.getFullYear(), 0, 1)));
  const [end, setEnd] = useState(toInputDate(now));
  const [hideSmall, setHideSmall] = useState(true);
  const [summary, setSummary] = useState(null);
  const [comments, setComments] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { start, end };
      const [s, c, r] = await Promise.all([
        api.getSurveySummary(params),
        api.getSurveyComments(params),
        api.getSurveyContactRequests(),
      ]);
      setSummary(s);
      setComments(c);
      setContacts(r);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [start, end]);

  useEffect(() => {
    load();
  }, [load]);

  async function resolve(id) {
    try {
      await api.resolveSurveyContactRequest(id);
      setContacts((list) => list.filter((c) => c._id !== id));
    } catch (err) {
      alert('Could not mark that as handled: ' + err.message);
    }
  }

  const repeat = summary?.questions.repeat;

  return (
    <Layout title="Survey Results">
      <div className="stack gap-lg">
        <div>
          <p className="h1">Community Survey Results</p>
          <p className="body-muted" style={{ marginTop: 'var(--space-xs)' }}>
            Totals only. No one's own answers are shown here.
          </p>
        </div>

        <Card className="no-print">
          <div className="row-wrap gap-md">
            <label style={{ flex: 1, minWidth: 140 }}>
              <span className="field-label" style={{ marginTop: 0 }}>
                From
              </span>
              <input type="date" className="field-input" value={start} onChange={(e) => setStart(e.target.value)} />
            </label>
            <label style={{ flex: 1, minWidth: 140 }}>
              <span className="field-label" style={{ marginTop: 0 }}>
                To
              </span>
              <input type="date" className="field-input" value={end} onChange={(e) => setEnd(e.target.value)} />
            </label>
          </div>
          <label className="row gap-sm" style={{ marginTop: 'var(--space-md)' }}>
            <input type="checkbox" checked={hideSmall} onChange={(e) => setHideSmall(e.target.checked)} />
            <span className="body-text">Hide groups smaller than {SMALL_GROUP} (recommended before sharing)</span>
          </label>
          <div className="row-wrap gap-sm" style={{ marginTop: 'var(--space-md)' }}>
            <Button title="Print for City Council" small onClick={() => window.print()} />
            <Button title="Read responses one by one" variant="primary" small onClick={() => navigate('/survey/responses')} />
            <Button title="Open the survey" variant="outline" small onClick={() => navigate('/survey')} />
            <Button title="Paper survey & flyer" variant="outline" small onClick={() => navigate('/survey/print')} />
          </div>
        </Card>

        {loading && <p className="body-muted">Loading…</p>}
        {!!error && (
          <div className="stack gap-sm">
            <p className="body-muted" style={{ color: 'var(--color-danger)' }}>
              {error}
            </p>
            <Button title="Retry" onClick={load} small />
          </div>
        )}

        {summary && !loading && (
          <>
            <div className="survey-stat-row">
              <Card className="survey-stat">
                <p className="tally-number survey-stat-number">{summary.total}</p>
                <p className="body-muted">{summary.total === 1 ? 'survey' : 'surveys'}</p>
              </Card>
              <Card className="survey-stat">
                <p className="tally-number survey-stat-number">
                  <CountLabel count={repeat.counts.first_time || 0} hideSmall={hideSmall} compact />
                </p>
                <p className="body-muted">said it was their first time</p>
              </Card>
            </div>
            <p className="body-muted">
              "First time" is the closest count of different people. Repeat surveys show how things change for people over
              time.
            </p>

            {summary.byMonth.length > 0 && (
              <Card>
                <p className="h2" style={{ marginBottom: 'var(--space-md)' }}>
                  Surveys by month
                </p>
                <div style={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer>
                    <BarChart data={summary.byMonth.map((m) => ({ label: formatMonth(m.month), count: m.count }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="label" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" name="Surveys" fill="var(--color-primary)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}

            <Card>
              <p className="h2">How surveys were filled out</p>
              <p className="body-text" style={{ marginTop: 'var(--space-sm)' }}>
                {Object.entries(summary.bySource)
                  .filter(([, n]) => n > 0)
                  .map(([k, n]) => `${SOURCE_LABELS[k] || k}: ${n}`)
                  .join(' · ') || 'None yet'}
              </p>
              <p className="body-text">
                {Object.entries(summary.byLanguage)
                  .map(([code, n]) => `${getLanguage(code).englishName}: ${n}`)
                  .join(' · ')}
              </p>
            </Card>

            {SECTIONS.filter((s) => s.questions.length).map((section) => (
              <Card key={section.id}>
                <p className="h2" style={{ marginBottom: 'var(--space-md)' }}>
                  {en.sections[section.id]}
                </p>
                <div className="stack gap-lg">
                  {section.questions.map((q) => (
                    <QuestionSummary key={q.id} question={q} summary={summary.questions[q.id]} hideSmall={hideSmall} />
                  ))}
                </div>
              </Card>
            ))}

            <div className="no-print stack gap-lg">
              <Card>
                <p className="h2">Comments</p>
                <p className="body-muted" style={{ marginTop: 'var(--space-xs)', marginBottom: 'var(--space-md)' }}>
                  Feed Sioux Falls only. Shown in random order, with the month only. Before quoting anything to City Council, take
                  out names, places, or details that could point to someone.
                </p>
                {comments.length === 0 ? (
                  <p className="body-muted">No written answers in this date range.</p>
                ) : (
                  <div className="stack gap-md">
                    {comments.map((c, i) => (
                      <div key={i} className="survey-comment">
                        <p className="body-muted">
                          {en.q[c.question].label} · {formatMonth(c.month)}
                          {c.language !== 'en' ? ` · ${getLanguage(c.language).englishName}` : ''}
                        </p>
                        <p className="body-text" lang={c.language}>
                          {c.text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card>
                <p className="h2">People who asked to be contacted</p>
                <p className="body-muted" style={{ marginTop: 'var(--space-xs)', marginBottom: 'var(--space-md)' }}>
                  Feed Sioux Falls only - never share these. They are kept apart from survey answers on purpose.
                </p>
                {contacts.length === 0 ? (
                  <p className="body-muted">No open requests.</p>
                ) : (
                  <div className="stack gap-md">
                    {contacts.map((c) => (
                      <div key={c._id} className="survey-comment">
                        <p className="body-text" style={{ fontWeight: 600 }}>
                          {c.name || 'No name given'}
                        </p>
                        {c.phone && <p className="body-text">Phone: {c.phone}</p>}
                        {c.email && <p className="body-text">Email: {c.email}</p>}
                        {c.bestTime && <p className="body-text">Best time: {c.bestTime}</p>}
                        {c.language !== 'en' && <p className="body-text">Language: {getLanguage(c.language).englishName}</p>}
                        {c.safeToLeaveMessage === true ? (
                          <p className="body-text" style={{ color: 'var(--color-success)' }}>
                            OK to leave a message
                          </p>
                        ) : (
                          <p className="body-text" style={{ color: 'var(--color-danger)', fontWeight: 600 }}>
                            Do NOT leave a voicemail or message
                            {c.safeToLeaveMessage === null ? ' (they didn’t say - play it safe)' : ''}
                          </p>
                        )}
                        <p className="body-muted">{new Date(c.createdAt).toLocaleDateString()}</p>
                        <Button title="Mark as contacted" variant="outline-success" small onClick={() => resolve(c._id)} style={{ marginTop: 'var(--space-sm)' }} />
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
