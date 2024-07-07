import * as React from 'react'
import { Text, TouchableOpacity } from 'react-native'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import ForestScreen from '../screens/ForestScreen'
import TreeScreen from '../screens/TreeScreen'
import colors from '../config/colors'
import {
  Fontisto,
  MaterialCommunityIcons,
} from '@expo/vector-icons'
import NotificationScreen from '../screens/Notifications'
import { useDispatch, useSelector } from 'react-redux'
import { Unsubscribe, collection, getDocs, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { database } from '../config/firebase'
import { selectUser, setNotify } from '../redux/features/user'
import { useFocusEffect } from '@react-navigation/native'
import { addNofity } from '../redux/features/notifications'
import * as Notifications from 'expo-notifications'
import { setLikes } from '../redux/features/data'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Ascending } from '../hooks/OrderBy'

const Tab = createMaterialTopTabNavigator()


export default function TreeTabs() {
  let unsub1 
  let unsub2 
  let unsub3 
  const userdata = useSelector(selectUser)
  const dispatch = useDispatch()


  // get notifications
  const getNoifications = async () => {
    const queryData = query(collection(database, `users/${userdata.uid}/notifications`), orderBy('date', 'asc'), limit(100))
    unsub1 = onSnapshot(queryData, snap => {
      const result = snap.docs.map(doc => {
        const id = doc.id
        const data = doc.data() || {}

        return { id, ...data }
      })


      if (result?.length > 0) {
        // sort data
        const sortedData = Ascending(result)
        dispatch(addNofity(sortedData))
      }
    })

    const budge = await Notifications.getBadgeCountAsync()
    dispatch(setNotify(budge))
  }


  // get notifications
  const getAllLikes = async () => {
    const likes = await AsyncStorage.getItem('likes')
    dispatch(setLikes(JSON.parse(likes)?.data))
  }


  // get notifications
  const getAllReplies = async () => {
    const likes = await AsyncStorage.getItem('replies')
    // dispatch(setReplies(JSON.parse(likes).data))
  }


  // listend to react navigation native hooks 
  useFocusEffect(
    React.useCallback(() => {
      getNoifications()
      getAllLikes()
  
      return () => {
        // removing listeners
        if (unsub1) unsub1()
        if (unsub2) unsub2()
      }
    }, [])
  )


  return (
    <Tab.Navigator
      initialRouteName='Sticks'
      screenOptions={{
        tabBarShowLabel: true,
        tabBarShowIcon: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: 'grey',
        tabBarIndicatorStyle: { backgroundColor: colors.primary },
        tabBarIndicatorContainerStyle: {
          marginHorizontal: 30,
          paddingHorizontal: 90,
        },
        tabBarStyle: {
          backgroundColor: '#fff',
          borderBottomColor: '#eee',
          borderBottomWidth: 1,
          elevation: 20,
        },
      }}
    >
      <Tab.Screen
        name='Sticks'
        component={TreeScreen}
        options={{
          tabBarLabel: 'Tree',
          title: 'sasd',
          tabBarIcon: () => (
            <MaterialCommunityIcons
              name='palm-tree'
              color={'green'}
              size={28}
            />
          ),
        }}
      />

      <Tab.Screen
        name='Notifications'
        component={NotificationScreen}
        options={{
          tabBarLabel: 'Notifications',
          title: 'sasd',
          tabBarIcon: () => (
            <TouchableOpacity onPress={() => alert('sdsdssdf')}>
              <TouchableOpacity
                onPress={() => alert('Sdfs')}
                style={{
                  position: 'absolute',
                  backgroundColor: colors.primary,
                  zIndex: 1,
                  right: -6,
                  top: -2,
                  borderRadius: 15,
                  width: 16,
                  height: 16,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderColor: 'white',
                  borderWidth: 1.5,
                }}
              >
                <Text style={{ color: 'white', fontSize: 10 }}>
                  {userdata.notifications}
                </Text>
              </TouchableOpacity>
              <MaterialCommunityIcons name='bell' color={'green'} size={24} />
            </TouchableOpacity>
          ),
        }}
      />

      <Tab.Screen
        name='Forest'
        component={ForestScreen}
        options={{
          tabBarLabel: 'Forest',
          tabBarIcon: () => (
            <Fontisto name='holiday-village' color={'green'} size={23} />
          ),
        }}
      />
    </Tab.Navigator>
  )
}
