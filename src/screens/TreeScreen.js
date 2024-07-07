import RiverFeed from '../components/RiverFeed'
import * as React from 'react'
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Keyboard,
  Pressable,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import * as Device from 'expo-device'
import { StyleSheet, Text } from 'react-native'
import { Tabs } from 'react-native-collapsible-tab-view'
import colors from '../config/colors'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {Ionicons, Entypo} from '@expo/vector-icons'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import * as Notifications from 'expo-notifications'
import { useDispatch, useSelector } from 'react-redux'
import user, { selectUser, setData, setNotify, setPushtoken, setSticks } from '../redux/features/user'
import { addDoc, collection, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query, startAfter, Timestamp, Unsubscribe, updateDoc, where } from 'firebase/firestore'
import { database } from '../config/firebase'
import { registerForPushNotifications, sendPushNotification } from '../hooks/Notifications'
import { selectLoading, selectUserCalabash, selectUserStick, selectWatching, setUserCalabsh, setUserStick } from '../redux/features/data'
import titles from '../data/titles'
import AsyncStorage from '@react-native-async-storage/async-storage'
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet'
import { FlashList } from '@shopify/flash-list'
import { Portal } from 'react-native-paper'
import { Image } from 'expo-image'
import Villages from '../components/Forest'
import { ScrollView } from 'react-native-gesture-handler'
import * as ImagePicker from 'expo-image-picker';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage'



const HEADER_HEIGHT = 120

// tree header
const Header = () => {
  const navigation  = useNavigation()
  const userdata = useSelector(selectUser)


  return (
    <View style={styles.header}>
      <View
        style={{
          padding: 10,
          marginTop: 15,
          flexDirection: 'row',
          left: 6,
        }}
      >
        {userdata.profile !== '' && <TouchableOpacity activeOpacity={.4} onPress={() => navigation.navigate('ProfileScreen')}>
        <Image contentFit='cover' style={styles.image} source={userdata.profile} />
        </TouchableOpacity>}

        <View style={{ marginLeft: 18, justifyContent: 'center' }}>
          <View style={{}}>
            <Text style={{ fontWeight: 'bold', left: 0, color: 'black' }}>
              {userdata.fullname}
            </Text>
            <Text style={{ color: colors.primary, fontSize: 10, top: -2 }}>
              @{userdata.username}
            </Text>
          </View>

          <View style={{
            flexDirection: 'row',
            marginBottom: 10,
            justifyContent: 'space-between',
            width: '80%'
          }}>
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
              onPress={() => navigation.navigate('UserWatchingList', { user: userdata.uid })}
              style={{
                zIndex: 129990,
                top: 10,
                alignItems: 'center',
              }}
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
              onPress={() => navigation.navigate('UserWatchers', { user: userdata.uid })}
              style={{ top: 10, alignItems: 'center' }}
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


          <View style={{
            flexDirection: 'row',
            position: 'absolute',
            top: 2,
            left: 138
          }}>
          </View>
        </View>
      </View>
    </View>
  )
}


export default function TreeScreen() {
  const [stick, setStick] = useState('')
  const [title, setTitle] = useState('')
  const [search, setSearch] = useState('')
  const userdata = useSelector(selectUser)
  const [shouldLoad, setShouldLoad] = useState(false)
  const navigation  = useNavigation()
  const [currentCount, setcurrentCount] = useState('0 / 1500')
  const dispatch = useDispatch()
  const notificationListener  = React.useRef()
  const responseListener  = React.useRef()
  let unsubUserSt
  const dataLoading = useSelector(selectLoading)
  const [filtered, setFiltered] = useState(titles)
  const [all, setAll] = useState(titles)
  const [locked, setLocked] = useState(false)
  const dim = Dimensions.get('screen').height
  const [tagUser, setTagUser] = useState ([])
  const userstick = useSelector(selectUserStick)
  const usercalabash = useSelector(selectUserCalabash)
  const [laststickdoc, setLastStickdoc] = useState(null)
  const [lastcalabashdoc, setLastCalabashdoc] = useState(null)
  const [tags, setTags] = useState(useSelector(selectWatching))
  const [tagsfiltered, setTagsFiltered] = useState ([])
  const [showTags, setShowTags] = useState(false)
  const [showTitle, setShowTitle] = useState(false)
  const snapPoints = useMemo(() => ['90%'], [])
  const snapPoints2 = useMemo(() => ['90%'], [])
  const [gif, setgif] = useState(null)
  const gifSheetRef = useRef(null)
  const [argif, setargif] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  

  // ref
  const topicsSheetRef = useRef(null)


  // callbacks
  const handleSheetChanges = useCallback((index ) => {
    index === -1 && topicsSheetRef?.current?.close()
  }, [])


  const renderBackdrop = useCallback(
    (props ) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  )

  const renderGifItem = ({ item }) => (
    <Pressable style={{
      flex: 1,
      margin: 5,
      aspectRatio: 1,
    }} onPress={() => setGif(item.images.fixed_height.url)}>
      <View >
        <Image source={{ uri: item.images.fixed_height.url }} style={{
          width: '100%',
          height: '100%',
        }} />
      </View>
    </Pressable>
  );


  const giphy = async (type, search) => {
    let url;

    if (type === 'search') {
      url = `https://api.giphy.com/v1/gifs/search?api_key=wgHO8cn0YThj94MgDu2tt9CWNTedZcNZ&q=${search}&limit=25&offset=0&rating=g&lang=en&bundle=messaging_non_clips`;
    } else if (type === 'trending') {
      url = `https://api.giphy.com/v1/gifs/trending?api_key=wgHO8cn0YThj94MgDu2tt9CWNTedZcNZ&limit=25&offset=0&rating=g&bundle=messaging_non_clips`;
    }

    if (url) {
      try {
        const response = await fetch(url);
        const data = await response.json();
        setargif(data.data);
        //setgif(data.data[2].images.original.url);
      } catch (error) {
        console.error('Error fetching data from Giphy API:', error);
      }
    }
  };

  const setGif = (url) => {
    //console.log(url)
    setgif(url)
    gifSheetRef.current?.close()
  }

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });


    if (!result.canceled) {
      setgif(result.assets[0].uri);
      await uploadImageAsync(result.assets[0].uri)
    }
  };

  async function uploadImageAsync(uri) {
    // Why are we using XMLHttpRequest? See:
    // https://github.com/expo/expo/issues/2402#issuecomment-443726662
    const blob = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        resolve(xhr.response);
      };
      xhr.onerror = function (e) {
        console.log(e);
        reject(new TypeError("Network request failed"));
      };
      xhr.responseType = "blob";
      xhr.open("GET", uri, true);
      xhr.send(null);
    });

    const fileRef = ref(getStorage(), `images/${userdata.uid}`);
    const result = await uploadBytes(fileRef, blob);

    // We're done with the blob, close and release it
    blob.close();

    setGif(await getDownloadURL(fileRef))
  }

  // get data
  const getData = async () => {
    const result = (await getDoc(doc(database, `users/${userdata.uid}`))).data()

    const data = {
      username: result.username,
      uid: userdata.uid,
      fullname: result.fullname,
      profile: result.profile,
      sticks: result.sticks || 0,
      watching: result.watching || 0,
      watchers: result.watchers || 0,
      villages: result.villages || 0,
      pushToken: result.pushToken || '',
      notifications: 0
    }

    dispatch(setData(data))
    await AsyncStorage.setItem('userdata', JSON.stringify(data))
  }

  // listend to react navigation native hooks
  useFocusEffect(
    React.useCallback(() => {
      console.log('focus')
      async function getLocked() {
        const locked = await AsyncStorage.getItem('locked')
        if (locked !== null) {
          setTitle(JSON.parse(locked).title)
          setLocked(JSON.parse(locked).locked)
        }
      }

      getLocked()
      getSticks(false)
      getCalabash(false)
      getData()

      return () => {
        // removing listeners
        if (unsubUserSt) unsubUserSt()
      }
    }, [])
  )

  // filter user method
  const filterTitle = (text ) => {
    if (text) {
      // Inserted text is not blank
      // Filter the masterDataSource
      // Update FilteredDataSource
      const newData = all.filter((item) => {
        const itemData = item.name
          ? item.name.toUpperCase()
          : ''.toUpperCase()
        const textData = text.toUpperCase()
        return itemData.indexOf(textData) > -1
      })

      setFiltered(newData)
      setSearch(text)
    } else {
      // Inserted text is blank
      // Update FilteredDataSource with masterDataSource
      setFiltered(all)
      setSearch(text)
    }
  }

  // use effect to fire some action on the go
  useEffect(() => {
    async function getLocked() {
      const locked = await AsyncStorage.getItem('locked')
      if (locked !== null) {
        setTitle(JSON.parse(locked).title)
        setLocked(JSON.parse(locked).locked)
      }
    }

    // AsyncStorage.removeItem('notifications')
    // notificaiton set up
    const notificationSettUp = () => {
      // AsyncStorage.removeItem('notifications')
      registerForPushNotifications().then((token) => {

        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
          }),
        })

        if (userdata.pushToken === '' || userdata.pushToken === undefined) {
          dispatch(setPushtoken(token))
          // updating data on firestore
          updateDoc(doc(database, `users/${userdata.uid}`), { pushToken: token })
        }

        // This listener is fired whenever a user taps on or interacts with a notification (works when app is foregrounded, backgrounded, or killed)
        responseListener.current = Notifications.addNotificationResponseReceivedListener(async response => {
          const budge = await Notifications.getBadgeCountAsync()
          //decreasing the badge count
          await Notifications.setBadgeCountAsync(budge - 1)

          dispatch(setNotify(userdata.notifications > 0 ? userdata.notifications - 1 : userdata.notifications))

          switch (response?.notification?.request.content.data.action) {
            case 'like stick':
              navigation.navigate('StickComments', {
                data: {
                  id: response?.notification?.request?.content.data.itemId,
                  content: response?.notification?.request?.content.data.content,
                  title: response?.notification?.request?.content.data.title,
                  otherUser: response?.notification?.request?.content.data.otherUser,
                }
              })
              break
            case 'like calabash':
              navigation.navigate('StickComments', {
                data: {
                  id: response?.notification?.request?.content.data.itemId,
                  description: response?.notification?.request?.content.data.description,
                  title: response?.notification?.request?.content.data.title,
                  file: response?.notification?.request?.content.data.file,
                  user: userdata.uid
                }
              })
              break

            case 'new watch':
              navigation.navigate('UserPage', {
                data: {
                  id: response?.notification?.request?.content.data.id,
                }
              })
              break

            case 'tag calabash':
              navigation.navigate('StickComments', {
                data: {
                  id: response?.notification?.request?.content.data.itemId,
                  description: response?.notification?.request?.content.data.content,
                  title: response?.notification?.request?.content.data.title,
                  file: response?.notification?.request?.content.data.file,
                  user: userdata.uid
                }
              })
              break


            case 'river stick':
              navigation.navigate('RiverChatRoom', {
                data: {
                  id: response?.notification?.request?.content.data.id,
                  otherUser: response?.notification?.request.content.data.otherUser
                }
              })
              break

            case 'stick tag':
              navigation.navigate('StickComments', {
                data: {
                  id: response?.notification?.request?.content.data.itemId,
                  content: response?.notification?.request?.content.data.content,
                  title: response?.notification?.request?.content.data.title,
                  otherUser: response?.notification?.request?.content.data.otherUser
                }
              })
              break
          }
        })

        // This listener is fired whenever a notification is received while the app is foregrounded
        notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
          dispatch(setNotify(userdata.notifications + 1))
        })

        return () => {
          Notifications.removeNotificationSubscription(notificationListener.current)
          Notifications.removeNotificationSubscription(responseListener.current)
        }
      })
    }

    if (Device.isDevice) {
      notificationSettUp()
    }

    getLocked()
    getWatchers()
  }, [])



  const showSuccess = (msg ) => {
    Alert.alert('success', msg)
  }



  // method that will be used to throw a stick
  const onThrowStick2 = async () => {
    if (title === '') {
      alert('Please select topic')
    } else if (stick === '') {
      alert('Stick content required.')
    } else {
      if (stick?.split('').length > 1499) return alert('Your stick exceeds 1500 characters, review and try again')

      const postData = {
        user: userdata.uid,
        title: title,
        content: stick,
        type: 'stick',
        mentions: tags?.length > 0 ? tags?.length : 0,
        date: new Date().toUTCString(),
        profile: userdata.profile,
        likes: 0,
        publishes: 0,
        comments: 0,
        likesId: '',
        timestamp: Timestamp.now(),
        commentsId: '',
        username: userdata.username,
        cont: {
          gif: gif,
        }
      }

      await addDoc(collection(database, `sticks`), postData)
        .then((res) => {
          updateDoc(doc(database, `users/${userdata.uid}`), { sticks: userdata.sticks + 1 })
          dispatch(setSticks(userdata.sticks + 1))
          dispatch(addForestStick(postData))

          setNotification(res)

          setStick('')
          setTitle('')
          setIsLoading(false)
          setgif('')

          showSuccess('Stick posted with success')
        })
        .catch(e => { })
    }
  }

  const onThrowStick = async () => {
    if (title === '') {
      Alert.alert('Error', 'Please select topic')
    } else if (stick === '') {
      Alert.alert('Error', 'Stick content is empty')
    } else {
      if (stick.split('').length > 1499) return alert('Your stick exceeds 1500 characters, review and try again')

      setShouldLoad(true)

      const postData = {
        user: userdata.uid,
        title: title,
        content: stick,
        type: 'stick',
        mentinos: tags.length > 0 ? tags.length : 0,
        date: new Date().toUTCString(),
        profile: userdata.profile,
        likes: 0,
        publishes: 0,
        comments: 0,
        likesId: '',
        commentsId: '',
        timestamp: Timestamp.now(),
        username: userdata.username,
        cont: {
          gif: gif,
        }
      }

      await addDoc(collection(database, `sticks`), postData)
        .then((res) => {
          // const templist = [...userstick]
          // templist.push(postData)
          // dispatch(setUserStick(templist))

          // get sticks
          getSticks(false)

          updateDoc(doc(database, `users/${userdata.uid}`), { sticks: userdata.sticks + 1 })
          dispatch(setSticks(userdata.sticks + 1))

          if (tagUser.length > 0) {
            tagUser.forEach(async (tag) => {
              const notification = {
                to: tag?.pushToken,
                content: {
                  sound: 'default',
                  title: `You were tagged`,
                  body: `${userdata.fullname} tagged you on a stick.`,
                  data: {
                    otherUser: userdata,
                    action: 'stick tag',
                    itemId: res.id,
                    title: title,
                    content: stick
                  },
                  date: new Date().toUTCString()
                }
              }

              if (tag.uid !== userdata.uid) {
                sendPushNotification(notification)
                await addDoc(collection(database, `users/${tag.uid}/notifications`), notification.content)
              }
            })
          }

          // reset tags
          setTagUser([])

          setStick('')
          setShouldLoad(false)
        })
    }
  }


  // get user watchers
  const getWatchers = async () => {
    const data = (await getDocs(query(collection(database, `users/${userdata.uid}/watchers`), limit(100))))

    const result = data.docs.map(doc => {
      const id = doc.id
      const data = doc.data()
      return { ...data, id }
    })

    setTags(result)
    setTagsFiltered(result)
  }


  // open tags
  const openTags = async (text ) => {
    if (tags.length > 0) {
      if (text) {
        const newData = tags.filter((item ) => {
          const itemData = item.username
            ? item.username.toUpperCase()
            : ''.toUpperCase()
          const textData = text.split('@')[1].toUpperCase()
          return itemData.indexOf(textData) > -1
        })

        setTagsFiltered(newData)
        setShowTags(true)
      } else {
        // Inserted text is blank
        // Update FilteredDataSource with masterDataSource
        setTagsFiltered(tags)
        setShowTags(false)
      }
    } else {
      const data = (await getDocs(query(collection(database, 'users'), limit(100))))

      const result = data.docs.map(doc => {
        const id = doc.id
        const data = doc.data()
        return { ...data, id }
      })

      setTags(result)
      setTagsFiltered(result)
      setShowTags(true)
    }
  }


  // set tags method
  const setUpTags = (text ) => {
    let index
    const arr = text.split(' ').map((val , i ) => {
      if (val.includes('@')) return index = i
    })

    if (index === 0) {
      openTags(text)
    } else {
      index && text.split(' ')[text.split(' ').length - 1] === text.split(' ')[index]
        ? openTags(text.split(' ')[index])
        : setShowTags(false)
    }
    setStick(text)
    let count = text.length
    let appendCount = count + ' / 1500'
    setcurrentCount(appendCount)
  }

  // get local sticks method
  const getCalabash = async (next ) => {
    const userdata = await AsyncStorage.getItem('userdata')

    if (next) {
      const queryCol = query(collection(database, `sticks`)
        , where('user', '==', JSON.parse(userdata).uid)
        , where('type', '==', 'calabash')
        , orderBy('timestamp', 'desc')
        , startAfter(lastcalabashdoc)
        , limit(20))

        const docs = await (await getDocs(queryCol)).docs

        if (docs?.length > 0) {
          setLastCalabashdoc(docs[docs?.length - 1])
        const tepmlist = [...usercalabash]
        const likes = await AsyncStorage.getItem('likes')
        const likesdata = likes !== null ? [...JSON.parse(likes).data] : []

        const sticks = docs.map(doc => {
          const id = doc.id
          const data = doc.data()
          return { id, ...data }
        })

        sticks.forEach(stick => tepmlist.push(stick))

        sticks.forEach((stick ) => {
          let liked = likesdata.filter(item => item === stick.id)?.length > 0 ? true : false
          let likes = likesdata.filter(item => item === stick.id)?.length > 0 ? stick.likes + 1 : stick.likes
          tepmlist.push({ ...stick, liked: liked, likes: likes })
        })

        dispatch(setUserCalabsh(tepmlist))
      }

    } else {
      const queryCol = query(collection(database, `sticks`)
        , where('user', '==', JSON.parse(userdata).uid)
        , where('type', '==', 'calabash')
        , orderBy('timestamp', 'desc')
        , limit(30))

        const docs = await (await getDocs(queryCol)).docs

        if (docs?.length > 0) {
        const likes = await AsyncStorage.getItem('likes')
        const likesdata = likes !== null ? [...JSON.parse(likes).data] : []
        const templist = []

        setLastCalabashdoc(docs[docs?.length - 1])

        const sticks = result.docs.map(doc => {
          const id = doc.id
          const data = doc.data()
          return { id, ...data }
        })

        sticks.forEach((stick ) => {
          let liked = likesdata.filter(item => item === stick.id)?.length > 0 ? true : false
          let likes = likesdata.filter(item => item === stick.id)?.length > 0 ? stick.likes + 1 : stick.likes
          templist.push({ ...stick, liked: liked, likes: likes })
        })

        dispatch(setUserCalabsh(templist))
      }
    }
  }


  // get local sticks method
  const getSticks = async (next ) => {
    const userdata = await AsyncStorage.getItem('userdata')

    if (next) {
      const queryCol = query(collection(database, `sticks`)
        , where('user', '==', JSON.parse(userdata).uid)
        , orderBy('timestamp', 'desc')
        , startAfter(laststickdoc)
        , limit(20))

      const templist = [...userstick]
      const likes = await AsyncStorage.getItem('likes')
      const likesdata = likes !== null ? [...JSON.parse(likes).data] : []

      const docs = await (getDocs(queryCol)).docs

      if (docs?.length > 0) {
        setLastStickdoc(docs[docs?.length - 1])

        const result = docs.map(doc => {
          const id = doc.id
          const data = doc.data()
          return { id, ...data }
        })

        result.forEach((stick) => {
          let liked = likesdata.filter(item => item === stick.id)?.length > 0 ? true : false
          // let likes = likesdata.filter(item => item === stick.id).length > 0 && stick.user !== JSON.parse(userdata).uid ? stick.likes + 1 : stick.likes

          if (!stick.file) {
            templist.push({ ...stick, liked: liked, likes: stick.likes })
          }
        })

        dispatch(setUserStick(templist))
      }
    } else {
      const queryCol = query(collection(database, `sticks`)
        , where('user', '==', JSON.parse(userdata).uid)
        , orderBy('timestamp', 'desc')
        , limit(30))

      const templist = []
      const likes = await AsyncStorage.getItem('likes')
      const likesdata = likes !== null ? [...JSON.parse(likes).data] : []

      const docs = await (await getDocs(queryCol)).docs

      if (docs?.length > 0) {
        setLastStickdoc(docs[docs?.length - 1])

        const result = docs.map(doc => {
          const id = doc.id
          const data = doc.data()
          return { id, ...data }
        })

          result.forEach((stick ) => {
            let liked = likesdata.filter(item => item === stick.id)?.length > 0 ? true : false
          // let likes = likesdata.filter(item => item === stick.id).length > 0 && stick.user !== JSON.parse(userdata).uid ? stick.likes + 1 : stick.likes

          if (!stick.file) {
            templist.push({ ...stick, liked: liked, likes: stick.likes })
          }
        })

        dispatch(setUserStick(templist))
      }
    }
  }


  return (
    <Tabs.Container
      renderHeader={() => <Header />}
      headerHeight={HEADER_HEIGHT}
    // optional
    >

      <Tabs.Tab name='Sticks'>
        <View style={{
          marginTop: 180,
          flex: 1
        }}>
          {shouldLoad || dataLoading ? (
            <ActivityIndicator
              style={{
                position: 'absolute',
                zIndex: 10000000,
                alignSelf: 'center',
                left: 180,
                top: 20
              }}
              size='small'
              color='#5d8ecf'
            />
          ) : null}

          <View style={{ zIndex: 343454353 }}></View>

          {/* for sticks */}
          <FlashList
            data={userstick}
            refreshing={shouldLoad}
            estimatedItemSize={100}
            onRefresh={() => getSticks(false)}
            onEndReached={() => getSticks(true)}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => {
              return <View style={{
                height: 0.5,
                marginHorizontal: 25,
                backgroundColor: '#CCCCCC',
              }} />
            }}
            renderItem={({ item, index }) => {
              return <Villages stick={item} user={item} index={index} />
            }}
          />

          <TouchableOpacity
            onPress={() => topicsSheetRef?.current?.expand()}
            style={{
              position: 'absolute',
              bottom: 30,
              right: 20,
              backgroundColor: colors.primary,
              padding: 5,
              borderRadius: 100,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Ionicons name={'add-circle'} color={'white'} size={30} />
            <Text
              style={{
                color: 'white',
                fontWeight: 'bold',
                textAlign: 'center',
                alignItems: 'center',
                paddingRight: 5,
              }}
            >
              Throw stick
            </Text>
          </TouchableOpacity>
        </View>

        <Portal>
        <BottomSheet
          ref={topicsSheetRef}
          index={-1}
          snapPoints={snapPoints2}
          enablePanDownToClose={true}
          backdropComponent={renderBackdrop}
          onChange={(index) => {
            if (index === -1) topicsSheetRef?.current?.close();
          }}
        >
          <BottomSheetView style={{ flex: 1, width: '100%' }}>
            <View style={{ marginTop: 20 }} />
            <Text style={{ fontWeight: 'bold', alignSelf: 'center', marginBottom: 30, fontSize: 20, color: 'lightgrey' }}>Throw a Stick</Text>

            {showTitle && <ScrollView> 

              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between'
              }}>
                <TouchableOpacity onPress={() => setShowTitle(!showTitle)} style={{
                  margin: 10,
                  marginHorizontal: 20,
                  marginBottom: 20,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Text style={{
                    fontSize: 14
                  }}> {title !== '' ? title : 'Select topic'}</Text>
                  <Ionicons
                    name={'chevron-down'}
                    color={'#0A0914'}
                    size={20}
                    style={{
                      marginLeft: 10
                    }}
                  />

                  <Entypo
                    onPress={async () => {
                      if (locked) {
                        await AsyncStorage.setItem('locked', JSON.stringify({ title: '', locked: false }))
                          .then(() => {
                            setLocked(false)
                          })
                      } else {
                        if (title !== '') {
                          await AsyncStorage.setItem('locked', JSON.stringify({ title: title, locked: true }))
                            .then(() => {
                              setLocked(true)
                            })
                        }
                      }
                    }}
                    name={locked ? 'lock' : 'lock-open'}
                    color={locked ? colors.medium : colors.primary}
                    size={20}
                    style={{
                      marginLeft: 10
                    }}
                  />
                </TouchableOpacity>

                <Image source={{ uri: userdata.profile }} style={{
                  height: 40,
                  width: 40,
                  marginRight: 20,
                  borderRadius: 50
                }} />
              </View>

              <TextInput multiline={true} placeholder='Write your stick' style={{
                width: '90%',
                height: 100,
                borderWidth: 2,
                borderColor: colors.primary,
                borderRadius: 5,
                padding: 10,
                marginHorizontal: 20
              }}
                onChangeText={(text) => setUpTags(text)}
              />

              <Text style={{
                marginLeft: 20,
                fontSize: 12,
                marginTop: 5,
                color: colors.primary
              }}>{currentCount}</Text>

              {gif && <View>
                <View style={{ flexDirection: 'row', padding: 10 }}>
                  <Image source={{ uri: gif }} style={{
                    width: 100,
                    height: 100,
                  }} />
                  <Pressable style={{ height: 20, width: 20 }}>
                    <Text style={{ color: 'red', marginLeft: 10 }} onPress={() => {
                      setGif(null)
                      setGif('')
                    }}>X</Text>
                  </Pressable>
                </View>
              </View>}

              <View style={{ flexDirection: 'row', marginTop: 10, marginHorizontal: 20 }}>
                <Pressable
                  onPress={() => {
                    //addComment('comment')
                    //commentSheetRef?.current?.close()
                    giphy('trending', '');
                    gifSheetRef?.current?.expand()
                  }}
                  style={{
                    padding: 5,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Text
                    style={{
                      color: 'grey',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      alignItems: 'center',
                    }}
                  >
                    GIFS
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    pickImage()
                  }}
                  style={{
                    
                    padding: 5,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Text
                    style={{
                      color: 'grey',
                      fontWeight: 'bold',
                      fontSize: 15,
                      textAlign: 'center',
                      alignItems: 'center',
                    }}
                  >
                    Add image
                  </Text>
                </Pressable>
              </View>

              <TouchableOpacity
                onPress={() => {
                  onThrowStick()
                  topicsSheetRef?.current?.close()
                }}
                style={{
                  position: 'relative',
                  backgroundColor: colors.primary,
                  padding: 5,
                  width: 100,
                  borderRadius: 5,
                  marginLeft: 250,
                  marginTop: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Text
                  style={{
                    color: 'white',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    alignItems: 'center',
                  }}
                >
                  Throw stick
                </Text>
              </TouchableOpacity>
            </ScrollView>}

            {!showTitle && <>
              <TextInput multiline={true} placeholder='Search topic' style={{
                width: '90%',
                marginHorizontal: 20,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: colors.primary,
                borderRadius: 5,
                paddingVertical: 10,
                paddingHorizontal: 20

              }}
                onChangeText={(text) => filterTitle(text)}
              />
              <FlashList
                data={filtered}
                estimatedItemSize={50}
                renderItem={({ item, index }) => {
                  return (
                    <>
                      <TouchableOpacity onPress={async () => {
                        setTitle(item.name)
                        setShowTitle(!showTitle)

                        if (locked) {
                          await AsyncStorage.setItem('locked', JSON.stringify({ title: item.name, locked: true }))
                            .then(() => {
                              setLocked(true)
                            })
                        }
                      }} style={{
                        height: 25,
                        marginHorizontal: 20,
                        marginVertical: 5
                      }}>
                        <Text>{item.name}</Text>
                      </TouchableOpacity>


                      {index === filtered?.length - 1 &&
                        <TouchableOpacity key={item.id} onPress={async () => setShowTitle(!showTitle)} style={{
                          marginHorizontal: 20,
                          marginVertical: 5,
                          padding: 15,
                          borderRadius: 10,
                          backgroundColor: colors.danger
                        }}>
                          <Text style={{ color: 'white', textAlign: 'center' }}>Cancel</Text>
                        </TouchableOpacity>
                      }
                    </>
                  )
                }}
              />
            </>}

            {showTags && <View style={{
              height: 350,
              marginHorizontal: 20,
              borderRadius: 20,
              marginBottom: 40
            }}>
              <Text style={{
                fontSize: 15,
                marginLeft: 20,
                fontWeight: 'bold'
              }}>Tag your watchers</Text>
              <FlashList
                data={tagsfiltered}
                estimatedItemSize={50}
                renderItem={({ item }) => {
                  return (
                    <TouchableOpacity key={item.id} onPress={async () => {
                      setTagUser([...tagUser, { user: item.username, uid: item.id, pushToken: item.token }])
                      const content = stick.split(' ')
                      content[content?.length - 1] = tagUser[tagUser?.length - 1]?.user ?
                        `@${tagUser[tagUser?.length - 1].user} ` : `@${item.username} `

                      setStick(content.join(' '))
                      setShowTags(false)
                    }} style={{
                      height: 25,
                      marginHorizontal: 20,
                      marginVertical: 15
                    }}>
                      <View style={{
                        flexDirection: 'row',
                        justifyContent: 'flex-start',
                        marginLeft: 5,
                        alignItems: 'center',
                      }}>
                        <Image source={{ uri: item.profile }} style={{
                          width: 40,
                          height: 40,
                          borderRadius: 50,
                          marginRight: 10,
                        }} />
                        <Text>{item?.username}</Text>
                      </View>

                    </TouchableOpacity>
                  )
                }}
              />
            </View>}

            <View style={{
              marginBottom: 35
            }}>
            </View>
          </BottomSheetView>
        </BottomSheet>
      </Portal>

      <Portal>
        <BottomSheet
          ref={gifSheetRef}
          index={-1}
          snapPoints={snapPoints}
          enablePanDownToClose={true}
          backdropComponent={renderBackdrop}
          onChange={(index) => {
            if (index === -1) gifSheetRef?.current?.close();
          }}
        >
          <BottomSheetView style={{
            flex: 1,
            width: '100%'
          }}>
            <TextInput
              style={{ borderColor: colors.primary, borderWidth: 1, margin: 10, height: 40 }}
              onChangeText={(text) => giphy('search', text)}></TextInput>
            <FlatList
              data={argif}
              renderItem={renderGifItem}
              keyExtractor={item => item.id}
              numColumns={3} // Set the number of columns for the grid
              contentContainerStyle={{ paddingHorizontal: 10 }}
            />
          </BottomSheetView>
        </BottomSheet>
      </Portal>
      </Tabs.Tab>

      <Tabs.Tab name='Calabash'>
        <View style={{
          marginTop: 180,
          flex: 1
        }}>
          {/* for vallages */}
          <FlashList
            data={usercalabash}
            refreshing={shouldLoad}
            estimatedItemSize={100}
            onRefresh={() => getCalabash(false)}
            onEndReached={() => getCalabash(true)}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => {
              return <View style={{
                height: 0.5,
                marginHorizontal: 25,
                backgroundColor: '#CCCCCC',
              }} />
            }}
            renderItem={({ item, index }) => <Villages stick={item} user={item} index={index} />}
          />
        </View>

        {shouldLoad || dataLoading ? (
          <ActivityIndicator
            style={{
              position: 'absolute',
              zIndex: 10000000,
              alignSelf: 'center',
              left: 180,
              top: 30
            }}
            size={40}
            color='red'
          />
        ) : null}

        <TouchableOpacity
          onPress={() => navigation.navigate('NewCalabash')}
          style={{
            position: 'absolute',
            bottom: 30,
            right: 20,
            backgroundColor: colors.primary,
            padding: 5,
            borderRadius: 100,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Ionicons name={'add-circle'} color={'white'} size={30} />
          <Text
            style={{
              color: 'white',
              fontWeight: 'bold',
              textAlign: 'center',
              alignItems: 'center',
              paddingRight: 5,
            }}
          >
            Add Image
          </Text>
        </TouchableOpacity>
      </Tabs.Tab>

      <Tabs.Tab name='River'>
        <Tabs.ScrollView>
          <RiverFeed user={userdata.uid} />
        </Tabs.ScrollView>

        <TouchableOpacity
          onPress={() => navigation.navigate('NewRiverFlow')}
          style={{
            position: 'absolute',
            bottom: 30,
            right: 20,
            backgroundColor: colors.primary,
            padding: 5,
            borderRadius: 100,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Ionicons name={'add-circle'} color={'white'} size={30} />
          <Text
            style={{
              color: 'white',
              fontWeight: 'bold',
              textAlign: 'center',
              alignItems: 'center',
              paddingRight: 5,
            }}
          >
            Start Flow
          </Text>
        </TouchableOpacity>
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
    height: HEADER_HEIGHT,
    width: '100%',
    backgroundColor: colors.white,
    elevation: 15,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 100,
    borderColor: colors.primary,
    borderWidth: 2,
  },
  newStickContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
  },

  stickInput: {
    padding: 10,
  },
  inputsContainer: {
    marginLeft: 10,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: colors.primary,
    padding: 10,
    width: '90%',
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

