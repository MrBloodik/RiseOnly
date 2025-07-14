import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from 'src/shared/locales/en/translation.json'
import ru from 'src/shared/locales/ru/translation.json'

const locales = {
	en: { translation: en },
	ru: { translation: ru },
}

i18n.use(initReactI18next).init({
	compatibilityJSON: 'v4',
	fallbackLng: 'ru',
	debug: true,
	interpolation: {
		escapeValue: false
	},
	resources: locales
})

export default i18n
