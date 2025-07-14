import { AuthWsResponse, WebsocketRoute } from '@stores/ws/types';
import { WebsocketStore } from '@stores/ws/websocket-store';
import { makeAutoObservable } from 'mobx';
import { mobxState } from 'mobx-toolbox';
import { chatsServicesStore } from '../chats-services/chats-services';
import { ChatsListResponse } from '../chats-services/types';

class ChatsWebsocketStore {
	constructor() {
		makeAutoObservable(this);

		const routes: WebsocketRoute[] | null = [
			{ type: "chats_list", action: (res) => chatsServicesStore.getChatsSuccessHandler(res as ChatsListResponse) },
			{ type: "auth_result", action: (res) => chatsServicesStore.authSuccessHandler(res as AuthWsResponse) },
		];

		const isLocal = __DEV__;
		const chatWsUrl = isLocal
			? "http://localhost:8080/chat/ws?origin=http://localhost"
			: "wss://api.riseonly.net/chat/ws";

		this.chatWs = new WebsocketStore({
			wsUrl: chatWsUrl,
			wsName: "ChatWsStore",
			routes: routes
		});
	}

	chatWs: WebsocketStore;
	chatAuthLoading = mobxState(true)("chatAuthLoading");
}

export const chatsWebsocketStore = new ChatsWebsocketStore();
