import { Ionicons } from '@expo/vector-icons';
import { CopyMsgIcon } from '@icons/MainPage/Chats/CopyMsgIcon';
import { BtnColorCustomizationIcon } from '@icons/MainPage/Settings/BtnColorCustomizationIcon';
import { LanguageIcon } from '@icons/MainPage/Settings/LanguageIcon';
import { MemorySettingsIcon } from '@icons/MainPage/Settings/MemorySettingsIcon';
import { ModerationSettingsIcon } from '@icons/MainPage/Settings/ModerationSettingsIcon';
import { NotificationSettingsIcon } from '@icons/MainPage/Settings/NotificationSettingsIcon';
import { PrimaryColorCustomizationIcon } from '@icons/MainPage/Settings/PrimaryColorCustomizationIcon';
import { PrivacySettingsIcon } from '@icons/MainPage/Settings/PrivacySettingsIcon';
import { ProfileSettingsIcon } from '@icons/MainPage/Settings/ProfileSettingsIcon';
import { SessionsSettingsIcon } from '@icons/MainPage/Settings/SessionsSettingsIcon';
import { TextColorCustomizationIcon } from '@icons/MainPage/Settings/TextColorCustomizationIcon';
import { UncoloredCustomizationIcon } from '@icons/MainPage/Settings/UncoloredCustomizationIcon';
import { AppereanceColoredIcon } from '@icons/Ui/AppereanceColoredIcon';
import { ArrowRightIcon } from '@icons/Ui/ArrowRightIcon';
import { CommentSettingIcon } from '@icons/Ui/CommentSettingIcon';
import { CustomizationColoredIcon } from '@icons/Ui/CustomizationColoredIcon';
import { formatSmartDate } from '@shared/lib/date';
import { navigate } from '@shared/lib/navigation';
import { formatBytes, formatPercent } from '@shared/lib/text';
import { Box, MainText, SecondaryText, SwitchUi } from '@shared/ui';
import { LoaderUi } from '@shared/ui/LoaderUi/LoaderUi';
import { authServiceStore } from '@stores/auth';
import { MemoryUsageStats, memoryStore } from '@stores/memory';
import { moderationStore } from '@stores/moderation';
import { ModerationRequestResponse } from '@stores/moderation/moderation-actions/types';
import { postInteractionsStore } from '@stores/post';
import { profileStore } from '@stores/profile';
import { profileActionsStore } from '@stores/profile/profile-actions/profile-actions';
import { GetPrivacySettingsResponse } from '@stores/profile/profile-actions/types';
import { User } from '@stores/profile/types';
import { sessionActionsStore } from '@stores/session';
import { GetSessionsResponse } from '@stores/session/session-actions/types';
import { sessionInteractionsStore } from '@stores/session/session-interactions/session-interactions';
import { themeStore } from '@stores/theme';
import i18n from 'i18n';
import i18next, { TFunction } from 'i18next';
import { mobxDebouncer } from "mobx-toolbox";
import React from 'react';
import { Clipboard } from 'react-native';
import { appName, getCurrentPrivacyStatus, getSessionDevice, getSessionLocation, moderationRequestStatuses, showNotify, todoNotify } from './const';
import { memoryUsageColors } from './ts';
import { getPrivacySettingsIcon, getSelectedLanguageSettingsIcon, getSessionIcon } from './tsx';
import { GroupBtnsType, ViewPrivacyT } from './types';

// ALL SETTINGS LIST

export const getSettingsBtns = (): GroupBtnsType[] => {
	const height = 42.5;
	const leftIcon = <ArrowRightIcon height={13} width={15} color={themeStore.currentTheme.secondTextColor.color} />;

	const settingsButtons: GroupBtnsType[] = [
		// ACCOUNT
		{
			group: "account",
			text: i18next.t("settings_profile_title"),
			url: 'ProfileSettings',
			icon: <ProfileSettingsIcon />,
			leftIcon,
			height
		},
		{
			group: "account",
			text: i18next.t("settings_privacy_title"),
			url: 'PrivacySettings',
			icon: <PrivacySettingsIcon />,
			leftIcon,
			height
		},
		{
			group: "account",
			text: i18next.t("settings_sessions_title"),
			url: 'SessionsSettings',
			icon: <SessionsSettingsIcon />,
			leftIcon,
			height
		},
		{
			group: "account",
			text: i18next.t("settings_goals_plans_title"),
			url: 'GoalsPlansSettings',
			icon: <NotificationSettingsIcon />,
			leftIcon,
			height
		},
		{
			group: "account",
			text: i18next.t("settings_notify_title"),
			url: 'NotificationsSettings',
			icon: <NotificationSettingsIcon />,
			leftIcon,
			height
		},

		// SUBSCRIPTION
		{
			group: "subscription",
			text: i18next.t("settings_subscription_title"),
			url: 'SubscriptionSettings',
			icon: <AppereanceColoredIcon size={28} />,
			leftIcon,
			height
		},
		{
			group: "subscription",
			text: i18next.t("settings_customization_title"),
			url: 'CustomizationSettings',
			icon: <CustomizationColoredIcon size={28} />,
			leftIcon,
			height
		},

		// APP
		{
			group: "app",
			text: i18next.t("settings_memory_title"),
			url: 'MemorySettings',
			icon: <MemorySettingsIcon />,
			leftIcon,
			height
		},
		{
			group: "app",
			text: i18next.t("settings_moderations_title"),
			url: 'ModerationSettings',
			icon: <ModerationSettingsIcon />,
			leftIcon,
			height
		},
		{
			group: "app",
			text: i18next.t("settings_language_title"),
			url: 'LanguageSettings',
			icon: <LanguageIcon />,
			leftIcon,
			height
		},

		// LOUGOUT
		{
			group: "logout",
			text: i18next.t("settings_logout_title"),
			textColor: themeStore.currentTheme.errorColor.color,
			callback: () => {
				authServiceStore.fullClear();
			},
			height
		},
	];

	return settingsButtons;
};

// PRIVACY SETTINGS

export const getPrivacySettingsBtns = (privacy: GetPrivacySettingsResponse, t: TFunction): GroupBtnsType[] => {
	const height = 42.5;

	const callback = (currentPrivacy: GroupBtnsType, t: TFunction) => {
		profileStore.selectedPrivacy.setSelectedPrivacy(currentPrivacy);
		// const items = getCurrentPrivacySettingBtns(t)
		// profileStore.privacySettingItems.setPrivacySettingItems(items)
		navigate("PrivacySetting");
	};

	const settingsButtons: GroupBtnsType[] = [
		// PROFILE 
		{
			groupTitle: i18next.t("settings_profile_title"), // PHONE
			group: "profile",
			height,
			text: i18next.t("privacy_settings_phonenumber"),
			leftText: getCurrentPrivacyStatus(privacy.phoneRule),
			callback,
			field: "phoneRule",
			leftIcon: <ArrowRightIcon height={13} width={15} color={themeStore.currentTheme.secondTextColor.color} />
		},
		{
			groupTitle: i18next.t("settings_profile_title"), // AVATAR
			group: "profile",
			height,
			text: i18next.t("privacy_settings_avatar"),
			leftText: getCurrentPrivacyStatus(privacy.profilePhotoRule),
			field: "profilePhotoRule",
			callback,
			leftIcon: <ArrowRightIcon height={13} width={15} color={themeStore.currentTheme.secondTextColor.color} />
		},
		{
			groupTitle: i18next.t("settings_profile_title"), // DESCRIPTION
			group: "profile",
			height,
			text: i18next.t("privacy_settings_description"),
			leftText: getCurrentPrivacyStatus(privacy.descriptionRule),
			callback,
			field: "descriptionRule",
			leftIcon: <ArrowRightIcon height={13} width={15} color={themeStore.currentTheme.secondTextColor.color} />
		},
		{
			groupTitle: i18next.t("settings_profile_title"), // HB
			group: "profile",
			height,
			text: i18next.t("privacy_settings_hb"),
			leftText: getCurrentPrivacyStatus(privacy.hbRule),
			callback,
			field: "hbRule",
			leftIcon: <ArrowRightIcon height={13} width={15} color={themeStore.currentTheme.secondTextColor.color} />
		},
		{
			groupTitle: i18next.t("settings_profile_title"), // FRIEND LIST
			group: "profile",
			height,
			text: i18next.t("privacy_settings_friends"),
			leftText: getCurrentPrivacyStatus(privacy.friendRule),
			callback,
			field: "friendRule",
			leftIcon: <ArrowRightIcon height={13} width={15} color={themeStore.currentTheme.secondTextColor.color} />
		},
		{
			groupTitle: i18next.t("settings_profile_title"), // PLAN
			group: "profile",
			height,
			text: i18next.t("privacy_settings_plans"),
			leftText: getCurrentPrivacyStatus(privacy.planRule),
			callback,
			field: "planRule",
			leftIcon: <ArrowRightIcon height={13} width={15} color={themeStore.currentTheme.secondTextColor.color} />
		},
		{
			groupTitle: i18next.t("settings_profile_title"), // GOALS
			group: "profile",
			height,
			text: i18next.t("privacy_settings_goals"),
			leftText: getCurrentPrivacyStatus(privacy.goalRule),
			callback,
			field: "goalRule",
			leftIcon: <ArrowRightIcon height={13} width={15} color={themeStore.currentTheme.secondTextColor.color} />
		},

		// CHATS
		{
			groupTitle: i18next.t("chats_title"), // MESSAGES
			group: "chats",
			height,
			text: i18next.t("privacy_settings_messages"),
			leftText: getCurrentPrivacyStatus("ALL"),
			callback: (currentPrivacy: GroupBtnsType) => {
				todoNotify();
				// profileStore.selectedPrivacy.setSelectedPrivacy(currentPrivacy)
				// navigate("PrivacySetting")
			},
			leftIcon: <ArrowRightIcon height={13} width={15} color={themeStore.currentTheme.secondTextColor.color} />
		},
		{
			groupTitle: i18next.t("chats_title"), // LAST SEEN
			group: "chats",
			height,
			text: i18next.t("privacy_settings_lastseen"),
			leftText: getCurrentPrivacyStatus(privacy.lastSeenRule),
			field: "lastSeenRule",
			callback,
			leftIcon: <ArrowRightIcon height={13} width={15} color={themeStore.currentTheme.secondTextColor.color} />
		},
		{
			groupTitle: i18next.t("chats_title"), // IN CHAT REALTIME
			group: "chats",
			height,
			text: i18next.t("privacy_settings_inchat"),
			leftText: getCurrentPrivacyStatus("ALL"),
			callback: (currentPrivacy: GroupBtnsType) => {
				todoNotify();
				// profileStore.selectedPrivacy.setSelectedPrivacy(currentPrivacy)
				// navigate("PrivacySetting")
			},
			leftIcon: <ArrowRightIcon height={13} width={15} color={themeStore.currentTheme.secondTextColor.color} />
		},
	];

	const res = settingsButtons.map((item, index) => ({ ...item, id: index }));

	return res;
};

export const getPrivacySettingsStatuses = (tKey: string = "", mode: "default" | "todo" = 'default', t: TFunction) => {
	const height = 42.5;

	const onClickHandler = (item: GroupBtnsType) => {
		if (mode == "todo") {
			todoNotify();
			return [];
		}

		const currentPrivacy = profileStore.selectedPrivacy.selectedPrivacy;
		const privacy = profileActionsStore.privacy?.data;

		if (!currentPrivacy?.field || !currentPrivacy || !privacy || !item.actionKey) return;

		const currentStatus = privacy[currentPrivacy.field as keyof GetPrivacySettingsResponse];
		if (item.actionKey == currentStatus) return;

		if (!profileStore.selectedPrivacy.selectedPrivacy) return;

		// @ts-ignore игнорим эт норм
		profileActionsStore.privacy!.data![currentPrivacy.field as keyof GetPrivacySettingsResponse] = item.actionKey.toUpperCase();
		if (!profileActionsStore.privacy.data) return;
		profileStore.privacySettingsItems.setPrivacySettingsItems(getPrivacySettingsBtns(profileActionsStore.privacy!.data, t));

		mobxDebouncer.debouncedAction(
			"privacy-settings-statuses",
			() => profileActionsStore.editProfilePrivacyAction(item),
			3000
		);
	};

	function leftIcon(this: GroupBtnsType) {
		return getPrivacySettingsIcon(this.actionKey!.toUpperCase() as ViewPrivacyT);
	}

	const tFunc = (t != undefined) ? t : i18n.t;

	const settingsButtons: GroupBtnsType[] = [
		{
			groupTitle: tFunc(tKey), // ALL
			group: "status",
			height,
			text: t("privacy_all_status"),
			callback: (item: GroupBtnsType) => onClickHandler(item),
			actionKey: "All",
			leftIcon: leftIcon,
		},
		{
			groupTitle: tFunc(tKey), // NONE
			group: "status",
			height,
			text: t("privacy_none_status"),
			callback: (item: GroupBtnsType) => onClickHandler(item),
			actionKey: "None",
			leftIcon: leftIcon,
		},
		{
			groupTitle: tFunc(tKey), // NONE
			group: "status",
			height,
			text: t("privacy_contacts_status"),
			callback: (item: GroupBtnsType) => onClickHandler(item),
			actionKey: "Contacts",
			leftIcon: leftIcon,
		},
		{
			groupTitle: tFunc(tKey), // FRIENDS
			group: "status",
			height,
			text: t("privacy_friends_status"),
			callback: (item: GroupBtnsType) => onClickHandler(item),
			actionKey: "Friends",
			leftIcon: leftIcon,
		},
	];

	return settingsButtons;
};

export const getPhoneNumberPrivacySettingsBtns = (t: TFunction) => {
	const statuses = getPrivacySettingsStatuses("phonenumber_privacy_settings_group_btns_title", "default", t);

	const settingsButtons: GroupBtnsType[] = [
		...statuses
	];

	return settingsButtons;
};

export const getHbPrivacySettingsBtns = (t: TFunction) => {
	const statuses = getPrivacySettingsStatuses("hb_privacy_settings_group_btns_title", "default", t);

	const settingsButtons: GroupBtnsType[] = [
		...statuses
	];

	return settingsButtons;
};

export const getDescriptionPrivacySettingsBtns = (t: TFunction) => {
	const statuses = getPrivacySettingsStatuses("description_privacy_settings_group_btns_title", "default", t);

	const settingsButtons: GroupBtnsType[] = [
		...statuses
	];

	return settingsButtons;
};

export const getPlansPrivacySettingsBtns = (t: TFunction) => {
	const statuses = getPrivacySettingsStatuses("plans_privacy_settings_group_btns_title", "default", t);

	const settingsButtons: GroupBtnsType[] = [
		...statuses
	];

	return settingsButtons;
};

export const getGoalsPrivacySettingsBtns = (t: TFunction) => {
	const statuses = getPrivacySettingsStatuses("goals_privacy_settings_group_btns_title", "default", t);

	const settingsButtons: GroupBtnsType[] = [
		...statuses
	];

	return settingsButtons;
};

export const getFriendsPrivacySettingsBtns = (t: TFunction) => {
	const statuses = getPrivacySettingsStatuses("friends_privacy_settings_group_btns_title", "default", t);

	const settingsButtons: GroupBtnsType[] = [
		...statuses
	];

	return settingsButtons;
};

export const getLastSeenSettingsBtns = (t: TFunction) => {
	const statuses = getPrivacySettingsStatuses("last_seen_privacy_settings_group_btns_title", "default", t);

	const settingsButtons: GroupBtnsType[] = [
		...statuses
	];

	return settingsButtons;
};

export const getProfilePhotoSettingsBtns = (t: TFunction) => {
	const statuses = getPrivacySettingsStatuses("profile_photo_privacy_settings_group_btns_title", "default", t);

	const settingsButtons: GroupBtnsType[] = [
		...statuses
	];

	return settingsButtons;
};

export const getCurrentPrivacySettingBtns = (t: TFunction): GroupBtnsType[] => {
	const funcObj = {
		"phoneRule": getPhoneNumberPrivacySettingsBtns,
		"hbRule": getHbPrivacySettingsBtns,
		"descriptionRule": getDescriptionPrivacySettingsBtns,
		"goalRule": getGoalsPrivacySettingsBtns,
		"planRule": getPlansPrivacySettingsBtns,
		"friendRule": getFriendsPrivacySettingsBtns,
		"lastSeenRule": getLastSeenSettingsBtns,
		"profilePhotoRule": getProfilePhotoSettingsBtns
	};

	const selectedPrivacy = profileStore.selectedPrivacy.selectedPrivacy;
	if (!selectedPrivacy?.field) return [];

	return (funcObj as any)[selectedPrivacy.field]?.() || getPrivacySettingsStatuses("", "todo", t);
};

// SESSION SETTINGS

export const getSessionInfoBtns = (t: TFunction, session: GetSessionsResponse) => {
	const height = 38;

	const settingsButtons: GroupBtnsType[] = [
		{
			group: "info",
			text: t("session_info_device"),
			height,
			leftText: getSessionDevice(session.device_info)
		},
		{
			group: "info",
			text: t("session_info_location"),
			height,
			leftText: getSessionLocation(session.location)
		}
	];

	return settingsButtons;
};

export const getSessionSettings = (list: GetSessionsResponse[], t: TFunction) => {
	const {
		deleteSessionAction
	} = sessionActionsStore;
	const {
		sessionSheet: { setSessionSheet },
		selectedSession: { setSelectedSession }
	} = sessionInteractionsStore;

	const height = "auto";

	const callback = (session: GetSessionsResponse) => {
		setSessionSheet(true);
		setSelectedSession(session);
	};

	const res = list.map((item, index) => {
		const groupBtns: GroupBtnsType = {
			group: index == 0 ? "first" : "second",
			height,
			btnRightPaddingVertical: 5,
			btnRightMainTextPx: 14,
			btn: index == 0 ? {
				btnText: t("sessions_settings_delete_other_sessions"),
				btnCallback: () => deleteSessionAction(true),
				btnColor: themeStore.currentTheme.errorColor.color as string,
				btnIcon: sessionActionsStore.deleteSession?.status == "pending" ? (
					<LoaderUi
						color={themeStore.currentTheme.errorColor.color}
						size={"small"}
					/>
				) : (
					<Ionicons
						name="trash-outline"
						size={19}
						color={themeStore.currentTheme.errorColor.color}
					/>
				)
			} : undefined,
			btnDisabled: list.length == 1,
			text: getSessionDevice(item.device_info),
			pretitle: `${appName} Mobile`,
			subtitle: `${getSessionLocation(item.location)} | `,
			subtitleRealTimeDate: item.last_active,
			icon: getSessionIcon(item.device_info, 28),
			callback: () => callback(item)
		};
		if (index == 0) {
			groupBtns.groupTitle = t("sessions_settings_current_session");
			groupBtns.endGroupTitle = t("sessions_settings_end_other_sessions");
		}
		else groupBtns.groupTitle = t("sessions_settings_other_sessions");
		return groupBtns;
	});
	return res;
};

export const getModerationSettingsBtns = (t: TFunction) => {
	const height = 42.5;

	const settingsButtons: GroupBtnsType[] = [
		{
			group: "moderation",
			text: t("settings_moderations_req_title"),
			url: "BeModeratorSettings",
			icon: <ModerationSettingsIcon />,
			height,
			leftIcon: <ArrowRightIcon height={13} width={15} color={themeStore.currentTheme.secondTextColor.color} />
		},
		{
			group: "moderation",
			text: t("settings_my_moderations_reqs_title"),
			url: "MyModerationRequestsSettings",
			height,
			icon: <ModerationSettingsIcon />,
			leftIcon: <ArrowRightIcon height={13} width={15} color={themeStore.currentTheme.secondTextColor.color} />
		}
	];

	return settingsButtons;
};

export const getMyModerationRequestSettings = (req: ModerationRequestResponse) => {
	const { isModerationReasonModalOpen: { setIsModerationReasonModalOpen } } = moderationStore;

	const height = 37;
	const statusObj = moderationRequestStatuses[req.status as keyof typeof moderationRequestStatuses];

	const settingsButtons: GroupBtnsType[] = [
		{
			group: "request",
			text: i18next.t("moderation_request_fn_label"),
			leftText: req.full_name,
			height,
		},
		{
			group: "request",
			text: i18next.t("moderation_request_phone_label"),
			leftText: req.phone,
			height,
		},
		{
			group: "request",
			text: i18next.t("moderation_request_nationality_label"),
			leftText: req.nationality,
			height,
		},
		{
			group: "request",
			text: i18next.t("moderation_request_city_label"),
			leftText: req.city,
			height,
		},
		{
			group: "request",
			text: i18next.t("moderation_request_reason_label"),
			leftIcon: <ArrowRightIcon height={13} width={15} color={themeStore.currentTheme.secondTextColor.color} />,
			callback: () => setIsModerationReasonModalOpen(true),
			leftText: req.reason.slice(0, 15) + "...",
			height,
		},
		{
			group: "request",
			text: i18next.t("moderation_request_status_label"),
			leftText: statusObj.text,
			leftIcon: statusObj.icon,
			height,
			leftTextColor: statusObj.color,
		},
		{
			group: "request",
			text: i18next.t("moderation_request_delete_label"),
			callback: todoNotify,
			height,
			textColor: themeStore.currentTheme.errorColor.color,
			icon:
				<Ionicons
					name="trash-outline"
					color={themeStore.currentTheme.errorColor.color}
					size={19}
				/>,
		}
	];

	return settingsButtons;
};

// LANGUAGE SETTINGS

export const getLanguageSettingsBtns = (t: TFunction, i18n: any) => {
	const height = 42.5;

	function leftIcon(this: GroupBtnsType) {
		return getSelectedLanguageSettingsIcon(this.actionKey!.toLowerCase());
	}

	const onClickHandler = (item: GroupBtnsType) => {
		i18n.changeLanguage(item.actionKey?.toLowerCase());
	};

	return [
		{
			groupTitle: t("language_settings_interface_lang"),
			group: "languages",
			height,
			text: t("ru"),
			callback: onClickHandler,
			leftIcon,
			actionKey: "ru"
		},
		{
			groupTitle: t("language_settings_interface_lang"),
			group: "languages",
			height,
			text: t("en"),
			callback: onClickHandler,
			leftIcon,
			actionKey: "en"
		},
	];
};

// CHAT

export const getChatProfileInfoBtns = (t: TFunction, user: User) => {
	const minHeight = 45;
	const btnRightPaddingVertical = 6;

	const res: GroupBtnsType[] = [
		{
			group: "info",
			text: t("chat_profile_info_tag_title"),
			pretitle: `@${user.tag}`,
			leftIcon: <CopyMsgIcon color={themeStore.currentTheme.originalMainGradientColor.color} size={17} />,
			minHeight,
			btnRightPaddingVertical,
			pretitleLines: 5,
			btnRightMainTextPx: 14,
			pretitlePx: 15,
			textColor: themeStore.currentTheme.secondTextColor.color,
			pretitleStyle: {
				color: themeStore.currentTheme.originalMainGradientColor.color
			},
			callback: () => {
				Clipboard.setString(`@${user.tag}`);
				showNotify("system", { message: t("success_copyed") });
			}
		},
		{
			group: "info",
			text: t("chat_profile_info_hb_title"),
			pretitle: user.more.hb ? formatSmartDate(user.more.hb, { useRelativeTime: false }) : t("not_selected"),
			minHeight,
			btnRightPaddingVertical,
			btnRightMainTextPx: 14,
			textColor: themeStore.currentTheme.secondTextColor.color,
			pretitlePx: 15,
			pretitleLines: 5,
		},
		{
			group: "info",
			text: t("chat_profile_info_description_title"),
			pretitle: user.more.description ? user.more.description : t("not_selected") + "asdlkasjladkasdjksadjsakldjlkasjdaksdjksladjklsah lckjsaHLcskdjyfhljcdkszhlcdzhkdasld,askaskdjasjdlkasjdkasjdkasjdkasjdkasjdaljdajskdhasxjkalsch;ckhasjcsakhcjaskchashjckashjkcahsjkcjkhas",
			minHeight,
			btnRightPaddingVertical,
			textColor: themeStore.currentTheme.secondTextColor.color,
			btnRightMainTextPx: 14,
			pretitlePx: 15,
			pretitleLines: 5,
		},
		{
			group: "info",
			text: t("chat_profile_info_block"),
			callback: () => todoNotify(),
			textColor: themeStore.currentTheme.errorColor.color,
			minHeight,
			btnRightPaddingVertical,
			pretitleLines: 5,
		}
	];
	return res;
};

export const getCreatePostSettingsBtns = (t: TFunction) => {
	const minHeight = 42.5;
	const btnRightPaddingVertical = 5;

	const res: GroupBtnsType[] = [
		{
			group: "settings",
			text: t("create_post_can_comment"),
			icon: <CommentSettingIcon size={22} />,
			minHeight,
			btnRightPaddingVertical,
			leftIcon: <SwitchUi isOpen={postInteractionsStore.createPostForm.values.canComment} />,
			pretitleLines: 5,
			btnRightMainTextPx: 14,
			pretitlePx: 15,
			callback: () => {
				postInteractionsStore.createPostForm.setValue("canComment", !postInteractionsStore.createPostForm.values.canComment);
			}
		},
	];

	return res;
};

export const getCustomizationSettingsBtns = (t: TFunction): GroupBtnsType[] => {
	const height = 42.5;

	const colorCustomizationIconSize = 18;
	const leftIcon = <ArrowRightIcon height={13} width={15} color={themeStore.currentTheme.secondTextColor.color} />;

	const settingsButtons: GroupBtnsType[] = [
		// ACCOUNT
		{
			group: "1",
			text: i18next.t("settings_customization_your_theme"),
			url: 'ThemeSettings',
			leftIcon,
			height
		},
		{
			group: "1",
			text: i18next.t("settings_customization_wallpapers"),
			url: 'WallpapersSettings',
			leftIcon,
			height
		},
		{
			group: "1",
			text: i18next.t("settings_customization_chat_wallpapers"),
			// url: 'ChatWallpapersSettings',
			callback: () => todoNotify(),
			leftIcon,
			height
		},

		{
			group: "2",
			text: i18next.t("settings_energy"),
			// url: 'EnergySettings',
			callback: () => todoNotify(),
			leftIcon,
			height
		},
		{
			group: "2",
			text: i18next.t("settings_text_size"),
			// url: 'TextSizeSettings',
			callback: () => todoNotify(),
			leftIcon,
			height
		},

		{
			group: "3",
			text: i18next.t("settings_bg_color"),
			url: 'BgColorSettings',
			callback: () => {
				themeStore.selectedRoute.setSelectedRoute('BgColorSettings');
				navigate("BgColorSettings");
			},
			leftIcon: (
				<UncoloredCustomizationIcon
					color={themeStore.currentTheme.textColor.color}
					size={colorCustomizationIconSize}
				/>
			),
			height
		},
		{
			group: "3",
			text: i18next.t("settings_btn_color"),
			url: 'BtnColorSettings',
			callback: () => {
				themeStore.selectedRoute.setSelectedRoute('BtnColorSettings');
				navigate("BtnColorSettings");
			},
			leftIcon: (
				<BtnColorCustomizationIcon
					color={themeStore.currentTheme.textColor.color}
					size={colorCustomizationIconSize}
				/>
			),
			height
		},
		{
			group: "3",
			text: i18next.t("settings_primary_color"),
			url: 'PrimaryColorSettings',
			callback: () => {
				themeStore.selectedRoute.setSelectedRoute('PrimaryColorSettings');
				navigate("PrimaryColorSettings");
			},
			leftIcon: <PrimaryColorCustomizationIcon color={themeStore.currentTheme.textColor.color} size={colorCustomizationIconSize} />,
			height
		},
		{
			group: "3",
			text: i18next.t("settings_text_color"),
			url: 'TextColorSettings',
			callback: () => {
				themeStore.selectedRoute.setSelectedRoute('TextColorSettings');
				navigate("TextColorSettings");
			},
			leftIcon: <TextColorCustomizationIcon color={themeStore.currentTheme.textColor.color} size={colorCustomizationIconSize} />,
			height
		},
		{
			group: "3",
			text: i18next.t("settings_secondary_text_color"),
			url: 'SecondaryTextColorSettings',
			callback: () => {
				themeStore.selectedRoute.setSelectedRoute('SecondaryTextColorSettings');
				navigate("SecondaryTextColorSettings");
			},
			leftIcon: <TextColorCustomizationIcon color={themeStore.currentTheme.textColor.color} size={colorCustomizationIconSize} />,
			height
		}
	];

	return settingsButtons;
};

// MEMORY SETTINGS

export const getCachedDataBtns = (t: TFunction): GroupBtnsType[] => {
	const {
		selectedCachedData: { setSelectedCachedData },
	} = memoryStore;
	const height = 45;

	const settingsButtons: GroupBtnsType[] = [
		{
			group: "cached_data",
			groupTitle: t("memory_settings_cached_data_title"),
			text: t("memory_settings_personal_chats"),
			callback: () => {
				setSelectedCachedData("personal_chats");
				navigate("CachedChats");
			},
			height
		},
		{
			group: "cached_data",
			text: t("memory_settings_groups"),
			callback: () => {
				setSelectedCachedData("groups");
				navigate("CachedDatas");
			},
			height
		},
		{
			group: "cached_data",
			text: t("memory_settings_profiles"),
			callback: () => {
				setSelectedCachedData("profiles");
				navigate("CachedDatas");
			},
			height
		}
	];

	return settingsButtons;
};

export const getMemoryUsageBtns = (t: TFunction, memoryUsage: MemoryUsageStats): GroupBtnsType[] => {
	const { whichCacheItem: { setWhichCacheItem } } = memoryStore;
	const height = 45;

	// "memory_settings_videos": "Видео",
	// "memory_settings_images": "Изображения",
	// "memory_settings_photos": "Фотографии профиля",
	// "memory_settings_files": "Файлы",
	// "memory_settings_stories": "Истории",
	// "memory_settings_audio": "Аудио",
	// "memory_settings_other": "Прочее",

	const settingsButtons: GroupBtnsType[] = [
		{
			group: "memory_usage",
			text: t("memory_settings_videos"),
			leftIcon: (
				<Box align='flex-end'>
					<MainText px={15}>{formatBytes(memoryUsage.videos)}</MainText>
					<SecondaryText px={11}>{formatPercent(memoryUsage.videos / memoryUsage.total)}</SecondaryText>
				</Box>
			),
			callback: () => {
				setWhichCacheItem("CachedVideos");
				navigate("CachedMedia");
			},
			icon: <Box width={28} height={28} bgColor={memoryUsageColors.video} bRad={10} />,
			height
		},
		{
			group: "memory_usage",
			text: t("memory_settings_images"),
			leftIcon: (
				<Box align='flex-end'>
					<MainText px={15}>{formatBytes(memoryUsage.images)}</MainText>
					<SecondaryText px={11}>{formatPercent(memoryUsage.images / memoryUsage.total)}</SecondaryText>
				</Box>
			),
			callback: () => {
				setWhichCacheItem("CachedImages");
				navigate("CachedMedia");
			},
			icon: <Box width={28} height={28} bgColor={memoryUsageColors.image} bRad={10} />,
			height
		},
		{
			group: "memory_usage",
			text: t("memory_settings_photos"),
			leftIcon: (
				<Box align='flex-end'>
					<MainText px={15}>{formatBytes(memoryUsage.photos)}</MainText>
					<SecondaryText px={11}>{formatPercent(memoryUsage.photos / memoryUsage.total)}</SecondaryText>
				</Box>
			),
			callback: () => {
				setWhichCacheItem("CachedPhotos");
				navigate("CachedMedia");
			},
			icon: <Box width={28} height={28} bgColor={memoryUsageColors.photo} bRad={10} />,
			height
		},
		{
			group: "memory_usage",
			text: t("memory_settings_files"),
			leftIcon: (
				<Box align='flex-end'>
					<MainText px={15}>{formatBytes(memoryUsage.files)}</MainText>
					<SecondaryText px={11}>{formatPercent(memoryUsage.files / memoryUsage.total)}</SecondaryText>
				</Box>
			),
			callback: () => {
				setWhichCacheItem("CachedFiles");
				navigate("CachedMedia");
			},
			icon: <Box width={28} height={28} bgColor={memoryUsageColors.file} bRad={10} />,
			height
		},
		{
			group: "memory_usage",
			text: t("memory_settings_stories"),
			leftIcon: (
				<Box align='flex-end'>
					<MainText px={15}>{formatBytes(memoryUsage.stories)}</MainText>
					<SecondaryText px={11}>{formatPercent(memoryUsage.stories / memoryUsage.total)}</SecondaryText>
				</Box>
			),
			callback: () => {
				setWhichCacheItem("CachedStories");
				navigate("CachedMedia");
			},
			icon: <Box width={28} height={28} bgColor={memoryUsageColors.story} bRad={10} />,
			height
		},
		{
			group: "memory_usage",
			text: t("memory_settings_audio"),
			leftIcon: (
				<Box align='flex-end'>
					<MainText px={15}>{formatBytes(memoryUsage.audio)}</MainText>
					<SecondaryText px={11}>{formatPercent(memoryUsage.audio / memoryUsage.total)}</SecondaryText>
				</Box>
			),
			callback: () => {
				setWhichCacheItem("CachedAudio");
				navigate("CachedMedia");
			},
			icon: <Box width={28} height={28} bgColor={memoryUsageColors.audio} bRad={10} />,
			height
		},
		{
			group: "memory_usage",
			text: t("memory_settings_other"),
			leftIcon: (
				<Box align='flex-end'>
					<MainText px={15}>{formatBytes(memoryUsage.other)}</MainText>
					<SecondaryText px={11}>{formatPercent(memoryUsage.other / memoryUsage.total)}</SecondaryText>
				</Box>
			),
			callback: () => {
				setWhichCacheItem("CachedOther");
				navigate("CachedMedia");
			},
			icon: <Box width={28} height={28} bgColor={memoryUsageColors.other} bRad={10} />,
			height
		}
	];

	return settingsButtons;
};

export const getMemorySettingsBtns = (t: TFunction): GroupBtnsType[] => {
	const height = 42.5;

	const settingsButtons: GroupBtnsType[] = [
		{
			group: "auto_delete",
			groupTitle: t("memory_settings_auto_delete_title"),
			text: t("memory_settings_personal_chats"),
			url: 'PersonalChatsAutoDeleteSettings',
			leftIcon: <ArrowRightIcon height={13} width={15} color={themeStore.currentTheme.secondTextColor.color} />,
			height
		},
		{
			group: "auto_delete",
			text: t("memory_settings_groups"),
			url: 'GroupsAutoDeleteSettings',
			leftIcon: <ArrowRightIcon height={13} width={15} color={themeStore.currentTheme.secondTextColor.color} />,
			height
		},
	];

	return settingsButtons;
};

// AUTO DELETE SETTINGS
export const getAutoDeleteSettingsBtns = (t: TFunction, currentValue: string, settingType: 'personalChats' | 'groups'): GroupBtnsType[] => {
	const height = 42.5;

	const onClickHandler = (value: string) => {
		if (settingType === 'personalChats') {
			memoryStore.setPersonalChatsAutoDelete(value);
		} else {
			memoryStore.setGroupsAutoDelete(value);
		}
	};

	const settingsButtons: GroupBtnsType[] = [
		{
			group: "auto_delete",
			text: t("memory_settings_auto_delete_never"),
			callback: () => onClickHandler('never'),
			leftIcon: currentValue === 'never' ? (
				<Ionicons name="checkmark" size={20} color={themeStore.currentTheme.originalMainGradientColor.color} />
			) : undefined,
			height
		},
		{
			group: "auto_delete",
			text: t("memory_settings_auto_delete_1_week"),
			callback: () => onClickHandler('1_week'),
			leftIcon: currentValue === '1_week' ? (
				<Ionicons name="checkmark" size={20} color={themeStore.currentTheme.originalMainGradientColor.color} />
			) : undefined,
			height
		},
		{
			group: "auto_delete",
			text: t("memory_settings_auto_delete_1_month"),
			callback: () => onClickHandler('1_month'),
			leftIcon: currentValue === '1_month' ? (
				<Ionicons name="checkmark" size={20} color={themeStore.currentTheme.originalMainGradientColor.color} />
			) : undefined,
			height
		},
		{
			group: "auto_delete",
			text: t("memory_settings_auto_delete_3_months"),
			callback: () => onClickHandler('3_months'),
			leftIcon: currentValue === '3_months' ? (
				<Ionicons name="checkmark" size={20} color={themeStore.currentTheme.originalMainGradientColor.color} />
			) : undefined,
			height
		},
	];

	return settingsButtons;
};