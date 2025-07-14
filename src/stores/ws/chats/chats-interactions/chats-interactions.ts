import { todoNotify } from '@shared/config/const';
import { navigate } from '@shared/lib/navigation';
import { themeStore } from '@stores/theme';
import { messageActionsStore } from '@stores/ws/message';
import { makeAutoObservable, runInAction } from 'mobx';
import { mobxDebouncer, mobxState, MobxUpdateInstance } from 'mobx-toolbox';
import { GestureResponderEvent, NativeSyntheticEvent, TextInputChangeEventData } from 'react-native';
import { ChatInfo } from '../chats-actions/types';

class ChatsInteractionsStore {
	constructor() { makeAutoObservable(this); }

	isLoading: boolean = false;
	setIsLoading = (value: boolean) => this.isLoading = value;

	selectedChat: ChatInfo | null = null;
	selectChat = (chat: ChatInfo | null) => this.selectedChat = chat;

	// TSX HANDLERS

	onChatPress = (chat: ChatInfo) => {
		this.selectedChat = chat;
		navigate("Chat", { chatId: chat.id });
	};

	// TABS

	chatProfileTab = mobxState(0)("chatProfileTab");
	tabScrollPosition = mobxState(0)("tabScrollPosition");
	openedChatProfileTabPage = mobxState(0)("openedChatProfileTabPage");
	isTabScrollEnabled = mobxState(false)("isTabScrollEnabled");
	isMainScrollEnabled = mobxState(true)("isMainScrollEnabled");
	isReachedTabsArea = mobxState(false)("isReachedTabsArea");
	scrollMomentum = mobxState(0)("scrollMomentum");
	tabsAreaY = mobxState(0)("tabsAreaY");

	handleParentScrollEnd = (velocityY: number) => {
		this.scrollMomentum.setScrollMomentum(velocityY);
		if (this.isReachedTabsArea.isReachedTabsArea && velocityY > 0) {
			this.isTabScrollEnabled.setIsTabScrollEnabled(true);
		}
	};

	checkIfReachedTabsArea = (scrollY: number) => {
		const { safeAreaWithContentHeight: { safeAreaWithContentHeight } } = themeStore;

		const reachedTabs = scrollY >= (this.tabsAreaY.tabsAreaY - safeAreaWithContentHeight - 160);
		this.isReachedTabsArea.setIsReachedTabsArea(reachedTabs);
		if (reachedTabs) {
			this.isTabScrollEnabled.setIsTabScrollEnabled(true);
		}
	};

	handleSwap = (index: number) => {
		this.openedChatProfileTabPage.setOpenedChatProfileTabPage(index);
	};

	// INPUT

	chatsInputText = mobxState("")("chatsInputText");
	isChatTyping = mobxState(false)("isChatTyping");

	handleChangeChatsInputText = (e: NativeSyntheticEvent<TextInputChangeEventData>) => {
		this.chatsInputText.setChatsInputText(e.nativeEvent.text);

		mobxDebouncer.debouncedAction(
			"handleChangeChatsInputText",
			() => todoNotify(),
			2000
		);
	};

	onChangeChatInput = (text: string) => {
		const { typingAction } = messageActionsStore;
		const { isChatTyping: { isChatTyping, setIsChatTyping } } = this;

		runInAction(() => {
			setIsChatTyping(true);
			if (!isChatTyping) typingAction(true);
		});

		mobxDebouncer.debouncedAction(
			"onChangeChatInput",
			() => {
				runInAction(() => {
					setIsChatTyping(false);
					typingAction(false);
				});
			},
			1500
		);
	};

	// TABS

	chatsTab = mobxState(0)("chatsTab");
	chatsTabScrollPosition = mobxState(0)("chatsTabScrollPosition");

	// UPDATERS

	chatUpdater: MobxUpdateInstance<ChatInfo> | null = null;
	setChatUpdater = (updater: MobxUpdateInstance<ChatInfo>) => this.chatUpdater = updater;

	// HANDLERS

	onChatPressHandler = (item: ChatInfo, chatCallback?: (item: ChatInfo) => void) => {
		if (chatCallback) {
			chatCallback(item);
			return;
		}

		this.onChatPress(item);
	};

	// HOLD CONTEXT MENU

	itemCordinates = mobxState<{ x: number, y: number; }>({ x: 0, y: 0 })("itemCordinates");
	chatPreviewOpen = mobxState(false)("chatPreviewOpen");

	onChatLongPressHandler = (e: GestureResponderEvent) => {
		const { safeAreaWithContentHeight: { safeAreaWithContentHeight } } = themeStore;
		const {
			itemCordinates: { setItemCordinates },
			chatPreviewOpen: { setChatPreviewOpen }
		} = this;

		runInAction(() => {
			setItemCordinates({ x: 0, y: safeAreaWithContentHeight + 30 });
			setChatPreviewOpen(true);
		});
	};

	onChatPreviewCloseHandler = () => {
		this.chatPreviewOpen.setChatPreviewOpen(false);
	};
}

export const chatsInteractionsStore = new ChatsInteractionsStore();
