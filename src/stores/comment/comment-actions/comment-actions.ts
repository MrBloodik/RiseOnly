import { rust } from '@shared/api/api';
import { DefaultResponse, VirtualList } from '@shared/config/types';
import { numericId } from '@shared/lib/numbers';
import { postInteractionsStore } from '@stores/post';
import { makeAutoObservable } from 'mobx';
import { mobxSaiFetch, mobxSaiHandler, MobxSaiInstance, mobxState, MobxUpdateInstance, useMobxUpdate } from 'mobx-toolbox';
import { commentInteractionsStore } from '../comment-interactions/comment-interactions';
import { commentServiceStore } from '../comment-service/comment-service';
import { CommentSortType, CreateCommentBody, GetCommentsParams, GetCommentsResponse, GetRepliesParams, RespliesSortType } from './types';

class CommentActionsStore {
	constructor() { makeAutoObservable(this); }

	// GET COMMENTS

	comments: MobxSaiInstance<VirtualList<GetCommentsResponse[]>> = {};

	getCommentsAction = async (
		sort: CommentSortType = "feed",
		fetchIfHaveData = true,
		needAddToArr = true,
		fromContextMenu = false
	) => {
		const { selectedPost } = postInteractionsStore;
		const {
			clearCachedCommentsData,
			getCommentsSuccessHandler,
			getCommentsErrorHandler
		} = commentServiceStore;
		const {
			commentScrollRef: { commentScrollRef },
			getCachedCommentsData,
			setCommentUpdater
		} = commentInteractionsStore;

		if (!selectedPost?.id) return;
		const postId = selectedPost.id;

		// CACHE SYSTEM
		const cachedData = getCachedCommentsData();
		if (fromContextMenu && cachedData != null) {
			console.log("[getCommentsAction]: Cached data", cachedData);
			setCommentUpdater(useMobxUpdate(() => cachedData?.items));
			clearCachedCommentsData(postId);
			return;
		}

		const params = mobxState<GetCommentsParams>({
			relativeId: null,
			limit: 20,
			up: false,
			sort
		})("params");

		this.comments = mobxSaiFetch(
			() => getComments(postId, params.params),
			{
				id: postId + sort,
				fetchIfHaveData,
				dataScope: {
					startFrom: "top",
					scrollRef: commentScrollRef,
					botPercentage: 80,
					setParams: params.setParams,
					relativeParamsKey: "relativeId",
					isHaveMoreResKey: "hasMore",
					howMuchGettedToTop: 3,
				},
				cacheSystem: {
					limit: 20,
				},
				fetchAddTo: {
					path: "items",
					addTo: needAddToArr ? "end" : undefined,
				}
			}
		);

		mobxSaiHandler(
			this.comments,
			(data: VirtualList<GetCommentsResponse[]>) => getCommentsSuccessHandler(data, sort, postId),
			getCommentsErrorHandler
		);
	};

	// CREATE COMMENT

	createComment: MobxSaiInstance<any> = {};

	createCommentAction = async () => {
		const { selectedPost, postUpdater } = postInteractionsStore;
		const {
			preCreateComment,
			createCommentErrorHandler,
			createCommentSuccessHandler
		} = commentServiceStore;
		const {
			commentText: { commentText },
			rawCommentText: { rawCommentText },
			rawReplyCommentText: { rawReplyCommentText },
			repliesOpen: { repliesOpen },
			selectedCommentForReply: { selectedCommentForReply }
		} = commentInteractionsStore;

		const postId = selectedPost?.id!;
		if (!commentServiceStore.checkPostIdProviding('createCommentAction')) return;

		const tempId = numericId();
		const commentTextClone = commentText;
		const rawCommentTextClone = rawCommentText;

		if (typeof postId === "string") return;
		preCreateComment(postId, tempId);

		const body: CreateCommentBody = {
			content: repliesOpen ? rawReplyCommentText : rawCommentText, // TODO: Переделать в нормальный редактор текста со своими правилами а не разметкой html
			originalContent: repliesOpen ? rawReplyCommentText : rawCommentText,
			parentId: repliesOpen ? Number(selectedCommentForReply!.id) : null
		};

		this.createComment = mobxSaiFetch(createComment(postId, body));

		mobxSaiHandler(
			this.createComment,
			(success) => createCommentSuccessHandler(success, tempId),
			(error) => createCommentErrorHandler(error, tempId, commentTextClone, rawCommentTextClone)
		);
	};

	// LIKE COMMENT

	likeComment: MobxSaiInstance<DefaultResponse> = {};
	loading = false;

	likeCommentAction = async (commentId: number, currentUpdater: MobxUpdateInstance<GetCommentsResponse>) => {
		const { likeCommentSuccessHandler, likeCommentErrorHandler } = commentServiceStore;

		this.likeComment = mobxSaiFetch(likeComment(commentId));

		mobxSaiHandler(
			this.likeComment,
			(data) => likeCommentSuccessHandler(data, commentId, currentUpdater),
			likeCommentErrorHandler
		);
	};

	// DISLIKE COMMENT

	dislikeComment: MobxSaiInstance<DefaultResponse> = {};

	dislikeCommentAction = async (commentId: number, currentUpdater: MobxUpdateInstance<GetCommentsResponse>) => {
		const { dislikeCommentSuccessHandler, dislikeCommentErrorHandler } = commentServiceStore;

		this.dislikeComment = mobxSaiFetch(dislikeComment(commentId));

		mobxSaiHandler(
			this.dislikeComment,
			(data) => dislikeCommentSuccessHandler(data, commentId, currentUpdater),
			dislikeCommentErrorHandler
		);
	};

	// GET REPLIES

	replies: MobxSaiInstance<VirtualList<GetCommentsResponse[]>> = {};
	REPLIES_LIMIT = 20;

	getRepliesAction = (
		sort: RespliesSortType = "popular",
		fetchIfHaveData = true,
		needAddToArr = true,
		fromContextMenu = false
	) => {
		const { selectedPost } = postInteractionsStore;
		const {
			getRepliesSuccessHandler,
			getRepliesErrorHandler,
			clearCachedRepliesData
		} = commentServiceStore;
		const {
			selectedCommentForReply: { selectedCommentForReply },
			repliesScrollRef: { repliesScrollRef },
			setRepliesUpdater,
			getCachedRepliesData
		} = commentInteractionsStore;

		if (!selectedCommentForReply || !selectedPost) return;
		const commentId = selectedCommentForReply.id;
		const postId = selectedPost.id;

		// CACHE SYSTEM
		const cachedData = getCachedRepliesData();
		if (fromContextMenu && cachedData != null) {
			console.log("[getCommentsAction]: Cached data", cachedData);
			setRepliesUpdater(useMobxUpdate(() => cachedData?.items));
			clearCachedRepliesData(postId, commentId);
			return;
		}

		const params = mobxState<GetRepliesParams>({
			limit: this.REPLIES_LIMIT,
			relativeId: null,
			up: false,
			sort
		})("params");

		this.replies = mobxSaiFetch(
			() => getReplies(commentId, params.params),
			{
				id: postId + String(commentId) + "replies" + sort,
				fetchIfHaveData,
				dataScope: {
					startFrom: "top",
					scrollRef: repliesScrollRef,
					botPercentage: 80,
					isHaveMoreResKey: "isHaveMore",
					setParams: params.setParams,
					relativeParamsKey: "relativeId",
					howMuchGettedToTop: 100000,
					upOrDownParamsKey: "up",
				},
				cacheSystem: {
					limit: this.REPLIES_LIMIT
				},
				fetchAddTo: {
					path: "items",
					addTo: needAddToArr ? "end" : undefined
				},
			}
		);

		mobxSaiHandler(
			this.replies,
			(data) => getRepliesSuccessHandler(data, sort, postId),
			getRepliesErrorHandler
		);
	};

	// DELETE COMMENT

	deleteCommentSai: MobxSaiInstance<DefaultResponse> = {};

	deleteCommentAction = () => {
		const { deleteCommentSuccess, deleteCommentError, preCommentDelete } = commentServiceStore;
		const { selectedComment: { selectedComment } } = commentInteractionsStore;

		if (!selectedComment) return;
		const commentId = selectedComment.id;

		preCommentDelete();

		this.deleteCommentSai = mobxSaiFetch(deleteComment(commentId));

		mobxSaiHandler(
			this.deleteCommentSai,
			deleteCommentSuccess,
			deleteCommentError
		);
	};
}

export const commentActionsStore = new CommentActionsStore();

export const getComments = async (postId: number | string, params: GetCommentsParams) => (await rust.get(`/comment/post/${postId}`, { params: params })).data;
export const getReplies = async (commentId: number | string, params?: GetRepliesParams) => (await rust.get(`/comment/post/replies/${commentId}`, { params })).data;
export const createComment = async (postId: number | string, body: CreateCommentBody) => (await rust.post(`/comment/post/${postId}`, body)).data;
export const likeComment = async (commentId: number | string) => (await rust.post(`/comment/${commentId}/like`)).data;
export const dislikeComment = async (commentId: number | string) => (await rust.post(`/comment/${commentId}/dislike`)).data;
export const deleteComment = async (commentId: number | string) => (await rust.delete(`/comment/${commentId}`)).data;