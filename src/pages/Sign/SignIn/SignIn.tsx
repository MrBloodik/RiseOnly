import { SignStackParamList } from '@app/router/AppNavigator'
import signBg from "@images/signBg.png"
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { LoaderUi } from '@shared/ui/LoaderUi/LoaderUi'
import { authActionsStore, authStore } from '@stores/auth'
import { themeStore } from '@stores/theme'
import { BgWrapperUi, ButtonUi, InputUi, MainText, PhoneInputUi } from '@ui'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Keyboard, StyleSheet, TouchableNativeFeedback, View } from 'react-native'

export const SignIn = observer(() => {
	const { currentTheme } = themeStore
	const {
		signInForm: {
			values,
			errors,
			setValue,
			disabled
		},
		callingCode: { setCallingCode }
	} = authStore
	const {
		loginSai: {
			status,
		},
		loginAction
	} = authActionsStore

	const { t } = useTranslation()
	const navigation = useNavigation<StackNavigationProp<SignStackParamList>>()

	return (
		<BgWrapperUi
			source={signBg}
			withOverlay={false}
		>
			<TouchableNativeFeedback onPress={() => Keyboard.dismiss()}>
				<View style={s.main}>
					<View style={s.container}>
						<PhoneInputUi
							values={values}
							setValue={setValue}
							setCallingCode={setCallingCode}
							errors={errors}
							placeholder={t("phone_number_placeholder")}
							name='number'
						/>

						<InputUi
							values={values}
							errors={errors}
							setValue={setValue}
							name='password'
							placeholder={t("password_placeholder")}
						/>

						<ButtonUi
							disabled={disabled}
							onPress={loginAction}
							bRad={10}
						>
							{status == "pending" ? (
								<LoaderUi
									size={"small"}
									color={currentTheme.textColor.color}
								/>
							) : (
								<MainText>{t('signin')}</MainText>
							)}
						</ButtonUi>

						<View style={s.footer}>
							<MainText>{t('noaccount')}</MainText>
							<MainText
								style={s.glow}
								onPress={() => navigation.navigate('SignUp')}
							>
								{t('signup')}
							</MainText>
						</View>
					</View>
				</View>
			</TouchableNativeFeedback>
		</BgWrapperUi>
	)
})

export const s = StyleSheet.create({
	container: {
		flexDirection: 'column',
		width: 325,
		gap: 14,
	},
	main: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 14
	},
	footer: {
		display: 'flex',
		flexDirection: 'row',
		gap: 5
	},
	glow: {
		fontWeight: 600
	}
})