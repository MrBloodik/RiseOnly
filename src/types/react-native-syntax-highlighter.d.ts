declare module 'react-native-syntax-highlighter' {
	import { ReactNode } from 'react'
	import { StyleProp, TextStyle, ViewStyle } from 'react-native'

	interface SyntaxHighlighterProps {
		language: string
		style?: object
		customStyle?: StyleProp<ViewStyle>
		fontSize?: number
		fontFamily?: string
		children: string
		highlighter?: string
		textStyle?: StyleProp<TextStyle>
	}

	export default function SyntaxHighlighter(props: SyntaxHighlighterProps): ReactNode
}

declare module 'react-native-syntax-highlighter/dist/styles/prism' {
	export const atomDark: object
	export const prism: object
	export const darcula: object
	export const okaidia: object
	export const tomorrow: object
	export const solarizedlight: object
	export const materialLight: object
	export const materialDark: object
} 