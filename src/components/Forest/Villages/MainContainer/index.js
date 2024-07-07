import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, Pressable, Share, Alert, ActivityIndicator, TextInput } from 'react-native'
import colors from '../../../../config/colors'
import { Image } from 'expo-image'
import moment from 'moment'
import { CommonActions, useFocusEffect, useNavigation } from '@react-navigation/native'
import ProfilePicture from '../../../ProfilePicture'
import { EvilIcons, Fontisto, Entypo, MaterialCommunityIcons, Octicons, AntDesign } from '@expo/vector-icons'
import { useDispatch, useSelector } from 'react-redux'
import { sendPushNotification } from '../../../../hooks/Notifications'
import { Timestamp, addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, updateDoc } from 'firebase/firestore'
import { database } from '../../../../config/firebase'
import { deleteStickLike, likeStickUser, likeUserCalabash } from '../../../../hooks/User'
import styles from './styles'
import { selectUser, setData, setSticks } from '../../../../redux/features/user'
import { formatDistance, subDays } from 'date-fns'
import data, { deleteForestStick, deleteUserCalabash, deleteUserStick, removeForestLike, selectUserStick, selectUsers, updateFilteredForestSticks, updateUserStick } from '../../../../redux/features/data'
import AsyncStorage from '@react-native-async-storage/async-storage'
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet'
import { Portal } from 'react-native-paper'
import { selectWatching } from '../../../../redux/features/data'
import { FlatList, TouchableOpacity } from 'react-native-gesture-handler'
import * as ImagePicker from 'expo-image-picker';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage'




const VillageMainContainer = ({ stick, user, index }) => {
  const navigation = useNavigation()
  const userdata = useSelector(selectUser)
  const [comment, setComment] = useState('')
  const [owner, setOwner] = useState(null)
  const [loadind, setLoading] = useState(false)
  const [argif, setargif] = useState([])
  const [gif, setgif] = useState(null)
  const dispatch = useDispatch()
  const [datauser, setDataUser] = useState({})
  const users = useSelector(selectUsers)
  const reportSnapPoints = useMemo(() => ['45%'], [])
  const fullActionSnapPoints = useMemo(() => ['28%', '20%'], [])
  const snapPoints2 = useMemo(() => ['25%'], [])
  const snapPoints3 = useMemo(() => ['90%'], [])
  const snapPoints = useMemo(() => ['90%'], [])
  const [tags, setTags] = useState(useSelector(selectWatching))
  const [showTags, setShowTags] = useState(false)
  const userstick = useSelector(selectUserStick)
  const [currentCount, setcurrentCount] = useState('0 / 500')
  // ref
  const reportSheetRef = (null)
  const fullSheetRef = useRef(null)
  const retweetSHeetRef = useRef(null)
  const publishSheetRef = useRef(null)
  const gifSheetRef = useRef(null)

  console.log(stick.file)
  // callbacks
  const handleSheetChanges1 = useCallback((index) => {
    if (stick.user === userdata.uid) fullSheetRef?.current?.snapToIndex(1)
  }, [])
  //console.log('stickasdadsadasdsa', stick)

  const renderBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  )

  const publishWithout = async () => {
    getOwner().then(() => {
      const postData = {
        user: userdata.uid,
        fullname: userdata.fullname,
        title: stick?.title,
        owner: {
          user: stick?.user,
          profile: owner?.profile,
          Odate: stick?.date,
          fullname: owner?.fullname,
          username: owner?.username,
          gif: stick?.cont?.gif || ''
        },
        type: 'publish',
        date: new Date().toUTCString(),
        mentinos: tags.length > 0 ? tags.length : 0,
        profile: userdata?.profile,
        content: stick?.content,
        likes: 0,
        comments: 0,
        likesId: '',
        commentsId: '',
        name: owner?.fullname,
        timestamp: Timestamp.now(),
        username: userdata?.username,
        cont: {
          gif: gif || ''
        }
      }
      addDoc(collection(database, `sticks`), postData).then((res) => {
        retweetSHeetRef?.current?.close()
      })
    }).catch((err) => {
      console.log(err)
    })

  }



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

  const getOwner = async () => {
    //console.log(stick.user)
    const data = await getDoc(doc(database, `users/${stick.user}`))
    //console.log(data.data())
    if (data) {
      setOwner(data.data())
      //console.log(data.data())
    }
  }

  const userData = async (uid) => {
    const data = (await getDoc(doc(database, `users/${uid}`))).data()
    if (data) { setDataUser(data) }
  }

  const openReportSheet = async (uid) => {
    reportSheetRef?.current?.close()
    setTimeout(() => {
      reportSheetRef.current?.expand()
    }, 500)
  }

  const showAlert = () => {
    reportSheetRef?.current?.close()
    setTimeout(() => {
      Alert.alert(
        'Thank you for reporting this Stick',
        'We will review this stick to decide wheather it violates our policies',
        [
          {
            text: 'Noted',
            onPress: () => { },
            style: 'cancel',
          },
        ]
      )
    }, 500)
  }

  // that 
  const stickPushToView = async (value) => {
    //console.log(index)
    AsyncStorage.setItem('index', String(index))
      .then(() => {
        navigation.navigate('StickComments', { data: value, index: index })
      })
  }

  // 
  const userPagePushToView = (item) => {
    userdata.uid !== item.user && navigation.navigate('UserPage', { data: { id: item.userId ? item.userId : item.user } })
  }

  // like village method
  const likeVillage = async (stick, userdata) => {
    const ownerdata = (await getDoc(doc(database, `users/${item.user}`))).data()

    const postdata = {
      date: new Date().toUTCString(),
      uid: userdata.uid,
      location: ''
    }

    try {
      // Add like to the Firestore database
      await addDoc(collection(database, `sticks/${stick.id}/likes`), postdata)
      // Update the likes count in the Firestore document
      await updateDoc(doc(database, `sticks/${stick.id}`), { likes: stick.likes + 1 })

      if (ownerdata) {
        const notification = {
          to: ownerdata.pushToken,
          content: {
            sound: 'default',
            title: `New Like`,
            body: `${userdata.fullname} liked your stick.`,
            data: {
              otherUser: userdata,
              action: stick.type === 'stick' ? 'like stick' : 'like calabash',
              itemId: stick.id,
              title: stick.title,
              content: stick.content
            },
            date: new Date().toUTCString()
          }
        }

        if (stick.user !== userdata.uid) {
          sendPushNotification(notification)
        }
      }
    } catch (error) {
      console.error("Error updating likes in Firestore: ", error)
    }
  }
  const openTags = async (text) => {
    if (tags.length > 0) {
      if (text) {
        const newData = tags.filter((item) => {
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
      const data = (await getDocs(query(collection(database, `users/${userdata.uid}/watchers`), limit(100))))

      const result = data.docs.map(doc => {
        const id = doc.id
        const data = doc.data()
        return { ...data, id }
      })

      if (result.length > 0) {
        setTags(result)
        setTagsFiltered(result)
        setShowTags(true)
      } else {
        alert('No watchers on your list yet.')
      }
    }
  }

  const setUpTags = (text) => {
    let index
    const arr = text.split(' ').map((val, i) => {
      if (val.includes('@')) return index = i
    })

    if (index === 0) {
      openTags(text)
    } else {
      index && text.split(' ')[text.split(' ').length - 1] === text.split(' ')[index]
        ? openTags(text.split(' ')[index])
        : setShowTags(false)
    }


    setComment(text)
    let count = text.length
    let appendCount = count + ' / 500'
    setcurrentCount(appendCount)
  }

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


  // add like method
  const addLike = async (stick, index) => {
    const likes = await AsyncStorage.getItem('likes')
    const userdata = JSON.parse(await AsyncStorage.getItem('userdata'))

    if (likes !== null) {
      // assign array from local storage to data array
      const data = [...JSON.parse(likes)?.data]
      let result = data.filter(item => item !== stick.id)

      if (result.length !== data.length) {
        // update data globally
        const like = stick.likes !== 0 ? stick.likes - 1 : 0
        dispatch(updateFilteredForestSticks({ index: index, liked: false, likes: like }))
        if (JSON.parse(userdata).uid === stick.user) {
          dispatch(updateUserStick({ index: index, liked: false, likes: like }))
        }

        await AsyncStorage.setItem('likes', JSON.stringify({ data: result }))
        deleteStickLike(stick, JSON.parse(userdata).uid)
      } else {
        // update stick data
        const like = stick.likes + 1
        dispatch(updateFilteredForestSticks({ index: index, liked: true, likes: like }))
        if (JSON.parse(userdata).uid === stick.user) {
          dispatch(updateUserStick({ index: index, liked: true, likes: like }))
        }
        // add stick to the local array
        result.push(stick.id)
        // updated the local storage
        await AsyncStorage.setItem('likes', JSON.stringify({ data: result }))
        likeVillage(stick)
      }
    } else {
      // update stick data
      const like = stick?.likes + 1
      dispatch(updateFilteredForestSticks({ index: index, liked: true, likes: like }))
      if (JSON.parse(userdata).uid === stick.user) {
        dispatch(updateUserStick({ index: index, liked: true, likes: like }))
      }
      await AsyncStorage.setItem('likes', JSON.stringify({ data: [stick.id] }))
      likeVillage(stick)
    }
  }
  // remove stick
  const removeStick = async (id) => {

    const stickID = stick?.owner?.id

    //console.log("publishes",)
    //console.log(stickID)
    if (stickID) {

      const ownerStick = await getDoc(doc(database, `sticks/${stickID}`))
      const data = ownerStick.data().publishes
      //console.log("own", data)
      //console.log(" removeStick",stickID)
      updateDoc(doc(database, `sticks/${stickID}`), { publishes: data - 1 })
    }
    //setShouldLoad(true)
    fullSheetRef.current?.close()
    deleteDoc(doc(database, `sticks/${id}`))
      .then(() => {
        alert('Your stick was deleted!')
        dispatch(setSticks(userdata.sticks - 1))

      })
    dispatch(deleteForestStick(id))
    const sticks = userdata.sticks > 0 ? userdata.sticks - 1 : 0
    updateDoc(doc(database, `users/${userdata.uid}`), { sticks: sticks })
    dispatch(setData({ ...userdata, sticks: sticks }))
  }

  const onShare = async (item) => {
    try {
      const result = await Share.share({
        message:
          'Checkout ' +
          item?.name || item?.title +
          "'s " +
          item?.type +
          "'  :  ' " +
          item?.descripton || item?.content +
          "' on Bashu mobile application. Download Bashu app on google PlayStore and AppStore today!",
      })
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // shared with activity type of result.activityType
        } else {
          // shared
        }
      } else if (result.action === Share.dismissedAction) {
        // dismissed
      }
    } catch (error) {
    }
  }

  return (
    <>

      <Portal>
        <BottomSheet
          ref={fullSheetRef}
          index={-1}
          snapPoints={fullActionSnapPoints}
          enablePanDownToClose={true}
          backdropComponent={renderBackdrop}
          onChange={handleSheetChanges1}
        >
          <BottomSheetView style={{
            flex: 1,
            width: '100%'
          }}>

            <View style={{ padding: 20, marginBottom: 10 }}>
              <Pressable
                style={{ flexDirection: 'row' }}
                onPress={() => {
                  fullSheetRef?.current?.close()
                  if (stick?.file) {
                    stickPushToView(stick)
                  } else {
                    stickPushToView(stick)
                  }
                }}
              >
                <MaterialCommunityIcons
                  color={colors.black}
                  size={18}
                  name={'comment-eye-outline'}
                />
                <View style={{ height: 30, marginLeft: 10 }}>
                  <Text style={{ fontSize: 16 }}>View sticks</Text>
                </View>
              </Pressable>

              <View style={{ marginTop: 5 }} />
              <Pressable
                style={{ flexDirection: 'row' }}
                onPress={() => {
                  onShare(stick)
                  fullSheetRef?.current?.close()
                }}
              >
                <MaterialCommunityIcons
                  color={colors.black}
                  size={18}
                  name={'share-all-outline'}
                />
                <View style={{ height: 30, marginLeft: 10 }}>
                  <Text style={{ color: 'black', fontSize: 16 }}>Share {stick?.type}</Text>
                </View>
              </Pressable>

              <View style={{ marginTop: 5 }} />
              <Pressable
                style={{ flexDirection: 'row' }}
                onPress={() => {
                  openReportSheet(stick.user)
                  fullSheetRef?.current?.close()
                }}
              >
                <Octicons
                  color={colors.black}
                  size={15}
                  name={'report'}
                />
                <View style={{ height: 30, marginLeft: 10 }}>
                  <Text style={{ marginTop: -3, fontSize: 16 }}>Report stick</Text>
                </View>
              </Pressable>

              <View style={{ marginTop: 5 }} />
              <Pressable
                style={{ flexDirection: 'row' }}
                onPress={() => {
                  fullSheetRef?.current?.close()
                  Alert.alert('Block @' + datauser?.username, 'Are you sure you want to block user?', [
                    {
                      text: 'Cancel',
                      onPress: () => { },
                      style: 'cancel',
                    },
                    {
                      text: 'BLOCK USER', onPress: () => {
                        Alert.alert('', 'We have recieved your request. You wont see posts from @' + datauser?.username, [
                          {
                            text: 'Noted',
                            onPress: () => { },
                            style: 'cancel',
                          },
                        ])

                      }
                    },
                  ])
                }}
              >
                <Octicons
                  color={colors.black}
                  size={15}
                  name={'report'}
                />
                <View style={{ height: 30, marginLeft: 10 }}>
                  <Text style={{ marginTop: -3, color: 'red' }}>Block @{stick?.username}</Text>
                </View>
              </Pressable>

              <View style={{ marginTop: 5 }} />
              {userdata.uid === stick.user ? (
                <Pressable
                  style={{ flexDirection: 'row' }}
                  onPress={() => removeStick(stick.id)}
                >
                  <MaterialCommunityIcons
                    color={'red'}
                    size={18}
                    name={'close'}
                  />
                  <View style={{ height: 30, marginLeft: 10 }}>
                    <Text style={{ color: 'red' }}>Delete</Text>
                  </View>
                </Pressable>
              ) : null}
            </View>
          </BottomSheetView>
        </BottomSheet>
      </Portal>

      <Portal>
        <BottomSheet
          ref={reportSheetRef}
          index={-1}
          snapPoints={reportSnapPoints}
          enablePanDownToClose={true}
          backdropComponent={renderBackdrop}
          onChange={handleSheetChanges1}
        >
          <BottomSheetView style={{
            flex: 1,
            width: '100%'
          }}>

            <View style={{ padding: 20 }}>

              <Text style={{ alignSelf: 'center', fontWeight: 'bold', marginBottom: 30 }}>REPORT STICK</Text>
              <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>Why are you reporting this stick?</Text>

              <Pressable
                style={{ flexDirection: 'row', marginBottom: 5 }}
                onPress={() => showAlert()}
              >
                <AntDesign
                  color={colors.black}
                  size={18}
                  name={'exclamationcircle'}
                />
                <View style={{ height: 30, marginLeft: 10 }}>
                  <Text>It's spam</Text>
                </View>
              </Pressable>
              <Pressable
                style={{ flexDirection: 'row', marginBottom: 5 }}
                onPress={() => showAlert()}
              >
                <AntDesign
                  color={colors.black}
                  size={18}
                  name={'exclamationcircle'}
                />
                <View style={{ height: 30, marginLeft: 10 }}>
                  <Text>I find it offensive</Text>
                </View>
              </Pressable>
              <Pressable
                style={{ flexDirection: 'row', marginBottom: 5 }}
                onPress={() => showAlert()}
              >
                <AntDesign
                  color={colors.black}
                  size={18}
                  name={'exclamationcircle'}
                />
                <View style={{ height: 30, marginLeft: 10 }}>
                  <Text style={{ marginTop: 0 }}>It is misleading</Text>
                </View>
              </Pressable>


              <Pressable
                style={{ flexDirection: 'row', marginBottom: 5 }}
                onPress={() => showAlert()}
              >
                <AntDesign
                  color={colors.black}
                  size={18}
                  name={'exclamationcircle'}
                />
                <View style={{ height: 30, marginLeft: 10 }}>
                  <Text style={{ marginTop: -3 }}>It is a scam</Text>
                </View>
              </Pressable>

              <Pressable
                style={{ flexDirection: 'row', marginBottom: 5 }}
                onPress={() => showAlert()}
              >
                <AntDesign
                  color={colors.black}
                  size={18}
                  name={'exclamationcircle'}
                />
                <View style={{ height: 30, marginLeft: 10 }}>
                  <Text style={{ marginTop: -3 }}>It is refer to a political affair</Text>
                </View>
              </Pressable>

              <Pressable
                style={{ flexDirection: 'row', marginBottom: 5 }}
                onPress={() => reportSheetRef?.current?.close()}
              >
                <View style={{ height: 30, marginLeft: 10 }}>
                  <Text style={{ marginTop: 0, color: 'red' }}>Cancel</Text>
                </View>
              </Pressable>
            </View>
          </BottomSheetView>
        </BottomSheet>
      </Portal>

      <Portal>
        <BottomSheet
          ref={retweetSHeetRef}
          index={-1}
          snapPoints={snapPoints2}
          enablePanDownToClose={true}
          backdropComponent={renderBackdrop}
          onChange={handleSheetChanges1}
        >
          <BottomSheetView style={{
            flex: 1,
            width: '100%'
          }}>
            <View style={{ marginTop: 20 }} />
            <Pressable style={{ padding: 10 }} onPress={() => {
              publishWithout()
              const stickID = stick?.params?.data ? stick?.params?.data.id : stick.id
              const publishes = stick?.params?.data ? stick?.params?.data.publishes : stick?.publishes || 0
              updateDoc(doc(database, `sticks/${stickID}`), { publishes: publishes + 1 })
            }}>
              <Text style={{ fontWeight: 'bold' }}>Publish</Text>
              <Text style={{ color: 'grey' }}>Instantly post this stick to your tree</Text>
            </Pressable>
            <Pressable style={{ padding: 10 }}
              onPress={() => {
                getOwner()

                retweetSHeetRef?.current?.close()
                publishSheetRef?.current?.expand()
              }}><Text style={{ fontWeight: 'bold' }}>Publish with Comments</Text>
              <Text style={{ color: 'grey' }}>Post this stick with comments on your tree</Text>
            </Pressable>
          </BottomSheetView>
        </BottomSheet>
      </Portal>

      <Portal>
        <BottomSheet
          ref={publishSheetRef}
          index={-1}
          snapPoints={snapPoints3}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          onChange={handleSheetChanges1}
        >
          <BottomSheetView style={{ flex: 1, width: '100%' }}>
            <View style={{ marginTop: 20 }} />
            <Text style={{ fontWeight: 'bold', alignSelf: 'center', marginBottom: 30, fontSize: 20, color: 'lightgrey' }}>Publish with comments</Text>
            <View style={{ height: '20%', width: '90%', marginLeft: '5%' }}>
              <TextInput
                multiline
                //value={comment}
                placeholder="Write your comment"
                style={{
                  width: '100%',
                  height: '50%',
                  borderWidth: 2,
                  borderColor: colors.primary,
                  borderRadius: 5,
                  padding: 10,
                }}
                onChangeText={(text) => setUpTags(text)}
              />
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
              <View style={{ flexDirection: 'row', marginTop: 10 }}>
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
              <Pressable
                onPress={() => {
                  //console.log(route)
                  const postData = {
                    user: userdata.uid,
                    title: stick.title,
                    qoute: comment,
                    owner: {
                      user: stick.user,
                      profile: owner?.profile,
                      Odate: stick.date,
                      fullname: owner?.fullname,
                      username: owner?.username,
                      id: stick?.params?.data ? stick?.params?.data.id : stick.id,
                      gif: stick?.cont?.gif || '',
                    },
                    type: 'publish',
                    date: new Date().toUTCString(),
                    mentinos: tags.length > 0 ? tags.length : 0,
                    profile: userdata?.profile,
                    content: stick?.params?.data ? stick?.params?.data.content : stick.content,
                    likes: 0,
                    comments: 0,
                    likesId: '',
                    commentsId: '',
                    name: owner?.fullname,
                    timestamp: Timestamp.now(),
                    username: userdata?.username,
                    cont: {
                      gif: gif,
                    }
                  }
                  addDoc(collection(database, `sticks`), postData)
                    .then(() => {

                      const stickID = stick?.params?.data ? stick?.params?.data.id : stick.id
                      const publishes = stick?.params?.data ? stick?.params?.data.publishes : stick?.publishes || 0
                      updateDoc(doc(database, `sticks/${stickID}`), { publishes: publishes + 1 })
                    })
                  publishSheetRef?.current?.close()
                }}
                style={{
                  position: 'relative',
                  backgroundColor: colors.primary,
                  padding: 5,
                  width: 100,
                  borderRadius: 5,
                  marginLeft: '70%',
                  marginTop: '10%',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
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
                  Publish
                </Text>
              </Pressable>
            </View>

            <View
              style={{
                marginLeft: 15,
                width: '100%',
                flexDirection: 'row',
                marginRight: 25,
                margin: 5,
                marginTop: '50%',
              }}
            >
              <Image
                contentFit="cover"
                source={user?.profile}
                style={{
                  backgroundColor: 'gray',
                  borderRadius: 50,
                  borderWidth: 2,
                  borderColor: colors.primary,
                  width: 50,
                  height: 50,
                  alignSelf: 'center',
                }}
              />
              <View style={{ marginLeft: 18, alignSelf: 'center' }}>
                <View style={{ flexDirection: 'row' }}>
                  <Text style={{ fontWeight: 'bold' }}>{owner?.fullname}</Text>
                  <Text
                    style={{
                      color: colors.primary,
                      marginLeft: 5,
                      fontSize: 10,
                      alignSelf: 'center',
                    }}
                  >
                    @{user?.username}
                  </Text>
                </View>
                <Text style={{ fontSize: 10, color: 'gray', marginTop: 5 }}>
                  Thrown {moment(stick?.params?.data ? stick?.params?.date : stick?.date).fromNow()}
                </Text>
              </View>
            </View>

            <View style={{ marginLeft: 13, padding: 5 }}>
              <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>
                {stick?.params?.data ? stick?.params?.data.title : stick?.title}
              </Text>
              <Text>
                {stick?.params?.data ? stick?.params?.data.content : stick?.content}
              </Text>
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
          onChange={handleSheetChanges1}
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


      <View style={{
        position: 'absolute',
        top: 30,
        right: 15,
      }}>
        {loadind && <ActivityIndicator size='small' color={colors.primary} />}
      </View>

      {!stick.file ? <View>
        <View style={{ flex: 1, flexDirection: 'column', marginLeft: 1, padding: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 10, width: '100%' }}>
            <View style={{ flexDirection: 'row' }}>

              {<Pressable onPress={() => userPagePushToView(stick)}>
                {<ProfilePicture image={stick.profile} size={50} />}
              </Pressable>}

              <View style={{ flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', marginLeft: 10 }}>

                <Text style={{ fontWeight: 'bold' }}>{stick.title}</Text>

                <Pressable onPress={() => userPagePushToView(stick)}>
                  <Text style={{ fontWeight: 'bold', fontSize: 12, color: colors.primary }}>@{stick.username}</Text>
                </Pressable>


                <Text style={{ color: 'black', fontSize: 10, marginTop: 5 }}>
                  {formatDistance(new Date(stick?.date).toISOString(), Date.now(), { addSuffix: true })}
                </Text>

              </View>
            </View>
            <Pressable
              onPress={() => {
                userData(stick.user);
                fullSheetRef?.current?.expand();
              }}
              style={{ flexDirection: 'row', alignSelf: 'flex-start', justifyContent: 'flex-end', marginRight: '5%' }}
            >
              <Entypo size={15} color={colors.black} name="dots-three-horizontal" />
            </Pressable>
          </View>

          <View style={{ flex: 1 }}>
            {stick.owner &&
              <Pressable onPress={() => stickPushToView(stick)}>
                <View style={{ marginBottom: 20 }}>
                  <Text style={styles.content}>{stick.qoute}</Text>
                </View>
              </Pressable>}


            {stick.cont?.gif && <View style={{ flexDirection: 'row' }}>
              <Pressable onPress={() => stickPushToView(stick)} style={{ marginBottom: 20 }}>
                <Image source={{ uri: stick.cont.gif }} style={{ contentFit: 'cover', width: 350, height: 250, borderWidth: 1 }} />
              </Pressable>
            </View>}


            <View style={{ flexDirection: 'row' }}>
              {stick.owner && <Image source={{ uri: stick.owner.profile }} style={{ width: 40, height: 40, borderRadius: 50, marginLeft: 30 }} />}
              <View>
                {stick.owner && (
                  <>
                    <Text style={{ fontWeight: 'bold', marginLeft: 10, fontSize: 12 }}>{stick.owner.fullname}</Text>
                    <Text style={{ fontWeight: 'bold', fontSize: 10, color: colors.primary, marginLeft: 10 }}>
                      @{stick.owner.username}
                    </Text>
                    <Text style={{ color: 'black', fontSize: 10, marginTop: 5, marginLeft: 10 }}>
                      {moment(stick.owner.Odate).fromNow()}
                    </Text>
                  </>
                )}
              </View>
            </View>
            <View style={{ marginTop: 10 }}>
              <View>
                {stick.owner?.gif && <Image source={{ uri: stick.owner.gif }} style={{ contentFit: 'cover', width: 300, height: 200, marginBottom: 20, marginLeft: 30 }} />}
              </View>
              <Pressable onPress={() => stickPushToView(stick)}>
                <Text style={styles.contentcomment}>{stick.content.trim()}</Text>
              </Pressable>

              <View style={{ marginLeft: 10 }}>
                <View style={{ justifyContent: 'space-between', flexDirection: 'row', paddingTop: 20, paddingLeft: 30, paddingRight: 30 }}>
                  <Pressable onPress={() => stickPushToView(stick)} style={styles.iconContainer}>
                    <EvilIcons name="comment" size={20} color={colors.primary} />
                    <Text style={styles.number}>{stick.comments}</Text>
                  </Pressable>
                  <Pressable onPress={() => retweetSHeetRef?.current?.expand()} style={styles.iconContainer}>
                    <EvilIcons name="retweet" size={25} color={colors.primary} />
                    <Text style={styles.number}>{stick.publishes}</Text>
                  </Pressable>
                  <Pressable onPress={async () => addLike(stick, index)} style={styles.iconContainer}>
                    {stick.liked ? (
                      <Fontisto name="heart" size={15} color={colors.primary} />
                    ) : (
                      <Fontisto name="heart-alt" size={15} color={colors.primary} />
                    )}
                    <Text style={styles.number}>{stick.likes}</Text>
                  </Pressable>
                  <TouchableOpacity onPress={() => onShare(stick)}>
                    <EvilIcons name="share-apple" size={25} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
        :
        <View style={{ marginVertical: 14, marginHorizontal: 15 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row' }}>
              <Pressable style={{ marginBottom: 10 }} onPress={() => userPagePushToView(stick)}>
                <ProfilePicture image={stick.profile} size={50} />
              </Pressable>

              <View style={{ marginLeft: 15 }}>
                <Pressable onPress={() => { }}>
                  <Text style={{ fontWeight: 'bold' }}>{stick.title}</Text>
                </Pressable>

                <Pressable onPress={() => userPagePushToView(stick)}>
                  <Text style={{ fontWeight: 'bold', fontSize: 10, color: colors.primary }}>
                    @{stick.username}
                  </Text>
                </Pressable>

                {stick?.date && (
                  <Text style={{ color: 'black', fontSize: 10, marginTop: 5, marginBottom: 10 }}>
                    {formatDistance(new Date(stick?.date).toISOString(), Date.now(), { addSuffix: true })}
                  </Text>
                )}
              </View>
            </View>

            <Pressable style={{ alignSelf: 'flex-start' }} onPress={() => fullSheetRef?.current?.expand()}>
              <Entypo size={15} color={colors.black} name="dots-three-horizontal" />
            </Pressable>
          </View>

          <Pressable onPress={() => stickPushToView(stick)}>
            <Image
              source={stick.file}
              contentFit="cover"
              style={{ width: 'auto', height: 350, marginHorizontal: 5, borderRadius: 14 }}
            />
          </Pressable>

          <View style={{ justifyContent: 'space-between', flexDirection: 'row', marginLeft: 0, marginTop: 20 }}>
            <View style={styles.iconContainer}>
              <EvilIcons name="comment" size={20} color="grey" />
              <Text style={styles.number}>{stick.comments}</Text>
            </View>

            <Pressable onPress={async () => addLike(stick, index)} style={styles.iconContainer}>
              {stick.liked ? (
                <Fontisto name="heart" size={13} color={colors.primary} />
              ) : (
                <Fontisto name="heart-alt" size={13} color={colors.primary} />
              )}
              <Text style={styles.number}>{stick.likes}</Text>
            </Pressable>
          </View>
        </View>
      }
    </>
  )
}


export default VillageMainContainer

