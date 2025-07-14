import { localStorage } from '@shared/storage';
import { HoldContextMenuAction } from '@shared/ui/HoldContextMenuUi/HoldContextMenuUi';
import { MemoryUsageStats } from '@stores/memory';
import i18next from 'i18next';
import { showNotify } from './const';

export async function getCachedData(key: string) {
	return await localStorage.get(key);
}

export const getPostTags = () => {
	const res = [
		i18next.t("IT"), i18next.t("posttag_memes"), i18next.t("posttag_selfimprove"),
		i18next.t("posttag_science"), i18next.t("posttag_coding"),
		i18next.t("posttag_comedy"), i18next.t("posttag_games"), i18next.t("posttag_anime"),
		i18next.t("posttag_sport"), i18next.t("posttag_music"), i18next.t("posttag_movies"),
		i18next.t("posttag_technology"), i18next.t("posttag_travel"),
		i18next.t("posttag_food"), i18next.t("posttag_fashion"), i18next.t("posttag_art"),
		i18next.t("posttag_history")
	];
	return res;
};

export const defaultContextMenuActions: HoldContextMenuAction[] = [
	{
		icon: "content-copy",
		title: "Скопировать (Test)",
		onPress: () => {
			showNotify("system", { message: "Вы не добавили actions" });
		}
	},
	{
		icon: "reply",
		title: "Ответить (Test)",
		onPress: () => {
			showNotify("system", { message: "Вы не добавили actions" });
		}
	},
	{
		icon: "content-copy",
		title: "Скопировать (Test)",
		onPress: () => {
			showNotify("system", { message: "Вы не добавили actions" });
		}
	},
	{
		icon: "reply",
		title: "Ответить (Test)",
		onPress: () => {
			showNotify("system", { message: "Вы не добавили actions" });
		}
	},
	{
		icon: "delete",
		title: "Удалить",
		onPress: () => {
			showNotify("system", { message: "Вы не добавили actions" });
		}
	}
];

export const memoryUsageColors = {
	video: '#4B96FC',
	image: '#FF3B30',
	photo: "#80ff00",
	file: '#00fffb',
	story: '#a600ff',
	audio: '#34C759',
	other: '#FF9500'
};

export const cachedDataTitles = {
	personal_chats: "memory_settings_personal_chats",
	groups: "memory_settings_groups",
	profiles: "memory_settings_profiles"
};

export const getMemoryUsageChartsData = (memoryUsage: MemoryUsageStats) => {
	const total = memoryUsage.total;
	if (total === 0) return [];

	return [
		{
			value: memoryUsage.videos,
			color: memoryUsageColors.video,
			percentage: (memoryUsage.videos / total) * 100
		},
		{
			value: memoryUsage.images,
			color: memoryUsageColors.image,
			percentage: (memoryUsage.images / total) * 100
		},
		{
			value: memoryUsage.photos,
			color: memoryUsageColors.photo,
			percentage: (memoryUsage.photos / total) * 100
		},
		{
			value: memoryUsage.files,
			color: memoryUsageColors.file,
			percentage: (memoryUsage.files / total) * 100
		},
		{
			value: memoryUsage.stories,
			color: memoryUsageColors.story,
			percentage: (memoryUsage.stories / total) * 100
		},
		{
			value: memoryUsage.audio,
			color: memoryUsageColors.audio,
			percentage: (memoryUsage.audio / total) * 100
		},
		{
			value: memoryUsage.other,
			color: memoryUsageColors.other,
			percentage: (memoryUsage.other / total) * 100
		}
	].filter(segment => segment.value > 0);
};