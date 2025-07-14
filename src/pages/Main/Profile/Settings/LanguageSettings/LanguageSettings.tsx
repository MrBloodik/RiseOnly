import { getLanguageSettingsBtns } from '@shared/config/group-btns-data';
import { GroupedBtns } from '@shared/ui';
import { ProfileSettingsWrapper } from '@widgets/wrappers';
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export const LanguageSettings = observer(() => {
	const { t, i18n } = useTranslation();

	const items = useMemo(() => getLanguageSettingsBtns(t, i18n), [i18n.language, t]);

	return (
		<ProfileSettingsWrapper
			tKey='settings_language_title'
			height={40}
		>
			<GroupedBtns
				items={items}
			/>
		</ProfileSettingsWrapper>
	);
});