import { InDevUi } from '@shared/ui/InDevUi/InDevUi'
import { chatsInteractionsStore } from '@stores/ws/chats'
import { observer } from 'mobx-react-lite'
import { useEffect, useRef } from 'react'
import Animated, { runOnJS, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated'

export const ChatProfileFileTab = observer(() => {
	const {
		isTabScrollEnabled: { isTabScrollEnabled, setIsTabScrollEnabled },
		isMainScrollEnabled: { setIsMainScrollEnabled },
		scrollMomentum: { scrollMomentum },
	} = chatsInteractionsStore

	const scrollY = useSharedValue(0)
	const scrollRef = useRef<Animated.ScrollView>(null)

	useEffect(() => {
		if (scrollMomentum > 0 && isTabScrollEnabled && scrollRef.current) {
			console.log(")")
			const displacement = Math.min(scrollMomentum * 0.1, 200)
			scrollRef.current.scrollTo({ y: displacement, animated: true })
		}
	}, [scrollMomentum, isTabScrollEnabled])

	const scrollHandler = useAnimatedScrollHandler({
		onScroll: (event) => {
			scrollY.value = event.contentOffset.y
			if (scrollY.value === 0) {
				runOnJS(setIsTabScrollEnabled)(false)
			}
		},
	})

	return (
		<Animated.ScrollView
			ref={scrollRef}
			scrollEnabled={isTabScrollEnabled}
			onScroll={scrollHandler}
			scrollEventThrottle={16}
			bounces={false}
		>
			<InDevUi />
		</Animated.ScrollView>
	)
})