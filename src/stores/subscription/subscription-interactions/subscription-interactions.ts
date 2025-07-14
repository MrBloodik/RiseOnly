import { makeAutoObservable } from 'mobx'
import { mobxState } from 'mobx-toolbox'

class SubscriptionInteractionsStore {
	constructor() { makeAutoObservable(this) }

	premiumModalOpen = mobxState(false)("premiumModalOpen")

}

export const subscriptionInteractionsStore = new SubscriptionInteractionsStore()