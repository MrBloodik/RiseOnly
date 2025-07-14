import TwoSamurais from '@images/BgTheme1.png';
import Afrosamurai from '@images/BgTheme2.png';
import LastSamurai from '@images/WallpaperLastSamurai.png';
import SakuraTree from '@images/WallpaperSakura.png';
import { defaultColorValues } from '@shared/config/const';
import { changeRgbA, darkenRGBA } from '@shared/lib/theme';
import { action, makeAutoObservable, toJS } from 'mobx';
import { mobxState } from 'mobx-toolbox';
import { RgbaColor, ThemeT } from '../types';

class ThemeStore {
   constructor() {
      this.defaultTheme = {
         bgTheme: {
            background: "rgba(20, 20, 20, 1)",
            border: '1px solid #252525',
            borderRadius: '20px'
         },
         inputTheme: {
            background: 'rgba(45, 45, 45, 1)',
            border: '1px solid rgba(58, 58, 58, 1)',
            height: '45px',
            borderRadius: '10px'
         },
         btnsTheme: {
            background: "rgba(30, 30, 30, 1)",
            height: '45px',
            borderRadius: '30px'
         },
         textColor: {
            color: 'rgba(255, 255, 255, 1)',
         },
         secondTextColor: {
            color: 'rgba(200, 200, 200, 1)',
         },

         myCommentBgTheme: {
            background: 'rgba(30, 30, 30, 1)'
         },
         mainGradientColor: {
            background: 'linear-gradient(to right, rgba(255, 65, 65, 1) 0%, rgba(255, 40, 40, 1) 50%, rgba(255, 0, 0, 1) 100%)'
         },
         originalMainGradientColor: {
            color: 'rgba(255, 65, 65, 1)'
         },
         errorColor: {
            color: 'rgba(255, 18, 18, 1)'
         }
      };

      this.currentTheme = this.changeToNativeThemeFormat(this.defaultTheme);
      this.currentBg = Afrosamurai;

      makeAutoObservable(this, {
         setBg: action,
         setMyCommentBg: action,
         setBtnsBg: action,
         setMainColor: action,
         setSecondaryColor: action,
         setBRadius: action,
         changeWallpaper: action,
         changeTheme: action,
         setBgPreview: action,
         setMyCommentBgPreview: action,
         setBtnsBgPreview: action,
         setMainColorPreview: action,
         setSecondaryColorPreview: action,
         setBRadiusPreview: action,
         setMainGradientColor: action,
         setErrorColor: action
      }, { deep: false });
   }

   safeAreaWithContentHeight = mobxState(0)("safeAreaWithContentHeight");
   defaultTheme: ThemeT;
   currentTheme: ThemeT;
   currentThemeObj: ThemeT | undefined;
   mainBottomNavigationHeight = 45;

   wallpapersList = [
      { title: 'Афросамурай', isPremium: false, image: Afrosamurai },
      { title: 'Самурай воин', isPremium: false, image: TwoSamurais },
      { title: 'Последний самурай', isPremium: true, image: LastSamurai },
      { title: 'Цветение сакуры', isPremium: true, image: SakuraTree },
   ];
   currentBg: string;

   getBlurViewBgColor = () => {
      return changeRgbA(darkenRGBA(this.currentTheme.bgTheme.background as string, 0.8), '0.88');
   };

   changeToNativeThemeFormat = (theme: ThemeT) => {
      const processThemeObject = (obj: any) => {
         const newObj = { ...obj };

         if (newObj.border) {
            console.log(newObj.border);
            const borderParts = newObj.border.split(' ');
            const borderColor = borderParts.slice(2).join(" ");

            if (borderParts[0]) {
               newObj.borderWidth = Number(borderParts[0].replace('px', ''));
            }

            // rgba(83, 83, 83, 1)
            if (borderColor) newObj.borderColor = borderColor;

            delete newObj.border;
         }

         Object.keys(newObj).forEach(key => {
            if (key === 'height' || key === 'borderRadius') {
               if (typeof newObj[key] === 'string' && newObj[key].includes('px')) {
                  newObj[key] = Number(newObj[key].replace('px', ''));
               }
            }
         });

         Object.keys(newObj).forEach(key => {
            if (typeof newObj[key] === 'object' && newObj[key] !== null) {
               newObj[key] = processThemeObject(newObj[key]);
            }
         });

         return newObj;
      };

      return processThemeObject({ ...theme });
   };

   setBorderColor = (e: RgbaColor) => {
      this.currentTheme = {
         ...this.currentTheme,
         bgTheme: {
            ...this.currentTheme.bgTheme,
            border: `1px solid rgba(${e.r}, ${e.g}, ${e.b}, ${e.a})`
         }
      };
   };

   setErrorColor = (e: RgbaColor) => {
      this.currentTheme = {
         ...this.currentTheme,
         errorColor: {
            color: `rgba(${e.r}, ${e.g}, ${e.b}, ${e.a})`
         }
      };
   };

   setMainGradientColor = (e: RgbaColor) => {
      this.currentTheme = {
         ...this.currentTheme,
         originalMainGradientColor: {
            color: `rgb(${e.r}, ${e.g}, ${e.b})`
         }
      };
   };

   setBg = (e: RgbaColor) => {
      this.currentTheme = {
         ...this.currentTheme,
         bgTheme: {
            ...this.currentTheme.bgTheme,
            background: `rgba(${e.r}, ${e.g}, ${e.b}, ${e.a})`,
         },
      };
   };

   setMyCommentBg = (e: RgbaColor) => {
      this.currentTheme = {
         ...this.currentTheme,
         myCommentBgTheme: {
            ...this.currentTheme.myCommentBgTheme,
            background: `rgba(${e.r}, ${e.g}, ${e.b}, ${e.a})`,
         }
      };
   };

   setBtnsBg = (e: RgbaColor) => {
      this.currentTheme = {
         ...this.currentTheme,
         btnsTheme: {
            ...this.currentTheme.btnsTheme,
            background: `rgba(${e.r}, ${e.g}, ${e.b}, ${e.a})`,
         },
      };
   };

   setMainColor = (e: RgbaColor) => {
      this.currentTheme = {
         ...this.currentTheme,
         textColor: {
            ...this.currentTheme.textColor,
            color: `rgba(${e.r}, ${e.g}, ${e.b}, ${e.a})`,
         },
      };
   };

   setSecondaryColor = (e: RgbaColor) => {
      this.currentTheme = {
         ...this.currentTheme,
         secondTextColor: {
            ...this.currentTheme.secondTextColor,
            color: `rgba(${e.r}, ${e.g}, ${e.b}, ${e.a})`,
         },
      };
   };

   setBRadius = (radius: string) => {
      if (radius.length > 3) return;
      this.currentTheme = {
         ...this.currentTheme,
         bgTheme: {
            ...this.currentTheme.bgTheme,
            borderRadius: `${radius}px`
         }
      };
   };

   changeWallpaper = (url: string) => {
      this.currentBg = url;
      document.body.style.backgroundImage = `url(${url})`;
   };

   changeTheme = (colors: ThemeT) => {
      colors = toJS(colors);
      this.currentTheme = colors;
   };

   // PREVIEW MODE EDITING THEME

   setBgPreview = (e: RgbaColor) => {
      if (!this.currentThemeObj) return;
      this.currentThemeObj = {
         ...this.currentThemeObj,
         bgTheme: {
            ...this.currentThemeObj.bgTheme,
            background: `rgba(${e.r}, ${e.g}, ${e.b}, ${e.a})`,
         },
      };
   };

   setMyCommentBgPreview = (e: RgbaColor) => {
      if (!this.currentThemeObj) return;
      this.currentThemeObj = {
         ...this.currentThemeObj,
         myCommentBgTheme: {
            ...this.currentThemeObj.myCommentBgTheme,
            background: `rgba(${e.r}, ${e.g}, ${e.b}, ${e.a})`,
         }
      };
   };

   setBtnsBgPreview = (e: RgbaColor) => {
      if (!this.currentThemeObj) return;
      this.currentThemeObj = {
         ...this.currentThemeObj,
         btnsTheme: {
            ...this.currentThemeObj.btnsTheme,
            background: `rgba(${e.r}, ${e.g}, ${e.b}, ${e.a})`,
         },
      };
   };

   setMainColorPreview = (e: RgbaColor) => {
      if (!this.currentThemeObj) return;
      this.currentThemeObj = {
         ...this.currentThemeObj,
         textColor: {
            ...this.currentThemeObj.textColor,
            color: `rgba(${e.r}, ${e.g}, ${e.b}, ${e.a})`,
         },
      };
   };

   setSecondaryColorPreview = (e: RgbaColor) => {
      if (!this.currentThemeObj) return;
      this.currentThemeObj = {
         ...this.currentThemeObj,
         secondTextColor: {
            ...this.currentThemeObj.secondTextColor,
            color: `rgba(${e.r}, ${e.g}, ${e.b}, ${e.a})`,
         },
      };
   };

   setBRadiusPreview = (radius: string) => {
      if (!this.currentThemeObj) return;
      if (radius.length > 3) return;
      this.currentThemeObj = {
         ...this.currentThemeObj,
         bgTheme: {
            ...this.currentThemeObj.bgTheme,
            borderRadius: `${radius}px`
         }
      };
   };

   changeSomeColor = (e: string) => {
      const rightRgba = e.replace('rgba(', '').replace(')', '').split(',');
      const rgba: RgbaColor = {
         r: Number(rightRgba[0]),
         g: Number(rightRgba[1]),
         b: Number(rightRgba[2]),
         a: Number(rightRgba[3])
      };

      switch (this.selectedRoute.selectedRoute) {
         case 'BgColorSettings':
            this.setBg(rgba);
            break;
         case 'BtnColorSettings':
            this.setBtnsBg(rgba);
            break;
         case 'TextColorSettings':
            this.setMainColor(rgba);
            break;
         case 'SecondaryTextColorSettings':
            this.setSecondaryColor(rgba);
            break;
         case 'ErrorColorSettings':
            this.setErrorColor(rgba);
            break;
         case 'PrimaryColorSettings':
            this.setMainGradientColor(rgba);
            break;
      }
   };

   setCurrentTheme = (theme: ThemeT) => this.currentTheme = theme;
   setCurrentThemeObj = (theme: ThemeT) => this.currentThemeObj = toJS(theme);

   colorBottomSheet = mobxState(false)("colorBottomSheet");
   selectedRoute = mobxState('')("selectedRoute");

   changeToDefault = () => {
      const { selectedRoute: { selectedRoute } } = this;

      const obj = {
         "BgColorSettings": "bgTheme.background",
         "BtnColorSettings": "btnsTheme.background",
         "TextColorSettings": "textColor.color",
         "SecondaryTextColorSettings": "secondTextColor.color",
         "PrimaryColorSettings": "originalMainGradientColor.color"
      };

      const path = obj[selectedRoute as keyof typeof obj];
      if (!path) return;

      const [parent, child] = path.split('.');
      if (parent && child) {
         const defaultValue = defaultColorValues[selectedRoute as keyof typeof defaultColorValues];

         this.currentTheme = {
            ...this.currentTheme,
            [parent]: {
               ...this.currentTheme[parent as keyof ThemeT],
               [child]: defaultValue
            }
         };
      }
   };
}

export const themeStore = new ThemeStore();
