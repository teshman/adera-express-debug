// src/screens/DashboardScreen.tsx
// This is the main screen after successful login.

import { TouchableOpacity, View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native'; // Ensure StyleSheet is explicitly imported here


import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Import navigation types (from AppNavigator)
import { AppStackParamList } from '../navigation/AppNavigator';
// Import common Button component - assuming it's a named export
import { Button } from '../components/common/Button';
// Import logout function from authService - assuming it's a named export
import { logoutUser } from '../services/AuthService';

type DashboardScreenNavigationProp = NativeStackNavigationProp<AppStackParamList, 'Dashboard'>;

// DashboardScreen component - now a named export
export const DashboardScreen: React.FC = () => { // Changed to named export
  const navigation = useNavigation<DashboardScreenNavigationProp>();

  // Function to navigate to the Profile screen
  const goToProfile = () => {
    navigation.navigate('Profile');
  };

  // Function to navigate to the Quick Quotes screen
  const goToQuickQuotes = () => {
    navigation.navigate('QuickQuotes');
  };

  // Handle user logout
  const handleLogout = async () => {
    try {
      await logoutUser();
      // useAuth hook will handle navigation back to AuthScreen
    } catch (error) {
      console.error('Logout failed:', error);
      // You might want to show a user-friendly error here
    }
  };

  return (
    <View style={dashboardScreenStyles.container}>
      <Text style={dashboardScreenStyles.title}>Welcome to Your Dashboard!</Text>
      <Text style={dashboardScreenStyles.subtitle}>Your central hub for essential features.</Text>

      {/* Navigation Buttons */}
      <View style={dashboardScreenStyles.buttonContainer}>
        <Button title="My Profile" onPress={goToProfile} style={dashboardScreenStyles.navButton} />
        <Button title="Get Quick Quotes" onPress={goToQuickQuotes} style={dashboardScreenStyles.navButton} />
      </View>

      {/* Logout Button */}
      <Button title="Logout" onPress={handleLogout} style={dashboardScreenStyles.logoutButton} variant="secondary" />
    </View>
  );
};

const dashboardScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F2F5', // Light background color
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    gap: 15, // Space between buttons
  },
  navButton: {
    paddingVertical: 12, // Slightly larger touch target
  },
  logoutButton: {
    marginTop: 30, // Space above logout button
    backgroundColor: '#FF6347', // A distinct color for logout
  },
});
