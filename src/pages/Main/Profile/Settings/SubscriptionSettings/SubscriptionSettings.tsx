import { Box, MainText } from '@shared/ui';
import { ProfileSettingsWrapper } from '@widgets/wrappers';
import { observer } from 'mobx-react-lite';

export const SubscriptionSettings = observer(() => {
	return (
		<ProfileSettingsWrapper
			tKey='subscription_title'
			height={40}
		>
			<Box flex={1} height={"100%"}>
				<MainText>Subscription</MainText>
			</Box>
		</ProfileSettingsWrapper>
	);
});