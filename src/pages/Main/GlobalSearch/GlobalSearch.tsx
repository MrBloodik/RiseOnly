import { MaterialIcons } from '@expo/vector-icons';
import { Box, MainText } from '@shared/ui';
import { ActionKey, ActionMap } from '@shared/ui/ExpoRichEditorUi/ExpoRichToolbar';
import { ProfileSettingsWrapper } from '@widgets/wrappers';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

export const GlobalSearch = observer(() => {
	const exampleNumber = null;
	const [value, setValue] = useState<string>('');
	const numberOfLines = 5;
	const minHeight = 20 * numberOfLines;

	useEffect(() => {
		const timer = setTimeout(() => {
			let result = '';
			const v =
				'<p><i><u>Underline italic text</u></i> <b>bold word</b> normal text with some characters <i>Italic word</i> another normal text <u>underline word</u> and email link <a href="mailto:siposdani87@gmail.com">mailto</a> and standard link <a href="https://google.com" target="_blank"><b>link to website</b></a> and link to <a href="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" target="_blank">download file</a>.</p><p>New paragraph</p><p>This is a new <i>italic</i> paragraph</p><p>this is another new <u>underline</u> paragraph</p><ul><li>list item 1</li><li>list item 2</li></ul>';
			for (let i = 0; i <= 3; i++) {
				result += i + '<br />' + v;
			}
			result += '<br />End';
			setValue(result);
		}, 2000);

		return () => {
			clearTimeout(timer);
		};
	}, []);

	const onValueChange = (v: string): void => {
		console.log('onValueChange', v);
		setValue(v);
	};

	const getColor = (selected: boolean): string => {
		return selected ? 'red' : 'black';
	};

	const getActionMap = (): ActionMap => {
		const size = 24;

		return {
			[ActionKey.undo]: ({ selected }: any) => (
				<MaterialIcons
					name="undo"
					size={size}
					color={getColor(selected)}
				/>
			),
			[ActionKey.redo]: ({ selected }: any) => (
				<MaterialIcons
					name="redo"
					size={size}
					color={getColor(selected)}
				/>
			),
			[ActionKey.bold]: ({ selected }: any) => (
				<MaterialIcons
					name="format-bold"
					size={size}
					color={getColor(selected)}
				/>
			),
			[ActionKey.italic]: ({ selected }: any) => (
				<MaterialIcons
					name="format-italic"
					size={size}
					color={getColor(selected)}
				/>
			),
			[ActionKey.underline]: ({ selected }: any) => (
				<MaterialIcons
					name="format-underlined"
					size={size}
					color={getColor(selected)}
				/>
			),
			[ActionKey.unorderedList]: ({ selected }: any) => (
				<MaterialIcons
					name="format-list-bulleted"
					size={size}
					color={getColor(selected)}
				/>
			),
			[ActionKey.orderedList]: ({ selected }: any) => (
				<MaterialIcons
					name="format-list-numbered"
					size={size}
					color={getColor(selected)}
				/>
			),
			[ActionKey.clear]: ({ selected }: any) => (
				<MaterialIcons
					name="format-clear"
					size={size}
					color={getColor(selected)}
				/>
			),
			[ActionKey.code]: ({ selected }: any) => (
				<MaterialIcons
					name="code"
					size={size}
					color={getColor(selected)}
				/>
			),
		};
	};

	const onFocus = (): void => {
		console.log('onFocus');
	};

	const onBlur = (): void => {
		console.log('onBlur');
	};

	const isSelectedExample = (index: number): boolean => {
		return index === exampleNumber || exampleNumber === null;
	};

	return (
		<ProfileSettingsWrapper
			tKey='globalsearch_title'
			withoutBackBtn
			height={30}
		>
			<Box flex={1} height={"100%"}>
				<MainText>ASDKAJSDKLc</MainText>
			</Box>
		</ProfileSettingsWrapper>
	);
});

const styles = StyleSheet.create({
	container: {
		backgroundColor: 'lightgrey',
	},
	editorContainer: {
		margin: 10,
	},
	viewer: {
		borderColor: 'green',
		borderWidth: 1,
		padding: 5,
	},
	viewerText: {
		fontFamily: 'Oswald_400Regular',
	},
	editor: {
		borderColor: 'blue',
		borderWidth: 1,
		padding: 5,
	},
	editorText: {
		fontFamily: 'Inter_500Medium',
		fontSize: 18,
	},
	editorDark: {
		borderColor: 'blue',
		borderWidth: 1,
		backgroundColor: 'black',
		padding: 15,
	},
	editorDarkText: {
		fontFamily: 'RobotoCondensed_400Regular_Italic',
		fontSize: 12,
		color: 'white',
	},
	link: {
		color: 'green',
	},
	toolbar: {
		borderColor: 'red',
		borderWidth: 1,
		height: 40,
	},
});