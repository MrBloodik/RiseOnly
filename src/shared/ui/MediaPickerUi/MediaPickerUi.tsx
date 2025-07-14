import { Ionicons } from '@expo/vector-icons';
import BottomSheet, {
	BottomSheetBackdrop,
	BottomSheetBackdropProps,
	BottomSheetView
} from '@gorhom/bottom-sheet';
import { changeRgbA, darkenRGBA } from '@shared/lib/theme';
import { FlashList } from '@shopify/flash-list';
import { mediaInteractionsStore } from '@stores/media';
import { themeStore } from '@stores/theme';
import { ResizeMode, Video } from 'expo-av';
import * as ImageManipulator from 'expo-image-manipulator';
import * as MediaLibrary from 'expo-media-library';
import { observer } from 'mobx-react-lite';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
	ActivityIndicator,
	Animated,
	BackHandler,
	Dimensions,
	GestureResponderEvent,
	NativeScrollEvent,
	NativeSyntheticEvent,
	PanResponder,
	PanResponderGestureState,
	Platform,
	ScrollView,
	StatusBar,
	StyleSheet,
	TouchableOpacity,
	View,
	useWindowDimensions
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Portal } from 'react-native-paper';
import { CleverImage } from '../CleverImage/CleverImage';
import { MainText } from '../MainText/MainText';
import { SimpleButtonUi } from '../SimpleButtonUi/SimpleButtonUi';

const { width } = Dimensions.get('window');
const numColumns = 3;
const imageSize = width / numColumns;

export interface MediaPickerUiProps {
	isVisible: boolean;
	onClose: () => void;
	onSelectMedia?: (uris: string[]) => void;
	multiple?: boolean;
	includeEditing?: boolean;
	showsButtons?: boolean;
	maxSelections?: number;
	needAutoReset?: boolean;
	selectedMedias?: MediaItem[];
	onFinish?: (selectedMedia: MediaItem[]) => void;
}

export interface MediaItem {
	uri: string;
	id: string;
	selected?: boolean;
	ref?: React.RefObject<View | null>;
	mediaType?: 'photo' | 'video';
	duration?: number;
	file?: {
		uri: string;
		type: string;
		name: string;
	};
	_rawAsset?: any; // Для кеширования оригинального asset
}

export type MediaPickerRef = {
	resetStates: () => void;
};


interface CroppedArea {
	x: number;
	y: number;
	width: number;
	height: number;
}

interface AspectRatio {
	name: string;
	value: number | null;
	label: string;
	icon: any;
}

const baseStyles = StyleSheet.create({
	actionButton: {
		alignItems: 'center',
		marginHorizontal: 12,
		width: 70,
	},
	actionIconContainer: {
		width: 60,
		height: 60,
		borderRadius: 30,
		backgroundColor: themeStore.currentTheme.inputTheme.background as string,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 8,
	},
	actionLabel: {
		fontSize: 12,
		textAlign: 'center',
	},
});

interface ActionButtonProps {
	iconName: any;
	label: string;
	onPress: () => void;
	color?: string;
}

const MediaPickerState = {
	isOpen: false,
	closeTimeoutId: null as NodeJS.Timeout | null,
};

interface MediaItemComponentProps {
	item: MediaItem;
	imageSize: number;
	onPress: () => void;
	onSelectPress: (event: GestureResponderEvent) => void;
	selectedIndex: number | null;
	isEdited: boolean;
	onPlayVideo: (uri: string) => void;
	formatDuration: (duration?: number) => string;
	loadMediaUri: (item: MediaItem) => Promise<string>;
}

const MediaItemComponent = React.memo<MediaItemComponentProps>(({
	item,
	imageSize,
	onPress,
	onSelectPress,
	selectedIndex,
	isEdited,
	onPlayVideo,
	formatDuration,
	loadMediaUri
}) => {
	const { currentTheme } = themeStore;
	const [imageUri, setImageUri] = useState<string>(item.uri);
	const [isLoading, setIsLoading] = useState(!item.uri);

	// Ленивая загрузка URI
	useEffect(() => {
		if (!item.uri && loadMediaUri) {
			setIsLoading(true);
			loadMediaUri(item).then((uri) => {
				setImageUri(uri);
				setIsLoading(false);
			}).catch(() => {
				setIsLoading(false);
			});
		} else if (item.uri) {
			setImageUri(item.uri);
			setIsLoading(false);
		}
	}, [item.uri, item.id, loadMediaUri]);

	return (
		<TouchableOpacity
			style={[
				styles.imageWrapper,
				{
					width: imageSize,
					height: imageSize,
				}
			]}
			onPress={onPress}
		>
			<View
				ref={item.ref}
				style={[
					styles.imageContainer,
					{
						width: imageSize,
						height: imageSize
					}
				]}
			>
				{isLoading ? (
					<View style={[styles.image, styles.loadingPlaceholder]}>
						<ActivityIndicator
							size="small"
							color={currentTheme.originalMainGradientColor.color as string}
						/>
					</View>
				) : imageUri && imageUri !== 'error' ? (
					item.mediaType === 'video' ? (
						<View style={styles.videoPreviewContainer}>
							<Video
								source={{ uri: imageUri }}
								style={styles.image}
								shouldPlay={false}
								isLooping={false}
								resizeMode={ResizeMode.COVER}
								useNativeControls={false}
							/>
							<TouchableOpacity
								style={styles.playButton}
								onPress={() => onPlayVideo(imageUri)}
							>
								<Ionicons name="play-circle" size={40} color="white" />
							</TouchableOpacity>
							{item.duration && (
								<View style={styles.durationBadge}>
									<MainText style={styles.durationText}>
										{formatDuration(item.duration)}
									</MainText>
								</View>
							)}
						</View>
					) : (
						<CleverImage
							source={imageUri}
							imageStyles={styles.image}
							withoutWrapper={true}
						/>
					)
				) : (
					<View style={[styles.image, styles.errorPlaceholder]}>
						<Ionicons name="image-outline" size={24} color={currentTheme.secondTextColor.color as string} />
					</View>
				)}

				{isEdited && (
					<View style={styles.editedIndicator}>
						<Ionicons
							name="checkmark-circle"
							size={16}
							color={currentTheme.originalMainGradientColor.color as string}
						/>
					</View>
				)}

				<SimpleButtonUi
					style={styles.selectBtn}
					onPress={onSelectPress}
				>
					{selectedIndex && (
						<View style={styles.selectionIndicator}>
							<MainText
								style={styles.selectionNumber}
							>
								{selectedIndex}
							</MainText>
						</View>
					)}
				</SimpleButtonUi>
			</View>
		</TouchableOpacity>
	);
});

export const MediaPickerUi = observer(forwardRef<MediaPickerRef, MediaPickerUiProps>(({
	isVisible,
	onClose,
	onSelectMedia,
	multiple = false,
	onFinish,
	includeEditing = true,
	showsButtons = true,
	selectedMedias = [],
	needAutoReset = true,
	maxSelections = 10
}, ref) => {
	const { currentTheme } = themeStore;
	const { mediaResult: { setMediaResult } } = mediaInteractionsStore;
	const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
	const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [hasNextPage, setHasNextPage] = useState(true);
	const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
	const [isInitialLoading, setIsInitialLoading] = useState(true);

	// Add permission request logic
	const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();

	useEffect(() => {
		const checkAndRequestPermissions = async () => {
			if (!permissionResponse?.granted) {
				const permission = await requestPermission();
				if (!permission.granted) {
					setIsInitialLoading(false);
					// Handle permission denied case
					console.log("Media library permission denied");
					return;
				}
			}
			loadMediaMetadata();
		};

		if (isVisible) {
			checkAndRequestPermissions();
		}
	}, [isVisible, permissionResponse?.granted]);

	// Кеш для медиафайлов
	const mediaCache = useRef<Map<string, MediaItem>>(new Map());
	const loadingPromises = useRef<Map<string, Promise<MediaItem>>>(new Map());
	const visibleIndices = useRef<Set<number>>(new Set());
	const batchLoadQueue = useRef<Set<string>>(new Set());
	const batchLoadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
	const [fullscreenItemId, setFullscreenItemId] = useState<string | null>(null);
	const [fullscreenItemPosition, setFullscreenItemPosition] = useState<{ x: number, y: number, width: number, height: number; } | null>(null);

	const [isVideoPlaying, setIsVideoPlaying] = useState(false);
	const [currentVideoUri, setCurrentVideoUri] = useState<string | null>(null);
	const videoRef = useRef<Video>(null);

	const [isAnimatingOpen, setIsAnimatingOpen] = useState(false);
	const [isAnimatingClose, setIsAnimatingClose] = useState(false);

	const [editedImages, setEditedImages] = useState<Map<string, { uri: string, croppedArea: CroppedArea; }>>(new Map());
	const [isRotating, setIsRotating] = useState(false);
	const [isImageEditMode, setIsImageEditMode] = useState(false);
	const [isImageLoaded, setIsImageLoaded] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio | null>(null);
	const [isResizing, setIsResizing] = useState(false);
	const [isMoving, setIsMoving] = useState(false);

	const [cropArea, setCropArea] = useState({
		x: 50,
		y: 50,
		width: 300,
		height: 300
	});

	const cropTranslateX = useRef(new Animated.Value(0)).current;
	const cropTranslateY = useRef(new Animated.Value(0)).current;
	const cropWidth = useRef(new Animated.Value(300)).current;
	const cropHeight = useRef(new Animated.Value(300)).current;

	const aspectRatios: AspectRatio[] = [
		{ name: 'free', value: null, label: 'Свободный', icon: 'crop' },
		{ name: 'square', value: 1, label: '1:1', icon: 'square-outline' },
		{ name: 'portrait', value: 3 / 4, label: '3:4', icon: 'phone-portrait-outline' },
		{ name: 'landscape', value: 4 / 3, label: '4:3', icon: 'phone-landscape-outline' },
		{ name: 'wide', value: 16 / 9, label: '16:9', icon: 'tv-outline' }
	];

	const animatedValues = useRef({
		scale: new Animated.Value(1),
		translateX: new Animated.Value(0),
		translateY: new Animated.Value(0),
		opacity: new Animated.Value(0)
	}).current;

	const { t } = useTranslation();
	const { width: windowWidth, height: windowHeight } = useWindowDimensions();

	const snapPoints = useMemo(() => ['55%', '93%'], []);
	const bottomSheetRef = useRef<BottomSheet>(null);
	const flashListRef = useRef<any>(null);

	const userSwipeDirection = useRef<'up' | 'down' | null>(null);
	const touchStartY = useRef<number>(0);
	const isScrollingDown = useRef<boolean>(false);
	const isAtTop = useRef<boolean>(true);

	// Супербыстрая загрузка как в Telegram - полностью неблокирующая
	const loadMediaMetadata = useCallback(async (loadMore = false) => {
		if (!permissionResponse?.granted || (loadMore && (!hasNextPage || isLoadingMore))) {
			return;
		}

		if (loadMore) {
			setIsLoadingMore(true);
		} else {
			setIsInitialLoading(true);
		}

		// Используем requestIdleCallback для неблокирующей загрузки
		const performLoad = async () => {
			try {
				// Загружаем меньше элементов за раз для предотвращения фризов
				const result = await MediaLibrary.getAssetsAsync({
					mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
					first: loadMore ? 30 : 50, // Уменьшил количество для предотвращения фризов
					sortBy: [['creationTime', false]],
					after: loadMore ? nextCursor : undefined,
				});

				// Создаем элементы порциями для плавности
				const lightItems: MediaItem[] = [];
				const chunkSize = 10;

				for (let i = 0; i < result.assets.length; i += chunkSize) {
					const chunk = result.assets.slice(i, i + chunkSize);
					const chunkItems = chunk.map((asset) => ({
						id: asset.id,
						uri: '', // Пустой URI - загрузится по требованию
						mediaType: asset.mediaType === MediaLibrary.MediaType.video ? 'video' as const : 'photo' as const,
						duration: asset.duration,
						ref: React.createRef<View | null>(),
						_rawAsset: asset
					}));

					lightItems.push(...chunkItems);

					// Даем возможность UI обновиться между чанками
					if (i + chunkSize < result.assets.length) {
						await new Promise(resolve => setTimeout(resolve, 0));
					}
				}

				// Обновляем состояние в микротаске для плавности
				Promise.resolve().then(() => {
					if (loadMore) {
						setMediaItems(prev => [...prev, ...lightItems]);
					} else {
						setMediaItems(lightItems);
					}

					setHasNextPage(result.hasNextPage);
					setNextCursor(result.endCursor);
				});

			} catch (error) {
				console.error('Error loading media metadata:', error);
			} finally {
				// Убираем индикаторы загрузки в следующем кадре
				requestAnimationFrame(() => {
					setIsLoadingMore(false);
					setIsInitialLoading(false);
				});
			}
		};

		// Используем requestIdleCallback если доступен, иначе setTimeout
		if (typeof requestIdleCallback !== 'undefined') {
			requestIdleCallback(performLoad, { timeout: 2000 });
		} else {
			setTimeout(performLoad, 0);
		}
	}, [permissionResponse, hasNextPage, isLoadingMore, nextCursor]);

	// Ленивая загрузка URI только для видимых элементов
	const loadMediaUri = useCallback(async (item: MediaItem): Promise<string> => {
		const cacheKey = item.id;

		// Проверяем кеш
		const cached = mediaCache.current.get(cacheKey);
		if (cached?.uri) {
			return cached.uri;
		}

		// Проверяем, не загружается ли уже
		const existingPromise = loadingPromises.current.get(cacheKey);
		if (existingPromise) {
			const result = await existingPromise;
			return result.uri;
		}

		// Создаем промис загрузки
		const loadPromise = (async (): Promise<MediaItem> => {
			try {
				// ВСЕГДА получаем localUri чтобы избежать конфликта ph:// URL
				const assetInfo = await MediaLibrary.getAssetInfoAsync(item.id);
				const uri = assetInfo.localUri || assetInfo.uri;

				// Дополнительная проверка на ph:// URL
				const finalUri = uri.startsWith('ph://') ? assetInfo.localUri || 'error' : uri;

				const updatedItem = { ...item, uri: finalUri };
				mediaCache.current.set(cacheKey, updatedItem);
				return updatedItem;
			} catch (error) {
				console.warn('Failed to load media URI:', error);
				const fallbackItem = { ...item, uri: 'error' };
				mediaCache.current.set(cacheKey, fallbackItem);
				return fallbackItem;
			} finally {
				loadingPromises.current.delete(cacheKey);
			}
		})();

		loadingPromises.current.set(cacheKey, loadPromise);
		const result = await loadPromise;
		return result.uri;
	}, []);

	// Батчевая загрузка для лучшей производительности - неблокирующая
	const processBatchLoad = useCallback(async () => {
		const idsToLoad = Array.from(batchLoadQueue.current);
		batchLoadQueue.current.clear();

		if (idsToLoad.length === 0) return;

		// Обрабатываем очень маленькими батчами для плавности
		const batchSize = 5;

		const processBatch = async (batchIds: string[]) => {
			await Promise.allSettled(
				batchIds.map(async (id) => {
					try {
						const assetInfo = await MediaLibrary.getAssetInfoAsync(id);
						const uri = assetInfo.localUri || assetInfo.uri;
						const finalUri = uri.startsWith('ph://') ? assetInfo.localUri || 'error' : uri;

						const item = mediaItems.find(m => m.id === id);
						if (item) {
							const updatedItem = { ...item, uri: finalUri };
							mediaCache.current.set(id, updatedItem);
						}
					} catch (error) {
						console.warn('Batch load failed for:', id, error);
						const item = mediaItems.find(m => m.id === id);
						if (item) {
							mediaCache.current.set(id, { ...item, uri: 'error' });
						}
					}
				})
			);
		};

		// Обрабатываем батчи с задержками для неблокирующей работы
		for (let i = 0; i < idsToLoad.length; i += batchSize) {
			const batch = idsToLoad.slice(i, i + batchSize);

			await processBatch(batch);

			// Даем UI возможность обновиться между батчами
			if (i + batchSize < idsToLoad.length) {
				await new Promise(resolve => {
					requestAnimationFrame(() => {
						setTimeout(resolve, 0);
					});
				});
			}
		}
	}, [mediaItems]);

	// Предварительная загрузка для видимых элементов + немного вперед
	const preloadVisibleItems = useCallback(async (visibleItems: number[]) => {
		const itemsToLoad = new Set<number>();

		// Добавляем видимые элементы
		visibleItems.forEach(index => itemsToLoad.add(index));

		// Добавляем элементы вперед (предзагрузка)
		const maxVisible = Math.max(...visibleItems);
		for (let i = maxVisible + 1; i <= Math.min(maxVisible + 20, mediaItems.length - 1); i++) {
			itemsToLoad.add(i);
		}

		// Добавляем в батч очередь
		for (const index of itemsToLoad) {
			const item = mediaItems[index];
			if (item && !mediaCache.current.get(item.id)?.uri && !batchLoadQueue.current.has(item.id)) {
				batchLoadQueue.current.add(item.id);
			}
		}

		// Устанавливаем таймер для батчевой загрузки
		if (batchLoadTimer.current) {
			clearTimeout(batchLoadTimer.current);
		}

		batchLoadTimer.current = setTimeout(() => {
			processBatchLoad();
		}, 100); // Задержка 100мс для накопления запросов
	}, [mediaItems, processBatchLoad]);

	useEffect(() => {
		loadMediaMetadata();
	}, [permissionResponse]);

	const expandSheet = useCallback(() => {
		if (bottomSheetRef.current) {
			bottomSheetRef.current.snapToIndex(1);
		}
	}, []);

	useEffect(() => {
		if (isVisible) {
			const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
				if (isVisible) {
					handleClosePress();
					return true;
				}
				return false;
			});

			return () => {
				backHandler.remove();
			};
		}

		return undefined;
	}, [isVisible]);

	const handleSheetChanges = useCallback((index: number) => {
		if (index === -1) {
			MediaPickerState.isOpen = false;
			onClose();
		} else {
			MediaPickerState.isOpen = true;
		}
	}, [onClose]);

	const handleSheetAnimate = useCallback((fromIndex: number, toIndex: number) => {
		if (userSwipeDirection.current === 'up' && fromIndex === 0 && toIndex === 0) {
			setTimeout(() => {
				expandSheet();
			}, 100);
		}
	}, [expandSheet]);

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

	const handleMediaPress = useCallback((item: MediaItem) => {
		setSelectedMedia(prev => {
			const exists = prev.find(media => media.id === item.id);
			if (exists) {
				return prev.filter(media => media.id !== item.id);
			}
			if (!multiple && prev.length == 1) return prev;
			if (prev.length < maxSelections) {
				return [...prev, item];
			}
			return prev;
		});
	}, [multiple, maxSelections, onSelectMedia, onClose]);

	const getSelectedIndex = useCallback((itemId: string) => {
		const index = selectedMedia.findIndex(media => media.id === itemId);
		return index !== -1 ? index + 1 : null;
	}, [selectedMedia]);

	const onSelectPress = (event: GestureResponderEvent, item: MediaItem) => {
		event.preventDefault();
		event.stopPropagation();
		handleMediaPress(item);
	};

	const resetStates = useCallback(() => {
		setSelectedMedia([]);
		setFullscreenImage(null);
		setFullscreenItemId(null);
		setFullscreenItemPosition(null);
		setIsAnimatingOpen(false);
		setIsAnimatingClose(false);
		setEditedImages(new Map());
		setIsRotating(false);
		setIsImageEditMode(false);
		setIsImageLoaded(false);
		setIsSaving(false);
		setSelectedAspectRatio(null);
		setIsResizing(false);
		setIsMoving(false);
		setIsVideoPlaying(false);
		setCurrentVideoUri(null);
		setIsLoadingMore(false);
		setHasNextPage(true);
		setNextCursor(undefined);

		// Очищаем кеш и таймеры
		mediaCache.current.clear();
		loadingPromises.current.clear();
		batchLoadQueue.current.clear();
		if (batchLoadTimer.current) {
			clearTimeout(batchLoadTimer.current);
			batchLoadTimer.current = null;
		}
		if (preloadDebounceTimer.current) {
			clearTimeout(preloadDebounceTimer.current);
			preloadDebounceTimer.current = null;
		}
	}, []);

	useImperativeHandle(ref, () => ({ resetStates }));

	const handleClosePress = useCallback(() => {
		if (bottomSheetRef.current) {
			bottomSheetRef.current.close();
		}
		if (needAutoReset) resetStates();
	}, [resetStates]);

	const handleDonePress = useCallback(async () => {
		if (selectedMedia.length == 0) {
			handleClosePress();
			return;
		}
		if (!onFinish) return;

		const mediaWithFiles: MediaItem[] = await Promise.all(selectedMedia.map(async (media) => {
			// Получаем расширение файла из URI
			const extension = media.uri.split('.').pop() || 'jpg';
			const fileName = `image_${Date.now()}.${extension}`;

			// Определяем тип файла на основе расширения
			const mimeType = extension.toLowerCase() === 'png' ? 'image/png' : 'image/jpeg';

			return {
				...media,
				file: {
					uri: media.uri,
					type: mimeType,
					name: fileName
				}
			};
		}));

		console.log("[MediaPickerUi] Selected files:", mediaWithFiles);
		setMediaResult(mediaWithFiles);
		onFinish(selectedMedia);
		handleClosePress();
	}, [selectedMedia, onFinish, handleClosePress]);

	const handleTouchStart = useCallback((e: GestureResponderEvent) => {
		userSwipeDirection.current = null;
		touchStartY.current = e.nativeEvent.pageY;
	}, []);

	const handleTouchMove = useCallback((e: GestureResponderEvent) => {
		const currentY = e.nativeEvent.pageY;
		const diffY = currentY - touchStartY.current;

		if (diffY < -20) {
			userSwipeDirection.current = 'up';
			if (isAtTop.current) {
				expandSheet();
			}
		} else if (diffY > 20) {
			userSwipeDirection.current = 'down';
			if (isAtTop.current) {
				handleClosePress();
				return true;
			}
		}
		return false;
	}, [expandSheet, handleClosePress]);

	// Дебаунс для предзагрузки
	const preloadDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
		const offsetY = event.nativeEvent.contentOffset.y;
		const contentHeight = event.nativeEvent.contentSize.height;
		const scrollViewHeight = event.nativeEvent.layoutMeasurement.height;

		isAtTop.current = offsetY <= 0;
		const velocity = event.nativeEvent.velocity?.y || 0;
		isScrollingDown.current = velocity > 0;

		// Оптимизация: загружаем больше медиа когда достигаем 85% скролла
		const scrollPercentage = (offsetY + scrollViewHeight) / contentHeight;
		if (scrollPercentage > 0.85 && hasNextPage && !isLoadingMore) {
			// Загружаем в следующем кадре чтобы не блокировать скролл
			requestAnimationFrame(() => {
				loadMediaMetadata(true);
			});
		}

		// Дебаунсим предзагрузку для плавности скролла
		if (preloadDebounceTimer.current) {
			clearTimeout(preloadDebounceTimer.current);
		}

		preloadDebounceTimer.current = setTimeout(() => {
			// Определяем видимые элементы для предзагрузки
			const startIndex = Math.floor(offsetY / imageSize) * numColumns;
			const endIndex = Math.min(
				Math.ceil((offsetY + scrollViewHeight) / imageSize) * numColumns + numColumns,
				mediaItems.length - 1
			);

			const newVisibleItems: number[] = [];
			for (let i = Math.max(0, startIndex); i <= endIndex; i++) {
				newVisibleItems.push(i);
			}

			// Предзагружаем видимые элементы в следующем кадре
			if (newVisibleItems.length > 0) {
				requestAnimationFrame(() => {
					preloadVisibleItems(newVisibleItems);
				});
			}
		}, 150); // Дебаунс 150мс
	}, [hasNextPage, isLoadingMore, loadMediaMetadata, mediaItems.length, preloadVisibleItems]);

	const handleScrollBeginDrag = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
		const offsetY = event.nativeEvent.contentOffset.y;
		isAtTop.current = offsetY <= 0;

		const velocity = event.nativeEvent.velocity?.y || 0;
		if (isAtTop.current) {
			if (velocity < 0) {
				expandSheet();
			} else if (velocity > 0) {
				handleClosePress();
			}
		}
	}, [expandSheet, handleClosePress]);

	const panResponder = useMemo(() => PanResponder.create({
		onStartShouldSetPanResponder: () => true,
		onMoveShouldSetPanResponder: (e, gestureState) => {
			if (isAtTop.current && gestureState.dy > 10) {
				return true;
			}
			return false;
		},
		onPanResponderGrant: (e) => {
			touchStartY.current = e.nativeEvent.pageY;
		},
		onPanResponderMove: (e, gestureState) => {
			if (isAtTop.current && gestureState.dy > 20) {
				handleClosePress();
				return true;
			}
			return false;
		},
		onPanResponderRelease: () => {
		}
	}), [handleClosePress]);

	const openFullscreenImage = useCallback((item: MediaItem, position: { x: number, y: number, width: number, height: number; }) => {
		setFullscreenImage(item.uri);
		setFullscreenItemId(item.id);
		setFullscreenItemPosition(position);
		setIsAnimatingOpen(true);

		const scaleX = imageSize / windowWidth;
		const scaleY = imageSize / windowHeight;
		const initialScale = Math.min(scaleX, scaleY);
		const translateX = position.x + (imageSize / 2) - (windowWidth / 2);
		const translateY = position.y + (imageSize / 2) - (windowHeight / 2);

		animatedValues.scale.setValue(initialScale);
		animatedValues.translateX.setValue(translateX);
		animatedValues.translateY.setValue(translateY);
		animatedValues.opacity.setValue(0);

		Animated.parallel([
			Animated.spring(animatedValues.scale, {
				toValue: 1,
				useNativeDriver: true,
				friction: 8,
				tension: 40,
			}),
			Animated.spring(animatedValues.translateX, {
				toValue: 0,
				useNativeDriver: true,
				friction: 8,
				tension: 40,
			}),
			Animated.spring(animatedValues.translateY, {
				toValue: 0,
				useNativeDriver: true,
				friction: 8,
				tension: 40,
			}),
			Animated.timing(animatedValues.opacity, {
				toValue: 1,
				duration: 250,
				useNativeDriver: true
			})
		]).start(() => {
			setIsAnimatingOpen(false);
		});

	}, [windowWidth, windowHeight, animatedValues]);

	const closeFullscreenImage = useCallback((targetPosition?: { x: number, y: number, width: number, height: number; }) => {
		const position = targetPosition || fullscreenItemPosition;

		setIsAnimatingClose(true);

		if (position) {
			const scaleX = imageSize / windowWidth;
			const scaleY = imageSize / windowHeight;
			const scale = Math.min(scaleX, scaleY);
			const translateX = position.x + (imageSize / 2) - (windowWidth / 2);
			const translateY = position.y + (imageSize / 2) - (windowHeight / 2);

			Animated.parallel([
				Animated.spring(animatedValues.scale, {
					toValue: scale,
					useNativeDriver: true,
					friction: 8,
					tension: 40,
				}),
				Animated.spring(animatedValues.translateX, {
					toValue: translateX,
					useNativeDriver: true,
					friction: 8,
					tension: 40,
				}),
				Animated.spring(animatedValues.translateY, {
					toValue: translateY,
					useNativeDriver: true,
					friction: 8,
					tension: 40,
				}),
				Animated.timing(animatedValues.opacity, {
					toValue: 0,
					duration: 200,
					useNativeDriver: true
				})
			]).start(() => {
				setIsAnimatingClose(false);
				setFullscreenImage(null);
				setFullscreenItemId(null);
				setFullscreenItemPosition(null);
			});
		}
	}, [fullscreenItemPosition, windowWidth, windowHeight, animatedValues]);

	const fullscreenPanResponder = useMemo(() => PanResponder.create({
		onStartShouldSetPanResponder: () => true,
		onMoveShouldSetPanResponder: (_, gestureState) => {
			return Math.abs(gestureState.dy) > 10;
		},
		onPanResponderMove: (_, gestureState) => {
			if (gestureState.dy > 0) {
				animatedValues.translateY.setValue(gestureState.dy);
				const opacity = Math.max(0, 1 - (gestureState.dy / 300));
				animatedValues.opacity.setValue(opacity);
			}
		},
		onPanResponderRelease: (_, gestureState: PanResponderGestureState) => {
			if (gestureState.dy > 100 || gestureState.vy > 0.5) {
				closeFullscreenImage();
			} else {
				Animated.parallel([
					Animated.spring(animatedValues.translateY, {
						toValue: 0,
						useNativeDriver: true,
						friction: 8
					}),
					Animated.timing(animatedValues.opacity, {
						toValue: 1,
						duration: 200,
						useNativeDriver: true
					})
				]).start();
			}
		}
	}), [animatedValues, closeFullscreenImage]);

	const closeVideoPlayer = useCallback(() => {
		setIsVideoPlaying(false);
		setCurrentVideoUri(null);
		if (videoRef.current) {
			try {
				videoRef.current.pauseAsync();
			} catch (error) {
				console.warn('Error pausing video:', error);
			}
		}
	}, []);

	const videoPanResponder = useMemo(() => PanResponder.create({
		onStartShouldSetPanResponder: () => true,
		onMoveShouldSetPanResponder: (_, gestureState) => {
			return Math.abs(gestureState.dy) > 10;
		},
		onPanResponderMove: (_, gestureState) => {
			// Allow swipe down to close
			if (gestureState.dy > 0) {
				// You can add animation here if needed
			}
		},
		onPanResponderRelease: (_, gestureState: PanResponderGestureState) => {
			if (gestureState.dy > 100 || gestureState.vy > 0.5) {
				closeVideoPlayer();
			}
		}
	}), [closeVideoPlayer]);

	const measureItemPosition = useCallback((view: View, callback: (position: { x: number, y: number, width: number, height: number; }) => void) => {
		if (!view) return;

		view.measure((x, y, width, height, pageX, pageY) => {
			callback({
				x: pageX,
				y: pageY,
				width: imageSize,
				height: imageSize
			});
		});
	}, []);

	const startEditing = useCallback((aspectRatio: AspectRatio | null = null) => {
		if (!fullscreenImage) return;

		setIsImageEditMode(true);
		setSelectedAspectRatio(aspectRatio);

		if (aspectRatio?.value) {
			const centerX = cropArea.x + cropArea.width / 2;
			const centerY = cropArea.y + cropArea.height / 2;

			let newWidth = cropArea.width;
			let newHeight = cropArea.width / aspectRatio.value;

			if (newHeight > windowHeight * 0.6) {
				newHeight = windowHeight * 0.6;
				newWidth = newHeight * aspectRatio.value;
			}

			if (newWidth > windowWidth * 0.9) {
				newWidth = windowWidth * 0.9;
				newHeight = newWidth / aspectRatio.value;
			}

			const newX = centerX - newWidth / 2;
			const newY = centerY - newHeight / 2;

			const adjustedCropArea = {
				x: Math.max(0, Math.min(windowWidth - newWidth, newX)),
				y: Math.max(0, Math.min(windowHeight - newHeight - 200, newY)),
				width: newWidth,
				height: newHeight
			};

			setCropArea(adjustedCropArea);
			cropTranslateX.setValue(adjustedCropArea.x);
			cropTranslateY.setValue(adjustedCropArea.y);
			cropWidth.setValue(adjustedCropArea.width);
			cropHeight.setValue(adjustedCropArea.height);
		} else {
			const initialWidth = Math.min(300, windowWidth * 0.8);
			const initialHeight = Math.min(300, windowHeight * 0.5);

			const newCropArea = {
				x: (windowWidth - initialWidth) / 2,
				y: 100,
				width: initialWidth,
				height: initialHeight
			};

			setCropArea(newCropArea);
			cropTranslateX.setValue(newCropArea.x);
			cropTranslateY.setValue(newCropArea.y);
			cropWidth.setValue(newCropArea.width);
			cropHeight.setValue(newCropArea.height);
		}
	}, [cropArea, windowWidth, windowHeight, fullscreenImage, cropTranslateX, cropTranslateY, cropWidth, cropHeight]);

	const handleEditPress = useCallback(() => {
		if (fullscreenImage) {
			startEditing(null);
		}
	}, [fullscreenImage, startEditing]);

	const cancelEditing = useCallback(() => {
		setIsImageEditMode(false);
		setSelectedAspectRatio(null);
	}, []);

	const handleSaveEditedImage = useCallback(async () => {
		if (isSaving || !fullscreenImage) return;

		setIsSaving(true);

		try {
			let finalImageUri = fullscreenImage;
			let finalCroppedArea = cropArea;

			const manipResult = await ImageManipulator.manipulateAsync(
				fullscreenImage,
				[{
					crop: {
						originX: cropArea.x,
						originY: cropArea.y,
						width: cropArea.width,
						height: cropArea.height
					}
				}],
				{ compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
			);

			finalImageUri = manipResult.uri;
			finalCroppedArea = {
				x: 0,
				y: 0,
				width: manipResult.width,
				height: manipResult.height
			};

			const croppedAreaResult: CroppedArea = {
				x: finalCroppedArea.x,
				y: finalCroppedArea.y,
				width: finalCroppedArea.width,
				height: finalCroppedArea.height
			};

			const newEditedImages = new Map(editedImages);
			newEditedImages.set(fullscreenImage, {
				uri: finalImageUri,
				croppedArea: croppedAreaResult
			});
			setEditedImages(newEditedImages);

			const selectedIndex = selectedMedia.findIndex(item => item.uri === fullscreenImage);
			if (selectedIndex !== -1) {
				const updatedMedia = [...selectedMedia];
				updatedMedia[selectedIndex] = { ...updatedMedia[selectedIndex], uri: finalImageUri };
				setSelectedMedia(updatedMedia);
			}

			setFullscreenImage(finalImageUri);

			setIsImageEditMode(false);
			setSelectedAspectRatio(null);
			setIsSaving(false);
		} catch (error) {
			console.log('Ошибка сохранения', error);
			setIsSaving(false);
		}
	}, [fullscreenImage, cropArea, isSaving, editedImages, selectedMedia]);

	const rotateImage = useCallback(async () => {
		if (!fullscreenImage || isRotating) return;

		setIsRotating(true);

		try {
			const manipResult = await ImageManipulator.manipulateAsync(
				fullscreenImage,
				[{ rotate: 90 }],
				{ compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
			);

			setFullscreenImage(manipResult.uri);

			if (fullscreenItemId) {
				const newEditedImages = new Map(editedImages);
				newEditedImages.set(fullscreenImage, {
					uri: manipResult.uri,
					croppedArea: { x: 0, y: 0, width: manipResult.width, height: manipResult.height }
				});
				setEditedImages(newEditedImages);

				const selectedIndex = selectedMedia.findIndex(item => item.uri === fullscreenImage);
				if (selectedIndex !== -1) {
					const updatedMedia = [...selectedMedia];
					updatedMedia[selectedIndex] = { ...updatedMedia[selectedIndex], uri: manipResult.uri };
					setSelectedMedia(updatedMedia);
				}
			}
		} catch (error) {
			console.log('Ошибка вращения изображения:', error);
		} finally {
			setIsRotating(false);
		}
	}, [fullscreenImage, fullscreenItemId, isRotating, editedImages, selectedMedia]);

	const cropPanResponder = React.useRef(
		PanResponder.create({
			onStartShouldSetPanResponder: () => true,
			onMoveShouldSetPanResponder: (_, gestureState) => {
				return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
			},
			onPanResponderGrant: () => {
				if (isImageEditMode) {
					setIsMoving(true);
				}
			},
			onPanResponderMove: (_, gestureState) => {
				if (isMoving && isImageEditMode) {
					const newX = Math.max(0, Math.min(windowWidth - cropArea.width, cropArea.x + gestureState.dx));
					const newY = Math.max(0, Math.min(windowHeight - cropArea.height - 200, cropArea.y + gestureState.dy));

					cropTranslateX.setValue(newX);
					cropTranslateY.setValue(newY);

					setCropArea(prev => ({
						...prev,
						x: newX,
						y: newY
					}));
				}
			},
			onPanResponderRelease: () => {
				setIsMoving(false);
			}
		})
	).current;

	const cornerResponders = {
		topLeft: React.useRef(
			PanResponder.create({
				onStartShouldSetPanResponder: () => isImageEditMode,
				onMoveShouldSetPanResponder: () => isImageEditMode,
				onPanResponderGrant: () => {
					setIsResizing(true);
				},
				onPanResponderMove: (_, gestureState) => {
					if (isResizing && isImageEditMode) {
						let newX = Math.max(0, Math.min(cropArea.x + cropArea.width - 100, cropArea.x + gestureState.dx));
						let newY = Math.max(0, Math.min(cropArea.y + cropArea.height - 100, cropArea.y + gestureState.dy));
						let newWidth = cropArea.width - (newX - cropArea.x);
						let newHeight = cropArea.height - (newY - cropArea.y);

						if (selectedAspectRatio?.value) {
							const ratio = selectedAspectRatio.value;
							if (Math.abs(gestureState.dx) > Math.abs(gestureState.dy)) {
								newHeight = newWidth / ratio;
							} else {
								newWidth = newHeight * ratio;
							}

							newX = cropArea.x + cropArea.width - newWidth;
						}

						cropTranslateX.setValue(newX);
						cropTranslateY.setValue(newY);
						cropWidth.setValue(newWidth);
						cropHeight.setValue(newHeight);

						setCropArea({
							x: newX,
							y: newY,
							width: newWidth,
							height: newHeight
						});
					}
				},
				onPanResponderRelease: () => {
					setIsResizing(false);
				}
			})
		).current,

		topRight: React.useRef(
			PanResponder.create({
				onStartShouldSetPanResponder: () => isImageEditMode,
				onMoveShouldSetPanResponder: () => isImageEditMode,
				onPanResponderGrant: () => {
					setIsResizing(true);
				},
				onPanResponderMove: (_, gestureState) => {
					if (isResizing && isImageEditMode) {
						let newY = Math.max(0, Math.min(cropArea.y + cropArea.height - 100, cropArea.y + gestureState.dy));
						let newWidth = Math.max(100, Math.min(windowWidth - cropArea.x, cropArea.width + gestureState.dx));
						let newHeight = cropArea.height - (newY - cropArea.y);

						if (selectedAspectRatio?.value) {
							const ratio = selectedAspectRatio.value;
							if (Math.abs(gestureState.dx) > Math.abs(gestureState.dy)) {
								newHeight = newWidth / ratio;
								newY = cropArea.y + cropArea.height - newHeight;
							} else {
								newWidth = newHeight * ratio;
							}
						}

						cropTranslateY.setValue(newY);
						cropWidth.setValue(newWidth);
						cropHeight.setValue(newHeight);

						setCropArea({
							...cropArea,
							y: newY,
							width: newWidth,
							height: newHeight
						});
					}
				},
				onPanResponderRelease: () => {
					setIsResizing(false);
				}
			})
		).current,

		bottomLeft: React.useRef(
			PanResponder.create({
				onStartShouldSetPanResponder: () => isImageEditMode,
				onMoveShouldSetPanResponder: () => isImageEditMode,
				onPanResponderGrant: () => {
					setIsResizing(true);
				},
				onPanResponderMove: (_, gestureState) => {
					if (isResizing && isImageEditMode) {
						let newX = Math.max(0, Math.min(cropArea.x + cropArea.width - 100, cropArea.x + gestureState.dx));
						let newWidth = cropArea.width - (newX - cropArea.x);
						let newHeight = Math.max(100, Math.min(windowHeight - cropArea.y - 200, cropArea.height + gestureState.dy));

						if (selectedAspectRatio?.value) {
							const ratio = selectedAspectRatio.value;
							if (Math.abs(gestureState.dx) > Math.abs(gestureState.dy)) {
								newHeight = newWidth / ratio;
							} else {
								newWidth = newHeight * ratio;
								newX = cropArea.x + cropArea.width - newWidth;
							}
						}

						cropTranslateX.setValue(newX);
						cropWidth.setValue(newWidth);
						cropHeight.setValue(newHeight);

						setCropArea({
							...cropArea,
							x: newX,
							width: newWidth,
							height: newHeight
						});
					}
				},
				onPanResponderRelease: () => {
					setIsResizing(false);
				}
			})
		).current,

		bottomRight: React.useRef(
			PanResponder.create({
				onStartShouldSetPanResponder: () => isImageEditMode,
				onMoveShouldSetPanResponder: () => isImageEditMode,
				onPanResponderGrant: () => {
					setIsResizing(true);
				},
				onPanResponderMove: (_, gestureState) => {
					if (isResizing && isImageEditMode) {
						let newWidth = Math.max(100, Math.min(windowWidth - cropArea.x, cropArea.width + gestureState.dx));
						let newHeight = Math.max(100, Math.min(windowHeight - cropArea.y - 200, cropArea.height + gestureState.dy));

						if (selectedAspectRatio?.value) {
							const ratio = selectedAspectRatio.value;
							if (Math.abs(gestureState.dx) > Math.abs(gestureState.dy)) {
								newHeight = newWidth / ratio;
							} else {
								newWidth = newHeight * ratio;
							}
						}

						cropWidth.setValue(newWidth);
						cropHeight.setValue(newHeight);

						setCropArea({
							...cropArea,
							width: newWidth,
							height: newHeight
						});
					}
				},
				onPanResponderRelease: () => {
					setIsResizing(false);
				}
			})
		).current
	};

	const handleImageLoad = useCallback(() => {
		setIsImageLoaded(true);
	}, []);

	const playVideo = useCallback(async (uri: string) => {
		try {
			setCurrentVideoUri(uri);
			setIsVideoPlaying(true);
		} catch (error) {
			console.error('Error playing video:', error);
		}
	}, []);



	const formatDuration = useCallback((duration?: number) => {
		if (!duration) return '';
		const minutes = Math.floor(duration / 60);
		const seconds = Math.floor(duration % 60);
		return `${minutes}:${seconds.toString().padStart(2, '0')}`;
	}, []);

	if (!isVisible) return null;

	return (
		<Portal>
			<GestureHandlerRootView>
				<View style={styles.container}>
					<BottomSheet
						ref={bottomSheetRef}
						snapPoints={snapPoints}
						backgroundStyle={styles.bottomSheet}
						onChange={handleSheetChanges}
						backdropComponent={renderBackdrop}
						enablePanDownToClose={true}
						onClose={onClose}
						index={0}
						enableContentPanningGesture={true}
						enableHandlePanningGesture={true}
						handleStyle={{
							backgroundColor: currentTheme.bgTheme.background as string,
							borderTopLeftRadius: 15,
							borderTopRightRadius: 15,
						}}
						handleIndicatorStyle={{ display: 'none' }}
						handleComponent={() => null}
						animateOnMount={true}
						android_keyboardInputMode="adjustResize"
						onAnimate={handleSheetAnimate}
					>
						<View style={{ flex: 1 }}>

							<BottomSheetView style={styles.contentContainer}>
								<View
									style={styles.titleContainer}
								>
									<SimpleButtonUi
										onPress={handleClosePress}
										style={styles.titleContainerLeft}
									>
										<Ionicons
											name="close"
											size={24}
											color={currentTheme.originalMainGradientColor.color as string}
										/>
									</SimpleButtonUi>

									<MainText
										fontWeight='bold'
										tac='center'
										width={"100%"}
									>
										{t("media_picker_sort_latest")}
									</MainText>

									{/* TODO: Добавить нижний бар */}
									<SimpleButtonUi
										onPress={handleDonePress}
										style={styles.titleContainerRight}
									>
										<MainText style={{ color: currentTheme.originalMainGradientColor.color as string }}>
											{t("ready")} {!multiple && selectedMedia?.length == 1 && `(${selectedMedia.length})`}
										</MainText>
									</SimpleButtonUi>
								</View>

								<View
									{...panResponder.panHandlers}
									style={{ flex: 1, height: windowHeight }}
								>
									{isInitialLoading ? (
										<View style={styles.loadingContainer}>
											<ActivityIndicator
												size="large"
												color={currentTheme.originalMainGradientColor.color as string}
											/>
											<MainText style={[styles.loadingText, { color: currentTheme.textColor.color as string, marginTop: 16 }]}>
												{t("loading")} медиафайлов...
											</MainText>
										</View>
									) : (
										<FlashList
											ref={flashListRef}
											data={mediaItems}
											keyExtractor={(item: MediaItem) => item.id}
											numColumns={numColumns}
											contentContainerStyle={styles.listContent}
											onScroll={handleScroll}
											onScrollBeginDrag={handleScrollBeginDrag}
											onTouchStart={handleTouchStart}
											onTouchMove={handleTouchMove as any}
											scrollEventThrottle={32}
											estimatedItemSize={imageSize}
											drawDistance={windowHeight * 2}
											extraData={selectedMedia}
											ListFooterComponent={() => (
												isLoadingMore ? (
													<View style={styles.loadingContainer}>
														<ActivityIndicator
															size="large"
															color={currentTheme.originalMainGradientColor.color as string}
														/>
														<MainText style={[styles.loadingText, { color: currentTheme.textColor.color as string }]}>
															{t("loading")}...
														</MainText>
													</View>
												) : null
											)}
											renderItem={({ item, index }: { item: MediaItem; index: number; }) => (
												<MediaItemComponent
													item={item}
													imageSize={imageSize}
													onPress={() => {
														const itemView = item.ref?.current;
														if (itemView) {
															measureItemPosition(itemView, (position) => {
																openFullscreenImage(item, position);
															});
														}
													}}
													onSelectPress={(event) => onSelectPress(event, item)}
													selectedIndex={getSelectedIndex(item.id)}
													isEdited={editedImages.has(item.uri)}
													onPlayVideo={playVideo}
													formatDuration={formatDuration}
													loadMediaUri={loadMediaUri}
												/>
											)}
										/>
									)}
								</View>
							</BottomSheetView>
						</View>
					</BottomSheet>

					{fullscreenImage && (
						<Animated.View
							style={[
								styles.fullscreenContainer
							]}
							{...fullscreenPanResponder.panHandlers}
						>
							<Animated.View
								style={[
									styles.fullscreenOverlay,
									{
										opacity: animatedValues.opacity
									}
								]}
							>

								<Animated.View
									style={[
										styles.fullscreenImageContainer,
										{
											transform: [
												{ translateX: animatedValues.translateX },
												{ translateY: animatedValues.translateY },
												{ scale: animatedValues.scale }
											],
											zIndex: 1000
										}
									]}
								>
									<CleverImage
										source={fullscreenImage}
										imageStyles={styles.fullscreenImage}
										withoutWrapper={true}
										onImageLoad={handleImageLoad}
									/>

									{isImageEditMode && isImageLoaded && (
										<>
											<Animated.View
												style={[
													styles.cropArea,
													{
														left: cropTranslateX,
														top: cropTranslateY,
														width: cropWidth,
														height: cropHeight
													}
												]}
												{...cropPanResponder.panHandlers}
											>
												<TouchableOpacity
													style={[styles.corner, styles.topLeft]}
													{...cornerResponders.topLeft.panHandlers}
												/>
												<TouchableOpacity
													style={[styles.corner, styles.topRight]}
													{...cornerResponders.topRight.panHandlers}
												/>
												<TouchableOpacity
													style={[styles.corner, styles.bottomLeft]}
													{...cornerResponders.bottomLeft.panHandlers}
												/>
												<TouchableOpacity
													style={[styles.corner, styles.bottomRight]}
													{...cornerResponders.bottomRight.panHandlers}
												/>

												<View style={[styles.edge, styles.topEdge]} />
												<View style={[styles.edge, styles.rightEdge]} />
												<View style={[styles.edge, styles.bottomEdge]} />
												<View style={[styles.edge, styles.leftEdge]} />
											</Animated.View>
										</>
									)}
								</Animated.View>

								<View
									style={[
										styles.fullscreenHeader,
										{
											opacity: 1
										}
									]}
								>
									<SimpleButtonUi
										onPress={() => {
											if (isImageEditMode) {
												cancelEditing();
												return;
											}
											if (fullscreenItemId) {
												const currentItem = mediaItems.find(item => item.id === fullscreenItemId);
												if (currentItem && currentItem.ref?.current) {
													measureItemPosition(currentItem.ref.current, (position) => {
														closeFullscreenImage(position);
													});
													return;
												}
											}
											closeFullscreenImage();
										}}
										style={styles.fullscreenCloseButton}
									>
										<Ionicons
											name="close"
											size={28}
											color={'white'}
										/>
									</SimpleButtonUi>

									{!isImageEditMode && (
										<SimpleButtonUi
											style={styles.fullscreenEditButton}
											onPress={handleEditPress}
										>
											<Ionicons
												name="resize"
												size={24}
												color={'white'}
											/>
										</SimpleButtonUi>
									)}
								</View>

								{isImageEditMode ? (
									<View style={styles.fullscreenFooter}>
										<SimpleButtonUi style={styles.footerButton} onPress={cancelEditing}>
											<Ionicons
												name="close-circle-outline"
												size={24}
												color={'white'}
											/>
											<MainText style={styles.footerButtonText}>Отмена</MainText>
										</SimpleButtonUi>

										<ScrollView
											horizontal
											showsHorizontalScrollIndicator={false}
											contentContainerStyle={styles.toolbarContainer}
										>
											{aspectRatios.map((ratio) => (
												<TouchableOpacity
													key={ratio.name}
													style={[
														styles.toolButton,
														selectedAspectRatio?.name === ratio.name && styles.selectedTool
													]}
													activeOpacity={0.7}
													onPress={() => startEditing(ratio)}
												>
													<Ionicons
														name={ratio.icon}
														size={28}
														color={'white'}
													/>
													<MainText style={[styles.toolButtonText, { color: 'white' }]}>
														{ratio.label}
													</MainText>
												</TouchableOpacity>
											))}
										</ScrollView>

										<SimpleButtonUi style={styles.footerButton} onPress={handleSaveEditedImage}>
											{isSaving ? (
												<ActivityIndicator size="small" color="white" />
											) : (
												<>
													<Ionicons
														name="checkmark-circle-outline"
														size={24}
														color={'white'}
													/>
													<MainText style={styles.footerButtonText}>Готово</MainText>
												</>
											)}
										</SimpleButtonUi>
									</View>
								) : (
									<View style={styles.fullscreenFooter}>
										<SimpleButtonUi
											style={styles.footerButton}
											onPress={handleEditPress}
										>
											<Ionicons
												name="crop"
												size={24}
												color={'white'}
											/>
											<MainText style={styles.footerButtonText}>Обрезать</MainText>
										</SimpleButtonUi>

										<SimpleButtonUi
											style={styles.footerButton}
											onPress={() => {
												if (fullscreenImage && fullscreenItemId) {
													rotateImage();
												}
											}}
										>
											{isRotating ? (
												<View style={{ justifyContent: 'center', alignItems: 'center' }}>
													<ActivityIndicator size="small" color="white" />
													<MainText style={styles.footerButtonText}>
														Поворот...
													</MainText>
												</View>
											) : (
												<>
													<Ionicons
														name="refresh-outline"
														size={24}
														color={'white'}
													/>
													<MainText style={styles.footerButtonText}>
														Повернуть
													</MainText>
												</>
											)}
										</SimpleButtonUi>

										<SimpleButtonUi
											style={styles.footerButton}
											onPress={() => {
												if (fullscreenImage) {
													// Логика для фильтров
													handleEditPress();
												}
											}}
										>
											<Ionicons
												name="color-filter-outline"
												size={24}
												color={'white'}
											/>
											<MainText style={styles.footerButtonText}>Фильтры</MainText>
										</SimpleButtonUi>

										<SimpleButtonUi
											style={styles.footerButton}
											onPress={() => {
												if (fullscreenItemId) {
													const selectedItem = mediaItems.find(item => item.id === fullscreenItemId);
													if (selectedItem) {
														handleMediaPress(selectedItem);
														closeFullscreenImage();
													}
												}
											}}
										>
											<Ionicons
												name={selectedMedia.some(item => item.id === fullscreenItemId)
													? "checkmark-circle"
													: "add-circle-outline"}
												size={24}
												color={'white'}
											/>
											<MainText style={styles.footerButtonText}>
												{selectedMedia.some(item => item.id === fullscreenItemId)
													? "Выбрано"
													: "Выбрать"}
											</MainText>
										</SimpleButtonUi>
									</View>
								)}
							</Animated.View>
						</Animated.View>
					)}

					{/* Video Player Modal */}
					{isVideoPlaying && currentVideoUri && (
						<View style={styles.videoPlayerModal} {...videoPanResponder.panHandlers}>
							<TouchableOpacity
								style={styles.videoCloseButton}
								onPress={closeVideoPlayer}
							>
								<Ionicons name="close" size={30} color="white" />
							</TouchableOpacity>
							<Video
								ref={videoRef}
								source={{ uri: currentVideoUri }}
								style={styles.videoPlayer}
								useNativeControls
								resizeMode={ResizeMode.CONTAIN}
								shouldPlay
								isLooping
								{...videoPanResponder.panHandlers}
							/>
						</View>
					)}
				</View>
			</GestureHandlerRootView>
		</Portal>
	);
}));

const styles = StyleSheet.create({
	selectBtn: {
		borderRadius: 1000,
		borderWidth: 1.25,
		borderColor: "white",
		position: 'absolute',
		right: 8,
		top: 5,
		height: 25,
		width: 25,
		justifyContent: 'center',
		alignItems: 'center',
		overflow: 'hidden'
	},
	container: {
		position: 'absolute',
		left: 0,
		right: 0,
		bottom: 0,
		top: 0,
		zIndex: 9999,
		elevation: 9999,
	},
	bottomSheet: {
		backgroundColor: themeStore.currentTheme.bgTheme.background as string,
		shadowColor: changeRgbA(themeStore.currentTheme.secondTextColor.color as string, "0.2"),
		shadowOffset: { width: 0, height: -3 },
		shadowOpacity: 0.27,
		shadowRadius: 4.65,
		elevation: 6,
	},
	contentContainer: {
		flex: 1,
		paddingBottom: 80,
	},
	titleContainer: {
		justifyContent: 'center',
		alignItems: 'center',
		height: 50,
		position: 'relative'
	},
	title: {
		flex: 1,
		textAlign: 'center',
		fontSize: 16,
		fontWeight: 'bold',
	},
	handleIndicator: {
		backgroundColor: darkenRGBA(themeStore.currentTheme.bgTheme.background as string, -1),
		width: 40,
		borderRadius: 2,
	},
	handleContainer: {
		width: '100%',
		height: 20,
		alignItems: 'center',
		justifyContent: 'center',
		paddingTop: 8
	},
	handle: {
		width: 40,
		height: 4,
		backgroundColor: darkenRGBA(themeStore.currentTheme.bgTheme.background as string, -1),
		borderRadius: 2,
	},
	listContent: {
		flexGrow: 1,
		paddingBottom: 20,
	},
	imageWrapper: {
		position: 'relative',
		borderColor: themeStore.currentTheme.bgTheme.background as string,
		borderWidth: 0.5,
		overflow: 'hidden'
	},
	imageContainer: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
	},
	image: {
		width: "100%",
		height: "100%",
		objectFit: "cover"
	},
	editedIndicator: {
		position: 'absolute',
		left: 8,
		top: 8,
		backgroundColor: 'rgba(255, 255, 255, 0.7)',
		borderRadius: 10,
		width: 20,
		height: 20,
		justifyContent: 'center',
		alignItems: 'center',
	},
	selectionIndicator: {
		height: "99.5%",
		width: "99.5%",
		borderRadius: "100%",
		backgroundColor: themeStore.currentTheme.originalMainGradientColor.color as string,
		justifyContent: 'center',
		alignItems: 'center',
		position: 'relative',
	},
	unselectedIndicator: {
		height: "99.5%",
		width: "99.5%",
		borderRadius: "100%",
		backgroundColor: 'transparent',
		borderWidth: 2,
		borderColor: 'white',
		justifyContent: 'center',
		alignItems: 'center',
		position: 'relative',
	},
	selectionNumber: {
		color: '#fff',
		fontSize: 15,
		fontWeight: 'bold',
	},
	footerContainer: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		borderTopWidth: 1,
		borderTopColor: changeRgbA(themeStore.currentTheme.secondTextColor.color as string, "0.1"),
		backgroundColor: themeStore.currentTheme.bgTheme.background as string,
		paddingVertical: 10,
		paddingHorizontal: 16,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingBottom: Platform.OS === 'ios' ? 30 : 10,
	},
	doneButton: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 8,
		backgroundColor: themeStore.currentTheme.originalMainGradientColor.color as string,
	},
	doneButtonText: {
		color: '#fff',
		fontWeight: 'bold',
	},
	actionsContainer: {
		flexDirection: 'row',
		paddingBottom: 10,
		paddingHorizontal: 10,
	},
	titleContainerLeft: {
		position: 'absolute',
		left: 15
	},
	titleContainerRight: {
		position: "absolute",
		right: 15
	},
	fullscreenContainer: {
		...StyleSheet.absoluteFillObject,
		zIndex: 10000,
		justifyContent: 'center',
		alignItems: 'center',
	},
	fullscreenOverlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'rgb(0, 0, 0)',
		zIndex: 900
	},
	fullscreenImageContainer: {
		width: '100%',
		height: '100%',
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 1000,
	},
	fullscreenImage: {
		width: '100%',
		height: '100%',
		resizeMode: 'contain',
	},
	fullscreenHeader: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		height: 60 + (Platform.OS === 'ios' ? StatusBar.currentHeight || 44 : 0),
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-end',
		paddingHorizontal: 20,
		paddingBottom: 10,
	},
	fullscreenCloseButton: {
		width: 40,
		height: 40,
		justifyContent: 'center',
		alignItems: 'center',
	},
	fullscreenEditButton: {
		width: 40,
		height: 40,
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 100000,
	},
	fullscreenFooter: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		backgroundColor: 'rgba(0, 0, 0, 0.7)',
		paddingVertical: 15,
		paddingHorizontal: 20,
		flexDirection: 'row',
		justifyContent: 'space-around',
		alignItems: 'center',
		paddingBottom: Platform.OS === 'ios' ? 30 : 15,
		zIndex: 10000,
	},
	footerButton: {
		alignItems: 'center',
		width: 70,
	},
	footerButtonText: {
		fontSize: 12,
		marginTop: 4,
		textAlign: 'center',
		color: 'white',
	},
	toolButton: {
		alignItems: 'center',
		marginHorizontal: 10,
		width: 70,
		paddingVertical: 5,
		borderRadius: 8,
	},
	toolButtonText: {
		fontSize: 12,
		marginTop: 4,
		color: 'white',
	},
	// Стили для редактирования изображения
	cropArea: {
		position: 'absolute',
		borderWidth: 2,
		borderColor: '#fff',
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0.5,
		shadowRadius: 10,
		elevation: 5,
		borderStyle: 'solid',
	},
	corner: {
		position: 'absolute',
		width: 24,
		height: 24,
		borderColor: '#fff',
		backgroundColor: 'rgba(255, 255, 255, 0.2)',
	},
	topLeft: {
		top: -12,
		left: -12,
		borderTopWidth: 4,
		borderLeftWidth: 4,
		borderTopLeftRadius: 12,
	},
	topRight: {
		top: -12,
		right: -12,
		borderTopWidth: 4,
		borderRightWidth: 4,
		borderTopRightRadius: 12,
	},
	bottomLeft: {
		bottom: -12,
		left: -12,
		borderBottomWidth: 4,
		borderLeftWidth: 4,
		borderBottomLeftRadius: 12,
	},
	bottomRight: {
		bottom: -12,
		right: -12,
		borderBottomWidth: 4,
		borderRightWidth: 4,
		borderBottomRightRadius: 12,
	},
	edge: {
		position: 'absolute',
		backgroundColor: 'transparent',
		borderColor: '#fff',
	},
	topEdge: {
		top: -2,
		left: 12,
		right: 12,
		height: 2,
		borderTopWidth: 2,
	},
	rightEdge: {
		top: 12,
		right: -2,
		bottom: 12,
		width: 2,
		borderRightWidth: 2,
	},
	bottomEdge: {
		bottom: -2,
		left: 12,
		right: 12,
		height: 2,
		borderBottomWidth: 2,
	},
	leftEdge: {
		top: 12,
		left: -2,
		bottom: 12,
		width: 2,
		borderLeftWidth: 2,
	},
	selectedTool: {
		backgroundColor: 'rgba(255, 255, 255, 0.2)',
	},
	toolbarContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		paddingHorizontal: 10,
	},
	loadingContainer: {
		width: '100%',
		paddingVertical: 20,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'transparent',
	},
	loadingText: {
		marginTop: 10,
		color: themeStore.currentTheme.secondTextColor.color as string,
	},
	videoPreviewContainer: {
		position: 'relative',
		width: '100%',
		height: '100%',
	},
	playButton: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		borderRadius: 10,
	},
	durationBadge: {
		position: 'absolute',
		bottom: 10,
		left: 10,
		backgroundColor: 'rgba(0, 0, 0, 0.7)',
		borderRadius: 5,
		paddingHorizontal: 5,
		paddingVertical: 2,
	},
	durationText: {
		color: 'white',
		fontSize: 12,
	},
	videoPlayerModal: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: 'rgba(0, 0, 0, 0.9)',
		zIndex: 10000,
		justifyContent: 'center',
		alignItems: 'center',
	},
	videoCloseButton: {
		position: 'absolute',
		top: 40,
		right: 20,
		zIndex: 10001,
	},
	videoPlayer: {
		width: '90%',
		height: '90%',
		backgroundColor: 'transparent',
	},
	loadingPlaceholder: {
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: themeStore.currentTheme.inputTheme.background as string,
	},
	errorPlaceholder: {
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: themeStore.currentTheme.inputTheme.background as string,
	},
});
