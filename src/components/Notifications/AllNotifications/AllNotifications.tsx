import { AsyncDataRender, RefreshControlUi } from '@shared/ui'
import { notifyActionsStore, notifyInteractionsStore } from '@stores/notify'
import { Notify } from '@stores/notify/types'
import { observer } from 'mobx-react-lite'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, View } from 'react-native'
import { Notification } from '../'

export const AllNotifications = observer(() => {
	const {
		scrollViewRef: { setScrollViewRef }
	} = notifyInteractionsStore
	const {
		allNotificationsSai: { data, status, options },
		getAllNotificationsAction
	} = notifyActionsStore

	const { t } = useTranslation()
	const scrollViewRef = useRef(null)

	const onRefresh = () => {
		try {
			getAllNotificationsAction('all', t, false, true, false)
		} catch (err) { console.log(err) }
	}

	useEffect(() => { setScrollViewRef(scrollViewRef) }, [scrollViewRef])

	const renderNotifications = (items: Notify[]) => {
		return (
			<FlatList
				ref={scrollViewRef}
				data={items}
				scrollEventThrottle={16}
				onScroll={options?.dataScope?.onScroll}
				refreshControl={<RefreshControlUi callback={onRefresh} />}
				refreshing={status == "pending"}
				renderItem={({ item }) => <Notification key={item.id} {...item} />}
			/>
		)
	}

	return (
		<View style={{ flex: 1 }}>
			<AsyncDataRender
				status={status}
				data={data?.items}
				renderContent={renderNotifications}
				messageHeightPercent={20}
				refreshControllCallback={() => {
					console.log("refreshControllCallback")
				}}
			/>
		</View>
	)
})
