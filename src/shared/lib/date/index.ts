import { format, isSameYear, isToday, isYesterday, Locale, parseISO } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { de, enUS, es, fr, it, ja, ko, ru, zhCN } from 'date-fns/locale'
import i18n from 'i18n'

const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

const locales: Record<string, Locale> = {
	ru,
	en: enUS,
	de,
	fr,
	es,
	it,
	ja,
	ko,
	'zh-CN': zhCN,
	// TODO: Добавить другие языки
}

const relativeDateTexts: Record<string, { today: string; yesterday: string }> = {
	ru: { today: 'Сегодня', yesterday: 'Вчера' },
	en: { today: 'Today', yesterday: 'Yesterday' },
	de: { today: 'Heute', yesterday: 'Gestern' },
	fr: { today: 'Aujourd\'hui', yesterday: 'Hier' },
	es: { today: 'Hoy', yesterday: 'Ayer' },
	it: { today: 'Oggi', yesterday: 'Ieri' },
	ja: { today: '今日', yesterday: '昨日' },
	ko: { today: '오늘', yesterday: '어제' },
	'zh-CN': { today: '今天', yesterday: '昨天' },
	// TODO: Добавить другие языки
}

/**
 * Форматирует дату с учетом текущего языка и контекста
 * @param dateString - строка с датой в ISO формате или объект Date
 * @param options - дополнительные опции форматирования
 * @returns отформатированная строка даты
 */
export const formatSmartDate = (
	dateString: string | Date,
	options: {
		showTime?: boolean
		showYear?: boolean
		timeFormat?: string
		dateFormat?: string
		yearFormat?: string
		useRelativeTime?: boolean
		timeZone?: string
	} = {}
): string => {
	const currentLanguage = i18n.language || 'ru'
	const locale = locales[currentLanguage] || locales.en
	const relativeTexts = relativeDateTexts[currentLanguage] || relativeDateTexts.en

	const {
		showTime = true,
		showYear = false,
		timeFormat = 'HH:mm',
		dateFormat = 'd MMMM',
		yearFormat = 'd MMMM yyyy',
		useRelativeTime = true,
		timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Moscow'
	} = options

	const rawDate = typeof dateString === 'string' ? parseISO(dateString) : dateString

	// Check if the date is valid
	if (isNaN(rawDate.getTime())) {
		console.error('Invalid date:', rawDate)
		return '' // Handle the invalid date scenario
	}

	const date = toZonedTime(rawDate, timeZone)

	const now = new Date()
	const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

	const timeString = showTime ? format(date, timeFormat, { locale }) : ''

	if (useRelativeTime) {
		if (diffInSeconds < 3600) {
			return formatRelativeTime(date)
		}
		if (isToday(date)) {
			return showTime ? `${relativeTexts.today} ${timeString}` : relativeTexts.today
		}
		if (isYesterday(date)) {
			return showTime ? `${relativeTexts.yesterday} ${timeString}` : relativeTexts.yesterday
		}
	}

	const shouldShowYear = showYear || !isSameYear(date, new Date())
	const formattedDate = format(
		date,
		shouldShowYear ? yearFormat : dateFormat,
		{ locale }
	)

	return showTime ? `${formattedDate} ${timeString}` : formattedDate
}

/**
 * Форматирует только время с учетом текущего часового пояса пользователя
 * @param dateString - строка с датой в ISO формате или объект Date
 * @param timeFormat - формат времени, по умолчанию 'HH:mm'
 * @param timeZone - часовой пояс, по умолчанию 'Europe/Moscow'
 * @returns отформатированная строка времени
 */
export const formatTimeDate = (
	dateString: string | Date,
	timeFormat: string = 'HH:mm',
	timeZone: string = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Moscow'
): string => {
	const rawDate = typeof dateString === 'string' ? new Date(dateString) : dateString

	// Проверяем, является ли дата валидной
	if (isNaN(rawDate.getTime())) {
		console.error('Invalid date:', rawDate)
		return '' // Обрабатываем случай с невалидной датой
	}

	// Конвертируем дату в нужный часовой пояс
	const date = toZonedTime(rawDate, timeZone)

	// Форматируем время согласно переданному формату и часовой зоне
	return format(date, timeFormat)
}

const agoText = {
	ru: 'назад',
	en: 'ago',
	de: 'vor',
	fr: 'il y a',
	es: 'hace',
	it: 'fa',
	ja: '前',
	ko: '전',
	'zh-CN': '前',
}

/**
 * Возвращает короткую относительную дату (например, "5 мин назад", "2 ч назад")
 * @param dateString - строка с датой в ISO формате или объект Date
 * @returns отформатированная строка с относительной датой
 */
export const formatRelativeTime = (dateString: string | Date): string => {
	const currentLanguage = i18n.language || 'ru'
	const date = typeof dateString === 'string' ? parseISO(dateString) : dateString
	const now = new Date()
	const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

	const shortUnits: Record<string, Record<string, string>> = {
		ru: {
			second: 'сек. назад',
			minute: 'мин. назад',
			hour: 'ч. назад',
			day: 'д. назад',
		},
		en: {
			second: 'sec ago',
			minute: 'min ago',
			hour: 'h ago',
			day: 'd ago',
		},
		de: {
			second: 'Sek.',
			minute: 'Min.',
			hour: 'Std.',
			day: 'T.',
		},
		// TODO: Добавить другие языки
	}

	const units = shortUnits[currentLanguage] || shortUnits.en

	// (менее 5 секунд)
	if (diffInSeconds < 5) {
		return currentLanguage === 'ru' ? 'только что' : 'just now'
	}
	// (до 60 секунд)
	else if (diffInSeconds < 60) {
		return `${diffInSeconds} ${units.second}`
	}
	// (до 60 минут)
	else if (diffInSeconds < 3600) {
		const minutes = Math.floor(diffInSeconds / 60)
		return `${minutes} ${units.minute}`
	}
	// (до 24 часов)
	else if (diffInSeconds < 86400) {
		const hours = Math.floor(diffInSeconds / 3600)
		return `${hours} ${units.hour}`
	}
	// (более старых событий)
	else {
		return formatSmartDate(date, { useRelativeTime: false })
	}
}

/**
 * Форматирует точную дату и время для отображения во всплывающем окне
 * @param dateString - строка с датой в ISO формате или объект Date
 * @returns отформатированная строка с точной датой и временем
 */
export const formatExactDate = (dateString: string | Date): string => {
	const currentLanguage = i18n.language || 'ru'
	const locale = locales[currentLanguage] || locales.en
	const date = typeof dateString === 'string' ? parseISO(dateString) : dateString

	return format(date, 'd MMMM yyyy, HH:mm:ss', { locale })
}

type PluralForms = {
	one: string
	few?: string // для языков вроде русского
	many: string
	other?: string // на случай специфичных языков
}

const participantForms: Record<string, PluralForms> = {
	ru: {
		one: 'участник',
		few: 'участника',
		many: 'участников',
	},
	en: {
		one: 'participant',
		many: 'participants',
	},
	fr: {
		one: 'participant',
		many: 'participants',
	},
}

function getPluralForm(lang: string, count: number): keyof PluralForms {
	// Плюрализация по языкам
	if (lang.startsWith('ru')) {
		if (count % 10 === 1 && count % 100 !== 11) return 'one'
		if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'few'
		return 'many'
	}

	if (lang.startsWith('fr') || lang.startsWith('en')) {
		return count === 1 ? 'one' : 'many'
	}

	// По умолчанию
	return count === 1 ? 'one' : 'many'
}

export function useParticipantText(count: number, i18n: any): string {
	const lang = i18n.language || 'en'
	const forms = participantForms[lang] || participantForms['en']
	const formKey = getPluralForm(lang, count)

	return `${count} ${forms[formKey] ?? forms.many}`
}