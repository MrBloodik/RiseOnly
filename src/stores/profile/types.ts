import { GenderT, RoleT, SubscriptionStatus } from '@config/types'

export interface User {
	id: string
	createdAt: string
	updatedAt: string
	phone: string
	name: string
	isPremium: boolean
	tag: string
	userChatId: string
	customerId: string
	gender: GenderT
	moreId: string
	role: RoleT
	isBlocked: boolean
	more: UserMore
	postsCount: number
	friendsCount: number
	subsCount: number
	subscribersCount: number
	friendRequestId: null | string
	isSubbed: null | boolean
	isFriend: null | boolean
}

export interface UserMore {
	id: string
	description: string
	hb: string | null
	streak: number
	p_lang: string[]
	plans: string[]
	subscribers: number
	friends: number
	status: string
	level: number
	stack: string[]
	logo: string
	banner: string
	who: string
	rating: number
}

export interface Profile extends User {
	subscriptionId: string
	subscriptionStatus: SubscriptionStatus
	subscriptionProvider: string
	subscriptionStartDate: string
	subscriptionEndDate: string
	subscriptionPeriod: string
	subscriptionCancelledAt: string
	subscriptionAutoRenew: boolean
	subscriptionPriceId: string
	subscriptionPaymentMethodId: string
	tokens: {
		access_token: string
		refresh_token: string
		session_id: string
	},
}