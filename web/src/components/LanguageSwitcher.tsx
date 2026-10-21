import { useAtom } from 'jotai';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, type Language } from '../i18n';
import { languageAtom } from '../state/locale';
import './LanguageSwitcher.css';

const LABELS: Record<Language, string> = { he: 'עב', en: 'EN', es: 'ES' };

// Switching language also flips the whole app between RTL and LTR (see state/LocaleSync.tsx)
export const LanguageSwitcher: React.FC = () => {
  const [language, setLanguage] = useAtom(languageAtom);
  const { t } = useTranslation();

  return (
    <div className="language-switcher" role="radiogroup" aria-label={t('home.language')}>
      {LANGUAGES.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          lang={option}
          aria-checked={option === language}
          data-language={option}
          className="language-switcher__option"
          onClick={() => setLanguage(option)}
        >
          {LABELS[option]}
        </button>
      ))}
    </div>
  );
};
