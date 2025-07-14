import { rust } from '@shared/api/api'
import { TFunction } from 'i18next'
import { makeAutoObservable } from 'mobx'
import { mobxSaiFetch, mobxSaiHandler, MobxSaiInstance, mobxState } from 'mobx-toolbox'
import { notifyInteractionsStore, notifyServiceStore } from '../'
import { GetAllNotificationsParams, GetAllNotificationsResponse } from './types'
class NotifyActionsStore {
   constructor() { makeAutoObservable(this) }

   // ALL NOTIFICATIONS

   allNotificationsSai: MobxSaiInstance<GetAllNotificationsResponse> = {}
   ALL_NOTIFY_LIMIT = 20

   getAllNotificationsAction = (sort = 'all', t: TFunction, needPending = true, fetchIfHaveData = true, needAddToArr = true) => {
      const { scrollViewRef: { scrollViewRef } } = notifyInteractionsStore
      const { allNotificationsErrorHandler, allNotificationsSuccessHandler } = notifyServiceStore

      const params = mobxState<GetAllNotificationsParams>({
         relativeId: null,
         up: false,
         limit: 20,
         sort,
      })("params")

      this.allNotificationsSai = mobxSaiFetch(
         () => getAllNotifications(params.params),
         {
            id: "getAllNotificationsAction" + sort,
            fetchIfHaveData,
            needPending,
            dataScope: {
               startFrom: "top",
               scrollRef: scrollViewRef,
               botPercentage: 80,
               isHaveMoreResKey: "isHaveMore",
               setParams: params.setParams,
               relativeParamsKey: "relativeId",
               howMuchGettedToTop: 10000,
               upOrDownParamsKey: "up",
            },
            cacheSystem: {
               limit: this.ALL_NOTIFY_LIMIT
            },
            fetchAddTo: {
               path: needAddToArr ? "items" : '',
               addTo: needAddToArr ? "end" : "reset"
            },
         }
      )

      mobxSaiHandler(
         this.allNotificationsSai,
         allNotificationsSuccessHandler,
         (err) => allNotificationsErrorHandler(err, t)
      )
   }

   readAllNotificaitonsAction = async () => {
      if (!this.allNotificationsSai.data) return
      if (this.allNotificationsSai.data.totalUnread !== 0) await readAllNotifications()
      this.allNotificationsSai.data.totalUnread = 0
   }
}

export const notifyActionsStore = new NotifyActionsStore()

const getAllNotifications = async (params: GetAllNotificationsParams) => (await rust.get('/notify/list', { params })).data
const readAllNotifications = async () => rust.patch('/notify/read-all')
