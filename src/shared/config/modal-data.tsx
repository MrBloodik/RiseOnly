import { commentActionsStore, commentInteractionsStore } from '@stores/comment'
import { postActionsStore, postInteractionsStore } from '@stores/post'
import { useTranslation } from 'react-i18next'
import { ModalData } from './types'

export const getDeletePostModalData = () => {
	const { deletePostAction } = postActionsStore
	const { postDeleteModalOpen: { setPostDeleteModalOpen } } = postInteractionsStore

	const { t } = useTranslation()

	const modalObj: ModalData = {
		title: t('deletePostModal_title'),
		message: t('deletePostModal_message'),
		buttonText: t('delete_text'),
		onCancel: () => setPostDeleteModalOpen(false),
		onPress: () => deletePostAction(),
		width: 280,
	}

	return modalObj
}

export const getDeleteCommentModalData = () => {
	const { deleteCommentAction } = commentActionsStore
	const { deleteCommentModal: { setDeleteCommentModal } } = commentInteractionsStore

	const { t } = useTranslation()

	const modalObj: ModalData = {
		title: t('deleteCommentModal_title'),
		message: t('deleteCommentModal_message'),
		buttonText: t('delete_text'),
		onCancel: () => setDeleteCommentModal(false),
		onPress: () => deleteCommentAction(),
		width: 280,
	}

	return modalObj
}