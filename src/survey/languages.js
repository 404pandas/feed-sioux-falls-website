import en from './strings/en';
import es from './strings/es';

// Every language offered in the survey's language picker, shown by its own
// name so people can find theirs without reading English.
//
// strings: null means we don't have a translation yet - picking it shows a
// "help us translate" page instead of the survey.
//
// To add a translation: copy strings/en.js to strings/<code>.js, translate
// every value (keep the keys and option codes as-is), import it here and
// set `strings`. Have it checked by a native speaker from the community
// before launch. The code must also be in SURVEY_LANGUAGES in the backend
// (feed-sioux-falls/backend/src/utils/surveyQuestions.js).
//
// speechLang is what the phone's read-aloud voice is asked for. The
// "Read aloud" button only shows when the phone actually has a voice for
// it, which many won't for Dakota, Lakota, and others.
export const LANGUAGES = [
  { code: 'en', nativeName: 'English', englishName: 'English', dir: 'ltr', speechLang: 'en-US', strings: en },
  { code: 'es', nativeName: 'Español', englishName: 'Spanish', dir: 'ltr', speechLang: 'es-US', strings: es },
  { code: 'ne', nativeName: 'नेपाली', englishName: 'Nepali', dir: 'ltr', speechLang: 'ne-NP', strings: null },
  { code: 'sw', nativeName: 'Kiswahili', englishName: 'Swahili', dir: 'ltr', speechLang: 'sw-KE', strings: null },
  { code: 'ar', nativeName: 'العربية', englishName: 'Arabic', dir: 'rtl', speechLang: 'ar', strings: null },
  { code: 'dak', nativeName: 'Dakȟótiyapi', englishName: 'Dakota', dir: 'ltr', speechLang: 'dak', strings: null },
  { code: 'lkt', nativeName: 'Lakȟótiyapi', englishName: 'Lakota', dir: 'ltr', speechLang: 'lkt', strings: null },
];

export const DEFAULT_LANGUAGE = 'en';

export function getLanguage(code) {
  return LANGUAGES.find((l) => l.code === code) || LANGUAGES[0];
}
