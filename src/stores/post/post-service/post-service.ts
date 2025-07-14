import { showNotify } from '@shared/config/const';
import { DefaultResponse } from '@shared/config/types';
import { getCurrentRoute } from '@shared/lib/navigation';
import { profileStore } from '@stores/profile';
import { AxiosError } from 'axios';
import i18next from 'i18next';
import { makeAutoObservable } from 'mobx';
import { useMobxUpdate } from 'mobx-toolbox';
import { postActionsStore } from '../post-actions/post-actions';
import { GetPostFeedResponse } from '../post-actions/types';
import { postInteractionsStore } from '../post-interactions/post-interactions';

class PostServiceStore {
	constructor() {
		makeAutoObservable(this);
	}

	createPostStatuses = new Map<string, "pending" | "fulfilled" | "rejected">();

	changeCreatePostStatus = (uploadId: string, status: "pending" | "fulfilled" | "rejected") => {
		this.createPostStatuses.set(uploadId, status);
	};

	checkPostIdProviding = (funcName: string) => {
		const { selectedPost } = postInteractionsStore;
		const postId = selectedPost?.id;
		if (!postId) {
			console.warn(`[${funcName}]: Post id not provided\n`);
			return false;
		}
		return true;
	};

	filterPostAfterDelete = (postId: number | string) => {
		const { profile } = profileStore;
		const { userPosts, postsFeed } = postActionsStore;

		const path = getCurrentRoute()?.name;
		console.log("[filterPostAfterDelete]: path ", path);

		if (!userPosts?.data) return;
		if (!postsFeed?.data) return;

		const deletedPostIndex = userPosts.data.list.findIndex(post => post.id === postId);
		const deletedPost = userPosts.data.list[deletedPostIndex];

		// Сохраняем информацию о позиции поста
		const deletionInfo = {
			userPostIndex: deletedPost.authorId == profile?.id ? deletedPostIndex : -1,
			feedPostIndex: postsFeed.data.list.findIndex(post => post.id === postId)
		};

		if (deletedPost.authorId == profile?.id) {
			userPosts.data.list = userPosts.data.list.filter(post => post.id !== postId);
		}

		postsFeed.data.list = postsFeed.data.list.filter(post => post.id !== postId);

		return {
			post: deletedPost,
			positions: deletionInfo
		};
	};

	restoreDeletedPost = (deletedPostData: any) => {
		const { profile } = profileStore;
		const { userPosts, postsFeed } = postActionsStore;

		if (!deletedPostData || !deletedPostData.post) return;

		const { post: { deletedPost, positions } } = deletedPostData;

		if (!userPosts?.data || !postsFeed?.data) return;

		if (deletedPost.authorId === profile?.id && userPosts.data.list && positions.userPostIndex >= 0) {
			userPosts.data.list.insert(positions.userPostIndex, deletedPost);
		}

		if (postsFeed.data.list && positions.feedPostIndex >= 0) {
			postsFeed.data.list.insert(positions.feedPostIndex, deletedPost);
		}

		console.log("[restoreDeletedPost]: Пост восстановлен", deletedPost.id);
	};

	// GET POSTS HANDLERS

	getPostsSuccessHandler = (data: any) => {
		const { setPostUpdater } = postInteractionsStore;

		setPostUpdater(useMobxUpdate(() => data.list));
	};

	getPostsErrorHandler = (error: AxiosError<DefaultResponse>) => {
		// showNotify("error", {
		// 	message: i18next.t("get_posts_error_text")
		// })
	};

	// CREATE POST HANDLERS

	resetAllCreatePostPage = () => {
		const {
			inpHashtags: { setInpHashtags },
			selectedMedias: { setSelectedMedias },
			createPostForm
		} = postInteractionsStore;

		createPostForm.reset();
		setInpHashtags("");
		setSelectedMedias([]);
	};

	createPostSuccessHandler = (data: GetPostFeedResponse) => {
		if (!postActionsStore.userPosts.data) return;

		this.resetAllCreatePostPage();
		postActionsStore.userPosts.data.list = postActionsStore.userPosts.data.list.replaceAt(0, data);
		showNotify("success", {
			message: i18next.t("create_post_success_text")
		});
	};

	createPostErrorHandler = (error: AxiosError<DefaultResponse>, tempId: number | string) => {
		this.removeTempPost(tempId);
		showNotify("error", {
			message: i18next.t("crete_post_error_text")
		});
	};

	// TEMP DATA

	getPostTempData = (tempId: string) => {
		const { createPostForm: { values } } = postInteractionsStore;

		const res: Partial<GetPostFeedResponse> = {
			id: tempId,
			canComment: true,
			isTemp: true,
			title: values.title,
			content: values.content, // TODO: Поменять когда изменю формат текстового редактора
			originalContent: values.content,
			hashtags: values.hashtags,
			tags: values.tags,
			images: []
		};

		return res;
	};

	addTempPost = (tempData: Partial<GetPostFeedResponse>) => {
		if (!postActionsStore.userPosts.data) return;

		postActionsStore.userPosts.data.list = [...[tempData as GetPostFeedResponse], ...postActionsStore.userPosts.data.list];
	};

	removeTempPost = (tempId: number | string) => {
		if (!postActionsStore.userPosts.data) return;

		postActionsStore.userPosts.data.list = postActionsStore.userPosts.data.list.filter(t => t.id !== tempId);
	};
}

export const postServiceStore = new PostServiceStore();
