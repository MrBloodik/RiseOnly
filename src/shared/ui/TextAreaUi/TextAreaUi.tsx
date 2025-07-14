import { themeStore } from '@stores/theme'
import { observer } from 'mobx-react-lite'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Keyboard, Platform, StyleSheet, TextInput, TextInputProps, View, ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface TextAreaUiProps extends Omit<TextInputProps, 'style'> {
	containerStyle?: ViewStyle
	inputStyle?: ViewStyle
	considerKeyboard?: boolean
}

export const TextAreaUi = observer(({
	containerStyle,
	inputStyle,
	considerKeyboard = true,
	placeholder = 'Введите текст...',
	placeholderTextColor,
	value,
	onChangeText,
	maxLength = 5000,
	...props
}: TextAreaUiProps) => {
	const { currentTheme } = themeStore
	const insets = useSafeAreaInsets()
	const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)
	const [text, setText] = useState(value || '')
	const inputRef = useRef<TextInput>(null)

	useEffect(() => {
		if (value !== undefined && value !== text) {
			setText(value)
		}
	}, [value])

	const handleKeyboardShow = useCallback(() => {
		setIsKeyboardVisible(true)
	}, [])

	const handleKeyboardHide = useCallback(() => {
		setIsKeyboardVisible(false)
	}, [])

	useEffect(() => {
		if (!considerKeyboard) return

		const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
		const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'

		const keyboardShowListener = Keyboard.addListener(showEvent, handleKeyboardShow)
		const keyboardHideListener = Keyboard.addListener(hideEvent, handleKeyboardHide)

		return () => {
			keyboardShowListener.remove()
			keyboardHideListener.remove()
		}
	}, [handleKeyboardShow, handleKeyboardHide, considerKeyboard])

	const styles = StyleSheet.create({
		container: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: 8,
			paddingHorizontal: 16,
			paddingTop: 8,
			paddingBottom: considerKeyboard && isKeyboardVisible ? 0 : insets.bottom > 0 ? insets.bottom - 5 : 0,
			...containerStyle,
		},
		inputContainer: {
			flex: 1,
			backgroundColor: currentTheme.btnsTheme.background as string,
			borderRadius: 15,
		},
		input: {
			paddingHorizontal: 16,
			paddingVertical: 10,
			color: currentTheme.textColor.color as string,
			minHeight: 40,
			maxHeight: 80,
			...inputStyle,
		}
	})

	const handleChangeText = useCallback((newText: string) => {
		setText(newText)
		if (onChangeText) {
			onChangeText(newText)
		}
	}, [onChangeText])

	return (
		<View style={styles.container}>
			<View style={styles.inputContainer}>
				<TextInput
					ref={inputRef}
					style={styles.input}
					autoCapitalize='none'
					keyboardType='default'
					placeholder={placeholder}
					placeholderTextColor={placeholderTextColor || currentTheme.secondTextColor.color as string}
					multiline={true}
					scrollEnabled={true}
					maxLength={maxLength}
					onChangeText={handleChangeText}
					value={text}
					{...props}
				/>
			</View>
		</View>
	)
})