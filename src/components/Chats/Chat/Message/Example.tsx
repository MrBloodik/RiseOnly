import React, { useState } from "react"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { CustomContextMenu } from "./CustomContextMenu"

export default function ExampleMenu() {
	const [menuVisible, setMenuVisible] = useState(false)
	const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<View style={styles.container}>
				<TouchableOpacity
					style={styles.button}
					onLongPress={(e) => {
						const { pageX, pageY } = e.nativeEvent
						setMenuPosition({ x: pageX, y: pageY })
						setMenuVisible(true)
					}}
				>
					<Text style={styles.text}>Зажми меня</Text>
				</TouchableOpacity>

				<CustomContextMenu
					visible={menuVisible}
					onClose={() => setMenuVisible(false)}
					onSelect={(option) => console.log("Выбран:", option)}
					position={menuPosition}
				/>
			</View>
		</GestureHandlerRootView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	button: {
		backgroundColor: "#4a90e2",
		padding: 14,
		borderRadius: 8,
	},
	text: {
		color: "white",
		fontSize: 16,
	},
})
