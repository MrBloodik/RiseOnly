
import { getSettingsBtns } from '@shared/config/group-btns-data';
import { GroupedBtns } from '@shared/ui';
import { ProfileSettingsWrapper } from '@widgets/wrappers';
import { observer } from 'mobx-react-lite';

export const Settings = observer(() => {
	const settingsBtns = getSettingsBtns();

	return (
		<ProfileSettingsWrapper
			tKey='settings_page_title'
			height={40}
		>
			<GroupedBtns
				items={settingsBtns}
				leftFlex={0}
			/>
		</ProfileSettingsWrapper>
	);
});