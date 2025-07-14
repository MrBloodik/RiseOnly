import { NavBtnType, ProfileBtnsT, ViewPrivacyT } from '@config/types';
import { Ionicons } from '@expo/vector-icons';
import { CallIcon } from '@icons/MainPage/Chats/CallIcon';
import { ChatIcon2 } from '@icons/MainPage/Chats/ChatIcon2';
import { MoreIcon } from '@icons/MainPage/Chats/MoreIcon';
import { NotifyIcon } from '@icons/MainPage/NavBar';
import { SearchIcon } from '@icons/MainPage/Posts/SearchIcon';
import { CreatePostIcon } from '@icons/MainPage/Profile/CreatePostIcon';
import { GoalsIcon } from '@icons/MainPage/Profile/GoalsIcon';
import { GridPostsIcon } from '@icons/MainPage/Profile/GridPostsIcon';
import { PlansIcon } from '@icons/MainPage/Profile/PlansIcon';
import { GoogleIcon } from '@icons/MainPage/Settings/GoogleIcon';
import { SafIcon } from '@icons/MainPage/Settings/SafIcon';
import { AboutusIcon, ChatIcon, CooperationIcon, LeaderboardIcon, NewsIcon, PostIcon, ReportIcon, UserIcon, VacancyIcon } from '@icons/MainPage/Sidebar';
import { AssemblerIcon } from '@icons/ProfileStatuses/Assembler';
import { CIcon } from '@icons/ProfileStatuses/C';
import { CPlusPlusIcon } from '@icons/ProfileStatuses/CPlusPlus';
import { CSharpIcon } from '@icons/ProfileStatuses/CSharp';
import { DartIcon } from '@icons/ProfileStatuses/Dart';
import { GolangIcon } from '@icons/ProfileStatuses/Golang';
import { JavaIcon } from '@icons/ProfileStatuses/Java';
import { JsIcon } from '@icons/ProfileStatuses/JsIcon';
import { KotlinIcon } from '@icons/ProfileStatuses/Kotlin';
import { LuaIcon } from '@icons/ProfileStatuses/Lua';
import { PascalIcon } from '@icons/ProfileStatuses/Pascal';
import { PerlIcon } from '@icons/ProfileStatuses/Perl';
import { PhpIcon } from '@icons/ProfileStatuses/Php';
import { PythonIcon } from '@icons/ProfileStatuses/Python';
import { RubyIcon } from '@icons/ProfileStatuses/Ruby';
import { RustIcon } from '@icons/ProfileStatuses/Rust';
import { SwiftIcon } from '@icons/ProfileStatuses/Swift';
import { TsIcon } from '@icons/ProfileStatuses/TsIcon';
import { EditIcon } from '@icons/Ui/EditIcon';
import { getCurrentRoute, navigate } from '@shared/lib/navigation';
import { Box, MainText, SimpleButtonUi } from '@shared/ui';
import { PreviewBgUi } from '@shared/ui/PreviewBgUi/PreviewBgUi';
import { profileActionsStore } from '@stores/profile/profile-actions/profile-actions';
import { GetPrivacySettingsResponse } from '@stores/profile/profile-actions/types';
import { profileStore } from '@stores/profile/profile-interactions/profile-interactions';
import { Profile, User } from '@stores/profile/types';
import { themeStore } from '@stores/theme';
import i18n from 'i18n';
import { TFunction } from 'i18next';
import { observer } from 'mobx-react-lite';
import React, { ReactNode } from 'react';
import { todoNotify } from './const';

export const getNavBtns = (type: 'mobile' | 'pc' = 'pc', size: number = 20): NavBtnType[] => {
	const currentRoute = getCurrentRoute();
	const url = currentRoute?.name || '';
	const params = currentRoute?.params as any || {};

	const mainColor = themeStore.currentTheme.textColor.color;
	const secondaryColor = themeStore.currentTheme.secondTextColor.color;

	const isProfileRoute = url === 'Profile' ||
		(url === 'MainTabs' && params?.screen === 'Profile');
	const profileTag = profileStore?.profile?.tag || '';

	const pcArr = [
		{ text: "Публикации", to: 'Posts', allowUrls: [], icon: <PostIcon size={size} color={url === 'Posts' ? mainColor : secondaryColor} /> },
		{ text: "Моя страница", to: "Profile", params: { id: profileTag }, allowUrls: [], icon: <UserIcon size={size} color={isProfileRoute ? mainColor : secondaryColor} /> },
		{ text: "Чаты", to: 'Chats', allowUrls: [], icon: <ChatIcon size={size} color={url === 'Chats' ? mainColor : secondaryColor} /> },
		{ text: "Новости", to: 'News', allowUrls: [], icon: <NewsIcon size={size} color={url === 'News' ? mainColor : secondaryColor} /> },
		{ text: "Вакансии", to: 'Vacancy', allowUrls: [], icon: <VacancyIcon size={size} color={url === 'Vacancy' ? mainColor : secondaryColor} /> },
		{ text: "Таблица лидеров", to: 'Leaderboard', allowUrls: [], icon: <LeaderboardIcon size={size} color={url === 'Leaderboard' ? mainColor : secondaryColor} /> },
		{ text: "О нас", to: 'AboutUs', allowUrls: [], icon: <AboutusIcon size={size} color={url === 'AboutUs' ? mainColor : secondaryColor} /> },
		{ text: "Сотрудничество", to: 'Cooperation', allowUrls: [], icon: <CooperationIcon size={size} color={url === 'Cooperation' ? mainColor : secondaryColor} /> },
	];

	const mobileArr = [
		{ text: "Публикации", to: 'Posts', allowUrls: [], icon: <PostIcon size={size} color={url === 'Posts' ? mainColor : secondaryColor} /> },
		{ text: "Вакансии", to: 'Vacancy', allowUrls: [], icon: <VacancyIcon size={size} color={url === 'Vacancy' ? mainColor : secondaryColor} /> },
		{ text: "Поиск", to: 'GlobalSearch', allowUrls: [], icon: <SearchIcon size={size} color={url === 'GlobalSearch' ? mainColor : secondaryColor} /> },
		{ text: "Чаты", to: 'Chats', allowUrls: [], icon: <ChatIcon size={size} color={url === 'Chats' ? mainColor : secondaryColor} /> },
		{ text: "Уведомления", to: 'Notifications', allowUrls: [], icon: <NotifyIcon size={size} color={url === 'Notifications' ? mainColor : secondaryColor} /> },
		{ text: "Моя страница", to: "Profile", params: { id: profileTag }, allowUrls: [], icon: <UserIcon size={size} color={isProfileRoute ? mainColor : secondaryColor} /> },
		// { text: "Новости", to: "News", allowUrls: [], icon: <NewsIcon size={size} color={url === 'News' ? mainColor : secondaryColor} /> },
		// { text: "Таблица лидеров", to: 'Leaderboard', allowUrls: [], icon: <LeaderboardIcon size={size} color={url === 'Leaderboard' ? mainColor : secondaryColor} /> },
		// { text: "О нас", to: 'AboutUs', allowUrls: [], icon: <AboutusIcon size={size} color={url === 'AboutUs' ? mainColor : secondaryColor} /> },
		// { text: "Сотрудничество", to: 'Cooperation', allowUrls: [], icon: <CooperationIcon size={size} color={url === 'Cooperation' ? mainColor : secondaryColor} /> },
	];

	const role = profileStore?.profile?.role;

	if (role == 'ADMIN' || role == 'MODERATOR') {
		const reportsObj = { text: "Жалобы", to: 'Reports', allowUrls: [], icon: <ReportIcon size={size} color={url === 'Reports' ? mainColor : secondaryColor} /> };
		pcArr.push(reportsObj);
		mobileArr.push(reportsObj);
	}

	if (type == 'pc') return pcArr;

	return mobileArr;
};

// Функция для интерполяции цвета между двумя значениями
export const interpolateColor = (color1: string, color2: string, factor: number) => {
	// Функция для преобразования rgba в объект
	const parseRgba = (rgbaColor: string) => {
		const match = rgbaColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)/);
		if (match) {
			return {
				r: parseInt(match[1]),
				g: parseInt(match[2]),
				b: parseInt(match[3]),
				a: match[4] ? parseFloat(match[4]) : 1
			};
		}
		return null;
	};

	// Преобразуем HEX в RGB
	const parseHex = (hexColor: string) => {
		const hex = hexColor.replace('#', '');
		return {
			r: parseInt(hex.substring(0, 2), 16),
			g: parseInt(hex.substring(2, 4), 16),
			b: parseInt(hex.substring(4, 6), 16),
			a: 1
		};
	};

	// Определяем формат цвета и преобразуем
	const parseColor = (color: string) => {
		if (color.startsWith('rgba') || color.startsWith('rgb')) {
			return parseRgba(color) || { r: 255, g: 255, b: 255, a: 1 };
		}
		return parseHex(color);
	};

	const c1 = parseColor(color1);
	const c2 = parseColor(color2);

	// Интерполируем каждый канал
	const r = Math.round(c1.r + factor * (c2.r - c1.r));
	const g = Math.round(c1.g + factor * (c2.g - c1.g));
	const b = Math.round(c1.b + factor * (c2.b - c1.b));
	const a = c1.a + factor * (c2.a - c1.a);

	// Возвращаем в формате rgba
	return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
};

export const getProfileTabs = (size: number = 20) => {
	const mainColor = themeStore.currentTheme.originalMainGradientColor.color;
	const secondaryColor = themeStore.currentTheme.secondTextColor.color;
	const currentTab = profileStore.profileTab.profileTab;

	// Иконки для разных табов
	const tabIcons = [
		<GridPostsIcon size={size} />,          // Сетка публикаций
		<PostIcon size={size} />,           // Публикации
		<GoalsIcon size={size} />,          // Цели
		<PlansIcon size={size} />,           // Планы
	];

	return [0, 1, 2, 3].map(tabIndex => {
		// Рассчитываем фактор близости (0 - далеко, 1 - это активный таб)
		const distance = Math.abs(currentTab - tabIndex);

		// Используем экспоненциальную функцию для более выраженного эффекта
		// Чем ближе к активному табу, тем быстрее меняется цвет
		const proximityFactor = Math.pow(0.5, distance);

		// Интерполируем цвет на основе фактора близости
		const iconColor = interpolateColor(secondaryColor as string, mainColor as string, proximityFactor);

		// Клонируем иконку с новым цветом
		const icon = React.cloneElement(tabIcons[tabIndex], { color: iconColor });

		return { to: tabIndex, icon };
	});
};

// USER STATUSES

export const getProfileStatuses = (icon: string, size: number = 20) => {
	if (!icon) return null;
	const iconData: Record<string, ReactNode> = {
		"TypeScript": <TsIcon size={size} />,
		"JavaScript": <JsIcon size={size} />,
		"Ruby": <RubyIcon size={size} />,
		"Python": <PythonIcon size={size} />,
		"Golang": <GolangIcon size={size} />,
		"C++": <CPlusPlusIcon size={size} />,
		"C": <CIcon size={size} />,
		"C#": <CSharpIcon size={size} />,
		"Java": <JavaIcon size={size} />,
		"Swift": <SwiftIcon size={size} />,
		"Php": <PhpIcon size={size} />,
		"Rust": <RustIcon size={size} />,
		"Lua": <LuaIcon size={size} />,
		"Perl": <PerlIcon size={size} />,
		"Assembler": <AssemblerIcon size={size} />,
		"Pascal": <PascalIcon size={size} />,
		"Dart": <DartIcon size={size} />,
		"Kotlin": <KotlinIcon size={size} />,

		"ts": <TsIcon size={size} />,
		"js": <JsIcon size={size} />,
		"rb": <RubyIcon size={size} />,
		"py": <PythonIcon size={size} />,
		"go": <GolangIcon size={size} />,
		"cpp": <CPlusPlusIcon size={size} />,
		"c": <CIcon size={size} />,
		"csharp": <CSharpIcon size={size} />,
		"java": <JavaIcon size={size} />,
		"swift": <SwiftIcon size={size} />,
		"php": <PhpIcon size={size} />,
		"rust": <RustIcon size={size} />,
		"lua": <LuaIcon size={size} />,
		"perl": <PerlIcon size={size} />,
		"assembler": <AssemblerIcon size={size} />,
		"pascal": <PascalIcon size={size} />,
		"dart": <DartIcon size={size} />,
		"kotlin": <KotlinIcon size={size} />
	};
	return iconData[icon];
};

export const getSessionIcon = (type: string, size: number = 22) => {
	const rules = [
		{ match: 'chrome', icon: <GoogleIcon size={size} /> },
		{ match: 'safari', icon: <SafIcon size={size} /> },
	];

	const rule = rules?.find(r => type?.toLowerCase()?.includes(r?.match));
	if (rule) return rule.icon;

	return (
		<Box
			style={{
				width: size,
				height: size,
				backgroundColor: "rgb(49, 128, 255)",
			}}
			bRad={7.5}
			centered
		>
			<MainText>?</MainText>
		</Box>
	);
};

export const getPrivacySettingsIcon = (status: ViewPrivacyT) => {
	const currentPrivacySetting = profileActionsStore.privacy?.data;
	const currentPrivacy = profileStore.selectedPrivacy.selectedPrivacy;

	if (!currentPrivacy?.field || !currentPrivacy || !currentPrivacySetting) return;
	const currentStatus = currentPrivacySetting[currentPrivacy.field as keyof GetPrivacySettingsResponse];

	if (status == currentStatus) return (
		<Ionicons
			key={profileStore.selectedPrivacy.selectedPrivacy?.leftText}
			name="checkmark"
			size={20}
			color={themeStore.currentTheme.originalMainGradientColor.color}
		/>
	);

	return <></>;
};

export const getSelectedLanguageSettingsIcon = (language: string) => {
	const currentLanguage = i18n.language;

	if (currentLanguage.toLowerCase() == language.toLowerCase()) return (
		<Ionicons
			key={profileStore.selectedPrivacy.selectedPrivacy?.leftText}
			name="checkmark"
			size={15}
			color={themeStore.currentTheme.originalMainGradientColor.color}
		/>
	);

	return <></>;
};

export const getChatProfileBtns = (t: TFunction, user: User) => {
	const res = [
		{ text: t("chat_profile_chat"), callback: () => navigate("Chat", { chatId: user.userChatId }), icon: <ChatIcon2 color={themeStore.currentTheme.originalMainGradientColor.color} size={20} /> },
		{ text: t("chat_profile_phone"), callback: () => todoNotify(), icon: <CallIcon color={themeStore.currentTheme.originalMainGradientColor.color} size={20} /> },
		{ text: t("chat_profile_notify"), callback: () => todoNotify(), icon: <NotifyIcon color={themeStore.currentTheme.originalMainGradientColor.color} size={20} /> },
		{ text: t("chat_profile_search"), callback: () => todoNotify(), icon: <SearchIcon color={themeStore.currentTheme.originalMainGradientColor.color} size={20} /> },
		{ text: t("chat_profile_more"), callback: () => todoNotify(), icon: <MoreIcon color={themeStore.currentTheme.originalMainGradientColor.color} height={20} width={20} /> },
	];

	return res;
};

export const getProfileBtns = (user: User | undefined | null, t: TFunction): ProfileBtnsT[] => {
	const { profile } = profileStore;

	const iconSize = 15;
	const iconColor = themeStore.currentTheme.textColor.color;

	if (!user) return [
		{
			text: t("error"),
			callback: () => console.log("error")
		}
	];

	const res: ProfileBtnsT[] = [];

	if (profile && (profile.id === user.id)) {
		res.push({
			text: t("share_profile_text"),
			icon: <EditIcon color={iconColor} size={iconSize} />,
			callback: () => console.log("share")
		});
		res.push({
			text: t("edit_profile_text"),
			icon: <EditIcon color={iconColor} size={iconSize} />,
			callback: () => navigate("ProfileSettings")
		});
		res.push({
			text: "",
			icon: <CreatePostIcon color={iconColor} size={iconSize} />,
			callback: () => navigate("CreatePost")
		});
	} else {
		res.push({
			text: t("subscribe_profile_text"),
			icon: <EditIcon color={iconColor} size={iconSize} />,
			callback: () => console.log("sub")
		});
		res.push({
			text: t("share_profile_text"),
			icon: <EditIcon color={iconColor} size={iconSize} />,
			callback: () => console.log("share")
		});
		res.push({
			text: t("chat_profile_text"),
			icon: <ChatIcon2 color={iconColor} size={iconSize} />,
			callback: () => navigate("MainStack", {
				screen: "Chat",
				params: {
					screen: "Chat",
					chatId: user.userChatId,
					previewUser: user
				}
			})
		});
	}

	return res;
};

export const getUserStats = (data: Profile | null | undefined) => {
	if (!data) return [];

	const res = [
		{ amount: data.postsCount, text: "публикации", callback: () => console.log("1") },
		{ amount: data.subscribersCount, text: "подписчики", callback: () => navigate("UserSubscribers") },
		{ amount: data.subsCount, text: "подписок", callback: () => navigate("UserSubs") },
		{ amount: data.friendsCount, text: "друзей", callback: () => navigate("UserFriends") }
	];

	return res;
};

export const CustomizationPreviewContent = observer(({ t, s }: { t: TFunction, s: any; }) => {
	const { selectedRoute: { selectedRoute } } = themeStore;

	switch (selectedRoute) {
		case 'BgColorSettings':
			return (
				<PreviewBgUi
					paddingHorizontal={60}
					outerPaddingHorizontal={16}
					previewContentStyle={{ paddingVertical: 20 }}
					previewHeight={400}
					scrollEnabled={false}
				/>
			);
		case 'BtnColorSettings':
			return (
				<PreviewBgUi>
					<Box
						centered
						height={"100%"}
						width={"100%"}
					>
						<SimpleButtonUi
							bgColor={themeStore.currentTheme.btnsTheme.background as string}
							bRad={5}
							style={s.btnpreview}
						>
							<MainText>
								{t("preview_btn_title")}
							</MainText>
						</SimpleButtonUi>
					</Box>
				</PreviewBgUi>
			);
		default:
			return <></>;
	}
});