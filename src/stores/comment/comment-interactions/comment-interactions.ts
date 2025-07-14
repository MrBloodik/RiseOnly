import { CommentModesT } from '@components/Posts/Comments/Coment'
import BottomSheet from '@gorhom/bottom-sheet'
import { commentsSortKeyVariants, repliesSortKeyVariants } from '@shared/config/sorts'
import { VirtualList } from '@shared/config/types'
import { postInteractionsStore } from '@stores/post'
import { profileStore } from '@stores/profile'
import { makeAutoObservable, runInAction } from 'mobx'
import { mobxDebouncer, mobxState, MobxUpdateInstance } from 'mobx-toolbox'
import { MutableRefObject } from 'react'
import { Keyboard } from 'react-native'
import { commentActionsStore } from '../comment-actions/comment-actions'
import { CommentSortType, GetCommentsResponse, RespliesSortType } from '../comment-actions/types'
import { GetTempCommentParams } from './types'

class CommentInteractionsStore {
	constructor() { makeAutoObservable(this) }

	isCommentOpen = false
	activeInputRefs: Array<any> = []
	isInputsVisible = true
	bottomSheetRef: React.RefObject<BottomSheet> | null = null

	setIsCommentOpen = (value: boolean) => this.isCommentOpen = value

	selectedComment = mobxState<GetCommentsResponse | null>(null)("selectedComment")

	// TEXT EDITOR

	rawCommentText = mobxState('')('rawCommentText')
	commentText = mobxState('')('commentText')

	rawReplyCommentText = mobxState('')('rawReplyCommentText')
	replyCommentText = mobxState('')('replyCommentText')

	commentInputFocus = mobxState(false)("commentInputFocus")

	// CONTEXT MENU / SORT

	commentListContextMenu = mobxState(false)('commentListContextMenu')

	changeCommentSelectedSort = (sort: CommentSortType) => {
		const { postUpdater, selectedPost } = postInteractionsStore
		const { getCommentsAction } = commentActionsStore

		if (!postUpdater) {
			console.warn('[changeCommentSelectedSort]: No post updater found')
			return
		}
		if (!selectedPost) return

		console.log("[changeCommentSelectedSort]: postId", selectedPost.id)
		postUpdater(selectedPost.id, "selectedCommentSort", sort)
		getCommentsAction(sort, true, false, true)
	}

	changeRepliesSelectedSort = (sort: RespliesSortType) => {
		const { selectedPost } = postInteractionsStore
		const { getRepliesAction } = commentActionsStore
		const {
			selectedCommentForReply: { selectedCommentForReply },
			commentUpdater
		} = commentInteractionsStore

		if (!selectedPost || !selectedCommentForReply) return
		if (!commentUpdater) {
			console.warn('[changeRepliesSelectedSort]: No post updater found')
			return
		}

		console.log("[changeCommentSelectedSort]: sort", sort)
		commentUpdater(selectedCommentForReply.id, "selectedRepliesSort", sort)
		getRepliesAction(sort, true, false, true)
	}

	// COMMENTS CACHE

	getCachedCommentsData = (): VirtualList<GetCommentsResponse[]> | null => {
		const { selectedPost } = postInteractionsStore

		if (!selectedPost) return null

		const cachedCommentsKey = commentsSortKeyVariants[selectedPost?.selectedCommentSort as CommentSortType]

		console.log("[getCachedCommentsData]: cachedCommentsKey ", cachedCommentsKey)

		if (cachedCommentsKey &&
			(
				cachedCommentsKey === 'cachedComments' ||
				cachedCommentsKey === 'cachedCommentsOld' ||
				cachedCommentsKey === 'cachedCommentsNew' ||
				cachedCommentsKey === 'cachedCommentsMy'
			)
		) {
			const res = selectedPost[cachedCommentsKey] as VirtualList<GetCommentsResponse[]>
			if (res) return res
			return null
		}

		return null
	}

	// REPLIES CACHE

	getCachedRepliesData = (): VirtualList<GetCommentsResponse[]> | null => {
		const {
			selectedCommentForReply: { selectedCommentForReply },
			commentUpdater
		} = commentInteractionsStore

		if (!commentUpdater || !selectedCommentForReply) return null
		const cachedRepliesKey = repliesSortKeyVariants[selectedCommentForReply?.selectedRepliesSort as RespliesSortType]

		if (cachedRepliesKey &&
			(
				cachedRepliesKey === 'cachedReplies' ||
				cachedRepliesKey === 'cachedRepliesOld' ||
				cachedRepliesKey === 'cachedRepliesNew' ||
				cachedRepliesKey === 'cachedRepliesMy'
			)
		) {
			const res = selectedCommentForReply[cachedRepliesKey] as VirtualList<GetCommentsResponse[]>
			if (res) return res
			return null
		}

		return null
	}

	// UPDATERS

	commentUpdater: MobxUpdateInstance<GetCommentsResponse> | null = null
	setCommentUpdater = (updater: MobxUpdateInstance<GetCommentsResponse>) => this.commentUpdater = updater

	repliesUpdater: MobxUpdateInstance<GetCommentsResponse> | null = null
	setRepliesUpdater = (updater: MobxUpdateInstance<GetCommentsResponse>) => this.repliesUpdater = updater

	// REFS

	commentScrollRef = mobxState<MutableRefObject<null> | null>(null)('commentScrollRef')
	repliesScrollRef = mobxState<MutableRefObject<null> | null>(null)('repliesScrollRef')

	// INPUT

	registerInput = (ref: any) => {
		if (ref && !this.activeInputRefs.includes(ref)) {
			this.activeInputRefs.push(ref)
		}
	}

	unregisterInput = (ref: any) => {
		this.activeInputRefs = this.activeInputRefs.filter(input => input !== ref)
	}

	dismissKeyboardAndBlurInputs = () => {
		this.activeInputRefs.forEach(input => {
			if (input) {
				if (input.blur) input.blur()
				if (input.blurContentEditor) input.blurContentEditor()

				if (input.commandDOM) {
					input.commandDOM(`
						document.activeElement.blur();
						window.ReactNativeWebView.postMessage(JSON.stringify({type: 'blur'}));
					`)
				}
			}
		})

		Keyboard.dismiss()
	}

	hideInputsTemporarily = () => {
		this.isInputsVisible = false
		Keyboard.dismiss()

		setTimeout(() => {
			this.isInputsVisible = true
		}, 100)
	}

	// BOTTOM SHEET

	commentsBottomSheetCloseSignal = mobxState(false)("commentsBottomSheetCloseSignal")

	setBottomSheetRef = (ref: React.RefObject<BottomSheet>) => this.bottomSheetRef = ref
	closeBottomSheet = () => {
		console.log('Trying to close bottom sheet', this.bottomSheetRef?.current)
		if (this.bottomSheetRef?.current) {
			try {
				this.bottomSheetRef.current.close()
				console.log('Bottom sheet close method called')
			} catch (error) {
				console.error('Error closing bottom sheet:', error)
			}
		} else {
			console.log('Bottom sheet ref is null')
		}
		this.isCommentOpen = false
	}

	// TEMP DATA

	createCommentTempIds = mobxState<string[]>([])("createCommentTempIds")
	createReplyCommentTempIds = mobxState<string[]>([])("createReplyCommentTempIds")

	getTempComment = ({
		id,
		content,
		originalContent,
		postId,
		parentId = null,
		addressedToName = null,
		addressedToTag = null
	}: GetTempCommentParams): GetCommentsResponse | null => {
		const { profile } = profileStore

		if (!profile) {
			console.warn(`[getTempComment]: No profile found, ${profile}`)
			return null
		}

		return {
			"id": id,
			"content": content,
			"originalContent": originalContent,
			"createdAt": new Date().toISOString(),
			"updatedAt": new Date().toISOString(),
			"postId": postId,
			"authorId": profile.id,
			"parentId": parentId,
			"isTemp": true,
			"repliesCount": 0,
			"likesCount": 0,
			"dislikesCount": 0,
			"userLiked": false,
			"userDisliked": false,
			"addressedToName": addressedToName,
			"addressedToTag": addressedToTag,
			"previewReplyComment": null,
			"author": {
				"name": profile.name,
				"tag": profile.tag,
				"more": {
					"isPremium": profile.isPremium,
					"role": profile.role,
					"p_lang": profile.more.p_lang,
					"who": profile.more.who,
					"logo": profile.more.logo,
				}
			}
		}
	}

	// LIKE/DISLIKE COMMENT

	likeCommentHandler = (
		commentId: number,
		comment: GetCommentsResponse,
		type: CommentModesT = "default"
	) => {
		const { likeCommentAction } = commentActionsStore
		const { debouncedAction } = mobxDebouncer

		let userLiked = comment.userLiked
		let userDisliked = comment.userDisliked
		const userLikedStatic = comment.userLikedStatic
		const currentUpdater = type == "default" ? this.commentUpdater : this.repliesUpdater

		if (!currentUpdater) return

		runInAction(() => {
			if (comment.userDisliked) {
				currentUpdater(commentId, "dislikesCount", (prev) => prev - 1)
				currentUpdater(commentId, "userDisliked", (prev) => {
					userDisliked = !prev
					return !prev
				})
			}
			currentUpdater(commentId, "likesCount", (prev) => prev + (comment.userLiked ? -1 : 1))
			currentUpdater(commentId, "userLiked", (prev) => {
				userLiked = !prev
				return !prev
			})
		})

		debouncedAction(
			commentId + type,
			() => {
				if (userLikedStatic === userLiked) return
				likeCommentAction(commentId, currentUpdater)
			},
			1000
		)
	}

	dislikeCommentHandler = (
		commentId: number,
		comment: GetCommentsResponse,
		type: CommentModesT = "default"
	) => {
		const { dislikeCommentAction } = commentActionsStore
		const { debouncedAction } = mobxDebouncer

		let userLiked = comment.userLiked
		let userDisliked = comment.userDisliked
		const userDislikedStatic = comment.userDislikedStatic
		const currentUpdater = type == "default" ? this.commentUpdater : this.repliesUpdater

		if (!currentUpdater) return

		runInAction(() => {
			if (comment.userLiked) {
				currentUpdater(commentId, "likesCount", (prev) => prev - 1)
				currentUpdater(commentId, "userLiked", (prev) => {
					userLiked = !prev
					return !prev
				})
			}
			currentUpdater(commentId, "dislikesCount", (prev) => prev + (comment.userDisliked ? -1 : 1))
			currentUpdater(commentId, "userDisliked", (prev) => {
				userDisliked = !prev
				return !prev
			})
		})

		debouncedAction(
			commentId + type,
			() => {
				if (userDislikedStatic === userDisliked) return
				dislikeCommentAction(commentId, currentUpdater)
			},
			1000
		)
	}

	// REPLIES

	repliesOpen = mobxState(false)("repliesOpen")
	selectedCommentForReply = mobxState<GetCommentsResponse | null>(null)("selectedCommentForReply")
	selectedCommentToReply = mobxState<GetCommentsResponse | null>(null)("selectedCommentToReply")

	onCloseReplies = () => this.repliesOpen.setRepliesOpen(false)

	// MODALS

	deleteCommentModal = mobxState(false)("deleteCommentModal")

}

export const commentInteractionsStore = new CommentInteractionsStore()