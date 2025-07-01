// src/screens/ProfileScreen.tsx
// This screen displays user profile information.

import React, { useEffect, useState } from 'react';

import { TouchableOpacity, View, ActivityIndicator, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native'; // Ensure StyleSheet is explicitly imported here
// Import authentication service - assuming it's a named export
import { getCurrentUser } from '../services/AuthService';
import { User as FirebaseUser } from 'firebase/auth'; // Import User type from Firebase Auth

// ProfileScreen component - now a named export
export const ProfileScreen: React.FC = () => { // Changed to named export
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const currentUser = getCurrentUser(); // Get current user from auth service
        if (currentUser) {
          setUser(currentUser);
          setError(null);
        } else {
          setError('No user logged in.');
        }
      } catch (err: any) {
        setError('Failed to load profile: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  if (loading) {
    return (
      <View style={profileScreenStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200EE" />
        <Text style={profileScreenStyles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={profileScreenStyles.container}>
        <Text style={profileScreenStyles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={profileScreenStyles.container}>
      <View style={profileScreenStyles.card}>
        <Text style={profileScreenStyles.title}>Your Profile</Text>
        <View style={profileScreenStyles.infoRow}>
          <Text style={profileScreenStyles.label}>Email:</Text>
          <Text style={profileScreenStyles.value}>{user?.email || 'N/A'}</Text>
        </View>
        <View style={profileScreenStyles.infoRow}>
          <Text style={profileScreenStyles.label}>User ID:</Text>
          <Text style={profileScreenStyles.value}>{user?.uid || 'N/A'}</Text>
        </View>
        {/* You can add more profile fields here, potentially fetched from Firestore */}
        <Text style={profileScreenStyles.note}>
          (Additional profile details can be stored and fetched from Firestore.)
        </Text>
      </View>
    </View>
  );
};

const profileScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 25,
    color: '#333',
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
  },
  value: {
    fontSize: 16,
    color: '#333',
    flexShrink: 1, // Allows text to wrap
    marginLeft: 10,
    textAlign: 'right',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 16,
    textAlign: 'center',
  },
  note: {
    marginTop: 20,
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
