import {
	CommonActions,
	NavigationContainerRef,
	StackActions
} from '@react-navigation/native'
import { createRef } from 'react'

export const navigationRef = createRef<NavigationContainerRef<any>>()

export function navigate(name: string, params?: object, needChecks = true) {
	if (navigationRef.current) {
		if (needChecks) {
			if (typeof name === 'string' && name.includes('/')) {
				const parts = name.split('/')
				if (parts[1] === 'main') {
					if (parts.length > 2) {
						const screenName = parts[2].charAt(0).toUpperCase() + parts[2].slice(1)

						let finalScreenName = screenName

						if (screenName === 'About-us') finalScreenName = 'AboutUs'
						if (screenName === 'Profile' && parts.length > 3) {
							navigationRef.current.navigate('MainStack', {
								screen: 'MainTabs',
								params: {
									screen: 'Profile',
									params: { id: parts[3], ...params }
								}
							})
							return
						}
						if (screenName === 'Chats') {
							navigationRef.current.navigate('MainStack', {
								screen: 'MainTabs',
								params: {
									screen: 'Chats'
								}
							})
							return
						}

						try {
							navigationRef.current.navigate('MainStack', {
								screen: 'MainTabs',
								params: {
									screen: finalScreenName,
									params
								}
							})
						} catch (error) {
							console.warn(`Экран ${finalScreenName} не найден, переходим на Posts`)
							navigationRef.current.navigate('MainStack', {
								screen: 'MainTabs',
								params: {
									screen: 'Posts'
								}
							})
						}
						return
					}
					navigationRef.current.navigate('MainStack')
					return
				}
				else if (parts[1] === 'sign') {
					const screenName = parts[2] === 'up' ? 'SignUp' : 'SignIn'
					navigationRef.current.navigate('SignStack', {
						screen: screenName,
						params
					})
					return
				}
			}
		}

		if (params) {
			navigationRef.current.navigate(name, params)
			return
		}
		navigationRef.current.navigate(name)
	} else {
		console.warn('Навигация не инициализирована')
	}
}

export function navigateBack(count: number = 1) {
	if (navigationRef.current) {
		navigationRef.current.dispatch(state => {
			const steps = Math.max(1, count)
			const routes = state.routes

			const newIndex = Math.max(0, state.index - steps)

			return CommonActions.reset({
				...state,
				routes,
				index: newIndex,
			})
		})
	} else {
		console.warn('Навигация не инициализирована')
	}
}

export function goBack() {
	if (navigationRef.current) {
		navigationRef.current.goBack()
	} else {
		console.warn('Навигация не инициализирована')
	}
}

export function replace(name: string, params?: object) {
	if (navigationRef.current) {
		navigationRef.current.dispatch(StackActions.replace(name, params))
	} else {
		console.warn('Навигация не инициализирована')
	}
}

export function reset(name: string, params?: object) {
	if (navigationRef.current) {
		navigationRef.current.dispatch(
			CommonActions.reset({
				index: 0,
				routes: [{ name, params }],
			})
		)
	} else {
		console.warn('Навигация не инициализирована')
	}
}

export function getCurrentRoute() {
	if (navigationRef.current) {
		return navigationRef.current.getCurrentRoute()
	}
	return null
}

export function getRouteParams() {
	const currentRoute = getCurrentRoute()
	if (!currentRoute) return {}

	return currentRoute.params || {}
}

export function getProfileId() {
	const params = getRouteParams() as { id?: string }
	return params.id || null
}
