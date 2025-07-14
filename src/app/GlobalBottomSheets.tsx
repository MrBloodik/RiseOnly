import { CommentsSheet, SessionSheet } from '@widgets/bottomsheets'
import { observer } from 'mobx-react-lite'

export const GlobalBottomSheets = observer(() => {
	return (
		<>
			<CommentsSheet />
			<SessionSheet />
		</>
	)
})