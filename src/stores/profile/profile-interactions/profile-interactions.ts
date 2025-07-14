import { GroupBtnsType } from '@shared/config/types';
import { getProfileId, navigate } from '@shared/lib/navigation';
import { EditProfileSchema } from '@shared/schemas/profileSchema';
import { localStorage } from '@shared/storage';
import { postActionsStore } from '@stores/post';
import * as SplashScreen from 'expo-splash-screen';
import { makeAutoObservable, runInAction } from 'mobx';
import { mobxState, useMobxForm } from 'mobx-toolbox';
import { Animated } from 'react-native';
import { ReanimatedScrollEvent } from 'react-native-reanimated/lib/typescript/hook/commonTypes';
import { profileActionsStore } from '../profile-actions/profile-actions';
import { EditProfileBody } from '../profile-actions/types';
import { Profile, UserMore } from '../types';

class ProfileStore {
	constructor() {
		makeAutoObservable(this);
	}

	_isRefreshTriggered = false;

	// INTERNET

	isNoInternet = mobxState(false)("isNoInternet");

	// PROFILES

	profile: Profile | null = null;
	setProfile = (profile: Profile | null) => {
		localStorage.set("profile", profile);
		this.profile = profile;
	};

	user: Profile | null = null;
	setUser = (user: Profile | null) => this.user = user;

	// TABS

	profileTab = mobxState(0)("profileTab", { reset: true });
	tabCount = 4;
	scrollPosition = 0;
	openedPage = mobxState(0)("openedPage");

	setScrollPosition = (position: number) => {
		this.scrollPosition = position;
	};

	setProfileTab = (index: number) => {
		console.log('[setProfileTab]: index', index);
		this.profileTab.setProfileTab(index);
		this.openedPage.setOpenedPage(index);
	};

	handleSwap = (index: number) => {
		console.log('[handleSwap]: index', index);
		this.openedPage.setOpenedPage(index);
	};

	// REFRESH CONTROL

	refreshing = mobxState(false)("refreshing");
	postRefreshing = mobxState(false)("postRefreshing");

	onRefresh = (tag: string, isUser: boolean) => {
		const { getMyProfile } = profileActionsStore;
		const { getUserPostsAction } = postActionsStore;

		if (!tag) {
			console.warn('[onRefresh]: tag is undefined');
			return;
		}

		if (this.refreshing.refreshing || this.postRefreshing.postRefreshing) return;

		this.refreshing.setRefreshing(true);
		this.postRefreshing.setPostRefreshing(true);

		getMyProfile(false, tag, isUser, true, () => {
			this.refreshing.setRefreshing(false);
		});
		getUserPostsAction(tag, false, true, () => {
			this.postRefreshing.setPostRefreshing(false);
		});
	};

	handleScroll = (event: ReanimatedScrollEvent, progress: Animated.Value) => {
		const offsetY = event.contentOffset.y;

		if (offsetY < 0) {
			const MAX_PULL_DISTANCE = 100;
			const progressValue = Math.min(Math.abs(offsetY) / MAX_PULL_DISTANCE, 1);
			if (progress && typeof progress.setValue === 'function') {
				progress.setValue(progressValue);
			}
		} else {
			if (progress && typeof progress.setValue === 'function') {
				progress.setValue(0);
			}
		}
	};

	// PRELOAD

	preloadProfile = async () => {
		const tokens = await localStorage.get('tokens');

		this.resetForm();

		if (tokens) {
			navigate("MainStack", {
				screen: "MainTabs",
				params: {
					screen: "Posts"
				}
			});
		}
		else {
			navigate('SignStack', {
				screen: 'SignStack',
				params: {
					screen: 'SignIn'
				}
			});
		}
		SplashScreen.hideAsync();
	};

	// PROFILE DATA

	userToShow: null | Profile = null;
	setUserToShow = (user: Profile | null) => {
		runInAction(() => {
			this.userToShow = user;
		});
	};

	getProfileData = () => {
		const profileId = getProfileId();
		console.log('[getProfileData]: profileId', profileId);

		if (!this.profile) {
			const userFromLocal = localStorage.get('profile');
			console.log("profile from local storage", userFromLocal);
			console.log('[getProfileData]: Profile is null');
			return null;
		}

		const isCurrentUserProfile = !profileId || profileId === this.profile?.tag;
		const profile = isCurrentUserProfile ? this.profile : this.user;

		console.log('[getProfileData]: Profile', profile);

		if (this.userToShow !== profile) {
			this.setUserToShow(profile);
		}

		return profile;
	};

	smartProfileReplace = (updatedData: EditProfileBody) => {
		if (!this.profile) return;

		console.log("[smartProfileReplace] updatedData: ", updatedData);

		runInAction(() => {
			for (const key in updatedData) {
				if (key === "more" && updatedData.more) {
					const updatedMore = updatedData.more;

					Object.entries(updatedMore).forEach(([k, v]) => {
						const moreKey = k as keyof UserMore;
						if (v !== undefined) {
							if (profileStore.profile && profileStore.profile.more?.[moreKey] !== v) {
								(profileStore.profile.more as any)[moreKey] = v;
							}
							if (profileStore.userToShow && profileStore.userToShow.more?.[moreKey] !== v) {
								// @ts-ignore
								profileStore.userToShow.more[moreKey] = v;
							}
						}
					});
				} else {
					const typedKey = key as keyof EditProfileBody;
					const newValue = updatedData[typedKey];
					console.log("typedKey", typedKey);
					console.log("newValue", newValue);
					if (newValue !== undefined && profileStore.profile) {
						if (profileStore.profile?.[typedKey] !== newValue) {
							// @ts-ignore
							profileStore.profile[typedKey] = newValue;
						}
						if (profileStore.userToShow?.[typedKey] !== newValue) {
							// @ts-ignore
							profileStore.userToShow[typedKey] = newValue;
						}
					}
				}

			}
		});
	};

	// GRID POSTS

	calculatePadding = (text: string | undefined): number => {
		if (!text) return 30;

		const length = text.length;

		if (length <= 10) return 30;
		if (length >= 50) return 10;

		return Math.round(30 - (length - 10) * (20 / 40));
	};

	// FORMS

	editProfileForm = useMobxForm({
		name: "",
		description: "",
		tag: "",
		hb: ""
	}, EditProfileSchema, {
		instaValidate: true,
		resetErrIfNoValue: true
	});

	resetForm = () => {
		if (!this.profile) return;
		const newForm = {
			name: this.profile.name,
			description: this.profile?.more?.description || "",
			tag: this.profile?.tag,
			hb: this.profile?.more?.hb || ""
		};
		this.editProfileForm = useMobxForm(newForm, EditProfileSchema);
		this.datePickerOpen.setDatePickerOpen(false);
	};

	// DATE PICKER

	datePickerOpen = mobxState(false)("datePickerOpen");

	// PRIVACY SETTINGS

	selectedPrivacy = mobxState<GroupBtnsType | null>(null)("selectedPrivacy");
	privacySettingsItems = mobxState<GroupBtnsType[]>([])("privacySettingsItems");

	// DELETE HB

	onDeleteHb = () => {
		const { editProfileAction } = profileActionsStore;

		const hbValueBefore = this.editProfileForm.values.hb;
		this.editProfileForm.values.hb = "";
		this.datePickerOpen.setDatePickerOpen(false);

		editProfileAction(
			{ more: { hb: "" } },
			() => {
				this.editProfileForm.values.hb = hbValueBefore;
			}
		);
	};

	// PRIVACY

	privacySettingItems = mobxState<GroupBtnsType[]>([])("privacySettingItems");

	// PROFILE PAGE

	showRightProfile = (tag?: string) => {
		const { getUserAction } = profileActionsStore;

		runInAction(() => {
			if (!tag) {
				this.setUserToShow(this.profile);
				return;
			}

			if (tag !== this.profile?.tag) {
				this.setUserToShow(null);
				getUserAction(tag);
				return;
			}

			this.setUserToShow(this.profile);
		});
	};

}

export const profileStore = new ProfileStore();