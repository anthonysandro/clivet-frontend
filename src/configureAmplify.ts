'use client';

import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    Cognito: {
      // ✅ CORRECTO (Coincide con Terraform)
      userPoolId: 'us-east-1_KsX9MC20p', 
      
      // ✅ CORRECTO (Coincide con Terraform)
      userPoolClientId: '2rs33oqk4db49gm955b51jvh9c', 
      
      // ✅ ACTUALIZADO: Necesario para que los usuarios puedan subir imágenes a S3
      identityPoolId: 'us-east-1:550e5bb6-c554-47a1-a318-ad6e7aa1ddf9', 
      
      loginWith: {
        email: true,
      },
      signUpVerificationMethod: 'code',
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: true,
      },
    }
  },
  Storage: {
    S3: {
      bucket: 'clivet-product-images',
      region: 'us-east-1',
    }
  }
}, { ssr: true });

export default function ConfigureAmplifyClientSide() {
  return null;
}