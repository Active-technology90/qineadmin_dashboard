import { useTranslation } from 'react-i18next';

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const currentLng = i18n.language;

  const toggleLanguage = () => {
    const newLng = currentLng === 'en' ? 'am' : 'en';
    i18n.changeLanguage(newLng);
    localStorage.setItem('i18nextLng', newLng);
  };

  return (
    <button onClick={toggleLanguage} className="...">
      {currentLng === 'en' ? 'አማርኛ' : 'English'}
    </button>
  );
};