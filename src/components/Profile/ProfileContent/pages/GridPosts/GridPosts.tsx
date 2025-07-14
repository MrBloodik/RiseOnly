import { MainStackParamList } from '@app/router/AppNavigator';
import { RouteProp, useRoute } from '@react-navigation/native';
import { getCurrentRoute, navigate } from '@shared/lib/navigation';
import { AsyncDataRender, Box, CleverImage, MainText } from '@shared/ui';
import { LoaderUi } from '@shared/ui/LoaderUi/LoaderUi';
import { postActionsStore, postInteractionsStore } from '@stores/post';
import { GetPostFeedResponse } from '@stores/post/post-actions/types';
import { profileStore } from '@stores/profile';
import { themeStore } from '@stores/theme';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

interface GridPostsProps {
	max?: number;
	currentElement?: any[];
	postContainerStyle?: StyleProp<ViewStyle>;
	pageContainerStyle?: StyleProp<ViewStyle>;
	mainContainerStyle?: StyleProp<ViewStyle>;
	needPending?: boolean;
	fetchIfHaveData?: boolean;
	isPreview?: boolean;
}

export const GridPosts = observer(({
	max,
	currentElement,
	postContainerStyle = {},
	pageContainerStyle = {},
	mainContainerStyle = {},
	needPending = true,
	fetchIfHaveData = true,
	isPreview = false
}: GridPostsProps) => {
	const { currentTheme } = themeStore;
	const {
		userPosts: {
			data,
			status
		},
		getUserPostsAction
	} = postActionsStore;
	const {
		userPostsToShow: { setUserPostsToShow },
		selectedUserPost: { setSelectedUserPost },
		GRID_POST_WIDTH,
	} = postInteractionsStore;
	const {
		openedPage: { openedPage },
		calculatePadding,
		profile
	} = profileStore;

	const { t } = useTranslation();

	const tag = (useRoute<RouteProp<MainStackParamList, 'UserPage'>>()?.params?.tag) || profile?.tag;
	const name = getCurrentRoute()?.name;
	const titlePx = 3.5;

	if (!tag) return;

	const onRefresh = () => getUserPostsAction((name === "Profile" ? (profile?.tag || "") : tag), false, true);
	const handlePostPress = (post: GetPostFeedResponse) => {
		if (!data?.list) return;
		setUserPostsToShow(data.list);
		setSelectedUserPost(post);
		navigate('PostDetail', { postId: post.id }, false);
	};

	useEffect(() => {
		getUserPostsAction((name === "Profile" ? (profile?.tag || "") : tag), needPending, fetchIfHaveData);
	}, [profile?.tag]);

	useEffect(() => {
		getUserPostsAction((name === "Profile" ? (profile?.tag || "") : tag), false, false);
	}, [openedPage]);

	return (
		<View
			style={[styles.pageContainer, mainContainerStyle]}
		>
			<AsyncDataRender
				status={status}
				data={data?.list}
				noDataText={t('no_posts')}
				noDataHeightPercent={5}
				refreshControllCallback={onRefresh}
				renderContent={() => {
					return (
						<View
							style={[styles.pageContainer, pageContainerStyle]}
						>
							{((max && currentElement)
								? [...currentElement, ...(data?.list?.slice(0, max - 1) || [])]
								: data?.list || []
							).map((item) => {
								return (
									<TouchableOpacity
										key={item.id}
										style={[
											styles.postContainer,
											{
												width: GRID_POST_WIDTH,
												height: 150,
												borderColor: currentTheme.bgTheme.background as string,
												borderWidth: 0.5,
												overflow: 'hidden',
												position: "relative"
											},
											postContainerStyle
										]}
										onPress={() => !max && handlePostPress(item)}
										activeOpacity={0.6}
									>
										{item.isTemp && (
											<Box
												style={{ top: 0, left: 0, zIndex: 10 }}
												width={"100%"}
												height={"100%"}
												centered
												bgColor={"rgba(0, 0, 0, 0.5)"}
												position='absolute'
											>
												<LoaderUi
													color={currentTheme.textColor.color}
													size={40}
													progress={item.progress || 0}
													type='progress'
													closeCallback={() => {
														console.log("close");
													}}
												/>
											</Box>
										)}

										{item.images?.[0] ? (
											<Animated.View
												style={styles.imageWrapper}
												sharedTransitionTag={item?.id?.toString()}
											>
												<CleverImage
													source={item.images?.[0] + ''}
													imageStyles={styles.image}
													withoutWrapper={true}
													sharedTransitionTag={item?.id?.toString() + '1'}
												/>
											</Animated.View>
										) : (
											<View
												style={[
													styles.textContainer,
													{ backgroundColor: currentTheme.btnsTheme.background as string }
												]}
											>
												<MainText
													px={isPreview ? titlePx : calculatePadding(item?.title)}
													tac='center'
												>
													{item?.title}
												</MainText>
											</View>
										)}
									</TouchableOpacity>
								);
							})}
						</View>
					);
				}}
				messageHeightPercent={20}
			/>
		</View>
	);
});
const styles = StyleSheet.create({
	textContainer: {
		width: "100%",
		height: "100%",
		justifyContent: "center",
		padding: 10,
		alignItems: "center",
	},
	pageContainer: {
		flex: 1,
		display: 'flex',
		flexDirection: 'row',
		flexWrap: 'wrap',
	},
	postContainer: {
		position: 'relative',
	},
	imageWrapper: {
		width: "100%",
		height: "100%",
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
	},
	image: {
		width: "100%",
		height: "100%",
		objectFit: "cover"
	},
});