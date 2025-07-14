import AsyncStorage from '@react-native-async-storage/async-storage';
import CookieManager from '@react-native-cookies/cookies';
import { authServiceStore } from '@stores/auth';
import axios from "axios";
import { Platform } from 'react-native';

const AUTH_COOKIE_KEY = 'auth_cookie_backup';
const AUTH_DOMAIN_KEY = 'auth_domain_backup';

export const clearCookies = async () => {
	try {
		await CookieManager.clearAll();
		console.log('All cookies cleared');

		await AsyncStorage.removeItem(AUTH_COOKIE_KEY);
		await AsyncStorage.removeItem(AUTH_DOMAIN_KEY);
		console.log('Backup cookie cleared');

		return Promise.resolve();
	} catch (error) {
		console.error('Error clearing cookies:', error);
		return Promise.resolve();
	}
};

export const backupCookie = async (cookieString: string, domain: string) => {
	try {
		await AsyncStorage.setItem(AUTH_COOKIE_KEY, cookieString);
		await AsyncStorage.setItem(AUTH_DOMAIN_KEY, domain);
		console.log('Cookie backed up to AsyncStorage');
	} catch (error) {
		console.error('Error backing up cookie:', error);
	}
};

const restoreCookieFromBackup = async () => {
	try {
		const cookieString = await AsyncStorage.getItem(AUTH_COOKIE_KEY);
		const domain = await AsyncStorage.getItem(AUTH_DOMAIN_KEY);

		if (cookieString && domain) {
			console.log('Restoring cookie from backup for domain:', domain);
			await CookieManager.setFromResponse(`https://${domain}`, cookieString);

			if (Platform.OS === 'android') {
				await CookieManager.flush();
			}

			console.log('Cookie restored from backup');
			return true;
		}
		return false;
	} catch (error) {
		console.error('Error restoring cookie from backup:', error);
		return false;
	}
};

export const initCookieManager = async () => {
	try {
		let baseURL = "https://api.riseonly.net";
		let apiDomain = 'api.riseonly.net';

		if (Platform.OS === 'android') {
			await CookieManager.flush();
		}

		if (baseURL?.split(":")[0] === "http") {
			apiDomain = 'http://localhost:8080';
		} else {
			apiDomain = 'https://api.riseonly.net';
		}

		const cookies = await CookieManager.get(apiDomain);
		console.log(`Cookies for ${apiDomain} on app start:`, cookies);

		const hasAuthCookie = cookies && Object.keys(cookies).some(key =>
			key.toLowerCase().includes('auth') || key.toLowerCase().includes('token')
		);

		if (!hasAuthCookie) {
			console.log('No auth cookies found, attempting to restore from backup');
			const restored = await restoreCookieFromBackup();
			if (restored) {
				const restoredCookies = await CookieManager.get(apiDomain);
				console.log(`Cookies after restoration ${apiDomain}:`, restoredCookies);
			}
		}

		console.log('Cookie manager initialized');
	} catch (error) {
		console.error('Error initializing cookie manager:', error);
	}
};

const handleSetCookieHeaders = async (response: any) => {
	try {
		const setCookieHeader = response.headers['set-cookie'] || response.headers['Set-Cookie'];
		if (!setCookieHeader) return;

		const url = response.config.url;
		if (!url) return;

		let fullUrl = url;
		if (!url.startsWith('http')) {
			const baseUrl = response.config.baseURL || '';
			fullUrl = baseUrl + url;
		}

		if (typeof setCookieHeader === 'string') {
			console.log('Handling Set-Cookie header (string)');
			await CookieManager.setFromResponse(fullUrl, setCookieHeader);

			if (setCookieHeader.toLowerCase().includes('auth') ||
				setCookieHeader.toLowerCase().includes('token')) {
				const urlObj = new URL(fullUrl);
				await backupCookie(setCookieHeader, urlObj.hostname);
			}
		} else if (Array.isArray(setCookieHeader)) {
			console.log('Handling Set-Cookie headers (array):', setCookieHeader.length);
			for (const cookie of setCookieHeader) {
				await CookieManager.setFromResponse(fullUrl, cookie);

				if (cookie.toLowerCase().includes('auth') ||
					cookie.toLowerCase().includes('token')) {
					const urlObj = new URL(fullUrl);
					await backupCookie(cookie, urlObj.hostname);
				}
			}
		}

		if (Platform.OS === 'android') {
			await CookieManager.flush();
		}
	} catch (error) {
		console.error('Error handling Set-Cookie headers:', error);
	}
};

export const createInstance = (which: 'nest' | 'rust') => {
	// let baseURL = process.env.RUST_API_BASE_URL;
	let baseURL = "https://api.riseonly.net/api";

	if (baseURL?.split(":")[0] === "http") {
		if (Platform.OS === 'ios') {
			baseURL = "http://127.0.0.1:8080/api"; // Для iOS симулятора
		} else if (Platform.OS === 'android') {
			baseURL = "http://10.0.2.2:8080/api"; // Для Android эмулятора
		}
	}

	const instance = axios.create({
		baseURL,
		withCredentials: true,
		headers: {
			'Content-Type': 'application/json'
		},
		xsrfCookieName: 'XSRF-TOKEN',
		xsrfHeaderName: 'X-XSRF-TOKEN'
	});

	axios.defaults.withCredentials = true;

	instance.interceptors.request.use(
		async (config) => {
			config.withCredentials = true;

			console.log('[Interceptor Request]:', config.method, config.url);
			return config;
		},
		(error) => {
			console.log('[Interceptor Request Error]:', error);
			return Promise.reject(error);
		}
	);

	instance.interceptors.response.use(
		async (response) => {
			await handleSetCookieHeaders(response);

			console.log('[Interceptor Response Success]:', response.config.url, response.status);
			return response;
		},
		(error) => {
			console.log('[Interceptor Response Error]:', error.config?.url, error.response?.status);
			console.log('[Interceptor Response Error] Error details:', error.response?.data);
			if (error.response?.data?.message === "No token provided" || error.response?.data?.message === "No access token provided" || error.response?.status === 401) {
				authServiceStore.fullClear();
				try {
					clearCookies().catch(err => console.log('Error clearing cookies on auth error:', err));
				} catch (err) {
					console.log('Error clearing cookies on auth error:', err);
				}
			}
			return Promise.reject(error);
		}
	);

	return instance;
};

// export const nest = createInstance('nest')
export const rust = createInstance('rust');