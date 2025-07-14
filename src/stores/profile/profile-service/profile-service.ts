import { showNotify } from '@shared/config/const'
import { DefaultResponse, ViewPrivacyT } from '@shared/config/types'
import { localStorage } from '@shared/storage'
import { AxiosResponse } from 'axios'
import i18n from 'i18n'
import i18next from 'i18next'
import { makeAutoObservable } from 'mobx'
import { profileActionsStore } from '../profile-actions/profile-actions'
import { EditPrivacySettingsBody, GetPrivacySettingsResponse } from '../profile-actions/types'
import { profileStore } from '../profile-interactions/profile-interactions'
import { Profile, User } from '../types'

class ProfileServiceStore {
	constructor() {
		makeAutoObservable(this)
	}

	// GET PRIVACY HANDLERS

	getPrivacySuccessHandler = (data: GetPrivacySettingsResponse) => {
		const { privacySettingsItems: { setPrivacySettingsItems } } = profileStore
		// setPrivacySettingsItems(getPrivacySettingsBtns(data))
	}

	getPrivacyErrorHandler = (error: AxiosResponse<DefaultResponse>) => {
		showNotify("error", {
			message: i18next.t("get_privacy_error")
		})
	}

	// EDIT PRIVACY HANDLERS

	editPrivacySuccessHandler = (data: GetPrivacySettingsResponse) => {
		localStorage.set("profile-privacy-settings", data)
		showNotify("success", {
			message: i18next.t("edit_profile_privacy_success_text")
		})
	}

	editPrivacyErrorHandler = (error: AxiosResponse<DefaultResponse>, privacyBefore: ViewPrivacyT) => {
		const { selectedPrivacy: { selectedPrivacy } } = profileStore

		showNotify("error", {
			message: i18next.t("edit_privacy_error")
		})

		if (!selectedPrivacy || !selectedPrivacy.field || !profileActionsStore.privacy.data) return

		profileActionsStore.privacy.data[selectedPrivacy.field as keyof EditPrivacySettingsBody] = privacyBefore
	}

	// GET USER HANDLERS

	getUserSuccessHandler = (data: User) => {
		profileStore.userToShow = { ...(data as Profile) }
	}

	getUserErrorHandler = (error: DefaultResponse) => {
		showNotify("error", {
			message: i18n.t("get_user_error_text")
		})
	}
}

export const profileServiceStore = new ProfileServiceStore()