import { showNotify } from '@shared/config/const';
import { appStorage } from '@shared/storage/AppStorage';
import { AuthWsResponse } from '@stores/ws/types';
import { WebsocketStates } from '@stores/ws/websocket-store';
import i18n from 'i18n';
import { makeAutoObservable, runInAction } from 'mobx';
import { useMobxUpdate } from 'mobx-toolbox';
import { chatsActionsStore } from '../chats-actions/chats-actions';
import { chatsInteractionsStore } from '../chats-interactions/chats-interactions';
import { chatsWebsocketStore } from '../chats-websocket/chats-websocket';
import { ChatsListResponse } from './types';

class ChatsServicesStore {
	constructor() { makeAutoObservable(this); }

	// ==================== HANDLERS =========================

	// AUTH HANDLERS

	authSuccessHandler = (message: AuthWsResponse) => {
		const { getChatsAction, chats } = chatsActionsStore;
		const { chatAuthLoading: { setChatAuthLoading } } = chatsWebsocketStore;

		if (!message.success) return;
		setChatAuthLoading(false);

		if (!chats.data) getChatsAction();

		chatsWebsocketStore.chatWs.isLogined.setIsLogined(true);
	};

	// GET CHATS HANDLERS

	getChatsSuccessHandler = async (message: ChatsListResponse) => {
		const { setChatUpdater } = chatsInteractionsStore;

		if (!message?.chats) {
			showNotify("error", { message: i18n.t("get_chats_error") });
			return;
		}

		if (message.chats && message.chats.length > 0) {
			const avatarsToCache: string[] = [];

			message.chats.forEach(chat => {
				if (chat.logo_url && chat.logo_url !== "") {
					avatarsToCache.push(chat.logo_url);
				}

				if (chat.participant && chat.participant.more && chat.participant.more.logo && chat.participant.more.logo !== "") {
					avatarsToCache.push(chat.participant.more.logo);
				}
			});

			if (avatarsToCache.length > 0) {
				try {
					appStorage.batchSaveMedia(avatarsToCache)
						.then(cachedPaths => {
							console.log(`Cached ${Object.keys(cachedPaths).length} chat avatars`);
						})
						.catch(error => {
							console.error('Error caching chat avatars:', error);
						});
				} catch (error) {
					console.error('Error preparing chat avatars for caching:', error);
				}
			}
		}

		appStorage.setChatsData(message.chats, "all_chats");

		runInAction(() => {
			chatsActionsStore.chats.data = message;
			chatsActionsStore.chats.status = 'fulfilled';
			chatsActionsStore.chats.isPending = false;

			setChatUpdater(useMobxUpdate(() => message.chats));
		});
	};

	setChatsFromCache = async (limit: number = 20, relativeId?: string) => {
		const cachedChats = await appStorage.getChatsData();

		if (cachedChats.length === 0 || !cachedChats) return;

		runInAction(() => {
			const cachedChatsData = new WebsocketStates({
				type: "chats_list",
				limit: limit,
				relative_id: relativeId || null,
				is_have_more: false,
				chats: cachedChats,
			});
			cachedChatsData.setIsFulfilled();
			chatsActionsStore.chats = cachedChatsData;
		});
	};
}

export const chatsServicesStore = new ChatsServicesStore(); 