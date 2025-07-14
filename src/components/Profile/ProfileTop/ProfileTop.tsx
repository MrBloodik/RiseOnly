import { MoreIcon } from '@icons/MainPage/Chats/MoreIcon';
import { MenuIcon } from '@icons/MainPage/NavBar';
import { getProfileBtns, getUserStats } from '@shared/config/tsx';
import { navigate } from '@shared/lib/navigation';
import { formatNumber } from '@shared/lib/numbers';
import { changeRgbA, darkenRGBA } from '@shared/lib/theme';
import { profileStore } from '@stores/profile';
import { profileActionsStore } from '@stores/profile/profile-actions/profile-actions';
import { themeStore } from '@stores/theme';
import { Box, CleverImage, MainText, SecondaryText, SimpleButtonUi, UserLogo } from '@ui';
import { BlurView } from 'expo-blur';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NativeSyntheticEvent, StyleProp, StyleSheet, TextLayoutEventData, View, ViewStyle } from 'react-native';
import Animated, { AnimatedStyle } from 'react-native-reanimated';

const numberOfLines = 3;
interface ProfileTopProps {
  animatedBannerStyle: AnimatedStyle<StyleProp<ViewStyle>>;
}

export const ProfileTop = observer(({
  animatedBannerStyle
}: ProfileTopProps) => {
  const { myProfile: { data } } = profileActionsStore;
  const { profile } = profileStore;
  const { currentTheme } = themeStore;

  const { t } = useTranslation();
  const [isTruncated, setIsTruncated] = useState(false);
  const [showFull, setShowFull] = useState(false);

  const onPressMore = () => setShowFull(p => !p);
  const onMenuPress = () => {
    if (profile?.tag === data?.tag) {
      navigate("Settings");
      return;
    }
    console.log("context menu");
  };
  const handleTextLayout = (e: NativeSyntheticEvent<TextLayoutEventData>) => {
    const { lines } = e.nativeEvent;
    if (lines.length >= numberOfLines) setIsTruncated(true);
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.banner, animatedBannerStyle]}
      >
        <CleverImage
          source={data?.more?.banner}
          imageStyles={styles.bannerImage}
          withoutBlur
          withBackgroundBlur
          withoutWrapper
          intensity={0}
          type="banner"
        />
        <BlurView
          intensity={30}
          style={styles.menuBlur}
        >
          <SimpleButtonUi
            style={styles.menuButton}
            onPress={onMenuPress}
          >
            {profile?.tag === data?.tag ? (
              <MenuIcon width={15} height={10} color={currentTheme.textColor.color as string} />
            ) : (
              <MoreIcon width={15} height={10} color={currentTheme.textColor.color as string} />
            )}
          </SimpleButtonUi>
        </BlurView>
      </Animated.View>

      <View
        style={[styles.profileInfo, {
          backgroundColor: currentTheme.bgTheme.background as string
        }]}
      >
        <View style={styles.profileLogoWrapper}>
          <View style={styles.avatarWrapper}>
            <UserLogo
              source={data?.more?.logo || ''}
              size={100}
              style={styles.profileLogoContainer}
              streakCount={data?.more?.streak}
            />
          </View>
        </View>
        <View>
          <MainText px={20} tac='center'>
            {data?.name}
          </MainText>
          <SecondaryText px={13} tac='center'>
            @{data?.tag}
          </SecondaryText>
        </View>
      </View>

      <Box
        style={styles.profileBot}
        bgColor={currentTheme.bgTheme.background}
        gap={8}
      >
        <Box
          fD="row"
          justify="space-around"
          width={"100%"}
          flex={1}
        >
          {getUserStats(data).map((t, i) => {
            return (
              <SimpleButtonUi
                key={i}
                onPress={t.callback}
                style={styles.btn}
                bgColor={currentTheme.btnsTheme.background}
              >
                <MainText
                  numberOfLines={1}
                  ellipsizeMode='tail'
                >
                  {formatNumber(t.amount)}
                </MainText>
                <MainText px={12}>{t.text}</MainText>
              </SimpleButtonUi>
            );
          })}
        </Box>

        <Box>
          <MainText px={13}>
            {t("privacy_settings_description")}:
          </MainText>
          <MainText
            numberOfLines={showFull ? undefined : numberOfLines}
            ellipsizeMode="tail"
            onTextLayout={handleTextLayout}
          >
            {data?.more?.description || t("not_selected")}
          </MainText>

          {isTruncated && (
            <SimpleButtonUi
              onPress={onPressMore}
            >
              <MainText px={13} primary>{showFull ? t("hide_text") : t("more_text")}</MainText>
            </SimpleButtonUi>
          )}
        </Box>
      </Box>

      <Box
        width={"100%"}
        fD="row"
        gap={5}
        style={styles.botbtns}
        bgColor={currentTheme.bgTheme.background}
      >
        {getProfileBtns(data, t).map((t, i) => {
          return (
            <SimpleButtonUi
              key={i}
              onPress={t.callback}
              style={t.text ? styles.profileBtn : styles.profileEmptyBtn}
              bgColor={darkenRGBA(currentTheme.btnsTheme.background, -0.7)}
            >
              {t.icon && t.icon}
              {t.text && (
                <MainText
                  numberOfLines={1}
                  ellipsizeMode='tail'
                  px={14}
                >
                  {t.text}
                </MainText>
              )}
            </SimpleButtonUi>
          );
        })}
      </Box>
    </View>
  );
});

const styles = StyleSheet.create({
  botbtns: {
    padding: 10,
    borderRadius: 10,
    marginTop: 10
  },
  profileEmptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 10
  },
  profileBtn: {
    flexDirection: "row",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10
  },
  btn: {
    paddingHorizontal: 10.5,
    paddingVertical: 7,
    borderRadius: 10
  },
  container: {},
  profileBot: {
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  menuButton: {
    paddingVertical: 5,
    paddingHorizontal: 9,
  },
  menuBlur: {
    backgroundColor: changeRgbA(themeStore.currentTheme.btnsTheme.background as string, "0.5"),
    borderColor: themeStore.currentTheme.bgTheme.borderColor,
    borderWidth: 0.3,
    position: "absolute",
    borderRadius: 10,
    overflow: "hidden",
    top: 70,
    right: 50,
  },
  banner: {
    width: '100%',
    zIndex: -1,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  profileInfo: {
    width: "100%",
    position: "relative",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    paddingHorizontal: 10,
    paddingTop: 40,
    zIndex: 1
  },
  avatarWrapper: {
    position: "absolute",
    bottom: 0,
  },
  profileLogoContainer: {
    width: 95,
    height: 95,
    borderRadius: 50,
    overflow: 'hidden',
    borderColor: themeStore.currentTheme.bgTheme.background as string,
    borderWidth: 3,
  },
  profileLogo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  profileLogoWrapper: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});
