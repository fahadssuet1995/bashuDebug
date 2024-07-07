import { configureStore } from '@reduxjs/toolkit'
import { dataSlice } from './features/data'
import { notificationSlice } from './features/notifications'
import { userSlice } from './features/user'

const defaultMiddlewareConfig = {
  serializableCheck: false
}


export const store = configureStore({
  reducer: {
    userdata: userSlice.reducer,
    notification: notificationSlice.reducer,
    data: dataSlice.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    }),
})


// Infer the `RootState` and `AppDispatch` types from the store itself
export const RootState = store.getState()
export const AppDispatch = store.dispatch
