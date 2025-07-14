import { navigate } from '@shared/lib/navigation'
import { SimpleButtonUi, UserLogo } from '@shared/ui'
import { themeStore } from '@stores/theme'
import { chatsInteractionsStore } from '@stores/ws/chats'
import { observer } from 'mobx-react-lite'
import { GestureResponderEvent } from 'react-native'

export const ChatTopRightBar = observer(() => {
	const { currentTheme } = themeStore
	const { selectedChat } = chatsInteractionsStore

	const onAvatarClick = (event: GestureResponderEvent) => {
		event.preventDefault()
		event.stopPropagation()
		navigate("ChatProfile")
	}

	return (
		<SimpleButtonUi
			onPress={onAvatarClick}
		>
			<UserLogo
				source={selectedChat?.type_ == "PRIVATE" ? selectedChat.participant.more.logo : selectedChat?.logo_url}
				size={35}
				borderColor={currentTheme.bgTheme.borderColor}
				borderWidth={0.5}
			/>
		</SimpleButtonUi>
	)
})