import React, { useEffect, useState } from 'react'
import {
  FlatList,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import colors from '../config/colors'
import moment from 'moment'
import { collection, doc, getDoc, onSnapshot, query } from 'firebase/firestore'
import { database } from '../config/firebase'
import { useSelector } from 'react-redux'
import { selectUser } from '../redux/features/user'
import { Image } from 'expo-image'
import { FlashList } from '@shopify/flash-list'


export default function UserWatchersScreen({ route } ) {
  const navigation  = useNavigation()
  const [watching, setWatching] = useState([])
  const [loading, setLoading] = useState(false)
  const [shouldLoad, setShouldLoad] = useState(false)
  const userdata = useSelector(selectUser)


  // fecth watching method
  const fetchWatching = async (uid ) => {
    setLoading(true)
    const unsubUserSt = onSnapshot(collection(database, `users/${uid}/watchers`), async res => {
      const result = res.docs.map(res => {
        const id = res.id
        const data = res.data()
        return { id, ...data }
      })

      setWatching(result)
      setLoading(false)
      unsubUserSt()
    })
  }

  // search item ethod
  const usersItem = (item , index) => {
    return (
      <Pressable
        style={{
          marginHorizontal: index !== 0 ? 10 : 0,
          marginLeft: 20,
          width: '100%',
          marginVertical: 10
        }}
        onPress={() => goToPage(item)}>
        <View style={{ marginTop: 5, flexDirection: 'row', alignItems: 'center' }}>
          {item.profile ? ( // Check if profile uri exists
            <Image
              contentFit='cover'
              style={{
                width: 50,
                height: 50,
                backgroundColor: 'lightgray',
                borderRadius: 40,
              }}
              source={item.profile}
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
            <Text style={{ fontWeight: 'bold', fontSize: 13 }}>{item.fullname}</Text>
            <Text style={{ fontSize: 12, color: colors.primary }}>
              @{item.username}
            </Text>
            <Text style={{ fontSize: 10 }}>
              started watching you {moment(item?.date).fromNow()}
            </Text>
          </View>
        </View>
      </Pressable>
    )
  }


  // innit chant room
  const initChatRoom = (item ) => {
    if (item.user !== userdata.uid) navigation.navigate('RiverChatRoom', {
      data: {
        id: item.user,
        otherUser: item
      }
    })
  }


  // go to users page
   // user go to user page
   const goToPage = (item ) => {
    navigation.navigate('UserPage', {
      data: { id: item.user }
    })
  }

  useEffect(() => {
    if (route?.params?.user) fetchWatching(route?.params?.user)
  }, [])



  return (
    <View style={{
      flex: 1,
      backgroundColor: 'white'
    }}>
      {loading ? (
        <View style={{ flexDirection: 'column', justifyContent: 'center', alignItems: 'center', flex: 1, marginBottom: 50 }}>
          <ActivityIndicator color={colors.primary} size={'small'} />
          <Text style={{
            textAlign: 'center',
            marginTop: 5
          }}>Loading...</Text>
        </View>
      ) : (
        <View style={{
          flex: 1
        }}>
          <FlashList
            data={watching}
            renderItem={({ item, index }) => usersItem(item, index)}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={true}
            estimatedItemSize={100}
          />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    marginTop: 10,
  },
  container: {
    paddingLeft: 19,
    paddingRight: 16,
    paddingVertical: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  content: {
    marginLeft: 16,
    flex: 1,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignContent: 'center'
  },
  separator: {
    height: 0.5,
    backgroundColor: '#CCCCCC',
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 50,
    marginLeft: 0,
  },
  time: {
    fontSize: 11,
    color: '#808080',
    marginTop: 1,
  },
  name: {
    fontSize: 14,
    marginTop: 8,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 10,
    color: colors.primary,

    marginTop: -5,
  },
  ago: {
    fontSize: 10,
    marginTop: 5,
    color: 'black',
  },
  joined: {
    fontSize: 10,
    color: 'gray',
    marginTop: -5,
  },
})
