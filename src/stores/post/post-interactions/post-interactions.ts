import { CreatePostSchema } from '@shared/schemas/postSchema';
import { ImageData } from '@shared/ui/ImageViewerUi/ImageViewerUi';
import { MediaItem } from '@shared/ui/MediaPickerUi/MediaPickerUi';
import { makeAutoObservable, runInAction } from 'mobx';
import { MobxUpdateInstance, mobxDebouncer, mobxState, useMobxForm } from 'mobx-toolbox';
import { MutableRefObject } from 'react';
import { Dimensions } from 'react-native';
import { postActionsStore } from '../post-actions/post-actions';
import { GetPostFeedResponse } from '../post-actions/types';

class PostInteractionsStore {
	constructor() {
		makeAutoObservable(this);
	}

	// STATES

	selectedPost: GetPostFeedResponse | null = null;
	setSelectedPost = (post: GetPostFeedResponse | null) => this.selectedPost = post;

	userPostsToShow = mobxState<GetPostFeedResponse[]>([])("userPostsToShow");
	selectedUserPost = mobxState<GetPostFeedResponse | null>(null)("selectedUserPost");

	GRID_POST_WIDTH = Dimensions.get('window').width / 3;
	GRID_POST_HEIGHT = 150;

	// UPDATERS

	postUpdater: MobxUpdateInstance<GetPostFeedResponse> | null = null;
	setPostUpdater = (updater: MobxUpdateInstance<GetPostFeedResponse>) => this.postUpdater = updater;

	// REFS

	userPostsScrollRef = mobxState<MutableRefObject<null> | null>(null)('userPostsScrollRef');

	// DEBOUNCERS

	toggleLikePost = (postId: number, post: GetPostFeedResponse) => {
		const { likePostAction } = postActionsStore;

		if (isNaN(postId)) return;

		runInAction(() => {
			if (!this.postUpdater) return;
			this.postUpdater(postId, "likesCount", (prev: number) => prev + (post?.isLiked ? -1 : 1));
			this.postUpdater(postId, "isLiked", (prev: boolean) => !prev);
		});

		mobxDebouncer.debouncedAction(postId, () => likePostAction(postId, post), 1000);
	};

	toggleFavPost = (postId: number, post: GetPostFeedResponse) => {
		const { favPostAction } = postActionsStore;

		runInAction(() => {
			if (!this.postUpdater) return;
			this.postUpdater(postId, "favoritesCount", (prev: number) => prev + (post?.isFavorited ? -1 : 1));
			this.postUpdater(postId, "isFavorited", (prev: boolean) => !prev);
		});

		mobxDebouncer.debouncedAction(postId, () => favPostAction(postId, post), 1000);
	};

	// IMAGE VIEWER

	imageOpen = mobxState(false)('imageOpen');
	imageData: ImageData[] = [];

	setImageData = (images: string[]) => {
		const res = images.map((img, index) => ({
			url: img,
			id: index.toString(),
		}));
		this.imageData = res;
	};

	// POST DETAIL

	getAfterBeforePosts = (arr: GetPostFeedResponse[], effectivePostId: number) => {
		if (!arr || !effectivePostId) return { postsAfter: [], postsBefore: [] };

		const selectedIndex = arr.findIndex(item => item.id === effectivePostId);
		if (selectedIndex === -1) return { postsAfter: arr, postsBefore: [] };

		const postsAfter = arr.slice(selectedIndex + 1);
		const postsBefore = arr.slice(0, selectedIndex);

		return { postsAfter, postsBefore };
	};

	// MODALS

	postDeleteModalOpen = mobxState(false)('postDeleteModalOpen');

	// SCROLL

	postScrollRef = mobxState<MutableRefObject<null> | null>(null)("postScrollRef");

	// CREATE POST

	inpHashtags = mobxState("")("inpHashtags");
	selectedMedias = mobxState<MediaItem[]>([])("selectedMedias");

	createPostForm = useMobxForm({
		canComment: true,
		title: "",
		content: "",
		originalContent: "",
		hashtags: [],
		tags: [],
		images: []
	}, CreatePostSchema, { instaValidate: true, resetErrIfNoValue: false });

	toggleTag = (tag: string) => {
		const { values, setValue } = this.createPostForm;
		const currentTags = [...values.tags];

		if (currentTags.includes(tag as never)) {
			setValue("tags", currentTags.filter(t => t !== tag) as never[]);
		} else {
			setValue("tags", [...currentTags, tag] as never[]);
		}
	};

	createPostHandler = () => {
		const { createPostAction } = postActionsStore;

		createPostAction();
	};

	onHashtagInput = (value: string) => {
		const { inpHashtags: { inpHashtags, setInpHashtags } } = this;

		const arr = value.split(' ');
		const realArr = inpHashtags.split(' ');
		if (realArr.some((str: string) => str == '#' && (!/^#([^#]+|$)/.test(str) || str == '#'))) {
			setInpHashtags(arr.filter(t => t[0] == '#').join(' '));
			return;
		}

		if (arr.some(str => str[0] !== '#' && arr.length > 1 && arr[arr.length - 1] !== '')) {
			setInpHashtags(arr.filter(t => t[0] == '#').join(' '));
			return;
		}
		if (arr.some(str => !/^[а-яА-Яa-zA-Z0-9#]+$/.test(str) && str !== '')) return;
		if (
			arr.some(str => !/^#?(?!.*#)[а-яА-Яa-zA-Z0-9#]+$/.test(str) && str !== '' && str !== '#') &&
			inpHashtags.length !== 0
		) return;
		if (arr.some(str => str[0] !== '#' && str.length > 1)) {
			if (arr.filter(t => t[0] == '#')) {
				setInpHashtags(`#${value}`);
				return;
			}
			setInpHashtags(arr.filter(t => t[0] == '#').join(' '));
			return;
		}
		if (arr[arr.length - 1] == '#') {
			arr.pop();
			setInpHashtags(arr.join(' '));
			return;
		}
		if (/ $/.test(value)) {
			setInpHashtags(prev => prev + ' #');
			return;
		}
		setInpHashtags(value);
	};

}

export const postInteractionsStore = new PostInteractionsStore();

// {
// 	"canComment": true,
// 	"title": "1111",
// 	"originalContent": "1111",
// 	"content": "1111111",
// 	"hashtags": ["recs", "fyp", "asd", "asd", "asd", "asd", "asd", "asd", "asd", "asd", "asd", "asd", "asd"],
// 	"tags": ["Айти", "Мемы"],
// 	"images": ["https://risebarawsapregion.s3.ap-south-1.amazonaws.com/1ba61733-82bd-4c54-816c-2ce6913f035b-Снимок экрана 2025-03-30 в 05.39.03.png", "https://risebarawsapregion.s3.ap-south-1.amazonaws.com/1ba61733-82bd-4c54-816c-2ce6913f035b-Снимок экрана 2025-03-30 в 05.39.03.png", "https://risebarawsapregion.s3.ap-south-1.amazonaws.com/1ba61733-82bd-4c54-816c-2ce6913f035b-Снимок экрана 2025-03-30 в 05.39.03.png"]
// }