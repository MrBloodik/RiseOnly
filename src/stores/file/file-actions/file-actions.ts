import { rust } from '@shared/api/api';
import { notifyInteractionsStore } from '@stores/notify';
import { MobxSaiWsInstance } from '@stores/ws/websocket-store';
import i18next from 'i18next';
import { makeAutoObservable } from 'mobx';
import { Platform } from 'react-native';
import { fileServicesStore } from '../file-services/file-services';
import { fileWebsocketStore } from '../file-websocket/file-websocket';
import { UploadSingleFileResponse } from './types';

class FileActionsStore {
	constructor() { makeAutoObservable(this); }

	// UPLOAD DEFAULT SINGLE FILE

	uploadSingleFileAction = async (
		file: any,
		setLoading?: (progress: number) => void
	) => {
		const { showNotify } = notifyInteractionsStore;
		try {
			console.log("[uploadSingleFileAction] Starting upload with progress callback:", !!setLoading);

			const result = await uploadSingleFile(file, (progress) => {
				console.log("[uploadSingleFileAction] Upload progress:", progress);
				if (setLoading) {
					setLoading(progress);
				}
			});

			console.log("[uploadSingleFileAction] Upload completed:", result);
			return result;
		} catch (err) {
			console.log("[uploadFileAction] Error:", err);
			showNotify("error", {
				message: i18next.t("upload_file_error_message")
			});
			throw err;
		}
	};

	uploadSingleFilesAction = async (
		files: any[],
		setLoading?: (progress: number) => void
	) => {
		const { showNotify } = notifyInteractionsStore;

		files.forEach(async file => {
			try {
				console.log("[uploadSingleFileAction] Starting upload with progress callback:", !!setLoading);

				const result = await uploadSingleFile(file, (progress) => {
					console.log("[uploadSingleFileAction] Upload progress:", progress);
					if (setLoading) {
						setLoading(progress);
					}
				});

				console.log("[uploadSingleFileAction] Upload completed:", result);
				return result;
			} catch (err) {
				console.log("[uploadFileAction] Error:", err);
				showNotify("error", {
					message: i18next.t("upload_file_error_message")
				});
				return { status: "error", message: `${err}` };
			}
		});

		return { status: "success", message: "Success" };
	};

	uploadVideo: MobxSaiWsInstance<any> = {};

	uploadVideoAction = async (files: any[], uploadId: string) => {
		const { fileWs } = fileWebsocketStore;
		const { showNotify } = notifyInteractionsStore;

		console.log("[uploadVideoAction] Starting upload with uploadId:", uploadId);

		if (!files || !Array.isArray(files) || files.length === 0) {
			showNotify("error", {
				message: "Файлы для загрузки не предоставлены"
			});
			throw new Error("Файлы для загрузки не предоставлены");
		}

		await new Promise<void>((resolve) => {
			fileWs.initializeWebSocketConnection(() => {
				resolve();
			});
		});

		const results = await Promise.allSettled(
			files.map(async (file, index) => {
				try {
					console.log(`[uploadVideoAction] Обрабатываем файл ${index + 1}/${files.length}`);

					if (!file) {
						throw new Error(`Файл ${index + 1} отсутствует`);
					}

					const uploadPromise = new Promise((resolve, reject) => {
						fileServicesStore.registerProgressCallback(uploadId, (progressMessage) => {
							console.log(`[uploadVideoAction] Progress update for file ${index + 1}:`, progressMessage);

							if (progressMessage.url && progressMessage.stage === "completed") {
								console.log(`[uploadVideoAction] Upload completed for file ${index + 1}, URL:`, progressMessage.url);
								resolve({
									url: progressMessage.url,
									uploadId: uploadId,
									filename: file.filename || file.name || 'video.mov'
								});
							} else if (progressMessage.stage === "error") {
								console.error(`[uploadVideoAction] Upload failed for file ${index + 1}:`, progressMessage.message);
								reject(new Error(progressMessage.message));
							}
						});

						setTimeout(() => {
							fileServicesStore.unregisterProgressCallback(uploadId);
							reject(new Error("Timeout: Upload took too long"));
						}, 10 * 60 * 1000);
					});

					await fileWs.mobxSaiWs(
						{
							type: "subscribe",
							upload_id: uploadId
						},
						this.uploadVideo,
						{ bypassQueue: true }
					);

					const uploadResponse = await uploadVideo(file, uploadId);

					console.log(`[uploadVideoAction] Initial upload response for file ${index + 1}:`, uploadResponse?.data);

					if (uploadResponse?.data?.url === "processing") {
						console.log(`[uploadVideoAction] File ${index + 1} is being processed, waiting for WebSocket updates...`);
						const finalResult = await uploadPromise;
						return finalResult;
					}

					else if (uploadResponse?.data?.url && uploadResponse.data.url !== "processing") {
						console.log(`[uploadVideoAction] File ${index + 1} uploaded directly, URL:`, uploadResponse.data.url);
						fileServicesStore.unregisterProgressCallback(uploadId);
						return {
							url: uploadResponse.data.url,
							uploadId: uploadId,
							filename: uploadResponse.data.filename || file.filename || file.name || 'video.mov'
						};
					}

					else {
						fileServicesStore.unregisterProgressCallback(uploadId);
						throw new Error("Сервер не вернул URL файла");
					}

				} catch (err: any) {
					console.error(`[uploadVideoAction] Ошибка загрузки файла ${index + 1}:`, {
						message: err?.message,
						stack: err?.stack,
						file: file?.name || file?.uri
					});

					fileServicesStore.unregisterProgressCallback(uploadId);

					if (index === 0) {
						const errorMessage = err?.message || i18next.t("upload_file_error_message");
						showNotify("error", {
							message: errorMessage
						});
					}

					throw err;
				}
			})
		);

		const successful = results.filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled');
		const failed = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected');

		console.log(`[uploadVideoAction] Результаты загрузки: ${successful.length} успешных, ${failed.length} неудачных`);

		if (failed.length > 0) {
			console.error(`[uploadVideoAction] Ошибки загрузки:`, failed.map(f => f.reason));
		}

		return successful.map(result => result.value);
	};
}

export const fileActionsStore = new FileActionsStore();

const uploadVideo = async (file: any, uploadId: string) => {
	if (!file) {
		throw new Error("Файл не предоставлен");
	}

	const fileUri = file.uri || (file._rawAsset && file._rawAsset.uri) || (file.file && file.file.uri);
	if (!fileUri) {
		throw new Error("URI файла отсутствует");
	}

	console.log("[uploadVideo] Начинаем загрузку видео:", {
		uri: fileUri,
		type: file.type || (file.file && file.file.type),
		name: file.filename || (file._rawAsset && file._rawAsset.filename) || (file.file && file.file.name),
		size: file.size || (file._rawAsset && file._rawAsset.size)
	});

	const formData = new FormData();

	const fileToUpload = {
		uri: Platform.OS === 'android' ? fileUri : fileUri.replace('file://', ''),
		type: file.type || (file._rawAsset && 'video/quicktime') || 'video/mp4',
		name: file.filename || (file._rawAsset && file._rawAsset.filename) || 'video.mov',
	};

	console.log("[uploadVideo] Подготовленный файл:", fileToUpload);

	// @ts-ignore - ignore because it is simply necessary for RN files
	formData.append('video', fileToUpload);
	formData.append('upload_id', uploadId);

	try {
		console.log("[uploadVideo] Отправляем запрос на сервер...");

		if (!rust || !rust.defaults || !rust.defaults.baseURL) {
			throw new Error("API клиент не инициализирован");
		}

		const res = await rust.post(`/file/upload-video`, formData, {
			headers: {
				'Content-Type': 'multipart/form-data',
			},
			timeout: 60000,
		});

		console.log("[uploadVideo] Ответ сервера:", res.status, res.data);

		if (!res.data) {
			throw new Error("Пустой ответ от сервера");
		}

		return res;
	} catch (error: any) {
		console.error("[uploadVideo] Подробная ошибка:", {
			message: error?.message,
			stack: error?.stack,
			response: error?.response?.data,
			status: error?.response?.status,
		});

		if (error?.code === 'ECONNABORTED') {
			throw new Error("Превышено время ожидания загрузки видео");
		}

		if (error?.response?.status === 413) {
			throw new Error("Видео файл слишком большой");
		}

		if (error?.response?.status === 400) {
			const errorMsg = error?.response?.data?.error || "Неверный формат видео файла";
			throw new Error(errorMsg);
		}

		if (!error?.response) {
			throw new Error("Проблема с подключением к серверу");
		}

		throw error;
	}
};

export const uploadSingleFile = async (
	file: any,
	onProgress?: (progress: number) => void
): Promise<UploadSingleFileResponse> => {
	const formData = new FormData();

	const fileToUpload = {
		uri: Platform.OS === 'android' ? file.uri : file.uri.replace('file://', ''),
		type: file.type || 'image/jpeg',
		name: file.name || 'image.jpg',
	};

	console.log("[uploadSingleFile] Uploading file:", fileToUpload);

	// @ts-ignore - ignore because it is simply necessary for RN files
	formData.append('file', fileToUpload);

	return rust.post(`/file/upload-single`, formData, {
		headers: {
			'Content-Type': 'multipart/form-data',
			'Accept': 'application/json',
		},
		withCredentials: true,
		onUploadProgress: (progressEvent) => {
			if (progressEvent.total && onProgress) {
				const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
				console.log("[uploadSingleFile] Progress:", percentCompleted);
				onProgress(percentCompleted);
			}
		}
	}).then(response => response.data);
};

export const diagnoseVideoUpload = async (file: any) => {
	console.log("=== ДИАГНОСТИКА ЗАГРУЗКИ ВИДЕО ===");

	try {
		console.log("1. Проверяем файл:", {
			exists: !!file,
			uri: file?.uri,
			name: file?.name,
			type: file?.type,
			size: file?.size
		});

		if (!file) {
			throw new Error("Файл не предоставлен");
		}

		if (!file.uri) {
			throw new Error("URI файла отсутствует");
		}

		console.log("2. Проверяем API клиент:", {
			rustExists: !!rust,
			baseURL: rust?.defaults?.baseURL,
			headers: rust?.defaults?.headers
		});

		if (!rust) {
			throw new Error("API клиент не инициализирован");
		}

		console.log("3. Тестируем подключение к серверу...");
		try {
			const pingResponse = await rust.get('/file/ping');
			console.log("   ✅ Сервер доступен:", pingResponse.status);
		} catch (pingError: any) {
			console.error("   ❌ Сервер недоступен:", pingError?.message);
			throw new Error(`Сервер недоступен: ${pingError?.message}`);
		}

		console.log("4. Пробуем загрузить видео...");
		const result = await fileActionsStore.uploadVideoAction([file]);

		console.log("✅ Диагностика завершена успешно:", result);
		return result;

	} catch (error: any) {
		console.error("❌ Диагностика выявила проблему:", {
			message: error?.message,
			stack: error?.stack,
			name: error?.name
		});

		if (error?.message?.includes("Network Error")) {
			console.error("💡 Проблема с сетью. Проверьте подключение к интернету.");
		} else if (error?.message?.includes("timeout")) {
			console.error("💡 Превышено время ожидания. Возможно, файл слишком большой или медленное соединение.");
		} else if (error?.code === 'ECONNREFUSED') {
			console.error("💡 Сервер не запущен или недоступен по указанному адресу.");
		} else if (error?.response?.status === 413) {
			console.error("💡 Файл слишком большой для загрузки.");
		} else if (error?.response?.status === 400) {
			console.error("💡 Неверный формат файла или проблема с данными.");
		}

		throw error;
	}
};