import { rust } from '@shared/api/api'
import { VirtualList } from '@shared/config/types'
import { notifyInteractionsStore } from '@stores/notify'
import i18next from 'i18next'
import { makeAutoObservable, reaction } from 'mobx'
import { mobxSaiFetch, MobxSaiInstance } from 'mobx-toolbox'
import { sessionInteractionsStore } from '../session-interactions/session-interactions'
import { sessionServiceStore } from '../session-services/session-services'
import { DeleteSessionsBody, DeleteSessionsResponse, GetSessionsResponse } from './types'

class SessionActionsStore {
	constructor() { makeAutoObservable(this) }

	// GET SESSIONS

	sessions: MobxSaiInstance<VirtualList<GetSessionsResponse[]>> = {}

	getSessionsAction = (fetchIfHaveData = false) => {
		const { showNotify } = notifyInteractionsStore

		try {
			this.sessions = mobxSaiFetch(getSessions())

			const disposer = reaction(
				() => this.sessions?.data,
				(data) => {
					if (!data) return
					disposer()
				}
			)
		} catch (err) {
			console.log("[getSessionsAction] error: ", err)
			showNotify("error", {
				title: i18next.t("getSessionsNotify_error_title"),
				message: i18next.t("getSessionsNotify_error_message")
			})
		}
	}

	// DELETE SESSION

	deleteSession: MobxSaiInstance<DeleteSessionsResponse> = {}

	deleteSessionAction = (isAll = false) => {
		const { handleDeleteSessionsMessages, deleteSessionsErrorHandler } = sessionServiceStore
		const {
			selectedSession: { selectedSession },
			sessionSheetOnCloseSignal: { setSessionSheetOnCloseSignal },
		} = sessionInteractionsStore

		if (!this.sessions.data) return

		const sessionsListBefore = this.sessions.data.list
		const body: DeleteSessionsBody = { isAll }
		setSessionSheetOnCloseSignal(true)

		if (!isAll && selectedSession) {
			body.sessionIdToTerminate = selectedSession.id
			this.sessions.data.list = this.sessions?.data?.list?.filter(t => t.id !== selectedSession.id)
		} else {
			this.sessions.data.list = this.sessions?.data?.list?.slice(0, 1)
		}

		this.deleteSession = mobxSaiFetch(deleteSession(body))

		const disposer = reaction(
			() => [this.deleteSession?.data, this.deleteSession?.error],
			(data) => {
				if (data[1] && deleteSessionsErrorHandler(sessionsListBefore, isAll)) return
				if (!data[0]) return
				handleDeleteSessionsMessages(data[0].message)
				disposer()
			}
		)
	}
}

export const sessionActionsStore = new SessionActionsStore()

export const getSessions = async (): Promise<VirtualList<GetSessionsResponse[]>> => {
	return (await rust.get("/sessions/list")).data
}
export const deleteSession = async (body: DeleteSessionsBody): Promise<DeleteSessionsResponse> => (await rust.delete("/sessions/delete", { data: body })).data