import { BgWrapperUi, MainText, PageHeaderUi, SimpleButtonUi } from '@shared/ui';
import { themeStore } from '@stores/theme';
import { observer } from 'mobx-react-lite';
import { Fragment, JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

interface ProfileSettingsWrapperProps {
	tKey?: string;
	children?: JSX.Element;
	PageHeaderUiStyle?: StyleProp<ViewStyle>;
	wrapperStyle?: StyleProp<ViewStyle>;
	cancelText?: boolean;
	readyText?: boolean;
	requiredBg?: boolean;
	transparentSafeArea?: boolean;
	needScrollView?: boolean;
	needHeader?: boolean;
	withoutBackBtn?: boolean;
	wrapperNoPadding?: boolean;
	title?: string;
	bgColor?: string | number;
	height?: number;
	bgWrapperStyle?: StyleProp<ViewStyle>;
	onBackPress?: () => void;
	onSuccessPress?: () => void;
}

export const ProfileSettingsWrapper = observer(({
	tKey = "use_tkey_prop",
	children,
	PageHeaderUiStyle = {},
	wrapperStyle = {},
	cancelText = false,
	wrapperNoPadding = false,
	title,
	readyText = false,
	withoutBackBtn = false,
	transparentSafeArea = false,
	needScrollView = true,
	needHeader = true,
	height = 0,
	onBackPress,
	requiredBg = true,
	bgColor,
	bgWrapperStyle,
	onSuccessPress
}: ProfileSettingsWrapperProps) => {
	const {
		safeAreaWithContentHeight: { safeAreaWithContentHeight },
		currentTheme
	} = themeStore;
	const { t } = useTranslation();

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
			paddingVertical: wrapperNoPadding ? 0 : 10,
			paddingHorizontal: wrapperNoPadding ? 0 : 10,
			flexDirection: 'column',
			gap: 15,
			height: "100%"
		},
	});

	const ScrollOrEmpty = needScrollView ? ScrollView : Fragment;

	if (transparentSafeArea) return (
		<BgWrapperUi requiredBg={requiredBg} bgColor={bgColor}>
			{needHeader && (
				<PageHeaderUi
					text={title || t(tKey)}
					style={[
						{
							backgroundColor: transparentSafeArea ? "transparent" : currentTheme.bgTheme.background as string,
						},
						PageHeaderUiStyle
					]}
					cancelText={cancelText ? t('cancel') : ""}
					withoutBackBtn={withoutBackBtn}
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
			)}

			<ScrollOrEmpty>
				<View
					style={[
						s.wrapper,
						{ marginTop: needHeader ? (safeAreaWithContentHeight + height) : 0 },
						wrapperStyle
					]}
				>
					{children ? children : (
						<MainText primary px={30}>
							Empty Children
						</MainText>
					)}
				</View>
			</ScrollOrEmpty>
		</BgWrapperUi>
	);

	return (
		<BgWrapperUi
			requiredBg={requiredBg}
			bgColor={bgColor}
			style={bgWrapperStyle}
		>
			{needHeader && (
				<PageHeaderUi
					text={title || t(tKey)}
					withoutBackBtn={withoutBackBtn}
					style={[
						{
							backgroundColor: transparentSafeArea ? "transparent" : currentTheme.bgTheme.background as string
						},
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
			)}

			<ScrollOrEmpty>
				<View
					style={[
						s.wrapper,
						{ marginTop: needHeader ? (safeAreaWithContentHeight + height) : 0 },
						wrapperStyle
					]}
				>
					{children ? children : (
						<MainText primary px={30}>
							Empty Children
						</MainText>
					)}
				</View>
			</ScrollOrEmpty>
		</BgWrapperUi>
	);
});