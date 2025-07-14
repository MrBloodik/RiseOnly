import { getMaxLengthColor } from '@shared/lib/numbers';
import { themeStore } from '@stores/theme';
import { observer } from 'mobx-react-lite';
import { NativeSyntheticEvent, StyleSheet, TextInput, TextInputChangeEventData, TextInputProps, View } from 'react-native';
import { Box } from '../BoxUi/Box';
import { ErrorTextUi } from '../ErrorTextUi/ErrorTextUi';
import { MainText } from '../MainText/MainText';

interface SimpleInputUiProps extends TextInputProps {
	name?: null | string;
	error?: null | string;
	maxLength?: number;
	value?: string;
	title?: string;
	groupContainer?: boolean;
	setValue?: (key: string, value: string) => void;
}

export const SimpleInputUi = observer(({
	name = null,
	error = null,
	maxLength,
	value,
	title,
	setValue,
	groupContainer = false,
	...props
}: SimpleInputUiProps) => {
	const { currentTheme } = themeStore;

	const onChangeHandler = (e: NativeSyntheticEvent<TextInputChangeEventData>) => {
		if (!setValue || !name) return;
		const newValue = e.nativeEvent.text;
		setValue(name, newValue);
	};

	const getInput = () => (
		<TextInput
			placeholderTextColor={currentTheme.secondTextColor.color}
			cursorColor={currentTheme.originalMainGradientColor.color as string}
			selectionColor={currentTheme.originalMainGradientColor.color as string}
			onChange={e => onChangeHandler(e)}
			maxLength={maxLength}
			value={value}
			{...props}
		/>
	);

	if (!setValue && maxLength == 0) return getInput();

	return (
		<View style={error ? s.errorStyles : {}}>
			{title && <MainText px={12} style={s.title}>{title}</MainText>}

			<View style={groupContainer ? s.groupContainer : {}}>
				<Box fD='row' justify='space-between' position='relative'>
					{getInput()}
					{maxLength && value && (
						<Box
							style={{
								position: 'absolute',
								bottom: 0,
								right: -5,
							}}>
							<MainText color={getMaxLengthColor(value.length, maxLength)} px={11}>
								{maxLength - value.length}
							</MainText>
						</Box>
					)}
				</Box>
				{error && (
					<ErrorTextUi
						style={s.error}
						px={11}
					>
						{error}
					</ErrorTextUi>
				)}
			</View>
		</View>
	);
}
);

const s = StyleSheet.create({
	title: {
		marginLeft: 6,
		marginBottom: 3
	},
	error: {
		position: 'absolute',
		bottom: -12.5,
	},
	errorStyles: {
		marginBottom: 1
	},
	groupContainer: {
		position: 'relative',
		backgroundColor: themeStore.currentTheme.bgTheme.background as string,
		borderRadius: 10,
		flexDirection: 'column',
		gap: 15,
		paddingVertical: 8,
		paddingHorizontal: 12.5,
		width: '100%',
	},
});