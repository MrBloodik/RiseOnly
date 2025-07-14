import { Post } from '@components/Posts/Post/Post'
import { NicsBarLogoIcon, NotifyIcon } from '@icons/MainPage/NavBar'
import { AsyncDataRender, BgWrapperUi, ImageViewerUi, MainText, RefreshControlUi } from '@shared/ui'
import { FlashList } from '@shopify/flash-list'
import { commentInteractionsStore } from '@stores/comment'
import { postActionsStore, postInteractionsStore } from '@stores/post'
import { GetPostFeedResponse } from '@stores/post/post-actions/types'
import { themeStore } from '@stores/theme'
import { AnimatedHeader } from '@widgets/headers'
import { observer } from 'mobx-react-lite'
import React, { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Animated, StyleSheet, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

const AnimatedFlashList = Animated.createAnimatedComponent(FlashList<GetPostFeedResponse>)

export const Posts = observer(() => {
	const {
		postsFeed: { status, data },
		getPostsAction,
	} = postActionsStore
	const {
		imageOpen: { imageOpen, setImageOpen },
		postScrollRef: { setPostScrollRef },
		imageData
	} = postInteractionsStore
	const {
		setIsCommentOpen,
	} = commentInteractionsStore

	const { t } = useTranslation()
	const scrollY = useRef(new Animated.Value(0)).current
	const headerRef = useRef<any | null>(null)
	const flatListRef = useRef(null)

	const handleScroll = Animated.event(
		[{ nativeEvent: { contentOffset: { y: scrollY } } }],
		{
			useNativeDriver: true,
			listener: (event) => {
				postActionsStore.postsFeed?.options?.dataScope?.onScroll?.(event)
				if (headerRef.current && headerRef.current.handleScroll) {
					headerRef.current.handleScroll(event)
				}
			}
		}
	)

	useEffect(() => {
		if (flatListRef) {
			setPostScrollRef(flatListRef)
		}
		getPostsAction(false)
		return () => { setIsCommentOpen(false) }
	}, [flatListRef])

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<ImageViewerUi
				open={imageOpen}
				onClose={() => setImageOpen(false)}
				imagesArr={imageData}
				currentImage={imageData[0]}
				totalCount={data?.list.length}
			/>

			<BgWrapperUi>
				<AsyncDataRender
					status={status}
					data={data?.list}
					noDataText={t('no_posts')}
					renderContent={() => {
						return (
							<>
								<AnimatedHeader
									ref={headerRef}
									content={
										<View style={styles.headerContent}>
											<View style={styles.logoContainer}>
												<NicsBarLogoIcon />
												<MainText>Название</MainText>
											</View>
											<View>
												<NotifyIcon />
											</View>
										</View>
									}
									backgroundColor={themeStore.currentTheme.bgTheme.background as string}
									textColor={themeStore.currentTheme.originalMainGradientColor.color as string}
									status={status}
									loadingComponent={<></>}
								/>
								<AnimatedFlashList
									onScroll={handleScroll}
									ref={flatListRef}
									data={data?.list}
									estimatedItemSize={500}
									scrollEventThrottle={16}
									refreshing={status == "pending"}
									onRefresh={() => console.log("refreshing")}
									refreshControl={<RefreshControlUi callback={() => getPostsAction(true, true, true, false)} />}
									renderItem={({ item }) => {
										return <Post
											key={item.id}
											post={item}
											containerStyle={{
												marginBottom: 10
											}}
										/>
									}}
								/>
							</>
						)
					}}
					messageHeightPercent={40}
				/>
			</BgWrapperUi>
		</GestureHandlerRootView>
	)
})

const styles = StyleSheet.create({
	headerContent: {
		width: '100%',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 12.5,
		paddingVertical: 5,
	},
	logoContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	flatList: {
		flex: 1,
		paddingTop: 5,
		marginBottom: 80,
	},
	container: {
		flex: 1,
	},
	postItem: {
		padding: 10,
		marginVertical: 5,
		backgroundColor: themeStore.currentTheme.bgTheme.background as string,
		borderRadius: 8,
	},
	postTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		color: themeStore.currentTheme.originalMainGradientColor.color as string,
		marginBottom: 8,
	},
	postContent: {
		fontSize: 16,
		color: themeStore.currentTheme.secondTextColor.color as string,
	},
	loadingContainer: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
	},
	loadingText: {
		fontSize: 14,
		color: themeStore.currentTheme.originalMainGradientColor.color as string,
	},
})
