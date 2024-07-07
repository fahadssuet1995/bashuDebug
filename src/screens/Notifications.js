
import React from 'react'
import { Text, View, Pressable } from 'react-native'
import colors from '../config/colors'
import moment from 'moment'
import { useSelector } from 'react-redux'
import { selectNotification } from '../redux/features/notifications'
import { selectUser } from '../redux/features/user'
import { FlashList } from '@shopify/flash-list'
import { Image } from 'expo-image'


export default function NotificationScreen({ navigation } ) {
  const userNotifications = useSelector(selectNotification)
  const userdata = useSelector(selectUser)


  const FlatListItemSeparator = () => {
    return (
      <View
        style={{
          height: 0.3,
          width: '100%',
          backgroundColor: 'grey',
        }}
      />
    )
  }


  // notification item
  // search item ethod
  const usersItem = (item , index) => {
    return (
      <Pressable
        style={{
          marginHorizontal: index !== 0 ? 10 : 0,
          marginLeft: 10,
          width: '100%',
          marginVertical: 10
        }}
        onPress={() => onSelected(item)}>
        <View style={{ marginTop: 5, flexDirection: 'row', alignItems: 'center' }}>
          {item?.data.otherUser.profile ? ( // Check if profile uri exists
            <Image
              contentFit='cover'
              style={{
                width: 50,
                height: 50,
                backgroundColor: 'lightgray',
                borderRadius: 40,
              }}
              source={item?.data.otherUser.profile}
            />
          ) : <View style={{
            width: 50,
            height: 50,
            backgroundColor: 'lightgray',
            borderRadius: 40
          }}></View>}
          <View style={{
            flexDirection: 'column',
            justifyContent: 'center',
            marginLeft: 8
          }}>
            <Text style={{ fontWeight: 'bold', fontSize: 13 }}>{item?.data.otherUser.fullname}</Text>
            <Text style={{ fontSize: 12, color: colors.primary }}>
              @{item?.data.otherUser.username}
            </Text>
            <Text style={{ fontSize: 12 }}>
              {item.body}
            </Text>
            <Text style={{ fontSize: 10 }}>
              {moment(item?.date).fromNow()}
            </Text>
          </View>

        </View>
      </Pressable>
    )
  }


  // on selected notification
  const onSelected = (item ) => {
    switch (item.data.action) {
      case 'new watch':
        navigation.navigate('UserPage', {
          data: {
            fullname: item.data.otherUser.fullname,
            profile: item.data.otherUser.profile,
            pushToken: item.data.otherUser.pushToken,
            sticks: item.data.otherUser.stiiks,
            id: item.data.otherUser.uid,
            username: item.data.otherUser.username,
            villages: item.data.otherUser.villages,
            watchers: item.data.otherUser.watchers,
            watching: item.data.otherUser.watching,
          }
        })
        break
      case 'stick tag':
        navigation.navigate('StickComments', {
          data: {
            id: item.data.itemId,
            content: item.data.content,
            title: item.data.title,
            user: item.data.otherUser.uid,
            profile: item.data.otherUser.profile
          }
        })
        break
      case 'like stick':
        navigation.navigate('StickComments', {
          data: {
            id: item.data.itemId,
            content: item.data.content,
            title: item.data.title,
            user: item.data.otherUser.uid,
            profile: item.data.otherUser.profile
          }
        })
        break
      case 'like calabash':
        navigation.navigate('StickComments', {
          data: {
            id: item.data.itemId,
            description: item.data.description,
            title: item.title,
            file: item.data.file,
            user: item.data.otherUser.uid,
            profile: item.data.otherUser.profile
          }
        })
        break
      case 'tag calabash':
        navigation.navigate('StickComments', {
          data: {
            id: item.data.itemId,
            description: item.data.content,
            title: item.data.title,
            file: item.data.file,
            user: userdata.uid,
            profile: item.data.otherUser.profile
          }
        })
        break

      case 'river stick':
        navigation.navigate('RiverChatRoom', {
          data: {
            id: item.data.id,
            otherUser: item.otherUser
          }
        })
        break
    }
  }



  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      {userNotifications.length === 0 ? (
        <Text style={{ marginTop: 100, alignSelf: 'center' }}>
          No notification
        </Text>
      ) : null}

      <View style={{ padding: 0, flex: 1 }}>
        {userNotifications.length > 0 && <FlashList
          data={userNotifications}
          // onEndReached={() => getUsers(true)}
          ItemSeparatorComponent={FlatListItemSeparator}
          renderItem={({ item, index }) => usersItem(item, index)}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={true}
          estimatedItemSize={100}
        />
        }
      </View>
    </View>
  )
}
