import DateTimePick, { EvtTypes } from '@react-native-community/datetimepicker'
import { darkenRGBA } from '@shared/lib/theme'
import { themeStore } from '@stores/theme'
import i18next from 'i18next'
import { observer } from 'mobx-react-lite'
import { DimensionValue, Platform, StyleProp, StyleSheet, TextStyle } from 'react-native'
import { Box } from '../BoxUi/Box'

interface DatePickerUiProps {
	open?: boolean
	setOpen?: (open: boolean) => void
	date: string
	name: string
	style?: StyleProp<TextStyle>
	height?: DimensionValue
	width?: DimensionValue
	bordered?: boolean
	setDate: (key: string, date: string) => void
}

export const DatePickerUi = observer(({
	open = true,
	setOpen,
	date,
	name,
	style = {},
	bordered = false,
	height = "auto",
	width = "100%",
	setDate
}: DatePickerUiProps) => {
	const { currentTheme } = themeStore

	const realDate = new Date(date)

	const toggleDatePicker = () => {
		if (!setOpen) return
		setOpen(!open)
	}

	const onChangeHandler = (
		{ type }: { type: EvtTypes },
		dateRes: Date | undefined
	) => {
		if (type == 'set') {
			if (!dateRes) return
			setDate(name, dateRes.toISOString())
		} else {
			toggleDatePicker()
		}
	}

	const borderStyle = bordered ? {
		borderTopWidth: 0.3,
		borderBottomWidth: 0.3,
		borderTopColor: darkenRGBA(currentTheme.textColor.color as string, 0.7),
		borderBottomColor: darkenRGBA(currentTheme.textColor.color as string, 0.7),
	} : {}

	return (
		<Box
			centered
			style={{
				height: height,
				width: width,
				overflow: "hidden",
				...borderStyle
			}}
		>
			{open ? (
				Platform.OS === 'android' ? (
					<DateTimePick
						value={realDate}
						onChange={onChangeHandler}
						display='default'
						mode="date"
						textColor={currentTheme.textColor.color}
						accentColor={currentTheme.originalMainGradientColor.color}
						style={[
							s.datePickerStyle,
							style
						]}
						locale={i18next.language}
						maximumDate={new Date()}
					/>
				) : (
					<DateTimePick
						value={realDate}
						onChange={onChangeHandler}
						display='spinner'
						mode="date"
						textColor={currentTheme.textColor.color}
						accentColor={currentTheme.originalMainGradientColor.color}
						style={[
							s.datePickerStyle,
							style
						]}
						locale={i18next.language}
						maximumDate={new Date()}
					/>
				)
			) : null}
		</Box>
	)
})

const s = StyleSheet.create({
	datePickerStyle: {}
})