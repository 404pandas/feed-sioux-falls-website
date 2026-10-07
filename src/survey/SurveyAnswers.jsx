import React from 'react';
import { SECTIONS, PREFER_NOT } from './questions';
import en from './strings/en';

// One survey response, laid out the way the survey asked it, in English
// (answers are stored as codes, so it reads the same whichever language
// the person used). Questions they skipped are left out.
export default function SurveyAnswers({ answers }) {
  const label = (q, code) => (code === PREFER_NOT ? en.ui.preferNot : en.q[q.id]?.options?.[code] || code);

  const sections = SECTIONS.map((section) => ({
    section,
    questions: section.questions.filter((q) => answers?.[q.id] !== undefined),
  })).filter((s) => s.questions.length);

  if (!sections.length) return <p className="body-muted" style={{ padding: 20 }}>No answers.</p>;

  return sections.map(({ section, questions }) => (
    <div key={section.id} className="response-section">
      <h3>{en.sections[section.id]}</h3>
      {questions.map((q) => {
        const value = answers[q.id];
        return (
          <div key={q.id} className="answer">
            <span className="answer-q">{en.q[q.id]?.label || q.id}</span>
            {q.type === 'text' ? (
              <p className="answer-text">{value}</p>
            ) : (
              <span className="answer-a">
                {(Array.isArray(value) ? value : [value]).map((code) => (
                  <span key={code} className={`pill ${code === PREFER_NOT ? 'pill-muted' : 'pill-ok'}`}>
                    {label(q, code)}
                  </span>
                ))}
              </span>
            )}
          </div>
        );
      })}
    </div>
  ));
}
