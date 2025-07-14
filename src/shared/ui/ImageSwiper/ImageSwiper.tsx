import { ImageZoom } from '@likashefqet/react-native-image-zoom';
import { themeStore } from '@stores/theme';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, DimensionValue, findNodeHandle, FlatList, GestureResponderEvent, Image, Modal, StyleSheet, TouchableOpacity, UIManager, View } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
	Easing,
	Extrapolate,
	interpolate,
	runOnJS,
	useAnimatedGestureHandler,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming
} from 'react-native-reanimated';
import { Box } from '../BoxUi/Box';

interface ImageSwiperProps {
	images: string[];
	imageWidth?: DimensionValue;
	onImagePress?: (index: number) => void;
	height?: number;
}

interface ZoomEvent {
	zoomLevel: number;
}

interface TouchPosition {
	x: number;
	y: number;
	timestamp: number;
}

export const ImageSwiper = observer(({ images, onImagePress, imageWidth, height = 300 }: ImageSwiperProps) => {
	if (!images?.length) return <></>;

	const { currentTheme } = themeStore;

	const translateY = useSharedValue(0);
	const scale = useSharedValue(1);
	const bgOpacity = useSharedValue(1);
	const uiOpacity = useSharedValue(1);
	const flatListRef = useRef<FlatList>(null);
	const screenWidth = Dimensions.get('window').width;
	const screenHeight = Dimensions.get('window').height;
	const imagesWidth = imageWidth || screenWidth;
	const scrollOffset = useSharedValue(0);
	const fullscreenScrollOffset = useSharedValue(0);
	const isDragging = useSharedValue(false);
	const indicatorScrollX = useSharedValue(0);
	const fullscreenIndicatorScrollX = useSharedValue(0);
	const [zoomEnabled, setZoomEnabled] = useState<boolean[]>(images.map(() => false));
	const [fullscreenMode, setFullscreenMode] = useState(false);
	const [fullscreenIndex, setFullscreenIndex] = useState(0);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [previousIndex, setPreviousIndex] = useState(0);
	const imageOpacity = useSharedValue(1);
	const isClosing = useSharedValue(false);
	const imagePosition = useSharedValue({ x: 0, y: 0, width: 0, height: 0 });
	const openingAnimation = useSharedValue(0);
	const [isScrolling, setIsScrolling] = useState(false);
	const wasScrolling = useRef(false);

	// Новые переменные для точного отслеживания нажатий
	const touchStart = useRef<TouchPosition | null>(null);
	const isTouching = useRef(false);
	const touchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const lastTouchEndTime = useRef(0);
	const consecutiveOpenCount = useRef(0);
	const blockOpeningUntil = useRef(0);

	// Константы для проверки жестов
	const MAX_CLICK_DURATION = 180; // максимальная длительность клика в мс
	const MAX_MOVE_DISTANCE = 5; // максимальное расстояние движения пальца в пикселях
	const CONSECUTIVE_OPEN_THRESHOLD = 2; // после какого количества быстрых открытий блокировать на время
	const BLOCK_DURATION = 1000; // длительность блокировки в мс после быстрых открытий

	const dotAnimatedStyles = images.map((_, index) => {
		return useAnimatedStyle(() => {
			const scale = interpolate(
				Math.abs(fullscreenScrollOffset.value - index),
				[0, 0.5, 1, 2],
				[1.2, 1.1, 0.9, 0.8],
				Extrapolate.CLAMP
			);

			const opacity = interpolate(
				Math.abs(fullscreenScrollOffset.value - index),
				[0, 3, 4],
				[1, 0.7, 0.5],
				Extrapolate.CLAMP
			);

			return {
				transform: [{ scale }],
				opacity
			};
		});
	});

	// Создаем стиль для контейнера индикатора
	const indicatorContainerStyle = useAnimatedStyle(() => {
		return {
			transform: [
				{ translateX: -fullscreenIndicatorScrollX.value }
			]
		};
	});

	useEffect(() => {
		if (currentIndex !== previousIndex) {
			if (images?.length > 7) {
				if (currentIndex < 3) {
					indicatorScrollX.value = withSpring(0, {
						damping: 15,
						stiffness: 150
					});
				} else if (currentIndex >= images.length - 4) {
					indicatorScrollX.value = withSpring((images.length - 7) * 9, {
						damping: 15,
						stiffness: 150
					});
				} else {
					indicatorScrollX.value = withSpring((currentIndex - 3) * 9, {
						damping: 15,
						stiffness: 150
					});
				}
			}
			setPreviousIndex(currentIndex);
		}
	}, [currentIndex, previousIndex, images.length]);

	useEffect(() => {
		if (images.length > 7) {
			if (fullscreenIndex < 3) {
				fullscreenIndicatorScrollX.value = withSpring(0, {
					damping: 15,
					stiffness: 150
				});
			} else if (fullscreenIndex >= images.length - 4) {
				fullscreenIndicatorScrollX.value = withSpring((images.length - 7) * 9, {
					damping: 15,
					stiffness: 150
				});
			} else {
				fullscreenIndicatorScrollX.value = withSpring((fullscreenIndex - 3) * 9, {
					damping: 15,
					stiffness: 150
				});
			}
		}
	}, [fullscreenIndex, images.length]);

	const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
		if (viewableItems && viewableItems.length > 0 && viewableItems[0]) {
			const index = viewableItems[0].index;
			if (typeof index === 'number') {
				setCurrentIndex(index);
			}
		}
	}).current;

	const handleScroll = (event: any) => {
		const offsetX = event.nativeEvent.contentOffset.x;
		scrollOffset.value = offsetX / screenWidth;
	};

	const handleScrollBeginDrag = () => {
		isDragging.value = true;
		setIsScrolling(true);
		wasScrolling.current = true;

		// При начале скролла очищаем данные о нажатии
		if (touchTimer.current) {
			clearTimeout(touchTimer.current);
			touchTimer.current = null;
		}
		touchStart.current = null;
		isTouching.current = false;
	};

	const handleScrollEndDrag = () => {
		isDragging.value = false;
		setIsScrolling(false);

		// Увеличиваем время блокировки после скролла
		wasScrolling.current = true;
		setTimeout(() => {
			wasScrolling.current = false;
		}, 500);
	};

	const handleZoomChange = (index: number, isZoomed: boolean) => {
		const newZoomEnabled = [...zoomEnabled];
		newZoomEnabled[index] = isZoomed;
		setZoomEnabled(newZoomEnabled);
	};

	const openFullscreen = useCallback((index: number) => {
		// Сохраняем текущий индекс для возврата
		setFullscreenIndex(index);
		setFullscreenMode(true);
		isClosing.value = false;

		// Сбрасываем значения анимации
		translateY.value = 0;
		imageOpacity.value = 1;

		// Запускаем анимацию открытия
		openingAnimation.value = 0;
		openingAnimation.value = withTiming(1, {
			duration: 300,
			easing: Easing.out(Easing.ease)
		});

		// Сохраняем позицию текущего изображения для анимации возврата
		if (flatListRef.current) {
			const handle = findNodeHandle(flatListRef.current);
			if (handle) {
				UIManager.measure(handle, (x, y, width, height, pageX, pageY) => {
					// Вычисляем центр ImageSwiper
					imagePosition.value = {
						x: pageX,
						y: pageY + height / 2, // Центрируем по вертикали
						width,
						height
					};
				});
			}
		}
	}, []);

	const handleTouch = useCallback((index: number, event: GestureResponderEvent, type: 'start' | 'end') => {
		const now = Date.now();

		// Блокировка открытия, если было слишком много последовательных открытий
		if (now < blockOpeningUntil.current) {
			return;
		}

		if (type === 'start') {
			// Запоминаем начальную позицию и время
			touchStart.current = {
				x: event.nativeEvent.pageX,
				y: event.nativeEvent.pageY,
				timestamp: now
			};
			isTouching.current = true;

			// Устанавливаем таймер, чтобы отменить открытие при длительном нажатии
			if (touchTimer.current) {
				clearTimeout(touchTimer.current);
			}
			touchTimer.current = setTimeout(() => {
				// Если пользователь держит палец слишком долго, это не клик
				isTouching.current = false;
				touchStart.current = null;
			}, MAX_CLICK_DURATION);
		} else if (type === 'end') {
			// Если начало касания не зафиксировано или был скролл, игнорируем
			if (!touchStart.current || wasScrolling.current || isScrolling || !isTouching.current) {
				isTouching.current = false;
				touchStart.current = null;
				if (touchTimer.current) {
					clearTimeout(touchTimer.current);
					touchTimer.current = null;
				}
				return;
			}

			// Проверяем время и расстояние
			const touchDuration = now - touchStart.current.timestamp;
			const moveDistance = Math.sqrt(
				Math.pow(event.nativeEvent.pageX - touchStart.current.x, 2) +
				Math.pow(event.nativeEvent.pageY - touchStart.current.y, 2)
			);

			// Очищаем таймер и состояние
			if (touchTimer.current) {
				clearTimeout(touchTimer.current);
				touchTimer.current = null;
			}
			isTouching.current = false;

			// Проверяем скорость последовательных открытий
			const timeSinceLastOpen = now - lastTouchEndTime.current;
			if (timeSinceLastOpen < 300) {
				consecutiveOpenCount.current++;
				if (consecutiveOpenCount.current >= CONSECUTIVE_OPEN_THRESHOLD) {
					// Блокируем открытие на некоторое время при подозрении на множественные открытия
					blockOpeningUntil.current = now + BLOCK_DURATION;
					consecutiveOpenCount.current = 0;
					return;
				}
			} else {
				consecutiveOpenCount.current = 0;
			}

			// Очень строгая проверка на "чистый клик"
			if (touchDuration < MAX_CLICK_DURATION && moveDistance < MAX_MOVE_DISTANCE) {
				openFullscreen(index);
				lastTouchEndTime.current = now;
			}

			touchStart.current = null;
		}
	}, [wasScrolling, isScrolling, openFullscreen]);

	const handleCloseWithAnimation = useCallback(() => {
		// Запускаем анимацию закрытия
		isClosing.value = true;

		// Вычисляем позицию для возврата (центр ImageSwiper)
		const targetPosition = imagePosition.value.y - screenHeight / 2 || 0;

		// Анимируем закрытие с более длительной анимацией для фона
		bgOpacity.value = withTiming(0, { duration: 700 });
		uiOpacity.value = withTiming(0, { duration: 200 });

		// Анимируем перемещение изображения вниз к ImageSwiper с эффектом "засасывания"
		translateY.value = withTiming(targetPosition, {
			duration: 500,
			easing: Easing.bezier(0.16, 1, 0.3, 1)
		});

		// Анимируем масштабирование для эффекта "засасывания"
		scale.value = withTiming(0.5, {
			duration: 500,
			easing: Easing.bezier(0.34, 1.56, 0.64, 1)
		});

		// Анимируем прозрачность изображения в конце анимации
		imageOpacity.value = withTiming(0, {
			duration: 500,
			easing: Easing.in(Easing.ease)
		}, () => {
			runOnJS(setFullscreenMode)(false);
			isClosing.value = false;
			scale.value = 1; // Сбрасываем масштаб после завершения
		});
	}, [screenHeight]);

	const handleFullscreenScroll = (event: any) => {
		const offsetX = event.nativeEvent.contentOffset.x;
		fullscreenScrollOffset.value = offsetX / screenWidth;
	};

	const gestureHandler = useAnimatedGestureHandler({
		onStart: (_, ctx: any) => {
			ctx.startY = translateY.value;
		},
		onActive: (event, ctx) => {
			if (event.translationY > 0) {
				translateY.value = ctx.startY + event.translationY;
				const progress = Math.min(translateY.value / 300, 1);
				bgOpacity.value = 1 - progress * 0.7;
				uiOpacity.value = 1 - progress;

				// Убираем масштабирование при перетаскивании
				// scale.value = 1 - progress * 0.3
			}
		},
		onEnd: (event) => {
			if (translateY.value > 150) {
				// Запускаем анимацию закрытия
				isClosing.value = true;

				// Вычисляем позицию для возврата (центр ImageSwiper)
				const targetPosition = imagePosition.value.y - screenHeight / 2 || 0;

				// Анимируем закрытие с более длительной анимацией для фона
				bgOpacity.value = withTiming(0, { duration: 700 });
				uiOpacity.value = withTiming(0, { duration: 200 });

				// Анимируем перемещение изображения вниз к ImageSwiper без масштабирования
				translateY.value = withTiming(targetPosition, {
					duration: 500,
					easing: Easing.bezier(0.16, 1, 0.3, 1)
				});

				// Анимируем прозрачность изображения
				imageOpacity.value = withTiming(0, {
					duration: 500,
					easing: Easing.in(Easing.ease)
				}, () => {
					runOnJS(setFullscreenMode)(false);
					isClosing.value = false;
				});
			} else {
				// Если перетаскивание недостаточное, возвращаем в исходное положение
				translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
				bgOpacity.value = withSpring(1, { damping: 15, stiffness: 150 });
				uiOpacity.value = withSpring(1, { damping: 15, stiffness: 150 });
			}
		}
	});

	// Анимированный стиль для фона при открытии
	const animatedBackgroundStyle = useAnimatedStyle(() => {
		return {
			opacity: bgOpacity.value,
			// Добавляем анимацию открытия
			backgroundColor: `rgba(0, 0, 0, ${interpolate(
				openingAnimation.value,
				[0, 1],
				[0, 1]
			)})`
		};
	});

	// Анимированный стиль для контейнера при открытии
	const animatedFullscreenStyle = useAnimatedStyle(() => {
		return {
			transform: [
				{ translateY: translateY.value },
				// Убираем масштабирование при закрытии свайпом
				// { scale: scale.value }
			],
			// Добавляем анимацию открытия
			opacity: interpolate(
				openingAnimation.value,
				[0, 0.5, 1],
				[0, 0.8, 1]
			)
		};
	});

	const animatedUIStyle = useAnimatedStyle(() => {
		return {
			opacity: uiOpacity.value,
			transform: [
				{
					translateY: interpolate(
						uiOpacity.value,
						[0, 1],
						[10, 0],
						Extrapolate.CLAMP
					)
				}
			]
		};
	});

	const animatedContentStyle = useAnimatedStyle(() => {
		return {
			width: '100%',
			height: '100%',
			opacity: uiOpacity.value
		};
	});

	const animatedImageStyle = useAnimatedStyle(() => {
		return {
			opacity: imageOpacity.value
		};
	});

	const renderItem = useCallback(({ item, index }: { item: string; index: number; }) => {
		return (
			<TouchableOpacity
				activeOpacity={1}
				style={[styles.slideContainer, { width: imagesWidth, backgroundColor: currentTheme.bgTheme.background as string }]}
				onPressIn={(e) => handleTouch(index, e, 'start')}
				onPressOut={(e) => handleTouch(index, e, 'end')}
				delayPressIn={0}
				delayPressOut={0}
			>
				<View style={[styles.imageBackground, { height }]}>
					<Image
						source={{ uri: item }}
						style={[styles.backgroundImage, { height }]}
						blurRadius={25}
					/>
				</View>
				<ImageZoom
					uri={item}
					minScale={1}
					maxScale={3}
					onInteractionStart={() => handleZoomChange(index, true)}
					onInteractionEnd={() => handleZoomChange(index, false)}
					style={[
						styles.zoomableView,
						{
							width: screenWidth,
							height: height
						}
					]}
				/>
			</TouchableOpacity>
		);
	}, [screenWidth, height, handleZoomChange, currentTheme, imagesWidth, handleTouch]);

	const renderFullscreenItem = useCallback(({ item, index }: { item: string; index: number; }) => {
		return (
			<View style={[styles.fullscreenSlide, { width: screenWidth }]}>
				<Animated.View style={[animatedImageStyle, { width: '100%', height: '100%' }]}>
					<ImageZoom
						uri={item}
						minScale={0.5}
						maxScale={3}
						style={styles.fullscreenImage}
					/>
				</Animated.View>
			</View>
		);
	}, [screenWidth, animatedImageStyle]);

	const renderPaginationDots = () => {
		if (images.length <= 7) {
			return images.map((_, index) => {
				const animatedDotStyle = useAnimatedStyle(() => {
					const scale = interpolate(
						Math.abs(scrollOffset.value - index),
						[0, 0.5, 1, 2],
						[1.2, 1.1, 0.9, 0.8],
						Extrapolate.CLAMP
					);

					const opacity = interpolate(
						Math.abs(scrollOffset.value - index),
						[0, 3, 4],
						[1, 0.7, 0.5],
						Extrapolate.CLAMP
					);

					return {
						transform: [{ scale }],
						opacity
					};
				});

				return (
					<Animated.View
						key={index}
						style={[
							styles.paginationDot,
							getDotStyle(Math.abs(currentIndex - index)),
							index === currentIndex && styles.paginationDotActive,
							animatedDotStyle
						]}
					/>
				);
			});
		} else {
			const indicatorContainerStyle = useAnimatedStyle(() => {
				return {
					transform: [{ translateX: -indicatorScrollX.value }]
				};
			});

			return (
				<View style={styles.paginationContainer}>
					<Animated.View style={[styles.paginationInner, indicatorContainerStyle]}>
						{images.map((_, index) => {
							const animatedDotStyle = useAnimatedStyle(() => {
								const scale = interpolate(
									Math.abs(scrollOffset.value - index),
									[0, 0.5, 1, 2],
									[1.2, 1.1, 0.9, 0.8],
									Extrapolate.CLAMP
								);

								const opacity = interpolate(
									Math.abs(scrollOffset.value - index),
									[0, 3, 4],
									[1, 0.7, 0.5],
									Extrapolate.CLAMP
								);
								return {
									transform: [{ scale }],
									opacity
								};
							});

							return (
								<Animated.View
									key={index}
									style={[
										styles.paginationDot,
										getDotStyle(Math.abs(currentIndex - index)),
										index === currentIndex && styles.paginationDotActive,
										animatedDotStyle
									]}
								/>
							);
						})}
					</Animated.View>
				</View>
			);
		}
	};
	const getDotStyle = (distance: number) => {
		if (distance === 0) {
			return styles.dotCurrent;
		} else if (distance === 1) {
			return styles.dotNear;
		} else if (distance === 2) {
			return styles.dotFar;
		} else {
			return styles.dotFarthest;
		}
	};

	const renderFullscreenImage = () => {
		if (!fullscreenMode) return null;

		return (
			<Modal
				visible={fullscreenMode}
				transparent={true}
				animationType="none" // Используем собственную анимацию
				onRequestClose={handleCloseWithAnimation}
				hardwareAccelerated={true}
			>
				<Animated.View style={[styles.fullscreenBackground, animatedBackgroundStyle]}>
					<PanGestureHandler onGestureEvent={gestureHandler}>
						<Animated.View style={[styles.fullscreenContainer, animatedFullscreenStyle]}>
							<FlatList
								data={images}
								renderItem={renderFullscreenItem}
								horizontal
								pagingEnabled
								initialScrollIndex={fullscreenIndex}
								getItemLayout={(_, index) => ({
									length: screenWidth,
									offset: screenWidth * index,
									index,
								})}
								showsHorizontalScrollIndicator={false}
								keyExtractor={(_, index) => `fullscreen-${index}`}
								onViewableItemsChanged={({ viewableItems }) => {
									if (viewableItems && viewableItems.length > 0 && viewableItems[0]) {
										const index = viewableItems[0].index;
										if (typeof index === 'number') {
											setFullscreenIndex(index);
										}
									}
								}}
								viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
								onScroll={handleFullscreenScroll}
								scrollEventThrottle={16}
								removeClippedSubviews={true}
								maxToRenderPerBatch={3}
								windowSize={5}
							/>

							<Animated.View style={[styles.closeButtonContainer, animatedUIStyle]}>
								<TouchableOpacity
									style={styles.closeButton}
									onPress={handleCloseWithAnimation}
								>
									<View style={styles.closeButtonInner}>
										<View style={[styles.closeButtonLine, { transform: [{ rotate: '45deg' }] }]} />
										<View style={[styles.closeButtonLine, { transform: [{ rotate: '-45deg' }] }]} />
									</View>
								</TouchableOpacity>
							</Animated.View>

							{images.length > 1 && (
								<Animated.View style={[styles.fullscreenPagination, animatedUIStyle]}>
									{renderFullscreenPaginationDots()}
								</Animated.View>
							)}
						</Animated.View>
					</PanGestureHandler>
				</Animated.View>
			</Modal>
		);
	};

	const renderFullscreenPaginationDots = () => {
		if (images.length <= 7) {
			return images.map((_, index) => {
				return (
					<Animated.View
						key={`dot-${index}`}
						style={[
							styles.paginationDot,
							getDotStyle(Math.abs(fullscreenIndex - index)),
							index === fullscreenIndex && styles.paginationDotActive,
							dotAnimatedStyles[index]
						]}
					/>
				);
			});
		} else {
			return (
				<View style={styles.paginationContainer}>
					<Animated.View style={[styles.paginationInner, indicatorContainerStyle]}>
						{images.map((_, index) => {
							return (
								<Animated.View
									key={`dot-${index}`}
									style={[
										styles.paginationDot,
										getDotStyle(Math.abs(fullscreenIndex - index)),
										index === fullscreenIndex && styles.paginationDotActive,
										dotAnimatedStyles[index]
									]}
								/>
							);
						})}
					</Animated.View>
				</View>
			);
		}
	};

	useEffect(() => {
		if (!fullscreenMode) {
			// Сбрасываем значения только если не в процессе закрытия
			if (!isClosing.value) {
				translateY.value = 0;
				bgOpacity.value = 1;
				uiOpacity.value = 1;
				imageOpacity.value = 1;
			}
		}
	}, [fullscreenMode]);

	return (
		<Box
			fD='column'
			gap={10}
		>
			<View style={[styles.container, { height }]}>
				<FlatList
					ref={flatListRef}
					data={images}
					renderItem={renderItem}
					horizontal
					pagingEnabled
					bounces={false}
					showsHorizontalScrollIndicator={false}
					keyExtractor={(_, index) => index.toString()}
					onViewableItemsChanged={onViewableItemsChanged}
					viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
					getItemLayout={(_, index) => ({
						length: screenWidth,
						offset: screenWidth * index,
						index,
					})}
					snapToInterval={screenWidth}
					snapToAlignment="start"
					decelerationRate="fast"
					onScroll={handleScroll}
					onScrollBeginDrag={handleScrollBeginDrag}
					onScrollEndDrag={handleScrollEndDrag}
					scrollEventThrottle={16}
					scrollEnabled={!zoomEnabled[currentIndex]}
				/>
			</View>
			<Box
				style={styles.bottom}
				bgColor={currentTheme.bgTheme.background as string}
				centered
			>
				{images.length > 1 && (
					<View style={styles.pagination}>
						{renderPaginationDots()}
					</View>
				)}
			</Box>
			{renderFullscreenImage()}
		</Box>
	);
});

const styles = StyleSheet.create({
	bottom: {
		width: '100%',
	},
	container: {
		position: 'relative',
		width: '100%',
	},
	slideContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	zoomableView: {
		width: '100%',
		height: '100%',
		overflow: 'hidden',
	},
	imageContainer: {
		width: '100%',
		height: '100%',
		overflow: 'hidden',
	},
	imageWrapper: {
		width: '100%',
		height: '100%',
	},
	image: {
		width: '100%',
		height: '100%',
	},
	pagination: {
		width: '100%',
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		gap: 3,
	},
	paginationContainer: {
		width: 63,
		height: 10,
		overflow: 'hidden',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-start',
	},
	paginationInner: {
		flexDirection: 'row',
		justifyContent: 'flex-start',
		alignItems: 'center',
		gap: 3,
		paddingLeft: 3,
	},
	paginationDot: {
		width: 6,
		height: 6,
		borderRadius: 3,
		backgroundColor: themeStore.currentTheme.secondTextColor.color,
	},
	paginationDotActive: {
		backgroundColor: themeStore.currentTheme.originalMainGradientColor.color,
	},
	dotCurrent: {
		width: 5.5,
		height: 5.5,
		borderRadius: 3,
	},
	dotNear: {
		width: 6,
		height: 6,
		borderRadius: 3,
	},
	dotFar: {
		width: 5,
		height: 5,
		borderRadius: 3,
	},
	dotFarthest: {
		width: 4,
		height: 4,
		borderRadius: 2,
	},
	imageBackground: {
		position: 'absolute',
		width: '100%',
		overflow: 'hidden',
	},
	backgroundImage: {
		width: '100%',
		position: 'absolute',
		opacity: 0.5,
	},
	fullscreenBackground: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: '#000',
	},
	fullscreenContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		width: '100%',
		height: '100%',
	},
	fullscreenSlide: {
		justifyContent: 'center',
		alignItems: 'center',
		overflow: 'hidden',
	},
	fullscreenImage: {
		width: '100%',
		height: '100%',
	},
	closeButtonContainer: {
		position: 'absolute',
		top: 0,
		right: 0,
		zIndex: 10,
	},
	closeButton: {
		position: 'relative',
		top: 40,
		right: 20,
		width: 40,
		height: 40,
		justifyContent: 'center',
		alignItems: 'center',
	},
	closeButtonInner: {
		width: 24,
		height: 24,
		justifyContent: 'center',
		alignItems: 'center',
	},
	closeButtonLine: {
		position: 'absolute',
		width: 20,
		height: 2,
		backgroundColor: '#fff',
	},
	fullscreenPagination: {
		position: 'absolute',
		bottom: 40,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		width: '100%',
	},
});