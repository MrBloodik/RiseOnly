import { Post } from '@components/Posts/Post/Post';
import { BackArrowLeftIcon } from '@icons/Ui/BackArrowLeftIcon';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { AsyncDataRender, BgWrapperUi, MainText, SimpleButtonUi } from '@shared/ui';
import { postActionsStore, postInteractionsStore } from '@stores/post';
import { profileStore } from '@stores/profile';
import { themeStore } from '@stores/theme';
import { observer } from 'mobx-react-lite';
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';

type PostDetailRouteParams = {
	PostDetail: {
		postId: number;
	};
};

export const PostDetail = observer(() => {
	const { currentTheme } = themeStore;
	const {
		userToShow
	} = profileStore;
	const {
		userPosts: { data, status }
	} = postActionsStore;
	const {
		userPostsToShow: { userPostsToShow, setUserPostsToShow },
		selectedUserPost: { selectedUserPost },
		getAfterBeforePosts
	} = postInteractionsStore;
	const { t } = useTranslation();
	const navigation = useNavigation();
	const route = useRoute<RouteProp<PostDetailRouteParams, 'PostDetail'>>();
	const scrollViewRef = useRef<ScrollView>(null);
	const flatListRef = useRef<FlatList>(null);
	const { postId } = route.params || {};
	const effectivePostId = postId || selectedUserPost?.id;

	useEffect(() => {
		if (!data?.list || !effectivePostId) return;
		const { postsBefore } = getAfterBeforePosts(data?.list, effectivePostId);
		if (postsBefore.length === 0) return;
		setTimeout(() => {
			if (flatListRef.current) {
				flatListRef.current.scrollToIndex({
					index: postsBefore.length,
					animated: true
				});
			}
		}, 0);
	}, []);

	const renderPosts = () => {
		return (
			<FlatList
				ref={flatListRef}
				style={styles.scrollContainer}
				showsVerticalScrollIndicator={true}
				scrollIndicatorInsets={{ right: 1 }}
				data={userPostsToShow}
				renderItem={({ item }) => {
					if (!item.selectedCommentSort) item.selectedCommentSort = "feed";
					return (
						<Post key={item.id} post={item} />
					);
				}}
				onScrollToIndexFailed={(info) => {
					setTimeout(() => {
						if (flatListRef.current) {
							flatListRef.current.scrollToOffset({
								offset: info.averageItemLength * info.index,
								animated: false
							});
						}
					}, 0);
				}}
			/>
		);
	};

	let styles = StyleSheet.create({
		...globalStyles,
		postItem: {
			marginBottom: 20,
			borderBottomWidth: 1,
			borderBottomColor: themeStore.currentTheme.bgTheme.border as string,
			paddingBottom: 20,
		},
		safeArea: {
			flex: 1,
			backgroundColor: themeStore.currentTheme.bgTheme.background as string,
		},
	});

	return (
		<SafeAreaView style={styles.safeArea}>
			<BgWrapperUi>
				<View style={styles.container}>
					<View style={styles.header}>
						<SimpleButtonUi
							onPress={() => navigation.goBack()}
							style={styles.backButton}
						>
							<BackArrowLeftIcon height={20} width={10} color={currentTheme.originalMainGradientColor.color as string} />
						</SimpleButtonUi>

						<View>
							<View style={styles.top}>
								<MainText px={12} tac='center' fontWeight='bold'>
									{userToShow?.name}
								</MainText>
							</View>

							<View style={styles.bot}>
								<MainText px={14} tac='center'>
									{t('post_detail')}
								</MainText>
							</View>
						</View>
					</View>

					<View style={styles.contentContainer}>
						<AsyncDataRender
							status={status}
							data={data?.list}
							noDataText={t('no_posts')}
							renderContent={renderPosts}
							messageHeightPercent={40}
						/>
					</View>
				</View>
			</BgWrapperUi>
		</SafeAreaView>
	);
});

let globalStyles = StyleSheet.create({
	bot: {

	},
	top: {

	},
	postsContainer: {
		flex: 1,
	},
	container: {
		flex: 1,
	},
	contentContainer: {
		flex: 1,
	},
	header: {
		flexDirection: 'row',
		backgroundColor: themeStore.currentTheme.bgTheme.background as string,
		alignItems: 'center',
		paddingHorizontal: 15,
		paddingBottom: 8,
		borderBottomWidth: 1,
		borderBottomColor: themeStore.currentTheme.bgTheme.border as string,
		display: 'flex',
		justifyContent: 'center',
		position: 'relative',
	},
	headerRight: {
		width: 20,
	},
	backButton: {
		marginRight: 16,
		position: 'absolute',
		left: 15,
	},
	scrollContainer: {
		flex: 1,
		width: '100%',
	},
	image: {
		width: '100%',
		height: 300,
		objectFit: 'cover',
	},
	title: {
		marginBottom: 12,
	},
	content: {
		lineHeight: 22,
	}
}); 