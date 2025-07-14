import { AsyncDataRender } from '@shared/ui/AsyncDataRender/AsyncDataRender'
import { commentActionsStore, commentInteractionsStore } from '@stores/comment'
import { GetCommentsResponse } from '@stores/comment/comment-actions/types'
import { postInteractionsStore } from '@stores/post'
import { observer } from 'mobx-react-lite'
import { Fragment, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, StyleSheet, View } from 'react-native'
import { Comment } from './Coment'

const postExample = {
	"id": 247,
	"title": "Всем привет, чем длиннее title, тем меньше размер текста! Это позволяет помещать title любых размеров. Но если title очень много и он не помещается то мы просто ставим ...",
	"content": "safjaskfsafjsafjsakjfsafasasf[as]f[safa'/cas[psapasf]",
	"originalContent": "asdlaskdjkasld",
	"hashtags": [
		"recs",
		"fyp",
		"asd",
		"asd",
		"asd",
		"asd",
		"asd",
		"asd",
		"asd",
		"asd",
		"asd",
		"asd",
		"asd"
	],
	"tags": [
		"Айти",
		"Мемы"
	],
	"viewsCount": 0,
	"images": [
		"https://media.tenor.com/1qttzrURIgwAAAAM/rin-itoshi-rin.gif",
		"https://media.tenor.com/1qttzrURIgwAAAAM/rin-itoshi-rin.gif",
		"https://media.tenor.com/1qttzrURIgwAAAAM/rin-itoshi-rin.gif",
		"https://riseonly-bucket.s3.eu-central-1.amazonaws.com/1ba61733-82bd-4c54-816c-2ce6913f035b-Снимок экрана 2025-03-30 в 05.39.03.png",
		"https://riseonly-bucket.s3.eu-central-1.amazonaws.com/1ba61733-82bd-4c54-816c-2ce6913f035b-Снимок экрана 2025-03-30 в 05.39.03.png",
		"https://riseonly-bucket.s3.eu-central-1.amazonaws.com/1ba61733-82bd-4c54-816c-2ce6913f035b-Снимок экрана 2025-03-30 в 05.39.03.png"
	],
	"createdAt": "2025-04-19T17:57:35.356012Z",
	"updatedAt": "2025-04-19T17:57:35.384747Z",
	"authorId": "367bf13a-6814-4c24-8dfa-0058f7b388a0",
	"mainCommentsCount": 0,
	"canComment": true,
	"likesCount": 0,
	"favoritesCount": 0,
	"isLiked": false,
	"isFavorited": false,
	"commentsCount": 0,
	"author": {
		"name": "nics51asd",
		"tag": "yaynics",
		"more": {
			"p_lang": [],
			"who": "",
			"role": "USER",
			"logo": "",
			"isPremium": false
		}
	}
}

export const Comments = observer(() => {
	const { selectedPost, setSelectedPost } = postInteractionsStore
	const {
		comments: {
			data,
			status,
			options
		},
		getCommentsAction
	} = commentActionsStore
	const {
		commentScrollRef: { setCommentScrollRef },
		getCachedCommentsData
	} = commentInteractionsStore

	const { t } = useTranslation()
	const scrollViewRef = useRef(null)

	useEffect(() => {
		if (!selectedPost?.cachedComments) getCommentsAction(selectedPost?.selectedCommentSort || "feed", false)
		return () => { setSelectedPost(null) }
	}, [])

	useEffect(() => {
		setCommentScrollRef(scrollViewRef)
	}, [scrollViewRef])

	const renderCommentsList = (commentsData: GetCommentsResponse[]) => {
		return (
			<View style={styles.listContainer}>
				<FlatList
					ref={scrollViewRef}
					contentContainerStyle={styles.listContent}
					onScroll={options?.dataScope?.onScroll}
					bounces={false}
					scrollEventThrottle={16}
					keyboardDismissMode="on-drag"
					data={commentsData}
					renderItem={({ item }) => {
						if (!item || !item.id) {
							console.log('Некорректный элемент комментария:', item)
							return null
						}

						if (item.userLikedStatic == undefined) item.userLikedStatic = item.userLiked
						if (item.userDislikedStatic == undefined) item.userDislikedStatic = item.userDisliked

						return (
							<Fragment key={item.id}>
								<Comment
									comment={item}
									mode='comments'
								/>
								{item?.previewReplyComment && (
									<Comment
										comment={item.previewReplyComment}
										mode='comments'
										type='comments'
									/>
								)}
							</Fragment>
						)
					}}
				/>
			</View>
		)
	}

	return (
		<View style={styles.container}>
			<AsyncDataRender
				status={status}
				data={getCachedCommentsData()?.items || data?.items}
				noDataText={t('no_comments')}
				renderContent={renderCommentsList}
				emptyScrollViewStyle={{ flex: 0 }}
				isEmptyScrollView={false}
				noDataHeightPercent={1}
			/>
		</View>
	)
})

const styles = StyleSheet.create({
	container: {
		width: '100%',
	},
	listContainer: {
		height: "95%"
	},
	listContent: {
		flexGrow: 1,
	},
})