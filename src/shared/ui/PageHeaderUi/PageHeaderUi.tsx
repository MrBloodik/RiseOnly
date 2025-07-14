import { BackArrowLeftIcon } from '@icons/Ui/BackArrowLeftIcon';
import { useNavigation } from '@react-navigation/native';
import { changeRgbA, darkenRGBA } from '@shared/lib/theme';
import { themeStore } from '@stores/theme';
import { observer } from 'mobx-react-lite';
import { ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlexAlignType, GestureResponderEvent, LayoutChangeEvent, StyleProp, StyleSheet, useWindowDimensions, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box } from '../BoxUi/Box';
import { LoaderUi } from '../LoaderUi/LoaderUi';
import { MainText } from '../MainText/MainText';
import { SimpleButtonUi } from '../SimpleButtonUi/SimpleButtonUi';

interface PageHeaderUiProps {
	text?: string;
	style?: StyleProp<ViewStyle>;
	cancelText?: string | null;
	leftJsx?: ReactNode | null;
	rightJsx?: ReactNode | null;
	midJsx?: ReactNode | null;
	Component?: any;
	intensity?: number;
	rightTop?: number;
	leftTop?: number;
	isBlurView?: boolean;
	wrapperJustifyContent?: FlexAlignType;
	height?: number;
	loading?: "nointernet" | "pending" | "fulfilled" | "error";
	icon?: ReactNode;
	withoutBackBtn?: boolean;
	midPress?: () => void;
}

export const PageHeaderUi = observer(({
	text = "PageHeaderUi",
	style = {},
	withoutBackBtn = false,
	cancelText = null,
	Component = View,
	rightTop = 0,
	leftTop = 0,
	leftJsx = null,
	midPress,
	intensity = 30,
	loading,
	midJsx = null,
	icon,
	isBlurView = false,
	wrapperJustifyContent = "flex-start",
	height = 30,
	rightJsx = null
}: PageHeaderUiProps) => {
	const { currentTheme } = themeStore;

	const [headerHeight, setHeaderHeight] = useState(0);

	const { t } = useTranslation();
	const navigation = useNavigation();
	const insets = useSafeAreaInsets();
	const { width } = useWindowDimensions();

	const onBackPress = (event: GestureResponderEvent) => {
		event.preventDefault();
		event.stopPropagation();
		navigation.goBack();
	};
	const onHeaderLayout = (event: LayoutChangeEvent) => {
		const { height } = event.nativeEvent.layout;
		setHeaderHeight(height);
	};

	return (
		<Component
			style={[
				s.header,
				{
					position: 'absolute',
					left: 0,
					right: 0,
					height: insets.top * 1.65,
					zIndex: 100,
					alignItems: "flex-end",
					backgroundColor: isBlurView ? changeRgbA(darkenRGBA(themeStore.currentTheme.bgTheme.background as string, 0.8), '0.88') : undefined,
				},
				style,
			]}
			onLayout={onHeaderLayout}
			intensity={intensity}
		>
			<View
				style={[
					s.wrapper,
					{
						minWidth: width,
						justifyContent: wrapperJustifyContent as any,
						height,
					}
				]}
			>
				{!withoutBackBtn && (
					<SimpleButtonUi
						onPress={onBackPress}
						style={[
							s.backButton,
							{ top: leftTop, zIndex: 10 },
						]}
					>
						<BackArrowLeftIcon
							height={20}
							width={12.5}
							color={currentTheme.originalMainGradientColor.color as string}
						/>
						{leftJsx && leftJsx}
					</SimpleButtonUi>
				)}

				{midJsx ? (
					<>
						{midJsx}
					</>
				) : (
					<Box
						width={"100%"}
						fD='row'
						gap={5}
						align='center'
						justify='center'
					>
						{(loading == 'pending' || loading == 'nointernet' || loading == "error") ? (
							<>
								<LoaderUi
									color={currentTheme.textColor.color}
									size={"small"}
								/>
								<MainText
									tac='center'
									numberOfLines={1}
									ellipsizeMode="tail"
									fontWeight='bold'
									px={15}
								>
									{loading == "error" ? t("chats_error") : loading == "nointernet" ? t("chats_nointernet") : t("chats_pending")}
								</MainText>
							</>
						) : (
							<>
								<MainText
									tac='center'
									fontWeight='bold'
									numberOfLines={1}
									ellipsizeMode="tail"
									px={15}
									style={{ maxWidth: "75%" }}
								>
									{text}
								</MainText>
								{icon && icon}
							</>
						)}
					</Box>
				)}

				{rightJsx && (
					<View
						style={[
							s.right,
							{ top: rightTop }
						]}
					>
						{rightJsx}
					</View>
				)}
			</View>
		</Component>
	);
});

const s = StyleSheet.create({
	wrapper: {
		justifyContent: "flex-start",
		flex: 1,
	},
	header: {
		flexDirection: 'row',
		backgroundColor: themeStore.currentTheme.bgTheme.background as string,
		alignItems: 'flex-start',
		paddingHorizontal: 15,
		borderBottomWidth: 0.1,
		borderBottomColor: themeStore.currentTheme.bgTheme.border as string,
		display: 'flex',
		justifyContent: 'center',
		height: 32,
		position: 'relative',
	},
	headerRight: {
		width: 20,
	},
	backButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 15,
		marginRight: 16,
		position: 'absolute',
		left: 15,
	},
	right: {
		position: 'absolute',
		right: 15,
		alignItems: 'center',
		justifyContent: 'center',
	}
});