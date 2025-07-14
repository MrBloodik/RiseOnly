import { AuthWsResponse, WebsocketRoute } from '@stores/ws/types';
import { WebsocketStore } from '@stores/ws/websocket-store';
import { makeAutoObservable } from 'mobx';
import { mobxState } from 'mobx-toolbox';
import { CreateMessageResponse, GetMessagesResponse, TypingResponse } from '../message-actions/types';
import { messageServicesStore } from '../message-services/message-services';

class MessageWebsocketStore {
	constructor() {
		makeAutoObservable(this);

		const routes: WebsocketRoute[] | null = [
			{ type: "messages_list", action: (res) => messageServicesStore.getMessagesResHandler(res as GetMessagesResponse) },
			{ type: "auth_result", action: (res) => messageServicesStore.authResHandler(res as AuthWsResponse) },
			{ type: "message_created", action: (res) => messageServicesStore.createMessageResHandler(res as CreateMessageResponse) },
			{ type: "user_typing", action: (res) => messageServicesStore.typingResHandlers(res as TypingResponse) }
		];
		const isLocal = __DEV__;
		const messageWsUrl = isLocal
			? "ws://localhost:8082/ws?origin=http://localhost"
			: "wss://api.riseonly.net/message/ws";

		this.messageWs = new WebsocketStore({
			wsUrl: messageWsUrl,
			wsName: "MessageWsStore",
			routes: routes
		});
	}

	messageWs: WebsocketStore;
	msgAuthLoading = mobxState(true)("msgAuthLoading");
}

export const messageWebsocketStore = new MessageWebsocketStore();