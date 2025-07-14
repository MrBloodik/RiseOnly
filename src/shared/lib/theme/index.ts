import { PixelRatio } from 'react-native';

export const pxToDp = (px: number) => {
	const scale = PixelRatio.get();
	return px / scale;
};

export const borderNative = (border: BorderT) => {
	if (!border) return;
	return (border + '')?.split(" ")?.splice(2)?.join(" ") || "";
};

export const heightNative = (height: HeightT) => {
	if (!height) return;
	return Number((height + '')?.replace("px", "")) || 45;
};

export const pxNative = (px: PxT) => {
	if (!px) return;
	return Number((px + '')?.replace("px", "")) || 45;
};

export const rgbToRgbaString = (r: number, g: number, b: number, a: number) => `rgba(${r}, ${g}, ${b}, ${a})`;

// Основная функция осветления цвета
export const changeRgbA = (rgba: any, a: string | number) => {
	const arr = rgba.split(', ');
	arr[arr.length - 1] = a + ')';
	return arr.join(', ');
};

/**
 * Преобразует строку rgb в строку rgba с указанной прозрачностью.
 * @param rgb - строка вида "rgb(r, g, b)"
 * @param a - значение прозрачности, например "0.5"
 * @returns строка вида "rgba(r, g, b, a)"
 */
export const changeRgb = (rgb: string, a: number): string => {
	// Проверяем формат строки RGB с помощью регулярного выражения
	const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);

	if (!match) {
		throw new Error("Invalid RGB format. Use 'rgb(r, g, b)'.");
	}

	// Извлекаем значения r, g, b
	const r = match[1];
	const g = match[2];
	const b = match[3];

	// Возвращаем строку в формате RGBA
	return `rgba(${r}, ${g}, ${b}, ${a})`;
};


/**
 * Функция для создания градиента из строки RGB или RGBA.
 * @param colorStr - строка вида "rgb(r, g, b)" или "rgba(r, g, b, a)"
 * @returns строка с градиентом
 */
export const gradientFromColor = (colorStr: string): string => {
	// Парсер строки RGB(A)
	const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);

	if (!match) {
		throw new Error("Invalid color format. Use 'rgb(r, g, b)' or 'rgba(r, g, b, a)'.");
	}

	const r = parseInt(match[1], 10);
	const g = parseInt(match[2], 10);
	const b = parseInt(match[3], 10);
	const a = match[4] ? parseFloat(match[4]) : 1; // Если альфа отсутствует, берем 1

	// Функции для осветления и затемнения
	const lighten = (value: number, amount: number): number =>
		Math.min(255, value + (255 - value) * (amount / 100));

	const darken = (value: number, amount: number): number =>
		Math.max(0, value - value * (amount / 100));

	// Генерация светлого и темного оттенков
	const lightColor = `rgba(${lighten(r, 20)}, ${lighten(g, 20)}, ${lighten(b, 20)}, ${a})`;
	const darkColor = `rgba(${darken(r, 20)}, ${darken(g, 20)}, ${darken(b, 20)}, ${a})`;

	const res = `linear-gradient(to right, ${lightColor} 0%, ${colorStr} 50%, ${darkColor} 100%)`;
	console.log(res);
	// Создание градиента
	return res;
};

export const darkenRGBA = (rgba: string | number | undefined, factor: number): string => {
	if (typeof rgba === "number" || !rgba) return "";

	const match = rgba.match(/^rgba?\((\d+), (\d+), (\d+),? ([\d.]+)?\)$/);

	if (!match) {
		throw new Error("Invalid RGBA format. Please use rgba(r, g, b, a).");
	}

	let [, rStr, gStr, bStr, aStr] = match;

	let r = parseInt(rStr, 10);
	let g = parseInt(gStr, 10);
	let b = parseInt(bStr, 10);
	let a = aStr ? parseFloat(aStr) : 1;

	const darken = (colorValue: number, factor: number): number => Math.max(0, colorValue - (colorValue * factor));

	const newR = darken(r, factor);
	const newG = darken(g, factor);
	const newB = darken(b, factor);

	return `rgba(${Math.round(newR)}, ${Math.round(newG)}, ${Math.round(newB)}, ${a})`;
};

export function parseLinearGradient(gradient?: string, alpha: string = '1'): string[] {
	if (!gradient) return [];
	const regex = /(rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*(\d*\.?\d+)?\))/g;

	const matches = [...gradient.matchAll(regex)].map((match) => {
		const [, , r, g, b] = match;
		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	});

	return matches;
}

// types

type PxT = string | number | string & {} | undefined;
type BorderT = string | number | string & {} | undefined;
type HeightT = string | number | string & {} | undefined;
