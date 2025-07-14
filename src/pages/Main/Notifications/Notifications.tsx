import { AllNotifications, CommentNotifications } from '@components/Notifications'
import { useFocusEffect } from '@react-navigation/native'
import { getIconColor } from '@shared/config/const'
import { AnimatedTabs } from '@shared/ui'
import { TabConfig } from '@shared/ui/AnimatedTabs/AnimatedTabs'
import { notifyActionsStore, notifyInteractionsStore } from '@stores/notify'
import { ProfileSettingsWrapper } from '@widgets/wrappers'
import { observer } from 'mobx-react-lite'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, useWindowDimensions } from 'react-native'

export const Notifications = observer(() => {
   const { height } = useWindowDimensions()
   const { t } = useTranslation()

   const { readAllNotificaitonsAction } = notifyActionsStore

   const {
      activeTab: { activeTab, setActiveTab },
      scrollPosition: { scrollPosition, setScrollPosition },
      openedPage: { setOpenedPage },
   } = notifyInteractionsStore

   const tabs: TabConfig[] = [
      { content: AllNotifications, text: t('all_notify_title') },
      { content: CommentNotifications, text: t('comment_notify_title') },
   ]

   useFocusEffect(
      useCallback(() => {
         readAllNotificaitonsAction()
      }, [])
   )

   return (
      <ProfileSettingsWrapper
         wrapperStyle={s.container}
         tKey='settings_notify_title'
         height={30}
         needScrollView={false}
      >
         <AnimatedTabs
            tabs={tabs}
            bouncing={false}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            scrollPosition={scrollPosition}
            setScrollPosition={setScrollPosition}
            tabMaxHeight={height - 110}
            getIconColor={getIconColor}
            containerStyle={s.tabs}
            onSwap={i => setOpenedPage(i)}
         />
      </ProfileSettingsWrapper>
   )
})

const s = StyleSheet.create({
   tabs: { borderRadius: 0 },
   container: {
      paddingVertical: 0,
      paddingHorizontal: 0,
   },
})
