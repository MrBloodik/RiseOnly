
// GET SESSIONS

export interface GetSessionsResponse {
	"created_at": string
	"device_info": string
	"id": string
	"ip_address": string
	"is_current": boolean,
	"last_active": string
	"location": string
	"user_id": string
}

// DELETE SESSION 

export interface DeleteSessionsBody {
	sessionIdToTerminate?: string
	isAll?: boolean
}

export interface DeleteSessionsResponse {
	"message": string
	"remaining_sessions": GetSessionsResponse[]
	"success": boolean
}