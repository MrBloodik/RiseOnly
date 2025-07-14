import { Box, MainText } from '@shared/ui';
import { themeActionsStore } from '@stores/theme/theme-actions/theme-aсtions';
import { ProfileSettingsWrapper } from '@widgets/wrappers';
import { observer } from "mobx-react-lite";
import { useTranslation } from 'react-i18next';

export const WallpapersSettings = observer(() => {
	const { } = themeActionsStore;

	const { t } = useTranslation();

	return (
		<ProfileSettingsWrapper
			tKey='settings_customization_wallpapers'
			height={40}
		>
			<Box
				flex={1}
				height={"100%"}
			>
				<MainText>{t('settings_customization_wallpapers')}</MainText>
			</Box>
		</ProfileSettingsWrapper>
	);
});