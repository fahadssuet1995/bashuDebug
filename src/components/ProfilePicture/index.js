import React from 'react';
import { Image } from 'expo-image';



const ProfilePicture = ({ image, size = 50 } ) => (
  <Image
    contentFit='cover'
    source={image}
    style={{
      width: size,
      height: size,
      borderRadius: size,
      backgroundColor: 'lightgray',
    }}
  />
);

export default ProfilePicture;
