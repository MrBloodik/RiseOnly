import React, { ReactNode } from 'react'
import { DimensionValue, View } from 'react-native'
import Animated, {
	Easing,
	cancelAnimation,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withRepeat,
	withSequence,
	withTiming,
} from 'react-native-reanimated'

export const TypingAnimation = ({
	color = 'rgb(0, 210, 0)',
	width = 10,
	fontSize = 32,
	height = '100%',
	leftText,
}: TypingAnimationProps) => {
	// Создаем три точки
	const dots = [0, 1, 2]

	// Создаем анимированные значения для каждой точки
	const dotValues = [
		useSharedValue(0),
		useSharedValue(0),
		useSharedValue(0),
	]

	// Запускаем анимацию для каждой точки с задержкой
	React.useEffect(() => {
		// Для каждой точки запускаем анимацию с задержкой
		dotValues.forEach((dotValue, index) => {
			// Останавливаем предыдущую анимацию, если она есть
			cancelAnimation(dotValue)

			// Создаем последовательность: подняться и опуститься
			dotValue.value = 0
			dotValue.value = withDelay(
				index * 200, // Задержка для каждой точки
				withRepeat(
					withSequence(
						// Поднимается
						withTiming(1, {
							duration: 500,
							easing: Easing.inOut(Easing.ease)
						}),
						// Опускается
						withTiming(0, {
							duration: 500,
							easing: Easing.inOut(Easing.ease)
						})
					),
					-1, // Бесконечное повторение (-1)
					false // Не реверсировать
				)
			)
		})

		// Очистка при размонтировании
		return () => {
			dotValues.forEach(dotValue => {
				cancelAnimation(dotValue)
			})
		}
	}, [])

	return (
		<View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
			{leftText && leftText}
			{dots.map((_, index) => {
				// Создаем стиль анимации для каждой точки
				const dotStyle = useAnimatedStyle(() => {
					return {
						transform: [
							{
								translateY: -2 * dotValues[index].value // Движение вверх до 8px
							},
							{
								scale: 1 + 0.2 * dotValues[index].value // Увеличение размера на 20%
							}
						],
						opacity: 0.6 + 0.4 * dotValues[index].value // Увеличение непрозрачности
					}
				})

				return (
					<Animated.Text
						key={index}
						style={[
							{
								fontSize,
								color,
								width,
								height,
								marginBottom: 2
							},
							dotStyle
						]}
					>
						•
					</Animated.Text>
				)
			})}
		</View>
	)
}

interface TypingAnimationProps {
	color?: string
	width?: DimensionValue
	height?: DimensionValue
	fontSize?: number
	leftText?: ReactNode
}
