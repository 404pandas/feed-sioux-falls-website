import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_LANGUAGE, getLanguage } from './languages';

const LANGUAGE_KEY = 'fsf_survey_language';
export const DRAFT_KEY = 'fsf_survey_draft';

// Storage can throw (private windows, blocked site data) - the survey must
// keep working without it.
export function storageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function storageSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Nothing to do - progress just won't survive a reload.
  }
}

export function storageRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

// The picked survey language, remembered on this device. Also sets the
// page's lang/dir so screen readers pronounce it right and right-to-left
// languages lay out correctly.
export function useSurveyLanguage() {
  const [code, setCode] = useState(() => getLanguage(storageGet(LANGUAGE_KEY) || DEFAULT_LANGUAGE).code);
  const language = getLanguage(code);

  useEffect(() => {
    // Placeholder languages show English text, so keep the page English.
    const shown = language.strings ? language : getLanguage(DEFAULT_LANGUAGE);
    document.documentElement.lang = shown.code;
    document.documentElement.dir = shown.dir;
    return () => {
      document.documentElement.lang = 'en';
      document.documentElement.dir = 'ltr';
    };
  }, [language]);

  const choose = useCallback((next) => {
    setCode(next);
    storageSet(LANGUAGE_KEY, next);
  }, []);

  return [language, choose];
}

function hasVoiceFor(lang) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false;
  const prefix = lang.toLowerCase().split('-')[0];
  return window.speechSynthesis.getVoices().some((v) => v.lang.toLowerCase().replace('_', '-').split('-')[0] === prefix);
}

// Read-aloud using the phone's built-in voice. `supported` is only true
// when the device has a voice for this language, so the button never shows
// up just to do nothing.
export function useSpeech(lang) {
  const [supported, setSupported] = useState(() => hasVoiceFor(lang));
  const [speakingId, setSpeakingId] = useState(null);

  useEffect(() => {
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    if (!synth) return undefined;
    const update = () => setSupported(hasVoiceFor(lang));
    update();
    // Voices load asynchronously in most browsers.
    synth.addEventListener?.('voiceschanged', update);
    return () => {
      synth.removeEventListener?.('voiceschanged', update);
      synth.cancel();
    };
  }, [lang]);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeakingId(null);
  }, []);

  const speak = useCallback(
    (id, text) => {
      const synth = window.speechSynthesis;
      if (!synth) return;
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.9;
      utterance.onend = () => setSpeakingId((current) => (current === id ? null : current));
      utterance.onerror = utterance.onend;
      setSpeakingId(id);
      synth.speak(utterance);
    },
    [lang]
  );

  return { supported, speak, stop, speakingId };
}
