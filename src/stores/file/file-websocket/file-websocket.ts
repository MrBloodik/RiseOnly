import { WebsocketRoute } from '@stores/ws/types';
import { WebsocketStore } from '@stores/ws/websocket-store';
import { makeAutoObservable } from 'mobx';
import { fileServicesStore } from '../file-services/file-services';

class FileWebsocketStore {
	constructor() {
		makeAutoObservable(this);

		const routes: WebsocketRoute[] | null = [
			{ type: "progress", action: (res) => fileServicesStore.getUploadVideoProgress(res) },
		];

		const isDev = __DEV__;
		const fileWsUrl = isDev ? "ws://localhost:3004/api/file/ws" : `wss://api.riseonly.net/api/file/ws`;

		this.fileWs = new WebsocketStore({
			wsUrl: fileWsUrl,
			wsName: "FileWsStore",
			routes: routes,
			reconnectTimeout: 5000,
			maxReconnectAttempts: 5,
			connectionTimeout: 10000,
			withoutAuth: true,
			withoutHeartbeat: true
		});
	}

	fileWs: WebsocketStore;
}

export const fileWebsocketStore = new FileWebsocketStore();