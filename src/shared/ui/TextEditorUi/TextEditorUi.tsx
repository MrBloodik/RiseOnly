import { themeStore } from '@stores/theme'
import { observer } from 'mobx-react-lite'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
	Animated,
	Keyboard,
	LayoutChangeEvent,
	NativeSyntheticEvent,
	StyleProp,
	StyleSheet,
	TextInputSelectionChangeEventData,
	TextStyle,
	TouchableOpacity,
	View,
	ViewStyle
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import { InputRegistryContext, LexicalRichTextInputRef } from '../LexicalRichTextInput/LexicalRichTextInput'
import { SimpleTextAreaUi } from '../SimpleTextAreaUi/SimpleTextAreaUi'

interface TextEditorUiProps {
	placeholder?: string
	maxLength?: number
	onChangeText?: (text: string) => void
	value?: string
	considerKeyboard?: boolean
	minHeight?: number
	maxHeight?: number
	inputContainerStyle?: ViewStyle
	inputStyle?: StyleProp<TextStyle> | StyleProp<ViewStyle>
	rawText?: string
	setRawText?: (text: string) => void
	text?: string
	setText?: (text: string) => void
	focus?: boolean
	onFocus?: (focus: boolean) => void
	setFocus?: (focus: boolean) => void
}

const COLORS = [
	'#FF5252', // красный
	'#FF4081', // розовый
	'#E040FB', // пурпурный
	'#7C4DFF', // фиолетовый
	'#536DFE', // индиго
	'#448AFF', // синий
	'#40C4FF', // голубой
	'#18FFFF', // бирюзовый
	'#64FFDA', // зеленый (бирюзовый)
	'#69F0AE', // зеленый
	'#B2FF59', // светло-зеленый
	'#EEFF41', // лайм
	'#FFFF00', // желтый
	'#FFD740', // янтарный
	'#FFAB40', // оранжевый
	'#FF6E40', // глубокий оранжевый
]

export const TextEditorUi = observer(({
	placeholder = 'Введите текст...',
	maxLength = 5000,
	onChangeText,
	value,
	setText,
	considerKeyboard = true,
	rawText = '',
	setRawText,
	text = "",
	minHeight = 40,
	onFocus,
	focus,
	inputContainerStyle = {},
	inputStyle = {},
	setFocus,
	maxHeight = 200
}: TextEditorUiProps) => {
	const { currentTheme } = themeStore
	const insets = useSafeAreaInsets()
	const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)
	const [localText, setLocalText] = useState(value || '')
	const [showFormatBar, setShowFormatBar] = useState(false)
	const [showColorPalette, setShowColorPalette] = useState(false)
	const [selection, setSelection] = useState({ start: 0, end: 0 })
	const inputRef = useRef<LexicalRichTextInputRef>(null)
	const formatButtonRef = useRef<View>(null)
	const keyboardDidShowListener = useRef<any>(null)
	const keyboardDidHideListener = useRef<any>(null)
	const [isFocused, setIsFocused] = useState(false)

	const [formatButtonPosition, setFormatButtonPosition] = useState({
		x: 0,
		y: 0,
		width: 0,
		height: 0
	})

	const fadeAnim = useRef(new Animated.Value(0)).current
	const translateYAnim = useRef(new Animated.Value(10)).current

	const paletteAnim = useRef(new Animated.Value(0)).current
	const paletteTranslateYAnim = useRef(new Animated.Value(10)).current

	const [inputHeight, setInputHeight] = useState(minHeight)
	const [registeredInputs, setRegisteredInputs] = useState<Array<any>>([])

	const registerInput = useCallback((ref: any) => {
		setRegisteredInputs(prev => [...prev, ref])
	}, [])

	const inputContext = useMemo(() => ({
		registerInput
	}), [registerInput])

	useEffect(() => {
		const input = inputRef.current
		if (!input) return
		isFocused ? input.blur() : input.focus()
	}, [focus])

	useEffect(() => {
		keyboardDidShowListener.current = Keyboard.addListener(
			'keyboardDidShow',
			() => {
				setIsKeyboardVisible(true)
			}
		)
		keyboardDidHideListener.current = Keyboard.addListener(
			'keyboardDidHide',
			() => {
				setIsKeyboardVisible(false)
			}
		)

		return () => {
			keyboardDidShowListener.current?.remove()
			keyboardDidHideListener.current?.remove()
		}
	}, [])

	useEffect(() => {
		if (value !== undefined) {
			console.log('value', value)
			setLocalText(value)
		}
	}, [value])

	const handleChangeText = (text: string) => {
		setLocalText(text)

		if (onChangeText) {
			onChangeText(text)
		}
	}

	const handleSelectionChange = (e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
		const { start, end } = e.nativeEvent.selection
		setSelection({ start, end })
	}

	const handleFormatButtonLayout = (event: LayoutChangeEvent) => {
		if (formatButtonRef.current) {
			formatButtonRef.current.measure((x, y, width, height, pageX, pageY) => {
				setFormatButtonPosition({
					x: pageX,
					y: pageY,
					width,
					height
				})
			})
		}
	}

	const handleFormatButtonPress = () => {
		if (showFormatBar) {
			Animated.parallel([
				Animated.timing(fadeAnim, {
					toValue: 0,
					duration: 150,
					useNativeDriver: true
				}),
				Animated.timing(translateYAnim, {
					toValue: 10,
					duration: 150,
					useNativeDriver: true
				})
			]).start(() => {
				setShowFormatBar(false)
				setShowColorPalette(false)
			})
		} else {
			setShowFormatBar(true)
			Animated.parallel([
				Animated.timing(fadeAnim, {
					toValue: 1,
					duration: 200,
					useNativeDriver: true
				}),
				Animated.timing(translateYAnim, {
					toValue: 0,
					duration: 200,
					useNativeDriver: true
				})
			]).start()
		}
	}

	const handleBoldPress = () => {
		handleFormatButtonPress()
		inputRef.current?.setBold()
	}

	const handleItalicPress = () => {
		handleFormatButtonPress()
		inputRef.current?.setItalic()
	}

	const handleUnderlinePress = () => {
		handleFormatButtonPress()
		inputRef.current?.setUnderline()
	}

	const handleColorPress = () => {
		if (showColorPalette) {
			Animated.parallel([
				Animated.timing(paletteAnim, {
					toValue: 0,
					duration: 150,
					useNativeDriver: true
				}),
				Animated.timing(paletteTranslateYAnim, {
					toValue: 10,
					duration: 150,
					useNativeDriver: true
				})
			]).start(() => {
				setShowColorPalette(false)
			})
		} else {
			setShowColorPalette(true)
			Animated.parallel([
				Animated.timing(paletteAnim, {
					toValue: 1,
					duration: 200,
					useNativeDriver: true
				}),
				Animated.timing(paletteTranslateYAnim, {
					toValue: 0,
					duration: 200,
					useNativeDriver: true
				})
			]).start()
		}
	}

	const handleColorSelect = (color: string) => {
		inputRef.current?.setTextColor(color)

		Animated.parallel([
			Animated.timing(fadeAnim, {
				toValue: 0,
				duration: 150,
				useNativeDriver: true
			}),
			Animated.timing(translateYAnim, {
				toValue: 10,
				duration: 150,
				useNativeDriver: true
			})
		]).start(() => {
			setShowFormatBar(false)
			setShowColorPalette(false)
		})
	}

	const handleContentSizeChange = (event: { nativeEvent: { contentSize: { width: number, height: number } } }) => {
		const { height } = event.nativeEvent.contentSize
		console.log('Content size changed:', height)
		setInputHeight(height)
	}

	const handleCodePress = () => {
		if (inputRef.current) inputRef.current.insertCode('python')

		handleFormatButtonPress()
	}

	const renderFormatBar = () => {
		return (
			<View style={styles.formatBar}>
				<TouchableOpacity onPress={handleBoldPress} style={styles.formatButton}>
					<MaterialIcons name="format-bold" size={24} color={currentTheme.textColor.color as string} />
				</TouchableOpacity>
				<TouchableOpacity onPress={handleItalicPress} style={styles.formatButton}>
					<MaterialIcons name="format-italic" size={24} color={currentTheme.textColor.color as string} />
				</TouchableOpacity>
				<TouchableOpacity onPress={handleUnderlinePress} style={styles.formatButton}>
					<MaterialIcons name="format-underlined" size={24} color={currentTheme.textColor.color as string} />
				</TouchableOpacity>
				<TouchableOpacity onPress={handleColorPress} style={styles.formatButton}>
					<MaterialIcons name="palette" size={24} color={currentTheme.textColor.color as string} />
				</TouchableOpacity>
				<TouchableOpacity onPress={handleCodePress} style={styles.formatButton}>
					<MaterialIcons name="code" size={24} color={currentTheme.textColor.color as string} />
				</TouchableOpacity>
			</View>
		)
	}

	const renderColorPalette = () => {
		const rows = []
		for (let i = 0; i < COLORS.length; i += 4) {
			rows.push(COLORS.slice(i, i + 4))
		}

		return (
			<Animated.View
				style={[
					styles.colorPaletteContainer,
					{
						opacity: paletteAnim,
						transform: [{ translateY: paletteTranslateYAnim }],
					}
				]}
			>
				{rows.map((row, rowIndex) => (
					<View key={`row-${rowIndex}`} style={styles.colorPaletteRow}>
						{row.map((color) => (
							<TouchableOpacity
								key={color}
								style={[styles.colorButton, { backgroundColor: color }]}
								onPress={() => handleColorSelect(color)}
							/>
						))}
					</View>
				))}
			</Animated.View>
		)
	}

	const styles = StyleSheet.create({
		container: {
			flex: 1,
		},
		inputContainer: {
			flex: 1,
			flexDirection: 'row',
			justifyContent: "space-between",
			borderRadius: 15,
			backgroundColor: currentTheme.btnsTheme.background as string,
			overflow: 'hidden',
			width: '100%',
			minHeight: minHeight,
		},
		input: {
			flex: 1,
			color: currentTheme.textColor.color as string,
			fontSize: 14,
			width: '100%',
			fontWeight: 'bold',
		},
		formatBar: {
			flexDirection: 'row',
			backgroundColor: currentTheme.btnsTheme.background as string,
			borderWidth: 0.5,
			borderColor: currentTheme.bgTheme.borderColor as string,
			borderRadius: 10,
			padding: 0,
			justifyContent: 'center',
			shadowColor: '#000',
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.25,
			shadowRadius: 3.84,
			elevation: 5,
		},
		formatButton: {
			paddingVertical: 5,
			paddingHorizontal: 5,
		},
		formatToggleButton: {
			paddingRight: 10,
			paddingTop: 10,
		},
		menuContainer: {
			position: 'absolute',
			top: -45,
			right: 0,
			zIndex: 1000,
		},
		colorPaletteContainer: {
			position: 'absolute',
			top: -145,
			right: 0,
			zIndex: 1000,
			marginTop: 8,
			backgroundColor: currentTheme.btnsTheme.background as string,
			borderRadius: 15,
			padding: 8,
			borderWidth: 0.5,
			borderColor: currentTheme.bgTheme.borderColor as string,
			shadowColor: '#000',
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.25,
			shadowRadius: 3.84,
			elevation: 5,
		},
		colorPaletteRow: {
			flexDirection: 'row',
			justifyContent: 'center',
			marginBottom: 4,
		},
		colorButton: {
			width: 24,
			height: 24,
			borderRadius: 12,
			marginHorizontal: 2,
			borderWidth: 1,
			borderColor: currentTheme.textColor.color as string,
		}
	})

	return (
		<InputRegistryContext.Provider value={inputContext}>
			<View style={styles.container}>
				<View
					style={[
						styles.inputContainer,
						{ height: 'auto' },
						inputContainerStyle
					]}
				>
					<SimpleTextAreaUi
						style={[
							styles.input,
							{ flex: 1 },
							inputStyle
						]}
						containerStyle={{ flex: 1 }}
						inputStyle={{ paddingLeft: 12, paddingTop: 12 }}
						placeholder={placeholder}
						placeholderTextColor={currentTheme.secondTextColor.color as string}
						onChangeText={handleChangeText}
						value={value}
						setText={setText}
						maxLength={maxLength}
						maxHeight={maxHeight}
					/>

					{/* <LexicalRichTextInput
						ref={inputRef}
						style={[
							styles.input,
							{ flex: 1 },
							inputStyle
						]}
						placeholder={placeholder}
						placeholderTextColor={currentTheme.secondTextColor.color as string}
						onChangeText={handleChangeText}
						onSelectionChange={handleSelectionChange}
						onContentSizeChange={handleContentSizeChange}
						value={localText}
						forceRenderFormatted={true}
						minHeight={minHeight}
						maxHeight={maxHeight}
						rawText={rawText}
						setRawText={setRawText}
						text={text}
						setText={setText}
						onFocus={() => {
							setIsFocused(true)
							onFocus && onFocus(true)
						}}
						onBlur={() => {
							setIsFocused(false)
							onFocus && onFocus(false)
						}}
					/> */}

					<View
						ref={formatButtonRef}
						collapsable={false}
						onLayout={handleFormatButtonLayout}
						style={{ alignSelf: 'flex-start' }}
					>
						<TouchableOpacity
							style={styles.formatToggleButton}
							onPress={handleFormatButtonPress}
						>
							<MaterialIcons
								name={showFormatBar ? "format-clear" : "format-size"}
								size={24}
								color={currentTheme.textColor.color as string}
							/>
						</TouchableOpacity>
					</View>
				</View>

				<Animated.View
					style={[
						styles.menuContainer,
						{
							opacity: fadeAnim,
							transform: [{ translateY: translateYAnim }],
							pointerEvents: showFormatBar ? 'auto' : 'none',
						}
					]}
				>
					<View style={{ position: 'relative', zIndex: 1000, width: '100%' }}>
						{showColorPalette && renderColorPalette()}
						{renderFormatBar()}
					</View>
				</Animated.View>
			</View>
		</InputRegistryContext.Provider>
	)
})