import { deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore'
import { collection } from 'firebase/firestore'
import { query, where } from 'firebase/firestore'
import { database } from '../config/firebase'



export const likeStickUser = (stick , user ) => {
    // checking if the user has already rate the driver/user
    return getDocs(query(collection(database, `sticks/${stick}/likes`), where('uid', '==', user)))
        .then(res => {
            if (!res.empty) return res
            return false
        })
}


export const deleteStickLike = (stick , user) => {
    // checking if the user has already rate the driver/user
    return getDocs(query(collection(database, `sticks/${stick.id}/likes`), where('uid', '==', user)))
        .then(res => {
            console.log(res)
            if (!res.empty) {
                deleteDoc(doc(database, `sticks/${stick}/likes/${res.docs[0].id}`))
                    .then(async () => {
                        // update likes count
                        await updateDoc(doc(database, `sticks/${stick.id}`), { likes: stick.likes - 1 })
                    })
            }
            return false
        })
}


export const deleteReplyLike = (stickId , user , reply ) => {
    // checking if the user has already rate the driver/user
    return getDocs(query(collection(database, `sticks/${stickId}/comments/${reply.id}/likes`), where('uid', '==', user)))
        .then(res => {
            if (!res.empty) {
                // delete stick reply like
                deleteDoc(doc(database, `sticks/${stickId}/comments/${reply.id}/likes/${res.docs[0].id}`))
                    .then(async () => {
                        // update likes count
                        await updateDoc(doc(database, `sticks/${stickId}/comments/${reply.id}`), { likes: reply.likes - 1 })
                    })
            }
            return false
        })
}



export const likeUserCalabash = (calabash , user ) => {
    // checking if the user has already rate the driver/user
    return getDocs(query(collection(database, `calabash/${calabash}/likes`), where('uid', '==', user)))
        .then(res => {
            if (!res.empty) return res
            return false
        })
}



// async function addCalabash() {
//     const data = await getDocs(collection(database, 'calabash'))
//     data.docs.forEach(async (doc, index) => {
//       if (index > 0) {
//         console.log('index => ', index)
//         await addDoc(collection(database, 'sticks'), { ...doc.data(), type: 'calabash' })
//           .then(async res => {
//             console.log('added doc to stick =>', index)
//             if (doc.data().comments > 0) {
//               const commments = await getDocs(collection(database, `calabash/${doc.id}/comments`))
//               commments.docs.forEach(async doc => await addDoc(collection(database, `sticks/${res.id}/comments`), doc.data()).then(() => console.log('added comments => ', index)))
//             } else if (doc.data().likes > 0) {
//               const likes = await getDocs(collection(database, `calabash/${doc.id}/likes`))
//               likes.docs.forEach(async doc => await addDoc(collection(database, `sticks/${res.id}/comments`), doc.data()).then(() => console.log('added like => ', index)))
//             }
//           })
//       }
//     })
//   }

// addCalabash()