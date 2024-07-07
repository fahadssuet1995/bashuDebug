import 'react-native-gesture-handler'
import * as React from 'react'
import 'react-native-reanimated'
import { NavigationContainer } from "@react-navigation/native"
import RootStackScreen from './src/screens/RootStackScreen'
import { Provider } from "react-redux"
import { store } from "./src/redux/store"
import { StatusBar } from "expo-status-bar"
import { PaperProvider } from 'react-native-paper'
import { GestureHandlerRootView } from 'react-native-gesture-handler'



export default function App() {
  return (
    // gesture handler 
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* for the paper provider this will allow the bottom sheet to be presented on the root */}
      <PaperProvider>
        {/* for the redux */}
        <Provider store={store}>
          <NavigationContainer>
            <StatusBar style='dark' />
            <RootStackScreen />
          </NavigationContainer>
        </Provider>
      </PaperProvider>
    </GestureHandlerRootView>
  )
}