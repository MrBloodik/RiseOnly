import { ConfigContext, ExpoConfig } from 'expo/config'

export default ({ config }: ConfigContext): ExpoConfig => {
  return {
    ...config,
    name: 'Riseonly',
    slug: 'rn-frontend',
    jsEngine: 'hermes',
    version: '1.0.4',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    owner: 'nics51og',
    splash: {
      image: './assets/icon.png',
      resizeMode: 'contain',
      backgroundColor: '#151515',
    },
    plugins: [
      [
        "expo-splash-screen",
        {
          image: './assets/icon.png',
          resizeMode: 'contain',
          backgroundColor: '#151515',
          imageWidth: 200
        }
      ],
      [
        "expo-build-properties",
        {
          ios: {
            deploymentTarget: "16.0"
          }
        }
      ]
    ],
    ios: {
      supportsTablet: true,
      jsEngine: 'hermes',
      bundleIdentifier: 'com.nics51.rn-frontend',
      buildNumber: '5',
      icon: './assets/icon.png',
      infoPlist: {
        NSPhotoLibraryUsageDescription: "This app requires access to your photo library to select images for posts.",
        NSCameraUsageDescription: "This app requires access to your camera to take photos for posts."
      },
    },
    android: {
      icon: './assets/icon.png',
      package: 'com.nics51.rnfrontend',
      softwareKeyboardLayoutMode: 'pan',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#151515',
      },
    },
    extra: {
      eas: {
        projectId: '1c3f1301-1d71-4aeb-b1f6-2890f7fd77d9',
      },
    },
  }
}
