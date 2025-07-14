import { DefaultWsResponse } from '@shared/config/types';
import { navigate } from '@shared/lib/navigation';
import { numericId } from '@shared/lib/numbers';
import { generateSimpleUUID } from '@shared/lib/string';
import { localStorage } from '@shared/storage';
import { profileStore } from '@stores/profile';
import { makeAutoObservable, reaction, runInAction } from 'mobx';
import { MobxSaiFetchOptions, mobxState } from 'mobx-toolbox';
import { PingRequest } from './chats/chats-services/types';
import { AuthRequest, WebSocketResponse, WebsocketRoute, WebsocketStoreProps, WsSendMessageOptions } from './types';

export type MobxSaiWsInstance<T> = Partial<{
	status: "pending" | "fulfilled" | "rejected";
	data: T | null;
	error: Error | null;

	isPending: boolean;
	isFulfilled: boolean;
	isRejected: boolean;

	setIsPending: () => void;
	setIsFulfilled: () => void;
	setIsRejected: () => void;

	options: MobxSaiFetchOptions;

	value: () => T | null;
	errorMessage: () => string | null;
	fetch: (
		promiseOrFunction: Promise<T> | (() => Promise<T>),
		fromWhere?: "fromScroll" | null,
		fetchWhat?: "top" | "bot" | null
	) => MobxSaiWsInstance<T>;
	setScrollRef: (scrollRef: any) => MobxSaiWsInstance<T>;
	reset: () => MobxSaiWsInstance<T>;
}>;

interface CacheEntry<T = any> {
	timestamp: number;
	data: Partial<MobxSaiWsInstance<T>>;
	options: WsSendMessageOptions;
}

export class WebsocketStates {
	constructor(data: any) {
		this.data = data;
	}

	status: "pending" | "fulfilled" | "rejected" = "pending";
	data: any | null = null;
	error: Error | null = null;

	isPending: boolean = false;
	isFulfilled: boolean = false;
	isRejected: boolean = false;

	setData = (data: any) => {
		this.data = data;
	};

	setIsPending = () => {
		this.status = "pending";
		this.isPending = true;
		this.isFulfilled = false;
		this.isRejected = false;
	};

	setIsFulfilled = () => {
		this.status = "fulfilled";
		this.isPending = false;
		this.isFulfilled = true;
		this.isRejected = false;
	};

	setIsRejected = () => {
		this.status = "rejected";
		this.isPending = false;
		this.isFulfilled = false;
		this.isRejected = true;
	};

}

export class WebsocketStore {
	constructor({
		wsUrl,
		reconnectTimeout = 5000,
		reconnectAttempts = 0,
		maxReconnectAttempts = 5,
		connectionTimeout = 10000,
		wsName = "WsStore",
		routes = null,
		withoutAuth = false,
		withoutHeartbeat = false,
	}: WebsocketStoreProps) {

		this.wsUrl = wsUrl;
		this.wsName = wsName;
		this.wsRoutes = routes;
		this.reconnectTimeout = reconnectTimeout;
		this.reconnectAttempts = reconnectAttempts;
		this.maxReconnectAttempts = maxReconnectAttempts;
		this.connectionTimeout = connectionTimeout;
		this.withoutAuth = withoutAuth;
		this.withoutHeartbeat = withoutHeartbeat;

		makeAutoObservable(this);
	}

	wsUrl = "";
	private wsName = "";
	private wsRoutes: WebsocketRoute[] | null = null;
	private connectionTimeout = 0;
	private reconnectTimeout = 0;
	private reconnectAttempts = 0;
	private maxReconnectAttempts = 0;
	private connectionStabilityTimeout: NodeJS.Timeout | number | null = null;
	private hasReachedMaxAttempts = false;
	private withoutAuth = false;
	private withoutHeartbeat = false;

	private heartbeatInterval: NodeJS.Timeout | number | null = null;
	private authTimeoutTimer: NodeJS.Timeout | number | null = null;
	private processedRequests: Map<string, boolean> = new Map();

	private requestCache: Map<string, CacheEntry> = new Map();
	private maxCacheSize = 100;
	private requestToIdMap: Map<string, string> = new Map();

	requestQueue: Array<{
		message: any,
		data: Partial<MobxSaiWsInstance<any>>,
		options: WsSendMessageOptions,
		resolve: (result: boolean | undefined) => void,
		requestId?: string;
	}> = [];
	pendingRequests = new Map<string, boolean>();
	processingRequestId: string | null = null;
	isProcessingQueue = false;

	wsIsConnected = mobxState(false)("wsIsConnected");
	wsIsConnecting = mobxState(true)("wsIsConnecting");
	wsIsError = mobxState(false)("wsIsError");

	websocket: WebSocket | null = null;

	// FUNCTIONS

	initializeWebSocketConnection = async (onConnect?: () => void) => {
		const {
			wsIsConnected: { wsIsConnected }
		} = this;

		if (this.hasReachedMaxAttempts) {
			console.warn(`[${this.wsName}] Maximum reconnect attempts reached previously, not attempting connection`);
			return () => { };
		}

		if (wsIsConnected && this.isLogined.isLogined) {
			console.log(`[${this.wsName}] WebSocket already connected, skipping initialization`);
			return () => { };
		}

		return this.initializeWebSocket(onConnect);
	};

	initializeWebSocket = async (onConnect?: () => void) => {
		runInAction(() => {
			this.wsIsConnecting.setWsIsConnecting(true);
			this.wsIsConnected.setWsIsConnected(false);
			this.wsIsError.setWsIsError(false);
		});

		if (this.websocket) {
			if ((this.websocket.readyState === WebSocket.OPEN ||
				this.websocket.readyState === WebSocket.CONNECTING)) {
				console.warn(`[${this.wsName}] WebSocket already connected or connecting, skipping initialization`);
				return;
			}
			this.websocket.close();
			this.websocket = null;
		}

		const connectionTimeout = setTimeout(() => {
			if (this.websocket && this.websocket.readyState !== WebSocket.OPEN) {
				console.warn(`[${this.wsName}] Connection timeout reached`);
				this.websocket.close();
				this.attemptReconnect();
			}
		}, this.connectionTimeout);

		try {
			this.connectWebSocket(this.wsUrl);
			(this.websocket as any)?.addEventListener('open', () => {
				clearTimeout(connectionTimeout);
				runInAction(() => {
					this.wsIsConnecting.setWsIsConnecting(false);
					this.wsIsConnected.setWsIsConnected(true);
				});
				onConnect?.();
			});

		} catch (error) {
			clearTimeout(connectionTimeout);
			console.error(`[${this.wsName}] Failed during initialization:`, error);
			this.attemptReconnect();
		}
	};

	connectWebSocket = (url: string) => {
		try {
			// Don't add any protocols as they may interfere with proxying
			const wsProtocols: string[] = [];

			// Don't modify the URL - the origin should be handled by the API Gateway
			runInAction(() => {
				this.websocket = new WebSocket(url, wsProtocols);
				this.websocket.onopen = this.onSocketOpen;
				this.websocket.onmessage = this.onSocketMessage as any;
				this.websocket.onerror = this.onSocketError;
				this.websocket.onclose = this.onSocketClose as any;
			});

		} catch (error) {
			console.error(`[${this.wsName}] Failed to create WebSocket connection:`, error);
			this.attemptReconnect();
		}
	};

	startHeartbeat = () => {
		if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
		this.heartbeatInterval = setInterval(() => {
			this.sendPing().catch(error => {
				console.error(`[${this.wsName}] Error in heartbeat:`, error);
			});
		}, 30 * 1000);
	};

	attemptReconnect = () => {
		if (this.reconnectAttempts >= this.maxReconnectAttempts) {
			console.error(`[${this.wsName}] Maximum reconnect attempts reached`);
			this.hasReachedMaxAttempts = true;
			this.closeConnection();
			return;
		}

		this.reconnectAttempts++;

		console.log(
			`[${this.wsName}] Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${this.reconnectTimeout}ms`
		);

		setTimeout(() => {
			this.initializeWebSocket();
		}, this.reconnectTimeout);
	};

	sendPing = async () => {
		const pingMessage: PingRequest = { type: 'ping' };
		try {
			await this.mobxSaiWs(pingMessage, {}, { bypassQueue: true, needStates: false });
			return true;
		} catch (error) {
			console.error(`[${this.wsName}] Error sending ping:`, error);
			return false;
		}
	};

	closeConnection = () => {
		const {
			wsIsConnected: { setWsIsConnected },
			wsIsConnecting: { setWsIsConnecting },
			wsIsError: { setWsIsError },
			isLogined: { setIsLogined }
		} = this;

		console.warn(`[${this.wsName}] Closing WebSocket connection`);

		if (this.connectionStabilityTimeout) {
			clearTimeout(this.connectionStabilityTimeout);
			this.connectionStabilityTimeout = null;
		}

		runInAction(() => {
			setWsIsConnected(false);
			setWsIsConnecting(false);
			setWsIsError(true);
			setIsLogined(false);
		});
	};

	// SEND

	/**
	 * Send a WebSocket message with request queue management
	 * 
	 * This method handles all WebSocket message sending with advanced options:
	 * 
	 * - Queue Management: Messages are queued and processed one at a time by default
	 * - State Management: Updates MobxSaiWsInstance states (pending, fulfilled, rejected)
	 * - Conditional Execution: Can skip requests based on existing data or pending status
	 * - Queue Bypassing: Critical messages like ping and auth can bypass the queue with bypassQueue option
	 * - Caching: Stores and retrieves request data based on options.id for efficient data reuse
	 * 
	 * @param message The message to send
	 * @param data The MobxSaiWsInstance to update with state changes
	 * @param options Configuration options including queue and state behavior
	 * @returns Promise resolving to boolean indicating success
	 */
	mobxSaiWs = (
		message: any,
		data: Partial<MobxSaiWsInstance<any>>,
		options: WsSendMessageOptions = {
			id: numericId(),
			needPending: true,
			fetchIfHaveData: true,
			fetchIfPending: false,
			needStates: true,
			bypassQueue: false,
			maxCacheData: this.maxCacheSize
		}
	): any => {
		if (!message.request_id) {
			message.request_id = generateSimpleUUID();
		}

		const requestId = message.request_id;
		const requestStateId = options.id || requestId;

		if (requestStateId && options.id) {
			this.setRequestToIdMap(requestId, options.id, options);
			const cachedEntry = this.requestCache.get(options.id);

			if (cachedEntry) {
				console.log(`[${this.wsName}] Found cached data for ${options.id}`);

				if (!options.fetchIfHaveData && cachedEntry.data?.data) {
					console.info(`[${this.wsName}] Skipping request ${requestId} because data already exists and fetchIfHaveData is false`);
					options.setData?.(cachedEntry.data as Partial<MobxSaiWsInstance<any>>);
					return cachedEntry.data as Partial<MobxSaiWsInstance<any>>;
				}

				if (options.needStates) {
					if (!options.fetchIfPending && data?.status === "pending" && data?.isPending) {
						console.log(`[${this.wsName}] Skipping request ${requestId} because it's already pending and fetchIfPending is false`);
						return false;
					}

					if (options.needPending) {
						data.status = "pending";
						data.isPending = true;
						data.isFulfilled = false;
						data.isRejected = false;
					}
				}
			} else {
				const dataToCache = new WebsocketStates({});
				dataToCache.setIsPending();
				this.updateCache(options.id, dataToCache, message, options);
				this.sendMessage(message, data, options);
				return dataToCache;
			}
		}

		if (options.bypassQueue) {
			console.log(`[${this.wsName}] Bypassing queue for request ${requestId}`);
			const result = this.sendMessage(message, data, options);
			return result;
		}

		new Promise<boolean | undefined>((resolve) => {
			console.log(`[${this.wsName}] Queuing request ${requestId} with stateId ${requestStateId}, queue length: ${this.requestQueue.length}`);
			this.requestQueue.push({
				message,
				data,
				options: { ...options, stateId: requestStateId },
				resolve,
				requestId
			});

			if (!this.isProcessingQueue) {
				this.processNextRequest();
			}
		});
	};

	private processNextRequest = () => {
		if (this.requestQueue.length === 0) {
			this.isProcessingQueue = false;
			this.processingRequestId = null;
			return;
		}

		if (this.processingRequestId && this.pendingRequests.has(this.processingRequestId)) {
			return;
		}

		this.isProcessingQueue = true;
		const { message, data, options, resolve, requestId } = this.requestQueue.shift()!;

		if (data) {
			data.status = "pending";
			data.isPending = true;
			data.isFulfilled = false;
			data.isRejected = false;
		}

		if (requestId) {
			this.processingRequestId = requestId;
			this.pendingRequests.set(requestId, true);

			setTimeout(() => {
				if (this.pendingRequests.has(requestId)) {
					console.warn(`[${this.wsName}] Request ${requestId} timed out, continuing queue`);

					if (data) {
						data.status = "rejected";
						data.isPending = false;
						data.isRejected = true;
						data.isFulfilled = false;
						data.error = new Error("Request timed out");
						data.errorMessage = () => "Request timed out";
					}

					this.pendingRequests.delete(requestId);
					if (this.processingRequestId === requestId) {
						this.processingRequestId = null;
						this.processNextRequest();
					}
				}
			}, 5000); // 5 second timeout
		}

		const result = this.sendMessage(message, data, options);
		resolve(result);
	};

	private sendMessage = (
		message: any,
		data: Partial<MobxSaiWsInstance<any>>,
		options: WsSendMessageOptions
	): boolean | undefined => {
		const { needPending, fetchIfHaveData, fetchIfPending } = options;

		if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
			console.warn(`[${this.wsName}] Cannot send message, socket is not open`);
			this.initializeWebSocketConnection();
			return;
		}

		try {
			const messageString = JSON.stringify(message);
			if (message.type !== "ping") {
				console.log(`[${this.wsName}] Sending message:`, messageString);
			}
			this.websocket.send(messageString);
			return true;
		} catch (error: any) {
			data.error = error;
			data.errorMessage = () => JSON.stringify(error);
			data.isRejected = true;
			data.isFulfilled = false;
			data.isPending = false;
			data.status = "rejected";
			console.error(`[${this.wsName}] Error sending message:`, error);
			return false;
		}
	};

	loginLoading = mobxState(false)("loginLoading");
	isLogined = mobxState(false)("isLogined");
	auth: MobxSaiWsInstance<DefaultWsResponse> = {};

	authAction = async () => {
		const {
			isLogined: { isLogined, setIsLogined },
			loginLoading: { setLoginLoading }
		} = this;

		const userFromStorage = await localStorage.get("profile");
		const tokensFromStorage = await localStorage.get("tokens");
		const user: any = userFromStorage ? userFromStorage : profileStore.profile;
		const tokens: any = tokensFromStorage;

		try {
			if (this.authTimeoutTimer) {
				clearTimeout(this.authTimeoutTimer);
				this.authTimeoutTimer = null;
			}

			setIsLogined(false);
			setLoginLoading(true);

			if (!user) {
				console.log(`[${this.wsName}] No profile found, cannot authenticate`, user);
				return;
			}

			if (!tokens) {
				console.log(`[${this.wsName}] No access token found, cannot authenticate`, user);
				navigate('SignStack', {
					screen: 'SignStack',
					params: {
						screen: 'SignIn'
					}
				});
				setLoginLoading(false);
				return;
			}

			const deviceId = await this.getOrCreateDeviceId();

			const authMessage: AuthRequest = {
				type: 'auth',
				token: tokens.access_token,
				device_id: deviceId
			};

			console.log(`[${this.wsName}] Auth message structure:`, authMessage);
			await this.mobxSaiWs(authMessage, this.auth, { bypassQueue: true, needStates: false });

			this.authTimeoutTimer = setTimeout(() => {
				if (this.loginLoading && !isLogined) {
					console.warn(`[${this.wsName}] Authentication timeout reached`);

					if (!user) {
						console.log(`[${this.wsName}] No profile found, cannot authenticate`, user);
						return;
					}
				}
			}, 5000);

			reaction(
				() => this.auth.status,
				(_status) => {
					if (this.auth.status === "fulfilled") {
						console.log(`[${this.wsName}] Auth message sent successfully`);
						this.authTimeoutTimer = null;
						return;
					} else {
						console.error(`[${this.wsName}] Failed to send auth message`);
						setLoginLoading(false);
						this.authTimeoutTimer = null;
						return;
					}
				});
		} catch (error) {
			console.error(`[${this.wsName}] Error during authentication:`, error);
			setLoginLoading(false);
			if (this.authTimeoutTimer) {
				clearTimeout(this.authTimeoutTimer);
				this.authTimeoutTimer = null;
			}
		}
	};

	// HELPERS

	getOrCreateDeviceId = async (): Promise<string> => {
		try {
			let deviceId = await localStorage.get('device_id') as string | null;

			if (!deviceId) {
				deviceId = generateSimpleUUID();
				await localStorage.set('device_id', deviceId);
				console.log(`[${this.wsName}] Generated new device ID:`, deviceId);
			} else {
				console.log(`[${this.wsName}] Using existing device ID:`, deviceId);
			}

			return deviceId;
		} catch (error) {
			console.error(`[${this.wsName}] Error getting/creating device ID:`, error);
			return `temp-${generateSimpleUUID()}`;
		}
	};

	// EVENTS

	onSocketOpen = () => {
		const { wsIsConnecting: { setWsIsConnecting } } = this;
		console.log(`[${this.wsName}] WebSocket connection established`);
		setWsIsConnecting(false);

		if (this.connectionStabilityTimeout) {
			clearTimeout(this.connectionStabilityTimeout);
		}

		this.connectionStabilityTimeout = setTimeout(() => {
			if (this.websocket && this.websocket.readyState === WebSocket.OPEN && this.isLogined.isLogined) {
				this.reconnectAttempts = 0;
				this.hasReachedMaxAttempts = false;
				console.log(`[${this.wsName}] Connection stable and authenticated, reset reconnect attempts to 0`);
			}
		}, 15000); // 15 секунд стабильного соединения

		if (!this.withoutHeartbeat) {
			this.startHeartbeat();
		}

		if (!this.withoutAuth) {
			this.authAction();
		}
	};

	onSocketClose = (event: WebSocketCloseEvent) => {
		console.log(`[${this.wsName}] WebSocket closed with code ${event.code}, reason: ${event.reason}`);

		if (event.code === 1006) {
			// Abnormal closure - likely due to proxy issues
			console.warn(`[${this.wsName}] Abnormal closure detected, attempting reconnect`);
			this.attemptReconnect();
			return;
		}

		if (!event.wasClean) {
			console.warn(`[${this.wsName}] Connection closed uncleanly, attempting reconnect`);
			this.attemptReconnect();
			return;
		}

		this.closeConnection();
	};

	onSocketMessage = (event: WebSocketMessageEvent) => {
		if (!event.data) {
			console.warn(`[${this.wsName}] Received empty message`);
			return;
		}

		let jsonString: string;
		let message: WebSocketResponse;

		if (typeof event.data === 'string') {
			jsonString = event.data;
		} else if (event.data instanceof ArrayBuffer) {
			const buffer = event?.data as ArrayBuffer;
			if (buffer.byteLength > 0) {
				try {
					const decoder = new TextDecoder('utf-8');
					jsonString = decoder.decode(buffer);
				} catch (error) {
					console.warn(`[${this.wsName}] TextDecoder failed, falling back to legacy method:`, error);
					if (buffer.byteLength < 1024 * 100) {
						const uint8Array = new Uint8Array(buffer);
						jsonString = this.arrayBufferToString(uint8Array);
					} else {
						console.log(`[${this.wsName}] Large ArrayBuffer detected, processing in chunks`);
						const chunks: string[] = [];
						const uint8Array = new Uint8Array(buffer);
						const chunkSize = 10000; // Размер части
						for (let i = 0; i < uint8Array.length; i += chunkSize) {
							const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
							chunks.push(String.fromCharCode.apply(null, Array.from(chunk)));
						}
						jsonString = chunks.join('');
					}
				}
				console.log(`[${this.wsName}] Converted ArrayBuffer to string, length:`, jsonString.length);
			} else {
				console.warn(`[${this.wsName}] Received empty ArrayBuffer`);
				jsonString = '';
			}
		} else if (event.data instanceof Blob) {
			console.log(`[${this.wsName}] Received Blob data, converting...`);
			const reader = new FileReader();
			reader.onload = (e) => {
				try {
					const text = e.target?.result as string;
					console.log(`[${this.wsName}] Blob converted to string:`, text);
					this.handleParsedMessage(text);
				} catch (error) {
					console.error(`[${this.wsName}] Error processing Blob data:`, error);
				}
			};
			reader.readAsText(event.data);
			return;
		} else {
			console.warn(`[${this.wsName}] Unknown data type:`, event.data);
			jsonString = JSON.stringify(event.data);
		}
		this.handleParsedMessage(jsonString);
	};

	onSocketError = (error: Event) => {
		console.error(`[${this.wsName}] WebSocket error:`, error);
		console.error(`[${this.wsName}] Error details:`, (error as any).message);

		// Clear event handlers
		console.log(`[${this.wsName}] Clearing event handlers on error`);
		if (this.websocket) {
			this.websocket.onopen = null;
			this.websocket.onmessage = null;
			this.websocket.onerror = null;
			this.websocket.onclose = null;
		}

		this.attemptReconnect();
	};

	// CRYPTO

	handleParsedMessage = (jsonString: string) => {
		if (jsonString === '[]' || jsonString === '{}') {
			console.error("[${this.wsName}] Received empty data structure: ${jsonString}");
			return;
		}

		let message: WebSocketResponse;

		try {
			message = JSON.parse(jsonString) as WebSocketResponse;

			if (!message) {
				console.warn(`[${this.wsName}] Message is undefined after parsing`);
				return;
			}

			if (typeof message !== 'object') {
				console.warn(`[${this.wsName}] Parsed message is not an object:`, message);
				return;
			}

			if (!message.type) {
				if (Object.keys(message).length === 0) {
					console.warn(`[${this.wsName}] Message is empty object or array`);
					return;
				}
				console.warn(`[${this.wsName}] Message has no type:`, message);
				return;
			}
		} catch (parseError) {
			console.error(`[${this.wsName}] Failed to parse message:`, jsonString);
			console.error(`[${this.wsName}] Raw message content:`, Array.from(jsonString).map(c => c.charCodeAt(0)));
			return;
		}

		if ((message as any)?.message === "Необходима аутентификация") {
			// this.attemptReconnect()
			return;
		}

		if (message.type !== "ping") {
			console.log(`[${this.wsName}] Message type: ${message.type}, content:`, message);
		}
		this.processIncomingMessage(message);
	};

	arrayBufferToString = (uint8Array: Uint8Array): string => {
		try {
			const decoder = new TextDecoder('utf-8');
			const text = decoder.decode(uint8Array);
			return text;
		} catch (error) {
			console.warn(`[${this.wsName}] TextDecoder failed, using legacy method:`, error);
			const chunks: string[] = [];
			const chunkSize = 10000; // Размер части

			for (let i = 0; i < uint8Array.length; i += chunkSize) {
				const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
				chunks.push(String.fromCharCode.apply(null, Array.from(chunk)));
			}

			return chunks.join('');
		}
	};

	processIncomingMessage = (message: WebSocketResponse) => {
		if (!message) {
			console.warn(`[${this.wsName}] Received undefined message`);
			return;
		}

		if (typeof message !== 'object') {
			console.warn(`[${this.wsName}] Received non-object message:`, message);
			return;
		}

		if (!message.type) {
			console.warn(`[${this.wsName}] Received message without type:`, message);
			return;
		}

		if ('request_id' in message && message.request_id) {
			const requestId = message.request_id as string;
			const cacheId = this.requestToIdMap.get(requestId);

			if (this.pendingRequests.has(requestId)) {
				console.log(`[${this.wsName}] Request ${requestId} completed, processing next in queue`);

				let dataToUpdate: Partial<MobxSaiWsInstance<any>> | null = null;
				let stateId = requestId;
				let originalMessage: any = null;
				let originalOptions: WsSendMessageOptions = {};

				const pendingQueueItem = this.requestQueue.find(req => req.requestId === requestId);
				if (pendingQueueItem) {
					dataToUpdate = pendingQueueItem.data;
					stateId = pendingQueueItem.options.stateId || requestId;
					originalMessage = pendingQueueItem.message;
					originalOptions = pendingQueueItem.options;
				}
				else if (this.processingRequestId === requestId) {
					for (const key in this) {
						const item = (this as any)[key];
						if (item && typeof item === 'object' && 'status' in item) {
							if (item.status === 'pending' && item.isPending) {
								dataToUpdate = item;
								break;
							}
						}
					}
				}

				if (dataToUpdate) {
					if (message.error || message.status === 'error') {
						const errorMsg = message.error || message.message || 'Unknown error';

						dataToUpdate.status = "rejected";
						dataToUpdate.isPending = false;
						dataToUpdate.isRejected = true;
						dataToUpdate.isFulfilled = false;
						dataToUpdate.error = new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
						dataToUpdate.errorMessage = () => typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg);
					} else {
						dataToUpdate.status = "fulfilled";
						dataToUpdate.isPending = false;
						dataToUpdate.isRejected = false;
						dataToUpdate.isFulfilled = true;

						if (message.data || message.result) {
							dataToUpdate.data = message.data || message.result;
						}

						const dataToCache = new WebsocketStates(message);
						dataToCache.setIsFulfilled();

						if (cacheId) {
							this.updateCache(cacheId, dataToCache, originalMessage || message, originalOptions);
						}
					}
				}

				this.pendingRequests.delete(requestId);

				if (this.processingRequestId === requestId) {
					this.processingRequestId = null;
					setTimeout(() => this.processNextRequest(), 0);
				}
			} else if (cacheId) {
				if (!message.error && message.status !== 'error') {
					const cachedData = this.requestCache.get(cacheId);
					if (cachedData) {
						cachedData.data.status = "fulfilled";
						cachedData.data.isPending = false;
						cachedData.data.isRejected = false;
						cachedData.data.isFulfilled = true;
						cachedData.options.setData?.(cachedData.data);
					}
				}
			}

			this.requestToIdMap.delete(requestId);
			this.processedRequests.set(requestId, true);
			if (this.processedRequests.size > 100) {
				const keys = Array.from(this.processedRequests.keys());
				const keysToDelete = keys.slice(0, 20);
				keysToDelete.forEach(key => this.processedRequests.delete(key));
			}
		}

		if (!this.wsRoutes) {
			console.warn(`[${this.wsName}]: wsRoutes is not provided`);
			return;
		}

		if (message.request_id) {
			const requestId = message.request_id;

			const cacheId = this.requestToIdMap.get(requestId);
			const dataToCache = new WebsocketStates(message);
			dataToCache.setIsFulfilled();

			if (cacheId) {
				this.updateCache(cacheId, dataToCache, message, { id: cacheId });
			}
		}

		const route = this.wsRoutes.find(r => r.type === message.type);

		if (route) {
			route.action(message);
			return;
		}

		if (message.type == "pong") return;

		console.warn(`[${this.wsName}] Unknown message type:`, message.type);
	};

	private setRequestToIdMap = (requestId: string, id: string, options: WsSendMessageOptions) => {
		this.requestToIdMap.set(requestId, id);

		if (this.requestToIdMap.size > (options.maxCacheData || this.maxCacheSize)) {
			this.pruneRequestToIdMap();
		}
	};

	private pruneRequestToIdMap = () => {
		const keys = Array.from(this.requestToIdMap.keys());
		const keysToDelete = keys.slice(0, keys.length - this.maxCacheSize);
		keysToDelete.forEach(key => this.requestToIdMap.delete(key));
	};

	private updateCache = (
		stateId: string | undefined,
		data: Partial<MobxSaiWsInstance<any>>,
		message: any,
		options: WsSendMessageOptions
	) => {
		if (!stateId || !options.id) return;

		console.log(`[${this.wsName}] Caching data for ${options.id}`);

		const cacheEntry: CacheEntry = {
			timestamp: Date.now(),
			data: { ...data },
			options
		};

		this.requestCache.set(options.id, cacheEntry);

		if (this.requestCache.size > (options.maxCacheData || this.maxCacheSize)) {
			this.pruneCache();
		}
	};

	private pruneCache = () => {
		if (this.requestCache.size <= this.maxCacheSize) return;

		const entries = Array.from(this.requestCache.entries())
			.sort((a, b) => a[1].timestamp - b[1].timestamp);

		const entriesToRemove = entries.slice(0, entries.length - this.maxCacheSize);
		entriesToRemove.forEach(([key]) => {
			this.requestCache.delete(key);
		});

		console.log(`[${this.wsName}] Pruned ${entriesToRemove.length} entries from cache`);
	};

}