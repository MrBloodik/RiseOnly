import { AuthorInfo, VirtualList } from '@shared/config/types';
import { CommentSortType, GetCommentsResponse } from '@stores/comment/comment-actions/types';

// GET POSTS

export interface GetPostFeedResponse {
	id: number | string;
	title: string;
	content: string;
	originalContent: string;
	hashtags: string[];
	tags: string[];
	viewsCount: number;
	createdAt: string;
	updatedAt: string;
	authorId: string;
	mainCommentsCount: number;
	commentsCount: number;
	canComment: boolean;
	likesCount: number;
	favoritesCount: number;
	images: string[];
	isLiked: boolean;
	isFavorited: boolean;
	author: AuthorInfo;

	// COMMENTS SORT CACHE
	selectedCommentSort?: CommentSortType;
	cachedComments?: VirtualList<GetCommentsResponse[]>;
	cachedCommentsOld?: VirtualList<GetCommentsResponse[]>;
	cachedCommentsNew?: VirtualList<GetCommentsResponse[]>;
	cachedCommentsMy?: VirtualList<GetCommentsResponse[]>;

	// TEMP DATA
	isTemp?: boolean;
	progress?: number;
}

export interface GetUserPostsParams {
	sort?: "new" | "old";
	relativeId: number | null;
	limit: number;
	up: boolean;
}

export interface GetPostsParams {
	relativeId?: number | string | null;
	total?: number;
	limit?: number;
	up?: boolean;
	page?: number;
	q?: string;
	newFeed?: boolean;
}

export interface GetPostsActionSettings {
	needAddToArr?: boolean;
	fetchIfHaveData?: boolean;
}

export interface CreatePostBody {
	"canComment": boolean;
	"title": string;
	"originalContent": string;
	"content": string;
	"hashtags": string[];
	"tags": string[];
	"images": string[];
}