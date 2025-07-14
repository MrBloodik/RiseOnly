import { signInSchema, signUpSchema } from '@schemas/signSchema';
import { GenderT } from '@shared/config/types';
import { TFunction } from 'i18next';
import { makeAutoObservable, reaction } from "mobx";
import { mobxState, useMobxForm } from 'mobx-toolbox';
import { Alert, Linking } from 'react-native';
import { authActionsStore } from '../auth-actions/auth-actions';

class AuthStore {
	constructor() {
		makeAutoObservable(this);
		reaction(
			() => this.code.code,
			() => {
				if (this.code.code?.length !== 4) return;
				const { registerAction } = authActionsStore;
				registerAction();
			}
		);
	}

	// STATES

	code = mobxState('')('code', { reset: true });
	callingCode = mobxState('')('callingCode', { reset: true });
	isCodeOpen = mobxState(false)('isCodeOpen', { reset: true });
	selectedGender = mobxState<GenderT>("None")("selectedGender");

	// FORMS

	signInForm = useMobxForm(
		{
			number: "",
			password: ""
		},
		signInSchema,
		{ instaValidate: true, resetErrIfNoValue: false, disabled: true }
	);

	signUpForm = useMobxForm(
		{
			name: "",
			number: "",
			password: "",
			repeatPassword: "",
			gender: "none"
		},
		signUpSchema,
		{ instaValidate: true, resetErrIfNoValue: false, disabled: true }
	);

	// LOGIN

	loginError = mobxState(false)("loginErro");

	isLinkingBot = mobxState(false)("isLinkingBot");

	onSendCodePress = async (t: TFunction) => {
		const {
			callingCode: { callingCode },
			isLinkingBot: { setIsLinkingBot },
			signUpForm: { values }
		} = this;

		try {
			setIsLinkingBot(true);

			const phoneNumber = `${callingCode.replace("+", "").replaceAll(" ", "")}${values.number.replaceAll(" ", "")}`;

			const botLink = `tg://resolve?domain=riseonly_bot&start=${phoneNumber}`;
			const webBotLink = `https://t.me/riseonly_bot?start=${phoneNumber}`;

			console.log(`Opening Telegram bot with phone: ${phoneNumber}`);

			try {
				await Linking.openURL(botLink);
				console.log("Successfully opened Telegram app");
			} catch (error) {
				console.error("Failed to open Telegram app:", error);

				try {
					await Linking.openURL(webBotLink);
					console.log("Successfully opened Telegram web");
				} catch (fallbackError) {
					console.error("Failed to open Telegram web:", fallbackError);
					Alert.alert(
						t("notify_error_title"),
						t("telegram_bot_error"),
						[{ text: "OK" }]
					);
					setIsLinkingBot(false);
					return;
				}
			}

			// Показываем диалог с инструкциями и кнопками
			Alert.alert(
				t("telegram_bot_title"),
				t("telegram_bot_instruction"),
				[
					{
						text: t("telegram_bot_continue"),
						onPress: () => {
							setIsLinkingBot(false);
							// Запрашиваем код подтверждения
							authActionsStore.sendCodeAction();
						}
					},
					{
						text: t("telegram_bot_cancel"),
						style: "cancel",
						onPress: () => {
							setIsLinkingBot(false);
						}
					}
				]
			);

		} catch (error) {
			console.error("Error in onSendCodePress:", error);
			setIsLinkingBot(false);
			Alert.alert(
				t("notify_error_title"),
				t("telegram_bot_unexpected_error")
			);
		}
	};

}

export const authStore = new AuthStore();