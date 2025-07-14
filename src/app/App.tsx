import CookieManager from '@react-native-cookies/cookies';
import { NavigationContainer } from '@react-navigation/native';
import { initCookieManager } from '@shared/api/api';
import '@shared/lib/global/array-extensions';
import { navigationRef } from '@shared/lib/navigation';
import { initLocalStorage } from '@shared/storage';
import { initAppStorage } from '@shared/storage/AppStorage';
import { themeStore } from '@stores/theme';
import { registerRootComponent } from 'expo';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NotifierWrapper } from 'react-native-notifier';
import { DefaultTheme, PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './router/AppNavigator';

SplashScreen.setOptions({ fade: true });
SplashScreen.preventAutoHideAsync();

export const App = () => {
  const [appIsReady, setAppIsReady] = useState(false);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    async function prepare() {
      try {
        await initCookieManager();
        await initAppStorage();
        await initLocalStorage();

        const domain = 'api.riseonly.net';
        const cookies = await CookieManager.get(`https://${domain}`);
        console.log(`Cookies for ${domain} on app start:`, cookies);

        if (Platform.OS === 'android') {
          await CookieManager.flush();
          console.log('Android cookies flushed on app start');

          const cookiesAfterFlush = await CookieManager.get(`https://${domain}`);
          console.log('Cookies after flush:', cookiesAfterFlush);
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn('Error during app initialization:', e);
      } finally {
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    const refreshCookiesOnForeground = async (nextAppState: AppStateStatus) => {
      try {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === 'active'
        ) {
          console.log('App came to foreground, refreshing cookies');
          await initCookieManager();
        }
        appState.current = nextAppState;
      } catch (error) {
        console.error('Error refreshing cookies on foreground:', error);
      }
    };

    const subscription = AppState.addEventListener('change', refreshCookiesOnForeground);

    return () => {
      subscription.remove();
    };
  }, []);

  if (!appIsReady) return null;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: themeStore.currentTheme.bgTheme.background as string
      }}
    >
      <NavigationContainer
        ref={navigationRef}
      >
        <SafeAreaProvider>
          <PaperProvider
            theme={{
              ...DefaultTheme,
              colors: {
                ...DefaultTheme.colors,
                onSurfaceVariant: themeStore.currentTheme.secondTextColor.color as string,
                background: themeStore.currentTheme.bgTheme.background as string,
                primary: themeStore.currentTheme.originalMainGradientColor.color,
                onBackground: themeStore.currentTheme.inputTheme.background as string,
                outline: themeStore.currentTheme.inputTheme.borderColor as string,
              },
            }}
          >
            <GestureHandlerRootView style={{ flex: 1 }}>
              <NotifierWrapper>
                <AppNavigator />
                <StatusBar style="light" />
              </NotifierWrapper>
            </GestureHandlerRootView>
          </PaperProvider>
        </SafeAreaProvider>
      </NavigationContainer>
    </View>
  );
};

registerRootComponent(App);
