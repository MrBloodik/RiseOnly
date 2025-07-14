import { NotifyData } from '@stores/notify/types';
import i18next from 'i18next';

export const getDeletePostNotifyData = () => {
	const notifyObj: NotifyData = {
		title: i18next.t('deletePostNotify_error_title'),
		message: i18next.t('deletePostNotify_error_message')
	};

	return notifyObj;
};

export const getDeletePostSuccessNotifyData = () => {
	const notifyObj: NotifyData = {
		title: i18next.t('deletePostNotify_success_title'),
		message: i18next.t('deletePostNotify_success_message')
	};

	return notifyObj;
};
