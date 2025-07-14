import { themeStore } from '@stores/theme';
import { TextAlignT } from '@ui/types';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { Text, TextProps } from 'react-native';

interface SecondaryTextProps extends TextProps {
	px?: number;
	tac?: TextAlignT;
	ml?: number;
	mt?: number;
	mb?: number;
	debug?: boolean;
}

export const SecondaryText = observer(({
	style,
	px = 16,
	tac = "auto",
	ml = 0,
	mt = 0,
	mb = 0,
	debug = false,
	...props
}: SecondaryTextProps) => {
	const { currentTheme: { secondTextColor: { color } } } = themeStore;

	return (
		<Text
			style={[
				{
					fontSize: px,
					color: color,
					textAlign: tac,
					marginLeft: ml,
					marginTop: mt,
					marginBottom: mb,
				},
				debug && {
					borderWidth: 0.5,
					borderColor: "red",
				},
				style
			]}
			{...props}
		/>
	);
});