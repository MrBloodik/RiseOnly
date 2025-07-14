import { Box, MainText } from '@shared/ui';
import { themeActionsStore } from '@stores/theme/theme-actions/theme-aсtions';
import { ProfileSettingsWrapper } from '@widgets/wrappers';
import { observer } from "mobx-react-lite";

export const TextColorSettings = observer(() => {
	const { } = themeActionsStore;

	return (
		<ProfileSettingsWrapper
			tKey='settings_text_color'
			height={40}
		>
			<Box flex={1} height={"100%"}>
				<MainText>Your text color</MainText>
			</Box>
		</ProfileSettingsWrapper>
	);
});