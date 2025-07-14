import { showNotify } from '@shared/config/const';
import { profileStore } from '@stores/profile';
import { chatsActionsStore, chatsInteractionsStore } from '@stores/ws/chats';
import { ChatInfo } from '@stores/ws/chats/chats-actions/types';
import { AuthWsResponse } from '@stores/ws/types';
import i18n from 'i18n';
import { makeAutoObservable, runInAction } from 'mobx';
import { useMobxUpdate } from 'mobx-toolbox';
import { messageActionsStore } from '../message-actions/message-actions';
import { CreateMessageResponse, GetMessageMessage, GetMessagesResponse, TypingResponse } from '../message-actions/types';
import { messageInteractionsStore } from '../message-interactions/message-interactions';
import { messageWebsocketStore } from '../message-websocket/message-websocket';

class MessageServicesStore {
	constructor() { makeAutoObservable(this); }

	cloneMsgText = "";
	cloneRawMsgText = "";

	// ================= TEMP DATA =====================

	getCreateMessageTempData = (tempId: string) => {
		const { profile } = profileStore;
		const {
			msgRawText: { msgRawText },
			msgText: { msgText }
		} = messageInteractionsStore;

		const p = profile!;
		this.cloneRawMsgText = msgRawText;
		this.cloneMsgText = msgText;

		const res: GetMessageMessage = {
			id: tempId,
			sender_id: p.id,
			sender_name: p.name,
			content: msgText, // TODO: Заменить когда отредачишь редактор
			original_content: msgText,
			created_at: Math.floor(Date.now() / 1000),
			timestamp: Math.floor(Date.now() / 1000),
			isTemp: true,
			content_type: "text",
			sender: {
				id: p.id,
				createdAt: p.createdAt,
				updatedAt: p.updatedAt,
				phone: p.phone,
				name: p.name,
				isPremium: p.isPremium,
				tag: p.tag,
				userChatId: p.userChatId,
				customerId: p.customerId,
				gender: p.gender,
				moreId: p.moreId,
				role: p.role,
				isBlocked: p.isBlocked,
				more: p.more,
				postsCount: 0,
				friendsCount: 0,
				subsCount: 0,
				subscribersCount: 0,
				friendRequestId: null,
				isSubbed: null,
				isFriend: null
			},
			is_system_message: false,
			has_attachments: false,
			is_forwarded: false,
			is_reply: false,
			has_reactions: false,
			is_pinned: false
		};

		return res;
	};

	// ================= PRE DATA ======================

	preCreateMessage = (tempId: string) => {
		const {
			msgText: { msgText, setMsgText },
			msgCloneText: { setMsgCloneText }
		} = messageInteractionsStore;

		const requestId = messageActionsStore.createMessage?.data?.request_id || null;

		runInAction(() => {
			const tempData = this.getCreateMessageTempData(tempId);
			if (requestId) {
				(tempData as any).request_id = requestId;
			}
			setMsgCloneText(msgText);
			setMsgText("");

			if (messageActionsStore.messages.data) {
				messageActionsStore.messages.data.messages = [
					...messageActionsStore.messages.data.messages,
					tempData
				];
			}
		});
	};

	// ================= HANDLERS ======================

	// AUTH HANDLER

	authResHandler = (message: AuthWsResponse) => {
		const { msgAuthLoading: { setMsgAuthLoading } } = messageWebsocketStore;

		if (!message.success) return;
		setMsgAuthLoading(false);
		messageWebsocketStore.messageWs.isLogined.setIsLogined(true);
	};

	// GET MESSAGES HANDLER

	getMessagesResHandler = (msg: GetMessagesResponse) => {
		const { setMessageUpdater } = messageInteractionsStore;

		if (!msg?.messages) {
			showNotify("error", { message: i18n.t("get_messages_error") });
			return;
		}

		messageActionsStore.messages.data = msg;
		messageActionsStore.messages.status = 'fulfilled';
		messageActionsStore.messages.isPending = false;
		setMessageUpdater(useMobxUpdate(() => msg.messages));
	};

	// CREATE MESSAGE HANDLER

	createMessageResHandler = (msg: CreateMessageResponse) => {
		const { profile } = profileStore;
		const { selectedChat } = chatsInteractionsStore;

		if (msg?.type !== "message_created") {
			showNotify("error", { message: i18n.t("retry_later_error") });
			return;
		}

		let isMy = false;
		if (msg?.sender?.id === profile?.id) isMy = true;

		if (isMy) {
			const messages = messageActionsStore.messages.data?.messages || [];
			let tempIndex = -1;

			if (msg.request_id) {
				tempIndex = messages.findIndex(
					temp => (temp as any).request_id === msg.request_id && temp.isTemp === true
				);
			}

			if (tempIndex === -1) {
				const messageContent = msg.content;
				tempIndex = messages.findIndex(
					temp => temp.content === messageContent && temp.isTemp === true
				);
			}

			if (tempIndex === -1) {
				// If no exact match, find the oldest temp message
				const tempMessages = messages.filter(m => m.isTemp === true);
				if (tempMessages.length > 0) {
					const oldestMessage = [...tempMessages].sort((a, b) => a.created_at - b.created_at)[0];
					tempIndex = messages.indexOf(oldestMessage);
				}
			}

			if (tempIndex !== -1) {
				console.log(`Removing temp message at index ${tempIndex}`);
				// Remove the temp message
				messageActionsStore.messages.data!.messages = [
					...messages.slice(0, tempIndex),
					...messages.slice(tempIndex + 1)
				];

				messageInteractionsStore.msgTempIds.setMsgTempIds(prev => {
					if (prev.length <= tempIndex) return prev;
					return [
						...prev.slice(0, tempIndex),
						...prev.slice(tempIndex + 1)
					];
				});
			}

			if (!messageActionsStore.messages.data) messageActionsStore.messages.data = { ...messageActionsStore.messages.data || {}, messages: [] } as any;

			messageActionsStore.messages.data!.messages = [
				{
					...msg,
					isTemp: false
				},
				...messageActionsStore.messages.data!.messages
			];

			const chats = chatsActionsStore.chats.data?.chats || [];
			const chatIndex = chats.findIndex(chat => chat.id === msg.chat_info.id);

			if (chatIndex !== -1) {
				chats[chatIndex].last_message = {
					...msg,
					timestamp: msg.created_at,
					isTemp: false
				};
				chatsActionsStore.chats.data!.chats = [...chats];
			}

			return;
		}

		// Handle messages from others (non-my messages)
		const chats = chatsActionsStore.chats.data?.chats || [];
		const existingIndex = chats.findIndex(chat => chat.id === msg.chat_info.id);
		const ifYouInChat = selectedChat?.id === msg.chat_info.id;

		if (existingIndex !== -1) {
			const [prevChat] = chats.splice(existingIndex, 1);

			const newChat: ChatInfo = {
				...msg.chat_info,
				participant: msg.sender,
				last_message: {
					...msg,
					timestamp: msg.created_at,
					isTemp: false,
				}
			};

			if (!ifYouInChat) newChat.unread_count = prevChat.unread_count + 1;

			chats.unshift(newChat);
		} else {
			chats.unshift({
				...msg.chat_info,
				last_message: {
					...msg,
					timestamp: msg.created_at,
					isTemp: false,
				},
				unread_count: msg.chat_info.unread_count + 1
			});
		}

		chatsActionsStore.chats.data!.chats = chats;
		if (!messageActionsStore.messages.data) return;

		messageActionsStore.messages.data = {
			...messageActionsStore.messages.data,
			messages: [
				{
					...msg,
					isTemp: false
				},
				...messageActionsStore.messages.data!.messages,
			]
		};
	};

	// TYPING HANDLERS

	typingResHandlers = (msg: TypingResponse) => {
		const { profile } = profileStore;
		const { selectedChat, chatUpdater } = chatsInteractionsStore;

		if (msg?.type != "user_typing") {
			showNotify("error", { message: i18n.t("retry_later_error") });
			return;
		}
		if (profile && (msg.user_id === profile.id)) return;
		if (!chatUpdater) return;

		if (msg.is_typing) {
			runInAction(() => {
				// chatUpdater(msg.chat_id, "typing_datas", (prev) => {
				// 	return [...(Array.isArray(prev) ? prev : []), msg]
				// })
				if (chatsActionsStore.chats.data) {
					const chat = chatsActionsStore.chats.data.chats.find(t => t.id === msg.chat_id);
					if (chat) chat.typing_datas.push(msg);
				}
				// if (selectedChat && selectedChat.id === msg.chat_id) selectedChat.typing_datas.push(msg)
			});
			return;
		}

		runInAction(() => {
			// chatUpdater(msg.chat_id, "typing_datas", (prev) => {
			// 	return prev ? [...prev.filter(t => t.user_id !== msg.user_id), msg] : [msg]
			// })
			if (chatsActionsStore.chats.data) {
				const chat = chatsActionsStore.chats.data.chats.find(t => t.id === msg.chat_id);
				if (chat) chat.typing_datas = chat.typing_datas.filter(t => t.chat_id !== msg.chat_id);
			}
			// if (selectedChat && selectedChat.id === msg.chat_id) selectedChat.typing_datas.filter(t => t.chat_id !== msg.chat_id)
		});
	};
}

export const messageServicesStore = new MessageServicesStore();

// {
// 	"type": "message_created",
// 	"message_id": "7413afea-9a78-46a0-be7f-b16bdce7e319",
// 	"chat_id": "32c7c3f7-f587-40e4-8bc0-77468cf0c4cb",
// 	"sender_id": "a8eeed20-96f1-498e-a1eb-3a90cda5b043",
// 	"sender_name": "noname",
// 	"content": "Привет, как дела sdfsdfsdkldsjvkldsvjdsvldksjvdsvsdfsfdsfdsfsf1 фыв фвфы вф 2321?",
// 	"content_type": "text",
// 	"created_at": 1745597571,
// 	"entities": null,
// 	"reply_to": null,
// 	"forward_info": {
// 		"from_chat_id": null,
// 		"from_message_id": null,
// 		"sender_name": null,
// 		"date": null
// 	},
// 	"media_info": {
// 		"type_": "text",
// 		"file_url": "https://example.com/file",
// 		"thumbnail_url": null,
// 		"duration": null,
// 		"width": null,
// 		"height": null,
// 		"file_name": null,
// 		"file_size": null,
// 		"mime_type": null
// 	},
// 	"caption": null,
// 	"request_id": "msg-123",
// 	"user": {
// 		"id": "a8eeed20-96f1-498e-a1eb-3a90cda5b043",
// 		"name": "noname",
// 		"phone": "55000000000002",
// 		"tag": "1e95c7cc",
// 		"is_premium": false,
// 		"user_chat_id": "6ed172c5-00f5-45cc-b656-ec9d3d0a1914",
// 		"customer_id": "cus_SCCbPZGZKzE0SF",
// 		"gender": "NONE",
// 		"more_id": "2429e0a3-e09a-46d6-b787-44a53e744d04",
// 		"role": "USER",
// 		"is_blocked": false,
// 		"created_at": "2025-04-25T15:29:24.128481+00:00",
// 		"updated_at": "2025-04-25T15:29:24.128481+00:00",
// 		"more": {
// 			"id": "2429e0a3-e09a-46d6-b787-44a53e744d04",
// 			"description": "",
// 			"hb": "",
// 			"streak": 0,
// 			"p_lang": [],
// 			"plans": [],
// 			"subscribers": 0,
// 			"friends": 0,
// 			"status": "",
// 			"posts_count": 0,
// 			"level": 0,
// 			"stack": [],
// 			"logo": "",
// 			"banner": "",
// 			"who": "",
// 			"rating": 0
// 		}
// 	}
// }