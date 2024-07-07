import { Feather } from '@expo/vector-icons'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  TouchableOpacity,
  View,
  StyleSheet,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Keyboard,
  ActivityIndicator
} from 'react-native'
import { TextInput } from 'react-native-gesture-handler'
import colors from '../config/colors'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { collection, getDocs, limit, orderBy, query, startAfter, where } from 'firebase/firestore'
import { database } from '../config/firebase'
import { selectUser } from '../redux/features/user'
import { FlashList } from '@shopify/flash-list'
import { Image } from 'expo-image'
import Villages from '../components/Forest'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectLastStickdoc
  , selectFilteredForestStick
  , selectForestStick
  , selectUsers
  , setFilterdForestStick
  , setForestStick
  , setLastStickDoc
  , selectFilteredUsers
  , setFilteredUsers
  , setUsers
} from '../redux/features/data'
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet'
import { Portal } from 'react-native-paper'
import titles from '../data/titles'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Colors from '../constants/Colors'



export default function SearchScreen({ route } ) {
  const forestSticks = useSelector(selectForestStick)
  const filteredForestSticks = useSelector(selectFilteredForestStick)
  const allusers = useSelector(selectUsers)
  const filteredUsers = useSelector(selectFilteredUsers)
  const [loading, setLoading] = useState (false)
  const [lastuserdoc, setLasUserdoc] = useState (null)
  const navigation  = useNavigation()
  const userdata = useSelector(selectUser)
  const dispatch = useDispatch()
  const snapPoints = useMemo(() => ['90%'], [])
  const [all, setAll] = useState(titles)
  const laststickdoc = useSelector(selectLastStickdoc)
  const [filtered, setFiltered] = useState(titles)
  // ref
  const topicsSheetRef = useRef (null)
  const usersSheetRef = useRef (null)
  const [search, setSearch] = useState('')

  // callbacks
  const handleSheetChanges = useCallback((index ) => {
    if (index === -1) Keyboard.dismiss()
  }, [])


  const renderBackdrop = useCallback(
    (props ) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ), []
  )

  // navigate to users page
  const userPagePushToView = async (item ) => {
    usersSheetRef?.current?.close()
    navigation.navigate('UserPage', { data: { id: item.id } })
  }


  // filter title method
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
    } else {
      // Inserted text is blank
      // Update FilteredDataSource with masterDataSource
      setFiltered(all)
    }
  }


  // this is to get data, this includes all stciks and calabash for all users, and limit it to 100
  const getData = async (next , refresh) => {
    if (next) {
      const templist = [...filteredForestSticks]
      const likes = await AsyncStorage.getItem('likes')
      const likesdata = likes !== null ? [...JSON.parse(likes).data] : []

      let stickDocs

      if (search !== '') {
        stickDocs = (await getDocs(query(collection(database, `sticks`)
          , where('title', '==', search)
          , orderBy('timestamp', 'desc')
          , startAfter(laststickdoc)
          , limit(50))))
      } else {
        stickDocs = (await getDocs(query(collection(database, `sticks`)
          , orderBy('timestamp', 'desc')
          , startAfter(laststickdoc)
          , limit(50))))
      }

      // get sticks
      const sticks = stickDocs.docs.map(resdoc => {
        const id = resdoc.id
        const data = resdoc.data()
        return { id, ...data }
      })


      sticks.forEach((stick ) => {
        let liked = likesdata.filter(item => item === stick.id).length > 0 ? true : false
        // let likes = likesdata.filter(item => item === stick.id).length > 0 ? stick.likes + 1 : stick.likes

        if (stick.file) {
          if (stick.showontree) templist.push({ ...stick, liked: liked, likes: stick.likes })
        } else {
          templist.push({ ...stick, liked: liked, likes: stick.likes })
        }
      })

      if (templist.length < 1) return alert('No data found')

      // set last stick doc
      dispatch(setLastStickDoc(stickDocs.docs[stickDocs.docs.length - 1]))
      dispatch(setForestStick(templist))
      dispatch(setFilterdForestStick(templist))
    } else {
      refresh && setLoading(true)
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

      sticks.forEach((stick ) => {
        let liked = likesdata.filter(item => item === stick.id).length > 0 ? true : false
        // let likes = likesdata.filter(item => item === stick.id).length > 0 ? stick.likes + 1 : stick.likes

        if (stick.file) {
          if (stick.showontree) templist.push({ ...stick, liked: liked, likes: stick.likes })
        } else {
          templist.push({ ...stick, liked: liked, likes: stick.likes })
        }
      })

      if (templist.length < 1) return alert('No data found')

      // set last stick doc
      dispatch(setLastStickDoc(stickDocs.docs[stickDocs.docs.length - 1]))
      dispatch(setForestStick(templist))
      dispatch(setFilterdForestStick(templist))
      setLoading(false)
    }
  }


  // get notifications
  const getUsers = async (next ) => {
    if (next) {
      const userDocs = await getDocs(query(collection(database, `users`)
        , orderBy('date', 'asc')
        , startAfter(lastuserdoc)
        , limit(10)))

      const templist = [...filteredUsers]
      const users = userDocs.docs.map(resdoc => {
        const id = resdoc.id
        const data = resdoc.data()
        return { id, ...data, type: 'user' }
      })


      setLasUserdoc(userDocs.docs[userDocs.docs.length - 1])
      users.forEach(user => templist.push(user))
      dispatch(setFilteredUsers(templist))
    } else {
      const userDocs = await getDocs(query(collection(database, `users`)
        , orderBy('date', 'asc')
        , startAfter(lastuserdoc)
        , limit(10)))

      const users = userDocs.docs.map(resdoc => {
        const id = resdoc.id
        const data = resdoc.data()
        return { id, ...data, type: 'user' }
      })


      setLasUserdoc(userDocs.docs[userDocs.docs.length - 1])
      dispatch(setFilteredUsers(users))
    }
  }



  // listend to react navigation native hooks
  useFocusEffect(
    useCallback(() => {
      if (route?.params?.title) {
        navigation.setOptions({ title: `All ${route?.params?.title} sticks` })
        filterStcks(route?.params?.title)
      }

      getUsers(false)
      getData(false, false)
      return () => {
        if (route?.params?.title) setFilterdForestStick(forestSticks)
      }
    }, [])
  )


  // filter sticks method
  const filterStcks = (text ) => {
    if (text) {
      // Inserted text is not blank
      // Filter the masterDataSource
      // Update FilteredDataSource
      const newData = filteredForestSticks.filter((item ) => {
        const itemData = item.title
          ? item.title.toUpperCase()
          : ''.toUpperCase()
        const textData = text.toUpperCase()
        return itemData.indexOf(textData) > -1
      })

      // newData.length === 0 && Alert.alert('No match', 'No data found for this topic. Select another topic!',
      //   [{ text: 'Okay' }, { text: 'Reset filter', onPress: () => dispatch(setFilterdForestStick(forestSticks)) }])
      dispatch(setFilterdForestStick(newData))
      setSearch(text)
    } else {
      // Inserted text is blank
      // Update FilteredDataSource with masterDataSource
      setSearch('')
      dispatch(setFilterdForestStick(forestSticks))
    }
  }


  // filter user method
  const filterUser = async (text ) => {
    // Inserted text is not blank
    // Filter the masterDataSource 
    // Update FilteredDataSource
    if (text) {
      const newData = allusers.filter((item ) => {
        const value = `${item.fullname} @${item.username}`
        const itemData = `${item.fullname} @${item.username}`
          ? value.toUpperCase()
          : ''.toUpperCase()
        const textData = text.toUpperCase()
        return itemData.indexOf(textData) > -1
      })

      dispatch(setFilteredUsers(newData))
    } else {
      // Inserted text is blank
      // Update FilteredDataSource with masterDataSource
      dispatch(setFilteredUsers(allusers))
    }
  }


  // seach/filter sticks by topic
  const filterByTopic = () => {
    topicsSheetRef?.current?.expand()
  }


  // search item ethod
  const searchItem = (item , index ) => {
    const id = item.id
    const stick = { id, ...item, username: item.username }

    return (

      <Pressable
        style={{
          marginHorizontal: index !== 0 ? 10 : 0,
          marginLeft: index === 0 ? 15 : undefined
        }}
        onPress={() => userPagePushToView(item)}>
        <View style={{ marginTop: 5, flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          {item.profile ? ( // Check if profile uri exists
            <Image
              contentFit='cover'
              style={{
                width: 50,
                height: 50,
                backgroundColor: 'lightgray',
                borderRadius: 40,
              }}
              source={{ uri: item.profile }}
            />
          ) : <View style={{
            width: 50,
            height: 50,
            backgroundColor: 'lightgray',
            borderRadius: 40
          }}></View>}
          <Text style={{ fontSize: 10, color: colors.primary, marginLeft: 5 }}>
            @{item.username}
          </Text>
          <Text style={{ fontWeight: 'bold', fontSize: 11 }}>{item.fullname?.split(' ')[0]}</Text>
        </View>
      </Pressable>
    )
  }

  // search item ethod
  const usersItem = (item , index ) => {
    const id = item.id
    const stick = { id, ...item, username: item.username }

    return (
      <Pressable
        style={{
          marginHorizontal: index !== 0 ? 10 : 0,
          marginLeft: 20,
          width: '100%',
          marginVertical: 10
        }}
        onPress={() => userPagePushToView(stick)}>
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
              source={{ uri: item.profile }}
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
            <Text style={{ fontSize: 12 }}>
              {item.sticks} sticks
            </Text>
            <Text style={{ fontSize: 12 }}>
              {item.calabash} calabash
            </Text>
          </View>

        </View>
      </Pressable>
    )
  }


  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <View>
        {!route?.params?.title && <Pressable
          onPress={filterByTopic}
          style={{
            backgroundColor: 'lightgray',
            borderRadius: 40,
            padding: 8,
            marginHorizontal: 10,
            flexDirection: 'row',
            justifyContent: 'space-between'
          }}
        >
          <Feather
            style={{ alignSelf: 'center', marginLeft: 10 }}
            size={20}
            name={'search'}
            color={colors.primary}
          />

          <Text style={{ color: 'grey' }}>Tap to search for topic</Text>

          <Feather
            style={{ alignSelf: 'center', marginRight: 10 }}
            size={20}
            name='list'
            color={colors.primary}
          />

        </Pressable>}

        <View style={{
          marginVertical: route?.params?.title ? 0 : 10
        }} />

        {(!route?.params?.title && filteredUsers?.length > 0) && <FlashList
          horizontal={true}
          data={filteredUsers}
          onEndReached={() => usersSheetRef?.current?.expand()}
          renderItem={({ item, index } ) => { return item.id !== userdata.uid && searchItem(item, index) }}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={true}
          estimatedItemSize={100}
        />}
      </View>

      <View style={{
        marginVertical: route?.params?.title ? 0 : 10
      }} />


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
          marginTop: 100
        }} size={'small'} color={colors.primary} />
        <Text style={{
          textAlign: 'center',
          marginTop: 20
        }}>Loading...</Text>
      </View>}

      <FlashList
        data={filteredForestSticks}
        estimatedItemSize={100}
        refreshing={loading}
        onEndReached={() => getData(true, false)}
        onRefresh={() => getData(false, true)}
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

      <Portal>
        {/* Bottom sheet presenting on  top of the the elements */}
        <BottomSheet
          ref={topicsSheetRef}
          index={-1}
          snapPoints={snapPoints}
          enablePanDownToClose={true}
          backdropComponent={renderBackdrop}
          onChange={handleSheetChanges}
        >
          <BottomSheetView style={{
            flex: 1,
            width: '100%',
          }}>
            <View style={{ marginTop: 20 }} />
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginHorizontal: 20,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: colors.primary,
              borderRadius: 5,
              paddingVertical: 10,
              paddingHorizontal: 20
            }}>
              <TextInput multiline={true}
                placeholder='Search stick by topic' style={{
                  width: '80%',
                  alignSelf: 'center'
                }}
                onChangeText={(text) => filterTitle(text)}
              />
              <Pressable onPress={() => {
                dispatch(setFilterdForestStick(forestSticks))
                // closing the bottom sheet
                topicsSheetRef?.current?.close()
              }}>
                <Text style={{
                  color: colors.primary
                }}>Clear filter</Text>
              </Pressable>
            </View>

            <FlashList
              data={filtered}
              estimatedItemSize={35}
              renderItem={({ item, index }) => {
                return (
                  <>
                    <TouchableOpacity onPress={async () => {
                      filterStcks(item.name)
                      topicsSheetRef?.current?.close()
                    }} style={{
                      height: 25,
                      marginHorizontal: 20,
                      marginVertical: 5
                    }}>
                      <Text>{item.name}</Text>
                    </TouchableOpacity>


                    {index === filtered.length - 1 &&
                      <TouchableOpacity key={item.id} onPress={async () => topicsSheetRef?.current?.close()} style={{
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

            <View style={{
              marginBottom: 35
            }}>
            </View>
          </BottomSheetView>
        </BottomSheet>
      </Portal>


      <Portal>
        {/* Bottom sheet presenting on  top of the the elements */}
        <BottomSheet
          ref={usersSheetRef}
          index={-1}
          snapPoints={snapPoints}
          enablePanDownToClose={true}
          backdropComponent={renderBackdrop}
          onChange={handleSheetChanges}
        >
          <BottomSheetView style={{
            flex: 1,
            width: '100%',
          }}>
            <View
              style={{
                backgroundColor: 'lightgray',
                borderRadius: 40,
                padding: 0,
                marginHorizontal: 10,
                flexDirection: 'row',
              }}
            >
              <Feather
                style={{ alignSelf: 'center', marginLeft: 10 }}
                size={20}
                name={'search'}
                color={colors.primary}
              />

              <TextInput
                onChangeText={(text) => filterUser(text)}
                underlineColorAndroid='transparent'
                style={{ height: 40, flex: 1, width: '90%', marginLeft: 10, marginRight: 10 }}
                placeholder={'Search user'}
              />
            </View>

            <View style={{ marginTop: 20 }} />
            <FlashList
              data={filteredUsers}
              onEndReached={() => getUsers(true)}
              renderItem={({ item, index }) => usersItem(item, index)}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={true}
              estimatedItemSize={100}
            />

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


const styles = StyleSheet.create({
  user: {
    fontWeight: 'bold',
    marginLeft: 2,
    marginTop: -5,
    lineHeight: 15,
    marginRight: 10,
  },
  ago: {
    color: 'black',
    marginLeft: 10,
    marginTop: 8,
    marginBottom: 5,
    fontSize: 10,
  },
  username: {
    color: colors.primary,
    marginLeft: 10,
    marginBottom: 5,
    fontSize: 10,
  },
  content: {
    color: 'black',
    marginHorizontal: 10,
    marginRight: 40,
  },
  topDetails: {
    flexDirection: 'row',
    marginHorizontal: 10,
    marginVertical: 5,
  },
  container: {
    flex: 1,
    marginHorizontal: 10,
  },
  stickHeaderContainer: {
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  stickHeaderNames: {
    flexDirection: 'row',
  },
  name: {
    marginRight: 5,
    fontWeight: 'bold',
  },
  createdat: {
    color: 'grey',
    fontSize: 10,
  },
})