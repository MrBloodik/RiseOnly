import { Ionicons } from '@expo/vector-icons';
import BottomSheet, {
	BottomSheetBackdrop,
	BottomSheetBackdropProps,
	BottomSheetView
} from '@gorhom/bottom-sheet';
import { BackArrowLeftIcon } from '@icons/Ui/BackArrowLeftIcon';
import { changeRgbA, darkenRGBA } from '@shared/lib/theme';
import { commentInteractionsStore } from '@stores/comment';
import { postInteractionsStore } from '@stores/post';
import { themeStore } from '@stores/theme';
import { observer } from 'mobx-react-lite';
import React, { JSX, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, BackHandler, Easing, Keyboard, Platform, StyleProp, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Portal } from 'react-native-paper';
import { ContextMenuItem, ContextMenuUi } from '../ContextMenuUi/ContextMenuUi';
import { MainText } from '../MainText/MainText';
import { SimpleButtonUi } from '../SimpleButtonUi/SimpleButtonUi';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface BottomSheetProps {
	leftBtn?: boolean;
	leftBtnPress?: () => void;
	children: React.ReactNode;
	footer?: JSX.Element | null;
	footerStyle?: StyleProp<ViewStyle>;
	onCloseSignal?: boolean;
	header?: JSX.Element;
	isBottomSheet?: boolean;
	setIsBottomSheet?: (value: boolean) => void;
	setOnCloseSignal?: (value: boolean) => void;
	title?: string;
	commentInput?: boolean;
	menuItems?: ContextMenuItem[];
	bottomSheetViewStyle?: StyleProp<ViewStyle>;
	snap?: string[];
	contextMenuVisible?: boolean;
	setContextMenuVisible?: (value: boolean) => void;
}

const BottomSheetState = {
	isAnimating: false,
	isOpen: false,
	timeoutId: null as NodeJS.Timeout | null,
	closeBlocked: false,
	closeBlockTimeoutId: null as NodeJS.Timeout | null,
};

export const isBottomSheetAnimating = () => BottomSheetState.isAnimating;
export const isBottomSheetOpen = () => BottomSheetState.isOpen;

export const BottomSheetUi = observer(({
	children,
	footer = null,
	footerStyle = {},
	leftBtn = false,
	leftBtnPress,
	header,
	isBottomSheet,
	setIsBottomSheet,
	menuItems,
	onCloseSignal,
	setOnCloseSignal,
	contextMenuVisible,
	snap = ["60%", '93%'],
	setContextMenuVisible,
	title = '',
}: BottomSheetProps) => {
	const { currentTheme } = themeStore;
	const { selectedPost } = postInteractionsStore;
	const {
		repliesOpen: { repliesOpen },
		selectedCommentForReply: { selectedCommentForReply }
	} = commentInteractionsStore;

	const bottomSheetRef = useRef<BottomSheet>(null);
	const isKeyboardTriggeredChange = useRef(false);
	const userInitiatedSwipe = useRef(false);
	const { t } = useTranslation();

	const [keyboardHeight, setKeyboardHeight] = useState(-3);
	const [keyboardVisible, setKeyboardVisible] = useState(false);
	const [programmaticSnapChange, setProgrammaticSnapChange] = useState(false);

	const snapPoints = useMemo(() => snap, []);
	const [footerVisible, setFooterVisible] = useState(false);

	const footerAnimation = useRef(new Animated.Value(1)).current;
	const footerPositionAnimation = useRef(new Animated.Value(0)).current;
	const footerShowTimer = useRef<NodeJS.Timeout | null>(null);
	const footerAnimationTimer = useRef<NodeJS.Timeout | null>(null);
	const footerAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
	const closeButtonRef = useRef<View>(null);
	const opacity = useRef(new Animated.Value(0)).current;

	const handleSheetClose = useCallback(() => {
		commentInteractionsStore.dismissKeyboardAndBlurInputs();

		if (setIsBottomSheet) {
			bottomSheetRef.current?.close();
			BottomSheetState.isOpen = false;
			setIsBottomSheet(false);
		}
	}, [setIsBottomSheet]);

	const handleOnCloseSignal = () => {
		if (bottomSheetRef.current) {
			const animation = Animated.timing(footerAnimation, {
				toValue: 0,
				duration: 300,
				useNativeDriver: true,
				easing: Easing.bezier(0.25, 0.1, 0.25, 1)
			});
			footerAnimationRef.current = animation;

			animation.start(() => {
				setFooterVisible(false);
				footerAnimationRef.current = null;
			});

			setTimeout(() => {
				if (bottomSheetRef.current) {
					bottomSheetRef.current.close();
					BottomSheetState.isAnimating = true;

					if (setIsBottomSheet) {
						setTimeout(() => {
							setIsBottomSheet(false);
							BottomSheetState.isOpen = false;
						}, 100);
					}
				}
			}, 50);
		}
	};

	useEffect(() => {
		Animated.timing(opacity, {
			toValue: leftBtn ? 1 : 0,
			duration: 300,
			useNativeDriver: true,
		}).start();
	}, [leftBtn]);

	useEffect(() => {
		if (!onCloseSignal) return;
		handleOnCloseSignal();
		if (setOnCloseSignal) setOnCloseSignal(false);
	}, [onCloseSignal]);

	const forceHideKeyboard = () => {
		Keyboard.dismiss();
		commentInteractionsStore.dismissKeyboardAndBlurInputs();
		setTimeout(() => {
			Keyboard.dismiss();
		}, 50);
	};

	const handleSheetChanges = useCallback((index: number) => {
		if (programmaticSnapChange) {
			setProgrammaticSnapChange(false);
			return;
		}

		if (userInitiatedSwipe.current) {
			userInitiatedSwipe.current = false;

			if (index === 0 && keyboardVisible) {
			} else {
				forceHideKeyboard();
			}
		} else {
			forceHideKeyboard();
		}

		if (footerShowTimer.current) {
			clearTimeout(footerShowTimer.current);
			footerShowTimer.current = null;
		}

		if (footerAnimationTimer.current) {
			clearTimeout(footerAnimationTimer.current);
			footerAnimationTimer.current = null;
		}

		if (footerAnimationRef.current) {
			footerAnimationRef.current.stop();
			footerAnimationRef.current = null;
		}

		if (index === -1) {
			const animation = Animated.timing(footerAnimation, {
				toValue: 0,
				duration: 300,
				useNativeDriver: true,
				easing: Easing.bezier(0.25, 0.1, 0.25, 1)
			});

			footerAnimationRef.current = animation;

			animation.start(() => {
				setFooterVisible(false);
				handleSheetClose();
				footerAnimationRef.current = null;
			});
		} else {
			BottomSheetState.isOpen = true;

			if (!footerVisible && !footerShowTimer.current) {
				// @ts-ignore
				footerShowTimer.current = setTimeout(() => {
					setFooterVisible(true);
					const animation = Animated.spring(footerAnimation, {
						toValue: 1,
						useNativeDriver: true,
						friction: 8,
						tension: 40
					});

					footerAnimationRef.current = animation;
					animation.start(() => {
						footerAnimationRef.current = null;
					});

					footerShowTimer.current = null;
				}, 100);
			}
		}
	}, [handleSheetClose, footerAnimation, footerVisible, programmaticSnapChange, keyboardVisible]);

	const handleSheetAnimate = useCallback((fromIndex: number, toIndex: number) => {
		if (isKeyboardTriggeredChange.current) {
			if (toIndex === 1) {
				isKeyboardTriggeredChange.current = false;
			}
			return;
		}

		forceHideKeyboard();

		if (toIndex === -1) {
			if (footerShowTimer.current) {
				clearTimeout(footerShowTimer.current);
				footerShowTimer.current = null;
			}

			if (footerAnimationRef.current) {
				footerAnimationRef.current.stop();
				footerAnimationRef.current = null;
			}

			Animated.timing(footerAnimation, {
				toValue: 0,
				duration: 100,
				useNativeDriver: true,
				easing: Easing.bezier(0.25, 0.1, 0.25, 1)
			}).start();
		} else if (fromIndex === -1 && toIndex !== -1) {
			Animated.spring(footerPositionAnimation, {
				toValue: toIndex,
				useNativeDriver: false,
				friction: 8,
				tension: 40
			}).start();
		}
	}, [footerAnimation, footerPositionAnimation]);

	const handleOpenContextMenu = () => setContextMenuVisible && setContextMenuVisible(true);
	const handleCloseContextMenu = () => setContextMenuVisible && setContextMenuVisible(false);

	const renderBackdrop = useCallback(
		(props: BottomSheetBackdropProps) => (
			<BottomSheetBackdrop
				{...props}
				disappearsOnIndex={-1}
				appearsOnIndex={0}
				opacity={0.5}
				pressBehavior="close"
			/>
		),
		[]
	);

	useEffect(() => {
		return () => {
			BottomSheetState.isAnimating = false;
			BottomSheetState.isOpen = false;
			if (BottomSheetState.timeoutId) {
				clearTimeout(BottomSheetState.timeoutId);
			}
			if (BottomSheetState.closeBlockTimeoutId) {
				clearTimeout(BottomSheetState.closeBlockTimeoutId);
			}
		};
	}, []);

	useEffect(() => {
		const keyboardWillShow = Keyboard.addListener(
			Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
			(e) => {
				setKeyboardHeight(e.endCoordinates.height);
				setKeyboardVisible(true);

				if (bottomSheetRef.current && isBottomSheet) {
					setProgrammaticSnapChange(true);
					isKeyboardTriggeredChange.current = true;
					bottomSheetRef.current.snapToIndex(1);
				}
			}
		);

		const keyboardWillHide = Keyboard.addListener(
			Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
			() => {
				setKeyboardHeight(0);
				setKeyboardVisible(false);
				isKeyboardTriggeredChange.current = false;
			}
		);

		return () => {
			keyboardWillShow.remove();
			keyboardWillHide.remove();
		};
	}, [isBottomSheet]);

	useEffect(() => {
		if (isBottomSheet) {
			setFooterVisible(false);
			footerAnimation.setValue(0);

			// @ts-ignore
			footerShowTimer.current = setTimeout(() => {
				if (isBottomSheet) {
					setFooterVisible(true);

					const animation = Animated.spring(footerAnimation, {
						toValue: 1,
						useNativeDriver: true,
						friction: 8,
						tension: 40
					});

					footerAnimationRef.current = animation;
					animation.start(() => {
						footerAnimationRef.current = null;
					});
				}
				footerShowTimer.current = null;
			}, 100);

			return () => {
				if (footerShowTimer.current) {
					clearTimeout(footerShowTimer.current);
					footerShowTimer.current = null;
				}

				if (footerAnimationRef.current) {
					footerAnimationRef.current.stop();
					footerAnimationRef.current = null;
				}
			};
		} else {
			if (footerAnimationRef.current) {
				footerAnimationRef.current.stop();
				footerAnimationRef.current = null;
			}
			setFooterVisible(false);
			footerAnimation.setValue(0);
		}
	}, [isBottomSheet, footerAnimation]);

	useEffect(() => {
		if (isBottomSheet) {
			const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
				if (isBottomSheet) {
					console.log('Back button pressed in BottomSheetUi, trying to close');
					handleSheetClose();
					return true;
				}
				return false;
			});

			return () => {
				backHandler.remove();
			};
		}

		return undefined;
	}, [isBottomSheet, handleSheetClose]);

	const styles = StyleSheet.create({
		topLeftBtn: {
			position: "absolute",
			display: "flex",
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "center",
			gap: 5,
			left: 15
		},
		rightTopBtn: {
			position: "absolute",
			right: 15
		},
		container: {
			position: 'absolute',
			left: 0,
			right: 0,
			bottom: 0,
			top: 0,
			zIndex: 9999,
			elevation: 9999
		},
		contentContainer: {
			flex: 1,
			height: "100%"
		},
		bottomSheet: {
			backgroundColor: currentTheme.bgTheme.background as string,
			shadowColor: changeRgbA(currentTheme.secondTextColor.color as string, "0.2"),
			shadowOffset: { width: 0, height: -3 },
			shadowOpacity: 0.27,
			shadowRadius: 4.65,
			elevation: 6,
		},
		headerContainer: {
			paddingBottom: header ? 12 : 0,
		},
		footerContainer: {
			borderTopWidth: 1,
			borderTopColor: changeRgbA(currentTheme.secondTextColor.color as string, "0.1"),
			paddingVertical: 16,
			paddingHorizontal: 16,
			position: 'absolute',
			bottom: 0,
			left: 0,
			right: 0,
			backgroundColor: currentTheme.bgTheme.background as string,
			zIndex: 9999,
			elevation: 10,
		},
		gestureRoot: {
			flex: 1,
		},
		handleIndicator: {
			backgroundColor: darkenRGBA(currentTheme.bgTheme.background as string, -1),
			width: 40,
			borderRadius: 2,
		},
		titleContainer: {
			flexDirection: 'row',
			justifyContent: "center",
			alignItems: 'center',
			paddingTop: 15,
			paddingBottom: 10,
			marginTop: -10,
		},
		keyboardAvoidingView: {
			flex: 1,
		},
		mainContainer: {
			flex: 1,
			position: 'relative',
		},
		commentInputContainer: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingHorizontal: 16,
			paddingVertical: 10,
			borderTopWidth: 1,
			borderTopColor: changeRgbA(currentTheme.secondTextColor.color as string, "0.1"),
			backgroundColor: currentTheme.bgTheme.background as string,
		},
		commentInput: {
			flex: 1,
			padding: 10,
			borderRadius: 20,
			backgroundColor: changeRgbA(currentTheme.secondTextColor.color as string, "0.05"),
			marginRight: 10,
		},
		sendButton: {
			padding: 8,
		},
	});

	if (!isBottomSheet) return <></>;

	return (
		<Portal>
			<View
				style={styles.container}
			>
				<GestureHandlerRootView>
					<BottomSheet
						ref={bottomSheetRef}
						snapPoints={snapPoints}
						backgroundStyle={styles.bottomSheet}
						onChange={handleSheetChanges}
						backdropComponent={renderBackdrop}
						enablePanDownToClose={true}
						onClose={handleSheetClose}
						index={isBottomSheet ? 0 : -1}
						enableContentPanningGesture={true}
						enableHandlePanningGesture={true}
						handleStyle={{
							backgroundColor: currentTheme.bgTheme.background as string,
							borderTopLeftRadius: 15,
							borderTopRightRadius: 15,
						}}
						enableBlurKeyboardOnGesture
						enableOverDrag={false}
						animateOnMount={true}
						enableDynamicSizing={false}
						android_keyboardInputMode="adjustResize"
						handleIndicatorStyle={styles.handleIndicator}
						onAnimate={handleSheetAnimate}
						keyboardBehavior="extend"
						keyboardBlurBehavior="none"
						handleComponent={() => (
							<View
								style={{
									width: '100%',
									height: 20,
									alignItems: 'center',
									justifyContent: 'center',
									paddingTop: 8
								}}
								onTouchStart={() => {
									userInitiatedSwipe.current = true;
								}}
							>
								<View
									style={{
										width: 40,
										height: 4,
										backgroundColor: darkenRGBA(currentTheme.bgTheme.background as string, -1),
										borderRadius: 2,
									}}
								/>
							</View>
						)}
					>
						<View style={{ flex: 1 }}>
							{title && (
								<View
									style={styles.titleContainer}
									onTouchStart={forceHideKeyboard}
								>
									{leftBtn && (
										<Animated.View
											style={[
												styles.topLeftBtn,
												{ opacity }
											]}
										// onPress={(event) => { // потом добавить ес че
										// 	event.stopPropagation()
										// 	event.preventDefault()
										// }}
										>
											<BackArrowLeftIcon
												height={15}
												width={10}
												color={currentTheme.originalMainGradientColor.color as string}
											/>
										</Animated.View>
									)}

									<MainText
										px={14}
										tac='center'
										width={"100%"}
									>
										{title}
									</MainText>

									<View
										ref={closeButtonRef}
										style={styles.rightTopBtn}
									>
										{(menuItems && (menuItems?.length > 0)) && (
											<SimpleButtonUi
												onPress={handleOpenContextMenu}
											>
												<Ionicons name='filter' size={22} color={currentTheme.secondTextColor.color as string} />
											</SimpleButtonUi>
										)}
									</View>
								</View>
							)}

							{header && (
								<BottomSheetView style={styles.headerContainer}>
									{header}
								</BottomSheetView>
							)}

							<BottomSheetView
								style={[
									styles.contentContainer
								]}
							>
								{children}
							</BottomSheetView>
						</View>
					</BottomSheet>

					{(contextMenuVisible && menuItems) && (
						<ContextMenuUi
							items={menuItems}
							isVisible={contextMenuVisible}
							onClose={handleCloseContextMenu}
							anchorRef={closeButtonRef}
							width={180}
							offset={{ x: -155, y: 5 }}
							selected={
								repliesOpen ? (
									selectedCommentForReply?.selectedRepliesSort ? selectedCommentForReply.selectedRepliesSort : "popular"
								) : (
									selectedPost?.selectedCommentSort ? selectedPost.selectedCommentSort : "feed"
								)
							}
						/>
					)}

					{isBottomSheet && footerVisible && footer && (
						<Animated.View
							style={[
								{
									position: 'absolute',
									bottom: keyboardHeight,
									left: 0,
									right: 0,
									backgroundColor: currentTheme.bgTheme.background as string,
									borderTopWidth: 1,
									borderTopColor: changeRgbA(currentTheme.secondTextColor.color as string, "0.1"),
									zIndex: 2000,
									paddingBottom: keyboardVisible ? 3 : (Platform.OS === 'ios' ? 30 : 10),
								},
								{
									opacity: footerAnimation,
									transform: [
										{
											translateY: footerAnimation.interpolate({
												inputRange: [0, 1],
												outputRange: [50, 0],
											}),
										},
									],
								},
								footerStyle
							]}
						>
							{footer}
						</Animated.View>
					)}
				</GestureHandlerRootView>
			</View>
		</Portal>
	);
});
