import { EditIcon } from '@icons/Ui/EditIcon'
import { Box, MainText, SimpleButtonUi } from '@shared/ui'
import { profileStore } from '@stores/profile'
import { themeStore } from '@stores/theme'
import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'

export const Plans = observer(() => {
	const { currentTheme } = themeStore
	const {
		openedPage: { openedPage },
		profile
	} = profileStore

	const { t } = useTranslation()

	useEffect(() => {
		if (openedPage !== 2) return
	}, [openedPage])

	return (
		<View style={styles.pageContainer}>
			<Box
				padding={10}
				display='flex'
				align='center'
				fD='row'
				gap={10}
			>
				<MainText px={18}>{t('profile_plans_title')}</MainText>

				<SimpleButtonUi
					centered
				>
					<EditIcon />
				</SimpleButtonUi>
			</Box>

			<Box style={styles.planWrapper}>
				{profile?.more?.plans?.map((plan, index) => (
					<Box
						key={index}
						padding={10}
						style={styles.planContainer}
					>
						<View
							style={styles.planLeft}
						>
							<MainText px={20}>{index + 1}</MainText>
						</View>
						<View style={styles.planRight}>
							<MainText marginTop={5}>
								{plan}
							</MainText>
						</View>
					</Box>
				))}
			</Box>
		</View>
	)
})

const styles = StyleSheet.create({
	planWrapper: {

	},
	pageContainer: {
		flex: 1
	},
	planContainer: {
		flexDirection: 'row',
		gap: 10
	},
	planLeft: {
		backgroundColor: themeStore.currentTheme.btnsTheme.background as string,
		width: 30,
		height: 30,
		borderRadius: 5,
		justifyContent: 'center',
		alignItems: 'center'
	},
	planRight: {
	}
})