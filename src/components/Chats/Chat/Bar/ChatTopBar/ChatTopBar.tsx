import { TypingAnimation } from '@animations/components/TypingAnimation'
import { MainStackParamList } from '@app/router/AppNavigator'
import { RouteProp, useRoute } from '@react-navigation/native'
import { useParticipantText } from '@shared/lib/date'
import { navigate } from '@shared/lib/navigation'
import { formatNumber } from '@shared/lib/numbers'
import { getTypingText } from '@shared/lib/string'
import { Box, MainText, SecondaryText, SimpleButtonUi, UserLogo } from '@shared/ui'
import { UserNameAndBadgeUi } from '@shared/ui/UserNameAndBadgeUi/UserNameAndBadgeUi'
import { chatsInteractionsStore } from '@stores/ws/chats'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { GestureResponderEvent, StyleSheet } from 'react-native'

export const ChatTopBar = observer(() => {
	const { selectedChat } = chatsInteractionsStore

	const { t, i18n } = useTranslation()
	const participantText = useParticipantText(selectedChat?.member_count || 1, i18n)
	const { previewUser, chatId } = useRoute<RouteProp<MainStackParamList, 'Chat'>>().params

	const onMidPress = (e: GestureResponderEvent) => {
		e.preventDefault()
		e.stopPropagation()
		navigate("ChatProfile")
	}

	return (
		<SimpleButtonUi
			width={"100%"}
			height={"100%"}
			align='center'
			onPress={onMidPress}
		>
			<Box
				position="absolute"
				style={{ right: 10 }}
			>
				<UserLogo
					source={previewUser?.more?.logo || selectedChat?.participant?.more?.logo}
					size={32.5}
				/>
			</Box>

			<Box style={s.navbarMidTop}>
				{selectedChat?.type_ != "PRIVATE" && !previewUser ? (
					<MainText px={17}>{selectedChat?.title}</MainText>
				) : (
					<UserNameAndBadgeUi
						user={previewUser || selectedChat?.participant}
						px={17}
					/>
				)}
			</Box>

			<Box
				style={s.navbarMidBot}
			>
				{selectedChat && selectedChat.typing_datas && selectedChat.typing_datas.length > 0 ? (
					<TypingAnimation
						width={5}
						fontSize={12}
						height={10}
						color='rgb(0, 210, 0)'
						leftText={(
							<MainText
								numberOfLines={2}
								ellipsizeMode="tail"
								px={12.5}
								color={'rgb(0, 210, 0)'}
							>
								{getTypingText(selectedChat.typing_datas, t)}
							</MainText>
						)}
					/>
				) : selectedChat?.type_ != "PRIVATE" && !previewUser ? ( // IF CHAT IS PRIVATE AND TYPING FALSE
					<>
						<MainText>{selectedChat && formatNumber(selectedChat?.member_count || 1)} {participantText}</MainText>
					</>
				) : ( // IF CHAT IS NOT PRIVATE AND TYPING FALSE
					<>
						{selectedChat?.joined_at || !selectedChat ? (
							<SecondaryText
								px={12}
							>
								{t("last_seen_recently")}
							</SecondaryText>
						) : (
							<MainText
								primary
								px={12}
							>
								{t("online_status")}
							</MainText>
						)}
					</>
				)}
			</Box>
		</SimpleButtonUi>
	)
})

const s = StyleSheet.create({
	navbarMidTop: {},
	navbarMidBot: {},
})