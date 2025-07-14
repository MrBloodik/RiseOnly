import { Modal, Portal } from 'react-native-paper'
import { MainText, SecondaryText } from '@shared/ui'
import { themeStore } from '@stores/theme'
import { moderationActionsStore, moderationStore } from '@stores/moderation'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'

export const ModerationReasonModal = observer(() => {
   const { t } = useTranslation()

   const { myModerationReqSai } = moderationActionsStore

	const {
		isModerationReasonModalOpen: {
			isModerationReasonModalOpen,
			setIsModerationReasonModalOpen
		}
	} = moderationStore

	return (
		<Portal>
			<Modal
				visible={isModerationReasonModalOpen}
				onDismiss={() => setIsModerationReasonModalOpen(false)}
				contentContainerStyle={{
					backgroundColor: themeStore.currentTheme.bgTheme.background as string,
					paddingLeft: 20,
					paddingRight: 20,
					paddingBottom: 18,
					paddingTop: 15,
					margin: 80,
					borderRadius: 10,
					flexDirection: 'column',
               alignItems: 'center',
					gap: 15,
				}}
         >
            <MainText>{t("moderation_request_reason_label")}</MainText>
            {myModerationReqSai.status === 'fulfilled' && (
               <SecondaryText>{myModerationReqSai.data?.reason}</SecondaryText>
            )}
			</Modal>
		</Portal>
	)
})
