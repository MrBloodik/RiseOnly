import { MediaItem } from '@shared/ui/MediaPickerUi/MediaPickerUi'
import { makeAutoObservable } from 'mobx'
import { mobxState } from 'mobx-toolbox'

class MediaInteractionsStore {
	constructor() { makeAutoObservable(this) }

	mediaOpen = mobxState(false)("mediaOpen")

	mediaResult = mobxState<MediaItem[]>([])("mediaResult")

	onFinishFunction: (() => void) = () => { }
	setOnFinishFunction = (newFunc: () => void) => this.onFinishFunction = newFunc

}

export const mediaInteractionsStore = new MediaInteractionsStore()