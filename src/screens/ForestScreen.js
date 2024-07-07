import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  SafeAreaView, TouchableOpacity, Text, ScrollView, TextInput, View, Image, FlatList, ActivityIndicator, Alert,
  Pressable
} from 'react-native'
import {
  Ionicons, Entypo
} from '@expo/vector-icons'
import colors from '../config/colors'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useDispatch, useSelector } from 'react-redux'
import { selectUser, setSticks } from '../redux/features/user'
import { addDoc, collection, doc, updateDoc, getDocs, where, query, orderBy, limit, Timestamp, startAfter } from 'firebase/firestore'
import { database } from '../config/firebase'
import {
  addForestStick
  , selectFilteredForestStick
  , selectLastStickdoc
  , selectWatching
  , setFilterdForestStick
  , setForestStick
  , setLastStickDoc
} from '../redux/features/data'
import titles from '../data/titles'
import Villages from '../components/Forest'
import { sendPushNotification } from '../hooks/Notifications'
import { useFocusEffect } from '@react-navigation/native'
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet'
import { Portal } from 'react-native-paper'
import { FlashList } from '@shopify/flash-list'
import { Instagram } from 'react-content-loader'
import * as ImagePicker from 'expo-image-picker';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage'



export default function ForestScreen({ navigation, route }) {
  const [currentCount, setcurrentCount] = useState('0 / 1500')
  const [locked, setLocked] = useState(false)
  const [shouldLoad, setShouldLoad] = useState(false)
  const [showTitle, setShowTitle] = useState(false)
  const userdata = useSelector(selectUser)
  const dispatch = useDispatch()
  const [stick, setStick] = useState('')
  const [title, setTitle] = useState('')
  const [all, setAll] = useState(titles)
  const [filtered, setFiltered] = useState(titles)
  const [search, setSearch] = useState('')
  const laststickdoc = useSelector(selectLastStickdoc)
  const [isLoading, setIsLoading] = useState(false)
  const [tagsLoader, setTagsLoader] = useState(false)
  const [tagUser, setTagUser] = useState([])
  const [tags, setTags] = useState(useSelector(selectWatching))
  const [tagsfiltered, setTagsFiltered] = useState([])
  const [showTags, setShowTags] = useState(false)
  const filteredForestSticks = useSelector(selectFilteredForestStick)
  const [gif, setgif] = useState(null)
  const snapPoints = useMemo(() => ['90%'], [])
  const [argif, setargif] = useState([])
  const gifSheetRef = useRef(null)
  //console.log('forest',filteredForestSticks)
  // ref
  const commentSheetRef = useRef(null)

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
      allowsEditing: false,
      aspect: [16,9],
      quality: 2,
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


  // this is to get data, this includes all stciks and calabash for all users, and limit it to 100
  const getData = async (next, refresh) => {
    if (next) {
      const templist = [...filteredForestSticks]
      const likes = await AsyncStorage.getItem('likes')
      const likesdata = likes !== null ? [...JSON.parse(likes).data] : []

      const stickDocs = (await getDocs(query(collection(database, `sticks`)
        , orderBy('timestamp', 'desc')
        , startAfter(laststickdoc)
        , limit(5))))

      // get sticks
      const sticks = stickDocs.docs.map(resdoc => {
        const id = resdoc.id
        const data = resdoc.data()
        return { id, ...data }
      })


      sticks.forEach((stick) => {
        let liked = likesdata.filter(item => item === stick.id).length > 0 ? true : false
        // let likes = likesdata.filter(item => item === stick.id).length > 0 && stick.user !== userdata.uid ? stick.likes + 1 : stick.likes

        if (stick.file) {
          if (stick.showontree) templist.push({ ...stick, liked: liked, likes: likes })
        } else {
          templist.push({ ...stick, liked: liked, likes: stick.likes })
        }
      })

      // set last stick doc
      dispatch(setLastStickDoc(stickDocs.docs[stickDocs.docs.length - 1]))
      dispatch(setForestStick(templist))
      dispatch(setFilterdForestStick(templist))
    } else {
      refresh && setIsLoading(true)
      const likes = await AsyncStorage.getItem('likes')
      const likesdata = likes !== null ? [...JSON.parse(likes).data] : []
      const templist = []

      // get current users stick and the the user's part of the watching list
      const stickDocs = (await getDocs(query(collection(database, `sticks`)
        , orderBy('timestamp', 'desc')
        , limit(25))))

      // get sticks
      const sticks = stickDocs.docs.map(resdoc => {
        const id = resdoc.id
        const data = resdoc.data()
        return { id, ...data }
      })

      sticks.forEach((stick) => {
        let liked = likesdata.filter(item => item === stick.id).length > 0 ? true : false
        // let likes = likesdata.filter(item => item === stick.id).length > 0 && stick.user !== userdata.uid ? stick.likes + 1 : stick.likes

        if (stick.file) {
          if (stick.showontree) templist.push({ ...stick, liked: liked, likes: likes })
        } else {
          templist.push({ ...stick, liked: liked, likes: stick.likes })
        }
      })

      // set last stick doc
      dispatch(setLastStickDoc(stickDocs.docs[stickDocs.docs.length - 1]))
      dispatch(setForestStick(templist))
      dispatch(setFilterdForestStick(templist))
      isLoading && setIsLoading(false)
    }
  }


  const showSuccess = (msg) => {
    Alert.alert(
      'Success',
      msg,
    )
  }


  const setNotification = (res) => {
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

        showSuccess('Your stick was thrown with success.')
      })

      // reset tags
      setTagUser([])
    }
  }


  // method that will be used to throw a stick
  const onThrowStick = async () => {
    if (title === '') {
      alert('Please select topic')
    } else if (stick === '') {
      alert('Stick content required.')
    } else {
      if (stick.split('').length > 1499) return alert('Your stick exceeds 1500 characters, review and try again')

      const postData = {
        user: userdata.uid,
        title: title,
        content: stick,
        type: 'stick',
        mentions: tags.length > 0 ? tags.length : 0,
        date: new Date().toUTCString(),
        profile: userdata.profile,
        likes: 0,
        comments: 0,
        publishes: 0,
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
          const templist = [...filteredForestSticks]
          templist.unshift(postData)
          dispatch(setForestStick(templist))
          dispatch(setFilterdForestStick(templist))
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

  // listend to react navigation native hooks 
  useFocusEffect(
    React.useCallback(() => {
      //console.log('Forest screen')
      getWatchers()
      getData(false, false)
    }, [])
  )

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('watching')
        .then(watching => {
          if (watching !== null) {
            getWatchers()
            setTimeout(async () => {
              await AsyncStorage.removeItem('watching')
            }, 5000)
          }
        })


      async function getLocked() {
        const locked = await AsyncStorage.getItem('locked')
        if (locked !== null) {
          setTitle(JSON.parse(locked).title)
          setLocked(JSON.parse(locked).locked)
        }
      }

      getLocked()
    }, [])
  )

  // get user's watchers
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


  const openTags = async (text) => {
    setTagsLoader(true)
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
      setTagsLoader(false)
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

      setTagsLoader(false)
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


    setStick(text)
    let count = text.length
    let appendCount = count + ' / 1500'
    setcurrentCount(appendCount)
  }

  const IgLoader = () => (
    <Instagram speed={1} />
  )


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      {filteredForestSticks.length === 0 && <View
        style={{
          flex: 1,
          width: '100%',
          backgroundColor: 'white',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <ActivityIndicator style={{
          marginTop: 150
        }} size={'small'} color={colors.primary} />
        <Text style={{
          textAlign: 'center',
          marginTop: 10
        }}>Loading...</Text>
      </View>}


      {/* for vallages */}
      <FlashList
        data={filteredForestSticks}
        refreshing={shouldLoad}
        onEndReached={() => getData(true, false)}
        onRefresh={() => getData(false, true)}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => {
          return <View style={{
            height: 1,
            marginHorizontal: 25,
            backgroundColor: '#CCCCCC',
          }} />
        }}
        renderItem={({ item, index }) => <Villages stick={item} user={item} index={index} />}
        estimatedItemSize={200}

      />

      <TouchableOpacity
        onPress={() => {
          setShouldLoad(false)
          commentSheetRef?.current?.expand()
          setShowTitle(true)
        }}
        style={{
          position: 'absolute',
          right: 20,
          bottom: 30,
          zIndex: 1000,
          backgroundColor: colors.primary,
          padding: 5,
          borderRadius: 100,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Ionicons
          name='add-circle'
          color={'white'}
          size={30}
        />

        <Text
          style={{
            color: 'white',
            fontWeight: 'bold',
            textAlign: 'center',
            alignItems: 'center',
            paddingRight: 5,
          }}
        >
          Throw a Stick
        </Text>
      </TouchableOpacity>

      <Portal>
        <BottomSheet
          ref={commentSheetRef}
          index={-1}
          snapPoints={snapPoints}
          enablePanDownToClose={true}
          backdropComponent={renderBackdrop}
          onChange={handleSheetChanges}
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
                  commentSheetRef?.current?.close()
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
                      const content = stick.split(' ')
                      content[content.length - 1] = tagUser[tagUser.length - 1]?.user ?
                        `@${tagUser[tagUser.length - 1].user} ` : `@${item.username} `

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
              contentContainerStyle={{ paddingHorizontal: 10 }}
            />
          </BottomSheetView>
        </BottomSheet>
      </Portal>
    </SafeAreaView>
  )
}

