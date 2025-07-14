import { getCurrentRoute } from '@shared/lib/navigation';
import { numericId } from '@shared/lib/numbers';
import { generateSimpleUUID } from '@shared/lib/string';
import { useMobxContextMenu } from '@stores/global-interactions/context-menu-interactions/context-menu-interactions';
import { User } from '@stores/profile/types';
import { chatsInteractionsStore } from '@stores/ws/chats';
import { makeAutoObservable } from 'mobx';
import { mobxState, MobxUpdateInstance } from 'mobx-toolbox';
import { messageActionsStore } from '../message-actions/message-actions';
import { CreateMessageBody, GetMessageMessage } from '../message-actions/types';
import { messageServicesStore } from '../message-services/message-services';

class MessageInteractionsStore {
	constructor() {
		makeAutoObservable(this);
	}

	msgText = mobxState("")("msgText");
	msgCloneText = mobxState("")("msgCloneText");
	msgRawText = mobxState("")("msgRawText");
	msgInputFocus = mobxState(false)("msgInputFocus");
	msgIsFocused = mobxState(false)("msgIsFocused");
	selectedMessage = mobxState<GetMessageMessage | null>(null)("selectedMessage");
	selectedMessageForContextMenu = mobxState<GetMessageMessage | null>(null)("selectedMessageForContextMenu");

	// CONTEXT MENU

	msgContextMenu = useMobxContextMenu();

	// HOLD CONTEXT MENU

	itemCordinates = mobxState<{ x: number, y: number; }>({ x: 0, y: 0 })("itemCordinates");

	// TEMP ID

	msgTempIds = mobxState<string[]>([])("msgTempIds");

	// HANDLERS

	onSendMsgHandler = () => {
		const { selectedChat } = chatsInteractionsStore;
		const { createMessageAction } = messageActionsStore;
		const { preCreateMessage } = messageServicesStore;
		const {
			msgTempIds: { setMsgTempIds },
			msgText: { msgText },
		} = this;

		const params: {
			chatId: string;
			previewUser: User;
		} = getCurrentRoute()?.params as any;

		if (!selectedChat && !params?.previewUser) return;
		if (!msgText) {
			console.warn("[createMessageAction]: no text to create message");
			return;
		}

		const tempId = numericId();

		const body: CreateMessageBody = {
			"type": "create_message",
			"content": msgText, // TODO: Заменить когда добавишь норм текстовой редактор
			"chat_id": "",
			"original_content": msgText,
			"content_type": "text",
			"request_id": generateSimpleUUID(),
			"reply_to_id": null,
			"forward_from_message_id": null,
			"forward_from_chat_id": null,
			"media_group_id": null,
			"entities": null,
			"caption": null
		};

		preCreateMessage(tempId);
		setMsgTempIds(p => [...p, tempId]);

		createMessageAction(body);
	};

	// UPDATERS

	messageUpdater: MobxUpdateInstance<GetMessageMessage> | null = null;
	setMessageUpdater = (updater: MobxUpdateInstance<GetMessageMessage>) => this.messageUpdater = updater;
}

export const messageInteractionsStore = new MessageInteractionsStore();