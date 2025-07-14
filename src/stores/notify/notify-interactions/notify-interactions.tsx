import appImg from "@images/AppLogo.png"
import errorrImg from "@images/ErrorImg.png"
import infoImg from "@images/InfoImg.png"
import successImg from "@images/SuccessImg.png"
import warningImg from "@images/WarningImg.png"
import { darkenRGBA } from '@shared/lib/theme'
import { themeStore } from '@stores/theme'
import i18next from 'i18next'
import { makeAutoObservable } from 'mobx'
import { mobxState, MobxUpdateInstance } from 'mobx-toolbox'
import { MutableRefObject } from 'react'
import { ImageSourcePropType } from 'react-native'
import { Notifier, NotifierComponents } from 'react-native-notifier'
import { Notify, NotifyData, NotifyType } from '../types'

class NotifyInteractionsStore {
	constructor() {
		makeAutoObservable(this)
	}

	// NOTIFY

	showNotify = (type: NotifyType, notifyData: NotifyData) => {
		const { currentTheme } = themeStore

		const titleByType = {
			success: i18next.t("notify_success_title"),
			error: i18next.t("notify_error_title"),
			warning: i18next.t("notify_warning_title"),
			info: i18next.t("notify_info_title"),
			system: "Riseonly"
		}

		const imageByType = {
			success: successImg,
			error: errorrImg,
			warning: warningImg,
			info: infoImg,
			system: appImg
		}

		Notifier.showNotification({
			title: notifyData?.title || titleByType[type],
			description: notifyData?.message || `[DEV]: You doesnt provide message\ntype: ${type}\ntitle: ${notifyData?.title}`,
			duration: notifyData?.duration || 5000,
			onHidden: notifyData?.onHidden,
			onPress: notifyData?.onPress,
			hideOnPress: notifyData?.hideOnPress,
			Component: NotifierComponents.Notification, // TODO: Найти способ перенести компонент нотификаций в портал
			componentProps: {
				imageSource: imageByType[type] as ImageSourcePropType,
				containerStyle: {
					backgroundColor: darkenRGBA(currentTheme.bgTheme.background as string, -0.5),
					borderWidth: 0.3,
					borderColor: darkenRGBA(currentTheme.bgTheme.background as string, -0.8),
				},
				titleStyle: {
					color: currentTheme.textColor.color
				},
				descriptionStyle: {
					color: currentTheme.textColor.color
				}
			},
		})
	}

	// NOTIFICATIONS TABS

	activeTab = mobxState(0)("activeTab")
	scrollPosition = mobxState(0)("scrollPosition")
	scrollViewRef = mobxState<MutableRefObject<null> | null>(null)("scrollViewRef")
	openedPage = mobxState(0)("openedPage")

	// UPDATERS

	notificationUpdater: MobxUpdateInstance<Notify> | null = null
	setNotificationUpdater = (updater: MobxUpdateInstance<Notify>) => this.notificationUpdater = updater

	// REFRESH

	refreshing = mobxState(false)("refreshing")

}

export const notifyInteractionsStore = new NotifyInteractionsStore()