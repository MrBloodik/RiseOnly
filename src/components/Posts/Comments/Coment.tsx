import { MoreIcon } from '@icons/MainPage/Chats/MoreIcon'
import { ComDislike } from '@icons/MainPage/Posts/ComDislike'
import { CommentIcon } from '@icons/MainPage/Posts/CommentIcon'
import { LikeIcon } from '@icons/MainPage/Posts/LikeIcon'
import { getCommentContextMenuItems } from '@shared/config/context-menu-data'
import { navigate } from '@shared/lib/navigation'
import { formatNumber } from '@shared/lib/numbers'
import { formatText } from '@shared/lib/text'
import { darkenRGBA } from '@shared/lib/theme'
import { Box, ButtonUi, ContextMenuUi, LiveTimeAgo, MainText, Separator, SimpleButtonUi, UserLogo } from '@shared/ui'
import { UserNameAndBadgeUi } from '@shared/ui/UserNameAndBadgeUi/UserNameAndBadgeUi'
import { commentInteractionsStore } from '@stores/comment'
import { GetCommentsResponse } from '@stores/comment/comment-actions/types'
import { postInteractionsStore } from '@stores/post'
import { profileStore } from '@stores/profile'
import { themeStore } from '@stores/theme'
import { runInAction } from 'mobx'
import { observer } from 'mobx-react-lite'
import { useRef, useState } from 'react'
import { GestureResponderEvent, StyleSheet, View } from 'react-native'

export const Comment = observer(({
	comment,
	mode = "default",
	type = "default"
}: CommentProps) => {
	const { currentTheme } = themeStore
	const { profile, setUserToShow } = profileStore
	const { selectedPost } = postInteractionsStore
	const {
		repliesOpen: { setRepliesOpen },
		selectedCommentForReply: { setSelectedCommentForReply },
		commentInputFocus: { setCommentInputFocus },
		rawReplyCommentText: { setRawReplyCommentText },
		replyCommentText: { setReplyCommentText },
		selectedCommentToReply: { setSelectedCommentToReply },
		selectedComment: { setSelectedComment },
		commentsBottomSheetCloseSignal: { setCommentsBottomSheetCloseSignal },
		likeCommentHandler,
		dislikeCommentHandler
	} = commentInteractionsStore

	const [commentContextMenu, setCommentContextMenu] = useState(false)
	const moreBtnRef = useRef(null)

	const onPressContextMenu = () => {
		setSelectedComment(comment)
		setCommentContextMenu(true)
	}
	const onCommentPress = () => {
		if (mode == "reply") return
		if (type == "reply") {
			onRepliesPress()
			return
		}
		setSelectedCommentForReply(comment)
		setRepliesOpen(true)
	}
	const onRepliesPress = () => {
		if (type == "reply" || mode == "reply" || mode == 'comments') {
			runInAction(() => {
				setSelectedCommentToReply(comment)
				setRawReplyCommentText(`@${comment.author.tag}, `)
				setReplyCommentText(`@${comment.author.tag}, `)
				setCommentInputFocus(p => !p)
			})
			if (mode == "comments") {
				setSelectedCommentForReply(comment)
				setRepliesOpen(true)
			}
			return
		}
		setCommentInputFocus(p => !p)
		onCommentPress()
	}

	const onAvatarPress = () => {
		setCommentsBottomSheetCloseSignal(true)
		navigate("UserPage", { tag: comment.author.tag })
	}

	const onLikePress = (event: GestureResponderEvent) => {
		event.stopPropagation()
		event.preventDefault()
		likeCommentHandler(comment.id as number, comment, type)
	}

	const onDislikePress = (event: GestureResponderEvent) => {
		event.stopPropagation()
		event.preventDefault()
		dislikeCommentHandler(comment.id as number, comment, type)
	}

	return (
		<SimpleButtonUi
			style={[
				styles.comment,
				{
					backgroundColor: comment.authorId === profile?.id ?
						darkenRGBA(currentTheme.bgTheme.background as string, -0.2) :
						currentTheme.bgTheme.background as string,
					opacity: comment.isTemp ? 0.5 : 1,
					paddingLeft: type == "default" ? 10 : (30 + 10 + 10 - 5)
				}
			]}
			onPress={onCommentPress}
		>
			<View style={styles.commentLeft}>
				<View style={styles.commentHeaderLeft}>
					<UserLogo
						source=''
						size={30}
						authorIcon={comment.authorId == selectedPost?.authorId}
						onPress={onAvatarPress}
						isButton
					/>
				</View>

				<View style={styles.commentHeaderRight}>
					<Box
						style={styles.commentHeaderRightTop}
						fD='row'
						justify="space-between"
						align='center'
					>
						<Box
							style={styles.commentHeaderRightTopLeft}
							centered
						>
							<UserNameAndBadgeUi
								user={comment.author!}
								showPremIcon={false}
							/>
						</Box>

						<Box
							style={styles.commentHeaderRightTopRight}
							centered
						>
							<SimpleButtonUi
								ref={moreBtnRef}
								style={styles.moreBtn}
								onPress={onPressContextMenu}
							>
								<MoreIcon />
							</SimpleButtonUi>

							<ContextMenuUi
								items={getCommentContextMenuItems(comment)}
								isVisible={commentContextMenu}
								onClose={() => setCommentContextMenu(false)}
								anchorRef={moreBtnRef}
							/>
						</Box>
					</Box>

					{formatText(comment.originalContent)}

					{/* <FormattedTextDisplay
						value={comment.content}
						isRawHtml={true}
					/> */}

					<View style={styles.footer}>
						<View style={styles.footerLeft}>
							<View
								style={styles.footerLeftLeft}
							>
								<ButtonUi
									backgroundColor={currentTheme.btnsTheme.background as string}
									bRad={5}
									height="auto"
									fitContent
									paddingVertical={3}
									paddingLeft={10}
									gap={5}
									onPress={onLikePress}
									disabled={comment.isTemp}
								>
									{comment.userLiked ? (
										<LikeIcon
											size={13}
											color={currentTheme.originalMainGradientColor.color}
										/>
									) : (
										<LikeIcon size={13} />
									)}
									<MainText px={13}>{formatNumber(comment.likesCount)}</MainText>
								</ButtonUi>

								<Separator height={12} />

								<ButtonUi
									backgroundColor={currentTheme.btnsTheme.background as string}
									bRad={5}
									height="auto"
									fitContent
									paddingVertical={3}
									paddingRight={10}
									gap={5}
									onPress={onDislikePress}
									disabled={comment.isTemp}
								>
									{comment.userDisliked ? (
										<ComDislike
											size={13}
											color={currentTheme.originalMainGradientColor.color}
										/>
									) : (
										<ComDislike size={13} />
									)}
									<MainText px={13}>{formatNumber(comment.dislikesCount)}</MainText>
								</ButtonUi>
							</View>

							<View style={styles.footerLeftRight}>
								<ButtonUi
									backgroundColor={currentTheme.btnsTheme.background as string}
									bRad={5}
									height="auto"
									fitContent
									paddingVertical={3}
									paddingRight={10}
									paddingLeft={10}
									gap={5}
									onPress={onRepliesPress}
									disabled={comment.isTemp}
								>
									<CommentIcon size={13} />
									<MainText px={13}>{formatNumber(comment.repliesCount)}</MainText>
								</ButtonUi>
							</View>
						</View>

						<View style={styles.footerRight}>
							<LiveTimeAgo fontSize={10} date={comment.createdAt} />
						</View>
					</View>
				</View>
			</View>
		</SimpleButtonUi>
	)
})

const styles = StyleSheet.create({
	moreBtn: {
		position: "absolute",
		right: -10,
		padding: 10,
		alignItems: "center",
		justifyContent: "center",
	},
	commentHeaderRightTopRight: {},
	commentHeaderRightTopLeft: {},
	commentHeaderRightTop: {
		width: "100%"
	},
	commentHeaderLeft: {
	},
	commentHeaderRight: {
		flexDirection: 'column',
		gap: 4,
		flex: 1,
	},
	commentLeft: {
		flexDirection: 'row',
		gap: 7,
	},
	commentRight: {
	},
	commentContent: {
	},
	commentFooter: {
	},
	comment: {
		flexDirection: 'column',
		gap: 10,
		paddingVertical: 10,
		paddingHorizontal: 10,
	},
	footer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginTop: 2,
	},
	footerLeft: {
		flexDirection: 'row',
		gap: 5,
	},
	footerLeftLeft: {
		flexDirection: 'row',
		gap: 10,
		backgroundColor: themeStore.currentTheme.btnsTheme.background as string,
		borderRadius: 5,
		alignItems: 'center',
	},
	footerLeftRight: {
	},
	footerRight: {
	},
})

export type CommentModesT = "default" | "reply" | "comments"

interface CommentProps {
	comment: GetCommentsResponse
	mode?: CommentModesT
	type?: CommentModesT
}