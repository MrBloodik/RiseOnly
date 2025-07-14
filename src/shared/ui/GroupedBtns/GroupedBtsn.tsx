import { GroupBtnsType } from '@shared/config/types';
import { navigate } from '@shared/lib/navigation';
import { numericId } from '@shared/lib/numbers';
import { changeRgbA } from '@shared/lib/theme';
import { themeStore } from '@stores/theme';
import { observer } from 'mobx-react-lite';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleProp, StyleSheet, View, ViewProps } from 'react-native';
import { Box } from '../BoxUi/Box';
import { LiveTimeAgo } from '../LiveTimeAgo';
import { MainText } from '../MainText/MainText';
import { SecondaryText } from '../SecondaryText/SecondaryText';
import { SimpleButtonUi } from '../SimpleButtonUi/SimpleButtonUi';

interface GroupedBtnsProps {
	items: GroupBtnsType[];
	groupGap?: number;
	wrapperStyle?: StyleProp<ViewProps>;
	groupBg?: string | number | undefined;
	leftFlex?: number | undefined;
}

export const GroupedBtns = observer(({
	items,
	groupGap = 15,
	wrapperStyle = {},
	leftFlex = 1,
	groupBg = themeStore.currentTheme.bgTheme.background as string
}: GroupedBtnsProps) => {
	const { currentTheme } = themeStore;

	const { t } = useTranslation();

	const onBtnPress = (item: GroupBtnsType) => {
		if (item.callback) {
			item.callback(item, t);
			return;
		}
		if (!item.url) return;
		navigate(item.url);
	};

	return (
		<View
			style={[
				s.wrapper,
				{
					gap: groupGap,
					width: "100%"
				},
				wrapperStyle
			]}
		>
			{(() => {
				const groupedSettings = items.reduce((acc, current) => {
					const lastGroup = acc[acc.length - 1];

					if (!lastGroup || lastGroup[0].group !== current.group) {
						acc.push([current]);
					} else {
						lastGroup.push(current);
					}

					return acc;
				}, [] as typeof items[]);

				return groupedSettings.map((group, groupIndex) => (
					<Box
						key={`${groupIndex}-${numericId()}`}
						fD='column'
						gap={3}
						width={"100%"}
					>
						{group[0].groupTitle && (
							<SecondaryText
								px={11}
								ml={10}
								mb={1}
							>
								{group[0].groupTitle.toUpperCase()}
							</SecondaryText>
						)}
						<View
							style={[
								s.groupContainer,
								{
									backgroundColor: groupBg as string,
								},
							]}
						>
							{group.map((t, i) => {
								const ifLast = i === group.length - 1;

								return (
									<Fragment key={`${i}-${t.text}`}>
										<SimpleButtonUi
											style={s.btn}
											onPress={() => onBtnPress(t)}
										>
											{t.icon && (
												<View
													style={[
														s.btnLeft,
														{
															alignItems: "center",
															justifyContent: "center",
															height: "100%",
														}
													]}
												>
													{t.icon}
												</View>
											)}

											<View
												style={[
													s.btnRight,
													{
														paddingLeft: t.icon ? 0 : 15,
														height: t.height || "auto",
														minHeight: t.minHeight || undefined,
														paddingVertical: t.btnRightPaddingVertical || 0
													},
													ifLast ? {} : {
														borderBottomWidth: 0.2,
														borderBottomColor: changeRgbA(currentTheme.secondTextColor.color as string, "0.3")
													}
												]}
											>
												<Box
													flex={leftFlex}
												>
													<Box
														centered
														flex={1}
													>
														<MainText
															numberOfLines={1}
															mR={5}
															color={t.textColor ? t.textColor : undefined}
															px={t.btnRightMainTextPx || 16}
														>
															{t.text}
														</MainText>
													</Box>

													{t.pretitle && (
														<MainText
															numberOfLines={t.pretitleLines || 1}
															ellipsizeMode='tail'
															px={t.pretitlePx || 12}
															style={t.pretitleStyle}
														>
															{t.pretitle}
														</MainText>
													)}

													{t.subtitle && (
														<Box align='center' fD='row'>
															<SecondaryText
																px={12}
																numberOfLines={1}
																ellipsizeMode='tail'
															>
																{t.subtitle}
															</SecondaryText>
															{t.subtitleRealTimeDate && (
																<LiveTimeAgo
																	date={t.subtitleRealTimeDate}
																	fontSize={12}
																/>
															)}
														</Box>
													)}
												</Box>

												{(t?.leftIcon || !t.icon) && (
													<Box
														fD='row'
														flex={1}
														align='center'
														gap={10}
														justify="flex-end"
													>
														{t.leftText && (
															<SecondaryText
																numberOfLines={1}
																ellipsizeMode='tail'
																style={t.leftTextColor ? { color: t.leftTextColor } : {}}
															>
																{t.leftText}
															</SecondaryText>
														)}
														{typeof t.leftIcon == "function" ? (
															<>
																{t.actionKey && t.leftIcon()}
															</>
														) : (
															<>{t.leftIcon}</>
														)}
													</Box>
												)}
											</View>
										</SimpleButtonUi>

										{t.btn && (
											<SimpleButtonUi
												style={s.btn}
												key={`${t.group}-${i}`}
												onPress={t.btn.btnCallback}
												disabled={t.btnDisabled}
											>
												{t.btn.btnIcon && (
													<View
														style={[
															s.btnLeft,
															{
																paddingBottom: i == group.length - 1 ? 0 : 7,
																alignItems: "center",
																justifyContent: "center",
																paddingTop: t.rowGap || 7,
															}
														]}
													>
														{t.btn.btnIcon}
													</View>
												)}

												<View
													style={[
														s.btnRight,
														{
															paddingVertical: t.rowGap || 7,
															borderTopWidth: 0.2,
															borderTopColor: changeRgbA(currentTheme.secondTextColor.color as string, "0.3"),
														},
													]}
												>
													<Box
														style={{ maxWidth: "85%" }}
													>
														<MainText
															numberOfLines={1}
															ellipsizeMode='tail'
															color={t.btn.btnColor}
														>
															{t.btn.btnText}
														</MainText>
													</Box>
												</View>
											</SimpleButtonUi>
										)}
									</Fragment>
								);
							})}
						</View>
						{group[0].endGroupTitle && (
							<SecondaryText
								px={11}
								ml={10}
								mt={3}
							>
								{group[0].endGroupTitle}
							</SecondaryText>
						)}
					</Box>
				));
			})()}
		</View>
	);
});

const s = StyleSheet.create({
	wrapper: {
		flex: 1,
		flexDirection: 'column',
		gap: 15
	},
	btnRight: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		height: "100%",
		flex: 1
	},
	btnLeft: {
		flexDirection: "row",
		gap: 8,
		width: 50,
		alignItems: "center",
	},
	btn: {
		flexDirection: 'row',
		justifyContent: "space-between",
		alignItems: "center",
		width: "100%",
	},
	groupContainer: {
		borderRadius: 10,
		overflow: "hidden",
		flexDirection: 'column',
		paddingRight: 12.5,
	},
	safeArea: {
		flex: 1,
		backgroundColor: themeStore.currentTheme.bgTheme.background as string,
	},
	container: {
		flex: 1,
	},
});