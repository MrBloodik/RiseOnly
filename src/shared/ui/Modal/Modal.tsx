import { overlayColor } from '@shared/config/const'
import { themeStore } from '@stores/theme'
import React, { useEffect, useRef, useState } from 'react'
import { Animated, DimensionValue, StyleSheet, TouchableWithoutFeedback, View } from 'react-native'
import { Portal } from 'react-native-paper'

interface ModalUiProps {
	visible: boolean
	animationDuration?: number
	width?: number
	instaOpen?: boolean
	height?: DimensionValue
	children?: JSX.Element
	setVisible: (visible: boolean) => void
}

export const CustomModalUi = ({
	visible,
	animationDuration = 300,
	setVisible,
	width = 300,
	height = undefined,
	instaOpen = false,
	children
}: ModalUiProps): React.ReactElement | null => {
	const scaleAnim = useRef(new Animated.Value(0.8)).current
	const opacityAnim = useRef(new Animated.Value(0)).current
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		if (visible && !mounted) setMounted(true)
		if (visible) {
			Animated.parallel([
				Animated.timing(scaleAnim, {
					toValue: 1,
					duration: animationDuration,
					useNativeDriver: true,
				}),
				Animated.timing(opacityAnim, {
					toValue: 1,
					duration: animationDuration * 0.8,
					useNativeDriver: true,
				}),
			]).start()
		} else if (mounted) {
			Animated.parallel([
				Animated.timing(scaleAnim, {
					toValue: 0.85,
					duration: animationDuration / 2,
					useNativeDriver: true,
				}),
				Animated.timing(opacityAnim, {
					toValue: 0,
					duration: animationDuration / 2,
					useNativeDriver: true,
				}),
			]).start(() => {
				setMounted(false)
				scaleAnim.setValue(0.8)
			})
		}
	}, [visible, animationDuration, scaleAnim, opacityAnim, mounted])

	if (!mounted) return null

	return (
		<Portal>
			<View style={StyleSheet.absoluteFill}>
				<Animated.View
					style={[
						StyleSheet.absoluteFill,
						styles.overlay,
						{
							opacity: (instaOpen && visible) ? 1 : opacityAnim,
							backgroundColor: overlayColor,
						}
					]}
				>
					<TouchableWithoutFeedback onPress={() => setVisible(false)}>
						<View style={styles.overlayTouch}>
							<TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
								<Animated.View
									style={[
										styles.modalContainer,
										{
											opacity: opacityAnim,
											transform: [{ scale: scaleAnim }],
											width,
											height: height,
										},
									]}
								>
									{children}
								</Animated.View>
							</TouchableWithoutFeedback>
						</View>
					</TouchableWithoutFeedback>
				</Animated.View>
			</View>
		</Portal>
	)
}

const styles = StyleSheet.create({
	button: {
		borderRadius: 5,
		flex: 1,
		alignItems: 'center',
		paddingVertical: 8,
		justifyContent: 'center',
		backgroundColor: themeStore.currentTheme.btnsTheme.background as string,
	},
	buttonRight: {
		backgroundColor: themeStore.currentTheme.originalMainGradientColor.color,
	},
	buttonsContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		gap: 10,
		width: '100%',
	},
	overlay: {
		margin: 0,
		padding: 0,
	},
	overlayTouch: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalContainer: {
		flexDirection: 'column',
		justifyContent: 'center',
		alignItems: 'center',
		gap: 10,
		paddingVertical: 15,
		paddingHorizontal: 15,
		backgroundColor: themeStore.currentTheme.bgTheme.background as string,
		borderRadius: 10,
		elevation: 10,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
	},
	defaultContent: {
		alignItems: 'center',
		justifyContent: 'center',
		padding: 20,
	},
	defaultText: {
		fontSize: 16,
		fontWeight: 'bold',
	},
})