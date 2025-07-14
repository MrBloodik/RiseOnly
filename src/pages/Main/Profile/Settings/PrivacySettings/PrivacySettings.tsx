import { getPrivacySettingsBtns } from '@shared/config/group-btns-data';
import { AsyncDataRender, GroupedBtns } from '@shared/ui';
import { profileStore } from '@stores/profile';
import { profileActionsStore } from '@stores/profile/profile-actions/profile-actions';
import { ProfileSettingsWrapper } from '@widgets/wrappers';
import { observer } from 'mobx-react-lite';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { StyleSheet } from 'react-native';

export const PrivacySettings = observer(() => {
	const {
		privacy: { status, data },
		getPrivacyAction,
	} = profileActionsStore;
	const { privacySettingsItems: { privacySettingsItems } } = profileStore;

	const { t } = useTranslation();

	let items = useMemo(() => {
		if (!data) return;
		return getPrivacySettingsBtns(data, t);
	}, [t, data, privacySettingsItems]);

	useEffect(() => {
		getPrivacyAction();
	}, []);

	return (
		<ProfileSettingsWrapper
			tKey='settings_privacy_title'
			height={40}
		>
			<AsyncDataRender
				data={data}
				status={status || (!items ? "pending" : "fulfilled")}
				renderContent={() => (
					<GroupedBtns
						items={items!}
						leftFlex={0}
					/>
				)}
			/>
		</ProfileSettingsWrapper>
	);
});

const s = StyleSheet.create({
});