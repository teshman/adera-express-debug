// src/screens/Auth/RegisterScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native'; // Import useNavigation and NavigationProp
import { AuthStackParamList } from '../../navigation/AuthNavigator'; // Assuming you'll define this type
import { authService } from '../../services/AuthService';
import { UserRole } from '../../models/types'; // Import UserRole

const RegisterScreen: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const defaultRoles: UserRole[] = ['requester'];
  const navigation = useNavigation<NavigationProp<AuthStackParamList>>(); // Get navigation object

  const handleRegister = async () => {
    setLoading(true);
    try {
      const result = await authService.registerUser(email, password, defaultRoles);
      if (result.success) {
        Alert.alert('Success', 'Registration initiated! Please check your email for verification.');
        // Navigate to pending email verification screen, if applicable
        // This navigation will be handled by the navigator or a separate flow
        navigation.navigate('Login'); // Navigate back to login after successful registration initiation
      } else {
        Alert.alert('Registration Failed', 'Could not register user. Please try again.');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      Alert.alert('Registration Failed', error.message || 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title={loading ? "Registering..." : "Register"} onPress={handleRegister} disabled={loading} />
      {loading && <ActivityIndicator size="small" color="#0000ff" style={styles.spinner} />}
      <View style={styles.linkContainer}>
        <Text style={styles.linkText}>Already have an account?</Text>
        {/* Use navigation.navigate to go to the Login screen */}
        <Button title="Login" onPress={() => navigation.navigate('Login')} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  input: {
    width: '100%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  spinner: {
    marginTop: 20,
  },
  linkContainer: {
    flexDirection: 'row',
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 16,
    color: '#555',
    marginRight: 10,
  },
});

export default RegisterScreen;
