import { GoalsIcon } from '@icons/MainPage/Profile/GoalsIcon';
import { GridPostsIcon } from '@icons/MainPage/Profile/GridPostsIcon';
import { getIconColor } from '@shared/config/const';
import { profileStore } from '@stores/profile';
import { AnimatedTabs, TabConfig } from '@ui/AnimatedTabs/AnimatedTabs';
import { observer } from 'mobx-react-lite';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GridPosts, Plans } from './pages';

export const ProfileContent = observer(() => {
	const {
		profileTab: { profileTab, setProfileTab },
		openedPage: { openedPage, setOpenedPage },
		scrollPosition,
		userToShow,
		setScrollPosition,
		handleSwap
	} = profileStore;

	useEffect(() => {
		if (openedPage !== profileTab) {
			setProfileTab(openedPage);
		}
	}, []);

	const tabs: TabConfig[] = [
		{ icon: GridPostsIcon, content: GridPosts },
		// { icon: PostIcon, content: ListPosts },
		{ icon: GoalsIcon, content: Plans }
	];

	if (!userToShow) return <></>;

	return (
		<AnimatedTabs
			tabs={tabs}
			activeTab={profileTab}
			setActiveTab={setProfileTab}
			scrollPosition={scrollPosition}
			setScrollPosition={setScrollPosition}
			getIconColor={getIconColor}
			containerStyle={styles.container}
			onSwap={handleSwap}
		/>
	);
});

const styles = StyleSheet.create({
	container: {
		marginTop: 0,
		flex: 1,
	}
});