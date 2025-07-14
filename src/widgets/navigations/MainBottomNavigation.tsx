import { getNavBtns } from '@shared/config/tsx';
import { getCurrentRoute, navigate } from '@shared/lib/navigation';
import { MainText, UserLogo } from '@shared/ui';
import { notifyActionsStore } from '@stores/notify';
import { profileStore } from '@stores/profile';
import { themeStore } from '@stores/theme';
import { BlurView } from 'expo-blur';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { Platform, SafeAreaView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const MainBottomNavigation = observer(() => {
  const { getBlurViewBgColor, currentTheme, mainBottomNavigationHeight } = themeStore;
  const { profile } = profileStore;
  const { allNotificationsSai: { data, status } } = notifyActionsStore;

  const currentRoute = getCurrentRoute()?.name;
  const insets = useSafeAreaInsets();

  const isActive = (routeName: string) => currentRoute === routeName;

  const pathToRouteName = (path: string) => {
    if (!path) return '';
    const lastPart = path.split('/').pop() || '';
    if (lastPart === 'about-us') return 'AboutUs';
    return lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
  };

  return (
    <BlurView
      intensity={30}
      style={[
        styles.outerContainer,
        {
          backgroundColor: getBlurViewBgColor(),
        },
      ]}
    >
      <SafeAreaView style={styles.container}>
        <View
          style={[
            styles.tabs,
            { height: mainBottomNavigationHeight }
          ]}
        >
          {getNavBtns('mobile', 26).map((btn) => {
            return (
              <TouchableOpacity
                key={btn.to}
                style={[styles.tab, isActive(pathToRouteName(btn.to)) && styles.activeTab]}
                onPress={() => {
                  if (!btn.to) return;
                  if (btn.to === "Profile") profileStore.setUserToShow(profileStore.profile);
                  navigate('MainStack', {
                    screen: 'MainTabs',
                    params: {
                      screen: btn.to
                    }
                  });
                }}
              >
                {btn.text === 'Моя страница' ? (
                  <UserLogo
                    source={profile?.more?.logo}
                    size={30}
                    style={styles.avatarContainer}
                  />
                ) : (
                  btn.text === 'Уведомления' ? (
                    <View style={styles.notifyContainer}>
                      {status === 'fulfilled' && data?.totalUnread! > 0 && (
                        <MainText
                          style={{
                            ...styles.totalUnread,
                            backgroundColor: currentTheme.originalMainGradientColor.color as string
                          }}
                        >
                          {data?.totalUnread}
                        </MainText>
                      )}
                      {btn.icon}
                    </View>
                  ) : (
                    btn.icon
                  )
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>
    </BlurView>
  );
});

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  container: {
    backgroundColor: "transparent"
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 15,
    paddingBottom: Platform.OS == 'android' ? 35 : 0
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
  },
  avatarContainer: {
    width: 30,
    height: 30,
    borderRadius: 100,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: themeStore.currentTheme.secondTextColor.color as string,
  },
  notifyContainer: {
    position: 'relative'
  },
  totalUnread: {
    position: 'absolute',
    top: -7,
    right: -7,
    zIndex: 1000,
    borderRadius: 1000,
    minWidth: 10,
    padding: 4,
    fontSize: 9,
  },
});
