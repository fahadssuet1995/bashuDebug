import * as React from 'react'
import { StyleSheet } from 'react-native'
import { View } from '../components/Themed'

export default function CalabashScreen() {
  return (
    <View
      style={{
        height: '100%',
      }}
    >
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
})
