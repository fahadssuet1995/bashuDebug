import * as React from 'react'
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import colors from '../config/colors'
import {
  MaterialCommunityIcons,
  Entypo,
  AntDesign
} from '@expo/vector-icons'
import { useRef, useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import { auth, database } from '../config/firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { useDispatch } from 'react-redux'
import { setData } from '../redux/features/user'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { validateEmail } from '../hooks/ValidateEmail'



export default function SignInScreen() {
  const navigation = useNavigation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [shouldLoad, setShouldLoad] = useState(false)
  const dispatch = useDispatch()




  const onDoneSubmit = async () => {
    if (email == '' || password == '') {
      Alert.alert('Error', 'Please enter email and password')
    } else if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter valid email')
    } else {
      setShouldLoad(true)
      signInWithEmailAndPassword(auth, email, password)
        .then(async (user) => {
          if (user) {
            const result = (await getDoc(doc(database, `users/${user.user.uid}`))).data()

            if (result) {
              // set driver data
              const data = {
                username: result.username,
                uid: user.user.uid,
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
              await AsyncStorage.setItem('newuser', 'no')

              navigation.reset({
                index: 0,
                routes: [{
                  name: 'Authed',
                  state: {
                    routeNames: ['Main'],
                    routes: [{ name: 'Root' }]
                  }
                }]
              })
            }
          }
        }).catch((e) => {
          setShouldLoad(false)
        })

    }
  }

  // navigate to sign up
  const signup = () => {
    navigation.navigate('Unauth', { params: { screen: 'SignUpScreen' } })
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.container}>
        <Text style={styles.welcomeText}>Welcome back!</Text>
        <View style={styles.inputContainer}>
          <MaterialCommunityIcons
            style={styles.inputIcon}
            name={'email-edit-outline'}
            size={20}
          />
          <TextInput
            onChangeText={(text) => setEmail(text)}
            style={styles.inputs}
            placeholder='Email'
            keyboardType='email-address'
            underlineColorAndroid='transparent'
            placeholderTextColor={'black'}
          />
        </View>

        {shouldLoad ? (
          <ActivityIndicator
            style={{ position: 'absolute', zIndex: 1000 }}
            size={40}
            color='red'
          />
        ) : null}

        <View style={styles.inputContainer}>
          <MaterialCommunityIcons
            style={styles.inputIcon}
            name={'form-textbox-password'}
            size={20}
          />
          <TextInput
            onChangeText={(text) => setPassword(text)}
            style={styles.inputs}
            placeholder='Password'
            secureTextEntry={true}
            placeholderTextColor={'black'}
            underlineColorAndroid='transparent'
          />
        </View>

        <TouchableOpacity
          onPress={() => onDoneSubmit()}
          style={[styles.buttonContainer, styles.loginButton, { marginTop: 10 }]}
        >
          <Text style={styles.loginText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Unauth', { screen: 'ForgotPassword' })}
          style={{ marginVertical: 10 }}>
          <Text style={{ color: 'black' }}>Forgot your password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={signup}
          style={[styles.buttonContainer]}
        >
          <Text style={{ color: 'black', textAlign: 'center' }}>
            Don't have any account? Create new account now
          </Text>
        </TouchableOpacity>

        <View style={styles.orContainer}>
          <View style={{ width: 40, backgroundColor: 'black', height: 1 }} />
          <Text style={{ margin: 5 }}>OR</Text>
          <View style={{ width: 40, backgroundColor: 'black', height: 1 }} />
        </View>

        <View style={styles.socialContainer}>
          <TouchableOpacity>
            <Entypo name={'facebook-with-circle'} size={50} color={'#3b5998'} />
          </TouchableOpacity>
          <View style={{ width: 20 }} />
          <TouchableOpacity>
            <Entypo name={'google--with-circle'} size={50} color={'#DB4437'} />
          </TouchableOpacity>
          <View style={{ width: 20 }} />
          <TouchableOpacity
            style={{
              borderColor: 'black',
              borderWidth: 1,
              borderRadius: 50,
              width: 50,
              height: 50,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AntDesign name={'apple1'} size={30} color={'black'} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  }, noticeContainer: {
    borderBottomColor: '#F5FCFF',
    borderRadius: 30,
    borderBottomWidth: 1,
    width: 300,
    marginBottom: 20,
    padding: 10,
  },
  inputContainer: {
    borderBottomColor: '#F5FCFF',
    backgroundColor: '#EEEEEE',
    borderRadius: 30,
    borderBottomWidth: 1,
    width: 300,
    height: 45,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputs: {
    height: 45,
    marginLeft: 16,
    borderBottomColor: '#FFFFFF',
    flex: 1,
  },
  inputIcon: {
    width: 30,
    height: 30,
    marginLeft: 15,
    justifyContent: 'center',
    top: 3,
  },
  buttonContainer: {
    height: 45,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    width: 300,
    borderRadius: 30,
  },
  forgotButtonContainer: {
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 1,
    width: 250,
    color: 'black',
    backgroundColor: 'red',
  },
  loginButton: {
    backgroundColor: colors.primary,
  },
  loginText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    display: 'none',
  },
  orContainer: {
    flexDirection: 'row',
    padding: 10,
    display: 'none',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 30,
  },
  back: {
    top: 20,
    left: 10,
  },
})
