import { User } from '@stores/profile/types';
import { ChatInfo } from '@stores/ws/chats/chats-actions/types';

export interface GetMessagesBody {
	"type": "get_messages";
	"chat_id"?: string;
	"limit": number;
	"relative_id": number | null;
	"up": boolean;
	"user_chat_id"?: string;
	"request_id": string;
}

export interface GetMessageMessage {
	"id": string;
	"sender_id": string,
	"sender_name": string,
	"content": string;
	"original_content": string,
	"created_at": number,
	"timestamp": number,
	"content_type": string,
	"sender": User,
	"is_system_message": boolean,
	"has_attachments": boolean,
	"is_forwarded": boolean,
	"is_reply": boolean,
	"has_reactions": boolean,
	"is_pinned": boolean;

	// FROM MOBILE
	isTemp: boolean;
	isSelected: boolean;
}

export interface GetMessagesResponse {
	type: string;
	chat_id: string;
	limit: number;
	relative_id: null | string;
	is_have_more: boolean;
	messages: GetMessageMessage[];
	request_id: string;
}
export interface CreateMessageResponse {
	type: string;
	message_id: string;
	id: string;
	sender_id: string;
	sender_name: string;
	content: string;
	is_reply: boolean;
	is_forwarded: boolean;
	original_content: string;
	chat_info: ChatInfo;
	content_type: string;
	created_at: number;
	is_pinned: boolean;
	timestamp: number;
	has_reactions: boolean;
	is_system_message: boolean;
	has_attachments: boolean;
	entities: null;
	reply_to: null;
	forward_info: {
		from_chat_id: null | string;
		from_message_id: null | string;
		sender_name: null | string;
		date: null | number;
	};
	media_info: {
		type_: string;
		file_url: string;
		thumbnail_url: null | string;
		duration: null | number;
		width: null | number;
		height: null | number;
		file_name: null | string;
		file_size: null | number;
		mime_type: null | string;
	};
	caption: string;
	request_id: string;
	sender: User;
}

export interface CreateMessageBody {
	"type": string;
	"chat_id": string;
	"content": string;
	"original_content": string;
	"content_type": string;
	"request_id": string;
	"reply_to_id": null | string;
	"forward_from_message_id": null | string;
	"forward_from_chat_id": null | string;
	"media_group_id": null | string;
	"entities": null;
	"user_chat_id"?: string;
	"caption": null;
}

export interface TypingBody {
	"type": "message_typing";
	"chat_id": string;
	"is_typing": boolean;
	"request_id": string;
}

export interface TypingResponse {
	"type": "user_typing";
	"chat_id": string;
	"user_id": string;
	"user_name": string;
	"user_tag": string;
	"user_chat_id": string;
	"p_langs": string[];
	"is_typing": boolean;
	"timestamp": number;
	"request_id": string;
}