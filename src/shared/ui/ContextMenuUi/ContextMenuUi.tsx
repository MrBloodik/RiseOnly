import { darkenRGBA } from '@shared/lib/theme';
import { themeStore } from '@stores/theme';
import { observer } from 'mobx-react-lite';
import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, ScrollView, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { Portal } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { MainText } from '../MainText/MainText';

export interface ContextMenuItem {
	id: number;
	label: string;
	icon?: string;
	jsxIcon?: ReactNode;
	callback: () => void;
	disabled?: boolean;
	danger?: boolean;
	submenu?: ContextMenuItem[];
	key?: string;
	isActive?: boolean;
	textColor?: string;
}

interface ContextMenuProps {
	items: ContextMenuItem[];
	isVisible: boolean;
	onClose: () => void;
	anchorRef?: React.RefObject<View | null>;
	width?: number;
	offset?: { x: number; y: number; };
	edgeMargin?: number;
	selected?: null | string;
	position?: 'top' | 'bottom' | 'auto';
}

export const ContextMenuUi = observer(({
	items,
	isVisible,
	onClose,
	anchorRef,
	width = 200,
	offset = { x: 0, y: 0 },
	edgeMargin = 10,
	selected = null,
	position = 'auto'
}: ContextMenuProps) => {
	const { currentTheme } = themeStore;
	const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
	const [activeSubmenu, setActiveSubmenu] = useState<number | null>(null);
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const scaleAnim = useRef(new Animated.Value(0.9)).current;
	const overlayFadeAnim = useRef(new Animated.Value(0)).current;
	const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
	const positionCalculated = useRef(false);
	const estimatedMenuHeight = Math.min(screenHeight * 0.7, items.length * 50);

	useEffect(() => {
		if (isVisible) {
			Animated.timing(overlayFadeAnim, {
				toValue: 1,
				duration: 200,
				useNativeDriver: true,
			}).start();
		} else {
			Animated.timing(overlayFadeAnim, {
				toValue: 0,
				duration: 150,
				useNativeDriver: true,
			}).start();
		}
	}, [isVisible, overlayFadeAnim]);

	useEffect(() => {
		if (isVisible && anchorRef?.current && !positionCalculated.current) {
			anchorRef.current.measure((x, y, anchorWidth, anchorHeight, pageX, pageY) => {
				// Начинаем с положения якоря
				let newX = pageX;
				let newY = 0;

				// Определение доступного пространства
				const availableSpaceBelow = screenHeight - (pageY + anchorHeight);
				const availableSpaceAbove = pageY;

				// Горизонтальное позиционирование
				// Если предоставлен отступ по x, учитываем его
				if (offset?.x) {
					newX += offset.x;
				} else {
					// Центрируем меню относительно якоря
					newX = pageX + (anchorWidth / 2) - (width / 2);
				}

				// Ограничение по горизонтали
				if (newX < edgeMargin) {
					newX = edgeMargin;
				} else if (newX + width > screenWidth - edgeMargin) {
					newX = screenWidth - width - edgeMargin;
				}

				// Определение вертикального положения
				let autoPosition = position;
				if (autoPosition === 'auto') {
					// Решаем, размещать ли меню сверху или снизу от якоря
					if (availableSpaceBelow >= estimatedMenuHeight || availableSpaceBelow > availableSpaceAbove) {
						autoPosition = 'bottom';
					} else {
						autoPosition = 'top';
					}
				}

				// Вертикальное позиционирование
				if (autoPosition === 'bottom') {
					newY = pageY + anchorHeight + (offset?.y ?? 5); // Отступ 5px вниз если не указан
				} else {
					newY = pageY - estimatedMenuHeight - (offset?.y ?? 5); // Отступ 5px вверх если не указан
				}

				// Ограничение по вертикали
				if (newY < edgeMargin) {
					newY = edgeMargin;
				} else if (newY + estimatedMenuHeight > screenHeight - edgeMargin) {
					// Если не помещается в экран, корректируем положение
					if (autoPosition === 'bottom' && availableSpaceAbove > estimatedMenuHeight) {
						// Если снизу не помещается, но сверху есть место
						newY = pageY - estimatedMenuHeight - 5;
					} else {
						// Просто корректируем чтобы поместилось на экране
						newY = screenHeight - estimatedMenuHeight - edgeMargin;
					}
				}

				// Сохраняем посчитанное положение
				setMenuPosition({ x: newX, y: newY });
				positionCalculated.current = true;

				Animated.parallel([
					Animated.spring(fadeAnim, {
						toValue: 1,
						useNativeDriver: true,
						friction: 8,
						tension: 65
					}),
					Animated.spring(scaleAnim, {
						toValue: 1,
						useNativeDriver: true,
						friction: 8,
						tension: 65
					})
				]).start();
			});
		} else if (!isVisible) {
			positionCalculated.current = false;

			Animated.parallel([
				Animated.timing(fadeAnim, {
					toValue: 0,
					duration: 100,
					useNativeDriver: true,
				}),
				Animated.timing(scaleAnim, {
					toValue: 0.9,
					duration: 100,
					useNativeDriver: true,
				})
			]).start();
		}
	}, [isVisible, anchorRef, offset, screenWidth, screenHeight, items?.length, fadeAnim, scaleAnim, edgeMargin, position, width, estimatedMenuHeight]);

	const handleItemPress = (item: ContextMenuItem, index: number) => {
		if (item.submenu && item.submenu.length > 0) {
			setActiveSubmenu(activeSubmenu === index ? null : index);
		} else {
			Animated.parallel([
				Animated.timing(fadeAnim, {
					toValue: 0,
					duration: 100,
					useNativeDriver: true,
				}),
				Animated.timing(scaleAnim, {
					toValue: 0.9,
					duration: 100,
					useNativeDriver: true,
				})
			]).start(() => {
				onClose();
				item.callback();
			});
		}
	};

	const handleCloseMenu = () => {
		Animated.parallel([
			Animated.timing(fadeAnim, {
				toValue: 0,
				duration: 100,
				useNativeDriver: true,
			}),
			Animated.timing(scaleAnim, {
				toValue: 0.9,
				duration: 100,
				useNativeDriver: true,
			}),
			Animated.timing(overlayFadeAnim, {
				toValue: 0,
				duration: 150,
				useNativeDriver: true,
			})
		]).start(() => {
			onClose();
		});
	};

	const styles = StyleSheet.create({
		overlay: {
			position: 'absolute',
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
			backgroundColor: 'rgba(0, 0, 0, 0.5)',
			zIndex: 99999,
		},
		menuContainer: {
			position: 'absolute',
			left: menuPosition.x,
			top: menuPosition.y,
			width: width,
			backgroundColor: currentTheme.bgTheme.background as string,
			borderRadius: 8,
			shadowColor: '#000',
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.25,
			shadowRadius: 3.84,
			elevation: 999,
			overflow: 'hidden',
			transform: [{ scale: scaleAnim }],
			opacity: fadeAnim,
			zIndex: 100000,
		},
		menuItem: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingRight: 12.5,
			paddingLeft: 15,
			paddingVertical: 10,
			borderBottomWidth: 1,
			borderBottomColor: currentTheme.bgTheme.borderColor as string,
		},
		menuItemText: {
			flex: 1,
		},
		submenuContainer: {
			backgroundColor: darkenRGBA(currentTheme.bgTheme.background as string, 0.5),
			paddingLeft: 16,
		},
		disabledItem: {
			opacity: 0.5,
		},
		dangerItem: {
			color: '#FF3B30',
		},
	});

	if (!isVisible) return null;

	return (
		<Portal>
			<TouchableWithoutFeedback onPress={handleCloseMenu}>
				<Animated.View
					style={[
						styles.overlay,
						{ opacity: overlayFadeAnim }
					]}
				/>
			</TouchableWithoutFeedback>

			<Animated.View
				style={[
					styles.menuContainer,
					{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
				]}
			>
				<ScrollView>
					{items.map((item, index) => (
						<View key={`${item.label}-${index}`}>
							<TouchableOpacity
								style={[
									styles.menuItem,
									item.disabled && styles.disabledItem,
									index === items.length - 1 && !item.submenu && { borderBottomWidth: 0 },
								]}
								onPress={() => !item.disabled && handleItemPress(item, index)}
								disabled={item.disabled}
							>
								<MainText
									px={14}
									style={[
										styles.menuItemText,
										item.danger && styles.dangerItem,
										item.textColor && { color: item.textColor }
									]}
									color={selected == item.key ? currentTheme.originalMainGradientColor.color : currentTheme.textColor.color}
								>
									{item.label}
								</MainText>
								{item.icon && (
									<MaterialIcons
										name={item.icon as any}
										size={20}
										color={
											item.danger
												? '#FF3B30'
												: selected == item.key
													? currentTheme.originalMainGradientColor.color
													: currentTheme.textColor.color
										}
									/>
								)}
								{item.jsxIcon && item.jsxIcon}
								{item.submenu && item.submenu.length > 0 && (
									<MaterialIcons
										name={activeSubmenu === index ? "keyboard-arrow-up" : "keyboard-arrow-down"}
										size={20}
										color={selected == item.key ? currentTheme.originalMainGradientColor.color : currentTheme.textColor.color as string}
									/>
								)}
							</TouchableOpacity>

							{activeSubmenu === index && item.submenu && (
								<View style={styles.submenuContainer}>
									{item.submenu.map((subItem, subIndex) => (
										<TouchableOpacity
											key={`${subItem.label}-${subIndex}`}
											style={[
												styles.menuItem,
												subItem.disabled && styles.disabledItem,
												subIndex === item.submenu!.length - 1 && { borderBottomWidth: 0 },
											]}
											onPress={() => {
												if (!subItem.disabled) {
													Animated.parallel([
														Animated.timing(fadeAnim, {
															toValue: 0,
															duration: 100,
															useNativeDriver: true,
														}),
														Animated.timing(scaleAnim, {
															toValue: 0.9,
															duration: 100,
															useNativeDriver: true,
														})
													]).start(() => {
														onClose();
														subItem.callback();
													});
												}
											}}
											disabled={subItem.disabled}
										>
											<MainText
												px={14}
												style={[
													styles.menuItemText,
													subItem.danger && styles.dangerItem,
												]}
											>
												{subItem.label}
											</MainText>
											{subItem.icon && (
												<MaterialIcons
													name={subItem.icon as any}
													size={20}
													color={subItem.danger
														? '#FF3B30'
														: currentTheme.textColor.color as string}
												/>
											)}
										</TouchableOpacity>
									))}
								</View>
							)}
						</View>
					))}
				</ScrollView>
			</Animated.View>
		</Portal>
	);
});