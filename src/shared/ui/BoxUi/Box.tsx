import { observer } from 'mobx-react-lite';
import { ReactNode } from 'react';
import { DimensionValue, View, ViewProps, ViewStyle } from 'react-native';

export const Box = observer(({
	children,
	bRad = 0,
	centered = false,
	flex = 0,
	bgColor = 'transparent',
	bBotColor = 'transparent',
	display = undefined,
	fD = "column",
	minHeight,
	position,
	bBotWidth = 0,
	padding = 0,
	align = "flex-start",
	justify = "flex-start",
	margin = 0,
	width,
	height,
	gap = 0,
	style,
	debug = false,
	...rest
}: BoxProps) => {
	return (
		<View
			style={[
				debug && {
					borderWidth: 0.2,
					borderColor: "red"
				},
				{
					display: display,
					borderRadius: bRad,
					backgroundColor: bgColor as string,
					gap: gap,
					flex: flex,
					padding: padding,
					margin: margin,
					width: width,
					height: height,
					minHeight: minHeight,
					justifyContent: centered ? 'center' : justify,
					alignItems: centered ? 'center' : align,
					borderBottomWidth: bBotWidth,
					borderBottomColor: bBotColor,
					flexDirection: fD,
					position
				},
				style,
			]}
			{...rest}
		>
			{children}
		</View>
	);
});

type BoxProps = ViewProps & {
	children?: ReactNode;
	debug?: boolean;
	bRad?: number;
	centered?: boolean;
	flex?: number;
	bgColor?: string | undefined | number;
	gap?: number;
	minHeight?: DimensionValue;
	padding?: number;
	margin?: number;
	width?: DimensionValue;
	height?: DimensionValue;
	style?: ViewStyle;
	bBotColor?: string;
	align?: "center" | "flex-start" | "flex-end" | undefined;
	justify?: "center" | "flex-start" | "flex-end" | "space-between" | undefined | "space-around";
	bBotWidth?: number;
	display?: 'flex' | 'none' | undefined;
	fD?: "column" | "row" | undefined;
	position?: "absolute" | "relative" | "static" | undefined;
};