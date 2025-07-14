import { MainText } from '@shared/ui'
import { GetSessionsResponse } from '@stores/session/session-actions/types'
import { StyleSheet } from 'react-native'
import { View } from 'tamagui'

interface SessionProps {
	session: GetSessionsResponse
}

export const Session = ({
	session
}: SessionProps) => {
	return (
		<View>
			<MainText>
				{session.device_info}
			</MainText>
		</View>
	)
}

const s = StyleSheet.create({

})