import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { SECTIONS, isVisible } from '../survey/questions';
import { DRAFT_KEY, storageGet, storageRemove, storageSet, useSpeech, useSurveyLanguage } from '../survey/hooks';
import SurveyTopBar from '../survey/SurveyTopBar';
import SurveyQuestion, { ReadAloudButton } from '../survey/SurveyQuestion';
import ShareSurvey from '../survey/ShareSurvey';
import TranslationPlaceholder from '../survey/TranslationPlaceholder';

// Saved progress is thrown away after this long, so a shared or borrowed
// phone doesn't hold someone's answers for days.
const DRAFT_MAX_AGE_MS = 12 * 60 * 60 * 1000;

const EMPTY_CONTACT = { wants: null, name: '', phone: '', email: '', bestTime: '', safeToLeaveMessage: null };

function loadDraft() {
  try {
    const draft = JSON.parse(storageGet(DRAFT_KEY));
    if (!draft || Date.now() - draft.savedAt > DRAFT_MAX_AGE_MS) {
      storageRemove(DRAFT_KEY);
      return null;
    }
    return Object.keys(draft.answers || {}).length ? draft : null;
  } catch {
    return null;
  }
}

function hasAnswer(value) {
  return Array.isArray(value) ? value.length > 0 : value !== undefined && value !== '';
}

// The public community survey. No login needed; every question optional.
// Step 0 is the welcome screen, steps 1..SECTIONS.length are the sections,
// and the last section (contact) has the Send button.
export default function SurveyPage() {
  const { user } = useAuth();
  const isStaff = user?.role === 'admin' || user?.role === 'volunteer';

  const [language, setLanguage] = useSurveyLanguage();
  const speech = useSpeech(language.speechLang);

  const [savedDraft, setSavedDraft] = useState(loadDraft);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  // Contact details are kept in memory only - never saved to the phone.
  const [contact, setContact] = useState(EMPTY_CONTACT);
  const [source, setSource] = useState('volunteer');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null); // null | { contacted: bool }
  const headingRef = useRef(null);

  // Save progress as they go, in case of a dead battery or lost signal.
  useEffect(() => {
    if (done || step === 0 || !Object.keys(answers).length) return;
    storageSet(DRAFT_KEY, JSON.stringify({ answers, step, source, savedAt: Date.now() }));
  }, [answers, step, source, done]);

  // Each new step: stop reading, jump to the top, and move screen-reader
  // focus to the new heading.
  useEffect(() => {
    speech.stop();
    window.scrollTo(0, 0);
    headingRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, done]);

  if (!language.strings) {
    return (
      <SurveyShell language={language} onLanguageChange={setLanguage} escToExit={!isStaff}>
        <TranslationPlaceholder language={language} onChooseLanguage={setLanguage} />
      </SurveyShell>
    );
  }

  const strings = language.strings;
  const { ui } = strings;
  const totalSteps = SECTIONS.length;
  const section = step > 0 ? SECTIONS[step - 1] : null;
  const isLastStep = step === totalSteps;

  function setAnswer(id, value) {
    setAnswers((prev) => {
      const next = { ...prev };
      if (hasAnswer(value)) next[id] = value;
      else delete next[id];
      return next;
    });
  }

  function resetAll() {
    storageRemove(DRAFT_KEY);
    setSavedDraft(null);
    setAnswers({});
    setContact(EMPTY_CONTACT);
    setError('');
    setStep(0);
  }

  function resume() {
    setAnswers(savedDraft.answers);
    setSource(savedDraft.source || 'volunteer');
    setStep(Math.min(Math.max(savedDraft.step, 1), totalSteps));
    setSavedDraft(null);
  }

  function eraseAnswers() {
    if (window.confirm(ui.clearConfirm)) resetAll();
  }

  const sectionHasAnswers = section?.questions.some((q) => isVisible(q, answers) && hasAnswer(answers[q.id]));
  const contactMissing = contact.wants === true && !contact.phone.trim() && !contact.email.trim();

  async function submit() {
    if (contactMissing) {
      setError(ui.contactNeedOne);
      return;
    }
    setError('');
    setSubmitting(true);

    // Drop answers to questions that ended up hidden (e.g. kids count after
    // un-checking kids).
    const visibleAnswers = {};
    for (const s of SECTIONS) {
      for (const q of s.questions) {
        if (isVisible(q, answers) && hasAnswer(answers[q.id])) visibleAnswers[q.id] = answers[q.id];
      }
    }

    try {
      await api.submitSurvey({
        answers: visibleAnswers,
        language: language.code,
        source: isStaff ? source : 'self',
        contact:
          contact.wants === true
            ? {
                name: contact.name,
                phone: contact.phone,
                email: contact.email,
                bestTime: contact.bestTime,
                safeToLeaveMessage: contact.safeToLeaveMessage,
              }
            : undefined,
      });
      const contacted = contact.wants === true;
      resetAll();
      setDone({ contacted });
    } catch (err) {
      setError(`${ui.submitError} (${err.message})`);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <SurveyShell language={language} onLanguageChange={setLanguage} escToExit={!isStaff}>
        <div className="stack gap-lg">
          <h1 className="h1" tabIndex={-1} ref={headingRef}>
            {ui.thanksTitle}
          </h1>
          <p className="survey-body" role="status">
            {ui.thanksBody} {done.contacted ? ui.thanksContact : ''}
          </p>
          <Button title={ui.startAnother} onClick={() => setDone(null)} block />
          <ShareSurvey ui={ui} />
        </div>
      </SurveyShell>
    );
  }

  if (step === 0) {
    const introText = [ui.title, ...ui.intro, ui.time].join('. ');
    return (
      <SurveyShell language={language} onLanguageChange={setLanguage} escToExit={!isStaff}>
        <div className="stack gap-lg">
          <p className="survey-exit-note">{ui.quickExitExplain}</p>

          <div className="stack gap-md">
            <div className="survey-question-head">
              <h1 className="h1" tabIndex={-1} ref={headingRef}>
                {ui.title}
              </h1>
              <ReadAloudButton id="intro" text={introText} speech={speech} ui={ui} />
            </div>
            {ui.intro.map((p) => (
              <p key={p} className="survey-body">
                {p}
              </p>
            ))}
            <p className="survey-time">
              <span aria-hidden="true">{'⏱'} </span>
              {ui.time}
            </p>
          </div>

          {isStaff && (
            <fieldset className="survey-question">
              <legend className="survey-question-label">{ui.sourceTitle}</legend>
              <div className="survey-options" style={{ marginTop: 'var(--space-sm)' }}>
                {[
                  ['volunteer', ui.sourceVolunteer],
                  ['paper', ui.sourcePaper],
                ].map(([value, label]) => (
                  <label key={value} className={`survey-option${source === value ? ' is-checked' : ''}`}>
                    <input type="radio" name="survey-source" checked={source === value} onChange={() => setSource(value)} />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {savedDraft ? (
            <div className="card stack gap-md" role="region" aria-label={ui.resumeTitle}>
              <p className="h2">{ui.resumeTitle}</p>
              <p className="survey-body">{ui.resumeBody}</p>
              <Button title={ui.resume} onClick={resume} block />
              <Button title={ui.startOver} variant="outline" onClick={resetAll} block />
            </div>
          ) : (
            <Button title={ui.start} variant="accent" onClick={() => setStep(1)} block />
          )}

          <ShareSurvey ui={ui} />

          <p className="body-muted">{ui.savedNote}</p>
          <p className="body-muted">{ui.safetyTip}</p>
          <WhoSees ui={ui} />
          <Link className="body-muted no-print" to="/survey/print">
            {ui.printPaper}
          </Link>
        </div>
      </SurveyShell>
    );
  }

  return (
    <SurveyShell language={language} onLanguageChange={setLanguage} escToExit={!isStaff}>
      <div className="stack gap-lg">
        <div className="stack gap-sm">
          <p className="body-muted" id="survey-progress-label">
            {ui.stepOf(step, totalSteps)}
          </p>
          <div
            className="progress-track"
            role="progressbar"
            aria-labelledby="survey-progress-label"
            aria-valuemin={1}
            aria-valuemax={totalSteps}
            aria-valuenow={step}
          >
            <div className="progress-fill" style={{ width: `${(step / totalSteps) * 100}%`, background: 'var(--color-primary)' }} />
          </div>
          <h1 className="h1" tabIndex={-1} ref={headingRef}>
            {strings.sections[section.id]}
          </h1>
        </div>

        {section.questions
          .filter((q) => isVisible(q, answers))
          .map((q) => (
            <SurveyQuestion
              key={q.id}
              question={q}
              value={answers[q.id]}
              onChange={(v) => setAnswer(q.id, v)}
              strings={strings}
              speech={speech}
            />
          ))}

        {isLastStep && <ContactStep ui={ui} contact={contact} setContact={setContact} speech={speech} />}
        {isLastStep && <WhoSees ui={ui} />}

        {!!error && (
          <p className="survey-error" role="alert">
            {error}
          </p>
        )}

        <div className="survey-nav">
          <Button title={ui.back} variant="outline" onClick={() => setStep(step - 1)} />
          {isLastStep ? (
            <Button title={submitting ? ui.submitting : ui.submit} variant="accent" onClick={submit} loading={submitting} />
          ) : (
            <Button title={sectionHasAnswers ? ui.next : ui.skip} onClick={() => setStep(step + 1)} />
          )}
        </div>

        <button type="button" className="link-button body-muted survey-erase" onClick={eraseAnswers}>
          {ui.clearAnswers}
        </button>
      </div>
    </SurveyShell>
  );
}

function SurveyShell({ language, onLanguageChange, escToExit, children }) {
  const ui = (language.strings || {}).ui || PLACEHOLDER_UI;
  return (
    <div className="survey" lang={language.strings ? language.code : 'en'} dir={language.strings ? language.dir : 'ltr'}>
      <SurveyTopBar language={language} onLanguageChange={onLanguageChange} ui={ui} escToExit={escToExit} />
      <main className="page survey-page">
        {/* The normal way out. Saved progress stays, so they can come back to it. */}
        <Link to="/" className="survey-back-home no-print">
          <span aria-hidden="true">{language.dir === 'rtl' ? '\u2192' : '\u2190'}</span>
          {ui.backHome}
        </Link>
        {children}
      </main>
    </div>
  );
}

// Top-bar wording while a placeholder (untranslated) language is picked.
const PLACEHOLDER_UI = {
  language: 'Language',
  quickExit: 'Quick Exit',
  quickExitHint: 'Leave this page fast.',
  quickExitKeyHint: 'You can also press Esc.',
  backHome: 'Back to Feed Sioux Falls',
};

function WhoSees({ ui }) {
  return (
    <section className="survey-who-sees" aria-labelledby="who-sees-title">
      <h2 className="h2" id="who-sees-title">
        {ui.whoSeesTitle}
      </h2>
      {ui.whoSees.map((p) => (
        <p key={p} className="body-text">
          {p}
        </p>
      ))}
    </section>
  );
}

function ContactStep({ ui, contact, setContact, speech }) {
  const update = (field) => (e) => setContact((c) => ({ ...c, [field]: e.target.value }));

  return (
    <div className="stack gap-lg">
      <fieldset className="survey-question">
        <div className="survey-question-head">
          <legend className="survey-question-label">{ui.contactTitle}</legend>
          <ReadAloudButton id="contact" text={`${ui.contactTitle} ${ui.contactHint}`} speech={speech} ui={ui} />
        </div>
        <p className="survey-question-hint">{ui.contactHint}</p>
        <div className="survey-options">
          {[
            [true, ui.contactYes],
            [false, ui.contactNo],
          ].map(([value, label]) => (
            <label key={label} className={`survey-option${contact.wants === value ? ' is-checked' : ''}`}>
              <input
                type="radio"
                name="contact-wants"
                checked={contact.wants === value}
                onChange={() => setContact((c) => ({ ...c, wants: value }))}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {contact.wants === true && (
        <div className="card stack">
          <label className="field-label" htmlFor="contact-name" style={{ marginTop: 0 }}>
            {ui.contactName}
          </label>
          <input id="contact-name" className="field-input" value={contact.name} onChange={update('name')} autoComplete="off" />

          <label className="field-label" htmlFor="contact-phone">
            {ui.contactPhone}
          </label>
          <input id="contact-phone" className="field-input" type="tel" inputMode="tel" value={contact.phone} onChange={update('phone')} autoComplete="off" />

          <label className="field-label" htmlFor="contact-email">
            {ui.contactEmail}
          </label>
          <input id="contact-email" className="field-input" type="email" inputMode="email" value={contact.email} onChange={update('email')} autoComplete="off" />

          <label className="field-label" htmlFor="contact-time">
            {ui.contactBestTime}
          </label>
          <input id="contact-time" className="field-input" value={contact.bestTime} onChange={update('bestTime')} autoComplete="off" />

          <fieldset className="survey-question" style={{ marginTop: 'var(--space-md)' }}>
            <legend className="survey-question-label">{ui.contactSafe}</legend>
            <div className="survey-options" style={{ marginTop: 'var(--space-sm)' }}>
              {[
                [true, ui.contactSafeYes],
                [false, ui.contactSafeNo],
              ].map(([value, label]) => (
                <label key={label} className={`survey-option${contact.safeToLeaveMessage === value ? ' is-checked' : ''}`}>
                  <input
                    type="radio"
                    name="contact-safe"
                    checked={contact.safeToLeaveMessage === value}
                    onChange={() => setContact((c) => ({ ...c, safeToLeaveMessage: value }))}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      )}
    </div>
  );
}
