import React, { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import { api } from '../api/client';
import en from './strings/en';

// Shown instead of the survey when someone picks a language we don't have
// a translation for yet. Offers to continue in English or Spanish, and lets
// anyone who can help translate leave a note - it goes to the regular
// contact inbox as a "partner" message, not into the survey results.
export default function TranslationPlaceholder({ language, onChooseLanguage }) {
  const copy = en.placeholder;
  const [name, setName] = useState('');
  const [reach, setReach] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function send() {
    const contact = reach.trim();
    if (!contact) {
      setError(copy.helpNeedContact);
      return;
    }
    setError('');
    setSending(true);
    try {
      const isEmail = contact.includes('@');
      await api.submitContact({
        name: name.trim() || undefined,
        email: isEmail ? contact : undefined,
        phone: isEmail ? undefined : contact,
        message: copy.helpMessage(language.englishName),
        category: 'partner',
      });
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="stack gap-lg">
      <div>
        <p className="survey-placeholder-language" lang={language.code} dir={language.dir}>
          {language.nativeName}
        </p>
        <h1 className="h1">{copy.title}</h1>
      </div>

      {copy.body.map((p) => (
        <p key={p} className="survey-body">
          {p}
        </p>
      ))}

      <div className="stack gap-sm">
        <Button title={copy.useEnglish} onClick={() => onChooseLanguage('en')} block />
        <Button title={copy.useSpanish} variant="outline" onClick={() => onChooseLanguage('es')} block />
      </div>

      <Card>
        <h2 className="h2">{copy.helpTitle}</h2>
        {sent ? (
          <p className="survey-body" role="status" style={{ marginTop: 'var(--space-md)' }}>
            {copy.helpSent}
          </p>
        ) : (
          <>
            <label className="field-label" htmlFor="translate-name">
              {copy.helpName}
            </label>
            <input id="translate-name" className="field-input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            <label className="field-label" htmlFor="translate-reach">
              {copy.helpContact}
            </label>
            <input id="translate-reach" className="field-input" value={reach} onChange={(e) => setReach(e.target.value)} />
            {!!error && (
              <p className="body-muted" role="alert" style={{ color: 'var(--color-danger)', marginTop: 'var(--space-sm)' }}>
                {error}
              </p>
            )}
            <Button title={copy.helpSend} onClick={send} loading={sending} block style={{ marginTop: 'var(--space-md)' }} />
          </>
        )}
      </Card>
    </div>
  );
}
