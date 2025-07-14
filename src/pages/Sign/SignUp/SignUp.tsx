import signBg from "@images/signBg.png";
import { SendCodeModal } from '@modals';
import { getGenderContextMenuItems } from '@shared/config/context-menu-data';
import { navigate } from '@shared/lib/navigation';
import { heightNative, pxNative } from '@shared/lib/theme';
import { LoaderUi } from '@shared/ui/LoaderUi/LoaderUi';
import { authStore } from '@stores/auth';
import { authActionsStore } from '@stores/auth/auth-actions/auth-actions';
import { themeStore } from '@stores/theme';
import { BgWrapperUi, ButtonUi, ContextMenuUi, InputUi, MainText, PhoneInputUi, SecondaryText, SimpleButtonUi } from '@ui';
import { observer } from 'mobx-react-lite';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, StyleSheet, TouchableNativeFeedback, View } from 'react-native';

export const SignUp = observer(() => {
	const { currentTheme } = themeStore;
	const {
		sendCodeSai: { status },
		sendCodeAction
	} = authActionsStore;
	const {
		signUpForm: {
			values,
			errors,
			disabled,
			setValue
		},
		selectedGender: { selectedGender },
		callingCode: { setCallingCode, callingCode },
		isLinkingBot: { isLinkingBot },
		onSendCodePress
	} = authStore;

	const { t } = useTranslation();
	const genderBtnRef = useRef(null);
	const [isGenderOpen, setIsGenderOpen] = useState(false);

	const genderContextMenuItems = getGenderContextMenuItems();

	const onGenderContextMenuClose = () => setIsGenderOpen(false);
	const onGenderBtnPress = () => setIsGenderOpen(true);

	useEffect(() => {
		return () => setIsGenderOpen(false);
	}, []);

	return (
		<BgWrapperUi
			source={signBg}
			withOverlay={false}
		>
			<TouchableNativeFeedback onPress={() => Keyboard.dismiss()}>
				<View style={s.main}>
					<View style={s.container}>
						<SendCodeModal />

						<InputUi
							values={values}
							errors={errors}
							setValue={setValue}
							name='name'
							placeholder={t("name_placeholder")}
						/>

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
							setValue={setValue}
							placeholder={t("password_placeholder")}
							errors={errors}
							name='password'
						/>

						<InputUi
							values={values}
							errors={errors}
							setValue={setValue}
							name='repeatPassword'
							placeholder={t("repeat_password_placeholder")}
						/>

						<View
							style={[
								s.genderSelector,
								{
									backgroundColor: currentTheme.btnsTheme.background as string,
									borderWidth: currentTheme.inputTheme.borderWidth,
									borderColor: currentTheme.inputTheme.borderColor,
									height: heightNative(currentTheme.inputTheme.height),
									borderRadius: pxNative(currentTheme.inputTheme.borderRadius),
									paddingHorizontal: 10,
									elevation: 1,
									position: 'relative'
								}
							]}
						>
							<SecondaryText>{t("gender")}</SecondaryText>
							<SimpleButtonUi
								onPress={onGenderBtnPress}
								ref={genderBtnRef}
								style={{ zIndex: 10000 }}
							>
								<MainText color={selectedGender ? undefined : currentTheme.secondTextColor.color}>
									{t(selectedGender == 'Female' ? "contextMenu_female" : selectedGender == 'Male' ? "contextMenu_male" : "not_selected")}
								</MainText>
							</SimpleButtonUi>

							<ContextMenuUi
								anchorRef={genderBtnRef}
								isVisible={isGenderOpen}
								onClose={onGenderContextMenuClose}
								items={genderContextMenuItems}
								selected={selectedGender}
								position="bottom"
								offset={{ x: -10, y: 10 }}
							/>
						</View>

						<ButtonUi
							disabled={disabled || isLinkingBot || status === 'pending'}
							onPress={() => onSendCodePress(t)}
							bRad={10}
						>
							{status === 'pending' || isLinkingBot ? (
								<LoaderUi
									size={"small"}
									color={currentTheme.textColor.color}
								/>
							) : (
								<MainText>{t('signup')}</MainText>
							)}
						</ButtonUi>

						<View style={s.footer}>
							<MainText>{t('haveaccount')}</MainText>
							<MainText
								style={s.glow}
								onPress={() => navigate('SignIn')}
							>
								{t('signin')}
							</MainText>
						</View>
					</View>
				</View>
			</TouchableNativeFeedback>
		</BgWrapperUi>
	);
});

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
	},
	genderSelector: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: "space-between",
		gap: 10,
	},
	genderOptions: {
		flexDirection: 'row',
		gap: 5
	},
	genderBtn: {
		width: 100,
		alignItems: "center",
		justifyContent: "center"
	}
});