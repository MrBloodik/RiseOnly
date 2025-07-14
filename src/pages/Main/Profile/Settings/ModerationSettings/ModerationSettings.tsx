import { getModerationSettingsBtns } from '@shared/config/group-btns-data';
import { GroupedBtns } from '@shared/ui';
import { ProfileSettingsWrapper } from '@widgets/wrappers';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

export const ModerationSettings = observer(() => {
	const { t } = useTranslation();

	return (
		<ProfileSettingsWrapper
			tKey='settings_moderations_title'
			height={40}
		>
			<GroupedBtns
				items={getModerationSettingsBtns(t)}
				leftFlex={0}
			/>
		</ProfileSettingsWrapper>
	);
});
