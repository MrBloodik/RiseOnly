import { changeRgbA } from '@shared/lib/theme'
import { commentInteractionsStore } from '@stores/comment'
import { themeStore } from '@stores/theme'
import { useObserver } from 'mobx-react-lite'
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import {
	StyleSheet,
	TextInputProps,
	View
} from 'react-native'
// @ts-ignore
import cheerio from 'react-native-cheerio'
import { RichEditor } from 'react-native-pell-rich-editor'

const MIN_HEIGHT = 40
const MAX_HEIGHT = 100

interface RichTextInputProps extends Omit<TextInputProps, 'multiline' | 'onChange'> {
	value: string
	forceRenderFormatted?: boolean
	onChangeText?: (text: string) => void
	onSelectionChange?: (e: any) => void
	onContentSizeChange?: (e: any) => void
	minHeight?: number
	maxHeight?: number
	rawText?: string
	setText?: (text: string) => void
	setRawText?: (text: string) => void
	text?: string
}

export interface RichTextInputRef {
	focus: () => void
	setNativeProps: (props: any) => void
	insertHTML: (html: string) => void
	setContentHTML: (html: string) => void
	setBold: () => void
	setItalic: () => void
	setUnderline: () => void
	setTextColor: (color: string) => void
	removeFormat: () => void
	moveCursorToEnd: () => void
	editor: React.RefObject<RichEditor>
	blur: () => void
	increaseIndent: () => void
	decreaseIndent: () => void
	insertCode: (language?: string) => void
}

export const InputRegistryContext = React.createContext<{
	registerInput?: (ref: any) => void
}>({})

export const RichTextInput = forwardRef<RichTextInputRef, RichTextInputProps>(
	({
		value,
		style,
		onChangeText,
		onSelectionChange,
		onContentSizeChange,
		placeholder,
		placeholderTextColor,
		minHeight = MIN_HEIGHT,
		maxHeight = MAX_HEIGHT,
		rawText,
		setText,
		setRawText,
		text,
		...props
	}, ref) => {
		const richText = useRef<RichEditor>(null)
		const [lastValue, setLastValue] = useState('')
		const [isFormatting, setIsFormatting] = useState(false)
		const [editorHeight, setEditorHeight] = useState(minHeight)

		const isVisible = useObserver(() => commentInteractionsStore.isInputsVisible)

		useEffect(() => {
			if (richText.current) {
				commentInteractionsStore.registerInput(richText.current)
			}

			return () => {
				if (richText.current) {
					commentInteractionsStore.unregisterInput(richText.current)
				}
			}
		}, [])

		useImperativeHandle(ref, () => ({
			focus: () => {
				richText.current?.focusContentEditor()
			},
			setNativeProps: (props: any) => {
				if (props.selection) {
					richText.current?.setContentHTML(convertMarkdownToHtml(value))
				}
			},
			insertHTML: (html: string) => {
				richText.current?.insertHTML(html)
			},
			setContentHTML: (html: string) => {
				richText.current?.setContentHTML(html)
			},
			setBold: () => {
				setIsFormatting(true)
				richText.current?.commandDOM(`
					(function() {
						document.execCommand("bold", false, null);
						
						var selection = window.getSelection();
						if (selection.rangeCount > 0) {
							var range = selection.getRangeAt(0);
							var endContainer = range.endContainer;
							var endOffset = range.endOffset;
							
							var newRange = document.createRange();
							newRange.setStart(endContainer, endOffset);
							newRange.setEnd(endContainer, endOffset);

							selection.removeAllRanges();
							selection.addRange(newRange);
							
							var span = document.createElement('span');
							span.style.fontWeight = 'normal';
							span.style.fontStyle = 'normal';
							span.style.textDecoration = 'none';
							span.innerHTML = '&#8203;';
							
							newRange.insertNode(span);
							
							newRange = document.createRange();
							newRange.selectNodeContents(span);
							newRange.collapse(false);
							selection.removeAllRanges();
							selection.addRange(newRange);
						}
					})()
				`)

				setTimeout(() => {
					setIsFormatting(false)
				}, 100)
			},
			setItalic: () => {
				setIsFormatting(true)
				richText.current?.commandDOM(`
					(function() {
						document.execCommand("italic", false, null);
						
						var selection = window.getSelection();
						if (selection.rangeCount > 0) {
							var range = selection.getRangeAt(0);
							var endContainer = range.endContainer;
							var endOffset = range.endOffset;
							
							var newRange = document.createRange();
							newRange.setStart(endContainer, endOffset);
							newRange.setEnd(endContainer, endOffset);
							
							selection.removeAllRanges();
							selection.addRange(newRange);
							
							var span = document.createElement('span');
							span.style.fontWeight = 'normal';
							span.style.fontStyle = 'normal';
							span.style.textDecoration = 'none';
							span.innerHTML = '&#8203;';
							
							newRange.insertNode(span);
							
							newRange = document.createRange();
							newRange.selectNodeContents(span);
							newRange.collapse(false);
							selection.removeAllRanges();
							selection.addRange(newRange);
						}
					})()
				`)

				setTimeout(() => {
					setIsFormatting(false)
				}, 100)
			},
			setUnderline: () => {
				setIsFormatting(true)

				richText.current?.commandDOM(`
					(function() {
						var selection = window.getSelection();
						if (selection.rangeCount > 0) {
							var range = selection.getRangeAt(0);
							
							if (!range.collapsed) {
								var selectedText = range.toString();
								
								var underlinedSpan = document.createElement('span');
								underlinedSpan.style.textDecoration = 'underline';
								underlinedSpan.textContent = selectedText;
								
								range.deleteContents();
								
								range.insertNode(underlinedSpan);
								
								range = document.createRange();
								range.setStartAfter(underlinedSpan);
								range.setEndAfter(underlinedSpan);
								selection.removeAllRanges();
								selection.addRange(range);
							}
						}
					})()
				`)

				setTimeout(() => {
					setIsFormatting(false)
				}, 100)
			},
			setTextColor: (color: string) => {
				setIsFormatting(true)
				richText.current?.commandDOM(`document.execCommand("foreColor", false, "${color}")`)
			},
			removeFormat: () => {
				setIsFormatting(true)
				richText.current?.commandDOM('document.execCommand("removeFormat", false, null)')
			},
			moveCursorToEnd: () => {
				richText.current?.commandDOM(`
					(function() {
						var selection = window.getSelection();
						if (selection.rangeCount > 0) {
							var range = selection.getRangeAt(0);
							range.collapse(false);
							selection.removeAllRanges();
							selection.addRange(range);
							
							document.execCommand("removeFormat", false, null);
							
							document.execCommand("bold", false, false);
							document.execCommand("italic", false, false);
							document.execCommand("underline", false, false);
							
							var span = document.createElement('span');
							span.style.fontWeight = 'normal';
							span.style.fontStyle = 'normal';
							span.style.textDecoration = 'none';
							span.style.color = '${themeStore.currentTheme.textColor.color}';
							span.innerHTML = '&#8203;';
							
							var newRange = document.createRange();
							newRange.setStart(range.startContainer, range.startOffset);
							newRange.setEnd(range.startContainer, range.startOffset);
							newRange.insertNode(span);
							
							newRange = document.createRange();
							newRange.selectNodeContents(span);
							newRange.collapse(false);
							selection.removeAllRanges();
							selection.addRange(newRange);
						}
					})()
				`)
				setIsFormatting(false)
			},
			editor: richText,
			blur: () => {
				richText.current?.blurContentEditor()
			},
			increaseIndent: () => {
				setIsFormatting(true)
				richText.current?.commandDOM(`
					document.execCommand('indent', false, null);
				`)
				setTimeout(() => {
					setIsFormatting(false)
				}, 100)
			},
			decreaseIndent: () => {
				setIsFormatting(true)
				richText.current?.commandDOM(`
					document.execCommand('outdent', false, null);
				`)
				setTimeout(() => {
					setIsFormatting(false)
				}, 100)
			},
			insertCode: (language = 'python') => {
				setIsFormatting(true)

				const accentColor = themeStore.currentTheme.originalMainGradientColor.color as string
				const bgColor = changeRgbA(accentColor, "0.1")

				richText.current?.commandDOM(`
					(function() {
						try {
							var selection = window.getSelection();
							if (!selection || selection.rangeCount === 0) return;
							
							var range = selection.getRangeAt(0);
							
							var tempDiv = document.createElement('div');
							tempDiv.appendChild(range.cloneContents());
							var selectedHTML = tempDiv.innerHTML;
							console.log("Выделенный HTML:", selectedHTML);
							
							var processedText = selectedHTML
								.replace(/<div[^>]*>(.*?)<\\/div>/g, "$1\\n")
								.replace(/<p[^>]*>(.*?)<\\/p>/g, "$1\\n")
								.replace(/<br[^>]*>/g, "\\n")
								.replace(/&nbsp;/g, " ");
							
							processedText = processedText.replace(/<[^>]*>/g, "");
							
							var textArea = document.createElement('textarea');
							textArea.innerHTML = processedText;
							var selectedText = textArea.value;
							
							console.log("Обработанный текст:", selectedText);
							
							selectedText = selectedText.replace(/\\r\\n|\\r/g, "\\n");
							
							var lines = [];
							var currentLine = "";
							var currentIndent = "";
							var inIndent = true;
							
							for (var i = 0; i < selectedText.length; i++) {
								var char = selectedText[i];
								
								if (char === '\\n') {
									lines.push(currentLine);
									currentLine = "";
									currentIndent = "";
									inIndent = true;
									continue;
								}
								
								if (inIndent && char === ' ') {
									currentIndent += char;
								} else {
									inIndent = false;
								}
								
								currentLine += char;
								
								if (!inIndent && i < selectedText.length - 1 && 
									char === ' ' && selectedText[i+1] === ' ') {
									lines.push(currentLine);
									var spaceCount = 0;
									while (i < selectedText.length && selectedText[i] === ' ') {
										spaceCount++;
										i++;
									}
									i--;
									
									currentLine = currentIndent;
									inIndent = false;
								}
								
								if (char === ':' && (i === selectedText.length - 1 || 
													 selectedText[i+1] === ' ' || 
													 selectedText[i+1] === '\\n')) {
									var nextLineNeedsIndent = true;
								}
							}
							
							if (currentLine) {
								lines.push(currentLine);
							}
							
							console.log("Строки:", JSON.stringify(lines));
							
							var processedLines = [];
							var lastLineHadColon = false;
							
							for (var i = 0; i < lines.length; i++) {
								var line = lines[i];
								
								if (line.trim().endsWith(':')) {
									lastLineHadColon = true;
									processedLines.push(line);
								} 
								else if (lastLineHadColon && line.trim() !== '') {
									var currentIndent = (line.match(/^\\s*/) || [''])[0];
									if (!currentIndent) {
										processedLines.push('    ' + line);
									} else {
										processedLines.push(line);
									}
									lastLineHadColon = false;
								} 
								else {
									processedLines.push(line);
									lastLineHadColon = false;
								}
							}
							
							console.log("Обработанные строки:", JSON.stringify(processedLines));
							
							var codeHtml = '';
							
							var emptyLineCount = 0;

							for (var i = 0; i < processedLines.length; i++) {
								var line = processedLines[i];
								
								if (line.trim() === '') {
									emptyLineCount++;
									
									if (emptyLineCount === 1) {
										codeHtml += '<div style="display: block; height: 1.5em; line-height: 1.5em; white-space: pre; margin: 0; padding: 0;"><br></div>';
									}
									continue;
								}
								
								emptyLineCount = 0;
								
								var leadingSpaces = (line.match(/^\\s*/) || [''])[0].length;
								
								var content = line.substring(leadingSpaces);
								
								content = content
									.replace(/&/g, '&amp;')
									.replace(/</g, '&lt;')
									.replace(/>/g, '&gt;');
								
								try {
									function highlightCode(code, lang) {
										if (lang === 'python') {
											var tempDiv = document.createElement('div');
											tempDiv.textContent = code;
											var safeCode = tempDiv.innerHTML;
											
											var accentColor = '${themeStore.currentTheme.originalMainGradientColor.color}';
											var secondaryTextColor = '${themeStore.currentTheme.secondTextColor.color}';
											
											function darkenColor(color, factor) {
												if (color.startsWith('#')) {
													var r = parseInt(color.slice(1, 3), 16);
													var g = parseInt(color.slice(3, 5), 16);
													var b = parseInt(color.slice(5, 7), 16);
													
													var darkenedR = Math.max(0, Math.floor(r * (1 - factor)));
													var darkenedG = Math.max(0, Math.floor(g * (1 - factor)));
													var darkenedB = Math.max(0, Math.floor(b * (1 - factor)));
													
													return '#' + 
														(darkenedR < 16 ? '0' : '') + darkenedR.toString(16) +
														(darkenedG < 16 ? '0' : '') + darkenedG.toString(16) +
														(darkenedB < 16 ? '0' : '') + darkenedB.toString(16);
												}
												return color;
											}
											
											var darkenedAccentColor = darkenColor(accentColor, 0.5);
											
											var tokens = [];
											var current = '';
											var inString = false;
											var stringChar = '';
											var inComment = false;
											
											for (var i = 0; i < safeCode.length; i++) {
												var char = safeCode[i];
												
												if (char === '#' && !inString) {
													if (current) {
														tokens.push({ type: 'code', content: current });
														current = '';
													}
													inComment = true;
													current += char;
													continue;
												}
												
												if (inComment) {
													current += char;
													if (char === '\\n') {
														tokens.push({ type: 'comment', content: current });
														current = '';
														inComment = false;
													}
													continue;
												}
												
												if ((char === "'" || char === '"') && !inString) {
													if (current) {
														tokens.push({ type: 'code', content: current });
														current = '';
													}
													inString = true;
													stringChar = char;
													current += char;
													continue;
												}
												
												if (inString) {
													current += char;
													if (char === stringChar && safeCode[i-1] !== '\\\\') {
														tokens.push({ type: 'string', content: current });
														current = '';
														inString = false;
													}
													continue;
												}
												
												if (/[0-9]/.test(char) && !current) {
													current += char;
													continue;
												}
												
												if (/[0-9.]/.test(char) && /^[0-9.]+$/.test(current)) {
													current += char;
													continue;
												}
												
												if (/^[0-9.]+$/.test(current) && !/[0-9.]/.test(char)) {
													tokens.push({ type: 'number', content: current });
													current = '';
												}
												
												if (/[=+\\-*\\/(){}\\[\\]<>!?:.,;]/.test(char)) {
													if (current) {
														tokens.push({ type: 'code', content: current });
														current = '';
													}
													
													if (char === '=') {
														tokens.push({ type: 'equals', content: char });
													} else {
														tokens.push({ type: 'operator', content: char });
													}
													continue;
												}
												
												current += char;
											}
											
											if (current) {
												if (inComment) {
													tokens.push({ type: 'comment', content: current });
												} else if (inString) {
													tokens.push({ type: 'string', content: current });
												} else if (/^[0-9.]+$/.test(current)) {
													tokens.push({ type: 'number', content: current });
												} else {
													tokens.push({ type: 'code', content: current });
												}
											}
											
											var keywords = [
												// Python
												'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def', 'del', 
												'elif', 'else', 'except', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 
												'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'print', 'raise', 'return', 'try', 
												'while', 'with', 'yield',
												
												// JavaScript/TypeScript
												'abstract', 'arguments', 'boolean', 'case', 'catch', 'const', 'constructor', 'debugger', 
												'default', 'delete', 'do', 'enum', 'eval', 'export', 'extends', 'false', 'function', 
												'implements', 'instanceof', 'interface', 'let', 'new', 'null', 'package', 'private', 
												'protected', 'public', 'static', 'super', 'switch', 'this', 'throw', 'true', 'typeof', 
												'var', 'void',
												
												// Java
												'abstract', 'assert', 'boolean', 'byte', 'case', 'catch', 'char', 'class', 'const', 
												'continue', 'default', 'do', 'double', 'else', 'enum', 'extends', 'final', 'finally', 
												'float', 'for', 'goto', 'if', 'implements', 'import', 'instanceof', 'int', 'interface', 
												'long', 'native', 'new', 'package', 'private', 'protected', 'public', 'return', 'short', 
												'static', 'strictfp', 'super', 'switch', 'synchronized', 'this', 'throw', 'throws', 
												'transient', 'try', 'void', 'volatile', 'while',
												
												// C/C++
												'auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do', 'double', 'else', 
												'enum', 'extern', 'float', 'for', 'goto', 'if', 'inline', 'int', 'long', 'register', 
												'restrict', 'return', 'short', 'signed', 'sizeof', 'static', 'struct', 'switch', 'typedef', 
												'union', 'unsigned', 'void', 'volatile', 'while', 'alignas', 'alignof', 'and', 'and_eq', 
												'asm', 'atomic_cancel', 'atomic_commit', 'atomic_noexcept', 'bitand', 'bitor', 'bool', 
												'catch', 'char16_t', 'char32_t', 'class', 'compl', 'concept', 'constexpr', 'const_cast', 
												'decltype', 'delete', 'dynamic_cast', 'explicit', 'export', 'false', 'friend', 'mutable', 
												'namespace', 'new', 'noexcept', 'not', 'not_eq', 'nullptr', 'operator', 'or', 'or_eq', 
												'private', 'protected', 'public', 'reinterpret_cast', 'requires', 'static_assert', 
												'static_cast', 'template', 'this', 'thread_local', 'throw', 'true', 'try', 'typeid', 
												'typename', 'using', 'virtual', 'wchar_t', 'xor', 'xor_eq',
												
												// C#
												'abstract', 'as', 'base', 'bool', 'break', 'byte', 'case', 'catch', 'char', 'checked', 
												'class', 'const', 'continue', 'decimal', 'default', 'delegate', 'do', 'double', 'else', 
												'enum', 'event', 'explicit', 'extern', 'false', 'finally', 'fixed', 'float', 'for', 
												'foreach', 'goto', 'if', 'implicit', 'in', 'int', 'interface', 'internal', 'is', 'lock', 
												'long', 'namespace', 'new', 'null', 'object', 'operator', 'out', 'override', 'params', 
												'private', 'protected', 'public', 'readonly', 'ref', 'return', 'sbyte', 'sealed', 'short', 
												'sizeof', 'stackalloc', 'static', 'string', 'struct', 'switch', 'this', 'throw', 'true', 
												'try', 'typeof', 'uint', 'ulong', 'unchecked', 'unsafe', 'ushort', 'using', 'virtual', 
												'void', 'volatile', 'while',
												
												// Ruby
												'BEGIN', 'END', 'alias', 'and', 'begin', 'break', 'case', 'class', 'def', 'defined?', 
												'do', 'else', 'elsif', 'end', 'ensure', 'false', 'for', 'if', 'in', 'module', 'next', 
												'nil', 'not', 'or', 'redo', 'rescue', 'retry', 'return', 'self', 'super', 'then', 'true', 
												'undef', 'unless', 'until', 'when', 'while', 'yield',
												
												// PHP
												'abstract', 'and', 'array', 'as', 'break', 'callable', 'case', 'catch', 'class', 'clone', 
												'const', 'continue', 'declare', 'default', 'die', 'do', 'echo', 'else', 'elseif', 'empty', 
												'enddeclare', 'endfor', 'endforeach', 'endif', 'endswitch', 'endwhile', 'eval', 'exit', 
												'extends', 'final', 'finally', 'for', 'foreach', 'function', 'global', 'goto', 'if', 
												'implements', 'include', 'include_once', 'instanceof', 'insteadof', 'interface', 'isset', 
												'list', 'namespace', 'new', 'or', 'print', 'private', 'protected', 'public', 'require', 
												'require_once', 'return', 'static', 'switch', 'throw', 'trait', 'try', 'unset', 'use', 
												'var', 'while', 'xor', 'yield',
												
												// SQL
												'ADD', 'ALL', 'ALTER', 'AND', 'ANY', 'AS', 'ASC', 'BACKUP', 'BETWEEN', 'BY', 'CASE', 
												'CHECK', 'COLUMN', 'CONSTRAINT', 'CREATE', 'DATABASE', 'DEFAULT', 'DELETE', 'DESC', 
												'DISTINCT', 'DROP', 'EXEC', 'EXISTS', 'FOREIGN', 'FROM', 'FULL', 'GROUP', 'HAVING', 
												'IN', 'INDEX', 'INNER', 'INSERT', 'INTO', 'IS', 'JOIN', 'KEY', 'LEFT', 'LIKE', 'LIMIT', 
												'NOT', 'NULL', 'OR', 'ORDER', 'OUTER', 'PRIMARY', 'PROCEDURE', 'RIGHT', 'ROWNUM', 
												'SELECT', 'SET', 'TABLE', 'TOP', 'TRUNCATE', 'UNION', 'UNIQUE', 'UPDATE', 'VALUES', 
												'VIEW', 'WHERE'
											];
											
											var builtins = [
												// Python
												'abs', 'all', 'any', 'bin', 'bool', 'bytearray', 'bytes', 'callable', 'chr', 'classmethod', 
												'compile', 'complex', 'delattr', 'dict', 'dir', 'divmod', 'enumerate', 'eval', 'exec', 
												'filter', 'float', 'format', 'frozenset', 'getattr', 'globals', 'hasattr', 'hash', 'help', 
												'hex', 'id', 'input', 'int', 'isinstance', 'issubclass', 'iter', 'len', 'list', 'locals', 
												'map', 'max', 'memoryview', 'min', 'next', 'object', 'oct', 'open', 'ord', 'pow', 'print', 
												'property', 'range', 'repr', 'reversed', 'round', 'set', 'setattr', 'slice', 'sorted', 
												'staticmethod', 'str', 'sum', 'super', 'tuple', 'type', 'vars', 'zip',
												
												// JavaScript
												'Array', 'Boolean', 'Date', 'Error', 'EvalError', 'Function', 'Infinity', 'JSON', 'Math', 
												'NaN', 'Number', 'Object', 'Promise', 'Proxy', 'RangeError', 'ReferenceError', 'RegExp', 
												'String', 'Symbol', 'SyntaxError', 'TypeError', 'URIError', 'decodeURI', 'decodeURIComponent', 
												'encodeURI', 'encodeURIComponent', 'escape', 'eval', 'isFinite', 'isNaN', 'parseFloat', 
												'parseInt', 'undefined', 'unescape',
												
												// Java
												'System', 'String', 'Integer', 'Double', 'Float', 'Boolean', 'Character', 'Byte', 'Short', 
												'Long', 'Math', 'Object', 'Class', 'Exception', 'RuntimeException', 'Throwable', 'Error', 
												'Thread', 'Runnable', 'Iterable', 'Comparable', 'Cloneable', 'Override', 'Deprecated',
												
												// C/C++ Standard Library
												'printf', 'scanf', 'cout', 'cin', 'malloc', 'free', 'realloc', 'calloc', 'memcpy', 'memset', 
												'strlen', 'strcmp', 'strcpy', 'strcat', 'fopen', 'fclose', 'fread', 'fwrite', 'fprintf', 
												'fscanf', 'exit', 'abort', 'assert',
												
												// SQL Functions
												'AVG', 'COUNT', 'MAX', 'MIN', 'SUM', 'UCASE', 'LCASE', 'MID', 'LEN', 'ROUND', 'NOW', 
												'FORMAT', 'CURRENT_DATE', 'CURRENT_TIME', 'CURRENT_TIMESTAMP'
											];
											
											var highlighted = '';
											
											for (var i = 0; i < tokens.length; i++) {
												var token = tokens[i];
												
												if (token.type === 'comment') {
													highlighted += '<span style="color: #999999;">' + token.content + '</span>';
												} else if (token.type === 'string') {
													highlighted += '<span style="color: #006400;">' + token.content + '</span>';
												} else if (token.type === 'number') {
													highlighted += '<span style="color: #C71585;">' + token.content + '</span>';
												} else if (token.type === 'equals') {
													highlighted += '<span style="color: #B8860B;">' + token.content + '</span>';
												} else if (token.type === 'operator') {
													highlighted += '<span style="color: ' + secondaryTextColor + ';">' + token.content + '</span>';
												} else if (token.type === 'code') {
													var word = token.content.trim();
													
													if (keywords.indexOf(word) !== -1) {
														highlighted += '<span style="color: ' + darkenedAccentColor + ';">' + token.content + '</span>';
													} else if (builtins.indexOf(word) !== -1) {
														highlighted += '<span style="color: ' + darkenedAccentColor + ';">' + token.content + '</span>';
													} else if (word.startsWith('@')) {
														highlighted += '<span style="color: #AA00AA;">' + token.content + '</span>';
													} else {
														highlighted += token.content;
													}
												} else {
													highlighted += token.content;
												}
											}
											
											return highlighted;
										} else {
											return code;
										}
									}
									
									content = highlightCode(content, '${language}');
								} catch (e) {
									console.error('Error highlighting syntax:', e);
								}
								
								codeHtml += '<div style="display: block; min-height: 1.5em; line-height: 1.5em; white-space: pre; margin: 0; padding: 0;">';
								
								for (var j = 0; j < leadingSpaces; j++) {
									codeHtml += '&nbsp;';
								}
								
								codeHtml += content + '</div>';
							}
							
							var langDisplay = '${language}'.charAt(0).toUpperCase() + '${language}'.slice(1);
							
							var fullCodeHtml = '<div class="code-container" style="position: relative; margin: 10px 0;">' +
								'<pre class="code-block language-${language}" style="background-color: ${bgColor}; padding: 25px 10px 10px 15px; border-radius: 5px; font-family: monospace; font-size: 10px; overflow-x: auto; margin: 5px 0; border: none; border-left: 3px solid ${themeStore.currentTheme.originalMainGradientColor.color} !important; white-space: pre; line-height: 1.5;">' +
								'<code class="language-${language}" style="display: block; white-space: pre;">' + codeHtml + '</code>' +
								'</pre>' +
								'<div class="language-label" style="position: absolute; top: 5px; left: 5px; color: ${accentColor}; padding: 0px 5px; font-size: 10px; background-color: transparent;">' + langDisplay + '</div>' +
								'<div class="copy-button" style="position: absolute; top: 5px; right: 5px; background-color: rgba(0, 0, 0, 0.5); color: ${accentColor}; width: 24px; height: 24px; border-radius: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer; opacity: 0.8; transition: all 0.2s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid rgba(0,0,0,0.1);"><svg class="copy-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M16 1H4C2.9 1 2 1.9 2 3v14h2V3h12V1zm3 4H8C6.9 5 6 5.9 6 7v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"></path></svg></div>' +
								'</div><br>';
							
							document.execCommand('insertHTML', false, fullCodeHtml);
						} catch (error) {
							console.error('Error inserting code:', error);
						}
					})()
				`)

				setTimeout(() => {
					setIsFormatting(false)
				}, 100)
			}
		}))

		useEffect(() => {
			if (value !== lastValue && !isFormatting) {
				richText.current?.setContentHTML(convertMarkdownToHtml(value))
				setLastValue(value)
			}
		}, [value, isFormatting])

		useEffect(() => {
			if (text !== undefined && text !== lastValue && !isFormatting) {
				richText.current?.setContentHTML(text ? convertMarkdownToHtml(text) : '')
				setLastValue(text || '')
			}
		}, [text, isFormatting])

		const convertMarkdownToHtml = (text: string): string => {
			if (!text) return ''

			const accentColor = themeStore.currentTheme.originalMainGradientColor.color as string
			const bgColor = changeRgbA(accentColor, "0.1") // Уменьшаем прозрачность для лучшей видимости

			text = text.replace(/\r\n|\r/g, "\n")

			text = text
				.replace(/```python\n([\s\S]*?)```/g, function (match, code) {
					code = code.replace(/\r\n|\r/g, "\n")

					code = code.replace(/(def|class|if|elif|else|for|while|try|except|finally|with)([^:]*):([^\n]*)/g, "$1$2:\n$3")

					var lines = code.split("\n")

					var processedLines = []
					var lastLineEmpty = false

					for (var i = 0; i < lines.length; i++) {
						var line = lines[i]
						var isEmpty = line.trim() === ''

						if (isEmpty) {
							if (!lastLineEmpty) {
								processedLines.push("")
								lastLineEmpty = true
							}
						} else {
							processedLines.push(line)
							lastLineEmpty = false
						}
					}

					var codeHtml = ''

					var emptyLineCount = 0

					for (var i = 0; i < processedLines.length; i++) {
						var line = processedLines[i]

						if (line.trim() === '') {
							emptyLineCount++

							if (emptyLineCount === 1) {
								codeHtml += '<div style="display: block; height: 1.5em; line-height: 1.5em; white-space: pre; margin: 0; padding: 0;"><br></div>'
							}
							continue
						}

						emptyLineCount = 0

						var leadingSpaces = (line.match(/^\s*/) || [''])[0].length

						var content = line.substring(leadingSpaces)

						content = content
							.replace(/&/g, '&amp;')
							.replace(/</g, '&lt;')
							.replace(/>/g, '&gt;')

						content = highlightSyntax(content, 'python')

						codeHtml += '<div style="display: block; min-height: 1.5em; line-height: 1.5em; white-space: pre; margin: 0; padding: 0;">'

						for (var j = 0; j < leadingSpaces; j++) {
							codeHtml += '&nbsp;'
						}

						codeHtml += content + '</div>'
					}

					var langDisplay = 'Python'

					return '<div class="code-container" style="position: relative; margin: 10px 0;">' +
						'<pre class="code-block language-python" style="background-color: ' + bgColor + '; padding: 25px 10px 10px 15px; border-radius: 5px; font-family: monospace; font-size: 10px; overflow-x: auto; margin: 5px 0; border: none; border-left: 3px solid ' + themeStore.currentTheme.originalMainGradientColor.color + ' !important; white-space: pre; line-height: 1.5;">' +
						'<code class="language-python" style="display: block; white-space: pre;">' + codeHtml + '</code>' +
						'</pre>' +
						'<div class="language-label" style="position: absolute; top: 5px; left: 5px; color: ' + accentColor + '; padding: 0px 5px; font-size: 10px; background-color: transparent;">' + langDisplay + '</div>' +
						'<div class="copy-button" style="position: absolute; top: 5px; right: 5px; background-color: rgba(0, 0, 0, 0.5); color: ' + accentColor + '; width: 24px; height: 24px; border-radius: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer; opacity: 0.8; transition: all 0.2s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid rgba(0,0,0,0.1);"><svg class="copy-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M16 1H4C2.9 1 2 1.9 2 3v14h2V3h12V1zm3 4H8C6.9 5 6 5.9 6 7v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"></path></svg></div>' +
						'</div>'
				})
				// Цвет
				.replace(/:([A-Fa-f0-9]{6}):(.*?):/g, '<span style="color: #$1">$2</span>')
				// Жирный текст
				.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
				// Курсив
				.replace(/\*(.*?)\*/g, '<i>$1</i>')
				// Подчеркнутый
				.replace(/__(.*?)__/g, '<u>$1</u>')

			return text
		}

		const handleChange = (html: string) => {
			try {
				const $ = cheerio.load(html)
				const rawText = $.text()

				const formattedText = html

				if (rawText !== undefined && setRawText) {
					setRawText(rawText)
				}
				if (setText) {
					setText(formattedText)
				}

				setLastValue(formattedText)

				if (onChangeText) {
					onChangeText(formattedText)
				}
			} catch (err) { console.log(err) }
		}

		return (
			<View style={[
				styles.container,
				{
					minHeight,
					maxHeight: maxHeight,
					overflow: 'hidden',
					position: 'relative'
				},
				style
			]}>
				{isVisible && (
					<RichEditor
						ref={richText}
						initialContentHTML={convertMarkdownToHtml(text || value || '')}
						onChange={handleChange}
						onSelectionChange={onSelectionChange}
						placeholder={placeholder}
						initialHeight={minHeight}
						containerStyle={[
							styles.container,
							{
								minHeight: minHeight,
								maxHeight: maxHeight,
								overflow: 'auto'
							},
							style
						]}
						useContainer={true}
						initialFocus={false}
						pasteAsPlainText={true}
						disabled={!isVisible}
						editorInitializedCallback={() => {
							richText.current?.commandDOM(`
								document.body.style.minHeight = "${minHeight}px";
								document.body.style.height = "auto";
								document.body.style.padding = "0";
								document.body.style.margin = "0";
								document.body.style.boxSizing = "border-box";
								document.body.style.overflowY = "auto";
								document.body.style.webkitOverflowScrolling = "touch";
								
								var style = document.createElement('style');
								style.textContent = \`
									div { min-height: 24px; line-height: 24px; }
									blockquote { margin-left: 20px; padding-left: 10px; border-left: 2px solid #ccc; }
									.ql-indent-1 { margin-left: 20px; }
									.ql-indent-2 { margin-left: 40px; }
									.ql-indent-3 { margin-left: 60px; }
									.ql-indent-4 { margin-left: 80px; }
									.ql-indent-5 { margin-left: 100px; }
									
									.code-block {
										background-color: #f5f5f5;
										padding: 10px;
										border-radius: 5px;
										font-family: monospace;
										font-size: 10px;
										overflow-x: auto;
										margin: 5px 0;
										border: 1px solid #e0e0e0;
									}
									
									.code-container {
										position: relative;
										margin: 10px 0;
									}
									
									.language-label {
										position: absolute;
										top: 0;
										left: 0;
										background-color: transparent;
										color: #333;
										padding: 2px 5px;
										font-size: 10px;
									}
									
									.copy-button {
										position: absolute;
										top: 5px;
										right: 5px;
										background-color: rgba(0, 0, 0, 0.5);
										color: #333;
										width: 24px;
										height: 24px;
										border-radius: 4px;
										display: flex;
										align-items: center;
										justify-content: center;
										cursor: pointer;
										opacity: 0.8;
										transition: all 0.2s ease;
										box-shadow: 0 1px 3px rgba(0,0,0,0.1);
										border: 1px solid rgba(0,0,0,0.1);
										font-size: 16px !important;
										font-family: monospace !important;
										line-height: 1 !important;
										text-align: center !important;
									}
									
									.copy-icon {
										width: 16px;
										font-size: 16px;
										height: 16px;
										display: inline-block;
									}
									
									.copy-success {
										background-color: rgba(0, 0, 0, 0.5);
										color: white;
									}
								\`;
								document.head.appendChild(style);
								
								function restoreCopyButtons() {
									var codeContainers = document.querySelectorAll('.code-container');
									codeContainers.forEach(function(container) {
										var existingButton = container.querySelector('.copy-button');
										
										if (!existingButton || existingButton.offsetWidth === 0 || existingButton.offsetHeight === 0) {
											if (existingButton) {
												existingButton.remove();
											}
											
											var copyButton = document.createElement('div');
											copyButton.className = 'copy-button';
											copyButton.innerHTML = '<svg class="copy-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M16 1H4C2.9 1 2 1.9 2 3v14h2V3h12V1zm3 4H8C6.9 5 6 5.9 6 7v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"></path></svg>';
											
											container.appendChild(copyButton);
										}
									});
								}
								
								restoreCopyButtons();
								
								setInterval(restoreCopyButtons, 500);
								
								document.addEventListener('click', function(event) {
									var target = event.target;
									
									while (target && !target.classList.contains('copy-button')) {
										if (target.parentNode) {
											target = target.parentNode;
										} else {
											break;
										}
									}
									
									if (target && target.classList.contains('copy-button')) {
										event.preventDefault();
										event.stopPropagation();
										
										var codeContainer = target.closest('.code-container');
										if (codeContainer) {
											var codeElement = codeContainer.querySelector('code');
											if (codeElement) {
												var textToCopy = codeElement.innerText || codeElement.textContent;
												
												var textarea = document.createElement('textarea');
												textarea.value = textToCopy;
												textarea.style.position = 'fixed';
												textarea.style.opacity = '0';
												document.body.appendChild(textarea);
												textarea.select();
												
												try {
													var successful = document.execCommand('copy');
													if (successful) {
														target.innerHTML = '<svg class="copy-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"></path></svg>';
														target.classList.add('copy-success');
														
														setTimeout(function() {
															target.innerHTML = '<svg class="copy-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M16 1H4C2.9 1 2 1.9 2 3v14h2V3h12V1zm3 4H8C6.9 5 6 5.9 6 7v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"></path></svg>';
															target.classList.remove('copy-success');
														}, 1500);
													}
												} catch (err) {
													console.error('Не удалось скопировать текст: ', err);
												}
												
												document.body.removeChild(textarea);
											}
										}
									}
								});
							`)
						}}
						onMessage={(event: any) => {
							try {
								const data = JSON.parse(event.nativeEvent.data)
								if (data.type === 'contentHeight') {
									const newHeight = Math.min(maxHeight, Math.max(minHeight, data.height + 20))

									if (Math.abs(newHeight - editorHeight) > 5) {
										setEditorHeight(newHeight)

										if (onContentSizeChange) {
											onContentSizeChange({
												nativeEvent: {
													contentSize: {
														width: 0,
														height: newHeight
													}
												}
											})
										}
									}
								}
							} catch (e) {
								console.log(e)
							}
						}}
						editorStyle={{
							backgroundColor: 'transparent',
							color: themeStore.currentTheme.textColor.color as string,
							placeholderColor: placeholderTextColor as string || themeStore.currentTheme.secondTextColor.color as string,
							contentCSSText: `
								font-family: -apple-system; 
								font-size: 14.5px; 
								padding: 7px 5px 7px 10px;
								min-height: ${minHeight}px;
								height: auto;
								overflow-y: auto;
								-webkit-overflow-scrolling: touch;
								max-height: ${maxHeight}px;
							`
						}}
						{...props}
					/>
				)}
			</View>
		)
	}
)

const styles = StyleSheet.create({
	container: {
		position: 'relative',
		overflow: 'hidden',
	}
})

function highlightSyntax(code: string, language: string): string {
	if (language === 'python') {
		const accentColor = themeStore.currentTheme.originalMainGradientColor.color as string
		const secondaryTextColor = themeStore.currentTheme.secondTextColor.color as string
		const darkenedAccentColor = darkenRGBA(accentColor, 0.5)

		code = code.replace(/(".*?"|'.*?'|f'.*?'|f".*?")/g, '<span style="color: #006400;">$1</span>')

		return code
			// Комментарии
			.replace(/(#.*)/g, '<span style="color: #999999;">$1</span>')
			// Ключевые слова (исключаем уже обработанные строки)
			.replace(/(?<!<span[^>]*>.*)\b(and|as|assert|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield)\b(?![^<]*<\/span>)/g,
				`<span style="color: ${darkenedAccentColor};">$1</span>`)
			// Числа (исключаем уже обработанные строки)
			.replace(/(?<!<span[^>]*>.*)\b(\d+(\.\d+)?)\b(?![^<]*<\/span>)/g,
				'<span style="color: #C71585;">$1</span>')
			// Встроенные функции (исключаем уже обработанные строки)
			.replace(/(?<!<span[^>]*>.*)\b(abs|all|any|bin|bool|bytearray|and|as|assert|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield|bytes|callable|chr|classmethod|compile|complex|delattr|dict|dir|divmod|enumerate|eval|exec|filter|float|format|frozenset|getattr|globals|hasattr|hash|help|hex|id|input|int|isinstance|issubclass|iter|len|list|locals|map|max|memoryview|min|next|object|oct|open|ord|pow|print|property|range|repr|reversed|round|set|setattr|slice|sorted|staticmethod|str|sum|super|tuple|type|vars|zip)\b(?![^<]*<\/span>)/g,
				`<span style="color: ${darkenedAccentColor};">$1</span>`)
			// Декораторы (исключаем уже обработанные строки)
			.replace(/(?<!<span[^>]*>.*)([@]\w+)(?![^<]*<\/span>)/g,
				'<span style="color: #AA00AA;">$1</span>')
			// Равно (исключаем уже обработанные строки)
			.replace(/(?<!<span[^>]*>.*)(\=)(?![^<]*<\/span>)/g,
				'<span style="color: #B8860B;">$1</span>')
			// Скобки и операторы (исключаем уже обработанные строки)
			.replace(/(?<!<span[^>]*>.*)(\(|\)|\[|\]|\{|\}|\+|\-|\*|\/|\%|\<|\>|\!|\?|\:|\.|,|;)(?![^<]*<\/span>)/g,
				`<span style="color: ${secondaryTextColor};">$1</span>`)
	} else if (language === 'javascript' || language === 'typescript') {
		return code
			// Комментарии
			.replace(/(\/\/.*|\/\*[\s\S]*?\*\/)/g, '<span style="color: #999999;">$1</span>')
			// Строки
			.replace(/(".*?"|'.*?'|`[\s\S]*?`)/g, '<span style="color: #008000;">$1</span>')
			// Ключевые слова
			.replace(/\b(break|case|catch|class|const|continue|debugger|default|delete|do|else|export|extends|finally|for|function|if|import|in|instanceof|new|return|super|switch|this|throw|try|typeof|var|void|while|with|yield|let|static|enum|await|async)\b/g,
				'<span style="color: #0000FF;">$1</span>')
			// Числа
			.replace(/\b(\d+(\.\d+)?)\b/g, '<span style="color: #FF8000;">$1</span>')
			// Встроенные объекты
			.replace(/\b(Array|Date|eval|function|hasOwnProperty|Infinity|isFinite|isNaN|isPrototypeOf|length|Math|name|Number|Object|prototype|String|toString|undefined|valueOf)\b/g,
				'<span style="color: #0000AA;">$1</span>')
			// TypeScript типы
			.replace(/\b(any|boolean|number|string|void|never|unknown|object|symbol|bigint|readonly|keyof|typeof|partial|required|readonly|record|pick|omit|exclude|extract|parameters|constructorparameters|returntype|instancetype|thisparametrizedtype|omitthisparameter|intrinsic)\b/g,
				'<span style="color: #AA00AA;">$1</span>')
			// Скобки и операторы
			.replace(/(\(|\)|\[|\]|\{|\}|\+|\-|\*|\/|\%|\=|\<|\>|\!|\?|\:|\.|,|;)/g,
				'<span style="color: #666666;">$1</span>')
	} else if (language === 'html' || language === 'xml') {
		return code
			// Теги
			.replace(/(&lt;\/?[a-zA-Z0-9]+)(\s+[a-zA-Z0-9\-]+(\s*=\s*(".*?"|'.*?'|\S+))?)*\s*(&gt;)/g,
				'<span style="color: #0000FF;">$1</span>$2<span style="color: #0000FF;">$5</span>')
			// Атрибуты
			.replace(/(\s+[a-zA-Z0-9\-]+)(\s*=\s*)/g,
				'<span style="color: #AA00AA;">$1</span>$2')
			// Значения атрибутов
			.replace(/(\s*=\s*)(".*?"|'.*?')/g,
				'$1<span style="color: #008000;">$2</span>')
			// Комментарии
			.replace(/(&lt;!--[\s\S]*?--&gt;)/g,
				'<span style="color: #999999;">$1</span>')
	} else if (language === 'css') {
		return code
			// Селекторы
			.replace(/([a-zA-Z0-9\-_\.#\[\]="']+\s*\{)/g,
				'<span style="color: #0000FF;">$1</span>')
			// Свойства
			.replace(/(\s+[a-zA-Z0-9\-]+\s*:)/g,
				'<span style="color: #AA00AA;">$1</span>')
			// Значения
			.replace(/(:\s*[^;]+;)/g,
				'<span style="color: #008000;">$1</span>')
			// Комментарии
			.replace(/(\/\*[\s\S]*?\*\/)/g,
				'<span style="color: #999999;">$1</span>')
	} else if (language === 'json') {
		return code
			// Ключи
			.replace(/(".*?"\s*:)/g,
				'<span style="color: #AA00AA;">$1</span>')
			// Строки
			.replace(/:\s*(".*?")/g,
				': <span style="color: #008000;">$1</span>')
			// Числа
			.replace(/:\s*(\d+(\.\d+)?)/g,
				': <span style="color: #FF8000;">$1</span>')
			// Булевы значения и null
			.replace(/:\s*(true|false|null)\b/g,
				': <span style="color: #0000FF;">$1</span>')
	} else if (language === 'sql') {
		return code
			// Ключевые слова
			.replace(/\b(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TABLE|INDEX|VIEW|TRIGGER|PROCEDURE|FUNCTION|DATABASE|SCHEMA|GRANT|REVOKE|USE|JOIN|LEFT|RIGHT|INNER|OUTER|FULL|ON|GROUP BY|ORDER BY|HAVING|LIMIT|OFFSET|UNION|ALL|DISTINCT|AS|INTO|VALUES|SET|BETWEEN|LIKE|IN|IS|NULL|NOT|AND|OR|EXISTS|CASE|WHEN|THEN|ELSE|END)\b/gi,
				'<span style="color: #0000FF;">$1</span>')
			// Функции
			.replace(/\b(COUNT|SUM|AVG|MIN|MAX|UPPER|LOWER|SUBSTRING|CONCAT|TRIM|LENGTH|ROUND|NOW|CURRENT_DATE|CURRENT_TIME|CURRENT_TIMESTAMP)\b/gi,
				'<span style="color: #0000AA;">$1</span>')
			// Строки
			.replace(/('.*?')/g,
				'<span style="color: #008000;">$1</span>')
			// Числа
			.replace(/\b(\d+(\.\d+)?)\b/g,
				'<span style="color: #FF8000;">$1</span>')
			// Комментарии
			.replace(/(--.*|\/\*[\s\S]*?\*\/)/g,
				'<span style="color: #999999;">$1</span>')
	} else {
		// Базовая подсветка для других языков
		return code
			// Строки
			.replace(/(".*?"|'.*?')/g, '<span style="color: #008000;">$1</span>')
			// Числа
			.replace(/\b(\d+(\.\d+)?)\b/g, '<span style="color: #FF8000;">$1</span>')
			// Скобки и операторы
			.replace(/(\(|\)|\[|\]|\{|\}|\+|\-|\*|\/|\%|\=|\<|\>|\!|\?|\:|\.|,|;)/g,
				'<span style="color: #666666;">$1</span>')
	}
}

function darkenRGBA(color: string, factor: number): string {
	if (color.startsWith('#')) {
		const r = parseInt(color.slice(1, 3), 16)
		const g = parseInt(color.slice(3, 5), 16)
		const b = parseInt(color.slice(5, 7), 16)

		const darkenedR = Math.max(0, Math.floor(r * (1 - factor)))
		const darkenedG = Math.max(0, Math.floor(g * (1 - factor)))
		const darkenedB = Math.max(0, Math.floor(b * (1 - factor)))

		return `#${darkenedR.toString(16).padStart(2, '0')}${darkenedG.toString(16).padStart(2, '0')}${darkenedB.toString(16).padStart(2, '0')}`
	}

	return color
}