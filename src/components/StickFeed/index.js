import React, { useState } from 'react'
import { View, ActivityIndicator, Text } from 'react-native'
// import Stick from '../Tree/Sticks'
import { useDispatch, useSelector } from 'react-redux'
import { addStick, selectSticks } from '../../redux/features/data'
import { collection, onSnapshot, query, where, Unsubscribe } from 'firebase/firestore'
import { database } from '../../config/firebase'
import { useFocusEffect } from '@react-navigation/native'
import { FlashList } from '@shopify/flash-list'
import Villages from '../Forest'



const StickFeed = ({ user, profile, route } ) => {
  const sticks = useSelector(selectSticks)
  const [other, setOther] = useState([])
  const [isOpened, setOpened] = useState(false)
  let unsub
  const [loading, setLoading] = useState(false)
  const dispatch = useDispatch()


  const getUserData = () => {
    unsub = onSnapshot((query(collection(database, `sticks`), where('user', '==', user))), res => {
      const sticks= res.docs.map(doc => {
        const id = doc.id
        const data = doc.data()
        return { id, ...data }
      })

      other.sort(function compare(a , b ) {
        let dateA  = new Date(a.date)
        let dateB  = new Date(b.date)
        return dateB - dateA
      })

      sticks.sort(function compare(a , b ) {
        let dateA  = new Date(a.date)
        let dateB  = new Date(b.date)
        return dateB - dateA
      })

      setOther(sticks)
      if (sticks.length > 0) dispatch(addStick(sticks))
      setLoading(false)
    })
  }

  // listend to react navigation native hooks
  useFocusEffect(
    React.useCallback(() => {
      if (route === 'User Page') getUserData()

      if (sticks.length === 0) {
        setTimeout(() => {
          setOpened(true)
        }, 1500)
      }

      return () => {
        // removing listeners
        if (unsub) unsub()
      }
    }, [])
  )


  return (
    <View style={{ marginBottom: 50 }}>
      {loading ? <ActivityIndicator size='small' color='red' style={{ paddingTop: 20 }} />
        :
        <FlashList
          estimatedItemSize={100}
          data={route === 'User Page' ? other : sticks}
          renderItem={({ item, index }) => <Villages stick={item} user={item} index={index} />}
        />
      }

      {sticks.length === 0 && <Text style={{ textAlign: 'center', marginVertical: 20 }}>You have no sticks yet, start by creating one now.</Text>}
      {/* {isOpened && <NoData message='You have no sticks yet, start by creating one now.' setOpened={() => setOpened(!isOpened)} isOpned={isOpened} />} */}
    </View>
  )
}

export default StickFeed