import { MainText } from '@shared/ui';

const formatText = (text: string, px: number = 13) => {
	return (
		<MainText px={px}>
			{text}
		</MainText>
	);
};

export { formatText };

/**
 * Форматирует байты в человекочитаемый формат (KB, MB, GB)
 * @param bytes - размер в байтах
 * @param decimals - количество знаков после запятой
 * @returns отформатированная строка
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
	if (bytes === 0) return '0 Б';

	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ'];

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Форматирует число с разделителями тысяч
 * @param num - число для форматирования
 * @returns отформатированная строка
 */
export function formatNumber(num: number): string {
	return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/**
 * Форматирует процент
 * @param value - значение (0-100)
 * @param decimals - количество знаков после запятой
 * @returns отформатированная строка с процентом
 */
export function formatPercent(value: number, decimals: number = 1): string {
	const toFixedValue = value.toFixed(decimals);
	if (isNaN(Number(toFixedValue))) return '0%';
	return toFixedValue + '%';
} 
