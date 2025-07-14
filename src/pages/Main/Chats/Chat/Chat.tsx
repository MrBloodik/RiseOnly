import { MainStackParamList } from '@app/router/AppNavigator';
import { ChatBottomBar } from '@components/Chats/Chat/Bar/ChatBottomBar/ChatBottomBar';
import { ChatTopBar } from '@components/Chats/Chat/Bar/ChatTopBar/ChatTopBar';
import { ChatTopRightBar } from '@components/Chats/Chat/Bar/ChatTopRightBar/ChatTopRightBar';
import { DateSeparator } from '@components/Chats/Chat/DateSeparator/DateSeparator';
import { LeftMessage } from '@components/Chats/Chat/Message/LeftMessage/LeftMessage';
import { RightMessage } from '@components/Chats/Chat/Message/RightMessage/RightMessage';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { defaultContextMenuActions } from '@shared/config/ts';
import { changeRgbA, darkenRGBA } from '@shared/lib/theme';
import { AsyncDataRender } from '@shared/ui';
import { HoldContextMenuUi } from '@shared/ui/HoldContextMenuUi/HoldContextMenuUi';
import { FlashList } from '@shopify/flash-list';
import { profileStore } from '@stores/profile';
import { themeStore } from '@stores/theme';
import { chatsInteractionsStore } from '@stores/ws/chats';
import { messageActionsStore } from '@stores/ws/message/message-actions/message-actions';
import { GetMessageMessage } from '@stores/ws/message/message-actions/types';
import { messageInteractionsStore } from '@stores/ws/message/message-interactions/message-interactions';
import { ChatsWrapper } from '@widgets/wrappers';
import { format } from 'date-fns';
import { observer } from 'mobx-react-lite';
import { Fragment, useEffect, useRef, useState } from 'react';
import {
	Animated,
	Keyboard,
	KeyboardAvoidingView,
	LayoutAnimation,
	NativeScrollEvent,
	NativeSyntheticEvent,
	Platform,
	StyleSheet,
	UIManager,
	View,
} from 'react-native';

const chatBottomBarHeight = 30 + 7.5; // bottomBarHeight + paddingTop из ChatBottomBar

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
	UIManager.setLayoutAnimationEnabledExperimental(true);
}
interface GroupedMessage {
	id: string;
	date: string;
	timestamp: number;
	messages: GetMessageMessage[];
	type: 'date' | 'messages';
}

export const Chat = observer(() => {
	const { currentTheme } = themeStore;
	const { profile } = profileStore;
	const { selectedChat, selectChat, onChangeChatInput } = chatsInteractionsStore;
	const {
		messages: { status, data },
		getMessagesAction,
	} = messageActionsStore;
	const {
		msgInputFocus: { setMsgInputFocus },
		msgIsFocused: { msgIsFocused },
		selectedMessage: { selectedMessage, setSelectedMessage },
		selectedMessageForContextMenu: { setSelectedMessageForContextMenu },
		itemCordinates: { setItemCordinates },
		messageUpdater
	} = messageInteractionsStore;

	const { chatId, previewUser } = useRoute<RouteProp<MainStackParamList, 'Chat'>>().params;
	const flatListRef = useRef<FlashList<GroupedMessage> | null>(null);
	const scrollOffset = useRef(0);
	const navigation = useNavigation();
	const keyboardAvoidingViewRef = useRef<KeyboardAvoidingView>(null);
	const [keyboardVisible, setKeyboardVisible] = useState(false);
	const animatedKeyboardHeight = useRef(new Animated.Value(0)).current;
	const [stickyHeaderIndices, setStickyHeaderIndices] = useState<number[]>([]);
	const [bottomHeight, setBottomHeight] = useState(0);

	const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
		scrollOffset.current = event.nativeEvent.contentOffset.y;
	};

	const resetKeyboardAvoidingView = () => {
		if (keyboardAvoidingViewRef.current) {
			const current = keyboardAvoidingViewRef.current as any;
			if (current.updateBottomIfNecessary) {
				current.updateBottomIfNecessary(0);
			}
		}
	};

	const configureLayoutAnimation = () => {
		LayoutAnimation.configureNext({
			duration: 300,
			create: {
				type: LayoutAnimation.Types.easeInEaseOut,
				property: LayoutAnimation.Properties.opacity,
			},
			update: {
				type: LayoutAnimation.Types.easeInEaseOut,
			},
		});
	};

	const groupMessages = (messages: GetMessageMessage[]): GroupedMessage[] => {
		if (!messages || messages.length === 0) return [];

		const sortedMessages = [...messages].sort((a, b) => a.created_at - b.created_at);
		const groups: GroupedMessage[] = [];

		let currentDate = '';
		let currentGroup: GetMessageMessage[] = [];
		let lastSenderId = '';

		sortedMessages.forEach((message, index) => {
			const messageDate = format(new Date(message.created_at * 1000), 'yyyy-MM-dd');

			if (messageDate !== currentDate) {
				if (currentGroup.length > 0) {
					groups.push({
						id: `msg-group-${groups.length}`,
						date: currentDate,
						timestamp: 0,
						messages: [...currentGroup],
						type: 'messages',
					});
					currentGroup = [];
				}

				groups.push({
					id: `date-${messageDate}`,
					date: messageDate,
					timestamp: message.created_at,
					messages: [],
					type: 'date',
				});

				currentDate = messageDate;
				lastSenderId = message.sender_id;
			}

			const isNewSender = message.sender_id !== lastSenderId;
			const isTimeDifference =
				currentGroup.length > 0 && message.created_at - currentGroup[currentGroup.length - 1].created_at > 600; // 10 минут = 600 секунд

			if (isNewSender || isTimeDifference) {
				if (currentGroup.length > 0) {
					groups.push({
						id: `msg-group-${groups.length}`,
						date: currentDate,
						timestamp: 0,
						messages: [...currentGroup],
						type: 'messages',
					});
					currentGroup = [];
				}
			}

			currentGroup.push(message);
			lastSenderId = message.sender_id;

			if (index === sortedMessages.length - 1 && currentGroup.length > 0) {
				groups.push({
					id: `msg-group-${groups.length}`,
					date: currentDate,
					timestamp: 0,
					messages: [...currentGroup],
					type: 'messages',
				});
			}
		});

		return groups.reverse();
	};

	useEffect(() => {
		if (!data?.messages) return;

		const groups = groupMessages(data.messages);
		const dateIndices: number[] = [];

		groups.forEach((group, index) => {
			if (group.type === 'date') {
				dateIndices.push(index);
			}
		});

		setStickyHeaderIndices(dateIndices);
	}, [data?.messages]);

	useEffect(() => {
		const keyboardWillShowListener = Keyboard.addListener(
			Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
			e => {
				configureLayoutAnimation();
				setKeyboardVisible(true);

				Animated.timing(animatedKeyboardHeight, {
					toValue: e.endCoordinates.height,
					duration: Platform.OS === 'ios' ? 300 : 200,
					useNativeDriver: false,
				}).start();
			},
		);

		const keyboardWillHideListener = Keyboard.addListener(
			Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
			() => {
				configureLayoutAnimation();
				setKeyboardVisible(false);

				Animated.timing(animatedKeyboardHeight, {
					toValue: 0,
					duration: Platform.OS === 'ios' ? 300 : 200,
					useNativeDriver: false,
				}).start(() => {
					resetKeyboardAvoidingView();
				});

				setTimeout(resetKeyboardAvoidingView, 100);
				setTimeout(resetKeyboardAvoidingView, 300);
			},
		);

		return () => {
			keyboardWillShowListener.remove();
			keyboardWillHideListener.remove();
		};
	}, []);

	useEffect(() => {
		const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
			if (flatListRef.current) flatListRef.current = null;
			selectChat(null);
			messageActionsStore.messages = {};
		});
		return unsubscribe;
	}, [navigation]);

	useEffect(() => {
		if (!data?.messages) return;
		console.log('scrollOffset.current', scrollOffset.current);
		if (Math.abs(scrollOffset.current) < 50) {
			flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
		}
	}, [data?.messages?.length]);

	useEffect(() => {
		if (!selectedChat) return;
		getMessagesAction();
	}, [selectedChat]);

	// useFocusEffect(
	// 	useCallback(() => {
	// 		if (chatId) getMessagesAction(false, false, chatId);
	// 	}, [chatId]),
	// );

	const s = StyleSheet.create({
		contentContainer: {
			width: '100%',
		},
		wrapper: {
			paddingHorizontal: 3,
			width: '100%',
			paddingTop: bottomHeight + 5,
		},
		main: {
			paddingTop: themeStore.safeAreaWithContentHeight.safeAreaWithContentHeight + 30,
			height: '100%',
		},
	});

	const renderItem = ({ item }: { item: GroupedMessage; }) => {
		if (item.type === 'date') return <DateSeparator timestamp={item.timestamp} isSticky />;

		return (
			<View>
				{item.messages.map((message, index) => {
					if (typeof message.isSelected !== 'boolean') message.isSelected = false;
					const isLastInGroup = index === item.messages.length - 1;
					const showAvatar = isLastInGroup;

					if (message.sender_id === profile?.id) {
						return (
							<RightMessage
								key={message.id}
								message={message}
								showAvatar={showAvatar}
								style={{
									marginTop: index > 0 ? 2 : 3,
									opacity: message.isSelected ? 0 : selectedMessage?.id === message.id ? 0 : 1,
								}}
								onLongPress={e => {
									setItemCordinates({ x: 0, y: e.nativeEvent.pageY - e.nativeEvent.locationY });
									setSelectedMessageForContextMenu(message);
									if (messageUpdater) { // TODO: BUG: messageUpdater is not updating element in map
										messageUpdater?.(message.id, "content", "broo");
									}
								}
								}
								onPressIn={() => { }}
							/>
						);
					}

					return (
						<LeftMessage
							key={message.id}
							message={message}
							showAvatar={showAvatar}
							style={{ marginTop: index > 0 ? 2 : 3 }}
						/>
					);
				})}
			</View>
		);
	};

	return (
		<KeyboardAvoidingView
			ref={keyboardAvoidingViewRef}
			behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			style={{ flex: 1 }}
			keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -200}>
			<ChatsWrapper
				bottomHeight={bottomHeight}
				setBottomHeight={setBottomHeight}
				headerHeight={40}
				midJsx={<ChatTopBar />}
				rightJsx={<ChatTopRightBar />}
				Component={View}
				bottomStyle={{
					paddingBottom: keyboardVisible ? undefined : 0,
				}}
				topBottomBgColor={changeRgbA(darkenRGBA(currentTheme.btnsTheme.background as string, 0.95), '0.95')}
				bottomJsx={<ChatBottomBar onChange={text => onChangeChatInput(text)} />}
				scrollEnabled={false}
				leftTop={8}
				isBlurView={true}
				bottomInsenity={30}
				topIntensity={30}
				transparentSafeArea
				wrapperStyle={{ paddingHorizontal: 0 }}
				PageHeaderUiStyle={{
					borderBottomColor: currentTheme.bgTheme.borderColor,
					borderBottomWidth: 0.3,
				}}
			>
				<AsyncDataRender
					data={data?.messages}
					status={status || (previewUser ? 'fulfilled' : status)}
					renderContent={items => {
						const groupedMessages = groupMessages(items || []);

						return (
							<FlashList
								ref={flatListRef}
								data={groupedMessages}
								inverted
								contentContainerStyle={s.wrapper}
								bounces
								scrollEventThrottle={16}
								onEndReachedThreshold={0.2}
								estimatedItemSize={groupedMessages.length > 0 ? 70 : 200}
								onEndReached={() => console.log('Подгружаем вниз')}
								maintainVisibleContentPosition={{
									minIndexForVisible: 0,
									autoscrollToTopThreshold: 10,
								}}
								onViewableItemsChanged={handleViewableItemsChanged}
								viewabilityConfig={{
									itemVisiblePercentThreshold: 20,
									minimumViewTime: 100,
									waitForInteraction: false,
								}}
								initialScrollIndex={0}
								keyboardShouldPersistTaps='handled'
								keyboardDismissMode='interactive'
								keyExtractor={item => item.id}
								stickyHeaderIndices={Platform.OS === 'ios' ? stickyHeaderIndices : undefined}
								onMomentumScrollBegin={() => msgIsFocused && setMsgInputFocus(p => !p)}
								onScroll={handleScroll}
								renderItem={renderItem}
							/>
						);
					}}
				/>
			</ChatsWrapper>

			<HoldContextMenu />
		</KeyboardAvoidingView>
	);
});

const HoldContextMenu = observer(() => {
	const {
		selectedMessageForContextMenu: { selectedMessageForContextMenu, setSelectedMessageForContextMenu },
		itemCordinates: { itemCordinates }
	} = messageInteractionsStore;
	const { profile } = profileStore;

	return (
		<HoldContextMenuUi
			itemCordinates={itemCordinates}
			selectedItem={JSON.parse(JSON.stringify(selectedMessageForContextMenu))}
			setSelectedItem={setSelectedMessageForContextMenu}
			actions={defaultContextMenuActions}
			side={selectedMessageForContextMenu?.sender?.id == profile?.id ? "right" : "left"}
			debug
			renderJsx={
				<Fragment>
					{selectedMessageForContextMenu?.sender?.id == profile?.id ? (
						<RightMessage
							message={selectedMessageForContextMenu}
							showAvatar={false}
							onLongPress={() => { }}
							onPressIn={() => { }}
						/>
					) : (
						<LeftMessage
							message={selectedMessageForContextMenu}
							showAvatar={false}
						/>
					)}
				</Fragment>
			}
		/>
	);
});