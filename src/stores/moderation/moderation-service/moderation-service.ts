import { showNotify } from '@shared/config/const'
import { AxiosError } from 'axios'
import i18next from 'i18next'
import { makeAutoObservable } from 'mobx';
import { ModerationRequestResponse } from '../moderation-actions/types'
import { localStorage } from '@shared/storage'

class ModerationServiceStore {
   constructor() { makeAutoObservable(this) }

   // ERROR HANDLERS

   sendModerationReqErrorHandler = (error: AxiosError<any, any>) => {
      if (error.response?.data?.message.includes("already")) {
         showNotify("error", { message: i18next.t("moderation_request_exists") })
         return;
      }

      showNotify("error", { message: i18next.t("moderation_request_error") })
   }

   // SUCCESS HANDLERS

   sendModerationReqSuccessHandler = () =>
      showNotify("success", { message: i18next.t("moderation_request_success") })

   getMyModerationRequestsSuccessHandler = (data: ModerationRequestResponse) =>
      localStorage.set("moderation-request", data)
}

export const moderationServiceStore = new ModerationServiceStore()