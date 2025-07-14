import { getSessionSettings } from '@shared/config/group-btns-data';
import { AsyncDataRender, Box, GroupedBtns } from '@shared/ui';
import { sessionActionsStore } from '@stores/session';
import { ProfileSettingsWrapper } from '@widgets/wrappers';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

export const SessionsSettings = observer(() => {
	const {
		sessions: {
			data,
			status
		},
		getSessionsAction
	} = sessionActionsStore;

	const { t } = useTranslation();
	const { height } = useWindowDimensions();

	useEffect(() => {
		getSessionsAction();
	}, []);

	return (
		<ProfileSettingsWrapper
			tKey='settings_sessions_title'
			height={40}
		>
			<View
				style={{ minHeight: height / 100 * 70 }}
			>
				<AsyncDataRender
					status={status}
					data={data?.list}
					messageHeightPercent={45}
					renderContent={() => {
						if (!data?.list) return;
						return (
							<ScrollView
								scrollEventThrottle={16}
								style={[
									s.scrollView,
								]}
							>
								<Box
									fD='column'
									gap={15}
								>
									<GroupedBtns
										items={getSessionSettings(data?.list, t)}
										groupGap={30}
									/>
								</Box>
							</ScrollView>
						);
					}}
				/>
			</View>
		</ProfileSettingsWrapper>
	);
});

const s = StyleSheet.create({
	scrollView: {
		flex: 1,
		height: "100%",
	}
});