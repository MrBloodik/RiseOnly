import { TypingAnimation } from '@animations/components/TypingAnimation';
import { formatNumber } from '@shared/lib/numbers';
import { darkenRGBA } from '@shared/lib/theme';
import { Box, LiveTimeAgo, MainText, SecondaryText, SimpleButtonUi, UserLogo } from '@shared/ui';
import { UserNameAndBadgeUi } from '@shared/ui/UserNameAndBadgeUi/UserNameAndBadgeUi';
import { profileStore } from '@stores/profile';
import { themeStore } from '@stores/theme';
import { chatsInteractionsStore } from '@stores/ws/chats';
import { ChatInfo } from '@stores/ws/chats/chats-actions/types';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

interface ChatItemsProps {
	item: ChatInfo;
	chatCallback?: (item: ChatInfo) => void;
}

export const ChatItem = observer(({ item, chatCallback }: ChatItemsProps) => {
	const { currentTheme } = themeStore;
	const { profile } = profileStore;
	const {
		onChatLongPressHandler,
		onChatPressHandler,
	} = chatsInteractionsStore;

	const { t } = useTranslation();

	return (
		<SimpleButtonUi
			style={{
				...s.chat,
				backgroundColor: currentTheme.bgTheme.background as string,
			}}
			onPress={() => onChatPressHandler(item, chatCallback)}
			onLongPress={onChatLongPressHandler}
		>
			<Box style={s.left}>
				<UserLogo
					source={item?.participant?.more?.logo}
					size={50}
				/>
			</Box>

			<Box style={s.right}>
				<Box style={s.rightTop}>
					<Box style={s.rightTopLeft}>
						{item.type_ == "PRIVATE" ? (
							<UserNameAndBadgeUi
								px={16.5}
								user={item?.participant}
								size={16}
							/>
						) : (
							<MainText px={18}>{item.title}</MainText>
						)}
					</Box>

					<Box style={s.rightTopRight}>
						{item.last_message && (
							<LiveTimeAgo
								date={new Date(item.last_message?.timestamp * 1000).toISOString()}
								fontSize={9}
							/>
						)}
					</Box>
				</Box>

				{item.type_ == "GROUP" && (
					<Box style={s.rightMid}>
						<MainText px={13}>{item.last_message?.sender_name}</MainText>
					</Box>
				)}

				<Box style={s.rightBot}>
					<Box style={s.rightBotLeft}>
						{item.typing_datas && item.typing_datas.length > 0 ? (
							<TypingAnimation
								width={5}
								fontSize={12.5}
								height={10}
								color='rgb(0, 210, 0)'
								leftText={(
									<MainText
										numberOfLines={2}
										ellipsizeMode="tail"
										px={12.5}
										color={'rgb(0, 210, 0)'}
									>
										{(() => {
											const typingUsers = item.typing_datas.map(t => t.user_name);
											if (typingUsers.length === 1) {
												return `${typingUsers[0]} печатает`;
											} else if (typingUsers.length === 2) {
												return `${typingUsers[0]}, ${typingUsers[1]} печатают`;
											} else {
												return `${typingUsers[0]}, и ещё ${typingUsers.length - 1} печатают`;
											}
										})()}
									</MainText>
								)}
							/>
						) : (
							item.type_ == "PRIVATE" ? (
								<MainText
									numberOfLines={2}
									ellipsizeMode="tail"
									px={12.5}
								>
									{item.last_message && (item.last_message.sender.id === profile!.id) && (
										<MainText>{t("chat_last_message_yourself")}: </MainText>
									)}
									<SecondaryText px={13}>
										{item.last_message?.content || t("no_messages_yet")}
									</SecondaryText>
								</MainText>
							) : (
								<SecondaryText
									numberOfLines={2}
									px={12.5}
									ellipsizeMode="tail"
								>
									{item.last_message?.content}
								</SecondaryText>
							)
						)}
					</Box>

					<Box style={s.rightBotRight}>
						{(item.unread_count != 0 && item.unread_count) && (
							<Box
								style={s.unreadCount}
								bgColor={darkenRGBA(currentTheme.btnsTheme.background as string, -0.5)}
								centered
								bRad={15}
							>
								<MainText primary px={11}>{formatNumber(item.unread_count)}</MainText>
							</Box>
						)}
					</Box>
				</Box>
			</Box>
		</SimpleButtonUi>
	);
});

const s = StyleSheet.create({
	unreadCount: {
		minWidth: 20,
		paddingHorizontal: 5,
		height: 20,
		borderRadius: 1000
	},
	rightTopRight: {
		marginRight: 5,
		position: "absolute",
		right: 0
	},
	rightBotRight: {
		marginRight: 5,
		position: "absolute",
		top: 10,
		right: 0
	},
	rightTopLeft: {},
	rightBotLeft: {},
	rightMid: {},
	rightTop: {
		flexDirection: "row",
		alignItems: "center",
		width: "100%",
		gap: 5
	},
	rightBot: {
		flexDirection: "row",
		alignItems: "center",
		width: "100%",
		gap: 5
	},
	right: {
		borderBottomColor: themeStore.currentTheme.bgTheme.borderColor,
		borderBottomWidth: 0.5,
		borderTopColor: themeStore.currentTheme.bgTheme.borderColor,
		borderTopWidth: 0.1,
		height: 65,
		paddingVertical: 6,
		flex: 1,
	},
	left: {
		justifyContent: "center",
		alignItems: "center",
		height: 65,
		paddingLeft: 8,
	},
	chat: {
		flexDirection: "row",
		height: 65,
		flex: 1,
		gap: 8
	},
});
