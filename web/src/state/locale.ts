import { atom, useAtomValue } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { DIRECTION, INTL_LOCALE, type Language } from '../i18n';

// The user's chosen language, remembered on the device
export const languageAtom = atomWithStorage<Language>('language', 'he');

export const directionAtom = atom((get) => DIRECTION[get(languageAtom)]);

export const useIntlLocale = () => INTL_LOCALE[useAtomValue(languageAtom)];
