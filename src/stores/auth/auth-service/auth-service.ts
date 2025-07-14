import { showNotify } from '@shared/config/const';
import { DefaultResponse } from '@shared/config/types';
import { navigate } from '@shared/lib/navigation';
import { localStorage } from '@shared/storage';
import { profileStore } from '@stores/profile';
import { Profile } from '@stores/profile/types';
import { AxiosError } from 'axios';
import i18n from 'i18n';
import i18next from 'i18next';
import { makeAutoObservable } from "mobx";
import { SendCodeResponse } from '../auth-actions/types';
import { authStore } from '../auth-interactions/auth-interactions';

class AuthServiceStore {
	constructor() { makeAutoObservable(this); }

	fullClear = () => {
		const { setProfile } = profileStore;
		setProfile(null);
		localStorage.clear();
		navigate('SignStack', {
			screen: 'SignStack',
			params: {
				screen: 'SignIn'
			}
		});
	};

	// SIGN IN HANDLERS

	signInErrorHandler = (error: AxiosError<DefaultResponse>) => {
		const errorMessagesMap = {
			"Пользователь не найден": "signin_user_not_found",
			"Неверный пароль": "invalid_password_error",
		} as const;

		const message = error?.response?.data?.message;

		if (message && (message in errorMessagesMap)) {
			showNotify("error", {
				message: i18next.t(errorMessagesMap[message as keyof typeof errorMessagesMap])
			});
			return;
		}

		showNotify("error", {
			message: i18next.t("retry_later_error")
		});
	};

	signInSuccessHandler = (data: any) => {
		const { setProfile } = profileStore;
		if (!data) return;

		const { tokens, ...onlyProfile } = data.data;

		setProfile(onlyProfile as Profile);
		localStorage.set("tokens", tokens);

		navigate('MainStack', {
			screen: 'MainTabs',
			params: {
				screen: 'Posts'
			}
		});
	};

	// SEND CODE HANDLERS

	sendCodeSuccessHandler = (data: SendCodeResponse) => {
		const { isCodeOpen: { setIsCodeOpen } } = authStore;

		if (data.statusCode === 200) setIsCodeOpen(true);
	};

	sendCodeErrorHandler = (error: DefaultResponse) => {
		const { isCodeOpen: { setIsCodeOpen } } = authStore;

		if (error.message == "Invalid code") {
			showNotify("error", { message: i18n.t("send_code_invalidcode_error") });
			return;
		}

		showNotify("error", { message: i18n.t("send_code_error") });
		setIsCodeOpen(true);
	};

	// REGISTER CODE HANDLERS

	registerSuccessHandler = (data: Profile) => {
		const { setProfile } = profileStore;
		const { tokens, ...onlyProfile } = data;

		setProfile(onlyProfile as Profile);
		localStorage.set("tokens", tokens);

		navigate('MainStack', {
			screen: 'MainTabs',
			params: {
				screen: 'Posts'
			}
		});
	};

	registerErrorHandler = (error: DefaultResponse) => {
		showNotify("error", { message: i18n.t("register_error") });
	};
}

export const authServiceStore = new AuthServiceStore();