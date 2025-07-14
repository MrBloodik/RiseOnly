declare module 'react-native-pell-rich-editor' {
	import { Component } from 'react'

	export interface RichEditorProps {
		initialContentHTML?: string
		editorInitializedCallback?: () => void
		onChange?: (html: string) => void
		onHeightChange?: (height: number) => void
		editorStyle?: object
		containerStyle?: object
		style?: object
		placeholder?: string
		initialHeight?: number
		disabled?: boolean
		useContainer?: boolean
		pasteAsPlainText?: boolean
		autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
		defaultParagraphSeparator?: string
		initialFocus?: boolean
		onFocus?: () => void
		onBlur?: () => void
		onPaste?: (data: string) => void
		onKeyUp?: (data: string) => void
		onKeyDown?: (data: string) => void
		onInput?: (data: string) => void
		onMessage?: (data: string) => void
		onCursorPosition?: (offsetY: number) => void
		onSelectionChange?: (e: any) => void
		onActiveStyleChanged?: (styles: string[]) => void
		placeholderColor?: string
		contentCSSText?: string
		[key: string]: any
	}

	export class RichEditor extends Component<RichEditorProps> {
		setContentHTML: (html: string) => void
		blurContentEditor: () => void
		focusContentEditor: () => void
		insertImage: (url: string, alt?: string) => void
		insertLink: (url: string, title?: string) => void
		insertText: (text: string) => void
		insertHTML: (html: string) => void
		insertVideo: (url: string) => void
		setContentFocusHandler: (handler: () => void) => void
		registerToolbar: (handler: (items: any) => void) => void
		commandDOM: (command: string) => void
	}

	export class RichToolbar extends Component<any> { }
} 