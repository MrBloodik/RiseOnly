import { rust } from '@shared/api/api';
import { GroupBtnsType } from '@shared/config/types';
import { getCurrentRoute } from '@shared/lib/navigation';
import { localStorage } from '@shared/storage';
import { fileActionsStore } from '@stores/file';
import { mediaInteractionsStore } from '@stores/media';
import { notifyInteractionsStore } from '@stores/notify';
import { AxiosResponse } from 'axios';
import i18next from 'i18next';
import { makeAutoObservable, reaction, runInAction } from 'mobx';
import { MobxSaiInstance, mobxSaiFetch, mobxSaiHandler, mobxState } from 'mobx-toolbox';
import { profileStore } from '../profile-interactions/profile-interactions';
import { profileServiceStore } from '../profile-service/profile-service';
import { Profile, User } from '../types';
import { EditPrivacySettingsBody, EditProfileBody, GetPrivacySettingsResponse } from './types';

class ProfileActionsStore {
	constructor() {
		makeAutoObservable(this);
	}

	// GET MY PROFILE

	myProfile: MobxSaiInstance<Profile> = {};
	setMyProfile = (profile: Profile) => this.myProfile.data = profile;

	getMyProfile = async (needPending = true, tag: string, isUser: boolean, fetchIfHaveData = false, onFinish = (data: Profile) => { }) => {
		const {
			setProfile,
			setUserToShow
		} = profileStore;

		this.myProfile = mobxSaiFetch(
			() => getProfile(tag),
			{
				id: "getMyProfile" + tag,
				cacheSystem: { setCache: () => { } },
				needPending,
				fetchIfPending: false,
				fetchIfHaveData: fetchIfHaveData
			}
		);

		const disposer = reaction(
			() => this.myProfile.data,
			async (data) => {
				console.log('[getMyProfile]: My profile fetched', data);
				if (!data) return true;
				const name = getCurrentRoute()?.name;
				if (name == "Profile") {
					localStorage.set("profile", data);
					setProfile(data);
				}
				setUserToShow(data);
				onFinish(data);
				disposer();
			}
		);

		return true;
	};

	// EDIT PROFILE LOGO

	editProfileLogo: MobxSaiInstance<any> = {};
	editProfileLogoLoading = mobxState(false)("editProfileLogoLoading");
	editProfileLogoProgress = mobxState(0)("editProfileLogoProgress");

	editProfileLogoAction = async () => {
		const { uploadSingleFileAction } = fileActionsStore;
		const { mediaResult: { mediaResult } } = mediaInteractionsStore;
		const {
			editProfileLogoProgress: { setEditProfileLogoProgress },
			editProfileLogoLoading: { editProfileLogoLoading, setEditProfileLogoLoading }
		} = this;

		if (editProfileLogoLoading) return;
		setEditProfileLogoLoading(true);
		setEditProfileLogoProgress(0);

		try {
			const file = mediaResult?.[0]?.file;
			if (!file) {
				console.warn("[editProfileLogoAction]: file is ", file);
				return;
			}

			const res = await uploadSingleFileAction(file, (progress) => {
				setEditProfileLogoProgress(progress);
			});
			if (!res?.url) return;

			if (profileStore.profile) profileStore.profile.more.logo = res.url;
			const body = { more: { logo: res.url } };
			this.editProfileLogo = mobxSaiFetch(editProfile(body));
			setEditProfileLogoLoading(false);
		} catch (err) {
			console.log("[editProfileLogoAction] Error:", err);
			setEditProfileLogoProgress(0);
			setEditProfileLogoLoading(false);
		} finally {
			setEditProfileLogoLoading(false);
		}
	};

	// EDIT PROFILE

	editProfile: MobxSaiInstance<Profile> = {};

	editProfileAction = (body: EditProfileBody | null = null, onErrorCallback?: () => void) => {
		const {
			editProfileForm: { values },
			profile,
			setProfile,
			smartProfileReplace
		} = profileStore;
		const { showNotify } = notifyInteractionsStore;

		const profileBefore = JSON.parse(JSON.stringify(profile));
		const newProfileData: EditProfileBody = body || {
			name: values.name,
			tag: values.tag,
			more: {
				hb: values.hb || null,
				description: values.description
			}
		};

		console.log("newProfileData", newProfileData);
		smartProfileReplace(newProfileData);

		try {
			this.editProfile = mobxSaiFetch(editProfileReturnsData(newProfileData));

			const disposer = reaction(
				() => [this.editProfile?.data, this.editProfile?.error],
				(data) => {
					if (data[1]) {
						if (onErrorCallback) onErrorCallback();
						setProfile(profileBefore);
						showNotify("error", {
							message: i18next.t("edit_profile_error_message")
						});
						return;
					}
					if (!data[0]) return;
					showNotify("success", {
						message: i18next.t("edit_profile_success_text")
					});
					disposer();
				}
			);
		} catch (err) {
			console.log(err);
		}
	};

	// EDIT PROFILE PRIVACY

	editProfilePrivacy: MobxSaiInstance<GetPrivacySettingsResponse> = {};

	editProfilePrivacyAction = (
		selectedPrivacyStatus: GroupBtnsType
	) => {
		const { privacy: { data } } = profileActionsStore;
		const { editPrivacySuccessHandler, editPrivacyErrorHandler } = profileServiceStore;
		const { selectedPrivacy: { selectedPrivacy } } = profileStore;

		if (!selectedPrivacy || !selectedPrivacy.field || !data) return;

		const privacyBefore = data[selectedPrivacy.field as keyof EditPrivacySettingsBody];
		const newPrivacyData: Partial<EditPrivacySettingsBody> = {
			[selectedPrivacy.field as keyof EditPrivacySettingsBody]: selectedPrivacyStatus.actionKey as any
		};

		this.editProfilePrivacy = mobxSaiFetch(editPrivacy(newPrivacyData));

		mobxSaiHandler(
			this.editProfilePrivacy,
			editPrivacySuccessHandler,
			(error) => editPrivacyErrorHandler(error, privacyBefore)
		);
	};

	// GET PRIVACY

	privacy: MobxSaiInstance<GetPrivacySettingsResponse> = {};

	getPrivacyAction = () => {
		const { getPrivacySuccessHandler, getPrivacyErrorHandler } = profileServiceStore;

		this.privacy = mobxSaiFetch(
			() => getPrivacy(),
			{ id: "getPrivacyAction", fetchIfHaveData: false }
		);

		mobxSaiHandler(
			this.privacy,
			(data) => getPrivacySuccessHandler(data),
			getPrivacyErrorHandler
		);
	};

	// GET USER

	user: MobxSaiInstance<User> = {};

	getUserAction = (tag: string) => {
		if (!tag || tag.trim() === '') {
			console.warn('[getUserAction]: tag is empty or undefined');
			return;
		}

		const { getUserSuccessHandler, getUserErrorHandler } = profileServiceStore;

		runInAction(() => {
			this.user = mobxSaiFetch(
				() => getProfile(tag),
				{
					id: "getUserAction" + tag,
					cacheSystem: { setCache: () => { } }
				}
			);
		});

		mobxSaiHandler(
			this.user,
			getUserSuccessHandler,
			getUserErrorHandler
		);
	};
}

export const profileActionsStore = new ProfileActionsStore();

export const getProfile = async (tag?: string) => {
	let url = '/user/profile';
	if (tag) url += `/${tag}`;
	return (await rust.get(url)).data;
};
export const editProfile = async (body: EditProfileBody): Promise<AxiosResponse<Profile, any>> => await rust.patch("/user/profile", body);
export const editProfileReturnsData = async (body: EditProfileBody): Promise<Profile> => (await rust.patch("/user/profile", body)).data;
export const getPrivacy = async (): Promise<GetPrivacySettingsResponse> => (await rust.get("/user/privacy")).data;
export const editPrivacy = async (body: Partial<EditPrivacySettingsBody>): Promise<GetPrivacySettingsResponse> => (await rust.patch("/user/privacy", { body })).data;