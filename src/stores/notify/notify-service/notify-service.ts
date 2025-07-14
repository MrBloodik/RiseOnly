import { showNotify } from '@shared/config/const'
import { localStorage } from '@shared/storage'
import { AxiosError } from 'axios'
import { TFunction } from 'i18next'
import { makeAutoObservable } from 'mobx'
import { useMobxUpdate } from 'mobx-toolbox'
import { GetAllNotificationsResponse } from '../notify-actions/types'
import { notifyInteractionsStore } from '../notify-interactions/notify-interactions'

class NotifyServiceStore {
   constructor() { makeAutoObservable(this) }

   // ERROR HANDLERS

   allNotificationsErrorHandler = (err: AxiosError<any, any>, t: TFunction) => {
      console.log("[allNotifications]: ", err.message)
      showNotify("error", { message: t("error_notify_fetch") })
   }

   // SUCCESS HANDLERS

   allNotificationsSuccessHandler = async (data: GetAllNotificationsResponse) => {
      const { setNotificationUpdater } = notifyInteractionsStore

      setNotificationUpdater(useMobxUpdate(() => data?.items))
      localStorage.set("user-notifications", data?.items)
   }
}

export const notifyServiceStore = new NotifyServiceStore()