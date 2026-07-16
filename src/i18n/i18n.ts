// src/i18n/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import all namespace files (we'll create these next)
// English namespaces
import commonEn from './locales/en/common';
import authEn from './locales/en/auth';
import dashboardEn from './locales/en/dashboard';
import ordersEn from './locales/en/orders';
import productsEn from './locales/en/products';
import usersEn from './locales/en/users';

// Amharic namespaces
import commonAm from './locales/am/common';
import authAm from './locales/am/auth';
import dashboardAm from './locales/am/dashboard';
import ordersAm from './locales/am/orders';
import productsAm from './locales/am/products';
import usersAm from './locales/am/users';

const resources = {
  en: {
    common: commonEn,
    auth: authEn,
    dashboard: dashboardEn,
    orders: ordersEn,
    products: productsEn,
    users: usersEn,
  },
  am: {
    common: commonAm,
    auth: authAm,
    dashboard: dashboardAm,
    orders: ordersAm,
    products: productsAm,
    users: usersAm,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('i18nextLng') || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    ns: ['common'],
    defaultNS: 'common',
  });

export default i18n;