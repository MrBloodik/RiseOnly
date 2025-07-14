import { CSSProperties } from 'react'

export interface ThemeT {
   bgTheme: CSSProperties & { borderColor?: string; borderWidth?: number }
   btnsTheme: CSSProperties
   borderRadius?: CSSProperties
   inputTheme: CSSProperties & { borderColor?: string; borderWidth?: number }
   textColor: CSSProperties
   secondTextColor: CSSProperties
   myCommentBgTheme: CSSProperties
   mainGradientColor: CSSProperties
   originalMainGradientColor: CSSProperties
   errorColor: CSSProperties
}

export interface ThemeListT {
   colors: ThemeT
   title: string
   isPremium: boolean
}

export interface EditThemeObjT {
   name: string
}

export interface RgbaColor {
   a: number
   r: number
   g: number
   b: number
}