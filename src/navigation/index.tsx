// src/navigation/index.tsx
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import { authService } from '../services/AuthService'; // Import your authService
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native'; // Ensure Text is imported
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth'; // Import FirebaseAuthTypes

const RootNavigator: React.FC = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);

  useEffect(() => {
    let unsubscribeFromAuthService: (() => void) | undefined;
    let unsubscribeFromFirebase: (() => void) | undefined;

    // Defensive check to ensure authService is available
    if (authService) {
      // Subscribe to auth service's state changes
      unsubscribeFromAuthService = authService.onAuthStateChange((firebaseUser) => {
        setUser(firebaseUser);
        if (initializing) {
          setInitializing(false);
        }
      });

      // Initial check using authService's current state
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setInitializing(false);
      } else {
        // Fallback to Firebase's own listener if our service hasn't yet provided an initial state,
        // or if authService itself is still in the process of initializing its Firebase listener.
        // This provides a robust initial state capture.
        unsubscribeFromFirebase = auth().onAuthStateChanged((firebaseUser) => {
            setUser(firebaseUser);
            if (initializing) {
                setInitializing(false);
            }
            // Unsubscribe from this fallback listener once we get an initial state
            if (unsubscribeFromFirebase) {
              unsubscribeFromFirebase();
            }
        });
      }
    } else {
      console.warn("AuthService not yet defined when RootNavigator initialized. This might indicate a module loading issue.");
      // If authService is truly undefined, we might remain in initializing state,
      // and rely on a later re-render or hot reload to pick it up.
      // For persistent issues, a full clean & rebuild is still the primary fix.
    }

    // Cleanup subscriptions on unmount
    return () => {
      if (unsubscribeFromAuthService) {
        unsubscribeFromAuthService();
      }
      if (unsubscribeFromFirebase) {
        unsubscribeFromFirebase();
      }
    };
  }, [initializing]); // Include initializing in dependency array if its change affects effect logic

  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading app...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 18,
    color: '#666',
  },
});

export default RootNavigator;
