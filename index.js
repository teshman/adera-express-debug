// index.js
import 'react-native-gesture-handler'; // This *must* be the very first import for React Navigation
import { AppRegistry } from 'react-native';
import App from './App'; // Your main App component (which will render RootNavigator)
import { name as appName } from './app.json';
import { enableScreens } from 'react-native-screens'; // For react-native-screens optimization

enableScreens(); // Call enableScreens as early as possible

AppRegistry.registerComponent(appName, () => App);