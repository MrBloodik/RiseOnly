import { AllChats } from '@components/Chats/Tabs/AllChats/AllChats';
import { SearchIcon } from '@icons/MainPage/Posts/SearchIcon';
import { useFocusEffect } from '@react-navigation/native';
import { getProfileStatuses } from '@shared/config/tsx';
import { AnimatedTabs, Box, SimpleInputUi } from '@shared/ui';
import { TabConfig } from '@shared/ui/AnimatedTabs/AnimatedTabs';
import { InDevUi } from '@shared/ui/InDevUi/InDevUi';
import { profileStore } from '@stores/profile';
import { themeStore } from '@stores/theme';
import { chatsInteractionsStore } from '@stores/ws/chats';
import { chatsActionsStore } from '@stores/ws/chats/chats-actions/chats-actions';
import { chatsWebsocketStore } from '@stores/ws/chats/chats-websocket/chats-websocket';
import { messageWebsocketStore } from '@stores/ws/message/message-websocket/message-websocket';
import { ChatsWrapper } from '@widgets/wrappers';
import { BlurView } from 'expo-blur';
import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const Chats = observer(() => {
	const { currentTheme, getBlurViewBgColor } = themeStore;
	const { isNoInternet: { isNoInternet } } = profileStore;
	const {
		chats: {
			data,
			status,
			isPending
		},
		getChatsAction
	} = chatsActionsStore;
	const {
		chatsInputText: { chatsInputText },
		handleChangeChatsInputText
	} = chatsInteractionsStore;
	const { chatAuthLoading: { chatAuthLoading }, chatWs, } = chatsWebsocketStore;
	const { msgAuthLoading: { msgAuthLoading }, messageWs } = messageWebsocketStore;

	const { t } = useTranslation();
	const insets = useSafeAreaInsets();

	useFocusEffect(
		useCallback(() => {
			getChatsAction();
		}, [])
	);

	const chatTabs: TabConfig[] = [
		{
			text: t("all_chats"),
			content: AllChats
		},
		{
			text: t("other"),
			content: () => {
				return (
					<Box
						flex={1}
						centered
						bgColor={currentTheme.bgTheme.background as string}
					>
						<InDevUi />
					</Box>
				);
			}
		}
	];

	return (
		<ChatsWrapper
			tKey='chats_title'
			requiredBg={false}
			icon={getProfileStatuses("ts", 17)}
			wrapperStyle={{ paddingVertical: 0, paddingHorizontal: 0 }}
			transparentSafeArea
			loading={
				chatWs.wsIsError.wsIsError ? (
					"error"
				) : isNoInternet ? (
					"nointernet"
				) : (
					isPending ||
					chatWs.wsIsConnecting.wsIsConnecting ||
					messageWs.wsIsConnecting.wsIsConnecting ||
					(!chatWs.wsIsConnected.wsIsConnected || !messageWs.wsIsConnected.wsIsConnected)
				) ? 'pending' : "fulfilled"
			}
			scrollEnabled={false}
			PageHeaderUiStyle={{ borderBottomWidth: 0 }}
			isBlurView={true}
		>
			<Box
				style={{ ...s.chatsWrapper, ...{ paddingTop: insets.top + 38 } }}
				centered={(data && (data?.chats?.length != 0)) ? false : true}
			>
				<BlurView
					style={{
						...s.searchWrapper,
						...{
							backgroundColor: getBlurViewBgColor(),
							width: "100%"
						}
					}}
					intensity={30}
				>
					<Box
						style={s.searchInputWrapper}
						fD="row"
						gap={7}
						align='center'
					>
						<SearchIcon size={15} color={currentTheme.secondTextColor.color} />
						<SimpleInputUi
							style={[s.searchInput, { color: currentTheme.textColor.color, fontSize: 15 }]}
							value={chatsInputText}
							onChange={handleChangeChatsInputText}
							placeholder={t("search_placeholder")}
						/>
					</Box>
				</BlurView>

				<AnimatedTabs
					noBorderRadius={true}
					blurView
					tabs={chatTabs}
					bouncing={false}
				/>
			</Box >
		</ChatsWrapper >
	);
});

const s = StyleSheet.create({
	searchWrapper: {
		paddingHorizontal: 10,
	},
	searchInputWrapper: {
		height: 40,
		paddingHorizontal: 10,
		borderRadius: 8,
		backgroundColor: themeStore.currentTheme.bgTheme.background as string,
		width: "100%",
	},
	searchInput: {
		width: "100%",
	},
	chatsWrapper: {
		width: "100%",
		flex: 1,
		justifyContent: "flex-start"
	},
	chatsListContent: {},
	chatsList: {
		width: "100%",
		height: "100%",
		flex: 1,
	},
	emptyText: {},
	emptyContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center"
	},
	footerLoaderText: {},
	footerLoader: {},
	main: {
		flex: 1
	},
	loaderContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center'
	},
	loaderText: {
		marginTop: 16,
		fontSize: 16,
	},
});