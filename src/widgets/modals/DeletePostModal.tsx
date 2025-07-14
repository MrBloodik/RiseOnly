import { getDeletePostModalData } from '@shared/config/modal-data'
import { SimpleModalUi } from '@shared/ui'
import { postInteractionsStore } from '@stores/post'
import { observer } from 'mobx-react-lite'

export const DeletePostModal = observer(() => {
	const { postDeleteModalOpen: { postDeleteModalOpen } } = postInteractionsStore

	const modalData = getDeletePostModalData()

	return (
		<SimpleModalUi
			modalData={modalData}
			visible={postDeleteModalOpen}
			instaOpen
		/>
	)
})