# React Native iOS build troubleshooting

## Проблема с ReactAppDependencyProvider

При сборке iOS с использованием Expo и EAS может возникать ошибка установки pods:

```
[!] Unable to find a specification for `ReactAppDependencyProvider` depended upon by `expo-dev-launcher`
```

## Решения

### 1. Локальное решение

Для локальной разработки можно выполнить следующие шаги:

1. Установить необходимые зависимости:

```bash
npm install expo-modules-autolinking --legacy-peer-deps
npm install expo-dev-client --legacy-peer-deps
```

2. Создать локальный podspec для ReactAppDependencyProvider:

```bash
mkdir -p ~/.cocoapods/repos/expo
git clone --depth 1 https://github.com/expo/expo.git ~/.cocoapods/repos/expo
cat > ~/.cocoapods/repos/expo/ReactAppDependencyProvider.podspec <<EOL
Pod::Spec.new do |s|
  s.name           = 'ReactAppDependencyProvider'
  s.version        = '1.0.0'
  s.summary        = 'Provides dependencies for React Native apps'
  s.author         = 'Expo'
  s.homepage       = 'https://github.com/expo/expo'
  s.platform       = :ios, '13.0'
  s.source         = { :git => 'https://github.com/expo/expo.git' }
  s.source_files   = 'ios/**/*.{h,m}'
  s.preserve_paths = 'ios/**/*'
  s.dependency 'React-Core'
end
EOL
```

3. Добавить источники в Podfile:

```ruby
source "file:///~/.cocoapods/repos/expo"
source "https://github.com/CocoaPods/Specs.git"

# Оставшаяся часть вашего Podfile
```

### 2. Решение для CI/CD (EAS Build)

1. Настроить `eas.json` с prebuild командой:

```json
{
	"build": {
		"production": {
			"ios": {
				"cocoapods": {
					"podfileProperties": {
						"reactAppDependencyPath": "../node_modules/react-native",
						"expo.jsEngine": "hermes"
					}
				},
				"prebuildCommand": "cd ios && echo 'source \"https://github.com/CocoaPods/Specs.git\"' > Podfile.additions && cat Podfile.additions Podfile > Podfile.new && mv Podfile.new Podfile && cd .. && (npx pod-install || (npx expo install expo-dev-client && npx pod-install))"
			}
		}
	}
}
```

2. Установить переменные окружения:

```bash
export RCT_NEW_ARCH_ENABLED=1
export EX_DEV_CLIENT_NETWORK_INSPECTOR=1
```

### 3. Альтернативные подходы

-   Использовать более старую версию Expo SDK (если это возможно)
-   Отключить expo-dev-launcher в режиме production
-   Обновить все зависимости React Native и Expo до последних совместимых версий
