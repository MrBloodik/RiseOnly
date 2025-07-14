import { MainStackParamList } from '@app/router/AppNavigator';
import { ProfileContent, ProfileTop } from '@components/Profile';
import { RouteProp, useFocusEffect, useRoute } from '@react-navigation/native';
import { AsyncDataRender, BgWrapperUi } from '@shared/ui';
import { profileStore } from '@stores/profile';
import { profileActionsStore } from '@stores/profile/profile-actions/profile-actions';
import { themeStore } from '@stores/theme';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useRef } from 'react';
import { Animated as AnimatedRn, StyleSheet, View } from 'react-native';
import Animated, { Extrapolate, interpolate, runOnJS, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ProfileProps { isUser?: boolean; }

export const Profile = observer(({
  isUser
}: ProfileProps) => {
  const { mainBottomNavigationHeight } = themeStore;
  const {
    myProfile: {
      data,
      status,
      options
    },
    getMyProfile,
    getUserAction
  } = profileActionsStore;
  const {
    refreshing: { refreshing },
    profile,
    onRefresh,
    handleScroll,
  } = profileStore;

  const tag = (useRoute<RouteProp<MainStackParamList, 'UserPage'>>().params.tag) || profile?.tag || "";
  const progress = useRef(new AnimatedRn.Value(0)).current;
  const insets = useSafeAreaInsets();

  const handleLocalScroll = (event: any) => {
    if (event.contentOffset.y < 0) {
      const MAX_PULL_DISTANCE = 100;
      const progressValue = Math.min(Math.abs(event.contentOffset.y) / MAX_PULL_DISTANCE, 1);
      progress.setValue(progressValue);
    } else {
      progress.setValue(0);
    }
  };

  useFocusEffect(
    useCallback(() => {
      getMyProfile(true, tag, (isUser || false));
    }, [tag, isUser])
  );

  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      runOnJS(handleLocalScroll)(event);
      if (event.contentOffset.y <= -60) runOnJS(onRefresh)(tag, isUser || false);
      if (handleScroll) runOnJS(handleScroll)(event, progress);
    }
  });

  const animatedBannerStyle = useAnimatedStyle(() => {
    if (!scrollY) return {};
    const pullDistance = Math.min(scrollY.value, 0);
    const baseHeight = 180;
    const additionalHeight = interpolate(
      pullDistance,
      [-200, 1, 1],
      [200, 1, 1],
      Extrapolate.CLAMP
    );
    const scaleValue = interpolate(
      pullDistance,
      [-150, -0.1, 0],
      [2, 1.2, 1.2],
      Extrapolate.CLAMP
    );

    return {
      width: "100%",
      height: baseHeight + additionalHeight,
      transform: [
        { translateY: interpolate(scrollY.value, [0, -10000], [0, -10000], Extrapolate.CLAMP), },
        { scale: scaleValue }
      ]
    };
  });

  const animatedRefreshStyle = useAnimatedStyle(() => {
    if (!scrollY) return {};
    const pullDistance = Math.min(scrollY.value, 0);

    const opacity = interpolate(
      pullDistance,
      [-80, -20, 0],
      [1, 0, 0],
      Extrapolate.CLAMP
    );

    return {
      opacity,
      marginTop: 20,
      transform: [
        {
          translateY: interpolate(
            pullDistance,
            [-80, 0],
            [0, -10],
            Extrapolate.CLAMP
          )
        }
      ]
    };
  });

  return (
    <BgWrapperUi>
      <View style={styles.mainContainer}>
        {/* {status === "fulfilled" && (
          <CustomRefreshControl
            refreshing={refreshing}
            onRefresh={() => onRefresh(tag, isUser || false)}
            progress={progress}
            isAbsolute={true}
            containerStyle={animatedRefreshStyle}
          />
        )} */}
        <Animated.ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={[
            styles.scrollContentContainer,
            { paddingBottom: insets.bottom + mainBottomNavigationHeight }
          ]}
          bounces={true}
          scrollEventThrottle={16}
          onScroll={scrollHandler}
          overScrollMode="auto"
        >
          <AsyncDataRender
            status={status || 'fulfilled'}
            data={profile}
            needPending={options?.needPending}
            renderContent={() => (
              <View style={styles.container}>
                <ProfileTop animatedBannerStyle={animatedBannerStyle} />
                <ProfileContent />
              </View>
            )}
          />

        </Animated.ScrollView>
      </View>
    </BgWrapperUi>
  );
});

const styles = StyleSheet.create({
  img: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    position: 'relative'
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    flexDirection: 'column',
    gap: 10,
  }
});
