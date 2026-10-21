import { useAtomValue } from 'jotai';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { directionAtom, languageAtom } from './locale';

// Keeps i18next and the document's lang/dir in step with the chosen language.
// Ionic components read `dir` from <html>, so this flips the whole app between RTL and LTR.
export const LocaleSync: React.FC = () => {
  const language = useAtomValue(languageAtom);
  const direction = useAtomValue(directionAtom);
  const { i18n } = useTranslation();

  useEffect(() => {
    void i18n.changeLanguage(language);
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
  }, [i18n, language, direction]);

  return null;
};
