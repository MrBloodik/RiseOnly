import { RedfireAnimation } from '@animations/components/RedfireAnimation';
import { BackArrowLeftIcon } from '@icons/Ui/BackArrowLeftIcon';
import { CrownIcon } from '@icons/Ui/CrownIcon';
import { useNavigation } from '@react-navigation/native';
import { defaultBanner, defaultLogo } from '@shared/config/const';
import { useParticipantText } from '@shared/lib/date';
import { formatNumber } from '@shared/lib/numbers';
import { Box, CleverImage, MainText, SecondaryText, SimpleButtonUi } from '@shared/ui';
import { Blur, Canvas, Circle, ColorMatrix, Group, Image, Paint, RoundedRect, rect, rrect, useClock, useImage } from "@shopify/react-native-skia";
import { profileStore } from '@stores/profile';
import { profileActionsStore } from '@stores/profile/profile-actions/profile-actions';
import { themeStore } from '@stores/theme';
import { chatsInteractionsStore } from '@stores/ws/chats';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import { StyleProp, StyleSheet, View, ViewStyle, useWindowDimensions } from 'react-native';
import Animated, { Extrapolate, SharedValue, interpolate, interpolateColor, useAnimatedStyle, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { LoaderUi } from '../LoaderUi/LoaderUi';
import { UserNameAndBadgeUi } from '../UserNameAndBadgeUi/UserNameAndBadgeUi';

interface UserLogoProps {
	source?: string | Array<string | null>;
	style?: StyleProp<ViewStyle>;
	size?: number;
	bordered?: boolean;
	borderColor?: string;
	borderWidth?: number;
	loading?: boolean;
	authorIcon?: boolean;
	isMe?: boolean;
	canvas?: boolean;
	bgColor?: string;
	scrollY?: SharedValue<number>;
	bgImage?: string;
	debugDownload?: boolean;
	isButton?: boolean;
	streakCount?: number;
	onPress?: () => void;
}

export const UserLogo = observer(({
	source,
	style,
	authorIcon = false,
	bordered = false,
	borderColor = undefined,
	borderWidth = 0.5,
	bgImage,
	bgColor,
	loading = false,
	scrollY,
	debugDownload = false,
	isMe = false,
	streakCount,
	canvas = false,
	isButton = false,
	onPress,
	size = 50,
}: UserLogoProps) => {
	const { currentTheme, safeAreaWithContentHeight: { safeAreaWithContentHeight } } = themeStore;
	const {
		editProfileLogoLoading: { editProfileLogoLoading }
	} = profileActionsStore;
	const { profile } = profileStore;
	const { selectedChat } = chatsInteractionsStore;

	const { t, i18n } = useTranslation();
	const { width } = useWindowDimensions();
	const participantsText = useParticipantText(selectedChat?.member_count || 1, i18n);

	const DYNAMIC_ISLAND_WIDTH = width / 3.4;
	const DYNAMIC_ISLAND_HEIGHT = 20;

	const imgForUseImage = typeof source === "string" ? (source || defaultLogo) : defaultLogo;

	const bannerImage = useImage(bgImage || defaultBanner);
	const image = useImage(imgForUseImage);
	const maxY = safeAreaWithContentHeight + 10;
	const x = useSharedValue((width - size) / 2);
	const d = useSharedValue(size);
	const y = useSharedValue(maxY);
	const blur = useSharedValue(0);
	const xDynamicIsland = useSharedValue((width - DYNAMIC_ISLAND_WIDTH) / 2);
	const yDynamicIsland = safeAreaWithContentHeight - (safeAreaWithContentHeight / 2) - 2;
	const color = useSharedValue("transparent");
	const backgroundOpacity = useSharedValue(1);
	const backgroundColorOpacity = useSharedValue(0);
	const navigation = useNavigation();

	const onBackPress = () => navigation.goBack();

	const styles = StyleSheet.create({
		loading: {
			position: 'absolute',
		},
		profileLogoContainer: {
			borderRadius: 50,
			overflow: 'hidden',
		},
		profileLogo: {
			width: '100%',
			height: '100%',
			resizeMode: 'cover',
			zIndex: 1000
		},
		overlay: {
			zIndex: 1001,
			width: size,
			height: size,
			backgroundColor: "rgba(0, 0, 0, 0.7)",
			position: 'absolute'
		},
		multipleLogos: {
			position: 'relative',
		},
		authorIcon: {
			position: "absolute",
			backgroundColor: currentTheme.bgTheme.background as string,
			borderRadius: 10000,
			top: -5,
			right: -5,
			zIndex: 1000,
			width: 17,
			height: 17
		},
		box: {
			position: 'relative',
			alignItems: "center",
			justifyContent: "center"
		}
	});

	const clock = useClock();

	const roundedRect = useDerivedValue(() => {
		return rrect(
			rect(x.value, y.value, d.value, d.value),
			size / 2,
			size / 2
		);
	}, [clock]);

	useDerivedValue(() => {
		if (!scrollY) return;
		d.value = interpolate(scrollY?.value, [0, maxY / 2], [size, 0]);
		x.value = (width - d.value) / 2;
		y.value = interpolate(scrollY?.value, [0, maxY], [maxY, 0]);
		blur.value = interpolate(scrollY.value, [0, 30, 35], [0, 12, 0]);
		color.value = interpolateColor(
			scrollY.value,
			[0, 20],
			["transparent", "black"]
		);
		backgroundOpacity.value = interpolate(scrollY.value, [0, maxY / 1.5], [1, 0], Extrapolate.CLAMP);
		backgroundColorOpacity.value = interpolate(scrollY.value, [0, maxY / 1.5], [0, 1], Extrapolate.CLAMP);
	});

	const animatedStyle = useAnimatedStyle(() => {
		if (!scrollY) return {};
		return {
			width: "100%",
			height: interpolate(scrollY.value, [0, 100], [safeAreaWithContentHeight + 160, 100], Extrapolate.CLAMP),
			transform: [
				{ translateY: interpolate(scrollY.value, [0, 60], [0, 60]) },
			],
			zIndex: 100
		};
	});

	if (canvas) {
		return (
			<Animated.View
				style={animatedStyle}
			>
				<SimpleButtonUi
					onPress={onBackPress}
					style={[
						s.backButton,
						{ top: safeAreaWithContentHeight + 10, zIndex: 10 },
					]}
				>
					<BackArrowLeftIcon
						height={20}
						width={12.5}
						color={currentTheme.originalMainGradientColor.color as string}
					/>
				</SimpleButtonUi>

				<Canvas style={{ ...StyleSheet.absoluteFillObject, zIndex: -2 }}>
					<Group
						layer={
							<Paint>
								<Blur blur={2} />
							</Paint>
						}
					>
						<Image
							image={bannerImage}
							width={width}
							height={220}
							x={0}
							y={0}
							opacity={backgroundOpacity}
						/>
						<RoundedRect
							r={0}
							x={0}
							y={0}
							width={width}
							height={220}
							color={currentTheme.bgTheme.background as string}
							opacity={backgroundColorOpacity}
						/>
					</Group>
				</Canvas>

				<Canvas
					style={{ flex: 1, zIndex: -1 }}
				>
					<Group
						layer={
							<Paint>
								<Blur blur={blur} />
								<ColorMatrix
									matrix={[
										1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 20, -7
									]}
								/>
							</Paint>
						}
					>
						<Group
							clip={roundedRect}
						>
							<Image
								image={image}
								width={size}
								height={size}
								x={x}
								y={y}
								fit="cover"
							/>
							<Circle
								r={d}
								cx={x.value + 50}
								cy={y}
								color={color}
							/>
						</Group>
						<RoundedRect
							r={30}
							width={DYNAMIC_ISLAND_WIDTH}
							height={DYNAMIC_ISLAND_HEIGHT}
							x={xDynamicIsland}
							y={yDynamicIsland}
						/>
					</Group>
				</Canvas>

				<View
					style={s.namesSticky}
				>
					<Box style={s.namesTop}>
						{selectedChat?.type_ == "PRIVATE" ? (
							<UserNameAndBadgeUi
								user={selectedChat.participant}
								px={22}
							/>
						) : (
							<MainText
								px={18}
								tac='center'
							>
								{selectedChat?.title}
							</MainText>
						)}
					</Box>

					<Box style={s.namesBot}>
						{selectedChat?.type_ == "PRIVATE" ? (
							<>
								{selectedChat?.joined_at ? (
									<SecondaryText
										px={12}
										tac='center'
									>
										{t("last_seen_recently")}
									</SecondaryText>
								) : (
									<MainText
										primary
										px={12}
										tac='center'
									>
										{t("online_status")}
									</MainText>
								)}
							</>
						) : (
							<SecondaryText>
								{formatNumber(selectedChat!.member_count)} {participantsText}
							</SecondaryText>
						)}
					</Box>
				</View>
			</Animated.View>
		);
	}

	const Component = isButton ? SimpleButtonUi : View;

	return (
		<Component
			style={styles.box}
			onPress={(event) => {
				if (!event) return;
				event.preventDefault();
				event.stopPropagation();
				if (onPress) onPress();
			}}
		>
			{authorIcon && (
				<Box
					style={styles.authorIcon}
					centered
				>
					<CrownIcon
						color={"#e3d700"}
						width={11}
						height={11}
					/>
				</Box>
			)}

			<View
				style={[
					styles.profileLogoContainer,
					{
						width: size,
						height: size,
						borderColor: bordered ? (borderColor ? borderColor : currentTheme.bgTheme.borderColor) : undefined,
						borderWidth: bordered ? borderWidth : 0,
						position: 'relative',
					},
					style
				]}
			>
				{(editProfileLogoLoading && (source == profile?.more.logo || !source)) && (
					<View
						style={styles.overlay}
					/>
				)}
				{Array.isArray(source) ? (
					<View
						style={[
							styles.multipleLogos,
							{ width: size, height: size }
						]}
					>
						{source?.length > 0 && source.map((url, i) => (
							<CleverImage
								key={url}
								source={url || defaultLogo}
								type="user"
								withoutWrapper
								debugDownload={debugDownload}
								imageStyles={{
									...styles.profileLogo,
									zIndex: source.length - i,
									position: 'absolute',
									top: 0,
									left: 0,
									width: size,
									height: size,
									transform: [{ translateX: i * 10 }, { translateY: i * 10 }]
								}}
							/>
						))}
					</View>
				) : (
					<CleverImage
						source={isMe ? profile?.more?.logo : (source ? (source == profile?.more?.logo ? profile?.more?.logo : source) : defaultLogo)}
						imageStyles={styles.profileLogo}
						type="user"
						debugDownload={debugDownload}
						withoutWrapper
					/>
				)}
			</View>

			{streakCount && (
				<RedfireAnimation
					viewStyle={{ zIndex: 1000, position: "absolute", right: 0, bottom: 0 }}
					size={45}
					count={streakCount}
				/>
			)}
			{(editProfileLogoLoading && (source == profile?.more.logo || !source)) && (
				<LoaderUi
					style={styles.loading}
					color='white'
					size={"small"}
				/>
			)}
		</Component>
	);
});

const s = StyleSheet.create({
	mid: { flex: 1 },
	backButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 15,
		marginRight: 16,
		position: 'absolute',
		left: 15,
	},
	namesBot: {},
	namesTop: {},
	namesSticky: { width: "100%", alignItems: "center", justifyContent: "center", paddingBottom: 5 },
	top: { width: "100%", backgroundColor: themeStore.currentTheme.bgTheme.background as string, paddingBottom: 20 },
	scrollView: { width: "100%", backgroundColor: themeStore.currentTheme.bgTheme.background as string },
	main: { flex: 1 }
});
