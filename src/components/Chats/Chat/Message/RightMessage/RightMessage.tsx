import { UnreadedIcon } from '@icons/MainPage/Chats/UnreadedIcon';
import { WatchIcon } from '@icons/MainPage/Chats/WatchIcon';
import { formatTimeDate } from '@shared/lib/date';
import { parseLinearGradient } from '@shared/lib/theme';
import { Box, MainText, SecondaryText } from '@shared/ui';
import { themeStore } from '@stores/theme';
import { GetMessageMessage } from '@stores/ws/message/message-actions/types';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { GestureResponderEvent, NativeSyntheticEvent, StyleProp, StyleSheet, TextLayoutEventData, TouchableOpacity, ViewStyle } from 'react-native';

interface LeftMessageProps {
	message?: GetMessageMessage | null;
	style?: StyleProp<ViewStyle>;
	showAvatar?: boolean;
	onLongPress: (e: GestureResponderEvent) => void;
	onPressIn: (isSender: boolean) => void;
}

export const RightMessage = observer(({
	message,
	style = {},
	showAvatar = true,
	onLongPress,
	onPressIn
}: LeftMessageProps) => {
	const { currentTheme } = themeStore;

	const [isSelected, setIsSelected] = useState(false);
	const [lineCount, setLineCount] = useState(0);
	const [isFinished, setIsFinished] = useState(false);

	const handleTextLayout = (e: NativeSyntheticEvent<TextLayoutEventData>) => {
		if (isFinished) return;
		setLineCount(e.nativeEvent.lines.length);
		setIsFinished(true);
	};

	return (
		<Box
			style={{
				...s.main,
				...{ opacity: message?.isTemp ? 0.7 : 1 },
				// @ts-ignore
				...(style || {}),
				...(isSelected && {
					opacity: 0,
				})
			}}
		>
			<Box
				style={{
					...s.wrapper
				}}
			>
				<TouchableOpacity
					style={s.right}
					onLongPress={(e) => {
						onLongPress(e);
					}}
					onPressIn={() => {
						onPressIn(true);
					}}
				>
					<LinearGradient
						colors={(parseLinearGradient(currentTheme.mainGradientColor.background as string, "0.6") as any)}
						start={{ x: 0, y: 0 }}
						end={{ x: 1, y: 0 }}
						style={{
							...s.msg,
							...{
								borderTopRightRadius: 15,
								borderTopLeftRadius: 15,
								borderBottomLeftRadius: 15,
								overflow: "hidden"
							}
						}}
					>
						<BlurView
							style={{
								backgroundColor: "transparent", paddingVertical: 6,
								paddingHorizontal: 10,
							}}
							intensity={10}
						>
							<MainText
								px={14.5}
								mR={lineCount === 1 ? 36 : 0}
								onTextLayout={handleTextLayout}
							>
								123 {message?.content}
							</MainText>

							<Box style={s.msgInfo}>
								{message && (
									<SecondaryText px={8.5}>
										{formatTimeDate(new Date(message.created_at * 1000).toISOString())}
									</SecondaryText>
								)}

								{message?.isTemp ? (
									<WatchIcon size={8} color={currentTheme.secondTextColor.color} />
								) : (
									<UnreadedIcon size={8} color={currentTheme.textColor.color} />
								)}
							</Box>
						</BlurView>
					</LinearGradient>
				</TouchableOpacity>
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
		right: 8,
	},
	msg: {
		maxWidth: 280,
		position: "relative",
		gap: 1,
	},
	right: {
		justifyContent: "flex-end",
	},
	left: {
		justifyContent: "flex-end",
	},
	wrapper: {
		flexDirection: "row",
		alignItems: "flex-end",
		gap: 5,
	},
	main: {
		alignItems: "flex-end",
		paddingRight: 5,
	}
});