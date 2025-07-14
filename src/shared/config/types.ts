// USER

import { GetPostFeedResponse } from '@stores/post/post-actions/types';
import { TFunction } from 'i18next';
import { JSX } from 'react';
import { StyleProp, TextStyle, ViewStyle } from 'react-native';

export type GenderT = 'None' | 'Male' | 'Female';
export type RoleT = 'USER' | 'ADMIN' | 'MODERATOR' | 'SUPERMODERATOR';
export type SubscriptionStatus = 'none' | 'active' | 'inactive';
export type ViewPrivacyT = 'ALL' | 'NONE' | 'FRIENDS' | "CONTACTS";

// COMPONENTS

export interface NavBtnType {
	text: string;
	to: string;
	allowUrls: string[];
	icon: React.ReactNode;
	soon?: boolean;
}

// PAGINATION / VIRTUAL LIST

export interface VirtualList<T> {
	list: T;
	items: T;
	total?: number;
	limit: number;
	relativeId: number | string | null;
	isHaveMoreBotOrTop?: boolean;
}

// AUTHOR INFO

export interface AuthorInfoMore {
	p_lang: string[];
	who: string;
	role: string;
	logo: string;
	isPremium: boolean;
}

export interface AuthorInfo {
	id?: string;
	name: string;
	tag: string;
	more: AuthorInfoMore;
}

// MODALS

export interface ModalData {
	title: string;
	message: string;
	buttonText?: string;
	buttonStyle?: StyleProp<ViewStyle>;
	onCancel: () => void;
	onPress: () => void;
	width?: number;
}

// GROUPED BTNS

export interface GroupBtnsType {
	id?: number;
	groupTitle?: string;
	endGroupTitle?: string;
	group: string,
	text: string,
	pretitlePx?: number;
	rightJsx?: JSX.Element;
	rowGap?: number;
	leftTextColor?: string;
	textColor?: string;
	groupStyle?: StyleProp<ViewStyle>;
	pretitleLines?: number;
	pretitleStyle?: StyleProp<TextStyle>;
	btnRightPaddingVertical?: number;
	btnRightMainTextPx?: number;
	height?: number | "auto";
	minHeight?: number | "auto";
	subtitleRealTimeDate?: string;
	groupPaddingVertical?: number;
	btn?: {
		btnText: string,
		btnCallback: () => void,
		btnColor: string,
		btnIcon?: JSX.Element;
	},
	btnDisabled?: boolean;
	leftText?: string,
	url?: string,
	icon?: JSX.Element,
	leftIcon?: JSX.Element | string | (() => void);
	pretitle?: string;
	subtitle?: string;
	field?: string;
	callback?: (currentPrivacy: GroupBtnsType, t: TFunction) => void;
	actionKey?: string;
}

export interface DefaultResponse {
	message: string;
	statusCode: number;
	error: string;
}

export interface DefaultWsResponse {
	type: string;
	success: boolean;
	message: string;
	user_id: string;
}

export const isVirtualList = (
	obj: any
): obj is VirtualList<GetPostFeedResponse[]> => {
	return (
		obj &&
		typeof obj === 'object' &&
		Array.isArray(obj.list) &&
		Array.isArray(obj.items) &&
		typeof obj.limit === 'number' &&
		('relativeId' in obj)
	);
};

// PRE DATA

export type PreDataModeType = "default" | "repair";

// PROFILE BTNS

export interface ProfileBtnsT {
	text: string;
	icon?: JSX.Element;
	callback?: () => void;
}

// HELPERS

export type LoggerTypes = "error" | "warning" | "info" | "system" | "success" | "debug" | "component" | "page" | "ui";