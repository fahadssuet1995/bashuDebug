
import styles from './styles'
import colors from '../../../config/colors'
import moment from 'moment'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import {
  Ionicons, Entypo
} from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/core'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { selectUser, setData } from '../../../redux/features/user'
import { Timestamp, addDoc, collection, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query, startAfter, updateDoc } from 'firebase/firestore'
import { database } from '../../../config/firebase'
import { Image } from 'expo-image'
import { Fontisto } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet'
import { sendPushNotification } from '../../../hooks/Notifications'
import { Portal } from 'react-native-paper'
import { FlashList } from '@shopify/flash-list'
import { selectWatching } from '../../../redux/features/data'
import { formatDistance } from 'date-fns'
import ProfilePicture from '../../ProfilePicture'
import { useFocusEffect } from '@react-navigation/native'
import { deleteReplyLike } from '../../../hooks/User'




const StickReplyItem = ({ item, stickId, deleteComment, updateLikes, index } ) => {
  const navigation  = useNavigation()
  // const stickInput  = useRef<TextInput>()
  const userdata = useSelector(selectUser)
  const [data, setData] = useState (null)
  const [replies, setReplies] = useState([])
  const [lastreplydoc, setLastReplydoc] = useState (null)
  const dispatch = useDispatch()
  const [showTags, setShowTags] = useState(false)
  const snapPoints = useMemo(() => ['50%', '80%'], [])
  const replySnapPoints = useMemo(() => ['80%'], [])
  const [reply, setReply] = useState('')
  const [title, setTitle] = useState('')
  const [currentCount, setcurrentCount] = useState('0 / 500')
  const [tagUser, setTagUser] = useState([])
  const [search, setSearch] = useState('')
  const [tagsfiltered, setTagsFiltered] = useState([])
  const [tags, setTags] = useState(useSelector(selectWatching))
  const [mentionTarget, setMentionTarget] = useState(0)
  const [resplycount, setReplyCount] = useState ()
  const [likescount, setLikesCount] = useState ()
  const [showinput, setShowInput] = useState(false)

  // ref
  const commentSheetRef = useRef<BottomSheet>(null)
  const replySheetRef = useRef<BottomSheet>(null)


  // callbacks
  const handleSheetChanges = useCallback((index ) => {
    index === -1 && setShowInput(false)
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

  useEffect(() => {
    async function getUserData() {
      const data = (await getDoc(doc(database, `users/${item.user}`))).data()
      if (data) setData(data)
    }

    getUserData()
  }, [])


  // set up tage method
  const setUpTags = (text ) => {
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


    setReply(text)
    let count = text.length
    let appendCount = count + ' / 500'
    setcurrentCount(appendCount)
  }


  // open tags method
  // this will filter tags in case the watching list is already populated
  // else get the users that are watching this user 
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



  // push reply
  const addReply = async (data ) => {
    return await addDoc(collection(database, `sticksreply/${item.id}/replies`), data)
  }



  // get stick data
  const getReplies = async (next , refresh ) => {
    // show bottomsheet
    commentSheetRef?.current?.expand()

    if (next === 'yes') {
      // const tepmlist = [...replies]
      // const likes = await AsyncStorage.getItem('likes')
      // const likesdata = likes !== null ? [...JSON.parse(likes).data] : []

      const queryCol = query(collection(database, `sticksreply/${item.id}/replies`)
        , orderBy('timestamp', 'desc')
        , startAfter(lastreplydoc)
        , limit(10))


      const unsub = onSnapshot(queryCol, snap => {
        const result = snap.docs.map(doc => {
          const id = doc.id
          const data = doc.data()
          return { id, ...data }
        })

        // result.forEach((stick ) => {
        //   let liked = likesdata.filter(item => item === stick.id).length > 0 ? true : false
        //   let likes = likesdata.filter(item => item === stick.id).length > 0 ? stick.likes + 1 : stick.likes
        //   tepmlist.push({ ...stick, liked: liked, likes: likes })
        // })

        setLastReplydoc(snap.docs[snap.docs.length - 1])
        setReplies(result)
        unsub()
      })

    } else {
      const queryCol = query(collection(database, `sticksreply/${item.id}/replies`)
        , orderBy('timestamp', 'desc')
        , limit(20))
      // const tepmlist = [...replies]
      // const likes = await AsyncStorage.getItem('likes')
      // const likesdata = likes !== null ? [...JSON.parse(likes).data] : []

      const unsub = onSnapshot(queryCol, snap => {
        const result = snap.docs.map(doc => {
          const id = doc.id
          const data = doc.data()
          return { id, ...data }
        })

        // result.forEach(reply => tepmlist.push(reply))

        // result.forEach((stick ) => {
        //   let liked = likesdata.filter(item => item === stick.id).length > 0 ? true : false
        //   let likes = likesdata.filter(item => item === stick.id).length > 0 ? stick.likes + 1 : stick.likes
        //   tepmlist.push({ ...stick, liked: liked, likes: likes })
        // })

        result.length > 0 && setLastReplydoc(snap.docs[snap.docs.length - 1])
        setReplies(result)
        result.length === 0 && setShowInput(true)
        unsub()
      })
    }
  }


  // listend to react navigation native hooks
  useFocusEffect(
    useCallback(() => {
      // console.log(item.id)
      // updateDoc(doc(database, `sticks/${stickId}/comments/${item.id}`), { comments: 0 })
    }, [])
  )



  // go to user's page
  const userPagePushToView = (item ) => {
    item.user !== userdata.uid && navigation.navigate('UserPage', { data: { id: item.userId ? item.userId : item.user } })
  }


  // add like 
  const pushLike = async () => {
    return await addDoc(collection(database, `sticksreply/${item.id}/likes`), data)
  }

  // like village method
  const likeReply = async () => {
    const ownerdata = (await getDoc(doc(database, `users/${item.user}`))).data()

    const postdata = {
      date: new Date().toUTCString(),
      uid: userdata.uid,
      location: ''
    }

    addDoc(collection(database, `sticks/${stickId}/comments/${item.id}/likes`), postdata)
      .then(async (res) => {
        // update user's rate
        await updateDoc(doc(database, `sticks/${stickId}/comments/${item.id}`), { likes: item.likes + 1 })
          .then(() => {

            if (ownerdata) {
              const notification = {
                to: ownerdata?.pushToken,
                content: {
                  sound: 'default',
                  title: `New Like`,
                  body: `${userdata.fullname} liked your comment.`,
                  data: {
                    otherUser: userdata,
                    action: 'like comment',
                    itemId: item.id,
                    title: item.title,
                    content: item.content
                  },
                  date: new Date().toUTCString()
                }
              }

              if (item.user !== userdata.uid) sendPushNotification(notification)
            }
          })
      })
  }



  // add like method
  const addLike = async (stick ) => {
    const replies  = await AsyncStorage.getItem('replies')

    if (replies !== null) {
      // assign array from local storage to data array
      const data = [...JSON.parse(replies)?.data]
      let result = data.filter(item => item != stick.id)

      if (result.length !== data.length) {
        // update data globally
        // const like = stick.likes !== 0 ? stick.likes - 1 : 0
        // updateLikes({ index: index, likes: like, liked: false })
        await AsyncStorage.setItem('replies', JSON.stringify({ data: result }))
        deleteReplyLike(stickId, userdata.uid, stick)
      } else {
        // // update stick data
        // const like = stick.likes + 1
        // updateLikes({ index: index, likes: like, liked: true })
        // add stick to the local array
        result.push(stick.id)
        // updated the local storage
        await AsyncStorage.setItem('replies', JSON.stringify({ data: result }))
        likeReply()
      }

    } else {
      // update stick data
      // const like = stick.replies + 1
      // updateLikes({ index: index, likes: like, liked: true })
      await AsyncStorage.setItem('replies', JSON.stringify({ data: [stick.id] }))
      likeReply()
    }
  }

  const gotToUserPage = async (item ) => {
    if (item.user !== userdata.uid) navigation.navigate('UserPage', { data: { id: item.user } })
  }

  // reply item
  const ReplyItem = (reply , index ) => {
    return <View
      style={{
        flex: 1,
        flexDirection: 'column',
        marginLeft: 50,
      }}
    >
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 10,
        width: '100%'
      }}>

        <View style={{
          flexDirection: 'row'
        }}>
          <Pressable onPress={() => userPagePushToView(reply)}>
            <Image contentFit='cover' source={reply?.profile} style={{
              height: 40,
              width: 40,
              borderRadius: 50
            }} />
          </Pressable>

          <View style={{
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            marginLeft: 10
          }}>
            <Text style={{ fontWeight: 'bold', fontSize: 12 }}>
              {item?.title}
            </Text>

            <Pressable onPress={() => userPagePushToView(reply)}>
              <Text style={{ fontWeight: 'bold', fontSize: 10, color: colors.primary }}>
                @{reply?.username}
              </Text>
            </Pressable>

            {reply?.date && <Text
              style={{
                color: 'black',
                fontSize: 10,
                marginTop: 5
              }}
            >
              {formatDistance(new Date(reply?.date).toISOString(), Date.now(), { addSuffix: true })}
            </Text>}
          </View>
        </View>

        {/* <Pressable
            onPress={() => {
              userData(stick.user)
              fullSheetRef?.current?.expand()
            }
            }
            style={{ flexDirection: 'row', alignSelf: 'flex-start', justifyContent: 'flex-end' }}
          >
            <Entypo
              size={15}
              color={colors.black}
              name={'dots-three-horizontal'}
            />
          </Pressable> */}
      </View>

      <View style={{ flex: 1 }}>
        <View>
          <View>
            <Text style={styles.content}>{reply?.comment}</Text>
          </View>

          <View style={{ marginLeft: 10 }}>
            <View
              style={{
                justifyContent: 'space-between',
                flexDirection: 'row',
                marginLeft: 0,
                marginTop: 20,
              }}
            >
              {/* <Pressable
                  onPress={() => stickPushToView(stick)}
                  style={styles.iconContainer}
                >
                  <EvilIcons name={'comment'} size={20} color={'grey'} />
                  <Text style={styles.number}>{stick.comments}</Text>
                </Pressable> */}
              {/* 
                <Pressable onPress={async () => addLike(stick, index)}
                  style={styles.iconContainer}
                >
                  {stick.liked ? (
                    <Fontisto name={'heart'} size={13} color={colors.primary} />
                  ) : (
                    <Fontisto name={'heart-alt'} size={13} color={colors.primary} />
                  )}
                  <Text style={styles.number}>{stick.likes}</Text>
                </Pressable> */}
            </View>
          </View>
        </View>
      </View>
    </View>
  }



  // add comment to the cala
  const pushReply = async () => {
    if (reply === '') {
      alert('Cannot post comment, fields are empty.')
    } else {

      const postData = {
        user: userdata.uid,
        comment: reply,
        stick: item.id,
        parent: stickId,
        owner: {
          uid: item.user,
          profile: item.profile
        },
        title: title,
        fullname: userdata.fullname,
        mentions: mentionTarget,
        timestamp: Timestamp.now(),
        type: 'reply',
        profile: userdata.profile,
        date: new Date().toUTCString(),
        mentinos: tags.length > 0 ? tags.length : 0,
        username: userdata.username,
        likes: 0,
      }

      addReply(postData)
        .then(async (res) => {
          // const templist = [...replies]
          // templist.push(postData)
          // // update comments array
          // setReplies(templist)
          // // set local comments count
          // setReplyCount(resplycount + 1)
          getReplies('no', false)

          // update stick comment count
          await updateDoc(doc(database, `sticks/${stickId}/comments/${item.id}`), { comments: item.comments + 1 })

          const notification = {
            to: '',
            content: {
              sound: 'default',
              title: `New stick`,
              body: `${userdata.fullname} replies to your stick.`,
              data: {
                otherUser: userdata,
                action: 'reply stick',
                itemId: item.id,
                title: title,
                content: item.content,
                profile: item.profile
              },
              date: new Date().toUTCString()
            }
          }

          // add notification to the user's collenction
          // only if the current logged in user is not the owner of the comment
          if (userdata.uid !== item.user) {
            sendPushNotification(notification)
            // add notification in the doc
            addDoc(collection(database, `users/${item.user}/notifications`), notification.content)
          }

          if (tagUser.length > 0) {
            tagUser.forEach(async (tag ) => {

              const notification = {
                to: tag?.pushToken,
                content: {
                  sound: 'default',
                  title: `You were tagged`,
                  body: `${userdata.fullname} tagged you on a stick.`,
                  data: {
                    otherUser: userdata,
                    action: 'stick tag',
                    itemId: item.id,
                    title: title,
                    content: item.content
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

          setReply('')
        }).catch((e) => {
          console.log(e)
          alert('Could not post commnet, please try again later.')
        })
    }
  }




  return (
    <View>
      <View style={styles.container}>
        <Pressable onPress={() => gotToUserPage(item)}>
          <Image style={styles.image} source={{ uri: item.profile }} />
        </Pressable>
        <View style={styles.content}>
          <View style={{
            flexDirection: 'row',
          }}>
            <Text style={styles.name}>{item?.fullname}</Text>
            <Text style={[styles.name, { color: colors.primary, marginLeft: 5, fontSize: 10 }]}>@{item?.username}</Text>
          </View>

          <Text style={styles.name}>{item.title}</Text>

          <View>
            <Text>{item.comment}</Text>
          </View>

          <Text style={styles.time}>{moment(item.date).fromNow()}</Text>

          <View style={{
            flexDirection: "row",
            justifyContent: "flex-end",
          }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 5,
                width: '70%',
              }}
            >
              <Pressable
                onPress={() => {
                  Alert.alert('Confirmation', 'Are you sure you want to delete this comment'
                    , [{
                      text: 'No'
                    }, {
                      text: 'Yes',
                      onPress: () => deleteComment()
                    }])

                }}
                style={{ flexDirection: "row" }}
              >
                <Fontisto color={colors.danger} name={"trash"} size={13} />
                <Text
                  style={{
                    color: colors.danger,
                    fontWeight: "bold",
                    fontSize: 10,
                    marginLeft: 5
                  }}
                >
                  delete
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  getReplies('no', false)
                }}
                style={{ flexDirection: "row" }}
              >
                <Fontisto color={colors.primary} name={"comment"} size={13} />

                <Text
                  style={{
                    color: colors.primary,
                    fontWeight: "bold",
                    fontSize: 10,
                    marginLeft: 5
                  }}
                >
                  throw stick {item.comments ? item.comments : 0}
                </Text>
              </Pressable>
              <Pressable onPress={() => {
                addLike(item)
                pushLike()
              }} style={{ flexDirection: "row" }}>
                <Text
                  style={{
                    marginLeft: 2,
                    fontSize: 10,
                    color: colors.primary,
                    fontWeight: "bold",
                    marginRight: 5
                  }}
                >
                  likes {item.likes ? item.likes : 0}
                </Text>

                {item.liked ? (
                  <Fontisto name={'heart'} size={13} color={colors.primary} />
                ) : (
                  <Fontisto name={'heart-alt'} size={13} color={colors.primary} />
                )}

              </Pressable>
            </View>
          </View>
        </View>
      </View>

      <Portal>
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
            <View style={{
              flexDirection: 'row',
              marginHorizontal: 20,
              marginBottom: 10
            }}>
              <Pressable onPress={() => userPagePushToView(item)}>
                <ProfilePicture image={item.profile} size={50} />
              </Pressable>

              <View style={{
                flexDirection: 'column',
                alignItems: 'flex-start',
                justifyContent: 'center',
                marginLeft: 10,
              }}>
                <Text style={{ fontWeight: 'bold' }}>
                  {item.title}
                </Text>

                <Pressable onPress={() => userPagePushToView(item)}>
                  <Text style={{ fontWeight: 'bold', fontSize: 10, color: colors.primary }}>
                    @{item.username}
                  </Text>
                </Pressable>

                {item?.date && <Text
                  style={{
                    color: 'black',
                    fontSize: 10,
                    marginTop: 5
                  }}
                >
                  {formatDistance(new Date(item?.date).toISOString(), Date.now(), { addSuffix: true })}
                </Text>}
                <Text style={{
                  color: 'black',
                  marginRight: 10,
                  marginTop: 10
                }}>{item.comment}</Text>
              </View>
            </View>

            {!showinput && <View style={{
              borderWidth: 1,
              borderColor: 'grey',
              width: 350,
              marginHorizontal: 20
            }} />}

            {showinput && <>
              <TextInput placeholder='enter comment' multiline={true} style={{
                height: 100,
                borderColor: colors.primary,
                borderRadius: 5,
                borderWidth: 1,
                marginHorizontal: 20,
                padding: 10
              }}
                onChangeText={(val) => setReply(val)}
                onFocus={() => commentSheetRef?.current?.snapToIndex(1)} />

              <TouchableOpacity
                onPress={() => {
                  if (showinput) {
                    Keyboard.dismiss()
                    pushReply()
                    setShowInput(!showinput)
                  } else {
                    setShowInput(!showinput)
                  }
                }}
                style={{
                  position: 'relative',
                  backgroundColor: colors.primary,
                  padding: 5,
                  width: 100,
                  zIndex: 50,
                  borderRadius: 5,
                  marginLeft: 270,
                  marginTop: 10,
                  flexDirection: 'row',
                  alignContent: 'center',
                  justifyContent: 'center'
                }}
              >
                <Text
                  style={{
                    color: 'white',
                    fontWeight: 'bold',
                    alignSelf: 'center',
                  }}
                >
                  Throw stick
                </Text>
              </TouchableOpacity>
            </>}

            {!showinput && <TouchableOpacity
              onPress={() => {
                if (showinput) {
                  Keyboard.dismiss()
                  commentSheetRef?.current?.close()
                  pushReply()
                  setShowInput(!showinput)
                } else {
                  setShowInput(!showinput)
                }
              }}
              style={{
                position: 'absolute',
                right: 20,
                bottom: 40,
                backgroundColor: colors.primary,
                padding: 5,
                width: 100,
                zIndex: 50,
                borderRadius: 5,
                marginLeft: 270,
                marginTop: 10,
                flexDirection: 'row',
                alignContent: 'center',
                justifyContent: 'center'
              }}
            >
              <Text
                style={{
                  color: 'white',
                  fontWeight: 'bold',
                  alignSelf: 'center',
                }}
              >
                Throw stick
              </Text>
            </TouchableOpacity>}

            {!showinput && <FlashList
              data={replies}
              estimatedItemSize={100}
              renderItem={({ item, index }) => {
                return ReplyItem(item, index)
              }}
            />}

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
                      const content = reply.split(' ')
                      content[content.length - 1] = tagUser[tagUser.length - 1]?.user ?
                        `@${tagUser[tagUser.length - 1].user} ` : `@${item.username} `

                      setReply(content.join(' '))
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
    </View>
  )
}

export default StickReplyItem