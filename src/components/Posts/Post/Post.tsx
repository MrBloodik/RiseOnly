import { MoreIcon } from '@icons/MainPage/Chats/MoreIcon';
import { CommentIcon } from '@icons/MainPage/Posts/CommentIcon';
import { FavIcon } from '@icons/MainPage/Posts/FavIcon';
import { FavIconActive } from '@icons/MainPage/Posts/FavIconActive';
import { HeartIcon } from '@icons/MainPage/Posts/HeartIcon';
import { HeartIconActive } from '@icons/MainPage/Posts/HeartIconActive';
import { getPostContextMenuItems } from '@shared/config/context-menu-data';
import { getProfileStatuses } from '@shared/config/tsx';
import { navigate } from '@shared/lib/navigation';
import { formatNumber } from '@shared/lib/numbers';
import { darkenRGBA, pxNative } from '@shared/lib/theme';
import { ButtonUi, ContextMenuUi, ImageSwiper, LiveTimeAgo, MainText, SimpleButtonUi, UserLogo } from '@shared/ui';
import { GetWho } from '@shared/ui/GetWho/GetWho';
import { PremiumIconUi } from '@shared/ui/PremiumIconUi/PremiumIconUi';
import { commentInteractionsStore } from '@stores/comment';
import { postActionsStore, postInteractionsStore } from '@stores/post';
import { GetPostFeedResponse } from '@stores/post/post-actions/types';
import { profileStore } from '@stores/profile';
import { themeStore } from '@stores/theme';
import { observer } from 'mobx-react-lite';
import { Fragment, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DimensionValue, ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

interface PostProps {
	post: GetPostFeedResponse;
	containerStyle?: StyleProp<ViewStyle>;
	isPreview?: boolean;
	imageWidth?: DimensionValue;
}

export const Post = observer(({
	post,
	containerStyle = {},
	isPreview = false,
	imageWidth
}: PostProps) => {
	const { currentTheme } = themeStore;
	const { profile } = profileStore;
	const {
		likePost: { status: likeStatus },
		favPost: { status: favStatus }
	} = postActionsStore;
	const {
		toggleLikePost,
		toggleFavPost,
		setSelectedPost
	} = postInteractionsStore;
	const { isCommentOpen, setIsCommentOpen } = commentInteractionsStore;

	const { t } = useTranslation();
	const [postContextMenuOpen, setPostContextMenuOpen] = useState(false);
	const closeButtonRef = useRef<View>(null);

	const handleOpenComments = () => {
		if (isPreview) return;
		console.log("[handleOpenComments]: post.selectedCommentSort ", post.selectedCommentSort);
		setSelectedPost(post);
		setIsCommentOpen(true);
	};

	const toggleLikeHandler = () => !isPreview && toggleLikePost(Number(post?.id), post);
	const toggleFavHandler = () => !isPreview && toggleFavPost(Number(post?.id), post);
	const handleImagePress = (index: number) => console.log('Image pressed at index:', index);
	const onContextMenuClose = () => setPostContextMenuOpen(false);
	const onAvatarPress = () => {
		if (isPreview) return;
		if (post.authorId == profile?.id) navigate("Profile");
		else navigate("UserPage", { tag: post.author.tag });
	};
	const onContextMenuOpen = () => {
		if (isPreview) return;
		setSelectedPost(post);
		setPostContextMenuOpen(true);
	};

	const btnsPaddingHorizontal = isPreview ? 5 : 10;
	const iconSize = isPreview ? 8 : 17.5;
	const textSize = isPreview ? 9 : 15;
	const btnGap = isPreview ? 3 : 5;
	const titlePx = isPreview ? 11 : 20;
	const contentPx = isPreview ? 9 : 15;
	const postHeight = isPreview ? 100 : 300;

	const IsTagScrollView = isPreview ? ScrollView : Fragment;

	return (
		<View
			style={[
				styles.container,
				{
					marginVertical: isPreview ? 0 : 10,
					backgroundColor: themeStore.currentTheme.bgTheme.background as string,
					borderRadius: pxNative(themeStore.currentTheme.bgTheme.borderRadius)
				},
				containerStyle
			]}
		>
			<View
				style={[
					styles.header,
					{ marginBottom: isPreview ? 5 : 10 }
				]}
			>
				<View style={styles.headerLeft}>
					<View>
						<UserLogo
							source={post.authorId == profile?.id ? profile?.more?.logo : post.author?.more?.logo}
							size={isPreview ? 20 : 40}
							onPress={onAvatarPress}
							isButton
						/>
					</View>
					<View style={styles.headerLeftRight}>
						<View
							style={[
								styles.headerLeftRightTop,
								{ gap: isPreview ? 3 : 5 }
							]}
						>
							<MainText
								px={isPreview ? 10 : 16}
								numberOfLines={1}
							>
								{post.author?.name}
							</MainText>
							<PremiumIconUi
								isPremium={post.author?.more?.isPremium}
								size={isPreview ? 10 : 20}
							/>
						</View>
						{!isPreview && (
							<View style={styles.headerLeftRightBot}>
								<GetWho
									who={post.author?.more?.who}
									marginTop={2}
								/>
								{getProfileStatuses(post.author?.more?.p_lang?.[0])}
							</View>
						)}
					</View>
				</View>

				<SimpleButtonUi
					ref={closeButtonRef}
					style={styles.headerRight}
					onPress={onContextMenuOpen}
				>
					<MoreIcon width={textSize} />
				</SimpleButtonUi>

				<ContextMenuUi
					items={getPostContextMenuItems(post)}
					isVisible={postContextMenuOpen}
					onClose={onContextMenuClose}
					anchorRef={closeButtonRef}
					width={180}
					offset={{ x: 0, y: 20 }}
				/>
			</View>

			{post?.images?.length > 0 && (
				<View style={styles.images}>
					<Animated.Image
						source={{ uri: post.images[0] }}
						style={{ height: postHeight, width: "100%", position: 'absolute', top: 0, zIndex: -1 }}
						sharedTransitionTag={post.id.toString() + "1"}
					/>
					<ImageSwiper
						images={post.images}
						onImagePress={handleImagePress}
						height={postHeight}
						imageWidth={imageWidth || null}
					/>
				</View>
			)}

			<View style={[styles.bottom, { paddingTop: isPreview ? 0 : 5 }]}>
				<View
					style={[styles.textContent, { gap: isPreview ? 0 : 4 }]}
				>
					<IsTagScrollView>
						<View
							style={[styles.tags, { marginBottom: 5, flexWrap: isPreview ? "nowrap" : "wrap" }]}
						>
							{post.tags?.map((tag, index) => (
								<View
									key={index}
									style={[
										styles.tag,
										{
											paddingHorizontal: isPreview ? 6 : 10,
											paddingVertical: isPreview ? 1 : 3,
											backgroundColor: darkenRGBA(themeStore.currentTheme.bgTheme.background as string, 0.5)
										}
									]}
								>
									<MainText
										px={isPreview ? 7 : 10}
									>
										{tag}
									</MainText>
								</View>
							))}
						</View>
					</IsTagScrollView>

					<MainText
						style={styles.title}
						px={titlePx}
						numberOfLines={isPreview ? 3 : 0}
					>
						{post.title || t("preview_post_title")}
					</MainText>
					<MainText
						px={contentPx}
						numberOfLines={isPreview ? 6 : 0}
					>
						{isPreview ? (post.content || t("preview_post_content")) : post.content}
					</MainText>

					<View style={styles.hashtags}>
						<MainText
							numberOfLines={isPreview ? 3 : 0}
						>
							{post.hashtags?.map((hashtag, index) => (
								<MainText
									key={index}
									color={currentTheme.originalMainGradientColor.color as string}
									px={contentPx}
								>
									{`#${hashtag} `}
								</MainText>
							))}
						</MainText>
					</View>
				</View>

				<View style={styles.footer}>
					<View style={styles.footerLeft}>
						<ButtonUi
							backgroundColor={currentTheme.btnsTheme.background as string}
							bRad={5}
							height="auto"
							fitContent
							paddingLeft={btnsPaddingHorizontal}
							paddingRight={btnsPaddingHorizontal}
							paddingVertical={5}
							gap={btnGap}
							onPress={toggleLikeHandler}
							disabled={likeStatus === 'pending'}
						>
							{post.isLiked ? (
								<HeartIconActive size={17.5} />
							) : (
								<HeartIcon size={iconSize} />
							)}
							<MainText
								px={textSize}
							>
								{formatNumber(post.likesCount)}
							</MainText>
						</ButtonUi>

						<ButtonUi
							backgroundColor={currentTheme.btnsTheme.background as string}
							bRad={5}
							height="auto"
							fitContent
							paddingLeft={btnsPaddingHorizontal}
							paddingRight={btnsPaddingHorizontal}
							paddingVertical={5}
							gap={btnGap}
							onPress={toggleFavHandler}
							disabled={favStatus === 'pending'}
						>
							{post.isFavorited ? (
								<FavIconActive size={17.5} />
							) : (
								<FavIcon size={iconSize} />
							)}
							<MainText px={textSize}>{formatNumber(post.favoritesCount)}</MainText>
						</ButtonUi>

						<ButtonUi
							backgroundColor={currentTheme.btnsTheme.background as string}
							bRad={5}
							height="auto"
							fitContent
							paddingVertical={5}
							paddingLeft={btnsPaddingHorizontal}
							paddingRight={btnsPaddingHorizontal}
							gap={btnGap}
							onPress={handleOpenComments}
							disabled={isCommentOpen}
						>
							<CommentIcon size={iconSize} />
							<MainText px={textSize}>{formatNumber(post.commentsCount)}</MainText>
						</ButtonUi>
					</View>

					<View style={styles.footerRight}>
						<LiveTimeAgo
							date={post.createdAt}
							style={{
								...styles.dateText,
								color: themeStore.currentTheme.secondTextColor.color as string
							}}
							fontSize={isPreview ? 7 : 10}
						/>
					</View>
				</View>
			</View>
		</View>
	);
});

const styles = StyleSheet.create({
	hashtags: {
		flexDirection: 'row',
		flexWrap: 'wrap',
	},
	tags: {
		flexDirection: 'row',
		gap: 3,
	},
	tag: {
		borderRadius: 7,
	},
	bottom: {
		paddingBottom: 10,
		flex: 1,
		justifyContent: "space-between"
	},
	footer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginTop: 10,
		paddingHorizontal: 10,
	},
	footerLeft: {
		flexDirection: 'row',
		gap: 5,
		alignItems: 'center',
	},
	footerRight: {

	},
	images: {
		position: 'relative',
		width: "100%"
	},
	headerLeftRightBot: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 5
	},
	headerLeftRightTop: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 5
	},
	headerLeftRight: {
		flexDirection: 'column',
		gap: 2
	},
	headerLeft: {
		flexDirection: 'row',
		gap: 10
	},
	headerRight: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-end',
		height: '100%',
		paddingLeft: 15,
		paddingRight: 3,
		gap: 10,
	},
	container: {
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 10,
		paddingTop: 10,
	},
	textContent: {
		paddingHorizontal: 10,
	},
	title: {
		fontWeight: 'bold',
		marginBottom: 5,
	},
	dateText: {}
});
