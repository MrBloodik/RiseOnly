import Svg, { Path, Rect } from 'react-native-svg'

export const ProfileSettingsIcon = ({ size = 28 }) => {
	return (
		<Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
			<Rect width={size} height={size} rx="8" fill="#09AF00" />
			<Path d="M14 12.2C15.933 12.2 17.5 10.5882 17.5 8.6C17.5 6.61177 15.933 5 14 5C12.067 5 10.5 6.61177 10.5 8.6C10.5 10.5882 12.067 12.2 14 12.2Z" fill="white" />
			<Path d="M21 18.9504C21 21.1869 21 23.0004 14 23.0004C7 23.0004 7 21.1869 7 18.9504C7 16.7139 10.1342 14.9004 14 14.9004C17.8658 14.9004 21 16.7139 21 18.9504Z" fill="white" />
		</Svg>
	)
}