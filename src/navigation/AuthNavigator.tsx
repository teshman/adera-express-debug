// src/navigation/AuthNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';

// Define the type for your authentication stack's routes and their parameters
// This is crucial for type-checking with useNavigation and route.params
export type AuthStackParamList = {
  Login: undefined; // Login screen takes no parameters
  Register: undefined; // Register screen takes no parameters
  // Add other auth-related screens here as you implement them
  // ForgotPassword: undefined;
  // EmailVerification: { email: string }; // Example: if email verification needs an email param
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>(); // Apply the type here

const AuthNavigator: React.FC = () => {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      {/* Add other auth-related screens here, e.g., ForgotPasswordScreen, EmailVerificationScreen */}
    </AuthStack.Navigator>
  );
};

export default AuthNavigator;
