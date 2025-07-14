import { navigate } from '@shared/lib/navigation'
import { LiveTimeAgo, MainText, UserLogo } from '@shared/ui'
import { notifyActionsStore, notifyInteractionsStore } from '@stores/notify'
import { Notify } from '@stores/notify/types'
import { themeStore } from '@stores/theme'
import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

export const Notification = observer((notify: Notify) => {
	const { currentTheme } = themeStore
	const { notificationUpdater } = notifyInteractionsStore

	const [isReaded, setIsReaded] = useState(notify?.is_read)

	const logosArray = notify?.actors?.map(actor => actor?.actor_avatar) || []

	const onNotifyPress = () => {
		navigate('PostDetail', { postId: notify?.id }, false)
		setIsReaded(p => !p && true)
		if (!notificationUpdater || !isReaded) return
		notificationUpdater(notify.id, 'is_read', false)
		if (!notifyActionsStore.allNotificationsSai.data) return
		notifyActionsStore.allNotificationsSai.data.totalUnread = notifyActionsStore.allNotificationsSai.data.totalUnread - 1
	}

	useEffect(() => {
		return () => { setIsReaded(false) }
	}, [])

	return (
		<TouchableOpacity
			style={s.container}
			onPress={onNotifyPress}
			activeOpacity={0.6}
		>
			<UserLogo
				source={logosArray}
				size={45}
			/>

			<View style={{ flex: 1 }}>
				<MainText
					numberOfLines={2}
					ellipsizeMode='tail'
				>
					{notify?.body || ''}
				</MainText>

				<LiveTimeAgo
					date={notify?.created_at || new Date().toISOString()}
					fontSize={13}
				/>
			</View>

			{!isReaded && (
				<View style={[s.notReadIndicator, { backgroundColor: currentTheme.originalMainGradientColor.color }]} />
			)}
		</TouchableOpacity>
	)
})

const s = StyleSheet.create({
	container: {
		display: 'flex',
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		paddingVertical: 7.5,
		paddingHorizontal: 10,
	},
	notReadIndicator: {
		marginLeft: 'auto',
		width: 7,
		height: 7,
		borderRadius: 1000,
	}
})
