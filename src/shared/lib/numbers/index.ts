import i18n from 'i18next';
import { Dispatch, SetStateAction } from 'react';

/**
 * Форматирует число в сокращенный вид (1к, 1млн и т.д.) с учетом локализации
 * @param value - Число для форматирования
 * @param digits - Количество знаков после запятой (по умолчанию 1)
 * @returns Отформатированное число в виде строки
 */
export const formatNumber = (value: number, digits: number = 1): string => {
	if (value < 1000) {
		return value.toString();
	}

	const currentLocale = i18n.language;

	const suffixes: Record<string, string[]> = {
		'ru': ['', 'к', 'млн', 'млрд', 'трлн'],
		'en': ['', 'k', 'mln', 'bil', 'tril'],
		// TODO: Добавить другие языки по необходимости
	};

	const localeSuffixes = suffixes[currentLocale] || suffixes['ru'];

	const order = Math.floor(Math.log10(value) / 3);

	if (order >= localeSuffixes.length) {
		return value.toExponential(digits);
	}

	const divider = Math.pow(10, order * 3);
	const scaled = value / divider;

	let formatted: string;

	if (Number.isInteger(scaled)) {
		formatted = scaled.toString();
	} else {
		formatted = scaled.toFixed(digits);
		formatted = formatted.replace(/\.?0+$/, '');
	}

	return `${formatted}${localeSuffixes[order]}`;
};

/**
 * Форматирует число с разделителями разрядов согласно локали
 * @param value - Число для форматирования
 * @returns Отформатированное число с разделителями
 */
export const formatNumberWithSeparators = (value: number): string => {
	try {
		return new Intl.NumberFormat(i18n.language).format(value);
	} catch (error) {
		return value.toString();
	}
};

type CommentCountOptions = {
	count: number;
	locale?: string;
};

const wordForms = {
	ru: {
		comments: {
			one: 'комментарий',
			few: 'комментария',
			many: 'комментариев',
			other: 'комментариев'
		},
		replies: {
			one: 'ответ',
			few: 'ответа',
			many: 'ответов',
			other: 'ответов'
		}
	},
	en: {
		comments: {
			one: 'comment',
			other: 'comments'
		},
		replies: {
			one: 'reply',
			other: 'replies'
		}
	}
};

/**
 * Получение правильной формы слова для счетчиков
 * @param count - количество
 * @param locale - локаль ('ru' | 'en')
 * @param mode - режим ('comments' | 'replies')
 * @returns правильная форма слова
 */
const getCommentForm = (count: number, locale: string, mode: 'comments' | 'replies'): string => {
	const forms = (wordForms as any)[locale]?.[mode];

	if (!forms) return ''; // safety fallback

	if (locale === 'ru') {
		const lastDigit = Math.abs(count) % 10;
		const lastTwoDigits = Math.abs(count) % 100;

		if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
			return forms.many;
		}

		if (lastDigit === 1) {
			return forms.one;
		}

		if (lastDigit >= 2 && lastDigit <= 4) {
			return forms.few;
		}

		return forms.many;
	}

	// Для английского языка
	return count === 1 ? forms.one : forms.other;
};


/**
 * Форматирует число комментариев с правильным склонением
 * @param count - Количество комментариев
 * @returns Отформатированная строка с числом и правильным склонением
 */
export const formatCommentCount = (count: number, mode: 'comments' | 'replies' = 'comments'): string => {
	const locale = i18n.language;
	const formattedNumber = formatNumber(count);
	const form = getCommentForm(count, locale, mode);

	return `${formattedNumber} ${form}`;
};

export function numericId() {
	return new Date().getTime().toString() + Math.random().toString(36).substring(2, 15);
}

export const getMaxLengthColor = (n: number, maxLength: number) => { // 22, 32
	if (n >= Math.round(maxLength - 10)) return "red";
	if (n >= Math.round(maxLength / 2)) return "orange";
	return "white";
};

export const increaseInterval = (interval: number, setFunction: Dispatch<SetStateAction<number>>, maxValue: number) => {
	const ourInterval = setInterval(() => {
		setFunction(prev => {
			if (prev < maxValue) return prev + 10;
			clearInterval(ourInterval);
			return prev;
		});
	}, interval);
}

