import { ChatProfileTabs } from '@components/Chats/Chat/ChatProfileTabs/ChatProfileTabs';
import { getChatProfileInfoBtns } from '@shared/config/group-btns-data';
import { getChatProfileBtns } from '@shared/config/tsx';
import { Box, GroupedBtns, MainText, SimpleButtonUi, UserLogo } from '@shared/ui';
import { themeStore } from '@stores/theme';
import { chatsInteractionsStore } from '@stores/ws/chats';
import { ProfileSettingsWrapper } from '@widgets/wrappers';
import { observer } from 'mobx-react-lite';
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Animated, { runOnJS, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';

export const ChatProfile = observer(() => {
	const { currentTheme } = themeStore;
	const {
		selectedChat,
		handleParentScrollEnd,
		checkIfReachedTabsArea,
		isMainScrollEnabled: { isMainScrollEnabled },
		tabsAreaY: { setTabsAreaY }
	} = chatsInteractionsStore;

	if (!selectedChat) return <></>;

	const { t } = useTranslation();
	const scrollY = useSharedValue(0);
	const scrollRef = useRef(null);
	const tabsRef = useRef<View>(null);
	const lastVelocityY = useSharedValue(0);
	const chatProfileBtns = getChatProfileBtns(t, selectedChat.participant);
	const chatProfileInfo = getChatProfileInfoBtns(t, selectedChat?.participant);

	useEffect(() => {
		if (tabsRef.current) {
			tabsRef.current.measure((x, y, width, height, pageX, pageY) => {
				setTabsAreaY(pageY);
			});
		}
	}, []);

	const onScroll = useAnimatedScrollHandler({
		onScroll: (e) => {
			scrollY.value = e.contentOffset.y;
			runOnJS(checkIfReachedTabsArea)(e.contentOffset.y);
		}
	});

	return (
		<ProfileSettingsWrapper
			tKey=''
			needHeader={false}
			transparentSafeArea
			PageHeaderUiStyle={{ borderBottomWidth: 0 }}
			needScrollView={false}
			wrapperStyle={{ paddingVertical: 0, paddingHorizontal: 0 }}
		>
			<Box style={s.main}>
				<Animated.ScrollView
					style={s.scrollView}
					scrollEventThrottle={16}
					bounces={false}
					showsVerticalScrollIndicator={false}
					scrollEnabled={isMainScrollEnabled}
					onScroll={onScroll}
					ref={scrollRef}
					onScrollEndDrag={(e) => {
						if (scrollY.value < 30) {
							if (!scrollRef.current) return;
							// @ts-ignore
							scrollRef.current.scrollTo({ y: 0, animated: true });
						}

						const velocity = e.nativeEvent.velocity?.y || 0;
						lastVelocityY.value = velocity;

						handleParentScrollEnd(velocity);
					}}
				>
					<UserLogo
						source={selectedChat?.type_ == "PRIVATE" ? selectedChat.participant.more.logo : selectedChat?.logo_url}
						size={100}
						canvas
						scrollY={scrollY}
					/>

					<Box
						bgColor='black'
						style={{ paddingHorizontal: 15, paddingVertical: 10 }}
						gap={20}
					>
						<Box style={s.btns}>
							{chatProfileBtns.map((t, i) => {
								return (
									<SimpleButtonUi
										bgColor={currentTheme.btnsTheme.background as string}
										style={s.btn}
										key={i}
										onPress={t.callback}
									>
										<Box
											centered
											width={"100%"}
										>
											{t.icon}
										</Box>
										<MainText
											px={11}
											width={"100%"}
											tac='center'
											primary
										>
											{t.text}
										</MainText>
									</SimpleButtonUi>
								);
							})}
						</Box>

						<Box style={s.mid}>
							<GroupedBtns
								items={chatProfileInfo}
								leftFlex={0}
							/>
						</Box>
					</Box>

					<Box style={s.bot}>
						<View
							ref={tabsRef}
							onLayout={() => {
								if (tabsRef.current) {
									tabsRef.current.measure((x, y, width, height, pageX, pageY) => {
										setTabsAreaY(pageY);
									});
								}
							}}
						>
							<ChatProfileTabs />
						</View>
					</Box>
				</Animated.ScrollView>
			</Box >
		</ProfileSettingsWrapper >
	);
});

const s = StyleSheet.create({
	container: {
		marginTop: 0,
		marginBottom: 20,
		flex: 1,
	},
	bot: {},
	btn: {
		flex: 1,
		borderRadius: 10,
		paddingTop: 10,
		paddingBottom: 7,
		flexDirection: "column",
		gap: 2,
		justifyContent: "center",
		alignItems: "center",
	},
	btns: {
		flexDirection: "row",
		gap: 10,
	},
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
	namesSticky: { width: "100%", alignItems: "center", justifyContent: "center", borderColor: "red", borderWidth: 1 },
	top: { width: "100%", backgroundColor: themeStore.currentTheme.bgTheme.background as string, paddingBottom: 20 },
	scrollView: { width: "100%", backgroundColor: themeStore.currentTheme.bgTheme.background as string },
	main: { flex: 1 }
});
