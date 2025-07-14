import { getCachedData } from '@shared/config/ts';
import { getCurrentRoute } from '@shared/lib/navigation';
import { generateSimpleUUID } from '@shared/lib/string';
import { User } from '@stores/profile/types';
import { chatsInteractionsStore } from '@stores/ws/chats';
import { MobxSaiWsInstance } from '@stores/ws/websocket-store';
import { makeAutoObservable } from 'mobx';
import { messageInteractionsStore } from '../message-interactions/message-interactions';
import { messageWebsocketStore } from '../message-websocket/message-websocket';
import { CreateMessageBody, CreateMessageResponse, GetMessagesBody, GetMessagesResponse, TypingBody, TypingResponse } from './types';

class MessageActionsStore {
	constructor() { makeAutoObservable(this); }

	// GET MESSAGES

	messages: MobxSaiWsInstance<GetMessagesResponse> = {};
	MESSAGES_LIMIT = 20;

	getMessagesAction = async (needPending = true, fetchIfHaveData = false, chatId?: string) => {
		const { messageWs: { mobxSaiWs } } = messageWebsocketStore;
		const { selectedChat } = chatsInteractionsStore;

		const bodyChatId = selectedChat ? selectedChat.id : chatId;

		if (!bodyChatId) return;

		const cachedMessages = await getCachedData(bodyChatId);
		if (cachedMessages) return;

		const body: GetMessagesBody = {
			"type": "get_messages",
			"limit": this.MESSAGES_LIMIT,
			"relative_id": null,
			"up": false,
			"request_id": `getMessages_${bodyChatId}`
		};

		if (chatId) body.user_chat_id = bodyChatId;
		else body.chat_id = bodyChatId;

		this.messages = mobxSaiWs(
			body,
			this.messages,
			{
				id: `getMessages_${bodyChatId}`,
				setData: (data) => {
					this.messages = data;
				},
				arrPath: "messages",
				fetchIfPending: false,
				bypassQueue: true,
				needPending,
				fetchIfHaveData
			}
		);
	};

	// CREATE MESSAGE

	createMessage: MobxSaiWsInstance<CreateMessageResponse> = {};

	createMessageAction = async (body: CreateMessageBody) => {
		const { selectedChat } = chatsInteractionsStore;
		const { messageWs: { mobxSaiWs } } = messageWebsocketStore;
		const {
			msgCloneText: { msgCloneText, setMsgCloneText }
		} = messageInteractionsStore;

		const params: {
			chatId: string;
			previewUser: User;
		} = getCurrentRoute()?.params as any;

		console.log("params", params);

		const bodyChatId = selectedChat ? selectedChat.id : params.previewUser.userChatId;

		setMsgCloneText("");

		if (selectedChat) body.chat_id = bodyChatId;
		else body.user_chat_id = bodyChatId;

		await mobxSaiWs(
			body,
			this.createMessage,
			{ needStates: false }
		);
	};

	// CHAT TYPING

	typing: MobxSaiWsInstance<TypingResponse> = {};

	typingAction = async (isTyping: boolean) => {
		const { selectedChat } = chatsInteractionsStore;
		const { messageWs: { mobxSaiWs } } = messageWebsocketStore;

		if (!selectedChat) return;

		const body: TypingBody = {
			"type": 'message_typing',
			"chat_id": selectedChat.id,
			is_typing: isTyping,
			request_id: generateSimpleUUID()
		};

		await mobxSaiWs(
			body,
			this.typing,
			{
				id: `typing_${selectedChat.id}_${isTyping}`,
			}
		);
	};
}

export const messageActionsStore = new MessageActionsStore();