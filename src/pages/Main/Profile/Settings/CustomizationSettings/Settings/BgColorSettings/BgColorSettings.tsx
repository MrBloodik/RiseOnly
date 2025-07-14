import { CustomizationPreviewContent } from '@shared/config/tsx';
import { Box, ButtonUi, MainText, SimpleButtonUi } from '@shared/ui';
import { themeStore } from '@stores/theme';
import { ProfileSettingsWrapper } from '@widgets/wrappers';
import { observer } from "mobx-react-lite";
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

export const BgColorSettings = observer(() => {
	const {
		colorBottomSheet: { setColorBottomSheet },
		currentTheme,
		changeToDefault
	} = themeStore;

	const { t } = useTranslation();

	return (
		<ProfileSettingsWrapper
			tKey='settings_bg_color'
			height={40}
		>
			<Box
				flex={1}
				height={"100%"}
				gap={15}
			>
				<Box>
					<CustomizationPreviewContent t={t} s={s} />
				</Box>

				<Box
					gap={5}
					fD='row'
				>
					<SimpleButtonUi
						style={s.btn}
						height={35}
						bRad={10}
						bgColor={currentTheme.btnsTheme.background as string}
						onPress={() => changeToDefault()}
					>
						<MainText>
							{t('return_text')}
						</MainText>
					</SimpleButtonUi>

					<ButtonUi
						onPress={() => setColorBottomSheet(true)}
						height={35}
						bRad={10}
						style={{ ...s.btn }}
					>
						<MainText>
							{t('edit_text')}
						</MainText>
					</ButtonUi>
				</Box>
			</Box>
		</ProfileSettingsWrapper>
	);
});

const s = StyleSheet.create({
	btn: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center"
	}
});