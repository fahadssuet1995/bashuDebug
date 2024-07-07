import { createSlice } from '@reduxjs/toolkit'

// Define a type for the slice state
const initialState = {
    calabash: [],
    sticks: [],
    rivers: [],
    villages: [],
    loading: false,
    forestStick: [],
    filteredForestStick: [],
    userStick: [],
    watching: [],
    forestCalabash: [],
    userCalabash: [],
    users: [],
    likes: [],
    laststickdoc: null,
    filteredUsers: [],
}

export const dataSlice = createSlice({
    name: 'data',
    initialState,
    reducers: {
        setUsers: (state, action) => {
            state.users = action.payload
        },
        setFilteredUsers: (state, action) => {
            state.filteredUsers = action.payload
        },
        addFilteredUsers: (state, action) => {
            state.filteredUsers.unshift(action.payload)
        },
        addLikes: (state, action) => {
            state.likes.push(action.payload)
        },
        setLikes: (state, action) => {
            state.likes = action.payload
        },
        setDataSticks: (state, action) => {
            state.sticks = action.payload
        },
        addStick: (state, action) => {
            state.sticks.unshift(action.payload)
        },
        setWatching: (state, action) => {
            state.watching = action.payload
        },
        setForestStick: (state, action) => {
            state.forestStick = action.payload
        },
        setForestCalabsh: (state, action) => {
            state.forestCalabash = action.payload
        },
        setUserStick: (state, action) => {
            state.userStick = action.payload
        },
        setUserCalabsh: (state, action) => {
            state.userCalabash = action.payload
        },
        setDataCalabash: (state, action) => {
            state.calabash = action.payload
        },
        setLastStickDoc: (state, action) => {
            state.laststickdoc = action.payload
        },
        setLoading: (state, action) => {
            state.loading = action.payload
        },
        addCalabsh: (state, action) => {
            state.calabash.unshift(action.payload)
        },
        addForestStick: (state, action) => {
            state.forestStick.unshift(action.payload)
        },
        addFileteredForestStick: (state, action) => {
            state.filteredForestStick.unshift(action.payload)
        },
        setFilterdForestStick: (sate, action) => {
            sate.filteredForestStick = action.payload
        },
        deleteForestStick: (state, action) => {
            state.filteredForestStick = state.filteredForestStick.filter(stick => stick.id !== action.payload)
        },
        deleteUserStick: (state, action) => {
            state.userStick = state.userStick.filter(stick => stick.id !== action.payload)
        },
        deleteUserCalabash: (state, action) => {
            state.userCalabash = state.userCalabash.filter(stick => stick.id !== action.payload)
        },
        addForestLike: (state, action) => {
            state.forestStick[action.payload.index].likes++
        },
        removeForestLike: (state, action) => {
            state.forestStick[action.payload.index].likes = action.payload.value
        },
        addForestComment: (state, action) => {
            state.forestStick[action.payload.index].comments++
        },
        removeForesComment: (state, action) => {
            state.forestStick[action.payload.index].comments = action.payload.value
        },
        addUserStickLike: (state, action) => {
            state.userStick[action.payload.index].likes++
        },
        updateForestSticks: (state, action) => {
            state.forestStick[action.payload.index].likes = action.payload.likes
            state.forestStick[action.payload.index].liked = action.payload.liked
        },
        updateFilteredForestSticks: (state, action) => {
            state.filteredForestStick[action.payload.index].likes = action.payload.likes
            state.filteredForestStick[action.payload.index].liked = action.payload.liked
        },
        updateUserStick: (state, action) => {
            state.userStick[action.payload.index].likes = action.payload.likes
            state.userStick[action.payload.index].liked = action.payload.liked
        },
        updateUserCalabash: (state, action) => {
            state.userCalabash[action.payload.index].likes = action.payload.likes
            state.userCalabash[action.payload.index].liked = action.payload.liked
        },
        removeUserStickLike: (state, action) => {
            state.userStick[action.payload.index].likes = action.payload.value
        },
        addUserCalabashLike: (state, action) => {
            state.userCalabash[action.payload.index].likes++
        },
        removeUserCalabashLike: (state, action) => {
            state.userCalabash[action.payload.index].likes = action.payload.value
        },
    },
})

export const {
    addStick,
    setDataSticks,
    setDataCalabash,
    addCalabsh,
    setLoading,
    setWatching,
    setForestStick,
    setUserCalabsh,
    setUserStick,
    addForestLike,
    removeForestLike,
    addUserCalabashLike,
    addUserStickLike,
    deleteUserCalabash,
    deleteUserStick,
    removeUserCalabashLike,
    removeUserStickLike,
    addForestStick,
    addForestComment,
    removeForesComment,
    setUsers,
    setLikes,
    addLikes,
    updateForestSticks,
    setFilterdForestStick,
    updateFilteredForestSticks,
    addFileteredForestStick,
    setLastStickDoc,
    setFilteredUsers,
    addFilteredUsers,
    updateUserStick,
    updateUserCalabash,
    deleteForestStick
} = dataSlice.actions


// Other code such as selectors can use the imported `RootState` type
export const selectSticks = (state ) => state.data.sticks
export const selectCalabash = (state ) => state.data.calabash
export const selectRivers = (state ) => state.data.rivers
export const selectVillages = (state ) => state.data.villages
export const selectWatching = (state ) => state.data.watching
export const selectForestStick = (state ) => state.data.forestStick
export const selectUserStick = (state ) => state.data.userStick
export const selectForerstCalabash = (state ) => state.data.forestCalabash
export const selectUserCalabash = (state ) => state.data.userCalabash
export const selectLoading = (state ) => state.data.loading
export const selectUsers = (state ) => state.data.users
export const selectLikes = (state ) => state.data.likes
export const selectLastStickdoc = (state ) => state.data.laststickdoc
export const selectFilteredUsers = (state ) => state.data.filteredUsers
export const selectFilteredForestStick = (state ) => state.data.filteredForestStick

export default dataSlice.reducer