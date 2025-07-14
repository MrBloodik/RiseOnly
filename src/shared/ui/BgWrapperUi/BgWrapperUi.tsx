import sakura from '@images/mobilebg.png';
import { themeStore } from '@stores/theme';
import { observer } from 'mobx-react-lite';
import { ImageBackground, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

interface BgWrapperUiProps {
	children: React.ReactNode;
	style?: StyleProp<ViewStyle>;
	source?: string;
	requiredBg?: boolean;
	withOverlay?: boolean;
	bgColor?: string | number;
}

export const BgWrapperUi = observer(({
	children,
	source = sakura,
	withOverlay = true,
	style,
	bgColor,
	requiredBg = true
}: BgWrapperUiProps) => {
	const { currentTheme } = themeStore;

	if (!requiredBg) {
		return (
			<View
				style={[
					styles.container,
					{ backgroundColor: (bgColor as string) || currentTheme.bgTheme.background as string },
					style
				]}
			>
				{children}
			</View>
		);
	}

	return (
		<ImageBackground
			// @ts-ignore
			source={source}
			style={[styles.container, style]}
			resizeMode="cover"
		>
			{withOverlay ? (
				<View style={styles.overlay}>
					{children}
				</View>
			) : (
				<>{children}</>
			)}
		</ImageBackground>
	);
});

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
	},
});