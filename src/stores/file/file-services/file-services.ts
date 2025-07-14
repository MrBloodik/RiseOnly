import { logger } from '@shared/lib/helpers';
import { postActionsStore, postInteractionsStore } from '@stores/post';
import { postServiceStore } from '@stores/post/post-service/post-service';
import { makeAutoObservable } from 'mobx';

interface VideoUploadProgressMessage {
	type: string;
	upload_id: string;
	progress: number;
	stage: string;
	message: string;
	url?: string;
}

class FileServicesStore {
	constructor() { makeAutoObservable(this); }

	progressCallbacks: Map<string, (progress: VideoUploadProgressMessage) => void> = new Map();

	registerProgressCallback = (uploadId: string, callback: (progress: VideoUploadProgressMessage) => void) => {
		console.log(`[FileServicesStore] Registering progress callback for uploadId: ${uploadId}`);
		this.progressCallbacks.set(uploadId, callback);
	};

	unregisterProgressCallback = (uploadId: string) => {
		console.log(`[FileServicesStore] Unregistering progress callback for uploadId: ${uploadId}`);
		this.progressCallbacks.delete(uploadId);
	};

	getUploadVideoProgress = (message: any) => {
		logger.info("FileServicesStore", JSON.stringify(message, null, 2));

		if (message.upload_id.includes("createPost")) {
			const { createPostAction } = postActionsStore;
			const { changeCreatePostStatus, createPostStatuses } = postServiceStore;
			const { postUpdater } = postInteractionsStore;

			const tempId = message.upload_id.split("_")[1];

			postUpdater?.(tempId, "progress" as any, message.progress / 100);

			if (message.progress == 100) {
				changeCreatePostStatus(message.upload_id, "fulfilled");
				createPostAction([message.url], tempId);
				return;
			}
		}

		try {
			if (message.type === "progress") {
				const progressMessage: VideoUploadProgressMessage = {
					type: message.type,
					upload_id: message.upload_id,
					progress: message.progress || 0,
					stage: message.stage || "unknown",
					message: message.message || "",
					url: message.url
				};

				console.log(`[FileServicesStore] Processing progress for uploadId: ${progressMessage.upload_id}`);
				console.log(`[FileServicesStore] Progress: ${progressMessage.progress}%, Stage: ${progressMessage.stage}`);

				if (progressMessage.url) {
					console.log(`[FileServicesStore] Final URL received: ${progressMessage.url}`);
				}

				const callback = this.progressCallbacks.get(progressMessage.upload_id);
				if (callback) {
					console.log(`[FileServicesStore] Calling progress callback for uploadId: ${progressMessage.upload_id}`);
					callback(progressMessage);
				} else {
					console.warn(`[FileServicesStore] No progress callback found for uploadId: ${progressMessage.upload_id}`);
				}

				if (progressMessage.progress === 100 || progressMessage.stage === "completed" || progressMessage.url) {
					console.log(`[FileServicesStore] Upload completed for uploadId: ${progressMessage.upload_id}, cleaning up callback`);
					this.unregisterProgressCallback(progressMessage.upload_id);
				}



			} else if (message.type === "error") {
				console.error("[FileServicesStore] Error message received:", message);

				if (message.upload_id) {
					const callback = this.progressCallbacks.get(message.upload_id);
					if (callback) {
						callback({
							type: "error",
							upload_id: message.upload_id,
							progress: 0,
							stage: "error",
							message: message.message || "Unknown error",
							url: undefined
						});
					}
					this.unregisterProgressCallback(message.upload_id);
				}
			} else {
				console.log("[FileServicesStore] Unknown message type:", message.type);
			}

		} catch (error) {
			console.error("[FileServicesStore] Error processing WebSocket message:", error);
		}
	};
}

export const fileServicesStore = new FileServicesStore();