import { AsyncDataRender, MainText } from '@shared/ui'
import { commentActionsStore, commentInteractionsStore } from '@stores/comment'
import { GetCommentsResponse } from '@stores/comment/comment-actions/types'
import { themeStore } from '@stores/theme'
import { observer } from 'mobx-react-lite'
import { useEffect, useRef } from 'react'
import { Dimensions, FlatList, StyleSheet } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated'
import { Comment } from './Coment'

const screenWidth = Dimensions.get('window').width

export const CommentReplies = observer(() => {
	const {
		replies: {
			data,
			status,
			options
		},
		getRepliesAction
	} = commentActionsStore
	const {
		repliesOpen: { setRepliesOpen },
		selectedCommentForReply: { selectedCommentForReply },
		repliesScrollRef: { setRepliesScrollRef },
		getCachedRepliesData
	} = commentInteractionsStore

	if (!selectedCommentForReply) {
		console.warn("[CommentReplies]: No comment provided")
		return <MainText>[CommentReplies]: No comment provided</MainText>
	}

	const scrollRef = useRef(null)
	const translateX = useSharedValue(screenWidth)
	const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }))

	const panGesture = Gesture.Pan()
		.onUpdate((e) => {
			if (e.translationX > 0) {
				translateX.value = e.translationX
			}
		})
		.onEnd((e) => {
			if (e.translationX > 100) {
				translateX.value = withTiming(screenWidth, { duration: 200 }, () => {
					runOnJS(setRepliesOpen)(false)
				})
			} else {
				translateX.value = withTiming(0)
			}
		})

	useEffect(() => { translateX.value = withTiming(0, { duration: 300 }) }, [])
	useEffect(() => {
		if (selectedCommentForReply.repliesCount != 0) getRepliesAction("popular", false)
	}, [])
	useEffect(() => {
		if (!scrollRef) return
		setRepliesScrollRef(scrollRef)
	}, [scrollRef])

	const renderReplies = (reply: GetCommentsResponse[]) => {
		return (
			<FlatList
				ref={scrollRef}
				showsVerticalScrollIndicator={true}
				scrollIndicatorInsets={{ right: 1 }}
				data={reply}
				onScroll={options?.dataScope?.onScroll}
				renderItem={({ item }) => {
					return (
						<Comment
							key={item.id}
							comment={item}
							type="reply"
						/>
					)
				}}
			/>
		)
	}

	return (
		<GestureDetector gesture={panGesture}>
			<Animated.View style={[styles.screen, animatedStyle]}>
				<Comment
					comment={selectedCommentForReply}
					mode="reply"
					type="default"
				/>

				<AsyncDataRender
					data={getCachedRepliesData()?.items || data?.items}
					status={status}
					renderContent={renderReplies}
				/>
			</Animated.View>
		</GestureDetector>
	)
})

const styles = StyleSheet.create({

	screen: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: themeStore.currentTheme.bgTheme.background as string,
		zIndex: 10,
	},
})
