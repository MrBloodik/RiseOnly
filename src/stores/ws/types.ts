import { AuthResultResponse, ChatCreatedResponse, ChatDeletedResponse, ChatEditedResponse, ChatsListResponse, CreateChatRequest, DeleteChatRequest, EditChatRequest, ErrorResponse, GetChatHistoryRequest, GetChatsRequest, PingRequest, PongResponse, SendMessageRequest } from './chats/chats-services/types';
import { CreateMessageBody, CreateMessageResponse, GetMessagesBody, GetMessagesResponse } from './message/message-actions/types';

export interface WebsocketRoute<T = unknown> {
	type: string;
	action: (message: T) => void;
}

export interface WsSendMessageOptions {
	id?: string;
	arrPath?: string;
	setData?: (data: any) => void;
	fetchIfHaveData?: boolean;
	fetchIfPending?: boolean;
	needPending?: boolean;
	stateId?: string;
	needStates?: boolean;
	bypassQueue?: boolean;
	maxCacheData?: number;
}

export interface WebsocketStoreProps {
	wsUrl: string;
	reconnectTimeout?: number;
	reconnectAttempts?: number;
	maxReconnectAttempts?: number;
	reconnectionTime?: number;
	connectionTimeout?: number;
	wsName?: string;
	routes?: WebsocketRoute[] | null;
	withoutAuth?: boolean;
	withoutHeartbeat?: boolean;
}

export interface AuthRequest {
	type: 'auth';
	token: string;
	device_id?: string;
}

export type WebSocketRequest =
	| AuthRequest
	| GetChatsRequest
	| CreateChatRequest
	| EditChatRequest
	| DeleteChatRequest
	| SendMessageRequest
	| GetChatHistoryRequest
	| PingRequest
	| GetMessagesBody
	| CreateMessageBody;

export interface BaseWebSocketResponse {
	type: string;
	request_id?: string;
	error?: string | any;
	status?: string;
	message?: string;
	result?: any;
	data?: any;
}

export type WebSocketResponse =
	| (AuthResultResponse & BaseWebSocketResponse)
	| (ChatsListResponse & BaseWebSocketResponse)
	| (ChatCreatedResponse & BaseWebSocketResponse)
	| (ChatEditedResponse & BaseWebSocketResponse)
	| (ChatDeletedResponse & BaseWebSocketResponse)
	| (PongResponse & BaseWebSocketResponse)
	| (ErrorResponse & BaseWebSocketResponse)
	| (GetMessagesResponse & BaseWebSocketResponse)
	| (CreateMessageResponse & BaseWebSocketResponse);

// RESULTS

export interface AuthWsResponse {
	"message": string;
	"success": boolean;
	"type": string;
	"user_id": string;
}

export type WsLoadingStatus = "idle" | "pending" | "fulfilled" | "rejected";