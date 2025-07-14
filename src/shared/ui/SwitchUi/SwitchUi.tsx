import { themeStore } from '@stores/theme'
import { observer } from 'mobx-react-lite'
import React, { useEffect } from 'react'
import {
	Pressable,
	StyleProp,
	StyleSheet,
	ViewStyle
} from 'react-native'
import Animated, {
	interpolate,
	interpolateColor,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated'

export interface SwitchUiProps {
	isOpen?: any
	onPress?: () => void
	style?: StyleProp<ViewStyle>
	duration?: number
	onBg?: string
	offBg?: string
	trackWidth?: number
	trackHeight?: number
	trackPadding?: number
}

export const SwitchUi = observer(({
	isOpen = false,
	onPress = () => { },
	style,
	duration = 100,
	onBg = themeStore.currentTheme.originalMainGradientColor.color as string,
	offBg = themeStore.currentTheme.btnsTheme.background as string,
	trackWidth = 50,
	trackHeight = 30,
	trackPadding = 4,
}: SwitchUiProps) => {
	const height = useSharedValue(0)
	const width = useSharedValue(0)
	const value = useSharedValue(isOpen)

	useEffect(() => {
		value.value = withTiming(isOpen ? 1 : 0, { duration })
	}, [isOpen])

	const trackAnimatedStyle = useAnimatedStyle(() => {
		const color = interpolateColor(
			value.value,
			[0, 1],
			[offBg, onBg]
		)

		return {
			backgroundColor: color,
			borderRadius: height.value / 2,
		}
	})

	const thumbAnimatedStyle = useAnimatedStyle(() => {
		const moveValue = interpolate(
			Number(value.value),
			[0, 1],
			[0, width.value - height.value]
		)
		const translateValue = withTiming(moveValue, { duration })

		return {
			transform: [{ translateX: translateValue }],
			borderRadius: height.value / 2,
		}
	})

	const switchStyles = StyleSheet.create({
		track: {
			alignItems: 'flex-start',
			width: trackWidth,
			height: trackHeight,
			padding: trackPadding,
		},
		thumb: {
			height: '100%',
			aspectRatio: 1,
			backgroundColor: 'white',
		},
	})

	return (
		<Pressable onPress={onPress}>
			<Animated.View
				onLayout={(e) => {
					height.value = e.nativeEvent.layout.height
					width.value = e.nativeEvent.layout.width
				}}
				style={[switchStyles.track, style, trackAnimatedStyle]}>
				<Animated.View
					style={[switchStyles.thumb, thumbAnimatedStyle]}></Animated.View>
			</Animated.View>
		</Pressable>
	)
})