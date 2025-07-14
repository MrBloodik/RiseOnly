import { generateSimpleUUID } from '@shared/lib/string';
import { appStorage } from '@shared/storage';
import { MobxSaiWsInstance } from '@stores/ws/websocket-store';
import { makeAutoObservable } from 'mobx';
import { chatsServicesStore } from '../chats-services/chats-services';
import { GetChatsRequest } from '../chats-services/types';
import { chatsWebsocketStore } from '../chats-websocket/chats-websocket';
import { ChatInfo, GetChatsResponse } from './types';

class ChatsActionsStore {
	constructor() { makeAutoObservable(this); }

	// CHATS

	chats: MobxSaiWsInstance<GetChatsResponse> = {};
	cachedChats: MobxSaiWsInstance<ChatInfo[]> = {};

	getChatsAction = async (limit: number = 20, relativeId?: string, up: boolean = false) => {
		const { chatWs: { mobxSaiWs } } = chatsWebsocketStore;
		const { setChatsFromCache } = chatsServicesStore;

		await setChatsFromCache(limit, relativeId);

		const requestId = generateSimpleUUID();
		const message: GetChatsRequest = {
			type: 'get_chats',
			limit,
			request_id: requestId
		};

		if (relativeId) message.relative_id = relativeId;
		if (up) message.up = up;

		this.chats = mobxSaiWs(
			message,
			this.chats,
			{
				id: "getChats",
				fetchIfPending: false,
				fetchIfHaveData: false,
				setData: (data) => {
					this.chats = data;
					appStorage.setChatsData(data?.chats || [], "all_chats");
				}
			}
		);
	};
}

export const chatsActionsStore = new ChatsActionsStore();