import { useNavigation } from '@react-navigation/native';
import { formatSmartDate } from '@shared/lib/date';
import { Box, MainText, MediaPickerUi, SimpleButtonUi, SimpleInputUi, UserLogo } from '@shared/ui';
import { DatePickerUi } from '@shared/ui/DatePickerUi/DatePickerUi';
import { SimpleTextAreaUi } from '@shared/ui/SimpleTextAreaUi/SimpleTextAreaUi';
import { mediaInteractionsStore } from '@stores/media';
import { profileStore } from '@stores/profile';
import { profileActionsStore } from '@stores/profile/profile-actions/profile-actions';
import { themeStore } from '@stores/theme';
import { ProfileSettingsWrapper } from '@widgets/wrappers';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

export const ProfileSettings = observer(() => {
  const {
    editProfileLogoLoading: { editProfileLogoLoading },
    editProfileLogoAction,
    editProfileAction
  } = profileActionsStore;
  const {
    profile,
    editProfileForm: {
      values,
      errors,
      setValue
    },
    datePickerOpen: { datePickerOpen, setDatePickerOpen },
    resetForm,
    onDeleteHb
  } = profileStore;
  const {
    mediaOpen: { mediaOpen, setMediaOpen },
    setOnFinishFunction,
    onFinishFunction
  } = mediaInteractionsStore;

  const { t } = useTranslation();
  const navigation = useNavigation();

  const onSelectAvatarPress = () => setMediaOpen(true);
  const onBackPress = () => navigation.goBack();
  const onSuccessPress = () => {
    editProfileAction();
    onBackPress();
  };

  if (!profile) return null;

  useEffect(() => {
    setOnFinishFunction(editProfileLogoAction);
    resetForm();
  }, []);

  return (
    <ProfileSettingsWrapper
      tKey='settings_profile_title'
      onBackPress={onBackPress}
      onSuccessPress={onSuccessPress}
      cancelText
      height={40}
      readyText
      transparentSafeArea
      PageHeaderUiStyle={{
        borderBottomWidth: 0
      }}
    >
      <>
        <Box style={s.avatarWrapper}>
          <UserLogo
            size={75}
            loading={editProfileLogoLoading}
            isMe
          />
          <SimpleButtonUi
            onPress={onSelectAvatarPress}
            disabled={editProfileLogoLoading}
          >
            <MainText
              tac='center'
              primary
            >
              {t("select_avatar_text")}
            </MainText>
          </SimpleButtonUi>
        </Box>

        <Box style={s.inputsWrapper}>

          {/* NAME */}
          <View style={s.inputContainer}>
            <View style={s.groupContainer}>
              <SimpleInputUi
                style={s.input}
                placeholder={t("name_placeholder")}
                value={values.name}
                setValue={setValue}
                maxLength={32}
                name={"name"}
              />
            </View>
            {errors.nameErr && <MainText style={s.error} color='red' px={11}>{errors.nameErr}</MainText>}
          </View>

          {/* DESCRIPTION */}
          <View style={s.groupContainer}>
            <SimpleTextAreaUi
              inputStyle={s.input}
              placeholder={t("description_placeholder")}
              maxHeight={100}
              maxLength={300}
              value={values.description}
              setText={(text) => setValue("description", text)}
            />
          </View>

          {/* TAG */}
          <SimpleInputUi
            style={s.input}
            placeholder={t("name_placeholder")}
            value={values.tag}
            setValue={setValue}
            maxLength={32}
            name={"tag"}
            error={errors.tagErr}
            groupContainer
          />

          {/* BIRTHDAY */}
          <View style={s.groupContainer}>
            <Box fD='column' gap={10}>
              <SimpleButtonUi
                onPress={() => setDatePickerOpen(prev => !prev)}
                height={25}
                justify='center'
              >
                <Box
                  fD='row'
                  justify='space-between'
                  align='center'
                  width={"100%"}
                >
                  <MainText>
                    {t("hb")}
                  </MainText>

                  <MainText primary>
                    {values.hb ? (
                      formatSmartDate(
                        values.hb,
                        { showYear: true, showTime: false, useRelativeTime: false }
                      )
                    ) : t("not_selected")}
                  </MainText>
                </Box>
              </SimpleButtonUi>

              {datePickerOpen && (
                <Box
                  fD='column'
                  gap={15}
                >
                  <DatePickerUi
                    setOpen={setDatePickerOpen}
                    name='hb'
                    date={profile?.more.hb || (new Date().toISOString())}
                    setDate={setValue}
                    bordered
                  />

                  <SimpleButtonUi
                    onPress={onDeleteHb}
                  >
                    <MainText
                      primary
                    >
                      {t("delete_hb")}
                    </MainText>
                  </SimpleButtonUi>
                </Box>
              )}
            </Box>
          </View>
        </Box>

        {mediaOpen && (
          <MediaPickerUi
            isVisible={mediaOpen}
            onClose={() => setMediaOpen(false)}
            onSelectMedia={() => { }}
            includeEditing={true}
            onFinish={onFinishFunction}
          />
        )}
      </>
    </ProfileSettingsWrapper>
  );
});

const s = StyleSheet.create({
  dateWrapper: {
  },
  error: {
    position: "absolute",
    left: 5,
    bottom: -12.5
  },
  inputContainer: {
    width: "100%",
    position: "relative"
  },
  btnRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: "100%",
    height: '150%'
  },
  input: {
    width: '100%',
    minHeight: 25,
    color: themeStore.currentTheme.textColor.color,
    fontSize: 16
  },
  groupContainer: {
    backgroundColor: themeStore.currentTheme.bgTheme.background as string,
    borderRadius: 10,
    flexDirection: 'column',
    gap: 15,
    paddingVertical: 8,
    paddingHorizontal: 12.5,
    width: '100%',
  },
  inputsWrapper: {
    flexDirection: 'column',
    gap: 12.5,
    marginTop: 10,
  },
  avatarWrapper: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  container: {
    paddingHorizontal: 10,
    paddingBottom: 30,
  },
  header: {
  },
  avatarImage: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
  }
});
