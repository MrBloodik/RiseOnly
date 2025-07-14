import { rust } from '@api/api';
import { DefaultResponse, GenderT } from '@config/types';
import { Profile } from '@stores/profile/types';
import { AxiosResponse } from 'axios';
import { makeAutoObservable, reaction } from "mobx";
import { MobxSaiInstance, mobxSaiFetch, mobxSaiHandler } from 'mobx-toolbox';
import { authStore } from '../auth-interactions/auth-interactions';
import { authServiceStore } from '../auth-service/auth-service';
import { AuthLoginBody, AuthRegisterBody, SendCodeBody, SendCodeResponse } from './types';

class AuthActionsStore {
	constructor() { makeAutoObservable(this); }

	// SEND-CODE

	sendCodeSai: MobxSaiInstance<SendCodeResponse> = {};

	sendCodeAction = async () => {
		const { sendCodeSuccessHandler, sendCodeErrorHandler } = authServiceStore;
		const {
			callingCode: { callingCode },
			signUpForm: { values: { number } }
		} = authStore;

		const phoneNumber = `${callingCode.replaceAll(" ", "")}${number.replaceAll(" ", "")}`;
		console.log(`Sending code to phone number: ${phoneNumber}`);

		try {
			this.sendCodeSai = mobxSaiFetch(sendCode({ number: phoneNumber }));

			mobxSaiHandler(
				this.sendCodeSai,
				(data) => {
					console.log("Send code response:", data);
					if (data.message.includes("Please start a chat with our bot first")) {
						console.log("Bot not started yet, retrying in 5 seconds");
						setTimeout(() => {
							this.sendCodeAction();
						}, 5000);
					} else {
						console.log("Code sent successfully");
						sendCodeSuccessHandler(data);
					}
				},
				(error) => {
					console.error("Send code error:", error);

					if (error?.message?.includes("chat not found") ||
						error?.message?.includes("Please start a chat") ||
						error?.message?.includes("Telegram chat ID not found")) {

						const customError = {
							...error,
							message: "Please make sure you've started a chat with our Telegram bot @riseonly_bot first."
						};
						sendCodeErrorHandler(customError);
					} else {
						sendCodeErrorHandler(error);
					}
				}
			);
		} catch (error) {
			console.error("Unexpected error in sendCodeAction:", error);
			sendCodeErrorHandler({
				message: "An unexpected error occurred. Please try again.",
				statusCode: 500,
				error: "Internal Error"
			});
		}
	};

	// REGISTER

	registerSai: MobxSaiInstance<any> = {};

	registerAction = async () => {
		const { registerSuccessHandler, registerErrorHandler } = authServiceStore;
		const {
			signUpForm: { values },
			code: { code },
			callingCode: { callingCode }
		} = authStore;

		const phoneNumber = `${callingCode.replace("+", "").replaceAll(" ", "")}${values.number.replaceAll(" ", "")}`;

		const body: AuthRegisterBody = {
			name: values.name,
			password: values.password,
			number: phoneNumber,
			code,
			gender: values.gender as GenderT
		};
		console.log(body);
		this.registerSai = mobxSaiFetch(authRegister(body));

		mobxSaiHandler(
			this.registerSai,
			registerSuccessHandler,
			registerErrorHandler
		);
	};

	// LOGIN

	loginSai: MobxSaiInstance<any> = {};

	loginAction = async () => {
		const {
			signInForm: { values },
			callingCode: { callingCode }
		} = authStore;
		const {
			signInErrorHandler,
			signInSuccessHandler,
		} = authServiceStore;

		const phoneNumber = `${callingCode.replace("+", "").replaceAll(" ", "")}${values.number.replaceAll(" ", "")}`;

		const body: AuthLoginBody = {
			number: phoneNumber,
			password: values.password
		};

		this.loginSai = mobxSaiFetch(
			() => authLogin(body),
			{
				id: "loginAction",
				cacheSystem: { setCache: () => { } }
			}
		);

		mobxSaiHandler(
			this.loginSai,
			signInSuccessHandler,
			signInErrorHandler
		);
	};

	// LOGOUT

	logout: MobxSaiInstance<DefaultResponse> = {};

	logOutAction = () => {
		const { fullClear } = authServiceStore;

		try {
			this.logout = mobxSaiFetch(logOut());

			const disposer = reaction(
				() => this.logout?.data,
				(data) => {
					if (!data) return;
					if (data.message == "Successfully logged out") {
						fullClear();
					}
					disposer();
				}
			);
		} catch (err) { console.log(err); }
	};
}

export const authActionsStore = new AuthActionsStore();

export const sendCode = async (body: SendCodeBody) => (await rust.post('/auth/send-code', body)).data;
export const authRegister = async (body: AuthRegisterBody) => (await rust.post('/auth/register', body)).data;
export const authLogin = async (body: AuthLoginBody): Promise<AxiosResponse<Profile, any>> => await rust.post('/auth/login', body);
export const logOut = async (): Promise<DefaultResponse> => (await rust.post("/auth/logout")).data;