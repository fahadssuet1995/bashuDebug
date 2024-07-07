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
import { TextInput } from 'react-native-gesture-handler'
import { AntDesign } from '@expo/vector-icons'
import { collection, onSnapshot } from 'firebase/firestore'
import { database } from '../config/firebase'
import { useSelector } from 'react-redux'
import { selectUser } from '../redux/features/user'
import { Image } from 'expo-image'
import { FlashList } from '@shopify/flash-list'


export default function NewRiverFlowScreen() {
  const navigation = useNavigation()
  const [watching, setWatching] = useState([])
  const [watchingTemp, setWatchingTemp] = useState([])
  const [loading, setLoading] = useState(false)
  const [shouldLoad, setShouldLoad] = useState(false)
  const [searchText, setSearchText] = useState('')
  const userdata = useSelector(selectUser)



  // fetching users who are watching this user
  const fetchWatchers = async () => {
    setLoading(true)
    const unsubUserSt = onSnapshot(collection(database, `users/${userdata.uid}/watchers`), async res => {
      const result = res.docs.map(res => {
        const id = res.id
        const data = res.data()
        return { id, ...data }
      })

      setWatching(result)
      setWatchingTemp(result)
      setLoading(false)
      unsubUserSt()
    })
  }


  // init chat room
  const initChatRoom = async (user) => {
    navigation.navigate('RiverChatRoom', {
      data: {
        id: user.user,
        otherUser: user
      }
    })
  }

  // saearch for user who watchign
  const searchWatching = (text) => {
    if (text) {
      const newData = watching.filter((item) => {
        const itemData = item.fullname ?
          item.fullname.toUpperCase() : ''.toUpperCase()
        const textData = text.toUpperCase()
        return itemData.indexOf(textData) > -1
      })

      setWatchingTemp(newData)
      setSearchText(text)
    } else {
      setWatchingTemp(watching)
      setSearchText(text)
    }
  }


  // search item ethod
  const usersItem = (item, index) => {
    return (
      <Pressable
        style={{
          marginHorizontal: index !== 0 ? 10 : 0,
          marginLeft: 20,
          width: '100%',
          marginVertical: 10
        }}
        onPress={() => initChatRoom(item)}>
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


  useEffect(() => {
    fetchWatchers()
  }, [])




  return (
    <View style={{
      flex: 1,
      backgroundColor: 'white'
    }}>
      <View style={{ backgroundColor: 'white', padding: 5 }}>
        <View
          style={{
            borderWidth: 1,
            borderRadius: 40,
            padding: 5,
            marginLeft: 15,
            marginRight: 15,
            flexDirection: 'row',
          }}
        >
          <AntDesign
            size={20}
            style={{ alignSelf: 'center', marginLeft: 5 }}
            name={'search1'}
          />
          <TextInput
            style={{ marginLeft: 10, marginRight: 45, width: '85%', height: 30, padding: 5 }}
            placeholder={'Search for your watchers'}
            onChangeText={(text) => searchWatching(text)}
            value={searchText}
          />
        </View>
      </View>
      {shouldLoad ? (
        <ActivityIndicator
          style={{ position: 'absolute', zIndex: 1000 }}
          size={40}
          color='red'
        />
      ) : null}
      {loading ? (
        <View style={{ marginTop: 20 }}>
          <ActivityIndicator color={colors.primary} size={'small'} />
        </View>
      ) : (
        <FlashList
          data={watchingTemp}
          renderItem={({ item, index }) => usersItem(item, index)}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={true}
          estimatedItemSize={100}
        />
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
    paddingVertical: 12,
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
    marginBottom: 6,
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
  },
  ago: {
    fontSize: 10,
    paddingTop: 16,
    color: 'gray',
  },
})
