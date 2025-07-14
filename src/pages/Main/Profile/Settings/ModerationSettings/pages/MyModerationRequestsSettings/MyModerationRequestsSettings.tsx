import { getMyModerationRequestSettings } from '@shared/config/group-btns-data'
import { AsyncDataRender, GroupedBtns } from '@shared/ui'
import { moderationActionsStore, moderationStore } from '@stores/moderation'
import { ModerationReasonModal } from '@widgets/modals/ModerationReasonModal'
import { ProfileSettingsWrapper } from "@widgets/wrappers"
import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import { View } from 'react-native'

export const MyModerationRequestsSettings = observer(() => {
	const { preloadMyModerationRequest } = moderationStore
	const { myModerationReqSai } = moderationActionsStore

	useEffect(() => { preloadMyModerationRequest() }, [])

	return (
		<ProfileSettingsWrapper
			tKey='settings_my_moderations_reqs_title'
			height={30}
		>
			<View>
				<ModerationReasonModal />

				<AsyncDataRender
					status={myModerationReqSai.status}
					data={myModerationReqSai.data}
					renderContent={(data) => (
						<GroupedBtns
							leftFlex={0}
							items={getMyModerationRequestSettings(data!)}
						/>
					)}
				/>
			</View>
		</ProfileSettingsWrapper>
	)
})
