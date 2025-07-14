import { AllChats } from '@components/Chats/Tabs/AllChats/AllChats';
import { cachedDataTitles } from '@shared/config/ts';
import { checker } from '@shared/lib/helpers';
import { AnimatedTabs, Box } from '@shared/ui';
import { TabConfig } from '@shared/ui/AnimatedTabs/AnimatedTabs';
import { InDevUi } from '@shared/ui/InDevUi/InDevUi';
import { memoryStore } from '@stores/memory';
import { SelectedCachedDataT } from '@stores/memory/memory-interactions/types';
import { themeStore } from '@stores/theme';
import { ProfileSettingsWrapper } from '@widgets/wrappers';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import { useWindowDimensions } from 'react-native';

export const CachedChats = observer(() => {
	const { currentTheme } = themeStore;
	const {
		selectedCachedData: { selectedCachedData },
	} = memoryStore;

	const { t } = useTranslation();
	const height = useWindowDimensions().height;

	checker(!!selectedCachedData, "Selected cached data is not defined");

	const chatTabs: TabConfig[] = [
		{
			text: t("all_chats"),
			content: observer(() => (
				<AllChats
					cached
					chatCallback={(item) => {
						alert(item.id);
					}}
				/>
			))
		},
		{
			text: t("other"),
			content: observer(() => {
				return (
					<Box
						flex={1}
						centered
						bgColor={currentTheme.bgTheme.background as string}
					>
						<InDevUi />
					</Box>
				);
			})
		}
	];

	return (
		<ProfileSettingsWrapper
			title={`${t("cache")} | ${t(cachedDataTitles[selectedCachedData as SelectedCachedDataT])}`}
			requiredBg={false}
			bgColor={currentTheme.bgTheme.background}
			PageHeaderUiStyle={{
				backgroundColor: currentTheme.btnsTheme.background as string
			}}
			height={38}
			wrapperNoPadding
			needScrollView={false}
		>
			<Box
				flex={1}
				minHeight={height}
				bgColor={currentTheme.btnsTheme.background}
			>
				<AnimatedTabs
					noBorderRadius={true}
					blurView
					tabs={chatTabs}
					bouncing={false}
					contentContainerStyle={{ height: "100%", flex: 1 }}
				/>
			</Box>
		</ProfileSettingsWrapper >
	);
});