// src/navigation/AppNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/Main/HomeScreen';
import DashboardScreen from '../screens/Main/DashboardScreen';
// Import other main screens as you create them
// import ProfileScreen from '../screens/Main/ProfileScreen';
// import SettingsScreen from '../screens/Main/SettingsScreen';
// import ShipmentRequestScreen from '../screens/Shipments/ShipmentRequestScreen';

const AppStack = createNativeStackNavigator();

const AppNavigator: React.FC = () => {
  return (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
      <AppStack.Screen name="Home" component={HomeScreen} />
      <AppStack.Screen name="Dashboard" component={DashboardScreen} />
      {/* Add other main app screens here */}
      {/* <AppStack.Screen name="Profile" component={ProfileScreen} /> */}
      {/* <AppStack.Screen name="Settings" component={SettingsScreen} /> */}
      {/* <AppStack.Screen name="ShipmentRequest" component={ShipmentRequestScreen} /> */}
    </AppStack.Navigator>
  );
};

export default AppNavigator;
