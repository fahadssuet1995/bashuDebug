/**
 * If you are not familiar with React Navigation, check out the 'Fundamentals' guide:
 * https://reactnavigation.org/docs/getting-started
 *
 */
import 'react-native-gesture-handler'
import {
  createStackNavigator
} from '@react-navigation/stack'

import * as React from 'react'
import { View } from 'react-native'
import SignInScreen from '../screens/SignInScreen'
import RegisterScreen from '../screens/RegisterScreen'
import RegisterFinalScreen from '../screens/RegisterFinalScreen'
import StickCommentsScreen from '../screens/StickCommentsScreen'
import TreeTabs from './TopTabNavigator'
import NewRiverFlowScreen from '../screens/NewRiverFlowScreen'
import RiverChatRoom from '../screens/RiverChatRoomScreen'
import NewCalabash from '../screens/NewCalabashScreen'
import ProfileScreen from '../screens/ProfileScreen'
import UserPageScreen from '../screens/UserPageScreen'
import TitleSticksScreen from '../screens/TitleSticksScreen'
import SearchScreen from '../screens/SearchScreen'
import UserWatchingListScreen from '../screens/UserWatchingListScreen'
import UserWatchersScreen from '../screens/UserWatchersScreen'
import StickReplyScreen from '../screens/SticksReplyScreen'
import AboutScreen from '../screens/AboutScreen'
import TermsScreen from '../screens/TermsScreen'
import PrivacyScreen from '../screens/PrivacyScreen'

import {
  FontAwesome5,
  MaterialIcons,
  MaterialCommunityIcons,
} from '@expo/vector-icons'
import MainHeaderButtons from '../components/HeaderNavigation'
import ViewPhotoScreen from '../screens/ViewPhotoScreen'

// Read more here: https://reactnavigation.org/docs/modal
const Stack = createStackNavigator()

export default function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
        headerStyle: { backgroundColor: '#fff', elevation: 0 },
      }}
    >
      <Stack.Screen
        name='Root'
        component={TreeTabs}
        options={{
          title: 'Bashu',
          headerRight: () => <MainHeaderButtons />
        }}
      />
      <Stack.Screen name='RegisterFinal' component={RegisterFinalScreen} />
      {/* <Stack.Screen name='NewStick' component={NewStickScreen} /> */}
      <Stack.Screen name='Register' component={RegisterScreen} />
      <Stack.Screen name='TermsAndConditions' component={TermsScreen} />
      <Stack.Screen name='Privacy' component={PrivacyScreen} />

      <Stack.Screen
        name='NewRiverFlow'
        options={({ route }) => ({
          title: 'Start flow',
          headerRight: () => (
            <View
              style={{
                flexDirection: 'row',
                width: 100,
                justifyContent: 'space-between',
                marginRight: 10,
              }}
            >
              <FontAwesome5 name='video' size={22} color={'white'} />
              <MaterialIcons name='call' size={22} color={'white'} />
              <MaterialCommunityIcons
                name='dots-vertical'
                size={22}
                color={'white'}
              />
            </View>
          ),
        })}
        component={NewRiverFlowScreen}
      />

      <Stack.Screen
        name='AboutBashu'
        options={() => ({
          title: 'About Bashu',
          headerRight: () => (
            <View
              style={{
                flexDirection: 'row',
                width: 100,
                justifyContent: 'space-between',
                marginRight: 10,
              }}
            >
              <FontAwesome5 name='video' size={22} color={'white'} />
              <MaterialIcons name='call' size={22} color={'white'} />
              <MaterialCommunityIcons
                name='dots-vertical'
                size={22}
                color={'white'}
              />
            </View>
          ),
        })}
        component={AboutScreen}
      />

      <Stack.Screen
        name='TitleSticks'
        options={() => ({
          title: 'Sticks',
          headerRight: () => (
            <View
              style={{
                flexDirection: 'row',
                width: 100,
                justifyContent: 'space-between',
                marginRight: 10,
              }}
            >
              <FontAwesome5 name='video' size={22} color={'white'} />
              <MaterialIcons name='call' size={22} color={'white'} />
              <MaterialCommunityIcons
                name='dots-vertical'
                size={22}
                color={'white'}
              />
            </View>
          ),
        })}
        component={TitleSticksScreen}
      />

      <Stack.Screen
        name='UserWatchingList'
        options={() => ({
          title: 'Watching',
          headerRight: () => (
            <View
              style={{
                flexDirection: 'row',
                width: 100,
                justifyContent: 'space-between',
                marginRight: 10,
              }}
            >
              <FontAwesome5 name='video' size={22} color={'white'} />
              <MaterialIcons name='call' size={22} color={'white'} />
              <MaterialCommunityIcons
                name='dots-vertical'
                size={22}
                color={'white'}
              />
            </View>
          ),
        })}
        component={UserWatchingListScreen}
      />

      <Stack.Screen
        name='StickReplyScreen'
        options={() => ({
          title: 'Replies',
          headerRight: () => (
            <View
              style={{
                flexDirection: 'row',
                width: 100,
                justifyContent: 'space-between',
                marginRight: 10,
              }}
            >
              <FontAwesome5 name='video' size={22} color={'white'} />
              <MaterialIcons name='call' size={22} color={'white'} />
              <MaterialCommunityIcons
                name='dots-vertical'
                size={22}
                color={'white'}
              />
            </View>
          ),
        })}
        component={StickReplyScreen}
      />

      <Stack.Screen
        name='UserWatchers'
        options={() => ({
          title: 'Watchers',
          headerRight: () => (
            <View
              style={{
                flexDirection: 'row',
                width: 100,
                justifyContent: 'space-between',
                marginRight: 10,
              }}
            >
              <FontAwesome5 name='video' size={22} color={'white'} />
              <MaterialIcons name='call' size={22} color={'white'} />
              <MaterialCommunityIcons
                name='dots-vertical'
                size={22}
                color={'white'}
              />
            </View>
          ),
        })}
        component={UserWatchersScreen}
      />

      <Stack.Screen
        name='ProfileScreen'
        options={() => ({
          title: 'My Profile',
          headerRight: () => (
            <View
              style={{
                flexDirection: 'row',
                width: 100,
                justifyContent: 'space-between',
                marginRight: 10,
              }}
            >
              <FontAwesome5 name='video' size={22} color={'white'} />
              <MaterialIcons name='call' size={22} color={'white'} />
              <MaterialCommunityIcons
                name='dots-vertical'
                size={22}
                color={'white'}
              />
            </View>
          ),
        })}
        component={ProfileScreen}
      />

      <Stack.Screen
        name='ViewPhoto'
        options={() => ({
          title: 'Profile Picture',
        })}
        component={ViewPhotoScreen}
      />

      <Stack.Screen
        name='UserPage'
        options={() => ({
          title: 'Profile',
          headerRight: () => (
            <View
              style={{
                flexDirection: 'row',
                width: 100,
                justifyContent: 'space-between',
                marginRight: 10,
              }}
            >
              <FontAwesome5 name='video' size={22} color={'white'} />
              <MaterialIcons name='call' size={22} color={'white'} />
              <MaterialCommunityIcons
                name='dots-vertical'
                size={22}
                color={'white'}
              />
            </View>
          ),
        })}
        component={UserPageScreen}
      />

      <Stack.Screen
        name='Search'
        options={() => ({
          title: 'Search',
          headerRight: () => [],
        })}
        component={SearchScreen}
      />

      <Stack.Screen
        name='NewCalabash'
        options={() => ({
          title: 'Add image',
          headerRight: () => (
            <View
              style={{
                flexDirection: 'row',
                width: 100,
                justifyContent: 'space-between',
                marginRight: 10,
              }}
            >
              <FontAwesome5 name='video' size={22} color={'white'} />
              <MaterialIcons name='call' size={22} color={'white'} />
              <MaterialCommunityIcons
                name='dots-vertical'
                size={22}
                color={'white'}
              />
            </View>
          ),
        })}
        component={NewCalabash}
      />
      <Stack.Screen
        name='RiverChatRoom'
        options={() => ({
          title: 'Flow',
          headerRight: () => (
            <View
              style={{
                flexDirection: 'row',
                width: 100,
                justifyContent: 'space-between',
                marginRight: 10,
              }}
            >
              <FontAwesome5 name='video' size={22} color={'white'} />
              <MaterialIcons name='call' size={22} color={'white'} />
              <MaterialCommunityIcons
                name='dots-vertical'
                size={22}
                color={'white'}
              />
            </View>
          ),
        })}
        component={RiverChatRoom}
      />

      <Stack.Screen
        name='StickComments'
        component={StickCommentsScreen}
        options={() => ({
          title: 'Sticks',
          headerRight: () => (
            <View
              style={{
                flexDirection: 'row',
                width: 100,
                justifyContent: 'space-between',
                marginRight: 10,
              }}
            >
              <FontAwesome5 name='video' size={22} color={'white'} />
              <MaterialIcons name='call' size={22} color={'white'} />
              <MaterialCommunityIcons
                name='dots-vertical'
                size={22}
                color={'white'}
              />
            </View>
          ),
        })}
      />
      <Stack.Screen
        name='SignIn'
        component={SignInScreen}
      />
    </Stack.Navigator>
  )
}