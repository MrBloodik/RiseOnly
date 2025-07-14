import { getDeleteCommentModalData } from '@shared/config/modal-data'
import { SimpleModalUi } from '@shared/ui'
import { commentInteractionsStore } from '@stores/comment'
import { observer } from 'mobx-react-lite'

export const DeleteCommentModal = observer(() => {
	const { deleteCommentModal: { deleteCommentModal } } = commentInteractionsStore

	return (
		<SimpleModalUi
			visible={deleteCommentModal}
			modalData={getDeleteCommentModalData()}
			instaOpen
		/>
	)
})