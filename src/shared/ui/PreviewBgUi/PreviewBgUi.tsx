import { Post } from '@components/Posts/Post/Post';
import defaultPreviewImg from "@images/postImagePreview.png";
import { defaultLogo } from '@shared/config/const';
import { AuthorInfo } from '@shared/config/types';
import { GetPostFeedResponse } from '@stores/post/post-actions/types';
import { profileStore } from '@stores/profile';
import { themeStore } from '@stores/theme';
import { observer } from 'mobx-react-lite';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { DimensionValue, ScrollView, StyleSheet, useWindowDimensions, ViewStyle } from 'react-native';
import { Box } from '../BoxUi/Box';
import { CleverImage } from '../CleverImage/CleverImage';
import { SimpleButtonUi } from '../SimpleButtonUi/SimpleButtonUi';

interface PreviewBgUiProps {
	previewImg?: string;
	previewText?: string;
	paddingHorizontal?: number;
	outerPaddingHorizontal?: number;
	previewContentStyle?: ViewStyle;
	previewContainerStyle?: ViewStyle;
	previewHeight?: DimensionValue;
	scrollEnabled?: boolean;
	children?: ReactNode;
}

export const PreviewBgUi = observer(({
	previewImg,
	previewText = "",
	paddingHorizontal = 30,
	previewContentStyle = {},
	outerPaddingHorizontal = 0,
	previewContainerStyle = {},
	previewHeight = 250,
	scrollEnabled = true,
	children,
}: PreviewBgUiProps) => {
	const { currentTheme } = themeStore;
	const { profile } = profileStore;

	const { t } = useTranslation();
	const { width } = useWindowDimensions();

	const s = StyleSheet.create({
		previewContainer: {
			height: previewHeight,
			width: "100%",
			borderColor: currentTheme.bgTheme.borderColor,
			borderWidth: 1,
			overflow: "hidden",
			borderRadius: 20,
		},
		previewRight: {
			height: "100%",
			alignContent: "center",
		},
		textTop: {
			paddingVertical: 5
		},
		previewContent: {
			zIndex: 1,
			height: "100%",
			width: "100%",
			paddingHorizontal,
		},
		...constStyles
	});

	if (!profile) return <></>;

	return (
		<Box style={{ ...s.previewContainer, ...previewContainerStyle }}>
			<Box style={s.previewBg}>
				<CleverImage
					source={previewImg ? previewImg : defaultPreviewImg}
					intensity={10}
					wrapperStyles={{ borderRadius: 20 }}
				/>
			</Box>

			<Box>
				<Box
					style={{ ...s.previewContent, ...previewContentStyle }}
					fD='row'
					align='center'
					gap={10}
				>
					<ScrollView
						showsHorizontalScrollIndicator={false}
						showsVerticalScrollIndicator={false}
						scrollEnabled={scrollEnabled}
					>
						{children || (
							<SimpleButtonUi
								style={s.previewRight}
							>
								<Post
									post={{
										id: 77777777777777,
										author: { ...profile, more: (profile.more) as any } as AuthorInfo,
										authorId: profile.id,
										title: t("preview_post_title"),
										content: previewText,
										originalContent: previewText,
										createdAt: new Date().toISOString(),
										updatedAt: new Date().toISOString(),
										likesCount: 0,
										commentsCount: 0,
										favoritesCount: 0,
										images: [profile.more.logo || defaultLogo],
										tags: ["IT"],
										hashtags: ["hello", "every", "one"]
									} as GetPostFeedResponse}
									imageWidth={width - (paddingHorizontal * 2) - (outerPaddingHorizontal * 2)}
									isPreview
								/>
							</SimpleButtonUi>
						)}
					</ScrollView>
				</Box>
			</Box>
		</Box>
	);
});

var constStyles = StyleSheet.create({
	topLeftText: {
		alignItems: "center",
		justifyContent: "center",
		width: "50%",
	},
	topRightText: {
		alignItems: "center",
		justifyContent: "center",
		width: "50%",
	},
	previewBg: {
		height: "100%",
		width: "100%",
		zIndex: -1,
		position: "absolute"
	},
});