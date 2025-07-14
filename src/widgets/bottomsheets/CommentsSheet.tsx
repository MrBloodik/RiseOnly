import { CommentInput } from '@components/Posts/Comments/CommentInput'
import { CommentReplies } from '@components/Posts/Comments/CommentReplies'
import { Comments } from '@components/Posts/Comments/Comments'
import { getCommentListContextMenuItems, getRepliesListContextMenuItems } from '@shared/config/context-menu-data'
import { formatCommentCount } from '@shared/lib/numbers'
import { BottomSheetUi } from '@shared/ui'
import { commentInteractionsStore } from '@stores/comment'
import { postInteractionsStore } from '@stores/post'
import { observer } from 'mobx-react-lite'
import { JSX, useEffect, useState } from 'react'

export const CommentsSheet = observer(() => {
	const { selectedPost } = postInteractionsStore
	const {
		commentListContextMenu: { commentListContextMenu, setCommentListContextMenu },
		repliesOpen: { repliesOpen },
		selectedCommentForReply: { selectedCommentForReply },
		commentsBottomSheetCloseSignal: { commentsBottomSheetCloseSignal, setCommentsBottomSheetCloseSignal },
		isCommentOpen,
		setIsCommentOpen
	} = commentInteractionsStore

	const [commentInputComponent, setCommentInputComponent] = useState<JSX.Element | null>(null)
	const commentsSortItems = getCommentListContextMenuItems()
	const repliesSortItems = getRepliesListContextMenuItems()

	useEffect(() => {
		setCommentInputComponent(<CommentInput />)
	}, [])

	return (
		<>
			{isCommentOpen && (
				<BottomSheetUi
					isBottomSheet={isCommentOpen}
					setIsBottomSheet={setIsCommentOpen}
					title={formatCommentCount(
						repliesOpen ? selectedCommentForReply!.repliesCount : (selectedPost?.commentsCount || 0),
						repliesOpen ? "replies" : "comments"
					)}
					footer={commentInputComponent}
					menuItems={repliesOpen ? repliesSortItems : commentsSortItems}
					contextMenuVisible={commentListContextMenu}
					setContextMenuVisible={setCommentListContextMenu}
					bottomSheetViewStyle={{ paddingBottom: 100 }}
					leftBtn={repliesOpen}
					leftBtnPress={() => {
						console.log("asd")
					}}
					onCloseSignal={commentsBottomSheetCloseSignal}
					setOnCloseSignal={setCommentsBottomSheetCloseSignal}
				>
					<Comments />
					{repliesOpen && (
						<CommentReplies />
					)}
				</BottomSheetUi>
			)}
		</>
	)
})