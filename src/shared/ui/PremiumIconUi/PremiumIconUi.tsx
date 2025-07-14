import diamondJson from "@animations/diamond.json"
import { getPremiumContextMenuItems } from '@shared/config/context-menu-data'
import { profileStore } from '@stores/profile'
import { Profile } from '@stores/profile/types'
import { subscriptionInteractionsStore } from '@stores/subscription'
import LottieView from 'lottie-react-native'
import { observer } from 'mobx-react-lite'
import { useRef, useState } from 'react'
import { View } from 'react-native'
import { ContextMenuUi } from '../ContextMenuUi/ContextMenuUi'
import { SimpleButtonUi } from '../SimpleButtonUi/SimpleButtonUi'

export const PremiumIconUi = observer(({
	size = 20,
	profileToShow,
	isPremium = false,
	isButton = true
}: PremiumIconUiProps) => {
	const { profile } = profileStore
	const { premiumModalOpen: { setPremiumModalOpen } } = subscriptionInteractionsStore

	const [premiumContextMenuOpen, setPremiumContextMenuOpen] = useState(false)
	const premBtnRef = useRef(null)

	const onPremiumIconPress = () => {
		if (!profile) {
			console.warn("[onPremiumIconPress]: User doesn't exists")
			return
		}

		// TODO: Раскомментировать при проде, а все строчки кода ниже наоборот удалить
		// if (profile.isPremium) {
		// 	setPremiumContextMenuOpen(true)
		// 	return
		// }

		// setPremiumModalOpen(true)

		setPremiumContextMenuOpen(true)
	}

	// TODO: Убрать при проде
	// if (!isPremium) {
	// 	return null
	// }

	const style = {
		width: size,
		height: size
	}

	if (!isButton) return (
		<View style={style}>
			<LottieView
				source={diamondJson}
				autoPlay
				loop
				speed={0.5}
				style={{ width: size, height: size }}
			/>
		</View>
	)

	return (
		<>
			<SimpleButtonUi
				style={style}
				onPress={onPremiumIconPress}
				ref={premBtnRef}
			>
				<LottieView
					source={diamondJson}
					autoPlay
					loop
					speed={0.5}
					style={{ width: size, height: size }}
				/>
			</SimpleButtonUi>

			<ContextMenuUi
				items={getPremiumContextMenuItems(setPremiumContextMenuOpen, profileToShow || profile!)}
				isVisible={premiumContextMenuOpen}
				onClose={() => setPremiumContextMenuOpen(false)}
				anchorRef={premBtnRef}
				offset={{ x: 0, y: 5 }}
			/>
		</>
	)
})

interface PremiumIconUiProps {
	profileToShow?: Profile
	size?: number
	isPremium: boolean
	isButton?: boolean
}