import { Box, ButtonUi, MainText, PhoneInputUi, SimpleInputUi } from '@shared/ui'
import { LoaderUi } from '@shared/ui/LoaderUi/LoaderUi'
import { moderationActionsStore, moderationStore } from '@stores/moderation'
import { themeStore } from '@stores/theme'
import { ProfileSettingsWrapper } from '@widgets/wrappers'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'

export const BeModeratorSettings = observer(() => {
	const { t } = useTranslation()

	const {
		submitModerationForm: { values, setValue, errors, disabled },
		callingCode: { setCallingCode }
	} = moderationStore

	const {
		sendModerationReqAction,
		sendModerationReqSai
	} = moderationActionsStore

	return (
		<ProfileSettingsWrapper
			tKey='settings_moderations_req_title'
			height={30}
		>
			{/* MODERATION FORM */}
			<Box fD='column' gap={12.5}>
				<SimpleInputUi
					groupContainer
					title={t('fn_title')}
					error={errors.full_nameErr}
					style={s.input}
					maxLength={100}
					setValue={setValue}
					value={values.full_name}
					name={'full_name'}
					placeholder={t('fn_placeholder')}
				/>

				<PhoneInputUi
					paddingTop={0}
					errors={errors}
					values={values}
					name={'phone'}
					setCallingCode={setCallingCode}
					setValue={setValue}
					style={s.phoneInput}
					title={t('number_title')}
					placeholder={'(942)-223-23'}
				/>

				<SimpleInputUi
					groupContainer
					title={t('nationality_title')}
					error={errors.nationalityErr}
					style={s.input}
					maxLength={50}
					setValue={setValue}
					value={values.nationality}
					name={'nationality'}
					placeholder={t('nationality_placeholder')}
				/>

				<SimpleInputUi
					groupContainer
					title={t('city_title')}
					error={errors.cityErr}
					style={s.input}
					maxLength={32}
					setValue={setValue}
					value={values.city}
					name={'city'}
					placeholder={t('city_placeholder')}
				/>

				<SimpleInputUi
					groupContainer
					error={errors.reasonErr}
					title={t('reason_title')}
					style={s.input}
					maxLength={1000}
					setValue={setValue}
					value={values.reason}
					name={'reason'}
					placeholder={t('reason_placeholder')}
				/>

				<ButtonUi
					height={40}
					bRad={12}
					style={s.sbtn}
					attempts={5}
					timeoutInMins={3}
					disabled={sendModerationReqSai.isPending || disabled}
					onPress={sendModerationReqAction}
				>
					{sendModerationReqSai.status === 'pending' ? (
						<LoaderUi size="small" color="#fff" />
					) : (
						<MainText>{t('submit_moderation_form_button')}</MainText>
					)}
				</ButtonUi>
			</Box>
		</ProfileSettingsWrapper>
	)
})

const s = StyleSheet.create({
	sbtn: { marginTop: 7.5 },
	input: {
		minWidth: '100%',
		minHeight: 25,
		color: themeStore.currentTheme.textColor.color,
	},
	phoneInput: {
		backgroundColor: themeStore.currentTheme.bgTheme.background as string,
		borderColor: 'transparent',
		maxHeight: 40,
		color: themeStore.currentTheme.textColor.color,
	}
})