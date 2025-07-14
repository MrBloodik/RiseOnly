import { ReportIcon } from '@icons/MainPage/Sidebar';
import { SettingsIcon } from '@icons/MainPage/Sidebar/SettingsIcon';
import { DeleteIcon } from '@icons/Ui/DeleteIcon';
import { navigate } from '@shared/lib/navigation';
import { ContextMenuItem, UserLogo } from '@shared/ui';
import { PremiumIconUi } from '@shared/ui/PremiumIconUi/PremiumIconUi';
import { authStore } from '@stores/auth';
import { commentInteractionsStore } from '@stores/comment';
import { GetCommentsResponse, RespliesSortType } from '@stores/comment/comment-actions/types';
import { commentServiceStore } from '@stores/comment/comment-service/comment-service';
import { postInteractionsStore } from '@stores/post';
import { GetPostFeedResponse } from '@stores/post/post-actions/types';
import { profileStore } from '@stores/profile';
import { User } from '@stores/profile/types';
import { subscriptionInteractionsStore } from '@stores/subscription';
import { themeStore } from '@stores/theme';
import i18next, { t } from 'i18next';
import { Dispatch, SetStateAction } from 'react';

export const getReportBtnItem = (id: number) => {
	return {
		id: id,
		label: t('contextMenu_report'),
		jsxIcon: <ReportIcon size={20} color={"red"} />,
		textColor: "red",
		callback: () => console.log('report'),
		key: "report"
	};
};

export const getDeleteBtnItem = (id: number, callback: () => void) => {
	return {
		id: id,
		label: t('contextMenu_delete'),
		jsxIcon: <DeleteIcon size={20} color={"red"} />,
		textColor: "red",
		callback,
		key: "delete"
	};
};

// POSTS

export const getPostContextMenuItems = (post: GetPostFeedResponse) => {
	const { postDeleteModalOpen: { setPostDeleteModalOpen } } = postInteractionsStore;
	const postContextMenuItems: ContextMenuItem[] = [
		{
			id: 1,
			label: t('contextMenu_share'),
			icon: 'ios-share',
			callback: () => console.log('share'),
			key: "share"
		}
	];

	if (profileStore.profile?.id !== post.authorId) {
		postContextMenuItems.push(getReportBtnItem(3));
	} else {
		postContextMenuItems.push(
			getDeleteBtnItem(3, () => setPostDeleteModalOpen(true))
		);
	}

	return postContextMenuItems;
};

// SIGN UP

export const getGenderContextMenuItems = () => {
	const genderContextMenuItems: ContextMenuItem[] = [
		{
			id: 1,
			label: t('contextMenu_male'),
			icon: 'male',
			callback: () => authStore.selectedGender.setSelectedGender("Male"),
			key: "Male",
		},
		{
			id: 2,
			label: t('contextMenu_female'),
			icon: 'female',
			callback: () => authStore.selectedGender.setSelectedGender("Female"),
			key: "Female",
		},
		{
			id: 3,
			label: t('not_selected'),
			callback: () => authStore.selectedGender.setSelectedGender("None"),
			key: "None",
		},
	];

	return genderContextMenuItems;
};

// COMMENTS

export const getCommentContextMenuItems = (comment: GetCommentsResponse) => {
	const {
		deleteCommentModal: { setDeleteCommentModal },
	} = commentInteractionsStore;
	const { openAndReplyComment } = commentServiceStore;

	const commentContextMenuItems: ContextMenuItem[] = [
		{
			id: 1,
			label: t('contextMenu_reply'),
			icon: 'reply',
			callback: () => openAndReplyComment(comment),
			key: "reply"
		}
	];

	if (profileStore.profile?.id !== comment.authorId) {
		commentContextMenuItems.push(getReportBtnItem(2));
	} else {
		commentContextMenuItems.push(
			getDeleteBtnItem(3, () => setDeleteCommentModal(true))
		);
	}

	return commentContextMenuItems;
};

export const getCommentListContextMenuItems = () => {
	const commentListContextMenuItems: ContextMenuItem[] = [
		{
			id: 1,
			label: t('contextMenu_interesting'),
			icon: 'trending-up',
			callback: () => commentInteractionsStore.changeCommentSelectedSort('feed'),
			key: "feed"
		},
		{
			id: 2,
			label: t('contextMenu_new'),
			icon: 'keyboard-double-arrow-up',
			callback: () => commentInteractionsStore.changeCommentSelectedSort('new'),
			key: "new"
		},
		{
			id: 3,
			label: t('contextMenu_old'),
			icon: 'keyboard-double-arrow-down',
			callback: () => commentInteractionsStore.changeCommentSelectedSort('old'),
			key: "old"
		}
	];

	if (profileStore.profile) {
		commentListContextMenuItems.push({
			id: 4,
			label: t('contextMenu_my'),
			jsxIcon: <UserLogo size={22.5} bordered borderColor={postInteractionsStore.selectedPost?.selectedCommentSort === 'my' ? themeStore.currentTheme.originalMainGradientColor.color : undefined} borderWidth={0.7} />,
			callback: () => commentInteractionsStore.changeCommentSelectedSort('my'),
			key: "my"
		});
	}

	return commentListContextMenuItems;
};

export const getRepliesListContextMenuItems = () => {
	const callback = (key: RespliesSortType) => commentInteractionsStore.changeRepliesSelectedSort(key);

	const repliesListContextMenuItems: ContextMenuItem[] = [
		{
			id: 1,
			label: t('contextMenu_popular'),
			icon: 'trending-up',
			callback: () => callback("popular"),
			key: "popular"
		},
		{
			id: 2,
			label: t('contextMenu_new'),
			icon: 'keyboard-double-arrow-up',
			callback: () => callback("new"),
			key: "new"
		},
		{
			id: 3,
			label: t('contextMenu_old'),
			icon: 'keyboard-double-arrow-down',
			callback: () => callback("old"),
			key: "old"
		}
	];

	if (profileStore.profile) {
		repliesListContextMenuItems.push({
			id: 4,
			label: t('contextMenu_my'),
			jsxIcon: <UserLogo size={22.5} bordered borderColor={postInteractionsStore.selectedPost?.selectedCommentSort === 'my' ? themeStore.currentTheme.originalMainGradientColor.color : undefined} borderWidth={0.7} />,
			callback: () => callback("my"),
			key: "my"
		});
	}

	return repliesListContextMenuItems;
};

// SUBSCRIPTION

export const getPremiumContextMenuItems = (
	setPremiumContextMenuOpen: Dispatch<SetStateAction<boolean>>,
	profileToShow: User
) => {
	const { profile } = profileStore;
	const {
		premiumModalOpen: { setPremiumModalOpen },
	} = subscriptionInteractionsStore;

	const isYou = profileToShow?.id == profile?.id;
	const label = isYou ? i18next.t("contextMenu_your_subscription") : `${profileToShow.name} ${i18next.t('contextMenu_subscription')}`;

	const premiumContextMenuItems: ContextMenuItem[] = [
		{
			id: 1,
			label,
			jsxIcon: <PremiumIconUi isPremium />,
			callback: () => {
				setPremiumContextMenuOpen(false);
				setPremiumModalOpen(true);
			},
		},
	];

	if (isYou) {
		premiumContextMenuItems.push({
			id: 2,
			label: i18next.t("context_menu_subscription_settings"),
			jsxIcon: <SettingsIcon color={themeStore.currentTheme.textColor.color} size={20} />,
			callback: () => navigate("SubscriptionSettings"),
			textColor: themeStore.currentTheme.textColor.color,
		});
	} else {
		premiumContextMenuItems.push({
			id: 2,
			label: i18next.t("context_menu_subscription_buy"),
			jsxIcon: <SettingsIcon color={themeStore.currentTheme.textColor.color} size={18} />,
			callback: () => navigate("SubscriptionSettings"),
			textColor: themeStore.currentTheme.textColor.color
		});
	}

	return premiumContextMenuItems;
};