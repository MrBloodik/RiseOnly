import { changeRgbA, darkenRGBA } from '@shared/lib/theme';
import { BgWrapperUi, MainText, PageHeaderUi, SimpleButtonUi } from '@shared/ui';
import { themeStore } from '@stores/theme';
import { BlurView } from 'expo-blur';
import { observer } from 'mobx-react-lite';
import { Dispatch, JSX, ReactNode, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { FlexAlignType, ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ChatsWrapperProps {
	tKey?: string;
	children?: JSX.Element;
	PageHeaderUiStyle?: StyleProp<ViewStyle>;
	wrapperStyle?: StyleProp<ViewStyle>;
	bgWrapperStyle?: StyleProp<ViewStyle>;
	cancelText?: boolean;
	readyText?: boolean;
	midJsx?: ReactNode | null;
	bottomJsx?: ReactNode | null;
	rightJsx?: ReactNode | null;
	transparentSafeArea?: boolean;
	headerHeight?: number;
	rightTop?: number;
	leftTop?: number;
	scrollEnabled?: boolean;
	wrapperJustifyContent?: FlexAlignType;
	icon?: ReactNode;
	Component?: any;
	loading?: "nointernet" | "pending" | "fulfilled" | "error";
	isBlurView?: boolean;
	bottomStyle?: StyleProp<ViewStyle>;
	bottomInsenity?: number;
	topIntensity?: number;
	topBottomBgColor?: string;
	requiredBg?: boolean;
	onBackPress?: () => void;
	onSuccessPress?: () => void;
	midPress?: () => void;
	bottomHeight?: number;
	setBottomHeight?: Dispatch<SetStateAction<number>>;
}

export const ChatsWrapper = observer(({
	tKey,
	children,
	PageHeaderUiStyle = {},
	wrapperStyle = {},
	bgWrapperStyle = {},
	headerHeight = 30,
	midPress,
	cancelText = false,
	rightTop = 0,
	isBlurView = true,
	Component = BlurView,
	leftTop = 0,
	readyText = false,
	bottomHeight = 0,
	setBottomHeight,
	topBottomBgColor = changeRgbA(darkenRGBA(themeStore.currentTheme.bgTheme.background as string, 0.8), '0.88'),
	transparentSafeArea = false,
	wrapperJustifyContent = "flex-start",
	midJsx = null,
	rightJsx = null,
	scrollEnabled = true,
	bottomJsx = null,
	loading = "pending",
	bottomStyle = {},
	bottomInsenity = 30,
	topIntensity = 30,
	requiredBg = true,
	icon,
	onBackPress,
	onSuccessPress
}: ChatsWrapperProps) => {
	const {
		currentTheme
	} = themeStore;

	const { t } = useTranslation();
	const insets = useSafeAreaInsets();

	const s = StyleSheet.create({
		safeArea: {
			flex: 1,
			backgroundColor: transparentSafeArea ? "transparent" : themeStore.currentTheme.bgTheme.background as string,
		},
		container: {
			flex: 1,
		},
		wrapper: {
			flex: 1,
			paddingVertical: 10,
			paddingHorizontal: 10,
			flexDirection: 'column',
			gap: 15,
		},
	});

	if (transparentSafeArea) return (
		<BgWrapperUi
			style={bgWrapperStyle}
			requiredBg={requiredBg}
		>
			<PageHeaderUi
				text={t(tKey || "")}
				Component={BlurView}
				loading={loading}
				isBlurView={isBlurView}
				height={headerHeight}
				leftTop={leftTop}
				rightTop={rightTop}
				midPress={midPress}
				icon={icon}
				intensity={topIntensity}
				wrapperJustifyContent={wrapperJustifyContent}
				style={[
					{ backgroundColor: topBottomBgColor },
					PageHeaderUiStyle,
				]}
				midJsx={midJsx}
				cancelText={cancelText ? t('cancel') : ""}
				leftJsx={cancelText && (
					<SimpleButtonUi onPress={onBackPress}>
						<MainText
							fontWeight='bold'
							color={currentTheme.originalMainGradientColor.color as string}
						>
							{t('cancel')}
						</MainText>
					</SimpleButtonUi>
				)}
				rightJsx={readyText && (
					<SimpleButtonUi onPress={onSuccessPress}>
						<MainText
							fontWeight='bold'
							color={currentTheme.originalMainGradientColor.color as string}
						>
							{t('ready')}
						</MainText>
					</SimpleButtonUi>
				)}
			/>

			{scrollEnabled ? (
				<ScrollView
					style={[
						s.wrapper,
						wrapperStyle
					]}
					scrollEnabled={false}
				>
					<View style={{ paddingBottom: bottomHeight + 5 }}>
						{children ? children : (
							<MainText primary px={30}>
								Empty Children
							</MainText>
						)}
					</View>
				</ScrollView>
			) : (
				<>
					{children ? children : (
						<MainText primary px={30}>
							Empty Children
						</MainText>
					)}
				</>
			)}

			{bottomJsx && (
				<BlurView
					intensity={bottomInsenity}
					onLayout={(e) => {
						if (!setBottomHeight) return;
						setBottomHeight(e.nativeEvent.layout.height);
					}}
					style={[
						{
							backgroundColor: topBottomBgColor,
							paddingBottom: insets.bottom,
							position: "absolute",
							bottom: 0,
							left: 0,
							right: 0,
						},
						bottomStyle
					]}
				>
					{bottomJsx}
				</BlurView>
			)}
		</BgWrapperUi>
	);

	return (
		<BgWrapperUi style={bgWrapperStyle}>
			<PageHeaderUi
				isBlurView={isBlurView}
				loading={loading}
				height={headerHeight}
				leftTop={leftTop}
				rightTop={rightTop}
				icon={icon}
				Component={Component}
				intensity={topIntensity}
				wrapperJustifyContent={wrapperJustifyContent}
				text={t(tKey || "")}
				style={[
					PageHeaderUiStyle
				]}
				cancelText={cancelText ? t('cancel') : ""}
				leftJsx={cancelText && (
					<SimpleButtonUi onPress={onBackPress}>
						<MainText
							fontWeight='bold'
							color={currentTheme.originalMainGradientColor.color as string}
						>
							{t('cancel')}
						</MainText>
					</SimpleButtonUi>
				)}
				midJsx={midJsx}
				rightJsx={rightJsx ? (<>{rightJsx}</>) : readyText ? (
					<SimpleButtonUi onPress={onSuccessPress}>
						<MainText
							fontWeight='bold'
							color={currentTheme.originalMainGradientColor.color as string}
						>
							{t('ready')}
						</MainText>
					</SimpleButtonUi>
				) : <></>}
			/>

			<View
				style={[
					s.wrapper,
					wrapperStyle,
					{ paddingBottom: bottomHeight + 5 }
				]}
			>
				{children ? children : (
					<MainText primary px={30}>
						Empty Children
					</MainText>
				)}
			</View>

			{bottomJsx && (
				<BlurView
					intensity={bottomInsenity}
					onLayout={(e) => {
						if (!setBottomHeight) return;
						setBottomHeight(e.nativeEvent.layout.height);
					}}
					style={[
						{
							backgroundColor: changeRgbA(darkenRGBA(themeStore.currentTheme.bgTheme.background as string, 0.8), '0.88'),
							paddingBottom: insets.bottom,
							position: "absolute",
							bottom: 0,
							left: 0,
							right: 0,
						},
						bottomStyle
					]}
				>
					{bottomJsx}
				</BlurView>
			)}
		</BgWrapperUi>
	);
});