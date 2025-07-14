import { themeStore } from '@stores/theme'
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import {
	Platform,
	StyleSheet,
	Text,
	TextInput,
	TextInputProps,
	TouchableOpacity,
	View
} from 'react-native'
import WebView from 'react-native-webview'

interface FormattedTextInputProps extends TextInputProps {
	value: string
	onChangeText?: (text: string) => void
	placeholder?: string
}

export interface FormattedTextInputRef {
	focus: () => void
	setNativeProps: (props: any) => void
}

export const FormattedTextInput = forwardRef<FormattedTextInputRef, FormattedTextInputProps>(
	({ value, style, onChangeText, placeholder, placeholderTextColor, ...props }, ref) => {
		const { currentTheme } = themeStore
		const inputRef = useRef<TextInput>(null)
		const webViewRef = useRef<WebView>(null)
		const [htmlContent, setHtmlContent] = useState('')
		const [isEditing, setIsEditing] = useState(false)
		const [formattedText, setFormattedText] = useState('')
		const [rawText, setRawText] = useState(value || '')

		// Экспортируем методы через ref
		useImperativeHandle(ref, () => ({
			focus: () => {
				setIsEditing(true)
				inputRef.current?.focus()
			},
			setNativeProps: (props: any) => {
				inputRef.current?.setNativeProps(props)
			}
		}))

		// Обновляем текст при изменении пропса value
		useEffect(() => {
			setRawText(value || '')
			formatText(value || '')
		}, [value])

		// Функция форматирования текста
		const formatText = (text: string) => {
			// Заменяем маркеры форматирования на соответствующие HTML-теги
			let formatted = text
				// Экранируем HTML-теги
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				// Цвет
				.replace(/:([A-Fa-f0-9]{6}):(.*?):/g, function (match, color, text) {
					return `<span style="color: #${color};">${text}</span>`
				})
				// Жирный текст
				.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
				// Курсив
				.replace(/\*(.*?)\*/g, '<em>$1</em>')
				// Подчеркнутый
				.replace(/__(.*?)__/g, '<u>$1</u>')
				// Код
				.replace(/```(.*?)```/g, '<code style="background-color: rgba(0,0,0,0.1); padding: 2px 4px; border-radius: 3px; font-family: monospace;">$1</code>')
				// Переносы строк
				.replace(/\n/g, '<br>')

			setFormattedText(formatted)

			// Создаем HTML-документ с нашим форматированным текстом
			const html = `
				<!DOCTYPE html>
				<html>
				<head>
					<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
					<style>
						body {
							font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
							margin: 0;
							padding: 0;
							color: ${currentTheme.textColor.color};
							background-color: transparent;
							font-size: 16px;
							line-height: 1.4;
							padding: 10px 16px;
							overflow-wrap: break-word;
							word-wrap: break-word;
							word-break: break-word;
						}
						.content {
							min-height: 40px;
						}
						strong {
							font-weight: bold;
						}
						em {
							font-style: italic;
						}
						u {
							text-decoration: underline;
						}
						code {
							background-color: rgba(0,0,0,0.1);
							padding: 2px 4px;
							border-radius: 3px;
							font-family: monospace;
							white-space: pre-wrap;
						}
						span[style^="color:"] {
							display: inline;
						}
						.placeholder {
							color: ${String(placeholderTextColor) || currentTheme.secondTextColor.color as string};
						}
					</style>
					<script>
						document.addEventListener('click', function() {
							window.ReactNativeWebView.postMessage('focus');
						});
					</script>
				</head>
				<body>
					<div class="content">${formatted}</div>
				</body>
				</html>
			`

			setHtmlContent(html)
		}

		// Обработка изменения текста
		const handleChangeText = (text: string) => {
			setRawText(text)
			formatText(text)

			if (onChangeText) {
				onChangeText(text)
			}
		}

		// Обработчик нажатия на контейнер
		const handlePress = () => {
			setIsEditing(true)
			inputRef.current?.focus()
		}

		// Обработчик сообщений от WebView
		const handleWebViewMessage = (event: any) => {
			if (event.nativeEvent.data === 'focus') {
				setIsEditing(true)
				inputRef.current?.focus()
			}
		}

		// Обработчик потери фокуса
		const handleBlur = () => {
			setIsEditing(false)
		}

		return (
			<View style={[styles.container, style]}>
				{isEditing ? (
					<TextInput
						ref={inputRef}
						{...props}
						value={rawText}
						onChangeText={handleChangeText}
						onBlur={handleBlur}
						style={[
							styles.input,
							{ color: currentTheme.textColor.color as string }
						]}
						multiline
						placeholder={placeholder}
						placeholderTextColor={placeholderTextColor}
						autoFocus
					/>
				) : (
					<TouchableOpacity
						style={styles.formattedContainer}
						onPress={handlePress}
						activeOpacity={0.9}
					>
						{rawText ? (
							<WebView
								ref={webViewRef}
								source={{ html: htmlContent }}
								style={styles.webView}
								scrollEnabled={false}
								showsVerticalScrollIndicator={false}
								showsHorizontalScrollIndicator={false}
								originWhitelist={['*']}
								onMessage={handleWebViewMessage}
								javaScriptEnabled={true}
								domStorageEnabled={true}
								startInLoadingState={false}
								scalesPageToFit={Platform.OS === 'android'}
								automaticallyAdjustContentInsets={false}
								mixedContentMode="always"
							/>
						) : (
							<Text style={[styles.placeholder, { color: placeholderTextColor || currentTheme.secondTextColor.color as string }]}>
								{placeholder}
							</Text>
						)}
					</TouchableOpacity>
				)}
			</View>
		)
	}
)

const styles = StyleSheet.create({
	container: {
		flex: 1,
		minHeight: 40,
	},
	input: {
		flex: 1,
		paddingHorizontal: 16,
		paddingVertical: 10,
		minHeight: 40,
		fontSize: 16,
	},
	formattedContainer: {
		flex: 1,
		minHeight: 40,
	},
	webView: {
		flex: 1,
		backgroundColor: 'transparent',
		minHeight: 40,
	},
	placeholder: {
		paddingHorizontal: 16,
		paddingVertical: 10,
		fontSize: 16,
	}
}) 