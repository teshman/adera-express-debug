// src/firebaseConfig.ts
// This file initializes your Firebase application.
// IMPORTANT: Replace the placeholder values with your actual Firebase project configuration.
// You can find this in your Firebase project settings -> Project settings -> General -> Your apps.

import { initializeApp, FirebaseApp } from 'firebase/app';
// FIX: Changed imports to implement CoPlot's workaround for getReactNativePersistence.
// We import all from 'firebase/auth' and then access getReactNativePersistence via a cast.
import * as firebaseAuth from 'firebase/auth'; // Import everything as firebaseAuth
import { getFirestore, Firestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';


// Global variables provided by the Canvas environment (MUST BE USED)
// Explicitly cast global variables to 'any' to resolve "Cannot find name" TypeScript errors.
const appId = typeof (window as any).__app_id !== 'undefined' ? (window as any).__app_id : 'default-app-id-for-dev';
const firebaseConfig = typeof (window as any).__firebase_config !== 'undefined'
  ? JSON.parse((window as any).__firebase_config)
  : {
      // Replace these with your actual Firebase project configuration:
      
  apiKey: "AIzaSyDs6nqJUdgWRDo93a3aGgQVR0dEsFBPlRE",
  authDomain: "adera-melakia.firebaseapp.com",
  projectId: "adera-melakia",
  storageBucket: "adera-melakia.firebasestorage.app",
  messagingSenderId: "204956773748",
  appId: "1:204956773748:web:dc988b129a4abcf21ed021",
  measurementId: "G-B8B5PV54RG"
    };

let appInstance: FirebaseApp | null = null;
let authInstance: firebaseAuth.Auth | null = null; // Use firebaseAuth.Auth type
let dbInstance: Firestore | null = null;

try {
  // Initialize Firebase App
  appInstance = initializeApp(firebaseConfig);
  console.log('Firebase app initialized successfully.');

  // Only proceed if appInstance is valid
  if (appInstance) {
    // FIX: Implement CoPlot's workaround for getReactNativePersistence
    // Cast firebaseAuth to 'any' to access getReactNativePersistence property
    const reactNativePersistence = (firebaseAuth as any).getReactNativePersistence;

    authInstance = firebaseAuth.initializeAuth(appInstance, {
      persistence: reactNativePersistence(ReactNativeAsyncStorage)
    });
    dbInstance = getFirestore(appInstance);
    console.log('Firebase Auth and Firestore instances obtained successfully with AsyncStorage persistence.');
    console.log('Diagnostic: authInstance value after initializeAuth:', authInstance);

    // Authenticate with custom token if available, otherwise sign in anonymously
    if (authInstance) {
        const currentAuth = authInstance; // Create a non-nullable constant reference

        if (typeof (window as any).__initial_auth_token !== 'undefined') {
            firebaseAuth.signInWithCustomToken(currentAuth, (window as any).__initial_auth_token)
                .then(() => console.log('Firebase authenticated with custom token'))
                .catch(error => {
                    console.error('Custom token authentication failed:', error);
                    firebaseAuth.signInAnonymously(currentAuth)
                        .then(() => console.log('Firebase signed in anonymously as fallback'))
                        .catch(anonError => console.error('Anonymous authentication failed (fallback):', anonError));
                });
        } else {
            firebaseAuth.signInAnonymously(currentAuth)
                .then(() => console.log('Firebase signed in anonymously'))
                .catch(error => console.error('Anonymous authentication failed:', error));
        }

        // Log authentication state changes (for debugging purposes)
        firebaseAuth.onAuthStateChanged(currentAuth, (user: firebaseAuth.User | null) => { // Use firebaseAuth.User
            if (user) {
                console.log('Auth state changed: User is logged in', user.uid);
            } else {
                console.log('Auth state changed: User is logged out');
            }
        });
    } else {
        console.error('CRITICAL ERROR: authInstance is null after initializeAuth(appInstance). Authentication and listeners cannot be set up. Check Firebase config and AsyncStorage setup.');
    }
  } else {
      console.error('CRITICAL ERROR: Firebase app initialization failed. Cannot get Auth or Firestore instances. Check Firebase config.');
  }

} catch (error: any) {
  console.error('Caught an unexpected error during Firebase setup:', error.message);
  // This could catch errors from initializeApp or initializeAuth themselves
}

// Export the initialized instances. They are typed as 'Auth | null' and 'Firestore | null'.
export const auth: firebaseAuth.Auth | null = authInstance;
export const db: Firestore | null = dbInstance;
