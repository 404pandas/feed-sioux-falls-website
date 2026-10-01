import React, { useEffect } from 'react';
import { LANGUAGES } from './languages';
import { DRAFT_KEY, storageRemove } from './hooks';

// A neutral page to land on. location.replace() swaps out the survey's
// history entry, so pressing Back doesn't bring it back up.
const QUICK_EXIT_URL = 'https://weather.com/';

export function quickExit() {
  storageRemove(DRAFT_KEY);
  try {
    window.speechSynthesis?.cancel();
  } catch {
    // ignore
  }
  document.body.style.display = 'none'; // hide the page instantly, before the next one loads
  window.location.replace(QUICK_EXIT_URL);
}

// Always-visible bar at the top of every survey screen: the language picker
// and the Quick Exit button. `escToExit` is off for volunteers, so a stray
// Esc while typing in a paper survey doesn't erase it.
export default function SurveyTopBar({ language, onLanguageChange, ui, escToExit = true }) {
  useEffect(() => {
    if (!escToExit) return undefined;
    function onKey(e) {
      if (e.key === 'Escape') quickExit();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [escToExit]);

  return (
    <div className="survey-topbar no-print">
      <div className="survey-topbar-inner">
        <label className="survey-language">
          <span className="sr-only">{ui.language}</span>
          <span aria-hidden="true" className="survey-language-icon">
            文A
          </span>
          <select
            className="survey-language-select"
            value={language.code}
            onChange={(e) => onLanguageChange(e.target.value)}
            aria-label={`${ui.language} / Language`}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code} lang={l.code} dir={l.dir}>
                {l.nativeName === l.englishName ? l.nativeName : `${l.nativeName} (${l.englishName})`}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="survey-quick-exit"
          onClick={quickExit}
          title={`${ui.quickExitHint}${escToExit ? ` ${ui.quickExitKeyHint}` : ''}`}
        >
          {ui.quickExit}
          <span className="sr-only"> - {ui.quickExitHint}</span>
        </button>
      </div>
    </div>
  );
}
