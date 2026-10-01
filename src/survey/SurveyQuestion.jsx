import React from 'react';
import { PREFER_NOT } from './questions';

export function ReadAloudButton({ id, text, speech, ui }) {
  if (!speech.supported) return null;
  const speaking = speech.speakingId === id;
  return (
    <button
      type="button"
      className="survey-read-aloud"
      onClick={() => (speaking ? speech.stop() : speech.speak(id, text))}
      aria-pressed={speaking}
    >
      <span aria-hidden="true">{speaking ? '■' : '🔊'}</span> {speaking ? ui.stopReading : ui.readAloud}
    </button>
  );
}

function questionSpeechText(question, copy, ui) {
  const parts = [copy.label];
  if (copy.hint) parts.push(copy.hint);
  if (question.type !== 'text') {
    parts.push(question.type === 'multi' ? ui.chooseAll : ui.chooseOne);
    parts.push(...question.options.map((o) => copy.options[o]), ui.preferNot);
  }
  return parts.join('. ');
}

// One question: big tap-to-choose tiles backed by real radio/checkbox
// inputs (so screen readers and keyboards work), or a text box.
export default function SurveyQuestion({ question, value, onChange, strings, speech }) {
  const { ui } = strings;
  const copy = strings.q[question.id];
  const inputName = `q-${question.id}`;
  const hintId = `${inputName}-hint`;

  if (question.type === 'text') {
    return (
      <div className="survey-question">
        <div className="survey-question-head">
          <label className="survey-question-label" htmlFor={inputName}>
            {copy.label}
          </label>
          <ReadAloudButton id={question.id} text={copy.label} speech={speech} ui={ui} />
        </div>
        <textarea
          id={inputName}
          className="field-textarea survey-textarea"
          rows={4}
          maxLength={2000}
          placeholder={ui.typeHere}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }

  const multi = question.type === 'multi';
  const choices = [...question.options, PREFER_NOT];
  const selected = multi ? value || [] : value;

  function isChecked(code) {
    return multi ? selected.includes(code) : selected === code;
  }

  function toggle(code) {
    if (!multi) {
      // Tapping the chosen answer again clears it - every question is optional.
      onChange(selected === code ? undefined : code);
      return;
    }
    if (selected.includes(code)) {
      const next = selected.filter((c) => c !== code);
      onChange(next.length ? next : undefined);
    } else if (code === PREFER_NOT) {
      onChange([PREFER_NOT]);
    } else {
      onChange([...selected.filter((c) => c !== PREFER_NOT), code]);
    }
  }

  return (
    <fieldset className="survey-question" aria-describedby={hintId}>
      <div className="survey-question-head">
        <legend className="survey-question-label">{copy.label}</legend>
        <ReadAloudButton id={question.id} text={questionSpeechText(question, copy, ui)} speech={speech} ui={ui} />
      </div>
      <p className="survey-question-hint" id={hintId}>
        {copy.hint ? `${copy.hint} ` : ''}
        {multi ? ui.chooseAll : ui.chooseOne}
      </p>
      <div className="survey-options">
        {choices.map((code) => (
          <label
            key={code}
            className={['survey-option', code === PREFER_NOT && 'survey-option-muted', isChecked(code) && 'is-checked'].filter(Boolean).join(' ')}
          >
            <input
              type={multi ? 'checkbox' : 'radio'}
              name={inputName}
              value={code}
              checked={isChecked(code)}
              // onClick (not onChange) so tapping a chosen radio can clear it.
              onClick={() => toggle(code)}
              onChange={() => {}}
            />
            <span>{code === PREFER_NOT ? ui.preferNot : copy.options[code]}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
