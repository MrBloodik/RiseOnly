import { rust } from '@shared/api/api'
import { makeAutoObservable } from 'mobx';
import { mobxSaiFetch, mobxSaiHandler, MobxSaiInstance } from 'mobx-toolbox'
import { ModerationRequestResponse, SendModerationReqBody } from './types'
import { moderationServiceStore, moderationStore } from '../';

class ModerationActionsStore {
   constructor() { makeAutoObservable(this) }

   // SEND MODERATION REQ

   sendModerationReqSai: MobxSaiInstance<SendModerationReqBody> = {}

   sendModerationReqAction = async () => {
      const { submitModerationForm: { values } } = moderationStore;

      const {
         sendModerationReqSuccessHandler,
         sendModerationReqErrorHandler
      } = moderationServiceStore

      const body: SendModerationReqBody = {
         reason: values.reason,
         phone: values.phone.replace(' ', ''),
         full_name: values.full_name,
         nationality: values.nationality,
         city: values.city,
      }

      this.sendModerationReqSai = mobxSaiFetch(sendModerationReq(body))

      mobxSaiHandler(
         this.sendModerationReqSai,
         sendModerationReqSuccessHandler,
         sendModerationReqErrorHandler
      )
   }

   // GET MY MODERATION REQUESTS

   myModerationReqSai: MobxSaiInstance<ModerationRequestResponse> = {}

   getMyModerationRequestAction = (needPending = true, req?: ModerationRequestResponse) => {
      const { getMyModerationRequestsSuccessHandler } = moderationServiceStore

      this.myModerationReqSai = mobxSaiFetch(
         () => getMyModerationRequests(),
         { needPending, id: 'getMyModerationRequestAction' }
      )

      if (req) {
         this.myModerationReqSai.data = req
         return
      }

      mobxSaiHandler(
         this.myModerationReqSai,
         getMyModerationRequestsSuccessHandler
      )
   }
}

export const moderationActionsStore = new ModerationActionsStore()

export const sendModerationReq = async (body: SendModerationReqBody) => (await rust.post('/report/moderator-request', body)).data
export const getMyModerationRequests = async () => (await rust.get<ModerationRequestResponse>('/report/my-moderator-request')).data