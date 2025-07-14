import { formatTimeDate } from '@shared/lib/date';
import { changeRgbA } from '@shared/lib/theme';
import { Box, MainText, SecondaryText, UserLogo } from '@shared/ui';
import { UserNameAndBadgeUi } from '@shared/ui/UserNameAndBadgeUi/UserNameAndBadgeUi';
import { themeStore } from '@stores/theme';
import { GetMessageMessage } from '@stores/ws/message/message-actions/types';
import { BlurView } from 'expo-blur';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { NativeSyntheticEvent, StyleProp, StyleSheet, TextLayoutEventData, ViewStyle } from 'react-native';

interface LeftMessageProps {
	message?: GetMessageMessage | null;
	style?: StyleProp<ViewStyle>;
	showAvatar?: boolean;
}

export const LeftMessage = observer(({
	message,
	style = {},
	showAvatar = true
}: LeftMessageProps) => {
	const { currentTheme } = themeStore;

	const [lineCount, setLineCount] = useState(0);

	const handleTextLayout = (e: NativeSyntheticEvent<TextLayoutEventData>) => setLineCount(e.nativeEvent.lines.length);

	if (!message) return <></>;

	return (
		<Box style={{
			...s.main,
			// @ts-ignore
			...(style || {})
		}}>
			<Box
				style={{
					...s.wrapper,
					...{ minHeight: 35 }
				}}
			>
				<Box
					style={s.left}
				>
					{showAvatar ? (
						<UserLogo
							source={message?.sender?.more?.logo}
							size={35}
						/>
					) : (
						<Box width={35} />
					)}
				</Box>

				<Box style={s.right}>
					<BlurView
						style={{
							...s.msg,
							...{
								backgroundColor: changeRgbA(currentTheme.bgTheme.background as string, "0.75")
							}
						}}
						intensity={20}
					>
						<UserNameAndBadgeUi
							user={message.sender as any}
							size={16}
						/>
						<MainText
							px={14.5}
							mR={lineCount === 1 ? 27 : 0}
							onTextLayout={handleTextLayout}
						>
							{message.content}
						</MainText>

						<Box style={s.msgInfo}>
							<SecondaryText px={9}>
								{formatTimeDate(new Date(message.created_at * 1000).toISOString())}
							</SecondaryText>
						</Box>
					</BlurView>
				</Box>
			</Box>
		</Box>
	);
});

const s = StyleSheet.create({
	msgInfo: {
		flexDirection: "row",
		gap: 3,
		alignItems: "center",
		position: "absolute",
		bottom: 5,
		right: 8
	},
	msg: {
		paddingVertical: 6,
		paddingHorizontal: 10,
		maxWidth: 280,
		position: "relative",
		gap: 1
	},
	right: {
		justifyContent: "flex-end",
		borderTopRightRadius: 15,
		borderTopLeftRadius: 15,
		borderBottomRightRadius: 15,
		overflow: "hidden"
	},
	left: {
		justifyContent: "flex-end",
	},
	wrapper: {
		flexDirection: "row",
		alignItems: "flex-end",
		gap: 5
	},
	main: {
	}
});