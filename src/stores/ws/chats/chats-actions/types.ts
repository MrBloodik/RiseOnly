import { User } from '@stores/profile/types'
import { GetMessageMessage, TypingResponse } from '@stores/ws/message/message-actions/types'

export interface MessagePreview {
	id: string
	sender_id: string
	sender_name: string
	sender: User
	content: string
	timestamp: number
	content_type: string
	is_system_message?: boolean
	system_message_type?: string
	has_attachments?: boolean
	is_forwarded?: boolean
	is_reply?: boolean
	has_reactions?: boolean
	is_pinned?: boolean
	caption?: string
	media_info?: any
}

export type ChatType = "PRIVATE" | "GROUP" | "CHANNEL"

export interface ChatInfo {
	id: string
	title: string
	type_: ChatType
	last_message: GetMessageMessage | null
	unread_count: number
	is_pinned: boolean
	is_muted: boolean
	updated_at: number
	description?: string
	logo_url?: string
	banner_url?: string
	username?: string
	member_count: number
	is_verified: boolean
	is_public: boolean
	role?: string
	joined_at?: number
	notifications_enabled: boolean
	mute_until?: number
	custom_title?: string
	is_anonymous: boolean
	custom_color?: string
	last_activity?: number
	can_invite_users: boolean
	can_pin_messages: boolean
	can_manage_chat: boolean
	creator_info?: string
	user?: any
	participant: User

	// OTHER DATA
	typing_datas: TypingResponse[]
}

export interface GetChatsResponse {
	type: 'chats_list'
	limit: number
	relative_id: string | null
	is_have_more: boolean
	chats: ChatInfo[]
	request_id: string
}

