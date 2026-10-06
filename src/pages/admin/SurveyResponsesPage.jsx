import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import Button from '../../components/Button';
import Icon from '../../components/Icon';
import SurveyAnswers from '../../survey/SurveyAnswers';
import { api } from '../../api/client';
import { enumLabel, formatDate } from './dataFormat';

// Read the community survey one response at a time, newest first. Answers
// are anonymous - no name, contact info, or time of day is stored with
// them - and they stay inside Feed Sioux Falls. City Council only ever gets
// the totals on the Survey results page.
export default function SurveyResponsesPage() {
  const [params, setParams] = useSearchParams();
  const n = Math.max(1, Number(params.get('n')) || 1);
  const source = params.get('source') || '';
  const language = params.get('language') || '';

  const [state, setState] = useState({ row: null, total: null });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await api.admin.list('surveyResponses', { page: n, limit: 1, source, language });
      if (res.total > 0 && res.rows.length === 0) {
        // Past the end (e.g. after a delete) - go to the last one.
        setParams((p) => {
          const next = new URLSearchParams(p);
          next.set('n', String(res.total));
          return next;
        }, { replace: true });
        return;
      }
      setState({ row: res.rows[0] || null, total: res.total });
    } catch (err) {
      setError(err.message);
    }
  }, [n, source, language, setParams]);

  useEffect(() => {
    load();
  }, [load]);

  function go(next) {
    const p = new URLSearchParams(params);
    p.set('n', String(next));
    setParams(p, { replace: true });
  }

  function setFilter(name, value) {
    const p = new URLSearchParams(params);
    if (value) p.set(name, value);
    else p.delete(name);
    p.delete('n');
    setParams(p, { replace: true });
  }

  useEffect(() => {
    function onKey(e) {
      if (e.target.closest('input, select, textarea')) return;
      if (e.key === 'ArrowLeft' && n > 1) go(n - 1);
      if (e.key === 'ArrowRight' && state.total && n < state.total) go(n + 1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  async function remove() {
    if (!state.row) return;
    if (!window.confirm('Delete this survey response? Use this for test entries or duplicates. It can\'t be undone.')) return;
    setBusy(true);
    try {
      await api.admin.remove('surveyResponses', state.row._id);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const { row, total } = state;

  return (
    <Layout title="Survey responses" narrow>
      <div className="page-head">
        <div>
          <h1 className="h1">Survey responses</h1>
          <p className="sub">One at a time, newest first. Anonymous, and never shared outside Feed Sioux Falls.</p>
        </div>
        <Button variant="outline" to="/survey/results">
          <Icon name="chart" /> Totals
        </Button>
      </div>

      <div className="toolbar" style={{ marginTop: 0 }}>
        <label className="visually-hidden" htmlFor="sr-source">
          How it was filled out
        </label>
        <select id="sr-source" className="field-select" style={{ width: 'auto' }} value={source} onChange={(e) => setFilter('source', e.target.value)}>
          <option value="">Filled out: any way</option>
          <option value="self">On their own</option>
          <option value="volunteer">With a volunteer</option>
          <option value="paper">Paper survey</option>
        </select>
        <label className="visually-hidden" htmlFor="sr-lang">
          Language
        </label>
        <select id="sr-lang" className="field-select" style={{ width: 'auto' }} value={language} onChange={(e) => setFilter('language', e.target.value)}>
          <option value="">Any language</option>
          <option value="en">English</option>
          <option value="es">Spanish</option>
        </select>
      </div>

      {error && <p className="error-text">{error}</p>}
      {total === null && !error && <p className="body-muted">Loading…</p>}
      {total === 0 && <p className="empty-note">No survey responses{source || language ? ' match these filters' : ' yet'}.</p>}

      {row && (
        <>
          <div className="pager" style={{ marginTop: 0, marginBottom: 16 }}>
            <Button variant="outline" small disabled={n <= 1} onClick={() => go(n - 1)}>
              <Icon name="chevronLeft" /> Newer
            </Button>
            <span className="h2">
              {n} of {total}
            </span>
            <Button variant="outline" small disabled={n >= total} onClick={() => go(n + 1)}>
              Older <Icon name="chevronRight" />
            </Button>
          </div>

          <article className="card response-card">
            <div className="response-top">
              <span className="h2">Sent {formatDate(row.submittedOn, true)}</span>
              <span className="row gap-sm" style={{ flexWrap: 'wrap' }}>
                <span className="pill">{enumLabel(row.source === 'volunteer' ? 'volunteer' : row.source)}{row.source === 'volunteer' ? ' helped' : ''}</span>
                <span className="pill">{enumLabel(row.language)}</span>
              </span>
            </div>
            <SurveyAnswers answers={row.answers} />
          </article>

          <div className="row" style={{ justifyContent: 'space-between', marginTop: 16, flexWrap: 'wrap', gap: 12 }}>
            <p className="body-muted">Tip: the arrow keys flip between responses.</p>
            <Button variant="outline-danger" small onClick={remove} disabled={busy}>
              <Icon name="trash" /> Delete this response
            </Button>
          </div>
        </>
      )}
    </Layout>
  );
}
