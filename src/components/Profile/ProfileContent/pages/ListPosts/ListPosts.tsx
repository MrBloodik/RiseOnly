import { MainText } from '@shared/ui'
import { profileStore } from '@stores/profile'
import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'

export const ListPosts = observer(() => {
	const {
		openedPage: { openedPage }
	} = profileStore

	useEffect(() => {
		if (openedPage !== 1) return
		console.log('ListPosts')
	}, [openedPage])

	return (
		<View style={styles.pageContainer}>
			<MainText px={20}>Страница 2</MainText>
			<MainText>Здесь может быть информация о пользователе</MainText>
		</View>
	)
})

const styles = StyleSheet.create({
	pageContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center'
	},
})