import { getPrivacySettingsStatuses } from '@shared/config/group-btns-data';
import { GroupedBtns } from '@shared/ui';
import { profileStore } from '@stores/profile';
import { ProfileSettingsWrapper } from '@widgets/wrappers';
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export const PrivacySetting = observer(() => {
	const {
		selectedPrivacy: { selectedPrivacy }
	} = profileStore;

	if (!selectedPrivacy) return null;

	const { t } = useTranslation();

	const items = useMemo(() => {
		return getPrivacySettingsStatuses(selectedPrivacy.actionKey, "default", t);
	}, [t, selectedPrivacy]);

	return (
		<ProfileSettingsWrapper
			tKey={selectedPrivacy.text}
			height={40}
		>
			<GroupedBtns
				items={items || []}
			/>
		</ProfileSettingsWrapper>
	);
});