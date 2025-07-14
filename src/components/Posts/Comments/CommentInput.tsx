import { SendMessageIcon } from '@icons/MainPage/Posts/SendMessageIcon'
import { TextEditorUi } from '@shared/ui'
import { commentActionsStore, commentInteractionsStore } from '@stores/comment'
import { themeStore } from '@stores/theme'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

export const CommentInput = observer(() => {
	const { currentTheme } = themeStore
	const { createCommentAction } = commentActionsStore
	const {
		rawCommentText: { rawCommentText, setRawCommentText },
		commentText: { commentText, setCommentText },
		rawReplyCommentText: { rawReplyCommentText, setRawReplyCommentText },
		replyCommentText: { replyCommentText, setReplyCommentText },
		commentInputFocus: { commentInputFocus, setCommentInputFocus },
		repliesOpen: { repliesOpen }
	} = commentInteractionsStore

	const { t } = useTranslation()

	const handleChangeText = (newText: string) => {
		if (repliesOpen) {
			setReplyCommentText(newText)
			setRawReplyCommentText(newText)
			return
		}
		setCommentText(newText)
		setRawCommentText(newText)
	}

	const styles = StyleSheet.create({
		container: {
			flexDirection: 'row',
			alignItems: 'flex-end',
			gap: 3,
			paddingHorizontal: 6,
			paddingVertical: 5
		},
		editorContainer: {
			flex: 1,
		},
		sendButton: {
			width: 33,
			height: 33,
			borderRadius: 100,
			marginBottom: 3,
			backgroundColor: currentTheme.btnsTheme.background as string,
			justifyContent: 'center',
			alignItems: 'center',
		}
	})

	return (
		<View style={styles.container}>
			<View style={styles.editorContainer}>
				<TextEditorUi
					placeholder={t('create_comment_placeholder')}
					value={commentText}
					onChangeText={handleChangeText}
					maxLength={5000}
					maxHeight={120}

					rawText={repliesOpen ? rawReplyCommentText : rawCommentText}
					setRawText={repliesOpen ? setRawReplyCommentText : setRawCommentText}
					text={repliesOpen ? replyCommentText : commentText}
					setText={repliesOpen ? setReplyCommentText : setCommentText}

					focus={commentInputFocus}
					setFocus={setCommentInputFocus}
				/>
			</View>

			<TouchableOpacity
				style={styles.sendButton}
				onPress={createCommentAction}
				disabled={repliesOpen ? !rawReplyCommentText : !rawCommentText}
			>
				<SendMessageIcon size={15} />
			</TouchableOpacity>
		</View>
	)
})