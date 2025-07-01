// src/screens/AuthScreen.tsx
// This screen handles both login and registration based on the 'type' parameter.

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Import common components - assuming these are already named exports
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';

// Import authentication service - assuming these are already named exports
import { loginUser, registerUser } from '../services/AuthService';

// Import navigation types for this stack (from AppNavigator)
import { AuthStackParamList } from '../navigation/AppNavigator';

// Define the route prop type for AuthScreen
interface AuthScreenRouteParams {
  type: 'login' | 'register';
}
type AuthScreenRouteProp = RouteProp<{ Auth: AuthScreenRouteParams }, 'Auth'>;
type AuthScreenNavigationProp = NativeStackNavigationProp<{ Auth: AuthScreenRouteParams }, 'Auth'>;

// AuthScreen component - now a named export
export const AuthScreen: React.FC = () => { // Changed to named export
  const navigation = useNavigation<NativeStackNavigationProp<any>>(); // Use 'any' here for flexibility across navigators
  const route = useRoute<AuthScreenRouteProp>();

  const isLogin = route.params?.type === 'login';

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async () => {
    setError(null);
    setLoading(true);
    try {
      if (isLogin) {
        await loginUser(email, password);
      } else {
        await registerUser(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={authScreenStyles.container}>
      <View style={authScreenStyles.card}>
        <Text style={authScreenStyles.title}>{isLogin ? 'Login' : 'Register'}</Text>

        <Input
          placeholder="Email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={authScreenStyles.input}
        />
        <Input
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={authScreenStyles.input}
        />

        {error && <Text style={authScreenStyles.errorText}>{error}</Text>}

        <Button
          title={isLogin ? 'Login' : 'Register'}
          onPress={handleAuth}
          disabled={loading}
          style={authScreenStyles.button}
        />

        {loading && <ActivityIndicator size="small" color="#6200EE" style={authScreenStyles.loadingIndicator} />}

        <TouchableOpacity
          onPress={() =>
            navigation.navigate('Auth', {
              screen: isLogin ? 'Register' : 'Login',
              params: { type: isLogin ? 'register' : 'login' }
            })
          }
          style={authScreenStyles.switchButton}
        >
          <Text style={authScreenStyles.switchButtonText}>
            {isLogin ? 'New here? Register' : 'Already have an account? Login'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const authScreenStyles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
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
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 25,
    color: '#333',
  },
  input: {
    marginBottom: 15,
    width: '100%',
  },
  button: {
    marginTop: 20,
    width: '100%',
  },
  loadingIndicator: {
    marginTop: 15,
  },
  errorText: {
    color: '#D32F2F',
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 14,
  },
  switchButton: {
    marginTop: 20,
  },
  switchButtonText: {
    color: '#6200EE',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});
