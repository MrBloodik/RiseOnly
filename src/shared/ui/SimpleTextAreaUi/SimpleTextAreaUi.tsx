import { themeStore } from '@stores/theme'
import { observer } from 'mobx-react-lite'
import { useCallback, useRef } from 'react'
import { NativeSyntheticEvent, StyleProp, StyleSheet, TextInput, TextInputProps, TextInputSelectionChangeEventData, TextStyle, View, ViewStyle } from 'react-native'

interface SimpleTextAreaUiProps extends Omit<TextInputProps, 'style'> {
	containerStyle?: ViewStyle
	inputStyle?: ViewStyle
	maxHeight?: number
	maxLength?: number
	debug?: boolean
	value?: string
	style?: StyleProp<TextStyle>
	setText?: (text: string) => void
}

export const SimpleTextAreaUi = observer(({
	containerStyle,
	inputStyle,
	maxHeight = 120,
	maxLength,
	value,
	setText,
	debug = false,
	style = {},
	onChangeText,
	...props
}: SimpleTextAreaUiProps) => {
	const { currentTheme } = themeStore
	const inputRef = useRef<TextInput>(null)
	const cursorPositionRef = useRef(0)

	const handleChangeText = (newText: string) => {
		if (!setText) return
		setText(newText)
		if (onChangeText) {
			onChangeText(newText)
		}

		cursorPositionRef.current = newText.length
	}

	const handleSelectionChange = useCallback((event: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
		cursorPositionRef.current = event.nativeEvent.selection.start
	}, [])

	const mainColor = currentTheme.originalMainGradientColor.color

	const styles = StyleSheet.create({
		container: {
			...containerStyle,
			position: "relative"
		},
		input: {
			color: currentTheme.textColor.color as string,
			minHeight: 40,
			maxHeight: maxHeight,
			...inputStyle,
		},
	})

	return (
		<View style={[styles.container, debug ? { borderWidth: 0.2, borderColor: "red" } : {}]}>
			<TextInput
				ref={inputRef}
				style={[styles.input, style]}
				multiline={true}
				scrollEnabled={true}
				placeholderTextColor={currentTheme.secondTextColor.color}
				cursorColor={mainColor}
				selectionColor={mainColor}
				value={value}
				onChangeText={handleChangeText}
				onSelectionChange={handleSelectionChange}
				maxLength={maxLength}
				{...props}
			/>
			{/* {(maxLength && text) && (
				<Box
					style={{
						position: "absolute",
						bottom: 0,
						right: -5
					}}
				>
					<MainText
						color={getMaxLengthColor(text.length, maxLength)}
						px={11}
					>
						{maxLength - text.length}
					</MainText>
				</Box>
			)} */}
		</View>
	)
})