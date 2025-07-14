import { ModerationsSchema } from '@shared/schemas/moderationSchema'
import { makeAutoObservable } from 'mobx'
import { mobxState, useMobxForm } from 'mobx-toolbox'
import { moderationActionsStore } from '../moderation-actions/moderation-actions'
import { localStorage } from '@shared/storage'
import { ModerationRequestResponse } from '../moderation-actions/types'

class ModerationStore {
   constructor() { makeAutoObservable(this) }

	// MODERATION REQUEST

	callingCode = mobxState('')('callingCode', { reset: true })

   submitModerationForm = useMobxForm({
		full_name: "",
		nationality: "",
		phone: "",
      city: "",
		reason: "",
	}, ModerationsSchema, {
		disabled: true,
		instaValidate: true,
		resetErrIfNoValue: false,
	})

	// MODERATION REASON MODAL

	isModerationReasonModalOpen = mobxState(false)('isModerationReasonModalOpen')

	// MY MODERATION REQUEST PRELOAD

	preloadMyModerationRequest = async () => {
		const { getMyModerationRequestAction } = moderationActionsStore

		const request: ModerationRequestResponse | null = await localStorage.get("moderation-request")

		if (request) {
			getMyModerationRequestAction(false, request)
			return
		}

		getMyModerationRequestAction()
	}
}

export const moderationStore = new ModerationStore()