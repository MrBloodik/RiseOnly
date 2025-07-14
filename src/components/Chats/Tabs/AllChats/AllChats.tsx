import { ChatItem } from '@components/Chats/ChatItem/ChatItem';
import { useFocusEffect } from '@react-navigation/native';
import { appStorage } from '@shared/storage';
import { AsyncDataRender, Box, HoldContextMenuUi, MainText } from '@shared/ui';
import { FlashList } from '@shopify/flash-list';
import { themeStore } from '@stores/theme';
import { chatsActionsStore, chatsInteractionsStore } from '@stores/ws/chats';
import { ChatInfo } from '@stores/ws/chats/chats-actions/types';
import { observer } from 'mobx-react-lite';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

interface AllChatsProps {
	cached?: boolean;
	chatCallback?: (item: ChatInfo) => void;
}

export const AllChats = observer(({
	cached = false,
	chatCallback,
}: AllChatsProps) => {
	const { currentTheme } = themeStore;
	const {
		chats: { data, status },
		cachedChats: { data: cachedChats, status: cachedStatus }
	} = chatsActionsStore;
	const {
		itemCordinates: { itemCordinates }
	} = chatsInteractionsStore;

	const { t } = useTranslation();

	const useCachedChats = async () => {
		const cachedChats = await appStorage.getChatsData();
		chatsActionsStore.cachedChats.data = cachedChats;
	};

	useFocusEffect(() => {
		if (!cached) return;
		useCachedChats();
	});

	return (
		<Fragment>
			<AsyncDataRender
				data={cached ? cachedChats : data?.chats}
				status={cached ? "fulfilled" : (status == 'pending' ? "idle" : status)}
				noDataText={cached ? t("no_cached_chats") : t("no_chats")}
				messageHeightPercent={60}
				noDataHeightPercent={15}
				isEmptyScrollView={false}
				emptyScrollViewStyle={{ backgroundColor: currentTheme.bgTheme.background as string }}
				renderContent={(items) => {
					return (
						<View
							style={[
								{
									backgroundColor: currentTheme.bgTheme.background as string,
									flex: 1,
									height: "100%"
								},
								s.chatsList,
							]}
						>
							<FlashList
								data={cached ? cachedChats : items || []}
								extraData={cached ? cachedChats : items || []}
								renderItem={({ item }) => {
									if (!item.typing_datas) item.typing_datas = [];
									return (
										<ChatItem
											item={item}
											chatCallback={chatCallback}
										/>
									);
								}}
								keyExtractor={(item) => item.id}
								estimatedItemSize={80}
								onEndReachedThreshold={0.5}
								bounces={true}
							/>
						</View>
					);
				}}
			/>

			<HoldContextMenu />
		</Fragment>
	);
});

const s = StyleSheet.create({
	chatsList: {
		width: "100%",
		height: "100%",
		flex: 1,
	},
});

const HoldContextMenu = observer(() => {
	const { currentTheme } = themeStore;
	const {
		itemCordinates: { itemCordinates },
		chatPreviewOpen: { chatPreviewOpen },
		onChatPreviewCloseHandler
	} = chatsInteractionsStore;

	return (
		<HoldContextMenuUi
			open={chatPreviewOpen}
			onClose={onChatPreviewCloseHandler}
			itemCordinates={itemCordinates}
			debug
			renderJsx={
				<Box
					width={"100%"}
					height={500}
					centered
					bRad={15}
					bgColor={currentTheme.bgTheme.background as string}
				>
					<ScrollView
						style={{
							flex: 1,
							width: "100%",
							height: "100%",
						}}
					>
						<MainText px={100}>BRO</MainText>
						<MainText px={100}>BRO</MainText>
						<MainText px={100}>BRO</MainText>
						<MainText px={100}>BRO</MainText>
						<MainText px={100}>BRO</MainText>
						<MainText px={100}>BRO</MainText>
						<MainText px={100}>BRO</MainText>
						<MainText px={100}>BRO</MainText>
						<MainText px={100}>BRO</MainText>
						<MainText px={100}>BRO</MainText>
						<MainText px={100}>BRO</MainText>
						<MainText px={100}>BRO</MainText>
						<MainText px={100}>BRO</MainText>
						<MainText px={100}>BRO</MainText>
					</ScrollView>
				</Box>
			}
		/>
	);
});