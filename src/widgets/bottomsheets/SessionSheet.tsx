import { getSessionDevice } from '@shared/config/const'
import { getSessionInfoBtns } from '@shared/config/group-btns-data'
import { getSessionIcon } from '@shared/config/tsx'
import { formatSmartDate } from '@shared/lib/date'
import { BottomSheetUi, Box, GroupedBtns, MainText, SecondaryText, SimpleButtonUi } from '@shared/ui'
import { sessionActionsStore } from '@stores/session'
import { sessionInteractionsStore } from '@stores/session/session-interactions/session-interactions'
import { themeStore } from '@stores/theme'
import i18next from 'i18next'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { StyleSheet, useWindowDimensions, View } from 'react-native'

export const SessionSheet = observer(() => {
	const { currentTheme } = themeStore
	const { deleteSessionAction } = sessionActionsStore
	const {
		sessionSheet: { sessionSheet, setSessionSheet },
		sessionSheetOnCloseSignal: { sessionSheetOnCloseSignal, setSessionSheetOnCloseSignal },
		selectedSession: { selectedSession }
	} = sessionInteractionsStore

	const { width } = useWindowDimensions()
	const { t } = useTranslation()

	if (!sessionSheet) return <></>
	if (!selectedSession) {
		console.warn("[SessionSheet]: selectedSession is null")
		return <></>
	}

	const sessionInfoItems = getSessionInfoBtns(t, selectedSession)
	const deleteSessionHandler = () => deleteSessionAction()

	return (
		<>
			{sessionSheet && (
				<BottomSheetUi
					isBottomSheet={sessionSheet}
					setIsBottomSheet={setSessionSheet}
					onCloseSignal={sessionSheetOnCloseSignal}
					setOnCloseSignal={setSessionSheetOnCloseSignal}
					snap={["60%"]}
					footerStyle={{
						borderTopWidth: 0
					}}
					footer={(
						<Box style={s.bottom}>
							<SimpleButtonUi
								style={s.determinateBtn}
								onPress={deleteSessionHandler}
							>
								<MainText
									color={currentTheme.errorColor.color}
									width={"100%"}
									tac="center"
								>
									{i18next.t("determinate_session")}
								</MainText>
							</SimpleButtonUi>
						</Box>
					)}
				>
					<View
						style={{
							...s.main,
							width: width,
						}}
					>
						<View
							style={{
								gap: 20,
								alignItems: "center"
							}}
						>
							<Box
								align='center'
								width={"100%"}
								gap={2}
							>
								{getSessionIcon(selectedSession.device_info, 90)}
								<MainText
									px={22.5}
									tac='center'
									marginTop={4}
								>
									{getSessionDevice(selectedSession.device_info)}
								</MainText>

								<SecondaryText>
									{formatSmartDate(selectedSession.last_active, {
										useRelativeTime: true,
									})}
								</SecondaryText>
							</Box>

							<Box>
								<GroupedBtns
									items={sessionInfoItems}
									groupBg={currentTheme.btnsTheme.background as string}
									leftFlex={0}
								/>
							</Box>
						</View>
					</View>
				</BottomSheetUi>
			)}
		</>
	)
})

const s = StyleSheet.create({
	determinateBtn: {
		backgroundColor: themeStore.currentTheme.btnsTheme.background as string,
		paddingVertical: 10,
		borderRadius: 10,
		justifyContent: "center",
		width: "100%",
		alignItems: "center"
	},
	bottom: {
		paddingHorizontal: 10,
		paddingTop: 10,
		paddingBottom: 20
	},
	main: {
		paddingHorizontal: 10,
		paddingTop: 10,
		paddingBottom: 40,
	}
})