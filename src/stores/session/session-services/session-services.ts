import { showNotify } from '@shared/config/const'
import { authActionsStore } from '@stores/auth'
import i18next from 'i18next'
import { makeAutoObservable } from 'mobx'
import { sessionActionsStore } from '../session-actions/session-actions'
import { GetSessionsResponse } from '../session-actions/types'

class SessionServiceStore {
	constructor() { makeAutoObservable(this) }

	// SESSION HANDLERS

	handleDeleteSessionsMessages = (message: string) => {
		const { logOutAction } = authActionsStore

		if (message === "Session closed successfully. You have been logged out.") {
			logOutAction()
			return
		}
		if (message === "All other sessions deleted successfully. Your current session remains active.") {
			showNotify("success", {
				message: i18next.t("delete_all_other_sessions_success")
			})
			return
		}
		showNotify("success", {
			message: i18next.t("delete_session_success")
		})
	}

	deleteSessionsErrorHandler = (sessionsListBefore: GetSessionsResponse[], isAll: boolean) => {
		const { sessions } = sessionActionsStore
		if (!sessions.data || !sessionsListBefore) return
		showNotify("error", {
			message: i18next.t(isAll ? "sessions_delete_error" : "session_delete_error")
		})
		sessions.data.list = sessionsListBefore
		return true
	}

}

export const sessionServiceStore = new SessionServiceStore()