import { GlobalBottomSheets } from '@app/GlobalBottomSheets';
import { GlobalModals } from '@app/GlobalModals';
import { MainTabsLayout } from '@app/layouts/MainTabsLayout';
import { Chats, Notifications, Posts, Profile } from '@pages/Main';
import { Chat } from '@pages/Main/Chats/Chat/Chat';
import { ChatProfile } from '@pages/Main/Chats/Chat/ChatProfile/ChatProfile';
import { GlobalSearch } from '@pages/Main/GlobalSearch/GlobalSearch';
import { PostDetail } from '@pages/Main/Posts/PostDetail/PostDetail';
import { CreatePost } from '@pages/Main/Profile/CreatePost/CreatePost';
import { UserFriends, UserSubs, UserSubscribers } from '@pages/Main/Profile/Info';
import { BeModeratorSettings, CustomizationSettings, ModerationSettings, MyModerationRequestsSettings, PrivacySetting, PrivacySettings, ProfileSettings, SessionsSettings, Settings, SubscriptionSettings } from '@pages/Main/Profile/Settings';
import { BgColorSettings } from '@pages/Main/Profile/Settings/CustomizationSettings/Settings/BgColorSettings/BgColorSettings';
import { BtnColorSettings } from '@pages/Main/Profile/Settings/CustomizationSettings/Settings/BtnColorSettings/BtnColorSettings';
import { ChatWallpapersSettings } from '@pages/Main/Profile/Settings/CustomizationSettings/Settings/ChatWallpapersSettings/ChatWallpapersSettings';
import { PrimaryColorSettings } from '@pages/Main/Profile/Settings/CustomizationSettings/Settings/PrimaryColorSettings/PrimaryColorSettings';
import { SecondaryTextColorSettings } from '@pages/Main/Profile/Settings/CustomizationSettings/Settings/SecondaryTextColor/SecondaryTextColor';
import { TextColorSettings } from '@pages/Main/Profile/Settings/CustomizationSettings/Settings/TextColorSettings/TextColorSettings';
import { ThemeSettings } from '@pages/Main/Profile/Settings/CustomizationSettings/Settings/ThemeSettings/ThemeSettings';
import { WallpapersSettings } from '@pages/Main/Profile/Settings/CustomizationSettings/Settings/WallpapersSettings/WallpapersSettings';
import { LanguageSettings } from '@pages/Main/Profile/Settings/LanguageSettings/LanguageSettings';
import { MemorySettings } from '@pages/Main/Profile/Settings/MemorySettings/MemorySettings';
import { CachedChats } from '@pages/Main/Profile/Settings/MemorySettings/pages/CachedChats/CachedChats';
import { CachedMedia } from '@pages/Main/Profile/Settings/MemorySettings/pages/CachedMedia/CachedMedia';
import { SignIn, SignUp } from '@pages/Sign';
import NetInfo from '@react-native-community/netinfo';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { notifyActionsStore } from '@stores/notify';
import { notifyInteractionsStore } from '@stores/notify/notify-interactions/notify-interactions';
import { profileStore } from '@stores/profile';
import { User } from '@stores/profile/types';
import { themeStore } from '@stores/theme';
import { chatsWebsocketStore } from '@stores/ws/chats';
import { messageWebsocketStore } from '@stores/ws/message';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type RootStackParamList = {
  SignStack: undefined;
  MainStack: { screen?: string; params?: any; };
};

export type SignStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
};

export type MainStackParamList = {
  MainTabs: { screen?: string; params?: any; };
  PostDetail: { postId: number; };
  Chat: {
    chatId: string;
    previewUser: User;
  };
  UserPage: { tag: string; };
  UserSubs: { tag: string; };
  UserSubscribers: { tag: string; };
  UserFriends: { tag: string; };
  CreatePost: undefined;

  // SETTINGS
  Settings: undefined;
  ProfileSettings: undefined;
  PrivacySettings: undefined;
  PrivacySetting: undefined;
  SessionsSettings: undefined;
  ModerationSettings: undefined;
  BeModeratorSettings: undefined;
  LanguageSettings: undefined;
  MyModerationRequestsSettings: undefined;
  CustomizationSettings: undefined;
  SubscriptionSettings: undefined;
  ThemeSettings: undefined;
  WallpapersSettings: undefined;
  ChatWallpapersSettings: undefined;
  BgColorSettings: undefined;
  BtnColorSettings: undefined;
  PrimaryColorSettings: undefined;
  TextColorSettings: undefined;
  SecondaryTextColorSettings: undefined;
  MemorySettings: undefined;
  CachedChats: undefined;
  CachedMedia: undefined;

  // CHATS
  ChatProfile: undefined;
};

export type MainTabsParamList = {
  Posts: undefined;
  Profile: { id: string; };
  GlobalSearch: undefined;
  Chats: undefined;
  Notifications: undefined;
  Vacancy: undefined;
  News: undefined;
  Leaderboard: undefined;
  AboutUs: undefined;
  Cooperation: undefined;
  Reports: undefined;
};

export const RootStack = createNativeStackNavigator<RootStackParamList>();
export const SignStack = createNativeStackNavigator<SignStackParamList>();
export const MainStack = createNativeStackNavigator<MainStackParamList>();
export const MainStackChats = createNativeStackNavigator<MainStackParamList>();
export const MainTabs = createBottomTabNavigator<MainTabsParamList>();

const SignNavigator = observer(() => {

  useFocusEffect(
    useCallback(() => {
      messageWebsocketStore.messageWs.closeConnection();
      chatsWebsocketStore.chatWs.closeConnection();
    }, [])
  );

  return (
    <SignStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          flex: 1,
          backgroundColor: themeStore.currentTheme.bgTheme.background as string
        },
        gestureEnabled: false,
        fullScreenGestureEnabled: true,
      }}
    >
      <SignStack.Screen name="SignIn" component={SignIn} />
      <SignStack.Screen name="SignUp" component={SignUp} />
    </SignStack.Navigator>
  );
});

const PostsScreen = () => (
  <MainTabsLayout>
    <Posts />
  </MainTabsLayout>
);

const NotificationsScreen = () => (
  <MainTabsLayout>
    <Notifications />
  </MainTabsLayout>
);

const ProfileScreen = () => (
  <MainTabsLayout>
    <Profile />
  </MainTabsLayout>
);

const ChatsScreen = () => (
  <MainTabsLayout>
    <Chats />
  </MainTabsLayout>
);

const GlobalSearchScreen = () => (
  <MainTabsLayout>
    <GlobalSearch />
  </MainTabsLayout>
);

const MainTabsNavigator = observer(() => {
  return (
    <MainTabs.Navigator
      screenOptions={{ headerShown: false, tabBarStyle: { display: "none" } }}
      tabBar={(_) => <></>}
    >
      <MainTabs.Screen name="Notifications" component={NotificationsScreen} />
      <MainTabs.Screen name="Profile" component={ProfileScreen} initialParams={{ id: profileStore?.profile?.tag || '' }} />
      <MainTabs.Screen name="GlobalSearch" component={GlobalSearchScreen} />
      <MainTabs.Screen name="Chats" component={ChatsScreen} />
      <MainTabs.Screen name="Posts" component={PostsScreen} />
    </MainTabs.Navigator>
  );
});

const MainNavigator = observer(() => {
  // useFocusEffect(
  //   useCallback(() => {
  //     if (profileStore.profile) {
  //       chatsWebsocketStore.chatWs.initializeWebSocketConnection();
  //       messageWebsocketStore.messageWs.initializeWebSocketConnection();
  //     }
  //   }, [profileStore.profile])
  // );

  return (
    <MainStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { flex: 1 },
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        fullScreenGestureEnabled: true,
      }}
    >
      <MainStack.Screen name="MainTabs" component={MainTabsNavigator} />
      <MainStack.Screen
        name="PostDetail"
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          presentation: 'card',
          animationTypeForReplace: 'push',
          fullScreenGestureEnabled: true,
        }}
        children={() => (
          <MainTabsLayout>
            <PostDetail />
          </MainTabsLayout>
        )}
      />

      {/* USER PAGES */}
      <MainStack.Screen
        name="UserPage"
        children={() => (
          <MainTabsLayout>
            <Profile isUser={true} />
          </MainTabsLayout>
        )}
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          fullScreenGestureEnabled: true,
        }}
      />

      <MainStack.Screen
        name="UserSubs"
        children={() => (
          <MainTabsLayout>
            <UserSubs isUser={true} />
          </MainTabsLayout>
        )}
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          fullScreenGestureEnabled: true,
        }}
      />

      <MainStack.Screen
        name="CreatePost"
        children={() => (
          <CreatePost />
        )}
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          fullScreenGestureEnabled: true,
        }}
      />

      <MainStack.Screen
        name="UserSubscribers"
        children={() => (
          <MainTabsLayout>
            <UserSubscribers isUser={true} />
          </MainTabsLayout>
        )}
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          fullScreenGestureEnabled: true,
        }}
      />

      <MainStack.Screen
        name="UserFriends"
        children={() => (
          <MainTabsLayout>
            <UserFriends isUser={true} />
          </MainTabsLayout>
        )}
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          fullScreenGestureEnabled: true,
        }}
      />

      {/* CHATS */}

      <MainStack.Screen
        name="Chat"
        component={Chat}
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          fullScreenGestureEnabled: true,
        }}
      />
      <MainStack.Screen
        name="ChatProfile"
        component={ChatProfile}
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          fullScreenGestureEnabled: true,
        }}
      />

      {/* === SETTINGS === */}

      {/* PROFILE SETTINGS */}
      <MainStack.Screen
        name="Settings"
        component={Settings}
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          fullScreenGestureEnabled: true,
        }}
      />
      <MainStack.Screen
        name="ProfileSettings"
        component={ProfileSettings}
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          fullScreenGestureEnabled: true,
        }}
      />

      {/* PRIVACY SETTINGS */}
      <MainStack.Screen
        name="PrivacySettings"
        component={PrivacySettings}
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          fullScreenGestureEnabled: true,
        }}
      />
      <MainStack.Screen
        name="PrivacySetting"
        component={PrivacySetting}
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          fullScreenGestureEnabled: true,
        }}
      />

      {/* SESSIONS SETTINGS */}
      <MainStack.Screen
        name="SessionsSettings"
        component={SessionsSettings}
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          fullScreenGestureEnabled: true,
        }}
      />

      {/* MODERATION SETTINGS */}
      <MainStack.Screen
        name="ModerationSettings"
        component={ModerationSettings}
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          fullScreenGestureEnabled: true,
        }}
      />
      <MainStack.Screen
        name="BeModeratorSettings"
        component={BeModeratorSettings}
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          fullScreenGestureEnabled: true,
        }}
      />
      <MainStack.Screen
        name="MyModerationRequestsSettings"
        component={MyModerationRequestsSettings}
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          fullScreenGestureEnabled: true,
        }}
      />

      {/* LANGUAGE SETTINGS */}
      <MainStack.Screen
        name="LanguageSettings"
        component={LanguageSettings}
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          fullScreenGestureEnabled: true,
        }}
      />

      {/* MEMORY SETTINGS */}
      <MainStack.Screen
        name="MemorySettings"
        component={MemorySettings}
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          fullScreenGestureEnabled: true,
        }}
      />

      <MainStack.Screen
        name="CachedChats"
        component={CachedChats}
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          fullScreenGestureEnabled: true,
        }}
      />

      <MainStack.Screen
        name="CachedMedia"
        component={CachedMedia}
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          fullScreenGestureEnabled: true,
        }}
      />

      {/* CUSTOMIZATION SETTINGS */}
      <MainStack.Screen
        name="CustomizationSettings"
        component={CustomizationSettings}
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          fullScreenGestureEnabled: true,
        }}
      />

      {/* THEME SETTINGS */}
      <MainStack.Screen
        name="ThemeSettings"
        component={ThemeSettings}
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          fullScreenGestureEnabled: true,
        }}
      />

      {/* WALLPAPERS SETTINGS */}
      <MainStack.Screen
        name="WallpapersSettings"
        component={WallpapersSettings}
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          fullScreenGestureEnabled: true,
        }}
      />

      {/* CHAT WALLPAPERS SETTINGS */}
      <MainStack.Screen
        name="ChatWallpapersSettings"
        component={ChatWallpapersSettings}
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          fullScreenGestureEnabled: true,
        }}
      />

      {/* BG COLOR SETTINGS */}
      <MainStack.Screen
        name="BgColorSettings"
        component={BgColorSettings}
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          fullScreenGestureEnabled: true,
        }}
      />

      {/* BTN COLOR SETTINGS */}
      <MainStack.Screen
        name="BtnColorSettings"
        component={BtnColorSettings}
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          fullScreenGestureEnabled: true,
        }}
      />

      {/* PRIMARY COLOR SETTINGS */}
      <MainStack.Screen
        name="PrimaryColorSettings"
        component={PrimaryColorSettings}
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          fullScreenGestureEnabled: true,
        }}
      />

      {/* TEXT COLOR SETTINGS */}
      <MainStack.Screen
        name="TextColorSettings"
        component={TextColorSettings}
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          fullScreenGestureEnabled: true,
        }}
      />

      {/* SECONDARY TEXT COLOR SETTINGS */}
      <MainStack.Screen
        name="SecondaryTextColorSettings"
        component={SecondaryTextColorSettings}
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          fullScreenGestureEnabled: true,
        }}
      />

      {/* SUBSCRIPTION SETTINGS */}
      <MainStack.Screen
        name="SubscriptionSettings"
        component={SubscriptionSettings}
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          fullScreenGestureEnabled: true,
        }}
      />
    </MainStack.Navigator>
  );
});

export const AppNavigator = observer(() => {
  const { safeAreaWithContentHeight: { setSafeAreaWithContentHeight } } = themeStore;
  const { isNoInternet: { setIsNoInternet } } = profileStore;
  const { getAllNotificationsAction } = notifyActionsStore;
  const { scrollViewRef: { scrollViewRef } } = notifyInteractionsStore;

  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isAuthenticated = !!profileStore.profile;
  const initialRouteName = isAuthenticated ? 'MainStack' : 'SignStack';

  useEffect(() => { if (!profileStore.profile) profileStore.preloadProfile(); }, [profileStore.profile]);
  useEffect(() => { if (scrollViewRef) getAllNotificationsAction('all', t, true, false); }, [scrollViewRef]);
  useEffect(() => {
    if (insets.top == 0 || !insets.top) return;
    const height = insets.top;
    themeStore.safeAreaWithContentHeight.setSafeAreaWithContentHeight(height);
  }, [insets]);
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (!state.isConnected) return;
      setIsNoInternet(!state.isConnected);
    });
    NetInfo.fetch().then(state => {
      if (!state.isConnected) return;
      setIsNoInternet(!state.isConnected);
    });
    return () => { unsubscribe(); };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RootStack.Navigator
        initialRouteName={initialRouteName}
        screenOptions={{
          headerShown: false,
          contentStyle: {
            flex: 1,
            backgroundColor: themeStore.currentTheme.bgTheme.background as string
          },
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          fullScreenGestureEnabled: true,
        }}
      >
        <RootStack.Screen
          name="SignStack"
          component={SignNavigator}
          options={{
            gestureEnabled: true,
            gestureDirection: 'horizontal',
            fullScreenGestureEnabled: true,
          }}
        />
        <RootStack.Screen
          name="MainStack"
          component={MainNavigator}
          options={{
            gestureEnabled: false,
            gestureDirection: 'horizontal',
            fullScreenGestureEnabled: true,
          }}
        />
      </RootStack.Navigator>

      {/* GLOBAL MODALS */}

      <GlobalModals />
      <GlobalBottomSheets />
    </GestureHandlerRootView>
  );
});
