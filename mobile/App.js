import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ExamInstructionsScreen from './src/screens/ExamInstructionsScreen';
import ExamScreen from './src/screens/ExamScreen';
import ResultScreen from './src/screens/ResultScreen';
import ThankYouScreen from './src/screens/ThankYouScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { useAuthStore } from './src/store/authStore';

const Stack = createNativeStackNavigator();

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#d97706',
    secondary: '#f59e0b',
  },
};

export default function App() {
  const { setToken, setCandidate } = useAuthStore();

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const candidate = await AsyncStorage.getItem('candidate');
      
      if (token) {
        setToken(token);
      }
      if (candidate) {
        setCandidate(JSON.parse(candidate));
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    }
  };

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="ExamInstructions" component={ExamInstructionsScreen} />
          <Stack.Screen name="Exam" component={ExamScreen} />
          <Stack.Screen name="Result" component={ResultScreen} />
          <Stack.Screen name="ThankYou" component={ThankYouScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}

