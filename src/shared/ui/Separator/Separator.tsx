import { themeStore } from '@stores/theme'
import { observer } from 'mobx-react-lite'
import { View, ViewStyle } from 'react-native'

export const Separator = observer(({
	style,
	height = 10,
	width = 1,
	marginHorizontal = 0,
	marginVertical = 0,
	color = themeStore.currentTheme.secondTextColor.color,
}: SeparatorProps) => {
	return (
		<View
			style={{
				height: height,
				width: width,
				backgroundColor: color,
				marginHorizontal: marginHorizontal,
				marginVertical: marginVertical,
				...style
			}}
		/>
	)
})

interface SeparatorProps {
	style?: ViewStyle
	height?: number | string
	width?: number | string
	color?: string
	marginHorizontal?: number
	marginVertical?: number
}