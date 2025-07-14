import { getProfileStatuses } from '@shared/config/tsx'
import { AuthorInfo } from '@shared/config/types'
import { MainText } from '@shared/ui'
import { User } from '@stores/profile/types'
import { observer } from 'mobx-react-lite'
import { StyleSheet, View } from 'react-native'
import { GetWho } from '../GetWho/GetWho'
import { PremiumIconUi } from '../PremiumIconUi/PremiumIconUi'

export const UserNameAndBadgeUi = observer(({
	user,
	px = 13,
	size = 17.5,
	primary = false,
	authorIcon = false,
	showPremIcon = true,
}: UserNameAndBadgeUiProps) => {
	const styles = StyleSheet.create({
		names: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: 5,
		},
		container: {
			flexDirection: 'row',
			alignItems: 'center',
		},
	})

	if (!user) {
		console.warn('User not provided in UserNameAndBadgeUi')
		return null
	}

	return (
		<View style={styles.container}>
			<View style={styles.names}>
				<MainText
					px={px}
					primary={primary}
				>
					{user.name}
				</MainText>
				<GetWho who={user.more.who} marginTop={2} />
				{getProfileStatuses("ts", size)}
				{showPremIcon && <PremiumIconUi isPremium={(user.more as any).isPremium} size={size} />}
			</View>
		</View>
	)
})

interface UserNameAndBadgeUiProps {
	authorIcon?: boolean
	user: AuthorInfo | User
	px?: number
	size?: number
	primary?: boolean
	showPremIcon?: boolean
}
