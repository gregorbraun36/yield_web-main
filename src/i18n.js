import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationDE from './locales/de.json';

const resources = {
  de: {
    translation: translationDE
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'de',
    lng: 'de', // Force German only
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
