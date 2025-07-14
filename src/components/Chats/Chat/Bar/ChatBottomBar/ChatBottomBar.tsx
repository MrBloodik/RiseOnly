import { SendMessageIcon } from '@icons/MainPage/Posts/SendMessageIcon'
import { FileIcon } from '@icons/Ui/FileIcon'
import { todoNotify } from '@shared/config/const'
import { darkenRGBA } from '@shared/lib/theme'
import { Box, SimpleButtonUi, TextEditorUi, UserLogo } from '@shared/ui'
import { themeStore } from '@stores/theme'
import { messageInteractionsStore } from '@stores/ws/message/message-interactions/message-interactions'
import { t } from 'i18next'
import { observer } from 'mobx-react-lite'
import React, { useEffect, useState } from 'react'
import { Keyboard, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const bottomBarHeight = 43

interface ChatBottomBarProps {
	onChange?: (text: string) => void
}

export const ChatBottomBar = observer(({
	onChange
}: ChatBottomBarProps) => {
	const { currentTheme } = themeStore
	const {
		msgText: { msgText, setMsgText },
		msgRawText: { msgRawText, setMsgRawText },
		msgInputFocus: { msgInputFocus, setMsgInputFocus },
		msgIsFocused: { msgIsFocused, setMsgIsFocused },
		onSendMsgHandler
	} = messageInteractionsStore

	const insets = useSafeAreaInsets()
	const [keyboardVisible, setKeyboardVisible] = useState(false)
	const [bottomText, setBottomText] = useState("")

	useEffect(() => {
		const keyboardDidShowListener = Keyboard.addListener(
			'keyboardDidShow',
			() => {
				setKeyboardVisible(true)
			}
		)
		const keyboardDidHideListener = Keyboard.addListener(
			'keyboardDidHide',
			() => {
				setKeyboardVisible(false)
			}
		)

		return () => {
			keyboardDidShowListener.remove()
			keyboardDidHideListener.remove()
		}
	}, [])

	const onFilePress = () => todoNotify()
	const onEmojiPress = () => todoNotify()
	const onPressSend = () => {
		setBottomText("")
		onSendMsgHandler()
	}
	const onChangeText = (text: string) => {
		setBottomText(text)
		onChange?.(text)
	}

	const s = StyleSheet.create({
		inputContainer: {
			paddingRight: 8,
		},
	})

	const containerStyle: any = {
		paddingHorizontal: 8,
		zIndex: 1000,
		width: "100%",
		height: "auto",
		paddingTop: 5,
		marginBottom: msgIsFocused ? 5 : insets.bottom,
		borderTopWidth: 0.5,
		borderTopColor: currentTheme.bgTheme.borderColor as string,
	}

	return (
		<View style={containerStyle}>
			<Box
				fD='row'
				width={"100%"}
				align='center'
				gap={5}
				height={"auto"}
			>
				<Box>
					<UserLogo size={28} />
				</Box>
				<Box>
					<SimpleButtonUi
						onPress={onFilePress}
					>
						<FileIcon
							color={currentTheme.secondTextColor.color}
							size={22}
						/>
					</SimpleButtonUi>
				</Box>
				<Box height={"auto"} flex={1}>
					{/* <Box
						bgColor={currentTheme.btnsTheme.background as string}
						fD='row'
						justify='space-between'
						bRad={30}
						align='center'
						style={s.inputContainer}
					> */}
					<TextEditorUi
						inputContainerStyle={{ backgroundColor: darkenRGBA(currentTheme.btnsTheme.background as string, 0.3) }}
						inputStyle={{ fontSize: 14 }}
						maxLength={5000}
						maxHeight={120}
						rawText={msgRawText}
						setRawText={setMsgRawText}
						text={msgText}
						value={bottomText}
						setText={setMsgText}
						onChangeText={onChangeText}
						focus={msgInputFocus}
						setFocus={setMsgInputFocus}
						onFocus={(focus) => setMsgIsFocused(focus)}
						placeholder={t("funny_chat_placeholder")} // TODO: Change it to serious placeholder after BETA
					/>

					{/* <SimpleButtonUi
							onPress={onEmojiPress}
						>
							<EmojiIcon
								color={currentTheme.textColor.color}
								size={18}
							/>
						</SimpleButtonUi> */}
					{/* </Box> */}
				</Box>
				<Box>
					<SimpleButtonUi
						onPress={onPressSend}
						style={{ width: 27, height: 27, borderRadius: 1000, paddingLeft: 2 }}
						bgColor={currentTheme.originalMainGradientColor.color}
						centered
					>
						<SendMessageIcon
							color={currentTheme.textColor.color}
							size={15}
						/>
					</SimpleButtonUi>
				</Box>
			</Box>
		</View>
	)
})