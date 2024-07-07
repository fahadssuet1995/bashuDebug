import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Share,
  Pressable,
  Linking
} from 'react-native'
import {
  EvilIcons,
  Ionicons, Entypo, Fontisto
} from '@expo/vector-icons'
import { Text, View } from '../components/Themed'
import colors from '../config/colors'
import titles from '../data/titles'
import moment from 'moment'
import { useDispatch, useSelector } from 'react-redux'
import { selectUser } from '../redux/features/user'
import { addDoc, collection, doc, getDoc, getDocs, startAfter, limit, onSnapshot, orderBy, query, updateDoc, Timestamp, deleteDoc, queryEqual } from 'firebase/firestore'
import { database } from '../config/firebase'
import StickReplyItem from '../components/StickReply/Item'
import { sendPushNotification } from '../hooks/Notifications'
import { deleteStickLike } from '../hooks/User'
import AsyncStorage from '@react-native-async-storage/async-storage'
import data, { selectWatching, updateFilteredForestSticks } from '../redux/features/data'
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet'
import { FlashList } from '@shopify/flash-list'
import { Image } from 'expo-image'
import { useFocusEffect } from '@react-navigation/native'
import { Unsubscribe } from 'firebase/database'
import { Icon } from 'react-native-paper'
import { FlatList } from 'react-native-gesture-handler'
import * as ImagePicker from 'expo-image-picker';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage'
import uuid from 'uuid'
import { reload } from 'firebase/auth'



export default function StickCommentsScreen({ navigation, route }) {
  const [search, setSearch] = useState('')
  const [showNoSticksMessage, setShowNoSticksMessage] = useState(false)
  const [shouldShowIndicator, setShouldShowIndicator] = useState(false)
  const [comment, setComment] = useState('')
  const [title, setTitle] = useState('')
  const [image, setImage] = useState(null);
  const [mentionTarget, setMentionTarget] = useState(0)
  const [shouldLoad, setShouldLoad] = useState(false)
  const userdata = useSelector(selectUser)
  const [comments, setComments] = useState([])
  const [owner, setOwner] = useState(null)
  const [lastreplydoc, setLastReplydoc] = useState(null)
  const [lastcommentdoc, setLastCommentdoc] = useState(null)
  const [showTitle, setShowTitle] = useState(false)
  const [filtered, setFiltered] = useState(titles)
  const [all, setAll] = useState(titles)
  const [locked, setLocked] = useState(false)
  const [currentCount, setcurrentCount] = useState('0 / 500')
  const dim = Dimensions.get('screen').height
  const [tagUser, setTagUser] = useState([])
  const [gif, setgif] = useState(null)
  const [argif, setargif] = useState([])
  const [tags, setTags] = useState(useSelector(selectWatching))
  const [tagsfiltered, setTagsFiltered] = useState([])
  const [showTags, setShowTags] = useState(false)
  const snapPoints = useMemo(() => ['90%'], [])
  const snapPoints2 = useMemo(() => ['30%'], [])
  const snapPoints3 = useMemo(() => ['90%'], [])
  const snapPoints4 = useMemo(() => ['100%'], [])
  const [refresh, setRefresh] = useState(false);
  const [uri, setUri] = useState([]);
  const dispatch = useDispatch()
  let unsub
  // ref
  const commentSheetRef = useRef(null)
  const retweetSHeetRef = useRef(null)
  const publishSheetRef = useRef(null)
  const gifSheetRef = useRef(null)
  const openRef = useRef(null)

  useEffect(() => {
    console.log(route.params.data)
    if (refresh) {
      // Trigger the screen to reload or refresh your component
      // You can fetch the updated data or perform any necessary actions here
      // After the actions are completed, reset the refresh state
      setRefresh(false);
    }
  }, [refresh]);



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
    console.log(url)
    setgif(url)
    gifSheetRef.current?.close()
  }

  const openGif = async (src) => {
    setUri(src)
    openRef.current?.expand()
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

  const renderGifItem = ({ item }) => (
    <TouchableOpacity style={styles.gifItem} onPress={() => setGif(item.images.fixed_height.url)}>
      <View >
        <Image source={{ uri: item.images.fixed_height.url }} style={styles.gifImage} />
      </View>
    </TouchableOpacity>
  );
  // callbacks
  const handleSheetChanges = useCallback((index) => {

  }, [])

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

  const onThrowStick = async () => {
    if (stick === '') {
      Alert.alert('Error', 'Stick content is empty')
    } else {
      setShouldLoad(true)

      const postData = {
        user: userdata.uid,
        content: stick,
        type: 'stick',
        mentinos: tags.length > 0 ? tags.length : 0,
        date: new Date().toUTCString(),
        profile: userdata.profile,
        likes: 0,
        comments: 0,
        likesId: '',
        commentsId: '',
        timestamp: Timestamp.now(),
        username: userdata.username,
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

  // get stick data
  const getComments = async (next, refresh) => {
    if (next === 'yes') {
      const templist = [...comments]
      const likes = await AsyncStorage.getItem('replies')
      const likesdata = likes !== null ? [...JSON.parse(likes).data] : []

      const queryCol = query(collection(database, `sticks/${route?.params?.data.id}/comments`)
        , orderBy('timestamp', 'desc')
        , startAfter(lastcommentdoc)
        , limit(20))

      const docs = (await getDocs(queryCol)).docs

      if (docs.length > 0) {
        const result = docs.map(doc => {
          const id = doc.id
          const data = doc.data()
          return { id, ...data }
        })

        result.forEach((comment) => {
          let liked = likesdata.filter(item => item === comment.id).length > 0 ? true : false
          templist.push({ ...comment, liked: liked, likes: comment.likes })
        })

        setComments(templist)
        result.length > 0 && setLastCommentdoc(docs[docs.length - 1])
      }

    } else {
      refresh && setShouldShowIndicator(true)

      const templist = [...comments]
      const likes = await AsyncStorage.getItem('replies')
      const likesdata = likes !== null ? [...JSON.parse(likes).data] : []

      const queryCol = query(collection(database, `sticks/${route?.params.data.id}/comments`)
        , orderBy('timestamp', 'desc')
        , limit(20))


      const docs = (await getDocs(queryCol)).docs

      const result = docs.map(doc => {
        const id = doc.id
        const data = doc.data()
        return { id, ...data }
      })


      result.forEach((comment) => {
        let liked = likesdata.filter(item => item === comment.id).length > 0 ? true : false
        templist.push({ ...comment, liked: liked, likes: comment.likes })
      })


      setComments(templist)

      result.length > 0 && setLastCommentdoc(docs[docs.length - 1])
      shouldLoad && setShouldShowIndicator(false)
    }
  }


  // push data to firebase collection
  const pushComment = async (type, data, stickId) => {
    return await addDoc(collection(database, `sticks/${route?.params?.data.id}/comments`), data)
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



  // add comment to the cala
  const addComment = async (type) => {
    if (comment === '') {
      alert('Cannot post comment, fields are empty.')
    } else {

      const postData = {
        user: userdata.uid,
        comment: comment,
        stick: route?.params?.data.id,
        owner: {
          uid: route?.params?.data.user,
          profile: owner.profile
        },
        title: title,
        fullname: userdata.fullname,
        timestamp: Timestamp.now(),
        type: 'stick',
        profile: userdata.profile,
        date: new Date().toUTCString(),
        mentions: tags.length > 0 ? tags.length : 0,
        username: userdata.username,
        likes: 0,
        comments: 0,
        cont: {
          gif: gif,
          //image: ''
        }
      }

      pushComment(type, postData, route?.params?.data.id)
        .then(async (res) => {
          getComments('no', false)
          // update stick comment count
          await updateDoc(doc(database, `sticks/${route?.params?.data.id}`), { comments: route?.params?.data.comments + 1 })

          const notification = {
            to: owner.pushToken,
            content: {
              sound: 'default',
              title: `New stick`,
              body: `${userdata.fullname} commented on your stick.`,
              data: {
                otherUser: userdata,
                action: 'like stick',
                itemId: route?.params?.data.id,
                title: title,
                content: route?.params?.data.content,
                profile: route?.params?.data.profile
              },
              date: new Date().toUTCString()
            }
          }

          // add notification to the user's collenction
          // only if the current logged in user is not the owner of the comment
          if (userdata.uid !== route?.params?.data.user) {
            sendPushNotification(notification)
            // add notification in the doc
            addDoc(collection(database, `users/${route?.params?.data.user}/notifications`), notification.content)
          }

          setShouldLoad(false)

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
                    itemId: route?.params?.data.id,
                    title: title,
                    content: route?.params?.data.content
                  },
                  date: new Date().toUTCString()
                }
              }

              // send tags notification to the user
              if (tag.uid !== userdata.uid) {
                sendPushNotification(notification)
                await addDoc(collection(database, `users/${tag.uid}/notifications`), notification.content)
              }
            })
          }

          // reset tags
          setTagUser([])

          setComment('')
        }).catch((e) => {
          console.log(e)
          alert('Could not post commnet, please try again later.')
        })
    }
  }


  // get watchers
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

  // delete comment 
  const deleteComment = async (id, index) => {
    await deleteDoc(doc(database, `sticks/${route?.params?.data.id}/comments/${id}`))
    // update comments list
    getComments('no', false)
    const comment = route?.params?.data.comments > 0 ? route?.params?.data.comments - 1 : 0
    await updateDoc(doc(database, `sticks/${route?.params?.data.id}`), { comments: comment })
  }


  // set up tage method
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


  // filter user method
  const filterTitle = (text) => {
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

  // listen to doc change
  const docChange = () => {
    unsub = onSnapshot(query(collection(database, `sticks/${route?.params?.data.id}/comments`)), snap => {

      // const result = snap.docChanges().map(doc => {
      //   const id = doc.doc.id
      //   const data = doc.doc.data()
      //   return { id, ...data }
      // })

      // const templist = [...comments]

      // result.forEach(item => {
      //   comments.filter((comment, index) => {
      //     // update the value once condition has been found
      //     if (comment.id === item.id) templist[index] = item
      //   })
      // })

      // setComments(templist)

      getComments('no', false)
    })
  }

  const likeVillage = async (item) => {
    // getting owner data from local storage
    // const ownerdata = (await getDoc(doc(database, `users/${item.user}`))).data()
    const ownerdata = await AsyncStorage.getItem('userdata')

    const postdata = {
      date: new Date().toUTCString(),
      uid: userdata.uid,
      location: ''
    }

    addDoc(collection(database, `sticks/${item.id}/likes`), postdata)
      .then(async (res) => {
        // update user's rate
        await updateDoc(doc(database, `sticks/${item.id}`), { likes: item.likes + 1 })
      })
  }

  const addLike = async (stick, index) => {
    console.log(index)
    // AsyncStorage.removeItem('likes')
    const likes = await AsyncStorage.getItem('likes')
    const userdata = await AsyncStorage.getItem('userdata')
    console.log(likes)
    if (likes !== null) {
      // assign array from local storage to data array
      const data = [...JSON.parse(likes)?.data]
      let result = data.filter(item => item != stick.id)

      if (result.length !== data.length) {
        console.log("not equal")
        // update data globally
        const like = stick.likes !== 0 ? stick.likes - 1 : 0
        dispatch(updateFilteredForestSticks({ index: index, liked: false, likes: like }))
        await AsyncStorage.setItem('likes', JSON.stringify({ data: result }))
        deleteStickLike(stick, JSON.parse(userdata).uid)
      } else {
        console.log("equal")
        // update stick data
        const like = stick.likes + 1
        dispatch(updateFilteredForestSticks({ index: index, liked: true, likes: like }))
        // add stick to the local array
        result.push(stick.id)
        // updated the local storage
        await AsyncStorage.setItem('likes', JSON.stringify({ data: result }))
        likeVillage(stick)
      }
    } else {
      // update stick data
      const like = stick.likes + 1
      dispatch(updateFilteredForestSticks({ index: index, liked: true, likes: like }))
      await AsyncStorage.setItem('likes', JSON.stringify({ data: [stick.id] }))
      likeVillage(stick)
    }
    setRefresh(true);

  }


  // listend to react navigation native hooks
  useFocusEffect(
    useCallback(() => {

      async function getLocked() {
        const locked = await AsyncStorage.getItem('locked')
        if (locked !== null) {
          setTitle(JSON.parse(locked).title)
          setLocked(JSON.parse(locked).locked)
        }
      }

      if (route?.params?.data) {
        getComments('no', false)
      } else if (route?.params) {
        getComments('no', false)
      }


      async function getOwner() {
        const data = await getDoc(doc(database, `users/${route?.params?.data.user}`))
        if (data) return setOwner(data.data())
      }

      // get owners data
      getOwner()

      // get locked title
      getLocked()
      // get watchers
      getWatchers()

      docChange()

      return () => {
        if (unsub) unsub()
      }
    }, [])
  )


  // update lieks
  const updateLikes = (comment) => {
    const templist = [...comments]
    templist[comment.index].likes = comment.likes
    templist[comment.index].liked = comment.liked
    setComments(templist)
  }

  return (
    <View style={{ flex: 1 }}>
      {shouldLoad &&
        <View
          style={{
            backgroundColor: colors.primary,
            alignItems: 'center',
            padding: 3,
            marginBottom: 2,
            position: 'absolute',
            zIndex: 10000,
            width: '100%',
          }}
        >
          <Text style={{ color: 'white', fontSize: 10 }}>Throwing...</Text>
        </View>}

      {!route?.params?.data.owner && <View>
        <View style={{ marginLeft: 15, width: '100%', flexDirection: 'row', marginRight: 25, margin: 5, marginTop: 10, }}>
          <Image
            contentFit='cover'
            source={route?.params?.data.profile}
            style={{ backgroundColor: 'gray', borderRadius: 50, borderWidth: 2, borderColor: colors.primary, width: 50, height: 50, alignSelf: 'center', }} />
          <View style={{ marginLeft: 18, alignSelf: 'center' }}>
            <View style={{ flexDirection: 'row' }}>
              <Text style={{ fontWeight: 'bold' }}>{owner?.fullname}</Text>
              <Text style={{ color: colors.primary, marginLeft: 5, fontSize: 12, alignSelf: 'center', }}>
                @{owner?.username}
              </Text>
            </View>
            <Text style={{ fontSize: 10, color: 'gray', marginTop: 5 }}>
              Thrown {moment(route?.params?.data.date).fromNow()}
            </Text>
          </View>
        </View>
        <Text style={{ fontWeight: 'bold', marginBottom: 10, fontSize: 12, marginLeft: 30 }}>
          {route?.params?.data ? route?.params?.data.title : route?.params?.title}
        </Text>
        {route?.params?.data?.cont?.gif &&
          <Pressable onPress={() => openRef.current.expand()}>
            <View style={{ marginBottom: 20, marginLeft: 13 }}>
              <Image source={{ uri: route.params.data.cont?.gif }} style={{ resizeMode: 'cover', width: 350, height: 250, borderWidth: 1 }} />
            </View>
          </Pressable>}
        <Text style={{ marginLeft: 30 }}>{route?.params?.data ? route?.params?.data.content : route?.params?.content}</Text>

        <View style={{ width: '100%', height: 50, borderColor: 'lightgray', borderWidth: 1, alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', padding: 8, marginTop: 10 }}>
          <TouchableOpacity style={{ padding: 5, }}
            onPress={() => {
              commentSheetRef?.current?.expand()
              setShowTitle(true)
            }}>
            <EvilIcons name={'comment'} size={30} color={'grey'} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              retweetSHeetRef?.current?.expand()
              setShowTitle(true)
            }}>
            <EvilIcons name={'retweet'} size={30} color={'grey'} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => addLike(route?.params?.data, route?.params?.index)}>
            {route?.params?.data.liked ? (
              <Fontisto name="heart" size={20} color={colors.primary} />
            ) : (
              <Fontisto name="heart-alt" size={20} color={'grey'} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              onShare(route?.params?.data)
            }}>
            <EvilIcons name={'share-apple'} size={30} color={'grey'} />
          </TouchableOpacity>
        </View>
      </View>}

      {route?.params?.data.owner && <ScrollView>
        <View style={{ marginLeft: 15, width: '100%', flexDirection: 'row', marginRight: 25, margin: 5, marginTop: 10, }}>
          <Image
            contentFit='cover'
            source={route?.params?.data.profile}
            style={{ backgroundColor: 'gray', borderRadius: 50, borderWidth: 2, borderColor: colors.primary, width: 50, height: 50, alignSelf: 'center' }} />
          <View style={{ marginLeft: 18, alignSelf: 'center' }}>
            <View style={{ flexDirection: 'row' }}>
              <Text style={{ fontWeight: 'bold' }}>{owner?.fullname}</Text>
              <Text style={{ color: colors.primary, marginLeft: 5, fontSize: 10, alignSelf: 'center', }}>
                @{owner?.username}
              </Text>
            </View>
            <Text style={{ fontSize: 10, color: 'gray', marginTop: 5 }}>
              Thrown {moment(route?.params?.data.date).fromNow()}
            </Text>
          </View>
        </View>
        <Text style={{ fontWeight: 'bold', marginBottom: 10, fontSize: 12, marginLeft: 30 }}>
          {route?.params?.data ? route?.params?.data.title : route?.params?.title}
        </Text>
        {route?.params?.data.qoute &&
          <Text style={{ marginLeft: 30 }}>{route?.params?.data ? route?.params?.data.qoute : route?.params?.qoute}</Text>
        }
        {route?.params?.data.cont.gif &&
          <Pressable onPress={() => openGif(route?.params?.data.cont.gif)}>
            <View style={{ marginBottom: 20, marginLeft: 13, marginTop: 10 }}>
              <Image source={{ uri: route.params.data.cont?.gif }} style={{ resizeMode: 'cover', width: 350, height: 250, borderWidth: 1 }} />
            </View>
          </Pressable>}
        <View style={{ marginLeft: 15, width: '100%', flexDirection: 'row', marginRight: 25, margin: 5, marginTop: 10, }}>
          <Image
            contentFit='cover'
            source={route?.params?.data.owner ? route?.params?.data.owner.profile : route?.params?.data.profile}
            style={{backgroundColor: 'gray',borderRadius: 50,marginLeft: 30,borderColor: colors.primary,width: 40,height: 40,alignSelf: 'center',}}/>
          <View style={{ marginLeft: 18, alignSelf: 'center' }}>
            <View style={{ flexDirection: 'row' }}>
              <Text style={{ fontWeight: 'bold', fontSize: 10 }}>{route?.params?.data.owner ? route?.params?.data.name : owner?.fullname}</Text>
              <Text
                style={{
                  color: colors.primary,
                  marginLeft: 5,
                  fontSize: 10,
                  alignSelf: 'center',
                }}
              >
                @{route?.params?.data.owner ? route?.params?.data.owner.username : route?.params?.data.username}
              </Text>
            </View>
            <Text style={{ fontSize: 10, color: 'gray', marginTop: 5 }}>
              Thrown {moment(route?.params?.data.owner ? route?.params?.data.owner.Odate : route?.params?.data.date).fromNow()}
            </Text>
          </View>
        </View>

        <View style={{ marginLeft: 13, padding: 5 }}>
          <Text style={{
            fontWeight: 'bold',
            marginBottom: 10,
            fontSize: 10,
            marginLeft: 30
          }}>{route?.params?.data ? route?.params?.data.title : route?.params?.title}
          </Text>
          {route?.params?.data.owner?.gif ?
            <View>
              <Pressable onPress={() => openGif(route?.params?.data.owner?.gif)}>
                <View style={{ marginBottom: 20, marginLeft: 13 }}>
                  <Image source={{ uri: route.params.data.owner?.gif }} style={{ resizeMode: 'stretch', width: 300, height: 200, borderWidth: 1 }} />
                </View>
              </Pressable>
            </View>
            : null}
          <Text style={{ marginLeft: 30 }}>{route?.params?.data ? route?.params?.data.content : route?.params?.content}</Text>
        </View>
        <View style={{ width: '100%', height: 50, borderColor: 'lightgray', borderWidth: 1, alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', padding: 8, }}>
          <TouchableOpacity style={{ padding: 5, }}
            onPress={() => {
              commentSheetRef?.current?.expand()
              setShowTitle(true)
            }}>
            <EvilIcons name={'comment'} size={30} color={'grey'} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              retweetSHeetRef?.current?.expand()
              setShowTitle(true)
            }}>
            <EvilIcons name={'retweet'} size={30} color={'grey'} />
            </TouchableOpacity>

          <TouchableOpacity onPress={() => addLike(route?.params?.data, route?.params?.index)}>
            {route?.params?.data.liked ? (
              <Fontisto name="heart" size={20} color={colors.primary} />
            ) : (
              <Fontisto name="heart-alt" size={20} color={'grey'} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              onShare(route?.params?.data)
            }}>
            <EvilIcons name={'share-apple'} size={30} color={'grey'} />
            </TouchableOpacity>

        </View>
      </ScrollView>}



      {/*
      {route?.params?.data.owner && !route?.params?.data.qoute ? <View>
        <View style={{
          marginLeft: 15,
          width: '100%',
          flexDirection: 'row',
          marginRight: 25,
          margin: 5,
          marginTop: 10,
        }}>
          <Image
            contentFit='cover'
            source={route?.params?.data.profile}
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
                @{owner?.username}
              </Text>
            </View>
            <Text style={{ fontSize: 10, color: 'gray', marginTop: 5 }}>
              Thrown {moment(route?.params?.data.date).fromNow()}
            </Text>
          </View>
        </View>
      </View> : null}
      

      {route?.params?.data.qoute ? <View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image source={owner?.profile} style={{ width: 50, height: 50, borderRadius: 50, marginLeft: 15 }} />
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
                @{owner?.username}
              </Text>
            </View>
            <Text style={{ fontSize: 10, color: 'gray', marginTop: 5 }}>
              Thrown {moment(route?.params?.data.date).fromNow()}
            </Text>
          </View>
        </View>
        <View style={{ marginLeft: 13, padding: 5 }}>
          <Text>{route?.params?.data.qoute}</Text>
        </View>
        {route?.params?.data.cont.gif ? <View>
          <Pressable onPress={() => openRef.current.expand()}>
            <View style={{ marginBottom: 20, marginLeft: 13 }}>
              <Image source={{ uri: route.params.data.cont.gif }} style={{resizeMode: 'stretch', width: 350, height: 250, borderWidth: 1}} />
            </View>
          </Pressable>
        </View>
          : null}
      </View> : null}
      

      {!route?.params?.data.file ? <View>
        <View
          style={{
            marginLeft: 15,
            width: '100%',
            flexDirection: 'row',
            marginRight: 25,
            margin: 5,
            marginTop: 10,
          }}
        >
          <Image
            contentFit='cover'
            source={route?.params?.data.owner ? route?.params?.data.owner.profile : route?.params?.data.profile}
            style={{
              backgroundColor: 'gray',
              borderRadius: 50,
              marginLeft: 30,
              borderColor: colors.primary,
              width: 40,
              height: 40,
              alignSelf: 'center',
            }}
          />
          <View style={{ marginLeft: 18, alignSelf: 'center' }}>
            <View style={{ flexDirection: 'row' }}>
              <Text style={{ fontWeight: 'bold', fontSize: 10 }}>{route?.params?.data.owner ? route?.params?.data.name : owner?.fullname}</Text>
              <Text
                style={{
                  color: colors.primary,
                  marginLeft: 5,
                  fontSize: 10,
                  alignSelf: 'center',
                }}
              >
                @{route?.params?.data.owner ? route?.params?.data.owner.username : route?.params?.data.username}
              </Text>
            </View>
            <Text style={{ fontSize: 10, color: 'gray', marginTop: 5 }}>
              Thrown {moment(route?.params?.data.owner ? route?.params?.data.owner.Odate : route?.params?.data.date).fromNow()}
            </Text>

          </View>

        </View>

        <View style={{ marginLeft: 13, padding: 5 }}>
          <Text style={{
            fontWeight: 'bold',
            marginBottom: 10,
            fontSize: 10,
            marginLeft: 30
          }}>{route?.params?.data ? route?.params?.data.title : route?.params?.title}
          </Text>
          {route?.params?.data.owner?.gif ? 
          <View>
          <Pressable onPress={() => openRef.current.expand()}>
            <View style={{ marginBottom: 20, marginLeft: 13 }}>
              <Image source={{ uri: route.params.data.owner?.gif }} style={{resizeMode: 'stretch', width: 350, height: 250, borderWidth: 1}} />
            </View>
          </Pressable>
        </View>
          : null}
          <Text style={{ marginLeft: 30 }}>{route?.params?.data ? route?.params?.data.content : route?.params?.content}</Text>
        </View>
        
        <View
          style={{
            height: 1,
            backgroundColor: 'lightgray',
            marginTop: 5,
          }}
        />
        <View style={{ width: '100%', height: 50, borderColor: 'lightgray', borderWidth: 1, alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', padding: 8, }}>
          <TouchableOpacity style={{ padding: 5, }}
            onPress={() => {
              commentSheetRef?.current?.expand()
              setShowTitle(true)
            }}>
            <EvilIcons name={'comment'} size={30} color={'grey'} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              retweetSHeetRef?.current?.expand()
              setShowTitle(true)
            }}>
            <EvilIcons name={'retweet'} size={30} color={'grey'} />
            </TouchableOpacity>

          <TouchableOpacity onPress={() => addLike(route?.params?.data, route?.params?.index)}>
            {route?.params?.data.liked ? (
              <Fontisto name="heart" size={20} color={colors.primary} />
            ) : (
              <Fontisto name="heart-alt" size={20} color={'grey'} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              onShare(route?.params?.data)
            }}>
            <EvilIcons name={'share-apple'} size={30} color={'grey'} />
            </TouchableOpacity>

        </View>

      </View>
        :
        <View style={{ padding: 5, alignItems: 'center' }}>
          <View
            style={{
              padding: 4,
            }}
          >
            {route?.params?.data?.title && <Text style={styles.contentHeader}>{route?.params?.data?.title}</Text>}

            {route?.params?.data?.file && <Image
              contentFit='cover'
              style={{ width: 350, height: 300, borderRadius: 15 }}
              source={route?.params?.data.file}
            />}
            {route?.params?.data?.description && <Text style={{
              marginVertical: 10,
              fontSize: 15
            }}>{route?.params?.data?.description}</Text>}
          </View>
        </View>}*/}

      <View
        style={{
          justifyContent: 'center',
          alignContent: 'center',
          alignItems: 'center',
        }}
      >
        {shouldShowIndicator ? (
          <ActivityIndicator
            style={{ marginTop: 20 }}
            size={30}
            color={colors.primary}
          />
        ) : null}
        {showNoSticksMessage ? (
          <Text style={{ marginTop: 10 }}>
            No sticks thrown yet. Be first to throw!
          </Text>
        ) : null}
      </View>

      <FlashList
        data={comments}
        estimatedItemSize={100}
        onEndReachedThreshold={0.5}
        onEndReached={() => getComments('yes', false)}
        refreshing={shouldLoad}
        renderItem={({ item, index }) => <StickReplyItem
          item={item}
          stickId={route?.params?.data.id}
          deleteComment={() => deleteComment(item.id, index)}
          updateLikes={(comment) => updateLikes(comment)}
          gif={gif}
          index={index}
        />}
      />

      <View style={{ height: 60 }} />


      <BottomSheet
        ref={retweetSHeetRef}
        index={-1}
        snapPoints={snapPoints2}
        enablePanDownToClose={true}
        backdropComponent={renderBackdrop}
        onChange={handleSheetChanges}
      >
        <BottomSheetView style={{
          flex: 1,
          width: '100%'
        }}>
          <View style={{ marginTop: 30 }} />
          <TouchableOpacity onPress={() => {
            console.log(userdata.profile)
            const postData = {
              user: userdata.uid,
              title: route?.params?.data ? route?.params?.data.title : route?.params?.title,
              owner: {
                profile: owner?.profile,
                Odate: route?.params?.data ? route?.params?.data.date : route?.params?.date,
                fullname: owner?.fullname,
                username: owner?.username,
                id: route?.params?.data.id
              },
              type: 'publish',
              date: new Date().toUTCString(),
              mentinos: tags.length > 0 ? tags.length : 0,
              profile: userdata?.profile,
              content: route?.params?.data ? route?.params?.data.content : route?.params?.content,
              likes: 0,
              comments: 0,
              likesId: '',
              commentsId: '',
              name: owner?.fullname,
              timestamp: Timestamp.now(),
              username: userdata?.username,
            }
            addDoc(collection(database, `sticks`), postData)
            retweetSHeetRef?.current?.close()
          }} style={{ padding: 10 }}><Text style={{ fontWeight: 'bold' }}>Publish</Text>
            <Text style={{ color: 'grey' }}>Instantly post this stick to your tree</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ padding: 10 }}
            onPress={() => {
              retweetSHeetRef?.current?.close()
              publishSheetRef?.current?.expand()
            }}><Text style={{ fontWeight: 'bold' }}>Publish with Comments</Text>
            <Text style={{ color: 'grey' }}>Post this stick with comments on your tree</Text>
          </TouchableOpacity>
        </BottomSheetView>

      </BottomSheet>

      <BottomSheet
        ref={publishSheetRef}
        index={-1}
        snapPoints={snapPoints3}
        enablePanDownToClose={true}
        backdropComponent={renderBackdrop}
        onChange={handleSheetChanges}>
        <BottomSheetView style={{
          flex: 1,
          width: '100%'
        }}>
          <View style={{ marginTop: 20 }} />
          <Text style={{ fontWeight: 'bold', alignSelf: 'center', marginBottom: 30, fontSize: 20, color: 'lightgrey' }}>Publish with comments</Text>
          <View style={{ height: '20%', width: '90%', marginLeft: '5%' }}>
            <TextInput multiline={true} value={comment} placeholder='Write your comment' style={{
              width: '100%',
              height: '50%',
              borderWidth: 2,
              borderColor: colors.primary,
              borderRadius: 5,
              padding: 10
            }}
              onChangeText={(text) => setUpTags(text)}
            />
            {gif && <View style={{ marginTop: 10 }}>

              <View style={{ flexDirection: 'row', padding: 10 }}>
                <Image source={{ uri: gif }} style={{
                  width: 100,
                  height: 100,
                }} />
                <Pressable style={{ height: 20, width: 20 }}>
                  <Text style={{ color: 'red', marginLeft: 10 }} onPress={() => {
                    commentSheetRef?.current?.close()
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
                //console.log(route)
                const postData = {
                  user: userdata.uid,
                  fullname: userdata.fullname,
                  title: route?.params?.data ? route?.params?.data.title : route?.params?.title,
                  qoute: comment,
                  owner: {
                    user: route?.params?.data.user,
                    profile: owner?.profile,
                    Odate: route?.params?.data ? route?.params?.data.date : route?.params?.date,
                    fullname: owner?.fullname,
                    username: owner?.username,
                  },
                  type: 'publish',
                  date: new Date().toUTCString(),
                  mentinos: tags.length > 0 ? tags.length : 0,
                  profile: userdata?.profile,
                  content: route?.params?.data ? route?.params?.data.content : route?.params?.content,
                  likes: 0,
                  comments: 0,
                  likesId: '',
                  commentsId: '',
                  name: owner?.fullname,
                  timestamp: Timestamp.now(),
                  username: userdata?.username,
                  cont: {
                    gif: gif
                  }
                }
                addDoc(collection(database, `sticks`), postData)
                publishSheetRef?.current?.close()
              }}
              style={{
                position: 'relative',
                backgroundColor: colors.primary,
                padding: 5,
                width: 100,
                borderRadius: 5,
                marginLeft: '70%',
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
                Publish
              </Text>
            </TouchableOpacity>
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
              contentFit='cover'
              source={owner?.profile}
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
                  @{owner?.username}
                </Text>
              </View>
              <Text style={{ fontSize: 10, color: 'gray', marginTop: 5 }}>
                Thrown {moment(route?.params?.data ? route?.params?.data.date : route?.params?.date).fromNow()}
              </Text>
            </View>
          </View>
          <View style={{ marginLeft: 13, padding: 5 }}>
            <Text style={{
              fontWeight: 'bold',
              marginBottom: 10
            }}>{route?.params?.data ? route?.params?.data.title : route?.params?.title}</Text>
            <Text>{route?.params?.data ? route?.params?.data.content : route?.params?.content}</Text>
          </View>
        </BottomSheetView>
      </BottomSheet>

      <BottomSheet
        ref={commentSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        backdropComponent={renderBackdrop}
        onChange={handleSheetChanges}
      >
        <BottomSheetView style={{
          flex: 1,
          width: '100%'
        }}>
          <View style={{ marginTop: 20 }} />

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


            <TextInput multiline={true} value={comment} placeholder='Write your stick' style={{
              width: '90%',
              height: 150,
              marginHorizontal: 20,
              borderWidth: 2,
              borderColor: colors.primary,
              borderRadius: 5,
              padding: 20
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
                    commentSheetRef?.current?.close()
                    setGif('')
                  }}>X</Text>
                </Pressable>
              </View>
            </View>}

            <Text style={{
              marginLeft: 20,
              fontSize: 12,
              marginTop: 5,
              color: colors.primary
            }}>{currentCount}</Text>

            <View style={{ flexDirection: 'row', marginTop: 10, width: '90%', alignSelf: 'center' }}>

              <TouchableOpacity
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
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  pickImage();
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
                  Add image
                </Text>
              </TouchableOpacity>

            </View>

            <TouchableOpacity
              onPress={() => {
                addComment('comment')
                commentSheetRef?.current?.close()
              }}
              style={{
                position: 'relative',
                backgroundColor: colors.primary,
                padding: 5,
                width: 100,
                borderRadius: 5,
                marginLeft: '70%',
                marginTop: 30,
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
            <TextInput multiline={true} value={search} placeholder='Search topic' style={{
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
              estimatedItemSize={100}
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

                    {index === filtered.length - 1 &&
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
                    const content = comment.split(' ')
                    content[content.length - 1] = tagUser[tagUser.length - 1]?.user ?
                      `@${tagUser[tagUser.length - 1].user} ` : `@${item.username} `

                    setComment(content.join(' '))
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
                      <Text>@{item.username}</Text>
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

      <BottomSheet
        ref={gifSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        backdropComponent={renderBackdrop}
        onChange={handleSheetChanges}
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
            contentContainerStyle={styles.gifList}
          />
        </BottomSheetView>
      </BottomSheet>

      <BottomSheet
        ref={openRef}
        index={-1}
        snapPoints={snapPoints4}
        enablePanDownToClose={true}
        backdropComponent={renderBackdrop}
        onChange={handleSheetChanges}
        handleStyle={{
          backgroundColor: 'black',
        }}
      >
        <BottomSheetView style={{
          flex: 1,
          width: '100%',
          backgroundColor: 'black'
        }}>

          <Image source={{ uri: uri }} style={{ width: '100%', height: '50%' }} />

        </BottomSheetView>
      </BottomSheet>

    </View>
  )
}

const styles = StyleSheet.create({
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  bottomSheetView: {
    flex: 1,
    width: '100%',
  },
  gifList: {
    paddingHorizontal: 10,
  },
  gifItem: {
    flex: 1,
    margin: 5,
    aspectRatio: 1,
  },
  gifImage: {
    width: '100%',
    height: '100%',
  },
})
