import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Button from '../components/Button';
import { PREFER_NOT, SECTIONS } from '../survey/questions';
import { getLanguage, DEFAULT_LANGUAGE } from '../survey/languages';
import { useSurveyLanguage } from '../survey/hooks';
import SurveyTopBar from '../survey/SurveyTopBar';
import { surveyUrl, useQrDataUrl } from '../survey/ShareSurvey';
import en from '../survey/strings/en';
import es from '../survey/strings/es';

// Printable versions of the survey, for people without a phone:
// - paper: every question with checkboxes. Volunteers type finished ones
//   in later from /survey while logged in ("I'm typing in a paper survey").
// - flyer: a QR code poster for the pantry, in English and Spanish.
export default function SurveyPrintPage() {
  const [params, setParams] = useSearchParams();
  const type = params.get('type') === 'flyer' ? 'flyer' : 'paper';
  const [language, setLanguage] = useSurveyLanguage();
  const shown = language.strings ? language : getLanguage(DEFAULT_LANGUAGE);
  const strings = shown.strings;
  const qr = useQrDataUrl(surveyUrl(), 600);

  return (
    <div lang={shown.code} dir={shown.dir}>
      <SurveyTopBar language={language} onLanguageChange={setLanguage} ui={strings.ui} escToExit={false} />
      <main className="page survey-print">
        <div className="row-wrap gap-sm no-print" style={{ marginBottom: 'var(--space-lg)' }}>
          <Button title="Paper survey" variant={type === 'paper' ? 'primary' : 'outline'} small onClick={() => setParams({})} />
          <Button title="Flyer with QR code" variant={type === 'flyer' ? 'primary' : 'outline'} small onClick={() => setParams({ type: 'flyer' })} />
          <Button title="Print" variant="accent" small onClick={() => window.print()} />
          <Link to="/survey" className="btn btn-outline btn-small">
            Back to survey
          </Link>
          <Link to="/" className="btn btn-outline btn-small">
            Home
          </Link>
        </div>

        {type === 'flyer' ? <Flyer qr={qr} /> : <PaperSurvey strings={strings} qr={qr} />}
      </main>
    </div>
  );
}

function Flyer({ qr }) {
  return (
    <div className="survey-flyer">
      <p className="survey-flyer-title">{en.ui.title}</p>
      <p className="survey-flyer-title survey-flyer-title-secondary" lang="es">
        {es.ui.title}
      </p>
      {qr && <img src={qr} alt="QR code for the survey" className="survey-flyer-qr" />}
      <p className="survey-flyer-url">{surveyUrl().replace(/^https?:\/\//, '')}</p>
      <p className="survey-flyer-body">
        {en.ui.intro[1]} {en.ui.time}. {en.ui.intro[2]}
      </p>
      <p className="survey-flyer-body" lang="es">
        {es.ui.intro[1]} {es.ui.time}. {es.ui.intro[2]}
      </p>
      <p className="survey-flyer-body">Feed Sioux Falls</p>
    </div>
  );
}

function Box() {
  return <span className="paper-box" aria-hidden="true" />;
}

function PaperSurvey({ strings, qr }) {
  const { ui } = strings;
  return (
    <div className="paper-survey">
      <div className="paper-header">
        <div>
          <h1 className="h1">{ui.title}</h1>
          <p className="body-text">{ui.time}</p>
        </div>
        {qr && <img src={qr} alt="" width={96} height={96} />}
      </div>
      {ui.intro.map((p) => (
        <p key={p} className="body-text">
          {p}
        </p>
      ))}

      {SECTIONS.filter((s) => s.questions.length).map((section) => (
        <section key={section.id} className="paper-section">
          <h2 className="h2">{strings.sections[section.id]}</h2>
          {section.questions.map((q) => {
            const copy = strings.q[q.id];
            return (
              <div key={q.id} className="paper-question">
                <p className="paper-question-label">
                  {copy.label} <span className="body-muted">({q.type === 'multi' ? ui.chooseAll : q.type === 'single' ? ui.chooseOne : ''})</span>
                </p>
                {q.type === 'text' ? (
                  <div className="paper-lines" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                ) : (
                  <div className="paper-options">
                    {[...q.options, PREFER_NOT].map((code) => (
                      <span key={code} className="paper-option">
                        <Box /> {code === PREFER_NOT ? ui.preferNot : copy.options[code]}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      ))}

      <section className="paper-section">
        <h2 className="h2">{ui.whoSeesTitle}</h2>
        {ui.whoSees.map((p) => (
          <p key={p} className="body-text">
            {p}
          </p>
        ))}
      </section>

      {/* Contact details go on a slip that's torn off and kept apart from
          the answers, the same way the website stores them separately. */}
      <section className="paper-section paper-tearoff">
        <p className="paper-cut" aria-hidden="true">
          {'\u2702'} - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        </p>
        <h2 className="h2">{strings.sections.contact}</h2>
        <p className="body-muted">{ui.contactTearOff}</p>
        <p className="paper-question-label">{ui.contactTitle}</p>
        <p className="body-muted">{ui.contactHint}</p>
        <div className="paper-fill">
          <p>{ui.contactName}: ______________________________</p>
          <p>{ui.contactPhone}: ______________________________</p>
          <p>{ui.contactEmail}: ______________________________</p>
          <p>{ui.contactBestTime}: ______________________________</p>
          <p className="paper-options">
            {ui.contactSafe}
            <span className="paper-option">
              <Box /> {ui.contactSafeYes}
            </span>
            <span className="paper-option">
              <Box /> {ui.contactSafeNo}
            </span>
          </p>
        </div>
      </section>
    </div>
  );
}
