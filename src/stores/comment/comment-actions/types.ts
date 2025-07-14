import { AuthorInfo, VirtualList } from '@shared/config/types'

export type CommentSortType = "feed" | "new" | "old" | "my"
export type RespliesSortType = "popular" | "new" | "old" | "my"

// PARAMS/BODY
export interface GetCommentsParams {
	sort?: CommentSortType
	relativeId: number | null
	limit: number
	up: boolean
}

export interface GetRepliesParams {
	sort?: Omit<CommentSortType, "feed">
	relativeId?: number | null
	up?: boolean
	page?: number
	limit?: number
}

export interface CreateCommentBody {
	content: string
	originalContent: string
	parentId?: number | null
	addressedToName?: string
	addressedToTag?: string
}

// RESPONSES

export interface GetCommentsResponse {
	id: number | string
	content: string
	originalContent: string
	createdAt: string
	updatedAt: string
	postId: number
	authorId: string
	parentId: number | null
	repliesCount: number
	isTemp: boolean
	likesCount: number
	dislikesCount: number
	userLiked: boolean
	userDisliked: boolean
	userLikedStatic?: boolean
	userDislikedStatic?: boolean
	addressedToName: string | null
	addressedToTag: string | null
	author: AuthorInfo
	previewReplyComment?: GetCommentsResponse | null

	// REPLIES SORT CACHE
	selectedRepliesSort?: RespliesSortType
	cachedReplies?: VirtualList<GetCommentsResponse[]>
	cachedRepliesOld?: VirtualList<GetCommentsResponse[]>
	cachedRepliesNew?: VirtualList<GetCommentsResponse[]>
	cachedRepliesMy?: VirtualList<GetCommentsResponse[]>
}
