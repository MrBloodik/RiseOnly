import { MaterialIcons } from '@expo/vector-icons';
import { defaultContextMenuActions } from '@shared/config/ts';
import { logger } from '@shared/lib/helpers';
import { Box, MainText } from '@shared/ui';
import { BlurUi } from '@shared/ui/BlurUi/BlurUi';
import { profileStore } from '@stores/profile';
import { themeStore } from '@stores/theme';
import { BlurView } from 'expo-blur';
import { toJS } from 'mobx';
import { observer } from 'mobx-react-lite';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
	Dimensions,
	GestureResponderEvent,
	StyleSheet,
	View,
	ViewStyle
} from 'react-native';
import { Portal } from 'react-native-paper';
import Animated, {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withSpring,
	withTiming
} from 'react-native-reanimated';

export interface HoldContextMenuAction {
	icon: string;
	title: string;
	onPress: () => void;
}

interface HoldContextMenuUiProps {
	itemCordinates: { x: number, y: number; };
	renderJsx: React.ReactNode;
	open?: boolean;
	debug?: boolean;
	onClose?: () => void;
	selectedItem?: any;
	setSelectedItem?: (item: any) => void;
	actions?: HoldContextMenuAction[];
	side?: "right" | "left";
	mainStyle?: ViewStyle;
	menuStyle?: ViewStyle;
	menuContainerStyle?: ViewStyle;
	containerStyle?: ViewStyle;
	isBlurMenu?: boolean;
	menuBlurIntensity?: number;
}

const AnimatedBlur = Animated.createAnimatedComponent(BlurView);

export const HoldContextMenuUi = observer(({
	itemCordinates,
	renderJsx,
	open,
	onClose,
	selectedItem,
	debug = false,
	side = "right",
	mainStyle = {},
	menuStyle = {},
	menuContainerStyle = {},
	setSelectedItem,
	actions = defaultContextMenuActions,
	containerStyle = {},
	isBlurMenu = false,
	menuBlurIntensity = 30
}: HoldContextMenuUiProps) => {
	const { profile } = profileStore;

	const translateY = useSharedValue(0);
	const scale = useSharedValue(0);
	const [blurIntensity, setBlurIntensity] = useState(0);
	const animationFrameRef = useRef<number | null>(null);
	const intensityRef = useRef<number>(0);
	const screenHeight = Dimensions.get('window').height;
	const contextMenuOpacity = useSharedValue(0);
	const contextMenuTranslateY = useSharedValue(0);
	const contextMenuScaleX = useSharedValue(0.5);
	const contextMenuScaleY = useSharedValue(0.5);
	const messageTranslateY = useSharedValue(0);

	const MENU_ITEM_HEIGHT = 40;
	const MENU_PADDING = 6;
	const MENU_MARGIN = 7.5;
	const SAFE_BOTTOM_MARGIN = 40;

	const menuHeight = actions.length * MENU_ITEM_HEIGHT + MENU_PADDING;

	const [highlightedItemIndex, setHighlightedItemIndex] = useState<number | null>(null);
	const itemPositionsRef = useRef<Array<{ top: number, bottom: number; }>>([]);
	const menuRef = useRef<View>(null);
	const menuPositionRef = useRef<{ pageX: number, pageY: number; }>({ pageX: 0, pageY: 0 });
	const longPressOriginRef = useRef<{ pageX: number, pageY: number; } | null>(null);
	const menuMeasured = useRef(false);
	const isClosingRef = useRef(false);

	const calculateShiftDistance = useCallback(() => {
		const bottomPosition = itemCordinates.y + menuHeight + MENU_MARGIN + 15;
		const overflow = bottomPosition - (screenHeight - SAFE_BOTTOM_MARGIN);
		return overflow > 0 ? overflow : 0;
	}, [itemCordinates.y, screenHeight, menuHeight]);

	const animatedStyle = useAnimatedStyle(() => {
		return {
			transform: [
				{ translateY: -translateY.value },
				{ translateY: messageTranslateY.value }
			],
		};
	});

	const contextMenuStyle = useAnimatedStyle(() => {
		return {
			opacity: contextMenuOpacity.value,
			transform: [
				{ translateY: contextMenuTranslateY.value },
				{ scaleX: contextMenuScaleX.value },
				{ scaleY: contextMenuScaleY.value }
			],
			transformOrigin: 'center top'
		};
	});

	const animateBlur = (increment: boolean) => {
		if (increment) {
			if (intensityRef.current < 40) {
				intensityRef.current += 5;
				setBlurIntensity(intensityRef.current);
				animationFrameRef.current = requestAnimationFrame(() => animateBlur(true));
			}
		} else {
			if (intensityRef.current > 0) {
				intensityRef.current -= 5;
				setBlurIntensity(intensityRef.current);
				animationFrameRef.current = requestAnimationFrame(() => animateBlur(false));
			} else if ((!selectedItem || !open) && !isClosingRef.current) {
				if (debug) {
					logger.ui("HoldContextMenuUi", "canceled animation");
				}
				if (animationFrameRef.current) {
					cancelAnimationFrame(animationFrameRef.current);
					animationFrameRef.current = null;
				}
			}
		}
	};

	const findMenuItemAtPosition = (pageY: number) => {
		const { pageY: menuY } = menuPositionRef.current;

		for (let i = 0; i < itemPositionsRef.current.length; i++) {
			const item = itemPositionsRef.current[i];
			if (item && pageY >= menuY + item.top && pageY <= menuY + item.bottom) {
				return i;
			}
		}
		return null;
	};

	const measureMenu = () => {
		if (!menuRef.current || !menuRef.current.measure) return;

		menuRef.current.measure((x, y, width, height, pageX, pageY) => {
			menuPositionRef.current = { pageX, pageY };
			menuMeasured.current = true;
		});
	};

	const handleResponderGrant = (event: GestureResponderEvent) => {
		longPressOriginRef.current = {
			pageX: event.nativeEvent.pageX,
			pageY: event.nativeEvent.pageY
		};

		const itemIndex = findMenuItemAtPosition(event.nativeEvent.pageY);
		if (itemIndex !== null) {
			setHighlightedItemIndex(itemIndex);
		}
	};

	const handleResponderMove = (event: GestureResponderEvent) => {
		const itemIndex = findMenuItemAtPosition(event.nativeEvent.pageY);
		if (itemIndex !== null) {
			setHighlightedItemIndex(itemIndex);
		} else {
			setHighlightedItemIndex(null);
		}
	};

	const handleResponderRelease = (event: GestureResponderEvent) => {
		const itemIndex = highlightedItemIndex;

		if (itemIndex !== null) {
			const action = actions[itemIndex];
			if (action && action.onPress) {
				action.onPress();
			}
		}

		longPressOriginRef.current = null;
		closeWithAnimation();
	};

	const closeWithAnimation = () => {
		if (isClosingRef.current) return;
		isClosingRef.current = true;

		contextMenuOpacity.value = withTiming(0, { duration: 200 });
		contextMenuScaleX.value = withTiming(0.5, { duration: 250, easing: Easing.bezier(0.25, 1, 0.5, 1) });
		contextMenuScaleY.value = withTiming(0.5, { duration: 250, easing: Easing.bezier(0.25, 1, 0.5, 1) });
		messageTranslateY.value = withTiming(0, { duration: 200 });

		scale.value = withTiming(0, {
			duration: 300,
			easing: Easing.bezier(0.25, 0.1, 0.25, 1)
		});

		translateY.value = withTiming(0, { duration: 300 });

		if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
		animationFrameRef.current = requestAnimationFrame(() => animateBlur(false));

		setTimeout(() => {
			if (onClose) onClose();
			if (setSelectedItem) setSelectedItem(null);
			isClosingRef.current = false;
		}, 150);
	};

	const handleBackgroundPress = (event: GestureResponderEvent) => {
		event.stopPropagation();
		event.preventDefault();

		const itemIndex = findMenuItemAtPosition(event.nativeEvent.pageY);
		if (itemIndex === null) closeWithAnimation();
	};

	const updateItemPosition = (index: number, y: number, height: number) => {
		itemPositionsRef.current[index] = {
			top: y,
			bottom: y + height
		};
	};

	useEffect(() => {
		if (!selectedItem && !open) {
			if (!isClosingRef.current) {
				scale.value = 0;
				intensityRef.current = 0;
				setBlurIntensity(0);
				setHighlightedItemIndex(null);
				longPressOriginRef.current = null;
				menuMeasured.current = false;

				contextMenuOpacity.value = 0;
				contextMenuScaleX.value = 0.5;
				contextMenuScaleY.value = 0.5;
				messageTranslateY.value = 0;
				translateY.value = 0;

				if (animationFrameRef.current) {
					cancelAnimationFrame(animationFrameRef.current);
					animationFrameRef.current = null;
				}
			}
			return;
		}

		isClosingRef.current = false;

		if (debug) {
			logger.ui("HoldContextMenuUi", "isClosingRef set to false");
		}

		const shiftDistance = calculateShiftDistance();

		translateY.value = 0;
		translateY.value = withTiming(15, { duration: 300 });

		if (shiftDistance > 0) {
			messageTranslateY.value = withTiming(-shiftDistance, {
				duration: 300,
				easing: Easing.bezier(0.25, 0.1, 0.25, 1)
			});
		} else {
			messageTranslateY.value = 0;
		}

		scale.value = withSpring(1);
		intensityRef.current = 0;

		if (animationFrameRef.current) {
			cancelAnimationFrame(animationFrameRef.current);
		}
		animationFrameRef.current = requestAnimationFrame(() => animateBlur(true));

		contextMenuOpacity.value = withDelay(100, withTiming(1, { duration: 200 }));
		contextMenuScaleX.value = withDelay(100, withTiming(1, {
			duration: 400,
			easing: Easing.bezier(0.34, 1.56, 0.64, 1)
		}));
		contextMenuScaleY.value = withDelay(100, withTiming(1, {
			duration: 400,
			easing: Easing.bezier(0.34, 1.56, 0.64, 1)
		}));

		setTimeout(() => {
			measureMenu();
		}, 150);

		return () => {
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
				animationFrameRef.current = null;
			}
		};
	}, [selectedItem, open, calculateShiftDistance]);

	useEffect(() => {
		if ((selectedItem || open) && menuRef.current) {
			measureMenu();
		}
	});

	if (!selectedItem && !open && !isClosingRef.current) {
		if (debug) {
			logger.ui("HoldContextMenuUi", `open: ${open}`);
			logger.ui("HoldContextMenuUi", `selectedItem: ${selectedItem}`);
			logger.ui("HoldContextMenuUi", `returned null`);
			logger.ui("HoldContextMenuUi", `isClosingRef: ${isClosingRef.current}`);
		}
		return null;
	}

	const AnimatedComponent = isBlurMenu ? AnimatedBlur : Animated.View;

	const MenuItem = memo(({
		item,
		index,
		isLast,
		isHighlighted,
		onLayout
	}: {
		item: typeof actions[0],
		index: number,
		isLast: boolean,
		isHighlighted: boolean,
		onLayout: (index: number, y: number, height: number) => void;
	}) => {
		const handleLayout = useCallback((e: { nativeEvent: { layout: { y: number, height: number; }; }; }) => {
			const { y, height } = e.nativeEvent.layout;
			onLayout(index, y, height);
		}, [index, onLayout]);

		return (
			<View
				key={index}
				onLayout={handleLayout}
				style={[
					styles.menuItem,
					{
						borderBottomWidth: isLast ? 0 : 0.5,
						borderBottomColor: themeStore.currentTheme.bgTheme.borderColor as string,
						backgroundColor: isHighlighted
							? 'rgba(100, 100, 100, 0.15)'
							: 'transparent'
					}
				]}
			>
				<MainText
					color={item.icon == "delete" ? "red" : themeStore.currentTheme.textColor.color as string}
				>
					{item.title}
				</MainText>
				<MaterialIcons
					name={item.icon as any}
					size={20}
					color={item.icon == "delete" ? "red" : themeStore.currentTheme.textColor.color as string}
				/>
			</View>
		);
	});

	return (
		<Portal>
			<BlurUi
				intensity={blurIntensity}
				style={{
					flex: 1, width: "100%", height: "100%",
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
				}}
			/>
			<Box
				style={{
					...styles.container,
					...mainStyle
				}}
				onStartShouldSetResponder={() => true}
				onMoveShouldSetResponder={() => true}
				onResponderGrant={handleResponderGrant}
				onResponderMove={handleResponderMove}
				onResponderRelease={handleResponderRelease}
				onResponderTerminate={() => closeWithAnimation()}
				onTouchEnd={handleBackgroundPress}
			>
				<Animated.View
					style={[
						{
							position: "absolute",
							top: itemCordinates.y - 5,
							zIndex: 9999,
							width: "100%",
							paddingHorizontal: 5,
						},
						animatedStyle,
						containerStyle
					]}
				>
					{renderJsx}

					{isBlurMenu ? (
						<AnimatedBlur
							intensity={menuBlurIntensity}
							ref={menuRef}
							onLayout={measureMenu}
							style={[
								styles.contextMenu,
								selectedItem && toJS(selectedItem)?.sender?.id == toJS(profile)?.id ? styles.rightContextMenu : styles.leftContextMenu,
								side === "right" ? styles.rightContextMenu : styles.leftContextMenu,
								contextMenuStyle,
								menuStyle
							]}
						>
							{actions.map((item, index) => (
								<MenuItem
									key={index}
									item={item}
									index={index}
									isLast={index === actions.length - 1}
									isHighlighted={highlightedItemIndex === index}
									onLayout={updateItemPosition}
								/>
							))}
						</AnimatedBlur>
					) : (
						<Animated.View
							ref={menuRef}
							onLayout={measureMenu}
							style={[
								styles.contextMenu,
								selectedItem && toJS(selectedItem)?.sender?.id == toJS(profile)?.id ? styles.rightContextMenu : styles.leftContextMenu,
								side === "right" ? styles.rightContextMenu : styles.leftContextMenu,
								contextMenuStyle,
								menuStyle
							]}
						>
							{actions.map((item, index) => (
								<MenuItem
									key={index}
									item={item}
									index={index}
									isLast={index === actions.length - 1}
									isHighlighted={highlightedItemIndex === index}
									onLayout={updateItemPosition}
								/>
							))}
						</Animated.View>
					)}
				</Animated.View>
			</Box>
		</Portal>
	);
});

const styles = StyleSheet.create({
	container: {
		flex: 1,
		zIndex: 1000
	},
	contextMenu: {
		flexDirection: 'column',
		backgroundColor: themeStore.currentTheme.bgTheme.background as string,
		borderRadius: 12,
		paddingVertical: 3,
		marginTop: 7.5,
		overflow: 'hidden',
		zIndex: 10000
	},
	rightContextMenu: {
		justifyContent: 'flex-end',
		alignSelf: 'flex-end',
	},
	leftContextMenu: {
		justifyContent: 'flex-start',
		alignSelf: 'flex-start',
	},
	menuItem: {
		paddingHorizontal: 17.5,
		width: 200,
		flexDirection: 'row',
		justifyContent: "space-between",
		alignItems: 'center',
		height: 40,
		gap: 10,
	},
	menuItemText: {
		marginLeft: 5,
		fontSize: 14,
		color: '#333',
	}
});