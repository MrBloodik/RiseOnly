import { cachedDataTitles } from '@shared/config/ts';
import { checker } from '@shared/lib/helpers';
import { Box } from '@shared/ui';
import { memoryStore } from '@stores/memory';
import { SelectedCachedDataT } from '@stores/memory/memory-interactions/types';
import { themeStore } from '@stores/theme';
import { ProfileSettingsWrapper } from '@widgets/wrappers';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

export const CachedDatas = observer(() => {
	const { currentTheme } = themeStore;
	const {
		selectedCachedData: { selectedCachedData },

	} = memoryStore;

	const { t } = useTranslation();

	checker(!!selectedCachedData, "Selected cached data is not defined");

	return (
		<ProfileSettingsWrapper
			title={`${t("cache")} | ${t(cachedDataTitles[selectedCachedData as SelectedCachedDataT])}`}
			requiredBg={false}
			bgColor={currentTheme.bgTheme.background}
			PageHeaderUiStyle={{
				backgroundColor: currentTheme.btnsTheme.background as string
			}}
			height={40}
		>
			<Box>
				{ }
			</Box>
		</ProfileSettingsWrapper>
	);
});