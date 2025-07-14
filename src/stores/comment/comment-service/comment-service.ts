import { showNotify } from '@shared/config/const'
import { commentsSortKeyVariants, repliesSortKeyVariants } from '@shared/config/sorts'
import { DefaultResponse, PreDataModeType, VirtualList } from '@shared/config/types'
import { postInteractionsStore } from '@stores/post'
import { AxiosError, AxiosResponse } from 'axios'
import i18next from 'i18next'
import { makeAutoObservable, runInAction } from 'mobx'
import { clearMobxSaiFetchCache, mobxSaiFetch, MobxUpdateInstance, useMobxUpdate } from 'mobx-toolbox'
import { commentActionsStore } from '../comment-actions/comment-actions'
import { CommentSortType, GetCommentsResponse, RespliesSortType } from '../comment-actions/types'
import { commentInteractionsStore } from '../comment-interactions/comment-interactions'

class CommentServiceStore {
	constructor() {
		makeAutoObservable(this)
	}

	checkPostIdProviding = (funcName: string) => {
		const { selectedPost } = postInteractionsStore
		const postId = selectedPost?.id
		if (!postId) {
			console.warn(`[${funcName}]: Post id not provided\n`)
			return false
		}
		return true
	}

	// COMMENTS CACHE

	setCachedCommentsData = (sort: CommentSortType, postId: number | string, data: VirtualList<GetCommentsResponse[]>) => {
		const { postUpdater } = postInteractionsStore

		if (!postUpdater) {
			console.warn(`[setCachedCommentsData]: Post updater not found`)
			return
		}

		postUpdater(postId, commentsSortKeyVariants[sort] as any, data)
	}

	clearCachedCommentsData = (postId: number | string) => {
		runInAction(() => {
			clearMobxSaiFetchCache(postId + "feed")
			clearMobxSaiFetchCache(postId + "new")
			clearMobxSaiFetchCache(postId + "old")
			clearMobxSaiFetchCache(postId + "my")
		})
	}

	// REPLIES CACHE

	setCachedRepliesData = (sort: RespliesSortType, postId: number | string, data: VirtualList<GetCommentsResponse[]>) => {
		const {
			selectedCommentForReply: { selectedCommentForReply },
			commentUpdater,
		} = commentInteractionsStore

		if (!selectedCommentForReply) return
		if (!commentUpdater) {
			console.warn(`[setCachedRepliesData]: Comment updater not found`)
			return
		}

		commentUpdater(selectedCommentForReply.id, repliesSortKeyVariants[sort] as any, data)
	}

	clearCachedRepliesData = (postId: number | string, commentId: number | string) => {
		runInAction(() => {
			clearMobxSaiFetchCache(postId + String(commentId) + "replies" + "popular")
			clearMobxSaiFetchCache(postId + String(commentId) + "replies" + "new")
			clearMobxSaiFetchCache(postId + String(commentId) + "replies" + "old")
			clearMobxSaiFetchCache(postId + String(commentId) + "replies" + "my")
		})
	}

	// CREATE COMMENT HELPERS

	openAndReplyComment = (comment: GetCommentsResponse) => {
		const {
			repliesOpen: { setRepliesOpen },
			selectedCommentForReply: { setSelectedCommentForReply },
			selectedCommentToReply: { setSelectedCommentToReply },
			replyCommentText: { setReplyCommentText },
			rawReplyCommentText: { setRawReplyCommentText },
			commentInputFocus: { setCommentInputFocus }
		} = commentInteractionsStore

		runInAction(() => {
			setSelectedCommentForReply(comment)
			setSelectedCommentToReply(comment)
			setReplyCommentText(`@${comment.author.tag},`)
			setRawReplyCommentText(`@${comment.author.tag},`)
			setRepliesOpen(true)
			setCommentInputFocus(p => !p)
		})
	}

	// ========================== COMMENT PRE DATA =============================

	// PRE CREATE COMMENT

	preCreateComment = (postId: number, tempId: string) => {
		const { postUpdater } = postInteractionsStore
		const {
			comments,
			replies
		} = commentActionsStore
		const {
			commentText: { commentText, setCommentText },
			rawCommentText: { rawCommentText, setRawCommentText },
			replyCommentText: { replyCommentText, setReplyCommentText },
			rawReplyCommentText: { rawReplyCommentText, setRawReplyCommentText },
			repliesOpen: { repliesOpen },
			createCommentTempIds: { setCreateCommentTempIds },
			createReplyCommentTempIds: { setCreateReplyCommentTempIds },
			selectedCommentForReply: { selectedCommentForReply },
			selectedCommentToReply: { selectedCommentToReply },
			commentUpdater,
			repliesUpdater,
			getTempComment
		} = commentInteractionsStore

		const content = repliesOpen ? replyCommentText : commentText
		const originalContent = repliesOpen ? rawReplyCommentText : rawCommentText

		const tempComment = getTempComment({
			id: tempId,
			content,
			originalContent,
			postId,
			parentId: repliesOpen ? Number(selectedCommentToReply?.id) : null
		})

		if (!tempComment || !(repliesOpen ? replies : comments)?.data?.items) return

		// UPDATES
		postUpdater!(postId, "commentsCount", (prev: number) => prev + 1)
		if (repliesOpen) {
			try {
				if (commentUpdater && selectedCommentForReply?.id != null) {
					commentUpdater(selectedCommentForReply.id, "repliesCount", p => p + 1)
				}
				if (selectedCommentToReply?.id && selectedCommentToReply.id != selectedCommentForReply?.id) {
					if (repliesUpdater) {
						repliesUpdater(selectedCommentToReply.id, "repliesCount", p => p + 1)
					}
				}
			} catch (err) {
				console.log("err", err)
			}
		}

		(repliesOpen ? replies : comments).data!.items = [tempComment, ...((repliesOpen ? replies : comments).data!.items || [])]

		if (repliesOpen) {
			setReplyCommentText("")
			setRawReplyCommentText("")
			setCreateReplyCommentTempIds(prev => prev.filter(t => t != tempId))
		} else {
			setCommentText("")
			setRawCommentText("")
			setCreateCommentTempIds(prev => prev.filter(t => t != tempId))
		}

	}

	// PRE COMMENT DELETE

	// TODO: [preCommentDelete]: Clean code refactor
	preCommentDelete = (mode: PreDataModeType = "default") => {
		const { selectedPost, postUpdater } = postInteractionsStore
		const {
			deleteCommentModal: { setDeleteCommentModal },
			selectedComment: { selectedComment },
			selectedCommentForReply: { selectedCommentForReply },
			selectedCommentToReply: { selectedCommentToReply },
			repliesOpen: { repliesOpen },
			commentUpdater,
			repliesUpdater
		} = commentInteractionsStore

		if (!selectedPost || !postUpdater || !selectedComment) return

		setDeleteCommentModal(false)
		const commentId = selectedComment.id

		// DECREMENT COMMENT COUNT
		postInteractionsStore.selectedPost!.commentsCount = postInteractionsStore.selectedPost!.commentsCount - 1
		postUpdater(selectedComment.postId, "commentsCount", p => p - 1)
		if (!repliesOpen) {
			if (commentUpdater) {
				commentUpdater(commentId, "repliesCount", p => p - 1)
			}
		} else {
			if (selectedCommentToReply?.id == selectedCommentForReply?.id) {
				selectedCommentForReply!.repliesCount = selectedCommentForReply!.repliesCount - 1
			}
			if (repliesUpdater && selectedCommentToReply) {
				repliesUpdater(selectedCommentToReply.id, "repliesCount", p => p - 1)
			}
		}

		// FILTER COMMENTS LISTS
		const commentsClone = [...(commentActionsStore.comments.data?.items || [])]
		const repliesClone = [...(commentActionsStore.comments.data?.items || [])]

		// FILTER CACHED IN POSTS COMMENTS LISTS
		const selectedPostCachedComments = [...(postInteractionsStore.selectedPost?.cachedComments?.items || [])]
		const selectedPostCachedCommentsMy = [...(postInteractionsStore.selectedPost?.cachedCommentsMy?.items || [])]
		const selectedPostCachedCommentsNew = [...(postInteractionsStore.selectedPost?.cachedCommentsNew?.items || [])]
		const selectedPostCachedCommentsOld = [...(postInteractionsStore.selectedPost?.cachedCommentsOld?.items || [])]

		// FILTER CACHED IN COMMENT REPLIES LISTS
		const selectedCommentCachedReplies = [...(commentInteractionsStore.selectedCommentForReply.selectedCommentForReply?.cachedReplies?.items || [])]
		const selectedCommentCachedRepliesMy = [...(commentInteractionsStore.selectedCommentForReply.selectedCommentForReply?.cachedRepliesMy?.items || [])]
		const selectedCommentCachedRepliesNew = [...(commentInteractionsStore.selectedCommentForReply.selectedCommentForReply?.cachedRepliesNew?.items || [])]
		const selectedCommentCachedRepliesOld = [...(commentInteractionsStore.selectedCommentForReply.selectedCommentForReply?.cachedRepliesOld?.items || [])]

		runInAction(() => {
			if (commentActionsStore.comments.data) {
				console.log("1")
				commentActionsStore.comments.data.items = mode == "repair" ? commentsClone : commentActionsStore.comments.data.items.filter(t => String(t.id) != String(commentId))
				console.log("2")
			}
			if (commentActionsStore.replies.data) commentActionsStore.replies.data.items = mode == "repair" ? repliesClone : commentActionsStore.replies.data.items.filter(t => String(t.id) != String(commentId))
			if (postInteractionsStore.selectedPost?.cachedComments) postInteractionsStore.selectedPost.cachedComments.items = mode == "repair" ? selectedPostCachedComments : postInteractionsStore.selectedPost.cachedComments.items.filter(t => String(t.id) != String(commentId))
			if (postInteractionsStore.selectedPost?.cachedCommentsMy) postInteractionsStore.selectedPost.cachedCommentsMy.items = mode == "repair" ? selectedPostCachedCommentsMy : postInteractionsStore.selectedPost.cachedCommentsMy.items.filter(t => String(t.id) != String(commentId))
			if (postInteractionsStore.selectedPost?.cachedCommentsNew) postInteractionsStore.selectedPost.cachedCommentsNew.items = mode == "repair" ? selectedPostCachedCommentsNew : postInteractionsStore.selectedPost.cachedCommentsNew.items.filter(t => String(t.id) != String(commentId))
			if (postInteractionsStore.selectedPost?.cachedCommentsOld) postInteractionsStore.selectedPost.cachedCommentsOld.items = mode == "repair" ? selectedPostCachedCommentsOld : postInteractionsStore.selectedPost.cachedCommentsOld.items.filter(t => String(t.id) != String(commentId))
			if (commentInteractionsStore.selectedCommentForReply.selectedCommentForReply?.cachedReplies) commentInteractionsStore.selectedCommentForReply.selectedCommentForReply.cachedReplies.items = mode == "repair" ? selectedCommentCachedReplies : commentInteractionsStore.selectedCommentForReply.selectedCommentForReply.cachedReplies.items.filter(t => String(t.id) != String(commentId))
			if (commentInteractionsStore.selectedCommentForReply.selectedCommentForReply?.cachedRepliesMy) commentInteractionsStore.selectedCommentForReply.selectedCommentForReply.cachedRepliesMy.items = mode == "repair" ? selectedCommentCachedRepliesMy : commentInteractionsStore.selectedCommentForReply.selectedCommentForReply.cachedRepliesMy.items.filter(t => String(t.id) != String(commentId))
			if (commentInteractionsStore.selectedCommentForReply.selectedCommentForReply?.cachedRepliesNew) commentInteractionsStore.selectedCommentForReply.selectedCommentForReply.cachedRepliesNew.items = mode == "repair" ? selectedCommentCachedRepliesNew : commentInteractionsStore.selectedCommentForReply.selectedCommentForReply.cachedRepliesNew.items.filter(t => String(t.id) != String(commentId))
			if (commentInteractionsStore.selectedCommentForReply.selectedCommentForReply?.cachedRepliesOld) commentInteractionsStore.selectedCommentForReply.selectedCommentForReply.cachedRepliesOld.items = mode == "repair" ? selectedCommentCachedRepliesOld : commentInteractionsStore.selectedCommentForReply.selectedCommentForReply.cachedRepliesOld.items.filter(t => String(t.id) != String(commentId))

			if (mode == "repair") {
				postInteractionsStore.selectedPost!.commentsCount = postInteractionsStore.selectedPost!.commentsCount + 1
				postUpdater(selectedComment.postId, "commentsCount", p => p + 1)
				if (!repliesOpen) {
					if (commentUpdater) {
						commentUpdater(commentId, "repliesCount", p => p + 1)
					}
				} else {
					if (selectedCommentToReply?.id == selectedCommentForReply?.id) {
						selectedCommentForReply!.repliesCount = selectedCommentForReply!.repliesCount + 1
					}
					if (repliesUpdater && selectedCommentToReply) {
						repliesUpdater(selectedCommentToReply.id, "repliesCount", p => p + 1)
					}
				}
			}
		})
	}

	// ========================== COMMENT HANDLERS ============================

	// CREATE COMMENT HANDLERS

	createCommentSuccessHandler = (
		data: GetCommentsResponse,
		tempId: string,
	) => {
		const { comments, replies } = commentActionsStore
		const {
			repliesOpen: { repliesOpen }
		} = commentInteractionsStore

		const tempIndex = (repliesOpen ? replies : comments).data!.items.findIndex(comment => comment.id === tempId)

		if (
			tempIndex !== -1 &&
			tempIndex !== undefined &&
			(comments?.data?.items || replies?.data?.items) &&
			data
		) {
			const prevTempComment = (repliesOpen ? replies : comments).data!.items[tempIndex]

			const realComment: GetCommentsResponse = {
				...data,
				isTemp: false,
				userLiked: prevTempComment.userLiked ?? data.userLiked,
				userDisliked: prevTempComment.userDisliked ?? data.userDisliked,
				likesCount: data.likesCount ?? prevTempComment.likesCount,
				dislikesCount: data.dislikesCount ?? prevTempComment.dislikesCount,
				repliesCount: data.repliesCount ?? prevTempComment.repliesCount,
			};

			(repliesOpen ? replies : comments).data!.items[tempIndex] = realComment
		}
	}

	createCommentErrorHandler = (
		error: AxiosResponse<DefaultResponse>,
		tempId: string,
		commentTextClone: string,
		rawCommentTextClone: string
	) => {
		const { postUpdater, selectedPost } = postInteractionsStore
		const { comments } = commentActionsStore
		const {
			commentText: { setCommentText },
			rawCommentText: { setRawCommentText }
		} = commentInteractionsStore

		if (!selectedPost) return
		const postId = selectedPost.id

		comments?.data?.items?.filter((item) => item.id !== tempId)
		postUpdater!(postId, "commentsCount", (prev: number) => prev - 1)
		setCommentText(commentTextClone)
		setRawCommentText(rawCommentTextClone)
	}

	// GET COMMENTS HANDLERS

	getCommentsSuccessHandler = (
		data: VirtualList<GetCommentsResponse[]>,
		sort: CommentSortType,
		postId: number | string
	) => {
		const { setCommentUpdater } = commentInteractionsStore

		setCommentUpdater(useMobxUpdate(() => data?.items))
		this.setCachedCommentsData(sort, postId, data)
	}

	getCommentsErrorHandler = (error: AxiosError<DefaultResponse>) => {
		showNotify("error", {
			message: "get_comments_error_text"
		})
	}

	// GET REPLIES HANDLERS

	getRepliesSuccessHandler = (
		data: VirtualList<GetCommentsResponse[]>,
		sort: RespliesSortType,
		postId: number | string
	) => {
		const { setRepliesUpdater } = commentInteractionsStore

		console.log("getRepliesSuccessHandler", data)

		setRepliesUpdater(useMobxUpdate(() => data?.items))
		this.setCachedRepliesData(sort, postId, data)
	}

	getRepliesErrorHandler = (error: AxiosError<DefaultResponse>) => {
		showNotify("error", {
			message: i18next.t("get_replies_error_text")
		})
	}

	// LIKE COMMENT HANDLERS

	likeCommentSuccessHandler = (data: any, commentId: number, currentUpdater: MobxUpdateInstance<GetCommentsResponse>) => {
		if (!currentUpdater) return

		currentUpdater(commentId, "userLikedStatic", (prev) => !prev)
	}

	likeCommentErrorHandler = (error: AxiosError<DefaultResponse>) => {
		showNotify("error", {
			message: i18next.t("like_comment_error_text")
		})
	}

	// DISLIKE COMMENT HANDLERS

	dislikeCommentSuccessHandler = (data: any, commentId: number, currentUpdater: MobxUpdateInstance<GetCommentsResponse>) => {
		if (!currentUpdater) return

		currentUpdater(commentId, "userDislikedStatic", (prev) => !prev)
	}

	dislikeCommentErrorHandler = (error: AxiosResponse<DefaultResponse>) => {
		showNotify("error", {
			message: i18next.t("dislike_comment_error_text")
		})
	}

	// DELETE COMMENT HANDLERS

	/**
	* "message": "Comment deleted successfully",
	* "statusCode": 200,
	*/
	deleteCommentSuccess = (data: DefaultResponse) => {
		showNotify("success", {
			message: i18next.t("delete_comment_success_text")
		})
		mobxSaiFetch
	}

	deleteCommentError = (error: DefaultResponse) => {
		const { preCommentDelete } = commentServiceStore

		preCommentDelete("repair")
		showNotify("error", {
			message: i18next.t("delete_comment_error_text")
		})
	}
}

export const commentServiceStore = new CommentServiceStore()