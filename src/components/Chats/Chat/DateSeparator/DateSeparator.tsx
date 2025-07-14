import { Box, MainText } from '@shared/ui';
import { themeStore } from '@stores/theme';
import { format, isSameYear, isToday, isYesterday } from 'date-fns';
import { enUS, ru } from 'date-fns/locale';
import i18n from 'i18n';
import { observer } from 'mobx-react-lite';
import { StyleSheet, View } from 'react-native';

interface DateSeparatorProps {
	timestamp: number;
	isSticky?: boolean;
}

export const DateSeparator = observer(({ timestamp, isSticky = false }: DateSeparatorProps) => {
	const { currentTheme } = themeStore;
	const date = new Date(timestamp * 1000);
	const currentLanguage = i18n.language || 'ru';
	const locale = currentLanguage === 'ru' ? ru : enUS;

	const getFormattedDate = () => {
		const relativeDateTexts = {
			ru: { today: 'Сегодня', yesterday: 'Вчера' },
			en: { today: 'Today', yesterday: 'Yesterday' },
		};

		const relativeTexts = (relativeDateTexts as any)[currentLanguage] || relativeDateTexts.en;

		if (isToday(date)) return relativeTexts.today;
		if (isYesterday(date)) return relativeTexts.yesterday;
		if (isSameYear(date, new Date())) return format(date, 'd MMMM', { locale });

		return format(date, 'd MMMM yyyy', { locale });
	};

	return (
		<View
			style={[
				s.container,
				isSticky && s.sticky
			]}
		>
			<Box
				style={s.dateContainer}
				bgColor={currentTheme.bgTheme.background as string}
				bRad={30}
			>
				<MainText px={13}>
					{getFormattedDate()}
				</MainText>
			</Box>
		</View>
	);
});

const s = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		marginVertical: 10,
		paddingHorizontal: 10,
		width: '100%',
		zIndex: 1,
		justifyContent: 'center',
	},
	sticky: {
	},
	dateContainer: {
		paddingHorizontal: 8.5,
		paddingVertical: 4,
	},
	line: {
		height: 0.5,
		flex: 1,
	}
}); 