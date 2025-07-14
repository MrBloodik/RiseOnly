import { Ionicons } from '@expo/vector-icons';
import defaultBannerImport from '@images/BgTheme2.png';
import defaultLogoImport from '@images/defaultlogo.jpg';
import { interpolateColor } from '@shared/config/tsx';
import { LoaderUi } from '@shared/ui/LoaderUi/LoaderUi';
import { notifyInteractionsStore } from '@stores/notify';
import { NotifyData, NotifyType } from '@stores/notify/types';
import { themeStore } from '@stores/theme';
import i18next from 'i18next';
import { ViewPrivacyT } from './types';

export const defaultLogo = defaultLogoImport;
export const reqDefaultLogo = require('@images/defaultlogo.jpg');
export const defaultBanner = defaultBannerImport;

export const emptyArr = (name: string) => {
	console.warn(`[${name}]: Finish function not provided`);
	return;
};

export const getCurrentPrivacyStatus = (status: ViewPrivacyT) => {
	const obj = {
		"ALL": i18next.t("privacy_all_status"),
		"NONE": i18next.t("privacy_none_status"),
		"CONTACTS": i18next.t("privacy_contacts_status"),
		"FRIENDS": i18next.t("privacy_friends_status"),
	};

	return obj[status] || `[getCurrentPrivacyStatus]: Status "${status}" found in object`;
};

export const todoNotify = () => {
	notifyInteractionsStore.showNotify("system", {
		message: i18next.t("not_ready_functional")
	});
};

export const showNotify = (type: NotifyType, data: NotifyData) => {
	notifyInteractionsStore.showNotify(type, data);
};

export const getIconColor = (tabIndex: number, scrollPosition: number, width: number) => {
	const mainColor = themeStore.currentTheme.originalMainGradientColor.color as string;
	const secondaryColor = themeStore.currentTheme.secondTextColor.color as string;

	const virtualCurrentTab = scrollPosition / width;

	const isTransitioningToThisTab =
		(Math.floor(virtualCurrentTab) === tabIndex && virtualCurrentTab < tabIndex + 1) ||
		(Math.ceil(virtualCurrentTab) === tabIndex && virtualCurrentTab > tabIndex - 1);

	if (!isTransitioningToThisTab) {
		return secondaryColor;
	}

	const proximityFactor = 1 - Math.abs(virtualCurrentTab - tabIndex);

	return interpolateColor(secondaryColor, mainColor, proximityFactor);
};

export const getSessionDevice = (device: string) => {
	const rules = [
		{ match: 'macos', text: "Macbook" }
	];

	const rule = rules?.find(r => device?.toLowerCase()?.includes(r?.match));
	if (rule) return rule.text;
	return i18next.t("not_found_session_device");
};

export const getSessionFullDevice = (device: string) => {
	const rules = [
		{ match: 'macos', text: "Macbook" }
	];

	const rule = rules?.find(r => device?.toLowerCase()?.includes(r?.match));
	if (rule) return rule.text;
	return i18next.t("not_found_session_device");
};

export const getSessionLocation = (location: string) => {
	if (location === "неизвестное местоположение") return i18next.t("session_location_notfound");
	return location;
};

export const appName = "Riseonly";
export const overlayColor = 'rgba(0, 0, 0, 0.7)';

export const moderationRequestStatuses = {
	"Pending": {
		text: i18next.t("moderation_request_status_pending"),
		icon: <LoaderUi size="small" color="#ffc31f" />,
		color: "#ffc31f",
	},
	"Fulfilled": {
		text: i18next.t("moderation_request_status_fulfilled"),
		icon: <Ionicons name="checkmark" color="#31c400" size={20} />,
		color: "#31c400",
	},
	"Rejected": {
		text: i18next.t("moderation_request_status_rejected"),
		icon: <Ionicons name="close" color="#f7051d" size={20} />,
		color: "#f7051d",
	},
};

export const colorValues = {
	"BgColorSettings": themeStore.currentTheme.bgTheme.backgroundColor,
	"BtnColorSettings": themeStore.currentTheme.btnsTheme.color,
	"PrimaryColorSettings": themeStore.currentTheme.originalMainGradientColor.color,
	"TextColorSettings": themeStore.currentTheme.textColor.color,
	"SecondaryTextColorSettings": themeStore.currentTheme.secondTextColor.color,
};

export const defaultColorValues = {
	"BgColorSettings": themeStore.defaultTheme.bgTheme.background,
	"BtnColorSettings": themeStore.defaultTheme.btnsTheme.background,
	"PrimaryColorSettings": themeStore.defaultTheme.originalMainGradientColor.color,
	"TextColorSettings": themeStore.defaultTheme.textColor.color,
	"SecondaryTextColorSettings": themeStore.defaultTheme.secondTextColor.color,
};