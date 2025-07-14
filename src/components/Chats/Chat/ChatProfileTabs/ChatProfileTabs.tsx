import { getIconColor } from '@shared/config/const'
import { AnimatedTabs } from '@shared/ui'
import { TabConfig } from '@shared/ui/AnimatedTabs/AnimatedTabs'
import { themeStore } from '@stores/theme'
import { chatsInteractionsStore } from '@stores/ws/chats'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { StyleSheet, useWindowDimensions } from 'react-native'
import { ChatProfileFavTab } from './pages/ChatProfileFavTab'
import { ChatProfileGroupsTab } from './pages/ChatProfileGroupsTab'
import { ChatProfileLinkTab } from './pages/ChatProfileLinkTab'
import { ChatProfileMediaTab } from './pages/ChatProfileMediaTab'
import { ChatProfileVoiceTab } from './pages/ChatProfileVoiceTab'

export const ChatProfileTabs = observer(() => {
	const { safeAreaWithContentHeight: { safeAreaWithContentHeight } } = themeStore
	const {
		chatProfileTab: { chatProfileTab, setChatProfileTab },
		tabScrollPosition: { tabScrollPosition, setTabScrollPosition },
		handleSwap
	} = chatsInteractionsStore

	const { t } = useTranslation()
	const { height } = useWindowDimensions()

	const tabs: TabConfig[] = [
		{ content: ChatProfileMediaTab, text: t("chat_profile_tab_media") },
		{ content: ChatProfileFavTab, text: t("chat_profile_tab_fav") },
		{ content: ChatProfileLinkTab, text: t("chat_profile_tab_link") },
		{ content: ChatProfileVoiceTab, text: t("chat_profile_tab_voice") },
		{ content: ChatProfileGroupsTab, text: t("chat_profile_tab_groups") },
		// { content: ChatProfileFileTab, text: t("chat_profile_tab_file") },
		// { content: ChatProfileMusicTab, text: t("chat_profile_tab_music") },
		// { content: ChatProfileGifTab, text: "GIF" },
	]


	return (
		<AnimatedTabs
			tabs={tabs}
			tabStyle={{ paddingVertical: 12 }}
			tabMaxHeight={height - safeAreaWithContentHeight - 100}
			activeTab={chatProfileTab}
			setActiveTab={setChatProfileTab}
			scrollPosition={tabScrollPosition}
			setScrollPosition={setTabScrollPosition}
			bouncing={false}
			containerStyle={s.container}
			getIconColor={getIconColor}
			onSwap={handleSwap}
		/>
	)
})

const s = StyleSheet.create({
	container: {
		marginTop: 0,
		marginBottom: 20,
		flex: 1,
	},
})