import { DeletePostModal } from '@widgets/modals'
import { DeleteCommentModal } from '@widgets/modals/DeleteCommentModal'
import { observer } from 'mobx-react-lite'

export const GlobalModals = observer(() => {
	return (
		<>
			<DeletePostModal />
			<DeleteCommentModal />
		</>
	)
})