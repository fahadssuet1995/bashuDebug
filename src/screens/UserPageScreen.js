import * as React from 'react'
import {
  ActivityIndicator,
  TouchableOpacity,
  View,
} from 'react-native'
import { StyleSheet, Text } from 'react-native'
import { Tabs } from 'react-native-collapsible-tab-view'
import colors from '../config/colors'
import { useEffect, useRef, useState } from 'react'
import {
  AntDesign,
  Feather,
} from '@expo/vector-icons'

import AsyncStorage from '@react-native-async-storage/async-storage'
import { addDoc, collection, deleteDoc, doc, getDoc, onSnapshot, setDoc, updateDoc, Unsubscribe, where, query, orderBy, limit, getDocs, startAfter } from 'firebase/firestore'
import { database } from '../config/firebase'
import { useDispatch, useSelector } from 'react-redux'
import { selectUser, setWatching } from '../redux/features/user'
import { sendPushNotification } from '../hooks/Notifications'
import { useFocusEffect } from '@react-navigation/native'
import UserNavigator from '../Utils/UserNavigate'
import { Image } from 'expo-image'
import Villages from '../components/Forest'
import { selectForestStick } from '../redux/features/data'
import { FlashList } from '@shopify/flash-list'

const HEADER_HEIGHT = 160




const Header = (route  , navigation  ) => {
  const [userdata, setUserData] = useState({
    profile: '',
    fullname: '',
    username: '',
    pushToken: '',
    sticks: 0,
    watching: 0,
    watchers: 0
  })
  const [isWatching, setIsWatching] = useState(false)
  const currUser = useSelector(selectUser)
  const dispatch = useDispatch()


  // check usre who are watching
  const checkIfWatching = async () => {
    const watching = (await getDoc(doc(database, `users/${currUser.uid}/watching/${route?.params?.data.id}`)))
    if (watching.exists()) {
      setIsWatching(true)
    }
  }

  // start watching
  const watchUser = async () => {
    const postDataA = {
      user: route?.params?.data.id,
      date: new Date().toUTCString(),
      profile: userdata.profile,
      fullname: userdata.fullname,
      username: userdata.username,
      token: userdata?.pushToken ? userdata?.pushToken : ''
    }

    const postDataB = {
      user: currUser.uid,
      date: new Date().toUTCString(),
      profile: currUser.profile,
      fullname: currUser.fullname,
      username: currUser.username,
      token: currUser?.pushToken ? currUser?.pushToken : ''
    }

    // add docs watching
    setDoc(doc(database, `users/${currUser.uid}/watching/${route?.params?.data.id}`), postDataA)
      .then(async () => {
        setUserData(route?.params?.data)
        setIsWatching(true)

        // update users data
        await updateDoc(doc(database, `users/${currUser.uid}`), { watching: currUser.watching + 1 })
        // set document on the other user 
        await setDoc(doc(database, `users/${route?.params?.data.id}/watchers/${currUser.uid}`), postDataB)
        await updateDoc(doc(database, `users/${route?.params?.data.id}`), { watchers: userdata.watchers + 1 })

        dispatch(setWatching(currUser.watching + 1))

        await AsyncStorage.setItem('watching', 'yes')

        setUserData({ ...userdata, watchers: userdata.watchers + 1 })

        const notification = {
          to: userdata.pushToken,
          content: {
            sound: 'default',
            title: `New watcher`,
            body: `${currUser.fullname} started watching you.`,
            data: {
              id: currUser.uid,
              otherUser: currUser,
              action: 'new watch'
            },
            date: new Date().toUTCString()
          }
        }

        sendPushNotification(notification)
        // add notification in the doc
        addDoc(collection(database, `users/${route?.params?.data.id}/notifications`), notification.content)
      })
  }


  // start watching
  const stopWatchingUser = async () => {
    setIsWatching(false)

    // add docs watching
    deleteDoc(doc(database, `users/${currUser.uid}/watching/${route?.params?.data.id}`))
      .then(async () => {
        // delete document from the other user 
        await deleteDoc(doc(database, `users/${route?.params?.data.id}/watchers/${currUser.uid}`))
        const watching = currUser.watching !== 0 ? currUser.watching - 1 : 0
        const otherWacthing = userdata.watchers !== 0 ? userdata.watchers - 1 : 0
        // update users data
        await updateDoc(doc(database, `users/${currUser.uid}`), { watching: watching })
        await updateDoc(doc(database, `users/${route?.params?.data.id}`), { watchers: otherWacthing })

        setUserData({ ...userdata, watchers: otherWacthing })

        await AsyncStorage.setItem('watching', 'no')

        dispatch(setWatching(watching))
        setIsWatching(false)
        navigation.goBack()
      })
  }


  // innit chat
  const initChatRoom = async (item  ) => {
    navigation.navigate('RiverChatRoom', { data: { ...item, id: route?.params?.data.id } })
  }


  // listend to react navigation native hooks
  useFocusEffect(
    React.useCallback(() => {
      async function getUser(id  ) {
        const result = (await getDoc(doc(database, `users/${id}`))).data()
        if (result) {
          console.log(result)
          setUserData(result)
        }
      }

      getUser(route?.params?.data.id)
      checkIfWatching()
    }, [])
  )


  return (
    <View style={styles.header}>
      {userdata &&
        <View
          style={{
            padding: 10,
            marginTop: 15,
            flexDirection: 'row',
            left: 6,
          }}
        >
          {userdata.profile !== '' ? <TouchableOpacity onPress={() =>
            navigation.navigate('ViewPhoto', { photo: userdata.profile, name: userdata.fullname })}><Image contentFit='cover' style={styles.image} source={userdata.profile} />
          </TouchableOpacity> : <View style={styles.image} />}

          <View style={{ marginLeft: 18, justifyContent: 'center' }}>
            <View style={{}}>
              <Text style={{ fontWeight: 'bold', left: 0, color: 'black' }}>
                {userdata.fullname}
              </Text>
              <Text style={{ color: colors.primary, fontSize: 10 }}>
                @{userdata.username}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', left: -5, marginBottom: 10 }}>
              <View
                style={{ top: 10, alignItems: 'center' }}
              >
                <Text
                  style={{
                    fontWeight: 'bold',
                    color: colors.primary,
                    fontSize: 15,
                    textAlign: 'center',
                  }}
                >
                  {userdata.sticks}
                </Text>
                <Text style={{ left: 5, fontSize: 12 }}>Sticks</Text>
              </View>

              <TouchableOpacity
                style={{ top: 10, alignItems: 'center', left: 20 }}
                onPress={() => navigation.navigate('UserWatchingList', { user: route?.params.data.id })}
              >
                <Text
                  style={{
                    fontWeight: 'bold',
                    color: colors.primary,
                    fontSize: 15,
                  }}
                >
                  {userdata.watching}
                </Text>
                <Text style={{ left: 5, fontSize: 12 }}>Watching</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('UserWatchers', { user: route?.params.data.id })}
                style={{ top: 10, left: 40, alignItems: 'center' }}
              >
                <Text
                  style={{
                    fontWeight: 'bold',
                    color: colors.primary,
                    fontSize: 15,
                  }}
                >
                  {userdata.watchers}
                </Text>
                <Text style={{ left: 5, fontSize: 12 }}>Watchers</Text>
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: 15, flexDirection: 'row' }}>
              {isWatching ? (
                <>
                  <TouchableOpacity
                    onPress={() => stopWatchingUser()}
                    style={{
                      borderWidth: 1,
                      borderColor: colors.primary,
                      padding: 5,
                      borderRadius: 8,
                      alignItems: 'center',
                      width: 130,
                      height: 30,
                    }}
                  >
                    <View style={{ flexDirection: 'row' }}>
                      <Feather
                        style={{ marginLeft: 0, alignSelf: 'center' }}
                        name={'eye-off'}
                        size={15}
                        color={colors.primary}
                      />
                      <Text
                        style={{
                          fontWeight: 'bold',
                          color: colors.primary,
                          marginLeft: 5,
                          alignSelf: 'center',
                        }}
                      >
                        Stop watching
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => initChatRoom(userdata)}
                    style={{
                      backgroundColor: colors.primary,
                      padding: 5,
                      borderRadius: 8,
                      alignItems: 'center',
                      width: 100,
                      height: 30,
                      marginLeft: 4,
                    }}
                  >
                    <View style={{ flexDirection: 'row' }}>
                      <AntDesign
                        style={{
                          marginLeft: -3,
                          marginRight: 5,
                          alignSelf: 'center',
                        }}
                        color={'white'}
                        size={15}
                        name={'message1'}
                      />
                      <Text
                        style={{
                          fontWeight: 'bold',
                          color: 'white',
                          alignSelf: 'center',
                        }}
                      >
                        Start flow
                      </Text>
                    </View>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  onPress={() => watchUser()}
                  style={{
                    backgroundColor: colors.primary,
                    padding: 5,
                    borderRadius: 8,
                    alignItems: 'center',
                    width: 190,
                    height: 30,
                  }}
                >
                  <View style={{ flexDirection: 'row' }}>
                    <Feather
                      style={{ marginLeft: -8 }}
                      name={'eye'}
                      size={20}
                      color={'white'}
                    />
                    <Text
                      style={{
                        fontWeight: 'bold',
                        color: 'white',
                        marginLeft: 5,
                      }}
                    >
                      Watch
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>}
    </View>
  )
}



// maing page 
export default function UserPageScreen({ route, navigation }  ) {
  const [shouldLoad, setShouldLoad] = useState(false)
  const [isWatching, setIsWatching] = useState(false)
  const forestSticks = useSelector(selectForestStick)
  const [localSticks, setLocalSticks] = useState([])
  const [localCalabash, setLocalCalabash] = useState([])
  const [laststickdoc, setLastStickdoc] = useState (null)
  const [lastcalabashdoc, setLocalCalabashdoc] = useState (null)
  const currUser = useSelector(selectUser)
  const [userdata, setUserData] = useState ({
    profile: '',
    fullname: '',
    username: '',
    pushToken: '',
    sticks: 0,
    watching: 0,
    watchers: 0
  })
  let unsub
  const dispatch = useDispatch()


  // check usre who are watching
  const checkIfWatching = async () => {
    const docQuery = doc(database, `users/${currUser.uid}/watching/${route?.params?.data.id}`)
    unsub = onSnapshot(docQuery, snap => {
      if (snap.data()?.user) setIsWatching(true)
    })
  }


  // get local sticks method
  const getLocalCalabash = async (next ) => {
    if (next) {
      const queryCol = query(collection(database, `sticks`)
        , where('user', '==', route?.params?.data.id)
        , where('type', '==', 'calabash')
        , orderBy('timestamp', 'desc')
        , startAfter(lastcalabashdoc)
        , limit(20))

      const result = await getDocs(queryCol)

      if (result?.docs?.length > 0) {
        setLocalCalabashdoc(result.docs[result.docs.length - 1])
        const tepmlist = [...localCalabash]
        const likes = await AsyncStorage.getItem('likes')
        const likesdata = likes !== null ? [...JSON.parse(likes).data] : []

        const sticks = result.docs.map(doc => {
          const id = doc.id
          const data = doc.data()
          return { id, ...data }
        })

        // sticks.forEach(stick => tepmlist.push(stick))

        sticks.forEach((stick  ) => {
          let liked = likesdata.filter(item => item === stick.id).length > 0 ? true : false
          // let likes = likesdata.filter(item => item === stick.id).length > 0 ? stick.likes + 1 : stick.likes

          tepmlist.push({ ...stick, liked: liked, likes: stick.likes })
        })

        setLocalCalabash(tepmlist)
      }

    } else {
      const queryCol = query(collection(database, `sticks`)
        , where('user', '==', route?.params?.data.id)
        , where('type', '==', 'calabash')
        , orderBy('timestamp', 'desc')
        , limit(30))

      const result = await getDocs(queryCol)

      if (result.docs.length > 0) {
        const likes = await AsyncStorage.getItem('likes')
        const likesdata = likes !== null ? [...JSON.parse(likes).data] : []
        const templist = []

        setLastStickdoc(result.docs[result.docs.length - 1])

        const sticks = result.docs.map(doc => {
          const id = doc.id
          const data = doc.data()
          return { id, ...data }
        })

        sticks.forEach((stick  ) => {
          let liked = likesdata.filter(item => item === stick.id).length > 0 ? true : false
          // let likes = likesdata.filter(item => item === stick.id).length > 0 ? stick.likes + 1 : stick.likes

          templist.push({ ...stick, liked: liked, likes: stick.likes })
        })

        setLocalCalabash(templist)
      }
    }
  }


  // get local sticks method
  const getLocalSiticks = async (next ) => {
    if (next) {
      const queryCol = query(collection(database, `sticks`)
        , where('user', '==', route?.params?.data.id)
        , orderBy('timestamp', 'desc')
        , startAfter(laststickdoc)
        , limit(20))

      const result = await getDocs(queryCol)

      if (result.docs.length > 0) {
        setLastStickdoc(result.docs[result.docs.length - 1])

        const templist = [...localSticks]
        const likes = await AsyncStorage.getItem('likes')
        const likesdata = likes !== null ? [...JSON.parse(likes).data] : []

        const sticks = result.docs.map(doc => {
          const id = doc.id
          const data = doc.data()
          return { id, ...data }
        })


        sticks.forEach((stick  ) => {
          let liked = likesdata.filter(item => item === stick.id).length > 0 ? true : false
          let likes = likesdata.filter(item => item === stick.id).length > 0 ? stick.likes + 1 : stick.likes

          if (!stick.file) {
            templist.push({ ...stick, liked: liked, likes: likes })
          }
        })

        setLocalSticks(templist)
      }

    } else {
      const queryCol = query(collection(database, `sticks`)
        , where('user', '==', route?.params?.data.id)
        , orderBy('timestamp', 'desc')
        , limit(30))

      const result = await getDocs(queryCol)

      if (result.docs.length > 0) {
        const likes = await AsyncStorage.getItem('likes')
        const likesdata = likes !== null ? [...JSON.parse(likes).data] : []
        const templist = []

        setLastStickdoc(result.docs[result.docs.length - 1])

        const sticks = result.docs.map(doc => {
          const id = doc.id
          const data = doc.data()
          return { id, ...data }
        })

        sticks.forEach((stick  ) => {
          let liked = likesdata.filter(item => item === stick.id).length > 0 ? true : false
          let likes = likesdata.filter(item => item === stick.id).length > 0 ? stick.likes + 1 : stick.likes

          if (!stick.file) {
            templist.push({ ...stick, liked: liked, likes: likes })
          }
        })
        setLocalSticks(templist)
      }
    }
  }


  // listend to react navigation native hooks 
  useFocusEffect(
    React.useCallback(() => {
      async function getUser(id  ) {
        const result = (await getDoc(doc(database, `users/${id}`))).data()
        if (result) setUserData(result)
      }

      // if it is comming from the search page
      if (route?.params?.data?.watchers) {
        setUserData(route?.params?.data)
      } else {
        getUser(route?.params?.data.id)
        getLocalSiticks(false)
        getLocalCalabash(false)
      }

      checkIfWatching()

      return () => {
        // removing listeners 
        if (unsub) unsub()
      }
    }, [])
  )


  return (
    <Tabs.Container
      renderHeader={() => Header(route, navigation)}
      headerHeight={HEADER_HEIGHT}
    >
      <Tabs.Tab name='Sticks'>
        <View style={{
          flex: 1,
          marginTop: 200,
          paddingBottom: 50
        }}>
          {shouldLoad ? (
            <ActivityIndicator
              style={{ position: 'absolute', zIndex: 1000 }}
              size={40}
              color='red'
            />
          ) : null}
          <View style={{ zIndex: 343454353 }}>
            {/*<DropdownAlert ref={dropdownAlert} />*/}
          </View>


          {/* for vallages */}
          {isWatching ? <FlashList
            data={localSticks}
            refreshing={shouldLoad}
            estimatedItemSize={100}
            onRefresh={() => getLocalSiticks(false)}
            onEndReached={() => getLocalSiticks(true)}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => {
              return <View style={{
                height: 0.5,
                marginHorizontal: 25,
                backgroundColor: '#CCCCCC',
              }} />
            }}
            renderItem={({ item, index }) => <Villages stick={item} user={item} index={index} />}
          /> : null}
          {/* <View style={{
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: -50
          }}><Text>Watch this user first to see their sticks</Text>
          </View>} */}
        </View>
      </Tabs.Tab>

      <Tabs.Tab name='Calabash'>
        <View style={{
          flex: 1,
          marginTop: 200,
        }}>
          {/* for vallages */}
          {isWatching ? <FlashList
            data={localCalabash}
            refreshing={shouldLoad}
            estimatedItemSize={100}
            onRefresh={() => getLocalCalabash(false)}
            onEndReached={() => getLocalCalabash(true)}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => {
              return <View style={{
                height: 0.5,
                marginHorizontal: 25,
                backgroundColor: '#CCCCCC',
              }} />
            }}
            renderItem={({ item, index }) => <Villages stick={item} user={item} index={index} />}
          /> : null}
          {/* <View style={{
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: -50
          }}><Text>Watch this user first to see their calabash</Text>
          </View>} */}
        </View>
      </Tabs.Tab>
    </Tabs.Container>
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
  box: {
    height: 250,
    width: '100%',
  },
  boxA: {
    backgroundColor: 'white',
  },
  boxB: {
    backgroundColor: '#D8D8D8',
  },
  header: {
    height: 145,
    width: '100%',
    backgroundColor: colors.white,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 100,
  },
  newStickContainer: {
    flexDirection: 'row',
    padding: 15,
  },

  stickInput: {
    height: 80,
    maxHeight: 300,
  },
  inputsContainer: {
    marginLeft: 10,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: colors.primary,
    padding: 7,
    width: 280,
    backgroundColor: colors.light,
  },
  fieldText: {
    height: 20,
    top: 1,
    color: '#787D8B',
    width: 100,
    fontSize: 12,
  },
  titleSelectField: {
    fontSize: 16,
    color: '#0A0914',
    height: 24,
    width: 140,
  },
})
