import { getIconColor as getIconColorDefault } from '@shared/config/const';
import { themeStore } from '@stores/theme';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
	DimensionValue,
	StyleSheet,
	TouchableOpacity,
	useWindowDimensions,
	View,
	ViewStyle
} from 'react-native';
import Animated, {
	interpolate,
	runOnJS,
	useAnimatedScrollHandler,
	useAnimatedStyle,
	useDerivedValue,
	useSharedValue,
	withTiming
} from 'react-native-reanimated';
import { BlurUi } from '../BlurUi/BlurUi';
import { MainText } from '../MainText/MainText';

export interface TabConfig {
	text?: string;
	icon?: React.ComponentType<{ size?: number; color?: string; }>;
	content: React.ComponentType<any>;
}

interface AnimatedTabsProps {
	tabs: TabConfig[];
	activeTab?: number;
	setActiveTab?: (index: number) => void;
	scrollPosition?: number;
	setScrollPosition?: (position: number) => void;
	getIconColor?: (tabIndex: number, scrollPosition: number, width: number) => string;
	containerStyle?: ViewStyle;
	tabsContainerStyle?: ViewStyle;
	tabStyle?: ViewStyle;
	bouncing?: boolean;
	activeTabStyle?: ViewStyle;
	indicatorStyle?: ViewStyle;
	contentContainerStyle?: ViewStyle;
	contentHeight?: DimensionValue;
	iconSize?: number;
	tabMaxHeight?: number;
	blurView?: boolean;
	intensity?: number;
	noBorderRadius?: boolean;
	onSwap?: (index: number) => void;
}

export const AnimatedTabs = observer(({
	tabs,
	getIconColor = getIconColorDefault,
	containerStyle,
	tabsContainerStyle,
	tabStyle = { paddingVertical: 12 },
	activeTabStyle,
	noBorderRadius = false,
	indicatorStyle,
	blurView = false,
	contentContainerStyle,
	contentHeight,
	intensity = 30,
	iconSize = 20,
	tabMaxHeight,
	onSwap,
	bouncing = true
}: AnimatedTabsProps) => {
	const { currentTheme, getBlurViewBgColor } = themeStore;
	const tabCount = tabs.length;

	const [activeTab, setActiveTab] = useState(0);
	const [scrollPosition, setScrollPosition] = useState(0);

	const { width } = useWindowDimensions();
	const [scrollViewWidth] = useState(width);
	const scrollViewRef = useRef<any>(null);
	const tabWidths = useSharedValue<number[]>(new Array(tabCount).fill(0));
	const textWidthsRef = useRef<number[]>(new Array(tabCount).fill(0));
	const textWidths = useSharedValue<number[]>(new Array(tabCount).fill(0));
	const tabPositions = useSharedValue<number[]>(new Array(tabCount).fill(0));
	const initialScrollDone = useRef(false);
	const scrollPositions = useRef<number[]>(new Array(tabCount).fill(0));
	const lastActiveTab = useRef<number>(activeTab);
	const scrollX = useSharedValue(scrollPosition);
	const indicatorWidth = useSharedValue(width / tabCount);
	const indicatorPosition = useSharedValue(activeTab * (width / tabCount));

	const calculatePositions = useCallback(() => {
		let position = 0;
		tabPositions.value = tabWidths.value.map((tabWidth) => {
			const prevPosition = position;
			position += tabWidth;
			return prevPosition;
		});
	}, []);

	const updateIndicator = useCallback((index: number) => {
		if (index < 0 || index >= tabCount) return;

		const textWidth = textWidths.value[index];
		const textX = tabPositions.value[index];

		indicatorWidth.value = withTiming(textWidth, { duration: 300 });
		indicatorPosition.value = withTiming(textX, { duration: 300 });
	}, [tabPositions, textWidths, tabCount]);

	const handleTextLayout = useCallback((index: number, layoutX: number, width: number) => {
		textWidthsRef.current[index] = width;
		textWidths.value = [...textWidthsRef.current];

		tabPositions.value[index] = layoutX;

		calculatePositions();

		if (index === activeTab || (activeTab === 0 && index === 0)) {
			requestAnimationFrame(() => {
				updateIndicator(index);
			});
		}
	}, [activeTab, calculatePositions, updateIndicator]);

	useEffect(() => {
		if (lastActiveTab.current !== activeTab) {
			updateIndicator(activeTab);
			lastActiveTab.current = activeTab;
		}
	}, [activeTab, updateIndicator]);

	useEffect(() => {
		if (!initialScrollDone.current && scrollViewRef.current) {
			const timer = setTimeout(() => {
				scrollViewRef.current?.scrollTo({ x: activeTab * width, animated: false });
				initialScrollDone.current = true;

				requestAnimationFrame(() => {
					updateIndicator(activeTab);
				});
			}, 100);

			return () => clearTimeout(timer);
		}
	}, [activeTab, updateIndicator, width]);

	useEffect(() => {
		if (initialScrollDone.current && scrollViewRef.current && scrollPositions.current[activeTab] > 0) {
			const savedScrollPosition = scrollPositions.current[activeTab];
			const tabPosition = Math.round(savedScrollPosition / scrollViewWidth) * scrollViewWidth;

			const finalPosition = Math.abs(savedScrollPosition - tabPosition) < 10 ? tabPosition : savedScrollPosition;

			scrollViewRef.current?.scrollTo({ x: finalPosition, animated: false });
		}
	}, [activeTab, scrollViewWidth]);

	useDerivedValue(() => {
		const scrollProgress = scrollX.value / scrollViewWidth;
		const currentIndex = Math.floor(scrollProgress);
		const nextIndex = Math.min(currentIndex + 1, tabCount - 1);
		const progress = scrollProgress - currentIndex;

		if (currentIndex < 0 || nextIndex < 0 || currentIndex >= tabCount || nextIndex >= tabCount) {
			return;
		}

		const currentTabWidth = tabWidths.value[currentIndex] > 0 ? tabWidths.value[currentIndex] : scrollViewWidth / tabCount;
		const nextTabWidth = tabWidths.value[nextIndex] > 0 ? tabWidths.value[nextIndex] : scrollViewWidth / tabCount;

		const widthCurrent = textWidths.value[currentIndex] > 0 ? textWidths.value[currentIndex] : scrollViewWidth / tabCount;
		const widthNext = textWidths.value[nextIndex] > 0 ? textWidths.value[nextIndex] : scrollViewWidth / tabCount;

		let posCurrentTab = 0;
		for (let i = 0; i < currentIndex; i++) {
			posCurrentTab += tabWidths.value[i] > 0 ? tabWidths.value[i] : scrollViewWidth / tabCount;
		}
		posCurrentTab += currentTabWidth / 2;

		let posNextTab = 0;
		for (let i = 0; i < nextIndex; i++) {
			posNextTab += tabWidths.value[i] > 0 ? tabWidths.value[i] : scrollViewWidth / tabCount;
		}
		posNextTab += nextTabWidth / 2;

		const posCurrentIndicator = posCurrentTab - (currentTabWidth / 2) + (currentTabWidth - widthCurrent) / 2;
		const posNextIndicator = posNextTab - (nextTabWidth / 2) + (nextTabWidth - widthNext) / 2;

		indicatorWidth.value = interpolate(progress, [0, 1], [widthCurrent, widthNext]);
		indicatorPosition.value = interpolate(progress, [0, 1], [posCurrentIndicator, posNextIndicator]);
	});

	const handleTabPress = (index: number) => {
		if (scrollViewRef.current) {
			scrollPositions.current[activeTab] = scrollX.value;
		}

		setActiveTab(index);
		lastActiveTab.current = index;

		const savedPosition = scrollPositions.current[index];
		if (savedPosition > 0) {
			scrollViewRef.current?.scrollTo({ x: savedPosition, animated: true });
		} else {
			scrollViewRef.current?.scrollTo({ x: index * width, animated: true });
		}

		onSwap && onSwap(index);
	};

	const handleScroll = useAnimatedScrollHandler({
		onScroll: (event) => {
			const offsetX = event.contentOffset.x;
			scrollX.value = offsetX;
			runOnJS(setScrollPosition)(offsetX);
		},
		onMomentumEnd: (event) => {
			const offsetX = event.contentOffset.x;
			const newIndex = Math.round(offsetX / width);

			scrollPositions.current[activeTab] = offsetX;

			if (newIndex !== activeTab) {
				runOnJS(setActiveTab)(newIndex);
				if (onSwap) {
					runOnJS(onSwap)(newIndex);
				}
			}
		}
	});

	const indicatorAnimatedStyle = useAnimatedStyle(() => {
		const finalWidth = indicatorWidth.value > 0 ? indicatorWidth.value : (scrollViewWidth / tabCount);

		return {
			width: finalWidth,
			transform: [{ translateX: indicatorPosition.value }]
		};
	});

	const styles = StyleSheet.create({
		container: {
			borderTopLeftRadius: noBorderRadius ? 0 : 10,
			borderTopRightRadius: noBorderRadius ? 0 : 10,
			overflow: 'hidden',
			flex: 1,
		},
		tabsContainer: {
			flexDirection: 'row',
			position: 'relative',
			borderBottomWidth: 0.3,
			maxHeight: 50,
			borderBottomColor: themeStore.currentTheme.bgTheme.borderColor as string,
		},
		indicator: {
			position: 'absolute',
			bottom: 0,
			left: 0,
			height: 4,
			borderTopRightRadius: 2,
			borderTopLeftRadius: 2,
			backgroundColor: themeStore.currentTheme.originalMainGradientColor.color as string,
		},
		...s
	});

	const Component = blurView ? BlurUi : View;

	return (
		<Component
			style={[
				{ backgroundColor: blurView ? getBlurViewBgColor() : currentTheme.bgTheme.background as string },
				styles.container,
				containerStyle
			]}
			intensity={intensity}
		>
			<Animated.View
				// ref={tabsScrollViewRef}
				style={[styles.tabsContainer, tabsContainerStyle]}
			// bounces={false}
			// showsHorizontalScrollIndicator={false}
			// horizontal
			// onContentSizeChange={(contentWidth) => {
			// 	setScrollViewWidth(width)
			// }}
			>
				{tabs.map((tab, tabIndex) => {
					let iconColor = getIconColor(tabIndex, scrollPosition, width);

					return (
						<TouchableOpacity
							key={tabIndex}
							style={[
								styles.tab,
								tabStyle,
								activeTab === tabIndex && [styles.activeTab, activeTabStyle]
							]}
							onPress={() => handleTabPress(tabIndex)}
							onLayout={(event) => {
								const width = event.nativeEvent.layout.width;
								tabWidths.value[tabIndex] = width;
								calculatePositions();
							}}
						>
							{tab.icon && iconColor && (() => {
								const IconComponent = tab.icon;
								return <IconComponent size={iconSize} color={iconColor} />;
							})()}

							{tab.text && (
								<MainText
									numberOfLines={1}
									color={iconColor || currentTheme.textColor.color}
									onLayout={e => {
										const { x, width } = e.nativeEvent.layout;
										handleTextLayout(tabIndex, x, width);
									}}
								>
									{tab.text}
								</MainText>
							)}
						</TouchableOpacity>
					);
				})}

				<Animated.View
					style={[
						styles.indicator,
						indicatorStyle,
						indicatorAnimatedStyle
					]}
				/>
			</Animated.View>

			<Animated.ScrollView
				ref={scrollViewRef}
				horizontal
				pagingEnabled
				bounces={bouncing}
				showsHorizontalScrollIndicator={false}
				onScroll={handleScroll}
				scrollEventThrottle={16}
				style={[styles.pagesContainer, contentContainerStyle]}
			>
				{tabs.map(({ content: Content }, index) => (
					<View
						style={[styles.page, { width }, tabMaxHeight ? { maxHeight: tabMaxHeight } : {}]}
						key={index}
					>
						<Content />
					</View>
				))}
			</Animated.ScrollView>
		</Component>
	);
});

var s = StyleSheet.create({
	tab: {
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'center',
		gap: 10,
		flex: 1,
		alignItems: 'center',
		borderColor: "red",
	},
	activeTab: {
	},
	pagesContainer: {
		flex: 1,
	},
	page: {
		flex: 1,
	}
}); 